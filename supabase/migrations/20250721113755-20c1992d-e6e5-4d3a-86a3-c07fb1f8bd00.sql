-- Create fraud detection tables
CREATE TABLE public.fraud_detection_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  rule_type text NOT NULL, -- 'ip_duplicate', 'transaction_pattern', 'high_value', 'velocity'
  threshold_value numeric,
  threshold_timeframe interval,
  is_active boolean DEFAULT true,
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user activity tracking
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_id text,
  ip_address inet NOT NULL,
  user_agent text,
  activity_type text NOT NULL, -- 'login', 'transaction', 'profile_update', 'password_change'
  activity_data jsonb,
  geolocation jsonb,
  risk_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create fraud alerts table
CREATE TABLE public.fraud_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  rule_id uuid REFERENCES public.fraud_detection_rules(id),
  alert_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  evidence jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_positive'
  assigned_to uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  auto_generated boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for fraud detection rules (admin only)
CREATE POLICY "Only admins can manage fraud rules" 
ON public.fraud_detection_rules 
FOR ALL 
USING (is_admin());

-- Policies for user activities
CREATE POLICY "System can insert user activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all user activities" 
ON public.user_activities 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view their own activities" 
ON public.user_activities 
FOR SELECT 
USING (user_id = auth.uid());

-- Policies for fraud alerts
CREATE POLICY "System can create fraud alerts" 
ON public.fraud_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage fraud alerts" 
ON public.fraud_alerts 
FOR ALL 
USING (is_admin());

-- Create function to detect duplicate IP addresses
CREATE OR REPLACE FUNCTION public.detect_ip_fraud(
  p_ip_address inet,
  p_timeframe interval DEFAULT '24 hours'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
  users_data jsonb;
BEGIN
  -- Count distinct users from same IP in timeframe
  SELECT COUNT(DISTINCT user_id) INTO user_count
  FROM public.user_activities
  WHERE ip_address = p_ip_address
    AND created_at > now() - p_timeframe
    AND activity_type IN ('login', 'transaction');
  
  -- Get user details if suspicious
  IF user_count >= 3 THEN
    SELECT jsonb_agg(DISTINCT jsonb_build_object(
      'user_id', user_id,
      'activity_count', activity_count,
      'last_activity', last_activity
    )) INTO users_data
    FROM (
      SELECT 
        user_id,
        COUNT(*) as activity_count,
        MAX(created_at) as last_activity
      FROM public.user_activities
      WHERE ip_address = p_ip_address
        AND created_at > now() - p_timeframe
      GROUP BY user_id
    ) t;
    
    RETURN jsonb_build_object(
      'is_suspicious', true,
      'risk_level', CASE 
        WHEN user_count >= 10 THEN 'critical'
        WHEN user_count >= 5 THEN 'high'
        ELSE 'medium'
      END,
      'user_count', user_count,
      'users', users_data
    );
  END IF;
  
  RETURN jsonb_build_object('is_suspicious', false);
END;
$$;

-- Create function to detect transaction velocity fraud
CREATE OR REPLACE FUNCTION public.detect_velocity_fraud(
  p_user_id uuid,
  p_transaction_amount numeric,
  p_timeframe interval DEFAULT '1 hour'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_count integer;
  total_amount numeric;
  avg_amount numeric;
BEGIN
  -- Count transactions and total amount in timeframe
  SELECT 
    COUNT(*),
    COALESCE(SUM((activity_data->>'amount')::numeric), 0),
    COALESCE(AVG((activity_data->>'amount')::numeric), 0)
  INTO transaction_count, total_amount, avg_amount
  FROM public.user_activities
  WHERE user_id = p_user_id
    AND activity_type = 'transaction'
    AND created_at > now() - p_timeframe;
  
  -- Check for suspicious patterns
  IF transaction_count >= 10 OR 
     total_amount > 10000 OR 
     p_transaction_amount > (avg_amount * 5) THEN
    
    RETURN jsonb_build_object(
      'is_suspicious', true,
      'risk_level', CASE 
        WHEN transaction_count >= 20 OR total_amount > 50000 THEN 'critical'
        WHEN transaction_count >= 15 OR total_amount > 25000 THEN 'high'
        ELSE 'medium'
      END,
      'transaction_count', transaction_count,
      'total_amount', total_amount,
      'average_amount', avg_amount,
      'current_amount', p_transaction_amount
    );
  END IF;
  
  RETURN jsonb_build_object('is_suspicious', false);
END;
$$;

-- Create function to log activity and check fraud
CREATE OR REPLACE FUNCTION public.log_activity_and_check_fraud(
  p_user_id uuid,
  p_ip_address inet,
  p_activity_type text,
  p_activity_data jsonb DEFAULT '{}'::jsonb,
  p_user_agent text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id uuid;
  ip_fraud_result jsonb;
  velocity_fraud_result jsonb;
  alert_id uuid;
BEGIN
  -- Insert activity log
  INSERT INTO public.user_activities (
    user_id, ip_address, activity_type, activity_data, 
    user_agent, session_id
  ) VALUES (
    p_user_id, p_ip_address, p_activity_type, p_activity_data,
    p_user_agent, p_session_id
  ) RETURNING id INTO activity_id;
  
  -- Check for IP-based fraud
  ip_fraud_result := public.detect_ip_fraud(p_ip_address);
  
  -- Check for velocity-based fraud (for transactions)
  IF p_activity_type = 'transaction' AND p_activity_data ? 'amount' THEN
    velocity_fraud_result := public.detect_velocity_fraud(
      p_user_id, 
      (p_activity_data->>'amount')::numeric
    );
  ELSE
    velocity_fraud_result := jsonb_build_object('is_suspicious', false);
  END IF;
  
  -- Create fraud alerts if suspicious activity detected
  IF (ip_fraud_result->>'is_suspicious')::boolean THEN
    INSERT INTO public.fraud_alerts (
      user_id, alert_type, severity, description, evidence
    ) VALUES (
      p_user_id, 'duplicate_ip', ip_fraud_result->>'risk_level',
      'Multiple users detected from same IP address',
      jsonb_build_object(
        'ip_address', p_ip_address,
        'detection_result', ip_fraud_result,
        'activity_id', activity_id
      )
    ) RETURNING id INTO alert_id;
  END IF;
  
  IF (velocity_fraud_result->>'is_suspicious')::boolean THEN
    INSERT INTO public.fraud_alerts (
      user_id, alert_type, severity, description, evidence
    ) VALUES (
      p_user_id, 'transaction_velocity', velocity_fraud_result->>'risk_level',
      'Suspicious transaction velocity detected',
      jsonb_build_object(
        'detection_result', velocity_fraud_result,
        'activity_id', activity_id
      )
    ) RETURNING id INTO alert_id;
  END IF;
  
  RETURN jsonb_build_object(
    'activity_id', activity_id,
    'ip_fraud', ip_fraud_result,
    'velocity_fraud', velocity_fraud_result
  );
END;
$$;

-- Insert default fraud detection rules
INSERT INTO public.fraud_detection_rules (rule_name, rule_type, threshold_value, threshold_timeframe, severity) VALUES
('Multiple IP Users', 'ip_duplicate', 3, '24 hours', 'medium'),
('High Transaction Velocity', 'velocity', 10, '1 hour', 'high'),
('Large Transaction Amount', 'high_value', 5000, NULL, 'high'),
('Critical Transaction Amount', 'high_value', 10000, NULL, 'critical');