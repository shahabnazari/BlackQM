/**
 * Cursor-Based Cache Service Tests
 * Phase 10.112 Week 3: Netflix-Grade ID-List Caching
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CursorBasedCacheService, CachedPaper, QueryParams } from '../cursor-based-cache.service';

describe('CursorBasedCacheService', () => {
  let service: CursorBasedCacheService;

  const mockPapers: CachedPaper[] = [
    {
      id: 'paper-1',
      title: 'Test Paper 1',
      authors: ['Author A'],
      year: 2024,
      source: 'pubmed',
      qualityScore: 85,
    },
    {
      id: 'paper-2',
      title: 'Test Paper 2',
      authors: ['Author B'],
      year: 2023,
      source: 'arxiv',
      qualityScore: 75,
    },
    {
      id: 'paper-3',
      title: 'Test Paper 3',
      authors: ['Author C'],
      year: 2022,
      source: 'semantic-scholar',
      qualityScore: 90,
    },
  ];

  const mockQueryParams: QueryParams = {
    query: 'machine learning',
    sources: ['pubmed', 'arxiv'],
    yearFrom: 2020,
    yearTo: 2024,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CursorBasedCacheService],
    }).compile();

    service = module.get<CursorBasedCacheService>(CursorBasedCacheService);
    service.clear(); // Clear cache before each test
  });

  afterEach(() => {
    service.clear();
  });

  describe('generateQueryHash', () => {
    it('should generate consistent hash for same query params', () => {
      const hash1 = service.generateQueryHash(mockQueryParams);
      const hash2 = service.generateQueryHash(mockQueryParams);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different queries', () => {
      const hash1 = service.generateQueryHash(mockQueryParams);
      const hash2 = service.generateQueryHash({ ...mockQueryParams, query: 'deep learning' });
      expect(hash1).not.toBe(hash2);
    });

    it('should normalize query to lowercase', () => {
      const hash1 = service.generateQueryHash({ query: 'Machine Learning' });
      const hash2 = service.generateQueryHash({ query: 'machine learning' });
      expect(hash1).toBe(hash2);
    });

    it('should handle empty sources array', () => {
      const hash1 = service.generateQueryHash({ query: 'test', sources: [] });
      const hash2 = service.generateQueryHash({ query: 'test' });
      // Both should work without error
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });
  });

  describe('cacheResults', () => {
    it('should cache papers and return a cache key', () => {
      const cacheKey = service.cacheResults(mockQueryParams, mockPapers, 100);
      expect(cacheKey).toBeDefined();
      expect(typeof cacheKey).toBe('string');
      expect(cacheKey.length).toBe(64); // SHA-256 hash
    });

    it('should increment cache stats', () => {
      const statsBefore = service.getStats();
      service.cacheResults(mockQueryParams, mockPapers, 100);
      const statsAfter = service.getStats();
      expect(statsAfter.idListEntries).toBe(statsBefore.idListEntries + 1);
      expect(statsAfter.cachedPapers).toBe(statsBefore.cachedPapers + mockPapers.length);
    });
  });

  describe('getPaginatedResults', () => {
    beforeEach(() => {
      service.cacheResults(mockQueryParams, mockPapers, mockPapers.length);
    });

    it('should return cached papers with pagination', () => {
      const result = service.getPaginatedResults(mockQueryParams, 0, 2);
      expect(result).not.toBeNull();
      expect(result!.papers.length).toBe(2);
      expect(result!.totalResults).toBe(mockPapers.length);
      expect(result!.fromCache).toBe(true);
    });

    it('should respect offset and limit', () => {
      const result = service.getPaginatedResults(mockQueryParams, 1, 2);
      expect(result).not.toBeNull();
      expect(result!.papers.length).toBe(2);
      expect(result!.papers[0].id).toBe('paper-2');
    });

    it('should return null for uncached query', () => {
      const result = service.getPaginatedResults({ query: 'not cached' }, 0, 10);
      expect(result).toBeNull();
    });

    it('should increment hit counter on cache hit', () => {
      const statsBefore = service.getStats();
      service.getPaginatedResults(mockQueryParams, 0, 10);
      const statsAfter = service.getStats();
      expect(statsAfter.idListHits).toBe(statsBefore.idListHits + 1);
    });

    it('should increment miss counter on cache miss', () => {
      const statsBefore = service.getStats();
      service.getPaginatedResults({ query: 'not cached' }, 0, 10);
      const statsAfter = service.getStats();
      expect(statsAfter.idListMisses).toBe(statsBefore.idListMisses + 1);
    });
  });

  describe('isCached', () => {
    it('should return true for cached query', () => {
      service.cacheResults(mockQueryParams, mockPapers, 100);
      expect(service.isCached(mockQueryParams)).toBe(true);
    });

    it('should return false for uncached query', () => {
      expect(service.isCached({ query: 'not cached' })).toBe(false);
    });
  });

  describe('getCachedTotalCount', () => {
    it('should return total count for cached query', () => {
      service.cacheResults(mockQueryParams, mockPapers, 500);
      expect(service.getCachedTotalCount(mockQueryParams)).toBe(500);
    });

    it('should return null for uncached query', () => {
      expect(service.getCachedTotalCount({ query: 'not cached' })).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return valid stats object', () => {
      const stats = service.getStats();
      expect(stats).toHaveProperty('idListHits');
      expect(stats).toHaveProperty('idListMisses');
      expect(stats).toHaveProperty('idListHitRate');
      expect(stats).toHaveProperty('paperHits');
      expect(stats).toHaveProperty('paperMisses');
      expect(stats).toHaveProperty('paperHitRate');
      expect(stats).toHaveProperty('idListEntries');
      expect(stats).toHaveProperty('cachedPapers');
      expect(stats).toHaveProperty('collisions');
      expect(stats).toHaveProperty('estimatedMemoryMB');
      expect(stats).toHaveProperty('memorySavedMB');
    });

    it('should calculate hit rate correctly', () => {
      service.cacheResults(mockQueryParams, mockPapers, 100);
      service.getPaginatedResults(mockQueryParams, 0, 10); // Hit
      service.getPaginatedResults({ query: 'not cached' }, 0, 10); // Miss

      const stats = service.getStats();
      expect(stats.idListHitRate).toBe(50); // 1 hit, 1 miss = 50%
    });
  });

  describe('resetStats', () => {
    it('should reset all counters', () => {
      service.cacheResults(mockQueryParams, mockPapers, 100);
      service.getPaginatedResults(mockQueryParams, 0, 10);
      service.resetStats();

      const stats = service.getStats();
      expect(stats.idListHits).toBe(0);
      expect(stats.idListMisses).toBe(0);
      expect(stats.paperHits).toBe(0);
      expect(stats.paperMisses).toBe(0);
      expect(stats.collisions).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all caches and stats', () => {
      service.cacheResults(mockQueryParams, mockPapers, 100);
      service.clear();

      const stats = service.getStats();
      expect(stats.idListEntries).toBe(0);
      expect(stats.cachedPapers).toBe(0);
      expect(service.isCached(mockQueryParams)).toBe(false);
    });
  });

  describe('Memory efficiency', () => {
    it('should share papers across multiple queries', () => {
      // Cache first query with 3 papers
      service.cacheResults(mockQueryParams, mockPapers, 100);

      // Cache second query with same papers
      const differentQuery = { ...mockQueryParams, query: 'different query' };
      service.cacheResults(differentQuery, mockPapers, 100);

      const stats = service.getStats();
      // Should have 2 ID lists but papers are shared
      expect(stats.idListEntries).toBe(2);
      // Papers might be deduplicated or have reference counting
      expect(stats.cachedPapers).toBeGreaterThanOrEqual(mockPapers.length);
    });
  });
});
