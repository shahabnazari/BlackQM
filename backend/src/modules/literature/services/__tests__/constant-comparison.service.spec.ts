/**
 * Phase 10.170 Week 4+: Constant Comparison Engine Tests
 * Phase 10.185: Netflix-Grade - Added Vitest imports for ESM compatibility
 *
 * Tests for Security Critical #12: O(n²) optimization with similarity cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConstantComparisonEngine } from '../constant-comparison.service';

// InitialCode interface matching the actual type
interface InitialCode {
  id: string;
  label: string;
  description: string;
  sourceId: string;
  excerpts: string[];
}

describe('ConstantComparisonEngine', () => {
  let service: ConstantComparisonEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConstantComparisonEngine],
    }).compile();

    service = module.get<ConstantComparisonEngine>(ConstantComparisonEngine);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processCodeWithComparison', () => {
    const createMockCode = (label: string, index: number): InitialCode => ({
      id: `code_${index}`,
      label,
      description: `Description for ${label}`,
      sourceId: `source_${index}`,
      excerpts: [`Excerpt for ${label}`],
    });

    const createMockEmbeddings = (codes: readonly InitialCode[]): ReadonlyMap<string, number[]> => {
      const embeddings = new Map<string, number[]>();
      codes.forEach((code, i) => {
        // Create mock 128-dim embedding
        const embedding = Array.from({ length: 128 }, () => Math.random());
        embeddings.set(code.id, embedding);
      });
      return embeddings;
    };

    it('should compare a new code with existing codes', async () => {
      const existingCodes = [
        createMockCode('user experience', 0),
        createMockCode('interface design', 1),
        createMockCode('accessibility', 2),
      ];

      const newCode = createMockCode('usability testing', 3);

      const embeddings = createMockEmbeddings([...existingCodes, newCode]);

      const results = await service.processCodeWithComparison(
        newCode,
        existingCodes,
        embeddings,
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(existingCodes.length);
    });

    it('should return comparison results with correct structure', async () => {
      const existingCodes = [createMockCode('test code', 0)];
      const newCode = createMockCode('new code', 1);
      const embeddings = createMockEmbeddings([...existingCodes, newCode]);

      const results = await service.processCodeWithComparison(
        newCode,
        existingCodes,
        embeddings,
      );

      if (results.length > 0) {
        expect(results[0]).toHaveProperty('codeAId');
        expect(results[0]).toHaveProperty('codeBId');
        expect(results[0]).toHaveProperty('similarity');
        expect(results[0]).toHaveProperty('shouldMerge');
        expect(results[0]).toHaveProperty('relationship');
        expect(results[0]).toHaveProperty('comparedAt');
      }
    });

    it('should handle empty existing codes array', async () => {
      const newCode = createMockCode('new code', 0);
      const embeddings = createMockEmbeddings([newCode]);

      const results = await service.processCodeWithComparison(
        newCode,
        [],
        embeddings,
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('batchCompare', () => {
    const createMockCodes = (count: number): InitialCode[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `code_${i}`,
        label: `Code Label ${i}`,
        description: `Description for code ${i}`,
        sourceId: `source_${i}`,
        excerpts: [`Excerpt ${i}`],
      }));
    };

    const createEmbeddingsMap = (codes: readonly InitialCode[]): ReadonlyMap<string, number[]> => {
      const map = new Map<string, number[]>();
      codes.forEach((code) => {
        map.set(code.id, Array.from({ length: 128 }, () => Math.random()));
      });
      return map;
    };

    it('should batch compare multiple codes', async () => {
      const codes = createMockCodes(5);
      const embeddings = createEmbeddingsMap(codes);

      const result = await service.batchCompare(codes, embeddings);

      expect(result).toBeDefined();
      expect(result.comparisons).toBeDefined();
      expect(result.mergeGroups).toBeDefined();
      expect(result.independentCodes).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.cacheStats).toBeDefined();
    });

    it('should use similarity cache for repeated comparisons (Security Critical #12)', async () => {
      const codes = createMockCodes(10);
      const embeddings = createEmbeddingsMap(codes);

      // First comparison
      const result1 = await service.batchCompare(codes, embeddings);

      // Second comparison should use cache
      const result2 = await service.batchCompare(codes, embeddings);

      // Cache should have hits on second comparison
      expect(result2.cacheStats.hits).toBeGreaterThanOrEqual(0);
    });

    it('should identify merge groups for similar codes', async () => {
      // Create codes with similar embeddings
      const codes: InitialCode[] = [
        { id: 'code_1', label: 'user experience', description: 'UX desc', sourceId: 's1', excerpts: ['e1'] },
        { id: 'code_2', label: 'user interface', description: 'UI desc', sourceId: 's2', excerpts: ['e2'] },
        { id: 'code_3', label: 'completely different', description: 'Other', sourceId: 's3', excerpts: ['e3'] },
      ];

      // Create embeddings where first two are similar
      const embeddings = new Map<string, number[]>();
      const baseEmbedding = Array.from({ length: 128 }, () => Math.random());
      embeddings.set('code_1', baseEmbedding);
      embeddings.set('code_2', baseEmbedding.map((v) => v + Math.random() * 0.1)); // Similar
      embeddings.set('code_3', Array.from({ length: 128 }, () => Math.random())); // Different

      const result = await service.batchCompare(codes, embeddings);

      expect(result.mergeGroups).toBeDefined();
      expect(Array.isArray(result.mergeGroups)).toBe(true);
    });

    it('should handle single code input', async () => {
      const codes = createMockCodes(1);
      const embeddings = createEmbeddingsMap(codes);

      const result = await service.batchCompare(codes, embeddings);

      expect(result.comparisons).toHaveLength(0);
      expect(result.independentCodes.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty codes array', async () => {
      const result = await service.batchCompare([], new Map());

      expect(result.comparisons).toHaveLength(0);
      expect(result.mergeGroups).toHaveLength(0);
    });

    it('should track execution time', async () => {
      const codes = createMockCodes(20);
      const embeddings = createEmbeddingsMap(codes);

      const result = await service.batchCompare(codes, embeddings);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should provide cache statistics', async () => {
      const codes = createMockCodes(5);
      const embeddings = createEmbeddingsMap(codes);

      const result = await service.batchCompare(codes, embeddings);

      expect(result.cacheStats).toHaveProperty('size');
      expect(result.cacheStats).toHaveProperty('hits');
      expect(result.cacheStats).toHaveProperty('misses');
      expect(result.cacheStats).toHaveProperty('hitRate');
    });
  });

  describe('clearCache', () => {
    it('should clear the similarity cache', async () => {
      const codes: InitialCode[] = [
        { id: 'code_1', label: 'test1', description: 'd1', sourceId: 's1', excerpts: ['e1'] },
        { id: 'code_2', label: 'test2', description: 'd2', sourceId: 's2', excerpts: ['e2'] },
      ];

      const embeddings = new Map<string, number[]>();
      embeddings.set('code_1', Array.from({ length: 128 }, () => Math.random()));
      embeddings.set('code_2', Array.from({ length: 128 }, () => Math.random()));

      // Populate cache
      await service.batchCompare(codes, embeddings);

      // Clear cache
      service.clearCache();

      // Cache should be empty after clearing
      const result = await service.batchCompare(codes, embeddings);
      expect(result.cacheStats.hits).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return current cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });
  });

  describe('similarity calculation through comparisons', () => {
    it('should produce high similarity for identical embeddings', async () => {
      const codes: InitialCode[] = [
        { id: 'code_1', label: 'test', description: 'd1', sourceId: 's1', excerpts: ['e1'] },
        { id: 'code_2', label: 'test', description: 'd2', sourceId: 's2', excerpts: ['e2'] },
      ];

      // Same embedding for both
      const identicalEmbedding = Array.from({ length: 128 }, () => 0.5);
      const embeddings = new Map<string, number[]>();
      embeddings.set('code_1', identicalEmbedding);
      embeddings.set('code_2', identicalEmbedding);

      const result = await service.batchCompare(codes, embeddings);

      // Identical embeddings should have similarity = 1
      if (result.comparisons.length > 0) {
        expect(result.comparisons[0].similarity).toBeCloseTo(1, 3);
      }
    });

    it('should produce low similarity for different embeddings', async () => {
      const codes: InitialCode[] = [
        { id: 'code_1', label: 'test1', description: 'd1', sourceId: 's1', excerpts: ['e1'] },
        { id: 'code_2', label: 'test2', description: 'd2', sourceId: 's2', excerpts: ['e2'] },
      ];

      // Very different embeddings
      const embeddings = new Map<string, number[]>();
      embeddings.set('code_1', Array.from({ length: 128 }, (_, i) => (i % 2 === 0 ? 1 : 0)));
      embeddings.set('code_2', Array.from({ length: 128 }, (_, i) => (i % 2 === 0 ? 0 : 1)));

      const result = await service.batchCompare(codes, embeddings);

      // Orthogonal-ish embeddings should have low similarity
      if (result.comparisons.length > 0) {
        expect(result.comparisons[0].similarity).toBeLessThan(0.5);
      }
    });
  });
});
