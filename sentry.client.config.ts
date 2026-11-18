import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring - reduced to 10% for better performance
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (optional) - reduced to 1% to minimize overhead
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production',

    // Ignore specific errors
    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'Load failed',
    ],
});
