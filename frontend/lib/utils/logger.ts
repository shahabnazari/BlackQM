/**
 * Enterprise Logger Utility - Phase 10.1 Day 9, Enhanced Phase 10.92 Day 4
 *
 * Production-grade centralized logging system with:
 * - 5 log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Component context tracking
 * - User ID tracking (auto-extracted from JWT)
 * - Performance timing (startPerformance/endPerformance)
 * - Sensitive data masking (passwords, tokens, API keys, SSNs)
 * - Log buffering and batching (configurable batch size and interval)
 * - Export functionality (download as JSON or CSV)
 * - Backend integration (optional, disabled by default)
 * - Graceful fallback when backend endpoint unavailable (Phase 10.92 Day 4)
 * - One-time warning for missing endpoint (Phase 10.92 Day 4)
 * - Runtime enable/disable backend logging (Phase 10.92 Day 4)
 * - Global error handlers (catches unhandled errors and promise rejections)
 * - User action tracking for analytics
 * - Statistics dashboard (getStats() method)
 * - Development helper (window.logger in dev mode)
 * - Cleanup on destroy (stops timers, flushes buffer)
 *
 * @version 2.1.0
 * @date November 16, 2025 (Phase 10.92 Day 4)
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
  correlationId?: string; // Phase 10.943: Request correlation ID
  data?: Record<string, unknown>;
  stack?: string;
  performance?: {
    duration: number;
    operation: string;
  };
  url?: string; // Phase 10.943: Current page URL
  userAgent?: string; // Phase 10.943: Browser user agent
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableBuffer: boolean;
  bufferSize: number;
  batchInterval: number;
  maskSensitiveData: boolean;
  backendEndpoint?: string;
  enableBackendLogging: boolean; // ✅ Phase 10.92 Day 4: Enable/disable backend logging
  correlationId?: string; // ✅ Phase 10.943: Current request correlation ID
}

class EnterpriseLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private performanceMarks: Map<string, number> = new Map();
  private backendAvailable: boolean | null = null; // ✅ Phase 10.92 Day 4: Track endpoint availability
  private backendWarningShown = false; // ✅ Phase 10.92 Day 4: Show warning only once
  private currentCorrelationId: string | null = null; // ✅ Phase 10.943: Current correlation ID

  constructor(config?: Partial<LoggerConfig>) {
    // Determine backend URL based on environment
    const backendUrl = typeof window !== 'undefined'
      ? (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000')
      : '';

    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableBuffer: true,
      bufferSize: 100,
      batchInterval: 5000,
      maskSensitiveData: true,
      backendEndpoint: `${backendUrl}/api/logs`, // Phase 10.943: Full backend URL
      enableBackendLogging: true, // ✅ Phase 10.943: Enabled by default (endpoint now implemented)
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

    // Get browser context (Phase 10.943)
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(context && { context }),
      ...(userId && { userId }),
      ...(this.currentCorrelationId && { correlationId: this.currentCorrelationId }),
      ...(maskedData && typeof maskedData === 'object' && maskedData !== null ? { data: maskedData as Record<string, unknown> } : {}),
      ...(stack && { stack }),
      ...(url && { url }),
      ...(userAgent && { userAgent }),
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
   *
   * ✅ Phase 10.92 Day 4: Enhanced with graceful fallback and endpoint availability check
   */
  async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    // ✅ Phase 10.92 Day 4: Skip backend logging if disabled or endpoint unavailable
    if (!this.config.enableBackendLogging) {
      // Keep logs in buffer for local export/debugging
      return;
    }

    // ✅ Phase 10.92 Day 4: Skip if we've already determined endpoint is unavailable
    if (this.backendAvailable === false) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    // Send to backend if endpoint configured
    if (this.config.backendEndpoint) {
      try {
        const response = await fetch(this.config.backendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: logsToSend }),
        });

        // ✅ Phase 10.92 Day 4: Check if endpoint exists
        if (response.status === 404) {
          this.backendAvailable = false;

          // Show one-time warning in development
          if (process.env.NODE_ENV === 'development' && !this.backendWarningShown) {
            console.warn(
              '⚠️  [Logger] Backend logging endpoint not found. ' +
              'Logs will be buffered locally only. ' +
              'To enable backend logging, implement POST /api/logs or set enableBackendLogging: false'
            );
            this.backendWarningShown = true;
          }

          // Restore logs to buffer for local access
          this.buffer = [...logsToSend, ...this.buffer];
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ✅ Mark endpoint as available
        this.backendAvailable = true;

      } catch (error: unknown) {
        // ✅ Phase 10.92 Day 4: Graceful error handling - don't spam console

        // Check if it's a network error (endpoint doesn't exist)
        const isNetworkError = error instanceof TypeError &&
          (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'));

        if (isNetworkError) {
          this.backendAvailable = false;

          // Show one-time warning in development
          if (process.env.NODE_ENV === 'development' && !this.backendWarningShown) {
            console.warn(
              '⚠️  [Logger] Backend logging endpoint unavailable. ' +
              'Logs will be buffered locally only.'
            );
            this.backendWarningShown = true;
          }
        } else {
          // Other errors (temporary network issues, etc.) - log in development only
          if (process.env.NODE_ENV === 'development') {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[Logger] Failed to send logs to backend: ${errorMessage}`);
          }
        }

        // Restore logs to buffer
        this.buffer = [...logsToSend, ...this.buffer];

        // ✅ Prevent buffer from growing indefinitely
        if (this.buffer.length > this.config.bufferSize * 2) {
          // Keep only the most recent logs
          this.buffer = this.buffer.slice(-this.config.bufferSize);
        }
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
   * Enable backend logging
   * Call this method when backend logging endpoint is implemented
   *
   * ✅ Phase 10.92 Day 4: Allow runtime enabling of backend logging
   *
   * @example
   * // When /api/logs endpoint is implemented:
   * logger.enableBackendLogging();
   */
  enableBackendLogging(): void {
    this.config.enableBackendLogging = true;
    this.backendAvailable = null; // Reset availability check
    this.backendWarningShown = false; // Reset warning flag
  }

  /**
   * Disable backend logging
   * Stops sending logs to backend, keeps them in local buffer only
   *
   * ✅ Phase 10.92 Day 4: Allow runtime disabling of backend logging
   */
  disableBackendLogging(): void {
    this.config.enableBackendLogging = false;
  }

  /**
   * Check if backend logging is enabled
   *
   * ✅ Phase 10.92 Day 4: Public getter for backend logging status
   */
  isBackendLoggingEnabled(): boolean {
    return this.config.enableBackendLogging;
  }

  /**
   * Reset backend availability check
   * Forces logger to retry backend endpoint on next flush
   *
   * ✅ AUDIT FIX: Public method for debugging/troubleshooting
   *
   * @example
   * // If backend was marked unavailable but is now working:
   * logger.resetBackendAvailability();
   */
  resetBackendAvailability(): void {
    this.backendAvailable = null;
    this.backendWarningShown = false;
  }

  /**
   * Set correlation ID for current request context
   * Call this when receiving responses with X-Correlation-ID header
   *
   * ✅ Phase 10.943: Correlation ID tracking for request tracing
   *
   * @example
   * // After API call:
   * const correlationId = response.headers.get('X-Correlation-ID');
   * if (correlationId) logger.setCorrelationId(correlationId);
   */
  setCorrelationId(correlationId: string | null): void {
    this.currentCorrelationId = correlationId;
  }

  /**
   * Get current correlation ID
   *
   * ✅ Phase 10.943: Get correlation ID for propagation
   */
  getCorrelationId(): string | null {
    return this.currentCorrelationId;
  }

  /**
   * Clear correlation ID (e.g., on navigation)
   *
   * ✅ Phase 10.943: Clear correlation context
   */
  clearCorrelationId(): void {
    this.currentCorrelationId = null;
  }

  /**
   * Get backend availability status
   * Returns null if not yet checked, true if available, false if unavailable
   *
   * ✅ AUDIT FIX: Public getter for debugging/monitoring
   */
  getBackendAvailability(): boolean | null {
    return this.backendAvailable;
  }

  /**
   * Check if backend warning has been shown
   *
   * ✅ AUDIT FIX: Public getter for debugging
   */
  hasShownBackendWarning(): boolean {
    return this.backendWarningShown;
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
