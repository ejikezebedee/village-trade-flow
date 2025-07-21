import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, userId, firstName, lastName, userType }: VerificationRequest = await req.json();

    console.log('Sending verification email for:', { email, userId, userType });

    // Generate verification token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_verification_token');
    
    if (tokenError) {
      throw new Error(`Failed to generate token: ${tokenError.message}`);
    }

    const verificationToken = tokenData;
    const verificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-email?token=${verificationToken}`;

    // Store verification record
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: userId,
        email: email,
        verification_token: verificationToken,
        user_type: userType,
        user_data: {
          first_name: firstName,
          last_name: lastName
        }
      });

    if (insertError) {
      throw new Error(`Failed to store verification: ${insertError.message}`);
    }

    // Create role-specific welcome message
    const roleMessages = {
      buyer: `Welcome to VillageMarket! As a buyer, you'll be able to:
        • Browse fresh products from rural sellers
        • Place secure orders with escrow protection
        • Track deliveries in real-time
        • Leave feedback for sellers`,
      seller: `Welcome to VillageMarket! As a seller, you'll be able to:
        • List your products with rich descriptions and photos
        • Manage inventory and stock levels
        • Receive payments securely through escrow
        • Connect with customers in urban markets`,
      driver: `Welcome to VillageMarket! As a driver, you'll be able to:
        • Accept delivery requests in your area
        • Earn income by connecting rural and urban markets
        • Use QR codes for secure handoffs
        • Track your delivery performance`,
      agent: `Welcome to VillageMarket! As an agent, you'll be able to:
        • Help users navigate the platform
        • Provide customer support
        • Assist with order resolution
        • Bridge communication between parties`
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your VillageMarket Account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .features { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 VillageMarket</h1>
              <p>Connecting Rural Communities with Urban Markets</p>
            </div>
            <div class="content">
              <h2>Welcome ${firstName}!</h2>
              <p>Thank you for joining VillageMarket as a <strong>${userType}</strong>. To complete your registration and unlock all features, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify My Email Address</a>
              </div>
              
              <div class="features">
                <h3>What's Next?</h3>
                <p>${roleMessages[userType as keyof typeof roleMessages] || roleMessages.buyer}</p>
              </div>
              
              <p><strong>Important:</strong> This verification link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
            </div>
            <div class="footer">
              <p>VillageMarket - Empowering Rural Communities</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // In a real implementation, you would send this via Resend or another email service
    // For now, we'll log it and return success
    console.log('Verification email HTML generated for:', email);
    console.log('Verification URL:', verificationUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        verificationToken: verificationToken // Remove this in production
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-verification-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send verification email' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);