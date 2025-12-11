/**
 * Adaptive Timeout Service
 * Phase 10.112 Week 4: Netflix-Grade Dynamic Timeout Management
 *
 * Features:
 * - Rolling window percentile calculation (P50, P95, P99)
 * - Per-operation timeout tracking
 * - Automatic timeout adjustment based on historical latency
 * - Spike detection and anomaly filtering
 * - Configurable safety margins
 *
 * Netflix Pattern:
 * - Timeouts adapt to actual service performance
 * - P99 latency used for safety, P95 for normal operations
 * - Prevents cascading failures from overly aggressive timeouts
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Latency sample with timestamp
 */
interface LatencySample {
  durationMs: number;
  timestamp: number;
  success: boolean;
}

/**
 * Percentile statistics for an operation
 */
export interface LatencyPercentiles {
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  sampleCount: number;
}

/**
 * Timeout recommendation
 */
export interface TimeoutRecommendation {
  baseTimeoutMs: number;
  recommendedTimeoutMs: number;
  safeTimeoutMs: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  percentiles: LatencyPercentiles;
}

/**
 * Operation metrics
 */
export interface OperationMetrics {
  operation: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  successRate: number;
  percentiles: LatencyPercentiles;
  currentTimeoutMs: number;
  lastUpdated: number;
}

@Injectable()
export class AdaptiveTimeoutService {
  private readonly logger = new Logger(AdaptiveTimeoutService.name);

  // Rolling window of latency samples per operation
  private readonly samples: Map<string, LatencySample[]> = new Map();

  // Current adaptive timeouts per operation
  private readonly timeouts: Map<string, number> = new Map();

  // Statistics tracking
  private readonly stats: Map<string, { success: number; failed: number; timeouts: number }> = new Map();

  // Configuration constants
  private static readonly WINDOW_SIZE_MS = 300000; // 5-minute rolling window
  private static readonly MAX_SAMPLES_PER_OPERATION = 1000;
  private static readonly MIN_SAMPLES_FOR_CONFIDENCE = 30;
  private static readonly SAFETY_MARGIN_MULTIPLIER = 1.5;
  private static readonly SPIKE_THRESHOLD_MULTIPLIER = 3.0;
  private static readonly MIN_TIMEOUT_MS = 1000;
  private static readonly MAX_TIMEOUT_MS = 120000;
  private static readonly CLEANUP_INTERVAL_MS = 60000;
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 100;
  private static readonly SIGNIFICANT_CHANGE_MS = 1000;
  private static readonly SAFE_TIMEOUT_MULTIPLIER = 2.0;
  private static readonly MIN_SAMPLES_FOR_SPIKE_FILTER = 10;

  // Default timeouts by operation type
  // Phase 10.115: PMC needs 65s for 300+ papers (esearch ~5s + 2 batches of efetch @ 25s each)
  private static readonly DEFAULT_TIMEOUTS: Record<string, number> = {
    'search:pubmed': 15000,
    'search:semantic_scholar': 15000,
    'search:openalex': 15000,
    'search:crossref': 15000,
    'search:core': 20000,
    'search:arxiv': 15000,
    'search:pmc': 65000,          // PMC full-text XML: esearch(5s) + 2x efetch(25s) + buffer
    'embedding:batch': 30000,
    'embedding:single': 5000,
    'enrichment:citations': 20000,
    'extraction:themes': 60000,
    'default': 30000,
  };

  constructor() {
    this.logger.log('[AdaptiveTimeout] Initialized with P95/P99 percentile tracking');

    // Periodic cleanup of stale samples
    const cleanupInterval = setInterval(
      () => this.cleanupStaleSamples(),
      AdaptiveTimeoutService.CLEANUP_INTERVAL_MS,
    );
    cleanupInterval.unref();
  }

  /**
   * Record a latency sample for an operation
   */
  recordLatency(operation: string, durationMs: number, success: boolean): void {
    // Initialize if needed
    if (!this.samples.has(operation)) {
      this.samples.set(operation, []);
      this.stats.set(operation, { success: 0, failed: 0, timeouts: 0 });
    }

    const samples = this.samples.get(operation)!;
    const stats = this.stats.get(operation)!;

    // Add sample
    samples.push({
      durationMs,
      timestamp: Date.now(),
      success,
    });

    // Update stats
    if (success) {
      stats.success++;
    } else {
      stats.failed++;
    }

    // Enforce max samples limit
    if (samples.length > AdaptiveTimeoutService.MAX_SAMPLES_PER_OPERATION) {
      samples.shift();
    }

    // Update adaptive timeout if we have enough samples
    if (samples.length >= AdaptiveTimeoutService.MIN_SAMPLES_FOR_CONFIDENCE) {
      this.updateAdaptiveTimeout(operation);
    }
  }

  /**
   * Record a timeout event
   */
  recordTimeout(operation: string): void {
    const stats = this.stats.get(operation);
    if (stats) {
      stats.timeouts++;
      stats.failed++;
    }
  }

