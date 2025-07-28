-- Create admin earnings and commission tracking tables
CREATE TABLE public.admin_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earnings_type TEXT NOT NULL, -- 'transaction_commission', 'escrow_fee', 'premium_upgrade', 'ad_spot'
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  order_id UUID REFERENCES public.orders(id),
  seller_id UUID,
  buyer_id UUID,
  commission_percent NUMERIC DEFAULT 5.0,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  admin_wallet_address TEXT,
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create token rewards tracking table
CREATE TABLE public.token_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  reward_type TEXT NOT NULL, -- 'buyer', 'seller', 'agent'
  amount NUMERIC NOT NULL DEFAULT 0,
  source_amount NUMERIC NOT NULL DEFAULT 0, -- Original purchase amount
  reward_rate NUMERIC NOT NULL DEFAULT 0.01,
  status TEXT DEFAULT 'pending', -- 'pending', 'claimed', 'failed'
  claimed_at TIMESTAMPTZ,
  wallet_address TEXT,
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create premium seller subscriptions table
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'premium_seller',
  amount NUMERIC NOT NULL DEFAULT 10.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create featured product ads table
CREATE TABLE public.featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  seller_id UUID NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'homepage_featured', -- 'homepage_featured', 'category_top'
  amount_paid NUMERIC NOT NULL DEFAULT 4.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_days INTEGER DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  payment_status TEXT DEFAULT 'completed',
  stripe_payment_intent_id TEXT,
  admin_earnings_id UUID REFERENCES public.admin_earnings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system configuration table for monetization settings
CREATE TABLE public.monetization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default monetization configuration
INSERT INTO public.monetization_config (config_key, config_value, description) VALUES
('transaction_commission', '{"percent": 5.0, "enabled": true}', 'Platform commission percentage per transaction'),
('escrow_processing_fee', '{"amount": 1.0, "currency": "USD", "enabled": true}', 'Fixed escrow processing fee'),
('token_rewards', '{"buyer_rate": 0.01, "seller_rate": 0.05, "agent_rate": 0.10, "enabled": true}', 'ZSHOP token reward rates'),
('premium_seller_pricing', '{"monthly": 10.0, "yearly": 100.0, "currency": "USD", "enabled": true}', 'Premium seller subscription pricing'),
('featured_ad_pricing', '{"homepage": 4.0, "category": 2.0, "currency": "USD", "duration_days": 7, "enabled": true}', 'Featured product ad pricing'),
('admin_wallet_config', '{"solana_address": "", "stripe_account": "", "paypal_email": "", "usdt_address": "", "default_method": "stripe"}', 'Admin payout wallet configuration');

-- Enable RLS for all tables
ALTER TABLE public.admin_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_earnings
CREATE POLICY "Admins can manage all earnings" ON public.admin_earnings
FOR ALL USING (is_admin());

-- RLS Policies for token_rewards
CREATE POLICY "Users can view their own token rewards" ON public.token_rewards
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all token rewards" ON public.token_rewards
FOR ALL USING (is_admin());

CREATE POLICY "System can create token rewards" ON public.token_rewards
FOR INSERT WITH CHECK (true);

-- RLS Policies for premium_subscriptions
CREATE POLICY "Sellers can view their own subscriptions" ON public.premium_subscriptions
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own subscriptions" ON public.premium_subscriptions
FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.premium_subscriptions
FOR ALL USING (is_admin());

-- RLS Policies for featured_ads
CREATE POLICY "Sellers can view their own ads" ON public.featured_ads
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own ads" ON public.featured_ads
FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all ads" ON public.featured_ads
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active ads" ON public.featured_ads
FOR SELECT USING (status = 'active' AND expires_at > now());

-- RLS Policies for monetization_config
CREATE POLICY "Admins can manage monetization config" ON public.monetization_config
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active config" ON public.monetization_config
FOR SELECT USING (is_active = true);

-- Create function to automatically process admin commissions on order completion
CREATE OR REPLACE FUNCTION public.process_admin_commission()
RETURNS TRIGGER AS $$
DECLARE
  commission_config JSONB;
  escrow_fee_config JSONB;
  token_config JSONB;
  commission_amount NUMERIC;
  escrow_fee NUMERIC;
  admin_total NUMERIC;
  seller_amount NUMERIC;
