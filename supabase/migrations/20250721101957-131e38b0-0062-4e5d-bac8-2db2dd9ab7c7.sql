-- Create comprehensive feedback and rating system
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('buyer', 'seller')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  feedback_type text NOT NULL CHECK (feedback_type IN ('product', 'seller', 'buyer', 'delivery')),
  is_anonymous boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback
CREATE POLICY "Anyone can view public feedback"
ON public.feedback
FOR SELECT
USING (true);

CREATE POLICY "Users can create feedback for their orders"
ON public.feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = feedback.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  ) AND reviewer_id = auth.uid()
);

CREATE POLICY "Users can update their own feedback"
ON public.feedback
FOR UPDATE
USING (reviewer_id = auth.uid());

-- Create feedback prompts table
CREATE TABLE IF NOT EXISTS public.feedback_prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type text NOT NULL CHECK (prompt_type IN ('rate_seller', 'rate_buyer', 'rate_product')),
  is_completed boolean DEFAULT false,
  reminded_count integer DEFAULT 0,
  last_reminded_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on feedback prompts
ALTER TABLE public.feedback_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback prompts
CREATE POLICY "Users can view their own feedback prompts"
ON public.feedback_prompts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback prompts"
ON public.feedback_prompts
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert feedback prompts"
ON public.feedback_prompts
FOR INSERT
WITH CHECK (true);

-- Function to automatically create feedback prompts when order is completed
CREATE OR REPLACE FUNCTION public.create_feedback_prompts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  buyer_prompt_id uuid;
  seller_prompt_id uuid;
BEGIN
  -- Only create prompts when order moves to completed/delivered status
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    
    -- Create prompt for buyer to rate seller and product
    INSERT INTO public.feedback_prompts (
      order_id, user_id, prompt_type
    ) VALUES 
    (NEW.id, NEW.buyer_id, 'rate_seller'),
    (NEW.id, NEW.buyer_id, 'rate_product');
    
    -- Create prompt for seller to rate buyer
    INSERT INTO public.feedback_prompts (
      order_id, user_id, prompt_type
    ) VALUES 
    (NEW.id, NEW.seller_id, 'rate_buyer');
    
    -- Create notifications for feedback requests
    PERFORM public.create_notification(
      NEW.buyer_id,
      'system_alert',
      'Please Rate Your Experience',
      'Your order for ' || NEW.product_name || ' is complete! Please take a moment to rate the seller and product.',
      jsonb_build_object(
        'order_id', NEW.id,
        'action_type', 'feedback_request',
        'product_name', NEW.product_name
      ),
      'normal'
    );
    
    PERFORM public.create_notification(
      NEW.seller_id,
      'system_alert',
      'Please Rate the Buyer',
      'Your sale of ' || NEW.product_name || ' is complete! Please rate your experience with the buyer.',
      jsonb_build_object(
        'order_id', NEW.id,
        'action_type', 'feedback_request',
        'product_name', NEW.product_name
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic feedback prompts
DROP TRIGGER IF EXISTS create_feedback_prompts_trigger ON public.orders;
CREATE TRIGGER create_feedback_prompts_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feedback_prompts();

-- Function to update profile ratings when feedback is added
CREATE OR REPLACE FUNCTION public.update_profile_ratings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating numeric;
  total_ratings integer;
  profile_to_update uuid;
BEGIN
  -- Determine which profile to update based on feedback type
  IF NEW.feedback_type = 'seller' THEN
    profile_to_update := NEW.reviewee_id;
  ELSIF NEW.feedback_type = 'buyer' THEN
    profile_to_update := NEW.reviewee_id;
  ELSE
    RETURN NEW; -- Don't update for product feedback
  END IF;
  
  -- Calculate new average rating for the profile
  SELECT 
    AVG(rating)::numeric(3,2),
    COUNT(*)
  INTO avg_rating, total_ratings
  FROM public.feedback
  WHERE reviewee_id = profile_to_update
  AND feedback_type IN ('seller', 'buyer');
  
  -- Update the profile with new rating
  UPDATE public.profiles
  SET 
    rating = COALESCE(avg_rating, 0),
    total_ratings = COALESCE(total_ratings, 0),
    updated_at = now()
  WHERE user_id = profile_to_update;
  
  -- Mark feedback prompt as completed
  UPDATE public.feedback_prompts
  SET 
    is_completed = true,
    updated_at = now()
  WHERE order_id = NEW.order_id 
  AND user_id = NEW.reviewer_id
  AND prompt_type = CASE 
    WHEN NEW.feedback_type = 'seller' THEN 'rate_seller'
    WHEN NEW.feedback_type = 'buyer' THEN 'rate_buyer'
    WHEN NEW.feedback_type = 'product' THEN 'rate_product'
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating profile ratings
DROP TRIGGER IF EXISTS update_profile_ratings_trigger ON public.feedback;
CREATE TRIGGER update_profile_ratings_trigger
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_ratings();

-- Add product rating aggregation
CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating numeric;
  total_ratings integer;
  product_record public.products%ROWTYPE;
  order_record public.orders%ROWTYPE;
BEGIN
  -- Get order and product details
  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  
  -- Only update for product feedback
  IF NEW.feedback_type = 'product' THEN
    -- Calculate new average rating for the product
    SELECT 
      AVG(f.rating)::numeric(3,2),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.feedback f
    JOIN public.orders o ON f.order_id = o.id
    WHERE o.product_name = order_record.product_name
    AND o.seller_id = order_record.seller_id
    AND f.feedback_type = 'product';
    
    -- Update product statistics (you might want to add rating fields to products table)
    -- For now, we'll store this in the product data or create a separate product_ratings table
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for product ratings
DROP TRIGGER IF EXISTS update_product_ratings_trigger ON public.feedback;
CREATE TRIGGER update_product_ratings_trigger
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_ratings();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_order_reviewer 
ON public.feedback (order_id, reviewer_id);

CREATE INDEX IF NOT EXISTS idx_feedback_reviewee_type 
ON public.feedback (reviewee_id, feedback_type, rating);

CREATE INDEX IF NOT EXISTS idx_feedback_prompts_user_completed 
ON public.feedback_prompts (user_id, is_completed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_product_rating
ON public.feedback (order_id, feedback_type) 
WHERE feedback_type = 'product';