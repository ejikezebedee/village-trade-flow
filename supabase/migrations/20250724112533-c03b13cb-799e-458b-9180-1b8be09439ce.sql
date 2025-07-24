-- Drop conflicting function first
DROP FUNCTION IF EXISTS public.generate_qr_identifier(uuid, text);

-- =====================================
-- 1. SECURITY ALERTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID,
  target_id UUID,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'closed')),
  notified_channels JSONB DEFAULT '[]',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================
-- 2. SECURITY HEALTH CHECKS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.security_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning')),
  details JSONB DEFAULT '{}',
  error_message TEXT,
  fix_suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================
-- 3. ALERT SETTINGS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default alert settings
INSERT INTO public.alert_settings (setting_key, setting_value) VALUES
('failed_logins_threshold', '{"threshold": 5, "time_window_minutes": 10}'),
('role_change_alerts', '{"enabled": true, "severity": "high"}'),
('password_reset_threshold', '{"threshold": 5, "time_window_minutes": 60}'),
('escrow_anomaly_alerts', '{"enabled": true, "severity": "medium"}'),
('alert_recipients', '{"emails": [], "sms": []}')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================
-- 4. BACKUP LOGS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  file_path TEXT,
  file_size BIGINT,
  backup_duration_seconds INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================
-- 5. RLS POLICIES FOR NEW TABLES
-- =====================================
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Security alerts policies
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
FOR ALL TO authenticated
USING (is_admin());

-- Health checks policies
CREATE POLICY "Admins can view health checks" ON public.security_health_checks
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "System can insert health checks" ON public.security_health_checks
FOR INSERT TO authenticated
WITH CHECK (true);

-- Alert settings policies
CREATE POLICY "Admins can manage alert settings" ON public.alert_settings
FOR ALL TO authenticated
USING (is_admin());

-- Backup logs policies
CREATE POLICY "Admins can view backup logs" ON public.backup_logs
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "System can insert backup logs" ON public.backup_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- =====================================
-- 6. RECREATE QR IDENTIFIER FUNCTION
-- =====================================
CREATE OR REPLACE FUNCTION public.generate_qr_identifier(p_order_id uuid, p_stage text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  qr_code TEXT;
BEGIN
  qr_code := 'QR_' || UPPER(p_stage) || '_' || REPLACE(p_order_id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  RETURN qr_code;
END;
$$;