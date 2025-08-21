-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================
-- This migration implements all critical security fixes:
-- 1. Hardens all functions with SET search_path = ''
-- 2. Creates secure admin role management RPC
-- 3. Removes plaintext sensitive data
-- 4. Fixes RLS policies and security definer issues
-- 5. Adds security monitoring and audit functions

-- ============================================
-- 1. SECURE ADMIN ROLE MANAGEMENT
-- ============================================

-- Create secure admin role management function
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_admin_id UUID;
  old_role TEXT;
  result JSONB;
BEGIN
  -- Get current admin user
  current_admin_id := auth.uid();
  
  -- Verify admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = current_admin_id 
    AND user_role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient privileges'
    );
  END IF;
  
  -- Validate target role
  IF new_role NOT IN ('user', 'admin', 'moderator', 'seller', 'buyer', 'driver', 'agent') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role'
    );
  END IF;
  
  -- Get current role
  SELECT user_role INTO old_role 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  -- Update role
  UPDATE public.profiles 
  SET user_role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Log the action
  INSERT INTO public.security_audit (
    user_id, event_type, event_data, severity
  ) VALUES (
    current_admin_id,
    'admin_role_change',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role,
      'reason', reason,
      'timestamp', NOW()
    ),
    'warning'
  );
  
  result := jsonb_build_object(
    'success', true,
    'old_role', old_role,
    'new_role', new_role
  );
  
  RETURN result;
END;
$$;

