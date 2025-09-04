import * as Sentry from '@sentry/nextjs';

// Server-side Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://your-dsn@sentry.io/project-id',
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn'],
    }),
  ],
  
  // Enhanced error context for server-side
  beforeSend(event, hint) {
    // Add server context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'node',
        version: process.version,
      },
      app: {
        app_start_time: new Date().toISOString(),
        app_memory: process.memoryUsage().heapUsed,
      },
    };
    
    // Filter sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    
    // Don't send in development without DSN
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DSN) {
      return null;
    }
    
    return event;
  },
});