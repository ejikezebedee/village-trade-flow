-- Create multilingual support system
CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- ISO 639-1 codes like 'en', 'es', 'fr'
  name TEXT NOT NULL, -- Language name in English
  native_name TEXT NOT NULL, -- Language name in native script
  is_active BOOLEAN DEFAULT true,
  is_rtl BOOLEAN DEFAULT false, -- Right-to-left languages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create translations table for static content
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL, -- Key for the content to translate
  language_code TEXT NOT NULL REFERENCES public.languages(code),
  translated_text TEXT NOT NULL,
  context TEXT, -- Additional context for translators
  is_auto_translated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(translation_key, language_code)
);

-- User language preferences
ALTER TABLE public.profiles 
ADD COLUMN preferred_language TEXT DEFAULT 'en' REFERENCES public.languages(code),
ADD COLUMN auto_translate_messages BOOLEAN DEFAULT true,
ADD COLUMN detect_language_automatically BOOLEAN DEFAULT true;

-- Message translations for chat
CREATE TABLE public.message_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES public.languages(code),
  translated_text TEXT NOT NULL,
  confidence_score NUMERIC(3,2), -- Translation confidence (0.00-1.00)
  translation_service TEXT DEFAULT 'google_translate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, language_code)
);

-- Product translations
CREATE TABLE public.product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES public.languages(code),
  name TEXT NOT NULL,
  description TEXT,
  is_auto_translated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, language_code)
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for languages (public read)
CREATE POLICY "Anyone can view active languages" ON public.languages
  FOR SELECT USING (is_active = true);

-- RLS Policies for translations (public read)
CREATE POLICY "Anyone can view translations" ON public.translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage translations" ON public.translations
  FOR ALL USING (public.is_admin());

-- RLS Policies for message translations
CREATE POLICY "Users can view message translations for their messages" ON public.message_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_translations.message_id
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

CREATE POLICY "System can insert message translations" ON public.message_translations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for product translations
CREATE POLICY "Anyone can view product translations" ON public.product_translations
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their product translations" ON public.product_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_translations.product_id
      AND EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = p.seller_id AND pr.user_id = auth.uid()
      )
    )
  );

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, is_active) VALUES
  ('en', 'English', 'English', true),
  ('es', 'Spanish', 'Español', true),
  ('fr', 'French', 'Français', true),
  ('de', 'German', 'Deutsch', true),
  ('it', 'Italian', 'Italiano', true),
  ('pt', 'Portuguese', 'Português', true),
  ('nl', 'Dutch', 'Nederlands', true),
  ('pl', 'Polish', 'Polski', true),
  ('ru', 'Russian', 'Русский', true),
  ('ja', 'Japanese', '日本語', true),
  ('ko', 'Korean', '한국어', true),
  ('zh', 'Chinese', '中文', true),
  ('ar', 'Arabic', 'العربية', true, true), -- RTL language
  ('hi', 'Hindi', 'हिन्दी', true),
  ('bn', 'Bengali', 'বাংলা', true),
  ('tr', 'Turkish', 'Türkçe', true),
  ('vi', 'Vietnamese', 'Tiếng Việt', true),
  ('th', 'Thai', 'ไทย', true),
  ('sv', 'Swedish', 'Svenska', true),
  ('da', 'Danish', 'Dansk', true),
  ('no', 'Norwegian', 'Norsk', true),
  ('fi', 'Finnish', 'Suomi', true),
  ('cs', 'Czech', 'Čeština', true),
  ('hu', 'Hungarian', 'Magyar', true),
  ('ro', 'Romanian', 'Română', true),
  ('bg', 'Bulgarian', 'Български', true),
  ('hr', 'Croatian', 'Hrvatski', true),
  ('sk', 'Slovak', 'Slovenčina', true),
  ('sl', 'Slovenian', 'Slovenščina', true),
  ('et', 'Estonian', 'Eesti', true),
  ('lv', 'Latvian', 'Latviešu', true),
  ('lt', 'Lithuanian', 'Lietuvių', true);

-- Insert default English translations for common UI elements
INSERT INTO public.translations (translation_key, language_code, translated_text) VALUES
  ('nav.home', 'en', 'Home'),
  ('nav.products', 'en', 'Products'),
  ('nav.orders', 'en', 'Orders'),
  ('nav.messages', 'en', 'Messages'),
  ('nav.profile', 'en', 'Profile'),
  ('nav.admin', 'en', 'Admin'),
  ('nav.logout', 'en', 'Logout'),
  ('common.search', 'en', 'Search'),
  ('common.filter', 'en', 'Filter'),
  ('common.save', 'en', 'Save'),
  ('common.cancel', 'en', 'Cancel'),
  ('common.submit', 'en', 'Submit'),
  ('common.edit', 'en', 'Edit'),
  ('common.delete', 'en', 'Delete'),
  ('common.view', 'en', 'View'),
  ('common.loading', 'en', 'Loading...'),
  ('common.error', 'en', 'Error'),
  ('common.success', 'en', 'Success'),
  ('orders.status.pending', 'en', 'Pending'),
  ('orders.status.confirmed', 'en', 'Confirmed'),
  ('orders.status.shipped', 'en', 'Shipped'),
  ('orders.status.delivered', 'en', 'Delivered'),
  ('orders.status.cancelled', 'en', 'Cancelled'),
  ('products.add_to_cart', 'en', 'Add to Cart'),
  ('products.buy_now', 'en', 'Buy Now'),
  ('products.out_of_stock', 'en', 'Out of Stock'),
  ('products.price', 'en', 'Price'),
  ('products.description', 'en', 'Description'),
  ('chat.type_message', 'en', 'Type a message...'),
  ('chat.send', 'en', 'Send'),
  ('chat.translate', 'en', 'Translate'),
  ('chat.original', 'en', 'Show Original'),
  ('settings.language', 'en', 'Language'),
  ('settings.auto_translate', 'en', 'Auto-translate messages'),
  ('settings.detect_language', 'en', 'Detect language automatically');

-- Create indexes for performance
CREATE INDEX idx_translations_key_lang ON public.translations(translation_key, language_code);
CREATE INDEX idx_message_translations_message ON public.message_translations(message_id);
CREATE INDEX idx_product_translations_product ON public.product_translations(product_id);
CREATE INDEX idx_profiles_language ON public.profiles(preferred_language);

-- Function to get user's preferred language
CREATE OR REPLACE FUNCTION public.get_user_language(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT preferred_language FROM public.profiles WHERE user_id = user_uuid),
    'en'
  );
$$;

-- Function to detect browser language
CREATE OR REPLACE FUNCTION public.detect_browser_language(accept_language TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  detected_lang TEXT;
  lang_code TEXT;
BEGIN
  -- Extract first language from Accept-Language header
  -- Format: "en-US,en;q=0.9,es;q=0.8"
  IF accept_language IS NULL THEN
    RETURN 'en';
  END IF;
  
  -- Get first language code
  lang_code := split_part(split_part(accept_language, ',', 1), '-', 1);
  
  -- Check if we support this language
  SELECT code INTO detected_lang
  FROM public.languages
  WHERE code = lang_code AND is_active = true;
  
  -- Return detected language or default to English
  RETURN COALESCE(detected_lang, 'en');
END;
$$;

-- Trigger to auto-detect language for new users
CREATE OR REPLACE FUNCTION public.set_user_language_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be enhanced when we can access request headers
  -- For now, it defaults to English
  IF NEW.preferred_language IS NULL THEN
    NEW.preferred_language := 'en';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_language_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_language_on_signup();