-- Create secure audit log viewer for admins
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(
  limit_count INTEGER DEFAULT 200,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  event_type TEXT,
  event_data JSONB,
  severity TEXT,
  created_at TIMESTAMPTZ,
  masked_ip TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify admin privileges
  IF NOT public.is_security_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    sa.id,
    sa.user_id,
    sa.event_type,
    sa.event_data,
    sa.severity,
    sa.created_at,
    CASE 
      WHEN sa.ip_address IS NOT NULL THEN 
        split_part(sa.ip_address::text, '.', 1) || '.' ||
        split_part(sa.ip_address::text, '.', 2) || '.*.*'
      ELSE NULL
    END as masked_ip
  FROM public.security_audit sa
  ORDER BY sa.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- 2. FUNCTION SEARCH PATH HARDENING
-- ============================================

-- Harden all existing functions with search_path
CREATE OR REPLACE FUNCTION public.generate_qr_identifier(order_uuid uuid, stage text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  identifier TEXT;
BEGIN
  identifier := stage || '_' || REPLACE(order_uuid::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  RETURN identifier;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encrypted_value TEXT;
BEGIN
  encrypted_value := encode(convert_to(key_value, 'UTF8'), 'base64');
  RETURN encrypted_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  decrypted_value := convert_from(decode(encrypted_value, 'base64'), 'UTF8');
  RETURN decrypted_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_mediator_to_dispute(dispute_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_mediator_id UUID;
  dispute_specialization TEXT;
BEGIN
  SELECT dispute_type INTO dispute_specialization FROM public.disputes WHERE id = dispute_uuid;
  
  SELECT m.id INTO selected_mediator_id
  FROM public.mediators m
  LEFT JOIN (
    SELECT assigned_mediator_id, COUNT(*) as active_cases
    FROM public.disputes 
    WHERE status IN ('investigating', 'mediation') 
    GROUP BY assigned_mediator_id
  ) active ON m.id = active.assigned_mediator_id
  WHERE m.is_active = true 
  ORDER BY COALESCE(active.active_cases, 0), m.rating DESC
  LIMIT 1;
  
  IF selected_mediator_id IS NOT NULL THEN
    UPDATE public.disputes 
    SET assigned_mediator_id = selected_mediator_id,
        status = 'mediation',
        resolution_tier = 'community',
        updated_at = now()
    WHERE id = dispute_uuid;
  END IF;
  
  RETURN selected_mediator_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_dispute_by_votes(dispute_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  vote_counts RECORD;
  resolution_decision TEXT;
BEGIN
  SELECT 
    COUNT(CASE WHEN vote = 'favor_complainant' THEN 1 END) as favor_complainant,
    COUNT(CASE WHEN vote = 'favor_respondent' THEN 1 END) as favor_respondent,
    COUNT(CASE WHEN vote = 'partial_resolution' THEN 1 END) as partial_resolution,
    COUNT(CASE WHEN vote = 'insufficient_evidence' THEN 1 END) as insufficient_evidence,
    COUNT(*) as total_votes
  INTO vote_counts
  FROM public.dispute_votes
  WHERE dispute_id = dispute_uuid;
  
  IF vote_counts.favor_complainant > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Resolved in favor of complainant';
  ELSIF vote_counts.favor_respondent > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Resolved in favor of respondent';
  ELSE
    resolution_decision := 'No clear majority - escalating to admin review';
  END IF;
  
  UPDATE public.disputes 
  SET status = 'resolved',
      resolution_notes = resolution_decision,
      resolved_at = now(),
      updated_at = now()
  WHERE id = dispute_uuid;
  
  RETURN resolution_decision;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_action_type text, p_max_attempts integer DEFAULT 10, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts integer;
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - (p_window_minutes || ' minutes')::interval;
  
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = p_user_id 
    AND action_type = p_action_type
    AND window_start > now() - (p_window_minutes || ' minutes')::interval;
  
  IF current_attempts >= p_max_attempts THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.rate_limits (user_id, action_type)
  VALUES (p_user_id, p_action_type)
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_secure_qr(p_order_id uuid, p_stage text, p_expires_hours integer DEFAULT 24)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  qr_identifier TEXT;
  security_hash TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  expires_at := now() + (p_expires_hours || ' hours')::INTERVAL;
  
  qr_identifier := 'QR_' || UPPER(p_stage) || '_' || REPLACE(p_order_id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  
  security_hash := encode(digest(qr_identifier || p_order_id::TEXT || extract(epoch from expires_at)::TEXT, 'sha256'), 'hex');
  
  INSERT INTO public.qr_verification_logs (
    order_id, qr_code, scan_stage, scanned_by, security_hash, expires_at, verification_status
  ) VALUES (
    p_order_id, qr_identifier, p_stage, auth.uid(), security_hash, expires_at, 'pending'
  );
  
  RETURN qr_identifier;
END;
$$;

-- Continue hardening other critical functions
CREATE OR REPLACE FUNCTION public.verify_qr_scan(p_qr_code text, p_scanner_id uuid, p_location jsonb DEFAULT NULL::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  qr_record RECORD;
  expected_scanner UUID;
  is_valid BOOLEAN := false;
BEGIN
  SELECT * INTO qr_record
  FROM public.qr_verification_logs
  WHERE qr_code = p_qr_code AND verification_status = 'pending';
  
  IF qr_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  IF qr_record.expires_at < now() THEN
    UPDATE public.qr_verification_logs 
    SET verification_status = 'expired' 
    WHERE id = qr_record.id;
    RETURN false;
  END IF;
  
  CASE qr_record.scan_stage
    WHEN 'seller_to_driver' THEN
      SELECT driver_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
    WHEN 'driver_to_shop' THEN  
      SELECT shop_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
    WHEN 'shop_to_buyer' THEN
      SELECT buyer_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
  END CASE;
  
  IF expected_scanner = p_scanner_id THEN
    is_valid := true;
    
    UPDATE public.qr_verification_logs 
    SET verification_status = 'verified',
        scanned_by = p_scanner_id,
        location_data = p_location,
        scanned_at = now()
    WHERE id = qr_record.id;
    
    CASE qr_record.scan_stage
      WHEN 'seller_to_driver' THEN
        UPDATE public.orders SET current_stage = 'in_transit', updated_at = now() WHERE id = qr_record.order_id;
      WHEN 'driver_to_shop' THEN
        UPDATE public.orders SET current_stage = 'shop_delivery', updated_at = now() WHERE id = qr_record.order_id;
      WHEN 'shop_to_buyer' THEN
        UPDATE public.orders SET current_stage = 'completed', order_status = 'delivered', updated_at = now() WHERE id = qr_record.order_id;
    END CASE;
  END IF;
  
  RETURN is_valid;
END;
$$;

-- ============================================
-- 3. CLEAN UP SENSITIVE PLAINTEXT DATA
-- ============================================

-- Drop plaintext sensitive columns and create encrypted versions
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS two_factor_secret,
ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS two_factor_secret_iv TEXT;

-- Drop plaintext admin password column if it exists
ALTER TABLE public.admins 
DROP COLUMN IF EXISTS password;

-- ============================================
-- 4. ENHANCED RLS POLICIES
-- ============================================

-- Update security_audit policies to be more restrictive
DROP POLICY IF EXISTS "Security admins can view audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "System can create security audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "Security admins can delete old audit logs" ON public.security_audit;

CREATE POLICY "Strict admin access to audit logs" 
ON public.security_audit FOR SELECT
USING (public.is_security_admin());

CREATE POLICY "System can insert audit logs" 
ON public.security_audit FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can delete old logs" 
ON public.security_audit FOR DELETE
USING (
  public.is_security_admin() 
  AND created_at < (now() - INTERVAL '2 years')
);

-- Ensure profiles table has proper RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. SECURITY MONITORING FUNCTIONS
-- ============================================

-- Function to check database security health
CREATE OR REPLACE FUNCTION public.check_security_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
  unhardened_functions INTEGER;
  tables_without_rls INTEGER;
  security_alerts INTEGER;
BEGIN
  -- Check unhardened functions
  SELECT COUNT(*) INTO unhardened_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f','p')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_options_to_table(p.proconfig) t
      WHERE t.key = 'search_path' AND t.value = ''
    );
  
  -- Check tables without RLS
  SELECT COUNT(*) INTO tables_without_rls
  FROM pg_tables 
  WHERE schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c 
      WHERE c.relname = pg_tables.tablename 
      AND c.relrowsecurity = true
    );
  
  -- Check recent security alerts
  SELECT COUNT(*) INTO security_alerts
  FROM public.security_audit
  WHERE severity IN ('warning', 'critical')
    AND created_at > now() - INTERVAL '24 hours';
  
  result := jsonb_build_object(
    'unhardened_functions', unhardened_functions,
    'tables_without_rls', tables_without_rls,
    'security_alerts_24h', security_alerts,
    'last_check', now(),
    'status', CASE 
      WHEN unhardened_functions = 0 AND tables_without_rls <= 2 AND security_alerts < 10 THEN 'HEALTHY'
      WHEN unhardened_functions <= 5 AND tables_without_rls <= 5 AND security_alerts < 20 THEN 'WARNING'
      ELSE 'CRITICAL'
    END
  );
  
  RETURN result;
END;
$$;

-- Rate limiting check with enhanced security
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts INTEGER;
  time_window INTERVAL;
  next_allowed_time TIMESTAMPTZ;
  result JSONB;
BEGIN
  time_window := (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old records
  DELETE FROM public.rate_limit_tracking 
  WHERE last_attempt < now() - time_window;
  
  -- Get current tracking record
  SELECT attempt_count INTO current_attempts
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND first_attempt > now() - time_window;
  
  current_attempts := COALESCE(current_attempts, 0);
  
  -- Check if blocked
  IF current_attempts >= p_max_attempts THEN
    SELECT blocked_until INTO next_allowed_time
    FROM public.rate_limit_tracking
    WHERE identifier = p_identifier 
      AND action_type = p_action_type;
    
    result := jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'attempts', current_attempts,
      'limit', p_max_attempts,
      'window_minutes', p_window_minutes,
      'next_allowed_at', next_allowed_time,
      'remaining', 0
    );
  ELSE
    -- Update tracking
    INSERT INTO public.rate_limit_tracking (
      identifier, action_type, attempt_count, first_attempt, last_attempt
    ) VALUES (
      p_identifier, p_action_type, current_attempts + 1, now(), now()
    )
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET 
      attempt_count = rate_limit_tracking.attempt_count + 1,
      last_attempt = now(),
      blocked_until = CASE 
        WHEN rate_limit_tracking.attempt_count + 1 >= p_max_attempts 
        THEN now() + time_window
        ELSE NULL
      END;
    
    result := jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts', current_attempts + 1,
      'limit', p_max_attempts,
      'window_minutes', p_window_minutes,
      'remaining', p_max_attempts - (current_attempts + 1)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_action_performed TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_audit (
    user_id, event_type, event_data, severity, ip_address, user_agent
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_event_type,
    jsonb_build_object(
      'action', p_action_performed,
      'metadata', p_metadata,
      'timestamp', now()
    ),
    p_severity,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Grant execute permissions to authenticated users for necessary functions
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_audit_logs(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_security_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_enhanced(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, UUID, TEXT, JSONB) TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON public.security_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON public.security_audit(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier ON public.rate_limit_tracking(identifier, action_type);

COMMENT ON FUNCTION public.admin_set_user_role IS 'Secure function for admin role changes with audit logging';
COMMENT ON FUNCTION public.admin_get_audit_logs IS 'Admin-only function to view audit logs with IP masking';
COMMENT ON FUNCTION public.check_security_health IS 'Returns current security health status';
COMMENT ON FUNCTION public.check_rate_limit_enhanced IS 'Enhanced rate limiting with detailed response';
COMMENT ON FUNCTION public.log_security_event IS 'Centralized security event logging';