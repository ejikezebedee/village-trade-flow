import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Automated notification service started");

    // Get pending notifications that need email sending
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('email_sent', false)
      .in('priority', ['high', 'urgent'])
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${notifications?.length || 0} notifications to process`);

    const results = [];

    for (const notification of notifications || []) {
      try {
        // Get user email
        const userEmail = notification.user?.email;
        if (!userEmail) {
          console.log(`Skipping notification ${notification.id}: no user email`);
          continue;
        }

        // Get user name from metadata
        const firstName = notification.user?.raw_user_meta_data?.first_name || 'User';
        const lastName = notification.user?.raw_user_meta_data?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Generate email content based on notification type
        const emailContent = generateEmailContent(notification, fullName);

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Rural Marketplace <notifications@resend.dev>",
          to: [userEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        console.log(`Email sent for notification ${notification.id}:`, emailResponse);

        // Mark notification as email sent
        await supabaseClient
          .from('notifications')
          .update({ 
            email_sent: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        results.push({
          notification_id: notification.id,
          email_sent: true,
          email_id: emailResponse.data?.id
        });

      } catch (emailError) {
        console.error(`Error sending email for notification ${notification.id}:`, emailError);
        results.push({
          notification_id: notification.id,
          email_sent: false,
          error: emailError.message
        });
      }
    }

    console.log(`Processed ${results.length} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} notifications`,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateEmailContent(notification: any, userName: string) {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .content { padding: 20px; }
      .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .priority-high { border-left: 4px solid #f59e0b; }
      .priority-urgent { border-left: 4px solid #ef4444; }
      .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
  `;

  const priorityClass = notification.priority === 'urgent' ? 'priority-urgent' : 
                       notification.priority === 'high' ? 'priority-high' : '';

  let subject = notification.title;
  let actionButton = '';
  
  // Customize content based on notification type
  switch (notification.type) {
    case 'order_placed':
      subject = `Order Confirmation - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/orders" class="button">View Order</a>';
      break;
    case 'order_shipped':
      subject = `Your Order is on the Way - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/orders" class="button">Track Order</a>';
      break;
    case 'order_delivered':
      subject = `Order Delivered - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/orders" class="button">View Order Details</a>';
      break;
    case 'payment_received':
      subject = `Payment Confirmation - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/payments" class="button">View Payment</a>';
      break;
    case 'payment_released':
      subject = `Payment Released - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/payments" class="button">View Transaction</a>';
      break;
    case 'message_received':
      subject = `New Message - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/messages" class="button">Read Message</a>';
      break;
    case 'delivery_update':
      subject = `Delivery Update - ${notification.title}`;
      actionButton = '<a href="https://your-app.com/orders" class="button">Track Order</a>';
      break;
    default:
      actionButton = '<a href="https://your-app.com/dashboard" class="button">View Dashboard</a>';
  }

  const html = `
    ${baseStyle}
    <div class="container">
      <div class="header ${priorityClass}">
        <h1 style="margin: 0; color: #333;">${notification.title}</h1>
        ${notification.priority === 'urgent' ? '<p style="margin: 5px 0 0 0; color: #ef4444; font-weight: bold;">🚨 URGENT</p>' : ''}
        ${notification.priority === 'high' ? '<p style="margin: 5px 0 0 0; color: #f59e0b; font-weight: bold;">⚡ HIGH PRIORITY</p>' : ''}
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        <p>${notification.message}</p>
        
        ${notification.data ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Order Details:</h3>
            ${notification.data.product_name ? `<p><strong>Product:</strong> ${notification.data.product_name}</p>` : ''}
            ${notification.data.total_amount ? `<p><strong>Amount:</strong> $${notification.data.total_amount}</p>` : ''}
            ${notification.data.order_id ? `<p><strong>Order ID:</strong> ${notification.data.order_id.slice(0, 8)}...</p>` : ''}
          </div>
        ` : ''}
        
        ${actionButton}
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          The Rural Marketplace Team
        </p>
      </div>
      
      <div class="footer">
        <p>You received this email because you have an account with Rural Marketplace.</p>
        <p>© 2024 Rural Marketplace. All rights reserved.</p>
      </div>
    </div>
  `;

  return { subject, html };
}