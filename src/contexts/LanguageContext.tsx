import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Language {
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
  flag?: string;
}

interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  cached: boolean;
}

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: Language[];
  isLoading: boolean;
  setLanguage: (languageCode: string) => void;
  translate: (text: string, options?: TranslationOptions) => Promise<string>;
  getLocalizedContent: (key: string) => Promise<string>;
  detectUserLanguage: () => Promise<void>;
  autoDetectEnabled: boolean;
  setAutoDetectEnabled: (enabled: boolean) => void;
}

interface TranslationOptions {
  sourceLanguage?: string;
  contentType?: 'product' | 'notification' | 'faq' | 'general';
  contentId?: string;
  fallback?: string;
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
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        const languages: Language[] = (data || []).map(lang => ({
          code: lang.code,
          name: lang.name,
          native_name: lang.native_name,
          is_rtl: lang.is_rtl || false,
          flag: getLanguageFlag(lang.code)
        }));

        setAvailableLanguages(languages);
      } catch (error) {
        console.error('Error loading languages:', error);
        // Fallback languages if database is not available
        setAvailableLanguages([
          { code: 'en', name: 'English', native_name: 'English', is_rtl: false, flag: '🇺🇸' },
          { code: 'es', name: 'Spanish', native_name: 'Español', is_rtl: false, flag: '🇪🇸' },
          { code: 'fr', name: 'French', native_name: 'Français', is_rtl: false, flag: '🇫🇷' },
          { code: 'de', name: 'German', native_name: 'Deutsch', is_rtl: false, flag: '🇩🇪' },
          { code: 'pt', name: 'Portuguese', native_name: 'Português', is_rtl: false, flag: '🇵🇹' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, []);

  // Detect and load user's language preferences
  useEffect(() => {
    const loadUserLanguagePreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && autoDetectEnabled) {
          // Check for saved language preferences
          const { data: preferences } = await supabase
            .from('user_language_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (preferences) {
            setCurrentLanguage(preferences.preferred_language);
            setAutoDetectEnabled(preferences.auto_detect_language);
          } else {
            // Auto-detect language from browser
            await detectUserLanguage();
          }
        } else {
          // For non-authenticated users, detect from browser
          await detectUserLanguage();
        }
      } catch (error) {
        console.error('Error loading user language preferences:', error);
        // Fallback to browser detection
        await detectUserLanguage();
      }
    };

    if (availableLanguages.length > 0) {
      loadUserLanguagePreferences();
    }
  }, [availableLanguages, autoDetectEnabled]);

  const detectUserLanguage = async () => {
    try {
      // Get browser languages
      const browserLanguages = navigator.languages || [navigator.language];
      const acceptLanguage = browserLanguages.join(',');
      
      // Try to get user's region
      let detectedRegion = 'unknown';
      try {
        if ('geolocation' in navigator) {
          // Note: This requires user permission, so we'll handle it gracefully
          detectedRegion = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
      } catch (e) {
        // Ignore geolocation errors
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Use the database function to detect and save language
        const { data, error } = await supabase.rpc('detect_and_save_user_language', {
          p_user_id: user.id,
          p_accept_language: acceptLanguage,
          p_detected_region: detectedRegion
        });

        if (!error && data) {
          setCurrentLanguage(data);
          return;
        }
      }

      // Fallback: detect language client-side
      const primaryLang = browserLanguages[0]?.split('-')[0] || 'en';
      const supportedLang = availableLanguages.find(lang => lang.code === primaryLang);
      
      if (supportedLang) {
        setCurrentLanguage(supportedLang.code);
      } else {
        setCurrentLanguage('en'); // Fallback to English
      }

    } catch (error) {
      console.error('Error detecting user language:', error);
      setCurrentLanguage('en'); // Fallback to English
    }
  };

  const setLanguage = async (languageCode: string) => {
    try {
      setCurrentLanguage(languageCode);

      // Save to user preferences if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_language_preferences')
          .upsert({
            user_id: user.id,
            preferred_language: languageCode,
            auto_detect_language: autoDetectEnabled,
            updated_at: new Date().toISOString()
          });
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem('preferred_language', languageCode);
      }

      // Update document language attribute
      document.documentElement.lang = languageCode;
      
      // Set RTL direction if needed
      const selectedLang = availableLanguages.find(lang => lang.code === languageCode);
      if (selectedLang?.is_rtl) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }

    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const translate = async (text: string, options: TranslationOptions = {}): Promise<string> => {
    try {
      // If the target language is the same as source, return original text
      if (options.sourceLanguage === currentLanguage) {
        return text;
      }

      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          targetLanguage: currentLanguage,
          sourceLanguage: options.sourceLanguage || 'auto',
          contentType: options.contentType || 'general',
          contentId: options.contentId
        }
      });

      if (error) {
        console.error('Translation error:', error);
        return options.fallback || text;
      }

      const response: TranslationResponse = data;
      return response.translatedText || text;

    } catch (error) {
      console.error('Translation failed:', error);
      return options.fallback || text;
    }
  };

  const getLocalizedContent = async (key: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_localized_content', {
        p_content_key: key,
        p_language_code: currentLanguage
      });

      if (error) {
        console.error('Error getting localized content:', error);
        return key; // Return the key as fallback
      }

      return data || key;
    } catch (error) {
      console.error('Error getting localized content:', error);
      return key; // Return the key as fallback
    }
  };

  const setAutoDetectEnabledWrapper = async (enabled: boolean) => {
    setAutoDetectEnabled(enabled);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_language_preferences')
          .upsert({
            user_id: user.id,
            preferred_language: currentLanguage,
            auto_detect_language: enabled,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving auto-detect preference:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    isLoading,
    setLanguage,
    translate,
    getLocalizedContent,
    detectUserLanguage,
    autoDetectEnabled,
    setAutoDetectEnabled: setAutoDetectEnabledWrapper
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Helper function to get flag emoji for language codes
const getLanguageFlag = (code: string): string => {
  const flags: { [key: string]: string } = {
    'en': '🇺🇸',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'pt': '🇵🇹',
    'it': '🇮🇹',
    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'ar': '🇸🇦',
    'hi': '🇮🇳',
    'th': '🇹🇭',
    'vi': '🇻🇳',
    'tr': '🇹🇷',
    'pl': '🇵🇱',
    'nl': '🇳🇱',
    'sv': '🇸🇪',
    'da': '🇩🇰',
    'no': '🇳🇴',
    'fi': '🇫🇮'
  };
  
  return flags[code] || '🌐';
};