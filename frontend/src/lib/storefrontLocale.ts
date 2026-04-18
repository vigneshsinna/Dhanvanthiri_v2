export type StorefrontLocale = 'en' | 'ta';

export interface LocalizedText {
  en: string;
  ta: string;
}

export function getStorefrontLocale(): StorefrontLocale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return localStorage.getItem('dhanvanthiri_locale') === 'ta' ? 'ta' : 'en';
}

export function getLocalizedText(locale: StorefrontLocale, text: LocalizedText): string {
  return locale === 'ta' ? text.ta : text.en;
}
