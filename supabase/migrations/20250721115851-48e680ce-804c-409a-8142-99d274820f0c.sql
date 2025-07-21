-- Optimize database with strategic indexing for high-traffic queries

-- Products table optimization (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON public.products (category, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_featured_active 
ON public.products (featured, is_active) WHERE is_active = true AND featured = true;

CREATE INDEX IF NOT EXISTS idx_products_price_range 
ON public.products (price) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_seller_active 
ON public.products (seller_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_created_desc 
ON public.products (created_at DESC) WHERE is_active = true;

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search 
ON public.products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, ''))) 
WHERE is_active = true;

-- Orders table optimization (critical for dashboards)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status 
ON public.orders (buyer_id, order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_status 
ON public.orders (seller_id, order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_driver_status 
ON public.orders (driver_id, order_status) WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_current_stage 
ON public.orders (current_stage, updated_at DESC);

-- Profiles table optimization (user lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_active 
ON public.profiles (user_type, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
ON public.profiles (verification_status, kyc_status);

CREATE INDEX IF NOT EXISTS idx_profiles_rating 
ON public.profiles (rating DESC, total_ratings DESC) WHERE rating > 0;

-- Notifications optimization (real-time queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, read, created_at DESC) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
ON public.notifications (user_id, priority, created_at DESC);

-- Messages optimization (chat performance)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient 
ON public.messages (sender_id, recipient_id, created_at DESC);

-- Payments and transactions optimization
CREATE INDEX IF NOT EXISTS idx_payments_order_status 
ON public.payments (order_id, escrow_status);

-- Support system optimization
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority 
ON public.support_tickets (status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned 
ON public.support_tickets (assigned_to, status, updated_at DESC) 
WHERE assigned_to IS NOT NULL;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_stats_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Function placeholder for future materialized views
  RETURN;
END;
$function$;

-- Create optimized view for product listings with pre-calculated data
CREATE OR REPLACE VIEW public.optimized_product_listings AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.currency,
  p.category,
  p.stock_quantity,
  p.featured,
  p.images,
  p.location,
  p.created_at,
  p.seller_id,
  pr.first_name as seller_name,
  pr.rating as seller_rating
FROM public.products p
JOIN public.profiles pr ON pr.id = p.seller_id
WHERE p.is_active = true AND pr.is_active = true;