import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticator } from "https://esm.sh/otpauth@9.3.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwoFASetupRequest {
  action: 'generate_secret' | 'verify_setup' | 'disable';
  totp_code?: string;
}

// AES-GCM encryption functions
async function encryptTOTPSecret(secret: string, key: CryptoKey): Promise<{
  encrypted: string;
  iv: string;
  tag: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  
  // Split encrypted data and auth tag (last 16 bytes)
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const tag = encryptedArray.slice(-16);
  
  return {
    encrypted: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag))
  };
}

async function decryptTOTPSecret(
  encryptedData: string,
  iv: string,
  tag: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  const ivArray = new Uint8Array(
    atob(iv).split('').map(char => char.charCodeAt(0))
  );
  const tagArray = new Uint8Array(
    atob(tag).split('').map(char => char.charCodeAt(0))
  );
  
  // Combine ciphertext and tag for decryption
  const combined = new Uint8Array(ciphertext.length + tagArray.length);
  combined.set(ciphertext);
  combined.set(tagArray, ciphertext.length);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivArray },
    key,
    combined
  );
  
  return new TextDecoder().decode(decrypted);
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  // Use JWT signing key as encryption key (in production, use dedicated key)
  const keyMaterial = Deno.env.get('SUPABASE_JWT_SECRET') || 'fallback-key-for-development';
  
  const keyData = new TextEncoder().encode(keyMaterial.padEnd(32, '0').slice(0, 32));
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, totp_code }: TwoFASetupRequest = await req.json();
    const encryptionKey = await getOrCreateEncryptionKey();

    if (action === 'generate_secret') {
      // Generate TOTP secret
      const secret = authenticator.generateSecret();
      
      // Encrypt the secret
      const { encrypted, iv, tag } = await encryptTOTPSecret(secret, encryptionKey);
      
      // Store encrypted secret in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          two_factor_secret_encrypted: encrypted,
          two_factor_secret_iv: iv,
          two_factor_secret_tag: tag,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to store encrypted secret:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to store secret' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate QR code URI for authenticator apps
      const issuer = 'VillageMarket';
      const accountName = user.email || user.id;
      const qrUri = authenticator.keyuri(accountName, issuer, secret);

      return new Response(
        JSON.stringify({ 
          secret,
          qr_uri: qrUri,
          message: 'Secret generated successfully. Please verify with your authenticator app.'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'verify_setup') {
      if (!totp_code) {
        return new Response(
          JSON.stringify({ error: 'TOTP code required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get encrypted secret from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_secret_encrypted, two_factor_secret_iv, two_factor_secret_tag')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.two_factor_secret_encrypted) {
        return new Response(
          JSON.stringify({ error: 'No 2FA secret found. Generate secret first.' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Decrypt and verify TOTP
      const secret = await decryptTOTPSecret(
        profile.two_factor_secret_encrypted,
        profile.two_factor_secret_iv,
        profile.two_factor_secret_tag,
        encryptionKey
      );

      const isValid = authenticator.verify({
        token: totp_code,
        secret: secret,
        window: 1 // Allow 1 step before/after current time
      });

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid TOTP code' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Enable 2FA and generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        const code = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).padStart(8, '0');
        backupCodes.push(code);
        
        // Hash and store backup code
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
        
        await supabase
          .from('two_factor_backup_codes')
          .insert({
            user_id: user.id,
            code_hash: hash
          });
      }

      // Enable 2FA
      const { error: enableError } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_last_verified_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (enableError) {
        console.error('Failed to enable 2FA:', enableError);
        return new Response(
          JSON.stringify({ error: 'Failed to enable 2FA' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: '2FA enabled successfully',
          backup_codes: backupCodes
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'disable') {
      // Disable 2FA
      const { error: disableError } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret_encrypted: null,
          two_factor_secret_iv: null,
          two_factor_secret_tag: null,
          two_factor_last_verified_at: null
        })
        .eq('user_id', user.id);

      if (disableError) {
        return new Response(
          JSON.stringify({ error: 'Failed to disable 2FA' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Remove backup codes
      await supabase
        .from('two_factor_backup_codes')
        .delete()
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: '2FA disabled successfully'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('2FA Setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});