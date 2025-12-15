/**
 * SearchBar Component - Minimalist Smart Search
 *
 * Phase 10.113 Week 9 Redesign: Ultra-minimalist, intuitive search experience
 *
 * Design Philosophy:
 * - One search bar, smart by default
 * - No complex panels or mode selections
 * - Quality feedback integrated into dropdown
 * - Simple toggle for power users
 */

'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Loader2,
  ArrowRight,
  Filter,
  X,
  ChevronRight,
  Zap,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import { logger } from '@/lib/utils/logger';
import { SearchHistoryService } from '@/lib/services/search-history.service';
import * as ScientificQueryAPI from '@/lib/api/services/scientific-query-api.service';
import type { QueryValidationResponse } from '@/lib/api/services/scientific-query-api.service';
import { SearchAnalyticsService } from '@/lib/services/search-analytics.service';

// ============================================================================
// Constants
// ============================================================================

const SUGGESTION_DEBOUNCE_MS = 800;
const VALIDATION_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;
const MAX_HISTORY_SUGGESTIONS = 3;
const MAX_AI_SUGGESTIONS = 4;
const SMART_SEARCH_KEY = 'literature-smart-search-enabled';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Phase 10.144: Simplified props - Apple-grade minimalism
 * Removed individual source counts in favor of automatic open-access searching
 */
