-- Create comprehensive notifications table for all system events
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
    'payment_received', 'payment_released', 'payment_failed',
    'message_received', 'stock_low', 'stock_out',
    'delivery_update', 'qr_scanned', 'system_alert'
  )),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  sms_sent boolean DEFAULT false,
  push_sent boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Create policy for system to insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Function to create notifications for users
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT NULL,
  p_priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enhanced order event notifications
CREATE OR REPLACE FUNCTION public.notify_order_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  buyer_notification_id uuid;
  seller_notification_id uuid;
  driver_notification_id uuid;
  shop_notification_id uuid;
  order_data jsonb;
BEGIN
  -- Prepare order data for notifications
  order_data := jsonb_build_object(
    'order_id', NEW.id,
    'product_name', NEW.product_name,
    'total_amount', NEW.total_amount,
    'current_stage', NEW.current_stage,
    'order_status', NEW.order_status
  );

  -- Handle new order creation
  IF TG_OP = 'INSERT' THEN
    -- Notify buyer: order placed
    buyer_notification_id := public.create_notification(
      NEW.buyer_id,
      'order_placed',
      'Order Placed Successfully',
      'Your order for ' || NEW.product_name || ' has been placed and is being prepared.',
      order_data,
      'normal'
    );
    
    -- Notify seller: new order received
    seller_notification_id := public.create_notification(
      NEW.seller_id,
      'order_placed',
      'New Order Received',
      'You have received a new order for ' || NEW.product_name || '. Please prepare the item for pickup.',
      order_data,
      'high'
    );
  END IF;

  -- Handle order status changes
  IF TG_OP = 'UPDATE' AND (OLD.order_status != NEW.order_status OR OLD.current_stage != NEW.current_stage) THEN
    
    -- Order confirmed
    IF NEW.order_status = 'confirmed' AND OLD.order_status != 'confirmed' THEN
      buyer_notification_id := public.create_notification(
        NEW.buyer_id,
        'order_confirmed',
        'Order Confirmed',
        'Your order for ' || NEW.product_name || ' has been confirmed and will be prepared shortly.',
        order_data
      );
    END IF;
    
    -- Order shipped (in transit)
    IF NEW.order_status = 'shipped' AND OLD.order_status != 'shipped' THEN
      buyer_notification_id := public.create_notification(
        NEW.buyer_id,
        'order_shipped',
        'Order Shipped',
        'Your order for ' || NEW.product_name || ' is now on its way to the pickup location.',
        order_data
      );
      
      seller_notification_id := public.create_notification(
        NEW.seller_id,
        'order_shipped',
        'Order Picked Up',
        'Your order for ' || NEW.product_name || ' has been picked up by the driver.',
        order_data
      );
    END IF;
    
    -- Delivered to shop
    IF NEW.order_status = 'delivered_to_shop' AND OLD.order_status != 'delivered_to_shop' THEN
      buyer_notification_id := public.create_notification(
        NEW.buyer_id,
        'delivery_update',
        'Order at Pickup Location',
        'Your order for ' || NEW.product_name || ' has arrived at the pickup location and is ready for collection.',
        order_data,
        'high'
      );
      
      IF NEW.shop_id IS NOT NULL THEN
        shop_notification_id := public.create_notification(
          NEW.shop_id,
          'delivery_update',
          'Order Delivered to Your Shop',
          'An order for ' || NEW.product_name || ' has been delivered to your shop for customer pickup.',
          order_data
        );
      END IF;
    END IF;
    
    -- Order delivered (completed)
    IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
      buyer_notification_id := public.create_notification(
        NEW.buyer_id,
        'order_delivered',
        'Order Delivered',
        'Your order for ' || NEW.product_name || ' has been successfully delivered. Payment has been released.',
        order_data
      );
      
      seller_notification_id := public.create_notification(
        NEW.seller_id,
        'order_delivered',
        'Order Completed',
        'Your order for ' || NEW.product_name || ' has been delivered and payment has been released.',
        order_data
      );
    END IF;
    
    -- QR scan notifications
    IF NEW.current_stage != OLD.current_stage THEN
      CASE 
        WHEN NEW.current_stage = 'in_transit' THEN
          IF NEW.driver_id IS NOT NULL THEN
            driver_notification_id := public.create_notification(
              NEW.driver_id,
              'qr_scanned',
              'Pickup Confirmed',
              'You have successfully picked up the order for ' || NEW.product_name || '. Please deliver to the shop.',
              order_data
            );
          END IF;
          
        WHEN NEW.current_stage = 'shop_delivery' THEN
          IF NEW.shop_id IS NOT NULL THEN
            shop_notification_id := public.create_notification(
              NEW.shop_id,
              'qr_scanned',
              'Order Received',
              'You have received the order for ' || NEW.product_name || '. Customer can now pick up.',
              order_data
            );
          END IF;
          
        WHEN NEW.current_stage = 'completed' THEN
          buyer_notification_id := public.create_notification(
            NEW.buyer_id,
            'qr_scanned',
            'Pickup Confirmed',
            'You have successfully picked up your order for ' || NEW.product_name || '. Enjoy your purchase!',
            order_data
          );
      END CASE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order notifications
