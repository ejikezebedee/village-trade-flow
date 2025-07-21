-- Create enhanced notifications system
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  email_template TEXT,
  sms_template TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  transfer_notifications BOOLEAN NOT NULL DEFAULT true,
  security_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_notifications BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create notification delivery logs
CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivery_channel TEXT NOT NULL, -- 'in_app', 'email', 'sms', 'push'
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  provider_id TEXT, -- External provider message ID
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction receipts table
CREATE TABLE public.transaction_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES public.wallet_transfers(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_data JSONB NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_templates
CREATE POLICY "Anyone can view active templates" 
ON public.notification_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON public.notification_templates 
FOR ALL 
USING (is_admin());

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for notification_deliveries
CREATE POLICY "Users can view their delivery logs" 
ON public.notification_deliveries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.id = notification_deliveries.notification_id 
    AND n.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage deliveries" 
ON public.notification_deliveries 
FOR ALL 
USING (true);

-- RLS Policies for transaction_receipts
CREATE POLICY "Users can view their own receipts" 
ON public.transaction_receipts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallet_transfers wt 
    WHERE wt.id = transaction_receipts.transfer_id 
    AND (wt.sender_id = auth.uid() OR wt.recipient_id = auth.uid())
  )
);

CREATE POLICY "System can manage receipts" 
ON public.transaction_receipts 
FOR ALL 
USING (true);

-- Insert default notification templates
INSERT INTO public.notification_templates (template_name, notification_type, title_template, message_template, email_template, sms_template) VALUES
(
  'transfer_initiated',
  'transfer_sent',
  'Transfer Initiated',
  'You have initiated a transfer of ${{amount}} to {{recipient_name}}. Reference: {{reference_number}}',
  'Your transfer of ${{amount}} to {{recipient_name}} has been initiated and is being processed. Reference number: {{reference_number}}. You will receive another notification once the transfer is completed.',
  'Transfer of ${{amount}} to {{recipient_name}} initiated. Ref: {{reference_number}}'
),
(
  'transfer_received',
  'transfer_received',
  'Money Received',
  'You have received ${{amount}} from {{sender_name}}. Reference: {{reference_number}}',
  'You have received ${{amount}} from {{sender_name}}. The money has been added to your wallet. Reference number: {{reference_number}}. {{#if message}}Message: "{{message}}"{{/if}}',
  'You received ${{amount}} from {{sender_name}}. Ref: {{reference_number}}'
),
(
  'transfer_completed',
  'transfer_completed',
  'Transfer Completed',
  'Your transfer of ${{amount}} to {{recipient_name}} has been completed successfully. Reference: {{reference_number}}',
  'Your transfer of ${{amount}} to {{recipient_name}} has been completed successfully. The money has been delivered and your transaction is now complete. Reference number: {{reference_number}}.',
  'Transfer of ${{amount}} to {{recipient_name}} completed. Ref: {{reference_number}}'
),
(
  'transfer_failed',
  'transfer_failed',
  'Transfer Failed',
  'Your transfer of ${{amount}} to {{recipient_name}} has failed. {{failure_reason}}',
  'We regret to inform you that your transfer of ${{amount}} to {{recipient_name}} could not be completed. Reason: {{failure_reason}}. Your money has been returned to your wallet. Reference number: {{reference_number}}.',
  'Transfer of ${{amount}} failed. {{failure_reason}} Ref: {{reference_number}}'
),
(
  'transfer_2fa_required',
  'security_alert',
  '2FA Required for Transfer',
  'Please verify your identity to complete the transfer of ${{amount}} to {{recipient_name}}.',
  'Your transfer of ${{amount}} to {{recipient_name}} requires two-factor authentication for security. Please complete the verification process to proceed. Reference number: {{reference_number}}.',
  '2FA required for transfer of ${{amount}}. Complete verification to proceed. Ref: {{reference_number}}'
);

