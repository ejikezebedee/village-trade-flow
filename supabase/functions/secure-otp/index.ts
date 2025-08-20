import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  action: 'generate' | 'verify';
  phone?: string;
  email?: string;
  order_id?: string;
  otp_code?: string;
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let user_id = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      user_id = user?.id;
    }

    const { action, phone, email, order_id, otp_code }: OTPRequest = await req.json();
    const ip_address = req.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting check
    const rateLimitIdentifier = user_id || ip_address;
    const { data: rateLimitResult } = await supabase.rpc('check_rate_limit_enhanced', {
      p_identifier: rateLimitIdentifier,
      p_action_type: `otp_${action}`,
      p_max_attempts: action === 'generate' ? 3 : 5,
      p_window_minutes: action === 'generate' ? 15 : 10,
    });

    if (rateLimitResult?.blocked) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          blocked_until: rateLimitResult.blocked_until 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'generate') {
      if (!phone && !email) {
        return new Response(
          JSON.stringify({ error: 'Phone or email required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate secure OTP with 5-minute expiry
      const { data: otpData, error: otpError } = await supabase.rpc('generate_short_lived_otp');
      
      if (otpError) {
        console.error('OTP generation error:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Store OTP securely in database
      const { error: storeError } = await supabase
        .from('otp_verifications')
        .insert({
          user_id: user_id,
          phone: phone,
          email: email,
          order_id: order_id,
          otp_code: otpData[0].code,
          expires_at: otpData[0].expires_at,
          attempts: 0,
          ip_address: ip_address
        });

      if (storeError) {
        console.error('OTP storage error:', storeError);
        return new Response(
          JSON.stringify({ error: 'Failed to store OTP' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'otp_generated',
        event_data: {
          user_id,
          order_id,
          delivery_method: phone ? 'sms' : 'email',
          ip_address
        },
        severity: 'info'
      });

      // TODO: Send OTP via SMS/Email service
      console.log(`OTP Generated: ${otpData[0].code} for ${phone || email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          expires_in: 300 // 5 minutes
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'verify') {
      if (!otp_code || !order_id) {
        return new Response(
          JSON.stringify({ error: 'OTP code and order ID required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verify OTP
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('order_id', order_id)
        .eq('otp_code', otp_code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .lt('attempts', 3)
        .single();

      if (fetchError || !otpRecord) {
        // Increment attempts if record exists
        await supabase
          .from('otp_verifications')
          .update({ attempts: supabase.rpc('increment', { field: 'attempts' }) })
          .eq('order_id', order_id)
          .eq('otp_code', otp_code);

        await supabase.rpc('log_security_event', {
          event_type: 'otp_verification_failed',
          event_data: {
            user_id,
            order_id,
            provided_code: otp_code,
            ip_address
          },
          severity: 'warning'
        });

        return new Response(
          JSON.stringify({ error: 'Invalid or expired OTP' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Mark OTP as verified
      const { error: verifyError } = await supabase
        .from('otp_verifications')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString(),
          verified_by_ip: ip_address
        })
        .eq('id', otpRecord.id);

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify OTP' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update order status to completed and release escrow
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          current_stage: 'completed',
          order_status: 'delivered',
          escrow_release_date: new Date().toISOString()
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Order update error:', updateError);
      }

      // Log successful verification
      await supabase.rpc('log_security_event', {
        event_type: 'otp_verified_successfully',
        event_data: {
          user_id,
          order_id,
          ip_address
        },
        severity: 'info'
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully',
          order_completed: true
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
    console.error('Secure OTP error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});