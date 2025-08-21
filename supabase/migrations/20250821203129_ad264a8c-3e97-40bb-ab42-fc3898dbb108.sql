-- SECURITY FIX: Restrict Audit Log Access to Security Administrators Only
-- Fixed migration addressing the critical audit log access vulnerability

-- First, create a more restrictive security admin function using text type
CREATE OR REPLACE FUNCTION public.is_security_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
    AND (
      -- Only allow access to users who are super admins
      user_id::text IN (
        SELECT id::text FROM public.admins 
        WHERE role = 'super_admin' AND is_active = true
      )
      OR
      -- Or users with explicit security audit permission (if admin_permissions exists)
      EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'admin_permissions' 
        AND table_schema = 'public'
      ) AND user_id IN (
        SELECT user_id FROM public.admin_permissions 
        WHERE permission_type = 'security_audit_access' 
        AND is_active = true
      )
    )
  );
$function$;

-- Create admin permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  permission_type text NOT NULL CHECK (permission_type IN ('security_audit_access', 'user_management', 'system_administration')),
  granted_by uuid,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id, permission_type)
);

-- Enable RLS on admin permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin permissions (only super admins can manage)
CREATE POLICY "Super admins can manage admin permissions"
ON public.admin_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = ((auth.uid())::text)::uuid 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

CREATE POLICY "Users can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Drop existing overly permissive policies on security_audit table
DROP POLICY IF EXISTS "Admins can manage security audits" ON public.security_audit;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit;

-- Recreate with strict security admin access only
CREATE POLICY "Security admins can view audit logs"
ON public.security_audit
FOR SELECT
USING (public.is_security_admin());

CREATE POLICY "Security admins can delete old audit logs"
ON public.security_audit  
FOR DELETE
USING (public.is_security_admin() AND created_at < now() - INTERVAL '2 years');

-- Drop existing policies on admin_security_audit table  
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_security_audit;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_security_audit;

-- Recreate with proper restrictions
CREATE POLICY "Security admins can view admin audit logs"
ON public.admin_security_audit
FOR SELECT
USING (public.is_security_admin());

-- Create function to validate and log audit access attempts
CREATE OR REPLACE FUNCTION public.log_audit_access_attempt(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  is_authorized boolean;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  is_authorized := public.is_security_admin();
  
  -- Log all attempts to access audit tables (using existing audit table)
  INSERT INTO public.security_audit (
    event_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'audit_log_access_attempt',
    current_user_id,
    jsonb_build_object(
      'table_name', p_table_name,
      'authorized', is_authorized,
      'user_role', (SELECT user_role FROM public.profiles WHERE user_id = current_user_id),
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'cf-connecting-ip'
    ),
    CASE WHEN is_authorized THEN 'info' ELSE 'critical' END
  );
  
  RETURN is_authorized;
END;
$function$;

-- Create initial security admin permission for existing super admin
INSERT INTO public.admin_permissions (user_id, permission_type, granted_by, reason)
SELECT 
  id, 
  'security_audit_access',
  id, -- self-granted for initial setup
  'Initial security administrator setup'
FROM public.admins 
WHERE role = 'super_admin' AND is_active = true
ON CONFLICT (user_id, permission_type) DO NOTHING;