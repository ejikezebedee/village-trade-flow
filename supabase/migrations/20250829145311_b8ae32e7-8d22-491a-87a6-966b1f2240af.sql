-- Fix Security Definer Views by replacing them with functions
-- This resolves the security linter warnings

-- 1. Drop the problematic SECURITY DEFINER views
DROP VIEW IF EXISTS public.languages_public_view;
DROP VIEW IF EXISTS public.localized_content_public_view;

-- 2. Create secure functions instead of views
CREATE OR REPLACE FUNCTION public.get_languages_public()
RETURNS TABLE(
  code text,
  name text,
  native_name text,
  is_rtl boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.code,
    l.name,
    l.native_name,
    l.is_rtl
  FROM public.languages l
  WHERE l.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_localized_content_public()
RETURNS TABLE(
  content_key text,
  language_code text,
  content_text text,
  content_type text,
  region text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.content_key,
    lc.language_code,
    lc.content_text,
    lc.content_type,
    lc.region
  FROM public.localized_content lc
  WHERE lc.content_type = 'static'; -- Only expose static content publicly
END;
$$;