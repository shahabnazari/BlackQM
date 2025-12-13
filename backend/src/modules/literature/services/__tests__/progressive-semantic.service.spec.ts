/**
 * Progressive Semantic Service Tests
 * Phase 10.113 Week 12: Netflix-Grade Integration Tests
 *
 * Covers:
 * - Tiered semantic scoring (immediate/refined/complete)
 * - Version numbering for ordering guarantees
 * - Safe tier boundary calculations
 * - AbortSignal cancellation handling
 * - Query embedding cache
 * - Error recovery and graceful degradation
 */

import {
  ProgressiveSemanticService,
  SemanticTierResult,
  PaperWithSemanticScore,
  AbortError,
} from '../progressive-semantic.service';
import { Paper, LiteratureSource } from '../../dto/literature.dto';
import { EmbeddingCacheService, CachedEmbedding, UncachedPaper } from '../embedding-cache.service';
import { EmbeddingPoolService } from '../embedding-pool.service';
import { LocalEmbeddingService } from '../local-embedding.service';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

const createMockPaper = (index: number): Paper => ({
  id: `paper-${index}`,
  title: `Test Paper ${index}`,
  abstract: `Abstract for test paper ${index}. Contains relevant research content.`,
  authors: [`Author ${index}`],
  year: 2024,
  source: LiteratureSource.SEMANTIC_SCHOLAR,
  doi: `10.1234/test.${index}`,
});

const createMockPapers = (count: number): Paper[] =>
  Array.from({ length: count }, (_, i) => createMockPaper(i));

const createMockEmbedding = (dimensions: number = 384): number[] =>
  Array.from({ length: dimensions }, () => Math.random() - 0.5);

// ============================================================================
// MOCK SERVICES
// ============================================================================

