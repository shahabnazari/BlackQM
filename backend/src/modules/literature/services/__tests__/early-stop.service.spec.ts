/**
 * Early Stop Service Tests
 * Phase 10.112 Week 2: Netflix-Grade Search Optimization
 */

import { EarlyStopService, EarlyStopConfig, QueryComplexity } from '../early-stop.service';

describe('EarlyStopService - Phase 10.112 Week 2', () => {
  let service: EarlyStopService;

  const createMockPapers = (count: number, qualityScore: number = 50) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `paper-${i}`,
      qualityScore,
    }));
  };

  beforeEach(() => {
    service = new EarlyStopService();
    service.resetMetrics();
  });

  describe('Configuration', () => {
    it('should return default config for moderate complexity', () => {
      const config = service.getConfig('moderate');

      expect(config.targetPaperCount).toBe(200);
      expect(config.minHighQualityCount).toBe(50);
      expect(config.skipLowerTiersThreshold).toBe(150);
      expect(config.enabled).toBe(true);
    });

    it('should return config for simple complexity', () => {
      const config = service.getConfig('simple');

      expect(config.targetPaperCount).toBe(100);
      expect(config.minHighQualityCount).toBe(25);
      expect(config.skipLowerTiersThreshold).toBe(75);
    });

    it('should return config for complex queries', () => {
      const config = service.getConfig('complex');

      expect(config.targetPaperCount).toBe(500);
      expect(config.minHighQualityCount).toBe(100);
      expect(config.skipLowerTiersThreshold).toBe(300);
    });
  });

  describe('Early Stop Decision - Paper Count Threshold', () => {
    it('should stop when paper threshold reached', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(160);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toContain('paper threshold');
      expect(decision.papersCollected).toBe(160);
    });

    it('should not stop when below threshold', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(100);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.shouldStop).toBe(false);
      expect(decision.reason).toBeNull();
    });
  });

  describe('Early Stop Decision - Quality Threshold', () => {
    it('should stop when high quality threshold reached', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(60, 80);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toContain('quality threshold');
    });

    it('should not stop when high quality count insufficient', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(100, 50);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.shouldStop).toBe(false);
    });
  });

  describe('Early Stop Decision - Target Count', () => {
    it('should stop when target paper count reached', () => {
      const config: EarlyStopConfig = {
        ...service.getConfig('moderate'),
        skipLowerTiersThreshold: 250,
        minHighQualityCount: 250,
        targetPaperCount: 200,
      };
      const papers = createMockPapers(200, 50);

      const decision = service.shouldStopEarly(papers, config, ['tier1', 'tier2']);

      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toContain('target');
    });
  });

  describe('Early Stop Decision - Disabled', () => {
    it('should not stop when early-stop is disabled', () => {
      const config: EarlyStopConfig = {
        ...service.getConfig('moderate'),
        enabled: false,
      };
      const papers = createMockPapers(500);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.shouldStop).toBe(false);
    });
  });

  describe('Cancellation Token', () => {
    it('should create cancellation token', () => {
      const token = service.createCancellationToken();

      expect(token.cancelled).toBe(false);
      expect(token.reason).toBeNull();
    });

    it('should cancel token with reason', () => {
      const token = service.createCancellationToken();

      token.cancel('test-reason');

      expect(token.cancelled).toBe(true);
      expect(token.reason).toBe('test-reason');
    });
  });

  describe('Execute With Cancellation', () => {
    it('should execute operation when not cancelled', async () => {
      const token = service.createCancellationToken();

      const result = await service.executeWithCancellation(
        'test-tier',
        async () => 'success',
        token,
      );

      expect(result).toBe('success');
    });

    it('should return null when already cancelled', async () => {
      const token = service.createCancellationToken();
      token.cancel('pre-cancelled');

      const result = await service.executeWithCancellation(
        'test-tier',
        async () => 'should not run',
        token,
      );

      expect(result).toBeNull();
    });
  });

  describe('Decision Metadata', () => {
    it('should include tier information in decision', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(160);

      const decision = service.shouldStopEarly(papers, config, ['tier1', 'tier2']);

      expect(decision.tiersCompleted).toEqual(['tier1', 'tier2']);
      expect(decision.tiersSkipped).toContain('tier3');
      expect(decision.tiersSkipped).toContain('tier4');
    });

    it('should estimate saved API calls', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(160);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.savedApiCalls).toBeGreaterThan(0);
    });

    it('should estimate time saved', () => {
      const config = service.getConfig('moderate');
      const papers = createMockPapers(160);

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.timeSavedMs).toBeGreaterThan(0);
    });
  });

  describe('Metrics', () => {
    it('should track total searches', () => {
      service.recordSearchCompletion(false);
      service.recordSearchCompletion(false);

      const metrics = service.getMetrics();
      expect(metrics.totalSearches).toBe(2);
    });

    it('should calculate early stop rate', () => {
      const config = service.getConfig('moderate');

      service.shouldStopEarly(createMockPapers(160), config, ['tier1']);
      service.recordSearchCompletion(false);
      service.recordSearchCompletion(false);

      const metrics = service.getMetrics();
      expect(metrics.totalSearches).toBe(2);
    });

    it('should reset metrics', () => {
      service.recordSearchCompletion(false);

      service.resetMetrics();

      const metrics = service.getMetrics();
      expect(metrics.totalSearches).toBe(0);
    });
  });

  describe('High Quality Paper Counting', () => {
    it('should count papers above quality threshold', () => {
      const config = service.getConfig('moderate');
      const papers = [
        { id: '1', qualityScore: 80 },
        { id: '2', qualityScore: 75 },
        { id: '3', qualityScore: 60 },
        { id: '4', qualityScore: 50 },
      ];

      const decision = service.shouldStopEarly(papers, config, ['tier1']);

      expect(decision.highQualityCount).toBe(2);
    });

    it('should handle papers without quality score', () => {
      const config = service.getConfig('moderate');
      const papers = [
        { id: '1', qualityScore: undefined },
        { id: '2' },
        { id: '3', qualityScore: 80 },
      ];

      const decision = service.shouldStopEarly(papers as any, config, ['tier1']);

      expect(decision.highQualityCount).toBe(1);
    });
  });

  describe('Query Complexity Configs', () => {
    const complexities: QueryComplexity[] = ['simple', 'moderate', 'complex'];

    it.each(complexities)('should return valid config for %s complexity', (complexity) => {
      const config = service.getConfig(complexity);

      expect(config.targetPaperCount).toBeGreaterThan(0);
      expect(config.minHighQualityCount).toBeGreaterThan(0);
      expect(config.skipLowerTiersThreshold).toBeGreaterThan(0);
      expect(config.qualityScoreThreshold).toBeGreaterThan(0);
      expect(config.maxTierLatencyMs).toBeGreaterThan(0);
    });

    it('should have increasing thresholds with complexity', () => {
      const simple = service.getConfig('simple');
      const moderate = service.getConfig('moderate');
      const complex = service.getConfig('complex');

      expect(simple.targetPaperCount).toBeLessThan(moderate.targetPaperCount);
      expect(moderate.targetPaperCount).toBeLessThan(complex.targetPaperCount);
    });
  });
});
