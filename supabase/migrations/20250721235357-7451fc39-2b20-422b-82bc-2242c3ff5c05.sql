-- Fix the array concatenation issue in enhanced_auto_categorize_product function
CREATE OR REPLACE FUNCTION public.enhanced_auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    product_text TEXT;
    predicted_category TEXT;
    confidence_score DECIMAL(3,2) := 0.0;
    auto_tags TEXT[] := ARRAY[]::TEXT[];
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
        WHEN product_text ~ '(honey|jam|sauce|oil|food|edible|snack|coffee|tea)' THEN
            predicted_category := 'food';
            confidence_score := 0.7;
        
        -- Electronics
        WHEN product_text ~ '(phone|laptop|computer|tablet|electronic|gadget|device|tech|smartphone|headphone|speaker|watch)' THEN
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
    auto_tags := array_append(auto_tags, 'new-arrival');
    
    -- Quality tags
    IF product_text ~ '(organic|natural|eco|green)' THEN
        auto_tags := array_append(auto_tags, 'organic');
    END IF;
    
    IF product_text ~ '(handmade|handcraft|artisan|custom)' THEN
        auto_tags := array_append(auto_tags, 'handmade');
    END IF;
    
    IF product_text ~ '(premium|luxury|high.?quality|finest)' THEN
        auto_tags := array_append(auto_tags, 'premium');
    END IF;
    
    -- Stock-based tags
    IF NEW.stock_quantity <= 10 THEN
        auto_tags := array_append(auto_tags, 'low-stock');
    END IF;
    
    -- Seasonal tags (basic seasonal detection)
    IF product_text ~ '(seasonal|summer|winter|spring|autumn|fall|holiday)' THEN
        auto_tags := array_append(auto_tags, 'seasonal');
    END IF;
    
    -- Set the category and tags if not already provided
    IF NEW.category IS NULL OR NEW.category = '' THEN
        NEW.category := predicted_category;
    END IF;
    
    -- Always set auto-generated data
    NEW.tags := COALESCE(NEW.tags, ARRAY[]::TEXT[]) || auto_tags;
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