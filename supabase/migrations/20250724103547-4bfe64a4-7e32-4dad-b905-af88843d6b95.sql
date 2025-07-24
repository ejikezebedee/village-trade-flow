-- Phase 2 & 3: Critical Security Improvements

-- 1. Fix search path vulnerabilities for critical functions
CREATE OR REPLACE FUNCTION public.can_user_transfer(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_limits RECORD;
  user_wallet RECORD;
  transaction_fee DECIMAL;
  total_amount DECIMAL;
BEGIN
  -- Check if user is verified
  IF NOT public.can_user_transact(p_user_id, p_amount) THEN
    RETURN false;
  END IF;
  
  -- Get user limits and wallet info securely
  SELECT * INTO user_limits FROM public.transfer_limits WHERE user_id = p_user_id;
  SELECT * INTO user_wallet FROM public.user_wallets WHERE user_id = p_user_id AND is_active = true;
  
  IF user_wallet.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate fees and check limits
  transaction_fee := public.calculate_transaction_fee(p_amount, 'wallet_transfer');
  total_amount := p_amount + transaction_fee;
  
  RETURN user_wallet.escrow_balance >= total_amount;
END;
$function$;

-- 2. Create password history table for reuse prevention
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for password history
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their password history"
ON public.password_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage password history"
ON public.password_history FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Reduce OTP expiry time to 5 minutes
CREATE OR REPLACE FUNCTION public.generate_short_lived_otp()
RETURNS TABLE(code TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  otp_code TEXT;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiry to 5 minutes from now (enhanced security)
  expiry_time := now() + INTERVAL '5 minutes';
  
  RETURN QUERY SELECT otp_code, expiry_time;
END;
$function$;

-- 4. Create audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  event_data JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info', -- info, warning, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for security audit
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security audit logs"
ON public.security_audit FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can create security audit logs"
ON public.security_audit FOR INSERT
WITH CHECK (true);

-- 5. Session management improvements
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 minutes'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Function to invalidate sessions on password change
CREATE OR REPLACE FUNCTION public.invalidate_user_sessions_on_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Invalidate all active sessions when password changes
  UPDATE public.user_sessions 
  SET is_active = false, 
      expires_at = now()
  WHERE user_id = NEW.id 
    AND is_active = true;
    
  -- Log the security event
  INSERT INTO public.security_audit (
    event_type, user_id, event_data, severity
  ) VALUES (
    'password_changed', 
    NEW.id, 
    jsonb_build_object('sessions_invalidated', true),
    'warning'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auth.users password changes
CREATE OR REPLACE TRIGGER invalidate_sessions_on_password_change
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_sessions_on_password_change();

-- 7. Rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  action_type TEXT NOT NULL, -- login, signup, 2fa, etc.
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false
);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
ON public.rate_limit_tracking(identifier, action_type);

-- Enable RLS for rate limiting
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
ON public.rate_limit_tracking FOR ALL
USING (true);