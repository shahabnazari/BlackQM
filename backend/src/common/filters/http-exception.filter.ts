/**
 * Global HTTP Exception Filter - Phase 10.943
 *
 * Enterprise-grade exception handling for all HTTP requests.
 * Captures ALL exceptions, logs with full context, and returns
 * standardized error responses.
 *
 * Features:
 * - Catches all exceptions (HttpException, Error, unknown)
 * - Structured logging with correlation ID
 * - Standardized error response format
 * - Sentry integration for error tracking
 * - Sensitive data sanitization
 * - Performance metrics integration
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { getCorrelationId } from '../middleware/correlation-id.middleware';
// Phase 10.943: Removed unused ErrorCodes import
import { ErrorCode, mapErrorCodeToHttpStatus } from '../constants/error-codes';

interface StandardErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  correlationId: string;
  timestamp: string;
  path: string;
  method: string;
  details?: Record<string, unknown>;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get correlation ID from request or async context
    const correlationId = request.correlationId || getCorrelationId() || 'unknown';

    // Extract error information
    const errorInfo = this.extractErrorInfo(exception);

    // Build standardized response
    const errorResponse: StandardErrorResponse = {
      statusCode: errorInfo.statusCode,
      errorCode: errorInfo.errorCode,
      message: errorInfo.message,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Add details in development mode only
    if (process.env.NODE_ENV !== 'production' && errorInfo.details) {
      errorResponse.details = errorInfo.details;
    }

    // Log the error with full context
    this.logError(exception, errorResponse, request);

    // Report to Sentry (non-4xx errors only)
    if (errorInfo.statusCode >= 500) {
      this.reportToSentry(exception, errorResponse, request);
    }

    // Send response
    response.status(errorInfo.statusCode).json(errorResponse);
  }

  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    errorCode: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  } {
    // Handle HttpException (NestJS built-in)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      let message: string;
      let details: Record<string, unknown> | undefined;

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;

        // Extract validation errors
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
          details = { validationErrors: responseObj.message };
        }
      } else {
        message = exception.message;
      }

      return {
        statusCode: status,
        errorCode: this.mapStatusToErrorCode(status),
        message: this.sanitizeMessage(message),
        details,
        stack: exception.stack,
      };
    }

    // Handle standard Error
    if (exception instanceof Error) {
      // Check for specific error types
      const errorCode = this.detectErrorCode(exception);
      const statusCode = errorCode ? mapErrorCodeToHttpStatus(errorCode) : HttpStatus.INTERNAL_SERVER_ERROR;

      return {
        statusCode,
        errorCode: errorCode || 'SYS005',
        message: this.sanitizeMessage(exception.message),
        stack: exception.stack,
      };
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'SYS005',
      message: 'An unexpected error occurred',
    };
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'VAL001';
      case 401:
        return 'AUTH001';
      case 403:
        return 'AUTH004';
      case 404:
        return 'DB003';
      case 409:
        return 'DB004';
      case 422:
        return 'VAL003';
      case 429:
        return 'EXT002';
      case 500:
        return 'SYS001';
      case 502:
        return 'EXT001';
      case 503:
        return 'SYS002';
      case 504:
        return 'EXT005';
      default:
        return status >= 500 ? 'SYS001' : 'VAL001';
    }
  }

  private detectErrorCode(error: Error): ErrorCode | null {
    const message = error.message.toLowerCase();

    // Literature/Search errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'LIT002';
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return 'LIT003';
    }
    if (message.includes('source unavailable') || message.includes('service unavailable')) {
      return 'LIT006';
    }

    // Theme extraction errors
    if (message.includes('theme extraction')) {
      return 'THEME001';
    }
    if (message.includes('full-text') || message.includes('fulltext')) {
      return 'THEME002';
    }

    // Database errors
    if (message.includes('prisma') || message.includes('database')) {
      return 'DB002';
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return 'DB003';
    }
    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return 'DB004';
    }

    // External service errors
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return 'EXT001';
    }

    return null;
  }

  private sanitizeMessage(message: string): string {
    // Remove sensitive data from error messages
    const sensitivePatterns = [
      /api[_-]?key[=:]\s*['\"]?[\w-]+['\"]?/gi,
      /password[=:]\s*['\"]?[\w-]+['\"]?/gi,
      /token[=:]\s*['\"]?[\w.-]+['\"]?/gi,
      /bearer\s+[\w.-]+/gi,
      /authorization[=:]\s*['\"]?[\w.-]+['\"]?/gi,
    ];

    let sanitized = message;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  private logError(
    exception: unknown,
    errorResponse: StandardErrorResponse,
    request: Request,
  ): void {
    const logContext = {
      correlationId: errorResponse.correlationId,
      statusCode: errorResponse.statusCode,
      errorCode: errorResponse.errorCode,
      path: errorResponse.path,
      method: errorResponse.method,
      userId: (request as any).user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
    };

    const stack = exception instanceof Error ? exception.stack : undefined;

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${errorResponse.errorCode}] ${errorResponse.message}`,
        stack,
        JSON.stringify(logContext),
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(
        `[${errorResponse.errorCode}] ${errorResponse.message}`,
        JSON.stringify(logContext),
      );
    }
  }

  private reportToSentry(
    exception: unknown,
    errorResponse: StandardErrorResponse,
    request: Request,
  ): void {
    Sentry.withScope((scope) => {
      scope.setTag('correlationId', errorResponse.correlationId);
      scope.setTag('errorCode', errorResponse.errorCode);
      scope.setTag('path', errorResponse.path);
      scope.setTag('method', errorResponse.method);

      scope.setExtra('statusCode', errorResponse.statusCode);
      scope.setExtra('query', request.query);

      // Add user context if available
      const userId = (request as any).user?.id;
      if (userId) {
        scope.setUser({ id: userId });
      }

      if (exception instanceof Error) {
        Sentry.captureException(exception);
      } else {
        Sentry.captureMessage(errorResponse.message, 'error');
      }
    });
  }
}
