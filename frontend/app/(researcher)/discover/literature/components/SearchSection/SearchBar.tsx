/**
 * SearchBar Component
 * Extracted from literature page (Week 1 Day 1-2)
 * Handles search input, AI suggestions, and query correction
 * Phase 10 Day 31 - Enterprise Refactoring
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
  Info,
  CheckCircle2,
  FileSearch,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import { logger } from '@/lib/utils/logger';
import { MethodologyModal } from '@/components/literature/MethodologyModal';

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

  // 🔧 FIX: Hydration - Only render dynamic badges after client mount
  const [isMounted, setIsMounted] = React.useState(false);

  // Phase 10.942 Day 4: Methodology Modal state
  const [showMethodologyModal, setShowMethodologyModal] = React.useState(false);

  // Phase 10.7.10: Search quality standards panel
  const [showQualityStandards, setShowQualityStandards] = React.useState(false);

  // AI Suggestions error state
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      setSuggestionError(null); // Clear previous errors

      suggestionTimerRef.current = setTimeout(async () => {
        try {
          logger.debug('Fetching AI suggestions', 'SearchBar', { query });

          const result = await QueryExpansionAPI.expandQuery(query, 'general');

          logger.debug('AI suggestions received', 'SearchBar', {
            expanded: result.expanded,
            suggestionCount: result.suggestions.length,
          });

          // Set the expanded query as first suggestion, followed by top 3 alternatives
          setAISuggestions([
            result.expanded,
            ...result.suggestions.slice(0, 3),
          ]);
          setShowSuggestions(true);
          setSuggestionError(null);
        } catch (error: any) {
          logger.error('Failed to fetch AI suggestions', 'SearchBar', { error });
          
          // Parse error message
          const errorMessage = error?.message || error?.toString() || 'Unknown error';
          
          if (errorMessage.includes('AI_NOT_CONFIGURED')) {
            setSuggestionError('OpenAI API key not configured');
          } else if (errorMessage.includes('AI_SERVICE_ERROR')) {
            setSuggestionError('AI service temporarily unavailable');
          } else if (errorMessage.includes('timeout')) {
            setSuggestionError('Request timed out - try a shorter query');
          } else if (errorMessage.includes('Rate limit')) {
            setSuggestionError('Too many requests - please wait');
          } else {
            setSuggestionError('Failed to get AI suggestions');
          }
          
          setAISuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoadingSuggestions(false);
        }
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      // Clear suggestions if query is too short
      setAISuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
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
        // PHASE 10.942 DAY 1 AUDIT FIX: Prevent empty query search
        if (!query.trim()) {
          logger.debug('Enter pressed but query empty - ignoring', 'SearchBar');
          return;
        }
        logger.debug('Enter pressed - executing search', 'SearchBar');
        setShowSuggestions(false);
        onSearch();
      } else if (e.key === 'Escape') {
        logger.debug('Escape pressed - closing suggestions', 'SearchBar');
        setShowSuggestions(false);
      }
    },
    [onSearch, setShowSuggestions, query]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      logger.debug('Suggestion selected', 'SearchBar', { suggestion });
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
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            className="pl-14 pr-4 h-14 text-lg border-2 focus:border-blue-500"
            aria-label="Search query"
            // PHASE 10.942 DAY 1 AUDIT FIX: Prevent extremely long queries
            maxLength={500}
          />

          {/* AI-Powered Inline Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions &&
              (aiSuggestions.length > 0 || loadingSuggestions || suggestionError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">
                      AI-Suggested Searches
                    </span>
                    {loadingSuggestions && (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600 ml-auto" />
                    )}
                  </div>

                  {/* Error State */}
                  {suggestionError && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">
                            AI Suggestions Unavailable
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            {suggestionError}
                          </p>
                          {suggestionError.includes('API key') && (
                            <p className="text-xs text-red-600 mt-2 bg-red-100 border border-red-300 rounded p-2">
                              💡 <strong>For Developers:</strong> Set OPENAI_API_KEY in backend/.env
                              <br />
                              Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a> to get your key
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingSuggestions && !suggestionError && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Generating refined queries...
                    </div>
                  )}

                  {/* Suggestions List */}
                  {!loadingSuggestions && !suggestionError && aiSuggestions.length > 0 && (
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
          onClick={() => {
            logger.debug('Search button clicked', 'SearchBar');
            onSearch();
          }}
          // PHASE 10.942 DAY 1 AUDIT FIX: Disable when empty or loading
          disabled={isLoading || !query.trim()}
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
          {isMounted && appliedFilterCount > 0 && (
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
        {isMounted && academicDatabasesCount > 0 && (
          <Badge variant="outline" className="bg-blue-50">
            {academicDatabasesCount} Academic
          </Badge>
        )}
        {isMounted && alternativeSourcesCount > 0 && (
          <Badge variant="outline" className="bg-indigo-50">
            {alternativeSourcesCount} Alternative
          </Badge>
        )}
        {isMounted && socialPlatformsCount > 0 && (
          <Badge variant="outline" className="bg-purple-50">
            {socialPlatformsCount} Social Media
          </Badge>
        )}
        {isMounted && hasNoSources && (
          <span className="text-orange-600">
            ⚠️ No sources selected - please select sources below
          </span>
        )}
      </div>

      {/* Phase 10.7.10: Search Quality Standards Panel */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50/30 to-purple-50/30">
        <button
          type="button"
          onClick={() => setShowQualityStandards(!showQualityStandards)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
          aria-expanded={showQualityStandards}
          aria-controls="quality-standards-panel"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              Search Quality Standards & Transparency
            </span>
            <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-300">
              2-Stage Filtering
            </Badge>
          </div>
          {showQualityStandards ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <AnimatePresence>
          {showQualityStandards && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div id="quality-standards-panel" className="px-4 pb-4 space-y-4 bg-white/50">
                {/* Quality-First Approach */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Quality-First Paper Selection
                  </div>
                  <div className="ml-6 space-y-1.5 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>
                        <strong>Source-Level Eligibility:</strong> Papers with 150+ words marked as eligible
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>
                        <strong>Quality Scoring:</strong> All papers scored using v4.0 methodology (30/50/20)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">ℹ️</span>
                      <span className="text-xs text-gray-600">
                        Results sorted by quality score and relevance; low-quality papers ranked lower
                      </span>
                    </div>
                  </div>
                </div>

                {/* Two-Stage Process */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Stage 1 */}
                  <div className="border border-blue-200 rounded-lg p-3 bg-gradient-to-br from-blue-50/50 to-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSearch className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-blue-900">
                        Stage 1: Collection (0-50%)
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">→</span>
                        <span>Search sources in priority tiers (premium → free)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">→</span>
                        <span>Collect papers from each database API</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">→</span>
                        <span>Mark paper eligibility (150+ words)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">→</span>
                        <span>Aggregate results from all sources</span>
                      </li>
                    </ul>
                  </div>

                  {/* Stage 2 */}
                  <div className="border border-purple-200 rounded-lg p-3 bg-gradient-to-br from-purple-50/50 to-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-sm text-purple-900">
                        Stage 2: Processing (50-100%)
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      <li className="flex items-start gap-1.5">
                        <span className="text-purple-600 mt-0.5">→</span>
                        <span>Remove duplicates (DOI/title matching)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-purple-600 mt-0.5">→</span>
                        <span>Enrich with OpenAlex (citations, metrics)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-purple-600 mt-0.5">→</span>
                        <span>Calculate quality scores (30/50/20)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-purple-600 mt-0.5">→</span>
                        <span>Score relevance (BM25) + sort results</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Phase 10.942: v4.0 Quality Scoring Methodology */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      v4.0 Quality Scoring (Science-Backed)
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      BM25 + FWCI
                    </Badge>
                  </div>

                  {/* Core Quality Weights */}
                  <div className="ml-6 space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Core Quality Weights (100%)
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-blue-700">30%</div>
                        <div className="text-xs text-blue-600">Citation Impact</div>
                        <div className="text-[10px] text-gray-500">FWCI normalized</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-700">50%</div>
                        <div className="text-xs text-green-600">Journal Prestige</div>
                        <div className="text-[10px] text-gray-500">IF, h-index, quartile</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-orange-700">20%</div>
                        <div className="text-xs text-orange-600">Recency Boost</div>
                        <div className="text-[10px] text-gray-500">4.6yr half-life</div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Bonuses */}
                  <div className="ml-6 space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Optional Bonuses (up to +20)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                        +10 Open Access
                      </Badge>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
                        +5 Data/Code Shared
                      </Badge>
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-300">
                        +5 Altmetric Impact
                      </Badge>
                    </div>
                  </div>

                  {/* Relevance Algorithm */}
                  <div className="ml-6 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-700">Relevance Algorithm:</span>
                      <span className="text-gray-600">BM25 (Robertson & Walker, 1994)</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">Gold standard for PubMed, Elasticsearch</span>
                    </div>
                  </div>

                  {/* View Full Methodology Button */}
                  <div className="ml-6 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMethodologyModal(true)}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <FileText className="w-3 h-3 mr-1.5" />
                      View Full Methodology & Download PDF
                    </Button>
                  </div>
                </div>

                {/* Final Note */}
                <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Full transparency: Search results show papers collected (Stage 1),
                    duplicates removed, and final papers after quality scoring (Stage 2).
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase 10.942 Day 4: Methodology Modal */}
      <MethodologyModal
        open={showMethodologyModal}
        onClose={() => setShowMethodologyModal(false)}
      />
    </div>
  );
});
