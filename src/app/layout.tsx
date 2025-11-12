import type { Metadata } from 'next';
import { i18n } from '@/i18n-config';

export const metadata: Metadata = {
  title: {
    default: 'PubliCenter - Multi-language Content Publishing Platform',
    template: '%s | PubliCenter',
  },
  description:
    'Publish content in multiple languages with automatic translation and WordPress integration',
};

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
