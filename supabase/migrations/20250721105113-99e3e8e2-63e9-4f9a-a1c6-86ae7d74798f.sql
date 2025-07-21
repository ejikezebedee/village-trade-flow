-- Create dispute resolution system tables
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  filed_by UUID NOT NULL,
  respondent_id UUID NOT NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('delivery', 'quality', 'payment', 'fraud', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'mediation', 'resolved', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution_tier TEXT NOT NULL DEFAULT 'automated' CHECK (resolution_tier IN ('automated', 'community', 'admin')),
  assigned_mediator_id UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dispute evidence table
CREATE TABLE public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'document', 'message', 'receipt', 'video', 'other')),
  file_url TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mediators table for community mediation
CREATE TABLE public.mediators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  specializations TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_cases INTEGER DEFAULT 0,
  successful_resolutions INTEGER DEFAULT 0,
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dispute votes table for community resolution
CREATE TABLE public.dispute_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  mediator_id UUID NOT NULL REFERENCES public.mediators(id),
  vote TEXT NOT NULL CHECK (vote IN ('favor_complainant', 'favor_respondent', 'partial_resolution', 'insufficient_evidence')),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dispute_id, mediator_id)
);

-- Enhanced QR tracking table
CREATE TABLE public.qr_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  qr_code TEXT NOT NULL,
  scan_stage TEXT NOT NULL,
  scanned_by UUID NOT NULL,
  location_data JSONB,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'expired')),
  security_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment escrow tracking enhancement
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  stripe_payment_intent_id TEXT,
  amount_held DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  escrow_status TEXT NOT NULL DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  auto_release_date TIMESTAMPTZ,
  released_by TEXT,
  release_reason TEXT,
  platform_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Users can view disputes they're involved in" ON public.disputes
  FOR SELECT USING (
    filed_by = auth.uid() OR 
    respondent_id = auth.uid() OR 
    assigned_mediator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "Users can create disputes for their orders" ON public.disputes
  FOR INSERT WITH CHECK (
    filed_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
  );

CREATE POLICY "Mediators and admins can update disputes" ON public.disputes
  FOR UPDATE USING (
    assigned_mediator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator'))
  );

-- RLS Policies for dispute evidence
CREATE POLICY "Users can view evidence for their disputes" ON public.dispute_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.disputes 
      WHERE id = dispute_id AND (
        filed_by = auth.uid() OR 
        respondent_id = auth.uid() OR 
        assigned_mediator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can submit evidence for their disputes" ON public.dispute_evidence
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.disputes 
      WHERE id = dispute_id AND (filed_by = auth.uid() OR respondent_id = auth.uid())
    )
  );

-- RLS Policies for mediators
CREATE POLICY "Anyone can view active mediators" ON public.mediators
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their mediator profile" ON public.mediators
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for QR verification logs
CREATE POLICY "Users can view QR logs for their orders" ON public.qr_verification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid() OR driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create QR verification logs" ON public.qr_verification_logs
  FOR INSERT WITH CHECK (scanned_by = auth.uid());

-- RLS Policies for escrow transactions
CREATE POLICY "Users can view escrow for their orders" ON public.escrow_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Functions for dispute resolution automation

