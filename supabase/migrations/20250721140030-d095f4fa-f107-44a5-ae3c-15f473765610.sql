-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin());

-- Function to assign admin role to a user by email
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  result JSONB;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, 'admin', auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    assigned_by = auth.uid(),
    assigned_at = NOW();
  
  -- Also update the profile table for backward compatibility
  UPDATE public.profiles 
  SET user_role = 'admin'
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin role assigned successfully to: ' || user_email,
    'user_id', target_user_id
  );
END;
$$;

-- Assign admin role to the specified email
SELECT public.assign_admin_role('ejikezebedee@gmail.com');

-- Grant initial admin privileges (this is a bootstrap operation)
-- We'll temporarily allow this operation by inserting directly
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'ejikezebedee@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role directly
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update profile for backward compatibility
    UPDATE public.profiles 
    SET user_role = 'admin'
    WHERE user_id = admin_user_id;
  END IF;
END;
$$;