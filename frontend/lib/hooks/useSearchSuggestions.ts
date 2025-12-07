/**
 * useSearchSuggestions Hook - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104 Day 4: SearchBar Integration
 *
 * Features:
 * - Debounced suggestions (300ms)
 * - Keyboard navigation state management
 * - Request cancellation on rapid typing
 * - Analytics tracking
 * - Loading state management
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchSuggestionsService, type Suggestion } from '@/lib/services/search-suggestions.service';
import { SearchAnalyticsService } from '@/lib/services/search-analytics.service';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UseSearchSuggestionsOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Minimum query length to trigger suggestions (default: 2) */
  minQueryLength?: number;
  /** Maximum number of suggestions (default: 10) */
  maxResults?: number;
  /** Enable/disable suggestions */
  enabled?: boolean;
}

export interface UseSearchSuggestionsReturn {
  /** Current suggestions */
  suggestions: Suggestion[];
  /** Loading state */
  isLoading: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Currently selected suggestion index (-1 = none) */
  selectedIndex: number;
  /** Open dropdown */
  open: () => void;
  /** Close dropdown */
  close: () => void;
  /** Select a suggestion */
  selectSuggestion: (suggestion: Suggestion) => void;
  /** Set selected index (for keyboard navigation) */
  setSelectedIndex: (index: number) => void;
  /** Clear suggestions */
  clearSuggestions: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_RESULTS = 10;

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
    maxResults = DEFAULT_MAX_RESULTS,
    enabled = true
  } = options;

  // ═════════════════════════════════════════════════════════════════════════
  // STATE
  // ═════════════════════════════════════════════════════════════════════════

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ═════════════════════════════════════════════════════════════════════════
  // REFS
  // ═════════════════════════════════════════════════════════════════════════

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');
  // ✅ CRITICAL FIX: Track if component is mounted to prevent state updates on unmounted component
  // Issue: Phase 10.105 Day 5 - React warning when component unmounts during async fetch
  const isMountedRef = useRef(true);

  // ✅ CRITICAL FIX: Track component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // FETCH SUGGESTIONS
  // ═════════════════════════════════════════════════════════════════════════

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!enabled) {
      return;
    }

    // Validate query length
    if (!searchQuery || searchQuery.trim().length < minQueryLength) {
      // ✅ Only update if component is still mounted
      if (isMountedRef.current) {
        setSuggestions([]);
        setIsOpen(false);
      }
      return;
    }

    try {
      // ✅ Only update loading state if mounted
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      lastQueryRef.current = searchQuery;

      logger.debug('Fetching suggestions', 'useSearchSuggestions', { query: searchQuery });

      const results = await SearchSuggestionsService.getSuggestions(searchQuery, {
        maxResults,
        personalized: true
      });

      // ✅ Only update if query hasn't changed AND component is still mounted
      if (isMountedRef.current && lastQueryRef.current === searchQuery) {
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1); // Reset selection on new results

        logger.debug('Suggestions fetched', 'useSearchSuggestions', {
          query: searchQuery,
          count: results.length
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch suggestions', 'useSearchSuggestions', { error, query: searchQuery });

      // ✅ Only update error state if mounted
      if (isMountedRef.current) {
        setSuggestions([]);
        setIsOpen(false);
      }
    } finally {
      // ✅ Only clear loading if query hasn't changed AND component is mounted
      if (isMountedRef.current && lastQueryRef.current === searchQuery) {
        setIsLoading(false);
      }
    }
  }, [enabled, minQueryLength, maxResults]);

  // ═════════════════════════════════════════════════════════════════════════
  // DEBOUNCED EFFECT
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    // Cleanup on unmount or query change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions, debounceMs]);

  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═════════════════════════════════════════════════════════════════════════

  const open = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
      logger.debug('Suggestions dropdown opened', 'useSearchSuggestions');
    }
  }, [suggestions.length]); // Depends on suggestions.length

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
    logger.debug('Suggestions dropdown closed', 'useSearchSuggestions');
  }, []);

  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    logger.info('Suggestion selected', 'useSearchSuggestions', {
      query: suggestion.query,
      source: suggestion.source,
      score: suggestion.score
    });

    // Track in analytics
    SearchAnalyticsService.trackSearch({
      query: suggestion.query,
      queryLength: suggestion.query.length,
      queryComplexity: 'simple',
      success: true,
      source: 'history' // From suggestion
    });

    close();
  }, [close]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    logger.debug('Suggestions cleared', 'useSearchSuggestions');
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═════════════════════════════════════════════════════════════════════════

  return {
    suggestions,
    isLoading,
    isOpen,
    selectedIndex,
    open,
    close,
    selectSuggestion,
    setSelectedIndex,
    clearSuggestions
  };
}
