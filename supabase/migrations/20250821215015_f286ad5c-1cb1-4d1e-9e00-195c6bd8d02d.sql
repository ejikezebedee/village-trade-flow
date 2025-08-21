-- COMPREHENSIVE SECURITY AUDIT FIXES - CORRECTED
-- Fix public data exposure, RLS recursion, and monitoring inconsistencies

-- Helper functions for RLS (prevent recursion) - correct order
CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION public.get_current_user_role() 
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ 
  SELECT COALESCE(
    (SELECT user_role FROM public.profiles WHERE user_id = public.auth_user_id()),
    'user'
  )
$$;

-- Fix 1: ADMINS TABLE - Make absolutely private
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_deny_all" ON public.admins;
DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;
DROP POLICY IF EXISTS "admins_admin_write" ON public.admins;
DROP POLICY IF EXISTS "admins_admin_update" ON public.admins;
DROP POLICY IF EXISTS "admins_service_insert" ON public.admins;

CREATE POLICY "admins_deny_all" ON public.admins FOR ALL TO public USING (false) WITH CHECK (false);

CREATE POLICY "admins_admin_read" ON public.admins
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "admins_admin_write" ON public.admins
  FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "admins_admin_update" ON public.admins
  FOR UPDATE TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "admins_service_insert" ON public.admins
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 2: USER_SESSIONS TABLE - User-owned and admin-read
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert session data" ON public.user_sessions;
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_owner_read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_sessions_owner_manage" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_admin_read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "user_sessions_system_insert" ON public.user_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

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

CREATE POLICY "monetization_admin_read" ON public.monetization_config
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "monetization_admin_write" ON public.monetization_config
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Fix 4: NOTIFICATION_TEMPLATES - Admin-only (remove existing policies first)
DROP POLICY IF EXISTS "Admins can manage message templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.notification_templates;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_admin_read" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "templates_admin_write" ON public.notification_templates
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Fix 5: 2FA Schema Enhancement
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

CREATE POLICY "backup_codes_owner" ON public.two_factor_backup_codes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Masked IP view for admin UI
CREATE OR REPLACE VIEW public.audit_logs_admin_view AS
SELECT
  id, event, actor_user_id,
  regexp_replace(client_ip::text, E'(\\d+\\.\\d+)\\.\\d+\\.\\d+', '\\1.*.*') AS client_ip_masked,
  created_at, meta
FROM public.audit_logs;

-- Fix 7: Repair monitoring inconsistency
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