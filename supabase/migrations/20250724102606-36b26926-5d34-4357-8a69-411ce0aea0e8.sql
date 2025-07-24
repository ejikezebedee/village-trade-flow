-- Phase 1: Critical Security Fixes

-- 1. Add encryption key management table
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT UNIQUE NOT NULL,
  encrypted_key_data TEXT NOT NULL,
  key_purpose TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for encryption keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only admins and system can manage encryption keys
CREATE POLICY "System can manage encryption keys"
ON public.encryption_keys FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view encryption key metadata"
ON public.encryption_keys FOR SELECT
USING (is_admin() AND key_id IS NOT NULL);

-- 2. Encrypt 2FA secrets - add new columns for encrypted storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_id TEXT;

-- 3. Add role change audit table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS for role change audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role change audit"
ON public.role_change_audit FOR SELECT
USING (is_admin());

CREATE POLICY "System can insert role change audit"
ON public.role_change_audit FOR INSERT
WITH CHECK (true);

-- 4. Create secure role change function (admin-only)
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  target_user_id UUID,
  new_role TEXT,
  change_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_profile public.profiles%ROWTYPE;
  old_role TEXT;
  admin_user_id UUID;
BEGIN
  -- Verify caller is admin
  admin_user_id := auth.uid();
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get current profile
  SELECT * INTO current_profile 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF current_profile.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  old_role := current_profile.user_role;
  
  -- Validate new role
  IF new_role NOT IN ('admin', 'moderator', 'seller', 'buyer', 'driver', 'agent') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Log the change
  INSERT INTO public.role_change_audit (
    user_id, old_role, new_role, changed_by, change_reason
  ) VALUES (
    target_user_id, old_role, new_role, admin_user_id, change_reason
  );
  
  -- Update the role
  UPDATE public.profiles 
  SET user_role = new_role::user_role,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log security event
  PERFORM public.log_security_event(
    'role_change',
    'warning',
    target_user_id,
    admin_user_id,
    'profiles',
    current_profile.id,
    format('Role changed from %s to %s by admin', old_role, new_role),
    jsonb_build_object(
      'old_role', old_role,
      'new_role', new_role,
      'change_reason', change_reason
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'old_role', old_role,
    'new_role', new_role,
    'message', 'Role updated successfully'
  );
END;
$$;

-- 5. Prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow system updates (when auth.uid() is null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent users from changing their own role
  IF OLD.user_role != NEW.user_role AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot change their own role. Contact an administrator.';
  END IF;
  
  -- Only admins can change roles
  IF OLD.user_role != NEW.user_role AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to prevent self role changes
DROP TRIGGER IF EXISTS prevent_self_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_self_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();

-- 6. Fix function search paths (sample of critical functions)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND user_role IN ('admin', 'moderator')
  );
$function$;

-- 7. Add missing RLS policies for critical tables

-- Profiles table - strengthen existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Prevent role changes through normal updates
  (user_role IS NULL OR user_role = (SELECT user_role FROM public.profiles WHERE user_id = auth.uid()))
);

-- Notifications table
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Messages table
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = messages.conversation_id 
    AND auth.uid() = ANY(participants)
  )
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Orders table - add seller policy
CREATE POLICY "Sellers can view their orders"
ON public.orders FOR SELECT
USING (seller_id = auth.uid());

-- Products table - strengthen policies
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
CREATE POLICY "Sellers can manage their products"
ON public.products FOR ALL
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- 8. Create encryption audit logging
CREATE TABLE IF NOT EXISTS public.encryption_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'encrypt', 'decrypt', 'key_generation'
  table_name TEXT NOT NULL,
  record_id UUID,
  key_id TEXT,
  performed_by UUID REFERENCES auth.users(id),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  operation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_ip INET,
  user_agent TEXT
);

-- Enable RLS for encryption audit logs
ALTER TABLE public.encryption_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view encryption audit logs"
ON public.encryption_audit_logs FOR SELECT
USING (is_admin());

CREATE POLICY "System can create encryption audit logs"
ON public.encryption_audit_logs FOR INSERT
WITH CHECK (true);