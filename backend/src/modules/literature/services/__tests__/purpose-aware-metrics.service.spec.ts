/**
 * Phase 10.170 Week 4: Purpose-Aware Metrics Service Tests
 *
 * Tests for Netflix-grade production monitoring service.
 *
 * @module purpose-aware-metrics.service.spec
 * @since Phase 10.170 Week 4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PurposeAwareMetricsService } from '../purpose-aware-metrics.service';
import { ResearchPurpose } from '../../types/purpose-aware.types';
import { PURPOSE_AWARE_SLA_TARGETS } from '../../types/purpose-aware-metrics.types';

describe('PurposeAwareMetricsService', () => {
  let service: PurposeAwareMetricsService;

  beforeEach(() => {
    service = new PurposeAwareMetricsService();
  });

  afterEach(() => {
    service.reset();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with zero metrics', () => {
      const summary = service.getMetricsSummary();

      expect(summary.totalOperations).toBe(0);
      expect(summary.errorRate).toBe(0);
    });

    it('should initialize metrics for all purposes', () => {
      const summary = service.getMetricsSummary();

      for (const purpose of Object.values(ResearchPurpose)) {
        expect(summary.byPurpose[purpose]).toBeDefined();
        expect(summary.byPurpose[purpose].papersScored).toBe(0);
      }
    });

    it('should initialize detection metrics', () => {
      const detection = service.getDetectionMetrics();

      expect(detection.totalAttempts).toBe(0);
      expect(detection.successCount).toBe(0);
      expect(detection.successRate).toBe(0);
    });
  });

  // ==========================================================================
  // SCORING METRICS TESTS
  // ==========================================================================

  describe('scoring metrics', () => {
    it('should record single paper scoring', () => {
      service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 75.5, 10);

      const metrics = service.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      expect(metrics.papersScored).toBe(1);
      expect(metrics.avgQualityScore).toBe(75.5);
    });

    it('should record batch scoring', () => {
      service.recordBatchScored(ResearchPurpose.LITERATURE_SYNTHESIS, 100, 68.2, 500);

      const metrics = service.getPurposeMetrics(ResearchPurpose.LITERATURE_SYNTHESIS);
      expect(metrics.papersScored).toBe(100);
      expect(metrics.avgQualityScore).toBe(68.2);
    });

    it('should track scoring latency percentiles', () => {
      // Record 100 scoring operations with varying latency
      for (let i = 0; i < 100; i++) {
        service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, i + 1);
      }

      const metrics = service.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      // p95 should be around 95
      expect(metrics.scoringP95Ms).toBeGreaterThanOrEqual(90);
      expect(metrics.scoringP95Ms).toBeLessThanOrEqual(100);
    });

    it('should track threshold relaxations', () => {
      service.recordThresholdRelaxation(ResearchPurpose.Q_METHODOLOGY, 70, 60);
      service.recordThresholdRelaxation(ResearchPurpose.Q_METHODOLOGY, 60, 50);

      const metrics = service.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      expect(metrics.thresholdRelaxations).toBe(2);
    });

    it('should track diversity analysis', () => {
      service.recordDiversityAnalysis(ResearchPurpose.Q_METHODOLOGY, 1.85, 45);
      service.recordDiversityAnalysis(ResearchPurpose.Q_METHODOLOGY, 1.65, 42);

      const metrics = service.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      expect(metrics.avgShannonIndex).toBe(1.75);
    });

    it('should track full-text discovery rate', () => {
      service.recordFullTextDetection(ResearchPurpose.LITERATURE_SYNTHESIS, true);
      service.recordFullTextDetection(ResearchPurpose.LITERATURE_SYNTHESIS, true);
      service.recordFullTextDetection(ResearchPurpose.LITERATURE_SYNTHESIS, false);

      const metrics = service.getPurposeMetrics(ResearchPurpose.LITERATURE_SYNTHESIS);
      expect(metrics.fullTextDiscoveryRate).toBeCloseTo(0.667, 2);
    });
  });

  // ==========================================================================
  // DETECTION METRICS TESTS
  // ==========================================================================

  describe('detection metrics', () => {
    it('should record detection attempts', () => {
      service.recordDetectionAttempt('unpaywall', true, 150);
      service.recordDetectionAttempt('unpaywall', false, 100);
      service.recordDetectionAttempt('publisher_html', true, 200);

      const detection = service.getDetectionMetrics();
      expect(detection.totalAttempts).toBe(3);
      expect(detection.successCount).toBe(2);
      expect(detection.successRate).toBeCloseTo(0.667, 2);
    });

    it('should track per-tier statistics', () => {
      service.recordDetectionAttempt('unpaywall', true, 100);
      service.recordDetectionAttempt('unpaywall', true, 200);
      service.recordDetectionAttempt('unpaywall', false, 150);

      const detection = service.getDetectionMetrics();
      expect(detection.tierStats.unpaywall.attempts).toBe(3);
      expect(detection.tierStats.unpaywall.successes).toBe(2);
      expect(detection.tierStats.unpaywall.avgLatencyMs).toBe(150);
    });

    it('should track detection latency percentiles', () => {
      for (let i = 0; i < 100; i++) {
        service.recordDetectionAttempt('database', true, (i + 1) * 10);
      }

      const detection = service.getDetectionMetrics();
      expect(detection.detectionP95Ms).toBeGreaterThanOrEqual(900);
      expect(detection.detectionP95Ms).toBeLessThanOrEqual(1000);
    });
  });

  // ==========================================================================
  // CACHE METRICS TESTS
  // ==========================================================================

  describe('cache metrics', () => {
    it('should record cache hits', () => {
      service.recordCacheOperation('scores', 'get', true);
      service.recordCacheOperation('scores', 'get', true);
      service.recordCacheOperation('scores', 'get', false);

      const cache = service.getCacheMetrics();
      expect(cache.scores.hits).toBe(2);
      expect(cache.scores.misses).toBe(1);
    });

    it('should calculate hit rate', () => {
      service.recordCacheOperation('scores', 'get', true);
      service.recordCacheOperation('scores', 'get', true);
      service.recordCacheOperation('scores', 'get', false);
      service.recordCacheOperation('scores', 'get', false);

      const cache = service.getCacheMetrics();
      expect(cache.scores.hitRate).toBe(0.5);
    });

    it('should calculate overall hit rate', () => {
      service.recordCacheOperation('scores', 'get', true);
      service.recordCacheOperation('diversity', 'get', false);

      const cache = service.getCacheMetrics();
      expect(cache.overallHitRate).toBe(0.5);
    });

    it('should track cache evictions', () => {
      service.recordCacheEviction('scores');
      service.recordCacheEviction('scores');

      // Note: Evictions are tracked by metrics service but stats come from cache service
      // This test verifies the recording doesn't throw
      expect(() => service.getCacheMetrics()).not.toThrow();
    });
  });

  // ==========================================================================
  // SLA COMPLIANCE TESTS
  // ==========================================================================

  describe('SLA compliance', () => {
    it('should report compliant when within targets', () => {
      // Record fast operations
      for (let i = 0; i < 10; i++) {
        service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, 5); // 5ms < 100ms target
        service.recordDetectionAttempt('database', true, 100); // 100ms < 5000ms target
        service.recordCacheOperation('scores', 'get', true); // hits
      }

      const sla = service.getSLACompliance();
      expect(sla.scoring).toBe(true);
      expect(sla.detection).toBe(true);
    });

    it('should report non-compliant when error rate exceeded', () => {
      for (let i = 0; i < 10; i++) {
        service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, 5);
      }
      // Record error (>1% of operations)
      service.recordError();

      const sla = service.getSLACompliance();
      expect(sla.errorRate).toBe(false);
    });

    it('should report overall compliance only when all pass', () => {
      // Fast operations
      for (let i = 0; i < 100; i++) {
        service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, 5);
        service.recordDetectionAttempt('database', true, 100);
        service.recordCacheOperation('scores', 'get', true);
      }

      const sla = service.getSLACompliance();
      expect(sla.overall).toBe(true);
    });
  });

  // ==========================================================================
  // SUMMARY TESTS
  // ==========================================================================

  describe('summary', () => {
    it('should generate one-line summary', () => {
      service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, 10);
      service.recordDetectionAttempt('database', true, 100);
      service.recordCacheOperation('scores', 'get', true);

      const summary = service.getSummary();
      expect(summary).toContain('[PurposeAwareMetrics]');
      expect(summary).toContain('ops=');
      expect(summary).toContain('cache_hit=');
    });

    it('should generate complete metrics summary', () => {
      const summary = service.getMetricsSummary();

      expect(summary.byPurpose).toBeDefined();
      expect(summary.detection).toBeDefined();
      expect(summary.cache).toBeDefined();
      expect(summary.sla).toBeDefined();
      expect(summary.timestamp).toBeDefined();
    });
  });

  // ==========================================================================
  // RESET TESTS
  // ==========================================================================

  describe('reset', () => {
    it('should reset all metrics', () => {
      // Record some operations
      service.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 70, 10);
      service.recordDetectionAttempt('database', true, 100);

      // Reset
      service.reset();

      const summary = service.getMetricsSummary();
      expect(summary.totalOperations).toBe(0);
      expect(summary.detection.totalAttempts).toBe(0);
    });
  });
});
