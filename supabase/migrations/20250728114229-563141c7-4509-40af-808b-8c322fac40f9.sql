-- Clean up existing admin system and rebuild from scratch
DROP FUNCTION IF EXISTS public.verify_admin_credentials(text, text);
DROP TABLE IF EXISTS public.admin_credentials CASCADE;

-- Create a simple admins table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Plain text for now (can be hashed later)
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view their own data" ON public.admins
    FOR SELECT USING (true); -- Allow reading for verification

CREATE POLICY "System can manage admins" ON public.admins
    FOR ALL USING (true);

-- Insert default admin account
INSERT INTO public.admins (username, password, role) 
VALUES ('admin', 'admin123', 'admin');

-- Create simple admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_login(
    p_username TEXT,
    p_password TEXT
) RETURNS TABLE(
    admin_id UUID,
    username TEXT,
    role TEXT,
    success BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Find admin by username and password
    SELECT * INTO admin_record
    FROM public.admins
    WHERE admins.username = p_username 
        AND admins.password = p_password 
        AND is_active = true;
    
    IF admin_record.id IS NOT NULL THEN
        -- Update last login timestamp
        UPDATE public.admins 
        SET updated_at = NOW()
        WHERE id = admin_record.id;
        
        -- Return success
        RETURN QUERY SELECT admin_record.id, admin_record.username, admin_record.role, true;
    ELSE
        -- Return failure
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, false;
    END IF;
END;
$$;

-- Update profiles table to ensure admin role is properly set
UPDATE public.profiles 
SET user_role = 'admin', user_type = 'admin'
WHERE user_id IN (
    SELECT user_id FROM public.profiles 
    WHERE user_role = 'admin' OR user_type = 'admin'
    LIMIT 1
);