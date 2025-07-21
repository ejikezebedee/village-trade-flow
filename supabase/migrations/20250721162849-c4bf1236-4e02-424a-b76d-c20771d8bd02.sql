-- Create enhanced notifications system (corrected)
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
  'You have received ${{amount}} from {{sender_name}}. The money has been added to your wallet. Reference number: {{reference_number}}.',
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
);

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