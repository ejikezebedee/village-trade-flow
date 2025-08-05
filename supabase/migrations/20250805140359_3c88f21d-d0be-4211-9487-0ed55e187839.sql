-- Phase 1: Critical Security Fixes (Fixed)

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

-- Drop existing policies if they exist before creating new ones
DROP POLICY IF EXISTS "Admins can view their own sessions" ON public.secure_admin_sessions;
DROP POLICY IF EXISTS "System can manage admin sessions" ON public.secure_admin_sessions;

CREATE POLICY "Admins can view their own sessions" ON public.secure_admin_sessions
FOR SELECT USING (admin_id = ((auth.uid())::text)::uuid);

CREATE POLICY "System can manage admin sessions" ON public.secure_admin_sessions
FOR ALL USING (true);