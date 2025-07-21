-- Create function for automatic product categorization
CREATE OR REPLACE FUNCTION public.auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
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

-- Create trigger for auto-categorization
DROP TRIGGER IF EXISTS auto_categorize_product_trigger ON public.products;
CREATE TRIGGER auto_categorize_product_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_categorize_product();

-- Create stock alerts table
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'restock_reminder')),
  threshold_quantity integer DEFAULT 5,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS on stock_alerts
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for sellers to view their own alerts
CREATE POLICY "Sellers can view their stock alerts"
ON public.stock_alerts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = stock_alerts.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Create policy for system to create alerts
CREATE POLICY "System can create stock alerts"
ON public.stock_alerts
FOR INSERT
WITH CHECK (true);

-- Create policy for sellers to update their alerts
CREATE POLICY "Sellers can update their stock alerts"
ON public.stock_alerts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = stock_alerts.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Create function to generate stock alerts
CREATE OR REPLACE FUNCTION public.check_stock_levels()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  alert_message text;
  low_stock_threshold integer := 5;
BEGIN
  -- Check for low stock alert
  IF NEW.stock_quantity <= low_stock_threshold AND NEW.stock_quantity > 0 THEN
    alert_message := 'Low stock warning: ' || NEW.name || ' has only ' || NEW.stock_quantity || ' units left.';
    
    INSERT INTO public.stock_alerts (product_id, seller_id, alert_type, threshold_quantity, message)
    VALUES (NEW.id, NEW.seller_id, 'low_stock', low_stock_threshold, alert_message)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check for out of stock alert
  IF NEW.stock_quantity = 0 AND OLD.stock_quantity > 0 THEN
    alert_message := 'Out of stock: ' || NEW.name || ' is now sold out and needs restocking.';
    
    INSERT INTO public.stock_alerts (product_id, seller_id, alert_type, message)
    VALUES (NEW.id, NEW.seller_id, 'out_of_stock', alert_message)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stock level monitoring
DROP TRIGGER IF EXISTS stock_level_monitor ON public.products;
CREATE TRIGGER stock_level_monitor
  AFTER UPDATE OF stock_quantity ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_stock_levels();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_alerts_seller_unread 
ON public.stock_alerts (seller_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON public.products (category, is_active, featured, created_at DESC);