-- Function to auto-assign mediators
CREATE OR REPLACE FUNCTION public.assign_mediator_to_dispute(dispute_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  selected_mediator_id UUID;
  dispute_specialization TEXT;
BEGIN
  -- Get dispute type to match with mediator specialization
  SELECT dispute_type INTO dispute_specialization FROM public.disputes WHERE id = dispute_uuid;
  
  -- Find available mediator with relevant specialization and lowest current caseload
  SELECT m.id INTO selected_mediator_id
  FROM public.mediators m
  LEFT JOIN (
    SELECT assigned_mediator_id, COUNT(*) as active_cases
    FROM public.disputes 
    WHERE status IN ('investigating', 'mediation') 
    GROUP BY assigned_mediator_id
  ) active ON m.id = active.assigned_mediator_id
  WHERE m.is_active = true 
    AND (dispute_specialization = ANY(m.specializations) OR array_length(m.specializations, 1) IS NULL)
  ORDER BY COALESCE(active.active_cases, 0), m.rating DESC
  LIMIT 1;
  
  -- Update dispute with assigned mediator
  IF selected_mediator_id IS NOT NULL THEN
    UPDATE public.disputes 
    SET assigned_mediator_id = selected_mediator_id,
        status = 'mediation',
        resolution_tier = 'community',
        updated_at = now()
    WHERE id = dispute_uuid;
  END IF;
  
  RETURN selected_mediator_id;
END;
$$;

-- Function to calculate dispute resolution based on votes
CREATE OR REPLACE FUNCTION public.resolve_dispute_by_votes(dispute_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_counts RECORD;
  resolution_decision TEXT;
BEGIN
  -- Count votes for the dispute
  SELECT 
    COUNT(CASE WHEN vote = 'favor_complainant' THEN 1 END) as favor_complainant,
    COUNT(CASE WHEN vote = 'favor_respondent' THEN 1 END) as favor_respondent,
    COUNT(CASE WHEN vote = 'partial_resolution' THEN 1 END) as partial_resolution,
    COUNT(CASE WHEN vote = 'insufficient_evidence' THEN 1 END) as insufficient_evidence,
    COUNT(*) as total_votes
  INTO vote_counts
  FROM public.dispute_votes
  WHERE dispute_id = dispute_uuid;
  
  -- Determine resolution based on majority vote
  IF vote_counts.favor_complainant > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Resolved in favor of complainant';
  ELSIF vote_counts.favor_respondent > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Resolved in favor of respondent';
  ELSIF vote_counts.partial_resolution > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Partial resolution - compensation required';
  ELSIF vote_counts.insufficient_evidence > vote_counts.total_votes / 2 THEN
    resolution_decision := 'Insufficient evidence - case dismissed';
  ELSE
    resolution_decision := 'No clear majority - escalating to admin review';
  END IF;
  
  -- Update dispute with resolution
  UPDATE public.disputes 
  SET status = 'resolved',
      resolution_notes = resolution_decision,
      resolved_at = now(),
      updated_at = now()
  WHERE id = dispute_uuid;
  
  RETURN resolution_decision;
END;
$$;

-- Enhanced QR code generation with security
CREATE OR REPLACE FUNCTION public.generate_secure_qr(p_order_id UUID, p_stage TEXT, p_expires_hours INTEGER DEFAULT 24)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to verify QR scan
CREATE OR REPLACE FUNCTION public.verify_qr_scan(p_qr_code TEXT, p_scanner_id UUID, p_location JSONB DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qr_record RECORD;
  expected_scanner UUID;
  is_valid BOOLEAN := false;
BEGIN
  -- Get QR verification record
  SELECT * INTO qr_record
  FROM public.qr_verification_logs
  WHERE qr_code = p_qr_code AND verification_status = 'pending';
  
  -- Check if QR exists and not expired
  IF qr_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  IF qr_record.expires_at < now() THEN
    UPDATE public.qr_verification_logs 
    SET verification_status = 'expired' 
    WHERE id = qr_record.id;
    RETURN false;
  END IF;
  
  -- Verify scanner based on stage
  CASE qr_record.scan_stage
    WHEN 'seller_to_driver' THEN
      SELECT driver_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
    WHEN 'driver_to_shop' THEN  
      SELECT shop_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
    WHEN 'shop_to_buyer' THEN
      SELECT buyer_id INTO expected_scanner FROM public.orders WHERE id = qr_record.order_id;
  END CASE;
  
  -- Validate scanner
  IF expected_scanner = p_scanner_id THEN
    is_valid := true;
    
    -- Update verification log
    UPDATE public.qr_verification_logs 
    SET verification_status = 'verified',
        scanned_by = p_scanner_id,
        location_data = p_location,
        scanned_at = now()
    WHERE id = qr_record.id;
    
    -- Update order stage
    CASE qr_record.scan_stage
      WHEN 'seller_to_driver' THEN
        UPDATE public.orders SET current_stage = 'in_transit', updated_at = now() WHERE id = qr_record.order_id;
      WHEN 'driver_to_shop' THEN
        UPDATE public.orders SET current_stage = 'shop_delivery', updated_at = now() WHERE id = qr_record.order_id;
      WHEN 'shop_to_buyer' THEN
        UPDATE public.orders SET current_stage = 'completed', order_status = 'delivered', updated_at = now() WHERE id = qr_record.order_id;
    END CASE;
  END IF;
  
  RETURN is_valid;
END;
$$;

-- Triggers for automated dispute handling
CREATE OR REPLACE FUNCTION public.auto_handle_new_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-assign disputes based on type and urgency
  IF NEW.dispute_type = 'payment' AND NEW.priority = 'urgent' THEN
    NEW.resolution_tier := 'admin';
  ELSIF NEW.dispute_type IN ('delivery', 'quality') THEN
    NEW.resolution_tier := 'community';
    -- Auto-assign mediator after insert
  ELSE
    NEW.resolution_tier := 'automated';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_new_dispute_trigger
  BEFORE INSERT ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_handle_new_dispute();

-- Create indexes for performance
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);
CREATE INDEX idx_qr_verification_order_id ON public.qr_verification_logs(order_id);
CREATE INDEX idx_qr_verification_code ON public.qr_verification_logs(qr_code);
CREATE INDEX idx_escrow_order_id ON public.escrow_transactions(order_id);