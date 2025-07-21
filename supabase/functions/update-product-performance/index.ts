import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Product performance update triggered');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update performance tags
    const { error: performanceError } = await supabase.rpc('update_product_performance_tags');
    if (performanceError) {
      console.error('Error updating performance tags:', performanceError);
    } else {
      console.log('Performance tags updated successfully');
    }

    // Clean up old new-arrival tags
    const { error: cleanupError } = await supabase.rpc('cleanup_new_arrival_tags');
    if (cleanupError) {
      console.error('Error cleaning up old tags:', cleanupError);
    } else {
      console.log('Old tags cleaned up successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product performance and tags updated successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in update-product-performance function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to update product performance' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);