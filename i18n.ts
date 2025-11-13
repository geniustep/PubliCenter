import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { i18n, type Locale } from './src/i18n-config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  const locale = await requestLocale;
  
  if (!locale || !i18n.locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
