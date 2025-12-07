/**
 * Search History Service - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104: Netflix-Grade Search Bar Optimization
 *
 * Features:
 * - Persistent search history (localStorage)
 * - Intelligent sorting (successful searches first)
 * - Autocomplete suggestions from history
 * - 90-day retention policy
 * - Privacy-compliant (local-only storage)
 * - Graceful degradation (quota exceeded handling)
 *
 * Inspired by: Netflix, Google, Amazon search patterns
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultsCount: number;
  success: boolean;
  responseTime?: number; // Optional: for analytics
}

export interface HistoryStats {
  totalSearches: number;
  successRate: number;
  avgResultsCount: number;
  mostSearched: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export class SearchHistoryService {
  private static readonly KEY = 'vqmethod_search_history';
  private static readonly MAX_ITEMS = 50;
  private static readonly RETENTION_DAYS = 90;

  /**
   * Add search to history (Netflix-grade: immediate persistence)
   *
   * @param query - Search query
   * @param resultsCount - Number of results returned
   * @param success - Whether search was successful
   * @param responseTime - Optional response time in ms
   *
   * @remarks
   * - Deduplicates: Removes existing entry for same query
   * - Maintains chronological order (newest first)
   * - Auto-prunes to MAX_ITEMS
   * - Handles quota exceeded gracefully
   */
  static addSearch(
    query: string,
    resultsCount: number,
    success: boolean,
    responseTime?: number
  ): void {
    try {
      // Defensive: Validate inputs
      if (!query || typeof query !== 'string') {
        logger.warn('Invalid query provided to addSearch', 'SearchHistory');
        return;
      }

      const history = this.getHistory();

      // Deduplicate: Remove existing entry for same query
      const filtered = history.filter(item => item.query !== query);

      // Add new entry at top
      const newItem: SearchHistoryItem = {
        query: query.trim(),
        timestamp: Date.now(),
        resultsCount,
        success,
        ...(responseTime !== undefined && { responseTime })
      };

      filtered.unshift(newItem);

      // Keep only last 50 searches
      const trimmed = filtered.slice(0, this.MAX_ITEMS);

      // Persist to localStorage
      localStorage.setItem(this.KEY, JSON.stringify(trimmed));

      logger.debug('Search added to history', 'SearchHistory', {
        query,
        success,
        historySize: trimmed.length
      });
    } catch (error) {
      // Graceful degradation: localStorage might be full or disabled
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('QuotaExceededError') || errorMessage.includes('quota')) {
        logger.warn('localStorage quota exceeded - clearing old history', 'SearchHistory');
        this.clearOldest(10); // Remove 10 oldest items

        // Retry once after cleanup
        try {
          const history = this.getHistory();
          const newItem: SearchHistoryItem = {
            query: query.trim(),
            timestamp: Date.now(),
            resultsCount,
            success,
            ...(responseTime !== undefined && { responseTime })
          };
          history.unshift(newItem);
          localStorage.setItem(this.KEY, JSON.stringify(history.slice(0, this.MAX_ITEMS)));
        } catch (retryError) {
          logger.error('Failed to save search history after retry', 'SearchHistory', { retryError });
        }
      } else {
        logger.warn('Failed to save search history', 'SearchHistory', { error: errorMessage });
      }
    }
  }

  /**
   * Get search history (Netflix-grade: intelligent sorting)
   *
   * @returns Array of search history items, sorted intelligently
   *
   * @remarks
   * Sorting logic:
   * 1. Successful searches first
   * 2. Then by recency (most recent first)
   * 3. Filters out expired items (90 days retention)
   */
  static getHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.KEY);
      if (!stored) return [];

      const history: SearchHistoryItem[] = JSON.parse(stored);

      // Filter out expired items (90 days retention)
      const cutoff = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const filtered = history.filter(item => item.timestamp > cutoff);

      // Sort: Successful searches first, then by recency
      return filtered.sort((a, b) => {
        // Successful searches prioritized
        if (a.success !== b.success) {
          return a.success ? -1 : 1;
        }
        // Then by recency
        return b.timestamp - a.timestamp;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to load search history', 'SearchHistory', { error: errorMessage });
      return [];
    }
  }

  /**
   * Get autocomplete suggestions from history (Netflix-grade: smart filtering)
   *
   * @param prefix - Query prefix to match
   * @param maxResults - Maximum number of suggestions (default: 5)
   * @returns Array of matching queries
   *
   * @remarks
   * Matching logic:
   * - Case-insensitive substring match
   * - Prioritizes successful searches
   * - Returns most recent matches first
   */
  static getAutocomplete(prefix: string, maxResults: number = 5): string[] {
    if (!prefix || prefix.length < 2) {
      return [];
    }

    const history = this.getHistory();
    const lowerPrefix = prefix.toLowerCase().trim();

    return history
      .filter(item => item.query.toLowerCase().includes(lowerPrefix))
      .map(item => item.query)
      .slice(0, maxResults);
  }

  /**
   * Get recent searches (last N queries, regardless of match)
   *
   * @param count - Number of recent searches to return (default: 5)
   * @returns Array of recent search queries
   */
  static getRecent(count: number = 5): string[] {
    const history = this.getHistory();
    return history
      .slice(0, count)
      .map(item => item.query);
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.KEY);
      logger.info('Search history cleared', 'SearchHistory');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to clear search history', 'SearchHistory', { error: errorMessage });
    }
  }

  /**
   * Clear oldest N items (for quota management)
   *
   * @param count - Number of oldest items to remove
   */
  private static clearOldest(count: number): void {
    try {
      const history = this.getHistory();
      // Sort by timestamp (oldest first) and remove N items
      const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
      const kept = sorted.slice(count);
      localStorage.setItem(this.KEY, JSON.stringify(kept));
      logger.info('Cleared oldest search history items', 'SearchHistory', { count });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to clear oldest items', 'SearchHistory', { error: errorMessage });
    }
  }

  /**
   * Delete specific search from history
   *
   * @param query - Query to delete
   */
  static deleteSearch(query: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.query !== query);
      localStorage.setItem(this.KEY, JSON.stringify(filtered));
      logger.debug('Search deleted from history', 'SearchHistory', { query });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete search', 'SearchHistory', { error: errorMessage });
    }
  }

  /**
   * Get history statistics (for analytics dashboard)
   *
   * @returns Statistics about search history
   */
  static getStats(): HistoryStats {
    try {
      const history = this.getHistory();

      if (history.length === 0) {
        return {
          totalSearches: 0,
          successRate: 0,
          avgResultsCount: 0,
          mostSearched: []
        };
      }

      const totalSearches = history.length;
      const successfulSearches = history.filter(item => item.success).length;
      const successRate = (successfulSearches / totalSearches) * 100;

      const totalResults = history.reduce((sum, item) => sum + item.resultsCount, 0);
      const avgResultsCount = Math.round(totalResults / totalSearches);

      // Count query frequencies
      const queryCounts = history.reduce((acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top 5 most searched
      const mostSearched = Object.entries(queryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([query]) => query);

      return {
        totalSearches,
        successRate: Math.round(successRate),
        avgResultsCount,
        mostSearched
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get history stats', 'SearchHistory', { error: errorMessage });
      return {
        totalSearches: 0,
        successRate: 0,
        avgResultsCount: 0,
        mostSearched: []
      };
    }
  }

  /**
   * Check if storage is available
   *
   * @returns True if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
