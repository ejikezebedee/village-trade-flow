-- Add QR code tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN seller_to_driver_qr TEXT,
ADD COLUMN driver_to_shop_qr TEXT,
ADD COLUMN shop_to_buyer_qr TEXT,
ADD COLUMN current_stage TEXT DEFAULT 'seller_preparing' CHECK (current_stage IN ('seller_preparing', 'driver_pickup', 'in_transit', 'shop_delivery', 'buyer_pickup', 'completed')),
ADD COLUMN driver_id UUID REFERENCES auth.users(id),
ADD COLUMN shop_id UUID REFERENCES auth.users(id);

-- Create QR code scans tracking table
CREATE TABLE public.qr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  scan_stage TEXT NOT NULL CHECK (scan_stage IN ('seller_to_driver', 'driver_to_shop', 'shop_to_buyer')),
  scanned_by UUID REFERENCES auth.users(id),
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_data JSONB,
  notes TEXT
);

-- Enable Row Level Security on qr_scans
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for QR scans
CREATE POLICY "Users can view QR scans for their orders" 
ON public.qr_scans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = qr_scans.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR orders.driver_id = auth.uid() OR orders.shop_id = auth.uid())
  )
);

CREATE POLICY "Users can create QR scans" 
ON public.qr_scans 
FOR INSERT 
WITH CHECK (auth.uid() = scanned_by);

-- Create function to generate unique QR identifiers
CREATE OR REPLACE FUNCTION public.generate_qr_identifier(order_uuid UUID, stage TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'QR_' || UPPER(stage) || '_' || REPLACE(order_uuid::text, '-', '') || '_' || EXTRACT(EPOCH FROM NOW())::bigint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to generate QR codes when order status changes
CREATE OR REPLACE FUNCTION public.generate_order_qr_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate seller to driver QR when order is paid
  IF NEW.payment_status = 'escrow' AND OLD.payment_status != 'escrow' THEN
    NEW.seller_to_driver_qr = public.generate_qr_identifier(NEW.id, 'SELLER_TO_DRIVER');
    NEW.current_stage = 'driver_pickup';
  END IF;
  
  -- Generate driver to shop QR when driver picks up
  IF NEW.current_stage = 'in_transit' AND OLD.current_stage = 'driver_pickup' THEN
    NEW.driver_to_shop_qr = public.generate_qr_identifier(NEW.id, 'DRIVER_TO_SHOP');
  END IF;
  
  -- Generate shop to buyer QR when delivered to shop
  IF NEW.current_stage = 'buyer_pickup' AND OLD.current_stage = 'shop_delivery' THEN
    NEW.shop_to_buyer_qr = public.generate_qr_identifier(NEW.id, 'SHOP_TO_BUYER');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for QR code generation
CREATE TRIGGER generate_qr_codes_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_qr_codes();