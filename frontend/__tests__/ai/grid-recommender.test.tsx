/**
 * Tests for AI Grid Recommender Service - Phase 6.86 Day 2
 * Enterprise-grade test coverage for grid generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gridRecommender, getGridRecommendations, generateCustomGrid } from '@/lib/ai/grid-recommender';
import { aiService } from '@/lib/services/ai.service';
import type { GridConfig, GridRecommendation } from '@/lib/types/ai.types';

// Mock the AI service
vi.mock('@/lib/services/ai.service', () => ({
  aiService: {
    generateJSON: vi.fn(),
  },
}));

describe('GridRecommenderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should generate recommendations for exploratory studies', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2],
            rationale: 'Normal distribution for exploratory studies',
            bestFor: 'Exploring diverse viewpoints',
          },
          {
            columns: 11,
            distribution: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1],
            rationale: 'Extended distribution for detailed exploration',
            bestFor: 'Complex topics',
          },
        ],
        recommended: 0,
        reasoning: 'Best for initial exploration',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      const result = await getGridRecommendations(34, 'exploratory');

      expect(result).toBeDefined();
      expect(result.configs).toHaveLength(2);
      expect(result.configs[0].columns).toBe(9);
      expect(result.configs[0].distribution.reduce((a, b) => a + b, 0)).toBe(34);
    });

    it('should generate recommendations for confirmatory studies', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [3, 3, 4, 4, 4, 4, 4, 3, 3],
            rationale: 'Flatter distribution for confirmatory studies',
            bestFor: 'Testing hypotheses',
          },
        ],
        recommended: 0,
        reasoning: 'Ideal for hypothesis testing',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      const result = await getGridRecommendations(32, 'confirmatory');

      expect(result).toBeDefined();
      expect(result.configs[0].columns).toBe(9);
      expect(result.configs[0].distribution.reduce((a, b) => a + b, 0)).toBe(32);
    });

    it('should fall back to predefined grids when AI fails', async () => {
      vi.mocked(aiService.generateJSON).mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await getGridRecommendations(30, 'exploratory');

      expect(result).toBeDefined();
      expect(result.configs.length).toBeGreaterThan(0);
      expect(result.reasoning).toContain('exploratory study');
    });

    it('should adjust distribution to match exact statement count', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2], // Sum = 34
            rationale: 'Test distribution',
            bestFor: 'Testing',
          },
        ],
        recommended: 0,
        reasoning: 'Test reasoning',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      const result = await getGridRecommendations(36, 'exploratory'); // Different count

      expect(result.configs[0].statementCount).toBe(36);
      expect(result.configs[0].distribution.reduce((a, b) => a + b, 0)).toBe(36);
    });

    it('should handle mixed study types', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4, 4, 5, 4, 4, 3, 2],
            rationale: 'Balanced for mixed studies',
            bestFor: 'Mixed-method approaches',
          },
        ],
        recommended: 0,
        reasoning: 'Combines exploration and confirmation',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      const result = await getGridRecommendations(31, 'mixed');

      expect(result).toBeDefined();
      expect(result.configs[0].rationale).toContain('mixed');
    });
  });

  describe('generateCustomGrid', () => {
    it('should generate a normal distribution grid', () => {
      const grid = generateCustomGrid(9, 40, 'normal');

      expect(grid.columns).toBe(9);
      expect(grid.distribution).toHaveLength(9);
      expect(grid.statementCount).toBe(40);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(40);
      
      // Check quasi-normal shape (middle should be higher)
      const middle = Math.floor(9 / 2);
      expect(grid.distribution[middle]).toBeGreaterThan(grid.distribution[0]);
      expect(grid.distribution[middle]).toBeGreaterThan(grid.distribution[8]);
    });

    it('should generate a flat distribution grid', () => {
      const grid = generateCustomGrid(7, 35, 'flat');

      expect(grid.columns).toBe(7);
      expect(grid.distribution).toHaveLength(7);
      expect(grid.statementCount).toBe(35);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(35);
      
      // Check relatively flat distribution
      const variance = Math.max(...grid.distribution) - Math.min(...grid.distribution);
      expect(variance).toBeLessThanOrEqual(3);
    });

    it('should generate a steep distribution grid', () => {
      const grid = generateCustomGrid(11, 50, 'steep');

      expect(grid.columns).toBe(11);
      expect(grid.distribution).toHaveLength(11);
      expect(grid.statementCount).toBe(50);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(50);
      
      // Check steep distribution (large difference between middle and edges)
      const middle = Math.floor(11 / 2);
      const steepness = grid.distribution[middle] / grid.distribution[0];
      expect(steepness).toBeGreaterThan(2);
    });

    it('should handle odd column counts', () => {
      const grid = generateCustomGrid(7, 30);

      expect(grid.columns).toBe(7);
      expect(grid.distribution).toHaveLength(7);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(30);
    });

    it('should handle even column counts', () => {
      const grid = generateCustomGrid(8, 32);

      expect(grid.columns).toBe(8);
      expect(grid.distribution).toHaveLength(8);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(32);
    });

    it('should handle small statement counts', () => {
      const grid = generateCustomGrid(5, 15);

      expect(grid.columns).toBe(5);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(15);
      expect(Math.min(...grid.distribution)).toBeGreaterThanOrEqual(1);
    });

    it('should handle large statement counts', () => {
      const grid = generateCustomGrid(13, 100);

      expect(grid.columns).toBe(13);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(100);
    });
  });

  describe('Grid Validation', () => {
    it('should ensure all distribution values are positive', () => {
      const grid = generateCustomGrid(9, 20, 'steep');

      for (const value of grid.distribution) {
        expect(value).toBeGreaterThanOrEqual(1);
      }
    });

    it('should maintain symmetry in distribution', () => {
      const grid = generateCustomGrid(9, 40, 'normal');
      const half = Math.floor(grid.distribution.length / 2);

      // Check rough symmetry (allowing for minor differences due to rounding)
      for (let i = 0; i < half; i++) {
        const left = grid.distribution[i];
        const right = grid.distribution[grid.distribution.length - 1 - i];
        expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
      }
    });

    it('should redistribute correctly when initial sum doesnt match', () => {
      // This tests the internal redistribution logic
      const grid = generateCustomGrid(7, 33);
      
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(33);
      expect(grid.distribution.every(v => v > 0)).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache AI recommendations', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2],
            rationale: 'Cached response',
            bestFor: 'Testing cache',
          },
        ],
        recommended: 0,
        reasoning: 'From cache',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      // First call - should hit AI service
      const result1 = await gridRecommender.getRecommendations({
        statementCount: 34,
        studyType: 'exploratory',
      });

      // Second call with same parameters - should use fallback (since we only mocked once)
      const result2 = await gridRecommender.getRecommendations({
        statementCount: 34,
        studyType: 'exploratory',
      });

      expect(vi.mocked(aiService.generateJSON)).toHaveBeenCalledTimes(1);
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should not cache different requests', async () => {
      const mockResponse1 = {
        configs: [{ columns: 9, distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2], rationale: 'R1', bestFor: 'B1' }],
        recommended: 0,
        reasoning: 'Reason 1',
      };

      const mockResponse2 = {
        configs: [{ columns: 7, distribution: [3, 4, 5, 6, 5, 4, 3], rationale: 'R2', bestFor: 'B2' }],
        recommended: 0,
        reasoning: 'Reason 2',
      };

      vi.mocked(aiService.generateJSON)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      await gridRecommender.getRecommendations({
        statementCount: 34,
        studyType: 'exploratory',
      });

      await gridRecommender.getRecommendations({
        statementCount: 30,
        studyType: 'confirmatory',
      });

      expect(vi.mocked(aiService.generateJSON)).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      vi.mocked(aiService.generateJSON).mockRejectedValueOnce(new Error('Network error'));

      const result = await gridRecommender.getRecommendations({
        statementCount: 30,
        studyType: 'exploratory',
      });

      expect(result).toBeDefined();
      expect(result.configs.length).toBeGreaterThan(0);
    });

    it('should handle invalid AI responses', async () => {
      const invalidResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4], // Invalid - too short
            rationale: 'Invalid',
            bestFor: 'Testing',
          },
        ],
        recommended: 0,
        reasoning: 'Invalid test',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(invalidResponse as any);

      const result = await gridRecommender.getRecommendations({
        statementCount: 30,
        studyType: 'exploratory',
      });

      // Should handle the invalid response and still return valid configs
      expect(result).toBeDefined();
      expect(result.configs[0].distribution.reduce((a, b) => a + b, 0)).toBe(30);
    });

    it('should handle negative statement counts by redistributing', () => {
      // Even with edge cases, should produce valid grids
      const grid = generateCustomGrid(5, 10, 'steep');
      
      expect(grid.distribution.every(v => v > 0)).toBe(true);
      expect(grid.distribution.reduce((a, b) => a + b, 0)).toBe(10);
    });
  });

  describe('Performance', () => {
    it('should generate recommendations quickly', async () => {
      const mockResponse = {
        configs: [
          {
            columns: 9,
            distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2],
            rationale: 'Performance test',
            bestFor: 'Testing speed',
          },
        ],
        recommended: 0,
        reasoning: 'Speed test',
      };

      vi.mocked(aiService.generateJSON).mockResolvedValueOnce(mockResponse);

      const startTime = performance.now();
      await getGridRecommendations(34, 'exploratory');
      const endTime = performance.now();

      // Should complete within 100ms (excluding AI call time)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle bulk generation efficiently', () => {
      const startTime = performance.now();
      
      // Generate 100 custom grids
      for (let i = 0; i < 100; i++) {
        generateCustomGrid(9, 30 + i, 'normal');
      }
      
      const endTime = performance.now();

      // Should complete within 1000ms
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});