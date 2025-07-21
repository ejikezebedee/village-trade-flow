-- Enhanced order status automation with comprehensive tracking
CREATE OR REPLACE FUNCTION public.auto_update_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  payment_record public.payments%ROWTYPE;
BEGIN
  -- Get the full order record
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Auto-advance order status based on QR scan stages
  IF NEW.scan_stage = 'seller_to_driver' THEN
    -- Driver picked up from seller - move to in_transit
    UPDATE public.orders 
    SET current_stage = 'in_transit',
        order_status = 'shipped',
        updated_at = now()
    WHERE id = NEW.order_id;
    
  ELSIF NEW.scan_stage = 'driver_to_shop' THEN
    -- Delivered to shop - move to shop_delivery
    UPDATE public.orders 
    SET current_stage = 'shop_delivery',
        order_status = 'delivered_to_shop',
        updated_at = now()
    WHERE id = NEW.order_id;
    
  ELSIF NEW.scan_stage = 'shop_to_buyer' THEN
    -- Buyer confirmed pickup - move to completed and trigger payment release
    UPDATE public.orders 
    SET current_stage = 'completed',
        order_status = 'delivered',
        updated_at = now(),
        escrow_release_date = now()
    WHERE id = NEW.order_id;
    
    -- Automatically release escrow payment
    UPDATE public.payments 
    SET escrow_status = 'released',
        released_at = now()
    WHERE order_id = NEW.order_id AND escrow_status = 'held';
    
    -- Update transaction status for payment release
    UPDATE public.transactions
    SET status = 'completed',
        escrow_released_at = now(),
        escrow_release_reason = 'delivery_confirmed_via_qr',
        updated_at = now()
    WHERE order_id = NEW.order_id AND status = 'pending';
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic order status updates on QR scans
DROP TRIGGER IF EXISTS auto_order_status_trigger ON public.qr_scans;
CREATE TRIGGER auto_order_status_trigger
  AFTER INSERT ON public.qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_order_status();

-- Enhanced order stage progression with automatic transitions
CREATE OR REPLACE FUNCTION public.advance_order_stages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- Update the existing trigger to use the enhanced function
DROP TRIGGER IF EXISTS generate_order_qr_codes_trigger ON public.orders;
CREATE TRIGGER generate_order_qr_codes_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.advance_order_stages();

-- Create automatic escrow release on delivery confirmation
CREATE OR REPLACE FUNCTION public.auto_release_escrow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger for automatic escrow release
DROP TRIGGER IF EXISTS auto_escrow_release_trigger ON public.orders;
CREATE TRIGGER auto_escrow_release_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_release_escrow();

-- Add delivery tracking table for comprehensive order monitoring
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text,
  previous_stage text,
  new_stage text,
  changed_by uuid,
  change_reason text,
  location_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on order status history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing order status history
CREATE POLICY "Users can view order status history for their orders"
ON public.order_status_history
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_status_history.order_id 
  AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR orders.driver_id = auth.uid())
));

-- Create policy for system to insert status history
CREATE POLICY "System can insert order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (true);

-- Function to track order status changes
CREATE OR REPLACE FUNCTION public.track_order_changes()
RETURNS trigger
LANGUAGE plpgsql
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

-- Create trigger for order change tracking
DROP TRIGGER IF EXISTS track_order_changes_trigger ON public.orders;
CREATE TRIGGER track_order_changes_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_order_changes();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON public.order_status_history (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_stage 
ON public.orders (order_status, current_stage, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_qr_scans_order_stage 
ON public.qr_scans (order_id, scan_stage, scanned_at DESC);