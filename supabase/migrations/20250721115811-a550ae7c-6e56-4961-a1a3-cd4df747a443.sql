-- Optimize database with strategic indexing for high-traffic queries

-- Products table optimization (most frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active 
ON public.products (category, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_active 
ON public.products (featured, is_active) WHERE is_active = true AND featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price_range 
ON public.products (price) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_active 
ON public.products (seller_id, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_desc 
ON public.products (created_at DESC) WHERE is_active = true;

-- Full-text search index for products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
ON public.products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, ''))) 
WHERE is_active = true;

-- Orders table optimization (critical for dashboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_status 
ON public.orders (buyer_id, order_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_status 
ON public.orders (seller_id, order_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_driver_status 
ON public.orders (driver_id, order_status) WHERE driver_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status 
ON public.orders (payment_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_current_stage 
ON public.orders (current_stage, updated_at DESC);

-- Profiles table optimization (user lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_type_active 
ON public.profiles (user_type, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_verification_status 
ON public.profiles (verification_status, kyc_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_rating 
ON public.profiles (rating DESC, total_ratings DESC) WHERE rating > 0;

-- Notifications optimization (real-time queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, read, created_at DESC) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority 
ON public.notifications (user_id, priority, created_at DESC);

-- Messages optimization (chat performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_time 
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_recipient 
ON public.messages (sender_id, recipient_id, created_at DESC);

-- Payments and transactions optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_status 
ON public.payments (order_id, escrow_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type 
ON public.transactions (user_id, transaction_type, status, created_at DESC) 
WHERE status = 'completed';

-- Support system optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_status_priority 
ON public.support_tickets (status, priority, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_assigned 
ON public.support_tickets (assigned_to, status, updated_at DESC) 
WHERE assigned_to IS NOT NULL;

-- Dispute system optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_status_priority 
ON public.disputes (status, priority, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_participants 
ON public.disputes (filed_by, respondent_id, status);

-- QR tracking optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qr_scans_order_stage 
ON public.qr_scans (order_id, scan_stage, scanned_at DESC);

-- Fraud detection optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_ip_time 
ON public.user_activities (ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_type 
ON public.user_activities (user_id, activity_type, created_at DESC);

-- Create materialized view for product statistics (cache expensive queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_stats AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.seller_id,
  p.price,
  p.stock_quantity,
  p.featured,
  COUNT(o.id) as total_orders,
  AVG(f.rating) as avg_rating,
  COUNT(f.id) as total_reviews,
  MAX(o.created_at) as last_order_date
FROM public.products p
LEFT JOIN public.orders o ON o.product_name = p.name AND o.seller_id = p.seller_id
LEFT JOIN public.feedback f ON f.order_id = o.id AND f.feedback_type = 'product'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.category, p.seller_id, p.price, p.stock_quantity, p.featured;

-- Index the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_stats_id ON public.product_stats (id);
CREATE INDEX IF NOT EXISTS idx_product_stats_category ON public.product_stats (category, avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_product_stats_seller ON public.product_stats (seller_id, total_orders DESC);

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_stats AS
SELECT 
  p.user_id,
  p.user_type,
  p.rating,
  p.total_ratings,
  COUNT(DISTINCT CASE WHEN o.buyer_id = p.user_id THEN o.id END) as total_purchases,
  COUNT(DISTINCT CASE WHEN o.seller_id = p.user_id THEN o.id END) as total_sales,
  AVG(CASE WHEN o.seller_id = p.user_id THEN o.total_amount END) as avg_sale_amount,
  MAX(CASE WHEN o.buyer_id = p.user_id THEN o.created_at END) as last_purchase_date,
  MAX(CASE WHEN o.seller_id = p.user_id THEN o.created_at END) as last_sale_date
FROM public.profiles p
LEFT JOIN public.orders o ON (o.buyer_id = p.user_id OR o.seller_id = p.user_id)
WHERE p.is_active = true
GROUP BY p.user_id, p.user_type, p.rating, p.total_ratings;

-- Index the user stats view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_type_rating ON public.user_stats (user_type, rating DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_stats_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
END;
$function$;

-- Create function to analyze query performance
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS TABLE (
  query_text text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  rows bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
  FROM pg_stat_statements 
  WHERE query NOT ILIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC
  LIMIT 20;
$function$;

-- Create function to get table sizes and optimize candidates
CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  total_size text
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
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
  pr.rating as seller_rating,
  COALESCE(ps.avg_rating, 0) as product_rating,
  COALESCE(ps.total_reviews, 0) as review_count,
  COALESCE(ps.total_orders, 0) as order_count
FROM public.products p
JOIN public.profiles pr ON pr.id = p.seller_id
LEFT JOIN public.product_stats ps ON ps.id = p.id
WHERE p.is_active = true AND pr.is_active = true;

-- Enable RLS on materialized views
ALTER MATERIALIZED VIEW public.product_stats ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for materialized views
CREATE POLICY "Anyone can view product stats" 
ON public.product_stats FOR SELECT 
USING (true);

CREATE POLICY "Users can view their own stats" 
ON public.user_stats FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

-- Schedule automatic refresh of materialized views (run every hour)
SELECT cron.schedule(
  'refresh-stats-views',
  '0 * * * *', -- every hour
  $$SELECT public.refresh_stats_views();$$
);