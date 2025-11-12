/**
 * SearchResultsDisplay Component
 * Extracted from literature page (Week 1 Day 1-2)
 * Handles search results layout, query display, quality legend, and paper list
 * Phase 10 Day 31 - Enterprise Refactoring
 */

'use client';

import React, { memo, ReactNode } from 'react';
import { Search, Loader2, BookOpen, Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Component Props
// ============================================================================

interface SearchResultsDisplayProps {
  /** Array of papers to display */
  papers: Paper[];
  /** Loading state */
  loading: boolean;
  /** Total number of results found */
  totalResults: number;
  /** Custom render function for each paper */
  renderPaper: (paper: Paper) => ReactNode;
  /** Handler for sort change */
  onSortChange: (sortBy: string) => void;
}

// ============================================================================
// Quality Score Legend Component
// ============================================================================

const QualityScoreLegend = memo(function QualityScoreLegend() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">
            Quality Score Legend (Enterprise Research-Grade) |
            <span className="text-green-600 ml-1">
              🟢 = Full-text available for Excellent+ papers
            </span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span className="text-green-700 font-medium">70-100</span>
              <span className="text-gray-600">Excellent/Exceptional</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-blue-700 font-medium">50-69</span>
              <span className="text-gray-600">Good/V.Good</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span className="text-amber-700 font-medium">40-49</span>
              <span className="text-gray-600">Acceptable</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-600 font-medium">30-39</span>
              <span className="text-gray-600">Fair</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span className="text-gray-700 font-medium">&lt;30</span>
              <span className="text-gray-600">Limited</span>
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span className="text-gray-600">= Citations/Year</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Query Display Banner Component
// ============================================================================

interface QueryDisplayBannerProps {
  query: string;
  queryCorrectionMessage: { original: string; corrected: string } | null;
  totalResults: number;
  appliedSortBy: string;
  onSortChange: (sortBy: string) => void;
}

const QueryDisplayBanner = memo(function QueryDisplayBanner({
  query,
  queryCorrectionMessage,
  totalResults,
  appliedSortBy,
  onSortChange,
}: QueryDisplayBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Search className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-blue-900 mb-1">
            Search Query Used
          </p>
          <p className="text-lg font-semibold text-gray-900 break-words">
            {queryCorrectionMessage?.corrected || query}
          </p>
          {queryCorrectionMessage && (
            <p className="text-xs text-gray-600 mt-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                Auto-corrected from: "{queryCorrectionMessage.original}"
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant="outline" className="bg-white">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
          </Badge>
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <select
              value={appliedSortBy}
              onChange={e => {
                logger.debug('[QueryDisplayBanner] Sort changed', {
                  sortBy: e.target.value,
                });
                onSortChange(e.target.value);
              }}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Sort results"
            >
              <option value="relevance">Relevance</option>
              <option value="quality_score">Quality Score</option>
              <option value="citations_per_year">Citations/Year</option>
              <option value="citations">Citations (Total)</option>
              <option value="word_count">Word Count</option>
              <option value="date">Newest</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Query Correction Banner Component
// ============================================================================

interface QueryCorrectionBannerProps {
  original: string;
  corrected: string;
  onUseOriginal: () => void;
}

const QueryCorrectionBanner = memo(function QueryCorrectionBanner({
  original,
  corrected,
  onUseOriginal,
}: QueryCorrectionBannerProps) {
  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <AlertDescription className="text-sm">
        Showing results for <span className="font-semibold">{corrected}</span>
        <br />
        <span className="text-gray-600">
          Search instead for:{' '}
          <button
            className="text-blue-600 hover:underline"
            onClick={onUseOriginal}
          >
            {original}
          </button>
        </span>
      </AlertDescription>
    </Alert>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export const SearchResultsDisplay = memo(function SearchResultsDisplay({
  papers,
  loading,
  totalResults,
  renderPaper,
  onSortChange,
}: SearchResultsDisplayProps) {
  // ============================================================================
  // State from Zustand Store
  // ============================================================================

  const {
    query,
    queryCorrectionMessage,
    appliedFilters,
    setQuery,
    setQueryCorrection,
  } = useLiteratureSearchStore();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleUseOriginalQuery = () => {
    if (!queryCorrectionMessage) return;

    logger.debug('[SearchResultsDisplay] Using original query', {
      original: queryCorrectionMessage.original,
    });

    setQuery(queryCorrectionMessage.original);
    setQueryCorrection(null);

    // Trigger search with original query (delayed to allow state update)
    setTimeout(() => {
      logger.debug(
        '[SearchResultsDisplay] Triggering search with original query'
      );
      // Note: Actual search trigger should come from parent via callback
    }, 100);
  };

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ============================================================================
  // Render: Empty State
  // ============================================================================

  if (papers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No papers found. Try adjusting your search query or filters.</p>
      </div>
    );
  }

  // ============================================================================
  // Render: Results Display
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Query Correction Banner */}
      {queryCorrectionMessage && (
        <QueryCorrectionBanner
          original={queryCorrectionMessage.original}
          corrected={queryCorrectionMessage.corrected}
          onUseOriginal={handleUseOriginalQuery}
        />
      )}

      {/* Query Display Banner with Sort */}
      <QueryDisplayBanner
        query={query}
        queryCorrectionMessage={queryCorrectionMessage}
        totalResults={totalResults}
        appliedSortBy={appliedFilters.sortBy || 'relevance'}
        onSortChange={onSortChange}
      />

      {/* Quality Score Legend */}
      <QualityScoreLegend />

      {/* Papers List */}
      <div className="space-y-4">
        {papers.map(paper => (
          <React.Fragment key={paper.id}>{renderPaper(paper)}</React.Fragment>
        ))}
      </div>
    </div>
  );
});
