import * as Sentry from '@sentry/node';
import type { Express } from 'express';

export const sentryEnabled = Boolean(process.env.SENTRY_DSN);

export function initSentry(): void {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

// Must be called after all routes are mounted but before the app's own error handler,
// so Sentry captures the exception before our handler formats the client response.
export function attachSentryErrorHandler(app: Express): void {
  if (!sentryEnabled) return;
  Sentry.setupExpressErrorHandler(app);
}
