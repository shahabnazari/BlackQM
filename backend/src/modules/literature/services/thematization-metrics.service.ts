/**
 * Phase 10.113 Week 8: Thematization Metrics Service
 *
 * Netflix-grade Prometheus-compatible metrics for the thematization pipeline.
 * Tracks business metrics, performance metrics, and error rates.
 *
 * ============================================================================
 * METRICS EXPORTED
 * ============================================================================
 *
 * Counters (Monotonically Increasing):
 * - thematization_jobs_total{tier, status}
 * - thematization_papers_processed_total{tier}
 * - thematization_themes_extracted_total{tier}
 * - thematization_claims_extracted_total{tier}
 * - thematization_credits_consumed_total{tier, subscription}
 * - thematization_errors_total{stage, error_type}
 *
 * Gauges (Point-in-Time):
 * - thematization_active_jobs
 * - thematization_queue_depth
 * - thematization_avg_processing_time_seconds{tier}
 *
 * Histograms (Distribution):
 * - thematization_duration_seconds{tier, stage}
 * - thematization_theme_confidence{tier}
 * - thematization_claim_potential{tier}
 *
 * @module ThematizationMetricsService
 * @since Phase 10.113 Week 8
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { MetricsService } from '../../../common/services/metrics.service';

import {
  ThematizationTierCount,
  ThematizationPipelineStage,
} from '../types/unified-thematization.types';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing)
// ============================================================================

/**
 * Job completion status for metrics
 */
export type ThematizationJobStatus = 'completed' | 'failed' | 'cancelled' | 'timeout';

/**
 * Subscription tier for metrics labels
 */
export type ThematizationSubscription = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

/**
 * Error types for classification
 */
export type ThematizationErrorType =
  | 'validation_error'
  | 'insufficient_credits'
  | 'service_error'
  | 'timeout_error'
  | 'cancellation'
  | 'unknown_error';

/**
 * Stage timing record
 */
export interface StageTiming {
  readonly stage: ThematizationPipelineStage;
  readonly durationMs: number;
}

/**
 * Job metrics snapshot
 */
export interface ThematizationJobMetrics {
  readonly requestId: string;
  readonly tier: ThematizationTierCount;
  readonly status: ThematizationJobStatus;
  readonly papersProcessed: number;
  readonly themesExtracted: number;
  readonly claimsExtracted: number;
  readonly creditsConsumed: number;
  readonly subscription: ThematizationSubscription;
  readonly totalDurationMs: number;
  readonly stageTimings: readonly StageTiming[];
  readonly avgThemeConfidence?: number;
  readonly avgClaimPotential?: number;
}

/**
 * Aggregate metrics for dashboard
 */
export interface ThematizationAggregateMetrics {
  readonly totalJobs: number;
  readonly successRate: number;
  readonly avgProcessingTimeMs: number;
  readonly totalPapersProcessed: number;
  readonly totalThemesExtracted: number;
  readonly totalClaimsExtracted: number;
  readonly totalCreditsConsumed: number;
  readonly jobsByTier: Readonly<Record<ThematizationTierCount, number>>;
  readonly jobsByStatus: Readonly<Record<ThematizationJobStatus, number>>;
  readonly errorsByType: Readonly<Record<ThematizationErrorType, number>>;
  readonly avgThemeConfidence: number;
  readonly p50DurationMs: number;
  readonly p95DurationMs: number;
  readonly p99DurationMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Metrics prefix for all thematization metrics */
const METRICS_PREFIX = 'thematization';

/** Maximum history entries for percentile calculations */
const MAX_HISTORY_SIZE = 1000;

/** Health check threshold: max avg processing time in seconds */
const HEALTH_MAX_AVG_PROCESSING_TIME_SECONDS = 300;

/** Health check threshold: min success rate */
const HEALTH_MIN_SUCCESS_RATE = 0.95;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationMetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(ThematizationMetricsService.name);

  /**
   * Active job count (gauge)
   */
  private activeJobs = 0;

  /**
   * Job metrics history for percentile calculations
   * Circular buffer with MAX_HISTORY_SIZE
   */
  private readonly jobHistory: ThematizationJobMetrics[] = [];

  /**
   * Error counts by type
   */
  private readonly errorCounts = new Map<ThematizationErrorType, number>();

  /**
   * Job counts by status
   */
  private readonly statusCounts = new Map<ThematizationJobStatus, number>();

