-- =====================================================================
-- COMPREHENSIVE FUNCTION HARDENING - PART 3: REMAINING FUNCTIONS
-- =====================================================================
-- Continue hardening the remaining functions with SET search_path = ''

-- Update remaining core functions

-- Update check_rate_limit_enhanced
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 10, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts integer;
  blocked_until_time timestamp with time zone;
  is_currently_blocked boolean;
BEGIN
  -- Check if currently blocked
  SELECT 
    COALESCE(SUM(attempt_count), 0),
    MAX(blocked_until),
    bool_or(is_blocked AND blocked_until > now())
  INTO current_attempts, blocked_until_time, is_currently_blocked
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND first_attempt > now() - (p_window_minutes || ' minutes')::interval;
  
  -- If currently blocked, return false
  IF is_currently_blocked THEN
    RETURN false;
  END IF;
  
  -- Check if limit would be exceeded
  IF current_attempts >= p_max_attempts THEN
    -- Block for exponential backoff: 2^attempts minutes, max 60 minutes
    INSERT INTO public.rate_limit_tracking (
      identifier, action_type, attempt_count, blocked_until, is_blocked
    ) VALUES (
      p_identifier, p_action_type, 1, 
      now() + LEAST(POWER(2, current_attempts), 60) * INTERVAL '1 minute',
      true
    )
    ON CONFLICT (identifier, action_type) DO UPDATE SET
      attempt_count = rate_limit_tracking.attempt_count + 1,
      last_attempt = now(),
      blocked_until = now() + LEAST(POWER(2, EXCLUDED.attempt_count), 60) * INTERVAL '1 minute',
      is_blocked = true;
    
    -- Log security event for blocking
    INSERT INTO public.security_audit (
      event_type, event_data, severity, ip_address
    ) VALUES (
      'rate_limit_exceeded', 
      jsonb_build_object(
        'identifier', p_identifier,
        'action_type', p_action_type,
        'attempts', current_attempts,
        'blocked_until', blocked_until_time
      ),
      'warning',
      inet(split_part(p_identifier, '_', 1))
    );
    
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limit_tracking (identifier, action_type)
  VALUES (p_identifier, p_action_type)
  ON CONFLICT (identifier, action_type) DO UPDATE SET
    attempt_count = rate_limit_tracking.attempt_count + 1,
    last_attempt = now();
  
  RETURN true;
END;
$$;

-- Update check_security_health
CREATE OR REPLACE FUNCTION public.check_security_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  health_status jsonb;
  rls_tables integer;
  total_tables integer;
  hardened_functions integer;
  total_functions integer;
  active_sessions integer;
  failed_logins integer;
BEGIN
  -- Check RLS coverage
  SELECT 
    COUNT(*) FILTER (WHERE c.relrowsecurity = true),
    COUNT(*)
  INTO rls_tables, total_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' 
    AND n.nspname = 'public';
  
  -- Check function hardening
  SELECT 
    COUNT(*) FILTER (WHERE pg_get_functiondef(p.oid) LIKE '%SET search_path = %'),
    COUNT(*)
  INTO hardened_functions, total_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f','p');
  
  -- Check active sessions and security events
  SELECT COUNT(*) INTO active_sessions
  FROM public.secure_admin_sessions 
  WHERE expires_at > now() AND is_active = true;
  
  SELECT COUNT(*) INTO failed_logins
  FROM public.admin_security_audit
  WHERE action_type LIKE '%login%' 
    AND success = false 
    AND created_at > now() - INTERVAL '1 hour';
  
  health_status := jsonb_build_object(
    'rls_coverage', jsonb_build_object(
      'enabled', rls_tables,
      'total', total_tables,
      'percentage', ROUND((rls_tables::float / NULLIF(total_tables, 0)) * 100, 2)
    ),
    'function_hardening', jsonb_build_object(
      'hardened', hardened_functions,
      'total', total_functions,
      'percentage', ROUND((hardened_functions::float / NULLIF(total_functions, 0)) * 100, 2)
    ),
    'session_security', jsonb_build_object(
      'active_admin_sessions', active_sessions,
      'failed_logins_last_hour', failed_logins
    ),
    'timestamp', now()
  );
  
  RETURN health_status;
END;
$$;

-- Update check_stock_levels
CREATE OR REPLACE FUNCTION public.check_stock_levels()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  alert_message text;
  low_stock_threshold integer := 5;
