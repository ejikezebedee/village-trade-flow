-- CRITICAL SECURITY FIXES AND PLATFORM FOUNDATION
-- Phase 1: Emergency Security Fixes

-- 1. Fix Privilege Escalation - Create secure admin-only role management functions
CREATE OR REPLACE FUNCTION auth_user_id() 
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ 
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid 
$$;

CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(p.user_role, 'user')
  FROM public.profiles p 
  WHERE p.user_id = auth_user_id()
$$;

-- Secure admin-only role management function
CREATE OR REPLACE FUNCTION admin_set_user_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_admin_role text;
  old_role text;
  result jsonb;
BEGIN
  -- Check if caller is admin
  SELECT get_current_user_role() INTO current_admin_role;
  
  IF current_admin_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can modify user roles');
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('user', 'buyer', 'seller', 'driver', 'shop', 'admin', 'moderator') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role specified');
  END IF;
  
  -- Get current role
  SELECT user_role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF old_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update role
  UPDATE public.profiles 
  SET user_role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the change
  INSERT INTO public.security_audit (
    event_type, user_id, event_data, severity, performed_by
  ) VALUES (
    'role_change',
    target_user_id,
    jsonb_build_object(
      'old_role', old_role,
      'new_role', new_role,
      'changed_by', auth_user_id()
    ),
    'warning',
    auth_user_id()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'old_role', old_role, 
    'new_role', new_role
  );
END;
$$;

-- 2. Create comprehensive user profiles table with all needed fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  unique_user_id text UNIQUE,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  user_type text DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'driver', 'shop', 'business', 'diaspora')),
  user_role text DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'moderator')),
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  is_active boolean DEFAULT true,
  rating numeric(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_ratings integer DEFAULT 0,
  location jsonb,
  state text,
  lga text,
  community text,
  landmarks text,
  bio text,
  language_preference text DEFAULT 'en',
  notification_preferences jsonb DEFAULT '{
    "email": true,
    "push": true,
    "sms": false
  }'::jsonb,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS and create secure policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create secure RLS policies
CREATE POLICY "Users can view public profile data"
ON public.profiles FOR SELECT
USING (
  -- Allow viewing basic public info for all users
  true
);

CREATE POLICY "Users can view their own complete profile"
ON public.profiles FOR SELECT 
USING (user_id = auth_user_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth_user_id())
WITH CHECK (
  user_id = auth_user_id() AND
  -- Prevent self-promotion to admin
  (OLD.user_role = NEW.user_role OR get_current_user_role() = 'admin')
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth_user_id());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 3. Create comprehensive marketplace tables
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
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
USING (seller_id = auth_user_id())
WITH CHECK (seller_id = auth_user_id());

CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 4. Create orders table with comprehensive order lifecycle
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM now())::bigint || '-' || FLOOR(RANDOM() * 1000)::int,
  buyer_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  shop_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  -- Product details (snapshot at time of order)
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
  
  -- Order status and stages
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
  
  -- QR codes for secure handoffs
  seller_to_driver_qr text,
  driver_to_shop_qr text,
  shop_to_buyer_qr text,
  
  -- Timing
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  
  -- Payment and escrow
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
  buyer_id = auth_user_id() OR 
  seller_id = auth_user_id() OR 
  driver_id = auth_user_id() OR 
  shop_id = auth_user_id()
);

CREATE POLICY "Users can update orders they're involved in"
ON public.orders FOR UPDATE
USING (
  buyer_id = auth_user_id() OR 
  seller_id = auth_user_id() OR 
  driver_id = auth_user_id() OR 
  shop_id = auth_user_id()
);

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
WITH CHECK (buyer_id = auth_user_id());

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 5. Create bidding system for drivers and shops
CREATE TABLE IF NOT EXISTS public.delivery_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
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
      o.buyer_id = auth_user_id() OR 
      o.seller_id = auth_user_id()
    )
  ) OR
  bidder_id = auth_user_id()
);

CREATE POLICY "Drivers and shops can create bids"
ON public.delivery_bids FOR INSERT
WITH CHECK (
  bidder_id = auth_user_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth_user_id() AND 
    p.user_type = bidder_type
  )
);

CREATE POLICY "Bidders can update their own bids"
ON public.delivery_bids FOR UPDATE
USING (bidder_id = auth_user_id());

-- 6. Create wallet and escrow system
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
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
USING (user_id = auth_user_id());

CREATE POLICY "Users can update their own wallet"
ON public.user_wallets FOR UPDATE
USING (user_id = auth_user_id());

CREATE POLICY "Users can create their own wallet"
ON public.user_wallets FOR INSERT
WITH CHECK (user_id = auth_user_id());

-- 7. Create messaging system
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
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
  sender_id = auth_user_id() OR 
  recipient_id = auth_user_id() OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth_user_id());

CREATE POLICY "Users can update their messages"
ON public.messages FOR UPDATE
USING (
  sender_id = auth_user_id() OR 
  recipient_id = auth_user_id()
);

-- 8. Create comprehensive ratings and reviews system
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  rated_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
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
  rater_id = auth_user_id() AND
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND (
      (o.buyer_id = auth_user_id() AND rated_id IN (o.seller_id, o.driver_id)) OR
      (o.seller_id = auth_user_id() AND rated_id IN (o.buyer_id, o.driver_id)) OR
      (o.driver_id = auth_user_id() AND rated_id IN (o.buyer_id, o.seller_id))
    )
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_order ON public.delivery_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON public.ratings(rated_id);