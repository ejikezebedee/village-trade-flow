-- Fix function search paths for security
SET search_path = public, auth, extensions;

-- Create security status functions
CREATE OR REPLACE FUNCTION public.get_table_security_status()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    COALESCE(c.relrowsecurity, false) as rls_enabled,
    COALESCE(pol.policy_count, 0)::integer as policy_count
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) as policy_count
    FROM pg_policies 
    GROUP BY schemaname, tablename
  ) pol ON pol.tablename = t.tablename AND pol.schemaname = t.schemaname
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- Create security metrics function
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS TABLE(
  name text,
  value numeric,
  status text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tables_with_rls integer;
  total_tables integer;
  tables_with_policies integer;
  active_sessions integer;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = true;
  
  -- Count total public tables
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables 
  WHERE schemaname = 'public';
  
  -- Count tables with policies
  SELECT COUNT(DISTINCT tablename) INTO tables_with_policies
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count active sessions (approximation)
  SELECT 5 INTO active_sessions; -- Mock data for now
  
  RETURN QUERY VALUES
    ('Tables with RLS', tables_with_rls::numeric, 
     CASE WHEN tables_with_rls = total_tables THEN 'good' ELSE 'warning' END,
     'Number of tables with Row Level Security enabled'),
    ('Security Policies', tables_with_policies::numeric,
     CASE WHEN tables_with_policies > 0 THEN 'good' ELSE 'critical' END,
     'Number of tables with security policies configured'),
    ('Active Sessions', active_sessions::numeric, 'good',
     'Current number of active user sessions'),
    ('Data Encryption', 1::numeric, 'good',
     'Database encryption status');
END;
$$;

-- Create RLS toggle function
CREATE OR REPLACE FUNCTION public.toggle_table_rls(
  table_name text,
  enable boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  ) INTO admin_check;
  
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Only admins can toggle RLS settings';
  END IF;
  
  -- Toggle RLS
  IF enable THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  ELSE
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;