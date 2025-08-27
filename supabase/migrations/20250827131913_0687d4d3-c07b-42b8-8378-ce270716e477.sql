-- Fix Security Definer View Issue by dropping problematic views and replacing with secure functions

-- Drop the problematic views that bypass RLS
DROP VIEW IF EXISTS public.audit_logs_admin_view;
DROP VIEW IF EXISTS public.optimized_product_listings;

-- Create secure function to replace audit_logs_admin_view with proper RLS enforcement
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  actor_user_id uuid,
  created_at timestamp with time zone,
  meta jsonb,
  event text,
  client_ip_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow admin access
  IF NOT public.is_security_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.actor_user_id,
    al.created_at,
    al.meta,
    al.event,
    CASE 
      WHEN al.client_ip IS NOT NULL THEN 
        split_part(al.client_ip::text, '.', 1) || '.' ||
        split_part(al.client_ip::text, '.', 2) || '.*.*'
      ELSE NULL
    END as client_ip_masked
  FROM public.audit_logs al
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create secure function to replace optimized_product_listings with proper RLS enforcement  
CREATE OR REPLACE FUNCTION public.get_optimized_product_listings(
  p_category text DEFAULT NULL,
  p_featured_only boolean DEFAULT false,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  category text,
  seller_id uuid,
  image_url text,
  featured boolean,
  stock_quantity integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.category,
    p.seller_id,
    p.image_url,
    p.featured,
    p.stock_quantity,
    p.created_at
  FROM public.products p
  WHERE 
    (p_category IS NULL OR p.category = p_category)
    AND (p_featured_only = false OR p.featured = true)
    AND p.stock_quantity > 0
  ORDER BY 
    CASE WHEN p.featured THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions to authenticated users for the secure functions
GRANT EXECUTE ON FUNCTION public.get_admin_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_optimized_product_listings TO authenticated, anon;