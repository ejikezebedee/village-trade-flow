-- =====================================================================
-- MASSIVE FUNCTION HARDENING - BATCH UPDATE ALL REMAINING FUNCTIONS
-- =====================================================================
-- This migration systematically adds SET search_path = '' to ALL remaining functions
-- Using CREATE OR REPLACE to avoid dependency issues

-- Update all remaining functions in alphabetical order with search_path hardening
-- We'll update them one by one with CREATE OR REPLACE to maintain existing behavior

-- 1. decrypt_api_key
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  -- Simple decryption (in production, use proper decryption)
  decrypted_value := convert_from(decode(encrypted_value, 'base64'), 'UTF8');
  RETURN decrypted_value;
END;
$$;

-- 2. detect_and_save_user_language
CREATE OR REPLACE FUNCTION public.detect_and_save_user_language(p_user_id uuid, p_accept_language text, p_detected_region text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  detected_language text;
  language_confidence numeric;
BEGIN
  -- Parse Accept-Language header to extract primary language
  detected_language := CASE
    WHEN p_accept_language ILIKE 'en%' THEN 'en'
    WHEN p_accept_language ILIKE 'es%' THEN 'es' 
    WHEN p_accept_language ILIKE 'fr%' THEN 'fr'
    WHEN p_accept_language ILIKE 'de%' THEN 'de'
    WHEN p_accept_language ILIKE 'pt%' THEN 'pt'
    WHEN p_accept_language ILIKE 'ar%' THEN 'ar'
    WHEN p_accept_language ILIKE 'zh%' THEN 'zh'
    WHEN p_accept_language ILIKE 'ru%' THEN 'ru'
    ELSE 'en' -- Default to English
  END;
  
  language_confidence := CASE
    WHEN detected_language != 'en' THEN 0.9
    ELSE 0.5 -- Lower confidence for default
  END;
  
  -- Save detected language preference
  INSERT INTO public.user_language_preferences (
    user_id, detected_language, confidence_score, browser_language, region
  ) VALUES (
    p_user_id, detected_language, language_confidence, p_accept_language, p_detected_region
  )
  ON CONFLICT (user_id) DO UPDATE SET
    detected_language = EXCLUDED.detected_language,
    confidence_score = EXCLUDED.confidence_score,
    browser_language = EXCLUDED.browser_language,
    region = EXCLUDED.region,
    updated_at = now();
  
  RETURN detected_language;
END;
$$;

-- 3. encrypt_api_key  
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encrypted_value TEXT;
BEGIN
  -- Simple encryption using encode/decode (in production, use proper encryption)
  encrypted_value := encode(convert_to(key_value, 'UTF8'), 'base64');
  RETURN encrypted_value;
END;
$$;

-- 4. encrypt_sensitive_data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data jsonb, p_key_purpose text DEFAULT 'profile_data'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  key_record RECORD;
  encrypted_result JSONB;
  audit_id UUID;
BEGIN
  -- Get or create encryption key for the purpose
  SELECT * INTO key_record 
  FROM public.encryption_keys 
  WHERE key_purpose = p_key_purpose 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- For this implementation, we'll mark data as "encrypted" 
  -- In production, you would integrate with actual encryption libraries
  encrypted_result := jsonb_build_object(
    'encrypted', true,
    'algorithm', 'AES-256-GCM',
    'key_id', COALESCE(key_record.key_id, 'system-default'),
    'data_hash', encode(digest(p_data::text, 'sha256'), 'hex'),
    'encrypted_at', extract(epoch from now())
  );
  
  -- Audit the encryption operation
  INSERT INTO public.encryption_audit_logs (
    operation_type, table_name, key_id, performed_by, success, operation_metadata
  ) VALUES (
    'encrypt', 'general', COALESCE(key_record.key_id, 'system-default'), 
    auth.uid(), true, jsonb_build_object('purpose', p_key_purpose)
  ) RETURNING id INTO audit_id;
  
  RETURN encrypted_result;
END;
$$;

-- 5. expire_kyc_verifications
CREATE OR REPLACE FUNCTION public.expire_kyc_verifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired verifications
  UPDATE public.kyc_verifications 
  SET 
    verification_status = 'expired',
    updated_at = now()
  WHERE 
    verification_status = 'verified' 
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- 6. generate_qr_identifier
CREATE OR REPLACE FUNCTION public.generate_qr_identifier(order_uuid uuid, stage text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  identifier TEXT;
BEGIN
  identifier := stage || '_' || REPLACE(order_uuid::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  RETURN identifier;
END;
$$;

-- 7. generate_receipt_number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  receipt_number TEXT;
BEGIN
  receipt_number := 'RCP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN receipt_number;
END;
$$;

-- 8. generate_secure_qr
CREATE OR REPLACE FUNCTION public.generate_secure_qr(p_order_id uuid, p_stage text, p_expires_hours integer DEFAULT 24)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  qr_identifier TEXT;
  security_hash TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  expires_at := now() + (p_expires_hours || ' hours')::INTERVAL;
  
  -- Generate unique QR identifier
  qr_identifier := 'QR_' || UPPER(p_stage) || '_' || REPLACE(p_order_id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  
  -- Generate security hash
  security_hash := encode(digest(qr_identifier || p_order_id::TEXT || extract(epoch from expires_at)::TEXT, 'sha256'), 'hex');
  
  -- Store QR verification entry
  INSERT INTO public.qr_verification_logs (
    order_id, qr_code, scan_stage, scanned_by, security_hash, expires_at, verification_status
  ) VALUES (
    p_order_id, qr_identifier, p_stage, auth.uid(), security_hash, expires_at, 'pending'
  );
  
  RETURN qr_identifier;
END;
$$;

-- 9. generate_short_lived_otp
CREATE OR REPLACE FUNCTION public.generate_short_lived_otp()
RETURNS TABLE(code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  otp_code TEXT;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiry to 5 minutes from now (enhanced security)
  expiry_time := now() + INTERVAL '5 minutes';
  
  RETURN QUERY SELECT otp_code, expiry_time;
END;
$$;

-- 10. generate_transfer_reference
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  ref_number TEXT;
BEGIN
  ref_number := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN ref_number;
END;
$$;

-- 11. generate_unique_user_id
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
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

-- 12. get_api_key
CREATE OR REPLACE FUNCTION public.get_api_key(p_key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encrypted_value TEXT;
  decrypted_value TEXT;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access API keys';
  END IF;

  -- Get encrypted value
  SELECT key_value INTO encrypted_value 
  FROM public.api_keys 
  WHERE key_name = p_key_name AND is_active = true;
  
  IF encrypted_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt and return
  decrypted_value := public.decrypt_api_key(encrypted_value);
  
  -- Update usage stats
  UPDATE public.api_keys 
  SET last_used_at = now(), usage_count = usage_count + 1
  WHERE key_name = p_key_name;
  
  -- Log usage
  INSERT INTO public.api_key_audit (
    api_key_id, 
    action_type, 
    performed_by
  ) SELECT 
    id, 
    'used', 
    auth.uid()
  FROM public.api_keys 
  WHERE key_name = p_key_name;
  
  RETURN decrypted_value;
END;
$$;