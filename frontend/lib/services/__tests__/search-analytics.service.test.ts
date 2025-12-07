/**
 * SearchAnalyticsService - Unit Tests (Netflix-Grade)
 * Phase 10.104 Day 2 - Vitest-compatible
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchAnalyticsService } from '../search-analytics.service';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('SearchAnalyticsService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    SearchAnalyticsService.clearData();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    test('should track a basic search event', () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        responseTime: 1200,
        resultsCount: 25,
        success: true,
        source: 'manual'
      });

      vi.advanceTimersByTime(150);

      const summary = SearchAnalyticsService.getSummary(30);
      expect(summary.totalSearches).toBe(1);
      expect(summary.successRate).toBe(100);
    });

    test('should auto-calculate query complexity', () => {
      SearchAnalyticsService.trackSearch({ query: 'test', success: true });
      SearchAnalyticsService.trackSearch({ query: 'this is a longer query with multiple words', success: true });
      SearchAnalyticsService.trackSearch({ query: 'test AND (machine OR learning)', success: true });

      vi.advanceTimersByTime(150);

      const summary = SearchAnalyticsService.getSummary(30);
      expect(summary.queryComplexityDistribution.simple).toBe(1);
      expect(summary.queryComplexityDistribution.moderate).toBe(1);
      expect(summary.queryComplexityDistribution.complex).toBe(1);
    });
  });

  describe('Batched Writes', () => {
    test('should batch multiple events into single write', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      for (let i = 0; i < 5; i++) {
        SearchAnalyticsService.trackSearch({ query: `query ${i}`, success: true });
      }

      expect(setItemSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);

      expect(setItemSpy).toHaveBeenCalledTimes(1);

      const summary = SearchAnalyticsService.getSummary(30);
      expect(summary.totalSearches).toBe(5);

      setItemSpy.mockRestore();
    });
  });

  describe('H1 Fix: Beforeunload Listener', () => {
    test('should attach beforeunload listener on first event', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      SearchAnalyticsService.trackSearch({ query: 'test', success: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    test('should flush pending events on beforeunload', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      SearchAnalyticsService.trackSearch({ query: 'test', success: true });

      window.dispatchEvent(new Event('beforeunload'));

      expect(setItemSpy).toHaveBeenCalled();

      const summary = SearchAnalyticsService.getSummary(30);
      expect(summary.totalSearches).toBe(1);

      setItemSpy.mockRestore();
    });
  });

  describe('M1 Fix: Retry Counter', () => {
    test('should retry up to 3 times on quota exceeded', () => {
      const setItemMock = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      SearchAnalyticsService.trackSearch({ query: 'test', success: true });

      vi.advanceTimersByTime(150);

      expect(setItemMock.mock.calls.length).toBeGreaterThanOrEqual(3);

      setItemMock.mockRestore();
    });
  });

  describe('M3 Fix: CSV Formula Injection', () => {
    test('should escape queries starting with =', () => {
      SearchAnalyticsService.trackSearch({ query: '=1+1', success: true });

      vi.advanceTimersByTime(150);

      const csv = SearchAnalyticsService.exportData({ format: 'csv', includeQueries: true });
      expect(csv).toContain('"\'=1+1"');
      expect(csv).not.toContain(',"=1+1",');
    });

    test('should not escape normal queries', () => {
      SearchAnalyticsService.trackSearch({ query: 'normal query', success: true });

      vi.advanceTimersByTime(150);

      const csv = SearchAnalyticsService.exportData({ format: 'csv', includeQueries: true });
      expect(csv).toContain('"normal query"');
      expect(csv).not.toContain('"\'normal query"');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      SearchAnalyticsService.trackSearch({
        query: 'test query',
        responseTime: 1200,
        resultsCount: 25,
        success: true,
        source: 'manual'
      });

      vi.advanceTimersByTime(150);
    });

    test('should export as JSON', () => {
      const json = SearchAnalyticsService.exportData({ format: 'json' });
      const data = JSON.parse(json);

      expect(Array.isArray(data)).toBe(true);
      expect(data[0]?.query).toBe('test query');
    });

    test('should redact queries when includeQueries=false', () => {
      const csv = SearchAnalyticsService.exportData({ format: 'csv', includeQueries: false });

      expect(csv).toContain('[REDACTED]');
      expect(csv).not.toContain('test query');
    });
  });
});
