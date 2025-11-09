/**
 * SearchBar Component
 * Extracted from literature page (Week 1 Day 1-2)
 * Handles search input, AI suggestions, and query correction
 * Phase 10 Day 31 - Enterprise Refactoring
 */

'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, ArrowRight, Filter, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const SUGGESTION_DEBOUNCE_MS = 800;
const MIN_QUERY_LENGTH = 3;

// ============================================================================
// Component Props
// ============================================================================

interface SearchBarProps {
  /** Handler for executing search across all sources */
  onSearch: () => Promise<void>;
  /** Loading state from parent (academic, alternative, social searches) */
  isLoading: boolean;
  /** Number of applied filters for badge display */
  appliedFilterCount: number;
  /** Show/hide filters panel */
  showFilters: boolean;
  /** Toggle filters panel visibility */
  onToggleFilters: () => void;
  /** Active academic databases count */
  academicDatabasesCount: number;
  /** Active alternative sources count */
  alternativeSourcesCount: number;
  /** Active social platforms count */
  socialPlatformsCount: number;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const SearchBar = memo(function SearchBar({
  onSearch,
  isLoading,
  appliedFilterCount,
  showFilters,
  onToggleFilters,
  academicDatabasesCount,
  alternativeSourcesCount,
  socialPlatformsCount,
}: SearchBarProps) {
  // ============================================================================
  // State & Refs
  // ============================================================================

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
  } = useLiteratureSearchStore();

  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // AI Suggestions Effect (Debounced)
  // ============================================================================

  useEffect(() => {
    // Clear previous timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    // Only fetch suggestions if query is at least 3 characters
    if (query && query.trim().length >= MIN_QUERY_LENGTH) {
      setLoadingSuggestions(true);

      suggestionTimerRef.current = setTimeout(async () => {
        try {
          logger.debug('[SearchBar] Fetching AI suggestions', { query });

          const result = await QueryExpansionAPI.expandQuery(query, 'general');

          logger.debug('[SearchBar] AI suggestions received', {
            expanded: result.expanded,
            suggestionCount: result.suggestions.length,
          });

          // Set the expanded query as first suggestion, followed by top 3 alternatives
          setAISuggestions([result.expanded, ...result.suggestions.slice(0, 3)]);
          setShowSuggestions(true);
        } catch (error) {
          logger.error('[SearchBar] Failed to fetch AI suggestions', error);
          // Silently fail - don't disrupt user experience
          setAISuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      // Clear suggestions if query is too short
      setAISuggestions([]);
      setLoadingSuggestions(false);
    }

    // Cleanup on unmount
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [query, setAISuggestions, setLoadingSuggestions, setShowSuggestions]);

  // ============================================================================
  // Click Outside Handler (Close Suggestions)
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowSuggestions]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setShowSuggestions(true); // Show suggestions when user starts typing

      // Clear query correction message when user types
      if (queryCorrectionMessage) {
        setQueryCorrection(null);
      }
    },
    [setQuery, setShowSuggestions, queryCorrectionMessage, setQueryCorrection]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        logger.debug('[SearchBar] Enter pressed - executing search');
        setShowSuggestions(false);
        onSearch();
      } else if (e.key === 'Escape') {
        logger.debug('[SearchBar] Escape pressed - closing suggestions');
        setShowSuggestions(false);
      }
    },
    [onSearch, setShowSuggestions]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      logger.debug('[SearchBar] Suggestion selected', { suggestion });
      setQuery(suggestion);
      setShowSuggestions(false);
      setQueryCorrection(null); // Clear any previous query correction
    },
    [setQuery, setShowSuggestions, setQueryCorrection]
  );

  const handleFocus = useCallback(() => {
    if (aiSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [aiSuggestions.length, setShowSuggestions]);

  // ============================================================================
  // Derived State
  // ============================================================================

  const totalActiveSources =
    academicDatabasesCount + alternativeSourcesCount + socialPlatformsCount;

  const hasNoSources = totalActiveSources === 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Search Input with AI Suggestions */}
      <div className="flex gap-2">
        <div ref={searchContainerRef} className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <Input
            placeholder="Search across academic databases, alternative sources, and social media..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            className="pl-14 pr-4 h-14 text-lg border-2 focus:border-blue-500"
            aria-label="Search query"
          />

          {/* AI-Powered Inline Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (aiSuggestions.length > 0 || loadingSuggestions) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    AI-Refined Questions (GPT-4)
                  </span>
                  {loadingSuggestions && (
                    <Loader2 className="w-3 h-3 animate-spin text-purple-600 ml-auto" />
                  )}
                </div>

                {loadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Generating refined queries...
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant="outline"
                            className="mt-0.5 bg-purple-100 text-purple-700 border-purple-300 flex-shrink-0"
                          >
                            {index === 0 ? '✨ Best' : `${index + 1}`}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 group-hover:text-purple-900 font-medium break-words">
                              {suggestion}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 text-center">
                  Press{' '}
                  <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">
                    Enter
                  </kbd>{' '}
                  to search •{' '}
                  <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">
                    Esc
                  </kbd>{' '}
                  to close
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          disabled={isLoading}
          className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search All Sources
            </>
          )}
        </Button>

        {/* Filters Button */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="h-14 px-6 border-2 relative"
        >
          <Filter className="w-5 h-5 mr-2" />
          Filters
          {appliedFilterCount > 0 && (
            <Badge className="ml-2 bg-purple-600 text-white">
              {appliedFilterCount}
            </Badge>
          )}
          {showFilters ? (
            <X className="w-4 h-4 ml-2" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-2" />
          )}
        </Button>
      </div>

      {/* Active Sources Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Active sources:</span>
        {academicDatabasesCount > 0 && (
          <Badge variant="outline" className="bg-blue-50">
            {academicDatabasesCount} Academic
          </Badge>
        )}
        {alternativeSourcesCount > 0 && (
          <Badge variant="outline" className="bg-indigo-50">
            {alternativeSourcesCount} Alternative
          </Badge>
        )}
        {socialPlatformsCount > 0 && (
          <Badge variant="outline" className="bg-purple-50">
            {socialPlatformsCount} Social Media
          </Badge>
        )}
        {hasNoSources && (
          <span className="text-orange-600">
            ⚠️ No sources selected - please select sources below
          </span>
        )}
      </div>
    </div>
  );
});
