-- Fix the RLS policy syntax error
-- Re-create profiles table policies correctly

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile except role" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create correct RLS policies
CREATE POLICY "Users can view basic profile info"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile only"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can delete profiles"
ON public.profiles FOR DELETE
USING (true);

-- Create admin-specific function to check admin status safely
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  );
$$;

-- Create admin policy separately
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Now create all the marketplace tables properly
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  subcategory text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'NGN',
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  images jsonb DEFAULT '[]'::jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  location jsonb,
  state text,
  lga text,
  community text,
  weight_kg numeric(8,2),
  dimensions jsonb,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  auto_tags_generated boolean DEFAULT false,
  category_confidence numeric(3,2) DEFAULT 0.0,
  last_categorized_at timestamptz,
  total_orders integer DEFAULT 0,
  average_rating numeric(2,1) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true);

CREATE POLICY "Sellers can manage their products"
ON public.products FOR ALL
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM now())::bigint || '-' || FLOOR(RANDOM() * 1000)::int,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Product details
  product_name text NOT NULL,
  product_description text,
  product_image_url text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  currency text DEFAULT 'NGN',
  
  -- Delivery details
  pickup_location jsonb NOT NULL,
  delivery_location jsonb NOT NULL,
  estimated_distance_km numeric(8,2),
  delivery_fee numeric(10,2) DEFAULT 0,
  platform_fee numeric(10,2) DEFAULT 0,
  
  -- Order status
  order_status text DEFAULT 'pending' CHECK (order_status IN (
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'driver_assigned', 'picked_up', 'in_transit', 'delivered_to_shop',
    'ready_for_collection', 'delivered', 'completed', 'cancelled', 'disputed'
  )),
  current_stage text DEFAULT 'order_placed' CHECK (current_stage IN (
    'order_placed', 'seller_preparing', 'driver_bidding', 'driver_assigned',
    'ready_for_pickup', 'driver_pickup', 'in_transit', 'shop_delivery',
    'ready_for_collection', 'buyer_pickup', 'completed'
  )),
  
  -- QR codes
  seller_to_driver_qr text,
  driver_to_shop_qr text,
  shop_to_buyer_qr text,
  
  -- Timing
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  
  -- Payment
  payment_status text DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'held_in_escrow', 'released', 'refunded', 'disputed'
  )),
  escrow_release_date timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders"
ON public.orders FOR SELECT
USING (
  buyer_id = auth.uid() OR 
  seller_id = auth.uid() OR 
  driver_id = auth.uid() OR 
  shop_id = auth.uid()
);

CREATE POLICY "Users can update orders they're involved in"
ON public.orders FOR UPDATE
USING (
  buyer_id = auth.uid() OR 
  seller_id = auth.uid() OR 
  driver_id = auth.uid() OR 
  shop_id = auth.uid()
);

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create delivery bids table
CREATE TABLE IF NOT EXISTS public.delivery_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bidder_type text NOT NULL CHECK (bidder_type IN ('driver', 'shop')),
  bid_amount numeric(10,2) NOT NULL CHECK (bid_amount >= 0),
  currency text DEFAULT 'NGN',
  estimated_time_minutes integer,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  is_auto_selected boolean DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(order_id, bidder_id, bidder_type)
);

ALTER TABLE public.delivery_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order participants can view bids"
ON public.delivery_bids FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND (
      o.buyer_id = auth.uid() OR 
      o.seller_id = auth.uid()
    )
  ) OR
  bidder_id = auth.uid()
);

CREATE POLICY "Drivers and shops can create bids"
ON public.delivery_bids FOR INSERT
WITH CHECK (
  bidder_id = auth.uid()
);

CREATE POLICY "Bidders can update their own bids"
ON public.delivery_bids FOR UPDATE
USING (bidder_id = auth.uid());

-- Create user wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  escrow_balance numeric(15,2) DEFAULT 0.00 CHECK (escrow_balance >= 0),
  available_balance numeric(15,2) DEFAULT 0.00 CHECK (available_balance >= 0),
  total_earned numeric(15,2) DEFAULT 0.00,
  total_spent numeric(15,2) DEFAULT 0.00,
  currency text DEFAULT 'NGN',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.user_wallets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet"
ON public.user_wallets FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallet"
ON public.user_wallets FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  is_read boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR
  is_admin_user()
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their messages"
ON public.messages FOR UPDATE
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating_type text NOT NULL CHECK (rating_type IN ('buyer_to_seller', 'seller_to_buyer', 'buyer_to_driver', 'driver_to_buyer', 'seller_to_driver', 'driver_to_seller')),
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  review_text text,
  is_anonymous boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(order_id, rater_id, rated_id, rating_type)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings for their orders"
ON public.ratings FOR INSERT
WITH CHECK (
  rater_id = auth.uid()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_order ON public.delivery_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON public.ratings(rated_id);