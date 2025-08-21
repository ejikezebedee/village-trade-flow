-- Fix function parameter issue by dropping and recreating
DROP FUNCTION IF EXISTS public.update_affiliate_tier(uuid);

CREATE OR REPLACE FUNCTION public.update_affiliate_tier(p_affiliate_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  affiliate_stats RECORD;
  new_tier TEXT;
BEGIN
  -- Get affiliate statistics  
  SELECT 
    total_referrals,
    total_sales,
    commission_tier as current_tier
  INTO affiliate_stats
  FROM public.affiliates 
  WHERE id = p_affiliate_id;
  
  -- Determine new tier based on performance
  SELECT tier_name INTO new_tier
  FROM public.affiliate_tiers
  WHERE min_referrals <= COALESCE(affiliate_stats.total_referrals, 0)
    AND min_sales <= COALESCE(affiliate_stats.total_sales, 0)
    AND is_active = true
  ORDER BY min_referrals DESC, min_sales DESC
  LIMIT 1;
  
  -- Update tier if changed
  IF new_tier IS NOT NULL AND new_tier != affiliate_stats.current_tier THEN
    UPDATE public.affiliates
    SET commission_tier = new_tier,
        updated_at = now()
    WHERE id = p_affiliate_id;
    
    RETURN new_tier;
  END IF;
  
  RETURN COALESCE(affiliate_stats.current_tier, 'bronze');
END;
$function$;

-- Add remaining function hardening for completeness
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  p_identifier text, 
  p_action text, 
  p_max_attempts integer DEFAULT 10, 
  p_window_minutes integer DEFAULT 60
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  current_attempts integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old records
  DELETE FROM public.rate_limit_tracking 
  WHERE last_attempt < window_start;
  
  -- Get current attempts
  SELECT COALESCE(attempt_count, 0) INTO current_attempts
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier 
    AND action_type = p_action
    AND first_attempt > window_start;
  
  -- Check if limit exceeded
  IF current_attempts >= p_max_attempts THEN
    -- Update blocked status
    UPDATE public.rate_limit_tracking
    SET is_blocked = true,
        blocked_until = now() + INTERVAL '15 minutes'
    WHERE identifier = p_identifier 
      AND action_type = p_action;
      
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limit_tracking (identifier, action_type, attempt_count)
  VALUES (p_identifier, p_action, 1)
  ON CONFLICT (identifier, action_type)
  DO UPDATE SET 
    attempt_count = rate_limit_tracking.attempt_count + 1,
    last_attempt = now();
  
  RETURN true;
END;
$function$;

-- Security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'info'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.security_audit (
    event_type,
    user_id,
    ip_address,
    user_agent,
    event_data,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_event_data,
    p_severity
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;