  /**
   * Get the current timeout for an operation
   */
  getTimeout(operation: string): number {
    // Return adaptive timeout if available
    const adaptiveTimeout = this.timeouts.get(operation);
    if (adaptiveTimeout) {
      return adaptiveTimeout;
    }

    // Fall back to default timeout
    return AdaptiveTimeoutService.DEFAULT_TIMEOUTS[operation]
      ?? AdaptiveTimeoutService.DEFAULT_TIMEOUTS['default'];
  }

  /**
   * Get timeout recommendation with detailed analysis
   */
  getTimeoutRecommendation(operation: string): TimeoutRecommendation {
    const baseTimeout = AdaptiveTimeoutService.DEFAULT_TIMEOUTS[operation]
      ?? AdaptiveTimeoutService.DEFAULT_TIMEOUTS['default'];

    const samples = this.getValidSamples(operation);

    if (samples.length < AdaptiveTimeoutService.MIN_SAMPLES_FOR_CONFIDENCE) {
      return {
        baseTimeoutMs: baseTimeout,
        recommendedTimeoutMs: baseTimeout,
        safeTimeoutMs: Math.round(baseTimeout * AdaptiveTimeoutService.SAFETY_MARGIN_MULTIPLIER),
        confidence: 'low',
        reason: `Insufficient samples (${samples.length}/${AdaptiveTimeoutService.MIN_SAMPLES_FOR_CONFIDENCE})`,
        percentiles: this.calculatePercentiles(samples),
      };
    }

    const percentiles = this.calculatePercentiles(samples);
    const recommendedTimeout = this.calculateRecommendedTimeout(percentiles);
    const safeTimeout = this.calculateSafeTimeout(percentiles);

    const confidence = samples.length >= AdaptiveTimeoutService.HIGH_CONFIDENCE_THRESHOLD ? 'high' : 'medium';

    return {
      baseTimeoutMs: baseTimeout,
      recommendedTimeoutMs: recommendedTimeout,
      safeTimeoutMs: safeTimeout,
      confidence,
      reason: `Based on ${samples.length} samples (P95=${percentiles.p95.toFixed(0)}ms, P99=${percentiles.p99.toFixed(0)}ms)`,
      percentiles,
    };
  }

  /**
   * Get metrics for all operations
   */
  getAllMetrics(): OperationMetrics[] {
    const metrics: OperationMetrics[] = [];

    for (const [operation, samples] of this.samples.entries()) {
      const validSamples = this.filterValidSamples(samples);
      const stats = this.stats.get(operation) ?? { success: 0, failed: 0, timeouts: 0 };
      const totalRequests = stats.success + stats.failed;

      metrics.push({
        operation,
        totalRequests,
        successfulRequests: stats.success,
        failedRequests: stats.failed,
        timeouts: stats.timeouts,
        successRate: totalRequests > 0 ? (stats.success / totalRequests) * 100 : 0,
        percentiles: this.calculatePercentiles(validSamples),
        currentTimeoutMs: this.getTimeout(operation),
        lastUpdated: validSamples.length > 0
          ? Math.max(...validSamples.map(s => s.timestamp))
          : 0,
      });
    }

    return metrics;
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operation: string): OperationMetrics | null {
    const samples = this.samples.get(operation);
    if (!samples) {
      return null;
    }

    const validSamples = this.filterValidSamples(samples);
    const stats = this.stats.get(operation) ?? { success: 0, failed: 0, timeouts: 0 };
    const totalRequests = stats.success + stats.failed;

    return {
      operation,
      totalRequests,
      successfulRequests: stats.success,
      failedRequests: stats.failed,
      timeouts: stats.timeouts,
      successRate: totalRequests > 0 ? (stats.success / totalRequests) * 100 : 0,
      percentiles: this.calculatePercentiles(validSamples),
      currentTimeoutMs: this.getTimeout(operation),
      lastUpdated: validSamples.length > 0
        ? Math.max(...validSamples.map(s => s.timestamp))
        : 0,
    };
  }

  /**
   * Reset statistics for an operation
   */
  resetOperation(operation: string): void {
    this.samples.delete(operation);
    this.timeouts.delete(operation);
    this.stats.delete(operation);
  }

  /**
   * Reset all statistics
   */
  resetAll(): void {
    this.samples.clear();
    this.timeouts.clear();
    this.stats.clear();
  }

  /**
   * Update the adaptive timeout for an operation
   */
  private updateAdaptiveTimeout(operation: string): void {
    const samples = this.getValidSamples(operation);
    if (samples.length < AdaptiveTimeoutService.MIN_SAMPLES_FOR_CONFIDENCE) {
      return;
    }

    const percentiles = this.calculatePercentiles(samples);
    const newTimeout = this.calculateRecommendedTimeout(percentiles);

    const oldTimeout = this.timeouts.get(operation);
    this.timeouts.set(operation, newTimeout);

    // Log significant changes
    if (oldTimeout && Math.abs(newTimeout - oldTimeout) > AdaptiveTimeoutService.SIGNIFICANT_CHANGE_MS) {
      this.logger.log(
        `[AdaptiveTimeout] ${operation}: ${oldTimeout}ms → ${newTimeout}ms ` +
        `(P95=${percentiles.p95.toFixed(0)}ms, P99=${percentiles.p99.toFixed(0)}ms)`
      );
    }
  }

