import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("Invalid user token");
    }

    const { emailType, profileData } = await req.json();

    // Validate required data
    if (!emailType || !profileData) {
      throw new Error("Missing required email data");
    }

    console.log(`Sending ${emailType} email to ${user.email}`);

    // Render email template
    const html = await renderAsync(
      WelcomeEmail({
        userEmail: user.email || "",
        firstName: profileData.first_name || "User",
        lastName: profileData.last_name || "",
        userType: profileData.user_type || "buyer",
        emailType: emailType,
        appUrl: Deno.env.get("SUPABASE_URL")?.replace("https://", "https://app.") || "https://yourapp.com"
      })
    );

    let subject = "";
    switch (emailType) {
      case "welcome":
        subject = `Welcome to VillageMarket, ${profileData.first_name || "User"}!`;
        break;
      case "profile_updated":
        subject = "Your profile has been updated";
        break;
      case "role_assigned":
        subject = `You're now registered as a ${profileData.user_type}`;
        break;
      default:
        subject = "Welcome to VillageMarket";
    }

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "VillageMarket <welcome@villagemarket.app>",
      to: [user.email!],
      subject: subject,
      html: html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailId: emailData?.id 
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error("Error in send-welcome-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
});