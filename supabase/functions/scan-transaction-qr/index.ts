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

    const { qr_code, location_data, notes, scanner_context } = await req.json();

    if (!qr_code) {
      throw new Error('Missing QR code');
    }

    console.log(`Scanning transaction QR code: ${qr_code}`);

    // Find the QR code record
    const { data: qrRecord, error: qrError } = await supabaseClient
      .from('transaction_qr_codes')
      .select(`
        *,
        products(*),
        orders(*),
        payments(*)
      `)
      .eq('qr_code_identifier', qr_code)
      .eq('is_active', true)
      .single();

    if (qrError || !qrRecord) {
      throw new Error('QR code not found or invalid');
    }

    // Check if QR code has expired
    if (new Date(qrRecord.expires_at) < new Date()) {
      await supabaseClient
        .from('transaction_qr_codes')
        .update({ is_active: false })
        .eq('id', qrRecord.id);
      
      throw new Error('QR code has expired');
    }

    // Validate scanner permissions based on transaction type
    let isAuthorizedToScan = false;
    let scanResult: any = {};
    let nextAction: string = '';

    switch (qrRecord.transaction_type) {
      case 'product_listing':
        // Anyone can scan product listing QRs to view details
        isAuthorizedToScan = true;
        scanResult = {
          product: qrRecord.products,
          action: 'view_product_details'
        };
        nextAction = 'Product details retrieved';
        break;

      case 'order_created':
        // Seller, buyer, driver, or shop can scan order QRs
        if (qrRecord.orders) {
          isAuthorizedToScan = qrRecord.orders.buyer_id === user.id || 
                              qrRecord.orders.seller_id === user.id ||
                              qrRecord.orders.driver_id === user.id ||
                              qrRecord.orders.shop_id === user.id;
        }
        scanResult = {
          order: qrRecord.orders,
          action: 'view_order_details'
        };
        nextAction = 'Order details retrieved';
        break;

      case 'payment_confirmed':
        // Buyer or seller can scan payment QRs
        if (qrRecord.orders) {
          isAuthorizedToScan = qrRecord.orders.buyer_id === user.id || 
                              qrRecord.orders.seller_id === user.id;
        }
        scanResult = {
          payment: qrRecord.payments,
          order: qrRecord.orders,
          action: 'view_payment_confirmation'
        };
        nextAction = 'Payment confirmation verified';
        break;

      case 'shipped':
        // Driver or buyer can scan shipping QRs
        if (qrRecord.orders) {
          isAuthorizedToScan = qrRecord.orders.driver_id === user.id || 
                              qrRecord.orders.buyer_id === user.id;
          
          if (qrRecord.orders.driver_id === user.id) {
            nextAction = 'Package picked up for delivery';
          } else {
            nextAction = 'Shipment status verified';
          }
        }
        scanResult = {
          order: qrRecord.orders,
          action: 'confirm_shipment'
        };
        break;

      case 'delivered':
        // Buyer can scan delivery QRs to confirm receipt
        if (qrRecord.orders) {
          isAuthorizedToScan = qrRecord.orders.buyer_id === user.id ||
                              qrRecord.orders.shop_id === user.id;
          
          if (qrRecord.orders.buyer_id === user.id) {
            // Auto-complete order and release payment
            await supabaseClient
              .from('orders')
              .update({ 
                current_stage: 'completed',
                order_status: 'delivered',
                escrow_release_date: new Date().toISOString()
              })
              .eq('id', qrRecord.orders.id);
            
            nextAction = 'Delivery confirmed - Order completed and payment released';
          } else {
            nextAction = 'Delivery confirmed at pickup location';
          }
        }
        scanResult = {
          order: qrRecord.orders,
          action: 'confirm_delivery'
        };
        break;

      default:
        throw new Error('Unknown transaction type');
    }

    if (!isAuthorizedToScan) {
      throw new Error('Not authorized to scan this QR code');
    }

    // Increment scan count
    await supabaseClient
      .from('transaction_qr_codes')
      .update({ 
        scan_count: qrRecord.scan_count + 1,
        metadata: {
          ...qrRecord.metadata,
          last_scanned_at: new Date().toISOString(),
          last_scanned_by: user.id
        }
      })
      .eq('id', qrRecord.id);

    // Create scan log entry
    const { error: logError } = await supabaseClient
      .from('qr_scans')
      .insert({
        order_id: qrRecord.order_id,
        qr_code: qr_code,
        scan_stage: qrRecord.transaction_type,
        scanned_by: user.id,
        location_data,
        notes
      });

    if (logError) {
      console.error('Scan log error:', logError);
    }

    console.log(`Transaction QR scanned successfully: ${qr_code}, action: ${nextAction}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: nextAction,
        transaction_type: qrRecord.transaction_type,
        scan_result: scanResult,
        qr_code,
        scanned_at: new Date().toISOString(),
        scanner_id: user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Transaction QR scan error:', error);
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