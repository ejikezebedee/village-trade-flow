import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  Languages, 
  MapPin, 
  Settings,
  Check,
  Zap,
  Eye
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export const LanguageSelector: React.FC = () => {
  const { 
    currentLanguage, 
    availableLanguages, 
    setLanguage, 
    autoDetectEnabled, 
    setAutoDetectEnabled,
    detectUserLanguage,
    isLoading 
  } = useLanguage();
  
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Get browser's preferred language for display
    const browserLang = navigator.language.split('-')[0];
    setDetectedLanguage(browserLang);
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLanguage(languageCode);
      
      const selectedLang = availableLanguages.find(lang => lang.code === languageCode);
      toast({
        title: "Language Updated",
        description: `Language changed to ${selectedLang?.native_name || languageCode}`,
      });
    } catch (error) {
      console.error('Error changing language:', error);
      toast({
        title: "Error",
        description: "Failed to change language",
        variant: "destructive"
      });
    }
  };

  const handleAutoDetectToggle = (enabled: boolean) => {
    setAutoDetectEnabled(enabled);
    
    if (enabled) {
      detectUserLanguage();
      toast({
        title: "Auto-Detection Enabled",
        description: "Language will be automatically detected from your browser settings",
      });
    } else {
      toast({
        title: "Auto-Detection Disabled",
        description: "You can now manually select your preferred language",
      });
    }
  };

  const getLanguageRegion = (code: string) => {
    const regions: { [key: string]: string } = {
      'en': 'Global',
      'es': 'Spain & Latin America',
      'fr': 'France & Francophone',
      'de': 'Germany & DACH',
      'pt': 'Portugal & Brazil',
      'it': 'Italy',
      'ru': 'Russia & CIS',
      'ja': 'Japan',
      'ko': 'South Korea',
      'zh': 'China',
      'ar': 'Middle East & North Africa',
      'hi': 'India',
      'th': 'Thailand',
      'vi': 'Vietnam',
      'tr': 'Turkey',
      'pl': 'Poland',
      'nl': 'Netherlands',
      'sv': 'Sweden',
      'da': 'Denmark',
      'no': 'Norway',
      'fi': 'Finland'
    };
    
    return regions[code] || 'Global';
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading languages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Detection Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <Label htmlFor="auto-detect" className="font-medium">
                  Auto-Detect Language
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically detect language from browser settings
                </p>
              </div>
            </div>
            <Switch
              id="auto-detect"
              checked={autoDetectEnabled}
              onCheckedChange={handleAutoDetectToggle}
            />
          </div>

          {/* Browser Detection Info */}
          {detectedLanguage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Browser Detected: {detectedLanguage.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Based on your browser's language settings
              </p>
            </div>
          )}

          {/* Current Language Display */}
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {availableLanguages.find(lang => lang.code === currentLanguage)?.flag || '🌐'}
                </div>
                <div>
                  <p className="font-medium">
                    {availableLanguages.find(lang => lang.code === currentLanguage)?.native_name || 'English'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Language
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-primary/10 text-primary">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Available Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableLanguages.map((language) => (
              <div
                key={language.code}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                  currentLanguage === language.code 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleLanguageChange(language.code)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{language.flag}</span>
                    <div>
                      <p className="font-medium">{language.native_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {language.name}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {getLanguageRegion(language.code)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                
                {language.is_rtl && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    RTL Support
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={detectUserLanguage}
            >
              <Zap className="w-4 h-4 mr-2" />
              Re-detect Language
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleLanguageChange('en')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Reset to English
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};