/**
 * useSearchSuggestions Hook - Tests (Netflix-Grade)
 * Phase 10.104 Day 4
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchSuggestions } from '../useSearchSuggestions';
import { SearchSuggestionsService, type Suggestion } from '@/lib/services/search-suggestions.service';
import { SearchAnalyticsService } from '@/lib/services/search-analytics.service';

// Mock dependencies
vi.mock('@/lib/services/search-suggestions.service');
vi.mock('@/lib/services/search-analytics.service');
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('useSearchSuggestions', () => {
  const mockSuggestions: Suggestion[] = [
    {
      id: 'history_1',
      query: 'machine learning',
      source: 'user_history',
      score: 85,
      metadata: {
        matchType: 'exact',
        recencyDays: 1,
        successRate: 100
      }
    },
    {
      id: 'saved_1',
      query: 'machine learning algorithms',
      source: 'saved_search',
      score: 75,
      metadata: {
        matchType: 'fuzzy',
        recencyDays: 5,
        usageCount: 10
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Note: Not using fake timers globally - each test decides based on whether it's async or sync
    // Async debounced tests use real timers, sync validation tests use scoped fake timers

    // Default mock implementation
    vi.mocked(SearchSuggestionsService.getSuggestions).mockResolvedValue(mockSuggestions);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    test('should initialize with empty state', () => {
      const { result } = renderHook(() => useSearchSuggestions(''));

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedIndex).toBe(-1);
    });

    test('should not fetch suggestions for empty query', async () => {
      vi.useFakeTimers(); // Scoped fake timers for sync validation

      renderHook(() => useSearchSuggestions(''));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(SearchSuggestionsService.getSuggestions).not.toHaveBeenCalled();

      vi.useRealTimers(); // Cleanup
    });

    test('should not fetch suggestions for query shorter than minQueryLength', async () => {
      vi.useFakeTimers(); // Scoped fake timers for sync validation

      renderHook(() => useSearchSuggestions('a'));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(SearchSuggestionsService.getSuggestions).not.toHaveBeenCalled();

      vi.useRealTimers(); // Cleanup
    });

    test('should fetch suggestions for valid query', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      // Wait for debounce with real timer (300ms + 50ms buffer)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(SearchSuggestionsService.getSuggestions).toHaveBeenCalledWith(
          'machine',
          expect.objectContaining({
            maxResults: 10,
            personalized: true
          })
        );
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockSuggestions);
        expect(result.current.isOpen).toBe(true);
      });
    });
  });

  describe('Debouncing', () => {
    test('should debounce suggestion requests', async () => {
      const { rerender } = renderHook(
        ({ query }) => useSearchSuggestions(query),
        { initialProps: { query: 'm' } }
      );

      // Type rapidly - do all rerenders without waiting (simulates fast typing)
      act(() => {
        rerender({ query: 'ma' });
      });

      act(() => {
        rerender({ query: 'mac' });
      });

      act(() => {
        rerender({ query: 'mach' });
      });

      // Now wait for the debounce of the LAST query only
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      // Should only call once with the final query (previous ones were debounced away)
      await waitFor(() => {
        expect(SearchSuggestionsService.getSuggestions).toHaveBeenCalledTimes(1);
        expect(SearchSuggestionsService.getSuggestions).toHaveBeenCalledWith(
          'mach',
          expect.any(Object)
        );
      });
    });

    test('should use custom debounce delay', async () => {
      renderHook(() => useSearchSuggestions('machine', { debounceMs: 500 }));

      // Wait 300ms (default delay)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      // Should not have called yet
      expect(SearchSuggestionsService.getSuggestions).not.toHaveBeenCalled();

      // Wait another 200ms (total 500ms)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      // Now should have called
      await waitFor(() => {
        expect(SearchSuggestionsService.getSuggestions).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    test('should set loading state while fetching', async () => {
      let resolvePromise: (value: Suggestion[]) => void;
      const promise = new Promise<Suggestion[]>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(SearchSuggestionsService.getSuggestions).mockReturnValue(promise);

      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockSuggestions);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Dropdown State', () => {
    test('should open dropdown when suggestions received', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });
    });

    test('should not open dropdown when no suggestions', async () => {
      vi.mocked(SearchSuggestionsService.getSuggestions).mockResolvedValue([]);

      const { result } = renderHook(() => useSearchSuggestions('xyz'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
        expect(result.current.suggestions).toEqual([]);
      });
    });

    test('should close dropdown manually', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedIndex).toBe(-1);
    });

    test('should open dropdown manually', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should update selected index', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setSelectedIndex(0);
      });

      expect(result.current.selectedIndex).toBe(0);

      act(() => {
        result.current.setSelectedIndex(1);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    test('should reset selected index on new suggestions', async () => {
      const { result, rerender } = renderHook(
        ({ query }) => useSearchSuggestions(query),
        { initialProps: { query: 'machine' } }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setSelectedIndex(1);
      });

      expect(result.current.selectedIndex).toBe(1);

      // Change query
      rerender({ query: 'learning' });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.selectedIndex).toBe(-1);
      });
    });
  });

  describe('Suggestion Selection', () => {
    test('should track analytics when suggestion selected', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      const selectedSuggestion = result.current.suggestions[0]!;

      act(() => {
        result.current.selectSuggestion(selectedSuggestion);
      });

      expect(SearchAnalyticsService.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: selectedSuggestion.query,
          queryLength: selectedSuggestion.query.length,
          success: true,
          source: 'history'
        })
      );
    });

    test('should close dropdown after selection', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      act(() => {
        result.current.selectSuggestion(result.current.suggestions[0]!);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      vi.mocked(SearchSuggestionsService.getSuggestions).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.isOpen).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Options', () => {
    test('should respect maxResults option', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions('machine', { maxResults: 5 })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(SearchSuggestionsService.getSuggestions).toHaveBeenCalledWith(
          'machine',
          expect.objectContaining({
            maxResults: 5
          })
        );
      });
    });

    test('should respect minQueryLength option', async () => {
      vi.useFakeTimers(); // Scoped fake timers for sync validation

      renderHook(() => useSearchSuggestions('ma', { minQueryLength: 3 }));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(SearchSuggestionsService.getSuggestions).not.toHaveBeenCalled();

      vi.useRealTimers(); // Cleanup
    });

    test('should respect enabled option', async () => {
      vi.useFakeTimers(); // Scoped fake timers for sync validation

      renderHook(() => useSearchSuggestions('machine', { enabled: false }));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(SearchSuggestionsService.getSuggestions).not.toHaveBeenCalled();

      vi.useRealTimers(); // Cleanup
    });
  });

  describe('Clear Suggestions', () => {
    test('should clear suggestions and close dropdown', async () => {
      const { result } = renderHook(() => useSearchSuggestions('machine'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
        expect(result.current.isOpen).toBe(true);
      });

      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe('Race Conditions', () => {
    test('should only update state for most recent query', async () => {
      let resolveFirst: (value: Suggestion[]) => void;
      let resolveSecond: (value: Suggestion[]) => void;

      const firstPromise = new Promise<Suggestion[]>((resolve) => {
        resolveFirst = resolve;
      });

      const secondPromise = new Promise<Suggestion[]>((resolve) => {
        resolveSecond = resolve;
      });

      vi.mocked(SearchSuggestionsService.getSuggestions)
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      // Use minimal debounce delay for precise control over race conditions
      const { result, rerender } = renderHook(
        ({ query }) => useSearchSuggestions(query, { debounceMs: 10 }),
        { initialProps: { query: 'machine' } }
      );

      // Wait for first debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Change query before first promise resolves
      rerender({ query: 'learning' });

      // Wait for second debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Resolve second promise first (most recent query)
      await act(async () => {
        resolveSecond!([mockSuggestions[1]!]);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([mockSuggestions[1]]);
      });

      // Resolve first (stale query) - should not update
      await act(async () => {
        resolveFirst!([mockSuggestions[0]!]);
      });

      // Wait a bit to ensure no update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should still have second query results
      expect(result.current.suggestions).toEqual([mockSuggestions[1]]);
    });
  });
});
