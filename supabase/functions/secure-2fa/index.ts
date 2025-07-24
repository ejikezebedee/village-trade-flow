import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecureTwoFARequest {
  action: 'encrypt_secret' | 'decrypt_secret' | 'generate_backup_codes';
  secret?: string;
  encryptedSecret?: string;
  userId?: string;
  backupCodes?: string[];
}

// AES-256-GCM encryption for 2FA secrets
async function encrypt2FASecret(secret: string, masterKey: string): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from master key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  
  // Convert to base64
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  
  return {
    encryptedData: encryptedBase64,
    salt: saltBase64,
    iv: ivBase64
  };
}

async function decrypt2FASecret(encryptedData: string, salt: string, iv: string, masterKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Convert from base64
  const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const saltArray = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
  const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
  
  // Derive key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivArray,
    },
    key,
    encryptedArray
  );
  
  return decoder.decode(decryptedBuffer);
}

function generateSecureBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.getRandomValues(new Uint8Array(4));
    const codeString = Array.from(code)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(codeString);
  }
  return codes;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, secret, encryptedSecret, userId, backupCodes }: SecureTwoFARequest = await req.json();

    // Get master encryption key from environment
    const masterKey = Deno.env.get("MASTER_ENCRYPTION_KEY");
    if (!masterKey) {
      return new Response(
        JSON.stringify({ error: 'Master encryption key not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case 'encrypt_secret': {
        if (!secret || !userId) {
          return new Response(
            JSON.stringify({ error: 'Secret and userId are required' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const encrypted = await encrypt2FASecret(secret, masterKey);
        
        // Store encrypted secret in database
        const { error } = await supabase
          .from('profiles')
          .update({
            two_factor_secret_encrypted: JSON.stringify(encrypted),
            encryption_key_id: 'master_key_v1'
          })
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        // Log the encryption operation
        await supabase.from('encryption_audit_logs').insert({
          operation_type: 'encrypt',
          table_name: 'profiles',
          record_id: userId,
          key_id: 'master_key_v1',
          performed_by: userId,
          success: true,
          operation_metadata: { field: 'two_factor_secret' }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: '2FA secret encrypted and stored securely'
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'decrypt_secret': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'UserId is required' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get encrypted secret from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('two_factor_secret_encrypted')
          .eq('user_id', userId)
          .single();

        if (error || !profile?.two_factor_secret_encrypted) {
          return new Response(
            JSON.stringify({ error: 'No encrypted 2FA secret found' }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const encryptedData = JSON.parse(profile.two_factor_secret_encrypted);
        const decryptedSecret = await decrypt2FASecret(
          encryptedData.encryptedData,
          encryptedData.salt,
          encryptedData.iv,
          masterKey
        );

        // Log the decryption operation
        await supabase.from('encryption_audit_logs').insert({
          operation_type: 'decrypt',
          table_name: 'profiles',
          record_id: userId,
          key_id: 'master_key_v1',
          performed_by: userId,
          success: true,
          operation_metadata: { field: 'two_factor_secret' }
        });

        return new Response(
          JSON.stringify({
            success: true,
            secret: decryptedSecret
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'generate_backup_codes': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'UserId is required' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const newBackupCodes = generateSecureBackupCodes();
        const encrypted = await encrypt2FASecret(JSON.stringify(newBackupCodes), masterKey);

        // Store encrypted backup codes
        const { error } = await supabase
          .from('profiles')
          .update({
            two_factor_backup_codes_encrypted: JSON.stringify(encrypted)
          })
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            backupCodes: newBackupCodes,
            message: 'New backup codes generated and encrypted'
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error: any) {
    console.error("Error in secure-2fa function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);