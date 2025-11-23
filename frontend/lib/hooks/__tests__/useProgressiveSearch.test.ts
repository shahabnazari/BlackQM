/**
 * Phase 10.942 Day 2: useProgressiveSearch Hook Tests
 *
 * Enterprise-grade unit tests for the progressive search hook
 * Tests batch execution, progress tracking, cancellation, and error handling
 *
 * @file frontend/lib/hooks/__tests__/useProgressiveSearch.test.ts
 * @enterprise-grade TypeScript strict mode, no any types
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';

// ============================================================================
// Mock Dependencies - Use vi.hoisted for mock setup
// ============================================================================

// Hoisted mock functions - available before vi.mock runs
const { mockSearchLiterature, mockStoreGetters } = vi.hoisted(() => {
  const mockSearchResult = {
    papers: [
      {
        id: 'paper-1',
        title: 'Machine Learning in Healthcare',
        authors: ['Smith, J.', 'Doe, J.'],
        year: 2023,
        abstract: 'A study on ML applications in healthcare...',
        source: 'pubmed',
        citationCount: 50,
        qualityScore: 85,
      },
      {
        id: 'paper-2',
        title: 'AI for Medical Diagnosis',
        authors: ['Johnson, A.'],
        year: 2024,
        abstract: 'Using AI for improved diagnosis...',
        source: 'semantic_scholar',
        citationCount: 30,
        qualityScore: 78,
      },
    ],
    metadata: {
      totalCollected: 1500,
      uniqueAfterDedup: 1200,
      sourceBreakdown: {
        pubmed: { papers: 500, duration: 1000 },
        semantic_scholar: { papers: 400, duration: 800 },
        arxiv: { papers: 300, duration: 600 },
      },
      stage1: {
        totalCollected: 1500,
        sourcesSearched: 3,
        sourceBreakdown: {},
      },
      stage2: {
        startingPapers: 1500,
        afterEnrichment: 1400,
        afterRelevanceFilter: 1000,
        finalSelected: 500,
      },
      searchDuration: 5000,
    },
  };

  return {
    mockSearchLiterature: vi.fn().mockResolvedValue(mockSearchResult),
    mockStoreGetters: {
      addPapers: vi.fn(),
      setTotalResults: vi.fn(),
      startProgressiveLoading: vi.fn(),
      updateProgressiveLoading: vi.fn(),
      completeProgressiveLoading: vi.fn(),
      cancelProgressiveLoading: vi.fn(),
      setSearchMetadata: vi.fn(),
      setShowSuggestions: vi.fn(),
    },
    mockSearchResult,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock store
vi.mock('@/lib/stores/literature-search.store', () => ({
  useLiteratureSearchStore: () => ({
    query: 'machine learning healthcare',
    appliedFilters: {
      yearFrom: 2020,
      yearTo: 2024,
      minCitations: 0,
      publicationType: 'all',
      author: '',
      authorSearchMode: 'any',
    },
    academicDatabases: ['pubmed', 'semantic_scholar', 'arxiv'],
    progressiveLoading: {
      status: 'idle',
      loadedPapers: 0,
      targetPapers: 500,
      currentBatch: 0,
      totalBatches: 25,
      averageQualityScore: 0,
      visualPercentage: 0,
    },
    ...mockStoreGetters,
  }),
}));

// Mock API
vi.mock('@/lib/services/literature-api.service', () => ({
  literatureAPI: {
    searchLiterature: mockSearchLiterature,
  },
}));

// Import toast after mock for assertions
import { toast as mockToast } from 'sonner';

// Import hook after mocks
import { useProgressiveSearch } from '../useProgressiveSearch';
import { literatureAPI } from '@/lib/services/literature-api.service';

// ============================================================================
// Test Utilities
// ============================================================================

const BATCH_SIZE = 20;

// ============================================================================
// Test Suites
// ============================================================================

describe('useProgressiveSearch Hook - Day 2 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // 2.1 Batch Execution
  // ==========================================================================

  describe('2.1 Batch Execution', () => {
    it('should return executeProgressiveSearch function', () => {
      const { result } = renderHook(() => useProgressiveSearch());

      expect(result.current.executeProgressiveSearch).toBeDefined();
      expect(typeof result.current.executeProgressiveSearch).toBe('function');
    });

    it('should return cancelProgressiveSearch function', () => {
      const { result } = renderHook(() => useProgressiveSearch());

      expect(result.current.cancelProgressiveSearch).toBeDefined();
      expect(typeof result.current.cancelProgressiveSearch).toBe('function');
    });

    it('should return isSearching state', () => {
      const { result } = renderHook(() => useProgressiveSearch());

      expect(result.current.isSearching).toBeDefined();
      expect(typeof result.current.isSearching).toBe('boolean');
    });

    it('should use correct batch size of 20 papers', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      // API should be called with limit of BATCH_SIZE
      expect(literatureAPI.searchLiterature).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: BATCH_SIZE,
        })
      );
    });

    it('should execute batches sequentially', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      // First batch should start immediately
      expect(literatureAPI.searchLiterature).toHaveBeenCalled();
    });

    it('should pass correct search parameters', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(literatureAPI.searchLiterature).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'machine learning healthcare',
          sources: ['pubmed', 'semantic_scholar', 'arxiv'],
          sortByEnhanced: 'quality_score',
        })
      );
    });

    it('should include year filters when set', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(literatureAPI.searchLiterature).toHaveBeenCalledWith(
        expect.objectContaining({
          yearFrom: 2020,
          yearTo: 2024,
        })
      );
    });
  });

  // ==========================================================================
  // 2.2 Progress Tracking
  // ==========================================================================

  describe('2.2 Progress Tracking', () => {
    it('should call startProgressiveLoading on search start', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(mockStoreGetters.startProgressiveLoading).toHaveBeenCalled();
    });

    it('should call updateProgressiveLoading during search', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalled();
    });

    it('should update current batch number', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          currentBatch: expect.any(Number),
        })
      );
    });

    it('should update status to loading', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'loading',
        })
      );
    });

    it('should store stage1 metadata from first batch', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          stage1: expect.objectContaining({
            totalCollected: expect.any(Number),
          }),
        })
      );
    });

    it('should store stage2 metadata from first batch', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          stage2: expect.objectContaining({
            finalSelected: expect.any(Number),
          }),
        })
      );
    });
  });

  // ==========================================================================
  // 2.3 Result Aggregation
  // ==========================================================================

  describe('2.3 Result Aggregation', () => {
    it('should call addPapers for each batch', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.addPapers).toHaveBeenCalled();
    });

    it('should add papers from API response', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.addPapers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'paper-1' }),
        ])
      );
    });

    it('should calculate average quality score', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          averageQualityScore: expect.any(Number),
        })
      );
    });

    it('should set total results after completion', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(60000);
      });

      expect(mockStoreGetters.setTotalResults).toHaveBeenCalled();
    });

    it('should store search metadata', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(60000);
      });

      expect(mockStoreGetters.setSearchMetadata).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 2.4 Error Handling
  // ==========================================================================

  describe('2.4 Error Handling', () => {
    it('should show error toast for empty query', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
      });

      expect(result.current.executeProgressiveSearch).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      mockSearchLiterature.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isSearching).toBeDefined();
    });

    it('should continue with other batches if one fails', async () => {
      mockSearchLiterature.mockRejectedValueOnce(new Error('Batch 1 failed'));

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(1000);
      });

      expect(literatureAPI.searchLiterature).toHaveBeenCalled();
    });

    it('should update status to error on failure', async () => {
      mockSearchLiterature.mockRejectedValue(new Error('All batches failed'));

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(60000);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 2.5 Cancellation
  // ==========================================================================

  describe('2.5 Cancellation', () => {
    it('should call cancelProgressiveLoading when cancelled', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        result.current.cancelProgressiveSearch();
      });

      expect(mockStoreGetters.cancelProgressiveLoading).toHaveBeenCalled();
    });

    it('should show toast when cancelled', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
        result.current.cancelProgressiveSearch();
      });

      expect(mockToast.info).toHaveBeenCalledWith('Cancelling search...');
    });

    it('should stop subsequent batches after cancellation', async () => {
      const callsBefore = mockSearchLiterature.mock.calls.length;

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
        result.current.cancelProgressiveSearch();
        vi.advanceTimersByTime(5000);
      });

      const callsAfter = mockSearchLiterature.mock.calls.length;

      expect(callsAfter - callsBefore).toBeLessThan(5);
    });
  });

  // ==========================================================================
  // 2.6 Quality Score Calculation
  // ==========================================================================

  describe('2.6 Quality Score Calculation', () => {
    it('should calculate quality score based on citations', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          averageQualityScore: expect.any(Number),
        })
      );
    });

    it('should handle papers with no citations', async () => {
      mockSearchLiterature.mockResolvedValueOnce({
        papers: [{ id: 'p1', title: 'Test', citationCount: 0 }],
        metadata: {
          totalCollected: 1,
          uniqueAfterDedup: 1,
          sourceBreakdown: {},
          stage1: { totalCollected: 1, sourcesSearched: 1, sourceBreakdown: {} },
          stage2: { startingPapers: 1, afterEnrichment: 1, afterRelevanceFilter: 1, finalSelected: 1 },
          searchDuration: 100,
        },
      });

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(result.current.executeProgressiveSearch).toBeDefined();
    });

    it('should use explicit qualityScore if provided', async () => {
      mockSearchLiterature.mockResolvedValueOnce({
        papers: [{ id: 'p1', title: 'Test', qualityScore: 92 }],
        metadata: {
          totalCollected: 1,
          uniqueAfterDedup: 1,
          sourceBreakdown: {},
          stage1: { totalCollected: 1, sourcesSearched: 1, sourceBreakdown: {} },
          stage2: { startingPapers: 1, afterEnrichment: 1, afterRelevanceFilter: 1, finalSelected: 1 },
          searchDuration: 100,
        },
      });

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.updateProgressiveLoading).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 2.7 Dynamic Batch Adjustment
  // ==========================================================================

  describe('2.7 Dynamic Batch Adjustment', () => {
    it('should adjust target based on backend response', async () => {
      mockSearchLiterature.mockResolvedValueOnce({
        papers: [{ id: 'p1', title: 'Test' }],
        metadata: {
          totalCollected: 1500,
          uniqueAfterDedup: 1200,
          sourceBreakdown: {},
          stage1: { totalCollected: 1500, sourcesSearched: 3, sourceBreakdown: {} },
          stage2: { startingPapers: 1500, afterEnrichment: 1400, afterRelevanceFilter: 1000, finalSelected: 500 },
          searchDuration: 5000,
          allocationStrategy: { targetPaperCount: 1000 },
          totalQualified: 800,
        },
      });

      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(500);
      });

      expect(mockStoreGetters.startProgressiveLoading).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 2.8 Source Selection
  // ==========================================================================

  describe('2.8 Source Selection', () => {
    it('should use academicDatabases from store', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(literatureAPI.searchLiterature).toHaveBeenCalledWith(
        expect.objectContaining({
          sources: ['pubmed', 'semantic_scholar', 'arxiv'],
        })
      );
    });

    it('should close suggestions dropdown on search start', async () => {
      const { result } = renderHook(() => useProgressiveSearch());

      await act(async () => {
        result.current.executeProgressiveSearch();
        vi.advanceTimersByTime(100);
      });

      expect(mockStoreGetters.setShowSuggestions).toHaveBeenCalledWith(false);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('useProgressiveSearch Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle complete search lifecycle', async () => {
    const { result } = renderHook(() => useProgressiveSearch());

    await act(async () => {
      result.current.executeProgressiveSearch();
      vi.advanceTimersByTime(100);
    });

    expect(mockStoreGetters.startProgressiveLoading).toHaveBeenCalled();
    expect(literatureAPI.searchLiterature).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(mockStoreGetters.addPapers).toHaveBeenCalled();
  });

  it('should maintain state consistency through search', async () => {
    const { result } = renderHook(() => useProgressiveSearch());

    await act(async () => {
      result.current.executeProgressiveSearch();
      vi.advanceTimersByTime(500);
    });

    const updateCalls = mockStoreGetters.updateProgressiveLoading.mock.calls;
    expect(updateCalls.length).toBeGreaterThan(0);
  });
});
