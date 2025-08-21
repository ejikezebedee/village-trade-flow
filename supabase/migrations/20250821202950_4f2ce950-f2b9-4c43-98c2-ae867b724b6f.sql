-- SECURITY FIX: Restrict Audit Log Access to Security Administrators Only
-- This migration addresses the critical security finding about unauthorized access to audit logs

-- First, create a more restrictive security admin function
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
    AND user_role = 'admin'::user_role
    AND (
      -- Only allow access to users with explicit security admin privileges
      user_id IN (
        SELECT user_id FROM public.admin_permissions 
        WHERE permission_type = 'security_audit_access' 
        AND is_active = true
      )
      OR 
      -- Fallback: check if user is super admin in admins table
      user_id::text IN (
        SELECT id::text FROM public.admins 
        WHERE role = 'super_admin' AND is_active = true
      )
    )
  );
$function$;

-- Create admin permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  permission_type text NOT NULL,
  granted_by uuid,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL
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

-- Drop and recreate all security audit table policies with proper restrictions

-- SECURITY_AUDIT table policies
DROP POLICY IF EXISTS "Admins can manage security audits" ON public.security_audit;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "System can create security audit logs" ON public.security_audit;

-- Recreate with strict security admin access only
CREATE POLICY "Security admins can view audit logs"
ON public.security_audit
FOR SELECT
USING (public.is_security_admin());

CREATE POLICY "System can create security audit logs"
ON public.security_audit
FOR INSERT
WITH CHECK (true); -- System processes need to log security events

CREATE POLICY "Security admins can delete old audit logs"
ON public.security_audit
FOR DELETE
USING (public.is_security_admin() AND created_at < now() - INTERVAL '2 years');

-- ADMIN_SECURITY_AUDIT table policies
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_security_audit;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_security_audit;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_security_audit;

-- Recreate with proper restrictions
CREATE POLICY "Security admins can view admin audit logs"
ON public.admin_security_audit
FOR SELECT
USING (public.is_security_admin());

CREATE POLICY "System can insert admin audit logs"
ON public.admin_security_audit
FOR INSERT
WITH CHECK (true);

-- Create additional security audit table for high-privilege operations
CREATE TABLE IF NOT EXISTS public.security_audit_privileged (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  admin_id uuid,
  operation_type text NOT NULL,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  risk_level text NOT NULL DEFAULT 'low',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_audit_privileged_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT security_audit_privileged_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on privileged audit table
ALTER TABLE public.security_audit_privileged ENABLE ROW LEVEL SECURITY;

-- Only super admins can access privileged audit logs
CREATE POLICY "Super admins only can view privileged audit logs"
ON public.security_audit_privileged
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = ((auth.uid())::text)::uuid 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

CREATE POLICY "System can insert privileged audit logs"
ON public.security_audit_privileged
FOR INSERT
WITH CHECK (true);

-- Create function to log privileged operations
CREATE OR REPLACE FUNCTION public.log_privileged_operation(
  p_operation_type text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_admin_id uuid DEFAULT auth.uid(),
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_risk_level text DEFAULT 'medium',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.security_audit_privileged (
    operation_type,
    resource_type,
    resource_id,
    user_id,
    admin_id,
    ip_address,
    user_agent,
    success,
    risk_level,
    metadata
  ) VALUES (
    p_operation_type,
    p_resource_type,
    p_resource_id,
    p_user_id,
    p_admin_id,
    p_ip_address,
    p_user_agent,
    p_success,
    p_risk_level,
    p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

-- Create function to check audit log access (for additional validation)
CREATE OR REPLACE FUNCTION public.validate_audit_access(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log all attempts to access audit tables
  INSERT INTO public.security_audit (
    event_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'audit_log_access_attempt',
    auth.uid(),
    jsonb_build_object(
      'table_name', p_table_name,
      'is_security_admin', public.is_security_admin(),
      'timestamp', now()
    ),
    CASE WHEN public.is_security_admin() THEN 'info' ELSE 'warning' END
  );
  
  RETURN public.is_security_admin();
END;
$function$;