/**
 * Base AI Provider
 * Phase 10.190: Netflix-Grade Unified AI Service
 *
 * Abstract base class providing common functionality for all AI providers:
 * - Circuit breaker pattern
 * - Metrics collection
 * - Health status tracking
 * - Latency percentile calculation
 *
 * Extends this class to implement specific providers.
 */

import { Logger } from '@nestjs/common';
import {
  AIProvider,
  AICompletionOptions,
  AIResponse,
  ProviderHealthStatus,
  ProviderMetrics,
  ProviderConfig,
} from './ai-provider.interface';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

/**
 * Latency sample for percentile calculation
 */
interface LatencySample {
  latencyMs: number;
  timestamp: number;
}

/**
 * Abstract base class for AI providers
 */
export abstract class BaseAIProvider implements AIProvider {
  protected readonly logger: Logger;

  // Provider identification
  abstract readonly name: string;
  abstract readonly costPer1MInputTokens: number;
  abstract readonly costPer1MOutputTokens: number;
  abstract readonly priority: number;

  // Configuration
  protected readonly config: ProviderConfig;

  // Circuit breaker state
  private circuitState: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTimestamp = 0;
  private halfOpenRequestInFlight = false;

  // Metrics
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalCostUsd = 0;

  // Latency tracking (rolling window)
  private readonly latencySamples: LatencySample[] = [];
  private static readonly MAX_LATENCY_SAMPLES = 100;
  private static readonly LATENCY_WINDOW_MS = 300000; // 5 minutes

  // Health status
  private lastHealthCheck = 0;
  private lastHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  constructor(providerName: string, config: ProviderConfig) {
    this.logger = new Logger(`AIProvider:${providerName}`);
    this.config = config;
  }

  /**
   * Check if provider is available (API key configured)
   * Must be implemented by subclass
   */
  abstract isAvailable(): boolean;

  /**
   * Generate AI completion
   * Must be implemented by subclass
   */
  abstract generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AIResponse>;

  /**
   * Check if provider is healthy
   */
  async isHealthy(): Promise<boolean> {
    // If circuit is open, provider is unhealthy
    if (this.circuitState === CircuitState.OPEN) {
      // Check if we should transition to half-open
      const timeSinceFailure = Date.now() - this.lastFailureTimestamp;
      if (timeSinceFailure >= this.config.circuitBreakerResetMs) {
        this.circuitState = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit breaker transitioning to HALF_OPEN for ${this.name}`);
        return true; // Allow one test request
      }
      return false;
    }

    // Check error rate
    const errorRate = this.getErrorRate();
    if (errorRate > 0.5) {
      this.lastHealthStatus = 'unhealthy';
      return false;
    }
    if (errorRate > 0.2) {
      this.lastHealthStatus = 'degraded';
      return true;
    }

    this.lastHealthStatus = 'healthy';
    return true;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): ProviderHealthStatus {
    return {
      status: this.lastHealthStatus,
      latencyMs: this.getAverageLatency(),
      errorRate: this.getErrorRate(),
      lastCheckTimestamp: this.lastHealthCheck,
      circuitBreakerState: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Get provider metrics
   */
  getMetrics(): ProviderMetrics {
    const percentiles = this.calculateLatencyPercentiles();
    const rpm = this.calculateRequestsPerMinute();

    return {
      provider: this.name,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      totalCostUsd: this.totalCostUsd,
      avgLatencyMs: percentiles.avg,
      p95LatencyMs: percentiles.p95,
      p99LatencyMs: percentiles.p99,
      circuitBreakerState: this.circuitState,
      requestsPerMinute: rpm,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalCostUsd = 0;
    this.latencySamples.length = 0;
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
  }

  /**
   * Record successful request
   */
  recordSuccess(latencyMs: number, cost: number): void {
    this.totalRequests++;
    this.successfulRequests++;
    this.totalCostUsd += cost;
    this.consecutiveFailures = 0;

    // Record latency sample
    this.addLatencySample(latencyMs);

    // If in half-open, transition to closed
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED;
      this.halfOpenRequestInFlight = false;
      this.logger.log(`Circuit breaker CLOSED for ${this.name} - Service recovered`);
    }

    this.lastHealthCheck = Date.now();
    this.lastHealthStatus = 'healthy';
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.totalRequests++;
    this.failedRequests++;
    this.consecutiveFailures++;
    this.lastFailureTimestamp = Date.now();

    // Check if circuit should open
    if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      if (this.circuitState !== CircuitState.OPEN) {
        this.circuitState = CircuitState.OPEN;
        this.logger.warn(
          `Circuit breaker OPEN for ${this.name} - ${this.consecutiveFailures} consecutive failures`,
        );
      }
    }

    // If in half-open and failed, go back to open
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.OPEN;
      this.halfOpenRequestInFlight = false;
      this.logger.warn(`Circuit breaker re-opened for ${this.name} - Recovery failed`);
    }

    this.lastHealthCheck = Date.now();
  }

  /**
   * Check if circuit breaker allows request
   */
  protected canMakeRequest(): boolean {
    if (this.circuitState === CircuitState.CLOSED) {
      return true;
    }

    if (this.circuitState === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTimestamp;
      if (timeSinceFailure >= this.config.circuitBreakerResetMs) {
        // Transition to half-open
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenRequestInFlight = true;
        this.logger.log(`Circuit breaker HALF_OPEN for ${this.name} - Testing recovery`);
        return true;
      }
      return false;
    }

    // Half-open: only allow one request at a time
    if (this.circuitState === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequestInFlight) {
        return false; // Block concurrent requests during test
      }
      this.halfOpenRequestInFlight = true;
      return true;
    }

    return false;
  }

  /**
   * Calculate cost from token usage
   */
  protected calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.costPer1MInputTokens;
    const outputCost = (outputTokens / 1_000_000) * this.costPer1MOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Add latency sample to rolling window
   */
  private addLatencySample(latencyMs: number): void {
    const now = Date.now();

    // Remove old samples
    while (
      this.latencySamples.length > 0 &&
      now - this.latencySamples[0].timestamp > BaseAIProvider.LATENCY_WINDOW_MS
    ) {
      this.latencySamples.shift();
    }

    // Add new sample
    this.latencySamples.push({ latencyMs, timestamp: now });

    // Enforce max samples
    while (this.latencySamples.length > BaseAIProvider.MAX_LATENCY_SAMPLES) {
      this.latencySamples.shift();
    }
  }

  /**
   * Get error rate (0-1)
   */
  private getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.failedRequests / this.totalRequests;
  }

  /**
   * Get average latency
   */
  private getAverageLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    const sum = this.latencySamples.reduce((acc, s) => acc + s.latencyMs, 0);
    return sum / this.latencySamples.length;
  }

  /**
   * Calculate latency percentiles
   */
  private calculateLatencyPercentiles(): { avg: number; p95: number; p99: number } {
    if (this.latencySamples.length === 0) {
      return { avg: 0, p95: 0, p99: 0 };
    }

    const sorted = this.latencySamples
      .map((s) => s.latencyMs)
      .sort((a, b) => a - b);

    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      avg,
      p95: sorted[Math.min(p95Index, sorted.length - 1)],
      p99: sorted[Math.min(p99Index, sorted.length - 1)],
    };
  }

  /**
   * Calculate requests per minute (rolling window)
   */
  private calculateRequestsPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentSamples = this.latencySamples.filter(
      (s) => s.timestamp >= oneMinuteAgo,
    );

    return recentSamples.length;
  }
}
