import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportNotificationRequest {
  ticketId: string;
  type: 'ticket_created' | 'ticket_updated' | 'ticket_resolved';
  userEmail: string;
  title: string;
  category: string;
  priority: string;
  response?: string;
  agentName?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ticketId,
      type,
      userEmail,
      title,
      category,
      priority,
      response,
      agentName
    }: SupportNotificationRequest = await req.json();

    console.log(`Processing support notification: ${type} for ticket ${ticketId}`);

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*, profiles(first_name, last_name)')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
    }

    // Prepare email content based on notification type
    let subject = '';
    let emailContent = '';

    switch (type) {
      case 'ticket_created':
        subject = `Support Ticket Created - #${ticketId.slice(0, 8)}`;
        emailContent = `
          <h2>Support Ticket Created</h2>
          <p>Your support ticket has been successfully created and assigned ticket number <strong>#${ticketId.slice(0, 8)}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3>Ticket Details:</h3>
            <p><strong>Subject:</strong> ${title}</p>
            <p><strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
            <p><strong>Priority:</strong> ${priority.charAt(0).toUpperCase() + priority.slice(1)}</p>
            <p><strong>Status:</strong> Open</p>
          </div>
          
          <h3>What happens next?</h3>
          <ul>
            <li>Our support team will review your ticket within 24 hours</li>
            <li>You'll receive updates via email and in-app notifications</li>
            <li>For urgent issues, our team may contact you directly</li>
          </ul>
          
          <p>You can track the status of your ticket by logging into your account and visiting the Support Center.</p>
          
          <p>Thank you for contacting us!</p>
        `;
        break;

      case 'ticket_updated':
        subject = `Support Ticket Update - #${ticketId.slice(0, 8)}`;
        emailContent = `
          <h2>Support Ticket Update</h2>
          <p>Your support ticket <strong>#${ticketId.slice(0, 8)}</strong> has been updated.</p>
          
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3>New Response from ${agentName || 'Support Team'}:</h3>
            <p>${response || 'No response provided'}</p>
          </div>
          
          <p><strong>Subject:</strong> ${title}</p>
          <p><strong>Current Status:</strong> In Progress</p>
          
          <p>You can view the full conversation and respond by logging into your account and visiting the Support Center.</p>
        `;
        break;

      case 'ticket_resolved':
        subject = `Support Ticket Resolved - #${ticketId.slice(0, 8)}`;
        emailContent = `
          <h2>Support Ticket Resolved</h2>
          <p>Your support ticket <strong>#${ticketId.slice(0, 8)}</strong> has been resolved.</p>
          
          <div style="background-color: #d4edda; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #28a745;">
            <h3>Resolution:</h3>
            <p>${response || 'Your issue has been resolved.'}</p>
            <p><em>- ${agentName || 'Support Team'}</em></p>
          </div>
          
          <p><strong>Subject:</strong> ${title}</p>
          <p><strong>Final Status:</strong> Resolved</p>
          
          <h3>Was this helpful?</h3>
          <p>We'd love to hear your feedback about your support experience. Please take a moment to rate our service in your account dashboard.</p>
          
          <p>If you have any additional questions or need further assistance, please don't hesitate to create a new support ticket.</p>
          
          <p>Thank you for using our platform!</p>
        `;
        break;
    }

    // Send email notification
    const emailResult = await resend.emails.send({
      from: "Support Team <support@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${emailContent}
          
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e9ecef;">
          
          <div style="font-size: 12px; color: #6c757d; text-align: center;">
            <p>This email was sent regarding your support ticket. Please do not reply to this email.</p>
            <p>© 2024 Your Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error("Email sending failed:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message}`);
    }

    console.log("Email sent successfully:", emailResult.data);

    // Create in-app notification
    const notificationTitle = type === 'ticket_created' 
      ? 'Support Ticket Created'
      : type === 'ticket_updated'
      ? 'Support Ticket Updated'
      : 'Support Ticket Resolved';

    const notificationMessage = type === 'ticket_created'
      ? `Your support ticket #${ticketId.slice(0, 8)} has been created successfully.`
      : type === 'ticket_updated'
      ? `Your support ticket #${ticketId.slice(0, 8)} has been updated with a new response.`
      : `Your support ticket #${ticketId.slice(0, 8)} has been resolved.`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: ticket.user_id,
        type: 'support_ticket',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          ticket_id: ticketId,
          ticket_status: type === 'ticket_resolved' ? 'resolved' : 'in_progress',
          category,
          priority
        },
        priority: priority === 'urgent' ? 'high' : 'normal'
      });

    if (notificationError) {
      console.error("Failed to create in-app notification:", notificationError);
      // Don't throw error for notification failure
    }

    // Log support activity for admin tracking
    const { error: logError } = await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'support_notification',
        severity: 'info',
        user_id: ticket.user_id,
        action_performed: `Support notification sent: ${type}`,
        metadata: {
          ticket_id: ticketId,
          notification_type: type,
          email_sent: !emailResult.error,
          priority,
          category
        }
      });

    if (logError) {
      console.error("Failed to log support activity:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Support notification sent successfully",
        emailId: emailResult.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-support-notifications function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to send support notification"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});