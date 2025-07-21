import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { qr_code, location_data, notes } = await req.json();

    if (!qr_code) {
      throw new Error('Missing QR code');
    }

    console.log(`Scanning QR code: ${qr_code}`);

    // Parse QR code to extract information
    const qrParts = qr_code.split('_');
    if (qrParts.length < 4 || qrParts[0] !== 'QR') {
      throw new Error('Invalid QR code format');
    }

    const stage = qrParts[1] + '_' + qrParts[2]; // e.g., "SELLER_TO_DRIVER"
    const orderIdHex = qrParts[3];
    
    // Convert back to UUID format
    const orderId = [
      orderIdHex.slice(0, 8),
      orderIdHex.slice(8, 12),
      orderIdHex.slice(12, 16),
      orderIdHex.slice(16, 20),
      orderIdHex.slice(20, 32)
    ].join('-');

    console.log(`Parsed order ID: ${orderId}, stage: ${stage}`);

    // Find the order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    // Validate QR code matches the order
    let expectedQRField;
    let nextStage;
    let scanStage;

    switch (stage) {
      case 'SELLER_TO_DRIVER':
        expectedQRField = 'seller_to_driver_qr';
        nextStage = 'in_transit';
        scanStage = 'seller_to_driver';
        // Only driver can scan this
        if (order.driver_id !== user.id) {
          throw new Error('Only the assigned driver can scan this QR code');
        }
        break;
      case 'DRIVER_TO_SHOP':
        expectedQRField = 'driver_to_shop_qr';
        nextStage = 'shop_delivery';
        scanStage = 'driver_to_shop';
        // Only shop owner can scan this
        if (order.shop_id !== user.id) {
          throw new Error('Only the shop owner can scan this QR code');
        }
        break;
      case 'SHOP_TO_BUYER':
        expectedQRField = 'shop_to_buyer_qr';
        nextStage = 'buyer_pickup';
        scanStage = 'shop_to_buyer';
        // Only buyer can scan this
        if (order.buyer_id !== user.id) {
          throw new Error('Only the buyer can scan this QR code');
        }
        break;
      default:
        throw new Error('Invalid QR code stage');
    }

    // Check if the QR code matches what's stored in the order
    if (!order[expectedQRField] || !qr_code.startsWith(order[expectedQRField].split('_').slice(0, 3).join('_'))) {
      throw new Error('QR code does not match order records');
    }

    // Check if QR code has already been scanned
    const { data: existingScan } = await supabaseClient
      .from('qr_scans')
      .select('*')
      .eq('qr_code', qr_code)
      .single();

    if (existingScan) {
      throw new Error('QR code has already been scanned');
    }

    // Record the scan
    const { error: scanError } = await supabaseClient
      .from('qr_scans')
      .insert({
        order_id: orderId,
        qr_code: qr_code,
        scan_stage: scanStage,
        scanned_by: user.id,
        location_data: location_data,
        notes: notes
      });

    if (scanError) {
      console.error('Scan recording error:', scanError);
      throw new Error('Failed to record QR scan');
    }

    // Update order stage
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        current_stage: nextStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      throw new Error('Failed to update order status');
    }

    // If this is the final scan (buyer pickup), mark as completed
    if (nextStage === 'buyer_pickup') {
      setTimeout(async () => {
        await supabaseClient
          .from('orders')
          .update({ 
            current_stage: 'completed',
            order_status: 'delivered'
          })
          .eq('id', orderId);
      }, 1000);
    }

    console.log(`QR scan successful for order ${orderId}, moved to stage: ${nextStage}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR code scanned successfully',
        order_id: orderId,
        previous_stage: order.current_stage,
        new_stage: nextStage,
        scan_stage: scanStage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('QR scan error:', error);
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