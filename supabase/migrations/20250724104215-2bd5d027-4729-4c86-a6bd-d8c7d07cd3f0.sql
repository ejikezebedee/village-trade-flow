-- Add RLS policies for newly created security tables and fix search paths for more functions

-- 1. Add RLS policies for password_history table
CREATE POLICY "Users can't view password history" 
ON public.password_history FOR SELECT
USING (false); -- No one should be able to view password hashes

CREATE POLICY "System can insert password history"
ON public.password_history FOR INSERT
WITH CHECK (true);

-- 2. Add RLS policies for security_audit table  
CREATE POLICY "Admins can manage security audits"
ON public.security_audit FOR ALL
USING (public.is_admin());

-- 3. Add RLS policies for user_sessions table
CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions FOR DELETE
USING (user_id = auth.uid());

-- 4. Add RLS policies for rate_limit_tracking table
CREATE POLICY "Admins can view rate limits"
ON public.rate_limit_tracking FOR SELECT
USING (public.is_admin());

-- 5. Fix search_path for critical delivery and tracking functions
CREATE OR REPLACE FUNCTION public.advance_order_stages()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Auto-generate QR codes when order reaches certain stages
  CASE 
    WHEN NEW.current_stage = 'driver_pickup' AND OLD.current_stage = 'seller_preparing' THEN
      -- Generate seller to driver QR when ready for pickup
      NEW.seller_to_driver_qr = public.generate_qr_identifier(NEW.id, 'SELLER_TO_DRIVER');
      
    WHEN NEW.current_stage = 'in_transit' AND OLD.current_stage = 'driver_pickup' THEN
      -- Generate driver to shop QR when in transit
      NEW.driver_to_shop_qr = public.generate_qr_identifier(NEW.id, 'DRIVER_TO_SHOP');
      
    WHEN NEW.current_stage = 'shop_delivery' AND OLD.current_stage = 'in_transit' THEN
      -- Generate shop to buyer QR when delivered to shop
      NEW.shop_to_buyer_qr = public.generate_qr_identifier(NEW.id, 'SHOP_TO_BUYER');
      
    WHEN NEW.current_stage = 'completed' AND OLD.current_stage != 'completed' THEN
      -- Mark order as delivered when completed
      NEW.order_status = 'delivered';
      
  END CASE;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_delivery_tracking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  tracking_number TEXT;
BEGIN
  -- Generate unique tracking number
  tracking_number := 'TRK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  
  -- Create delivery tracking record
  INSERT INTO public.delivery_tracking (
    order_id,
    tracking_number,
    current_holder_type,
    current_holder_id,
    estimated_delivery_time,
    priority_level
  ) VALUES (
    NEW.id,
    tracking_number,
    'seller',
    NEW.seller_id,
    NOW() + INTERVAL '3 days', -- Default 3-day delivery estimate
    CASE 
      WHEN NEW.total_amount > 1000 THEN 'high'
      WHEN NEW.total_amount > 500 THEN 'normal'
      ELSE 'low'
    END
  );
  
  -- Create initial checkpoint
  INSERT INTO public.delivery_checkpoints (
    delivery_tracking_id,
    checkpoint_type,
    checkpoint_location,
    scanned_by,
    notes
  )
  SELECT 
    dt.id,
    'pickup_ready',
    'Seller location',
    NEW.seller_id,
    'Order created and ready for pickup'
  FROM public.delivery_tracking dt
  WHERE dt.order_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_release_escrow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Auto-release escrow when order is marked as delivered
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    -- Release payment from escrow
    UPDATE public.payments 
    SET escrow_status = 'released',
        released_at = now()
    WHERE order_id = NEW.id AND escrow_status = 'held';
    
    -- Update transaction to completed
    UPDATE public.transactions
    SET status = 'completed',
        escrow_released_at = now(),
        escrow_release_reason = 'automatic_delivery_confirmation',
        updated_at = now()
    WHERE order_id = NEW.id AND status = 'pending';
    
    -- Create payment notification
    notification_title := 'Payment Released - Order Delivered';
    notification_body := 'Payment for order ' || NEW.product_name || ' has been automatically released from escrow upon delivery confirmation.';
    
    INSERT INTO public.payment_notifications (
      order_id,
      notification_type,
      recipient_type,
      message_title,
      message_body
    ) VALUES (
      NEW.id,
      'payment_released',
      'both',
      notification_title,
      notification_body
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;