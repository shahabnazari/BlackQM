/**
 * Phase 10.113 Week 12: Semantic Performance Metrics
 *
 * Netflix-grade production monitoring for Week 11 progressive semantic features.
 * Tracks tier latencies, cache performance, worker utilization, and SLA compliance.
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 12
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPE DEFINITIONS - Netflix-grade strict typing
// ============================================================================

/**
 * Semantic tier names for latency tracking
 */
type SemanticTierName = 'immediate' | 'refined' | 'complete';

/**
 * Rolling window for percentile calculations
 */
interface RollingWindowConfig {
  /** Maximum entries to track */
  readonly size: number;
}

/**
 * SLA compliance status
 */
interface SLAStatus {
  /** Tier 1 (immediate) p95 < 1500ms */
  readonly tier1: boolean;
  /** Tier 2 (refined) p95 < 3000ms */
  readonly tier2: boolean;
  /** Cache hit rate > 50% */
  readonly cacheHitRate: boolean;
  /** Error rate < 1% */
  readonly errorRate: boolean;
  /** Overall SLA compliance */
  readonly overall: boolean;
}

/**
 * Worker health snapshot
 */
interface WorkerHealthSnapshot {
  /** Worker ID */
  readonly workerId: number;
  /** Tasks completed */
  readonly tasksCompleted: number;
  /** Error count */
  readonly errors: number;
  /** Is worker healthy */
  readonly healthy: boolean;
}

/**
 * Complete semantic performance report
 */
export interface SemanticPerformanceReport {
  /** Tier 1 p95 latency (ms) */
  readonly tier1P95: number;
  /** Tier 2 p95 latency (ms) */
  readonly tier2P95: number;
  /** Tier 3 p95 latency (ms) */
  readonly tier3P95: number;
  /** Cache hit rate (0-1) */
  readonly cacheHitRate: number;
  /** Worker utilization (0-1, 1 = perfect distribution) */
  readonly workerUtilization: number;
  /** SLA compliance status */
  readonly slaCompliance: SLAStatus;
  /** Error rate (0-1) */
  readonly errorRate: number;
  /** Report timestamp */
  readonly timestamp: string;
}

/**
 * Semantic health response for API
 */
export interface SemanticHealthResponse {
  /** Overall health status */
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  /** Worker health snapshots */
  readonly workers: readonly WorkerHealthSnapshot[];
  /** Key metrics summary */
  readonly metrics: {
    readonly tier1P95Ms: number;
    readonly tier2P95Ms: number;
    readonly cacheHitRate: number;
    readonly errorRate: number;
  };
  /** SLA compliance */
  readonly slaCompliance: SLAStatus;
  /** Response timestamp */
  readonly timestamp: string;
}

// ============================================================================
// ROLLING WINDOW CLASS
// ============================================================================

/**
 * Fixed-size rolling window for latency tracking
 * Supports percentile calculations for SLA monitoring
 */
class RollingWindow {
  private readonly values: number[] = [];
  private readonly size: number;

  constructor(config: RollingWindowConfig) {
    this.size = config.size;
  }

  /**
   * Add a value to the window
   */
  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.size) {
      this.values.shift();
    }
  }

  /**
   * Calculate percentile (e.g., 95 for p95)
   */
  percentile(p: number): number {
    if (this.values.length === 0) return 0;

    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }

  /**
   * Get current count
   */
  count(): number {
    return this.values.length;
  }

  /**
   * Get average value
   */
  average(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((sum, v) => sum + v, 0) / this.values.length;
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.values.length = 0;
  }
}

// ============================================================================
// SLA TARGETS
// ============================================================================

/**
 * Target SLAs for semantic ranking
 *
 * - Tier 1 (immediate): p95 < 1500ms
 * - Tier 2 (refined): p95 < 3000ms
 * - Tier 3 (complete): p95 < 10000ms (background, more lenient)
 * - Cache hit rate: > 50%
 * - Worker error rate: < 1%
 */
