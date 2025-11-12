export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en', 'fr', 'es'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  ar: 'rtl',
  en: 'ltr',
  fr: 'ltr',
  es: 'ltr',
};
