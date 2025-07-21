import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndAuctionRequest {
  auction_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { auction_id }: EndAuctionRequest = await req.json();

    // Validate input
    if (!auction_id) {
      return new Response(
        JSON.stringify({ error: 'Auction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Ending auction: ${auction_id}`);

    // Call the database function to end the auction
    const { data: endResult, error } = await supabase.rpc('end_auction', {
      p_auction_id: auction_id
    });

    if (error) {
      console.error('Auction end error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!endResult.success) {
      return new Response(
        JSON.stringify({ error: endResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auction ended successfully:', endResult);

    // If auction was successful, create escrow payment
    if (endResult.reserve_met && endResult.winner) {
      try {
        // Get auction and winner details
        const { data: auctionData } = await supabase
          .from('auctions')
          .select(`
            *,
            seller:profiles!auctions_seller_id_fkey(id, first_name, last_name),
            winner:profiles!auctions_winner_id_fkey(id, first_name, last_name)
          `)
          .eq('id', auction_id)
          .single();

        if (auctionData) {
          // Create escrow payment intent
          const escrowResponse = await supabase.functions.invoke('create-payment', {
            body: {
              amount: Math.round(endResult.final_bid * 100), // Convert to cents
              currency: 'USD',
              metadata: {
                type: 'auction_escrow',
                auction_id: auction_id,
                seller_id: auctionData.seller_id,
                winner_id: endResult.winner,
                product_name: auctionData.title
              }
            }
          });

          if (escrowResponse.error) {
            console.error('Failed to create escrow payment:', escrowResponse.error);
          } else {
            console.log('Escrow payment created for auction:', auction_id);
          }
        }
      } catch (escrowError) {
        console.error('Error creating escrow payment:', escrowError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: endResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in end-auction function:', error);
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