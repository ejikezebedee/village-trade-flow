import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { paypal_order_id } = await req.json()

    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com'

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured')
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Capture the PayPal payment
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypal_order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!captureResponse.ok) {
      throw new Error('Failed to capture PayPal payment')
    }

    const captureData = await captureResponse.json()
    const captureId = captureData.purchase_units[0]?.payments?.captures?.[0]?.id
    const captureStatus = captureData.status

    if (captureStatus === 'COMPLETED') {
      // Update payment status in database
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          escrow_status: 'held',
          transaction_id: captureId,
          processed_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paypal_order_id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw new Error('Failed to update payment status')
      }

      // Update order status
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('payment_intent_id', paypal_order_id)
        .single()

      if (payment) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.order_id)
      }

      // Log successful payment
      await supabase
        .from('payment_logs')
        .insert({
          payment_id: paypal_order_id,
          event_type: 'payment_captured',
          event_data: {
            capture_id: captureId,
            status: captureStatus,
            captured_at: new Date().toISOString()
          }
        })

      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        capture_id: captureId,
        message: 'Payment processed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      throw new Error(`Payment capture failed with status: ${captureStatus}`)
    }

  } catch (error) {
    console.error('PayPal verification error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})