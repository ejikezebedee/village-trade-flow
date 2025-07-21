import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        generateErrorPage('Invalid verification link', 'The verification token is missing or invalid.'),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verifying email with token:', token);

    // Verify the email and complete registration
    const { data, error } = await supabase.rpc('verify_email_and_complete_registration', {
      p_token: token
    });

    if (error) {
      console.error('Verification error:', error);
      return new Response(
        generateErrorPage('Verification Failed', error.message),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        }
      );
    }

    if (!data?.success) {
      return new Response(
        generateErrorPage('Verification Failed', data?.error || 'Unknown error occurred'),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        }
      );
    }

    console.log('Email verified successfully:', data);

    // Generate success page
    const successPage = generateSuccessPage(data.user_type, data.message);

    return new Response(successPage, {
      status: 200,
      headers: { 'Content-Type': 'text/html', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in verify-email function:', error);
    return new Response(
      generateErrorPage('Server Error', 'An unexpected error occurred. Please try again later.'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
      }
    );
  }
};

function generateSuccessPage(userType: string, message: string): string {
  const dashboardMessages = {
    buyer: 'You can now browse products, place orders, and track deliveries.',
    seller: 'You can now list products, manage inventory, and start selling.',
    driver: 'You can now accept delivery requests and start earning.',
    agent: 'You can now assist users and provide customer support.'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - VillageMarket</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #10b981, #3b82f6);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
          }
          .success-icon { 
            font-size: 60px; 
            color: #10b981; 
            margin-bottom: 20px; 
          }
          .title { 
            color: #1f2937; 
            margin-bottom: 15px; 
            font-size: 28px;
            font-weight: bold;
          }
          .message { 
            color: #6b7280; 
            margin-bottom: 30px; 
            font-size: 16px;
          }
          .user-type-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: capitalize;
            margin-bottom: 20px;
          }
          .next-steps {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
          }
          .button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .button:hover {
            background: #059669;
          }
          .button-secondary {
            background: #6b7280;
          }
          .button-secondary:hover {
            background: #4b5563;
          }
        </style>
        <script>
          // Auto-redirect to app after 10 seconds
          setTimeout(function() {
            window.location.href = '/';
          }, 10000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1 class="title">Email Verified!</h1>
          <div class="user-type-badge">${userType}</div>
          <p class="message">${message}</p>
          
          <div class="next-steps">
            <h3>🎉 You're all set!</h3>
            <p>${dashboardMessages[userType as keyof typeof dashboardMessages] || dashboardMessages.buyer}</p>
          </div>
          
          <div>
            <a href="/" class="button">Go to Dashboard</a>
            <a href="/auth" class="button button-secondary">Sign In</a>
          </div>
          
          <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">
            You will be automatically redirected to the homepage in 10 seconds.
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - VillageMarket</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #ef4444, #f97316);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
          }
          .error-icon { 
            font-size: 60px; 
            color: #ef4444; 
            margin-bottom: 20px; 
          }
          .title { 
            color: #1f2937; 
            margin-bottom: 15px; 
            font-size: 28px;
            font-weight: bold;
          }
          .message { 
            color: #6b7280; 
            margin-bottom: 30px; 
            font-size: 16px;
          }
          .button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">❌</div>
          <h1 class="title">${title}</h1>
          <p class="message">${message}</p>
          
          <div>
            <a href="/auth" class="button">Try Again</a>
            <a href="/" class="button" style="background: #6b7280;">Go Home</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);