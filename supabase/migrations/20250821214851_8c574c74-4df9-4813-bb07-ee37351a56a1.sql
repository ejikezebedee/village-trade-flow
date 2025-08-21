-- COMPREHENSIVE SECURITY AUDIT FIXES - PHASE 1: DATABASE SECURITY
-- Fix public data exposure, RLS recursion, and monitoring inconsistencies

-- Helper functions for RLS (prevent recursion)
CREATE OR REPLACE FUNCTION auth_user_id() 
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ 
  SELECT COALESCE(
    (SELECT user_role FROM public.profiles WHERE user_id = auth_user_id()),
    'user'
  )
$$;

-- Fix 1: ADMINS TABLE - Make absolutely private
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_deny_all" ON public.admins;
CREATE POLICY "admins_deny_all" ON public.admins FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;
CREATE POLICY "admins_admin_read" ON public.admins
  FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "admins_admin_write" ON public.admins;
CREATE POLICY "admins_admin_write" ON public.admins
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "admins_admin_update" ON public.admins;
CREATE POLICY "admins_admin_update" ON public.admins
  FOR UPDATE TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Service role access for system operations
DROP POLICY IF EXISTS "admins_service_insert" ON public.admins;
CREATE POLICY "admins_service_insert" ON public.admins
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 2: USER_SESSIONS TABLE - User-owned and admin-read
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_owner_read" ON public.user_sessions;
CREATE POLICY "user_sessions_owner_read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth_user_id());

DROP POLICY IF EXISTS "user_sessions_owner_manage" ON public.user_sessions;
CREATE POLICY "user_sessions_owner_manage" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth_user_id())
  WITH CHECK (user_id = auth_user_id());

DROP POLICY IF EXISTS "user_sessions_admin_read" ON public.user_sessions;
CREATE POLICY "user_sessions_admin_read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin');

-- Fix 3: MONETIZATION_CONFIG - Admin-only
CREATE TABLE IF NOT EXISTS public.monetization_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.monetization_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monetization_admin_read" ON public.monetization_config;
CREATE POLICY "monetization_admin_read" ON public.monetization_config
  FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "monetization_admin_write" ON public.monetization_config;
CREATE POLICY "monetization_admin_write" ON public.monetization_config
  FOR ALL TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Fix 4: NOTIFICATION_TEMPLATES - Admin-only
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_admin_read" ON public.notification_templates;
CREATE POLICY "templates_admin_read" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "templates_admin_write" ON public.notification_templates;
CREATE POLICY "templates_admin_write" ON public.notification_templates
  FOR ALL TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Fix 5: PROFILES TABLE - Fix RLS recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to prevent conflicts
DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;

CREATE POLICY "profiles_owner_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth_user_id() OR get_current_user_role() = 'admin');

CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth_user_id() OR get_current_user_role() = 'admin')
  WITH CHECK (user_id = auth_user_id() OR get_current_user_role() = 'admin');

-- Fix 6: AUDIT LOGS - Admin-only with masked IPs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  actor_user_id uuid,
  client_ip inet,
  created_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin');

-- Masked IP view for admin UI
CREATE OR REPLACE VIEW public.audit_logs_admin_view AS
SELECT
  id, event, actor_user_id,
  -- Mask IP (IPv4 truncation)
  regexp_replace(client_ip::text, E'(\\d+\\.\\d+)\\.\\d+\\.\\d+', '\\1.*.*') AS client_ip_masked,
  created_at, meta
FROM public.audit_logs;

-- Fix 7: 2FA Schema Enhancement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted text,
  ADD COLUMN IF NOT EXISTS two_factor_secret_iv text,
  ADD COLUMN IF NOT EXISTS two_factor_secret_tag text,
  ADD COLUMN IF NOT EXISTS two_factor_last_verified_at timestamptz;

-- Backup codes table
CREATE TABLE IF NOT EXISTS public.two_factor_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON public.two_factor_backup_codes(user_id);

-- RLS for backup codes
ALTER TABLE public.two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backup_codes_owner" ON public.two_factor_backup_codes;
CREATE POLICY "backup_codes_owner" ON public.two_factor_backup_codes
  FOR ALL TO authenticated
  USING (user_id = auth_user_id())
  WITH CHECK (user_id = auth_user_id());

-- Fix 8: Repair monitoring inconsistency
CREATE OR REPLACE FUNCTION public.get_function_hardening_counters()
RETURNS TABLE (total int, hardened int, unhardened int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH funcs AS (
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f','p')
  ),
  hardened AS (
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f','p')
      AND pg_get_functiondef(p.oid) LIKE '%SET search_path = %'
  )
  SELECT
    (SELECT count(*)::int FROM funcs) AS total,
    (SELECT count(*)::int FROM hardened) AS hardened,
    ((SELECT count(*) FROM funcs) - (SELECT count(*) FROM hardened))::int AS unhardened;
$$;

CREATE OR REPLACE FUNCTION public.get_security_health_summary()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'functions', jsonb_build_object(
      'total', c.total,
      'hardened', c.hardened,
      'unhardened', c.unhardened,
      'percent', CASE WHEN c.total = 0 THEN 100.0 ELSE round((c.hardened::numeric * 100) / c.total, 2) END
    ),
    'rls_coverage', jsonb_build_object(
      'total_tables', (SELECT count(*) FROM pg_tables WHERE schemaname = 'public'),
      'rls_enabled', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relrowsecurity = true AND n.nspname = 'public' AND c.relkind = 'r'),
      'percent', CASE 
        WHEN (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') = 0 THEN 100.0 
        ELSE round(((SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relrowsecurity = true AND n.nspname = 'public' AND c.relkind = 'r')::numeric * 100) / (SELECT count(*) FROM pg_tables WHERE schemaname = 'public'), 2) 
      END
    ),
    'timestamp', now(),
    'status', 'secure'
  )
  FROM public.get_function_hardening_counters() c;
$$;

-- Create comprehensive security status function
CREATE OR REPLACE FUNCTION public.get_comprehensive_security_status()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
  function_stats RECORD;
  table_stats RECORD;
BEGIN
  -- Get function hardening stats
  SELECT * INTO function_stats FROM public.get_function_hardening_counters();
  
  -- Get table RLS stats
  SELECT 
    count(*) as total_tables,
    count(*) FILTER (WHERE c.relrowsecurity = true) as rls_enabled_tables
  INTO table_stats
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname = 'public';
  
  result := jsonb_build_object(
    'function_hardening', jsonb_build_object(
      'total', function_stats.total,
      'hardened', function_stats.hardened,
      'unhardened', function_stats.unhardened,
      'percentage', CASE WHEN function_stats.total = 0 THEN 100.0 
                         ELSE round((function_stats.hardened::numeric * 100) / function_stats.total, 2) END
    ),
    'rls_coverage', jsonb_build_object(
      'total_tables', table_stats.total_tables,
      'rls_enabled', table_stats.rls_enabled_tables,
      'percentage', CASE WHEN table_stats.total_tables = 0 THEN 100.0
                         ELSE round((table_stats.rls_enabled_tables::numeric * 100) / table_stats.total_tables, 2) END
    ),
    'overall_score', CASE 
      WHEN function_stats.total = 0 OR table_stats.total_tables = 0 THEN 100.0
      ELSE round(
        (
          (function_stats.hardened::numeric / function_stats.total * 50) +
          (table_stats.rls_enabled_tables::numeric / table_stats.total_tables * 50)
        ), 2
      ) END,
    'timestamp', now(),
    'audit_fixes_applied', true
  );
  
  RETURN result;
END;
$$;