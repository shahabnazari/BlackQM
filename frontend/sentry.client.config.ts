import * as Sentry from '@sentry/nextjs';

// Client-side Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://your-dsn@sentry.io/project-id',
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,
  
  // Replay configuration for session recordings
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content, but keep media playback
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  
  // Filter certain errors from being reported
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Safari-specific errors
    'Non-Error promise rejection captured',
  ],
  
  // Filter transactions
  beforeSendTransaction(event: any) {
    // Don't send transactions for health checks
    if (event.transaction === '/api/health') {
      return null;
    }
    return event;
  },
  
  // Clean up sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/token=[^&]*/g, 'token=***');
    }
    
    // Remove PII from user context
    if (event.user?.email) {
      event.user.email = '***@***.***';
    }
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    
    return event;
  },
});