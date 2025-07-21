-- Enhance products table with auto-tagging and improved categorization
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS auto_tags_generated BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_confidence DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS last_categorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create enhanced categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category_enhanced') THEN
    CREATE TYPE product_category_enhanced AS ENUM (
      'fruits', 'vegetables', 'grains', 'dairy', 'meat', 'seafood', 'spices', 'beverages',
      'electronics', 'clothing', 'accessories', 'home_garden', 'books_media', 
      'sports_fitness', 'beauty_health', 'toys_games', 'crafts', 'tools', 'automotive', 'other'
    );
  END IF;
END$$;

-- Create product tags table for better tag management
CREATE TABLE IF NOT EXISTS public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_system_tag BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Policies for product_tags
CREATE POLICY "Anyone can view product tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "System can manage product tags" ON public.product_tags FOR ALL USING (true);

-- Insert system tags
INSERT INTO public.product_tags (name, category, description, color, is_system_tag) VALUES
  ('new-arrival', 'status', 'Product added within last 7 days', '#10b981', true),
  ('best-seller', 'performance', 'High sales volume product', '#f59e0b', true),
  ('low-stock', 'inventory', 'Less than 10 items in stock', '#ef4444', true),
  ('trending', 'performance', 'Popular in recent searches', '#8b5cf6', true),
  ('organic', 'quality', 'Organic or natural product', '#22c55e', true),
  ('handmade', 'quality', 'Handcrafted item', '#ec4899', true),
  ('premium', 'quality', 'High-end quality product', '#f97316', true),
  ('seasonal', 'availability', 'Seasonal availability', '#06b6d4', true),
  ('local-favorite', 'community', 'Popular in local area', '#84cc16', true),
  ('fast-shipping', 'delivery', 'Quick delivery available', '#3b82f6', true)
ON CONFLICT (name) DO NOTHING;

-- Enhanced auto-categorization function with AI support
CREATE OR REPLACE FUNCTION public.enhanced_auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  product_text TEXT;
  predicted_category TEXT;
  confidence_score DECIMAL(3,2) := 0.0;
  auto_tags TEXT[] := '{}';