BEGIN
  -- Check for low stock alert
  IF NEW.stock_quantity <= low_stock_threshold AND NEW.stock_quantity > 0 THEN
    alert_message := 'Low stock warning: ' || NEW.name || ' has only ' || NEW.stock_quantity || ' units left.';
    
    INSERT INTO public.stock_alerts (product_id, seller_id, alert_type, threshold_quantity, message)
    VALUES (NEW.id, NEW.seller_id, 'low_stock', low_stock_threshold, alert_message)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check for out of stock alert
  IF NEW.stock_quantity = 0 AND OLD.stock_quantity > 0 THEN
    alert_message := 'Out of stock: ' || NEW.name || ' is now sold out and needs restocking.';
    
    INSERT INTO public.stock_alerts (product_id, seller_id, alert_type, message)
    VALUES (NEW.id, NEW.seller_id, 'out_of_stock', alert_message)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update cleanup_expired_verifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete expired email verifications
  DELETE FROM public.email_verifications 
  WHERE expires_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.security_audit (
    event_type, event_data, severity
  ) VALUES (
    'cleanup_expired_verifications',
    jsonb_build_object('deleted_count', deleted_count),
    'info'
  );
  
  RETURN deleted_count;
END;
$$;

-- Update cleanup_new_arrival_tags
CREATE OR REPLACE FUNCTION public.cleanup_new_arrival_tags()
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Remove 'new-arrival' tag from products older than 30 days
  UPDATE public.products
  SET tags = array_remove(tags, 'new-arrival'),
      updated_at = now()
  WHERE 'new-arrival' = ANY(tags)
    AND created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Update create_delivery_tracking
CREATE OR REPLACE FUNCTION public.create_delivery_tracking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  tracking_number text;
BEGIN
  IF NEW.order_status = 'confirmed' AND OLD.order_status = 'pending' THEN
    -- Generate tracking number
    tracking_number := 'TRK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Create delivery tracking record
    INSERT INTO public.delivery_tracking (
      order_id, tracking_number, current_holder_type, current_holder_id,
      estimated_delivery_time, current_location
    ) VALUES (
      NEW.id, tracking_number, 'seller', NEW.seller_id,
      now() + INTERVAL '3 days', 'Seller Location'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_feedback_prompts  
CREATE OR REPLACE FUNCTION public.create_feedback_prompts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Create feedback prompt when order is delivered
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    INSERT INTO public.feedback_prompts (
      order_id, user_id, prompt_type, is_active
    ) VALUES (
      NEW.id, NEW.buyer_id, 'order_feedback', true
    );
    
    -- Also prompt seller for delivery feedback
    INSERT INTO public.feedback_prompts (
      order_id, user_id, prompt_type, is_active  
    ) VALUES (
      NEW.id, NEW.seller_id, 'delivery_feedback', true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_notification
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_data jsonb DEFAULT NULL::jsonb, p_priority text DEFAULT 'normal'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Update create_payment_notification
CREATE OR REPLACE FUNCTION public.create_payment_notification(p_transaction_id uuid, p_order_id uuid, p_notification_type text, p_recipient_type text, p_title text, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient_id uuid;
  notification_id uuid;
BEGIN
  -- Get recipient based on type
  IF p_recipient_type = 'buyer' THEN
    SELECT buyer_id INTO recipient_id FROM public.orders WHERE id = p_order_id;
  ELSIF p_recipient_type = 'seller' THEN
    SELECT seller_id INTO recipient_id FROM public.orders WHERE id = p_order_id;
  ELSE
    RAISE EXCEPTION 'Invalid recipient type: %', p_recipient_type;
  END IF;
  
  -- Create notification
  SELECT public.create_notification(
    recipient_id,
    p_notification_type,
    p_title,
    p_body,
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'order_id', p_order_id,
      'recipient_type', p_recipient_type
    ),
    'high'
  ) INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Update create_security_alert
CREATE OR REPLACE FUNCTION public.create_security_alert(p_alert_type text, p_severity text, p_title text, p_message text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.security_alerts (
        alert_type, severity, title, message, metadata
    ) VALUES (
        p_alert_type, p_severity, p_title, p_message, p_metadata
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$;

-- Update create_two_factor_code
CREATE OR REPLACE FUNCTION public.create_two_factor_code(p_user_id uuid, p_method text DEFAULT 'email', p_expires_minutes integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  otp_code text;
  expires_at timestamp with time zone;
  result jsonb;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  expires_at := now() + (p_expires_minutes || ' minutes')::interval;
  
  -- Store the OTP (hashed for security)
  INSERT INTO public.two_factor_codes (
    user_id, code_hash, method, expires_at, is_used
  ) VALUES (
    p_user_id, 
    encode(digest(otp_code, 'sha256'), 'hex'),
    p_method,
    expires_at,
    false
  )
  ON CONFLICT (user_id, method) DO UPDATE SET
    code_hash = encode(digest(otp_code, 'sha256'), 'hex'),
    expires_at = expires_at,
    created_at = now(),
    is_used = false;
  
  -- Log the OTP creation
  INSERT INTO public.security_audit (
    user_id, event_type, event_data, severity
  ) VALUES (
    p_user_id,
    'two_factor_code_created',
    jsonb_build_object(
      'method', p_method,
      'expires_at', expires_at
    ),
    'info'
  );
  
  result := jsonb_build_object(
    'code', otp_code,
    'expires_at', expires_at,
    'method', p_method
  );
  
  RETURN result;
END;
$$;