-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create support ticket responses table
CREATE TABLE public.support_ticket_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  agent_id UUID,
  session_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_automated BOOLEAN DEFAULT false,
  faq_id UUID REFERENCES public.faqs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can create their own support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all support tickets" 
ON public.support_tickets 
FOR ALL 
USING (is_admin());

-- RLS Policies for support_ticket_responses
CREATE POLICY "Users can view responses to their tickets" 
ON public.support_ticket_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = support_ticket_responses.ticket_id 
    AND user_id = auth.uid()
  ) OR is_admin()
);

CREATE POLICY "Admins can create ticket responses" 
ON public.support_ticket_responses 
FOR INSERT 
WITH CHECK (is_admin());

-- RLS Policies for FAQs
CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (is_admin());

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR agent_id = auth.uid() OR is_admin());

CREATE POLICY "Users can create their own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update assigned chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (agent_id = auth.uid() OR is_admin());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their chat sessions" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = chat_messages.session_id 
    AND (user_id = auth.uid() OR agent_id = auth.uid())
  ) OR is_admin()
);

CREATE POLICY "Users can send messages in their chat sessions" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = chat_messages.session_id 
    AND (user_id = auth.uid() OR agent_id = auth.uid())
  ) OR sender_id = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_ticket_responses_ticket_id ON public.support_ticket_responses(ticket_id);
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_keywords ON public.faqs USING GIN(keywords);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Insert sample FAQs
INSERT INTO public.faqs (question, answer, category, keywords) VALUES
('How do I create an account?', 'To create an account, click the "Sign Up" button on the homepage and fill in your details. You''ll receive a confirmation email to verify your account.', 'account', ARRAY['account', 'signup', 'register', 'create']),
('How do I reset my password?', 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the password reset email.', 'account', ARRAY['password', 'reset', 'forgot', 'login']),
('How do I place an order?', 'Browse products, add items to your cart, and proceed to checkout. Enter your shipping information and payment details to complete the order.', 'orders', ARRAY['order', 'purchase', 'buy', 'checkout']),
('How can I track my order?', 'You can track your order status in your dashboard or through the QR tracking system provided after purchase.', 'orders', ARRAY['track', 'status', 'delivery', 'shipping']),
('What payment methods do you accept?', 'We accept credit cards, debit cards, and digital payments through our secure payment gateway.', 'payments', ARRAY['payment', 'credit card', 'pay', 'billing']),
('How do I contact support?', 'You can contact support through this live chat, submit a support ticket, or email us directly.', 'support', ARRAY['contact', 'help', 'support', 'assistance']);

-- Create function to automatically match FAQ responses
CREATE OR REPLACE FUNCTION public.match_faq_response(p_message_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  matched_faq_id UUID;
  message_lower TEXT;
BEGIN
  message_lower := lower(p_message_text);
  
  -- Find FAQ with matching keywords
  SELECT id INTO matched_faq_id
  FROM public.faqs
  WHERE is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(keywords) AS keyword
      WHERE message_lower ILIKE '%' || keyword || '%'
    )
  ORDER BY array_length(keywords, 1) DESC
  LIMIT 1;
  
  -- Update view count if FAQ found
  IF matched_faq_id IS NOT NULL THEN
    UPDATE public.faqs 
    SET view_count = view_count + 1 
    WHERE id = matched_faq_id;
  END IF;
  
  RETURN matched_faq_id;
END;
$function$;

-- Create function to auto-categorize support tickets
CREATE OR REPLACE FUNCTION public.auto_categorize_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  ticket_text TEXT;
BEGIN
  ticket_text := lower(NEW.title || ' ' || NEW.description);
  
  -- Auto-categorize based on keywords
  IF ticket_text ~ '(payment|billing|refund|charge)' THEN
    NEW.category := 'payments';
  ELSIF ticket_text ~ '(order|delivery|shipping|track)' THEN
    NEW.category := 'orders';
  ELSIF ticket_text ~ '(account|login|password|profile)' THEN
    NEW.category := 'account';
  ELSIF ticket_text ~ '(bug|error|broken|issue)' THEN
    NEW.category := 'technical';
  ELSIF ticket_text ~ '(dispute|complaint|problem)' THEN
    NEW.category := 'disputes';
  ELSE
    NEW.category := 'general';
  END IF;
  
  -- Set priority based on keywords
  IF ticket_text ~ '(urgent|emergency|critical|asap)' THEN
    NEW.priority := 'urgent';
  ELSIF ticket_text ~ '(important|priority|soon)' THEN
    NEW.priority := 'high';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auto-categorization
CREATE TRIGGER auto_categorize_support_ticket
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_categorize_ticket();

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();