BEGIN
  -- Combine name and description for analysis
  product_text := lower(COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  
  -- Enhanced categorization logic
  CASE 
    -- Food Categories
    WHEN product_text ~ '(tomato|carrot|onion|potato|lettuce|cabbage|spinach|broccoli|pepper|cucumber|vegetable)' THEN
      predicted_category := 'vegetables';
      confidence_score := 0.9;
    WHEN product_text ~ '(apple|banana|orange|mango|berry|grape|pineapple|watermelon|fruit|citrus)' THEN
      predicted_category := 'fruits';
      confidence_score := 0.9;
    WHEN product_text ~ '(rice|wheat|corn|grain|cereal|oats|barley|quinoa)' THEN
      predicted_category := 'grains';
      confidence_score := 0.8;
    WHEN product_text ~ '(milk|cheese|butter|yogurt|cream|dairy)' THEN
      predicted_category := 'dairy';
      confidence_score := 0.85;
    WHEN product_text ~ '(chicken|beef|pork|lamb|meat|sausage)' THEN
      predicted_category := 'meat';
      confidence_score := 0.85;
    WHEN product_text ~ '(fish|salmon|tuna|seafood|shrimp|crab)' THEN
      predicted_category := 'seafood';
      confidence_score := 0.85;
    WHEN product_text ~ '(spice|salt|pepper|cumin|turmeric|seasoning|herb)' THEN
      predicted_category := 'spices';
      confidence_score := 0.8;
    WHEN product_text ~ '(honey|jam|sauce|oil|food|edible|snack)' THEN
      predicted_category := 'food';
      confidence_score := 0.7;
    
    -- Electronics
    WHEN product_text ~ '(phone|laptop|computer|tablet|electronic|gadget|device|tech|smartphone|headphone)' THEN
      predicted_category := 'electronics';
      confidence_score := 0.9;
    
    -- Clothing & Accessories
    WHEN product_text ~ '(shirt|dress|pants|shoes|clothing|apparel|fashion|wear|jacket|hat)' THEN
      predicted_category := 'clothing';
      confidence_score := 0.85;
    WHEN product_text ~ '(bag|jewelry|watch|accessory|belt|scarf|glasses)' THEN
      predicted_category := 'accessories';
      confidence_score := 0.8;
    
    -- Home & Garden
    WHEN product_text ~ '(furniture|home|garden|plant|pot|tool|decor|kitchen|household)' THEN
      predicted_category := 'home_garden';
      confidence_score := 0.75;
    
    -- Crafts
    WHEN product_text ~ '(basket|pottery|handmade|craft|woven|handcraft|art|creative)' THEN
      predicted_category := 'crafts';
      confidence_score := 0.8;
    
    ELSE
      predicted_category := 'other';
      confidence_score := 0.3;
  END CASE;
  
  -- Auto-generate tags based on product characteristics
  -- New arrival tag (products added in last 7 days)
  auto_tags := auto_tags || 'new-arrival';
  
  -- Quality tags
  IF product_text ~ '(organic|natural|eco|green)' THEN
    auto_tags := auto_tags || 'organic';
  END IF;
  
  IF product_text ~ '(handmade|handcraft|artisan|custom)' THEN
    auto_tags := auto_tags || 'handmade';
  END IF;
  
  IF product_text ~ '(premium|luxury|high.?quality|finest)' THEN
    auto_tags := auto_tags || 'premium';
  END IF;
  
  -- Stock-based tags
  IF NEW.stock_quantity <= 10 THEN
    auto_tags := auto_tags || 'low-stock';
  END IF;
  
  -- Seasonal tags (basic seasonal detection)
  IF product_text ~ '(seasonal|summer|winter|spring|autumn|fall|holiday)' THEN
    auto_tags := auto_tags || 'seasonal';
  END IF;
  
  -- Set the category and tags if not already provided
  IF NEW.category IS NULL OR NEW.category = '' THEN
    NEW.category := predicted_category;
  END IF;
  
  -- Always set auto-generated data
  NEW.tags := COALESCE(NEW.tags, '{}') || auto_tags;
  NEW.category_confidence := confidence_score;
  NEW.auto_tags_generated := true;
  NEW.last_categorized_at := NOW();
  
  -- Set featured status for high-quality products
  IF NEW.stock_quantity > 50 AND (product_text ~ '(organic|premium|handmade)' OR confidence_score > 0.8) THEN
    NEW.featured := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the trigger to use enhanced function
DROP TRIGGER IF EXISTS auto_categorize_products ON public.products;
CREATE TRIGGER auto_categorize_products
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_auto_categorize_product();

-- Function to update best-seller tags based on sales data
CREATE OR REPLACE FUNCTION public.update_product_performance_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  sales_count INTEGER;
  avg_sales DECIMAL;
BEGIN
  -- Calculate average sales across all products
  SELECT AVG(order_count) INTO avg_sales
  FROM (
    SELECT COUNT(*) as order_count
    FROM public.orders
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY seller_id
  ) sales_data;
  
  -- Update tags for each product based on performance
  FOR product_record IN 
    SELECT p.id, p.name, p.tags, COUNT(o.id) as sales_count
    FROM public.products p
    LEFT JOIN public.orders o ON o.seller_id = p.seller_id 
      AND o.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.name, p.tags
  LOOP
    sales_count := product_record.sales_count;
    
    -- Remove old performance tags
    UPDATE public.products 
    SET tags = array_remove(array_remove(tags, 'best-seller'), 'trending')
    WHERE id = product_record.id;
    
    -- Add performance tags based on sales
    IF sales_count > (COALESCE(avg_sales, 0) * 1.5) THEN
      UPDATE public.products 
      SET tags = array_append(tags, 'best-seller')
      WHERE id = product_record.id;
    END IF;
    
    IF sales_count > (COALESCE(avg_sales, 0) * 1.2) THEN
      UPDATE public.products 
      SET tags = array_append(tags, 'trending')
      WHERE id = product_record.id;
    END IF;
  END LOOP;
  
  -- Update tag usage counts
  UPDATE public.product_tags
  SET usage_count = (
    SELECT COUNT(*)
    FROM public.products
    WHERE product_tags.name = ANY(products.tags)
  );
END;
$$;

-- Function to clean up old new-arrival tags
CREATE OR REPLACE FUNCTION public.cleanup_new_arrival_tags()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove new-arrival tag from products older than 7 days
  UPDATE public.products
  SET tags = array_remove(tags, 'new-arrival')
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND 'new-arrival' = ANY(tags);
END;
$$;