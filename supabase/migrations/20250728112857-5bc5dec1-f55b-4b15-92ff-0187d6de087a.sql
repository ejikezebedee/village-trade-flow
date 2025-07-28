-- Add unique user identification number to profiles
ALTER TABLE public.profiles 
ADD COLUMN unique_user_id TEXT UNIQUE;

-- Create sequence for user ID generation
CREATE SEQUENCE IF NOT EXISTS user_id_sequence START WITH 1;

-- Function to generate unique user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  user_id TEXT;
BEGIN
  -- Get next number from sequence
  SELECT nextval('user_id_sequence') INTO next_number;
  
  -- Format as UZ followed by 6-digit padded number
  user_id := 'UZ' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN user_id;
END;
$$;

-- Trigger to auto-generate unique user ID on profile creation
CREATE OR REPLACE FUNCTION public.handle_unique_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if unique_user_id is null
  IF NEW.unique_user_id IS NULL THEN
    NEW.unique_user_id := public.generate_unique_user_id();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating user ID
DROP TRIGGER IF EXISTS trigger_generate_unique_user_id ON public.profiles;
CREATE TRIGGER trigger_generate_unique_user_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_unique_user_id();

-- Create admin_credentials table for username/password login
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_credentials
CREATE POLICY "Only system can manage admin credentials"
ON public.admin_credentials
FOR ALL
USING (false)
WITH CHECK (false);

-- Function to verify admin credentials
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(p_username TEXT, p_password TEXT)
RETURNS TABLE(
  user_id UUID,
  profile_id UUID,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  profile_record RECORD;
BEGIN
  -- Find admin by username
  SELECT * INTO admin_record
  FROM public.admin_credentials
  WHERE username = p_username 
    AND is_active = true;
  
  IF admin_record.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false;
    RETURN;
  END IF;
  
  -- In production, use proper password hashing (bcrypt, etc.)
  -- For now, simple comparison (YOU MUST IMPROVE THIS)
  IF admin_record.password_hash = p_password THEN
    -- Update last login
    UPDATE public.admin_credentials 
    SET last_login = now(), updated_at = now()
    WHERE id = admin_record.id;
    
    -- Get profile
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE user_id = admin_record.user_id;
    
    RETURN QUERY SELECT admin_record.user_id, profile_record.id, true;
  ELSE
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false;
  END IF;
END;
$$;

-- Insert default admin credentials (password: admin123 - CHANGE THIS IN PRODUCTION)
INSERT INTO public.admin_credentials (username, password_hash, user_id)
SELECT 'admin', 'admin123', auth.users.id
FROM auth.users
JOIN public.profiles ON auth.users.id = public.profiles.user_id
WHERE public.profiles.user_role = 'admin'
LIMIT 1
ON CONFLICT (username) DO NOTHING;

-- Update existing profiles to have unique user IDs
UPDATE public.profiles 
SET unique_user_id = public.generate_unique_user_id()
WHERE unique_user_id IS NULL;