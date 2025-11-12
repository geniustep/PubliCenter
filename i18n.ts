import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { i18n, type Locale } from './src/i18n-config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!i18n.locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
