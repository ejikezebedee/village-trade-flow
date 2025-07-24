import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordCheckRequest {
  password: string;
  action: 'check_breach' | 'validate_strength';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, action }: PasswordCheckRequest = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case 'check_breach': {
        // Check password against HaveIBeenPwned API
        const sha1 = await hashPassword(password);
        const prefix = sha1.substring(0, 5);
        const suffix = sha1.substring(5).toUpperCase();

        try {
          const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
              'User-Agent': 'VillageMarket-Security-Check'
            }
          });

          if (!response.ok) {
            console.warn('HaveIBeenPwned API unavailable, allowing password');
            return new Response(
              JSON.stringify({ 
                isBreached: false, 
                warning: 'Breach check service temporarily unavailable'
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const data = await response.text();
          const hashes = data.split('\n');
          
          for (const hash of hashes) {
            const [hashSuffix, count] = hash.split(':');
            if (hashSuffix === suffix) {
              return new Response(
                JSON.stringify({ 
                  isBreached: true, 
                  breachCount: parseInt(count),
                  message: 'This password has been found in data breaches. Please choose a different password.'
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }

          return new Response(
            JSON.stringify({ 
              isBreached: false,
              message: 'Password has not been found in known data breaches'
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );

        } catch (apiError) {
          console.error('Error checking password breach:', apiError);
          // Fail open - allow password if service is down
          return new Response(
            JSON.stringify({ 
              isBreached: false, 
              warning: 'Unable to verify password against breach database'
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case 'validate_strength': {
        const validation = validatePasswordStrength(password);
        return new Response(
          JSON.stringify(validation),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error: any) {
    console.error("Error in password-security function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    suggestions.push('Use at least 8 characters');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add uppercase letters (A-Z)');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters (a-z)');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add numbers (0-9)');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Add special characters (!@#$%^&*)');
  } else {
    score += 2;
  }

  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /012|123|234|345|456|567|678|789|890/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    /password|admin|user|login|welcome|qwerty|123456/i, // Common words
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 2);
      suggestions.push('Avoid common patterns and dictionary words');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 5), // Cap at 5
    errors,
    suggestions
  };
}

serve(handler);