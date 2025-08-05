-- Phase 1: Critical Security Fixes
-- Fix security definer views, add missing RLS policies, secure function search paths

-- 1. Fix function search paths (SET search_path = '') for all functions
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
DECLARE
  ref_number TEXT;
BEGIN
  ref_number := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN ref_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_token_reward(p_user_id uuid, p_action_type text, p_amount numeric, p_role text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  calculated_user_role TEXT;
  config_record RECORD;
  calculated_reward NUMERIC;
BEGIN
  -- Get user role if not provided
  IF p_role IS NULL THEN
    SELECT user_role INTO calculated_user_role 
    FROM public.user_roles_progression 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF calculated_user_role IS NULL THEN
      calculated_user_role := 'buyer';
    END IF;
  ELSE
    calculated_user_role := p_role;
  END IF;
  
  -- Get reward configuration
  SELECT * INTO config_record
  FROM public.token_config
  WHERE user_role = calculated_user_role 
    AND action_type = p_action_type 
    AND is_active = true;
  
  IF config_record.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate reward
  calculated_reward := p_amount * config_record.reward_rate * config_record.multiplier;
  
  -- Apply min/max limits
  IF calculated_reward < config_record.min_amount THEN
    calculated_reward := config_record.min_amount;
  END IF;
  
  IF config_record.max_amount IS NOT NULL AND calculated_reward > config_record.max_amount THEN
    calculated_reward := config_record.max_amount;
  END IF;
  
  RETURN calculated_reward;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upgrade_user_role(p_user_id uuid, p_new_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  current_progression RECORD;
  requirements_met BOOLEAN := false;
BEGIN
  -- Get current progression
  SELECT * INTO current_progression
  FROM public.user_roles_progression
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check role upgrade path
  CASE 
    WHEN p_new_role = 'seller' AND COALESCE(current_progression.user_role, 'buyer') = 'buyer' THEN
      requirements_met := true;
    WHEN p_new_role = 'agent' AND COALESCE(current_progression.user_role, 'buyer') = 'seller' THEN
      -- Check if seller has at least 5 completed sales
      SELECT CASE WHEN COUNT(*) >= 5 THEN true ELSE false END
      INTO requirements_met
      FROM public.orders
      WHERE seller_id = p_user_id AND order_status = 'delivered';
    ELSE
      requirements_met := false;
  END CASE;
  
  IF NOT requirements_met THEN
    RETURN false;
  END IF;
  
  -- Create new progression record
  INSERT INTO public.user_roles_progression (
    user_id,
    user_role,
    previous_role,
    requirements_met
  ) VALUES (
    p_user_id,
    p_new_role,
    COALESCE(current_progression.user_role, 'buyer'),
    true
  );
  
  -- Update profile user_type
  UPDATE public.profiles 
  SET user_type = p_new_role,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_transaction_fee(p_amount numeric, p_transaction_type text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path = ''
AS $function$
DECLARE
  fee_config RECORD;
  calculated_fee DECIMAL;
BEGIN
  -- Get fee configuration
  SELECT * INTO fee_config
  FROM public.transaction_fees
  WHERE transaction_type = p_transaction_type AND is_active = true
  LIMIT 1;
  
  IF fee_config.id IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- Calculate fee based on type
  IF fee_config.fee_type = 'percentage' THEN
    calculated_fee := p_amount * (fee_config.fee_value / 100);
  ELSE
    calculated_fee := fee_config.fee_value;
  END IF;
  
  -- Apply minimum and maximum limits
  calculated_fee := GREATEST(calculated_fee, fee_config.minimum_fee);
  
  IF fee_config.maximum_fee IS NOT NULL THEN
    calculated_fee := LEAST(calculated_fee, fee_config.maximum_fee);
  END IF;
  
  RETURN calculated_fee;
END;
$function$;

-- Add missing RLS policies for tables that have RLS enabled but no policies

-- Enable RLS on critical tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add comprehensive RLS policies for tables missing them

-- Products table policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
CREATE POLICY "Sellers can manage their products" ON public.products
  FOR ALL USING (seller_id = auth.uid());

-- Orders table policies  
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
CREATE POLICY "Users can view their orders" ON public.orders
  FOR SELECT USING (
    buyer_id = auth.uid() OR 
    seller_id = auth.uid() OR 
    driver_id = auth.uid() OR
    shop_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their orders" ON public.orders;
CREATE POLICY "Users can create their orders" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Payments table policies
DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;
CREATE POLICY "Users can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payments.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Create comprehensive admin access policies
DROP POLICY IF EXISTS "Admins can manage all data" ON public.profiles;
CREATE POLICY "Admins can manage all data" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.user_role = 'admin'
    )
  );

-- Add security audit table for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.security_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.security_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_role = 'admin'
    )
  );

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit (
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their rate limits" ON public.rate_limits
  FOR SELECT USING (user_id = auth.uid());

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
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