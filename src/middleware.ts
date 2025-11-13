import createMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

// Paths that require authentication
const protectedPaths = [
  '/publish',
  '/articles',
  '/wordpress-sites',
  '/templates',
  '/categories',
  '/analytics',
  '/settings',
  '/profile',
];

// Paths that are public (no auth required)
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/contact',
];

const intlMiddleware = createMiddleware({
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'always',
});

const authMiddleware = withAuth(
  function middleware(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Extract the path without locale prefix
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');

        // Allow public paths
        if (publicPaths.some((path) => pathWithoutLocale.startsWith(path))) {
          return true;
        }

        // Check if path is protected
        const isProtectedPath = protectedPaths.some((path) =>
          pathWithoutLocale.startsWith(path)
        );

        // If it's a protected path, require auth
        if (isProtectedPath) {
          return !!token;
        }

        // Allow all other paths
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathWithoutLocale.startsWith(path)
  );

  // If it's a protected path, use auth middleware
  if (isProtectedPath) {
    return (authMiddleware as any)(req);
  }

  // Otherwise, just use intl middleware
  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for:
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /favicon.ico, /robots.txt, etc. (static files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
