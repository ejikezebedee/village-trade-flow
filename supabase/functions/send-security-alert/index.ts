import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityAlert {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actor?: string;
  target?: string;
  ip?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alertType, severity, title, message, metadata = {} } = await req.json();

    console.log('Creating security alert:', { alertType, severity, title });

    // Validate input
    if (!alertType || !severity || !title || !message) {
      throw new Error('Missing required fields: alertType, severity, title, message');
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error('Invalid severity level. Must be: low, medium, high, or critical');
    }

    // Create security alert
    const { data: alert, error: alertError } = await supabaseClient
      .from('security_alerts')
      .insert({
        alert_type: alertType,
        severity: severity,
        title: title,
        message: message,
        metadata: metadata,
        status: 'active'
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating security alert:', alertError);
      throw alertError;
    }

    console.log('Security alert created successfully:', alert.id);

    // Get notification settings
    const { data: settings } = await supabaseClient
      .from('alert_settings')
      .select('*')
      .eq('is_active', true);

    // Send email notifications if configured
    const emailRecipients = settings?.find(s => s.setting_key === 'email_recipients')?.setting_value || [];

    if (emailRecipients.length > 0 && severity !== 'low') {
      console.log('Sending email notifications to:', emailRecipients);
      
      // Here you would integrate with your email service
      // For now, we'll just log the notification
      const emailData = {
        to: emailRecipients,
        subject: `[${severity.toUpperCase()}] Security Alert: ${title}`,
        body: `
          Security Alert Details:
          
          Type: ${alertType}
          Severity: ${severity.toUpperCase()}
          Title: ${title}
          Message: ${message}
          
          Timestamp: ${new Date().toISOString()}
          
          Please review this alert in the admin dashboard.
        `,
        metadata: metadata
      };
      
      console.log('Email notification prepared:', emailData);
      
      // TODO: Integrate with actual email service (SendGrid, etc.)
      // await sendEmailNotification(emailData);
    }

    // Auto-escalate critical alerts
    if (severity === 'critical') {
      console.log('Critical alert detected - auto-escalating');
      
      // Update alert to escalated status
      await supabaseClient
        .from('security_alerts')
        .update({ 
          metadata: { 
            ...metadata, 
            escalated: true, 
            escalated_at: new Date().toISOString() 
          } 
        })
        .eq('id', alert.id);

      // TODO: Implement additional escalation actions
      // - SMS notifications
      // - Slack/Discord webhooks
      // - PagerDuty integration
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertId: alert.id,
        message: 'Security alert created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Security alert function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});