const createMockEmbeddingCache = (): jest.Mocked<EmbeddingCacheService> => ({
  getCachedEmbeddings: jest.fn().mockResolvedValue({
    cached: [],
    uncached: [],
  }),
  cacheEmbeddings: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<EmbeddingCacheService>);

const createMockEmbeddingPool = (): jest.Mocked<EmbeddingPoolService> => ({
  isPoolReady: jest.fn().mockReturnValue(true),
  embedWithTimeout: jest.fn(),
} as unknown as jest.Mocked<EmbeddingPoolService>);

const createMockLocalEmbedding = (): jest.Mocked<LocalEmbeddingService> => ({
  generateEmbedding: jest.fn().mockResolvedValue(createMockEmbedding()),
  generateEmbeddingsBatch: jest.fn(),
} as unknown as jest.Mocked<LocalEmbeddingService>);

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ProgressiveSemanticService - Phase 10.113 Week 12', () => {
  let service: ProgressiveSemanticService;
  let mockEmbeddingCache: jest.Mocked<EmbeddingCacheService>;
  let mockEmbeddingPool: jest.Mocked<EmbeddingPoolService>;
  let mockLocalEmbedding: jest.Mocked<LocalEmbeddingService>;

  beforeEach(() => {
    mockEmbeddingCache = createMockEmbeddingCache();
    mockEmbeddingPool = createMockEmbeddingPool();
    mockLocalEmbedding = createMockLocalEmbedding();

    service = new ProgressiveSemanticService(
      mockEmbeddingCache,
      mockEmbeddingPool,
      mockLocalEmbedding,
    );
  });

  // ==========================================================================
  // TIER STREAMING TESTS
  // ==========================================================================

  describe('Tier Streaming', () => {
    it('should yield immediate tier first for small datasets', async () => {
      const papers = createMockPapers(30);
      const queryEmbedding = createMockEmbedding();

      // Setup: all papers uncached, worker pool generates embeddings
      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(1); // Only immediate tier (30 papers < 50)
      expect(results[0].tier).toBe('immediate');
      expect(results[0].version).toBe(1);
      expect(results[0].isComplete).toBe(false);
    });

    it('should yield all three tiers for large datasets', async () => {
      const papers = createMockPapers(300);
      const queryEmbedding = createMockEmbedding();

      // Setup mocks to generate embeddings for each tier
      let callCount = 0;
      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (papers: Paper[]) => ({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(3);
      expect(results[0].tier).toBe('immediate');
      expect(results[1].tier).toBe('refined');
      expect(results[2].tier).toBe('complete');
    });

    it('should increment version numbers for ordering guarantees (Bug 2 FIX)', async () => {
      const papers = createMockPapers(200);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (papers: Paper[]) => ({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Verify strictly increasing version numbers
      for (let i = 0; i < results.length; i++) {
        expect(results[i].version).toBe(i + 1);
      }
    });

    it('should mark final tier as complete', async () => {
      const papers = createMockPapers(600);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (papers: Paper[]) => ({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // All tiers except last should have isComplete: false
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].isComplete).toBe(false);
      }
      expect(results[results.length - 1].isComplete).toBe(true);
    });
  });

  // ==========================================================================
  // SAFE TIER BOUNDARY TESTS (Bug 1 FIX)
  // ==========================================================================

  describe('Safe Tier Boundaries (Bug 1 FIX)', () => {
    it('should not exceed paper count for immediate tier', async () => {
      const papers = createMockPapers(30); // Less than 50
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results[0].papers.length).toBe(30);
      expect(results[0].metadata.papersProcessed).toBe(30);
    });

    it('should correctly split papers across tiers', async () => {
      const papers = createMockPapers(300);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Tier 1: 50 papers, Tier 2: +150 = 200 total, Tier 3: +100 = 300 total
      expect(results[0].papers.length).toBe(50); // Immediate: 0-49
      expect(results[1].papers.length).toBe(200); // Refined: includes 50-199
      expect(results[2].papers.length).toBe(300); // Complete: all papers
    });

    it('should skip empty tiers gracefully', async () => {
      // 55 papers: immediate (0-49) + partial refined (50-54)
      const papers = createMockPapers(55);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) =>
        texts.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(2); // immediate + refined (no complete tier)
      expect(results[0].tier).toBe('immediate');
      expect(results[1].tier).toBe('refined');
    });
  });

  // ==========================================================================
  // ABORT SIGNAL TESTS (Bug 7 FIX)
  // ==========================================================================

  describe('AbortSignal Handling (Bug 7 FIX)', () => {
    it('should throw AbortError when signal is aborted before start', async () => {
      const papers = createMockPapers(100);
      const queryEmbedding = createMockEmbedding();
      const controller = new AbortController();

      // Abort immediately
      controller.abort();

      const results: SemanticTierResult[] = [];
      await expect(async () => {
        for await (const tier of service.streamSemanticScores(
          papers,
          queryEmbedding,
          controller.signal,
        )) {
          results.push(tier);
        }
      }).rejects.toThrow(AbortError);

      expect(results.length).toBe(0);
    });

    it('should throw AbortError when signal is aborted mid-tier', async () => {
      const papers = createMockPapers(100);
      const queryEmbedding = createMockEmbedding();
      const controller = new AbortController();

      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));

      // Abort during embedding generation
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async () => {
        controller.abort();
        return [];
      });

      const results: SemanticTierResult[] = [];
      await expect(async () => {
        for await (const tier of service.streamSemanticScores(
          papers,
          queryEmbedding,
          controller.signal,
        )) {
          results.push(tier);
        }
      }).rejects.toThrow(AbortError);
    });

    it('should check cancellation between tiers', async () => {
      const papers = createMockPapers(200);
      const queryEmbedding = createMockEmbedding();
      const controller = new AbortController();

      let tierCount = 0;
      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));
      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) => {
        tierCount++;
        if (tierCount === 2) {
          // Abort after first tier completes
          controller.abort();
        }
        return texts.map(() => createMockEmbedding());
      });

      const results: SemanticTierResult[] = [];
      await expect(async () => {
        for await (const tier of service.streamSemanticScores(
          papers,
          queryEmbedding,
          controller.signal,
        )) {
          results.push(tier);
        }
      }).rejects.toThrow(AbortError);

      // Should have completed first tier before abort
      expect(results.length).toBe(1);
      expect(results[0].tier).toBe('immediate');
    });
  });

  // ==========================================================================
  // QUERY EMBEDDING CACHE TESTS (Issue 13 FIX)
  // ==========================================================================

  describe('Query Embedding Cache (Issue 13 FIX)', () => {
    it('should cache query embeddings for reuse', async () => {
      const query = 'machine learning healthcare';

      // First call - cache miss
      const embedding1 = await service.generateQueryEmbedding(query);
      expect(mockLocalEmbedding.generateEmbedding).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const embedding2 = await service.generateQueryEmbedding(query);
      expect(mockLocalEmbedding.generateEmbedding).toHaveBeenCalledTimes(1); // Not called again

      expect(embedding1).toBe(embedding2); // Same reference from cache
    });

    it('should normalize queries before caching', async () => {
      const query1 = '  Machine Learning HEALTHCARE  ';
      const query2 = 'machine learning healthcare';

      mockLocalEmbedding.generateEmbedding.mockResolvedValue(createMockEmbedding());

      await service.generateQueryEmbedding(query1);
      await service.generateQueryEmbedding(query2);

      // Both should hit same cache entry after normalization
      expect(mockLocalEmbedding.generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('should evict oldest entry when cache is full (LRU)', async () => {
      // Generate 101 unique queries to trigger eviction (cache max is 100)
      for (let i = 0; i <= 100; i++) {
        mockLocalEmbedding.generateEmbedding.mockResolvedValue(createMockEmbedding());
        await service.generateQueryEmbedding(`unique query ${i}`);
      }

      // First query should have been evicted
      mockLocalEmbedding.generateEmbedding.mockResolvedValue(createMockEmbedding());
      await service.generateQueryEmbedding('unique query 0');

      // Should be called 102 times (101 initial + 1 for evicted re-query)
      expect(mockLocalEmbedding.generateEmbedding).toHaveBeenCalledTimes(102);
    });
  });

  // ==========================================================================
  // EMBEDDING FALLBACK CHAIN TESTS (Bug 4 FIX)
  // ==========================================================================

  describe('Embedding Fallback Chain (Bug 4 FIX)', () => {
    it('should use cached embeddings when available', async () => {
      const papers = createMockPapers(30);
      const queryEmbedding = createMockEmbedding();

      // All cached
      const cachedEmbeddings: CachedEmbedding[] = papers.map((paper) => ({
        paper,
        embedding: createMockEmbedding(),
      }));

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: cachedEmbeddings,
        uncached: [],
      });

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Worker pool should NOT be called since all were cached
      expect(mockEmbeddingPool.embedWithTimeout).not.toHaveBeenCalled();
      expect(results[0].metadata.cacheHits).toBe(30);
      expect(results[0].metadata.embedGenerated).toBe(0);
    });

    it('should fall back to sync embedding when worker pool fails', async () => {
      const papers = createMockPapers(30);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });

      // Worker pool fails
      mockEmbeddingPool.embedWithTimeout.mockRejectedValue(new Error('Worker pool timeout'));

      // Sync fallback succeeds
      mockLocalEmbedding.generateEmbeddingsBatch.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(mockLocalEmbedding.generateEmbeddingsBatch).toHaveBeenCalled();
      expect(results.length).toBe(1);
    });

    it('should use worker pool when pool is not ready', async () => {
      const papers = createMockPapers(30);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });

      // Worker pool not ready
      mockEmbeddingPool.isPoolReady.mockReturnValue(false);

      // Sync embedding should be called
      mockLocalEmbedding.generateEmbeddingsBatch.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(mockEmbeddingPool.embedWithTimeout).not.toHaveBeenCalled();
      expect(mockLocalEmbedding.generateEmbeddingsBatch).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ERROR RECOVERY TESTS (Issue 2 FIX)
  // ==========================================================================

  describe('Error Recovery (Issue 2 FIX)', () => {
    it('should yield previous tier results on error', async () => {
      const papers = createMockPapers(200);
      const queryEmbedding = createMockEmbedding();

      let tierCount = 0;
      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));

      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) => {
        tierCount++;
        if (tierCount === 2) {
          throw new Error('Second tier embedding failed');
        }
        return texts.map(() => createMockEmbedding());
      });

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Should have yielded immediate tier successfully
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].tier).toBe('immediate');
    });

    it('should continue to next tier after error recovery', async () => {
      const papers = createMockPapers(300);
      const queryEmbedding = createMockEmbedding();

      let tierCount = 0;
      mockEmbeddingCache.getCachedEmbeddings.mockImplementation(async (tierPapers: Paper[]) => ({
        cached: [],
        uncached: tierPapers.map((paper, index) => ({ paper, index })),
      }));

      mockEmbeddingPool.embedWithTimeout.mockImplementation(async (texts: string[]) => {
        tierCount++;
        if (tierCount === 2) {
          throw new Error('Second tier failed');
        }
        return texts.map(() => createMockEmbedding());
      });

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Should have at least immediate and degraded refined tier
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // SEMANTIC SCORE CALCULATION TESTS
  // ==========================================================================

  describe('Semantic Score Calculation', () => {
    it('should sort papers by semantic score descending', async () => {
      const papers = createMockPapers(10);
      const queryEmbedding = createMockEmbedding();

      // Create embeddings with known similarity ordering
      const sortedEmbeddings = papers.map((_, i) => {
        // Higher index = more similar to query
        const embedding = [...queryEmbedding];
        const noise = (10 - i) * 0.1; // Less noise = more similar
        return embedding.map((v) => v + (Math.random() - 0.5) * noise);
      });

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(sortedEmbeddings);

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      const scores = results[0].papers.map((p) => p.semanticScore);

      // Verify descending order
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should calculate scores between 0 and 1', async () => {
      const papers = createMockPapers(20);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      for (const paper of results[0].papers) {
        expect(paper.semanticScore).toBeGreaterThanOrEqual(0);
        expect(paper.semanticScore).toBeLessThanOrEqual(1);
      }
    });

    it('should return 1 for identical embeddings', async () => {
      const papers = createMockPapers(1);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      // Return exact same embedding as query
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue([queryEmbedding]);

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results[0].papers[0].semanticScore).toBe(1);
    });
  });

  // ==========================================================================
  // METADATA TESTS
  // ==========================================================================

  describe('Tier Metadata', () => {
    it('should include accurate processing metadata', async () => {
      const papers = createMockPapers(50);
      const queryEmbedding = createMockEmbedding();

      // 20 cached, 30 uncached
      const cached: CachedEmbedding[] = papers.slice(0, 20).map((paper) => ({
        paper,
        embedding: createMockEmbedding(),
      }));
      const uncached: UncachedPaper[] = papers.slice(20).map((paper, index) => ({
        paper,
        index: index + 20,
      }));

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({ cached, uncached });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        uncached.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results[0].metadata.papersProcessed).toBe(50);
      expect(results[0].metadata.cacheHits).toBe(20);
      expect(results[0].metadata.embedGenerated).toBe(30);
    });

    it('should track latency for each tier', async () => {
      const papers = createMockPapers(50);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      // Mock operations complete synchronously, so latency can be 0ms
      // In production, real I/O will produce positive latency
      expect(results[0].latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof results[0].latencyMs).toBe('number');
    });

    it('should report worker pool usage status', async () => {
      const papers = createMockPapers(30);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.isPoolReady.mockReturnValue(true);
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results[0].metadata.usedWorkerPool).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty paper array', async () => {
      const papers: Paper[] = [];
      const queryEmbedding = createMockEmbedding();

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(0);
    });

    it('should handle single paper', async () => {
      const papers = createMockPapers(1);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue([createMockEmbedding()]);

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(1);
      expect(results[0].papers.length).toBe(1);
    });

    it('should handle papers at exact tier boundaries', async () => {
      // Exactly 50 papers (tier 1 boundary)
      const papers = createMockPapers(50);
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(1);
      expect(results[0].tier).toBe('immediate');
      expect(results[0].papers.length).toBe(50);
    });

    it('should handle papers with minimal/missing optional fields', async () => {
      // Create papers with minimal required fields and missing optional fields
      const papers: Paper[] = [
        {
          id: 'test-1',
          title: 'Test Paper 1',
          authors: ['Author 1'],
          source: LiteratureSource.SEMANTIC_SCHOLAR,
          // No abstract
        },
        {
          id: 'test-2',
          title: 'Test Paper 2',
          authors: ['Author 2'],
          abstract: 'Abstract only',
          source: LiteratureSource.SEMANTIC_SCHOLAR,
          // No year, no doi
        },
        {
          id: 'test-3',
          title: 'Test Paper 3',
          authors: [],
          source: LiteratureSource.SEMANTIC_SCHOLAR,
          // Empty authors, no abstract
        },
      ];
      const queryEmbedding = createMockEmbedding();

      mockEmbeddingCache.getCachedEmbeddings.mockResolvedValue({
        cached: [],
        uncached: papers.map((paper, index) => ({ paper, index })),
      });
      mockEmbeddingPool.embedWithTimeout.mockResolvedValue(
        papers.map(() => createMockEmbedding()),
      );

      const results: SemanticTierResult[] = [];
      for await (const tier of service.streamSemanticScores(papers, queryEmbedding)) {
        results.push(tier);
      }

      expect(results.length).toBe(1);
      expect(results[0].papers.length).toBe(3);
    });
  });
});
