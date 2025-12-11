/**
 * GracefulDegradationService Tests
 * Phase 10.112 Week 4: Netflix-Grade Multi-Level Fallback Cascade
 */

import { GracefulDegradationService, DegradationLevel, FallbackConfig } from '../graceful-degradation.service';

describe('GracefulDegradationService', () => {
  let service: GracefulDegradationService;

  beforeEach(() => {
    service = new GracefulDegradationService();
  });

  afterEach(() => {
    service.resetStats();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
    });

    it('should start with zero statistics', () => {
      const stats = service.getGlobalStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.fullQualityResponses).toBe(0);
      expect(stats.degradationRate).toBe(0);
    });
  });

  describe('executeWithFallbacks', () => {
    it('should return result from first successful fallback (full quality)', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => 'full-result', description: 'Full quality' },
        { level: 'reduced', fn: async () => 'reduced-result', description: 'Reduced' },
      ];

      const result = await service.executeWithFallbacks('test:op', fallbacks);

      expect(result.data).toBe('full-result');
      expect(result.level).toBe('full');
      expect(result.isFullQuality).toBe(true);
      expect(result.fallbacksAttempted).toBe(1);
      expect(result.fallbacksFailed).toEqual([]);
    });

    it('should fall back to next level when primary fails', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => { throw new Error('Primary failed'); }, description: 'Full quality' },
        { level: 'reduced', fn: async () => 'reduced-result', description: 'Reduced' },
      ];

      const result = await service.executeWithFallbacks('test:op', fallbacks);

      expect(result.data).toBe('reduced-result');
      expect(result.level).toBe('reduced');
      expect(result.isFullQuality).toBe(false);
      expect(result.fallbacksAttempted).toBe(2);
      expect(result.fallbacksFailed.length).toBe(1);
      expect(result.fallbacksFailed[0]).toContain('Primary failed');
    });

    it('should cascade through multiple fallback levels', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => { throw new Error('Full failed'); }, description: 'Full' },
        { level: 'reduced', fn: async () => { throw new Error('Reduced failed'); }, description: 'Reduced' },
        { level: 'cached', fn: async () => { throw new Error('Cached failed'); }, description: 'Cached' },
        { level: 'static', fn: async () => 'static-result', description: 'Static' },
      ];

      const result = await service.executeWithFallbacks('test:op', fallbacks);

      expect(result.data).toBe('static-result');
      expect(result.level).toBe('static');
      expect(result.fallbacksAttempted).toBe(4);
      expect(result.fallbacksFailed.length).toBe(3);
    });

    it('should throw when all fallbacks fail', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => { throw new Error('Full failed'); }, description: 'Full' },
        { level: 'reduced', fn: async () => { throw new Error('Reduced failed'); }, description: 'Reduced' },
      ];

      await expect(service.executeWithFallbacks('test:op', fallbacks))
        .rejects.toThrow('All 2 fallbacks failed');
    });

    it('should sort fallbacks by priority level', async () => {
      const executionOrder: string[] = [];
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'cached', fn: async () => { executionOrder.push('cached'); throw new Error('Cached failed'); }, description: 'Cached' },
        { level: 'full', fn: async () => { executionOrder.push('full'); return 'full-result'; }, description: 'Full' },
        { level: 'reduced', fn: async () => { executionOrder.push('reduced'); throw new Error('Reduced failed'); }, description: 'Reduced' },
      ];

      await service.executeWithFallbacks('test:op', fallbacks);

      // Should try full first (highest priority)
      expect(executionOrder[0]).toBe('full');
    });

    it('should respect timeout configuration', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        {
          level: 'full',
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'slow-result';
          },
          timeout: 100, // 100ms timeout
          description: 'Full with timeout',
        },
        { level: 'reduced', fn: async () => 'reduced-result', description: 'Reduced' },
      ];

      const result = await service.executeWithFallbacks('test:op', fallbacks);

      // Should fall back due to timeout
      expect(result.level).toBe('reduced');
      expect(result.fallbacksFailed.length).toBe(1);
      expect(result.fallbacksFailed[0]).toContain('Timeout');
    });

    it('should handle AbortSignal cancellation', async () => {
      const controller = new AbortController();
      const fallbacks: FallbackConfig<string>[] = [
        {
          level: 'full',
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return 'slow-result';
          },
          description: 'Full slow',
        },
      ];

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50);

      await expect(service.executeWithFallbacks('test:op', fallbacks, controller.signal))
        .rejects.toThrow();
    });
  });

  describe('executeWithCache', () => {
    it('should return primary data when available', async () => {
      const primaryFn = async () => 'primary-data';
      const getCachedFn = async () => 'cached-data';

      const result = await service.executeWithCache('test:op', primaryFn, getCachedFn);

      expect(result.data).toBe('primary-data');
      expect(result.level).toBe('full');
    });

    it('should fall back to cached data when primary fails', async () => {
      const primaryFn = async () => { throw new Error('Primary failed'); };
      const getCachedFn = async () => 'cached-data';

      const result = await service.executeWithCache('test:op', primaryFn, getCachedFn);

      expect(result.data).toBe('cached-data');
      expect(result.level).toBe('cached');
      expect(result.message).toContain('cache');
    });

    it('should skip cached fallback if no cached data', async () => {
      const primaryFn = async () => { throw new Error('Primary failed'); };
      const getCachedFn = async () => null;
      const getStaticFn = async () => 'static-data';

      const result = await service.executeWithCache('test:op', primaryFn, getCachedFn, getStaticFn);

      expect(result.data).toBe('static-data');
      expect(result.level).toBe('static');
    });

    it('should throw when no fallback succeeds', async () => {
      const primaryFn = async () => { throw new Error('Primary failed'); };
      const getCachedFn = async () => null;

      await expect(service.executeWithCache('test:op', primaryFn, getCachedFn))
        .rejects.toThrow('All 2 fallbacks failed');
    });
  });

  describe('executeWithReduced', () => {
    it('should return full quality when available', async () => {
      const fullFn = async () => 'full-quality';
      const reducedFn = async () => 'reduced-quality';

      const result = await service.executeWithReduced('test:op', fullFn, reducedFn);

      expect(result.data).toBe('full-quality');
      expect(result.level).toBe('full');
    });

    it('should fall back to reduced quality when full fails', async () => {
      const fullFn = async () => { throw new Error('Full failed'); };
      const reducedFn = async () => 'reduced-quality';

      const result = await service.executeWithReduced('test:op', fullFn, reducedFn);

      expect(result.data).toBe('reduced-quality');
      expect(result.level).toBe('reduced');
    });
  });

  describe('statistics tracking', () => {
    it('should track full quality responses', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => 'result', description: 'Full' },
      ];

      await service.executeWithFallbacks('test:op', fallbacks);
      await service.executeWithFallbacks('test:op', fallbacks);

      const stats = service.getGlobalStats();
      expect(stats.fullQualityResponses).toBe(2);
      expect(stats.totalRequests).toBe(2);
    });

    it('should track reduced quality responses', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
      ];

      await service.executeWithFallbacks('test:op', fallbacks);

      const stats = service.getGlobalStats();
      expect(stats.reducedQualityResponses).toBe(1);
    });

    it('should calculate degradation rate', async () => {
      // 2 full, 2 degraded = 50% degradation
      const fullFallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => 'result', description: 'Full' },
      ];
      const reducedFallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
      ];

      await service.executeWithFallbacks('test:op', fullFallbacks);
      await service.executeWithFallbacks('test:op', fullFallbacks);
      await service.executeWithFallbacks('test:op', reducedFallbacks);
      await service.executeWithFallbacks('test:op', reducedFallbacks);

      const stats = service.getGlobalStats();
      expect(stats.degradationRate).toBe(0.5);
    });

    it('should track average latency', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        {
          level: 'full',
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'result';
          },
          description: 'Full',
        },
      ];

      await service.executeWithFallbacks('test:op', fallbacks);

      const stats = service.getGlobalStats();
      expect(stats.averageLatencyMs).toBeGreaterThanOrEqual(50);
    });
  });

  describe('getOperationStats', () => {
    it('should return null for unknown operation', () => {
      const stats = service.getOperationStats('unknown');
      expect(stats).toBeNull();
    });

    it('should return stats for tracked operation', async () => {
      const fallbacks: FallbackConfig<string>[] = [
        { level: 'full', fn: async () => 'result', description: 'Full' },
      ];

      await service.executeWithFallbacks('test:op', fallbacks);

      const stats = service.getOperationStats('test:op');
      expect(stats).not.toBeNull();
      expect(stats!.requests).toBe(1);
      expect(stats!.byLevel.full).toBe(1);
    });
  });

  describe('getDegradationRate', () => {
    it('should return 0 for unknown operation', () => {
      const rate = service.getDegradationRate('unknown');
      expect(rate).toBe(0);
    });

    it('should calculate per-operation degradation rate', async () => {
      // 3 full, 1 reduced = 25% degradation
      for (let i = 0; i < 3; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => 'result', description: 'Full' },
        ]);
      }
      await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
      ]);

      const rate = service.getDegradationRate('test:op');
      expect(rate).toBe(0.25);
    });
  });

  describe('getHealthStatus', () => {
    it('should report OK with insufficient data', () => {
      const status = service.getHealthStatus();
      expect(status.healthy).toBe(true);
      expect(status.status).toContain('Insufficient data');
    });

    it('should report OK with low degradation', async () => {
      // Execute 15 full quality requests
      for (let i = 0; i < 15; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => 'result', description: 'Full' },
        ]);
      }

      const status = service.getHealthStatus();
      expect(status.healthy).toBe(true);
      expect(status.status).toContain('Normal operation');
    });

    it('should report warning with elevated degradation', async () => {
      // Execute 7 full, 3 degraded (30% degradation)
      for (let i = 0; i < 7; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => 'result', description: 'Full' },
        ]);
      }
      for (let i = 0; i < 3; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
          { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
        ]);
      }

      const status = service.getHealthStatus();
      expect(status.healthy).toBe(true);
      expect(status.status).toContain('WARNING');
    });

    it('should report critical with high degradation', async () => {
      // Execute 4 full, 6 degraded (60% degradation)
      for (let i = 0; i < 4; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => 'result', description: 'Full' },
        ]);
      }
      for (let i = 0; i < 6; i++) {
        await service.executeWithFallbacks('test:op', [
          { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
          { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
        ]);
      }

      const status = service.getHealthStatus();
      expect(status.healthy).toBe(false);
      expect(status.status).toContain('CRITICAL');
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', async () => {
      await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => 'result', description: 'Full' },
      ]);

      service.resetStats();

      const stats = service.getGlobalStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.fullQualityResponses).toBe(0);
    });
  });

  describe('user-friendly messages', () => {
    it('should generate appropriate message for full quality', async () => {
      const result = await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => 'result', description: 'Full' },
      ]);

      expect(result.message).toContain('full quality');
    });

    it('should generate appropriate message for reduced quality', async () => {
      const result = await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'reduced', fn: async () => 'result', description: 'Reduced' },
      ]);

      expect(result.message).toContain('reduced quality');
    });

    it('should generate appropriate message for cached data', async () => {
      const result = await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'cached', fn: async () => 'result', description: 'Cached' },
      ]);

      expect(result.message).toContain('cache');
    });

    it('should generate appropriate message for static fallback', async () => {
      const result = await service.executeWithFallbacks('test:op', [
        { level: 'full', fn: async () => { throw new Error('fail'); }, description: 'Full' },
        { level: 'static', fn: async () => 'result', description: 'Static' },
      ]);

      expect(result.message).toContain('fallback');
    });
  });

  describe('latency tracking', () => {
    it('should track latency in result', async () => {
      const result = await service.executeWithFallbacks('test:op', [
        {
          level: 'full',
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 30));
            return 'result';
          },
          description: 'Full',
        },
      ]);

      expect(result.latencyMs).toBeGreaterThanOrEqual(30);
    });
  });
});
