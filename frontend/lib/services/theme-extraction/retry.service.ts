/**
 * Retry Service - Phase 10.93 Day 4
 *
 * Enterprise-grade retry logic with exponential backoff and jitter.
 * Implements AWS best practices for resilient API calls.
 *
 * @module theme-extraction/RetryService
 * @since Phase 10.93 Day 4
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * **Features:**
 * - Exponential backoff with configurable base delay
 * - Jitter to prevent thundering herd problem
 * - Retry predicate (selective retry based on error type)
 * - Max delay cap to prevent excessive waits
 * - Detailed retry logging
 * - Type-safe operation execution
 *
 * **Usage:**
 * ```typescript
 * const retryService = new RetryService();
 *
 * const result = await retryService.executeWithRetry(
 *   () => literatureAPI.fetchPaper(id),
 *   {
 *     maxAttempts: 3,
 *     baseDelayMs: 1000,
 *     maxDelayMs: 10000,
 *     shouldRetry: (error) => error.message.includes('network'),
 *     onRetry: (attempt, error, delayMs) => {
 *       logger.info(`Retry attempt ${attempt} after ${delayMs}ms`);
 *     },
 *   }
 * );
 * ```
 */

import { logger } from '@/lib/utils/logger';

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of attempts (including initial attempt)
   * @default 3
   */
  maxAttempts: number;

  /**
   * Base delay in milliseconds before first retry
   * @default 1000
   */
  baseDelayMs: number;

  /**
   * Maximum delay cap in milliseconds
   * @default 10000
   */
  maxDelayMs: number;

  /**
   * Predicate to determine if error should trigger retry
   * @param error - The error that occurred
   * @returns true if operation should be retried
   * @default () => true (retry all errors)
   */
  shouldRetry?: (error: Error) => boolean;

  /**
   * Callback invoked before each retry attempt
   * @param attempt - Current attempt number (1-indexed)
   * @param error - The error that triggered the retry
   * @param delayMs - Calculated delay before retry
   */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: () => true, // Retry all errors by default
};

/**
 * Retry Service
 *
 * Provides intelligent retry logic with exponential backoff and jitter.
 *
 * **Backoff Algorithm:**
 * ```
 * delay = min(baseDelay * 2^(attempt - 1) + jitter, maxDelay)
 * jitter = random(0, baseDelay * 0.2)
 * ```
 *
 * **Example Delays (baseDelay=1000ms, maxDelay=10000ms):**
 * - Attempt 1: Immediate (0ms)
 * - Attempt 2: 1000ms + jitter (1000-1200ms)
 * - Attempt 3: 2000ms + jitter (2000-2400ms)
 * - Attempt 4: 4000ms + jitter (4000-4800ms)
 * - Attempt 5: 8000ms + jitter (8000-9600ms)
 * - Attempt 6: 10000ms (capped at maxDelay)
 *
 * **Why Jitter?**
 * Prevents multiple clients from retrying at exactly the same time
 * (thundering herd problem), which can overwhelm a recovering service.
 */
