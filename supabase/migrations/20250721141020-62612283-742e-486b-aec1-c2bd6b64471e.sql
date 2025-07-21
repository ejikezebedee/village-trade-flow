-- Create analytics tracking functions that are referenced in the frontend code

-- Function to track page views
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_page_title TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.page_views (
    user_id, session_id, page_url, page_title, referrer, user_agent, viewed_at
  ) VALUES (
    p_user_id, p_session_id, p_page_url, p_page_title, p_referrer, p_user_agent, NOW()
  );
END;
$$;

-- Function to track user events
CREATE OR REPLACE FUNCTION public.track_user_event(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_event_name TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_event_properties JSONB DEFAULT '{}',
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_analytics (
    user_id, session_id, event_type, event_name, page_url, event_properties, user_agent
  ) VALUES (
    p_user_id, p_session_id, p_event_type, p_event_name, p_page_url, p_event_properties, p_user_agent
  );
END;
$$;

-- Function to track product events
CREATE OR REPLACE FUNCTION public.track_product_event(
  p_product_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL,
  p_event_properties JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.product_analytics (
    product_id, user_id, session_id, event_type, category, price, event_properties
  ) VALUES (
    p_product_id, p_user_id, p_session_id, p_event_type, p_category, p_price, p_event_properties
  );
END;
$$;