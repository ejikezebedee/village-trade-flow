-- Add 2FA support to profiles table
ALTER TABLE public.profiles ADD COLUMN two_factor_enabled boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN two_factor_secret text;
ALTER TABLE public.profiles ADD COLUMN two_factor_backup_codes text[];
ALTER TABLE public.profiles ADD COLUMN two_factor_verified_at timestamp with time zone;

-- Create 2FA verification logs table
CREATE TABLE public.two_factor_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  verification_method text NOT NULL, -- 'email' or 'totp'
  verification_code text,
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on 2FA logs
ALTER TABLE public.two_factor_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for 2FA logs
CREATE POLICY "Users can create their own 2FA verification codes" 
ON public.two_factor_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own 2FA verification codes" 
ON public.two_factor_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA verification codes" 
ON public.two_factor_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate 6-digit verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$;

-- Create function to verify 2FA code
CREATE OR REPLACE FUNCTION public.verify_two_factor_code(
  p_user_id uuid,
  p_code text,
  p_method text DEFAULT 'email'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
BEGIN
  -- Find valid, unused verification code
  SELECT * INTO verification_record
  FROM public.two_factor_logs
  WHERE user_id = p_user_id
    AND verification_code = p_code
    AND verification_method = p_method
    AND expires_at > now()
    AND is_used = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If valid code found, mark as used
  IF verification_record.id IS NOT NULL THEN
    UPDATE public.two_factor_logs
    SET is_used = true, used_at = now()
    WHERE id = verification_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create function to generate and store 2FA code
CREATE OR REPLACE FUNCTION public.create_two_factor_code(
  p_user_id uuid,
  p_method text DEFAULT 'email',
  p_expires_minutes integer DEFAULT 10
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_code text;
  expires_at timestamp with time zone;
BEGIN
  verification_code := public.generate_verification_code();
  expires_at := now() + (p_expires_minutes || ' minutes')::interval;
  
  -- Insert verification code
  INSERT INTO public.two_factor_logs (
    user_id,
    verification_method,
    verification_code,
    expires_at
  ) VALUES (
    p_user_id,
    p_method,
    verification_code,
    expires_at
  );
  
  RETURN verification_code;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();