import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, key_name, key_value, description } = await req.json();
    
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'list':
        // List all API keys (without values)
        const { data: keys, error: listError } = await supabase
          .from('api_keys')
          .select('id, key_name, description, is_active, created_at, updated_at, last_used_at, usage_count')
          .order('key_name');

        if (listError) throw listError;

        return new Response(
          JSON.stringify({ success: true, data: keys }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        // Get specific API key value (decrypted)
        if (!key_name) {
          return new Response(
            JSON.stringify({ error: 'key_name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: keyValue, error: getError } = await supabase
          .rpc('get_api_key', { p_key_name: key_name });

        if (getError) throw getError;

        return new Response(
          JSON.stringify({ success: true, data: { key_name, key_value: keyValue } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'upsert':
        // Create or update API key
        if (!key_name || !key_value) {
          return new Response(
            JSON.stringify({ error: 'key_name and key_value are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: apiKeyId, error: upsertError } = await supabase
          .rpc('upsert_api_key', {
            p_key_name: key_name,
            p_key_value: key_value,
            p_description: description
          });

        if (upsertError) throw upsertError;

        // Log audit trail with IP and user agent
        await supabase
          .from('api_key_audit')
          .update({
            ip_address: clientIP,
            user_agent: userAgent
          })
          .eq('api_key_id', apiKeyId)
          .order('created_at', { ascending: false })
          .limit(1);

        return new Response(
          JSON.stringify({ success: true, data: { id: apiKeyId } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete':
        // Deactivate API key
        if (!key_name) {
          return new Response(
            JSON.stringify({ error: 'key_name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('api_keys')
          .update({ is_active: false, updated_by: user.id })
          .eq('key_name', key_name);

        if (deleteError) throw deleteError;

        // Log deletion
        const { data: deletedKey } = await supabase
          .from('api_keys')
          .select('id')
          .eq('key_name', key_name)
          .single();

        if (deletedKey) {
          await supabase
            .from('api_key_audit')
            .insert({
              api_key_id: deletedKey.id,
              action_type: 'deleted',
              performed_by: user.id,
              ip_address: clientIP,
              user_agent: userAgent
            });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'audit':
        // Get audit logs
        const { data: auditLogs, error: auditError } = await supabase
          .from('api_key_audit')
          .select(`
            *,
            api_keys(key_name),
            profiles(first_name, last_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (auditError) throw auditError;

        return new Response(
          JSON.stringify({ success: true, data: auditLogs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'validate':
        // Validate that all required API keys are configured
        const requiredKeys = [
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET',
          'STRIPE_SECRET_KEY',
          'OPENAI_API_KEY'
        ];

        const { data: existingKeys } = await supabase
          .from('api_keys')
          .select('key_name, is_active')
          .in('key_name', requiredKeys);

        const missingKeys = requiredKeys.filter(key => 
          !existingKeys?.find(existing => existing.key_name === key && existing.is_active)
        );

        const validationResult = {
          all_configured: missingKeys.length === 0,
          missing_keys: missingKeys,
          configured_keys: existingKeys?.filter(k => k.is_active).map(k => k.key_name) || []
        };

        return new Response(
          JSON.stringify({ success: true, data: validationResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: list, get, upsert, delete, audit, validate' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('API Key Management Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});