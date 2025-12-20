/**
 * Phase 10.170 Week 4: Purpose-Aware Metrics Service
 *
 * Netflix-grade production monitoring for purpose-aware pipeline components.
 * Tracks scoring latency, detection performance, cache efficiency, and SLA compliance.
 *
 * DESIGN PRINCIPLES:
 * - Rolling windows for percentile calculations
 * - Per-purpose metric segregation
 * - Prometheus-compatible metric format
 * - Zero external dependencies (in-memory)
 *
 * @module purpose-aware-metrics.service
 * @since Phase 10.170 Week 4
 */

import { Injectable, Logger } from '@nestjs/common';
import { ResearchPurpose } from '../types/purpose-aware.types';
import {
  RollingWindowConfig,
  PURPOSE_AWARE_SLA_TARGETS,
  DetectionTierName,
  CacheOperation,
  PurposeMetricsSnapshot,
  DetectionMetricsSnapshot,
  CacheMetricsSnapshot,
  CacheStats,
  TierStats,
  SLAComplianceStatus,
  PurposeAwareMetricsSummary,
} from '../types/purpose-aware-metrics.types';

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
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  /**
   * Get sum of all values
   */
  sum(): number {
    return this.values.reduce((a, b) => a + b, 0);
  }

  /**
   * Reset the window
   */
  reset(): void {
    this.values.length = 0;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Rolling window size for latency tracking */
const WINDOW_SIZE = 1000;

/** All detection tier names */
const DETECTION_TIERS: readonly DetectionTierName[] = [
  'database',
  'direct_url',
  'pmc_pattern',
  'core_api',       // Phase 10.195: CORE API (250M+ OA papers)
  'unpaywall',
  'publisher_html',
  'secondary_links',
  'ai_verification',
];

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareMetricsService {
  private readonly logger = new Logger(PurposeAwareMetricsService.name);

  // Per-purpose metrics
  private readonly scoringLatency = new Map<ResearchPurpose, RollingWindow>();
  private readonly qualityScores = new Map<ResearchPurpose, RollingWindow>();
  private readonly thresholdRelaxations = new Map<ResearchPurpose, number>();
  private readonly shannonIndices = new Map<ResearchPurpose, RollingWindow>();
  private readonly papersScored = new Map<ResearchPurpose, number>();
  private readonly fullTextFound = new Map<ResearchPurpose, { found: number; total: number }>();

  // Detection metrics
  private readonly detectionLatency = new RollingWindow({ size: WINDOW_SIZE });
  private readonly tierAttempts = new Map<DetectionTierName, number>();
  private readonly tierSuccesses = new Map<DetectionTierName, number>();
  private readonly tierLatencies = new Map<DetectionTierName, RollingWindow>();
  private detectionAttempts = 0;
  private detectionSuccesses = 0;

  // Cache metrics
  private readonly cacheHits = new Map<string, number>();
  private readonly cacheMisses = new Map<string, number>();
  private readonly cacheEvictions = new Map<string, number>();
  private readonly cacheSizes = new Map<string, number>();

  // Error tracking
  private totalOperations = 0;
  private totalErrors = 0;

  constructor() {
    this.initializeMetrics();
    this.logger.log('✅ [PurposeAwareMetrics] Phase 10.170 Week 4 - Service initialized');
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize metric containers for all purposes and tiers
   */
  private initializeMetrics(): void {
    // Initialize per-purpose metrics
    for (const purpose of Object.values(ResearchPurpose)) {
      this.scoringLatency.set(purpose, new RollingWindow({ size: WINDOW_SIZE }));
      this.qualityScores.set(purpose, new RollingWindow({ size: WINDOW_SIZE }));
      this.shannonIndices.set(purpose, new RollingWindow({ size: WINDOW_SIZE }));
      this.thresholdRelaxations.set(purpose, 0);
      this.papersScored.set(purpose, 0);
      this.fullTextFound.set(purpose, { found: 0, total: 0 });
    }

    // Initialize per-tier metrics
    for (const tier of DETECTION_TIERS) {
      this.tierAttempts.set(tier, 0);
      this.tierSuccesses.set(tier, 0);
      this.tierLatencies.set(tier, new RollingWindow({ size: WINDOW_SIZE }));
    }

    // Initialize cache metrics
    for (const cache of ['scores', 'diversity', 'detection']) {
      this.cacheHits.set(cache, 0);
      this.cacheMisses.set(cache, 0);
      this.cacheEvictions.set(cache, 0);
      this.cacheSizes.set(cache, 0);
    }
  }

  // ==========================================================================
  // RECORDING METHODS
  // ==========================================================================

  /**
   * Record a paper scoring operation
   *
   * @param purpose Research purpose
   * @param score Quality score (0-100)
   * @param durationMs Scoring duration in milliseconds
   */
  recordPaperScored(
    purpose: ResearchPurpose,
    score: number,
    durationMs: number,
  ): void {
    this.totalOperations++;

    this.scoringLatency.get(purpose)?.add(durationMs);
    this.qualityScores.get(purpose)?.add(score);

    const current = this.papersScored.get(purpose) ?? 0;
    this.papersScored.set(purpose, current + 1);
  }

  /**
   * Record a batch scoring operation
   *
   * @param purpose Research purpose
   * @param paperCount Number of papers scored
   * @param avgScore Average quality score
   * @param durationMs Total batch duration
   */
  recordBatchScored(
    purpose: ResearchPurpose,
    paperCount: number,
    avgScore: number,
    durationMs: number,
  ): void {
    this.totalOperations++;

    // Record per-paper latency estimate
    const perPaperMs = paperCount > 0 ? durationMs / paperCount : 0;
    this.scoringLatency.get(purpose)?.add(perPaperMs);
    this.qualityScores.get(purpose)?.add(avgScore);

    const current = this.papersScored.get(purpose) ?? 0;
    this.papersScored.set(purpose, current + paperCount);
  }

  /**
   * Record a threshold relaxation event
   *
   * @param purpose Research purpose
   * @param fromThreshold Original threshold
   * @param toThreshold Relaxed threshold
   */
  recordThresholdRelaxation(
    purpose: ResearchPurpose,
    fromThreshold: number,
    toThreshold: number,
  ): void {
    const current = this.thresholdRelaxations.get(purpose) ?? 0;
    this.thresholdRelaxations.set(purpose, current + 1);

    this.logger.debug(
      `[Metrics] Threshold relaxation: ${purpose} ${fromThreshold}% → ${toThreshold}%`,
    );
  }

  /**
   * Record diversity analysis
   *
   * @param purpose Research purpose
   * @param shannonIndex Shannon diversity index
   * @param durationMs Analysis duration
   */
  recordDiversityAnalysis(
    purpose: ResearchPurpose,
    shannonIndex: number,
    durationMs: number,
  ): void {
    this.totalOperations++;
    this.shannonIndices.get(purpose)?.add(shannonIndex);
  }

  /**
   * Record full-text detection attempt
   *
   * @param purpose Research purpose
   * @param found Whether full-text was found
   */
  recordFullTextDetection(purpose: ResearchPurpose, found: boolean): void {
    const current = this.fullTextFound.get(purpose) ?? { found: 0, total: 0 };
    this.fullTextFound.set(purpose, {
      found: current.found + (found ? 1 : 0),
      total: current.total + 1,
    });
  }

  /**
   * Record a detection tier attempt
   *
   * @param tier Detection tier name
   * @param success Whether detection succeeded
   * @param durationMs Tier duration in milliseconds
   */
  recordDetectionAttempt(
    tier: DetectionTierName,
    success: boolean,
    durationMs: number,
  ): void {
    this.totalOperations++;
    this.detectionAttempts++;

    if (success) {
      this.detectionSuccesses++;
    }

    // Record overall latency
    this.detectionLatency.add(durationMs);

    // Record per-tier metrics
    const attempts = this.tierAttempts.get(tier) ?? 0;
    this.tierAttempts.set(tier, attempts + 1);

    if (success) {
      const successes = this.tierSuccesses.get(tier) ?? 0;
      this.tierSuccesses.set(tier, successes + 1);
    }

    this.tierLatencies.get(tier)?.add(durationMs);
  }

  /**
   * Record a cache operation
   *
   * @param cacheName Cache name (scores, diversity, detection)
   * @param operation Operation type
   * @param hit Whether it was a cache hit (for get operations)
   */
  recordCacheOperation(
    cacheName: string,
    operation: CacheOperation,
    hit?: boolean,
  ): void {
    if (operation === 'get') {
      if (hit) {
        const current = this.cacheHits.get(cacheName) ?? 0;
        this.cacheHits.set(cacheName, current + 1);
      } else {
        const current = this.cacheMisses.get(cacheName) ?? 0;
        this.cacheMisses.set(cacheName, current + 1);
      }
    }
  }

  /**
   * Update cache size
   *
   * @param cacheName Cache name
   * @param size Current size
   */
  updateCacheSize(cacheName: string, size: number): void {
    this.cacheSizes.set(cacheName, size);
  }

  /**
   * Record a cache eviction
   *
   * @param cacheName Cache name
   */
  recordCacheEviction(cacheName: string): void {
    const current = this.cacheEvictions.get(cacheName) ?? 0;
    this.cacheEvictions.set(cacheName, current + 1);
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.totalErrors++;
  }

  // ==========================================================================
  // RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get metrics summary for a specific purpose
   */
  getPurposeMetrics(purpose: ResearchPurpose): PurposeMetricsSnapshot {
    const fullText = this.fullTextFound.get(purpose) ?? { found: 0, total: 0 };
    const fullTextRate = fullText.total > 0 ? fullText.found / fullText.total : 0;

    return {
      purpose,
      papersScored: this.papersScored.get(purpose) ?? 0,
      avgQualityScore: this.qualityScores.get(purpose)?.average() ?? 0,
      scoringP95Ms: this.scoringLatency.get(purpose)?.percentile(95) ?? 0,
      thresholdRelaxations: this.thresholdRelaxations.get(purpose) ?? 0,
      avgShannonIndex: this.shannonIndices.get(purpose)?.average() ?? 0,
      fullTextDiscoveryRate: fullTextRate,
    };
  }

  /**
   * Get detection metrics
   */
  getDetectionMetrics(): DetectionMetricsSnapshot {
    const tierStats: Record<DetectionTierName, TierStats> = {} as Record<DetectionTierName, TierStats>;

    for (const tier of DETECTION_TIERS) {
      const attempts = this.tierAttempts.get(tier) ?? 0;
      const successes = this.tierSuccesses.get(tier) ?? 0;
      const latency = this.tierLatencies.get(tier);

      tierStats[tier] = {
        attempts,
        successes,
        avgLatencyMs: latency?.average() ?? 0,
      };
    }

    return {
      totalAttempts: this.detectionAttempts,
      successCount: this.detectionSuccesses,
      successRate: this.detectionAttempts > 0
        ? this.detectionSuccesses / this.detectionAttempts
        : 0,
      detectionP95Ms: this.detectionLatency.percentile(95),
      tierStats,
    };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetricsSnapshot {
    const getCacheStats = (name: string): CacheStats => {
      const hits = this.cacheHits.get(name) ?? 0;
      const misses = this.cacheMisses.get(name) ?? 0;
      const total = hits + misses;

      return {
        size: this.cacheSizes.get(name) ?? 0,
        maxSize: name === 'scores' ? 50000 : name === 'diversity' ? 5000 : 10000,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        evictions: this.cacheEvictions.get(name) ?? 0,
        memoryBytes: 0, // Estimated externally
      };
    };

    const scores = getCacheStats('scores');
    const diversity = getCacheStats('diversity');
    const detection = getCacheStats('detection');

    const totalHits = scores.hits + diversity.hits + detection.hits;
    const totalMisses = scores.misses + diversity.misses + detection.misses;
    const totalOps = totalHits + totalMisses;

    return {
      scores,
      diversity,
      detection,
      overallHitRate: totalOps > 0 ? totalHits / totalOps : 0,
    };
  }

  /**
   * Get SLA compliance status
   */
  getSLACompliance(): SLAComplianceStatus {
    // Check scoring SLA (use Q_METHODOLOGY as reference, typically most used)
    const scoringP95 = this.scoringLatency.get(ResearchPurpose.Q_METHODOLOGY)?.percentile(95) ?? 0;
    const scoringCompliant = scoringP95 <= PURPOSE_AWARE_SLA_TARGETS.SCORING_BATCH_P95_MS;

    // Check detection SLA
    const detectionP95 = this.detectionLatency.percentile(95);
    const detectionCompliant = detectionP95 <= PURPOSE_AWARE_SLA_TARGETS.DETECTION_P95_MS;

    // Check cache hit rate
    const cacheMetrics = this.getCacheMetrics();
    const cacheHitRateCompliant = cacheMetrics.overallHitRate >= PURPOSE_AWARE_SLA_TARGETS.CACHE_HIT_RATE;

    // Check error rate
    const errorRate = this.totalOperations > 0
      ? this.totalErrors / this.totalOperations
      : 0;
    const errorRateCompliant = errorRate <= PURPOSE_AWARE_SLA_TARGETS.ERROR_RATE_THRESHOLD;

    return {
      scoring: scoringCompliant,
      detection: detectionCompliant,
      cacheHitRate: cacheHitRateCompliant,
      errorRate: errorRateCompliant,
      overall: scoringCompliant && detectionCompliant && cacheHitRateCompliant && errorRateCompliant,
    };
  }

  /**
   * Get complete metrics summary
   */
  getMetricsSummary(): PurposeAwareMetricsSummary {
    const byPurpose: Record<ResearchPurpose, PurposeMetricsSnapshot> = {} as Record<ResearchPurpose, PurposeMetricsSnapshot>;

    for (const purpose of Object.values(ResearchPurpose)) {
      byPurpose[purpose] = this.getPurposeMetrics(purpose);
    }

    const errorRate = this.totalOperations > 0
      ? this.totalErrors / this.totalOperations
      : 0;

    return {
      byPurpose,
      detection: this.getDetectionMetrics(),
      cache: this.getCacheMetrics(),
      sla: this.getSLACompliance(),
      errorRate,
      totalOperations: this.totalOperations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get one-line summary for logging
   */
  getSummary(): string {
    const sla = this.getSLACompliance();
    const cache = this.getCacheMetrics();
    const detection = this.getDetectionMetrics();

    return (
      `[PurposeAwareMetrics] ops=${this.totalOperations}, ` +
      `cache_hit=${(cache.overallHitRate * 100).toFixed(1)}%, ` +
      `detection_success=${(detection.successRate * 100).toFixed(1)}%, ` +
      `sla=${sla.overall ? 'OK' : 'BREACH'}`
    );
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.initializeMetrics();
    this.detectionAttempts = 0;
    this.detectionSuccesses = 0;
    this.totalOperations = 0;
    this.totalErrors = 0;
    this.detectionLatency.reset();
  }
}
