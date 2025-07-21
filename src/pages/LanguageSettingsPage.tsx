import React from 'react';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { MessageTranslationDemo } from '@/components/language/MessageTranslationDemo';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('settings.language_title', 'Language & Translation Settings')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.language_description', 'Customize your language preferences and explore translation features')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <LanguageSelector />
          </div>
          
          <div>
            <MessageTranslationDemo />
          </div>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {t('settings.supported_features', 'Supported Translation Features')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">
                {t('settings.automatic_detection', 'Automatic Language Detection')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.detection_description', 'Automatically detects your preferred language based on browser settings')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {t('settings.message_translation', 'Message Translation')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.message_description', 'Real-time translation of chat messages with caching for performance')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {t('settings.product_translation', 'Product Translation')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.product_description', 'Automatic translation of product names and descriptions')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {t('settings.ui_translation', 'Interface Translation')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.ui_description', 'Complete translation of buttons, labels, and interface elements')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}