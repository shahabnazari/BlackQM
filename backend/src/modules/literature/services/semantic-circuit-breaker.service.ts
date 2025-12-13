/**
 * Phase 10.113 Week 12: Semantic Circuit Breaker
 *
 * Netflix-grade error recovery with graceful degradation chains.
 * Protects semantic ranking from cascading failures in Redis and worker pool.
 *
 * Degradation strategy:
 * - Worker Pool: 4 workers → single worker → sync → BM25-only
 * - Redis Cache: Redis → in-memory LRU → no cache
 * - Progressive Ranking: 3 tiers → 2 tiers → 1 tier → BM25-only
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 12
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPE DEFINITIONS - Netflix-grade strict typing
// ============================================================================

/**
 * Circuit breaker states
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  /** Name for logging */
  readonly name: string;
  /** Failures before opening circuit */
  readonly failureThreshold: number;
  /** Successes needed to close from half-open */
  readonly successThreshold: number;
  /** Timeout before trying again (ms) */
  readonly timeout: number;
}

/**
 * Circuit breaker stats
 */
interface CircuitStats {
  readonly state: CircuitState;
  readonly failures: number;
  readonly successes: number;
  readonly lastFailure: number | null;
  readonly lastSuccess: number | null;
  readonly totalFailures: number;
  readonly totalSuccesses: number;
}

/**
 * Degradation level for services
 */
type DegradationLevel = 'normal' | 'degraded' | 'fallback' | 'disabled';

/**
 * Service health status
 */
interface ServiceHealth {
  readonly redis: DegradationLevel;
  readonly workerPool: DegradationLevel;
  readonly progressive: DegradationLevel;
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

/**
 * Individual circuit breaker implementation
 */
class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly logger = new Logger(`CircuitBreaker:${this.config.name}`);

  constructor(private readonly config: CircuitBreakerConfig) {}

  /**
   * Check if circuit is open (blocking requests)
   */
  get isOpen(): boolean {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = 'half-open';
        this.logger.log(`[${this.config.name}] Circuit moved to HALF-OPEN`);
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'half-open') {
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        this.logger.log(`[${this.config.name}] Circuit CLOSED after ${this.config.successThreshold} successes`);
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Immediately open on failure in half-open state
      this.state = 'open';
      this.successes = 0;
      this.logger.warn(`[${this.config.name}] Circuit OPENED from half-open after failure`);
    } else if (this.state === 'closed') {
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        this.successes = 0;
        this.logger.warn(
          `[${this.config.name}] Circuit OPENED after ${this.config.failureThreshold} failures`,
        );
      }
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.logger.log(`[${this.config.name}] Circuit manually reset to CLOSED`);
  }

  /**
   * Get circuit stats
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }
}

// ============================================================================
// DEGRADATION CHAINS
// ============================================================================

/**
 * Degradation chain for each service
 */