export class RetryService {
  /**
   * Execute an operation with automatic retry on failure
   *
   * @template T - Return type of the operation
   * @param operation - Async function to execute (can throw errors)
   * @param options - Retry configuration options
   * @returns Result of successful operation
   *
   * @throws {Error} The last error if all attempts fail
   *
   * @example
   * ```typescript
   * const service = new RetryService();
   *
   * const paper = await service.executeWithRetry(
   *   () => literatureAPI.fetchPaper('123'),
   *   {
   *     maxAttempts: 3,
   *     baseDelayMs: 1000,
   *     shouldRetry: (error) => isNetworkError(error),
   *   }
   * );
   * ```
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    // Merge with defaults
    const config: Required<RetryOptions> = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
      shouldRetry: options.shouldRetry || DEFAULT_RETRY_OPTIONS.shouldRetry,
      onRetry: options.onRetry || (() => {}),
    };

    // ===========================
    // BUG-001 FIX: Validate retry configuration upfront
    // ===========================
    if (config.maxAttempts <= 0) {
      throw new Error(
        `Invalid retry configuration: maxAttempts must be positive (got ${config.maxAttempts})`
      );
    }

    if (config.baseDelayMs <= 0) {
      throw new Error(
        `Invalid retry configuration: baseDelayMs must be positive (got ${config.baseDelayMs})`
      );
    }

    if (config.maxDelayMs <= 0) {
      throw new Error(
        `Invalid retry configuration: maxDelayMs must be positive (got ${config.maxDelayMs})`
      );
    }

    if (config.maxDelayMs < config.baseDelayMs) {
      throw new Error(
        `Invalid retry configuration: maxDelayMs (${config.maxDelayMs}) must be >= baseDelayMs (${config.baseDelayMs})`
      );
    }

    let lastError: Error = new Error('Operation failed');

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Execute operation
        const result = await operation();

        // Success!
        if (attempt > 1) {
          logger.info('Operation succeeded after retry', 'RetryService', {
            attempt,
            totalAttempts: config.maxAttempts,
          });
        }

        return result;
      } catch (error: unknown) {
        // Convert to Error object
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Check if we should retry
        const isLastAttempt = attempt === config.maxAttempts;
        const shouldRetry = config.shouldRetry(err);

        // Log failure
        logger.warn('Operation failed', 'RetryService', {
          attempt,
          maxAttempts: config.maxAttempts,
          error: err.message,
          willRetry: !isLastAttempt && shouldRetry,
        });

        // If last attempt or shouldn't retry, throw error
        if (isLastAttempt || !shouldRetry) {
          logger.error('Operation failed after all retry attempts', 'RetryService', {
            totalAttempts: attempt,
            finalError: err.message,
          });
          throw err;
        }

        // Calculate delay with exponential backoff and jitter
        const delayMs = this.calculateDelay(
          attempt,
          config.baseDelayMs,
          config.maxDelayMs
        );

        // Notify caller of retry
        config.onRetry(attempt, err, delayMs);

        // Wait before retrying
        logger.debug('Waiting before retry', 'RetryService', {
          attempt,
          delayMs,
          nextAttempt: attempt + 1,
        });

        await this.delay(delayMs);
      }
    }

    // This should never be reached due to throw in loop, but TypeScript needs it
    throw lastError;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   *
   * **Formula:**
   * ```
   * exponentialDelay = baseDelay * 2^(attempt - 1)
   * jitter = random(0, baseDelay * 0.2)
   * delay = min(exponentialDelay + jitter, maxDelay)
   * ```
   *
   * **Jitter Explanation:**
   * - Adds 0-20% random variation to prevent synchronized retries
   * - Example: baseDelay=1000ms → jitter range is 0-200ms
   *
   * @param attempt - Current attempt number (1-indexed)
   * @param baseDelayMs - Base delay in milliseconds
   * @param maxDelayMs - Maximum delay cap
   * @returns Calculated delay in milliseconds
   *
   * @private
   *
   * @example
   * ```typescript
   * // Attempt 1 (retry 1): 1000 * 2^0 = 1000ms + jitter
   * calculateDelay(1, 1000, 10000); // ~1000-1200ms
   *
   * // Attempt 2 (retry 2): 1000 * 2^1 = 2000ms + jitter
   * calculateDelay(2, 1000, 10000); // ~2000-2400ms
   *
   * // Attempt 3 (retry 3): 1000 * 2^2 = 4000ms + jitter
   * calculateDelay(3, 1000, 10000); // ~4000-4800ms
   * ```
   */
  private calculateDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
  ): number {
    // Exponential backoff: baseDelay * 2^(attempt - 1)
    // Note: attempt - 1 because first retry (attempt=1) should use baseDelay * 2^0 = baseDelay
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);

    // Add jitter: random value between 0 and 20% of baseDelay
    // This prevents thundering herd where all clients retry at the same time
    const jitter = Math.random() * (baseDelayMs * 0.2);

    // Calculate total delay
    const totalDelay = exponentialDelay + jitter;

    // Cap at maxDelay to prevent excessive waits
    const cappedDelay = Math.min(totalDelay, maxDelayMs);

    return Math.round(cappedDelay);
  }

  /**
   * Delay execution for specified milliseconds
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   *
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Helper function to determine if an error is retryable
 *
 * **Retryable Errors:**
 * - Network errors (connection failed, timeout)
 * - Rate limit errors (429, "rate limit")
 * - Server errors (500, 502, 503, 504)
 * - Temporary failures ("temporary", "unavailable")
 *
 * **Non-Retryable Errors:**
 * - Client errors (400, 401, 403, 404)
 * - Validation errors
 * - Not found errors
 * - Permanent failures
 *
 * @param error - Error to check
 * @returns true if error is likely transient and retryable
 *
 * @example
 * ```typescript
 * const retry = await retryService.executeWithRetry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 3,
 *     shouldRetry: isRetryableError,
 *   }
 * );
 * ```
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network-related errors (always retry)
  // BUG-DAY4-001 FIX: Use lowercase error codes (message is already lowercased on line 341)
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  ) {
    return true;
  }

  // Rate limiting (retry after delay)
  if (message.includes('rate limit') || message.includes('429')) {
    return true;
  }

  // Server errors (5xx - retry as server may recover)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('server error') ||
    message.includes('internal server error') ||
    message.includes('bad gateway') ||
    message.includes('service unavailable')
  ) {
    return true;
  }

  // Temporary/transient failures
  if (
    message.includes('temporary') ||
    message.includes('temporarily') ||
    message.includes('unavailable') ||
    message.includes('try again')
  ) {
    return true;
  }

  // Client errors (4xx - don't retry, except 429)
  if (
    message.includes('400') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('bad request') ||
    message.includes('validation')
  ) {
    return false;
  }

  // Unknown errors - be conservative, retry once
  // (maxAttempts will limit total retries)
  return true;
}
