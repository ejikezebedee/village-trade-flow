import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Language {
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
}

interface Translation {
  [key: string]: string;
}

interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  languages: Language[];
  translations: Translation;
  t: (key: string, fallback?: string) => string;
  translateText: (text: string, targetLang?: string) => Promise<string>;
  detectLanguage: () => string;
  isRTL: boolean;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation>({});
  const [loading, setLoading] = useState(true);

  // Detect browser language
  const detectLanguage = (): string => {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      const langCode = browserLang.split('-')[0];
      
      // Check if we support this language
      const supportedLang = languages.find(lang => lang.code === langCode);
      return supportedLang ? langCode : 'en';
    }
    return 'en';
  };

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data: languagesData, error } = await supabase
          .from('languages')
          .select('code, name, native_name, is_rtl')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setLanguages(languagesData || []);

        // Auto-detect language if user hasn't set one
        const userLang = localStorage.getItem('preferred_language');
        if (userLang) {
          setCurrentLanguage(userLang);
        } else {
          const detected = detectLanguage();
          setCurrentLanguage(detected);
          localStorage.setItem('preferred_language', detected);
        }
      } catch (error) {
        console.error('Error loading languages:', error);
      }
    };

    loadLanguages();
  }, []);

  // Load translations for current language
  useEffect(() => {
    const loadTranslations = async () => {
      if (!currentLanguage) return;

      try {
        setLoading(true);
        const { data: translationsData, error } = await supabase
          .from('translations')
          .select('translation_key, translated_text')
          .eq('language_code', currentLanguage);

        if (error) throw error;

        const translationMap: Translation = {};
        translationsData?.forEach(item => {
          translationMap[item.translation_key] = item.translated_text;
        });

        setTranslations(translationMap);

        // Update user preference in database if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_language: currentLanguage })
            .eq('user_id', user.id);
        }

        // Store in localStorage
        localStorage.setItem('preferred_language', currentLanguage);
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  // Translate arbitrary text using the translation service
  const translateText = async (text: string, targetLang?: string): Promise<string> => {
    const target = targetLang || currentLanguage;
    
    if (target === 'en') {
      return text; // No need to translate if target is English
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          targetLanguage: target,
          type: 'text'
        }
      });

      if (error) throw error;
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  // Check if current language is RTL
  const isRTL = languages.find(lang => lang.code === currentLanguage)?.is_rtl || false;

  // Apply RTL styles to body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLanguage;
    }
  }, [isRTL, currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setCurrentLanguage,
    languages,
    translations,
    t,
    translateText,
    detectLanguage,
    isRTL,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};