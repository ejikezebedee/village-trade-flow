import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    // Create Supabase client using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Order ID not found in session metadata");

      // Update transaction status to completed (escrow locked)
      const { error: transactionError } = await supabaseService
        .from("transactions")
        .update({ 
          status: "completed",
          gateway_response: { stripe_session: session }
        })
        .eq("external_transaction_id", sessionId);

      if (transactionError) throw transactionError;

      // Update order payment status to escrow
      const { error: orderError } = await supabaseService
        .from("orders")
        .update({ 
          payment_status: "escrow",
          current_stage: "driver_pickup"
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Create payment record
      await supabaseService.from("payments").insert({
        order_id: orderId,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency.toUpperCase(),
        payment_method: "stripe",
        stripe_session_id: sessionId,
        escrow_status: "held"
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment verified and locked in escrow" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});