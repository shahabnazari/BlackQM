/**
 * Search Filters Component
 * Advanced filtering for literature search
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module SearchFilters
 */

'use client';

import React, { useCallback } from 'react';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import type { SearchFilters as Filters } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export interface SearchFiltersProps {
  onApply?: () => void;
  onReset?: () => void;
}

// ============================================================================
// Search Filters Component
// ============================================================================

export const SearchFilters = React.memo(function SearchFilters({
  onApply,
  onReset,
}: SearchFiltersProps) {
  const {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    getAppliedFilterCount,
  } = useLiteratureSearchStore();

  const appliedCount = getAppliedFilterCount();
  const currentYear = new Date().getFullYear();

  const handleYearFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        setFilters({ yearFrom: value });
      }
    },
    [setFilters]
  );

  const handleYearToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        setFilters({ yearTo: value });
      }
    },
    [setFilters]
  );

  const handleSortByChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as Filters['sortBy'];
      if (value !== undefined) {
        setFilters({ sortBy: value });
      }
    },
    [setFilters]
  );

  const handlePublicationTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as Filters['publicationType'];
      if (value !== undefined) {
        setFilters({ publicationType: value });
      }
    },
    [setFilters]
  );

  const handleAuthorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ author: e.target.value });
    },
    [setFilters]
  );

  const handleApply = useCallback(() => {
    applyFilters();
    if (onApply) {
      onApply();
    }
  }, [applyFilters, onApply]);

  const handleReset = useCallback(() => {
    resetFilters();
    if (onReset) {
      onReset();
    }
  }, [resetFilters, onReset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {appliedCount > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {appliedCount} active
          </span>
        )}
      </div>

      {/* Year Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Publication Year
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="number"
              value={filters.yearFrom || ''}
              onChange={handleYearFromChange}
              min={1900}
              max={currentYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="number"
              value={filters.yearTo || ''}
              onChange={handleYearToChange}
              min={1900}
              max={currentYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={currentYear.toString()}
            />
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label
          htmlFor="sort-by"
          className="block text-sm font-medium text-gray-700"
        >
          Sort By
        </label>
        <select
          id="sort-by"
          value={filters.sortBy}
          onChange={handleSortByChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="relevance">Relevance</option>
          <option value="date">Publication Date</option>
          <option value="citations">Citation Count</option>
        </select>
      </div>

      {/* Publication Type */}
      <div className="space-y-2">
        <label
          htmlFor="publication-type"
          className="block text-sm font-medium text-gray-700"
        >
          Publication Type
        </label>
        <select
          id="publication-type"
          value={filters.publicationType}
          onChange={handlePublicationTypeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="journal">Journal Article</option>
          <option value="conference">Conference Paper</option>
          <option value="preprint">Preprint</option>
          <option value="book">Book Chapter</option>
          <option value="thesis">Thesis</option>
        </select>
      </div>

      {/* Author Filter */}
      <div className="space-y-2">
        <label
          htmlFor="author"
          className="block text-sm font-medium text-gray-700"
        >
          Author
        </label>
        <input
          id="author"
          type="text"
          value={filters.author || ''}
          onChange={handleAuthorChange}
          placeholder="Search by author name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  );
});

export default SearchFilters;
