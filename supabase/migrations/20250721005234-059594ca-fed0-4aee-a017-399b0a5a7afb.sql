-- Enhance transactions table for better escrow tracking
ALTER TABLE public.transactions 
ADD COLUMN escrow_locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN escrow_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN gateway_transaction_id TEXT,
ADD COLUMN gateway_provider TEXT CHECK (gateway_provider IN ('paypal', 'paystack', 'stripe')),
ADD COLUMN gateway_response JSONB,
ADD COLUMN escrow_release_reason TEXT,
ADD COLUMN auto_release_date TIMESTAMP WITH TIME ZONE;

-- Create payment notifications table
CREATE TABLE public.payment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payment_locked', 'payment_released', 'auto_release_warning', 'dispute_opened')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('buyer', 'seller', 'both')),
  message_title TEXT NOT NULL,
  message_body TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  in_app_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow disputes table
CREATE TABLE public.escrow_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  dispute_description TEXT,
  filed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_notifications
CREATE POLICY "Users can view notifications for their orders" 
ON public.payment_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payment_notifications.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- Create RLS policies for escrow_disputes
CREATE POLICY "Users can view disputes for their orders" 
ON public.escrow_disputes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = escrow_disputes.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can create disputes for their orders" 
ON public.escrow_disputes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = escrow_disputes.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  ) AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = escrow_disputes.filed_by 
    AND profiles.user_id = auth.uid()
  )
);

-- Create function to automatically set escrow release date (14 days from lock)
CREATE OR REPLACE FUNCTION public.set_auto_release_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.transaction_type = 'payment' AND OLD.status = 'pending' THEN
    NEW.escrow_locked_at = NOW();
    NEW.auto_release_date = NOW() + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-release date setting
CREATE TRIGGER set_auto_release_date_trigger
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auto_release_date();

-- Create function to handle payment status notifications
CREATE OR REPLACE FUNCTION public.create_payment_notification(
  p_transaction_id UUID,
  p_order_id UUID,
  p_notification_type TEXT,
  p_recipient_type TEXT,
  p_title TEXT,
  p_body TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.payment_notifications (
    transaction_id,
    order_id,
    notification_type,
    recipient_type,
    message_title,
    message_body
  ) VALUES (
    p_transaction_id,
    p_order_id,
    p_notification_type,
    p_recipient_type,
    p_title,
    p_body
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to monitor payment status changes
CREATE OR REPLACE FUNCTION public.payment_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Handle payment locked in escrow
  IF NEW.status = 'completed' AND OLD.status = 'pending' AND NEW.transaction_type = 'payment' THEN
    notification_title := 'Payment Secured in Escrow';
    notification_body := 'Your payment of $' || NEW.amount || ' has been securely locked in escrow for order ' || order_record.product_name || '. Funds will be released when you confirm receipt of goods.';
    
    PERFORM public.create_payment_notification(
      NEW.id,
      NEW.order_id,
      'payment_locked',
      'both',
      notification_title,
      notification_body
    );
  END IF;
  
  -- Handle payment released from escrow
  IF NEW.escrow_released_at IS NOT NULL AND OLD.escrow_released_at IS NULL THEN
    notification_title := 'Payment Released from Escrow';
    notification_body := 'Payment of $' || NEW.amount || ' has been released from escrow for order ' || order_record.product_name || '. Transaction completed successfully.';
    
    PERFORM public.create_payment_notification(
      NEW.id,
      NEW.order_id,
      'payment_released',
      'both',
      notification_title,
      notification_body
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status monitoring
CREATE TRIGGER payment_status_monitor
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.payment_status_changed();

-- Create indexes for performance
CREATE INDEX idx_payment_notifications_order_id ON public.payment_notifications(order_id);
CREATE INDEX idx_payment_notifications_type ON public.payment_notifications(notification_type);
CREATE INDEX idx_escrow_disputes_order_id ON public.escrow_disputes(order_id);
CREATE INDEX idx_escrow_disputes_status ON public.escrow_disputes(status);
CREATE INDEX idx_transactions_auto_release_date ON public.transactions(auto_release_date);
CREATE INDEX idx_transactions_gateway_provider ON public.transactions(gateway_provider);

-- Add triggers for timestamp updates
CREATE TRIGGER update_escrow_disputes_updated_at
  BEFORE UPDATE ON public.escrow_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();