  /**
   * Job counts by tier
   */
  private readonly tierCounts = new Map<ThematizationTierCount, number>();

  /**
   * Duration history for percentiles (in ms)
   */
  private readonly durationHistory: number[] = [];

  constructor(private readonly metricsService: MetricsService) {
    this.logger.log('✅ [ThematizationMetrics] Service initialized');
    this.initializeMetrics();
  }

  onModuleDestroy(): void {
    this.logger.log('🛑 [ThematizationMetrics] Service shutting down');
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize all metric counters
   */
  private initializeMetrics(): void {
    // Initialize error counts
    const errorTypes: ThematizationErrorType[] = [
      'validation_error',
      'insufficient_credits',
      'service_error',
      'timeout_error',
      'cancellation',
      'unknown_error',
    ];
    for (const type of errorTypes) {
      this.errorCounts.set(type, 0);
    }

    // Initialize status counts
    const statuses: ThematizationJobStatus[] = ['completed', 'failed', 'cancelled', 'timeout'];
    for (const status of statuses) {
      this.statusCounts.set(status, 0);
    }

    // Initialize tier counts
    const tiers: ThematizationTierCount[] = [50, 100, 150, 200, 250, 300];
    for (const tier of tiers) {
      this.tierCounts.set(tier, 0);
    }

    this.logger.debug('📊 [ThematizationMetrics] Metrics initialized');
  }

  // ==========================================================================
  // JOB TRACKING
  // ==========================================================================

  /**
   * Record job start
   */
  recordJobStart(tier: ThematizationTierCount): void {
    this.activeJobs++;

    // Increment tier counter
    const currentCount = this.tierCounts.get(tier) ?? 0;
    this.tierCounts.set(tier, currentCount + 1);

    // Update Prometheus gauge
    this.metricsService.recordGauge(`${METRICS_PREFIX}_active_jobs`, this.activeJobs);

    this.logger.debug(`📈 [Metrics] Job started: tier=${tier}, active=${this.activeJobs}`);
  }

  /**
   * Record job completion with full metrics
   */
  recordJobCompletion(metrics: ThematizationJobMetrics): void {
    this.activeJobs = Math.max(0, this.activeJobs - 1);

    // Update status counts
    const statusCount = this.statusCounts.get(metrics.status) ?? 0;
    this.statusCounts.set(metrics.status, statusCount + 1);

    // Add to history (circular buffer)
    if (this.jobHistory.length >= MAX_HISTORY_SIZE) {
      this.jobHistory.shift();
    }
    this.jobHistory.push(metrics);

    // Track duration for percentiles
    if (this.durationHistory.length >= MAX_HISTORY_SIZE) {
      this.durationHistory.shift();
    }
    this.durationHistory.push(metrics.totalDurationMs);

    // Update Prometheus metrics
    this.updatePrometheusCounters(metrics);

    this.logger.log(
      `📊 [Metrics] Job ${metrics.status}: tier=${metrics.tier}, ` +
      `themes=${metrics.themesExtracted}, claims=${metrics.claimsExtracted}, ` +
      `duration=${metrics.totalDurationMs}ms`,
    );
  }

  /**
   * Record error occurrence
   */
  recordError(
    errorType: ThematizationErrorType,
    stage: ThematizationPipelineStage,
    tier?: ThematizationTierCount,
  ): void {
    const currentCount = this.errorCounts.get(errorType) ?? 0;
    this.errorCounts.set(errorType, currentCount + 1);

    // Update Prometheus counter
    this.metricsService.incrementCounter(`${METRICS_PREFIX}_errors_total`, {
      error_type: errorType,
      stage,
      tier: tier?.toString() ?? 'unknown',
    });

    this.logger.warn(`⚠️ [Metrics] Error recorded: type=${errorType}, stage=${stage}`);
  }

  /**
   * Record cache hit (request served from cache)
   * Tracks cache effectiveness without counting as a new job
   */
  recordCacheHit(tier: ThematizationTierCount): void {
    this.metricsService.incrementCounter(`${METRICS_PREFIX}_cache_hits_total`, {
      tier: tier.toString(),
    });

    this.logger.debug(`📦 [Metrics] Cache hit recorded: tier=${tier}`);
  }

  // ==========================================================================
  // PROMETHEUS INTEGRATION
  // ==========================================================================

  /**
   * Update Prometheus counters from job metrics
   */
  private updatePrometheusCounters(metrics: ThematizationJobMetrics): void {
    const tierLabel = metrics.tier.toString();
    const statusLabel = metrics.status;
    const subscriptionLabel = metrics.subscription;

    // Counter: jobs total
    this.metricsService.incrementCounter(`${METRICS_PREFIX}_jobs_total`, {
      tier: tierLabel,
      status: statusLabel,
    });

    // Counter: papers processed
    this.metricsService.incrementCounter(
      `${METRICS_PREFIX}_papers_processed_total`,
      { tier: tierLabel },
      metrics.papersProcessed,
    );

    // Counter: themes extracted
    this.metricsService.incrementCounter(
      `${METRICS_PREFIX}_themes_extracted_total`,
      { tier: tierLabel },
      metrics.themesExtracted,
    );

    // Counter: claims extracted
    this.metricsService.incrementCounter(
      `${METRICS_PREFIX}_claims_extracted_total`,
      { tier: tierLabel },
      metrics.claimsExtracted,
    );

    // Counter: credits consumed
    this.metricsService.incrementCounter(
      `${METRICS_PREFIX}_credits_consumed_total`,
      { tier: tierLabel, subscription: subscriptionLabel },
      metrics.creditsConsumed,
    );

    // Gauge: active jobs
    this.metricsService.recordGauge(`${METRICS_PREFIX}_active_jobs`, this.activeJobs);

    // Histogram: duration
    this.metricsService.recordHistogram(
      `${METRICS_PREFIX}_duration_seconds`,
      metrics.totalDurationMs / 1000,
      { tier: tierLabel },
    );

    // Record stage timings
    for (const timing of metrics.stageTimings) {
      this.metricsService.recordHistogram(
        `${METRICS_PREFIX}_stage_duration_seconds`,
        timing.durationMs / 1000,
        { tier: tierLabel, stage: timing.stage },
      );
    }

    // Histogram: theme confidence
    if (metrics.avgThemeConfidence !== undefined) {
      this.metricsService.recordHistogram(
        `${METRICS_PREFIX}_theme_confidence`,
        metrics.avgThemeConfidence,
        { tier: tierLabel },
      );
    }

    // Histogram: claim potential
    if (metrics.avgClaimPotential !== undefined) {
      this.metricsService.recordHistogram(
        `${METRICS_PREFIX}_claim_potential`,
        metrics.avgClaimPotential,
        { tier: tierLabel },
      );
    }
  }

  // ==========================================================================
  // AGGREGATE METRICS
  // ==========================================================================

  /**
   * Get aggregate metrics for dashboard
   */
  getAggregateMetrics(): ThematizationAggregateMetrics {
    const totalJobs = this.jobHistory.length;

    if (totalJobs === 0) {
      return this.getEmptyAggregateMetrics();
    }

    // Calculate totals
    let totalPapers = 0;
    let totalThemes = 0;
    let totalClaims = 0;
    let totalCredits = 0;
    let totalDuration = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const job of this.jobHistory) {
      totalPapers += job.papersProcessed;
      totalThemes += job.themesExtracted;
      totalClaims += job.claimsExtracted;
      totalCredits += job.creditsConsumed;
      totalDuration += job.totalDurationMs;

      if (job.avgThemeConfidence !== undefined) {
        totalConfidence += job.avgThemeConfidence;
        confidenceCount++;
      }
    }

    // Calculate success rate
    const completedCount = this.statusCounts.get('completed') ?? 0;
    const successRate = totalJobs > 0 ? completedCount / totalJobs : 0;

    // Calculate percentiles
    const sortedDurations = [...this.durationHistory].sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedDurations, 50);
    const p95 = this.getPercentile(sortedDurations, 95);
    const p99 = this.getPercentile(sortedDurations, 99);

