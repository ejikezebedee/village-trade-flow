-- Add product listing QR codes to products table
ALTER TABLE public.products 
ADD COLUMN listing_qr_code TEXT,
ADD COLUMN listing_created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create transaction QR codes table for comprehensive tracking
CREATE TABLE public.transaction_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('product_listing', 'order_created', 'payment_confirmed', 'shipped', 'delivered')),
  qr_code_identifier TEXT NOT NULL UNIQUE,
  qr_data_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  product_id UUID REFERENCES public.products(id),
  order_id UUID REFERENCES public.orders(id),
  payment_id UUID REFERENCES public.payments(id)
);

-- Enable Row Level Security
ALTER TABLE public.transaction_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction QR codes
CREATE POLICY "Users can view QR codes for their transactions" 
ON public.transaction_qr_codes 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = transaction_qr_codes.product_id 
    AND p.seller_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = transaction_qr_codes.order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.driver_id = auth.uid() OR o.shop_id = auth.uid())
  )
);

CREATE POLICY "Users can create QR codes for their transactions" 
ON public.transaction_qr_codes 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their QR codes" 
ON public.transaction_qr_codes 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create function to generate unique transaction QR codes
CREATE OR REPLACE FUNCTION public.generate_transaction_qr(
  p_transaction_type TEXT,
  p_transaction_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS TEXT AS $$
DECLARE
  qr_identifier TEXT;
  qr_data_url TEXT;
BEGIN
  -- Generate unique QR identifier
  qr_identifier := 'TXN_' || UPPER(p_transaction_type) || '_' || REPLACE(p_transaction_id::TEXT, '-', '') || '_' || EXTRACT(EPOCH FROM now())::BIGINT;
  
  -- Create QR data URL (placeholder for now)
  qr_data_url := 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IndoaXRlIi8+CiAgICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSI+UVIgQ29kZTwvdGV4dD4KICA8L3N2Zz4K';
  
  -- Insert the QR code record
  INSERT INTO public.transaction_qr_codes (
    transaction_id,
    transaction_type,
    qr_code_identifier,
    qr_data_url,
    created_by,
    product_id,
    order_id,
    payment_id,
    metadata,
    expires_at
  ) VALUES (
    p_transaction_id,
    p_transaction_type,
    qr_identifier,
    qr_data_url,
    auth.uid(),
    p_product_id,
    p_order_id,
    p_payment_id,
    p_metadata,
    CASE 
      WHEN p_transaction_type = 'product_listing' THEN now() + INTERVAL '90 days'
      ELSE now() + INTERVAL '30 days'
    END
  );
  
  RETURN qr_identifier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate product listing QR when product is created
CREATE OR REPLACE FUNCTION public.auto_generate_product_qr()
RETURNS TRIGGER AS $$
DECLARE
  qr_code TEXT;
BEGIN
  -- Generate QR code for new product listing
  qr_code := public.generate_transaction_qr(
    'product_listing',
    NEW.id,
    NEW.id,
    NULL,
    NULL,
    jsonb_build_object(
      'product_name', NEW.name,
      'seller_id', NEW.seller_id,
      'price', NEW.price
    )
  );
  
  -- Update product with QR code
  NEW.listing_qr_code := qr_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic product QR generation
CREATE TRIGGER auto_product_qr_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_product_qr();

-- Function to generate order QR when order is created
CREATE OR REPLACE FUNCTION public.auto_generate_order_qr()
RETURNS TRIGGER AS $$
DECLARE
  qr_code TEXT;
BEGIN
  -- Generate QR code for new order
  qr_code := public.generate_transaction_qr(
    'order_created',
    NEW.id,
    NULL,
    NEW.id,
    NULL,
    jsonb_build_object(
      'product_name', NEW.product_name,
      'buyer_id', NEW.buyer_id,
      'seller_id', NEW.seller_id,
      'total_amount', NEW.total_amount
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic order QR generation
CREATE TRIGGER auto_order_qr_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_order_qr();

-- Function to generate payment QR when payment is confirmed
CREATE OR REPLACE FUNCTION public.auto_generate_payment_qr()
RETURNS TRIGGER AS $$
DECLARE
  qr_code TEXT;
  order_record public.orders%ROWTYPE;
BEGIN
  -- Only generate when payment moves to escrow (confirmed)
  IF NEW.escrow_status = 'held' AND OLD.escrow_status != 'held' THEN
    -- Get order details
    SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
    
    -- Generate QR code for payment confirmation
    qr_code := public.generate_transaction_qr(
      'payment_confirmed',
      NEW.id,
      NULL,
      NEW.order_id,
      NEW.id,
      jsonb_build_object(
        'product_name', order_record.product_name,
        'amount', NEW.amount,
        'payment_method', NEW.payment_method
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic payment QR generation
CREATE TRIGGER auto_payment_qr_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_payment_qr();

-- Create indexes for better performance
CREATE INDEX idx_transaction_qr_codes_transaction_id ON public.transaction_qr_codes(transaction_id);
CREATE INDEX idx_transaction_qr_codes_type ON public.transaction_qr_codes(transaction_type);
CREATE INDEX idx_transaction_qr_codes_qr_code ON public.transaction_qr_codes(qr_code_identifier);
CREATE INDEX idx_transaction_qr_codes_created_by ON public.transaction_qr_codes(created_by);
CREATE INDEX idx_products_listing_qr ON public.products(listing_qr_code);