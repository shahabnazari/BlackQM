import * as Sentry from '@sentry/nextjs';

// Edge runtime Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://your-dsn@sentry.io/project-id',
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Edge-specific configuration
  beforeSend(event) {
    // Add edge context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'edge',
      },
    };
    
    // Don't send in development without DSN
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DSN) {
      return null;
    }
    
    return event;
  },
});