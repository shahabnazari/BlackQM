/**
 * Correlation ID Middleware - Phase 10.943
 *
 * Generates and propagates unique correlation IDs for request tracing.
 * Every request gets a UUID that flows through all service calls,
 * enabling end-to-end request tracking and debugging.
 *
 * Features:
 * - Generates UUID v4 for new requests
 * - Preserves existing correlation ID from X-Correlation-ID header
 * - Attaches correlation ID to request object
 * - Adds correlation ID to response headers
 * - Integrates with AsyncLocalStorage for async context propagation
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

// Extend Express Request type to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

// AsyncLocalStorage for correlation ID propagation across async boundaries
export const correlationStorage = new AsyncLocalStorage<{
  correlationId: string;
  userId?: string;
  startTime: number;
}>();

/**
 * Get current correlation ID from async context
 * Use this in services to get the correlation ID without passing it through
 */
export function getCorrelationId(): string | undefined {
  const store = correlationStorage.getStore();
  return store?.correlationId;
}

/**
 * Get current request context from async storage
 */
export function getRequestContext(): {
  correlationId: string;
  userId?: string;
  startTime: number;
} | undefined {
  return correlationStorage.getStore();
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly CORRELATION_ID_HEADER = 'x-correlation-id';

  use(req: Request, res: Response, next: NextFunction): void {
    // Check if correlation ID was passed in headers (for distributed tracing)
    let correlationId = req.headers[this.CORRELATION_ID_HEADER] as string;

    // Generate new UUID if not provided
    if (!correlationId) {
      correlationId = randomUUID();
    }

    // Attach to request object for easy access
    req.correlationId = correlationId;

    // Add to response headers for client-side tracking
    res.setHeader('X-Correlation-ID', correlationId);

    // Get user ID if authenticated
    const userId = (req as any).user?.id || (req as any).user?.sub;

    // Run the rest of the request in AsyncLocalStorage context
    correlationStorage.run(
      {
        correlationId,
        userId,
        startTime: Date.now(),
      },
      () => {
        next();
      },
    );
  }
}

/**
 * Helper to create a child correlation context (for background jobs, WebSockets)
 */
export function runWithCorrelation<T>(
  correlationId: string,
  userId: string | undefined,
  fn: () => T,
): T {
  return correlationStorage.run(
    {
      correlationId,
      userId,
      startTime: Date.now(),
    },
    fn,
  );
}

/**
 * Helper for async operations that need correlation context
 */
export async function runAsyncWithCorrelation<T>(
  correlationId: string,
  userId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return correlationStorage.run(
    {
      correlationId,
      userId,
      startTime: Date.now(),
    },
    fn,
  );
}
