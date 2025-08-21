-- Create missing security functions first
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT user_role = 'admin' 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;