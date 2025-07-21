import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ReceiptRequest {
  transfer_id: string;
  format?: 'json' | 'pdf';
}

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

    const { transfer_id, format = 'json' }: ReceiptRequest = await req.json();

    if (!transfer_id) {
      throw new Error('Transfer ID is required');
    }

    // Verify user has access to this transfer
    const { data: transfer, error: transferError } = await supabase
      .from('wallet_transfers')
      .select('*')
      .eq('id', transfer_id)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .single();

    if (transferError || !transfer) {
      throw new Error('Transfer not found or access denied');
    }

    // Check if receipt already exists
    let { data: existingReceipt, error: receiptError } = await supabase
      .from('transaction_receipts')
      .select('*')
      .eq('transfer_id', transfer_id)
      .single();

    // Create receipt if it doesn't exist
    if (receiptError && receiptError.code === 'PGRST116') {
      const { data: newReceipt } = await supabase
        .rpc('create_transaction_receipt', { p_transfer_id: transfer_id });
      
      if (newReceipt) {
        const { data: receipt } = await supabase
          .from('transaction_receipts')
          .select('*')
          .eq('transfer_id', transfer_id)
          .single();
        
        existingReceipt = receipt;
      }
    }

    if (!existingReceipt) {
      throw new Error('Failed to generate receipt');
    }

    // Update download tracking
    await supabase
      .from('transaction_receipts')
      .update({
        downloaded_at: new Date().toISOString(),
        download_count: existingReceipt.download_count + 1
      })
      .eq('id', existingReceipt.id);

    const receiptData = existingReceipt.receipt_data as any;

    if (format === 'pdf') {
      // Generate PDF receipt (basic HTML to PDF conversion)
      const htmlContent = generateReceiptHTML(receiptData);
      
      return new Response(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="receipt-${existingReceipt.receipt_number}.html"`,
          ...corsHeaders
        }
      });
    }

    // Return JSON receipt
    const receipt = {
      id: existingReceipt.id,
      receipt_number: existingReceipt.receipt_number,
      transfer_details: receiptData,
      generated_at: existingReceipt.generated_at,
      download_count: existingReceipt.download_count + 1
    };

    console.log(`Receipt generated for transfer: ${transfer_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        receipt: receipt
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Receipt generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to generate receipt' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function generateReceiptHTML(receiptData: any): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Receipt - ${receiptData.receipt_number}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
        }
        .receipt-number {
          font-size: 18px;
          color: #666;
          margin-bottom: 5px;
        }
        .status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          ${receiptData.status === 'completed' ? 'background: #10b981; color: white;' : 'background: #f59e0b; color: white;'}
        }
        .section {
          margin: 25px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #374151;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 8px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px dotted #d1d5db;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #6b7280;
        }
        .value {
          color: #374151;
          text-align: right;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
        }
        .total-section {
          background: #ecfdf5;
          border: 2px solid #10b981;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .qr-placeholder {
          width: 80px;
          height: 80px;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VillageMarket</div>
        <div class="receipt-number">Receipt #${receiptData.receipt_number}</div>
        <div class="status">${receiptData.status}</div>
      </div>

      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="row">
          <span class="label">Reference Number:</span>
          <span class="value">${receiptData.reference_number}</span>
        </div>
        <div class="row">
          <span class="label">Date & Time:</span>
          <span class="value">${formatDate(receiptData.created_at)}</span>
        </div>
        ${receiptData.completed_at ? `
        <div class="row">
          <span class="label">Completed:</span>
          <span class="value">${formatDate(receiptData.completed_at)}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">Currency:</span>
          <span class="value">${receiptData.currency}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Parties Involved</div>
        <div class="row">
          <span class="label">From:</span>
          <span class="value">${receiptData.sender.name}</span>
        </div>
        <div class="row">
          <span class="label">To:</span>
          <span class="value">${receiptData.recipient.name}</span>
        </div>
        ${receiptData.message ? `
        <div class="row">
          <span class="label">Message:</span>
          <span class="value">"${receiptData.message}"</span>
        </div>
        ` : ''}
      </div>

      <div class="section total-section">
        <div class="section-title">Amount Summary</div>
        <div class="row">
          <span class="label">Transfer Amount:</span>
          <span class="value">$${Number(receiptData.amount).toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Transaction Fee:</span>
          <span class="value">$${Number(receiptData.transaction_fee).toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Total Processed:</span>
          <span class="value amount">$${Number(receiptData.net_amount).toFixed(2)}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Verification</div>
        <div style="text-align: center;">
          <div class="qr-placeholder">
            QR Code<br>
            Verification
          </div>
          <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
            Scan this code to verify transaction authenticity
          </p>
        </div>
      </div>

      <div class="footer">
        <p><strong>VillageMarket</strong> - Secure Community Marketplace</p>
        <p>This receipt serves as proof of your transaction. Please keep it for your records.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p class="no-print">
          <button onclick="window.print()" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            Print Receipt
          </button>
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);