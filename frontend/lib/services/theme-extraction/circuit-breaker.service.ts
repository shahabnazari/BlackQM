/**
 * Circuit Breaker Service - Phase 10.93 Day 4
 *
 * Enterprise-grade circuit breaker pattern for preventing cascading failures.
 * Implements Martin Fowler's circuit breaker pattern.
 *
 * @module theme-extraction/CircuitBreakerService
 * @since Phase 10.93 Day 4
 * @see https://martinfowler.com/bliki/CircuitBreaker.html
 *
 * **Purpose:**
 * Prevent repeated calls to a failing service by "opening the circuit"
 * after a threshold of failures. This allows the failing service time
 * to recover and prevents resource exhaustion.
 *
 * **States:**
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: Too many failures, reject requests immediately (fail-fast)
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 *
 * **State Transitions:**
 * ```
 * CLOSED --[failures >= threshold]--> OPEN
 * OPEN --[timeout elapsed]--> HALF_OPEN
 * HALF_OPEN --[success count reached]--> CLOSED
 * HALF_OPEN --[single failure]--> OPEN
 * ```
 *
 * **Usage:**
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,     // Open after 5 failures
 *   resetTimeoutMs: 30000,   // Try again after 30s
 *   successThreshold: 2,     // Close after 2 successes
 * });
 *
 * const result = await breaker.execute(
 *   () => literatureAPI.fetchPaper(id)
 * );
 * ```
 */

import { logger } from '@/lib/utils/logger';

/**
 * Circuit breaker state
 */
export enum CircuitState {
  /** Normal operation - all requests allowed */
  CLOSED = 'CLOSED',

  /** Too many failures - reject requests immediately */
  OPEN = 'OPEN',

  /** Testing recovery - allow limited requests */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration options for circuit breaker
 */
export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures before opening circuit
   * @default 5
   */
  failureThreshold: number;

  /**
   * Time in milliseconds to wait before transitioning from OPEN to HALF_OPEN
   * @default 30000 (30 seconds)
   */
  resetTimeoutMs: number;

  /**
   * Number of consecutive successes in HALF_OPEN state before closing circuit
   * @default 2
   */
  successThreshold: number;

