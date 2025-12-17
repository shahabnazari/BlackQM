/**
 * Phase 10.170 Week 4: Purpose-Aware Health Controller Tests
 *
 * Tests for health check endpoints aggregating all Week 4 services.
 *
 * @module purpose-aware-health.controller.spec
 * @since Phase 10.170 Week 4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { PurposeAwareHealthController } from '../../controllers/purpose-aware-health.controller';
import { PurposeAwareMetricsService } from '../purpose-aware-metrics.service';
import { PurposeAwareCacheService } from '../purpose-aware-cache.service';
import { PurposeAwareCircuitBreakerService } from '../purpose-aware-circuit-breaker.service';
import { PurposeAwareConfigService } from '../purpose-aware-config.service';
import { ResearchPurpose } from '../../types/purpose-aware.types';

describe('PurposeAwareHealthController', () => {
  let controller: PurposeAwareHealthController;
  let metricsService: PurposeAwareMetricsService;
  let cacheService: PurposeAwareCacheService;
  let circuitBreakerService: PurposeAwareCircuitBreakerService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    metricsService = new PurposeAwareMetricsService();
    cacheService = new PurposeAwareCacheService(metricsService);
    circuitBreakerService = new PurposeAwareCircuitBreakerService(metricsService);
    configService = new PurposeAwareConfigService();
    controller = new PurposeAwareHealthController(
      metricsService,
      cacheService,
      circuitBreakerService,
      configService,
    );
  });

  afterEach(() => {
    cacheService.clear();
    cacheService.onModuleDestroy();
  });

  // ==========================================================================
  // HEALTH ENDPOINT TESTS
  // ==========================================================================

  describe('GET /health', () => {
    it('should return health status with all services operational', () => {
      const health = controller.getHealth();

      expect(health.status).toBeDefined();
      expect(health.timestamp).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should include components status', () => {
      const health = controller.getHealth();

      expect(health.components).toBeDefined();
      expect(health.components.configService).toBeDefined();
      expect(health.components.scoringService).toBeDefined();
      expect(health.components.detectionService).toBeDefined();
      expect(health.components.diversityService).toBeDefined();
      expect(health.components.cacheService).toBeDefined();
    });

    it('should include SLA compliance as booleans', () => {
      const health = controller.getHealth();

      expect(health.sla).toBeDefined();
      expect(typeof health.sla.scoring).toBe('boolean');
      expect(typeof health.sla.detection).toBe('boolean');
      expect(typeof health.sla.cacheHitRate).toBe('boolean');
      expect(typeof health.sla.errorRate).toBe('boolean');
      expect(typeof health.sla.overall).toBe('boolean');
    });

    it('should include circuit breaker status', () => {
      const health = controller.getHealth();

      expect(health.circuits).toBeDefined();
      expect(health.circuits.circuits.unpaywall).toBeDefined();
      expect(health.circuits.circuits.publisher).toBeDefined();
      expect(health.circuits.circuits.aiVerification).toBeDefined();
    });

    it('should include cache metrics', () => {
      const health = controller.getHealth();

      expect(health.cache).toBeDefined();
      expect(health.cache.scores).toBeDefined();
      expect(health.cache.diversity).toBeDefined();
    });
  });

  // ==========================================================================
  // METRICS ENDPOINT TESTS
  // ==========================================================================

  describe('GET /metrics', () => {
    it('should return metrics summary', () => {
      const metrics = controller.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.byPurpose).toBeDefined();
      expect(metrics.detection).toBeDefined();
      expect(metrics.cache).toBeDefined();
      expect(metrics.sla).toBeDefined();
    });

    it('should include per-purpose scoring metrics', () => {
      // Record some scores
      metricsService.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 75, 10);
      metricsService.recordPaperScored(ResearchPurpose.LITERATURE_SYNTHESIS, 65, 15);

      const metrics = controller.getMetrics();

      expect(metrics.byPurpose[ResearchPurpose.Q_METHODOLOGY]).toBeDefined();
      expect(metrics.byPurpose[ResearchPurpose.LITERATURE_SYNTHESIS]).toBeDefined();
    });

    it('should include detection tier metrics', () => {
      // Record some detection attempts
      metricsService.recordDetectionAttempt('unpaywall', true, 100);
      metricsService.recordDetectionAttempt('publisher_html', false, 200);

      const metrics = controller.getMetrics();

      expect(metrics.detection.tierStats.unpaywall).toBeDefined();
      expect(metrics.detection.tierStats.publisher_html).toBeDefined();
    });

    it('should include cache metrics in summary', () => {
      // Perform some cache operations
      metricsService.recordCacheOperation('scores', 'get', true);
      metricsService.recordCacheOperation('scores', 'get', false);

      const metrics = controller.getMetrics();

      expect(metrics.cache.scores).toBeDefined();
      expect(metrics.cache.diversity).toBeDefined();
    });

    it('should track total operations', () => {
      // Record some operations
      for (let i = 0; i < 5; i++) {
        metricsService.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 75, 10);
      }

      const metrics = controller.getMetrics();

      expect(metrics.totalOperations).toBe(5);
    });
  });

  // ==========================================================================
  // CIRCUITS ENDPOINT TESTS
  // ==========================================================================

  describe('GET /circuits', () => {
    it('should return all circuit statuses', () => {
      const circuits = controller.getCircuits();

      expect(circuits.circuits).toBeDefined();
      expect(circuits.circuits.unpaywall).toBeDefined();
      expect(circuits.circuits.publisher).toBeDefined();
      expect(circuits.circuits.aiVerification).toBeDefined();
    });

    it('should include degradation level', () => {
      const circuits = controller.getCircuits();

      expect(circuits.degradationLevel).toBe('normal');
      expect(circuits.healthy).toBe(true);
    });

    it('should reflect open circuit state', async () => {
      // Open a circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerService.withUnpaywall(
          async () => { throw new Error('E'); },
          async () => 'f',
        );
      }

      const circuits = controller.getCircuits();

      expect(circuits.circuits.unpaywall.state).toBe('open');
      expect(circuits.healthy).toBe(false);
      expect(circuits.degradationLevel).toBe('degraded');
    });
  });

  // ==========================================================================
  // CIRCUIT RESET ENDPOINT TESTS
  // ==========================================================================

  describe('POST /circuits/:name/reset', () => {
    it('should reset a specific circuit', async () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerService.withUnpaywall(
          async () => { throw new Error('E'); },
          async () => 'f',
        );
      }

      expect(circuitBreakerService.isCircuitOpen('unpaywall')).toBe(true);

      // Reset via controller
      const result = controller.resetCircuit('unpaywall');

      expect(result.success).toBe(true);
      expect(result.message).toContain('reset');
      expect(circuitBreakerService.isCircuitOpen('unpaywall')).toBe(false);
    });

    it('should throw HttpException for invalid circuit name', () => {
      expect(() => controller.resetCircuit('invalid')).toThrow(HttpException);
    });

    it('should reset publisher circuit', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreakerService.withPublisherScraping(
          async () => { throw new Error('E'); },
          async () => 'f',
        );
      }

      expect(circuitBreakerService.isCircuitOpen('publisher')).toBe(true);

      const result = controller.resetCircuit('publisher');
      expect(result.success).toBe(true);
      expect(circuitBreakerService.isCircuitOpen('publisher')).toBe(false);
    });
  });

  // ==========================================================================
  // CACHE STATS ENDPOINT TESTS
  // ==========================================================================

  describe('GET /cache/stats', () => {
    it('should return cache statistics', () => {
      const stats = controller.getCacheStats();

      expect(stats.scores).toBeDefined();
      expect(stats.diversity).toBeDefined();
    });

    it('should reflect cache size', () => {
      // Add some items to cache
      cacheService.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, {
        paperId: 'paper-1',
        purpose: ResearchPurpose.Q_METHODOLOGY,
        totalScore: 75,
        components: {} as any,
        fullTextBonus: 0,
        hasFullText: false,
        scoredAt: Date.now(),
        version: '1.0',
      });

      const stats = controller.getCacheStats();

      expect(stats.scores.size).toBe(1);
    });

    it('should track diversity cache separately', () => {
      const stats = controller.getCacheStats();

      expect(stats.scores.size).toBeGreaterThanOrEqual(0);
      expect(stats.diversity.size).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // SLA COMPLIANCE TESTS
  // ==========================================================================

  describe('SLA compliance', () => {
    it('should track scoring SLA compliance', () => {
      // Record fast scores
      for (let i = 0; i < 10; i++) {
        metricsService.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 75, 5);
      }

      const health = controller.getHealth();

      expect(typeof health.sla.scoring).toBe('boolean');
    });

    it('should track detection SLA compliance', () => {
      // Record fast detections
      for (let i = 0; i < 10; i++) {
        metricsService.recordDetectionAttempt('unpaywall', true, 100);
      }

      const health = controller.getHealth();

      expect(typeof health.sla.detection).toBe('boolean');
    });

    it('should track cache hit rate compliance', () => {
      // Record cache hits and misses
      for (let i = 0; i < 8; i++) {
        metricsService.recordCacheOperation('scores', 'get', true);
      }
      for (let i = 0; i < 2; i++) {
        metricsService.recordCacheOperation('scores', 'get', false);
      }

      const health = controller.getHealth();

      expect(typeof health.sla.cacheHitRate).toBe('boolean');
    });

    it('should track error rate compliance', () => {
      // Record some operations and errors
      for (let i = 0; i < 100; i++) {
        metricsService.recordPaperScored(ResearchPurpose.Q_METHODOLOGY, 75, 5);
      }
      metricsService.recordError();

      const health = controller.getHealth();

      expect(typeof health.sla.errorRate).toBe('boolean');
    });

    it('should track overall SLA compliance', () => {
      const health = controller.getHealth();

      expect(typeof health.sla.overall).toBe('boolean');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle zero operations gracefully', () => {
      // No operations performed
      const metrics = controller.getMetrics();

      expect(metrics.totalOperations).toBe(0);
    });

    it('should handle rapid health checks without error', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(controller.getHealth());
      }

      expect(results).toHaveLength(100);
      // All should have valid status
      expect(results.every((r) => ['healthy', 'degraded', 'unhealthy'].includes(r.status))).toBe(true);
    });

    it('should include timestamp in health response', () => {
      const health = controller.getHealth();

      expect(health.timestamp).toBeDefined();
      // Should be ISO timestamp
      expect(new Date(health.timestamp).toISOString()).toBe(health.timestamp);
    });
  });
});
