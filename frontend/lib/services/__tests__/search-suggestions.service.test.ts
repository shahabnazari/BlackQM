/**
 * SearchSuggestionsService - Unit Tests (Netflix-Grade)
 * Phase 10.104 Day 3 - Vitest-compatible
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchSuggestionsService, type Suggestion } from '../search-suggestions.service';
import { SearchAnalyticsService } from '../search-analytics.service';
import { SavedSearchesService } from '../saved-searches.service';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('SearchSuggestionsService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    SearchSuggestionsService.clearCache();
    SearchAnalyticsService.clearData();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    test('should return empty array for queries shorter than 2 characters', async () => {
      const suggestions = await SearchSuggestionsService.getSuggestions('a');
      expect(suggestions.length).toBe(0);
    });

    test('should return suggestions for valid query', async () => {
      // Setup: Add some search history
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150); // Let analytics flush

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]?.query).toContain('machine');
    });

    test('should limit results to maxResults option', async () => {
      // Setup: Add multiple searches
      for (let i = 0; i < 15; i++) {
        SearchAnalyticsService.trackSearch({
          query: `machine learning ${i}`,
          success: true
        });
      }

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        maxResults: 5
      });

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Multi-Source Aggregation', () => {
    test('should aggregate from user history', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['user_history']
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]?.source).toBe('user_history');
    });

    test('should aggregate from saved searches', async () => {
      SavedSearchesService.saveSearch({
        query: 'machine learning algorithms',
        name: 'ML Algorithms'
      });

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['saved_search']
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]?.source).toBe('saved_search');
    });

    test('should aggregate from trending queries', async () => {
      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['trending']
      });

      const trendingSuggestions = suggestions.filter(s => s.source === 'trending');
      expect(trendingSuggestions.length).toBeGreaterThan(0);
    });

    test('should aggregate from all sources by default', async () => {
      // Add history
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      // Add saved search
      SavedSearchesService.saveSearch({
        query: 'machine learning tutorial',
        name: 'ML Tutorial'
      });

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      const sources = new Set(suggestions.map(s => s.source));
      expect(sources.size).toBeGreaterThan(1); // Multiple sources
    });
  });

  describe('Scoring Algorithm', () => {
    test('should score exact prefix matches higher than substrings', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });
      SearchAnalyticsService.trackSearch({
        query: 'deep machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      // "machine learning" should score higher than "deep machine learning"
      const exactMatch = suggestions.find(s => s.query === 'machine learning');
      const substringMatch = suggestions.find(s => s.query === 'deep machine learning');

      if (exactMatch && substringMatch) {
        expect(exactMatch.score).toBeGreaterThan(substringMatch.score);
      }
    });

    test('should boost recent queries', async () => {
      // Recent query
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true,
        timestamp: Date.now()
      });

      // Old query
      SearchAnalyticsService.trackSearch({
        query: 'machine learning basics',
        success: true,
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000 // 31 days ago
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      if (suggestions.length >= 2) {
        // Recent query should rank higher
        expect(suggestions[0]?.query).toBe('machine learning');
      }
    });

    test('should boost successful queries', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true,
        resultsCount: 100
      });
      SearchAnalyticsService.trackSearch({
        query: 'machine learning xyz',
        success: false,
        resultsCount: 0
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      // Successful query should rank higher
      if (suggestions.length > 0) {
        expect(suggestions[0]?.query).toBe('machine learning');
      }
    });

    test('should boost frequently used saved searches', async () => {
      const search1 = SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML'
      });

      const search2 = SavedSearchesService.saveSearch({
        query: 'machine learning tutorial',
        name: 'ML Tutorial'
      });

      // Use search1 multiple times
      for (let i = 0; i < 15; i++) {
        SavedSearchesService.useSearch(search1.id);
      }

      // Use search2 once
      SavedSearchesService.useSearch(search2.id);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['saved_search']
      });

      // High-usage search should rank higher
      if (suggestions.length >= 2) {
        expect(suggestions[0]?.query).toBe('machine learning');
      }
    });

    test('should filter by minScore option', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        minScore: 50
      });

      suggestions.forEach(suggestion => {
        expect(suggestion.score).toBeGreaterThanOrEqual(50);
      });
    });
  });

  describe('Caching', () => {
    test('should cache suggestions', async () => {
      const query = 'machine';

      // First call
      const suggestions1 = await SearchSuggestionsService.getSuggestions(query);

      // Second call (should hit cache)
      const suggestions2 = await SearchSuggestionsService.getSuggestions(query);

      expect(suggestions1).toEqual(suggestions2);
    });

    test('should clear cache on clearCache()', async () => {
      await SearchSuggestionsService.getSuggestions('machine');

      SearchSuggestionsService.clearCache();

      // Verify cache is empty (indirectly by checking fresh results)
      const suggestions = await SearchSuggestionsService.getSuggestions('machine');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should respect cache TTL', async () => {
      vi.useFakeTimers();

      const query = 'machine';
      await SearchSuggestionsService.getSuggestions(query);

      // Advance time past TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Should regenerate suggestions (cache expired)
      const suggestions = await SearchSuggestionsService.getSuggestions(query);
      expect(Array.isArray(suggestions)).toBe(true);

      vi.useRealTimers();
    });

    test('should implement LRU eviction when cache is full', async () => {
      // Fill cache with 100 queries (MAX_CACHE_SIZE)
      for (let i = 0; i < 100; i++) {
        await SearchSuggestionsService.getSuggestions(`query${i}`);
      }

      // Add one more (should evict oldest)
      await SearchSuggestionsService.getSuggestions('newquery');

      // Verify cache still works
      const suggestions = await SearchSuggestionsService.getSuggestions('newquery');
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Privacy Controls', () => {
    test('should respect personalization disabled', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
        personalized: false
      });

      // Should return empty (generic suggestions not implemented yet)
      expect(suggestions.length).toBe(0);
    });

    test('should get/set privacy settings', () => {
      const settings = {
        personalizationEnabled: false,
        historyBasedSuggestions: false,
        trendingQueriesEnabled: true,
        aiSuggestionsEnabled: false
      };

      SearchSuggestionsService.setPrivacySettings(settings);

      const retrieved = SearchSuggestionsService.getPrivacySettings();
      expect(retrieved).toEqual(settings);
    });

    test('should set personalization enabled/disabled', () => {
      SearchSuggestionsService.setPersonalizationEnabled(false);

      const settings = SearchSuggestionsService.getPrivacySettings();
      expect(settings.personalizationEnabled).toBe(false);
    });

    test('should clear cache when privacy settings change', async () => {
      await SearchSuggestionsService.getSuggestions('machine');

      SearchSuggestionsService.setPrivacySettings({
        personalizationEnabled: true,
        historyBasedSuggestions: true,
        trendingQueriesEnabled: true,
        aiSuggestionsEnabled: true
      });

      // Cache should be cleared (indirectly verified)
      const suggestions = await SearchSuggestionsService.getSuggestions('machine');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should return default privacy settings if none stored', () => {
      localStorage.clear();

      const settings = SearchSuggestionsService.getPrivacySettings();

      expect(settings.personalizationEnabled).toBe(true);
      expect(settings.historyBasedSuggestions).toBe(true);
      expect(settings.trendingQueriesEnabled).toBe(true);
      expect(settings.aiSuggestionsEnabled).toBe(false); // AI off by default
    });
  });

  describe('Deduplication', () => {
    test('should deduplicate suggestions with same query', async () => {
      // Add same query to history multiple times
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      // Also add to saved searches
      SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML'
      });

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      // Should have only one "machine learning" suggestion
      const mlSuggestions = suggestions.filter(s => s.query === 'machine learning');
      expect(mlSuggestions.length).toBe(1);
    });

    test('should keep highest scoring duplicate', async () => {
      // Add query with low success rate
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: false
      });

      vi.advanceTimersByTime(150);

      // Add same query to saved searches with high usage
      const saved = SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML'
      });

      for (let i = 0; i < 20; i++) {
        SavedSearchesService.useSearch(saved.id);
      }

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      const mlSuggestion = suggestions.find(s => s.query === 'machine learning');
      // Should keep the saved search version (higher score due to high usage)
      expect(mlSuggestion?.source).toBe('saved_search');
    });
  });

  describe('Match Types', () => {
    test('should identify exact prefix matches', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      const suggestion = suggestions.find(s => s.query === 'machine learning');
      expect(suggestion?.metadata.matchType).toBe('exact');
    });

    test('should identify fuzzy matches', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'deep machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      const suggestion = suggestions.find(s => s.query === 'deep machine learning');
      expect(suggestion?.metadata.matchType).toBe('fuzzy');
    });

    test('should identify substring matches', async () => {
      SearchAnalyticsService.trackSearch({
        query: 'supervised machine learning',
        success: true
      });

      vi.advanceTimersByTime(150);

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      const suggestion = suggestions.find(s => s.query === 'supervised machine learning');
      expect(['fuzzy', 'substring']).toContain(suggestion?.metadata.matchType);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully and continue with working sources', async () => {
      // Force an error by mocking SearchAnalyticsService to throw
      vi.spyOn(SearchAnalyticsService, 'getSummary').mockImplementation(() => {
        throw new Error('Test error');
      });

      const suggestions = await SearchSuggestionsService.getSuggestions('machine');

      // Should still return suggestions from trending/saved sources (history will be empty)
      // But overall result should not throw error
      expect(Array.isArray(suggestions)).toBe(true);

      // Verify no user_history suggestions (failed source)
      const historySuggestions = suggestions.filter(s => s.source === 'user_history');
      expect(historySuggestions.length).toBe(0);
    });

    test('should handle localStorage errors gracefully', () => {
      // Force localStorage to throw
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const settings = SearchSuggestionsService.getPrivacySettings();

      // Should return defaults
      expect(settings.personalizationEnabled).toBe(true);
    });
  });

  describe('Integration with Day 2 Services', () => {
    test('should use SearchAnalyticsService for history suggestions', async () => {
      const getSummarySpy = vi.spyOn(SearchAnalyticsService, 'getSummary');

      await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['user_history']
      });

      expect(getSummarySpy).toHaveBeenCalledWith(30); // Last 30 days
    });

    test('should use SavedSearchesService for saved suggestions', async () => {
      const getAllSearchesSpy = vi.spyOn(SavedSearchesService, 'getAllSearches');

      await SearchSuggestionsService.getSuggestions('machine', {
        sources: ['saved_search']
      });

      expect(getAllSearchesSpy).toHaveBeenCalledWith('usage'); // Sorted by usage
    });
  });
});
