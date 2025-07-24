import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityAlert {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actor_id?: string;
  target_id?: string;
  ip_address?: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { alert }: { alert: SecurityAlert } = await req.json();

    // Store alert in database
    const { data: alertData, error: alertError } = await supabase
      .from('security_alerts')
      .insert([{
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        actor_id: alert.actor_id,
        target_id: alert.target_id,
        ip_address: alert.ip_address,
        metadata: alert.metadata || {}
      }])
      .select()
      .single();

    if (alertError) throw alertError;

    // Get alert recipients
    const { data: settings } = await supabase
      .from('alert_settings')
      .select('setting_value')
      .eq('setting_key', 'alert_recipients')
      .single();

    const recipients = settings?.setting_value?.emails || [];
    
    if (recipients.length > 0) {
      // Send email alerts
      const emailSubject = `🚨 Security Alert: ${alert.title}`;
      const emailBody = `
        <h2 style="color: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : '#ca8a04'};">
          Security Alert: ${alert.title}
        </h2>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Type:</strong> ${alert.alert_type}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        ${alert.ip_address ? `<p><strong>IP Address:</strong> ${alert.ip_address}</p>` : ''}
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        
        <hr>
        <p><em>This is an automated security alert from VillageMarket Platform.</em></p>
      `;

      for (const email of recipients) {
        await resend.emails.send({
          from: 'Security <security@villagemarket.co>',
          to: [email],
          subject: emailSubject,
          html: emailBody,
        });
      }
    }

    // Mark alert as notified
    await supabase
      .from('security_alerts')
      .update({ 
        notified_channels: ['email'],
        updated_at: new Date().toISOString()
      })
      .eq('id', alertData.id);

    console.log(`Security alert sent: ${alert.title} (${alert.severity})`);

    return new Response(JSON.stringify({ 
      success: true, 
      alert_id: alertData.id,
      message: 'Security alert sent successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-security-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);