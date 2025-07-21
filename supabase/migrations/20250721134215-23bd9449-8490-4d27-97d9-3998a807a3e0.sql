-- Create content translations table for caching translations
CREATE TABLE IF NOT EXISTS public.content_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'auto',
  target_language TEXT NOT NULL,
  content_type TEXT DEFAULT 'general',
  content_id UUID,
  translation_service TEXT DEFAULT 'google_translate',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translation usage logs for analytics
CREATE TABLE IF NOT EXISTS public.translation_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  character_count INTEGER NOT NULL DEFAULT 0,
  content_type TEXT DEFAULT 'general',
  translation_service TEXT DEFAULT 'google_translate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create localized content table for pre-translated platform content
CREATE TABLE IF NOT EXISTS public.localized_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'static',
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_key, language_code)
);

-- Create user language preferences table
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  auto_detect_language BOOLEAN NOT NULL DEFAULT true,
  detected_language TEXT,
  detected_region TEXT,
  browser_languages JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_translations
CREATE POLICY "Anyone can view cached translations" ON public.content_translations
  FOR SELECT USING (true);

CREATE POLICY "System can insert translations" ON public.content_translations
  FOR INSERT WITH CHECK (true);

-- RLS policies for translation_usage_logs
CREATE POLICY "Admins can view translation logs" ON public.translation_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_role = ANY(ARRAY['admin'::user_role, 'moderator'::user_role])
    )
  );

CREATE POLICY "System can insert usage logs" ON public.translation_usage_logs
  FOR INSERT WITH CHECK (true);

-- RLS policies for localized_content
CREATE POLICY "Anyone can view localized content" ON public.localized_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage localized content" ON public.localized_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_role = ANY(ARRAY['admin'::user_role, 'moderator'::user_role])
    )
  );

-- RLS policies for user_language_preferences
CREATE POLICY "Users can manage their language preferences" ON public.user_language_preferences
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_translations_lookup 
  ON public.content_translations(original_text, target_language, source_language);

CREATE INDEX IF NOT EXISTS idx_localized_content_lookup 
  ON public.localized_content(content_key, language_code);

CREATE INDEX IF NOT EXISTS idx_user_language_prefs_user 
  ON public.user_language_preferences(user_id);

-- Insert default localized content for common platform text
INSERT INTO public.localized_content (content_key, language_code, content_text, content_type) VALUES
-- English content
('welcome_message', 'en', 'Welcome to VillageMarket', 'static'),
('product_search_placeholder', 'en', 'Search products...', 'static'),
('add_to_cart', 'en', 'Add to Cart', 'static'),
('checkout', 'en', 'Checkout', 'static'),
('order_placed', 'en', 'Order placed successfully', 'notification'),
('payment_received', 'en', 'Payment received', 'notification'),
('order_shipped', 'en', 'Your order has been shipped', 'notification'),
('order_delivered', 'en', 'Your order has been delivered', 'notification'),

-- Spanish content
('welcome_message', 'es', 'Bienvenido a VillageMarket', 'static'),
('product_search_placeholder', 'es', 'Buscar productos...', 'static'),
('add_to_cart', 'es', 'Agregar al Carrito', 'static'),
('checkout', 'es', 'Finalizar Compra', 'static'),
('order_placed', 'es', 'Pedido realizado exitosamente', 'notification'),
('payment_received', 'es', 'Pago recibido', 'notification'),
('order_shipped', 'es', 'Tu pedido ha sido enviado', 'notification'),
('order_delivered', 'es', 'Tu pedido ha sido entregado', 'notification'),

-- French content
('welcome_message', 'fr', 'Bienvenue sur VillageMarket', 'static'),
('product_search_placeholder', 'fr', 'Rechercher des produits...', 'static'),
('add_to_cart', 'fr', 'Ajouter au Panier', 'static'),
('checkout', 'fr', 'Commander', 'static'),
('order_placed', 'fr', 'Commande passée avec succès', 'notification'),
('payment_received', 'fr', 'Paiement reçu', 'notification'),
('order_shipped', 'fr', 'Votre commande a été expédiée', 'notification'),
('order_delivered', 'fr', 'Votre commande a été livrée', 'notification'),

-- German content
('welcome_message', 'de', 'Willkommen bei VillageMarket', 'static'),
('product_search_placeholder', 'de', 'Produkte suchen...', 'static'),
('add_to_cart', 'de', 'In den Warenkorb', 'static'),
('checkout', 'de', 'Zur Kasse', 'static'),
('order_placed', 'de', 'Bestellung erfolgreich aufgegeben', 'notification'),
('payment_received', 'de', 'Zahlung erhalten', 'notification'),
('order_shipped', 'de', 'Ihre Bestellung wurde versandt', 'notification'),
('order_delivered', 'de', 'Ihre Bestellung wurde geliefert', 'notification'),

-- Portuguese content
('welcome_message', 'pt', 'Bem-vindo ao VillageMarket', 'static'),
('product_search_placeholder', 'pt', 'Pesquisar produtos...', 'static'),
('add_to_cart', 'pt', 'Adicionar ao Carrinho', 'static'),
('checkout', 'pt', 'Finalizar Compra', 'static'),
('order_placed', 'pt', 'Pedido realizado com sucesso', 'notification'),
('payment_received', 'pt', 'Pagamento recebido', 'notification'),
('order_shipped', 'pt', 'Seu pedido foi enviado', 'notification'),
('order_delivered', 'pt', 'Seu pedido foi entregue', 'notification')

ON CONFLICT (content_key, language_code) DO NOTHING;

-- Create function to get localized content
CREATE OR REPLACE FUNCTION public.get_localized_content(
  p_content_key TEXT,
  p_language_code TEXT DEFAULT 'en'
)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (SELECT content_text FROM public.localized_content 
     WHERE content_key = p_content_key AND language_code = p_language_code),
    (SELECT content_text FROM public.localized_content 
     WHERE content_key = p_content_key AND language_code = 'en'),
    p_content_key
  );
$$;

-- Create function to detect user language from browser
CREATE OR REPLACE FUNCTION public.detect_and_save_user_language(
  p_user_id UUID,
  p_accept_language TEXT DEFAULT NULL,
  p_detected_region TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  detected_lang TEXT;
  primary_lang TEXT;
BEGIN
  -- Extract primary language from Accept-Language header
  IF p_accept_language IS NOT NULL THEN
    primary_lang := split_part(split_part(p_accept_language, ',', 1), '-', 1);
    
    -- Check if we support this language
    SELECT code INTO detected_lang
    FROM public.languages
    WHERE code = primary_lang AND is_active = true;
    
    -- Default to English if not supported
    detected_lang := COALESCE(detected_lang, 'en');
  ELSE
    detected_lang := 'en';
  END IF;
  
  -- Save or update user language preferences
  INSERT INTO public.user_language_preferences (
    user_id, 
    preferred_language, 
    detected_language,
    detected_region,
    browser_languages
  ) VALUES (
    p_user_id,
    detected_lang,
    detected_lang,
    p_detected_region,
    to_jsonb(string_to_array(p_accept_language, ','))
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    detected_language = detected_lang,
    detected_region = p_detected_region,
    browser_languages = to_jsonb(string_to_array(p_accept_language, ',')),
    updated_at = now();
    
  RETURN detected_lang;
END;
$$;