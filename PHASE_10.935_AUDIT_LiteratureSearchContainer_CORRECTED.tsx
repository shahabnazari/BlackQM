/**
 * Literature Search Container - CORRECTED VERSION
 * Phase 10.935 Day 0.5: Strict Audit Mode Corrections
 *
 * CHANGES FROM ORIGINAL:
 * 1. Line 231-234: Fixed logger.info parameter order (message first, context second)
 * 2. Line 268-271: Removed unnecessary useMemo for boolean OR operation
 *
 * IMPORTANT: This is the CORRECTED version with bugs fixed.
 * DO NOT use this file yet - it will be applied in Phase 10.935 Day 1.
 */

'use client';

import React, { useCallback } from 'react'; // Removed useMemo from import
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SearchBar,
  FilterPanel,
  ActiveFiltersChips,
} from '../components/SearchSection';
import { ProgressiveLoadingIndicator } from '@/components/literature/ProgressiveLoadingIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useProgressiveSearch } from '@/lib/hooks/useProgressiveSearch';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const STYLES = {
  CARD: 'border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50',
  CARD_CONTENT: 'p-6',
  HEADER_CONTAINER: 'flex items-center gap-2 mb-4',
  ICON: 'w-5 h-5 text-blue-600',
  HEADING: 'font-semibold text-gray-900',
  BADGE: 'bg-blue-100 text-blue-700',
} as const;

const A11Y = {
  SEARCH_REGION: 'Literature search controls',
  BADGE_TEXT: 'Searches all selected sources below',
} as const;

// ============================================================================
// Component Props
// ============================================================================

export interface LiteratureSearchContainerProps {
  /** Loading state for alternative sources */
  loadingAlternative: boolean;

  /** Loading state for social media sources */
  loadingSocial: boolean;

  /** Handler for search execution */
  onSearch: () => Promise<void>;

  /** Number of academic databases selected */
  academicDatabasesCount: number;

  /** Number of alternative sources selected */
  alternativeSourcesCount: number;

  /** Number of social platforms selected */
  socialPlatformsCount: number;
}

// ============================================================================
// Error Fallback Component
// ============================================================================

const SearchErrorFallback: React.FC = (): JSX.Element => (
  <Card className={STYLES.CARD} data-testid="search-error-fallback">
    <CardContent className={STYLES.CARD_CONTENT}>
      <div className="text-center py-8">
        <p className="text-red-600 font-semibold mb-2">
          Search functionality temporarily unavailable
        </p>
        <p className="text-gray-600 text-sm">
          Please refresh the page to restore search functionality.
        </p>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Main Component
// ============================================================================

export const LiteratureSearchContainer = React.memo<LiteratureSearchContainerProps>(
  function LiteratureSearchContainer({
    loadingAlternative,
    loadingSocial,
    onSearch,
    academicDatabasesCount,
    alternativeSourcesCount,
    socialPlatformsCount,
  }): JSX.Element {
    // ==========================================================================
    // STORE STATE
    // ==========================================================================

    const {
      showFilters,
      toggleShowFilters,
      getAppliedFilterCount,
      progressiveLoading,
    } = useLiteratureSearchStore();

    // ==========================================================================
    // HOOKS
    // ==========================================================================

    const { cancelProgressiveSearch, isSearching } = useProgressiveSearch();

    // ==========================================================================
    // MEMOIZED HANDLERS
    // ==========================================================================

    /**
     * Handle progressive search cancellation
     * Memoized to prevent unnecessary re-renders of ProgressiveLoadingIndicator
     *
     * ✅ CORRECTED: Fixed logger parameter order
     * @callback
     * @memoized
     */
    const handleCancelProgressiveSearch = useCallback((): void => {
      // ✅ FIX: Correct parameter order (message, context)
      logger.info(
        'User cancelled progressive search',
        'LiteratureSearchContainer'
      );
      cancelProgressiveSearch();
    }, [cancelProgressiveSearch]);

    // ==========================================================================
    // COMPUTED VALUES
    // ==========================================================================

    /**
     * Applied filter count from Zustand store
     *
     * Note: NOT memoized because Zustand handles state updates efficiently.
     * Component re-renders when store changes (Zustand subscription),
     * so calling getAppliedFilterCount() directly always gets fresh value.
     *
     * Previous implementation with useMemo([getAppliedFilterCount]) was WRONG:
     * - Function reference never changes (stable from Zustand)
     * - useMemo cached FIRST value forever
     * - Filter count never updated in UI
     *
     * @computed
     */
    const appliedFilterCount = getAppliedFilterCount();

    /**
     * Combined loading state from all sources
     *
     * ✅ CORRECTED: Removed unnecessary useMemo
     *
     * Rationale:
     * - Boolean OR operation is < 1 nanosecond (extremely cheap)
     * - useMemo overhead (dependency checks, cache lookup) > computation cost
     * - Premature optimization that adds complexity without benefit
     *
     * Previous comment claimed "prevents creating new reference" but this is
     * incorrect - boolean primitives are NOT passed by reference.
     *
     * @computed
     */
    const isLoading = loadingAlternative || loadingSocial || isSearching;

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
      <ErrorBoundary fallback={<SearchErrorFallback />}>
        <Card
          className={STYLES.CARD}
          data-testid="literature-search-container"
          role="region"
          aria-label={A11Y.SEARCH_REGION}
        >
          <CardContent className={STYLES.CARD_CONTENT}>
            {/* Header */}
            <div className={STYLES.HEADER_CONTAINER}>
              <Search className={STYLES.ICON} aria-hidden="true" />
              <h3 className={STYLES.HEADING}>Universal Search</h3>
              <Badge variant="secondary" className={STYLES.BADGE}>
                {A11Y.BADGE_TEXT}
              </Badge>
            </div>

            {/* Search Bar Component */}
            <SearchBar
              onSearch={onSearch}
              isLoading={isLoading}
              appliedFilterCount={appliedFilterCount}
              showFilters={showFilters}
              onToggleFilters={toggleShowFilters}
              academicDatabasesCount={academicDatabasesCount}
              alternativeSourcesCount={alternativeSourcesCount}
              socialPlatformsCount={socialPlatformsCount}
            />

            {/* Active Filters Chips */}
            <ActiveFiltersChips />

            {/* Filter Panel */}
            <FilterPanel isVisible={showFilters} />

            {/* Progressive Loading Indicator */}
            <ProgressiveLoadingIndicator
              state={progressiveLoading}
              onCancel={handleCancelProgressiveSearch}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>
    );
  }
);

LiteratureSearchContainer.displayName = 'LiteratureSearchContainer';
