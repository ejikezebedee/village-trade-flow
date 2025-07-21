import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Languages, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const LanguageSelector: React.FC = () => {
  const { 
    currentLanguage, 
    setCurrentLanguage, 
    languages, 
    t, 
    detectLanguage,
    isRTL 
  } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [autoTranslate, setAutoTranslate] = useState(profile?.auto_translate_messages ?? true);
  const [autoDetect, setAutoDetect] = useState(profile?.detect_language_automatically ?? true);

  const handleLanguageChange = async (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    
    toast({
      title: t('common.success', 'Success'),
      description: `Language changed to ${languages.find(l => l.code === newLanguage)?.native_name}`,
    });
  };

  const handleAutoDetect = async () => {
    const detected = detectLanguage();
    setCurrentLanguage(detected);
    
    toast({
      title: t('settings.detect_language', 'Language Detected'),
      description: `Detected language: ${languages.find(l => l.code === detected)?.native_name}`,
    });
  };

  const handleSettingsUpdate = async (setting: string, value: boolean) => {
    if (!profile) return;

    try {
      const updates: any = {};
      if (setting === 'auto_translate') {
        updates.auto_translate_messages = value;
        setAutoTranslate(value);
      } else if (setting === 'auto_detect') {
        updates.detect_language_automatically = value;
        setAutoDetect(value);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.updated', 'Settings updated successfully'),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.update_failed', 'Failed to update settings'),
        variant: 'destructive'
      });
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <Card className={`w-full max-w-md ${isRTL ? 'text-right' : 'text-left'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('settings.language', 'Language Settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Language Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            <span className="font-medium">{t('settings.current_language', 'Current Language')}</span>
          </div>
          <Badge variant="secondary" className="gap-1">
            {currentLang?.native_name}
            {currentLang?.is_rtl && <span className="text-xs">(RTL)</span>}
          </Badge>
        </div>

        {/* Language Selector */}
        <div className="space-y-2">
          <Label htmlFor="language-select">{t('settings.select_language', 'Select Language')}</Label>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder={t('settings.choose_language', 'Choose language')} />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center justify-between w-full">
                    <span>{language.native_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {language.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-detect Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleAutoDetect}
        >
          <Globe className="w-4 h-4 mr-2" />
          {t('settings.auto_detect', 'Auto-detect Language')}
        </Button>

        {/* Translation Settings */}
        {profile && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('settings.translation_preferences', 'Translation Preferences')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-translate" className="text-sm">
                  {t('settings.auto_translate', 'Auto-translate messages')}
                </Label>
                <Switch
                  id="auto-translate"
                  checked={autoTranslate}
                  onCheckedChange={(checked) => handleSettingsUpdate('auto_translate', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detect-lang" className="text-sm">
                  {t('settings.detect_language', 'Auto-detect language')}
                </Label>
                <Switch
                  id="auto-detect-lang"
                  checked={autoDetect}
                  onCheckedChange={(checked) => handleSettingsUpdate('auto_detect', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Language Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t('settings.language_info', 'Your language preference will be saved and used across the platform.')}</p>
          {isRTL && (
            <p className="text-orange-600">
              {t('settings.rtl_notice', 'Right-to-left layout is active for this language.')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};