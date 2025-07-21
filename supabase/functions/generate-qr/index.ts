import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// QR Code generation using a simple data URL approach
function generateQRCodeDataURL(text: string): string {
  // For production, you'd want to use a proper QR code library
  // Here we'll create a simple base64 encoded SVG QR code placeholder
  const size = 200;
  const qrSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <rect x="10" y="10" width="20" height="20" fill="black"/>
      <rect x="50" y="10" width="20" height="20" fill="black"/>
      <rect x="90" y="10" width="20" height="20" fill="black"/>
      <rect x="130" y="10" width="20" height="20" fill="black"/>
      <rect x="170" y="10" width="20" height="20" fill="black"/>
      
      <rect x="10" y="50" width="20" height="20" fill="black"/>
      <rect x="90" y="50" width="20" height="20" fill="black"/>
      <rect x="170" y="50" width="20" height="20" fill="black"/>
      
      <rect x="10" y="90" width="20" height="20" fill="black"/>
      <rect x="50" y="90" width="20" height="20" fill="black"/>
      <rect x="130" y="90" width="20" height="20" fill="black"/>
      <rect x="170" y="90" width="20" height="20" fill="black"/>
      
      <rect x="10" y="130" width="20" height="20" fill="black"/>
      <rect x="90" y="130" width="20" height="20" fill="black"/>
      <rect x="170" y="130" width="20" height="20" fill="black"/>
      
      <rect x="10" y="170" width="20" height="20" fill="black"/>
      <rect x="50" y="170" width="20" height="20" fill="black"/>
      <rect x="90" y="170" width="20" height="20" fill="black"/>
      <rect x="130" y="170" width="20" height="20" fill="black"/>
      <rect x="170" y="170" width="20" height="20" fill="black"/>
      
      <text x="100" y="115" text-anchor="middle" font-size="8" font-family="monospace" fill="black">
        ${text.slice(0, 20)}
      </text>
    </svg>
  `;
  
  const base64 = btoa(qrSvg);
  return `data:image/svg+xml;base64,${base64}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { order_id, stage } = await req.json();

    if (!order_id || !stage) {
      throw new Error('Missing required parameters: order_id and stage');
    }

    console.log(`Generating QR code for order ${order_id}, stage: ${stage}`);

    // Validate the user has permission for this order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    // Check if user is authorized for this order
    const isAuthorized = order.buyer_id === user.id || 
                        order.seller_id === user.id || 
                        order.driver_id === user.id || 
                        order.shop_id === user.id;

    if (!isAuthorized) {
      throw new Error('Not authorized to generate QR code for this order');
    }

    // Generate QR code identifier
    const qrIdentifier = `QR_${stage.toUpperCase()}_${order_id.replace(/-/g, '')}_${Date.now()}`;
    
    // Generate the QR code data URL
    const qrCodeDataURL = generateQRCodeDataURL(qrIdentifier);

    // Update the order with the new QR code
    const updateField = stage === 'SELLER_TO_DRIVER' ? 'seller_to_driver_qr' :
                       stage === 'DRIVER_TO_SHOP' ? 'driver_to_shop_qr' :
                       stage === 'SHOP_TO_BUYER' ? 'shop_to_buyer_qr' : null;

    if (updateField) {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ [updateField]: qrIdentifier })
        .eq('id', order_id);

      if (updateError) {
        console.error('Order update error:', updateError);
        throw new Error('Failed to update order with QR code');
      }
    }

    console.log(`QR code generated successfully: ${qrIdentifier}`);

    return new Response(
      JSON.stringify({
        success: true,
        qr_code: qrIdentifier,
        qr_data_url: qrCodeDataURL,
        stage: stage,
        order_id: order_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('QR generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});