-- Create brands table
CREATE TABLE public.brands (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    logo_url text,
    description text,
    website_url text,
    founded_year integer,
    country text,
    category text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    total_products integer DEFAULT 0,
    total_sales numeric DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    total_ratings integer DEFAULT 0,
    seo_title text,
    seo_description text,
    seo_keywords text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create brand_products junction table to link products to brands
CREATE TABLE public.brand_products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(brand_id, product_id)
);

-- Create brand_followers table for users to follow brands
CREATE TABLE public.brand_followers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(brand_id, user_id)
);

-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Anyone can view active brands" ON public.brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all brands" ON public.brands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- Enable RLS on brand_products table
ALTER TABLE public.brand_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_products
CREATE POLICY "Anyone can view brand products" ON public.brand_products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage brand products" ON public.brand_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- Enable RLS on brand_followers table
ALTER TABLE public.brand_followers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_followers
CREATE POLICY "Users can view their own brand follows" ON public.brand_followers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own brand follows" ON public.brand_followers
    FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_category ON public.brands(category);
CREATE INDEX idx_brands_featured ON public.brands(is_featured);
CREATE INDEX idx_brands_rating ON public.brands(average_rating DESC);
CREATE INDEX idx_brands_sales ON public.brands(total_sales DESC);
CREATE INDEX idx_brand_products_brand_id ON public.brand_products(brand_id);
CREATE INDEX idx_brand_products_product_id ON public.brand_products(product_id);
CREATE INDEX idx_brand_followers_brand_id ON public.brand_followers(brand_id);
CREATE INDEX idx_brand_followers_user_id ON public.brand_followers(user_id);

-- Function to update brand statistics
CREATE OR REPLACE FUNCTION update_brand_statistics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    brand_record RECORD;
BEGIN
    -- Update statistics for all brands that have products
    FOR brand_record IN 
        SELECT b.id, b.name
        FROM public.brands b
        WHERE b.is_active = true
    LOOP
        -- Update total products count
        UPDATE public.brands 
        SET total_products = (
            SELECT COUNT(*)
            FROM public.brand_products bp
            JOIN public.products p ON bp.product_id = p.id
            WHERE bp.brand_id = brand_record.id
            AND p.is_active = true
        )
        WHERE id = brand_record.id;
        
        -- Update average rating
        UPDATE public.brands 
        SET 
            average_rating = COALESCE((
                SELECT AVG(f.rating)
                FROM public.brand_products bp
                JOIN public.products p ON bp.product_id = p.id
                JOIN public.feedback f ON f.order_id IN (
                    SELECT o.id FROM public.orders o 
                    WHERE o.product_name = p.name 
                    AND f.feedback_type = 'product'
                )
                WHERE bp.brand_id = brand_record.id
            ), 0),
            total_ratings = COALESCE((
                SELECT COUNT(f.id)
                FROM public.brand_products bp
                JOIN public.products p ON bp.product_id = p.id
                JOIN public.feedback f ON f.order_id IN (
                    SELECT o.id FROM public.orders o 
                    WHERE o.product_name = p.name 
                    AND f.feedback_type = 'product'
                )
                WHERE bp.brand_id = brand_record.id
            ), 0),
            updated_at = now()
        WHERE id = brand_record.id;
    END LOOP;
    
    RETURN NULL;
END;
$$;

-- Create trigger to update brand statistics
CREATE TRIGGER update_brand_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.brand_products
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_brand_statistics();

-- Function to generate brand slug
CREATE OR REPLACE FUNCTION generate_brand_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate slug from brand name if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := trim(NEW.slug, '-');
    END IF;
    
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM public.brands WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Create trigger for slug generation
CREATE TRIGGER generate_brand_slug_trigger
    BEFORE INSERT OR UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION generate_brand_slug();