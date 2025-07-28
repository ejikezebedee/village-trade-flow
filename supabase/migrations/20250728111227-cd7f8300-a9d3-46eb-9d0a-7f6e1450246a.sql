-- Create token rewards table for SPL $ZSHOP rewards
CREATE TABLE public.token_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(18, 8) NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'buyer',
  order_id UUID NULL,
  referral_id UUID NULL,
  multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_hash TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles progression table
CREATE TABLE public.user_roles_progression (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'buyer',
  previous_role TEXT NULL,
  role_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlock_requirements JSONB NULL,
  requirements_met BOOLEAN NOT NULL DEFAULT false,
  earnings_total NUMERIC(18, 8) NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  referrals_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create token configuration table for admin control
CREATE TABLE public.token_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reward_rate NUMERIC(6, 4) NOT NULL,
  multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_amount NUMERIC(18, 8) NOT NULL DEFAULT 0,
  max_amount NUMERIC(18, 8) NULL,
  updated_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_role, action_type)
);

-- Create wallet connections table
CREATE TABLE public.wallet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'phantom',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  token_balance NUMERIC(18, 8) NOT NULL DEFAULT 0,
  last_balance_check TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default token configuration
INSERT INTO public.token_config (user_role, action_type, reward_rate) VALUES
('buyer', 'purchase', 0.01),
('seller', 'sale', 0.05),
('agent', 'referral_sale', 0.10),
('agent', 'downline_commission', 0.02);

-- Enable RLS on all tables
ALTER TABLE public.token_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for token_rewards
CREATE POLICY "Users can view their own token rewards" 
ON public.token_rewards 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage token rewards" 
ON public.token_rewards 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for user_roles_progression
CREATE POLICY "Users can view their own role progression" 
ON public.user_roles_progression 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own role progression" 
ON public.user_roles_progression 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own role progression" 
ON public.user_roles_progression 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for token_config
CREATE POLICY "Anyone can view active token config" 
ON public.token_config 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage token config" 
ON public.token_config 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('admin', 'moderator')
));

-- Create RLS policies for wallet_connections
CREATE POLICY "Users can manage their own wallet" 
ON public.wallet_connections 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to calculate token rewards
CREATE OR REPLACE FUNCTION public.calculate_token_reward(
  p_user_id UUID,
  p_action_type TEXT,
  p_amount NUMERIC,
  p_role TEXT DEFAULT NULL
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calculated_user_role TEXT;
  config_record RECORD;
  calculated_reward NUMERIC;
BEGIN
  -- Get user role if not provided
  IF p_role IS NULL THEN
    SELECT user_role INTO calculated_user_role 
    FROM public.user_roles_progression 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF calculated_user_role IS NULL THEN
      calculated_user_role := 'buyer';
    END IF;
  ELSE
    calculated_user_role := p_role;
  END IF;
  
  -- Get reward configuration
  SELECT * INTO config_record
  FROM public.token_config
  WHERE user_role = calculated_user_role 
    AND action_type = p_action_type 
    AND is_active = true;
  
  IF config_record.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate reward
  calculated_reward := p_amount * config_record.reward_rate * config_record.multiplier;
  
  -- Apply min/max limits
  IF calculated_reward < config_record.min_amount THEN
    calculated_reward := config_record.min_amount;
  END IF;
  
  IF config_record.max_amount IS NOT NULL AND calculated_reward > config_record.max_amount THEN
    calculated_reward := config_record.max_amount;
  END IF;
  
  RETURN calculated_reward;
END;
$$;

-- Create function to process role upgrade
CREATE OR REPLACE FUNCTION public.upgrade_user_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_progression RECORD;
  requirements_met BOOLEAN := false;
BEGIN
  -- Get current progression
  SELECT * INTO current_progression
  FROM public.user_roles_progression
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check role upgrade path
  CASE 
    WHEN p_new_role = 'seller' AND COALESCE(current_progression.user_role, 'buyer') = 'buyer' THEN
      requirements_met := true;
    WHEN p_new_role = 'agent' AND COALESCE(current_progression.user_role, 'buyer') = 'seller' THEN
      -- Check if seller has at least 5 completed sales
      SELECT CASE WHEN COUNT(*) >= 5 THEN true ELSE false END
      INTO requirements_met
      FROM public.orders
      WHERE seller_id = p_user_id AND order_status = 'delivered';
    ELSE
      requirements_met := false;
  END CASE;
  
  IF NOT requirements_met THEN
    RETURN false;
  END IF;
  
  -- Create new progression record
  INSERT INTO public.user_roles_progression (
    user_id,
    user_role,
    previous_role,
    requirements_met
  ) VALUES (
    p_user_id,
    p_new_role,
    COALESCE(current_progression.user_role, 'buyer'),
    true
  );
  
  -- Update profile user_type
  UPDATE public.profiles 
  SET user_type = p_new_role,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- Create trigger to auto-create role progression on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role_progression()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles_progression (user_id, user_role)
  VALUES (NEW.user_id, COALESCE(NEW.user_type, 'buyer'))
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_role_progression
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role_progression();