interface SearchBarProps {
  onSearch: () => Promise<void>;
  isLoading: boolean;
  appliedFilterCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const SearchBar = memo(function SearchBar({
  onSearch,
  isLoading,
  appliedFilterCount,
  showFilters,
  onToggleFilters,
}: SearchBarProps) {
  // State from store
  const {
    query,
    setQuery,
    aiSuggestions,
    showSuggestions,
    loadingSuggestions,
    queryCorrectionMessage,
    setAISuggestions,
    setShowSuggestions,
    setLoadingSuggestions,
    setQueryCorrection,
    papers,
    totalResults,
    loading,
  } = useLiteratureSearchStore();

  // Refs
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const lastSearchQueryRef = useRef<string>('');
  const lastSearchTimeRef = useRef<number>(0);
  const isSearchActiveRef = useRef<boolean>(false); // Phase 10.130: Prevent suggestions during search

  // Local state
  const [isMounted, setIsMounted] = React.useState(false);
  const [smartSearch, setSmartSearch] = React.useState(true);
  const [queryValidation, setQueryValidation] = React.useState<QueryValidationResponse | null>(null);
  const [historySuggestions, setHistorySuggestions] = React.useState<string[]>([]);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  // Initialize
  useEffect(() => {
    setIsMounted(true);
    // Load smart search preference
    const saved = localStorage.getItem(SMART_SEARCH_KEY);
    if (saved !== null) setSmartSearch(saved === 'true');
  }, []);

  // Toggle smart search
  const toggleSmartSearch = useCallback(() => {
    setSmartSearch(prev => {
      const next = !prev;
      localStorage.setItem(SMART_SEARCH_KEY, String(next));
      return next;
    });
  }, []);

  // Query validation effect (for showing tips/suggestions)
  useEffect(() => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);

    if (query && query.trim().length > 0) {
      const history = SearchHistoryService.getAutocomplete(query, MAX_HISTORY_SUGGESTIONS);
      setHistorySuggestions(history);
    } else {
      setQueryValidation(null);
      setHistorySuggestions([]);
      return;
    }

    if (query && query.trim().length >= MIN_QUERY_LENGTH) {
      validationTimerRef.current = setTimeout(async () => {
        try {
          const validation = await ScientificQueryAPI.validateQuery(query);
          setQueryValidation(validation);
        } catch {
          setQueryValidation(null);
        }
      }, VALIDATION_DEBOUNCE_MS);
    } else {
      setQueryValidation(null);
    }

    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, [query]);

  // AI suggestions effect
  useEffect(() => {
    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);

    // Phase 10.130: Don't fetch suggestions if search is active
    if (isSearchActiveRef.current) {
      return;
    }

    if (query && query.trim().length >= MIN_QUERY_LENGTH) {
      setLoadingSuggestions(true);
      setSuggestionError(null);

      suggestionTimerRef.current = setTimeout(async () => {
        // Double-check search isn't active before showing suggestions
        if (isSearchActiveRef.current) {
          setLoadingSuggestions(false);
          return;
        }
        try {
          const result = await QueryExpansionAPI.expandQuery(query, 'general');
          setAISuggestions([result.expanded, ...result.suggestions.slice(0, MAX_AI_SUGGESTIONS)]);
          // Phase 10.130: Only show suggestions if search is not active
          if (!isSearchActiveRef.current) {
            setShowSuggestions(true);
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          setSuggestionError(msg.includes('API key') ? 'AI not configured' : 'AI unavailable');
          setAISuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoadingSuggestions(false);
        }
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      setAISuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
    }

    return () => {
      if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    };
  }, [query, setAISuggestions, setLoadingSuggestions, setShowSuggestions]);

  // Analytics update
  useEffect(() => {
    if (!loading && lastSearchQueryRef.current && lastSearchQueryRef.current === query && lastSearchTimeRef.current > 0) {
      const history = SearchHistoryService.getHistory();
      const lastSearch = history[0];
      if (lastSearch && lastSearch.query === query && lastSearch.timestamp >= lastSearchTimeRef.current - 1000) {
        SearchHistoryService.addSearch(query, papers.length, true, lastSearch.responseTime);
      }
      lastSearchQueryRef.current = '';
      lastSearchTimeRef.current = 0;
    }
  }, [loading, papers, query, totalResults]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  // Local state for optimization
  const [isOptimizing, setIsOptimizing] = React.useState(false);

  // Handlers
  const handleQueryChange = useCallback((value: string) => {
    // Phase 10.130: Reset search active flag when user starts typing (new search intent)
    isSearchActiveRef.current = false;
    setQuery(value);
    setShowSuggestions(true);
    if (queryCorrectionMessage) setQueryCorrection(null);
  }, [setQuery, setShowSuggestions, queryCorrectionMessage, setQueryCorrection]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      // Phase 10.130: Mark search as active to prevent dropdown from reopening
      isSearchActiveRef.current = true;
      setShowSuggestions(false);
      // Call onSearch directly to avoid circular dependency
      onSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [setShowSuggestions, query, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string, source?: 'history' | 'ai_suggestion') => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setQueryCorrection(null);
    if (source) SearchAnalyticsService.trackSuggestionClick(suggestion, source);
  }, [setQuery, setShowSuggestions, setQueryCorrection]);

  /**
   * Handle search with Smart Search optimization
   * When Smart Search is ON: applies 'enhanced' mode (spell-check + methodology terms)
   * When Smart Search is OFF: uses exact query (no modifications)
   */
  const handleSearch = useCallback(async () => {
    // Phase 10.130: Mark search as active to prevent dropdown from reopening
    isSearchActiveRef.current = true;

    // Close dropdown immediately when search starts
    setShowSuggestions(false);

    const startTime = performance.now();
    lastSearchQueryRef.current = query;
    lastSearchTimeRef.current = Date.now();

    try {
      // Apply Enhanced optimization when Smart Search is ON
      if (smartSearch && query.trim().length >= MIN_QUERY_LENGTH) {
        setIsOptimizing(true);
        try {
          const optimizationMode = 'enhanced'; // Local + methodology terms
          const result = await ScientificQueryAPI.optimizeQuery(query, optimizationMode);

          if (result.shouldProceed && result.optimizedQuery !== query) {
            logger.debug('Applied enhanced optimization', 'SearchBar', {
              original: query,
              optimized: result.optimizedQuery,
              mode: optimizationMode
            });
            // Use optimized query
            setQuery(result.optimizedQuery);
          }
        } catch (optError) {
          // Optimization failed - proceed with original query
          logger.warn('Smart Search optimization failed, using original query', 'SearchBar', {
            error: optError instanceof Error ? optError.message : 'Unknown'
          });
        } finally {
          setIsOptimizing(false);
        }
      }

      await onSearch();
      SearchAnalyticsService.trackSearch({
        query,
        responseTime: Math.round(performance.now() - startTime),
        resultsCount: 0,
        success: true,
        source: 'manual' // Enhanced mode applied transparently
      });
    } catch (error) {
      SearchHistoryService.addSearch(query, 0, false);
      SearchAnalyticsService.trackSearch({
        query,
        responseTime: Math.round(performance.now() - startTime),
        success: false,
        source: 'manual',
        errorType: error instanceof Error ? error.message : 'Unknown'
      });
      lastSearchQueryRef.current = '';
      lastSearchTimeRef.current = 0;
    }
  }, [query, onSearch, smartSearch, setQuery, setShowSuggestions]);

  // Derived
  const hasDropdownContent = historySuggestions.length > 0 || aiSuggestions.length > 0 || loadingSuggestions || suggestionError;

  return (
    <div className="space-y-3">
        {/* Main Search Row */}
        <div className="flex gap-2">
          <div ref={searchContainerRef} className="relative flex-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search academic papers..."
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Phase 10.130: Only show suggestions on focus if search is not active
                  if (!isSearchActiveRef.current && aiSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="pl-12 pr-24 h-12 text-base border-2 focus:border-purple-500 rounded-xl"
                maxLength={500}
              />

              {/* Right side: Smart toggle */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">

                {/* Smart Search Toggle - Enhanced Mode */}
                <button
                  type="button"
                  onClick={toggleSmartSearch}
                  title={smartSearch
                    ? 'Enhanced Mode ON: Spell-check + methodology terms + Q-methodology aware'
                    : 'Enhanced Mode OFF: Exact query only'}
                  className={`p-1.5 rounded-lg transition-all ${
                    isOptimizing
                      ? 'bg-purple-200 text-purple-700 animate-pulse'
                      : smartSearch
                        ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  disabled={isOptimizing}
                >
                  {isOptimizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && hasDropdownContent && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-800">Suggestions</span>
                    </div>
                    {loadingSuggestions && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                  </div>

                  {/* Quality tip (if issues) */}
                  {queryValidation && queryValidation.issues.length > 0 && (
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        {queryValidation.suggestions[0] || queryValidation.issues[0]}
                      </p>
                    </div>
                  )}

                  {/* Error state */}
                  {suggestionError && (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <X className="w-4 h-4 text-gray-400" />
                      {suggestionError}
                    </div>
                  )}

                  {/* Loading state */}
                  {loadingSuggestions && !suggestionError && (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      Finding best queries...
                    </div>
                  )}

                  {/* History suggestions */}
                  {!loadingSuggestions && historySuggestions.length > 0 && (
                    <div>
                      {historySuggestions.map((s, i) => (
                        <button
                          key={`h-${i}`}
                          onClick={() => handleSuggestionClick(s, 'history')}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 flex-1 truncate">{s}</span>
                          <ArrowRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  {!loadingSuggestions && historySuggestions.length > 0 && aiSuggestions.length > 0 && (
                    <div className="border-t border-gray-100" />
                  )}

                  {/* AI suggestions */}
                  {!loadingSuggestions && !suggestionError && aiSuggestions.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {aiSuggestions.map((s, i) => (
                        <button
                          key={`ai-${i}`}
                          onClick={() => handleSuggestionClick(s, 'ai_suggestion')}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left group"
                        >
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            i === 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {i === 0 ? '★' : i + 1}
                          </span>
                          <span className="text-sm text-gray-700 flex-1 truncate group-hover:text-purple-700">{s}</span>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                    <span>↵ to search</span>
                    <span>esc to close</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>

          {/* Filters Button */}
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="h-12 px-4 border-2 rounded-xl relative"
          >
            <Filter className="w-4 h-4" />
            {isMounted && appliedFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs">
                {appliedFilterCount}
              </Badge>
            )}
            {showFilters ? <X className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Phase 10.144: Apple-grade source indicator with ORCID unlock */}
        {isMounted && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-0.5 px-2">
                ✓ 9 Open Access Sources
              </Badge>
            </div>
            {/* ORCID Unlock - Premium sources indicator */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors group"
              title="Connect ORCID to unlock premium academic sources"
              onClick={() => {
                // TODO: Phase 10.145 - ORCID OAuth integration
                logger.info('ORCID unlock clicked', 'SearchBar');
              }}
            >
              <span className="group-hover:text-purple-600">Connect ORCID</span>
              <span className="text-purple-500 font-medium">→ +8 Premium</span>
            </button>
          </div>
        )}
      </div>
  );
});
