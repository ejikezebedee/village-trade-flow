-- Create missing delivery_bids table
CREATE TABLE public.delivery_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  bidder_id UUID NOT NULL,
  bid_amount NUMERIC NOT NULL,
  estimated_delivery_time INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  bid_type TEXT NOT NULL DEFAULT 'delivery',
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_bids ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_bids
CREATE POLICY "Users can create bids for orders"
ON public.delivery_bids
FOR INSERT
WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Users can view bids for their orders"
ON public.delivery_bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = delivery_bids.order_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ) OR bidder_id = auth.uid()
);

-- Add missing columns to existing tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS pickup_location JSONB,
ADD COLUMN IF NOT EXISTS delivery_location JSONB,
ADD COLUMN IF NOT EXISTS product_price NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS lga TEXT,
ADD COLUMN IF NOT EXISTS community TEXT,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create simple trigger function for delivery_bids
CREATE OR REPLACE FUNCTION public.update_delivery_bids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;