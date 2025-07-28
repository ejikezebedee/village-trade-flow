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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { wallet_address } = await req.json();
    
    if (!wallet_address) {
      throw new Error("Wallet address is required");
    }

    console.log(`Processing token claim for user: ${userData.user.id}`);

    // Get pending token rewards for user
    const { data: rewards, error: rewardsError } = await supabaseClient
      .from('token_rewards')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('status', 'pending');

    if (rewardsError) {
      throw new Error(`Failed to fetch rewards: ${rewardsError.message}`);
    }

    if (!rewards || rewards.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No pending rewards to claim'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const totalRewards = rewards.reduce((sum, reward) => sum + reward.amount, 0);

    console.log(`Total rewards to claim: ${totalRewards} $ZSHOP`);

    // In a real implementation, you would:
    // 1. Connect to Solana network
    // 2. Transfer SPL tokens to user's wallet
    // 3. Get transaction hash
    
    // For now, we'll simulate the token transfer
    const simulatedTxHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update rewards as claimed
    const { error: updateError } = await supabaseClient
      .from('token_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        wallet_address: wallet_address,
        transaction_hash: simulatedTxHash
      })
      .eq('user_id', userData.user.id)
      .eq('status', 'pending');

    if (updateError) {
      throw new Error(`Failed to update rewards: ${updateError.message}`);
    }

    console.log(`Successfully claimed ${totalRewards} $ZSHOP tokens`);

    return new Response(JSON.stringify({
      success: true,
      amount_claimed: totalRewards,
      transaction_hash: simulatedTxHash,
      rewards_count: rewards.length,
      message: `Successfully claimed ${totalRewards} $ZSHOP tokens`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error claiming token rewards:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});