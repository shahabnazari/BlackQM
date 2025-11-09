/**
 * Enterprise Logger Utility - Phase 10.1 Day 9
 *
 * Production-grade centralized logging system with:
 * - 5 log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Component context tracking
 * - User ID tracking (auto-extracted from JWT)
 * - Performance timing (startPerformance/endPerformance)
 * - Sensitive data masking (passwords, tokens, API keys, SSNs)
 * - Log buffering and batching (configurable batch size and interval)
 * - Export functionality (download as JSON or CSV)
 * - Backend integration (ready for /api/logs endpoint)
 * - Global error handlers (catches unhandled errors and promise rejections)
 * - User action tracking for analytics
 * - Statistics dashboard (getStats() method)
 * - Development helper (window.logger in dev mode)
 * - Cleanup on destroy (stops timers, flushes buffer)
 *
 * @version 2.0.0
 * @date November 9, 2025
 * @enterprise-grade YES
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  data?: Record<string, unknown>;
  stack?: string;
  performance?: {
    duration: number;
    operation: string;
  };
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableBuffer: boolean;
  bufferSize: number;
  batchInterval: number;
  maskSensitiveData: boolean;
  backendEndpoint?: string;
}

class EnterpriseLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private performanceMarks: Map<string, number> = new Map();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableBuffer: true,
      bufferSize: 100,
      batchInterval: 5000,
      maskSensitiveData: true,
      backendEndpoint: '/api/logs',
      ...config,
    };

    if (this.config.enableBuffer) {
      this.startBatchTimer();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  /**
   * Debug level logging - development only
   * Use for detailed debugging information
   *
   * Flexible signatures (backward compatible):
   * - debug(message: string, context?: string, data?: object)
   * - debug(message: string, data: object) - data in 2nd position
   * - debug(data: object) - data only
   */
  debug(messageOrData: string | unknown, contextOrData?: string | unknown, data?: unknown): void {
    if (typeof messageOrData === 'string') {
      // First param is string (message)
      if (typeof contextOrData === 'string') {
        // Second param is context string
        this.log(LogLevel.DEBUG, messageOrData, contextOrData, data);
      } else {
        // Second param is data object
        this.log(LogLevel.DEBUG, messageOrData, undefined, contextOrData);
      }
    } else {
      // First param is data object
      this.log(LogLevel.DEBUG, 'Debug data', undefined, messageOrData);
    }
  }

  /**
   * Info level logging - general information
   * Use for informational messages
   *
   * Flexible signatures (backward compatible):
   * - info(message: string, context?: string, data?: object)
   * - info(message: string, data: object) - data in 2nd position
   * - info(data: object) - data only
   */
  info(messageOrData: string | unknown, contextOrData?: string | unknown, data?: unknown): void {
    if (typeof messageOrData === 'string') {
      if (typeof contextOrData === 'string') {
        this.log(LogLevel.INFO, messageOrData, contextOrData, data);
      } else {
        this.log(LogLevel.INFO, messageOrData, undefined, contextOrData);
      }
    } else {
      this.log(LogLevel.INFO, 'Info data', undefined, messageOrData);
    }
  }

  /**
   * Warning level logging - potential issues
   * Use for recoverable problems that need attention
   *
   * Flexible signatures (backward compatible):
   * - warn(message: string, context?: string, data?: object)
   * - warn(message: string, data: object) - data in 2nd position
   * - warn(data: object) - data only
   */
  warn(messageOrData: string | unknown, contextOrData?: string | unknown, data?: unknown): void {
    if (typeof messageOrData === 'string') {
      if (typeof contextOrData === 'string') {
        this.log(LogLevel.WARN, messageOrData, contextOrData, data);
      } else {
        this.log(LogLevel.WARN, messageOrData, undefined, contextOrData);
      }
    } else {
      this.log(LogLevel.WARN, 'Warning data', undefined, messageOrData);
    }
  }

  /**
   * Error level logging - errors that need attention
   * Use for errors that are caught and handled
   */
  error(message: string, context?: string | unknown, error?: unknown): void {
    // Handle flexible parameters
    let actualContext: string | undefined;
    let actualError: unknown;

    if (typeof context === 'string') {
      actualContext = context;
      actualError = error;
    } else {
      actualContext = undefined;
      actualError = context;
    }

    const data = actualError instanceof Error
      ? { errorMessage: actualError.message, errorName: actualError.name }
      : actualError;

    const stack = actualError instanceof Error ? actualError.stack : undefined;

    this.log(LogLevel.ERROR, message, actualContext, data, stack);
  }

  /**
   * Fatal level logging - critical errors requiring immediate attention
   * Use for unrecoverable errors that require immediate action
   * Automatically flushes buffer immediately
   */
  fatal(message: string, context?: string | unknown, error?: unknown): void {
    // Handle flexible parameters
    let actualContext: string | undefined;
    let actualError: unknown;

    if (typeof context === 'string') {
      actualContext = context;
      actualError = error;
    } else {
      actualContext = undefined;
      actualError = context;
    }

    const data = actualError instanceof Error
      ? { errorMessage: actualError.message, errorName: actualError.name }
      : actualError;

    const stack = actualError instanceof Error ? actualError.stack : undefined;

    this.log(LogLevel.FATAL, message, actualContext, data, stack);

    // Fatal errors are sent immediately
    this.flushBuffer();
  }

  /**
   * Start performance timing
   * Call this at the start of an operation, then call endPerformance() when done
   *
   * @example
   * logger.startPerformance('theme-extraction');
   * // ... perform operation ...
   * logger.endPerformance('theme-extraction', 'ThemeService');
   */
  startPerformance(operation: string): void {
    this.performanceMarks.set(operation, performance.now());
  }

  /**
   * End performance timing and log
   * Logs the duration of the operation in milliseconds
   */
  endPerformance(operation: string, context?: string): void {
    const startTime = this.performanceMarks.get(operation);
    if (startTime === undefined) {
      this.warn(`Performance mark not found for operation: ${operation}`, 'Logger');
      return;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(operation);

    this.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, context || 'Performance', {
      performance: { duration, operation },
    });
  }

  /**
   * Log user action for analytics
   * Use this to track user interactions for product analytics
   *
   * @example
   * logger.logUserAction('paper-saved', 'LiteraturePage', { paperId: '123', doi: '10.1234/abc' });
   */
  logUserAction(action: string, context?: string, data?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, context || 'UserActions', {
      action,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Core logging method
   * Internal use only - use debug(), info(), warn(), error(), fatal() instead
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    stack?: string
  ): void {
    // Skip if below minimum level
    if (level < this.config.minLevel) {
      return;
    }

    // Get user ID if available
    const userId = this.getUserId();

    // Mask sensitive data
    const maskedData = this.config.maskSensitiveData && data && typeof data === 'object' && data !== null
      ? this.maskSensitiveData(data as Record<string, unknown>)
      : data;

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(context && { context }),
      ...(userId && { userId }),
      ...(maskedData && typeof maskedData === 'object' && maskedData !== null ? { data: maskedData as Record<string, unknown> } : {}),
      ...(stack && { stack }),
    };

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer for batch sending
    if (this.config.enableBuffer) {
      this.addToBuffer(entry);
    }
  }

  /**
   * Log to console with formatting
   * Uses appropriate console method based on log level
   */
  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const timestamp = entry.timestamp.toISOString();
    const userStr = entry.userId ? `[User: ${entry.userId.substring(0, 8)}...]` : '';

    const logMessage = `${timestamp} ${levelName} ${contextStr}${userStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * Add entry to buffer
   * Automatically flushes when buffer is full
   */
  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Flush buffer to backend
   * Sends all buffered logs to backend endpoint
   * Safe to call multiple times (no-op if buffer is empty)
   */
  async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    // Send to backend if endpoint configured
    if (this.config.backendEndpoint) {
      try {
        await fetch(this.config.backendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: logsToSend }),
        });
      } catch (error) {
        // Failed to send logs - restore to buffer
        console.error('Failed to send logs to backend:', error);
        this.buffer = [...logsToSend, ...this.buffer];
      }
    }
  }

  /**
   * Start batch timer
   * Automatically flushes buffer at regular intervals
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.batchInterval);
  }

  /**
   * Stop batch timer
   * Called during cleanup/destroy
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get user ID from storage
   * Extracts user ID from JWT access token in localStorage
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Decode JWT to get user ID
        const parts = token.split('.');
        if (parts.length >= 2 && parts[1]) {
          const payload = JSON.parse(atob(parts[1]));
          return payload.sub || payload.userId;
        }
      }
    } catch {
      // Failed to get user ID - silent fail
    }

    return undefined;
  }

  /**
   * Mask sensitive data in log entries
   * Recursively masks sensitive keys in objects
   *
   * Masked keys: password, token, accessToken, refreshToken, apiKey, secret, creditCard, ssn
   */
  private maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
      'apikey',
      'api_key',
      'authorization',
    ];

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

      if (isSensitive) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        masked[key] = this.maskSensitiveData(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Handle global errors
   * Automatically logs unhandled errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.error(
      `Global Error: ${event.message}`,
      'GlobalErrorHandler',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  }

  /**
   * Handle unhandled promise rejections
   * Automatically logs unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.error(
      `Unhandled Promise Rejection: ${event.reason}`,
      'UnhandledRejection',
      {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      }
    );
  }

  /**
   * Export logs as JSON
   * Returns all buffered logs as JSON string
   *
   * @example
   * const json = logger.exportLogs();
   * console.log(json);
   */
  exportLogs(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  /**
   * Export logs as CSV
   * Returns all buffered logs as CSV string
   * Headers: Timestamp, Level, Context, Message, User ID, Data
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Context', 'Message', 'User ID', 'Data'];
    const rows = this.buffer.map(entry => [
      entry.timestamp.toISOString(),
      LogLevel[entry.level],
      entry.context || '',
      entry.message,
      entry.userId || '',
      JSON.stringify(entry.data || {}),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * Download logs as file
   * Downloads buffered logs as JSON or CSV file
   *
   * @param format - 'json' or 'csv'
   *
   * @example
   * logger.downloadLogs('csv'); // Downloads logs with timestamp
   */
  downloadLogs(format: 'json' | 'csv' = 'json'): void {
    const content = format === 'json' ? this.exportLogs() : this.exportLogsAsCSV();
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get log statistics
   * Returns statistics about buffered logs
   *
   * @returns Statistics object with total, byLevel, oldestLog, newestLog
   *
   * @example
   * const stats = logger.getStats();
   * console.log('Total logs:', stats.total);
   * console.log('Errors:', stats.byLevel['ERROR']);
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldestLog: Date | null;
    newestLog: Date | null;
  } {
    const byLevel: Record<string, number> = {};

    for (const entry of this.buffer) {
      const levelName = LogLevel[entry.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    }

    return {
      total: this.buffer.length,
      byLevel,
      oldestLog: this.buffer[0]?.timestamp || null,
      newestLog: this.buffer[this.buffer.length - 1]?.timestamp || null,
    };
  }

  /**
   * Clear all logs
   * Empties the log buffer
   */
  clearLogs(): void {
    this.buffer = [];
  }

  /**
   * Cleanup on destroy
   * Stops batch timer, flushes buffer, removes event listeners
   * Call this before application shutdown
   */
  destroy(): void {
    this.stopBatchTimer();
    this.flushBuffer();

    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  /**
   * Legacy compatibility methods
   * Provides backward compatibility with old logger API
   */

  /**
   * @deprecated Use startPerformance/endPerformance instead
   */
  time(label: string): () => void {
    this.startPerformance(label);
    return () => this.endPerformance(label);
  }

  /**
   * @deprecated Use debug() with grouped context instead
   */
  group(label: string, collapsed = true): () => void {
    if (process.env.NODE_ENV !== 'development') {
      return () => {};
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
   * @deprecated Use debug() with grouped context instead
   */
  groupEnd(): void {
    if (process.env.NODE_ENV === 'development') {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new EnterpriseLogger();

// Export class for custom instances
export { EnterpriseLogger };

// Development helper - expose logger globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
}

/**
 * Convenience function for measuring async operations
 *
 * @example
 * const papers = await measureAsync('fetch-papers', () => fetchPapers(query));
 */
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  logger.startPerformance(label);
  try {
    const result = await operation();
    logger.endPerformance(label);
    return result;
  } catch (error) {
    logger.endPerformance(label);
    logger.error(`Operation failed: ${label}`, 'measureAsync', error instanceof Error ? error : { error });
    throw error;
  }
}
