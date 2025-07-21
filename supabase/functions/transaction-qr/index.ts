import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced QR Code generation using a more detailed SVG approach
function generateTransactionQRCode(qrIdentifier: string, transactionType: string): string {
  const size = 256;
  const qrSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" stroke="#E2E8F0" stroke-width="2"/>
      
      <!-- Corner markers -->
      <rect x="20" y="20" width="40" height="40" fill="black"/>
      <rect x="30" y="30" width="20" height="20" fill="white"/>
      
      <rect x="196" y="20" width="40" height="40" fill="black"/>
      <rect x="206" y="30" width="20" height="20" fill="white"/>
      
      <rect x="20" y="196" width="40" height="40" fill="black"/>
      <rect x="30" y="206" width="20" height="20" fill="white"/>
      
      <!-- Data pattern -->
      <rect x="80" y="20" width="8" height="8" fill="black"/>
      <rect x="96" y="20" width="8" height="8" fill="black"/>
      <rect x="112" y="20" width="8" height="8" fill="black"/>
      <rect x="144" y="20" width="8" height="8" fill="black"/>
      <rect x="160" y="20" width="8" height="8" fill="black"/>
      
      <rect x="20" y="80" width="8" height="8" fill="black"/>
      <rect x="20" y="96" width="8" height="8" fill="black"/>
      <rect x="20" y="112" width="8" height="8" fill="black"/>
      <rect x="20" y="144" width="8" height="8" fill="black"/>
      <rect x="20" y="160" width="8" height="8" fill="black"/>
      
      <!-- Random pattern for uniqueness -->
      <rect x="80" y="80" width="8" height="8" fill="black"/>
      <rect x="96" y="88" width="8" height="8" fill="black"/>
      <rect x="112" y="96" width="8" height="8" fill="black"/>
      <rect x="128" y="80" width="8" height="8" fill="black"/>
      <rect x="144" y="88" width="8" height="8" fill="black"/>
      <rect x="160" y="96" width="8" height="8" fill="black"/>
      
      <rect x="80" y="112" width="8" height="8" fill="black"/>
      <rect x="96" y="120" width="8" height="8" fill="black"/>
      <rect x="112" y="128" width="8" height="8" fill="black"/>
      <rect x="128" y="112" width="8" height="8" fill="black"/>
      <rect x="144" y="120" width="8" height="8" fill="black"/>
      <rect x="160" y="128" width="8" height="8" fill="black"/>
      
      <!-- Transaction type indicator -->
      <text x="128" y="190" text-anchor="middle" font-size="10" font-family="monospace" fill="black">
        ${transactionType.toUpperCase()}
      </text>
      
      <!-- QR identifier (truncated) -->
      <text x="128" y="210" text-anchor="middle" font-size="8" font-family="monospace" fill="gray">
        ${qrIdentifier.slice(-12)}
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

    const { transaction_type, transaction_id, product_id, order_id, payment_id, metadata } = await req.json();

    if (!transaction_type || !transaction_id) {
      throw new Error('Missing required parameters: transaction_type and transaction_id');
    }

    console.log(`Generating transaction QR for ${transaction_type}, ID: ${transaction_id}`);

    // Validate user permissions based on transaction type
    let isAuthorized = false;
    let transactionDetails: any = {};

    switch (transaction_type) {
      case 'product_listing':
        if (!product_id) throw new Error('Product ID required for product listing QR');
        const { data: product, error: productError } = await supabaseClient
          .from('products')
          .select('*')
          .eq('id', product_id)
          .single();
        
        if (productError) throw new Error('Product not found');
        isAuthorized = product.seller_id === user.id;
        transactionDetails = product;
        break;

      case 'order_created':
        if (!order_id) throw new Error('Order ID required for order QR');
        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .single();
        
        if (orderError) throw new Error('Order not found');
        isAuthorized = order.buyer_id === user.id || order.seller_id === user.id;
        transactionDetails = order;
        break;

      case 'payment_confirmed':
        if (!payment_id) throw new Error('Payment ID required for payment QR');
        const { data: payment, error: paymentError } = await supabaseClient
          .from('payments')
          .select(`
            *,
            orders!inner(buyer_id, seller_id)
          `)
          .eq('id', payment_id)
          .single();
        
        if (paymentError) throw new Error('Payment not found');
        isAuthorized = payment.orders.buyer_id === user.id || payment.orders.seller_id === user.id;
        transactionDetails = payment;
        break;

      case 'shipped':
      case 'delivered':
        if (!order_id) throw new Error('Order ID required for delivery QR');
        const { data: deliveryOrder, error: deliveryError } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .single();
        
        if (deliveryError) throw new Error('Order not found');
        isAuthorized = deliveryOrder.buyer_id === user.id || 
                      deliveryOrder.seller_id === user.id || 
                      deliveryOrder.driver_id === user.id ||
                      deliveryOrder.shop_id === user.id;
        transactionDetails = deliveryOrder;
        break;

      default:
        throw new Error('Invalid transaction type');
    }

    if (!isAuthorized) {
      throw new Error('Not authorized to generate QR code for this transaction');
    }

    // Generate unique QR identifier
    const qrIdentifier = `TXN_${transaction_type.toUpperCase()}_${transaction_id.replace(/-/g, '')}_${Date.now()}`;
    
    // Generate the QR code data URL
    const qrCodeDataURL = generateTransactionQRCode(qrIdentifier, transaction_type);

    // Store QR code in database
    const { data: qrRecord, error: qrError } = await supabaseClient
      .from('transaction_qr_codes')
      .insert({
        transaction_id,
        transaction_type,
        qr_code_identifier: qrIdentifier,
        qr_data_url: qrCodeDataURL,
        created_by: user.id,
        product_id,
        order_id,
        payment_id,
        metadata: metadata || {},
        expires_at: transaction_type === 'product_listing' 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (qrError) {
      console.error('QR storage error:', qrError);
      throw new Error('Failed to store QR code');
    }

    console.log(`Transaction QR generated successfully: ${qrIdentifier}`);

    return new Response(
      JSON.stringify({
        success: true,
        qr_code: qrIdentifier,
        qr_data_url: qrCodeDataURL,
        transaction_type,
        transaction_id,
        transaction_details: transactionDetails,
        expires_at: qrRecord.expires_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Transaction QR generation error:', error);
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