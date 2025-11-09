/**
 * Loading Skeleton Components
 * Skeleton loaders for literature search components
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module LoadingSkeletons
 */

'use client';

import React from 'react';

// ============================================================================
// Result Card Skeleton
// ============================================================================

export const ResultCardSkeleton = React.memo(function ResultCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Checkbox skeleton */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-5 h-5 bg-gray-200 rounded" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded w-3/4" />

          {/* Metadata */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>

          {/* Badges */}
          <div className="flex items-center space-x-2">
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Search Bar Skeleton
// ============================================================================

export const SearchBarSkeleton = React.memo(function SearchBarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg" />
    </div>
  );
});

// ============================================================================
// Database Selector Skeleton
// ============================================================================

export const DatabaseSelectorSkeleton = React.memo(
  function DatabaseSelectorSkeleton() {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }
);

// ============================================================================
// Filters Skeleton
// ============================================================================

export const FiltersSkeleton = React.memo(function FiltersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-6 bg-gray-200 rounded w-32" />

      {/* Filter sections */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      ))}

      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        <div className="flex-1 h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
});

// ============================================================================
// Pagination Skeleton
// ============================================================================

export const PaginationSkeleton = React.memo(function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-48" />
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Full Page Loading Skeleton
// ============================================================================

export const LiteraturePageSkeleton = React.memo(
  function LiteraturePageSkeleton() {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search bar */}
        <SearchBarSkeleton />

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            <DatabaseSelectorSkeleton />
            <FiltersSkeleton />
          </div>

          {/* Results */}
          <div className="col-span-9 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <ResultCardSkeleton key={i} />
            ))}
            <PaginationSkeleton />
          </div>
        </div>
      </div>
    );
  }
);

export default {
  ResultCardSkeleton,
  SearchBarSkeleton,
  DatabaseSelectorSkeleton,
  FiltersSkeleton,
  PaginationSkeleton,
  LiteraturePageSkeleton,
};
