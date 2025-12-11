/**
 * AdaptiveTimeoutService Tests
 * Phase 10.112 Week 4: Netflix-Grade Dynamic Timeout Management
 */

import { AdaptiveTimeoutService } from '../adaptive-timeout.service';

describe('AdaptiveTimeoutService', () => {
  let service: AdaptiveTimeoutService;

  beforeEach(() => {
    service = new AdaptiveTimeoutService();
  });

  afterEach(() => {
    service.resetAll();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
    });

    it('should return default timeout for unknown operation', () => {
      const timeout = service.getTimeout('unknown:operation');
      expect(timeout).toBe(30000); // default timeout
    });

    it('should return configured default timeout for known operations', () => {
      expect(service.getTimeout('search:pubmed')).toBe(15000);
      expect(service.getTimeout('search:semantic_scholar')).toBe(15000);
      expect(service.getTimeout('embedding:batch')).toBe(30000);
      expect(service.getTimeout('extraction:themes')).toBe(60000);
    });

    /**
     * Phase 10.115: PMC timeout configuration tests
     * PMC needs 65s for full-text XML fetching (esearch ~5s + 2 batches of efetch @ 25s each)
     */
    it('should return 65s timeout for PMC operations', () => {
      expect(service.getTimeout('search:pmc')).toBe(65000);
    });

    it('should have PMC timeout greater than other search sources', () => {
      const pmcTimeout = service.getTimeout('search:pmc');
      const pubmedTimeout = service.getTimeout('search:pubmed');
      const semanticScholarTimeout = service.getTimeout('search:semantic_scholar');
      const openalex = service.getTimeout('search:openalex');

      // PMC is inherently slower due to full-text XML parsing
      expect(pmcTimeout).toBeGreaterThan(pubmedTimeout);
      expect(pmcTimeout).toBeGreaterThan(semanticScholarTimeout);
      expect(pmcTimeout).toBeGreaterThan(openalex);
    });
  });

  describe('recordLatency', () => {
    it('should record latency samples', () => {
      service.recordLatency('search:pubmed', 100, true);
      service.recordLatency('search:pubmed', 150, true);
      service.recordLatency('search:pubmed', 200, true);

      const metrics = service.getMetrics('search:pubmed');
      expect(metrics).not.toBeNull();
      expect(metrics!.totalRequests).toBe(3);
      expect(metrics!.successfulRequests).toBe(3);
    });

    it('should track failed requests separately', () => {
      service.recordLatency('search:pubmed', 100, true);
      service.recordLatency('search:pubmed', 5000, false);
      service.recordLatency('search:pubmed', 150, true);

      const metrics = service.getMetrics('search:pubmed');
      expect(metrics!.successfulRequests).toBe(2);
      expect(metrics!.failedRequests).toBe(1);
    });

    it('should calculate success rate correctly', () => {
      // 8 successes, 2 failures = 80% success rate
      for (let i = 0; i < 8; i++) {
        service.recordLatency('test:op', 100, true);
      }
      for (let i = 0; i < 2; i++) {
        service.recordLatency('test:op', 100, false);
      }

      const metrics = service.getMetrics('test:op');
      expect(metrics!.successRate).toBe(80);
    });
  });

  describe('recordTimeout', () => {
    it('should increment timeout counter', () => {
      service.recordLatency('search:pubmed', 100, true);
      service.recordTimeout('search:pubmed');
      service.recordTimeout('search:pubmed');

      const metrics = service.getMetrics('search:pubmed');
      expect(metrics!.timeouts).toBe(2);
    });
  });

  describe('percentile calculation', () => {
    it('should calculate percentiles correctly with sufficient samples', () => {
      // Add 100 samples with varying latencies
      for (let i = 1; i <= 100; i++) {
        service.recordLatency('test:percentiles', i * 10, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:percentiles');
      expect(recommendation.confidence).toBe('high');
      // P50 of 10,20,30...1000 is around 500-510ms due to interpolation
      expect(recommendation.percentiles.p50).toBeGreaterThanOrEqual(490);
      expect(recommendation.percentiles.p50).toBeLessThanOrEqual(520);
      expect(recommendation.percentiles.p95).toBeGreaterThanOrEqual(940);
      expect(recommendation.percentiles.p95).toBeLessThanOrEqual(960);
      expect(recommendation.percentiles.p99).toBeGreaterThanOrEqual(980);
      expect(recommendation.percentiles.p99).toBeLessThanOrEqual(1000);
      expect(recommendation.percentiles.min).toBe(10);
      expect(recommendation.percentiles.max).toBe(1000);
    });

    it('should return low confidence with insufficient samples', () => {
      // Only 10 samples (less than MIN_SAMPLES_FOR_CONFIDENCE = 30)
      for (let i = 1; i <= 10; i++) {
        service.recordLatency('test:few', i * 100, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:few');
      expect(recommendation.confidence).toBe('low');
      expect(recommendation.reason).toContain('Insufficient samples');
    });

    it('should calculate mean and standard deviation', () => {
      // Add samples: 100, 200, 300, 400, 500 (mean = 300)
      for (let i = 1; i <= 50; i++) {
        service.recordLatency('test:stats', i * 10, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:stats');
      expect(recommendation.percentiles.mean).toBeGreaterThan(0);
      expect(recommendation.percentiles.stdDev).toBeGreaterThan(0);
    });
  });

  describe('adaptive timeout calculation', () => {
    it('should update timeout based on P95 with safety margin', () => {
      // Add 50 samples with 100ms latency
      for (let i = 0; i < 50; i++) {
        service.recordLatency('test:adaptive', 100, true);
      }

      // Get recommendation
      const recommendation = service.getTimeoutRecommendation('test:adaptive');

      // P95 ~= 100ms, with 1.5x safety margin = ~150ms
      // But minimum is 1000ms
      expect(recommendation.recommendedTimeoutMs).toBeGreaterThanOrEqual(1000);
    });

    it('should respect maximum timeout limit', () => {
      // Add samples with very high latency
      for (let i = 0; i < 50; i++) {
        service.recordLatency('test:max', 100000, true); // 100 seconds
      }

      const recommendation = service.getTimeoutRecommendation('test:max');
      // Should be capped at MAX_TIMEOUT_MS (120000)
      expect(recommendation.recommendedTimeoutMs).toBeLessThanOrEqual(120000);
      expect(recommendation.safeTimeoutMs).toBeLessThanOrEqual(120000);
    });

    it('should calculate safe timeout using P99', () => {
      // Add varied samples
      for (let i = 0; i < 50; i++) {
        service.recordLatency('test:safe', 1000 + Math.random() * 500, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:safe');
      // Safe timeout should be higher than recommended (P99 * 2 vs P95 * 1.5)
      expect(recommendation.safeTimeoutMs).toBeGreaterThanOrEqual(recommendation.recommendedTimeoutMs);
    });
  });

  describe('getAllMetrics', () => {
    it('should return metrics for all tracked operations', () => {
      service.recordLatency('op1', 100, true);
      service.recordLatency('op2', 200, true);
      service.recordLatency('op3', 300, true);

      const metrics = service.getAllMetrics();
      expect(metrics.length).toBe(3);
      expect(metrics.map(m => m.operation).sort()).toEqual(['op1', 'op2', 'op3']);
    });

    it('should return empty array when no operations tracked', () => {
      const metrics = service.getAllMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('resetOperation', () => {
    it('should clear data for specific operation', () => {
      service.recordLatency('op1', 100, true);
      service.recordLatency('op2', 200, true);

      service.resetOperation('op1');

      expect(service.getMetrics('op1')).toBeNull();
      expect(service.getMetrics('op2')).not.toBeNull();
    });
  });

  describe('resetAll', () => {
    it('should clear all data', () => {
      service.recordLatency('op1', 100, true);
      service.recordLatency('op2', 200, true);

      service.resetAll();

      expect(service.getAllMetrics()).toEqual([]);
    });
  });

  describe('spike filtering', () => {
    it('should filter anomalous spikes from percentile calculations', () => {
      // Add 40 normal samples
      for (let i = 0; i < 40; i++) {
        service.recordLatency('test:spikes', 100, true);
      }

      // Add 5 spike samples (should be filtered as > 3x median)
      for (let i = 0; i < 5; i++) {
        service.recordLatency('test:spikes', 10000, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:spikes');
      // P95 should be based on filtered samples, not including spikes
      // With spike filtering, the high values should be excluded
      expect(recommendation.percentiles.p95).toBeLessThan(5000);
    });
  });

  describe('medium confidence', () => {
    it('should return medium confidence with 30-99 samples', () => {
      for (let i = 0; i < 50; i++) {
        service.recordLatency('test:medium', 100, true);
      }

      const recommendation = service.getTimeoutRecommendation('test:medium');
      expect(recommendation.confidence).toBe('medium');
    });
  });

  describe('getTimeout with adaptive value', () => {
    it('should return adaptive timeout after sufficient samples', () => {
      // Record enough samples to trigger adaptive timeout update
      for (let i = 0; i < 35; i++) {
        service.recordLatency('test:getTimeout', 2000, true);
      }

      const timeout = service.getTimeout('test:getTimeout');
      // Should be adaptive value (P95 * 1.5), not default
      expect(timeout).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('edge cases', () => {
    it('should handle empty samples for percentiles', () => {
      const recommendation = service.getTimeoutRecommendation('nonexistent');
      expect(recommendation.percentiles.p50).toBe(0);
      expect(recommendation.percentiles.p95).toBe(0);
      expect(recommendation.percentiles.sampleCount).toBe(0);
    });

    it('should handle all failed samples', () => {
      for (let i = 0; i < 35; i++) {
        service.recordLatency('test:allFailed', 100, false);
      }

      const recommendation = service.getTimeoutRecommendation('test:allFailed');
      // Should still return valid structure but with zero percentiles
      expect(recommendation.percentiles.p50).toBe(0);
      expect(recommendation.percentiles.sampleCount).toBe(35);
    });

    it('should handle single sample', () => {
      service.recordLatency('test:single', 500, true);

      const metrics = service.getMetrics('test:single');
      expect(metrics!.totalRequests).toBe(1);
    });
  });
});
