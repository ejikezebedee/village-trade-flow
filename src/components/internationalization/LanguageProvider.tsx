import React, { createContext, useContext, useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  availableLanguages: Language[];
  changeLanguage: (languageCode: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }
];

const translations: Record<string, Record<string, string>> = {
  en: {
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'marketplace.title': 'VillageMarket - Rural Commerce Platform',
    'marketplace.subtitle': 'Connecting rural communities with global markets',
    'order.confirm': 'Confirm Order',
    'order.status': 'Order Status',
    'delivery.confirm': 'Confirm Delivery',
    'delivery.otp': 'Enter delivery code',
    'payment.escrow': 'Funds held in escrow until delivery confirmation',
    'error.network': 'Network error. Please try again.',
    'error.authentication': 'Authentication failed',
    'success.orderPlaced': 'Order placed successfully',
    'success.deliveryConfirmed': 'Delivery confirmed successfully'
  },
  ha: {
    'common.welcome': 'Barka da zuwa',
    'common.loading': 'Ana loda...',
    'common.error': 'Kuskure',
    'common.success': 'Nasara',
    'common.cancel': 'Soke',
    'common.confirm': 'Tabbatar',
    'common.save': 'Ajiye',
    'common.edit': 'Gyara',
    'common.delete': 'Share',
    'common.search': 'Bincike',
    'auth.login': 'Shiga',
    'auth.register': 'Yi rajista',
    'auth.logout': 'Fita',
    'nav.home': 'Gida',
    'nav.products': 'Kayayyaki',
    'nav.pricing': 'Farashin',
    'nav.about': 'Game da mu',
    'nav.contact': 'Tuntuɓe mu',
    'marketplace.title': 'VillageMarket - Dandali na Kasuwanci na Karkara',
    'marketplace.subtitle': 'Haɗa al\'ummomin karkara da kasuwannin duniya',
    'order.confirm': 'Tabbatar da oda',
    'order.status': 'Matsayin oda',
    'delivery.confirm': 'Tabbatar da bayarwa',
    'delivery.otp': 'Shigar da lambar bayarwa',
    'payment.escrow': 'Kuɗi ana riƙe har sai an tabbatar da bayarwa',
    'error.network': 'Kuskuren hanyar sadarwa. Da fatan za a sake gwadawa.',
    'error.authentication': 'Tabbatar da kasancewa ya gaza',
    'success.orderPlaced': 'An sanya oda cikin nasara',
    'success.deliveryConfirmed': 'An tabbatar da bayarwa cikin nasara'
  },
  yo: {
    'common.welcome': 'Káàbọ̀',
    'common.loading': 'Ń gbé...',
    'common.error': 'Àṣìṣe',
    'common.success': 'Àṣeyọrí',
    'common.cancel': 'Fagilee',
    'common.confirm': 'Jẹ́rìí',
    'common.save': 'Fi pamọ́',
    'common.edit': 'Ṣàtúnṣe',
    'common.delete': 'Parẹ́',
    'common.search': 'Wá',
    'auth.login': 'Wọlé',
    'auth.register': 'Forúkọsilẹ̀',
    'auth.logout': 'Jáde',
    'nav.home': 'Ilé',
    'nav.products': 'Àwọn ọjà',
    'nav.pricing': 'Owó',
    'nav.about': 'Nípa wa',
    'nav.contact': 'Kàn sí wa',
    'marketplace.title': 'VillageMarket - Pẹpẹ Òwò Abúlé',
    'marketplace.subtitle': 'Ṣíṣe ìdàpọ̀ àwọn agbègbè abúlé pẹ̀lú àwọn ọjà àgbáyé',
    'order.confirm': 'Jẹ́rìí ìbéèrè',
    'order.status': 'Ipò ìbéèrè',
    'delivery.confirm': 'Jẹ́rìí ìfíránṣẹ́',
    'delivery.otp': 'Tẹ koodu ìfíránṣẹ́ sínú',
    'payment.escrow': 'A pa owó mọ́ títí di ìgbà tí a ó fi jẹ́rìí ìfíránṣẹ́',
    'error.network': 'Àṣìṣe nẹ́tíwọ̀ọ̀kì. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kan sí i.',
    'error.authentication': 'Ìjẹ́rìísí kùnà',
    'success.orderPlaced': 'A fi ìbéèrè sílẹ̀ pẹ̀lú àṣeyọrí',
    'success.deliveryConfirmed': 'A jẹ́rìí ìfíránṣẹ́ pẹ̀lú àṣeyọrí'
  },
  ig: {
    'common.welcome': 'Nnọọ',
    'common.loading': 'Na-ebu...',
    'common.error': 'Njehie',
    'common.success': 'Ihe ịga nke ọma',
    'common.cancel': 'Kagbuo',
    'common.confirm': 'Kwenye',
    'common.save': 'Chekwaa',
    'common.edit': 'Dezie',
    'common.delete': 'Hichapụ',
    'common.search': 'Chọọ',
    'auth.login': 'Banye',
    'auth.register': 'Debanye aha',
    'auth.logout': 'Pụọ',
    'nav.home': 'Ụlọ',
    'nav.products': 'Ngwaahịa',
    'nav.pricing': 'Ọnụahịa',
    'nav.about': 'Banyere anyị',
    'nav.contact': 'Kpọtụrụ anyị',
    'marketplace.title': 'VillageMarket - Ikpo okwu ahịa ime obodo',
    'marketplace.subtitle': 'Na-ejikọta obodo ime obodo na ahịa ụwa',
    'order.confirm': 'Kwenye iwu',
    'order.status': 'Ọnọdụ iwu',
    'delivery.confirm': 'Kwenye nnyefe',
    'delivery.otp': 'Tinye koodu nnyefe',
    'payment.escrow': 'A na-ejide ego ruo mgbe a kwenyere nnyefe',
    'error.network': 'Njehie netwọk. Biko nwaakwa ọzọ.',
    'error.authentication': 'Nkwenye dara ada',
    'success.orderPlaced': 'E tinyere iwu nke ọma',
    'success.deliveryConfirmed': 'E kwenyere nnyefe nke ọma'
  },
  fr: {
    'common.welcome': 'Bienvenue',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.search': 'Rechercher',
    'auth.login': 'Connexion',
    'auth.register': "S'inscrire",
    'auth.logout': 'Déconnexion',
    'nav.home': 'Accueil',
    'nav.products': 'Produits',
    'nav.pricing': 'Tarification',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'marketplace.title': 'VillageMarket - Plateforme de commerce rural',
    'marketplace.subtitle': 'Connecter les communautés rurales aux marchés mondiaux',
    'order.confirm': 'Confirmer la commande',
    'order.status': 'Statut de la commande',
    'delivery.confirm': 'Confirmer la livraison',
    'delivery.otp': 'Entrer le code de livraison',
    'payment.escrow': 'Fonds bloqués en séquestre jusqu\'à confirmation de livraison',
    'error.network': 'Erreur réseau. Veuillez réessayer.',
    'error.authentication': 'Échec de l\'authentification',
    'success.orderPlaced': 'Commande passée avec succès',
    'success.deliveryConfirmed': 'Livraison confirmée avec succès'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return saved 
      ? languages.find(lang => lang.code === saved) || languages[0]
      : languages[0];
  });

  const changeLanguage = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      localStorage.setItem('preferred-language', languageCode);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[currentLanguage.code]?.[key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, value);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      availableLanguages: languages,
      changeLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}