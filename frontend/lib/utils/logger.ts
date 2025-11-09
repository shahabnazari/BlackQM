/**
 * Enterprise Logger Utility
 * Replaces all console.log statements with environment-aware logging
 * Production-safe: only debug/info logs in development
 */

interface LogContext {
  [key: string]: any;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
}

class AppLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Debug logging - development only
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment && !this.isTest) {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [DEBUG] ${timestamp} ${message}`, context || '');
    }
  }

  /**
   * Info logging - development only
   * Use for general information
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment && !this.isTest) {
      const timestamp = new Date().toISOString();
      console.log(`ℹ️ [INFO] ${timestamp} ${message}`, context || '');
    }
  }

  /**
   * Warning logging - all environments
   * Use for recoverable issues
   */
  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️ [WARN] ${timestamp} ${message}`, context || '');
  }

  /**
   * Error logging - all environments
   * Use for critical errors
   * TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const timestamp = new Date().toISOString();
    console.error(`❌ [ERROR] ${timestamp} ${message}`, {
      error,
      ...context,
    });

    // TODO: Send to error tracking service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  }

  /**
   * Timed operation logger
   * Use to measure performance of operations
   */
  time(label: string): () => void {
    if (!this.isDevelopment || this.isTest) {
      return () => {}; // No-op in production
    }

    const startTime = performance.now();
    this.debug(`⏱️ Timer started: ${label}`);

    return () => {
      const duration = performance.now() - startTime;
      this.debug(`⏱️ Timer ended: ${label}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    };
  }

  /**
   * Group logger for related logs
   * Use to organize related log messages
   */
  group(label: string, collapsed = true): () => void {
    if (!this.isDevelopment || this.isTest) {
      return () => {}; // No-op in production
    }

    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }

    return () => {
      console.groupEnd();
    };
  }

  /**
   * End a console group
   * Companion to group() method
   */
  groupEnd(): void {
    if (!this.isDevelopment || this.isTest) {
      return; // No-op in production
    }
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new AppLogger();

// Convenience function for measuring async operations
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const endTimer = logger.time(label);
  try {
    const result = await operation();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    logger.error(`Operation failed: ${label}`, error);
    throw error;
  }
}
