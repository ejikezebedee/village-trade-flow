-- =====================================================================
-- COMPREHENSIVE FUNCTION HARDENING: SET search_path = '' FOR ALL FUNCTIONS
-- =====================================================================
-- This migration adds SET search_path = '' to all functions in the public schema
-- for security hardening against function hijacking attacks.

-- Function: admin_get_audit_logs
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(limit_count integer, offset_count integer)
RETURNS TABLE(id uuid, user_id uuid, event_type text, event_data jsonb, ip_address inet, user_agent text, severity text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check admin permissions
  IF NOT public.is_security_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log access attempt
  PERFORM public.log_audit_access_attempt('security_audit');
  
  RETURN QUERY
  SELECT sa.id, sa.user_id, sa.event_type, sa.event_data, sa.ip_address, sa.user_agent, sa.severity, sa.created_at
  FROM public.security_audit sa
  ORDER BY sa.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Function: admin_set_user_role  
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, new_role text, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  old_role text;
  admin_user_id uuid;
BEGIN
  admin_user_id := auth.uid();
  
  -- Security check: only admins can change roles
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get current role
  SELECT user_role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF old_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update user role
  UPDATE public.profiles 
  SET user_role = new_role::public.user_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the role change
  INSERT INTO public.security_audit (
    user_id, event_type, event_data, severity
  ) VALUES (
    admin_user_id,
    'admin_role_change',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role,
      'reason', reason,
      'admin_id', admin_user_id
    ),
    'warning'
  );
  
  RETURN true;
END;
$function$;

-- Function: advance_order_stages
CREATE OR REPLACE FUNCTION public.advance_order_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  -- Auto-advance order stages based on certain conditions
  IF NEW.order_status = 'confirmed' AND OLD.order_status = 'pending' THEN
    NEW.current_stage := 'processing';
  ELSIF NEW.order_status = 'shipped' AND OLD.order_status = 'confirmed' THEN
    NEW.current_stage := 'in_transit';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_categorize_product (enhanced version)
