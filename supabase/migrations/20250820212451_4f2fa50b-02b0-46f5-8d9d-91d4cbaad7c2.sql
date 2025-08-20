-- BATCH FIX: Remaining Database Functions Search Path Protection (Part 2)
-- Continue fixing all remaining functions missing SET search_path = ''

CREATE OR REPLACE FUNCTION public.generate_short_lived_otp()
RETURNS TABLE(code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  otp_code TEXT;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiry to 5 minutes from now (enhanced security)
  expiry_time := now() + INTERVAL '5 minutes';
  
  RETURN QUERY SELECT otp_code, expiry_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.enhanced_auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
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
        WHEN product_text ~ '(tomato|carrot|onion|potato|lettuce|vegetables)' THEN
            predicted_category := 'vegetables';
            confidence_score := 0.9;
        WHEN product_text ~ '(apple|banana|orange|mango|fruit)' THEN
            predicted_category := 'fruits';
            confidence_score := 0.9;
        WHEN product_text ~ '(rice|wheat|corn|grain|cereal)' THEN
            predicted_category := 'grains';
            confidence_score := 0.8;
        WHEN product_text ~ '(phone|laptop|computer|electronics)' THEN
            predicted_category := 'electronics';
            confidence_score := 0.9;
        WHEN product_text ~ '(shirt|dress|clothing|fashion)' THEN
            predicted_category := 'clothing';
            confidence_score := 0.85;
        ELSE
            predicted_category := 'other';
            confidence_score := 0.3;
    END CASE;
    
    -- Auto-generate tags
    auto_tags := array_append(auto_tags, 'new-arrival');
    
    -- Set the category and tags if not already provided
    IF NEW.category IS NULL OR NEW.category = '' THEN
        NEW.category := predicted_category;
    END IF;
    
    NEW.tags := COALESCE(NEW.tags, ARRAY[]::TEXT[]) || auto_tags;
    NEW.category_confidence := confidence_score;
    NEW.auto_tags_generated := true;
    NEW.last_categorized_at := NOW();
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_affiliate_tier(affiliate_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affiliate_record public.affiliates%ROWTYPE;
  new_tier_record public.affiliate_tiers%ROWTYPE;
  new_tier TEXT;
BEGIN
  -- Get affiliate data
  SELECT * INTO affiliate_record FROM public.affiliates WHERE id = affiliate_uuid;
  
  -- Find appropriate tier
  SELECT * INTO new_tier_record
  FROM public.affiliate_tiers
  WHERE is_active = true
    AND affiliate_record.total_referrals >= min_referrals
    AND affiliate_record.total_sales >= min_sales
  ORDER BY commission_rate DESC
  LIMIT 1;
  
  new_tier := COALESCE(new_tier_record.tier_name, 'bronze');
  
  -- Update affiliate tier
  UPDATE public.affiliates 
  SET commission_tier = new_tier,
      updated_at = now()
  WHERE id = affiliate_uuid;
  
  RETURN new_tier;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_language(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT preferred_language FROM public.profiles WHERE user_id = user_uuid),
    'en'
  );
$$;

CREATE OR REPLACE FUNCTION public.detect_browser_language(accept_language text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  detected_lang TEXT;
  lang_code TEXT;
BEGIN
  IF accept_language IS NULL THEN
    RETURN 'en';
  END IF;
  
  -- Get first language code
  lang_code := split_part(split_part(accept_language, ',', 1), '-', 1);
  
  -- Check if we support this language
  SELECT code INTO detected_lang
  FROM public.languages
  WHERE code = lang_code AND is_active = true;
  
  -- Return detected language or default to English
  RETURN COALESCE(detected_lang, 'en');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_performance_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_new_arrival_tags()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Remove new-arrival tag from products older than 7 days
  UPDATE public.products
  SET tags = array_remove(tags, 'new-arrival')
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND 'new-arrival' = ANY(tags);
END;
$$;

CREATE OR REPLACE FUNCTION public.place_auction_bid(p_auction_id uuid, p_bidder_id uuid, p_bid_amount numeric, p_max_bid numeric DEFAULT NULL::numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    auction_record public.auctions%ROWTYPE;
    min_bid DECIMAL;
    bid_id UUID;
    previous_winner UUID;
    result JSONB;
BEGIN
    -- Get auction details
    SELECT * INTO auction_record FROM public.auctions WHERE id = p_auction_id;
    
    -- Validate auction
    IF auction_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;
    
    IF auction_record.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;
    
    IF auction_record.end_time < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction has ended');
    END IF;
    
    -- Insert new bid
    INSERT INTO public.auction_bids (
        auction_id, bidder_id, bid_amount, max_bid, is_winning_bid
    ) VALUES (
        p_auction_id, p_bidder_id, p_bid_amount, p_max_bid, true
    ) RETURNING id INTO bid_id;
    
    -- Update auction current bid and total bids
    UPDATE public.auctions 
    SET current_bid = p_bid_amount,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE id = p_auction_id;
    
    result := jsonb_build_object(
        'success', true,
        'bid_id', bid_id,
        'bid_amount', p_bid_amount,
        'total_bids', auction_record.total_bids + 1
    );
    
    RETURN result;
END;
$$;