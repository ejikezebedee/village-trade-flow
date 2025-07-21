import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Languages, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslateButtonProps {
  text: string;
  contentType?: 'product' | 'notification' | 'faq' | 'general';
  contentId?: string;
  sourceLanguage?: string;
  fallback?: string;
  onTranslated?: (translatedText: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  showOriginal?: boolean;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  text,
  contentType = 'general',
  contentId,
  sourceLanguage = 'auto',
  fallback,
  onTranslated,
  className = '',
  variant = 'outline',
  size = 'sm',
  showOriginal = true
}) => {
  const { currentLanguage, translate, availableLanguages } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentLangName = availableLanguages.find(lang => lang.code === currentLanguage)?.native_name || currentLanguage;

  const handleTranslate = async () => {
    if (isTranslating) return;

    setIsTranslating(true);
    setTranslationStatus('idle');

    try {
      const result = await translate(text, {
        sourceLanguage,
        contentType,
        contentId,
        fallback
      });

      setTranslatedText(result);
      setShowTranslation(true);
      setTranslationStatus('success');
      
      if (onTranslated) {
        onTranslated(result);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslationStatus('error');
      setTranslatedText(fallback || text);
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleView = () => {
    setShowTranslation(!showTranslation);
  };

  // Don't show translate button if current language is likely the source language
  if (currentLanguage === sourceLanguage || currentLanguage === 'en' && sourceLanguage === 'auto') {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          variant={variant}
          size={size}
          onClick={handleTranslate}
          disabled={isTranslating}
          className={className}
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="w-3 h-3 mr-2" />
              Translate to {currentLangName}
            </>
          )}
        </Button>

        {translationStatus === 'success' && (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Translated
          </Badge>
        )}

        {translationStatus === 'error' && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )}
      </div>

      {translatedText && showTranslation && (
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              Translated to {currentLangName}
            </Badge>
            {showOriginal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleView}
                className="text-xs h-6 px-2"
              >
                {showTranslation ? 'Show Original' : 'Show Translation'}
              </Button>
            )}
          </div>
          <p className="text-sm">
            {showTranslation ? translatedText : text}
          </p>
        </div>
      )}
    </div>
  );
};