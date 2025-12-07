'use client';

/**
 * PHASE 10.102 PHASE 6: NETFLIX-GRADE ERROR BOUNDARY
 * Literature Page Error Handler (Next.js App Router Convention)
 *
 * Catches all errors in the literature discovery page and child components.
 * Provides graceful fallback UI and error reporting to monitoring systems.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LiteratureError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Phase 10.102 Phase 6: Log error to monitoring system
    logger.error('Literature page error caught by error boundary', 'LiteratureError', {
      message: error.message,
      stack: error.stack,
      digest: error.digest, // Next.js error digest for tracking
    });

    // TODO: Send to monitoring system (Sentry, Datadog, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   reportError(error);
    // }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-4">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            The literature discovery page encountered an unexpected error.
            {error.digest && (
              <span className="block text-xs mt-2 font-mono">
                Error ID: {error.digest}
              </span>
            )}
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 text-red-900 dark:text-red-100">
              Development Error Details:
            </h3>
            <p className="text-xs font-mono text-red-800 dark:text-red-200 whitespace-pre-wrap">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>

        {/* Support Message */}
        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support or file an issue on{' '}
          <a
            href="https://github.com/your-repo/issues"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
