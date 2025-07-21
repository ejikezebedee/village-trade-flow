-- Create wallet system for verified users
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  escrow_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_received DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_sent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create wallet transfers table
CREATE TABLE public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  transaction_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transfer_type TEXT NOT NULL DEFAULT 'wallet_transfer',
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  reference_number TEXT NOT NULL UNIQUE,
  requires_2fa BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (sender_id != recipient_id),
  CHECK (amount > 0),
  CHECK (net_amount > 0)
);

-- Create transfer limits table
CREATE TABLE public.transfer_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
  monthly_limit DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
  single_transaction_limit DECIMAL(15,2) NOT NULL DEFAULT 500.00,
  daily_spent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  monthly_spent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create transaction fees configuration
CREATE TABLE public.transaction_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  fee_value DECIMAL(10,4) NOT NULL,
  minimum_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  maximum_fee DECIMAL(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.user_wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage wallets" 
ON public.user_wallets 
FOR ALL 
USING (true);

-- RLS Policies for wallet_transfers
CREATE POLICY "Users can view their transfers" 
ON public.wallet_transfers 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Verified users can create transfers" 
ON public.wallet_transfers 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND verification_status = 'verified'
    AND kyc_status = 'verified'
  )
);

CREATE POLICY "Users can update their own transfers" 
ON public.wallet_transfers 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- RLS Policies for transfer_limits
CREATE POLICY "Users can view their own limits" 
ON public.transfer_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage limits" 
ON public.transfer_limits 
FOR ALL 
USING (true);

-- RLS Policies for transaction_fees
CREATE POLICY "Anyone can view active fees" 
ON public.transaction_fees 
FOR SELECT 
USING (is_active = true);

-- Insert default transaction fees
INSERT INTO public.transaction_fees (transaction_type, fee_type, fee_value, minimum_fee, maximum_fee) VALUES
('wallet_transfer', 'percentage', 0.015, 0.50, 10.00), -- 1.5% with min $0.50, max $10
('escrow_transfer', 'fixed', 1.00, 1.00, 1.00); -- Fixed $1 fee

-- Function to generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ref_number TEXT;
BEGIN
  ref_number := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN ref_number;
END;
$$;

-- Function to calculate transaction fees
CREATE OR REPLACE FUNCTION public.calculate_transaction_fee(p_amount DECIMAL, p_transaction_type TEXT)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  fee_config RECORD;
  calculated_fee DECIMAL;
BEGIN
  -- Get fee configuration
  SELECT * INTO fee_config
  FROM public.transaction_fees
  WHERE transaction_type = p_transaction_type AND is_active = true
  LIMIT 1;
  
  IF fee_config.id IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- Calculate fee based on type
  IF fee_config.fee_type = 'percentage' THEN
    calculated_fee := p_amount * (fee_config.fee_value / 100);
  ELSE
    calculated_fee := fee_config.fee_value;
  END IF;
  
  -- Apply minimum and maximum limits
  calculated_fee := GREATEST(calculated_fee, fee_config.minimum_fee);
  
  IF fee_config.maximum_fee IS NOT NULL THEN
    calculated_fee := LEAST(calculated_fee, fee_config.maximum_fee);
  END IF;
  
  RETURN calculated_fee;
END;
$$;

-- Function to check if user can transfer amount
CREATE OR REPLACE FUNCTION public.can_user_transfer(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_limits RECORD;
  user_wallet RECORD;
  transaction_fee DECIMAL;
  total_amount DECIMAL;
BEGIN
  -- Check if user is verified
  IF NOT can_user_transact(p_user_id, p_amount) THEN
    RETURN false;
  END IF;
  
  -- Get user limits
  SELECT * INTO user_limits
  FROM public.transfer_limits
  WHERE user_id = p_user_id;
  
  -- Get user wallet
  SELECT * INTO user_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id AND is_active = true;
  
  IF user_wallet.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate transaction fee
  transaction_fee := calculate_transaction_fee(p_amount, 'wallet_transfer');
  total_amount := p_amount + transaction_fee;
  
  -- Check if user has sufficient balance
  IF user_wallet.escrow_balance < total_amount THEN
    RETURN false;
  END IF;
  
  -- Check transfer limits if they exist
  IF user_limits.id IS NOT NULL THEN
    -- Reset limits if it's a new day/month
    IF user_limits.last_reset_date < CURRENT_DATE THEN
      UPDATE public.transfer_limits 
      SET daily_spent = 0,
          monthly_spent = CASE 
            WHEN EXTRACT(MONTH FROM user_limits.last_reset_date) != EXTRACT(MONTH FROM CURRENT_DATE)
            THEN 0 
            ELSE monthly_spent 
          END,
          last_reset_date = CURRENT_DATE
      WHERE user_id = p_user_id;
      
      -- Refresh the record
      SELECT * INTO user_limits FROM public.transfer_limits WHERE user_id = p_user_id;
    END IF;
    
    -- Check single transaction limit
    IF p_amount > user_limits.single_transaction_limit THEN
      RETURN false;
    END IF;
    
    -- Check daily limit
    IF (user_limits.daily_spent + p_amount) > user_limits.daily_limit THEN
      RETURN false;
    END IF;
    
    -- Check monthly limit
    IF (user_limits.monthly_spent + p_amount) > user_limits.monthly_limit THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to initialize user wallet
CREATE OR REPLACE FUNCTION public.initialize_user_wallet(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- Create wallet if it doesn't exist
  INSERT INTO public.user_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO wallet_id;
  
  -- Create transfer limits if they don't exist
  INSERT INTO public.transfer_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  IF wallet_id IS NULL THEN
    SELECT id INTO wallet_id FROM public.user_wallets WHERE user_id = p_user_id;
  END IF;
  
  RETURN wallet_id;
END;
$$;

-- Trigger to initialize wallet when profile is created
CREATE OR REPLACE FUNCTION public.auto_initialize_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Initialize wallet for verified users
  IF NEW.verification_status = 'verified' AND NEW.kyc_status = 'verified' THEN
    PERFORM public.initialize_user_wallet(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_wallet_initialization
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_initialize_wallet();