/**
 * Phase 10.170 Week 4: Purpose-Aware Cache Service Tests
 *
 * Tests for Netflix-grade multi-tier caching service.
 *
 * @module purpose-aware-cache.service.spec
 * @since Phase 10.170 Week 4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PurposeAwareCacheService } from '../purpose-aware-cache.service';
import { ResearchPurpose } from '../../types/purpose-aware.types';
import { PurposeAwareScoreResult, SCORING_VERSION } from '../../types/purpose-aware-scoring.types';

describe('PurposeAwareCacheService', () => {
  let service: PurposeAwareCacheService;

  beforeEach(() => {
    service = new PurposeAwareCacheService();
  });

  afterEach(() => {
    service.clear();
    service.onModuleDestroy();
  });

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  function createMockScoreResult(paperId: string): PurposeAwareScoreResult {
    return {
      paperId,
      purpose: ResearchPurpose.Q_METHODOLOGY,
      totalScore: 75.5,
      components: {
        content: { raw: 80, weight: 0.35, weighted: 28, explanation: 'test' },
        citation: { raw: 70, weight: 0.15, weighted: 10.5, explanation: 'test' },
        journal: { raw: 0, weight: 0, weighted: 0, explanation: 'test' },
        methodology: { raw: 65, weight: 0.20, weighted: 13, explanation: 'test' },
        diversity: { raw: 60, weight: 0.30, weighted: 18, explanation: 'test' },
      },
      fullTextBonus: 5,
      hasFullText: true,
      scoredAt: Date.now(),
      version: SCORING_VERSION,
    };
  }

  // ==========================================================================
  // SCORE CACHE TESTS
  // ==========================================================================

  describe('score cache', () => {
    it('should cache and retrieve a score', () => {
      const score = createMockScoreResult('paper-1');

      service.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, score);
      const result = service.getCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY);

      expect(result.found).toBe(true);
      expect(result.tier).toBe('fresh');
      expect(result.value?.paperId).toBe('paper-1');
    });

    it('should return not found for missing cache entry', () => {
      const result = service.getCachedScore('non-existent', ResearchPurpose.Q_METHODOLOGY);

      expect(result.found).toBe(false);
      expect(result.tier).toBe('expired');
      expect(result.value).toBeNull();
    });

    it('should separate caches by purpose', () => {
      const score = createMockScoreResult('paper-1');

      service.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, score);

      const qResult = service.getCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY);
      const litResult = service.getCachedScore('paper-1', ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(qResult.found).toBe(true);
      expect(litResult.found).toBe(false);
    });

    it('should batch get cached scores', () => {
      const score1 = createMockScoreResult('paper-1');
      const score2 = createMockScoreResult('paper-2');

      service.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, score1);
      service.setCachedScore('paper-2', ResearchPurpose.Q_METHODOLOGY, score2);

      const results = service.batchGetCachedScores(
        ['paper-1', 'paper-2', 'paper-3'],
        ResearchPurpose.Q_METHODOLOGY,
      );

      expect(results.size).toBe(2);
      expect(results.has('paper-1')).toBe(true);
      expect(results.has('paper-2')).toBe(true);
      expect(results.has('paper-3')).toBe(false);
    });

    it('should batch set cached scores', () => {
      const scores = [
        createMockScoreResult('paper-1'),
        createMockScoreResult('paper-2'),
        createMockScoreResult('paper-3'),
      ];

      service.batchSetCachedScores(scores, ResearchPurpose.Q_METHODOLOGY);

      for (const score of scores) {
        const result = service.getCachedScore(score.paperId, ResearchPurpose.Q_METHODOLOGY);
        expect(result.found).toBe(true);
      }
    });

    it('should invalidate score for a paper', () => {
      const score = createMockScoreResult('paper-1');
      service.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, score);
      service.setCachedScore('paper-1', ResearchPurpose.LITERATURE_SYNTHESIS, score);

      service.invalidateScore('paper-1');

      const qResult = service.getCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY);
      const litResult = service.getCachedScore('paper-1', ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(qResult.found).toBe(false);
      expect(litResult.found).toBe(false);
    });
  });

  // ==========================================================================
  // DIVERSITY CACHE TESTS
  // ==========================================================================

  describe('diversity cache', () => {
    it('should cache and retrieve diversity metrics', () => {
      const metrics = {
        totalPapers: 50,
        uniquePerspectives: 6,
        coverageRatio: 0.75,
        shannonIndex: 1.85,
        simpsonIndex: 0.82,
        distribution: {} as any,
        underrepresented: [],
        overrepresented: [],
        healthStatus: 'good' as const,
      };

      service.setCachedDiversityMetrics(['paper-1', 'paper-2'], metrics);
      const result = service.getCachedDiversityMetrics(['paper-1', 'paper-2']);

      expect(result.found).toBe(true);
      expect(result.value?.shannonIndex).toBe(1.85);
    });

    it('should return not found for missing diversity metrics', () => {
      const result = service.getCachedDiversityMetrics(['non-existent-1', 'non-existent-2']);

      expect(result.found).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should generate consistent key regardless of paper order', () => {
      const metrics = {
        totalPapers: 50,
        uniquePerspectives: 6,
        coverageRatio: 0.75,
        shannonIndex: 1.85,
        simpsonIndex: 0.82,
        distribution: {} as any,
        underrepresented: [],
        overrepresented: [],
        healthStatus: 'good' as const,
      };

      // Set with one order
      service.setCachedDiversityMetrics(['paper-1', 'paper-2', 'paper-3'], metrics);

      // Get with different order
      const result = service.getCachedDiversityMetrics(['paper-3', 'paper-1', 'paper-2']);

      expect(result.found).toBe(true);
    });
  });

  // ==========================================================================
  // CACHE STATS TESTS
  // ==========================================================================

  describe('cache stats', () => {
    it('should track score cache size', () => {
      for (let i = 0; i < 10; i++) {
        service.setCachedScore(`paper-${i}`, ResearchPurpose.Q_METHODOLOGY, createMockScoreResult(`paper-${i}`));
      }

      const stats = service.getScoreCacheStats();
      expect(stats.size).toBe(10);
    });

    it('should track diversity cache size', () => {
      const metrics = {
        totalPapers: 50,
        uniquePerspectives: 6,
        coverageRatio: 0.75,
        shannonIndex: 1.85,
        simpsonIndex: 0.82,
        distribution: {} as any,
        underrepresented: [],
        overrepresented: [],
        healthStatus: 'good' as const,
      };

      service.setCachedDiversityMetrics(['paper-1'], metrics);
      service.setCachedDiversityMetrics(['paper-2'], metrics);

      const stats = service.getDiversityCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  // ==========================================================================
  // MEMORY PRESSURE TESTS
  // ==========================================================================

  describe('memory pressure', () => {
    it('should check memory pressure without error', () => {
      expect(() => service.checkMemoryPressure()).not.toThrow();
    });

    it('should clear all caches', () => {
      service.setCachedScore('paper-1', ResearchPurpose.Q_METHODOLOGY, createMockScoreResult('paper-1'));
      service.setCachedDiversityMetrics(['paper-1'], {
        totalPapers: 1,
        uniquePerspectives: 1,
        coverageRatio: 0.125,
        shannonIndex: 0,
        simpsonIndex: 0,
        distribution: {} as any,
        underrepresented: [],
        overrepresented: [],
        healthStatus: 'critical' as const,
      });

      service.clear();

      expect(service.getScoreCacheStats().size).toBe(0);
      expect(service.getDiversityCacheStats().size).toBe(0);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty paper ID list for diversity', () => {
      const result = service.getCachedDiversityMetrics([]);
      expect(result.found).toBe(false);
    });

    it('should handle special characters in paper IDs', () => {
      const score = createMockScoreResult('10.1234/special-paper:v1');

      service.setCachedScore('10.1234/special-paper:v1', ResearchPurpose.Q_METHODOLOGY, score);
      const result = service.getCachedScore('10.1234/special-paper:v1', ResearchPurpose.Q_METHODOLOGY);

      expect(result.found).toBe(true);
    });
  });
});
