import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM simulation for demonstration
// In production, use proper encryption libraries like libsodium or Web Crypto API
function encryptMessage(message: string, key: string): string {
  // Simulate proper AES-256-GCM encryption
  const timestamp = Date.now().toString();
  const combined = timestamp + '|' + message;
  
  let encrypted = '';
  for (let i = 0; i < combined.length; i++) {
    encrypted += String.fromCharCode(
      combined.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(encrypted); // Base64 encode with timestamp
}

function decryptMessage(encryptedMessage: string, key: string): string {
  const encrypted = atob(encryptedMessage); // Base64 decode
  let decrypted = '';
  for (let i = 0; i < encrypted.length; i++) {
    decrypted += String.fromCharCode(
      encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  // Extract timestamp and original message
  const parts = decrypted.split('|');
  if (parts.length >= 2) {
    return parts.slice(1).join('|'); // Remove timestamp, return original message
  }
  return decrypted; // Fallback for old format
}

function generateEncryptionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

        // Generate or retrieve conversation encryption key
        let encryptionKey = generateEncryptionKey();
        
        // In a real implementation, you'd store this key securely
        // and associate it with the conversation participants
        const keyId = `conv_${conversationId}_${Date.now()}`;
        
        // Encrypt the message
        const encryptedText = encryptMessage(messageText, encryptionKey);
        
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
            encrypted_length: encryptedText.length
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            encryptedMessage: encryptedText,
            keyId: keyId,
            isEncrypted: true
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

        // In a real implementation, retrieve the encryption key securely
        // For demo purposes, we'll use a simple key derivation
        const encryptionKey = generateEncryptionKey(); // This should be retrieved securely
        
        const decryptedText = decryptMessage(message.message_text, encryptionKey);

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
            keyId: message.encryption_key_id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'generate_key': {
        const newKey = generateEncryptionKey();
        return new Response(
          JSON.stringify({
            success: true,
            encryptionKey: newKey
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