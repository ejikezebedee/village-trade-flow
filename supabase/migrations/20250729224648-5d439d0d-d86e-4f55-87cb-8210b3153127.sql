-- ================================
-- COMPREHENSIVE SECURITY FIXES - FINAL VERSION
-- Phase 1: Critical Security Patches
-- ================================

-- 1. Create secure admin authentication system
CREATE TABLE IF NOT EXISTS public.secure_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Add password hashing support to admins table
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password_salt TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Create security audit table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id),
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create proper security alerts system
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS and create policies

-- Secure admin sessions RLS
ALTER TABLE public.secure_admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage their own sessions" ON public.secure_admin_sessions;
CREATE POLICY "Admins can manage their own sessions"
ON public.secure_admin_sessions
FOR ALL
USING (admin_id IN (
    SELECT id FROM public.admins 
    WHERE id = auth.uid()::text::uuid 
    AND is_active = true
));

-- Admin security audit RLS
ALTER TABLE public.admin_security_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_security_audit;
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_security_audit;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_security_audit;

CREATE POLICY "Super admins can view all audit logs"
ON public.admin_security_audit
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'super_admin' 
        AND is_active = true
    )
);

CREATE POLICY "Admins can view their own audit logs"
ON public.admin_security_audit
FOR SELECT
USING (admin_id = auth.uid()::text::uuid);

CREATE POLICY "System can insert audit logs"
ON public.admin_security_audit
FOR INSERT
WITH CHECK (true);

-- Security alerts RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage security alerts" ON public.security_alerts;
CREATE POLICY "Admins can manage security alerts"
ON public.security_alerts
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()::text::uuid 
        AND is_active = true
    )
);

-- Featured ads RLS
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Sellers can manage their own ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON public.featured_ads;

CREATE POLICY "Anyone can view active ads"
ON public.featured_ads
FOR SELECT
USING (status = 'active' AND starts_at <= now() AND expires_at >= now());

CREATE POLICY "Sellers can manage their own ads"
ON public.featured_ads
FOR ALL
USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all ads"
ON public.featured_ads
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()::text::uuid 
        AND is_active = true
    )
);

-- Premium subscriptions RLS
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.premium_subscriptions;

CREATE POLICY "Users can view their own subscriptions"
ON public.premium_subscriptions
FOR SELECT
USING (seller_id = auth.uid());

CREATE POLICY "Users can create their own subscriptions"
ON public.premium_subscriptions
FOR INSERT
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions"
ON public.premium_subscriptions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()::text::uuid 
        AND is_active = true
    )
);

-- Monetization config RLS
ALTER TABLE public.monetization_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage monetization config" ON public.monetization_config;
CREATE POLICY "Admins can manage monetization config"
ON public.monetization_config
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()::text::uuid 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
);

-- 4. Create secure password hashing function
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT, salt TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hashed_password TEXT;
    password_salt TEXT;
BEGIN
    -- Generate salt if not provided
    IF salt IS NULL THEN
        password_salt := encode(gen_random_bytes(32), 'base64');
    ELSE
        password_salt := salt;
    END IF;
    
    -- Create hash using SHA-256 with salt
    hashed_password := encode(digest(password || password_salt, 'sha256'), 'hex');
    
    RETURN jsonb_build_object(
        'hash', hashed_password,
        'salt', password_salt
    );
END;
$$;

-- 5. Create security alert functions
CREATE OR REPLACE FUNCTION public.create_security_alert(
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.security_alerts (
        alert_type, severity, title, message, metadata
    ) VALUES (
        p_alert_type, p_severity, p_title, p_message, p_metadata
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$;

-- 6. Create secure admin authentication function
CREATE OR REPLACE FUNCTION public.authenticate_admin(p_username TEXT, p_password TEXT, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_record public.admins%ROWTYPE;
    expected_hash TEXT;
    session_token TEXT;
    result JSONB;
BEGIN
    -- Find admin by username
    SELECT * INTO admin_record
    FROM public.admins
    WHERE username = p_username AND is_active = true;
    
    -- Check if admin exists
    IF admin_record.id IS NULL THEN
        -- Log failed attempt
        INSERT INTO public.admin_security_audit (
            action_type, ip_address, user_agent, success, failure_reason
        ) VALUES (
            'admin_login_attempt', p_ip_address, p_user_agent, false, 'Invalid username'
        );
        
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Check if account is locked
    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account temporarily locked');
    END IF;
    
    -- Verify password using new hash if available, fallback to old method
    IF admin_record.password_hash IS NOT NULL AND admin_record.password_salt IS NOT NULL THEN
        expected_hash := (public.hash_password(p_password, admin_record.password_salt)->>'hash');
        IF expected_hash != admin_record.password_hash THEN
            -- Increment failed attempts
            UPDATE public.admins 
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '15 minutes' ELSE NULL END
            WHERE id = admin_record.id;
            
            -- Log failed attempt
            INSERT INTO public.admin_security_audit (
                admin_id, action_type, ip_address, user_agent, success, failure_reason
            ) VALUES (
                admin_record.id, 'admin_login_attempt', p_ip_address, p_user_agent, false, 'Invalid password'
            );
            
            RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
        END IF;
    ELSE
        -- Fallback to old password method (migrate this admin)
        IF admin_record.password != p_password THEN
            -- Increment failed attempts
            UPDATE public.admins 
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '15 minutes' ELSE NULL END
            WHERE id = admin_record.id;
            
            RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
        END IF;
        
        -- Migrate to secure password hashing
        DECLARE
            new_hash_data JSONB;
        BEGIN
            new_hash_data := public.hash_password(p_password);
            UPDATE public.admins 
            SET password_hash = new_hash_data->>'hash',
                password_salt = new_hash_data->>'salt'
            WHERE id = admin_record.id;
        END;
    END IF;
    
    -- Generate session token using base64 encoding
    session_token := encode(gen_random_bytes(32), 'base64');
    
    -- Create session
    INSERT INTO public.secure_admin_sessions (
        admin_id, session_token, expires_at, ip_address, user_agent
    ) VALUES (
        admin_record.id, session_token, now() + INTERVAL '8 hours', p_ip_address, p_user_agent
    );
    
    -- Reset failed login attempts and update last login
    UPDATE public.admins 
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = now()
    WHERE id = admin_record.id;
    
    -- Log successful login
    INSERT INTO public.admin_security_audit (
        admin_id, action_type, ip_address, user_agent, success
    ) VALUES (
        admin_record.id, 'admin_login_success', p_ip_address, p_user_agent, true
    );
    
    result := jsonb_build_object(
        'success', true,
        'admin_id', admin_record.id,
        'username', admin_record.username,
        'role', admin_record.role,
        'session_token', session_token
    );
    
    RETURN result;
END;
$$;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secure_admin_sessions_token ON public.secure_admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_secure_admin_sessions_expires ON public.secure_admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_admin_id ON public.admin_security_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_created_at ON public.admin_security_audit(created_at);

-- 8. Force immediate password migration for existing admins
UPDATE public.admins 
SET password_reset_token = encode(gen_random_bytes(32), 'base64'),
    password_reset_expires = now() + INTERVAL '24 hours'
WHERE password_hash IS NULL;

-- Create alert for admin password migration needed
INSERT INTO public.security_alerts (
    alert_type, severity, title, message, metadata
) VALUES (
    'admin_migration_required',
    'critical',
    'Admin Password Migration Required',
    'All admin accounts need to migrate to secure password hashing. Existing admins must reset their passwords.',
    jsonb_build_object('migration_date', now())
);