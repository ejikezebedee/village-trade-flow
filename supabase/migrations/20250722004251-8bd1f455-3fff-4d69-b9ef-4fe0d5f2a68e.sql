-- Create affiliate program tables

-- Affiliate profiles table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  commission_tier TEXT NOT NULL DEFAULT 'bronze',
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0.00,
  total_earnings NUMERIC NOT NULL DEFAULT 0.00,
  pending_earnings NUMERIC NOT NULL DEFAULT 0.00,
  paid_earnings NUMERIC NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Referrals tracking table
CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  source_url TEXT,
  conversion_status TEXT NOT NULL DEFAULT 'pending',
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commission tracking table
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC NOT NULL DEFAULT 0.00,
  order_amount NUMERIC NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Payout requests table
CREATE TABLE public.affiliate_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  requested_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Commission tier configuration
CREATE TABLE public.affiliate_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL,
  min_referrals INTEGER NOT NULL DEFAULT 0,
  min_sales NUMERIC NOT NULL DEFAULT 0.00,
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default commission tiers
INSERT INTO public.affiliate_tiers (tier_name, commission_rate, min_referrals, min_sales, benefits) VALUES
('bronze', 0.05, 0, 0.00, '["5% commission on all sales", "Access to promotional materials", "Monthly earnings reports"]'::jsonb),
('silver', 0.08, 50, 5000.00, '["8% commission on all sales", "Priority customer support", "Advanced analytics", "Custom referral links"]'::jsonb),
('gold', 0.12, 100, 15000.00, '["12% commission on all sales", "Dedicated account manager", "Early access to new products", "Custom promotional materials"]'::jsonb),
('diamond', 0.15, 200, 50000.00, '["15% commission on all sales", "VIP support", "Exclusive product previews", "Co-marketing opportunities", "Higher payout frequency"]'::jsonb);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Affiliates can view their own profile"
ON public.affiliates FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their affiliate profile"
ON public.affiliates FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Affiliates can update their own profile"
ON public.affiliates FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- RLS Policies for referrals
CREATE POLICY "Affiliates can view their referrals"
ON public.affiliate_referrals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE id = affiliate_referrals.affiliate_id 
  AND user_id = auth.uid()
));

CREATE POLICY "System can create referrals"
ON public.affiliate_referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals"
ON public.affiliate_referrals FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view their commissions"
ON public.affiliate_commissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE id = affiliate_commissions.affiliate_id 
  AND user_id = auth.uid()
));

CREATE POLICY "System can manage commissions"
ON public.affiliate_commissions FOR ALL
WITH CHECK (true);

CREATE POLICY "Admins can manage all commissions"
ON public.affiliate_commissions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- RLS Policies for payouts
CREATE POLICY "Affiliates can manage their payouts"
ON public.affiliate_payouts FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE id = affiliate_payouts.affiliate_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payouts"
ON public.affiliate_payouts FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- RLS Policies for tiers
CREATE POLICY "Anyone can view active tiers"
ON public.affiliate_tiers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
ON public.affiliate_tiers FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- Functions for affiliate management

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
    code := replace(replace(replace(code, '+', ''), '/', ''), '=', '');
    
    SELECT COUNT(*) INTO exists_check 
    FROM public.affiliates 
    WHERE referral_code = code;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Auto-assign tier based on performance
CREATE OR REPLACE FUNCTION public.update_affiliate_tier(affiliate_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  affiliate_record public.affiliates%ROWTYPE;
  new_tier_record public.affiliate_tiers%ROWTYPE;
  new_tier TEXT;
BEGIN
  -- Get affiliate data
  SELECT * INTO affiliate_record FROM public.affiliates WHERE id = affiliate_uuid;
  
  -- Find appropriate tier
  SELECT * INTO new_tier_record
  FROM public.affiliate_tiers
  WHERE is_active = true
    AND affiliate_record.total_referrals >= min_referrals
    AND affiliate_record.total_sales >= min_sales
  ORDER BY commission_rate DESC
  LIMIT 1;
  
  new_tier := COALESCE(new_tier_record.tier_name, 'bronze');
  
  -- Update affiliate tier
  UPDATE public.affiliates 
  SET commission_tier = new_tier,
      updated_at = now()
  WHERE id = affiliate_uuid;
  
  RETURN new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process commission when order is completed
CREATE OR REPLACE FUNCTION public.process_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record public.affiliate_referrals%ROWTYPE;
  affiliate_record public.affiliates%ROWTYPE;
  tier_record public.affiliate_tiers%ROWTYPE;
  commission_amount NUMERIC;
BEGIN
  -- Only process for completed/delivered orders
  IF NEW.order_status != 'delivered' OR OLD.order_status = 'delivered' THEN
    RETURN NEW;
  END IF;
  
  -- Check if this order came from a referral
  SELECT * INTO referral_record
  FROM public.affiliate_referrals
  WHERE referred_user_id = NEW.buyer_id
    AND conversion_status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF referral_record.id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get affiliate and tier info
  SELECT * INTO affiliate_record FROM public.affiliates WHERE id = referral_record.affiliate_id;
  SELECT * INTO tier_record FROM public.affiliate_tiers WHERE tier_name = affiliate_record.commission_tier;
  
  -- Calculate commission
  commission_amount := NEW.total_amount * tier_record.commission_rate;
  
  -- Create commission record
  INSERT INTO public.affiliate_commissions (
    affiliate_id, referral_id, order_id, commission_amount, 
    commission_rate, order_amount, status
  ) VALUES (
    affiliate_record.id, referral_record.id, NEW.id, commission_amount,
    tier_record.commission_rate, NEW.total_amount, 'pending'
  );
  
  -- Update affiliate stats
  UPDATE public.affiliates 
  SET total_sales = total_sales + NEW.total_amount,
      pending_earnings = pending_earnings + commission_amount,
      updated_at = now()
  WHERE id = affiliate_record.id;
  
  -- Mark referral as converted
  UPDATE public.affiliate_referrals
  SET conversion_status = 'converted',
      converted_at = now()
  WHERE id = referral_record.id;
  
  -- Update tier if necessary
  PERFORM public.update_affiliate_tier(affiliate_record.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for commission processing
CREATE TRIGGER process_affiliate_commission_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_affiliate_commission();

-- Function to track referral visits
CREATE OR REPLACE FUNCTION public.track_affiliate_referral(
  p_referral_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  affiliate_record public.affiliates%ROWTYPE;
  referral_id UUID;
BEGIN
  -- Find affiliate by referral code
  SELECT * INTO affiliate_record 
  FROM public.affiliates 
  WHERE referral_code = p_referral_code AND status = 'active';
  
  IF affiliate_record.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Create referral record
  INSERT INTO public.affiliate_referrals (
    affiliate_id, referred_user_id, referral_code, 
    ip_address, user_agent, source_url
  ) VALUES (
    affiliate_record.id, p_user_id, p_referral_code,
    p_ip_address, p_user_agent, p_source_url
  ) RETURNING id INTO referral_id;
  
  -- Update affiliate referral count
  UPDATE public.affiliates 
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE id = affiliate_record.id;
  
  RETURN referral_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;