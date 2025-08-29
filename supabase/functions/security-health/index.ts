import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityHealthResponse {
  otp_ttl_expected: number;
  otp_ttl_effective: string;
  hibp_enabled_expected: boolean;
  hibp_enabled_effective: string;
  strict_public_config_enabled: boolean;
  function_hardening_coverage: number;
  rls_coverage: number;
  status: 'ok' | 'warn' | 'critical';
  warnings: string[];
  remediation_links: string[];
  last_checked: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get security health data
    const { data: healthData, error: healthError } = await supabase
      .rpc('get_security_health_summary');

    if (healthError) {
      console.error('Error fetching security health:', healthError);
      throw healthError;
    }

    // Check environment configuration
    const otpTtlExpected = 300; // 5 minutes in seconds
    const otpTtlEffective = Deno.env.get('OTP_TTL_SECONDS') || 'unknown';
    const strictPublicConfig = Deno.env.get('STRICT_PUBLIC_CONFIG') === 'true';

    const warnings: string[] = [];
    const remediationLinks: string[] = [];

    // Check OTP TTL configuration
    if (otpTtlEffective !== 'unknown' && parseInt(otpTtlEffective) > otpTtlExpected) {
      warnings.push(`OTP TTL is ${otpTtlEffective}s, expected ≤${otpTtlExpected}s`);
      remediationLinks.push('https://supabase.com/dashboard/project/' + Deno.env.get('SUPABASE_PROJECT_ID') + '/auth/settings');
    }

    // Check if HIBP reminder exists (indicates HIBP not enabled)
    const { data: hibpAlert } = await supabase
      .from('security_alerts')
      .select('id')
      .eq('alert_type', 'configuration_required')
      .eq('status', 'new')
      .contains('metadata', { action_required: 'enable_password_protection' })
      .limit(1);

    const hibpWarning = hibpAlert && hibpAlert.length > 0;
    if (hibpWarning) {
      warnings.push('Leaked password protection not enabled in Supabase Dashboard');
      remediationLinks.push('https://supabase.com/dashboard/project/' + Deno.env.get('SUPABASE_PROJECT_ID') + '/auth/settings');
    }

    // Determine overall status
    let status: 'ok' | 'warn' | 'critical' = 'ok';
    if (warnings.length > 0) {
      status = 'warn';
    }

    const response: SecurityHealthResponse = {
      otp_ttl_expected: otpTtlExpected,
      otp_ttl_effective: otpTtlEffective,
      hibp_enabled_expected: true,
      hibp_enabled_effective: hibpWarning ? 'disabled (manual verify in Supabase Dashboard)' : 'unknown (manual verify)',
      strict_public_config_enabled: strictPublicConfig,
      function_hardening_coverage: healthData?.function_hardening_coverage || 0,
      rls_coverage: healthData?.rls_coverage || 0,
      status,
      warnings,
      remediation_links: remediationLinks,
      last_checked: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Security health check error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to check security health',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});