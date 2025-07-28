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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    console.log(`Processing commission for order: ${order_id}`);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get monetization config
    const { data: config } = await supabaseClient
      .from('monetization_config')
      .select('*')
      .eq('is_active', true);

    const configMap = config?.reduce((acc, item) => {
      acc[item.config_key] = item.config_value;
      return acc;
    }, {} as Record<string, any>) || {};

    const commissionPercent = configMap.transaction_commission?.percent || 5.0;
    const escrowFee = configMap.escrow_processing_fee?.amount || 1.0;
    const tokenRewards = configMap.token_rewards || {};

    // Calculate amounts
    const commissionAmount = order.total_amount * (commissionPercent / 100);
    const sellerAmount = order.total_amount - commissionAmount;

    console.log(`Commission: $${commissionAmount}, Seller: $${sellerAmount}, Escrow Fee: $${escrowFee}`);

    // Record commission earning
    const { error: commissionError } = await supabaseClient
      .from('admin_earnings')
      .insert({
        earnings_type: 'transaction_commission',
        amount: commissionAmount,
        currency: 'USD',
        order_id: order.id,
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        commission_percent: commissionPercent,
        metadata: {
          seller_amount: sellerAmount,
          original_total: order.total_amount,
          processed_at: new Date().toISOString()
        }
      });

    if (commissionError) {
      throw new Error(`Failed to record commission: ${commissionError.message}`);
    }

    // Record escrow fee
    const { error: escrowError } = await supabaseClient
      .from('admin_earnings')
      .insert({
        earnings_type: 'escrow_fee',
        amount: escrowFee,
        currency: 'USD',
        order_id: order.id,
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        metadata: {
          fee_type: 'escrow_processing',
          processed_at: new Date().toISOString()
        }
      });

    if (escrowError) {
      throw new Error(`Failed to record escrow fee: ${escrowError.message}`);
    }

    // Create token rewards if enabled
    if (tokenRewards.enabled) {
      const buyerReward = order.total_amount * (tokenRewards.buyer_rate || 0.01);
      const sellerReward = order.total_amount * (tokenRewards.seller_rate || 0.05);

      // Buyer reward
      await supabaseClient.from('token_rewards').insert({
        user_id: order.buyer_id,
        order_id: order.id,
        reward_type: 'buyer',
        amount: buyerReward,
        source_amount: order.total_amount,
        reward_rate: tokenRewards.buyer_rate || 0.01,
        status: 'pending'
      });

      // Seller reward
      await supabaseClient.from('token_rewards').insert({
        user_id: order.seller_id,
        order_id: order.id,
        reward_type: 'seller',
        amount: sellerReward,
        source_amount: order.total_amount,
        reward_rate: tokenRewards.seller_rate || 0.05,
        status: 'pending'
      });

      // Check for agent referral
      const { data: referral } = await supabaseClient
        .from('affiliate_referrals')
        .select('affiliate_id')
        .eq('referred_user_id', order.buyer_id)
        .eq('conversion_status', 'converted')
        .single();

      if (referral) {
        const agentReward = order.total_amount * (tokenRewards.agent_rate || 0.10);
        await supabaseClient.from('token_rewards').insert({
          user_id: referral.affiliate_id,
          order_id: order.id,
          reward_type: 'agent',
          amount: agentReward,
          source_amount: order.total_amount,
          reward_rate: tokenRewards.agent_rate || 0.10,
          status: 'pending',
          metadata: {
            referral_id: referral.id,
            referred_user: order.buyer_id
          }
        });
      }

      console.log(`Token rewards created: Buyer: ${buyerReward}, Seller: ${sellerReward}`);
    }

    // Update order to mark commission as processed
    await supabaseClient
      .from('orders')
      .update({ 
        order_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({
      success: true,
      commission_amount: commissionAmount,
      escrow_fee: escrowFee,
      seller_amount: sellerAmount,
      message: 'Commission processed successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing commission:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});