const DEGRADATION_CHAINS = {
  workerPool: {
    primary: 'Worker thread pool (4 workers)',
    fallback1: 'Single worker thread',
    fallback2: 'Synchronous LocalEmbeddingService',
    fallback3: 'BM25-only ranking (no semantic)',
  },
  redisCache: {
    primary: 'Redis embedding cache',
    fallback1: 'In-memory LRU cache (1000 entries)',
    fallback2: 'No cache (generate all)',
  },
  progressiveRanking: {
    primary: 'Full progressive (3 tiers)',
    fallback1: 'Two tiers (immediate + complete)',
    fallback2: 'Single tier (all papers at once)',
    fallback3: 'BM25 only',
  },
} as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class SemanticCircuitBreakerService {
  private readonly logger = new Logger(SemanticCircuitBreakerService.name);

  /**
   * Circuit breakers for each service
   */
  private readonly breakers = {
    redis: new CircuitBreaker({
      name: 'Redis',
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000, // 30 seconds
    }),
    workerPool: new CircuitBreaker({
      name: 'WorkerPool',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000, // 60 seconds
    }),
    progressive: new CircuitBreaker({
      name: 'Progressive',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 45000, // 45 seconds
    }),
  };

  constructor() {
    this.logger.log('✅ [SemanticCircuitBreaker] Phase 10.113 Week 12 - Error recovery initialized');
    this.logDegradationChains();
  }

  // ==========================================================================
  // WRAPPER METHODS WITH FALLBACKS
  // ==========================================================================

  /**
   * Execute operation with Redis circuit breaker and fallback
   *
   * @param fn Primary operation using Redis
   * @param fallback Fallback operation when Redis unavailable
   * @returns Result from primary or fallback
   */
  async withRedis<T>(
    fn: () => Promise<T>,
    fallback: () => T | Promise<T>,
  ): Promise<T> {
    if (this.breakers.redis.isOpen) {
      this.logger.warn('[Redis] Circuit breaker open, using fallback');
      return fallback();
    }

    try {
      const result = await fn();
      this.breakers.redis.recordSuccess();
      return result;
    } catch (error) {
      this.breakers.redis.recordFailure();
      this.logger.warn(
        `[Redis] Operation failed: ${(error as Error).message}, using fallback`,
      );
      return fallback();
    }
  }

  /**
   * Execute operation with Worker Pool circuit breaker and fallback
   *
   * @param fn Primary operation using worker pool
   * @param fallback Fallback operation (sync or degraded)
   * @returns Result from primary or fallback
   */
  async withWorkerPool<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    if (this.breakers.workerPool.isOpen) {
      this.logger.warn('[WorkerPool] Circuit breaker open, using sync fallback');
      return fallback();
    }

    try {
      const result = await fn();
      this.breakers.workerPool.recordSuccess();
      return result;
    } catch (error) {
      this.breakers.workerPool.recordFailure();
      this.logger.warn(
        `[WorkerPool] Operation failed: ${(error as Error).message}, using sync fallback`,
      );
      return fallback();
    }
  }

  /**
   * Execute progressive ranking with circuit breaker and fallback
   *
   * @param fn Primary progressive ranking operation
   * @param fallback Single-pass ranking fallback
   * @returns Result from primary or fallback
   */
  async withProgressiveRanking<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    if (this.breakers.progressive.isOpen) {
      this.logger.warn('[Progressive] Circuit breaker open, using single-pass ranking');
      return fallback();
    }

    try {
      const result = await fn();
      this.breakers.progressive.recordSuccess();
      return result;
    } catch (error) {
      this.breakers.progressive.recordFailure();
      this.logger.warn(
        `[Progressive] Operation failed: ${(error as Error).message}, using single-pass ranking`,
      );
      return fallback();
    }
  }

  // ==========================================================================
  // MANUAL CONTROL
  // ==========================================================================

  /**
   * Force open a circuit (for manual intervention)
   */
  forceOpen(service: keyof typeof this.breakers): void {
    // Record enough failures to trigger open state
    const breaker = this.breakers[service];
    for (let i = 0; i < 10; i++) {
      breaker.recordFailure();
    }
    this.logger.warn(`[${service}] Circuit manually forced OPEN`);
  }

  /**
   * Reset a circuit (for manual intervention)
   */
  resetCircuit(service: keyof typeof this.breakers): void {
    this.breakers[service].reset();
    this.logger.log(`[${service}] Circuit manually reset`);
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    Object.keys(this.breakers).forEach((key) => {
      this.breakers[key as keyof typeof this.breakers].reset();
    });
    this.logger.log('All circuits reset');
  }

  // ==========================================================================
  // STATUS REPORTING
  // ==========================================================================

  /**
   * Get current degradation level for a service
   */
  getDegradationLevel(service: keyof typeof this.breakers): DegradationLevel {
    const stats = this.breakers[service].getStats();

    switch (stats.state) {
      case 'closed':
        return 'normal';
      case 'half-open':
        return 'degraded';
      case 'open':
        return 'fallback';
      default:
        return 'normal';
    }
  }

  /**
   * Get health status for all services
   */
  getServiceHealth(): ServiceHealth {
    return {
      redis: this.getDegradationLevel('redis'),
      workerPool: this.getDegradationLevel('workerPool'),
      progressive: this.getDegradationLevel('progressive'),
    };
  }

  /**
   * Get detailed circuit stats
   */
  getCircuitStats(): Record<string, CircuitStats> {
    return {
      redis: this.breakers.redis.getStats(),
      workerPool: this.breakers.workerPool.getStats(),
      progressive: this.breakers.progressive.getStats(),
    };
  }

  /**
   * Check if any service is degraded
   */
  isAnyDegraded(): boolean {
    const health = this.getServiceHealth();
    return (
      health.redis !== 'normal' ||
      health.workerPool !== 'normal' ||
      health.progressive !== 'normal'
    );
  }

  /**
   * Get summary for logging
   */
  getSummary(): string {
    const health = this.getServiceHealth();
    return [
      `redis=${health.redis}`,
      `worker=${health.workerPool}`,
      `progressive=${health.progressive}`,
    ].join(' | ');
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Log degradation chains at startup
   */
  private logDegradationChains(): void {
    this.logger.debug('Degradation chains configured:');

    Object.entries(DEGRADATION_CHAINS).forEach(([service, chain]) => {
      const levels = Object.values(chain).join(' → ');
      this.logger.debug(`  ${service}: ${levels}`);
    });
  }
}

// ============================================================================
// EMERGENCY ROLLBACK UTILITIES
// ============================================================================

/**
 * Emergency rollback interface for feature flags
 */
export interface EmergencyRollbackConfig {
  readonly feature: string;
  readonly reason: string;
  readonly timestamp: string;
  readonly triggeredBy: 'auto' | 'manual';
}

/**
 * Create emergency rollback config
 */
export function createRollbackConfig(
  feature: string,
  reason: string,
  auto: boolean = true,
): EmergencyRollbackConfig {
  return {
    feature,
    reason,
    timestamp: new Date().toISOString(),
    triggeredBy: auto ? 'auto' : 'manual',
  };
}
