import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { messageType, orderId, customData } = await req.json();
    
    if (!messageType || !orderId) {
      throw new Error("Message type and order ID are required");
    }

    console.log(`Processing automated message: ${messageType} for order: ${orderId}`);

    // Get order details with related user information
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(email),
        seller:seller_id(email)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get user profiles for names
    const { data: buyerProfile } = await supabaseService
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', order.buyer_id)
      .single();

    const { data: sellerProfile } = await supabaseService
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', order.seller_id)
      .single();

    // Prepare template variables
    const buyerName = buyerProfile ? `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim() : 'Valued Customer';
    const sellerName = sellerProfile ? `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim() : 'Seller';

    const templateVars = {
      buyer_name: buyerName,
      seller_name: sellerName,
      product_name: order.product_name,
      quantity: order.quantity,
      total_amount: order.total_amount,
      amount: customData?.amount || order.total_amount,
      order_id: order.id.slice(0, 8),
      tracking_info: customData?.tracking_info || 'Available in your dashboard',
      release_date: new Date().toLocaleDateString(),
      ...customData
    };

    // Get message templates for this event
    const { data: templates, error: templateError } = await supabaseService
      .from('message_templates')
      .select('*')
      .eq('message_type', messageType)
      .eq('is_active', true);

    if (templateError) {
      throw new Error(`Failed to fetch templates: ${templateError.message}`);
    }

    if (!templates || templates.length === 0) {
      console.log(`No templates found for message type: ${messageType}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No templates configured for this message type" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const messagesCreated = [];

    // Process each template and create messages
    for (const template of templates) {
      let recipientId;
      let recipientEmail;

      // Determine recipient based on template
      if (template.recipient_type === 'buyer') {
        recipientId = order.buyer_id;
        recipientEmail = order.buyer?.email;
      } else if (template.recipient_type === 'seller') {
        recipientId = order.seller_id;
        recipientEmail = order.seller?.email;
      } else {
        continue; // Skip admin/system messages for now
      }

      if (!recipientId || !recipientEmail) {
        console.log(`Skipping template ${template.template_name} - recipient not found`);
        continue;
      }

      // Replace template variables
      let subject = template.subject_template;
      let content = template.content_template;

      Object.entries(templateVars).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      });

      // Create automated message record
      const { data: messageRecord, error: messageError } = await supabaseService
        .from('automated_messages')
        .insert({
          order_id: orderId,
          message_type: messageType,
          recipient_id: recipientId,
          recipient_type: template.recipient_type,
          subject: subject,
          message_content: content,
          template_used: template.template_name,
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: {
            recipient_email: recipientEmail,
            template_variables: templateVars,
            automated: true
          }
        })
        .select()
        .single();

      if (messageError) {
        console.error(`Failed to create message record: ${messageError.message}`);
        continue;
      }

      // Also create a notification for in-app viewing
      await supabaseService.from('notifications').insert({
        user_id: recipientId,
        type: messageType,
        title: subject,
        message: content,
        data: {
          order_id: orderId,
          message_id: messageRecord.id,
          automated_message: true
        },
        priority: messageType.includes('payment') || messageType.includes('delivery') ? 'high' : 'normal'
      });

      messagesCreated.push({
        id: messageRecord.id,
        recipient_type: template.recipient_type,
        recipient_email: recipientEmail,
        subject: subject
      });

      console.log(`Created automated message: ${template.template_name} for ${recipientEmail}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${messagesCreated.length} automated messages`,
      messages: messagesCreated
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Automated messaging error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});