-- Function to create notification with delivery channels
CREATE OR REPLACE FUNCTION public.create_enhanced_notification(
  p_user_id UUID,
  p_template_name TEXT,
  p_variables JSONB DEFAULT '{}',
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record RECORD;
  notification_id UUID;
  user_prefs RECORD;
  title_text TEXT;
  message_text TEXT;
  email_text TEXT;
  sms_text TEXT;
BEGIN
  -- Get notification template
  SELECT * INTO template_record
  FROM public.notification_templates
  WHERE template_name = p_template_name AND is_active = true;
  
  IF template_record.id IS NULL THEN
    RAISE EXCEPTION 'Notification template not found: %', p_template_name;
  END IF;
  
  -- Get user preferences
  SELECT * INTO user_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  -- Create default preferences if they don't exist
  IF user_prefs.id IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id);
    
    SELECT * INTO user_prefs
    FROM public.notification_preferences
    WHERE user_id = p_user_id;
  END IF;
  
  -- Process template variables (simple variable substitution)
  title_text := template_record.title_template;
  message_text := template_record.message_template;
  email_text := template_record.email_template;
  sms_text := template_record.sms_template;
  
  -- Replace variables in templates
  FOR key, value IN SELECT * FROM jsonb_each_text(p_variables) LOOP
    title_text := replace(title_text, '{{' || key || '}}', value);
    message_text := replace(message_text, '{{' || key || '}}', value);
    email_text := replace(email_text, '{{' || key || '}}', value);
    sms_text := replace(sms_text, '{{' || key || '}}', value);
  END LOOP;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority
  ) VALUES (
    p_user_id, template_record.notification_type, title_text, message_text, p_variables, p_priority
  ) RETURNING id INTO notification_id;
  
  -- Create delivery records based on user preferences
  IF user_prefs.in_app_enabled THEN
    INSERT INTO public.notification_deliveries (
      notification_id, delivery_channel, delivery_status
    ) VALUES (
      notification_id, 'in_app', 'delivered'
    );
  END IF;
  
  IF user_prefs.email_enabled AND email_text IS NOT NULL THEN
    INSERT INTO public.notification_deliveries (
      notification_id, delivery_channel, delivery_status
    ) VALUES (
      notification_id, 'email', 'pending'
    );
  END IF;
  
  IF user_prefs.sms_enabled AND user_prefs.phone_number IS NOT NULL AND sms_text IS NOT NULL THEN
    INSERT INTO public.notification_deliveries (
      notification_id, delivery_channel, delivery_status
    ) VALUES (
      notification_id, 'sms', 'pending'
    );
  END IF;
  
  RETURN notification_id;
END;
$$;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_number TEXT;
BEGIN
  receipt_number := 'RCP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN receipt_number;
END;
$$;

-- Function to create transaction receipt
CREATE OR REPLACE FUNCTION public.create_transaction_receipt(p_transfer_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transfer_record RECORD;
  sender_profile RECORD;
  recipient_profile RECORD;
  receipt_id UUID;
  receipt_number TEXT;
  receipt_data JSONB;
BEGIN
  -- Get transfer details
  SELECT * INTO transfer_record
  FROM public.wallet_transfers
  WHERE id = p_transfer_id;
  
  IF transfer_record.id IS NULL THEN
    RAISE EXCEPTION 'Transfer not found: %', p_transfer_id;
  END IF;
  
  -- Get profiles
  SELECT * INTO sender_profile
  FROM public.profiles
  WHERE user_id = transfer_record.sender_id;
  
  SELECT * INTO recipient_profile
  FROM public.profiles
  WHERE user_id = transfer_record.recipient_id;
  
  -- Generate receipt number
  receipt_number := generate_receipt_number();
  
  -- Build receipt data
  receipt_data := jsonb_build_object(
    'transfer_id', transfer_record.id,
    'reference_number', transfer_record.reference_number,
    'receipt_number', receipt_number,
    'amount', transfer_record.amount,
    'transaction_fee', transfer_record.transaction_fee,
    'net_amount', transfer_record.net_amount,
    'currency', transfer_record.currency,
    'status', transfer_record.status,
    'message', transfer_record.message,
    'created_at', transfer_record.created_at,
    'completed_at', transfer_record.completed_at,
    'sender', jsonb_build_object(
      'name', COALESCE(sender_profile.first_name || ' ' || sender_profile.last_name, 'User'),
      'user_id', transfer_record.sender_id
    ),
    'recipient', jsonb_build_object(
      'name', COALESCE(recipient_profile.first_name || ' ' || recipient_profile.last_name, 'User'),
      'user_id', transfer_record.recipient_id
    )
  );
  
  -- Create receipt record
  INSERT INTO public.transaction_receipts (
    transfer_id, receipt_number, receipt_data
  ) VALUES (
    p_transfer_id, receipt_number, receipt_data
  ) RETURNING id INTO receipt_id;
  
  RETURN receipt_id;
END;
$$;