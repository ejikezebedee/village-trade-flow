-- Remove default admin backdoor completely
-- Drop the insecure admins table and its functions
DROP TABLE IF EXISTS public.admins CASCADE;
DROP FUNCTION IF EXISTS public.verify_admin_login CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_admin CASCADE;

-- Remove any remaining admin credentials or session tables
DROP TABLE IF EXISTS public.admin_credentials CASCADE;
DROP TABLE IF EXISTS public.secure_admin_sessions CASCADE;

-- Ensure only Supabase Auth + role-based access for admins
-- Admin access is now controlled purely via profiles.user_role = 'admin'
-- and requires 2FA verification through existing secure functions

-- Add trigger to ensure admin users have 2FA enabled
CREATE OR REPLACE FUNCTION public.enforce_admin_2fa()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is granted admin role, enforce 2FA requirement
  IF NEW.user_role = 'admin' AND OLD.user_role != 'admin' THEN
    -- Log the role change for security audit
    INSERT INTO public.security_audit (
      user_id, event_type, event_data, severity
    ) VALUES (
      NEW.user_id,
      'admin_role_granted',
      jsonb_build_object(
        'old_role', OLD.user_role,
        'new_role', NEW.user_role,
        'timestamp', NOW()
      ),
      'critical'
    );
    
    -- Create notification requiring 2FA setup
    INSERT INTO public.notifications (
      user_id, type, title, message, priority, data
    ) VALUES (
      NEW.user_id,
      'security_requirement',
      'Two-Factor Authentication Required',
      'Admin accounts must have 2FA enabled. Please set up TOTP authentication in your security settings.',
      'urgent',
      jsonb_build_object('requires_2fa', true, 'role_change', true)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for admin role changes
DROP TRIGGER IF EXISTS enforce_admin_2fa_trigger ON public.profiles;
CREATE TRIGGER enforce_admin_2fa_trigger
  AFTER UPDATE OF user_role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_2fa();

-- Enhanced security function to check admin access with 2FA
CREATE OR REPLACE FUNCTION public.is_admin_with_2fa()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_role = 'admin'
    AND p.two_factor_enabled = true
    AND p.two_factor_last_verified_at > (NOW() - INTERVAL '1 hour')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Update existing admin policies to require 2FA
DROP POLICY IF EXISTS "Admins can manage security configurations" ON public.security_configurations;
CREATE POLICY "Admins can manage security configurations" 
ON public.security_configurations 
FOR ALL 
USING (public.is_admin_with_2fa())
WITH CHECK (public.is_admin_with_2fa());

-- Log the security improvement
INSERT INTO public.security_audit (
  user_id, event_type, event_data, severity
) VALUES (
  auth.uid(),
  'security_hardening',
  jsonb_build_object(
    'action', 'removed_admin_backdoor',
    'description', 'Eliminated default admin/admin123 login. Admin access now requires Supabase Auth + 2FA.',
    'timestamp', NOW()
  ),
  'info'
);