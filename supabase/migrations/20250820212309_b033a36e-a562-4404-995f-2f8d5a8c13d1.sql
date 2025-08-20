-- EMERGENCY FIX: Infinite Recursion in Profiles RLS Policies
-- This migration fixes the infinite recursion errors that are currently breaking the database

-- First, drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can only access their own profile data" ON public.profiles;

-- Create a safe, non-recursive policy using auth.uid() directly
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Continue fixing remaining critical functions with missing search_path
-- Batch update all remaining functions to add SET search_path = ''

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  errors TEXT[] := '{}';
  result JSONB;
BEGIN
  -- Minimum 8 characters
  IF LENGTH(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Must contain uppercase
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Must contain lowercase
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Must contain number
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Must contain symbol
  IF password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  result := jsonb_build_object(
    'is_valid', array_length(errors, 1) IS NULL,
    'errors', to_jsonb(errors)
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles_progression (user_id, user_role)
  VALUES (NEW.user_id, COALESCE(NEW.user_type, 'buyer'))
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Insert status change record when order status or stage changes
  IF (OLD.order_status != NEW.order_status) OR (OLD.current_stage != NEW.current_stage) THEN
    INSERT INTO public.order_status_history (
      order_id,
      previous_status,
      new_status,
      previous_stage,
      new_stage,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.order_status,
      NEW.order_status,
      OLD.current_stage,
      NEW.current_stage,
      CASE 
        WHEN NEW.current_stage = 'completed' THEN 'qr_scan_delivery_confirmed'
        WHEN NEW.current_stage = 'in_transit' THEN 'qr_scan_pickup_confirmed'
        WHEN NEW.current_stage = 'shop_delivery' THEN 'qr_scan_shop_delivered'
        ELSE 'automatic_status_update'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Remove potentially dangerous characters and scripts
  RETURN regexp_replace(
    regexp_replace(input_text, '<[^>]*>', '', 'g'), 
    '[<>&"'']', '', 'g'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  avg_rating numeric;
  total_ratings integer;
  product_record public.products%ROWTYPE;
  order_record public.orders%ROWTYPE;
BEGIN
  -- Get order and product details
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Only update for product feedback
  IF NEW.feedback_type = 'product' THEN
    -- Calculate new average rating for the product
    SELECT 
      AVG(f.rating)::numeric(3,2),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.feedback f
    JOIN public.orders o ON f.order_id = o.id
    WHERE o.product_name = order_record.product_name
    AND o.seller_id = order_record.seller_id
    AND f.feedback_type = 'product';
    
    -- Update product statistics
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix critical authentication and authorization functions
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND user_role IN ('admin', 'moderator')
  );
$$;

-- Fix security check functions
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts INTEGER;
  is_blocked BOOLEAN := false;
  block_expires_at TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Clean up old rate limit records
  DELETE FROM public.rate_limit_tracking 
  WHERE last_attempt < now() - (p_window_minutes || ' minutes')::interval
    AND NOT is_blocked;
  
  -- Check current attempts
  SELECT attempt_count, blocked_until INTO current_attempts, block_expires_at
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier 
    AND action_type = p_action_type;
  
  -- Check if currently blocked
  IF block_expires_at IS NOT NULL AND block_expires_at > now() THEN
    result := jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', block_expires_at,
      'attempts_remaining', 0
    );
    RETURN result;
  END IF;
  
  -- Initialize if doesn't exist
  IF current_attempts IS NULL THEN
    INSERT INTO public.rate_limit_tracking (identifier, action_type)
    VALUES (p_identifier, p_action_type);
    current_attempts := 1;
  ELSE
    -- Increment attempts
    current_attempts := current_attempts + 1;
    UPDATE public.rate_limit_tracking 
    SET attempt_count = current_attempts,
        last_attempt = now()
    WHERE identifier = p_identifier AND action_type = p_action_type;
  END IF;
  
  -- Check if limit exceeded
  IF current_attempts > p_max_attempts THEN
    -- Block for exponential backoff
    block_expires_at := now() + (power(2, LEAST(current_attempts - p_max_attempts, 6)) || ' minutes')::interval;
    
    UPDATE public.rate_limit_tracking 
    SET is_blocked = true,
        blocked_until = block_expires_at
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    result := jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', block_expires_at,
      'attempts_remaining', 0
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_remaining', p_max_attempts - current_attempts
    );
  END IF;
  
  RETURN result;
END;
$$;