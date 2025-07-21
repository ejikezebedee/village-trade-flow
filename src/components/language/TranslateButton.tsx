import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Languages, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface TranslateButtonProps {
  text: string;
  messageId?: string;
  onTranslated?: (translatedText: string, sourceLanguage: string) => void;
  className?: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  text,
  messageId,
  onTranslated,
  className = ""
}) => {
  const { currentLanguage, t } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalText, setOriginalText] = useState(text);

  const handleTranslate = async () => {
    if (isTranslated) {
      // Show original text
      onTranslated?.(originalText, 'original');
      setIsTranslated(false);
      return;
    }

    if (isTranslating) return;

    try {
      setIsTranslating(true);
      setOriginalText(text);

      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          targetLanguage: currentLanguage,
          type: messageId ? 'message' : 'text',
          messageId
        }
      });

      if (error) throw error;

      if (data.success) {
        onTranslated?.(data.translatedText, data.sourceLanguage);
        setIsTranslated(true);
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Don't show translate button if already in the target language
  if (currentLanguage === 'en' && !isTranslated) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
            className={`h-6 px-2 ${className}`}
          >
            {isTranslating ? (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : isTranslated ? (
              <RotateCcw className="w-3 h-3" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            <span className="ml-1 text-xs">
              {isTranslating 
                ? t('chat.translating', 'Translating...') 
                : isTranslated 
                  ? t('chat.original', 'Original')
                  : t('chat.translate', 'Translate')
              }
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isTranslated 
              ? t('chat.show_original', 'Show original text')
              : t('chat.translate_to', `Translate to ${currentLanguage.toUpperCase()}`)
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};