BEGIN
  -- Only process when order status changes to 'delivered' or 'completed'
  IF NEW.order_status IN ('delivered', 'completed') AND OLD.order_status != NEW.order_status THEN
    
    -- Get commission configuration
    SELECT config_value INTO commission_config 
    FROM public.monetization_config 
    WHERE config_key = 'transaction_commission' AND is_active = true;
    
    SELECT config_value INTO escrow_fee_config 
    FROM public.monetization_config 
    WHERE config_key = 'escrow_processing_fee' AND is_active = true;
    
    SELECT config_value INTO token_config 
    FROM public.monetization_config 
    WHERE config_key = 'token_rewards' AND is_active = true;
    
    -- Calculate commission (default 5% if no config)
    commission_amount := NEW.total_amount * COALESCE((commission_config->>'percent')::NUMERIC, 5.0) / 100;
    escrow_fee := COALESCE((escrow_fee_config->>'amount')::NUMERIC, 1.0);
    admin_total := commission_amount + escrow_fee;
    seller_amount := NEW.total_amount - commission_amount;
    
    -- Record admin commission earnings
    INSERT INTO public.admin_earnings (
      earnings_type, amount, currency, order_id, seller_id, buyer_id,
      commission_percent, metadata
    ) VALUES (
      'transaction_commission', 
      commission_amount, 
      'USD', 
      NEW.id, 
      NEW.seller_id, 
      NEW.buyer_id,
      COALESCE((commission_config->>'percent')::NUMERIC, 5.0),
      jsonb_build_object('seller_amount', seller_amount, 'original_total', NEW.total_amount)
    );
    
    -- Record escrow processing fee
    INSERT INTO public.admin_earnings (
      earnings_type, amount, currency, order_id, seller_id, buyer_id, metadata
    ) VALUES (
      'escrow_fee', 
      escrow_fee, 
      'USD', 
      NEW.id, 
      NEW.seller_id, 
      NEW.buyer_id,
      jsonb_build_object('fee_type', 'escrow_processing')
    );
    
    -- Create token rewards for buyer
    IF (token_config->>'enabled')::BOOLEAN = true THEN
      INSERT INTO public.token_rewards (
        user_id, order_id, reward_type, amount, source_amount, reward_rate
      ) VALUES (
        NEW.buyer_id, 
        NEW.id, 
        'buyer', 
        NEW.total_amount * COALESCE((token_config->>'buyer_rate')::NUMERIC, 0.01),
        NEW.total_amount,
        COALESCE((token_config->>'buyer_rate')::NUMERIC, 0.01)
      );
      
      -- Create token rewards for seller
      INSERT INTO public.token_rewards (
        user_id, order_id, reward_type, amount, source_amount, reward_rate
      ) VALUES (
        NEW.seller_id, 
        NEW.id, 
        'seller', 
        NEW.total_amount * COALESCE((token_config->>'seller_rate')::NUMERIC, 0.05),
        NEW.total_amount,
        COALESCE((token_config->>'seller_rate')::NUMERIC, 0.05)
      );
      
      -- Create agent rewards if referral exists
      IF EXISTS (
        SELECT 1 FROM public.affiliate_referrals 
        WHERE referred_user_id = NEW.buyer_id 
        AND conversion_status = 'converted'
      ) THEN
        INSERT INTO public.token_rewards (
          user_id, order_id, reward_type, amount, source_amount, reward_rate,
          metadata
        ) 
        SELECT 
          ar.affiliate_id,
          NEW.id,
          'agent',
          NEW.total_amount * COALESCE((token_config->>'agent_rate')::NUMERIC, 0.10),
          NEW.total_amount,
          COALESCE((token_config->>'agent_rate')::NUMERIC, 0.10),
          jsonb_build_object('referral_id', ar.id, 'referred_user', NEW.buyer_id)
        FROM public.affiliate_referrals ar
        JOIN public.affiliates a ON ar.affiliate_id = a.id
        WHERE ar.referred_user_id = NEW.buyer_id 
        AND ar.conversion_status = 'converted'
        LIMIT 1;
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic commission processing
CREATE TRIGGER trigger_process_admin_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_admin_commission();

-- Create function to get monetization analytics
CREATE OR REPLACE FUNCTION public.get_admin_earnings_summary(
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_commissions NUMERIC,
  total_escrow_fees NUMERIC,
  total_premium_subscriptions NUMERIC,
  total_ad_revenue NUMERIC,
  total_earnings NUMERIC,
  token_rewards_distributed NUMERIC,
  active_premium_sellers INTEGER,
  active_featured_ads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN ae.earnings_type = 'transaction_commission' THEN ae.amount ELSE 0 END), 0) as total_commissions,
    COALESCE(SUM(CASE WHEN ae.earnings_type = 'escrow_fee' THEN ae.amount ELSE 0 END), 0) as total_escrow_fees,
    COALESCE(SUM(CASE WHEN ae.earnings_type = 'premium_upgrade' THEN ae.amount ELSE 0 END), 0) as total_premium_subscriptions,
    COALESCE(SUM(CASE WHEN ae.earnings_type = 'ad_spot' THEN ae.amount ELSE 0 END), 0) as total_ad_revenue,
    COALESCE(SUM(ae.amount), 0) as total_earnings,
    COALESCE((SELECT SUM(tr.amount) FROM public.token_rewards tr WHERE DATE(tr.created_at) BETWEEN p_start_date AND p_end_date), 0) as token_rewards_distributed,
    COALESCE((SELECT COUNT(*) FROM public.premium_subscriptions ps WHERE ps.status = 'active'), 0) as active_premium_sellers,
    COALESCE((SELECT COUNT(*) FROM public.featured_ads fa WHERE fa.status = 'active' AND fa.expires_at > now()), 0) as active_featured_ads
  FROM public.admin_earnings ae
  WHERE DATE(ae.created_at) BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;