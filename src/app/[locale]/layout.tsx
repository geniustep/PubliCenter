import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { i18n, localeDirections } from '@/i18n-config';
import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/providers/query-provider';
import '../globals.css';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!i18n.locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for locale
  const messages = await getMessages();

  // Get text direction for locale
  const dir = localeDirections[locale as keyof typeof localeDirections];

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
