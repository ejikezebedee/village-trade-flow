import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface ProductTranslationProps {
  productId: string;
  originalName: string;
  originalDescription?: string;
  children: (translatedName: string, translatedDescription?: string) => React.ReactNode;
}

export const ProductTranslation: React.FC<ProductTranslationProps> = ({
  productId,
  originalName,
  originalDescription,
  children
}) => {
  const { currentLanguage, translateText } = useLanguage();
  const { toast } = useToast();
  const [translatedName, setTranslatedName] = useState(originalName);
  const [translatedDescription, setTranslatedDescription] = useState(originalDescription);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTranslation = async () => {
      if (currentLanguage === 'en') {
        setTranslatedName(originalName);
        setTranslatedDescription(originalDescription);
        return;
      }

      try {
        setLoading(true);

        // Check if translation already exists in database
        const { data: existingTranslation } = await supabase
          .from('product_translations')
          .select('name, description')
          .eq('product_id', productId)
          .eq('language_code', currentLanguage)
          .single();

        if (existingTranslation) {
          setTranslatedName(existingTranslation.name);
          setTranslatedDescription(existingTranslation.description);
        } else {
          // Auto-translate and cache
          const namePromise = translateText(originalName, currentLanguage);
          const descPromise = originalDescription 
            ? translateText(originalDescription, currentLanguage)
            : Promise.resolve(undefined);

          const [translatedNameResult, translatedDescResult] = await Promise.all([
            namePromise,
            descPromise
          ]);

          setTranslatedName(translatedNameResult);
          setTranslatedDescription(translatedDescResult);

          // Cache the translation
          try {
            await supabase
              .from('product_translations')
              .insert({
                product_id: productId,
                language_code: currentLanguage,
                name: translatedNameResult,
                description: translatedDescResult || '',
                is_auto_translated: true
              });
          } catch (error) {
            console.error('Error caching product translation:', error);
          }
        }
      } catch (error) {
        console.error('Error loading product translation:', error);
        // Fallback to original text
        setTranslatedName(originalName);
        setTranslatedDescription(originalDescription);
      } finally {
        setLoading(false);
      }
    };

    loadTranslation();
  }, [currentLanguage, productId, originalName, originalDescription, translateText]);

  return (
    <>
      {children(
        loading ? originalName : translatedName,
        loading ? originalDescription : translatedDescription
      )}
    </>
  );
};