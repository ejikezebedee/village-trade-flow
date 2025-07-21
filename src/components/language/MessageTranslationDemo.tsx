import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslateButton } from '@/components/language/TranslateButton';
import { Globe, MessageCircle, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageTranslationDemoProps {
  className?: string;
}

export const MessageTranslationDemo: React.FC<MessageTranslationDemoProps> = ({ className = "" }) => {
  const { currentLanguage, languages, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I am interested in your organic tomatoes. Are they still available?',
      sender: 'Buyer',
      translatedText: null,
      sourceLanguage: 'en'
    },
    {
      id: '2',
      text: 'Yes, we have fresh organic tomatoes. Would you like 5kg or 10kg?',
      sender: 'Seller',
      translatedText: null,
      sourceLanguage: 'en'
    },
    {
      id: '3',
      text: 'Perfect! I would like 10kg. When can I pick them up?',
      sender: 'Buyer',
      translatedText: null,
      sourceLanguage: 'en'
    }
  ]);

  const handleTranslation = (messageId: string, translatedText: string, sourceLanguage: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            translatedText: sourceLanguage === 'original' ? null : translatedText,
            sourceLanguage 
          }
        : msg
    ));
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {t('demo.message_translation', 'Message Translation Demo')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="text-sm text-muted-foreground">
            {t('demo.current_language', 'Current Language')}: 
          </span>
          <Badge variant="secondary">{currentLang?.native_name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.sender === 'Buyer'
                  ? 'bg-blue-50 ml-8'
                  : 'bg-green-50 mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={message.sender === 'Buyer' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {message.sender}
                </Badge>
                <TranslateButton
                  text={message.text}
                  messageId={message.id}
                  onTranslated={(translatedText, sourceLanguage) => 
                    handleTranslation(message.id, translatedText, sourceLanguage)
                  }
                />
              </div>
              
              <p className="text-sm">
                {message.translatedText || message.text}
              </p>
              
              {message.translatedText && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>
                      {t('demo.translated_from', 'Translated from')} {message.sourceLanguage?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-1 text-yellow-500" />
            <div className="text-sm space-y-1">
              <p className="font-medium">
                {t('demo.feature_highlights', 'Translation Features')}:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t('demo.auto_translate', 'Automatic message translation')}</li>
                <li>• {t('demo.cached_translations', 'Cached translations for performance')}</li>
                <li>• {t('demo.show_original', 'Option to view original text')}</li>
                <li>• {t('demo.language_detection', 'Automatic language detection')}</li>
                <li>• {t('demo.opt_out', 'Users can opt-out of auto-translation')}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};