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
    // Create Supabase clients
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { orderId, newStatus, action } = await req.json();
    if (!orderId || !action) throw new Error("Order ID and action are required");

    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    // Verify user authorization based on action
    let isAuthorized = false;
    if (action === "ship" && order.seller_id === user.id) {
      isAuthorized = true;
    } else if (action === "confirm_receipt" && order.buyer_id === user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new Error("Unauthorized to perform this action");
    }

    let updateData: any = {};
    let notificationData: any = {};

    // Handle different actions
    switch (action) {
      case "ship":
        updateData = {
          order_status: "shipped",
          current_stage: "in_transit",
          updated_at: new Date().toISOString()
        };
        
        // Notify buyer about shipment
        await supabaseService.from("notifications").insert({
          user_id: order.buyer_id,
          type: "order_shipped",
          title: "Order Shipped",
          message: `Your order for ${order.product_name} has been shipped and is on its way!`,
          data: {
            order_id: orderId,
            product_name: order.product_name,
            tracking_stage: "in_transit"
          },
          priority: "normal"
        });

        // Notify seller about successful shipment
        await supabaseService.from("notifications").insert({
          user_id: order.seller_id,
          type: "order_shipped",
          title: "Order Shipped Successfully",
          message: `Your order for ${order.product_name} has been marked as shipped.`,
          data: {
            order_id: orderId,
            product_name: order.product_name
          },
          priority: "normal"
        });
        break;

      case "confirm_receipt":
        updateData = {
          order_status: "delivered",
          current_stage: "completed",
          escrow_release_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Release payment from escrow
        await supabaseService
          .from("payments")
          .update({
            escrow_status: "released",
            released_at: new Date().toISOString()
          })
          .eq("order_id", orderId)
          .eq("escrow_status", "held");

        // Update transaction status
        await supabaseService
          .from("transactions")
          .update({
            status: "completed",
            escrow_released_at: new Date().toISOString(),
            escrow_release_reason: "buyer_confirmation",
            updated_at: new Date().toISOString()
          })
          .eq("order_id", orderId);

        // Notify buyer about confirmation
        await supabaseService.from("notifications").insert({
          user_id: order.buyer_id,
          type: "order_delivered",
          title: "Order Delivered",
          message: `Thank you for confirming receipt of ${order.product_name}. Payment has been released to the seller.`,
          data: {
            order_id: orderId,
            product_name: order.product_name,
            payment_released: true
          },
          priority: "high"
        });

        // Notify seller about payment release
        await supabaseService.from("notifications").insert({
          user_id: order.seller_id,
          type: "payment_released",
          title: "Payment Released",
          message: `Payment for ${order.product_name} has been released! The buyer confirmed receipt.`,
          data: {
            order_id: orderId,
            product_name: order.product_name,
            amount: order.total_amount,
            payment_released: true
          },
          priority: "high"
        });
        break;

      default:
        throw new Error("Invalid action");
    }

    // Update the order
    const { error: updateError } = await supabaseService
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      message: `Order ${action === "ship" ? "shipped" : "confirmed"} successfully`,
      order_status: updateData.order_status,
      payment_released: action === "confirm_receipt"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Order status update error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});