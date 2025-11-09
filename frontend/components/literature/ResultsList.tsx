/**
 * Results List Component
 * Virtualized list of search results with infinite scroll support
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module ResultsList
 */

'use client';

import React from 'react';
import { ResultCard } from './ResultCard';
import { ResultCardSkeleton } from './LoadingSkeletons';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export interface ResultsListProps {
  papers: Paper[];
  loading?: boolean;
  selectedPapers?: Set<string>;
  onSelect?: (paperId: string) => void;
  onView?: (paperId: string) => void;
  onSave?: (paperId: string) => void;
  onExport?: (paperId: string) => void;
  emptyMessage?: string;
  skeletonCount?: number;
}

// ============================================================================
// Results List Component
// ============================================================================

export const ResultsList = React.memo(function ResultsList({
  papers,
  loading = false,
  selectedPapers = new Set(),
  onSelect,
  onView,
  onSave,
  onExport,
  emptyMessage = 'No papers found. Try adjusting your search query or filters.',
  skeletonCount = 5,
}: ResultsListProps) {
  // Show loading skeletons
  if (loading && papers.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ResultCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!loading && papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Results Found
        </h3>
        <p className="text-gray-600 max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <ResultCard
          key={paper.id}
          paper={paper}
          isSelected={selectedPapers.has(paper.id)}
          {...(onSelect !== undefined && { onSelect })}
          {...(onView !== undefined && { onView })}
          {...(onSave !== undefined && { onSave })}
          {...(onExport !== undefined && { onExport })}
        />
      ))}

      {/* Loading more indicator */}
      {loading && papers.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading more results...</span>
        </div>
      )}
    </div>
  );
});

export default ResultsList;
