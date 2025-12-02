/**
 * Phase 10.102 Day 3 - Phase 3: Retry Service with Exponential Backoff
 *
 * Implements intelligent retry logic for transient failures.
 *
 * Key Features:
 * - Exponential backoff (1s, 2s, 4s, 8s...)
 * - Jitter to prevent thundering herd
 * - Configurable retry policies
 * - Error classification (retryable vs non-retryable)
 * - Circuit breaker integration
 *
 * Enterprise Benefits:
 * - Graceful handling of transient failures
 * - Prevents API rate limiting
 * - Improved reliability
 * - Better user experience
 *
 * @see PHASE_10.102_PHASE3_IMPLEMENTATION_PLAN.md
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number; // Random jitter to prevent thundering herd
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalDuration: number;
  lastError?: Error;
}

/**
 * Error classification for retry decisions
 */
enum ErrorType {
  RETRYABLE = 'RETRYABLE',
  NON_RETRYABLE = 'NON_RETRYABLE',
}

/**
 * RetryService - Exponential Backoff Retry Logic
 *
 * Handles transient failures with intelligent retry strategies.
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  // Default retry policies
  private readonly defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    initialDelayMs: 1000,  // 1 second
    maxDelayMs: 16000,     // 16 seconds max
    backoffMultiplier: 2,   // Exponential: 1s, 2s, 4s, 8s, 16s
    jitterMs: 500,          // 0-500ms random jitter
  };

  private readonly aggressivePolicy: RetryPolicy = {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
    jitterMs: 250,
  };

  private readonly conservativePolicy: RetryPolicy = {
    maxAttempts: 2,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterMs: 1000,
  };

  constructor() {
    this.logger.log('RetryService initialized with exponential backoff');
  }

  /**
   * Execute function with retry logic (default policy)
   *
   * @param fn - Async function to execute
   * @param operationName - Name for logging
   * @param policy - Optional custom retry policy
   * @returns RetryResult with data and metadata
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    policy: RetryPolicy = this.defaultPolicy
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      attempts = attempt;

      try {
        this.logger.log(
          `[Retry] ${operationName} - Attempt ${attempt}/${policy.maxAttempts}`
        );

        const data = await fn();

        const duration = Date.now() - startTime;
        this.logger.log(
          `[Retry] ${operationName} succeeded on attempt ${attempt} ` +
          `(duration: ${duration}ms)`
        );

        return {
          data,
          attempts,
          totalDuration: duration,
          lastError,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Classify error
        const errorType = this.classifyError(err);

        if (errorType === ErrorType.NON_RETRYABLE) {
          this.logger.warn(
            `[Retry] ${operationName} failed with non-retryable error: ${err.message}. ` +
            `Not retrying.`
          );
          throw err;
        }

        // Check if we have more attempts
        if (attempt >= policy.maxAttempts) {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[Retry] ${operationName} failed after ${attempts} attempts ` +
            `(duration: ${duration}ms). Last error: ${err.message}`
          );
          throw new Error(
            `Operation failed after ${attempts} attempts. Last error: ${err.message}`
          );
        }

        // Calculate delay with exponential backoff + jitter
        const delay = this.calculateDelay(attempt, policy);

        this.logger.warn(
          `[Retry] ${operationName} attempt ${attempt} failed: ${err.message}. ` +
          `Retrying in ${delay}ms... (${attempt}/${policy.maxAttempts})`
        );

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error(`Unexpected retry loop exit for ${operationName}`);
  }

  /**
   * Execute function with aggressive retry (more attempts, shorter delays)
   * Use for: Network requests, API calls with transient failures
   */
  async executeWithAggressiveRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(fn, operationName, this.aggressivePolicy);
  }

  /**
   * Execute function with conservative retry (fewer attempts, longer delays)
   * Use for: Heavy operations, rate-limited APIs
   */
  async executeWithConservativeRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(fn, operationName, this.conservativePolicy);
  }

  /**
   * Calculate delay with exponential backoff + jitter
   */
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    // Exponential backoff: initialDelay * multiplier^(attempt-1)
    const exponentialDelay =
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, policy.maxDelayMs);

    // Add random jitter (0 to jitterMs)
    const jitter = Math.random() * policy.jitterMs;

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Classify error as retryable or non-retryable
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    // Non-retryable errors (user input, validation, auth)
    const nonRetryablePatterns = [
      'validation',
      'invalid',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'empty query',
    ];

    for (const pattern of nonRetryablePatterns) {
      if (message.includes(pattern)) {
        return ErrorType.NON_RETRYABLE;
      }
    }

    // Retryable errors (network, timeout, rate limit, server errors)
    const retryablePatterns = [
      'timeout',
      'network',
      'econnrefused',
      'enotfound',
      'econnreset',
      'etimedout',
      'rate limit',
      '429',
      '500',
      '502',
      '503',
      '504',
      'service unavailable',
      'temporarily unavailable',
    ];

    for (const pattern of retryablePatterns) {
      if (message.includes(pattern)) {
        return ErrorType.RETRYABLE;
      }
    }

    // Default: treat unknown errors as retryable (safer for transient issues)
    return ErrorType.RETRYABLE;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get default retry policy (for external use)
   */
  getDefaultPolicy(): RetryPolicy {
    return { ...this.defaultPolicy };
  }

  /**
   * Get aggressive retry policy (for external use)
   */
  getAggressivePolicy(): RetryPolicy {
    return { ...this.aggressivePolicy };
  }

  /**
   * Get conservative retry policy (for external use)
   */
  getConservativePolicy(): RetryPolicy {
    return { ...this.conservativePolicy };
  }
}
