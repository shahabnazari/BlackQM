/**
 * Phase 10.170 Week 4: Purpose-Aware Circuit Breaker Service
 *
 * Netflix-grade circuit breaker for purpose-aware pipeline external dependencies.
 * Protects against cascading failures in Unpaywall, publisher scraping, and AI verification.
 *
 * CIRCUIT STATES:
 * - Closed: Normal operation, requests pass through
 * - Open: Failures exceeded threshold, requests fail fast with fallback
 * - Half-Open: Testing recovery, limited requests allowed
 *
 * DEGRADATION CHAINS:
 * - Unpaywall: API → cached → skip tier
 * - Publisher: scrape → cached → skip tier
 * - AI Verification: GPT-4 → heuristic → skip verification
 *
 * @module purpose-aware-circuit-breaker.service
 * @since Phase 10.170 Week 4
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  PurposeAwareCircuitName,
  CircuitBreakerStatus,
} from '../types/purpose-aware-metrics.types';
import { PurposeAwareMetricsService } from './purpose-aware-metrics.service';

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

/**
 * Individual circuit breaker implementation
 * 3-state model: closed → open → half-open → closed
 */
class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly logger: Logger;

  constructor(private readonly config: CircuitBreakerConfig) {
    this.logger = new Logger(`CircuitBreaker:${config.name}`);
  }

  /**
   * Check if circuit is open (blocking requests)
   */
  get isOpen(): boolean {
    if (this.state === 'open') {
      // Check if timeout has passed for recovery attempt
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
   * Get current state
   */
  get currentState(): CircuitState {
    // Check for timeout-based state transition
    if (this.state === 'open' && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = 'half-open';
      }
    }
    return this.state;
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
        this.logger.log(
          `[${this.config.name}] Circuit CLOSED after ${this.config.successThreshold} successes`
        );
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
          `[${this.config.name}] Circuit OPENED after ${this.config.failureThreshold} failures`
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
    this.logger.log(`[${this.config.name}] Circuit manually RESET`);
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.currentState,
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
// CIRCUIT CONFIGURATIONS
// ============================================================================

/**
 * Circuit breaker configurations for each external dependency
 */
const CIRCUIT_CONFIGS: Record<PurposeAwareCircuitName, CircuitBreakerConfig> = {
  unpaywall: {
    name: 'Unpaywall',
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000, // 30 seconds
  },
  publisher: {
    name: 'Publisher',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 45000, // 45 seconds
  },
  aiVerification: {
    name: 'AIVerification',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000, // 60 seconds
  },
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareCircuitBreakerService {
  private readonly logger = new Logger(PurposeAwareCircuitBreakerService.name);

  // Circuit breakers for each external dependency
  private readonly breakers: Record<PurposeAwareCircuitName, CircuitBreaker>;

  constructor(
    @Optional() private readonly metricsService?: PurposeAwareMetricsService,
  ) {
    // Initialize circuit breakers
    this.breakers = {
      unpaywall: new CircuitBreaker(CIRCUIT_CONFIGS.unpaywall),
      publisher: new CircuitBreaker(CIRCUIT_CONFIGS.publisher),
      aiVerification: new CircuitBreaker(CIRCUIT_CONFIGS.aiVerification),
    };

    this.logger.log('✅ [PurposeAwareCircuitBreaker] Phase 10.170 Week 4 - Service initialized');
    this.logger.log(
      `[PurposeAwareCircuitBreaker] Circuits: unpaywall (${CIRCUIT_CONFIGS.unpaywall.failureThreshold}f/${CIRCUIT_CONFIGS.unpaywall.successThreshold}s), ` +
      `publisher (${CIRCUIT_CONFIGS.publisher.failureThreshold}f/${CIRCUIT_CONFIGS.publisher.successThreshold}s), ` +
      `aiVerification (${CIRCUIT_CONFIGS.aiVerification.failureThreshold}f/${CIRCUIT_CONFIGS.aiVerification.successThreshold}s)`
    );
  }

  // ==========================================================================
  // WRAPPER METHODS
  // ==========================================================================

  /**
   * Execute operation with Unpaywall circuit breaker
   *
   * Degradation chain: API → cached result → skip tier
   *
   * @param operation Primary operation to execute
   * @param fallback Fallback function if circuit is open
   * @returns Operation result or fallback result
   */
  async withUnpaywall<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    return this.executeWithBreaker('unpaywall', operation, fallback);
  }

  /**
   * Execute operation with Publisher scraping circuit breaker
   *
   * Degradation chain: scrape → cached result → skip tier
   *
   * @param operation Primary operation to execute
   * @param fallback Fallback function if circuit is open
   * @returns Operation result or fallback result
   */
  async withPublisherScraping<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    return this.executeWithBreaker('publisher', operation, fallback);
  }

  /**
   * Execute operation with AI Verification circuit breaker
   *
   * Degradation chain: GPT-4 → heuristic fallback → skip verification
   *
   * @param operation Primary operation to execute
   * @param fallback Fallback function if circuit is open
   * @returns Operation result or fallback result
   */
  async withAIVerification<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    return this.executeWithBreaker('aiVerification', operation, fallback);
  }

  // ==========================================================================
  // STATUS METHODS
  // ==========================================================================

  /**
   * Get circuit breaker status for all circuits
   */
  getCircuitStatus(): CircuitBreakerStatus {
    const circuits: Record<PurposeAwareCircuitName, CircuitBreakerStats> = {
      unpaywall: this.breakers.unpaywall.getStats(),
      publisher: this.breakers.publisher.getStats(),
      aiVerification: this.breakers.aiVerification.getStats(),
    };

    // Determine overall health
    const states = Object.values(circuits).map(c => c.state);
    const openCount = states.filter(s => s === 'open').length;
    const halfOpenCount = states.filter(s => s === 'half-open').length;

    let degradationLevel: 'normal' | 'degraded' | 'critical';
    if (openCount >= 2) {
      degradationLevel = 'critical';
    } else if (openCount >= 1 || halfOpenCount >= 2) {
      degradationLevel = 'degraded';
    } else {
      degradationLevel = 'normal';
    }

    return {
      circuits,
      healthy: degradationLevel === 'normal',
      degradationLevel,
    };
  }

  /**
   * Check if a specific circuit is open
   */
  isCircuitOpen(name: PurposeAwareCircuitName): boolean {
    return this.breakers[name].isOpen;
  }

  /**
   * Get stats for a specific circuit
   */
  getCircuitStats(name: PurposeAwareCircuitName): CircuitBreakerStats {
    return this.breakers[name].getStats();
  }

  /**
   * Reset a specific circuit
   */
  resetCircuit(name: PurposeAwareCircuitName): void {
    this.breakers[name].reset();
    this.logger.log(`[PurposeAwareCircuitBreaker] Circuit ${name} reset by request`);
  }

  /**
   * Reset all circuits
   */
  resetAllCircuits(): void {
    for (const name of Object.keys(this.breakers) as PurposeAwareCircuitName[]) {
      this.breakers[name].reset();
    }
    this.logger.log('[PurposeAwareCircuitBreaker] All circuits reset by request');
  }

  /**
   * Get one-line summary for logging
   */
  getSummary(): string {
    const status = this.getCircuitStatus();
    const circuitSummary = Object.entries(status.circuits)
      .map(([name, stats]) => `${name}:${stats.state}`)
      .join(', ');
    return `[CircuitBreaker] ${circuitSummary}, level=${status.degradationLevel}`;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Execute operation with circuit breaker protection
   */
  private async executeWithBreaker<T>(
    name: PurposeAwareCircuitName,
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    const breaker = this.breakers[name];

    // Check if circuit is open
    if (breaker.isOpen) {
      this.logger.debug(`[${name}] Circuit OPEN, using fallback`);
      return fallback();
    }

    try {
      const startTime = Date.now();
      const result = await operation();
      const durationMs = Date.now() - startTime;

      // Record success
      breaker.recordSuccess();

      // Record metrics based on circuit type
      if (name === 'unpaywall') {
        this.metricsService?.recordDetectionAttempt('unpaywall', true, durationMs);
      } else if (name === 'publisher') {
        this.metricsService?.recordDetectionAttempt('publisher_html', true, durationMs);
      } else if (name === 'aiVerification') {
        this.metricsService?.recordDetectionAttempt('ai_verification', true, durationMs);
      }

      return result;
    } catch (error) {
      // Record failure
      breaker.recordFailure();
      this.metricsService?.recordError();

      this.logger.warn(
        `[${name}] Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Execute fallback
      this.logger.debug(`[${name}] Executing fallback`);
      return fallback();
    }
  }
}