const SLA_TARGETS = {
  tier1P95Ms: 1500,
  tier2P95Ms: 3000,
  tier3P95Ms: 10000,
  minCacheHitRate: 0.5,
  maxErrorRate: 0.01,
} as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class SemanticMetricsService {
  private readonly logger = new Logger(SemanticMetricsService.name);

  /**
   * Tier latency windows (last 1000 measurements)
   */
  private readonly tierLatencies = {
    immediate: new RollingWindow({ size: 1000 }),
    refined: new RollingWindow({ size: 1000 }),
    complete: new RollingWindow({ size: 1000 }),
  } as const;

  /**
   * Cache metrics
   */
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Worker metrics (Map<workerId, { completed, errors }>)
   */
  private readonly workerMetrics = new Map<number, { completed: number; errors: number }>();

  /**
   * Search totals
   */
  private totalSearches = 0;
  private failedSearches = 0;

  constructor() {
    this.logger.log('✅ [SemanticMetricsService] Phase 10.113 Week 12 - Production monitoring initialized');
  }

  // ==========================================================================
  // RECORDING METHODS
  // ==========================================================================

  /**
   * Record latency for a semantic tier
   */
  recordTierLatency(tier: SemanticTierName, latencyMs: number): void {
    const window = this.tierLatencies[tier];
    window.add(latencyMs);

    // Log if exceeding SLA
    const p95 = window.percentile(95);
    const target = SLA_TARGETS[`${tier === 'immediate' ? 'tier1' : tier === 'refined' ? 'tier2' : 'tier3'}P95Ms`];

    if (p95 > target) {
      this.logger.warn(
        `[SLA Violation] ${tier} tier p95 (${p95.toFixed(0)}ms) exceeds target (${target}ms)`,
      );
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record worker task completion
   */
  recordWorkerTask(workerId: number, success: boolean): void {
    const current = this.workerMetrics.get(workerId) ?? { completed: 0, errors: 0 };

    if (success) {
      current.completed++;
    } else {
      current.errors++;
    }

    this.workerMetrics.set(workerId, current);
  }

  /**
   * Record search attempt
   */
  recordSearchAttempt(success: boolean): void {
    this.totalSearches++;
    if (!success) {
      this.failedSearches++;
    }
  }

  // ==========================================================================
  // REPORTING METHODS
  // ==========================================================================

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): SemanticPerformanceReport {
    const tier1P95 = this.tierLatencies.immediate.percentile(95);
    const tier2P95 = this.tierLatencies.refined.percentile(95);
    const tier3P95 = this.tierLatencies.complete.percentile(95);
    const cacheHitRate = this.calculateCacheHitRate();
    const errorRate = this.calculateErrorRate();
    const workerUtilization = this.calculateWorkerUtilization();

    const slaCompliance = this.checkSLACompliance(
      tier1P95,
      tier2P95,
      cacheHitRate,
      errorRate,
    );

    return {
      tier1P95,
      tier2P95,
      tier3P95,
      cacheHitRate,
      workerUtilization,
      slaCompliance,
      errorRate,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health status for health check endpoint
   */
  getHealthResponse(): SemanticHealthResponse {
    const report = this.getPerformanceReport();
    const workers = this.getWorkerHealthSnapshots();

    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (report.slaCompliance.overall) {
      status = 'healthy';
    } else if (report.slaCompliance.tier1 || report.slaCompliance.cacheHitRate) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      workers,
      metrics: {
        tier1P95Ms: report.tier1P95,
        tier2P95Ms: report.tier2P95,
        cacheHitRate: report.cacheHitRate,
        errorRate: report.errorRate,
      },
      slaCompliance: report.slaCompliance,
      timestamp: report.timestamp,
    };
  }

  /**
   * Get worker health snapshots
   */
  getWorkerHealthSnapshots(): readonly WorkerHealthSnapshot[] {
    const snapshots: WorkerHealthSnapshot[] = [];

    this.workerMetrics.forEach((metrics, workerId) => {
      const total = metrics.completed + metrics.errors;
      const errorRate = total > 0 ? metrics.errors / total : 0;

      snapshots.push({
        workerId,
        tasksCompleted: metrics.completed,
        errors: metrics.errors,
        healthy: errorRate < SLA_TARGETS.maxErrorRate,
      });
    });

    return snapshots;
  }

  // ==========================================================================
  // PRIVATE CALCULATION METHODS
  // ==========================================================================

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return this.cacheHits / total;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    if (this.totalSearches === 0) return 0;
    return this.failedSearches / this.totalSearches;
  }

  /**
   * Calculate worker utilization
   *
   * Perfect utilization (1.0) means work is evenly distributed.
   * Low variance = good distribution = high utilization.
   */
  private calculateWorkerUtilization(): number {
    const tasks = Array.from(this.workerMetrics.values()).map((m) => m.completed);

    if (tasks.length === 0) return 0;

    const total = tasks.reduce((a, b) => a + b, 0);
    const avg = total / tasks.length;

    if (avg === 0) return 0;

    // Calculate variance
    const variance = tasks.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / tasks.length;

    // Coefficient of variation (normalized standard deviation)
    const cv = Math.sqrt(variance) / avg;

    // Convert to utilization score (low CV = high utilization)
    // CV of 0 = 100% utilization, CV of 1 = 0% utilization
    return Math.max(0, 1 - cv);
  }

  /**
   * Check SLA compliance
   */
  private checkSLACompliance(
    tier1P95: number,
    tier2P95: number,
    cacheHitRate: number,
    errorRate: number,
  ): SLAStatus {
    const tier1 = tier1P95 < SLA_TARGETS.tier1P95Ms;
    const tier2 = tier2P95 < SLA_TARGETS.tier2P95Ms;
    const cacheOk = cacheHitRate > SLA_TARGETS.minCacheHitRate;
    const errorOk = errorRate < SLA_TARGETS.maxErrorRate;

    return {
      tier1,
      tier2,
      cacheHitRate: cacheOk,
      errorRate: errorOk,
      overall: tier1 && tier2 && cacheOk && errorOk,
    };
  }

  // ==========================================================================
  // RESET METHODS (for testing)
  // ==========================================================================

  /**
   * Reset all metrics (for testing)
   */
  resetMetrics(): void {
    this.tierLatencies.immediate.clear();
    this.tierLatencies.refined.clear();
    this.tierLatencies.complete.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.workerMetrics.clear();
    this.totalSearches = 0;
    this.failedSearches = 0;

    this.logger.log('[SemanticMetricsService] Metrics reset');
  }

  /**
   * Get summary for logging
   */
  getSummary(): string {
    const report = this.getPerformanceReport();
    return [
      `tier1_p95=${report.tier1P95.toFixed(0)}ms`,
      `tier2_p95=${report.tier2P95.toFixed(0)}ms`,
      `cache_hit=${(report.cacheHitRate * 100).toFixed(1)}%`,
      `error_rate=${(report.errorRate * 100).toFixed(2)}%`,
      `sla=${report.slaCompliance.overall ? 'OK' : 'VIOLATION'}`,
    ].join(' | ');
  }
}
