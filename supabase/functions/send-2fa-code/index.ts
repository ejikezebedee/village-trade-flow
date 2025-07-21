import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFactorCodeRequest {
  email: string;
  code: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userName }: TwoFactorCodeRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "VillageMarket Security <security@resend.dev>",
      to: [email],
      subject: "Your VillageMarket verification code",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🛡️ Security Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">VillageMarket</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 20px;">Hello ${userName || 'User'},</h2>
            
            <p style="color: #64748b; line-height: 1.6; margin-bottom: 30px;">
              You've requested a two-factor authentication code for your VillageMarket account. 
              Use the code below to complete your sign-in:
            </p>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: 'Monaco', 'Courier New', monospace;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 15px 0 0 0;">
                This code will expire in 10 minutes
              </p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this code, please ignore this email or contact support if you're concerned about unauthorized access.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 14px;">
            <p>This is an automated message from VillageMarket.</p>
            <p>Connecting rural communities with urban markets.</p>
          </div>
        </div>
      `,
    });

    console.log("2FA code email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-2fa-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);