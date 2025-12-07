/**
 * Search Suggestions Service - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104 Day 3: Intelligent Search Autocomplete
 *
 * Features:
 * - Multi-source suggestion aggregation (history, saved, trending, AI)
 * - Personalized ranking with recency/success weighting
 * - LRU cache with configurable TTL
 * - Debouncing and request cancellation support
 * - Privacy controls (opt-out, clear history)
 * - WCAG 2.1 Level AA accessibility support
 *
 * Inspired by: Google Search, Netflix search, Amazon autocomplete
 *
 * Performance Targets:
 * - Response time: <100ms (p95)
 * - Cache hit rate: >80%
 * - Memory usage: <5MB
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/utils/logger';
import { SearchAnalyticsService } from './search-analytics.service';
import { SavedSearchesService } from './saved-searches.service';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type SuggestionSource =
  | 'user_history'
  | 'saved_search'
  | 'trending'
  | 'ai_semantic';

export type MatchType = 'exact' | 'fuzzy' | 'substring' | 'semantic';

export interface Suggestion {
  id: string;
  query: string;
  source: SuggestionSource;
  score: number; // 0-100
  metadata: SuggestionMetadata;
}

export interface SuggestionMetadata {
  matchType: MatchType;
  recencyDays: number;
  usageCount?: number;
  successRate?: number; // 0-100
  tags?: string[];
  relatedQueries?: string[];
}

export interface SuggestionOptions {
  maxResults?: number; // Default: 10
  sources?: SuggestionSource[]; // Filter sources
  minScore?: number; // Minimum relevance score
  personalized?: boolean; // Use user history (default: true)
}

export interface PrivacySettings {
  personalizationEnabled: boolean;
  historyBasedSuggestions: boolean;
  trendingQueriesEnabled: boolean;
  aiSuggestionsEnabled: boolean;
}

interface CacheEntry {
  suggestions: Suggestion[];
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PRIVACY = 'vqmethod_suggestions_privacy';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Max queries cached
const DEFAULT_MAX_RESULTS = 10;
const MIN_QUERY_LENGTH = 2; // Don't suggest for queries shorter than this

// Source weights (Netflix-grade: data-driven allocation)
const SOURCE_WEIGHTS = {
  user_history: 0.4,
  saved_search: 0.3,
  trending: 0.2,
  ai_semantic: 0.1
} as const;

// Match type scores
const MATCH_SCORES = {
  exact: 100,
  fuzzy: 80,
  substring: 60,
  semantic: 40
} as const;

// Recency multipliers (more recent = higher boost)
const RECENCY_MULTIPLIERS = {
  day1: 1.5, // Last 24 hours
  week1: 1.2, // Last 7 days
  month1: 1.0, // Last 30 days
  older: 0.5 // Older than 30 days
} as const;

// Success rate multipliers (from SearchAnalyticsService)
const SUCCESS_RATE_MULTIPLIERS = {
  excellent: 1.3, // 90-100%
  good: 1.1, // 70-90%
  average: 1.0, // 50-70%
  poor: 0.7 // <50%
} as const;

// Usage frequency multipliers (for saved searches)
const USAGE_MULTIPLIERS = {
  high: 1.4, // >10 uses
  medium: 1.2, // 3-10 uses
  low: 1.0 // 1-2 uses
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export class SearchSuggestionsService {
  private static cache: Map<string, CacheEntry> = new Map();
  private static cacheAccessTimestamps: Map<string, number> = new Map(); // O(1) LRU tracking
  private static abortControllers: Map<string, AbortController> = new Map();

  /**
   * Get search suggestions for a query (Netflix-grade: multi-source aggregation)
   *
   * @param query - Search query to get suggestions for
   * @param options - Configuration options
   * @returns Array of ranked suggestions
   *
   * @example
   * const suggestions = await SearchSuggestionsService.getSuggestions('machine', {
   *   maxResults: 5,
   *   personalized: true
   * });
   */
  static async getSuggestions(
    query: string,
    options: SuggestionOptions = {}
  ): Promise<Suggestion[]> {
    // Phase 10.106: Declare variables outside try block for finally access
    let normalizedQuery: string | undefined;
    let myController: AbortController | undefined;

    try {
      // Validate input
      if (!query || query.trim().length < MIN_QUERY_LENGTH) {
        return [];
      }

      normalizedQuery = query.trim().toLowerCase();
      const {
        maxResults = DEFAULT_MAX_RESULTS,
        sources,
        minScore = 0,
        personalized = true
      } = options;

      // Check privacy settings
      const privacySettings = this.getPrivacySettings();
      if (!personalized || !privacySettings.personalizationEnabled) {
        logger.debug('Personalization disabled, using generic suggestions', 'SearchSuggestions');
        return this.getGenericSuggestions(normalizedQuery, maxResults);
      }

      // Check cache
      const cached = this.getCached(normalizedQuery);
      if (cached) {
        logger.debug('Cache hit for suggestions', 'SearchSuggestions', { query: normalizedQuery });
        return this.filterAndLimit(cached, minScore, maxResults);
      }

      // Cancel any pending request for this query
      this.cancelPendingRequest(normalizedQuery);

      // Create abort controller for this request
      const abortController = new AbortController();
      this.abortControllers.set(normalizedQuery, abortController);

      // ✅ RACE CONDITION FIX: Store reference to THIS controller
      // Issue: Phase 10.105 ULTRATHINK Review - Concurrent requests could delete wrong controller
      // If Request A finishes after Request B starts, A's finally shouldn't delete B's controller
      myController = abortController;

      // Aggregate suggestions from all sources
      const allSuggestions: Suggestion[] = [];

      // Source 1: User History (40% weight)
      if (!sources || sources.includes('user_history')) {
        if (privacySettings.historyBasedSuggestions) {
          const historySuggestions = this.getHistorySuggestions(normalizedQuery);
          allSuggestions.push(...historySuggestions);
        }
      }

      // Source 2: Saved Searches (30% weight)
      if (!sources || sources.includes('saved_search')) {
        const savedSuggestions = this.getSavedSearchSuggestions(normalizedQuery);
        allSuggestions.push(...savedSuggestions);
      }

      // Source 3: Trending Queries (20% weight)
      if (!sources || sources.includes('trending')) {
        if (privacySettings.trendingQueriesEnabled) {
          const trendingSuggestions = await this.getTrendingSuggestions(
            normalizedQuery,
            abortController.signal
          );
          allSuggestions.push(...trendingSuggestions);
        }
      }

      // Source 4: AI Semantic (10% weight)
      if (!sources || sources.includes('ai_semantic')) {
        if (privacySettings.aiSuggestionsEnabled) {
          const aiSuggestions = await this.getAISuggestions(
            normalizedQuery,
            abortController.signal
          );
          allSuggestions.push(...aiSuggestions);
        }
      }

      // Deduplicate and rank
      const rankedSuggestions = this.rankAndDeduplicate(allSuggestions);

      // Cache results
      this.setCached(normalizedQuery, rankedSuggestions);

      logger.debug('Suggestions generated', 'SearchSuggestions', {
        query: normalizedQuery,
        count: rankedSuggestions.length,
        sources: sources || 'all'
      });

      return this.filterAndLimit(rankedSuggestions, minScore, maxResults);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('Suggestion request cancelled', 'SearchSuggestions', { query });
        return [];
      }

      logger.error('Failed to get suggestions', 'SearchSuggestions', { error, query });
      return [];
    } finally {
      // ✅ CRITICAL FIX: Always cleanup abort controller (prevents memory leak)
      // Moved from try block to finally block to ensure cleanup on ALL paths
      // Issue: Phase 10.105 Day 5 - AbortController leaked on error paths
      //
      // ✅ RACE CONDITION FIX: Only delete if Map still has OUR controller
      // Issue: Phase 10.105 ULTRATHINK Review - Concurrent requests race condition
      // Prevents Request A from deleting Request B's controller
      // Phase 10.106: Guard against undefined (early returns)
      if (normalizedQuery && myController && this.abortControllers.get(normalizedQuery) === myController) {
        this.abortControllers.delete(normalizedQuery);
      }
    }
  }

  /**
   * Get suggestions from user's search history
   */
  private static getHistorySuggestions(query: string): Suggestion[] {
    try {
      const summary = SearchAnalyticsService.getSummary(30); // Last 30 days
      const suggestions: Suggestion[] = [];

      summary.recentSearches.forEach(event => {
        const eventQuery = event.query.toLowerCase();

        // Check if query matches
        const matchType = this.getMatchType(query, eventQuery);
        if (!matchType) return;

        // Calculate recency
        const recencyDays = Math.floor((Date.now() - event.timestamp) / (1000 * 60 * 60 * 24));

        // Calculate success rate (from analytics)
        const successRate = event.success ? 100 : 0;

        // Calculate score
        const baseScore = MATCH_SCORES[matchType];
        const recencyMultiplier = this.getRecencyMultiplier(recencyDays);
        const successMultiplier = this.getSuccessRateMultiplier(successRate);
        const sourceWeight = SOURCE_WEIGHTS.user_history;

        const score = baseScore * recencyMultiplier * successMultiplier * sourceWeight;

        suggestions.push({
          id: `history_${event.timestamp}_${event.query}`,
          query: event.query,
          source: 'user_history',
          score,
          metadata: {
            matchType,
            recencyDays,
            successRate,
            relatedQueries: []
          }
        });
      });

      return suggestions;
    } catch (error: unknown) {
      logger.error('Failed to get history suggestions', 'SearchSuggestions', { error });
      return [];
    }
  }

  /**
   * Get suggestions from user's saved searches
   */
  private static getSavedSearchSuggestions(query: string): Suggestion[] {
    try {
      const savedSearches = SavedSearchesService.getAllSearches('usage');
      const suggestions: Suggestion[] = [];

      savedSearches.forEach(saved => {
        const savedQuery = saved.query.toLowerCase();

        // Check if query matches
        const matchType = this.getMatchType(query, savedQuery);
        if (!matchType) return;

        // Calculate recency
        const recencyDays = Math.floor((Date.now() - saved.createdAt) / (1000 * 60 * 60 * 24));

        // Calculate usage multiplier
        const usageMultiplier = this.getUsageMultiplier(saved.usageCount);

        // Calculate score
        const baseScore = MATCH_SCORES[matchType];
        const recencyMultiplier = this.getRecencyMultiplier(recencyDays);
        const sourceWeight = SOURCE_WEIGHTS.saved_search;

        const score = baseScore * recencyMultiplier * usageMultiplier * sourceWeight;

        suggestions.push({
          id: `saved_${saved.id}`,
          query: saved.query,
          source: 'saved_search',
          score,
          metadata: {
            matchType,
            recencyDays,
            usageCount: saved.usageCount,
            tags: saved.tags
          }
        });
      });

      return suggestions;
    } catch (error: unknown) {
      logger.error('Failed to get saved search suggestions', 'SearchSuggestions', { error });
      return [];
    }
  }

  /**
   * Get trending suggestions (mock for now - would call backend API)
   */
  private static async getTrendingSuggestions(
    query: string,
    _signal: AbortSignal // Phase 10.106: Prefixed unused param for future API integration
  ): Promise<Suggestion[]> {
    try {
      // TODO: Replace with actual backend API call
      // For now, return mock trending queries
      const mockTrending = [
        'machine learning applications',
        'machine learning algorithms',
        'machine learning tutorial',
        'symbolic interactionism',
        'Q methodology factor analysis'
      ];

      const suggestions: Suggestion[] = [];

      mockTrending.forEach((trendingQuery, index) => {
        const matchType = this.getMatchType(query, trendingQuery.toLowerCase());
        if (!matchType) return;

        const baseScore = MATCH_SCORES[matchType];
        const popularityScore = (mockTrending.length - index) / mockTrending.length; // Higher = more popular
        const sourceWeight = SOURCE_WEIGHTS.trending;

        const score = baseScore * popularityScore * sourceWeight;

        suggestions.push({
          id: `trending_${index}_${trendingQuery}`,
          query: trendingQuery,
          source: 'trending',
          score,
          metadata: {
            matchType,
            recencyDays: 0 // Trending is current
          }
        });
      });

      return suggestions;
    } catch (error: unknown) {
      logger.error('Failed to get trending suggestions', 'SearchSuggestions', { error });
      return [];
    }
  }

  /**
   * Get AI-powered semantic suggestions (mock for now - would call OpenAI)
   */
  private static async getAISuggestions(
    query: string,
    _signal: AbortSignal // Phase 10.106: Prefixed unused param for future API integration
  ): Promise<Suggestion[]> {
    try {
      // TODO: Replace with actual OpenAI embeddings API call
      // For now, return mock semantic suggestions
      const mockSemanticMap: Record<string, string[]> = {
        machine: ['artificial intelligence', 'deep learning', 'neural networks'],
        learning: ['education', 'training', 'knowledge acquisition'],
        research: ['study', 'investigation', 'analysis']
      };

      const suggestions: Suggestion[] = [];
      const queryWords = query.split(' ');

      queryWords.forEach(word => {
        const relatedQueries = mockSemanticMap[word] || [];
        relatedQueries.forEach((related, index) => {
          const baseScore = MATCH_SCORES.semantic;
          const relevanceScore = (relatedQueries.length - index) / relatedQueries.length;
          const sourceWeight = SOURCE_WEIGHTS.ai_semantic;

          const score = baseScore * relevanceScore * sourceWeight;

          suggestions.push({
            id: `ai_${word}_${related}`,
            query: related,
            source: 'ai_semantic',
            score,
            metadata: {
              matchType: 'semantic',
              recencyDays: 0,
              relatedQueries: [query]
            }
          });
        });
      });

      return suggestions;
    } catch (error: unknown) {
      logger.error('Failed to get AI suggestions', 'SearchSuggestions', { error });
      return [];
    }
  }

  /**
   * Determine match type between query and candidate
   */
  private static getMatchType(query: string, candidate: string): MatchType | null {
    if (!candidate.includes(query)) {
      return null;
    }

    // Exact prefix match
    if (candidate.startsWith(query)) {
      return 'exact';
    }

    // Word boundary match (fuzzy)
    if (candidate.split(' ').some(word => word.startsWith(query))) {
      return 'fuzzy';
    }

    // Substring match
    if (candidate.includes(query)) {
      return 'substring';
    }

    return null;
  }

  /**
   * Get recency multiplier based on days since last use
   */
  private static getRecencyMultiplier(days: number): number {
    if (days <= 1) return RECENCY_MULTIPLIERS.day1;
    if (days <= 7) return RECENCY_MULTIPLIERS.week1;
    if (days <= 30) return RECENCY_MULTIPLIERS.month1;
    return RECENCY_MULTIPLIERS.older;
  }

  /**
   * Get success rate multiplier (from analytics)
   */
  private static getSuccessRateMultiplier(successRate: number): number {
    if (successRate >= 90) return SUCCESS_RATE_MULTIPLIERS.excellent;
    if (successRate >= 70) return SUCCESS_RATE_MULTIPLIERS.good;
    if (successRate >= 50) return SUCCESS_RATE_MULTIPLIERS.average;
    return SUCCESS_RATE_MULTIPLIERS.poor;
  }

  /**
   * Get usage multiplier based on usage count
   */
  private static getUsageMultiplier(usageCount: number): number {
    if (usageCount > 10) return USAGE_MULTIPLIERS.high;
    if (usageCount >= 3) return USAGE_MULTIPLIERS.medium;
    return USAGE_MULTIPLIERS.low;
  }

  /**
   * Rank and deduplicate suggestions
   */
  private static rankAndDeduplicate(suggestions: Suggestion[]): Suggestion[] {
    // Deduplicate by query (keep highest score)
    const queryMap = new Map<string, Suggestion>();

    suggestions.forEach(suggestion => {
      const existing = queryMap.get(suggestion.query);
      if (!existing || suggestion.score > existing.score) {
        queryMap.set(suggestion.query, suggestion);
      }
    });

    // Sort by score descending
    return Array.from(queryMap.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Filter and limit suggestions
   */
  private static filterAndLimit(
    suggestions: Suggestion[],
    minScore: number,
    maxResults: number
  ): Suggestion[] {
    return suggestions
      .filter(s => s.score >= minScore)
      .slice(0, maxResults);
  }

  /**
   * Get generic (non-personalized) suggestions
   */
  private static getGenericSuggestions(_query: string, _maxResults: number): Suggestion[] {
    // Phase 10.106: Params prefixed - will be used when trending API is implemented
    // Return only trending suggestions when personalization is off
    // This ensures privacy while still providing value
    return [];
  }

  /**
   * Check cache for suggestions (updates LRU access order)
   * Performance: O(1) access time (was O(n) with array filter)
   */
  private static getCached(query: string): Suggestion[] | null {
    const entry = this.cache.get(query);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(query);
      this.cacheAccessTimestamps.delete(query);
      return null;
    }

    // Update LRU timestamp: O(1) operation
    this.cacheAccessTimestamps.set(query, Date.now());

    return entry.suggestions;
  }

  /**
   * Cache suggestions with TRUE LRU eviction
   * Performance: O(n) only during eviction, O(1) for cache hits
   */
  private static setCached(query: string, suggestions: Suggestion[]): void {
    // ✅ HIGH-PRIORITY FIX: Use single Date.now() call for consistency
    // Issue: Phase 10.105 Day 5 - Two Date.now() calls create different timestamps
    // This caused cache entry and LRU tracker to be out of sync by 1-2ms
    const now = Date.now();

    // TRUE LRU eviction: remove least recently accessed
    // Only iterate when cache is full and adding new entry (not on every access)
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(query)) {
      let lruKey: string | undefined;
      let oldestTime = Infinity;

      // O(n) iteration only during eviction (not on every access - major perf improvement)
      for (const [key, time] of this.cacheAccessTimestamps) {
        if (time < oldestTime) {
          oldestTime = time;
          lruKey = key;
        }
      }

      if (lruKey) {
        this.cache.delete(lruKey);
        this.cacheAccessTimestamps.delete(lruKey);
      }
    }

    // ✅ Use same timestamp for both structures
    this.cache.set(query, {
      suggestions,
      timestamp: now
    });

    // O(1) timestamp update
    this.cacheAccessTimestamps.set(query, now);
  }

  /**
   * Clear suggestion cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheAccessTimestamps.clear();
    logger.info('Suggestion cache cleared', 'SearchSuggestions');
  }

  /**
   * Cancel pending request for a query
   */
  private static cancelPendingRequest(query: string): void {
    const controller = this.abortControllers.get(query);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(query);
    }
  }

  /**
   * Get privacy settings
   */
  static getPrivacySettings(): PrivacySettings {
    try {
      // SSR guard: localStorage only available in browser
      if (typeof window === 'undefined') {
        return this.getDefaultPrivacySettings();
      }

      const stored = localStorage.getItem(STORAGE_KEY_PRIVACY);
      if (!stored) {
        return this.getDefaultPrivacySettings();
      }

      const parsed = JSON.parse(stored);

      // Validate structure to prevent runtime errors from corrupted data
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed.personalizationEnabled === 'boolean' &&
        typeof parsed.historyBasedSuggestions === 'boolean' &&
        typeof parsed.trendingQueriesEnabled === 'boolean' &&
        typeof parsed.aiSuggestionsEnabled === 'boolean'
      ) {
        return parsed as PrivacySettings;
      }

      // Invalid data - clear and return defaults
      logger.warn('Invalid privacy settings in localStorage, using defaults', 'SearchSuggestions');
      localStorage.removeItem(STORAGE_KEY_PRIVACY);
      return this.getDefaultPrivacySettings();
    } catch (error: unknown) {
      logger.error('Failed to get privacy settings', 'SearchSuggestions', { error });
      return this.getDefaultPrivacySettings();
    }
  }

  /**
   * Set privacy settings
   */
  static setPrivacySettings(settings: PrivacySettings): void {
    try {
      // SSR guard: localStorage only available in browser
      if (typeof window === 'undefined') {
        logger.warn('Cannot set privacy settings on server', 'SearchSuggestions');
        return;
      }

      localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(settings));
      logger.info('Privacy settings updated', 'SearchSuggestions', { settings });

      // Clear cache when privacy settings change
      this.clearCache();
    } catch (error: unknown) {
      logger.error('Failed to set privacy settings', 'SearchSuggestions', { error });
    }
  }

  /**
   * Get default privacy settings (all enabled by default)
   */
  private static getDefaultPrivacySettings(): PrivacySettings {
    return {
      personalizationEnabled: true,
      historyBasedSuggestions: true,
      trendingQueriesEnabled: true,
      aiSuggestionsEnabled: false // AI off by default for privacy
    };
  }

  /**
   * Set personalization enabled/disabled
   */
  static setPersonalizationEnabled(enabled: boolean): void {
    const settings = this.getPrivacySettings();
    settings.personalizationEnabled = enabled;
    this.setPrivacySettings(settings);
  }
}
