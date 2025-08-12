// E) Rate Limiting & Abuse Controls - Edge Function Middleware

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitConfig {
  endpoint: string;
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'login': { endpoint: 'login', maxAttempts: 5, windowMinutes: 10, blockDurationMinutes: 30 },
  'signup': { endpoint: 'signup', maxAttempts: 3, windowMinutes: 10, blockDurationMinutes: 60 },
  'otp_verification': { endpoint: 'otp_verification', maxAttempts: 5, windowMinutes: 10, blockDurationMinutes: 30 },
  'password_reset': { endpoint: 'password_reset', maxAttempts: 3, windowMinutes: 60, blockDurationMinutes: 120 },
  'api_request': { endpoint: 'api_request', maxAttempts: 100, windowMinutes: 10, blockDurationMinutes: 10 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { endpoint, ip_address, user_id } = await req.json();
    
    if (!endpoint || !ip_address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: endpoint, ip_address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get rate limit configuration
    const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS['api_request'];
    const identifier = `${ip_address}_${endpoint}`;

    // Check rate limit using the enhanced function
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_rate_limit_enhanced', {
        p_identifier: identifier,
        p_action_type: endpoint,
        p_max_attempts: config.maxAttempts,
        p_window_minutes: config.windowMinutes
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Rate limit check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = rateLimitResult as any;

    // If blocked, create security alert for suspicious behavior
    if (result.blocked) {
      const { error: alertError } = await supabase
        .rpc('create_security_alert', {
          p_alert_type: 'rate_limit_violation',
          p_severity: result.attempts_remaining === 0 ? 'high' : 'medium',
          p_title: `Rate Limit Exceeded: ${endpoint}`,
          p_message: `IP ${ip_address} exceeded rate limit for ${endpoint}. Blocked until ${result.blocked_until}.`,
          p_metadata: {
            ip_address,
            endpoint,
            user_id,
            blocked_until: result.blocked_until,
            attempts_remaining: result.attempts_remaining
          }
        });

      if (alertError) {
        console.error('Failed to create security alert:', alertError);
      }
    }

    // Log the rate limit check
    const { error: auditError } = await supabase
      .from('security_audit')
      .insert({
        event_type: result.blocked ? 'rate_limit_exceeded' : 'rate_limit_checked',
        user_id: user_id || null,
        event_data: {
          endpoint,
          ip_address,
          rate_limit_result: result,
          config
        },
        severity: result.blocked ? 'warning' : 'info',
        ip_address
      });

    if (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    // Return rate limit status
    return new Response(
      JSON.stringify({
        allowed: result.allowed,
        blocked: result.blocked,
        attempts_remaining: result.attempts_remaining,
        blocked_until: result.blocked_until,
        config: {
          max_attempts: config.maxAttempts,
          window_minutes: config.windowMinutes
        }
      }),
      { 
        status: result.allowed ? 200 : 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxAttempts.toString(),
          'X-RateLimit-Remaining': result.attempts_remaining?.toString() || '0',
          'X-RateLimit-Reset': result.blocked_until || '',
          'Retry-After': result.blocked ? '300' : '0'
        }
      }
    );

  } catch (error) {
    console.error('Rate limit middleware error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})