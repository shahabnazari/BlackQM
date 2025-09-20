import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Request } from 'express';

interface LogContext {
  userId?: string;
  requestId?: string;
  studyId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
  metadata?: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger!: winston.Logger;
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    this.initializeLogger();
  }

  private initializeLogger() {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    
    // Custom format for structured logging
    const jsonFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const contextStr = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} ${level} ${contextStr}: ${message} ${metaStr}`;
      })
    );

    // Transports configuration
    const transports: winston.transport[] = [];

    // Console transport (always active in development)
    if (this.isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
        })
      );
    }

    // File transport for errors
    transports.push(
      new (winston.transports as any).DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })
    );

    // File transport for all logs
    transports.push(
      new (winston.transports as any).DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })
    );

    // File transport for security logs
    transports.push(
      new (winston.transports as any).DailyRotateFile({
        filename: 'logs/security-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      })
    );

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
      exitOnError: false,
    });

    // Add production console if needed
    if (!this.isDevelopment) {
      this.logger.add(
        new winston.transports.Console({
          format: jsonFormat,
        })
      );
    }
  }

  // Standard NestJS Logger interface methods
  log(message: any, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging

  /**
   * Log HTTP request
   */
  logRequest(req: Request, context?: LogContext): void {
    const { method, url, headers, body, params, query } = req;
    const userId = (req as any).user?.id;
    
    this.logger.info('HTTP Request', {
      type: 'http_request',
      method,
      url,
      userId,
      ip: req.ip,
      userAgent: headers['user-agent'],
      params,
      query,
      // Don't log sensitive data
      body: this.sanitizeBody(body),
      ...context,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: Request, statusCode: number, responseTime: number, context?: LogContext): void {
    const { method, url } = req;
    const userId = (req as any).user?.id;
    
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.logger.log(level, 'HTTP Response', {
      type: 'http_response',
      method,
      url,
      userId,
      statusCode,
      responseTime,
      ...context,
    });
  }

  /**
   * Log security events
   */
  logSecurity(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    
    this.logger.log(level, `Security Event: ${event}`, {
      type: 'security',
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    this.logger.info(`Performance: ${operation}`, {
      type: 'performance',
      operation,
      duration,
      metadata,
    });
  }

  /**
   * Log database queries (for debugging)
   */
  logQuery(query: string, params: any[], duration: number): void {
    if (this.isDevelopment) {
      this.logger.debug('Database Query', {
        type: 'database',
        query: query.substring(0, 1000), // Truncate long queries
        params: params?.length > 10 ? `${params.length} params` : params,
        duration,
      });
    }
  }

  /**
   * Log business events
   */
  logEvent(event: string, data: any, userId?: string): void {
    this.logger.info(`Business Event: ${event}`, {
      type: 'business_event',
      event,
      userId,
      data,
    });
  }

  /**
   * Log audit trail
   */
  logAudit(action: string, resource: string, userId: string, details: any): void {
    this.logger.info('Audit Trail', {
      type: 'audit',
      action,
      resource,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log errors with context
   */
  logError(error: Error, context: LogContext): void {
    this.logger.error(error.message, {
      type: 'error',
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  /**
   * Log external service calls
   */
  logExternalCall(service: string, method: string, success: boolean, duration: number, details?: any): void {
    const level = success ? 'info' : 'warn';
    
    this.logger.log(level, `External Service Call: ${service}`, {
      type: 'external_service',
      service,
      method,
      success,
      duration,
      details,
    });
  }

  /**
   * Log cache operations
   */
  logCache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, metadata?: any): void {
    this.logger.debug(`Cache ${operation}: ${key}`, {
      type: 'cache',
      operation,
      key,
      metadata,
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocket(event: string, userId: string, data?: any): void {
    this.logger.info(`WebSocket Event: ${event}`, {
      type: 'websocket',
      event,
      userId,
      data,
    });
  }

  /**
   * Create a child logger with persistent context
   */
  createChildLogger(context: LogContext): LoggerService {
    const child = Object.create(this);
    child.logger = this.logger.child(context);
    return child;
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Get metrics for monitoring
   */
  async getMetrics(): Promise<any> {
    // This could integrate with Prometheus, DataDog, etc.
    return {
      logLevel: this.logger.level,
      transports: this.logger.transports.length,
      // Add more metrics as needed
    };
  }
}