CREATE OR REPLACE FUNCTION public.enhanced_auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    product_text TEXT;
    predicted_category TEXT;
    confidence_score DECIMAL(3,2) := 0.0;
    auto_tags TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Combine name and description for analysis
    product_text := lower(COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
    
    -- Enhanced categorization logic
    CASE 
        -- Food Categories
        WHEN product_text ~ '(tomato|carrot|onion|potato|lettuce|vegetables)' THEN
            predicted_category := 'vegetables';
            confidence_score := 0.9;
        WHEN product_text ~ '(apple|banana|orange|mango|fruit)' THEN
            predicted_category := 'fruits';
            confidence_score := 0.9;
        WHEN product_text ~ '(rice|wheat|corn|grain|cereal)' THEN
            predicted_category := 'grains';
            confidence_score := 0.8;
        WHEN product_text ~ '(phone|laptop|computer|electronics)' THEN
            predicted_category := 'electronics';
            confidence_score := 0.9;
        WHEN product_text ~ '(shirt|dress|clothing|fashion)' THEN
            predicted_category := 'clothing';
            confidence_score := 0.85;
        ELSE
            predicted_category := 'other';
            confidence_score := 0.3;
    END CASE;
    
    -- Auto-generate tags
    auto_tags := array_append(auto_tags, 'new-arrival');
    
    -- Set the category and tags if not already provided
    IF NEW.category IS NULL OR NEW.category = '' THEN
        NEW.category := predicted_category;
    END IF;
    
    NEW.tags := COALESCE(NEW.tags, ARRAY[]::TEXT[]) || auto_tags;
    NEW.category_confidence := confidence_score;
    NEW.auto_tags_generated := true;
    NEW.last_categorized_at := NOW();
    
    RETURN NEW;
END;
$function$;

-- Update the existing auto_categorize_product to use enhanced version
CREATE OR REPLACE FUNCTION public.auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  RETURN public.enhanced_auto_categorize_product();
END;
$function$;

-- Function: auto_categorize_ticket
CREATE OR REPLACE FUNCTION public.auto_categorize_ticket()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  ticket_text TEXT;
  category_prediction TEXT;
BEGIN
  ticket_text := lower(COALESCE(NEW.subject, '') || ' ' || COALESCE(NEW.description, ''));
  
  -- Basic categorization logic
  IF ticket_text ~ '(payment|refund|billing|charge)' THEN
    category_prediction := 'billing';
  ELSIF ticket_text ~ '(delivery|shipping|track|lost)' THEN
    category_prediction := 'shipping';
  ELSIF ticket_text ~ '(defect|broken|quality|damage)' THEN
    category_prediction := 'product_quality';
  ELSIF ticket_text ~ '(account|login|password|access)' THEN
    category_prediction := 'account';
  ELSE
    category_prediction := 'general';
  END IF;
  
  IF NEW.category IS NULL THEN
    NEW.category := category_prediction;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_generate_order_qr
CREATE OR REPLACE FUNCTION public.auto_generate_order_qr()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  qr_code TEXT;
BEGIN
  IF NEW.order_status = 'confirmed' AND OLD.order_status != 'confirmed' THEN
    qr_code := public.generate_qr_identifier(NEW.id, 'order_tracking');
    
    UPDATE public.orders 
    SET qr_code = qr_code
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_generate_payment_qr
CREATE OR REPLACE FUNCTION public.auto_generate_payment_qr()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  qr_code TEXT;
BEGIN
  IF NEW.payment_status = 'pending' AND OLD.payment_status IS NULL THEN
    qr_code := 'PAY_' || REPLACE(NEW.id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
    
    UPDATE public.payments 
    SET qr_code = qr_code
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_generate_product_qr
CREATE OR REPLACE FUNCTION public.auto_generate_product_qr()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  qr_code TEXT;
BEGIN
  IF NEW.is_active = true AND (OLD.is_active IS NULL OR OLD.is_active = false) THEN
    qr_code := 'PROD_' || REPLACE(NEW.id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
    
    NEW.listing_qr_code := qr_code;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_initialize_wallet
CREATE OR REPLACE FUNCTION public.auto_initialize_wallet()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Auto-create wallet when user profile is created
  IF NEW.user_type IN ('seller', 'buyer') AND OLD.user_type IS NULL THEN
    INSERT INTO public.user_wallets (user_id, balance, escrow_balance, is_active)
    VALUES (NEW.user_id, 0.00, 0.00, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_release_escrow
CREATE OR REPLACE FUNCTION public.auto_release_escrow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  escrow_amount NUMERIC;
  seller_id UUID;
  platform_fee NUMERIC;
  seller_amount NUMERIC;
BEGIN
  -- Auto-release escrow when order is marked as delivered and confirmed
  IF NEW.order_status = 'delivered' AND NEW.delivery_confirmed = true AND 
     OLD.order_status != 'delivered' THEN
    
    -- Get order details
    SELECT o.seller_id, o.total_amount INTO seller_id, escrow_amount
    FROM public.orders o WHERE o.id = NEW.id;
    
    -- Calculate platform fee (2.5%)
    platform_fee := escrow_amount * 0.025;
    seller_amount := escrow_amount - platform_fee;
    
    -- Release escrow to seller
    UPDATE public.user_wallets 
    SET balance = balance + seller_amount,
        escrow_balance = escrow_balance - escrow_amount
    WHERE user_id = seller_id;
    
    -- Record transaction
    INSERT INTO public.transactions (
      user_id, transaction_type, amount, status, reference_id
    ) VALUES (
      seller_id, 'escrow_release', seller_amount, 'completed', NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: auto_update_order_status
CREATE OR REPLACE FUNCTION public.auto_update_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Auto-update order status based on payment status
  IF NEW.payment_status = 'completed' AND OLD.payment_status = 'pending' THEN
    UPDATE public.orders 
    SET order_status = 'confirmed', updated_at = now()
    WHERE id = NEW.order_id;
  ELSIF NEW.payment_status = 'failed' AND OLD.payment_status = 'pending' THEN
    UPDATE public.orders 
    SET order_status = 'cancelled', updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;