import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  identifier: string;
  action: string;
  maxAttempts?: number;
  windowMinutes?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { identifier, action, maxAttempts = 5, windowMinutes = 10 }: RateLimitRequest = await req.json();

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing identifier or action' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check rate limit using our database function
    const { data: rateLimitResult, error } = await supabase.rpc('check_rate_limit_enhanced', {
      p_identifier: identifier,
      p_action_type: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return new Response(
        JSON.stringify({ error: 'Rate limit check failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log security event if rate limited
    if (rateLimitResult.blocked) {
      await supabase.rpc('log_security_event', {
        event_type: 'rate_limit_exceeded',
        event_data: {
          identifier,
          action,
          blocked_until: rateLimitResult.blocked_until,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        },
        severity: 'warning'
      });
    }

    return new Response(
      JSON.stringify(rateLimitResult),
      { 
        status: rateLimitResult.allowed ? 200 : 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': maxAttempts.toString(),
          'X-RateLimit-Remaining': rateLimitResult.attempts_remaining?.toString() || '0',
          'X-RateLimit-Reset': rateLimitResult.blocked_until || ''
        }
      }
    );

  } catch (error) {
    console.error('Server rate limit error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});