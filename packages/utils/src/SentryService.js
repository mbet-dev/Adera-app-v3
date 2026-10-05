/**
 * Centralized Sentry initialization for the Adera hybrid app.
 *
 * Uses @sentry/react-native (works on iOS, Android, and web via @sentry/browser).
 * Activation is controlled by EXPO_PUBLIC_SENTRY_DSN — when unset, every call is
 * a safe no-op so local development never sends telemetry anywhere.
 */

import * as Sentry from '@sentry/react-native';

let initialized = false;

export const initSentry = () => {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const isDev = __DEV__;

  try {
    Sentry.init({
      dsn: dsn || undefined,
      // Only send data when a DSN is configured. Enable debug in dev to see
      // Sentry logs locally once a dev DSN is provided.
      enabled: !!dsn,
      debug: isDev && !!dsn,
      environment: isDev ? 'development' : 'production',
      // Trim noisy defaults; keep enough context for debugging
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      // Sample 100% in dev, 20% in production (tune after rollout)
      tracesSampleRate: isDev ? 1.0 : 0.2,
      // Never capture user-identifying request headers
      sendDefaultPii: false,
      beforeSend(event) {
        // Strip Authorization headers / cookies that SDKs may attach
        if (event?.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers.authorization;
          }
        }
        return event;
      },
    });
  } catch (error) {
    // Never let observability break the app
    console.warn('[Sentry] init failed:', error?.message);
  }
};

export const captureException = (error, context) => {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  try {
    Sentry.captureException(error, context);
  } catch {
    // no-op
  }
};

export const captureMessage = (message, level) => {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  try {
    Sentry.captureMessage(message, level);
  } catch {
    // no-op
  }
};

/** Wrap a React component so render errors are reported to Sentry. */
export const withSentryErrorBoundary = (Component) => {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return Component;
  try {
    return Sentry.withErrorBoundary(Component);
  } catch {
    return Component;
  }
};

export default Sentry;