    // Build tier distribution
    const jobsByTier = {} as Record<ThematizationTierCount, number>;
    for (const [tier, count] of this.tierCounts) {
      jobsByTier[tier] = count;
    }

    // Build status distribution
    const jobsByStatus = {} as Record<ThematizationJobStatus, number>;
    for (const [status, count] of this.statusCounts) {
      jobsByStatus[status] = count;
    }

    // Build error distribution
    const errorsByType = {} as Record<ThematizationErrorType, number>;
    for (const [type, count] of this.errorCounts) {
      errorsByType[type] = count;
    }

    return {
      totalJobs,
      successRate,
      avgProcessingTimeMs: totalJobs > 0 ? totalDuration / totalJobs : 0,
      totalPapersProcessed: totalPapers,
      totalThemesExtracted: totalThemes,
      totalClaimsExtracted: totalClaims,
      totalCreditsConsumed: totalCredits,
      jobsByTier,
      jobsByStatus,
      errorsByType,
      avgThemeConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      p50DurationMs: p50,
      p95DurationMs: p95,
      p99DurationMs: p99,
    };
  }

  /**
   * Get empty aggregate metrics (for when no data exists)
   */
  private getEmptyAggregateMetrics(): ThematizationAggregateMetrics {
    return {
      totalJobs: 0,
      successRate: 0,
      avgProcessingTimeMs: 0,
      totalPapersProcessed: 0,
      totalThemesExtracted: 0,
      totalClaimsExtracted: 0,
      totalCreditsConsumed: 0,
      jobsByTier: { 50: 0, 100: 0, 150: 0, 200: 0, 250: 0, 300: 0 },
      jobsByStatus: { completed: 0, failed: 0, cancelled: 0, timeout: 0 },
      errorsByType: {
        validation_error: 0,
        insufficient_credits: 0,
        service_error: 0,
        timeout_error: 0,
        cancellation: 0,
        unknown_error: 0,
      },
      avgThemeConfidence: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private getPercentile(sortedValues: readonly number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] ?? 0;
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Check service health based on metrics
   */
  getHealthStatus(): {
    readonly healthy: boolean;
    readonly checks: ReadonlyArray<{
      readonly name: string;
      readonly status: 'pass' | 'warn' | 'fail';
      readonly message: string;
    }>;
  } {
    const checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> = [];

    // Check 1: Success rate
    const metrics = this.getAggregateMetrics();
    if (metrics.totalJobs > 10) {
      if (metrics.successRate >= HEALTH_MIN_SUCCESS_RATE) {
        checks.push({
          name: 'success_rate',
          status: 'pass',
          message: `Success rate: ${(metrics.successRate * 100).toFixed(1)}%`,
        });
      } else if (metrics.successRate >= 0.8) {
        checks.push({
          name: 'success_rate',
          status: 'warn',
          message: `Success rate degraded: ${(metrics.successRate * 100).toFixed(1)}%`,
        });
      } else {
        checks.push({
          name: 'success_rate',
          status: 'fail',
          message: `Success rate critical: ${(metrics.successRate * 100).toFixed(1)}%`,
        });
      }
    } else {
      checks.push({
        name: 'success_rate',
        status: 'pass',
        message: 'Insufficient data for success rate check',
      });
    }

    // Check 2: Average processing time
    const avgTimeSeconds = metrics.avgProcessingTimeMs / 1000;
    if (avgTimeSeconds <= HEALTH_MAX_AVG_PROCESSING_TIME_SECONDS) {
      checks.push({
        name: 'avg_processing_time',
        status: 'pass',
        message: `Avg processing time: ${avgTimeSeconds.toFixed(1)}s`,
      });
    } else {
      checks.push({
        name: 'avg_processing_time',
        status: 'warn',
        message: `Avg processing time elevated: ${avgTimeSeconds.toFixed(1)}s`,
      });
    }

    // Check 3: Active jobs (should not exceed reasonable limit)
    if (this.activeJobs <= 50) {
      checks.push({
        name: 'active_jobs',
        status: 'pass',
        message: `Active jobs: ${this.activeJobs}`,
      });
    } else if (this.activeJobs <= 100) {
      checks.push({
        name: 'active_jobs',
        status: 'warn',
        message: `Active jobs elevated: ${this.activeJobs}`,
      });
    } else {
      checks.push({
        name: 'active_jobs',
        status: 'fail',
        message: `Active jobs critical: ${this.activeJobs}`,
      });
    }

    // Overall health
    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');

    return {
      healthy: !hasFailure,
      checks,
    };
  }

  // ==========================================================================
  // ACCESSORS
  // ==========================================================================

  /**
   * Get current active job count
   */
  getActiveJobCount(): number {
    return this.activeJobs;
  }

  /**
   * Get recent job history
   */
  getRecentJobs(limit: number = 10): readonly ThematizationJobMetrics[] {
    return this.jobHistory.slice(-limit);
  }
}
