import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DisputeNotificationRequest {
  disputeId: string;
  type: 'dispute_created' | 'status_updated' | 'resolution_final';
  orderId?: string;
  filerName?: string;
  disputeTitle?: string;
  newStatus?: string;
  resolutionNotes?: string;
  adminName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      disputeId, 
      type, 
      orderId, 
      filerName, 
      disputeTitle, 
      newStatus, 
      resolutionNotes, 
      adminName 
    }: DisputeNotificationRequest = await req.json();

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        filed_by_profile:profiles!disputes_filed_by_fkey(user_id, first_name, last_name, email:users(email)),
        respondent_profile:profiles!disputes_respondent_id_fkey(user_id, first_name, last_name, email:users(email))
      `)
      .eq('id', disputeId)
      .single();

    if (disputeError) {
      console.error('Error fetching dispute:', disputeError);
      throw disputeError;
    }

    // Get user emails
    const { data: filerUser } = await supabase.auth.admin.getUserById(dispute.filed_by);
    const { data: respondentUser } = dispute.respondent_id 
      ? await supabase.auth.admin.getUserById(dispute.respondent_id)
      : { data: null };

    const filerEmail = filerUser.user?.email;
    const respondentEmail = respondentUser?.user?.email;

    // Get admin emails for notifications
    const { data: admins } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_role', ['admin', 'moderator']);

    const adminEmails: string[] = [];
    if (admins) {
      for (const admin of admins) {
        const { data: adminUser } = await supabase.auth.admin.getUserById(admin.user_id);
        if (adminUser.user?.email) {
          adminEmails.push(adminUser.user.email);
        }
      }
    }

    let emailPromises: Promise<any>[] = [];

    switch (type) {
      case 'dispute_created':
        // Notify respondent about new dispute
        if (respondentEmail) {
          emailPromises.push(
            resend.emails.send({
              from: "VillageMarket Disputes <disputes@resend.dev>",
              to: [respondentEmail],
              subject: `New Dispute Filed: ${disputeTitle}`,
              html: generateDisputeCreatedEmail(dispute, filerName, false)
            })
          );
        }

        // Notify filer (confirmation)
        if (filerEmail) {
          emailPromises.push(
            resend.emails.send({
              from: "VillageMarket Disputes <disputes@resend.dev>",
              to: [filerEmail],
              subject: `Dispute Submitted: ${disputeTitle}`,
              html: generateDisputeCreatedEmail(dispute, filerName, true)
            })
          );
        }

        // Notify admins
        if (adminEmails.length > 0) {
          emailPromises.push(
            resend.emails.send({
              from: "VillageMarket Disputes <disputes@resend.dev>",
              to: adminEmails,
              subject: `New Dispute Requires Attention: ${disputeTitle}`,
              html: generateAdminDisputeEmail(dispute, 'created', filerName)
            })
          );
        }

        // Create in-app notifications
        if (dispute.respondent_id) {
          await supabase.rpc('create_notification', {
            p_user_id: dispute.respondent_id,
            p_type: 'dispute_filed',
            p_title: 'New Dispute Filed Against You',
            p_message: `A dispute has been filed regarding: ${disputeTitle}`,
            p_data: { dispute_id: disputeId, order_id: orderId },
            p_priority: 'high'
          });
        }

        await supabase.rpc('create_notification', {
          p_user_id: dispute.filed_by,
          p_type: 'dispute_submitted',
          p_title: 'Dispute Submitted Successfully',
          p_message: `Your dispute "${disputeTitle}" has been submitted and is under review.`,
          p_data: { dispute_id: disputeId },
          p_priority: 'normal'
        });

        break;

      case 'status_updated':
        // Notify both parties about status update
        const statusUpdateEmails = [filerEmail, respondentEmail].filter(Boolean);
        
        if (statusUpdateEmails.length > 0) {
          emailPromises.push(
            resend.emails.send({
              from: "VillageMarket Disputes <disputes@resend.dev>",
              to: statusUpdateEmails,
              subject: `Dispute Status Updated: ${disputeTitle}`,
              html: generateStatusUpdateEmail(dispute, newStatus, resolutionNotes, adminName)
            })
          );
        }

        // Create in-app notifications
        const notificationData = {
          dispute_id: disputeId,
          new_status: newStatus,
          admin_name: adminName
        };

        await supabase.rpc('create_notification', {
          p_user_id: dispute.filed_by,
          p_type: 'dispute_update',
          p_title: 'Dispute Status Updated',
          p_message: `Your dispute status has been updated to: ${newStatus}`,
          p_data: notificationData,
          p_priority: newStatus === 'resolved' ? 'high' : 'normal'
        });

        if (dispute.respondent_id) {
          await supabase.rpc('create_notification', {
            p_user_id: dispute.respondent_id,
            p_type: 'dispute_update',
            p_title: 'Dispute Status Updated',
            p_message: `The dispute status has been updated to: ${newStatus}`,
            p_data: notificationData,
            p_priority: newStatus === 'resolved' ? 'high' : 'normal'
          });
        }

        break;
    }

    // Send all emails
    await Promise.all(emailPromises);

    console.log(`Dispute notifications sent for ${type}:`, disputeId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-dispute-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateDisputeCreatedEmail(dispute: any, filerName?: string, isConfirmation = false): string {
  const subject = isConfirmation ? "Your Dispute Has Been Submitted" : "A Dispute Has Been Filed";
  
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">⚖️ ${subject}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">VillageMarket Dispute Center</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        ${isConfirmation ? `
          <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 20px;">Thank you for submitting your dispute</h2>
          <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            Your dispute has been received and assigned case ID: <strong>${dispute.id.slice(0, 8)}</strong>
          </p>
        ` : `
          <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 20px;">A dispute has been filed</h2>
          <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            ${filerName} has filed a dispute that involves you. Case ID: <strong>${dispute.id.slice(0, 8)}</strong>
          </p>
        `}
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Dispute Details</h3>
          <p style="margin: 5px 0;"><strong>Title:</strong> ${dispute.title}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${dispute.dispute_type}</p>
          <p style="margin: 5px 0;"><strong>Priority:</strong> ${dispute.priority}</p>
          ${dispute.order_id ? `<p style="margin: 5px 0;"><strong>Order ID:</strong> ${dispute.order_id}</p>` : ''}
          <p style="margin: 10px 0 0 0;"><strong>Description:</strong></p>
          <p style="color: #64748b; margin: 5px 0;">${dispute.description}</p>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Next Steps:</strong> Our team will review this dispute within 24-48 hours. 
            You will receive email and in-app notifications about any updates.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; color: #64748b; font-size: 14px;">
        <p>VillageMarket Dispute Resolution Team</p>
        <p>Connecting rural communities with urban markets.</p>
      </div>
    </div>
  `;
}

