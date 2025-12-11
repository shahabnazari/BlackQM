/**
 * Phase 10.102 Day 3 - Phase 3: Bulkhead Pattern Service
 *
 * Implements the Bulkhead pattern for multi-tenant resource isolation.
 * Prevents one user's heavy load from blocking other users.
 *
 * Key Features:
 * - Per-user concurrency limits
 * - Global resource pooling
 * - Circuit breaker integration
 * - Resource pool monitoring
 * - Graceful queue overflow handling
 *
 * Enterprise Benefits:
 * - Fair resource allocation
 * - Prevents cascading failures
 * - Protects system under load
 * - SLA compliance for all users
 *
 * @see PHASE_10.102_PHASE3_IMPLEMENTATION_PLAN.md
 */

import { Injectable, Logger } from '@nestjs/common';
import PQueue from 'p-queue';

/**
 * Bulkhead configuration per operation type
 */
interface BulkheadConfig {
  perUserConcurrency: number;
  globalConcurrency: number;
  timeout: number; // milliseconds
  retryLimit: number;
}

/**
 * Resource pool metrics for monitoring
 */
interface PoolMetrics {
  userId: string;
  operationType: 'search' | 'extraction';
  queueSize: number;
  pendingTasks: number;
  completedTasks: number;
  totalRequests: number;
  rejectedRequests: number;
  averageWaitTime: number;
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * BulkheadService - Multi-tenant Resource Isolation
 *
 * Implements the Bulkhead pattern to prevent resource exhaustion
 * and ensure fair allocation across multiple users.
 */
@Injectable()
export class BulkheadService {
  private readonly logger = new Logger(BulkheadService.name);

  // Resource pools per user
  private searchPools: Map<string, PQueue> = new Map();
  private extractionPools: Map<string, PQueue> = new Map();

  // Global resource pools
  private globalSearchQueue: PQueue;
  private globalExtractionQueue: PQueue;

  // Metrics tracking
  private metrics: Map<string, PoolMetrics> = new Map();

  // Circuit breaker state (per user per operation)
  private circuitStates: Map<string, CircuitState> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private readonly CIRCUIT_FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_TIMEOUT = 30000; // 30 seconds

  // Configuration - Phase 10.115 Netflix-Grade: Timeout adjusted for Quality-First Search
  private readonly searchConfig: BulkheadConfig = {
    perUserConcurrency: 30,     // ✅ 30 concurrent per user for progressive loading
    globalConcurrency: 100,     // ✅ 100 global for multiple users
    timeout: 720000,            // ✅ Phase 10.115: Increased to 720s (12 min) for Quality-First comprehensive enrichment + STEP 3.5
    retryLimit: 2,
  };

  private readonly extractionConfig: BulkheadConfig = {
    perUserConcurrency: 1,      // Max 1 concurrent extraction per user
    globalConcurrency: 10,      // Max 10 concurrent extractions globally
    timeout: 300000,            // 5 minutes per extraction
    retryLimit: 1,
  };

  constructor() {
    // Initialize global queues
    this.globalSearchQueue = new PQueue({
      concurrency: this.searchConfig.globalConcurrency,
      timeout: this.searchConfig.timeout,
    });

    this.globalExtractionQueue = new PQueue({
      concurrency: this.extractionConfig.globalConcurrency,
      timeout: this.extractionConfig.timeout,
    });

    this.logger.log(
      `BulkheadService initialized:\n` +
      `  Search: ${this.searchConfig.perUserConcurrency} per-user, ${this.searchConfig.globalConcurrency} global\n` +
      `  Extraction: ${this.extractionConfig.perUserConcurrency} per-user, ${this.extractionConfig.globalConcurrency} global`
    );
  }

  /**
   * Execute a search operation with bulkhead protection
   *
   * @param userId - User identifier for resource isolation
   * @param fn - Async function to execute (search operation)
   * @returns Promise with search results
   * @throws Error if circuit is open or queue is full
   */
  async executeSearch<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    return this.executeWithBulkhead(
      userId,
      'search',
      fn,
      this.searchConfig,
      this.searchPools,
      this.globalSearchQueue
    );
  }

