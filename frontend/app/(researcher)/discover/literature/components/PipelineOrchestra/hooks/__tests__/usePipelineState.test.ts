/**
 * Phase 10.143: usePipelineState Hook Tests
 *
 * Comprehensive tests for pipeline state derivation
 * Tests stage mapping, status derivation, and metrics calculation
 *
 * @file frontend/app/(researcher)/discover/literature/components/PipelineOrchestra/hooks/__tests__/usePipelineState.test.ts
 */

import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePipelineState } from '../usePipelineState';
import type { SearchStage } from '@/lib/types/search-stream.types';

// ============================================================================
// Test Utilities
// ============================================================================

const createMockInput = (overrides = {}) => ({
  isSearching: true,
  stage: 'fast-sources' as SearchStage,
  percent: 50,
  message: 'Test query',
  sourceStats: new Map(),
  sourcesComplete: 1,
  sourcesTotal: 2,
  papersFound: 150,
  elapsedMs: 5000,
  semanticTier: null as 'immediate' | 'refined' | 'complete' | null,
  semanticVersion: 1,
  semanticTierStats: new Map(),
  ...overrides,
});

// ============================================================================
// Test Suites
// ============================================================================

describe('usePipelineState - Netflix-Grade Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. Stage Mapping
  // ==========================================================================

  describe('1.1 Stage Mapping', () => {
    it('should map analyzing stage to analyze', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'analyzing' }))
      );

      expect(result.current.currentStage).toBe('analyze');
    });

    it('should map fast-sources to discover', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'fast-sources' }))
      );

      expect(result.current.currentStage).toBe('discover');
    });

    it('should map ranking stage to rank', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'ranking' }))
      );

      expect(result.current.currentStage).toBe('rank');
    });

    // Phase 10.152: 'complete' now maps to 'rank' (no separate 'ready' stage)
    it('should map complete stage to rank', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'complete' }))
      );

      expect(result.current.currentStage).toBe('rank');
    });
  });

  // ==========================================================================
  // 2. Stage Status Derivation
  // ==========================================================================

  describe('1.2 Stage Status Derivation', () => {
    it('should set current stage as active', () => {
      // Use actual WebSocket stage that maps to 'discover'
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'fast-sources' }))
      );

      const discoverStage = result.current.stages.find((s) => s.id === 'discover');
      expect(discoverStage?.status).toBe('active');
    });

    it('should set previous stages as complete', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'ranking' }))
      );

      const analyzeStage = result.current.stages.find((s) => s.id === 'analyze');
      const discoverStage = result.current.stages.find((s) => s.id === 'discover');

      expect(analyzeStage?.status).toBe('complete');
      expect(discoverStage?.status).toBe('complete');
    });

    // Phase 10.152: Pipeline now ends at 'rank', no 'ready' stage
    it('should set future stages as pending', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'analyzing' }))
      );

      const rankStage = result.current.stages.find((s) => s.id === 'rank');

      expect(rankStage?.status).toBe('pending');
      // Note: 'ready' stage removed in Phase 10.152
    });

    it('should set REFINE as active when RANK starts', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'ranking' }))
      );

      const refineStage = result.current.stages.find((s) => s.id === 'refine');
      expect(refineStage?.status).toBe('active');
    });

    it('should set all stages as complete when search completes', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'complete', isSearching: false }))
      );

      result.current.stages.forEach((stage) => {
        expect(stage.status).toBe('complete');
      });
    });
  });

  // ==========================================================================
  // 3. Progress Calculation
  // ==========================================================================

  describe('1.3 Progress Calculation', () => {
    it('should calculate DISCOVER progress from source completion', () => {
      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            stage: 'fast-sources',
            sourcesComplete: 2,
            sourcesTotal: 4,
          })
        )
      );

      const discoverStage = result.current.stages.find((s) => s.id === 'discover');
      expect(discoverStage?.progress).toBe(50); // 2/4 * 100
    });

    it('should calculate RANK progress from semantic tier', () => {
      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            stage: 'ranking',
            semanticTier: 'refined',
          })
        )
      );

      const rankStage = result.current.stages.find((s) => s.id === 'rank');
      expect(rankStage?.progress).toBe(66); // refined tier = 66%
    });

    it('should set complete stages to 100% progress', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'ranking' }))
      );

      const analyzeStage = result.current.stages.find((s) => s.id === 'analyze');
      expect(analyzeStage?.progress).toBe(100);
    });
  });

  // ==========================================================================
  // 4. Metrics Calculation
  // ==========================================================================

  describe('1.4 Metrics Calculation', () => {
    it('should calculate quality score correctly', () => {
      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            sourcesComplete: 8,
            sourcesTotal: 10,
            papersFound: 200,
            semanticTier: 'complete',
          })
        )
      );

      // Quality = source coverage (24) + paper count (30) + semantic (40) = 94
      expect(result.current.metrics.quality).toBeGreaterThan(80);
    });

    it('should calculate ETA based on source completion rate', () => {
      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            stage: 'fast-sources',
            sourcesComplete: 2,
            sourcesTotal: 4,
            elapsedMs: 4000,
          })
        )
      );

      // ETA should be calculated: (4000/2) * (4-2) = 4000ms
      expect(result.current.metrics.eta).toBeGreaterThan(0);
    });

    it('should return null ETA when search is complete', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: 'complete' }))
      );

      expect(result.current.metrics.eta).toBeNull();
    });
  });

  // ==========================================================================
  // 5. Source State Derivation
  // ==========================================================================

  describe('1.5 Source State Derivation', () => {
    it('should derive source states from sourceStats', () => {
      const sourceStats = new Map();
      sourceStats.set('openalex', {
        status: 'complete',
        paperCount: 100,
        timeMs: 1500,
      });

      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ sourceStats }))
      );

      expect(result.current.sources.length).toBe(1);
      expect(result.current.sources[0]?.source).toBe('openalex');
      expect(result.current.sources[0]?.status).toBe('complete');
    });

    it('should calculate source positions on orbital rings', () => {
      const sourceStats = new Map();
      sourceStats.set('openalex', {
        status: 'complete',
        paperCount: 100,
        timeMs: 1500,
      });
      sourceStats.set('pubmed', {
        status: 'searching',
        paperCount: 50,
        timeMs: 2000,
      });

      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ sourceStats }))
      );

      expect(result.current.sources.length).toBe(2);
      result.current.sources.forEach((source) => {
        expect(source.position).toHaveProperty('x');
        expect(source.position).toHaveProperty('y');
        expect(source.position).toHaveProperty('angle');
        expect(source.position).toHaveProperty('radius');
      });
    });
  });

  // ==========================================================================
  // 6. Semantic Brain Derivation
  // ==========================================================================

  describe('1.6 Semantic Brain Derivation', () => {
    it('should derive semantic nodes from tier stats', () => {
      const tierStats = new Map();
      tierStats.set('immediate', {
        papersProcessed: 50,
        progressPercent: 100,
        isComplete: true,
        cacheHits: 10,
        latencyMs: 500,
      });

      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            semanticTier: 'immediate',
            semanticTierStats: tierStats,
          })
        )
      );

      expect(result.current.semanticNodes.length).toBe(3);
      const immediateNode = result.current.semanticNodes.find((n) => n.tier === 'immediate');
      expect(immediateNode?.status).toBe('complete');
    });

    it('should derive synapses between semantic nodes', () => {
      const tierStats = new Map();
      tierStats.set('immediate', {
        papersProcessed: 50,
        progressPercent: 100,
        isComplete: true,
        cacheHits: 10,
        latencyMs: 500,
      });
      tierStats.set('refined', {
        papersProcessed: 150,
        progressPercent: 75,
        isComplete: false,
        cacheHits: 5,
        latencyMs: 2000,
      });

      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            semanticTier: 'refined',
            semanticTierStats: tierStats,
          })
        )
      );

      expect(result.current.synapses.length).toBe(2); // immediate→refined, refined→complete
      const firstSynapse = result.current.synapses[0];
      expect(firstSynapse?.from).toBe('immediate');
      expect(firstSynapse?.to).toBe('refined');
      expect(firstSynapse?.isActive).toBe(true);
    });
  });

  // ==========================================================================
  // 7. Memoization
  // ==========================================================================

  describe('1.7 Memoization', () => {
    it('should memoize stages calculation', () => {
      const { result, rerender } = renderHook(
        ({ stage }) => usePipelineState(createMockInput({ stage })),
        { initialProps: { stage: 'analyzing' as SearchStage } }
      );

      const initialStages = result.current.stages;

      // Rerender with same stage
      rerender({ stage: 'analyzing' });

      // Should be same reference (memoized)
      expect(result.current.stages).toBe(initialStages);
    });

    it('should recalculate when dependencies change', () => {
      const { result, rerender } = renderHook(
        ({ stage, sourcesComplete }) =>
          usePipelineState(
            createMockInput({ stage, sourcesComplete })
          ),
        { initialProps: { stage: 'fast-sources' as SearchStage, sourcesComplete: 1 } }
      );

      const initialProgress = result.current.stages.find((s) => s.id === 'discover')?.progress;

      // Change source completion
      rerender({ stage: 'fast-sources', sourcesComplete: 2 });

      const newProgress = result.current.stages.find((s) => s.id === 'discover')?.progress;
      expect(newProgress).not.toBe(initialProgress);
    });
  });

  // ==========================================================================
  // 8. Edge Cases
  // ==========================================================================

  describe('1.8 Edge Cases', () => {
    // Phase 10.152: Pipeline now has 4 stages (removed 'ready' stage)
    it('should handle null stage gracefully', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ stage: null }))
      );

      expect(result.current.currentStage).toBeNull();
      expect(result.current.stages.length).toBe(4);
    });

    it('should handle empty sourceStats', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ sourceStats: new Map() }))
      );

      expect(result.current.sources).toEqual([]);
    });

    it('should handle zero sourcesTotal', () => {
      const { result } = renderHook(() =>
        usePipelineState(
          createMockInput({
            sourcesTotal: 0,
            sourcesComplete: 0,
          })
        )
      );

      const discoverStage = result.current.stages.find((s) => s.id === 'discover');
      expect(discoverStage?.progress).toBe(0);
    });

    it('should handle zero papersFound', () => {
      const { result } = renderHook(() =>
        usePipelineState(createMockInput({ papersFound: 0 }))
      );

      expect(result.current.metrics.papers).toBe(0);
      expect(result.current.metrics.quality).toBeLessThan(30); // Low quality with 0 papers
    });
  });
});