  /**
   * Calculate percentile statistics from samples
   */
  private calculatePercentiles(samples: LatencySample[]): LatencyPercentiles {
    if (samples.length === 0) {
      return {
        p50: 0,
        p75: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        mean: 0,
        stdDev: 0,
        sampleCount: 0,
      };
    }

    // Filter successful samples only for latency calculation
    const successSamples = samples.filter(s => s.success);
    if (successSamples.length === 0) {
      return {
        p50: 0,
        p75: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        mean: 0,
        stdDev: 0,
        sampleCount: samples.length,
      };
    }

    const durations = successSamples.map(s => s.durationMs).sort((a, b) => a - b);
    const n = durations.length;

    // Calculate percentiles
    const p50 = this.getPercentile(durations, 50);
    const p75 = this.getPercentile(durations, 75);
    const p95 = this.getPercentile(durations, 95);
    const p99 = this.getPercentile(durations, 99);

    // Calculate mean and stdDev
    const mean = durations.reduce((a, b) => a + b, 0) / n;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      p50,
      p75,
      p95,
      p99,
      min: durations[0],
      max: durations[n - 1],
      mean,
      stdDev,
      sampleCount: samples.length,
    };
  }

  /**
   * Get a specific percentile value from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    if (sortedArray.length === 1) return sortedArray[0];

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate recommended timeout (P95 + margin)
   */
  private calculateRecommendedTimeout(percentiles: LatencyPercentiles): number {
    // Use P95 with safety margin
    const recommended = percentiles.p95 * AdaptiveTimeoutService.SAFETY_MARGIN_MULTIPLIER;

    // Clamp to valid range
    return Math.min(
      AdaptiveTimeoutService.MAX_TIMEOUT_MS,
      Math.max(AdaptiveTimeoutService.MIN_TIMEOUT_MS, Math.round(recommended))
    );
  }

  /**
   * Calculate safe timeout (P99 + larger margin)
   */
  private calculateSafeTimeout(percentiles: LatencyPercentiles): number {
    // Use P99 with larger safety margin for critical operations
    const safe = percentiles.p99 * AdaptiveTimeoutService.SAFE_TIMEOUT_MULTIPLIER;

    // Clamp to valid range
    return Math.min(
      AdaptiveTimeoutService.MAX_TIMEOUT_MS,
      Math.max(AdaptiveTimeoutService.MIN_TIMEOUT_MS, Math.round(safe))
    );
  }

  /**
   * Get valid samples within the rolling window
   */
  private getValidSamples(operation: string): LatencySample[] {
    const samples = this.samples.get(operation);
    if (!samples) return [];
    return this.filterValidSamples(samples);
  }

  /**
   * Filter samples to only include those within the rolling window
   * Also removes anomalous spikes
   */
  private filterValidSamples(samples: LatencySample[]): LatencySample[] {
    const now = Date.now();
    const cutoff = now - AdaptiveTimeoutService.WINDOW_SIZE_MS;

    // First filter by time window
    const recentSamples = samples.filter(s => s.timestamp >= cutoff);

    // If not enough samples, don't filter spikes
    if (recentSamples.length < AdaptiveTimeoutService.MIN_SAMPLES_FOR_SPIKE_FILTER) {
      return recentSamples;
    }

    // Calculate median for spike detection
    const durations = recentSamples
      .filter(s => s.success)
      .map(s => s.durationMs)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return recentSamples;
    }

    const median = durations[Math.floor(durations.length / 2)];
    const spikeThreshold = median * AdaptiveTimeoutService.SPIKE_THRESHOLD_MULTIPLIER;

    // Filter out anomalous spikes
    return recentSamples.filter(s =>
      !s.success || s.durationMs <= spikeThreshold
    );
  }

  /**
   * Cleanup stale samples from all operations
   */
  private cleanupStaleSamples(): void {
    const now = Date.now();
    const cutoff = now - AdaptiveTimeoutService.WINDOW_SIZE_MS;
    let totalRemoved = 0;

    for (const [operation, samples] of this.samples.entries()) {
      const beforeCount = samples.length;
      const filtered = samples.filter(s => s.timestamp >= cutoff);
      this.samples.set(operation, filtered);
      totalRemoved += beforeCount - filtered.length;
    }

    if (totalRemoved > 0) {
      this.logger.debug(`[AdaptiveTimeout] Cleaned up ${totalRemoved} stale samples`);
    }
  }

  /**
   * Log current timeout status
   */
  logStatus(): void {
    const metrics = this.getAllMetrics();

    this.logger.log(
      `[AdaptiveTimeout] Status: ${metrics.length} operations tracked`
    );

    for (const m of metrics) {
      this.logger.log(
        `  ${m.operation}: timeout=${m.currentTimeoutMs}ms, ` +
        `P95=${m.percentiles.p95.toFixed(0)}ms, P99=${m.percentiles.p99.toFixed(0)}ms, ` +
        `success=${m.successRate.toFixed(1)}%, samples=${m.percentiles.sampleCount}`
      );
    }
  }
}
