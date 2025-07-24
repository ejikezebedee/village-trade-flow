import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secure AES-256-GCM encryption using Web Crypto API
async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
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
}

async function encryptMessage(message: string, password: string): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const key = await deriveKeyFromPassword(password, salt);
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  
  // Convert to base64 for storage
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

async function decryptMessage(encryptedData: string, salt: string, iv: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  
  // Convert from base64
  const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const saltArray = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
  const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
  
  // Derive key from password
  const key = await deriveKeyFromPassword(password, saltArray);
  
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

function generateSecureKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, messageId, conversationId, messageText, participants } = await req.json();

    console.log('Message encryption request:', { action, messageId, conversationId });

    switch (action) {
      case 'encrypt': {
        if (!messageText || !conversationId) {
          throw new Error('Missing required fields for encryption');
        }

        // Generate secure encryption key
        const encryptionKey = generateSecureKey();
        const keyId = `conv_${conversationId}_${Date.now()}`;
        
        // Encrypt the message using AES-256-GCM
        const encrypted = await encryptMessage(messageText, encryptionKey);
        
        // Log the encryption event
        await supabase.rpc('log_security_event', {
          p_event_type: 'message_encrypted',
          p_severity: 'info',
          p_target_resource: 'messages',
          p_target_id: conversationId,
          p_action_performed: 'Message encrypted for secure communication',
          p_metadata: { 
            key_id: keyId,
            participants: participants,
            original_length: messageText.length,
            encrypted_length: JSON.stringify(encrypted).length
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            encryptedMessage: JSON.stringify(encrypted),
            keyId: keyId,
            isEncrypted: true,
            algorithm: 'AES-256-GCM'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'decrypt': {
        if (!messageId) {
          throw new Error('Message ID required for decryption');
        }

        // Get the message from database
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', messageId)
          .single();

        if (messageError || !message) {
          throw new Error('Message not found');
        }

        if (!message.is_encrypted) {
          return new Response(
            JSON.stringify({
              success: true,
              decryptedMessage: message.message_text,
              isEncrypted: false
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }

        try {
          // Parse encrypted message format
          const encryptedData = JSON.parse(message.message_text);
          // For this demo, we'll use a default key - in production, retrieve from secure storage
          const encryptionKey = generateSecureKey();
          
          const decryptedText = await decryptMessage(
            encryptedData.encryptedData,
            encryptedData.salt,
            encryptedData.iv,
            encryptionKey
          );

        // Log the decryption event
        await supabase.rpc('log_security_event', {
          p_event_type: 'message_decrypted',
          p_severity: 'info',
          p_target_resource: 'messages',
          p_target_id: messageId,
          p_action_performed: 'Message decrypted for admin access',
          p_metadata: { 
            key_id: message.encryption_key_id,
            admin_access: true
          }
        });

          return new Response(
            JSON.stringify({
              success: true,
              decryptedMessage: decryptedText,
              isEncrypted: true,
              keyId: message.encryption_key_id,
              algorithm: 'AES-256-GCM'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } catch (decryptError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Decryption failed: ' + decryptError.message
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
      }

      case 'generate_key': {
        const newKey = generateSecureKey();
        const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store key metadata in database
        await supabase.from('encryption_keys').insert({
          key_id: keyId,
          encrypted_key_data: 'EXTERNAL_KEY_REFERENCE',
          key_purpose: 'message_encryption',
          algorithm: 'AES-256-GCM'
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            encryptionKey: newKey,
            keyId: keyId,
            algorithm: 'AES-256-GCM',
            warning: 'Store this key securely. It cannot be recovered if lost.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Encryption error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});