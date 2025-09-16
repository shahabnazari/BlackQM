import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryConfig {
  constructor(private configService: ConfigService) {}

  init() {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const dsn = this.configService.get<string>('SENTRY_DSN');
    
    // Only initialize in production or if DSN is provided
    if (!dsn && environment === 'development') {
      console.log('Sentry: Skipping initialization in development without DSN');
      return;
    }

    Sentry.init({
      dsn: dsn || 'https://your-dsn@sentry.io/project-id', // Replace with actual DSN
      environment,
      integrations: [
        // Enable profiling
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
      // Release tracking
      release: process.env.RELEASE_VERSION || '1.0.0',
      // Environment-specific settings
      beforeSend(event: any, hint: any) {
        // Filter out sensitive data
        if (event.request) {
          // Remove authentication headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          // Remove sensitive query params
          if (event.request.query_string && typeof event.request.query_string === 'string') {
            event.request.query_string = event.request.query_string.replace(
              /password=[^&]*/gi,
              'password=***'
            );
          }
        }
        
        // Don't send events in test environment
        if (process.env.NODE_ENV === 'test') {
          return null;
        }
        
        return event;
      },
    } as any);

    // Set up user context (to be called after auth)
    this.setupUserContext();
    
    console.log(`Sentry: Initialized for ${environment} environment`);
  }

  setupUserContext(user?: { id: string; email: string; role: string }) {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  // Performance monitoring helpers
  startTransaction(name: string, op: string) {
    return Sentry.startSpan({
      name,
      op,
    }, () => {
      // Transaction logic would go here
      return null;
    });
  }

  // Measure database query performance
  async measureDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return Sentry.startSpan({
      name: queryName,
      op: 'db.query',
    }, async () => {
      try {
        const result = await queryFn();
        return result;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    });
  }
}