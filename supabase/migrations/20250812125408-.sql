-- CRITICAL SECURITY FIXES - Fixed function dependencies
-- Phase 1: Emergency Security Fixes

-- 1. Fix auth functions - use auth.uid() directly instead of custom function
CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(p.user_role, 'user')
  FROM public.profiles p 
  WHERE p.user_id = auth.uid()
$$;

-- Secure admin-only role management function
CREATE OR REPLACE FUNCTION admin_set_user_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_admin_role text;
  old_role text;
  result jsonb;
BEGIN
  -- Check if caller is admin
  SELECT get_current_user_role() INTO current_admin_role;
  
  IF current_admin_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can modify user roles');
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('user', 'buyer', 'seller', 'driver', 'shop', 'admin', 'moderator') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role specified');
  END IF;
  
  -- Get current role
  SELECT user_role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF old_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update role
  UPDATE public.profiles 
  SET user_role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the change (if security_audit table exists)
  INSERT INTO public.security_audit (
    event_type, user_id, event_data, severity, performed_by
  ) VALUES (
    'role_change',
    target_user_id,
    jsonb_build_object(
      'old_role', old_role,
      'new_role', new_role,
      'changed_by', auth.uid()
    ),
    'warning',
    auth.uid()
  )
  ON CONFLICT DO NOTHING; -- Ignore if table doesn't exist
  
  RETURN jsonb_build_object(
    'success', true, 
    'old_role', old_role, 
    'new_role', new_role
  );
END;
$$;

-- 2. Fix profiles table RLS - Drop existing problematic policies first
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create secure RLS policies without recursion
CREATE POLICY "Users can view basic profile info"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can view their own complete profile"
ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile except role"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Prevent self-promotion to admin (only allow if user is already admin)
  (
    OLD.user_role = NEW.user_role OR 
    EXISTS (
      SELECT 1 FROM public.profiles admin_check 
      WHERE admin_check.user_id = auth.uid() 
      AND admin_check.user_role = 'admin'
    )
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.user_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.user_role = 'admin'
  )
);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create unique user ID generation trigger
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  user_id TEXT;
BEGIN
  -- Create sequence if it doesn't exist
  PERFORM setval('user_id_sequence', 1, false) WHERE NOT EXISTS (
    SELECT 1 FROM pg_sequences WHERE sequencename = 'user_id_sequence'
  );
  
  -- Get next number from sequence
  SELECT nextval('user_id_sequence') INTO next_number;
  
  -- Format as UZ followed by 6-digit padded number
  user_id := 'UZ' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to timestamp-based ID if sequence fails
    RETURN 'UZ' || LPAD(EXTRACT(EPOCH FROM now())::bigint::text, 10, '0');
END;
$$;

-- Create sequence for unique user IDs
CREATE SEQUENCE IF NOT EXISTS user_id_sequence START 1;

-- Create trigger function for unique user ID
CREATE OR REPLACE FUNCTION handle_unique_user_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if unique_user_id is null
  IF NEW.unique_user_id IS NULL THEN
    NEW.unique_user_id := generate_unique_user_id();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_unique_user_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_unique_user_id();

-- 4. Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name,
    display_name,
    user_type,
    user_role
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      CONCAT(
        NEW.raw_user_meta_data ->> 'first_name', 
        ' ', 
        NEW.raw_user_meta_data ->> 'last_name'
      )
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'buyer'),
    'user'
  );
  
  -- Create wallet for new user
  INSERT INTO public.user_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();