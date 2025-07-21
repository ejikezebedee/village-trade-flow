import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BidRequest {
  auction_id: string;
  bid_amount: number;
  max_bid?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { auction_id, bid_amount, max_bid }: BidRequest = await req.json();

    // Validate input
    if (!auction_id || !bid_amount || bid_amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid bid data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Placing bid: ${bid_amount} on auction ${auction_id} by user ${user.id}`);

    // Call the database function to place the bid
    const { data: bidResult, error } = await supabase.rpc('place_auction_bid', {
      p_auction_id: auction_id,
      p_bidder_id: user.id,
      p_bid_amount: bid_amount,
      p_max_bid: max_bid || null
    });

    if (error) {
      console.error('Bid placement error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!bidResult.success) {
      return new Response(
        JSON.stringify({ error: bidResult.error, minimum_bid: bidResult.minimum_bid }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated auction data
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select(`
        *,
        auction_bids!inner(
          id,
          bidder_id,
          bid_amount,
          bid_time,
          profiles!auction_bids_bidder_id_fkey(first_name, last_name)
        )
      `)
      .eq('id', auction_id)
      .eq('auction_bids.is_winning_bid', true)
      .single();

    if (auctionError) {
      console.error('Error fetching updated auction:', auctionError);
    }

    console.log('Bid placed successfully:', bidResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: bidResult,
        auction: auctionData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in place-auction-bid function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);