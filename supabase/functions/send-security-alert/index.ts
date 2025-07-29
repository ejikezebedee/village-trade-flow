import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alert_type, severity, title, message, actor, target, ip, metadata }: SecurityAlert = await req.json();

    console.log('Processing security alert:', { alert_type, severity, title });

    // Store the alert in the database
    const { data: alertData, error: alertError } = await supabaseClient
      .from('security_alerts')
      .insert({
        alert_type,
        severity,
        title,
        message,
        metadata: {
          ...metadata,
          actor,
          target,
          ip,
          timestamp: new Date().toISOString(),
          source: 'system'
        }
      })
      .select('*')
      .single();

    if (alertError) {
      console.error('Error creating security alert:', alertError);
      throw alertError;
    }

    console.log('Security alert created:', alertData.id);

    // Get email recipients from alert settings
    const { data: emailSettings, error: settingsError } = await supabaseClient
      .from('alert_settings')
      .select('setting_value')
      .eq('setting_key', 'email_recipients')
      .eq('is_active', true)
      .single();

    let emailRecipients: string[] = [];
    
    if (!settingsError && emailSettings?.setting_value?.emails) {
      emailRecipients = emailSettings.setting_value.emails;
    } else {
      // Fallback to default admin emails if no settings found
      emailRecipients = ['admin@villagemarket.com'];
    }

    // Send email notifications (if email service is configured)
    if (emailRecipients.length > 0) {
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        
        if (resendApiKey) {
          const emailSubject = `🚨 Security Alert [${severity.toUpperCase()}]: ${title}`;
          const emailBody = `
            <h2>Security Alert Notification</h2>
            <p><strong>Alert Type:</strong> ${alert_type}</p>
            <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Message:</strong> ${message}</p>
            ${actor ? `<p><strong>Actor:</strong> ${actor}</p>` : ''}
            ${target ? `<p><strong>Target:</strong> ${target}</p>` : ''}
            ${ip ? `<p><strong>IP Address:</strong> ${ip}</p>` : ''}
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            
            ${metadata ? `
            <h3>Additional Details:</h3>
            <pre>${JSON.stringify(metadata, null, 2)}</pre>
            ` : ''}
            
            <hr>
            <p><em>This is an automated security alert from VillageMarket. Please review and take appropriate action.</em></p>
          `;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'security@villagemarket.com',
              to: emailRecipients,
              subject: emailSubject,
              html: emailBody,
            }),
          });

          if (emailResponse.ok) {
            console.log('Security alert email sent successfully');
            
            // Update the alert to mark as notified
            await supabaseClient
              .from('security_alerts')
              .update({
                metadata: {
                  ...alertData.metadata,
                  email_sent: true,
                  email_recipients: emailRecipients,
                  email_sent_at: new Date().toISOString()
                }
              })
              .eq('id', alertData.id);
          } else {
            console.error('Failed to send security alert email:', await emailResponse.text());
          }
        }
      } catch (emailError) {
        console.error('Error sending security alert email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alert_id: alertData.id,
        message: 'Security alert processed successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing security alert:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process security alert'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
};

serve(handler);