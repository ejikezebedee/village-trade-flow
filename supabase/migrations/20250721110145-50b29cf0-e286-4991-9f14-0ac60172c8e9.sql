-- Create KYC verification system tables
CREATE TABLE public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired')),
  verification_level TEXT NOT NULL DEFAULT 'basic' CHECK (verification_level IN ('basic', 'enhanced', 'premium')),
  document_type TEXT CHECK (document_type IN ('passport', 'national_id', 'drivers_license', 'voters_card', 'other')),
  document_number TEXT,
  document_country TEXT,
  document_expiry_date DATE,
  verification_provider TEXT DEFAULT 'smile_identity' CHECK (verification_provider IN ('smile_identity', 'verifyme', 'manual')),
  provider_verification_id TEXT,
  confidence_score DECIMAL(5,2),
  verification_attempts INTEGER DEFAULT 0,
  last_attempt_date TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create document uploads table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_verification_id UUID NOT NULL REFERENCES public.kyc_verifications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'address_proof', 'additional')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'processed', 'rejected')),
  processing_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create verification audit log
CREATE TABLE public.kyc_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_verification_id UUID NOT NULL REFERENCES public.kyc_verifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'document_uploaded', 'submitted', 'review_started', 'verified', 'rejected', 'expired')),
  old_status TEXT,
  new_status TEXT,
  performed_by UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create verification requirements table
CREATE TABLE public.kyc_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_level TEXT NOT NULL CHECK (requirement_level IN ('basic', 'enhanced', 'premium')),
  required_documents TEXT[] NOT NULL,
  max_transaction_amount DECIMAL(10,2),
  daily_transaction_limit DECIMAL(10,2),
  monthly_transaction_limit DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add verification fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_level TEXT DEFAULT 'none' CHECK (kyc_level IN ('none', 'basic', 'enhanced', 'premium'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_verifications
CREATE POLICY "Users can view their own KYC verification" ON public.kyc_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own KYC verification" ON public.kyc_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own KYC verification" ON public.kyc_verifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all KYC verifications" ON public.kyc_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator'))
  );

-- RLS Policies for kyc_documents
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kyc_verifications kv 
      WHERE kv.id = kyc_verification_id AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload their own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kyc_verifications kv 
      WHERE kv.id = kyc_verification_id AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all KYC documents" ON public.kyc_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator'))
  );

-- RLS Policies for verification logs
CREATE POLICY "Users can view their own verification logs" ON public.kyc_verification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kyc_verifications kv 
      WHERE kv.id = kyc_verification_id AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create verification logs" ON public.kyc_verification_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for requirements
CREATE POLICY "Anyone can view active KYC requirements" ON public.kyc_requirements
  FOR SELECT USING (is_active = true);

-- Storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all KYC documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'kyc-documents' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator'))
  );

-- Functions for KYC management

-- Function to check if user can perform transaction
CREATE OR REPLACE FUNCTION public.can_user_transact(
  p_user_id UUID,
  p_transaction_amount DECIMAL DEFAULT 0
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_kyc_status TEXT;
  user_kyc_level TEXT;
  max_allowed_amount DECIMAL;
BEGIN
  -- Get user's KYC status
  SELECT kyc_status, kyc_level 
  INTO user_kyc_status, user_kyc_level
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- If user is not verified, block transactions
  IF user_kyc_status != 'verified' THEN
    RETURN false;
  END IF;
  
  -- Get transaction limits for user's KYC level
  SELECT max_transaction_amount 
  INTO max_allowed_amount
  FROM public.kyc_requirements 
  WHERE requirement_level = user_kyc_level AND is_active = true;
  
  -- Check if transaction amount is within limits
  IF p_transaction_amount > COALESCE(max_allowed_amount, 0) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to update profile KYC status
CREATE OR REPLACE FUNCTION public.update_profile_kyc_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile when KYC verification status changes
  UPDATE public.profiles 
  SET 
    kyc_status = NEW.verification_status,
    kyc_level = CASE 
      WHEN NEW.verification_status = 'verified' THEN NEW.verification_level
      ELSE 'none'
    END,
    verified_at = CASE 
      WHEN NEW.verification_status = 'verified' THEN NEW.verified_at
      ELSE NULL
    END,
    verification_expires_at = NEW.expires_at,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Log the status change
  INSERT INTO public.kyc_verification_logs (
    kyc_verification_id,
    event_type,
    old_status,
    new_status,
    performed_by,
    reason
  ) VALUES (
    NEW.id,
    CASE 
      WHEN NEW.verification_status = 'verified' THEN 'verified'
      WHEN NEW.verification_status = 'rejected' THEN 'rejected'
      ELSE 'status_updated'
    END,
    OLD.verification_status,
    NEW.verification_status,
    auth.uid(),
    'Status updated via system'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to update profile KYC status
CREATE TRIGGER update_profile_kyc_status_trigger
  AFTER UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_kyc_status();

-- Function to auto-expire verifications
CREATE OR REPLACE FUNCTION public.expire_kyc_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Insert default KYC requirements
INSERT INTO public.kyc_requirements (requirement_level, required_documents, max_transaction_amount, daily_transaction_limit, monthly_transaction_limit)
VALUES 
  ('basic', ARRAY['id_front', 'selfie'], 1000.00, 5000.00, 50000.00),
  ('enhanced', ARRAY['id_front', 'id_back', 'selfie', 'address_proof'], 10000.00, 25000.00, 250000.00),
  ('premium', ARRAY['id_front', 'id_back', 'selfie', 'address_proof', 'additional'], 100000.00, 100000.00, 1000000.00);

-- Create indexes for performance
CREATE INDEX idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON public.kyc_verifications(verification_status);
CREATE INDEX idx_kyc_documents_verification_id ON public.kyc_documents(kyc_verification_id);
CREATE INDEX idx_kyc_logs_verification_id ON public.kyc_verification_logs(kyc_verification_id);
CREATE INDEX idx_profiles_kyc_status ON public.profiles(kyc_status);