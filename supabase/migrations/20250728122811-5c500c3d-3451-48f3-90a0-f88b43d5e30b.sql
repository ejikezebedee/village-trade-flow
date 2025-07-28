-- Create admin earnings and commission tracking tables (only if not exists)
CREATE TABLE IF NOT EXISTS public.admin_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earnings_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  order_id UUID REFERENCES public.orders(id),
  seller_id UUID,
  buyer_id UUID,
  commission_percent NUMERIC DEFAULT 5.0,
  payment_status TEXT DEFAULT 'pending',
  admin_wallet_address TEXT,
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create premium seller subscriptions table
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'premium_seller',
  amount NUMERIC NOT NULL DEFAULT 10.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create featured product ads table
CREATE TABLE IF NOT EXISTS public.featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  seller_id UUID NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'homepage_featured',
  amount_paid NUMERIC NOT NULL DEFAULT 4.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_days INTEGER DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  payment_status TEXT DEFAULT 'completed',
  stripe_payment_intent_id TEXT,
  admin_earnings_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system configuration table for monetization settings
CREATE TABLE IF NOT EXISTS public.monetization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default monetization configuration (with proper JSONB casting)
INSERT INTO public.monetization_config (config_key, config_value, description) 
SELECT config_key, config_value::JSONB, description
FROM (VALUES
  ('transaction_commission', '{"percent": 5.0, "enabled": true}', 'Platform commission percentage per transaction'),
  ('escrow_processing_fee', '{"amount": 1.0, "currency": "USD", "enabled": true}', 'Fixed escrow processing fee'),
  ('token_rewards', '{"buyer_rate": 0.01, "seller_rate": 0.05, "agent_rate": 0.10, "enabled": true}', 'ZSHOP token reward rates'),
  ('premium_seller_pricing', '{"monthly": 10.0, "yearly": 100.0, "currency": "USD", "enabled": true}', 'Premium seller subscription pricing'),
  ('featured_ad_pricing', '{"homepage": 4.0, "category": 2.0, "currency": "USD", "duration_days": 7, "enabled": true}', 'Featured product ad pricing'),
  ('admin_wallet_config', '{"solana_address": "", "stripe_account": "", "paypal_email": "", "usdt_address": "", "default_method": "stripe"}', 'Admin payout wallet configuration')
) AS t(config_key, config_value, description)
WHERE NOT EXISTS (SELECT 1 FROM public.monetization_config WHERE config_key = t.config_key);

-- Enable RLS and create policies
ALTER TABLE public.admin_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can manage all earnings" ON public.admin_earnings;
CREATE POLICY "Admins can manage all earnings" ON public.admin_earnings
FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Sellers can view their own subscriptions" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Sellers can manage their own subscriptions" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.premium_subscriptions;

CREATE POLICY "Sellers can view their own subscriptions" ON public.premium_subscriptions
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own subscriptions" ON public.premium_subscriptions
FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.premium_subscriptions
FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Sellers can view their own ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Sellers can manage their own ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.featured_ads;

CREATE POLICY "Sellers can view their own ads" ON public.featured_ads
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own ads" ON public.featured_ads
FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all ads" ON public.featured_ads
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active ads" ON public.featured_ads
FOR SELECT USING (status = 'active' AND expires_at > now());

DROP POLICY IF EXISTS "Admins can manage monetization config" ON public.monetization_config;
DROP POLICY IF EXISTS "Anyone can view active config" ON public.monetization_config;

CREATE POLICY "Admins can manage monetization config" ON public.monetization_config
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active config" ON public.monetization_config
FOR SELECT USING (is_active = true);