  /**
   * Optional name for logging purposes
   * @default 'CircuitBreaker'
   */
  name?: string;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
  name: 'CircuitBreaker',
};

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(circuitName: string, resetTime: Date) {
    super(
      `Circuit breaker '${circuitName}' is OPEN. Will attempt recovery at ${resetTime.toISOString()}`
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit Breaker Service
 *
 * Protects against cascading failures by tracking success/failure rates
 * and "opening the circuit" (failing fast) when a service is unhealthy.
 *
 * **Example Scenario:**
 * 1. Service starts in CLOSED state (normal)
 * 2. 5 consecutive API calls fail
 * 3. Circuit opens → next 100 calls fail immediately (no API calls made)
 * 4. After 30 seconds, circuit moves to HALF_OPEN
 * 5. Next 2 calls succeed → circuit closes (back to normal)
 * 6. If a call fails in HALF_OPEN → circuit re-opens for another 30s
 *
 * **Benefits:**
 * - Prevents resource exhaustion (threads, connections, memory)
 * - Gives failing service time to recover
 * - Provides fast feedback to users (fail immediately vs. timeout)
 * - Reduces load on failing service
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTime: Date = new Date();
  private readonly options: Required<CircuitBreakerOptions>;

  /**
   * Create a new circuit breaker
   *
   * @param options - Circuit breaker configuration
   *
   * @example
   * ```typescript
   * const breaker = new CircuitBreaker({
   *   failureThreshold: 5,
   *   resetTimeoutMs: 30000,
   *   successThreshold: 2,
   *   name: 'FullTextExtractionAPI',
   * });
   * ```
   */
  constructor(options: CircuitBreakerOptions) {
    // ===========================
    // BUG-DAY4-002 FIX: Validate circuit breaker configuration upfront
    // ===========================
    if (options.failureThreshold <= 0) {
      throw new Error(
        `Invalid circuit breaker configuration: failureThreshold must be positive (got ${options.failureThreshold})`
      );
    }

    if (options.resetTimeoutMs <= 0) {
      throw new Error(
        `Invalid circuit breaker configuration: resetTimeoutMs must be positive (got ${options.resetTimeoutMs})`
      );
    }

    if (options.successThreshold <= 0) {
      throw new Error(
        `Invalid circuit breaker configuration: successThreshold must be positive (got ${options.successThreshold})`
      );
    }

    this.options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options,
    };

    logger.debug('Circuit breaker created', 'CircuitBreaker', {
      name: this.options.name,
      failureThreshold: this.options.failureThreshold,
      resetTimeoutMs: this.options.resetTimeoutMs,
      successThreshold: this.options.successThreshold,
    });
  }

  /**
   * Execute an operation through the circuit breaker
   *
   * **Behavior by State:**
   * - CLOSED: Execute operation normally
   * - OPEN: Reject immediately with CircuitBreakerOpenError
   * - HALF_OPEN: Execute operation, track success/failure
   *
   * @template T - Return type of operation
   * @param operation - Async function to execute
   * @returns Result of operation
   *
   * @throws {CircuitBreakerOpenError} If circuit is open
   * @throws {Error} Operation error if circuit is closed/half-open
   *
   * @example
   * ```typescript
   * try {
   *   const paper = await breaker.execute(
   *     () => literatureAPI.fetchPaper(id)
   *   );
   *   console.log('Success:', paper);
   * } catch (error) {
   *   if (error instanceof CircuitBreakerOpenError) {
   *     console.log('Circuit is open, try again later');
   *   } else {
   *     console.log('Operation failed:', error);
   *   }
   * }
   * ```
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check current state
    const currentState = this.getState();

    logger.debug('Circuit breaker execute', 'CircuitBreaker', {
      name: this.options.name,
      state: currentState,
      failureCount: this.failureCount,
      successCount: this.successCount,
    });

    // If circuit is OPEN, reject immediately
    if (currentState === CircuitState.OPEN) {
      logger.warn('Circuit breaker is OPEN - rejecting request', 'CircuitBreaker', {
        name: this.options.name,
        nextAttemptTime: this.nextAttemptTime.toISOString(),
      });
      throw new CircuitBreakerOpenError(this.options.name, this.nextAttemptTime);
    }

    // Execute operation
    try {
      const result = await operation();

      // Record success
      this.onSuccess();

      return result;
    } catch (error: unknown) {
      // Record failure
      this.onFailure();

      // Re-throw original error
      throw error;
    }
  }

  /**
   * Get current circuit state
   *
   * **State Logic:**
   * - If OPEN and timeout has elapsed → transition to HALF_OPEN
   * - Otherwise return current state
   *
   * @returns Current circuit state
   *
   * @private
   */
  private getState(): CircuitState {
    // If OPEN and timeout has elapsed, move to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = new Date();
      if (now >= this.nextAttemptTime) {
        logger.info('Circuit breaker transitioning to HALF_OPEN', 'CircuitBreaker', {
          name: this.options.name,
          previousState: CircuitState.OPEN,
        });
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0; // Reset success counter for HALF_OPEN test
      }
    }

    return this.state;
  }

  /**
   * Handle successful operation
   *
   * **State Transitions:**
   * - CLOSED: Reset failure count
   * - HALF_OPEN: Increment success count, close if threshold reached
   * - OPEN: No-op (shouldn't happen)
   *
   * @private
   */
  private onSuccess(): void {
    logger.debug('Circuit breaker: operation succeeded', 'CircuitBreaker', {
      name: this.options.name,
      state: this.state,
    });

    if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Increment success count in HALF_OPEN state
      this.successCount++;

      logger.debug('Circuit breaker: success in HALF_OPEN', 'CircuitBreaker', {
        name: this.options.name,
        successCount: this.successCount,
        successThreshold: this.options.successThreshold,
      });

      // If we've reached success threshold, close the circuit
      if (this.successCount >= this.options.successThreshold) {
        logger.info('Circuit breaker closing (recovered)', 'CircuitBreaker', {
          name: this.options.name,
          successCount: this.successCount,
        });
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   *
   * **State Transitions:**
   * - CLOSED: Increment failure count, open if threshold reached
   * - HALF_OPEN: Re-open circuit immediately
   * - OPEN: No-op (shouldn't happen)
   *
   * @private
   */
  private onFailure(): void {
    logger.debug('Circuit breaker: operation failed', 'CircuitBreaker', {
      name: this.options.name,
      state: this.state,
      failureCount: this.failureCount,
    });

    if (this.state === CircuitState.CLOSED) {
      // Increment failure count in CLOSED state
      this.failureCount++;

      logger.debug('Circuit breaker: failure in CLOSED', 'CircuitBreaker', {
        name: this.options.name,
        failureCount: this.failureCount,
        failureThreshold: this.options.failureThreshold,
      });

      // If we've reached failure threshold, open the circuit
      if (this.failureCount >= this.options.failureThreshold) {
        this.openCircuit();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN re-opens the circuit
      logger.warn('Circuit breaker: failure in HALF_OPEN - re-opening', 'CircuitBreaker', {
        name: this.options.name,
      });
      this.openCircuit();
    }
  }

  /**
   * Open the circuit
   *
   * Sets state to OPEN and calculates next attempt time based on reset timeout.
   *
   * @private
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeoutMs);

    logger.warn('Circuit breaker OPENED', 'CircuitBreaker', {
      name: this.options.name,
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime.toISOString(),
      resetTimeoutMs: this.options.resetTimeoutMs,
    });

    // Reset counters
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Get current circuit breaker statistics
   *
   * **Use Case:** Monitoring, debugging, metrics
   *
   * @returns Circuit breaker state and counters
   *
   * @example
   * ```typescript
   * const stats = breaker.getStats();
   * console.log(`State: ${stats.state}`);
   * console.log(`Failures: ${stats.failureCount}`);
   * console.log(`Next attempt: ${stats.nextAttemptTime}`);
   * ```
   */
  public getStats(): {
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttemptTime: Date;
  } {
    return {
      name: this.options.name,
      state: this.getState(), // Use getState() to handle OPEN→HALF_OPEN transition
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Manually reset circuit breaker to CLOSED state
   *
   * **Use Case:** Testing, manual intervention, configuration changes
   *
   * @example
   * ```typescript
   * // After fixing the underlying issue
   * breaker.reset();
   * console.log('Circuit breaker manually reset');
   * ```
   */
  public reset(): void {
    logger.info('Circuit breaker manually reset', 'CircuitBreaker', {
      name: this.options.name,
      previousState: this.state,
    });

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = new Date();
  }
}
