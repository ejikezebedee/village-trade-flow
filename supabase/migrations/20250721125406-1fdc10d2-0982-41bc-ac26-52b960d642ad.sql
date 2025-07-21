-- Create email verification table to track pending verifications
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL DEFAULT 'buyer',
  user_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own verification records" 
ON public.email_verifications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can manage verification records" 
ON public.email_verifications 
FOR ALL 
USING (true);

-- Create function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Create function to verify email and complete registration
CREATE OR REPLACE FUNCTION public.verify_email_and_complete_registration(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record public.email_verifications%ROWTYPE;
  profile_id UUID;
  result JSONB;
BEGIN
  -- Get verification record
  SELECT * INTO verification_record
  FROM public.email_verifications
  WHERE verification_token = p_token
    AND verified_at IS NULL
    AND expires_at > NOW();
  
  -- Check if token exists and is valid
  IF verification_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired verification token'
    );
  END IF;
  
  -- Mark as verified
  UPDATE public.email_verifications
  SET verified_at = NOW(),
      updated_at = NOW()
  WHERE id = verification_record.id;
  
  -- Create or update profile with verified status and role
  INSERT INTO public.profiles (
    user_id,
    user_type,
    first_name,
    last_name,
    verification_status,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    verification_record.user_id,
    verification_record.user_type,
    verification_record.user_data->>'first_name',
    verification_record.user_data->>'last_name',
    'verified',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    user_type = verification_record.user_type,
    first_name = verification_record.user_data->>'first_name',
    last_name = verification_record.user_data->>'last_name',
    verification_status = 'verified',
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO profile_id;
  
  -- Create notification for successful verification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority
  ) VALUES (
    verification_record.user_id,
    'account_verified',
    'Welcome to VillageMarket!',
    'Your account has been verified and you now have access to all ' || verification_record.user_type || ' features.',
    jsonb_build_object(
      'user_type', verification_record.user_type,
      'profile_id', profile_id
    ),
    'high'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_type', verification_record.user_type,
    'profile_id', profile_id,
    'message', 'Email verified successfully'
  );
END;
$$;

-- Create trigger to auto-expire old verification tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete expired verification tokens (older than 7 days)
  DELETE FROM public.email_verifications 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  RETURN NULL;
END;
$$;

-- Create trigger to run cleanup daily
CREATE OR REPLACE FUNCTION public.schedule_verification_cleanup()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be called by a scheduled job
  PERFORM public.cleanup_expired_verifications();
END;
$$;