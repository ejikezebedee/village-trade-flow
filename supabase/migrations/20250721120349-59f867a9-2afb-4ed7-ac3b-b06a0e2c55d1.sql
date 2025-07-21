-- Create analytics tables for tracking user behavior

-- User analytics events table
CREATE TABLE public.user_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  page_url text,
  referrer text,
  user_agent text,
  ip_address inet,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  event_properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Page views tracking
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  time_on_page integer, -- seconds
  scroll_depth integer, -- percentage
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product analytics
CREATE TABLE public.product_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id),
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  event_type text NOT NULL, -- 'view', 'click', 'add_to_cart', 'purchase', 'favorite'
  referrer text,
  search_query text,
  category text,
  price numeric,
  event_properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Sales conversion funnel
CREATE TABLE public.conversion_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  funnel_stage text NOT NULL, -- 'awareness', 'interest', 'consideration', 'purchase', 'retention'
  event_type text NOT NULL,
  product_id uuid REFERENCES public.products(id),
  order_id uuid REFERENCES public.orders(id),
  value numeric DEFAULT 0,
  event_properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User sessions tracking
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration integer, -- seconds
  page_views_count integer DEFAULT 0,
  events_count integer DEFAULT 0,
  entry_page text,
  exit_page text,
  referrer text,
  user_agent text,
  ip_address inet,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  is_bounce boolean DEFAULT false,
  converted boolean DEFAULT false,
  conversion_value numeric DEFAULT 0
);

-- Daily analytics aggregations
CREATE TABLE public.daily_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  metric_type text NOT NULL, -- 'users', 'sessions', 'page_views', 'revenue', 'conversions'
  metric_value numeric NOT NULL DEFAULT 0,
  dimensions jsonb DEFAULT '{}'::jsonb, -- Additional breakdown dimensions
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(date, metric_type, dimensions)
);

-- Enable RLS on all analytics tables
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics tables (admin only for viewing aggregated data)
CREATE POLICY "Users can insert their own analytics" 
ON public.user_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics" 
ON public.user_analytics FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can insert their own page views" 
ON public.page_views FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all page views" 
ON public.page_views FOR SELECT 
USING (is_admin());

CREATE POLICY "Anyone can insert product analytics" 
ON public.product_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view product analytics" 
ON public.product_analytics FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can insert conversion events" 
ON public.conversion_events FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view conversion events" 
ON public.conversion_events FOR SELECT 
USING (is_admin());

CREATE POLICY "Anyone can insert session data" 
ON public.user_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions FOR SELECT 
USING (is_admin());

CREATE POLICY "System can manage daily analytics" 
ON public.daily_analytics FOR ALL 
USING (true);

-- Indexes for better performance
CREATE INDEX idx_user_analytics_user_id_date ON public.user_analytics (user_id, created_at DESC);
CREATE INDEX idx_user_analytics_event_type_date ON public.user_analytics (event_type, created_at DESC);
CREATE INDEX idx_user_analytics_session_id ON public.user_analytics (session_id);

CREATE INDEX idx_page_views_user_id_date ON public.page_views (user_id, created_at DESC);
CREATE INDEX idx_page_views_page_url ON public.page_views (page_url);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);

CREATE INDEX idx_product_analytics_product_id ON public.product_analytics (product_id, created_at DESC);
CREATE INDEX idx_product_analytics_event_type ON public.product_analytics (event_type, created_at DESC);

CREATE INDEX idx_conversion_events_funnel_stage ON public.conversion_events (funnel_stage, created_at DESC);
CREATE INDEX idx_conversion_events_user_id ON public.conversion_events (user_id, created_at DESC);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions (user_id, started_at DESC);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions (session_id);
CREATE INDEX idx_user_sessions_date ON public.user_sessions (started_at DESC);

CREATE INDEX idx_daily_analytics_date_type ON public.daily_analytics (date DESC, metric_type);

-- Functions for analytics
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  page_view_id uuid;
BEGIN
  INSERT INTO public.page_views (
    user_id, session_id, page_url, page_title, referrer, user_agent, ip_address
  ) VALUES (
    p_user_id, p_session_id, p_page_url, p_page_title, p_referrer, p_user_agent, p_ip_address
  ) RETURNING id INTO page_view_id;
  
  -- Update session page views count
  UPDATE public.user_sessions 
  SET page_views_count = page_views_count + 1,
      ended_at = now()
  WHERE session_id = p_session_id;
  
  RETURN page_view_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_user_event(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_event_type text DEFAULT NULL,
  p_event_name text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_event_properties jsonb DEFAULT '{}'::jsonb,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.user_analytics (
    user_id, session_id, event_type, event_name, page_url, 
    event_properties, user_agent, ip_address
  ) VALUES (
    p_user_id, p_session_id, p_event_type, p_event_name, p_page_url,
    p_event_properties, p_user_agent, p_ip_address
  ) RETURNING id INTO event_id;
  
  -- Update session events count
  UPDATE public.user_sessions 
  SET events_count = events_count + 1,
      ended_at = now()
  WHERE session_id = p_session_id;
  
  RETURN event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_product_event(
  p_product_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_event_type text DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_event_properties jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.product_analytics (
    product_id, user_id, session_id, event_type,
    search_query, category, price, event_properties
  ) VALUES (
    p_product_id, p_user_id, p_session_id, p_event_type,
    p_search_query, p_category, p_price, p_event_properties
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION public.generate_daily_analytics(target_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete existing data for the date
  DELETE FROM public.daily_analytics WHERE date = target_date;
  
  -- Daily active users
  INSERT INTO public.daily_analytics (date, metric_type, metric_value)
  SELECT target_date, 'daily_active_users', COUNT(DISTINCT user_id)
  FROM public.user_analytics
  WHERE DATE(created_at) = target_date AND user_id IS NOT NULL;
  
  -- Daily sessions
  INSERT INTO public.daily_analytics (date, metric_type, metric_value)
  SELECT target_date, 'daily_sessions', COUNT(DISTINCT session_id)
  FROM public.user_sessions
  WHERE DATE(started_at) = target_date;
  
  -- Daily page views
  INSERT INTO public.daily_analytics (date, metric_type, metric_value)
  SELECT target_date, 'daily_page_views', COUNT(*)
  FROM public.page_views
  WHERE DATE(created_at) = target_date;
  
  -- Daily revenue
  INSERT INTO public.daily_analytics (date, metric_type, metric_value)
  SELECT target_date, 'daily_revenue', COALESCE(SUM(total_amount), 0)
  FROM public.orders
  WHERE DATE(created_at) = target_date AND order_status = 'delivered';
  
  -- Daily conversions
  INSERT INTO public.daily_analytics (date, metric_type, metric_value)
  SELECT target_date, 'daily_conversions', COUNT(*)
  FROM public.orders
  WHERE DATE(created_at) = target_date;
  
  -- Popular products
  INSERT INTO public.daily_analytics (date, metric_type, metric_value, dimensions)
  SELECT 
    target_date, 
    'product_views', 
    COUNT(*),
    jsonb_build_object(
      'product_id', p.id,
      'product_name', p.name,
      'category', p.category
    )
  FROM public.product_analytics pa
  JOIN public.products p ON pa.product_id = p.id
  WHERE DATE(pa.created_at) = target_date AND pa.event_type = 'view'
  GROUP BY p.id, p.name, p.category
  HAVING COUNT(*) >= 5; -- Only include products with 5+ views
  
END;
$function$;