/**
 * PHASE 10.102 PHASE 6: HTTP METRICS INTERCEPTOR
 * Automatic metrics collection for all HTTP requests
 *
 * Features:
 * - Automatic request/response timing
 * - Status code tracking
 * - Error classification
 * - Integrates with EnhancedMetricsService
 * - Minimal performance overhead
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { EnhancedMetricsService } from '../monitoring/enhanced-metrics.service';
import { StructuredLoggerService } from '../logger/structured-logger.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    private readonly metrics: EnhancedMetricsService,
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only intercept HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startTime = Date.now();
    const method = request.method;
    const route = this.extractRoute(request);
    const url = request.url;

    return next.handle().pipe(
      tap(() => {
        // Success path - record metrics
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        const statusCode = response.statusCode;

        // Record HTTP metrics
        this.metrics.recordHttpRequest(method, route, statusCode, duration);

        // Structured logging
        this.structuredLogger.logHttpRequest(
          method,
          url,
          statusCode,
          duration * 1000, // Log in milliseconds
          {
            route,
            correlationId: request.correlationId,
          },
        );

        // Log slow requests
        if (duration > 2.0) {
          // 2 second threshold
          this.logger.warn(
            `Slow request detected: ${method} ${route} - ${duration.toFixed(2)}s`,
            {
              method,
              route,
              url,
              duration,
              statusCode,
              correlationId: request.correlationId,
            },
          );
        }
      }),
      catchError((error) => {
        // Error path - record error metrics
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = error.status || error.statusCode || 500;

        // Record HTTP metrics (with error status)
        this.metrics.recordHttpRequest(method, route, statusCode, duration);

        // Structured error logging
        this.structuredLogger.logHttpRequest(
          method,
          url,
          statusCode,
          duration * 1000,
          {
            route,
            correlationId: request.correlationId,
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack,
            },
          },
        );

        // Record validation errors separately
        if (statusCode >= 400 && statusCode < 500) {
          const errorType = this.classifyClientError(statusCode);
          this.metrics.recordValidationError(route, errorType);
        }

        // Re-throw the error to continue error handling chain
        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract clean route path from request
   * Removes query parameters and normalizes path
   */
  private extractRoute(request: Request): string {
    // Try to get route from NestJS route info first
    if (request.route?.path) {
      return request.route.path;
    }

    // Fallback: clean up URL path
    const path = request.url?.split('?')[0] ?? '/'; // Remove query params, default to '/'

    // Normalize path: replace IDs with placeholder
    const normalizedPath = path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
      .replace(/\/\d+/g, '/:id'); // Numeric IDs

    return normalizedPath || '/';
  }

  /**
   * Classify client errors for better metrics
   */
  private classifyClientError(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 422:
        return 'validation_failed';
      case 429:
        return 'rate_limited';
      default:
        return 'client_error';
    }
  }
}
