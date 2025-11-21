import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    environment: process.env.NODE_ENV || 'development',

    // Ignore certain errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'connect ECONNREFUSED',
    ],

    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.level === 'warning' || event.level === 'info') {
        return null;
      }

      // Don't send events in development
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }

      // Add user context if available
      if (event.user && event.user.email) {
        event.user.email = event.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      }

      return event;
    },
  });
}
