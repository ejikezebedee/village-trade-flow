-- Security Configuration Guards Migration
-- Adds optional strict public config mode and related functionality

-- 1. Create function to check strict public config environment
CREATE OR REPLACE FUNCTION public.is_strict_public_config_enabled()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This will be controlled by environment variable STRICT_PUBLIC_CONFIG
  -- For now, default to false (permissive mode)
  RETURN COALESCE(current_setting('app.strict_public_config', true)::boolean, false);
END;
$$;

-- 2. Create public views for system tables (safe read-only access)
CREATE OR REPLACE VIEW public.languages_public_view AS
SELECT 
  code,
  name,
  native_name,
  is_rtl
FROM public.languages 
WHERE is_active = true;

CREATE OR REPLACE VIEW public.localized_content_public_view AS
SELECT 
  content_key,
  language_code,
  content_text,
  content_type,
  region
FROM public.localized_content
WHERE content_type = 'static'; -- Only expose static content publicly

-- 3. Add RLS policies for strict mode (will be applied when STRICT_PUBLIC_CONFIG=true)
-- These policies will only take effect when strict mode is enabled

-- Strict RLS for languages table
DO $$
BEGIN
  -- Only create if policy doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'languages' 
    AND policyname = 'strict_mode_authenticated_read'
    AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "strict_mode_authenticated_read" ON public.languages
      FOR SELECT 
      USING (
        NOT public.is_strict_public_config_enabled() 
        OR auth.uid() IS NOT NULL
      )';
  END IF;
END
$$;

-- Strict RLS for localized_content table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'localized_content' 
    AND policyname = 'strict_mode_authenticated_read'
    AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "strict_mode_authenticated_read" ON public.localized_content
      FOR SELECT 
      USING (
        NOT public.is_strict_public_config_enabled() 
        OR auth.uid() IS NOT NULL
      )';
  END IF;
END
$$;

-- 4. Add security configuration tracking table
CREATE TABLE IF NOT EXISTS public.security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  last_verified_at timestamptz DEFAULT now(),
  verification_method text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on security_config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only security admins can manage security config
CREATE POLICY "security_admins_manage_config" ON public.security_config
FOR ALL USING (public.is_security_admin());

-- 5. Insert default security configuration tracking
INSERT INTO public.security_config (config_key, config_value, verification_method) VALUES
('otp_ttl_seconds', '{"expected": 300, "status": "requires_manual_verification"}', 'dashboard_check'),
('hibp_enabled', '{"expected": true, "status": "requires_manual_verification"}', 'dashboard_check'),
('strict_public_config', '{"expected": false, "status": "environment_controlled"}', 'environment_variable')
ON CONFLICT (config_key) DO NOTHING;

-- 6. Update the security health function to include config status
CREATE OR REPLACE FUNCTION public.get_security_config_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  config_status jsonb;
  health_data jsonb;
BEGIN
  -- Get current security health summary
  SELECT public.get_security_health_summary() INTO health_data;
  
  -- Get config verification status
  config_status := jsonb_build_object(
    'otp_configuration', (
      SELECT config_value FROM public.security_config 
      WHERE config_key = 'otp_ttl_seconds'
    ),
    'hibp_configuration', (
      SELECT config_value FROM public.security_config 
      WHERE config_key = 'hibp_enabled'
    ),
    'strict_public_config', (
      SELECT config_value FROM public.security_config 
      WHERE config_key = 'strict_public_config'
    ),
    'health_metrics', health_data,
    'last_checked', now()
  );
  
  RETURN config_status;
END;
$$;

-- 7. Create function to update config verification status
CREATE OR REPLACE FUNCTION public.update_security_config_verification(
  p_config_key text,
  p_verified_value jsonb,
  p_verification_method text DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only security admins can update config verification
  IF NOT public.is_security_admin() THEN
    RAISE EXCEPTION 'Access denied: security admin privileges required';
  END IF;
  
  UPDATE public.security_config
  SET 
    config_value = p_verified_value,
    verification_method = p_verification_method,
    last_verified_at = now(),
    updated_at = now()
  WHERE config_key = p_config_key;
  
  -- Log the verification update
  PERFORM public.log_security_event(
    'config_verification_updated',
    auth.uid(),
    jsonb_build_object(
      'config_key', p_config_key,
      'verification_method', p_verification_method,
      'timestamp', now()
    ),
    'info'
  );
END;
$$;