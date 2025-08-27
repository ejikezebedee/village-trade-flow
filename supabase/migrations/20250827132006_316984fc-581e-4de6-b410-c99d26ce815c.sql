-- Fix remaining security warnings from linter

-- 1. Fix RLS Enabled No Policy issue by adding policies for tables that need them
-- Check and add missing RLS policies for security_alerts table
CREATE POLICY "Security admins can manage security alerts" ON public.security_alerts
FOR ALL USING (public.is_security_admin());

-- 2. Fix Auth OTP long expiry by updating OTP settings to 5 minutes max
-- This is handled by the enforce_short_otp_expiry trigger we already have

-- 3. Enable leaked password protection (this requires admin panel configuration)
-- Create a reminder function for admins to enable leaked password protection
CREATE OR REPLACE FUNCTION public.remind_enable_password_protection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create a security alert reminding to enable leaked password protection
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    title,
    message,
    metadata
  ) VALUES (
    'configuration_required',
    'high',
    'Enable Leaked Password Protection',
    'Leaked password protection is disabled. Enable it in Authentication > Settings > Password Protection for enhanced security.',
    jsonb_build_object(
      'action_required', 'enable_password_protection',
      'dashboard_path', 'authentication/settings',
      'priority', 'high'
    )
  );
END;
$$;

-- Call the reminder function to create the alert
SELECT public.remind_enable_password_protection();

-- Ensure audit_logs table has proper RLS policies since we dropped the view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND schemaname = 'public'
  ) THEN
    -- Add RLS policy for audit_logs if it doesn't exist
    EXECUTE 'CREATE POLICY "Only security admins can access audit logs" ON public.audit_logs FOR ALL USING (public.is_security_admin())';
  END IF;
END
$$;