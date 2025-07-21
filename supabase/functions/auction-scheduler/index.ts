import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Running auction scheduler...');

    // Find auctions that should start
    const { data: auctionsToStart, error: startError } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'draft')
      .lte('start_time', new Date().toISOString());

    if (startError) {
      console.error('Error finding auctions to start:', startError);
    } else if (auctionsToStart && auctionsToStart.length > 0) {
      console.log(`Starting ${auctionsToStart.length} auctions`);
      
      // Start the auctions
      const { error: updateError } = await supabase
        .from('auctions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', auctionsToStart.map(a => a.id));

      if (updateError) {
        console.error('Error starting auctions:', updateError);
      } else {
        console.log('Auctions started successfully');
      }
    }

    // Find auctions that should end
    const { data: auctionsToEnd, error: endError } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'active')
      .lte('end_time', new Date().toISOString());

    if (endError) {
      console.error('Error finding auctions to end:', endError);
    } else if (auctionsToEnd && auctionsToEnd.length > 0) {
      console.log(`Ending ${auctionsToEnd.length} auctions`);
      
      // End each auction
      for (const auction of auctionsToEnd) {
        try {
          const endResponse = await supabase.functions.invoke('end-auction', {
            body: { auction_id: auction.id }
          });

          if (endResponse.error) {
            console.error(`Failed to end auction ${auction.id}:`, endResponse.error);
          } else {
            console.log(`Auction ${auction.id} ended successfully`);
          }
        } catch (error) {
          console.error(`Error ending auction ${auction.id}:`, error);
        }
      }
    }

    // Clean up old notification logs (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error: cleanupError } = await supabase
      .from('auction_notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old notifications:', cleanupError);
    } else {
      console.log('Old notifications cleaned up');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auction scheduler completed',
        started: auctionsToStart?.length || 0,
        ended: auctionsToEnd?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in auction-scheduler function:', error);
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