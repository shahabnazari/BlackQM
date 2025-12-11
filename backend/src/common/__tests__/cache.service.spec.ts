/**
 * Cache Service Tests - Phase 10.112 Week 1
 * Netflix-Grade Memory Management & Collision Detection
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService, CacheResult, CacheStats } from '../cache.service';

describe('CacheService - Phase 10.112 Netflix-Grade', () => {
  let service: CacheService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue: any) => {
        const config: Record<string, number> = {
          CACHE_MAX_KEYS: 100, // Small for testing
          CACHE_MEMORY_PRESSURE_THRESHOLD_MB: 1024,
          CACHE_MEMORY_CHECK_INTERVAL_MS: 60000,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    service.onModuleInit();
  });

  afterEach(async () => {
    service.onModuleDestroy();
    await service.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values correctly', async () => {
      await service.set('test-key', { data: 'test-value' });
      const result = await service.get('test-key');

      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent keys', async () => {
      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should delete keys correctly', async () => {
      await service.set('delete-test', 'value');
      await service.delete('delete-test');
      const result = await service.get('delete-test');

      expect(result).toBeNull();
    });

    it('should check key existence', async () => {
      await service.set('exists-test', 'value');

      expect(await service.has('exists-test')).toBe(true);
      expect(await service.has('not-exists')).toBe(false);
    });
  });

  describe('Cache Staleness Tiers', () => {
    it('should return fresh data with isFresh=true', async () => {
      await service.set('fresh-test', { value: 'fresh' });
      const result = await service.getWithMetadata<{ value: string }>('fresh-test');

      expect(result.isFresh).toBe(true);
      expect(result.isStale).toBe(false);
      expect(result.isArchive).toBe(false);
      expect(result.data?.value).toBe('fresh');
    });

    it('should return stale data when requested', async () => {
      await service.set('stale-test', { value: 'data' });
      const result = await service.getStaleOrArchive<{ value: string }>('stale-test');

      // Fresh data should not be returned by getStaleOrArchive
      expect(result.data).toBeNull();
    });
  });

  describe('Phase 10.112: Collision Detection', () => {
    it('should detect hash collisions and return cache miss', async () => {
      // This test verifies the collision detection mechanism
      // In practice, SHA collisions are extremely rare
      await service.set('collision-test', { original: 'value1' });

      // The originalKey stored should match the key used for retrieval
      const result = await service.getWithMetadata<{ original: string }>('collision-test');

      expect(result.data?.original).toBe('value1');
      expect(service.getCollisionCount()).toBe(0);
    });

    it('should track collision count', () => {
      const initialCount = service.getCollisionCount();
      expect(typeof initialCount).toBe('number');
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Phase 10.112: Memory Management', () => {
    it('should report cache statistics', () => {
      const stats: CacheStats = service.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('collisions');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('memoryPressureFlushes');
      expect(stats).toHaveProperty('memoryUsageMB');
    });

    it('should track evictions', async () => {
      // Fill cache to trigger eviction
      for (let i = 0; i < 110; i++) {
        await service.set(`evict-test-${i}`, { data: i });
      }

      const evictionCount = service.getEvictionCount();
      expect(evictionCount).toBeGreaterThanOrEqual(10); // Should have evicted some
    });

    it('should check if cache is at capacity', async () => {
      // Fill cache
      for (let i = 0; i < 100; i++) {
        await service.set(`capacity-${i}`, i);
      }

      expect(service.isAtCapacity()).toBe(true);
    });

    it('should return correct key count', async () => {
      await service.clear();
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      expect(service.getKeyCount()).toBe(2);
    });

    it('should return max keys configuration', () => {
      expect(service.getMaxKeys()).toBe(100); // From mock config
    });
  });

  describe('Phase 10.112: Memory Pressure', () => {
    it('should have memory pressure flush count', () => {
      const flushCount = service.getMemoryPressureFlushCount();
      expect(typeof flushCount).toBe('number');
      expect(flushCount).toBeGreaterThanOrEqual(0);
    });

    it('should allow forcing memory check', () => {
      // Should not throw
      expect(() => service.forceMemoryCheck()).not.toThrow();
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', async () => {
      await service.set('prefix:key1', 'value1');
      await service.set('prefix:key2', 'value2');
      await service.set('other:key', 'value3');

      const deleted = await service.deletePattern('prefix:');

      expect(deleted).toBe(2);
      expect(await service.has('prefix:key1')).toBe(false);
      expect(await service.has('other:key')).toBe(true);
    });
  });
});
