-- =====================================================================
-- COMPREHENSIVE FUNCTION HARDENING - PART 1: DROP AND RECREATE FUNCTIONS
-- =====================================================================
-- This migration drops and recreates all functions with SET search_path = ''
-- for security hardening against function hijacking attacks.

-- Drop existing functions that need to be recreated with search_path hardening
DROP FUNCTION IF EXISTS public.admin_get_audit_logs(integer, integer);
DROP FUNCTION IF EXISTS public.admin_set_user_role(uuid, text, text);
DROP FUNCTION IF EXISTS public.advance_order_stages();
DROP FUNCTION IF EXISTS public.auto_categorize_product();
DROP FUNCTION IF EXISTS public.auto_categorize_ticket();
DROP FUNCTION IF EXISTS public.auto_generate_order_qr();
DROP FUNCTION IF EXISTS public.auto_generate_payment_qr();
DROP FUNCTION IF EXISTS public.auto_generate_product_qr();
DROP FUNCTION IF EXISTS public.auto_initialize_wallet();
DROP FUNCTION IF EXISTS public.auto_release_escrow();
DROP FUNCTION IF EXISTS public.auto_update_order_status();
DROP FUNCTION IF EXISTS public.calculate_next_minimum_bid(uuid);
DROP FUNCTION IF EXISTS public.calculate_token_reward(uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.calculate_transaction_fee(numeric, text);
DROP FUNCTION IF EXISTS public.check_encryption_compliance();
DROP FUNCTION IF EXISTS public.check_password_history(uuid, text);
DROP FUNCTION IF EXISTS public.check_rate_limit(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.check_rate_limit_enhanced(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.check_security_health();
DROP FUNCTION IF EXISTS public.check_stock_levels();
DROP FUNCTION IF EXISTS public.cleanup_expired_verifications();
DROP FUNCTION IF EXISTS public.cleanup_new_arrival_tags();

-- Recreate admin_get_audit_logs with correct signature
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
RETURNS SETOF public.security_audit
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check admin permissions
  IF NOT public.is_security_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log access attempt
  PERFORM public.log_audit_access_attempt('security_audit');
  
  RETURN QUERY
  SELECT *
  FROM public.security_audit
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Recreate admin_set_user_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, new_role text, reason text DEFAULT 'Admin role change')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Recreate advance_order_stages
CREATE OR REPLACE FUNCTION public.advance_order_stages()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Auto-advance order stages based on certain conditions
  IF NEW.order_status = 'confirmed' AND OLD.order_status = 'pending' THEN
    NEW.current_stage := 'processing';
  ELSIF NEW.order_status = 'shipped' AND OLD.order_status = 'confirmed' THEN
    NEW.current_stage := 'in_transit';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate auto_categorize_product
CREATE OR REPLACE FUNCTION public.auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  product_name_lower text;
  product_desc_lower text;
  auto_category text;
BEGIN
  -- Convert to lowercase for pattern matching
  product_name_lower := lower(NEW.name);
  product_desc_lower := lower(COALESCE(NEW.description, ''));
  
  -- Auto-categorization logic based on keywords
  IF product_name_lower LIKE '%tomato%' OR product_name_lower LIKE '%carrot%' OR 
     product_name_lower LIKE '%onion%' OR product_name_lower LIKE '%potato%' OR
     product_name_lower LIKE '%lettuce%' OR product_name_lower LIKE '%cabbage%' OR
     product_desc_lower LIKE '%vegetable%' THEN
    auto_category := 'vegetables';
  ELSIF product_name_lower LIKE '%apple%' OR product_name_lower LIKE '%banana%' OR 
        product_name_lower LIKE '%orange%' OR product_name_lower LIKE '%mango%' OR
        product_name_lower LIKE '%berry%' OR product_desc_lower LIKE '%fruit%' THEN
    auto_category := 'fruits';
  ELSIF product_name_lower LIKE '%basket%' OR product_name_lower LIKE '%pottery%' OR 
        product_name_lower LIKE '%handmade%' OR product_name_lower LIKE '%craft%' OR
        product_name_lower LIKE '%woven%' OR product_desc_lower LIKE '%handcraft%' THEN
    auto_category := 'crafts';
  ELSIF product_name_lower LIKE '%honey%' OR product_name_lower LIKE '%jam%' OR 
        product_name_lower LIKE '%sauce%' OR product_name_lower LIKE '%oil%' OR
        product_desc_lower LIKE '%food%' OR product_desc_lower LIKE '%edible%' THEN
    auto_category := 'food';
  ELSIF product_name_lower LIKE '%rice%' OR product_name_lower LIKE '%wheat%' OR 
        product_name_lower LIKE '%corn%' OR product_name_lower LIKE '%grain%' OR
        product_desc_lower LIKE '%cereal%' THEN
    auto_category := 'grains';
  ELSE
    auto_category := 'other';
  END IF;
  
  -- Set the category if not already provided or if it's empty
  IF NEW.category IS NULL OR NEW.category = '' THEN
    NEW.category := auto_category;
  END IF;
  
  -- Set featured status for high-quality products
  IF NEW.stock_quantity > 50 AND (product_desc_lower LIKE '%organic%' OR product_desc_lower LIKE '%premium%') THEN
    NEW.featured := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate auto_categorize_ticket
CREATE OR REPLACE FUNCTION public.auto_categorize_ticket()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

-- Recreate calculate_next_minimum_bid
CREATE OR REPLACE FUNCTION public.calculate_next_minimum_bid(p_auction_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_bid numeric;
  bid_increment numeric;
  increment_type text;
  next_minimum numeric;
BEGIN
  SELECT 
    COALESCE(current_bid, starting_bid), 
    bid_increment, 
    bid_increment_type::text
  INTO current_bid, bid_increment, increment_type
  FROM public.auctions
  WHERE id = p_auction_id;
  
  IF increment_type = 'percentage' THEN
    next_minimum := current_bid * (1 + bid_increment / 100);
  ELSE
    next_minimum := current_bid + bid_increment;
  END IF;
  
  RETURN ROUND(next_minimum, 2);
END;
$$;

-- Recreate calculate_token_reward
CREATE OR REPLACE FUNCTION public.calculate_token_reward(p_user_id uuid, p_action_type text, p_amount numeric DEFAULT 0, p_role text DEFAULT 'buyer')
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  reward_multiplier numeric := 1.0;
  base_reward numeric := 0.0;
BEGIN
  -- Calculate base reward based on action type
  CASE p_action_type
    WHEN 'purchase' THEN
      base_reward := p_amount * 0.01; -- 1% of purchase amount
    WHEN 'referral' THEN
      base_reward := 10.0; -- Flat 10 tokens for referrals
    WHEN 'review' THEN
      base_reward := 5.0; -- 5 tokens per review
    WHEN 'listing' THEN
      base_reward := 2.0; -- 2 tokens per product listing
    ELSE
      base_reward := 0.0;
  END CASE;
  
  -- Apply role-based multiplier
  CASE p_role
    WHEN 'premium_seller' THEN reward_multiplier := 1.5;
    WHEN 'seller' THEN reward_multiplier := 1.2;
    WHEN 'buyer' THEN reward_multiplier := 1.0;
    ELSE reward_multiplier := 1.0;
  END CASE;
  
  RETURN base_reward * reward_multiplier;
END;
$$;

-- Recreate calculate_transaction_fee
CREATE OR REPLACE FUNCTION public.calculate_transaction_fee(p_amount numeric, p_transaction_type text DEFAULT 'purchase')
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  fee_rate numeric := 0.025; -- Default 2.5%
  fixed_fee numeric := 0.30; -- Fixed fee
  calculated_fee numeric;
BEGIN
  -- Different fee rates based on transaction type
  CASE p_transaction_type
    WHEN 'wallet_transfer' THEN
      fee_rate := 0.01; -- 1% for wallet transfers
      fixed_fee := 0.10;
    WHEN 'escrow_release' THEN
      fee_rate := 0.0; -- No fee for escrow release
      fixed_fee := 0.0;
    WHEN 'purchase', 'payment' THEN
      fee_rate := 0.025; -- 2.5% for purchases
      fixed_fee := 0.30;
    ELSE
      fee_rate := 0.025;
      fixed_fee := 0.30;
  END CASE;
  
  calculated_fee := (p_amount * fee_rate) + fixed_fee;
  
  -- Ensure minimum fee
  IF calculated_fee < 0.10 THEN
    calculated_fee := 0.10;
  END IF;
  
  RETURN ROUND(calculated_fee, 2);
END;
$$;