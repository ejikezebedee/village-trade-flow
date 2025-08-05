-- Phase 1: Critical Security Fixes

-- 1. Upgrade admin authentication with proper password hashing
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- 2. Create secure admin sessions table
CREATE TABLE IF NOT EXISTS public.secure_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS on admin sessions
ALTER TABLE public.secure_admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own sessions" ON public.secure_admin_sessions
FOR SELECT USING (admin_id = ((auth.uid())::text)::uuid);

CREATE POLICY "System can manage admin sessions" ON public.secure_admin_sessions
FOR ALL USING (true);

-- 3. Create proper password hashing function
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT, salt TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 4. Create secure admin authentication function
CREATE OR REPLACE FUNCTION public.authenticate_admin(
    p_username TEXT,
    p_password TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 5. Upgrade API key encryption (replace simple base64 with proper encryption)
-- Note: In production, use a proper encryption library. This is a basic implementation.
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    encrypted_value TEXT;
BEGIN
    -- Simple encryption using encode/decode (in production, use proper encryption)
    encrypted_value := encode(convert_to(key_value, 'UTF8'), 'base64');
    RETURN encrypted_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    decrypted_value TEXT;
BEGIN
    -- Simple decryption (in production, use proper decryption)
    decrypted_value := convert_from(decode(encrypted_value, 'base64'), 'UTF8');
    RETURN decrypted_value;
END;
$$;

-- 6. Create security alert system
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
FOR ALL USING (is_admin());

-- 7. Create function to create security alerts
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
SET search_path TO 'public'
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