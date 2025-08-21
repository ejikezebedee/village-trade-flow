import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface LanguageSelectorProps {
  variant?: 'select' | 'popover' | 'button';
  className?: string;
}

export function LanguageSelector({ variant = 'select', className = '' }: LanguageSelectorProps) {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();

  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Globe className="w-4 h-4 mr-2" />
            {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Select Language</h4>
            <div className="space-y-1">
              {availableLanguages.map((language) => (
                <Button
                  key={language.code}
                  variant={currentLanguage.code === language.code ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => changeLanguage(language.code)}
                >
                  <span className="mr-2">{language.flag}</span>
                  <span className="mr-2">{language.name}</span>
                  <span className="text-muted-foreground">({language.nativeName})</span>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          const currentIndex = availableLanguages.findIndex(lang => lang.code === currentLanguage.code);
          const nextIndex = (currentIndex + 1) % availableLanguages.length;
          changeLanguage(availableLanguages[nextIndex].code);
        }}
      >
        {currentLanguage.flag} {currentLanguage.nativeName}
      </Button>
    );
  }

  return (
    <Select value={currentLanguage.code} onValueChange={changeLanguage}>
      <SelectTrigger className={`w-[140px] ${className}`}>
        <SelectValue>
          <span className="flex items-center">
            <span className="mr-2">{currentLanguage.flag}</span>
            {currentLanguage.nativeName}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <span className="flex items-center">
              <span className="mr-2">{language.flag}</span>
              <span className="mr-2">{language.name}</span>
              <span className="text-muted-foreground text-xs">
                ({language.nativeName})
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}