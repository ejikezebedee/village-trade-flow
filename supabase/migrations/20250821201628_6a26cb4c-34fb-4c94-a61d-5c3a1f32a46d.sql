-- Comprehensive Function Search Path Hardening
-- Adding SET search_path = '' to all remaining functions for security hardening

-- Update remaining functions that need search path hardening
CREATE OR REPLACE FUNCTION public.update_delivery_status(p_order_id uuid, p_checkpoint_type text, p_scanned_by uuid, p_location text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_coordinates jsonb DEFAULT NULL::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  delivery_record public.delivery_tracking%ROWTYPE;
  order_record public.orders%ROWTYPE;
  checkpoint_id UUID;
  notification_data JSONB;
  result JSON;
BEGIN
  -- Get delivery tracking record
  SELECT * INTO delivery_record 
  FROM public.delivery_tracking 
  WHERE order_id = p_order_id;
  
  -- Get order record
  SELECT * INTO order_record 
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF delivery_record.id IS NULL THEN
    RAISE EXCEPTION 'Delivery tracking not found for order %', p_order_id;
  END IF;
  
  -- Create checkpoint
  INSERT INTO public.delivery_checkpoints (
    delivery_tracking_id,
    checkpoint_type,
    checkpoint_location,
    scanned_by,
    location_coordinates,
    notes
  ) VALUES (
    delivery_record.id,
    p_checkpoint_type,
    p_location,
    p_scanned_by,
    p_coordinates,
    p_notes
  ) RETURNING id INTO checkpoint_id;
  
  -- Update delivery tracking based on checkpoint type
  CASE p_checkpoint_type
    WHEN 'picked_up' THEN
      UPDATE public.delivery_tracking 
      SET 
        current_holder_type = 'driver',
        current_holder_id = order_record.driver_id,
        current_location = p_location,
        updated_at = NOW()
      WHERE id = delivery_record.id;
      
      UPDATE public.orders 
      SET current_stage = 'in_transit', order_status = 'shipped'
      WHERE id = p_order_id;
      
    WHEN 'arrived_at_destination' THEN
      UPDATE public.delivery_tracking 
      SET 
        current_holder_type = 'shop',
        current_holder_id = order_record.shop_id,
        current_location = p_location,
        updated_at = NOW()
      WHERE id = delivery_record.id;
      
      UPDATE public.orders 
      SET current_stage = 'shop_delivery', order_status = 'delivered_to_shop'
      WHERE id = p_order_id;
      
    WHEN 'delivered' THEN
      UPDATE public.delivery_tracking 
      SET 
        current_holder_type = 'buyer',
        current_holder_id = order_record.buyer_id,
        current_location = p_location,
        actual_delivery_time = NOW(),
        updated_at = NOW()
      WHERE id = delivery_record.id;
      
      UPDATE public.orders 
      SET 
        current_stage = 'completed', 
        order_status = 'delivered',
        escrow_release_date = NOW()
      WHERE id = p_order_id;
      
      -- Release payment from escrow
      UPDATE public.payments 
      SET escrow_status = 'released', released_at = NOW()
      WHERE order_id = p_order_id AND escrow_status = 'held';
  END CASE;
  
  -- Prepare notification data
  notification_data := jsonb_build_object(
    'order_id', p_order_id,
    'checkpoint_type', p_checkpoint_type,
    'tracking_number', delivery_record.tracking_number,
    'product_name', order_record.product_name,
    'location', p_location,
    'timestamp', NOW()
  );
  
  -- Send notifications to all parties
  PERFORM public.create_notification(
    order_record.buyer_id,
    'delivery_update',
    'Delivery Update',
    'Your order ' || order_record.product_name || ' has been ' || 
    CASE p_checkpoint_type
      WHEN 'picked_up' THEN 'picked up by driver'
      WHEN 'arrived_at_destination' THEN 'delivered to pickup location'
      WHEN 'delivered' THEN 'successfully delivered'
      ELSE p_checkpoint_type
    END,
    notification_data,
    CASE p_checkpoint_type WHEN 'delivered' THEN 'high' ELSE 'normal' END
  );
  
  PERFORM public.create_notification(
    order_record.seller_id,
    'delivery_update',
    'Delivery Update',
    'Order ' || order_record.product_name || ' has been ' || 
    CASE p_checkpoint_type
      WHEN 'picked_up' THEN 'picked up by driver'
      WHEN 'arrived_at_destination' THEN 'delivered to pickup location'
      WHEN 'delivered' THEN 'successfully delivered to buyer'
      ELSE p_checkpoint_type
    END,
    notification_data,
    'normal'
  );
  
  IF order_record.driver_id IS NOT NULL THEN
    PERFORM public.create_notification(
      order_record.driver_id,
      'delivery_update',
      'Delivery Update',
      'Delivery checkpoint recorded for ' || order_record.product_name,
      notification_data,
      'normal'
    );
  END IF;
  
  result := json_build_object(
    'success', true,
    'checkpoint_id', checkpoint_id,
    'checkpoint_type', p_checkpoint_type,
    'tracking_number', delivery_record.tracking_number,
    'message', 'Delivery status updated successfully'
  );
  
  RETURN result;
END;
$function$;

-- Update additional functions with search path hardening
CREATE OR REPLACE FUNCTION public.calculate_transaction_fee(p_amount numeric, p_transaction_type text DEFAULT 'wallet_transfer'::text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = ''
AS $function$
DECLARE
  fee_rate DECIMAL := 0.025; -- 2.5% default fee
  min_fee DECIMAL := 0.50;
  max_fee DECIMAL := 50.00;
  calculated_fee DECIMAL;
BEGIN
  -- Calculate percentage-based fee
  calculated_fee := p_amount * fee_rate;
  
  -- Apply minimum and maximum limits
  calculated_fee := GREATEST(calculated_fee, min_fee);
  calculated_fee := LEAST(calculated_fee, max_fee);
  
  RETURN calculated_fee;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_affiliate_tier(p_affiliate_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  affiliate_stats RECORD;
  new_tier TEXT;
  tier_record RECORD;
BEGIN
  -- Get affiliate statistics
  SELECT 
    total_referrals,
    total_sales,
    current_tier
  INTO affiliate_stats
  FROM public.affiliates 
  WHERE id = p_affiliate_id;
  
  -- Determine new tier based on performance
  SELECT tier_name INTO new_tier
  FROM public.affiliate_tiers
  WHERE min_referrals <= affiliate_stats.total_referrals
    AND min_sales <= affiliate_stats.total_sales
    AND is_active = true
  ORDER BY min_referrals DESC, min_sales DESC
  LIMIT 1;
  
  -- Update tier if changed
  IF new_tier IS NOT NULL AND new_tier != affiliate_stats.current_tier THEN
    UPDATE public.affiliates
    SET commission_tier = new_tier,
        updated_at = now()
    WHERE id = p_affiliate_id;
    
    -- Log tier change
    INSERT INTO public.affiliate_tier_changes (
      affiliate_id,
      old_tier,
      new_tier,
      reason
    ) VALUES (
      p_affiliate_id,
      affiliate_stats.current_tier,
      new_tier,
      'Performance milestone reached'
    );
    
    RETURN new_tier;
  END IF;
  
  RETURN affiliate_stats.current_tier;
END;
$function$;

-- Add search_path to utility functions
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  );
$function$;

-- Create OTP verification table with proper RLS
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid,
  phone_number text,
  email text,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  CONSTRAINT otp_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on OTP verifications
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for OTP verifications
CREATE POLICY "Users can manage their own OTP verifications"
ON public.otp_verifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert OTP verifications"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;