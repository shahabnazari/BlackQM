/**
 * ActiveFiltersChips Component
 * Extracted from literature page (Week 1 Day 1-2)
 * Displays active filters as removable chips/badges
 * Phase 10 Day 31 - Enterprise Refactoring
 */

'use client';

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Component Implementation
// ============================================================================

export const ActiveFiltersChips = memo(function ActiveFiltersChips() {
  // ============================================================================
  // State from Zustand Store
  // ============================================================================

  const {
    appliedFilters,
    getAppliedFilterCount,
    setFilters,
    removeFilterProperty,
    resetFilters,
  } = useLiteratureSearchStore();

  const appliedFilterCount = getAppliedFilterCount();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRemoveYearFrom = () => {
    logger.debug('[ActiveFiltersChips] Removing yearFrom filter');
    setFilters({ yearFrom: 2020 }); // Reset to default
  };

  const handleRemoveYearTo = () => {
    logger.debug('[ActiveFiltersChips] Removing yearTo filter');
    setFilters({ yearTo: new Date().getFullYear() }); // Reset to default
  };

  const handleRemoveMinCitations = () => {
    logger.debug('[ActiveFiltersChips] Removing minCitations filter');
    removeFilterProperty('minCitations');
  };

  const handleRemovePublicationType = () => {
    logger.debug('[ActiveFiltersChips] Removing publicationType filter');
    setFilters({ publicationType: 'all' });
  };

  const handleRemoveSortBy = () => {
    logger.debug('[ActiveFiltersChips] Removing sortBy filter');
    setFilters({ sortBy: 'relevance' });
  };

  const handleRemoveAuthor = () => {
    logger.debug('[ActiveFiltersChips] Removing author filter');
    setFilters({ author: '' });
  };

  const handleClearAllFilters = () => {
    logger.info('[ActiveFiltersChips] Clearing all filters');
    resetFilters();
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Don't render if no filters are applied
  if (appliedFilterCount === 0) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const defaultYearFrom = 2020;
  const defaultYearTo = currentYear;

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-sm font-medium text-gray-700">Active filters:</span>

      {/* Year From Filter */}
      {appliedFilters.yearFrom !== defaultYearFrom && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemoveYearFrom}
        >
          Year from: {appliedFilters.yearFrom}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Year To Filter */}
      {appliedFilters.yearTo !== defaultYearTo && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemoveYearTo}
        >
          Year to: {appliedFilters.yearTo}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Min Citations Filter */}
      {appliedFilters.minCitations && appliedFilters.minCitations > 0 && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemoveMinCitations}
        >
          Min citations: {appliedFilters.minCitations}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Publication Type Filter */}
      {appliedFilters.publicationType !== 'all' && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemovePublicationType}
        >
          Type:{' '}
          {appliedFilters.publicationType === 'journal'
            ? 'Journal'
            : appliedFilters.publicationType === 'conference'
              ? 'Conference'
              : 'Preprint'}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Sort By Filter */}
      {appliedFilters.sortBy !== 'relevance' && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemoveSortBy}
        >
          Sort:{' '}
          {appliedFilters.sortBy === 'citations'
            ? 'Citations'
            : appliedFilters.sortBy === 'date'
              ? 'Date'
              : appliedFilters.sortBy === 'citations_per_year'
                ? 'Citations/Year'
                : appliedFilters.sortBy === 'quality_score'
                  ? 'Quality'
                  : appliedFilters.sortBy === 'word_count'
                    ? 'Word Count'
                    : 'Relevance'}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Author Filter */}
      {appliedFilters.author && appliedFilters.author.trim().length > 0 && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
          onClick={handleRemoveAuthor}
        >
          Author: {appliedFilters.author}
          <X className="w-3 h-3" />
        </Badge>
      )}

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearAllFilters}
        className="text-xs h-6 text-gray-600 hover:text-gray-900"
      >
        Clear all filters
      </Button>
    </div>
  );
});
