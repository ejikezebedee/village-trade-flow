-- API Keys Management System
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Enable RLS on API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Only admins can manage API keys"
ON public.api_keys
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role = 'admin'
));

-- Create API key audit log table
CREATE TABLE IF NOT EXISTS public.api_key_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id),
  action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'used'
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.api_key_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view API key audit logs"
ON public.api_key_audit
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND user_role = 'admin'
));

-- System can insert audit logs
CREATE POLICY "System can insert API key audit logs"
ON public.api_key_audit
FOR INSERT
WITH CHECK (true);

-- Function to encrypt API keys
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_value TEXT;
BEGIN
  -- Simple encryption using encode/decode (in production, use proper encryption)
  encrypted_value := encode(convert_to(key_value, 'UTF8'), 'base64');
  RETURN encrypted_value;
END;
$$;

-- Function to decrypt API keys
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  -- Simple decryption (in production, use proper decryption)
  decrypted_value := convert_from(decode(encrypted_value, 'base64'), 'UTF8');
  RETURN decrypted_value;
END;
$$;

-- Function to create/update API keys safely
CREATE OR REPLACE FUNCTION public.upsert_api_key(
  p_key_name TEXT,
  p_key_value TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_key_id UUID;
  encrypted_value TEXT;
  old_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can manage API keys';
  END IF;

  -- Encrypt the key value
  encrypted_value := public.encrypt_api_key(p_key_value);
  
  -- Get old record for audit
  SELECT * INTO old_record FROM public.api_keys WHERE key_name = p_key_name;
  
  -- Upsert the API key
  INSERT INTO public.api_keys (key_name, key_value, description, created_by, updated_by)
  VALUES (p_key_name, encrypted_value, p_description, auth.uid(), auth.uid())
  ON CONFLICT (key_name) 
  DO UPDATE SET 
    key_value = encrypted_value,
    description = COALESCE(p_description, api_keys.description),
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING id INTO api_key_id;
  
  -- Log the action
  INSERT INTO public.api_key_audit (
    api_key_id, 
    action_type, 
    old_value, 
    new_value, 
    performed_by
  ) VALUES (
    api_key_id,
    CASE WHEN old_record.id IS NULL THEN 'created' ELSE 'updated' END,
    CASE WHEN old_record.id IS NOT NULL THEN to_jsonb(old_record) ELSE NULL END,
    jsonb_build_object('key_name', p_key_name, 'description', p_description),
    auth.uid()
  );
  
  RETURN api_key_id;
END;
$$;

-- Function to get decrypted API key (admin only)
CREATE OR REPLACE FUNCTION public.get_api_key(p_key_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Update trigger for api_keys table
CREATE OR REPLACE FUNCTION public.update_api_key_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_key_timestamp();

-- Insert some default API key placeholders for common services
INSERT INTO public.api_keys (key_name, key_value, description, created_by) VALUES
('GOOGLE_CLIENT_ID', public.encrypt_api_key('your-google-client-id'), 'Google OAuth2 Client ID', (SELECT id FROM auth.users LIMIT 1)),
('GOOGLE_CLIENT_SECRET', public.encrypt_api_key('your-google-client-secret'), 'Google OAuth2 Client Secret', (SELECT id FROM auth.users LIMIT 1)),
('STRIPE_SECRET_KEY', public.encrypt_api_key('sk_test_...'), 'Stripe Secret Key for Payments', (SELECT id FROM auth.users LIMIT 1)),
('STRIPE_PUBLISHABLE_KEY', public.encrypt_api_key('pk_test_...'), 'Stripe Publishable Key', (SELECT id FROM auth.users LIMIT 1)),
('OPENAI_API_KEY', public.encrypt_api_key('sk-...'), 'OpenAI API Key for AI Features', (SELECT id FROM auth.users LIMIT 1)),
('BINANCE_API_KEY', public.encrypt_api_key('your-binance-api-key'), 'Binance API Key for Crypto Features', (SELECT id FROM auth.users LIMIT 1)),
('LIGHTHOUSE_API_KEY', public.encrypt_api_key('your-lighthouse-key'), 'Lighthouse API Key for Performance Monitoring', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (key_name) DO NOTHING;