/**
 * WebSocket Exception Filter - Phase 10.943
 *
 * Enterprise-grade exception handling for WebSocket connections.
 * Captures exceptions in WebSocket handlers and emits standardized
 * error events to clients.
 *
 * Features:
 * - Catches all WebSocket exceptions
 * - Emits standardized error events to client
 * - Structured logging with correlation ID
 * - Sentry integration for error tracking
 * - Graceful error recovery
 */

import {
  Catch,
  ArgumentsHost,
  Logger,
  WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';
// Phase 10.943: Removed unused mapErrorCodeToHttpStatus import (only needed for HTTP, not WS)
import { ErrorCode, ErrorCodes } from '../constants/error-codes';

interface WsErrorResponse {
  event: 'error';
  errorCode: string;
  message: string;
  correlationId: string;
  timestamp: string;
  recoverable: boolean;
}

@Catch()
export class GlobalWsExceptionFilter implements WsExceptionFilter {
  private readonly logger = new Logger('WsExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    // Get or generate correlation ID
    const correlationId =
      data?.correlationId ||
      client.handshake?.query?.correlationId as string ||
      randomUUID();

    // Extract error information
    const errorInfo = this.extractErrorInfo(exception);

    // Build error response
    const errorResponse: WsErrorResponse = {
      event: 'error',
      errorCode: errorInfo.errorCode,
      message: errorInfo.message,
      correlationId,
      timestamp: new Date().toISOString(),
      recoverable: errorInfo.recoverable,
    };

    // Log the error
    this.logError(exception, errorResponse, client, data);

    // Report to Sentry (non-recoverable errors only)
    if (!errorInfo.recoverable) {
      this.reportToSentry(exception, errorResponse, client);
    }

    // Emit error to client
    client.emit('error', errorResponse);

    // Also emit to specific error event if context available
    const eventName = data?.event || data?.type;
    if (eventName) {
      client.emit(`${eventName}:error`, errorResponse);
    }
  }

  private extractErrorInfo(exception: unknown): {
    errorCode: string;
    message: string;
    recoverable: boolean;
    stack?: string;
  } {
    // Handle WsException (NestJS WebSocket exception)
    if (exception instanceof WsException) {
      const error = exception.getError();

      if (typeof error === 'string') {
        return {
          errorCode: 'WS002',
          message: this.sanitizeMessage(error),
          recoverable: true,
        };
      }

      if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        return {
          errorCode: (errorObj.code as string) || 'WS002',
          message: this.sanitizeMessage((errorObj.message as string) || 'WebSocket error'),
          recoverable: (errorObj.recoverable as boolean) ?? true,
        };
      }
    }

    // Handle standard Error
    if (exception instanceof Error) {
      const errorCode = this.detectErrorCode(exception);

      return {
        errorCode: errorCode || 'WS002',
        message: this.sanitizeMessage(exception.message),
        recoverable: this.isRecoverable(errorCode),
        stack: exception.stack,
      };
    }

    // Handle unknown errors
    return {
      errorCode: 'SYS005',
      message: 'An unexpected WebSocket error occurred',
      recoverable: false,
    };
  }

  private detectErrorCode(error: Error): ErrorCode | null {
    const message = error.message.toLowerCase();

    // WebSocket specific errors
    if (message.includes('connection') || message.includes('disconnect')) {
      return 'WS001';
    }
    if (message.includes('timeout')) {
      return 'WS005';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'WS004';
    }

    // Theme extraction errors (common in WebSocket context)
    if (message.includes('theme extraction')) {
      return 'THEME001';
    }
    if (message.includes('full-text') || message.includes('fulltext')) {
      return 'THEME002';
    }
    if (message.includes('ai service') || message.includes('openai') || message.includes('anthropic')) {
      return 'THEME003';
    }

    // Search errors
    if (message.includes('search failed') || message.includes('source')) {
      return 'LIT001';
    }

    return null;
  }

  private isRecoverable(errorCode: string | null): boolean {
    if (!errorCode) return true;

    // Non-recoverable errors
    const nonRecoverable = [
      'WS001', // Connection failed
      'WS004', // Auth failed
      'AUTH001',
      'AUTH004',
      'SYS001',
      'SYS005',
    ];

    return !nonRecoverable.includes(errorCode);
  }

  private sanitizeMessage(message: string): string {
    // Remove sensitive data from error messages
    const sensitivePatterns = [
      /api[_-]?key[=:]\s*['\"]?[\w-]+['\"]?/gi,
      /password[=:]\s*['\"]?[\w-]+['\"]?/gi,
      /token[=:]\s*['\"]?[\w.-]+['\"]?/gi,
      /bearer\s+[\w.-]+/gi,
    ];

    let sanitized = message;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  private logError(
    exception: unknown,
    errorResponse: WsErrorResponse,
    client: Socket,
    data: unknown,
  ): void {
    const logContext = {
      correlationId: errorResponse.correlationId,
      errorCode: errorResponse.errorCode,
      socketId: client.id,
      userId: (client as any).user?.id,
      rooms: Array.from(client.rooms || []),
      eventData: this.sanitizeData(data),
    };

    const stack = exception instanceof Error ? exception.stack : undefined;

    if (!errorResponse.recoverable) {
      this.logger.error(
        `[WS][${errorResponse.errorCode}] ${errorResponse.message}`,
        stack,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.warn(
        `[WS][${errorResponse.errorCode}] ${errorResponse.message}`,
        JSON.stringify(logContext),
      );
    }
  }

  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...(data as Record<string, unknown>) };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private reportToSentry(
    exception: unknown,
    errorResponse: WsErrorResponse,
    client: Socket,
  ): void {
    Sentry.withScope((scope) => {
      scope.setTag('type', 'websocket');
      scope.setTag('correlationId', errorResponse.correlationId);
      scope.setTag('errorCode', errorResponse.errorCode);
      scope.setTag('socketId', client.id);

      const userId = (client as any).user?.id;
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

/**
 * Helper function to create standardized WebSocket errors
 */
export function createWsError(
  code: ErrorCode,
  message?: string,
  recoverable = true,
): WsException {
  const errorDetails = ErrorCodes[code];

  return new WsException({
    code: errorDetails.code,
    message: message || errorDetails.message,
    recoverable,
  });
}

/**
 * Helper to emit error to client from service layer
 */
export function emitWsError(
  client: Socket,
  code: ErrorCode,
  correlationId: string,
  additionalMessage?: string,
): void {
  const errorDetails = ErrorCodes[code];

  client.emit('error', {
    event: 'error',
    errorCode: errorDetails.code,
    message: additionalMessage
      ? `${errorDetails.message}: ${additionalMessage}`
      : errorDetails.message,
    correlationId,
    timestamp: new Date().toISOString(),
    recoverable: !['WS001', 'WS004', 'AUTH001', 'SYS001'].includes(code),
  });
}
