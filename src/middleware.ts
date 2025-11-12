import createMiddleware from 'next-intl/middleware';
import { i18n } from './i18n-config';

export default createMiddleware({
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for:
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /favicon.ico, /robots.txt, etc. (static files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
