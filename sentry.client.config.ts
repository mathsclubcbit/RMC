import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: 1.0,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
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
