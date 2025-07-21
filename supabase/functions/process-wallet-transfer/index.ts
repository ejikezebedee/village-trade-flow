import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferRequest {
  recipient_id: string;
  amount: number;
  message?: string;
  requires_2fa?: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { recipient_id, amount, message, requires_2fa }: TransferRequest = await req.json();

    if (!recipient_id || !amount || amount <= 0) {
      throw new Error('Invalid transfer parameters');
    }

    // Check if sender is verified
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('verification_status, kyc_status, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (!senderProfile || senderProfile.verification_status !== 'verified' || senderProfile.kyc_status !== 'verified') {
      throw new Error('Only verified users can transfer money');
    }

    // Check if recipient exists and is verified
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('user_id, verification_status, kyc_status, first_name, last_name')
      .eq('user_id', recipient_id)
      .single();

    if (!recipientProfile || recipientProfile.verification_status !== 'verified') {
      throw new Error('Recipient must be a verified user');
    }

    // Check if sender can transfer this amount
    const { data: canTransfer } = await supabase
      .rpc('can_user_transfer', { p_user_id: user.id, p_amount: amount });

    if (!canTransfer) {
      throw new Error('Transfer not allowed. Check your balance and limits.');
    }

    // Get sender's wallet
    const { data: senderWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!senderWallet) {
      throw new Error('Sender wallet not found');
    }

    // Calculate transaction fee
    const { data: transactionFee } = await supabase
      .rpc('calculate_transaction_fee', { 
        p_amount: amount, 
        p_transaction_type: 'wallet_transfer' 
      });

    const fee = transactionFee || 0;
    const totalAmount = amount + fee;

    if (senderWallet.escrow_balance < totalAmount) {
      throw new Error('Insufficient escrow balance');
    }

    // Generate reference number
    const { data: referenceNumber } = await supabase
      .rpc('generate_transfer_reference');

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('wallet_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipient_id,
        amount: amount,
        transaction_fee: fee,
        net_amount: amount,
        message: message,
        reference_number: referenceNumber,
        requires_2fa: requires_2fa || false,
        status: requires_2fa ? 'pending_2fa' : 'processing'
      })
      .select()
      .single();

    if (transferError) {
      throw new Error(`Failed to create transfer: ${transferError.message}`);
    }

    // If no 2FA required, process immediately
    if (!requires_2fa) {
      // Update sender's wallet
      const { error: senderUpdateError } = await supabase
        .from('user_wallets')
        .update({
          escrow_balance: senderWallet.escrow_balance - totalAmount,
          total_sent: senderWallet.total_sent + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (senderUpdateError) {
        throw new Error('Failed to update sender wallet');
      }

      // Get or create recipient's wallet
      const { data: recipientWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', recipient_id)
        .single();

      if (!recipientWallet) {
        // Initialize recipient wallet
        await supabase.rpc('initialize_user_wallet', { p_user_id: recipient_id });
      }

      // Update recipient's wallet
      const { error: recipientUpdateError } = await supabase
        .from('user_wallets')
        .update({
          escrow_balance: (recipientWallet?.escrow_balance || 0) + amount,
          total_received: (recipientWallet?.total_received || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', recipient_id);

      if (recipientUpdateError) {
        throw new Error('Failed to update recipient wallet');
      }

      // Update transfer limits
      const { data: senderLimits } = await supabase
        .from('transfer_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (senderLimits) {
        await supabase
          .from('transfer_limits')
          .update({
            daily_spent: senderLimits.daily_spent + amount,
            monthly_spent: senderLimits.monthly_spent + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Mark transfer as completed
      await supabase
        .from('wallet_transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      // Send notifications
      const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`.trim();
      const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`.trim();

      // Notify sender
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'transfer_sent',
        p_title: 'Money Sent Successfully',
        p_message: `You have successfully sent $${amount.toFixed(2)} to ${recipientName}. Reference: ${referenceNumber}`,
        p_data: {
          transfer_id: transfer.id,
          amount: amount,
          fee: fee,
          recipient_name: recipientName,
          reference_number: referenceNumber
        },
        p_priority: 'normal'
      });

      // Notify recipient
      await supabase.rpc('create_notification', {
        p_user_id: recipient_id,
        p_type: 'transfer_received',
        p_title: 'Money Received',
        p_message: `You have received $${amount.toFixed(2)} from ${senderName}. Reference: ${referenceNumber}`,
        p_data: {
          transfer_id: transfer.id,
          amount: amount,
          sender_name: senderName,
          reference_number: referenceNumber,
          message: message
        },
        p_priority: 'high'
      });
    }

    console.log(`Transfer ${requires_2fa ? 'initiated (pending 2FA)' : 'completed'}: ${referenceNumber}`);

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        reference_number: referenceNumber,
        status: transfer.status,
        amount: amount,
        fee: fee,
        total_amount: totalAmount,
        requires_2fa: requires_2fa || false,
        message: requires_2fa 
          ? 'Transfer initiated. Please complete 2FA verification.' 
          : 'Transfer completed successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Transfer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Transfer failed' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);