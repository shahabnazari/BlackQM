/**
 * Request Cancellation Interceptor
 * Phase 10.112 Week 2: Netflix-Grade Request Lifecycle Management
 *
 * Features:
 * - Detects client disconnection and triggers cancellation
 * - Integrates with RequestContextService
 * - Metrics tracking for cancelled requests
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Scope,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestContextService, RequestCancelledException } from '../services/request-context.service';

/**
 * Extended Request interface with AbortSignal for downstream propagation
 */
export interface RequestWithAbortSignal extends Request {
  abortSignal?: AbortSignal;
}

/**
 * Metrics for request cancellation tracking
 */
export interface CancellationMetrics {
  totalRequests: number;
  cancelledRequests: number;
  clientDisconnects: number;
  timeouts: number;
  cancellationRate: number;
}

/**
 * Static metrics storage (shared across request-scoped instances)
 * Using static to maintain aggregated metrics while interceptor is request-scoped
 */
class InterceptorMetrics {
  static totalRequests = 0;
  static cancelledRequests = 0;
  static clientDisconnects = 0;
  static timeouts = 0;

  static reset(): void {
    this.totalRequests = 0;
    this.cancelledRequests = 0;
    this.clientDisconnects = 0;
    this.timeouts = 0;
  }
}

@Injectable({ scope: Scope.REQUEST })
export class RequestCancellationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestCancellationInterceptor.name);

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    InterceptorMetrics.totalRequests++;

    const correlationId = (request.headers['x-correlation-id'] as string) ?? undefined;
    const timeoutHeader = request.headers['x-request-timeout'];
    const timeoutMs = timeoutHeader ? parseInt(timeoutHeader as string, 10) : undefined;

    this.requestContext.initialize({
      requestId: correlationId,
      timeoutMs,
      onCancel: (reason) => {
        InterceptorMetrics.cancelledRequests++;
        if (reason === 'client_disconnect') {
          InterceptorMetrics.clientDisconnects++;
        } else if (reason === 'timeout') {
          InterceptorMetrics.timeouts++;
        }
      },
    });

    // Attach AbortSignal to request for downstream propagation
    (request as RequestWithAbortSignal).abortSignal = this.requestContext.signal;

    const closeHandler = () => {
      this.logger.warn(
        `🔌 [RequestCancellation] Client disconnect detected! ` +
        `writableEnded=${response.writableEnded}, url=${request.url}`
      );
      if (!response.writableEnded) {
        this.requestContext.onClientDisconnect();
        this.logger.warn(`🔌 [RequestCancellation] Abort signal triggered for ${request.url}`);
      }
    };

    request.on('close', closeHandler);

    return next.handle().pipe(
      tap(() => {
        request.removeListener('close', closeHandler);
      }),
      catchError((error) => {
        request.removeListener('close', closeHandler);

        if (error instanceof RequestCancelledException) {
          this.logger.warn(
            `[${error.requestId}] Request cancelled: ${error.reason}`
          );
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.requestContext.destroy();
      }),
    );
  }

  /**
   * Get cancellation metrics (static, shared across all instances)
   */
  static getMetrics(): CancellationMetrics {
    return {
      totalRequests: InterceptorMetrics.totalRequests,
      cancelledRequests: InterceptorMetrics.cancelledRequests,
      clientDisconnects: InterceptorMetrics.clientDisconnects,
      timeouts: InterceptorMetrics.timeouts,
      cancellationRate: InterceptorMetrics.totalRequests > 0
        ? Math.round((InterceptorMetrics.cancelledRequests / InterceptorMetrics.totalRequests) * 100)
        : 0,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  static resetMetrics(): void {
    InterceptorMetrics.reset();
  }
}
