-- Create missing delivery_bids table
CREATE TABLE public.delivery_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  bidder_id UUID NOT NULL,
  bid_amount NUMERIC NOT NULL,
  estimated_delivery_time INTEGER, -- in minutes
  status TEXT NOT NULL DEFAULT 'pending',
  bid_type TEXT NOT NULL DEFAULT 'delivery', -- 'delivery' or 'storage'
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_bids ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Bidders can update their own bids"
ON public.delivery_bids
FOR UPDATE
USING (bidder_id = auth.uid());

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';

-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS pickup_location JSONB,
ADD COLUMN IF NOT EXISTS delivery_location JSONB,
ADD COLUMN IF NOT EXISTS product_price NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Add missing columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS lga TEXT,
ADD COLUMN IF NOT EXISTS community TEXT,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Update display_name from existing data
UPDATE public.profiles 
SET display_name = COALESCE(
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
    THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL 
    THEN first_name
    WHEN last_name IS NOT NULL 
    THEN last_name
    ELSE 'User'
  END
)
WHERE display_name IS NULL;

-- Generate order numbers using a simpler approach
DO $$
DECLARE
  order_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR order_record IN SELECT id FROM public.orders WHERE order_number IS NULL ORDER BY created_at LOOP
    UPDATE public.orders 
    SET order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0')
    WHERE id = order_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_bids_order_id ON public.delivery_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_bidder_id ON public.delivery_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_status ON public.delivery_bids(status);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_delivery_bids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_bids_updated_at
  BEFORE UPDATE ON public.delivery_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_bids_updated_at();