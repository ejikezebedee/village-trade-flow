import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing notification deliveries...');

    // Get pending email notifications
    const { data: pendingEmails, error: emailError } = await supabase
      .from('notification_deliveries')
      .select(`
        id,
        notification_id,
        notifications!inner(
          id,
          user_id,
          title,
          message,
          data,
          profiles!inner(user_id, first_name, last_name)
        )
      `)
      .eq('delivery_channel', 'email')
      .eq('delivery_status', 'pending')
      .limit(50);

    if (emailError) {
      console.error('Error fetching pending emails:', emailError);
      throw emailError;
    }

    console.log(`Found ${pendingEmails?.length || 0} pending email notifications`);

    const results = {
      emails_sent: 0,
      emails_failed: 0,
      sms_sent: 0,
      sms_failed: 0
    };

    // Process email notifications
    for (const delivery of pendingEmails || []) {
      try {
        const notification = delivery.notifications;
        const profile = notification.profiles;
        const recipientEmail = await getUserEmail(notification.user_id);

        if (!recipientEmail) {
          await updateDeliveryStatus(delivery.id, 'failed', 'No email address found');
          results.emails_failed++;
          continue;
        }

        // Get notification template for email content
        const { data: template } = await supabase
          .from('notification_templates')
          .select('email_template')
          .eq('notification_type', notification.type || 'transfer_received')
          .single();

        let emailContent = template?.email_template || notification.message;

        // Replace variables in email content
        if (notification.data) {
          const variables = notification.data as Record<string, any>;
          for (const [key, value] of Object.entries(variables)) {
            emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          }
        }

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: 'VillageMarket <no-reply@villagemarket.app>',
          to: [recipientEmail],
          subject: notification.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">VillageMarket</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; margin-top: 0;">${notification.title}</h2>
                <p style="color: #666; line-height: 1.6; font-size: 16px;">${emailContent}</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    This email was sent from VillageMarket. If you have any questions, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        if (emailResponse.error) {
          throw new Error(emailResponse.error.message);
        }

        // Update delivery status to sent
        await updateDeliveryStatus(delivery.id, 'sent', null, emailResponse.data?.id);
        results.emails_sent++;

        console.log(`Email sent successfully to ${recipientEmail} - ID: ${emailResponse.data?.id}`);

      } catch (error: any) {
        console.error(`Failed to send email for delivery ${delivery.id}:`, error);
        await updateDeliveryStatus(delivery.id, 'failed', error.message);
        results.emails_failed++;
      }
    }

    // Get pending SMS notifications (if SMS is configured)
    const { data: pendingSMS, error: smsError } = await supabase
      .from('notification_deliveries')
      .select(`
        id,
        notification_id,
        notifications!inner(
          id,
          user_id,
          title,
          message,
          data,
          notification_preferences!inner(phone_number)
        )
      `)
      .eq('delivery_channel', 'sms')
      .eq('delivery_status', 'pending')
      .limit(50);

    if (!smsError && pendingSMS?.length) {
      console.log(`Found ${pendingSMS.length} pending SMS notifications`);
      
      // Note: SMS implementation would go here using Twilio or similar service
      // For now, we'll mark them as failed with a message about SMS not being configured
      for (const delivery of pendingSMS) {
        await updateDeliveryStatus(delivery.id, 'failed', 'SMS service not configured');
        results.sms_failed++;
      }
    }

    console.log('Notification processing completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results: results,
        message: `Processed ${results.emails_sent + results.emails_failed} email notifications and ${results.sms_sent + results.sms_failed} SMS notifications`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Notification processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to process notifications' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    return user?.user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

async function updateDeliveryStatus(
  deliveryId: string, 
  status: string, 
  errorMessage: string | null = null,
  providerId: string | null = null
) {
  try {
    const updates: any = {
      delivery_status: status,
      delivered_at: status === 'sent' ? new Date().toISOString() : null
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (providerId) {
      updates.provider_id = providerId;
    }

    await supabase
      .from('notification_deliveries')
      .update(updates)
      .eq('id', deliveryId);

  } catch (error) {
    console.error('Error updating delivery status:', error);
  }
}

serve(handler);