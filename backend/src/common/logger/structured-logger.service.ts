/**
 * PHASE 10.102 PHASE 6: STRUCTURED LOGGING WITH CORRELATION IDS
 * Netflix-Grade Logging Service
 *
 * Features:
 * - Correlation IDs for distributed tracing
 * - Structured JSON logging
 * - Log levels with proper hierarchy
 * - Context enrichment
 * - Performance logging
 * - Error tracking integration (Sentry-ready)
 *
 * @see https://www.loggly.com/ultimate-guide/node-logging-basics/
 */

import { Injectable, Scope, Optional, Inject } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

/**
 * Log context interface
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

/**
 * Log metadata interface
 */
export interface LogMetadata {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  service: string;
  environment: string;
  hostname: string;
  pid: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: any;
}

/**
 * Performance timing interface
 */
interface PerformanceTiming {
  start: number;
  operation: string;
  context?: LogContext;
}

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService {
  private readonly logger: winston.Logger;
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly hostname: string;
  private readonly timings: Map<string, PerformanceTiming>;

  // AsyncLocalStorage for correlation ID propagation
  private static readonly storage = new AsyncLocalStorage<LogContext>();

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject('LOGGER_CONTEXT') private readonly context?: string,
  ) {
    this.serviceName = this.configService.get<string>('APP_NAME', 'blackqmethod');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
    this.hostname = require('os').hostname();
    this.timings = new Map();

    // Winston logger configuration
    this.logger = winston.createLogger({
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        hostname: this.hostname,
        pid: process.pid,
      },
      transports: [
        // Console transport (development)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const correlationId = this.getCorrelationId();
              const correlationIdStr = correlationId ? `[${correlationId}] ` : '';
              const contextStr = this.context ? `[${this.context}] ` : '';
              const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} ${level} ${correlationIdStr}${contextStr}${message}${metaStr}`;
            }),
          ),
        }),

        // File transport (production) - separate files by level
        ...(this.environment === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 10485760, // 10MB
                maxFiles: 5,
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                maxsize: 10485760, // 10MB
                maxFiles: 10,
              }),
            ]
          : []),
      ],
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
    });
  }

  // ========== CORRELATION ID MANAGEMENT ==========

  /**
   * Run function with correlation ID context
   */
  static runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
    return StructuredLoggerService.storage.run({ correlationId }, fn);
  }

  /**
   * Get current correlation ID
   */
  private getCorrelationId(): string | undefined {
    return StructuredLoggerService.storage.getStore()?.correlationId;
  }

  /**
   * Get current log context
   */
  private getContext(): LogContext {
    return StructuredLoggerService.storage.getStore() || {};
  }

  /**
   * Set context for current execution
   */
  static setContext(context: Partial<LogContext>): void {
    const currentContext = StructuredLoggerService.storage.getStore() || {};
    const newContext = { ...currentContext, ...context };
    (StructuredLoggerService.storage as any).enterWith(newContext);
  }

  // ========== LOGGING METHODS ==========

  /**
   * Debug level logging
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Info level logging
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log level logging (alias for info)
   */
  log(level: string, message: string, metadata?: Record<string, any>): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.logger.log(level, message, enrichedMetadata);
  }

  /**
   * Warning level logging
   */
  warn(message: string, metadata?: Record<string, any>): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.logger.warn(message, enrichedMetadata);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const enrichedMetadata = this.enrichMetadata(metadata);

    if (error) {
      enrichedMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    this.logger.error(message, enrichedMetadata);

    // Send to error tracking service (Sentry, etc.)
    if (this.environment === 'production' && error) {
      this.sendToErrorTracking(message, error, enrichedMetadata);
    }
  }

  /**
   * Critical level logging (logs to error + sends alerts)
   */
  critical(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.error(`[CRITICAL] ${message}`, error, {
      ...metadata,
      severity: 'critical',
      alert: true,
    });

    // Trigger alerts for critical errors
    this.triggerAlert(message, error, metadata);
  }

  /**
   * Verbose level logging
   */
  verbose(message: string, metadata?: Record<string, any>): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.logger.verbose(message, enrichedMetadata);
  }

  // ========== PERFORMANCE LOGGING ==========

  /**
   * Start timing an operation
   */
  startTiming(operation: string, context?: LogContext): string {
    const timingId = `${operation}_${Date.now()}_${Math.random()}`;
    this.timings.set(timingId, {
      start: Date.now(),
      operation,
      context: { ...this.getContext(), ...context },
    });
    return timingId;
  }

  /**
   * End timing and log duration
   */
  endTiming(timingId: string, metadata?: Record<string, any>): number {
    const timing = this.timings.get(timingId);
    if (!timing) {
      this.warn(`Timing not found: ${timingId}`);
      return 0;
    }

    const duration = Date.now() - timing.start;
    this.timings.delete(timingId);

    this.info(`⏱️ ${timing.operation} completed`, {
      ...metadata,
      duration,
      durationMs: duration,
      operation: timing.operation,
      context: timing.context,
    });

    return duration;
  }

  /**
   * Log operation with automatic timing
   */
  async logOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const timingId = this.startTiming(operation);
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.info(`✅ ${operation} succeeded`, {
        ...metadata,
        duration,
        success: true,
      });

      this.timings.delete(timingId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(
        `❌ ${operation} failed`,
        error as Error,
        {
          ...metadata,
          duration,
          success: false,
        },
      );

      this.timings.delete(timingId);
      throw error;
    }
  }

  // ========== STRUCTURED EVENT LOGGING ==========

  /**
   * Log HTTP request
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.log(level, `HTTP ${method} ${url} ${statusCode}`, {
      ...metadata,
      http: {
        method,
        url,
        statusCode,
        duration,
      },
    });
  }

  /**
   * Log database query
   */
  logDbQuery(
    operation: string,
    table: string,
    duration: number,
    rowsAffected?: number,
    error?: Error,
  ): void {
    if (error) {
      this.error(`DB Query failed: ${operation} on ${table}`, error, {
        database: {
          operation,
          table,
          duration,
          rowsAffected,
        },
      });
    } else {
      this.debug(`DB Query: ${operation} on ${table}`, {
        database: {
          operation,
          table,
          duration,
          rowsAffected,
        },
      });
    }
  }

  /**
   * Log API call
   */
  logApiCall(
    provider: string,
    endpoint: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>,
  ): void {
    const level = success ? 'info' : 'warn';

    this.log(level, `API Call: ${provider} ${endpoint}`, {
      ...metadata,
      api: {
        provider,
        endpoint,
        duration,
        success,
      },
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    duration?: number,
  ): void {
    this.debug(`Cache ${operation}: ${key}`, {
      cache: {
        operation,
        key,
        duration,
      },
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(
    eventType: string,
    eventData: Record<string, any>,
  ): void {
    this.info(`📊 Business Event: ${eventType}`, {
      business: {
        eventType,
        ...eventData,
      },
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>,
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';

    this.log(level, `🔒 Security Event: ${eventType}`, {
      ...metadata,
      security: {
        eventType,
        severity,
      },
    });
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Enrich metadata with context
   */
  private enrichMetadata(metadata?: Record<string, any>): Record<string, any> {
    const context = this.getContext();

    return {
      ...metadata,
      context,
      ...(this.context && { loggerContext: this.context }),
    };
  }

  /**
   * Send error to tracking service
   */
  private sendToErrorTracking(
    _message: string, // Reserved for future use in error tracking context
    error: Error,
    metadata: Record<string, any>,
  ): void {
    // Integration with Sentry or similar
    if (typeof (global as any).Sentry !== 'undefined') {
      (global as any).Sentry.captureException(error, {
        tags: {
          service: this.serviceName,
          environment: this.environment,
        },
        extra: metadata,
      });
    }
  }

  /**
   * Trigger alert for critical errors
   */
  private triggerAlert(
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
  ): void {
    // Integration with alerting system (PagerDuty, Slack, etc.)
    // For now, just log to console
    console.error('🚨 CRITICAL ALERT:', message, error, metadata);
  }

  /**
   * Create child logger with additional context
   */
  child(context: string): StructuredLoggerService {
    return new StructuredLoggerService(this.configService, context);
  }
}

/**
 * Correlation ID middleware helper
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
