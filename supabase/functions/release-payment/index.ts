import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Create Supabase client using anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { orderId, confirmationCode } = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    // Get order with buyer verification
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select(`
        *,
        buyer:profiles!orders_buyer_id_fkey(user_id, first_name, last_name),
        seller:profiles!orders_seller_id_fkey(user_id, first_name, last_name)
      `)
      .eq("id", orderId)
      .eq("buyer_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found or unauthorized");
    if (order.payment_status !== "escrow") throw new Error("Payment not in escrow");

    // Verify QR code if provided
    if (confirmationCode && order.shop_to_buyer_qr !== confirmationCode) {
      throw new Error("Invalid confirmation code");
    }

    // Update transaction to released
    const { error: transactionError } = await supabaseService
      .from("transactions")
      .update({ 
        status: "completed",
        escrow_released_at: new Date().toISOString(),
        escrow_release_reason: "buyer_confirmed_receipt"
      })
      .eq("order_id", orderId)
      .eq("transaction_type", "payment");

    if (transactionError) throw transactionError;

    // Update payment record
    const { error: paymentError } = await supabaseService
      .from("payments")
      .update({ 
        escrow_status: "released",
        released_at: new Date().toISOString()
      })
      .eq("order_id", orderId);

    if (paymentError) throw paymentError;

    // Update order status
    const { error: orderUpdateError } = await supabaseService
      .from("orders")
      .update({ 
        payment_status: "completed",
        order_status: "completed",
        current_stage: "completed"
      })
      .eq("id", orderId);

    if (orderUpdateError) throw orderUpdateError;

    // Send notification emails
    try {
      if (order.buyer?.user_id) {
        const { data: buyerAuth } = await supabaseService.auth.admin.getUserById(order.buyer.user_id);
        if (buyerAuth.user?.email) {
          await resend.emails.send({
            from: "noreply@marketplace.com",
            to: [buyerAuth.user.email],
            subject: "Payment Released - Order Completed",
            html: `
              <h2>Payment Released Successfully</h2>
              <p>Your payment for "${order.product_name}" has been released from escrow.</p>
              <p>Order ID: ${orderId}</p>
              <p>Amount: $${order.total_amount}</p>
              <p>Thank you for your purchase!</p>
            `
          });
        }
      }

      if (order.seller?.user_id) {
        const { data: sellerAuth } = await supabaseService.auth.admin.getUserById(order.seller.user_id);
        if (sellerAuth.user?.email) {
          await resend.emails.send({
            from: "noreply@marketplace.com",
            to: [sellerAuth.user.email],
            subject: "Payment Received - Order Completed",
            html: `
              <h2>Payment Received</h2>
              <p>Payment for "${order.product_name}" has been released to you.</p>
              <p>Order ID: ${orderId}</p>
              <p>Amount: $${order.total_amount}</p>
              <p>The funds will appear in your account within 2-3 business days.</p>
            `
          });
        }
      }
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment released successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment release error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});