  /**
   * Execute a theme extraction operation with bulkhead protection
   *
   * @param userId - User identifier for resource isolation
   * @param fn - Async function to execute (extraction operation)
   * @returns Promise with extraction results
   * @throws Error if circuit is open or queue is full
   */
  async executeExtraction<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    return this.executeWithBulkhead(
      userId,
      'extraction',
      fn,
      this.extractionConfig,
      this.extractionPools,
      this.globalExtractionQueue
    );
  }

  /**
   * Core bulkhead execution logic
   */
  private async executeWithBulkhead<T>(
    userId: string,
    operationType: 'search' | 'extraction',
    fn: () => Promise<T>,
    config: BulkheadConfig,
    userPools: Map<string, PQueue>,
    globalQueue: PQueue
  ): Promise<T> {
    const circuitKey = `${userId}:${operationType}`;

    // Check circuit breaker
    if (this.isCircuitOpen(circuitKey)) {
      this.logger.warn(
        `Circuit breaker OPEN for user ${userId} ${operationType}. ` +
        `Rejecting request to prevent cascade failure.`
      );
      throw new Error(`Service temporarily unavailable for ${operationType}. Please try again in a few moments.`);
    }

    // Get or create user queue
    const userQueue = this.getUserQueue(userId, config, userPools);

    // Track metrics - reuse circuitKey to avoid duplicate string allocation
    const metricsKey = circuitKey;  // Performance optimization: reuse existing string
    this.initializeMetrics(metricsKey, userId, operationType);
    const metrics = this.metrics.get(metricsKey)!;
    metrics.totalRequests++;

    // Check if user queue is at capacity
    if (userQueue.size >= config.perUserConcurrency * 2) {
      this.logger.warn(
        `User ${userId} ${operationType} queue full ` +
        `(size: ${userQueue.size}, limit: ${config.perUserConcurrency * 2}). ` +
        `Rejecting new request.`
      );
      metrics.rejectedRequests++;
      throw new Error(`Too many concurrent ${operationType} requests. Please wait for current operations to complete.`);
    }

    // Execute with both user and global bulkheads
    const startTime = Date.now();

    try {
      // Performance optimization: Use debug level to avoid logging overhead in production
      this.logger.debug(
        `[Bulkhead] User ${userId} ${operationType}: ` +
        `User queue: ${userQueue.size}/${userQueue.pending}, ` +
        `Global queue: ${globalQueue.size}/${globalQueue.pending}`
      );

      // Add to user queue, which will then be added to global queue
      const result = await userQueue.add(async () => {
        return globalQueue.add(fn);
      });

      // Success - record metrics
      const duration = Date.now() - startTime;
      metrics.completedTasks++;
      metrics.averageWaitTime =
        (metrics.averageWaitTime * (metrics.completedTasks - 1) + duration) /
        metrics.completedTasks;

      // Reset circuit on success
      this.recordSuccess(circuitKey);

      // Performance optimization: Only log slow completions (actionable insight)
      if (duration > 30000) {  // > 30 seconds
        this.logger.warn(
          `[Bulkhead] Slow ${operationType} completion: ${duration}ms for user ${userId} ` +
          `(avg: ${metrics.averageWaitTime.toFixed(0)}ms)`
        );
      }

      return result;
    } catch (error) {
      // Phase 10.112 Week 4 Fix: Don't count user cancellations as failures
      // These are not service failures - they're user-initiated or hedging-initiated aborts
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserCancellation =
        errorMessage.includes('Request cancelled') ||
        errorMessage.includes('aborted') ||
        (error instanceof Error && error.name === 'AbortError');

      if (!isUserCancellation) {
        // Only record actual service failures for circuit breaker
        this.recordFailure(circuitKey);
        this.logger.error(
          `[Bulkhead] User ${userId} ${operationType} failed: ${errorMessage}`
        );
      } else {
        // Log but don't count as failure
        this.logger.debug(
          `[Bulkhead] User ${userId} ${operationType} cancelled (not counted as failure)`
        );
      }

      throw error;
    }
  }

  /**
   * Get or create a user-specific queue
   */
  private getUserQueue(
    userId: string,
    config: BulkheadConfig,
    pools: Map<string, PQueue>
  ): PQueue {
    let queue = pools.get(userId);

    if (!queue) {
      queue = new PQueue({
        concurrency: config.perUserConcurrency,
        timeout: config.timeout,
      });

      pools.set(userId, queue);

      this.logger.log(
        `Created new queue for user ${userId} ` +
        `(concurrency: ${config.perUserConcurrency})`
      );
    }

    return queue;
  }

  /**
   * Initialize metrics for a user-operation combination
   */
  private initializeMetrics(
    key: string,
    userId: string,
    operationType: 'search' | 'extraction'
  ): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        userId,
        operationType,
        queueSize: 0,
        pendingTasks: 0,
        completedTasks: 0,
        totalRequests: 0,
        rejectedRequests: 0,
        averageWaitTime: 0,
      });
    }
  }

  /**
   * Circuit Breaker: Check if circuit is open
   */
  private isCircuitOpen(circuitKey: string): boolean {
    const state = this.circuitStates.get(circuitKey);
    return state === CircuitState.OPEN;
  }

  /**
   * Circuit Breaker: Record successful execution
   */
  private recordSuccess(circuitKey: string): void {
    const state = this.circuitStates.get(circuitKey);

    if (state === CircuitState.HALF_OPEN) {
      // Recovered - close circuit
      this.circuitStates.set(circuitKey, CircuitState.CLOSED);
      this.failureCounts.set(circuitKey, 0);
      this.logger.log(`Circuit breaker CLOSED for ${circuitKey} (recovered)`);
    } else if (state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCounts.set(circuitKey, 0);
    }
  }

  /**
   * Circuit Breaker: Record failed execution
   */
  private recordFailure(circuitKey: string): void {
    const currentFailures = this.failureCounts.get(circuitKey) || 0;
    const newFailures = currentFailures + 1;
    this.failureCounts.set(circuitKey, newFailures);

    if (newFailures >= this.CIRCUIT_FAILURE_THRESHOLD) {
      this.circuitStates.set(circuitKey, CircuitState.OPEN);
      this.logger.error(
        `Circuit breaker OPEN for ${circuitKey} ` +
        `(failures: ${newFailures}/${this.CIRCUIT_FAILURE_THRESHOLD})`
      );

      // Schedule circuit recovery attempt
      setTimeout(() => {
        this.circuitStates.set(circuitKey, CircuitState.HALF_OPEN);
        this.logger.log(`Circuit breaker HALF_OPEN for ${circuitKey} (testing recovery)`);
      }, this.CIRCUIT_RESET_TIMEOUT);
    }
  }

  /**
   * Get metrics for a specific user and operation
   */
  getMetrics(userId: string, operationType: 'search' | 'extraction'): PoolMetrics | undefined {
    return this.metrics.get(`${userId}:${operationType}`);
  }

  /**
   * Get all metrics (for monitoring dashboard)
   */
  getAllMetrics(): PoolMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get global queue stats
   */
  getGlobalStats(): {
    search: { size: number; pending: number };
    extraction: { size: number; pending: number };
  } {
    return {
      search: {
        size: this.globalSearchQueue.size,
        pending: this.globalSearchQueue.pending,
      },
      extraction: {
        size: this.globalExtractionQueue.size,
        pending: this.globalExtractionQueue.pending,
      },
    };
  }

  /**
   * Clear metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.circuitStates.clear();
    this.failureCounts.clear();
    this.logger.log('Metrics cleared');
  }
}