DROP TRIGGER IF EXISTS order_notifications_trigger ON public.orders;
CREATE TRIGGER order_notifications_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_events();

-- Enhanced payment notifications
CREATE OR REPLACE FUNCTION public.notify_payment_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  buyer_notification_id uuid;
  seller_notification_id uuid;
  payment_data jsonb;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Prepare payment data
  payment_data := jsonb_build_object(
    'order_id', NEW.order_id,
    'amount', NEW.amount,
    'currency', NEW.currency,
    'payment_method', NEW.payment_method,
    'product_name', order_record.product_name
  );

  -- Payment received (escrow held)
  IF NEW.escrow_status = 'held' AND OLD.escrow_status != 'held' THEN
    buyer_notification_id := public.create_notification(
      order_record.buyer_id,
      'payment_received',
      'Payment Secured',
      'Your payment of $' || (NEW.amount::decimal / 100) || ' has been securely held in escrow for ' || order_record.product_name || '.',
      payment_data
    );
    
    seller_notification_id := public.create_notification(
      order_record.seller_id,
      'payment_received',
      'Payment Received',
      'Payment of $' || (NEW.amount::decimal / 100) || ' has been received and held in escrow for ' || order_record.product_name || '.',
      payment_data
    );
  END IF;
  
  -- Payment released
  IF NEW.escrow_status = 'released' AND OLD.escrow_status = 'held' THEN
    buyer_notification_id := public.create_notification(
      order_record.buyer_id,
      'payment_released',
      'Payment Released',
      'Payment of $' || (NEW.amount::decimal / 100) || ' has been released from escrow for ' || order_record.product_name || '.',
      payment_data
    );
    
    seller_notification_id := public.create_notification(
      order_record.seller_id,
      'payment_released',
      'Payment Released',
      'You have received payment of $' || (NEW.amount::decimal / 100) || ' for ' || order_record.product_name || '.',
      payment_data,
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS payment_notifications_trigger ON public.payments;
CREATE TRIGGER payment_notifications_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_events();

-- Message notifications
CREATE OR REPLACE FUNCTION public.notify_new_messages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_notification_id uuid;
  sender_profile public.profiles%ROWTYPE;
  message_data jsonb;
BEGIN
  -- Get sender profile
  SELECT * INTO sender_profile FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Prepare message data
  message_data := jsonb_build_object(
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'sender_name', COALESCE(sender_profile.first_name || ' ' || sender_profile.last_name, 'User'),
    'message_preview', LEFT(NEW.message_text, 100)
  );

  -- Notify recipient of new message
  IF NEW.recipient_id IS NOT NULL THEN
    recipient_notification_id := public.create_notification(
      NEW.recipient_id,
      'message_received',
      'New Message',
      'You have received a new message from ' || COALESCE(sender_profile.first_name || ' ' || sender_profile.last_name, 'User') || '.',
      message_data,
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for message notifications  
DROP TRIGGER IF EXISTS message_notifications_trigger ON public.messages;
CREATE TRIGGER message_notifications_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_messages();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_created 
ON public.notifications (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_priority_unread 
ON public.notifications (priority, read, created_at DESC);