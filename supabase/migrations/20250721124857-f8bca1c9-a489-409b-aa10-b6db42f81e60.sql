-- Create delivery tracking table for detailed delivery status
CREATE TABLE public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL UNIQUE,
  current_location TEXT,
  current_holder_type TEXT CHECK (current_holder_type IN ('seller', 'driver', 'shop', 'buyer')),
  current_holder_id UUID REFERENCES auth.users(id),
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_instructions TEXT,
  special_handling_notes TEXT,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery checkpoints table
CREATE TABLE public.delivery_checkpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_tracking_id UUID REFERENCES public.delivery_tracking(id) ON DELETE CASCADE,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('pickup_ready', 'picked_up', 'in_transit', 'arrived_at_destination', 'delivered', 'failed_delivery')),
  checkpoint_location TEXT,
  checkpoint_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scanned_by UUID REFERENCES auth.users(id),
  qr_code_used TEXT,
  location_coordinates JSONB,
  notes TEXT,
  photos JSONB,
  signature_data TEXT,
  weather_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery tracking
CREATE POLICY "Users can view delivery tracking for their orders" 
ON public.delivery_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivery_tracking.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR orders.driver_id = auth.uid() OR orders.shop_id = auth.uid())
  )
);

CREATE POLICY "System can manage delivery tracking" 
ON public.delivery_tracking 
FOR ALL 
USING (true);

-- Create policies for delivery checkpoints
CREATE POLICY "Users can view checkpoints for their deliveries" 
ON public.delivery_checkpoints 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_tracking dt
    JOIN public.orders o ON dt.order_id = o.id
    WHERE dt.id = delivery_checkpoints.delivery_tracking_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.driver_id = auth.uid() OR o.shop_id = auth.uid())
  )
);

CREATE POLICY "Users can create checkpoints for deliveries they're involved in" 
ON public.delivery_checkpoints 
FOR INSERT 
WITH CHECK (scanned_by = auth.uid());

-- Function to create delivery tracking when order is created
CREATE OR REPLACE FUNCTION public.create_delivery_tracking()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic delivery tracking creation
CREATE TRIGGER create_delivery_tracking_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_delivery_tracking();

-- Function to update delivery status and send notifications
CREATE OR REPLACE FUNCTION public.update_delivery_status(
  p_order_id UUID,
  p_checkpoint_type TEXT,
  p_scanned_by UUID,
  p_location TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_coordinates JSONB DEFAULT NULL
) RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_tracking_number ON public.delivery_tracking(tracking_number);
CREATE INDEX idx_delivery_checkpoints_delivery_id ON public.delivery_checkpoints(delivery_tracking_id);
CREATE INDEX idx_delivery_checkpoints_type_time ON public.delivery_checkpoints(checkpoint_type, checkpoint_time);

-- Update existing orders to have delivery tracking (for demo purposes)
INSERT INTO public.delivery_tracking (order_id, tracking_number, current_holder_type, current_holder_id, estimated_delivery_time)
SELECT 
  id,
  'TRK' || TO_CHAR(created_at, 'YYYYMMDD') || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 10, '0'),
  CASE current_stage
    WHEN 'seller_preparing' THEN 'seller'
    WHEN 'driver_pickup' THEN 'seller'
    WHEN 'in_transit' THEN 'driver'
    WHEN 'shop_delivery' THEN 'shop'
    WHEN 'buyer_pickup' THEN 'shop'
    WHEN 'completed' THEN 'buyer'
    ELSE 'seller'
  END,
  CASE current_stage
    WHEN 'seller_preparing' THEN seller_id
    WHEN 'driver_pickup' THEN seller_id
    WHEN 'in_transit' THEN driver_id
    WHEN 'shop_delivery' THEN shop_id
    WHEN 'buyer_pickup' THEN shop_id
    WHEN 'completed' THEN buyer_id
    ELSE seller_id
  END,
  created_at + INTERVAL '3 days'
FROM public.orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_tracking dt WHERE dt.order_id = orders.id
);