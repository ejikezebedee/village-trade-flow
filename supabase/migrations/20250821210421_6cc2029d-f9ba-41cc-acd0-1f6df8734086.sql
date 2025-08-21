-- =====================================================================
-- COMPREHENSIVE FUNCTION HARDENING - PART 2: RECREATE WITH DEPENDENCIES
-- =====================================================================
-- Add SET search_path = '' to all existing functions without dropping them
-- when possible, and handle dependencies properly for others.

-- Add search_path to existing functions using ALTER FUNCTION
-- This approach avoids dependency issues

-- First, let's get a list of functions and update them individually
-- Starting with the ones that have no dependencies

-- Update assign_mediator_to_dispute
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
  -- Get dispute type to match with mediator specialization
  SELECT dispute_type INTO dispute_specialization FROM public.disputes WHERE id = dispute_uuid;
  
  -- Find available mediator
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
  
  -- Update dispute with assigned mediator
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

-- Update audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit (
    user_id,
    event_type,
    event_data,
    severity
  ) VALUES (
    auth.uid(),
    TG_OP || '_' || TG_TABLE_NAME,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old_values', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new_values', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    ),
    'info'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update authenticate_admin
CREATE OR REPLACE FUNCTION public.authenticate_admin(p_username text, p_password text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    admin_record public.admins%ROWTYPE;
    expected_hash TEXT;
    session_token TEXT;
    result JSONB;
BEGIN
    -- Find admin by username
    SELECT * INTO admin_record
    FROM public.admins
    WHERE username = p_username AND is_active = true;
    
    -- Check if admin exists
    IF admin_record.id IS NULL THEN
        -- Log failed attempt
        INSERT INTO public.admin_security_audit (
            action_type, ip_address, user_agent, success, failure_reason
        ) VALUES (
            'admin_login_attempt', p_ip_address, p_user_agent, false, 'Invalid username'
        );
        
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Check if account is locked
    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account temporarily locked');
    END IF;
    
    -- Verify password using new hash if available, fallback to old method
    IF admin_record.password_hash IS NOT NULL AND admin_record.password_salt IS NOT NULL THEN
        expected_hash := (public.hash_password(p_password, admin_record.password_salt)->>'hash');
        IF expected_hash != admin_record.password_hash THEN
            -- Increment failed attempts
            UPDATE public.admins 
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '15 minutes' ELSE NULL END
            WHERE id = admin_record.id;
            
            -- Log failed attempt
            INSERT INTO public.admin_security_audit (
                admin_id, action_type, ip_address, user_agent, success, failure_reason
            ) VALUES (
                admin_record.id, 'admin_login_attempt', p_ip_address, p_user_agent, false, 'Invalid password'
            );
            
            RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
        END IF;
    ELSE
        -- Fallback to old password method (migrate this admin)
        IF admin_record.password != p_password THEN
            -- Increment failed attempts
            UPDATE public.admins 
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '15 minutes' ELSE NULL END
            WHERE id = admin_record.id;
            
            RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
        END IF;
        
        -- Migrate to secure password hashing
        DECLARE
            new_hash_data JSONB;
        BEGIN
            new_hash_data := public.hash_password(p_password);
            UPDATE public.admins 
            SET password_hash = new_hash_data->>'hash',
                password_salt = new_hash_data->>'salt'
            WHERE id = admin_record.id;
        END;
    END IF;
    
    -- Generate session token using base64 encoding
    session_token := encode(gen_random_bytes(32), 'base64');
    
    -- Create session
    INSERT INTO public.secure_admin_sessions (
        admin_id, session_token, expires_at, ip_address, user_agent
    ) VALUES (
        admin_record.id, session_token, now() + INTERVAL '8 hours', p_ip_address, p_user_agent
    );
    
    -- Reset failed login attempts and update last login
    UPDATE public.admins 
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = now()
    WHERE id = admin_record.id;
    
    -- Log successful login
    INSERT INTO public.admin_security_audit (
        admin_id, action_type, ip_address, user_agent, success
    ) VALUES (
        admin_record.id, 'admin_login_success', p_ip_address, p_user_agent, true
    );
    
    result := jsonb_build_object(
        'success', true,
        'admin_id', admin_record.id,
        'username', admin_record.username,
        'role', admin_record.role,
        'session_token', session_token
    );
    
    RETURN result;
END;
$$;

-- Update can_user_transact
CREATE OR REPLACE FUNCTION public.can_user_transact(p_user_id uuid, p_transaction_amount numeric DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_kyc_status TEXT;
  user_kyc_level TEXT;
  max_allowed_amount DECIMAL;
BEGIN
  -- Get user's KYC status
  SELECT kyc_status, kyc_level 
  INTO user_kyc_status, user_kyc_level
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- If user is not verified, block transactions
  IF user_kyc_status != 'verified' THEN
    RETURN false;
  END IF;
  
  -- Get transaction limits for user's KYC level
  SELECT max_transaction_amount 
  INTO max_allowed_amount
  FROM public.kyc_requirements 
  WHERE requirement_level = user_kyc_level AND is_active = true;
  
  -- Check if transaction amount is within limits
  IF p_transaction_amount > COALESCE(max_allowed_amount, 0) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update can_user_transfer
CREATE OR REPLACE FUNCTION public.can_user_transfer(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Update check_password_history
CREATE OR REPLACE FUNCTION public.check_password_history(p_user_id uuid, p_new_password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  history_count INTEGER;
BEGIN
  -- Check if password was used in last 3 passwords
  SELECT COUNT(*) INTO history_count
  FROM public.password_history
  WHERE user_id = p_user_id
    AND password_hash = p_new_password_hash
    AND created_at > now() - INTERVAL '90 days'
  ORDER BY created_at DESC
  LIMIT 3;
  
  RETURN history_count = 0;
END;
$$;

-- Update check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_action_type text, p_max_attempts integer DEFAULT 10, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts integer;
BEGIN
  -- Clean up old rate limit records
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - (p_window_minutes || ' minutes')::interval;
  
  -- Get current attempts in window
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = p_user_id 
    AND action_type = p_action_type
    AND window_start > now() - (p_window_minutes || ' minutes')::interval;
  
  -- Check if limit exceeded
  IF current_attempts >= p_max_attempts THEN
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limits (user_id, action_type)
  VALUES (p_user_id, p_action_type)
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;