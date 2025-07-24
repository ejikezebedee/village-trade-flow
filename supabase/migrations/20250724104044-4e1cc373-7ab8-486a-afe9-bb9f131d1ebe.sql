-- Fix search_path vulnerabilities for all remaining functions (Part 1)

-- Core transaction and transfer functions
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  ref_number TEXT;
BEGIN
  ref_number := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN ref_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_categorize_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_stock_levels()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_update_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_record public.orders%ROWTYPE;
  payment_record public.payments%ROWTYPE;
BEGIN
  -- Get the full order record
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Auto-advance order status based on QR scan stages
  IF NEW.scan_stage = 'seller_to_driver' THEN
    -- Driver picked up from seller - move to in_transit
    UPDATE public.orders 
    SET current_stage = 'in_transit',
        order_status = 'shipped',
        updated_at = now()
    WHERE id = NEW.order_id;
    
  ELSIF NEW.scan_stage = 'driver_to_shop' THEN
    -- Delivered to shop - move to shop_delivery
    UPDATE public.orders 
    SET current_stage = 'shop_delivery',
        order_status = 'delivered_to_shop',
        updated_at = now()
    WHERE id = NEW.order_id;
    
  ELSIF NEW.scan_stage = 'shop_to_buyer' THEN
    -- Buyer confirmed pickup - move to completed and trigger payment release
    UPDATE public.orders 
    SET current_stage = 'completed',
        order_status = 'delivered',
        updated_at = now(),
        escrow_release_date = now()
    WHERE id = NEW.order_id;
    
    -- Automatically release escrow payment
    UPDATE public.payments 
    SET escrow_status = 'released',
        released_at = now()
    WHERE order_id = NEW.order_id AND escrow_status = 'held';
    
    -- Update transaction status for payment release
    UPDATE public.transactions
    SET status = 'completed',
        escrow_released_at = now(),
        escrow_release_reason = 'delivery_confirmed_via_qr',
        updated_at = now()
    WHERE order_id = NEW.order_id AND status = 'pending';
    
  END IF;
  
  RETURN NEW;
END;
$function$;