function generateStatusUpdateEmail(dispute: any, newStatus?: string, resolutionNotes?: string, adminName?: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📋 Dispute Status Update</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Case ID: ${dispute.id.slice(0, 8)}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 20px;">Your dispute status has been updated</h2>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Dispute:</strong> ${dispute.title}</p>
          <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${newStatus}</span></p>
          ${adminName ? `<p style="margin: 5px 0;"><strong>Updated by:</strong> ${adminName}</p>` : ''}
          ${resolutionNotes ? `
            <div style="margin-top: 15px;">
              <strong>Notes:</strong>
              <p style="color: #64748b; margin: 5px 0; background: #f1f5f9; padding: 10px; border-radius: 4px;">${resolutionNotes}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/disputes/${dispute.id}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Dispute Details
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #64748b; font-size: 14px;">
        <p>VillageMarket Dispute Resolution Team</p>
      </div>
    </div>
  `;
}

function generateAdminDisputeEmail(dispute: any, action: string, filerName?: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🚨 Admin Alert</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">New Dispute Requires Attention</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 10px;">
        <h2 style="color: #334155; margin: 0 0 20px 0;">Case ID: ${dispute.id.slice(0, 8)}</h2>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <p><strong>Title:</strong> ${dispute.title}</p>
          <p><strong>Type:</strong> ${dispute.dispute_type}</p>
          <p><strong>Priority:</strong> ${dispute.priority}</p>
          <p><strong>Filed by:</strong> ${filerName}</p>
          ${dispute.order_id ? `<p><strong>Order ID:</strong> ${dispute.order_id}</p>` : ''}
          <p><strong>Description:</strong></p>
          <p style="color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 4px;">${dispute.description}</p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/admin/disputes/${dispute.id}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Review Dispute
          </a>
        </div>
      </div>
    </div>
  `;
}

serve(handler);