/**
 * Request Context Service
 * Phase 10.112 Week 2: Netflix-Grade Request Cancellation
 *
 * Features:
 * - Request-scoped AbortController management
 * - Cascading cancellation from client disconnect
 * - Timeout-based auto-cancellation
 * - Metrics tracking for cancelled requests
 */

import { Injectable, Scope, Logger } from '@nestjs/common';

/**
 * Cancellation reason types
 */
export type CancellationReason =
  | 'client_disconnect'
  | 'timeout'
  | 'manual'
  | 'early_stop'
  | 'resource_pressure';

/**
 * Request context metadata
 */
export interface RequestContextMetadata {
  requestId: string;
  startTime: number;
  timeout: number;
  cancelled: boolean;
  cancellationReason: CancellationReason | null;
  cancellationTime: number | null;
}

/**
 * Options for creating request context
 */
export interface RequestContextOptions {
  requestId?: string;
  timeoutMs?: number;
  onCancel?: (reason: CancellationReason) => void;
}

/**
 * Request-scoped service for managing AbortController lifecycle
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private readonly logger = new Logger(RequestContextService.name);
  private abortController: AbortController;
  private metadata: RequestContextMetadata;
  private timeoutHandle: NodeJS.Timeout | null = null;
  private onCancelCallback: ((reason: CancellationReason) => void) | null = null;

  // Phase 10.115: Increased to 720s (12 min) for Quality-First comprehensive search + enrichment + STEP 3.5 journal metrics
  private static readonly DEFAULT_TIMEOUT_MS = 720000;

  constructor() {
    this.abortController = new AbortController();
    this.metadata = {
      requestId: this.generateRequestId(),
      startTime: Date.now(),
      timeout: RequestContextService.DEFAULT_TIMEOUT_MS,
      cancelled: false,
      cancellationReason: null,
      cancellationTime: null,
    };
  }

  /**
   * Initialize context with options
   */
  initialize(options: RequestContextOptions = {}): void {
    if (options.requestId) {
      this.metadata.requestId = options.requestId;
    }

    if (options.timeoutMs) {
      this.metadata.timeout = options.timeoutMs;
    }

    if (options.onCancel) {
      this.onCancelCallback = options.onCancel;
    }

    this.startTimeoutTimer();
  }

  /**
   * Get the AbortSignal for passing to async operations
   */
  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Check if the request has been cancelled
   */
  get isCancelled(): boolean {
    return this.metadata.cancelled;
  }

  /**
   * Get request metadata
   */
  get context(): Readonly<RequestContextMetadata> {
    return { ...this.metadata };
  }

  /**
   * Get elapsed time in milliseconds
   */
  get elapsedMs(): number {
    return Date.now() - this.metadata.startTime;
  }

  /**
   * Get remaining time before timeout
   */
  get remainingMs(): number {
    return Math.max(0, this.metadata.timeout - this.elapsedMs);
  }

  /**
   * Cancel the request with a reason
   */
  cancel(reason: CancellationReason): void {
    if (this.metadata.cancelled) {
      return;
    }

    this.metadata.cancelled = true;
    this.metadata.cancellationReason = reason;
    this.metadata.cancellationTime = Date.now();

    this.abortController.abort(reason);
    this.clearTimeoutTimer();

    if (this.onCancelCallback) {
      try {
        this.onCancelCallback(reason);
      } catch {
        // Ignore callback errors
      }
    }

    this.logger.log(
      `[${this.metadata.requestId}] Cancelled: ${reason} (elapsed: ${this.elapsedMs}ms)`
    );
  }

  /**
   * Handle client disconnect event
   */
  onClientDisconnect(): void {
    this.cancel('client_disconnect');
  }

  /**
   * Throw if request is cancelled (for checking in async operations)
   */
  throwIfCancelled(): void {
    if (this.metadata.cancelled) {
      throw new RequestCancelledException(
        this.metadata.requestId,
        this.metadata.cancellationReason ?? 'manual'
      );
    }
  }

  /**
   * Execute an operation with cancellation support
   */
  async executeWithCancellation<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    operationName: string = 'operation',
  ): Promise<T> {
    this.throwIfCancelled();

    try {
      const result = await operation(this.signal);
      return result;
    } catch (error) {
      if (this.isCancelled || (error instanceof Error && error.name === 'AbortError')) {
        throw new RequestCancelledException(
          this.metadata.requestId,
          this.metadata.cancellationReason ?? 'manual'
        );
      }
      throw error;
    }
  }

  /**
   * Create a child context for sub-operations with independent timeout
   */
  createChildContext(timeoutMs: number): ChildRequestContext {
    const childController = new AbortController();
    const childTimeout = setTimeout(() => {
      childController.abort('timeout');
    }, timeoutMs);
    childTimeout.unref();

    this.signal.addEventListener('abort', () => {
      clearTimeout(childTimeout);
      childController.abort(this.metadata.cancellationReason ?? 'parent_cancelled');
    });

    return {
      signal: childController.signal,
      cancel: (reason: string) => {
        clearTimeout(childTimeout);
        childController.abort(reason);
      },
      cleanup: () => {
        clearTimeout(childTimeout);
      },
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimeoutTimer();
    if (!this.metadata.cancelled) {
      this.cancel('manual');
    }
  }

  private startTimeoutTimer(): void {
    this.clearTimeoutTimer();

    this.timeoutHandle = setTimeout(() => {
      this.cancel('timeout');
    }, this.metadata.timeout);

    this.timeoutHandle.unref();
  }

  private clearTimeoutTimer(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `req_${timestamp}_${random}`;
  }
}

/**
 * Child request context for sub-operations
 */
export interface ChildRequestContext {
  signal: AbortSignal;
  cancel: (reason: string) => void;
  cleanup: () => void;
}

/**
 * Exception thrown when request is cancelled
 */
export class RequestCancelledException extends Error {
  constructor(
    public readonly requestId: string,
    public readonly reason: CancellationReason,
  ) {
    super(`Request ${requestId} cancelled: ${reason}`);
    this.name = 'RequestCancelledException';
  }
}

/**
 * Utility to wrap HTTP client calls with abort signal
 */
export function withAbortSignal<T>(
  signal: AbortSignal,
  operation: () => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Request cancelled'));
      return;
    }

    const abortHandler = () => {
      reject(new Error('Request cancelled'));
    };

    signal.addEventListener('abort', abortHandler);

    operation()
      .then(result => {
        signal.removeEventListener('abort', abortHandler);
        resolve(result);
      })
      .catch(error => {
        signal.removeEventListener('abort', abortHandler);
        reject(error);
      });
  });
}
