import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticator } from "https://esm.sh/otpauth@9.3.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwoFAVerifyRequest {
  method: 'totp' | 'backup_code';
  code: string;
  admin_action?: string; // For admin operations requiring 2FA
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

async function getEncryptionKey(): Promise<CryptoKey> {
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

    const { method, code, admin_action }: TwoFAVerifyRequest = await req.json();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile.two_factor_enabled) {
      return new Response(
        JSON.stringify({ error: '2FA not enabled for this account' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let verificationSuccess = false;

    if (method === 'totp') {
      // Verify TOTP code
      if (!profile.two_factor_secret_encrypted || !profile.two_factor_secret_iv || !profile.two_factor_secret_tag) {
        return new Response(
          JSON.stringify({ error: '2FA secret not found' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const encryptionKey = await getEncryptionKey();
      const secret = await decryptTOTPSecret(
        profile.two_factor_secret_encrypted,
        profile.two_factor_secret_iv,
        profile.two_factor_secret_tag,
        encryptionKey
      );

      verificationSuccess = authenticator.verify({
        token: code,
        secret: secret,
        window: 1
      });

    } else if (method === 'backup_code') {
      // Verify backup code
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const codeHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

      const { data: backupCode, error: backupError } = await supabase
        .from('two_factor_backup_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_hash', codeHash)
        .is('used_at', null)
        .single();

      if (!backupError && backupCode) {
        verificationSuccess = true;
        
        // Mark backup code as used
        await supabase
          .from('two_factor_backup_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', backupCode.id);
      }
    }

    if (!verificationSuccess) {
      return new Response(
        JSON.stringify({ error: 'Invalid 2FA code' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update last verified timestamp
    await supabase
      .from('profiles')
      .update({ two_factor_last_verified_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Log successful 2FA verification
    await supabase.rpc('log_security_event', {
      event_type: '2fa_verification_success',
      event_data: {
        user_id: user.id,
        method,
        admin_action: admin_action || null,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: '2FA verification successful',
        verified_at: new Date().toISOString(),
        admin_action_allowed: !!admin_action
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('2FA Verify error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});