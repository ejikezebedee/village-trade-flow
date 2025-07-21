-- Create automated messages table for storing all system-generated messages
CREATE TABLE public.automated_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('order_placed', 'payment_received', 'order_shipped', 'delivery_confirmed', 'payment_released', 'order_cancelled')),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('buyer', 'seller', 'admin', 'system')),
  subject TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_used TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message templates table for consistent messaging
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  message_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.automated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for automated_messages
CREATE POLICY "Users can view their own automated messages" 
ON public.automated_messages 
FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all automated messages" 
ON public.automated_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role IN ('admin', 'moderator')
  )
);

CREATE POLICY "System can manage automated messages" 
ON public.automated_messages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for message_templates
CREATE POLICY "Admins can manage message templates" 
ON public.message_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Anyone can view active templates" 
ON public.message_templates 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_automated_messages_updated_at
  BEFORE UPDATE ON public.automated_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default message templates
INSERT INTO public.message_templates (template_name, message_type, recipient_type, subject_template, content_template, variables) VALUES
-- Order placed messages
('order_placed_buyer', 'order_placed', 'buyer', 'Order Confirmation - {{product_name}}', 
'Hi {{buyer_name}},

Thank you for your order! Your order for {{product_name}} has been successfully placed.

Order Details:
- Product: {{product_name}}
- Quantity: {{quantity}}
- Total Amount: ${{total_amount}}
- Order ID: {{order_id}}

Your payment has been securely held in escrow until you confirm receipt of your order.

What happens next:
1. The seller will prepare your order
2. You''ll receive tracking information once shipped
3. Confirm receipt to release payment to seller

Thank you for shopping with us!

Best regards,
Village Marketplace Team', 
'{"buyer_name": "string", "product_name": "string", "quantity": "number", "total_amount": "number", "order_id": "string"}'),

('order_placed_seller', 'order_placed', 'seller', 'New Order Received - {{product_name}}', 
'Hi {{seller_name}},

Great news! You have received a new order.

Order Details:
- Product: {{product_name}}
- Quantity: {{quantity}}
- Total Amount: ${{total_amount}}
- Order ID: {{order_id}}
- Buyer: {{buyer_name}}

Payment has been secured in escrow. Please prepare the order and mark it as shipped once dispatched.

To manage this order, visit your seller dashboard.

Best regards,
Village Marketplace Team', 
'{"seller_name": "string", "product_name": "string", "quantity": "number", "total_amount": "number", "order_id": "string", "buyer_name": "string"}'),

-- Payment received messages
('payment_received_buyer', 'payment_received', 'buyer', 'Payment Confirmed - {{product_name}}', 
'Hi {{buyer_name}},

Your payment of ${{amount}} has been successfully processed and secured in escrow for your order of {{product_name}}.

Order ID: {{order_id}}

Your funds are protected until you confirm receipt of your order. The seller has been notified to prepare your order.

Best regards,
Village Marketplace Team', 
'{"buyer_name": "string", "product_name": "string", "amount": "number", "order_id": "string"}'),

('payment_received_seller', 'payment_received', 'seller', 'Payment Secured - {{product_name}}', 
'Hi {{seller_name}},

Payment of ${{amount}} has been received and secured in escrow for order {{order_id}}.

You can now safely prepare and ship the order. Payment will be released to you once the buyer confirms receipt.

Order Details:
- Product: {{product_name}}
- Amount: ${{amount}}
- Order ID: {{order_id}}

Best regards,
Village Marketplace Team', 
'{"seller_name": "string", "product_name": "string", "amount": "number", "order_id": "string"}'),

-- Order shipped messages
('order_shipped_buyer', 'order_shipped', 'buyer', 'Order Shipped - {{product_name}}', 
'Hi {{buyer_name}},

Great news! Your order for {{product_name}} has been shipped and is on its way to you.

Order ID: {{order_id}}
Tracking: {{tracking_info}}

You will receive another notification once your order is delivered. Please confirm receipt when you receive your order to release payment to the seller.

Best regards,
Village Marketplace Team', 
'{"buyer_name": "string", "product_name": "string", "order_id": "string", "tracking_info": "string"}'),

('order_shipped_seller', 'order_shipped', 'seller', 'Order Shipped Confirmation - {{product_name}}', 
'Hi {{seller_name}},

Your order {{order_id}} for {{product_name}} has been successfully marked as shipped.

The buyer will be notified and payment will be released once they confirm receipt.

Thank you for using Village Marketplace!

Best regards,
Village Marketplace Team', 
'{"seller_name": "string", "product_name": "string", "order_id": "string"}'),

-- Delivery confirmed messages
('delivery_confirmed_buyer', 'delivery_confirmed', 'buyer', 'Order Delivered - {{product_name}}', 
'Hi {{buyer_name}},

Thank you for confirming receipt of your order for {{product_name}}.

Order ID: {{order_id}}

Payment has been released to the seller. We hope you enjoy your purchase!

We would love to hear about your experience. Please consider leaving feedback for the seller.

Best regards,
Village Marketplace Team', 
'{"buyer_name": "string", "product_name": "string", "order_id": "string"}'),

('delivery_confirmed_seller', 'delivery_confirmed', 'seller', 'Payment Released - {{product_name}}', 
'Hi {{seller_name}},

Excellent! The buyer has confirmed receipt of order {{order_id}} for {{product_name}}.

Payment of ${{amount}} has been released to your account.

Thank you for providing great service to our community!

Best regards,
Village Marketplace Team', 
'{"seller_name": "string", "product_name": "string", "order_id": "string", "amount": "number"}'),

-- Payment released messages
('payment_released_seller', 'payment_released', 'seller', 'Payment Released - ${{amount}}', 
'Hi {{seller_name}},

Payment of ${{amount}} has been released to your account for order {{order_id}}.

Order: {{product_name}}
Amount: ${{amount}}
Released on: {{release_date}}

The funds should appear in your account within 2-3 business days.

Best regards,
Village Marketplace Team', 
'{"seller_name": "string", "product_name": "string", "order_id": "string", "amount": "number", "release_date": "string"}');

-- Create indexes for better performance
CREATE INDEX idx_automated_messages_order_id ON public.automated_messages(order_id);
CREATE INDEX idx_automated_messages_recipient ON public.automated_messages(recipient_id, message_type);
CREATE INDEX idx_automated_messages_type_status ON public.automated_messages(message_type, delivery_status);
CREATE INDEX idx_automated_messages_created_at ON public.automated_messages(created_at);
CREATE INDEX idx_message_templates_type ON public.message_templates(message_type, recipient_type);