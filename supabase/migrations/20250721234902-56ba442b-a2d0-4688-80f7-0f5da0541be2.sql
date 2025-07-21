-- Create flash_sales table
CREATE TABLE public.flash_sales (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    original_price numeric NOT NULL,
    sale_price numeric NOT NULL,
    discount_percentage integer GENERATED ALWAYS AS (
        ROUND(((original_price - sale_price) / original_price * 100)::numeric)
    ) STORED,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    quantity_available integer DEFAULT 0,
    quantity_sold integer DEFAULT 0,
    is_active boolean DEFAULT true,
    featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT flash_sales_valid_times CHECK (end_time > start_time),
    CONSTRAINT flash_sales_valid_prices CHECK (sale_price < original_price),
    CONSTRAINT flash_sales_valid_quantity CHECK (quantity_available >= 0),
    CONSTRAINT flash_sales_valid_sold CHECK (quantity_sold >= 0)
);

-- Create flash_sale_purchases table to track purchases
CREATE TABLE public.flash_sale_purchases (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flash_sale_id uuid NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    purchase_price numeric NOT NULL,
    order_id uuid REFERENCES public.orders(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT flash_sale_purchases_valid_quantity CHECK (quantity > 0)
);

-- Enable RLS on flash_sales table
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flash_sales
CREATE POLICY "Anyone can view active flash sales" ON public.flash_sales
    FOR SELECT USING (
        is_active = true 
        AND start_time <= now() 
        AND end_time > now()
    );

CREATE POLICY "Admins can manage all flash sales" ON public.flash_sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- Enable RLS on flash_sale_purchases table
ALTER TABLE public.flash_sale_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flash_sale_purchases
CREATE POLICY "Users can view their own purchases" ON public.flash_sale_purchases
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own purchases" ON public.flash_sale_purchases
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases" ON public.flash_sale_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_flash_sales_active ON public.flash_sales(is_active, start_time, end_time);
CREATE INDEX idx_flash_sales_featured ON public.flash_sales(featured, start_time);
CREATE INDEX idx_flash_sales_product ON public.flash_sales(product_id);
CREATE INDEX idx_flash_sales_times ON public.flash_sales(start_time, end_time);
CREATE INDEX idx_flash_sale_purchases_sale ON public.flash_sale_purchases(flash_sale_id);
CREATE INDEX idx_flash_sale_purchases_user ON public.flash_sale_purchases(user_id);

-- Function to automatically update flash sale status
CREATE OR REPLACE FUNCTION update_flash_sale_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Automatically deactivate expired flash sales
    UPDATE public.flash_sales 
    SET is_active = false, updated_at = now()
    WHERE end_time <= now() AND is_active = true;
    
    -- Automatically activate flash sales that have started
    UPDATE public.flash_sales 
    SET is_active = true, updated_at = now()
    WHERE start_time <= now() AND end_time > now() AND is_active = false;
    
    RETURN NULL;
END;
$$;

-- Function to update quantity sold when purchase is made
CREATE OR REPLACE FUNCTION update_flash_sale_quantity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update quantity sold
    UPDATE public.flash_sales 
    SET quantity_sold = quantity_sold + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.flash_sale_id;
    
    -- Check if flash sale is sold out and deactivate if needed
    UPDATE public.flash_sales 
    SET is_active = false, updated_at = now()
    WHERE id = NEW.flash_sale_id 
    AND quantity_sold >= quantity_available 
    AND quantity_available > 0;
    
    RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_flash_sale_quantity_trigger
    AFTER INSERT ON public.flash_sale_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_flash_sale_quantity();

-- Function to get active flash sales with product details
CREATE OR REPLACE FUNCTION get_active_flash_sales()
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    product_id uuid,
    product_name text,
    product_image text,
    original_price numeric,
    sale_price numeric,
    discount_percentage integer,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    quantity_available integer,
    quantity_sold integer,
    featured boolean,
    time_remaining interval
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        fs.id,
        fs.title,
        fs.description,
        fs.product_id,
        p.name as product_name,
        COALESCE(p.images::jsonb->>0, '') as product_image,
        fs.original_price,
        fs.sale_price,
        fs.discount_percentage,
        fs.start_time,
        fs.end_time,
        fs.quantity_available,
        fs.quantity_sold,
        fs.featured,
        (fs.end_time - now()) as time_remaining
    FROM public.flash_sales fs
    LEFT JOIN public.products p ON fs.product_id = p.id
    WHERE fs.is_active = true 
    AND fs.start_time <= now() 
    AND fs.end_time > now()
    ORDER BY fs.featured DESC, fs.end_time ASC;
$$;

-- Enable realtime for flash_sales table
ALTER TABLE public.flash_sales REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.flash_sales;