-- Create admin roles and security features
CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');

-- Add admin role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_role public.user_role DEFAULT 'user'::public.user_role;

-- Create security audit logs table
CREATE TABLE public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  target_resource TEXT,
  target_id UUID,
  action_performed TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user blocks/restrictions table
CREATE TABLE public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  restriction_type TEXT NOT NULL, -- 'blocked', 'suspended', 'messaging_disabled'
  reason TEXT NOT NULL,
  restricted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fraud reports table
CREATE TABLE public.fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID NOT NULL REFERENCES auth.users(id),
  reporter_id UUID REFERENCES auth.users(id),
  report_type TEXT NOT NULL, -- 'fake_profile', 'fraudulent_transaction', 'inappropriate_content'
  description TEXT NOT NULL,
  evidence JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND user_role IN ('admin', 'moderator')
  );
$$;

-- RLS Policies for security_audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.security_audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert audit logs" ON public.security_audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_restrictions
CREATE POLICY "Admins can manage user restrictions" ON public.user_restrictions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their own restrictions" ON public.user_restrictions
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for fraud_reports
CREATE POLICY "Admins can manage fraud reports" ON public.fraud_reports
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can create fraud reports" ON public.fraud_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their submitted reports" ON public.fraud_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_user_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_target_resource TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_action_performed TEXT DEFAULT '',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type,
    severity,
    user_id,
    admin_id,
    target_resource,
    target_id,
    action_performed,
    metadata
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_admin_id,
    p_target_resource,
    p_target_id,
    p_action_performed,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Update messages table to add encryption flag
ALTER TABLE public.messages 
ADD COLUMN is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN encryption_key_id TEXT;

-- Create indexes for performance
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_active ON public.user_restrictions(is_active, expires_at);
CREATE INDEX idx_fraud_reports_status ON public.fraud_reports(status);
CREATE INDEX idx_fraud_reports_reported_user ON public.fraud_reports(reported_user_id);

-- Trigger to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when user role changes
  IF OLD.user_role != NEW.user_role THEN
    PERFORM public.log_security_event(
      'role_change',
      'warning',
      NEW.user_id,
      auth.uid(),
      'profiles',
      NEW.id,
      format('Role changed from %s to %s', OLD.user_role, NEW.user_role),
      jsonb_build_object('old_role', OLD.user_role, 'new_role', NEW.user_role)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_changes_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();