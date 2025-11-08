/**
 * Enterprise-Grade Retry Utility
 * Phase 10 Day 33: Shared retry logic with exponential backoff and jitter
 *
 * Eliminates code duplication across:
 * - page.tsx savePaperWithRetry
 * - ai-backend.service.ts fetchWithRetry
 * - ai.service.ts retry logic
 *
 * Features:
 * - Exponential backoff with configurable jitter
 * - Smart error detection (rate limits, network, server errors)
 * - Type-safe async function wrapper
 * - Production-ready logging
 * - Configurable retry conditions
 * - Production monitoring and metrics
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await api.savePaper(data),
 *   {
 *     maxRetries: 3,
 *     baseDelayMs: 1000,
 *     maxDelayMs: 10000,
 *     jitterMs: 500,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * );
 * ```
 */

/**
 * Phase 10 Day 33: Production retry metrics for monitoring
 * Track retry success rates, error patterns, and performance
 */
interface RetryMetrics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
  avgAttempts: number;
  errorsByType: Record<string, number>;
}

class RetryMonitor {
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successCount: 0,
    failureCount: 0,
    retryCount: 0,
    avgAttempts: 0,
    errorsByType: {},
  };

  recordAttempt(success: boolean, attempts: number, errorType?: string): void {
    this.metrics.totalAttempts++;

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.failureCount++;
      if (errorType) {
        this.metrics.errorsByType[errorType] =
          (this.metrics.errorsByType[errorType] || 0) + 1;
      }
    }

    if (attempts > 1) {
      this.metrics.retryCount++;
    }

    // Update running average
    const totalCalls = this.metrics.successCount + this.metrics.failureCount;
    const totalRetries = this.metrics.retryCount;
    this.metrics.avgAttempts = totalCalls > 0 ? totalRetries / totalCalls : 0;
  }

  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    const total = this.metrics.successCount + this.metrics.failureCount;
    return total > 0 ? (this.metrics.successCount / total) * 100 : 0;
  }

  getRetryRate(): number {
    const total = this.metrics.successCount + this.metrics.failureCount;
    return total > 0 ? (this.metrics.retryCount / total) * 100 : 0;
  }

  logMetrics(): void {
    if (typeof console !== 'undefined') {
      console.log('📊 [Retry Metrics]', {
        successRate: `${this.getSuccessRate().toFixed(1)}%`,
        retryRate: `${this.getRetryRate().toFixed(1)}%`,
        avgAttempts: this.metrics.avgAttempts.toFixed(2),
        totalCalls: this.metrics.successCount + this.metrics.failureCount,
        errors: this.metrics.errorsByType,
      });
    }
  }

  reset(): void {
    this.metrics = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      avgAttempts: 0,
      errorsByType: {},
    };
  }
}

// Global retry monitor instance
export const retryMonitor = new RetryMonitor();

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Base delay in milliseconds for first retry (default: 1000) */
  baseDelayMs?: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs?: number;

  /** Random jitter range in milliseconds (default: 500) */
  jitterMs?: number;

  /** Custom function to determine if error is retryable */
  isRetryable?: (error: any) => boolean;

  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: any, delayMs: number) => void;

  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Result wrapper for retry operations
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data if successful */
  data?: T;

  /** Error message if failed */
  error?: string;

  /** Number of attempts made */
  attempts: number;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterMs: 500,
  isRetryable: defaultIsRetryable,
  debug: false,
};

/**
 * Default error detection logic
 * Retries on: rate limits, network errors, server errors, timeouts
 */
function defaultIsRetryable(error: any): boolean {
  // HTTP status code checks
  const status = error.response?.status || error.status;
  if (status === 429) return true; // Rate limit
  if (status >= 500 && status < 600) return true; // Server errors

  // Error message checks
  const message = error.message?.toLowerCase() || '';
  if (message.includes('rate limit')) return true;
  if (message.includes('network')) return true;
  if (message.includes('timeout')) return true;
  if (message.includes('etimedout')) return true;
  if (message.includes('econnrefused')) return true;
  if (message.includes('enotfound')) return true;

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 * Formula: min(baseDelay * 2^(attempt-1) + jitter, maxDelay)
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * jitterMs;
  const totalDelay = exponentialDelay + jitter;
  return Math.min(totalDelay, maxDelayMs);
}

/**
 * Execute async function with exponential backoff retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to RetryResult
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('API error');
 *     return response.json();
 *   },
 *   { maxRetries: 3 }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let errorType: string | undefined;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const data = await fn();

      if (config.debug) {
        console.log(`[Retry] Success on attempt ${attempt}/${config.maxRetries}`);
      }

      // Phase 10 Day 33: Record success metrics
      retryMonitor.recordAttempt(true, attempt);

      return {
        success: true,
        data,
        attempts: attempt,
      };
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === config.maxRetries;
      const isRetryable = config.isRetryable(error);

      // Classify error type for metrics
      errorType = classifyError(error);

      if (config.debug) {
        console.log(
          `[Retry] Attempt ${attempt}/${config.maxRetries} failed:`,
          error.message,
          `| Retryable: ${isRetryable}`,
          `| Type: ${errorType}`
        );
      }

      // Don't retry if error is not retryable or this is the last attempt
      if (!isRetryable || isLastAttempt) {
        // Phase 10 Day 33: Record failure metrics
        retryMonitor.recordAttempt(false, attempt, errorType);

        return {
          success: false,
          error: error.message || 'Unknown error',
          attempts: attempt,
        };
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(
        attempt,
        config.baseDelayMs,
        config.maxDelayMs,
        config.jitterMs
      );

      // Invoke retry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, error, delayMs);
      }

      if (config.debug) {
        console.log(`[Retry] Waiting ${Math.round(delayMs)}ms before retry...`);
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Should never reach here due to loop logic, but TypeScript needs it
  retryMonitor.recordAttempt(false, config.maxRetries, errorType);

  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded',
    attempts: config.maxRetries,
  };
}

/**
 * Classify error type for monitoring
 */
function classifyError(error: any): string {
  const status = error.response?.status || error.status;
  const message = error.message?.toLowerCase() || '';

  if (status === 429 || message.includes('rate limit')) return 'RATE_LIMIT';
  if (status >= 500 && status < 600) return `SERVER_ERROR_${status}`;
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (message.includes('network')) return 'NETWORK_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 404) return 'NOT_FOUND';

  return 'UNKNOWN';
}

/**
 * Simplified retry wrapper that throws on failure
 * Use when you want to handle errors with try-catch instead of result checking
 *
 * @throws Error with message from last failed attempt
 */
export async function retryOrThrow<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retryWithBackoff(fn, options);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  throw new Error(result.error || 'Operation failed after retries');
}

/**
 * Pre-configured retry for API calls with common settings
 */
export function retryApiCall<T>(
  fn: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitterMs: 500,
    ...customOptions,
  });
}

/**
 * Pre-configured retry for file operations with longer delays
 */
export function retryFileOperation<T>(
  fn: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    jitterMs: 1000,
    isRetryable: (error) => {
      // Retry on file system errors
      const message = error.message?.toLowerCase() || '';
      return (
        message.includes('enoent') ||
        message.includes('eacces') ||
        message.includes('ebusy') ||
        defaultIsRetryable(error)
      );
    },
    ...customOptions,
  });
}
