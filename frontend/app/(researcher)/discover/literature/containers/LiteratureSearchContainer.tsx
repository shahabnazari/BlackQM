/**
 * Literature Search Container
 * Phase 10.935 Day 1 + Day 11-13: Self-Contained Container Refactoring (ENTERPRISE-GRADE)
 *
 * **Purpose:**
 * Centralized, self-contained container for literature search functionality.
 * Orchestrates search UI components and business logic WITHOUT requiring props.
 *
 * **Responsibilities:**
 * - Search state management via Zustand stores
 * - Progressive search coordination
 * - Filter management
 * - Search execution and result handling
 * - Source selection coordination (academic, alternative, social)
 *
 * **Architecture Pattern:**
 * Self-Contained Container Component (Phase 10.935 Pattern)
 * - ZERO props required (fully self-contained)
 * - Gets ALL data from Zustand stores
 * - Uses hooks for API interactions
 * - Composes presentational components
 * - Minimal UI logic
 *
 * **Sub-Components:**
 * - SearchBar: Universal search input with mode selection
 * - FilterPanel: Advanced filter controls
 * - ActiveFiltersChips: Applied filter chips display
 * - AcademicResourcesPanel: Database selection & institutional auth (Phase 10.935 Day 11)
 * - AlternativeSourcesPanel: Alternative sources selection (Phase 10.935 Day 12)
 * - SocialMediaPanel: Social media platform selection (Phase 10.935 Day 13)
 * - ProgressiveLoadingIndicator: Real-time search progress
 *
 * **State Management:**
 * - useLiteratureSearchStore: Search state, filters, papers, academic databases
 * - useAlternativeSourcesStore: Alternative sources selection and loading
 * - useSocialMediaStore: Social media platforms and loading
 * - useLiteratureSearch: Search execution hook
 * - useProgressiveSearch: Progressive loading hook
 *
 * **Performance Optimizations:**
 * - ✅ React.memo() - Prevents unnecessary re-renders
 * - ✅ useCallback() - Memoizes event handlers
 * - ✅ useMemo() - Memoizes expensive computations
 * - ✅ ErrorBoundary - Graceful error handling
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode
 * - ✅ Explicit return types
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Configuration constants
 * - ✅ Comprehensive error handling
 * - ✅ Defensive programming
 * - ✅ Accessibility (ARIA, semantic HTML)
 * - ✅ Performance optimization
 * - ✅ Self-contained (zero props)
 *
 * @module LiteratureSearchContainer
 * @since Phase 10.935 Day 1
 * @author VQMethod Team
 *
 * @example
 * ```tsx
 * // No props needed!
 * <LiteratureSearchContainer />
 * ```
 */

'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SearchBar,
  FilterPanel,
  ActiveFiltersChips,
} from '../components/SearchSection';
import { ProgressiveLoadingIndicator } from '@/components/literature/ProgressiveLoadingIndicator';
// Phase 10.113 Week 10: WebSocket streaming section
import { StreamingSearchSection, type StreamingSearchSectionHandle } from './StreamingSearchSection';
import { AcademicResourcesPanel } from '../components/AcademicResourcesPanel';
import { AlternativeSourcesPanel } from '../components/AlternativeSourcesPanel';
import { SocialMediaPanel } from '../components/SocialMediaPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useAlternativeSourcesStore } from '@/lib/stores/alternative-sources.store';
import { useSocialMediaStore } from '@/lib/stores/social-media.store';
import { useProgressiveSearch } from '@/lib/hooks/useProgressiveSearch';
import { useLiteratureSearch } from '@/lib/hooks/useLiteratureSearch';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Constants
// ============================================================================

/**
 * Styling constants for consistent theming
 * Extracted for maintainability and reusability
 */
const STYLES = {
  CARD: 'border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50',
  CARD_CONTENT: 'p-6',
  HEADER_CONTAINER: 'flex items-center gap-2 mb-4',
  ICON: 'w-5 h-5 text-blue-600',
  HEADING: 'font-semibold text-gray-900',
  BADGE: 'bg-blue-100 text-blue-700',
} as const;

/**
 * Accessibility labels
 */
const A11Y = {
  SEARCH_REGION: 'Literature search controls',
  BADGE_TEXT: 'Searches all selected sources below',
} as const;

// ============================================================================
// Component Props
// ============================================================================

/**
 * LiteratureSearchContainer has NO PROPS - fully self-contained
 *
 * Phase 10.935 Day 1: Containers are self-contained and get all data from stores.
 * This eliminates prop drilling and makes the container truly independent.
 *
 * All data comes from:
 * - useLiteratureSearchStore() - search state, filters, academic databases
 * - useAlternativeSourcesStore() - alternative sources and loading state
 * - useSocialMediaStore() - social platforms and loading state
 * - useLiteratureSearch() - search execution handler
 * - useProgressiveSearch() - progressive search operations
 */

// ============================================================================
// Error Fallback Component
// ============================================================================

/**
 * Fallback UI displayed when container encounters an error
 *
 * @returns {JSX.Element} Error fallback UI
 */
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

/**
 * LiteratureSearchContainer Component
 *
 * Enterprise-grade, self-contained container for literature search functionality.
 * Implements React performance optimizations and error handling.
 *
 * **Phase 10.935 Day 1:** Self-Contained Container Pattern
 * - ZERO props required
 * - All data from Zustand stores
 * - All handlers from hooks
 * - Fully independent and reusable
 *
 * **Performance:**
 * - Wrapped with React.memo() to prevent unnecessary re-renders
 * - Uses useCallback() for event handlers
 * - Uses useMemo() for expensive computed values
 * - Zustand subscriptions handle state updates efficiently
 *
 * **Error Handling:**
 * - Wrapped with ErrorBoundary for graceful degradation
 * - Logs errors to enterprise logger
 *
 * @component
 * @memoized
 * @returns {JSX.Element} Rendered container
 */
export const LiteratureSearchContainer = React.memo(
  function LiteratureSearchContainer(): JSX.Element {
    // ==========================================================================
    // STORE STATE
    // ==========================================================================

    // Literature search store
    const {
      showFilters,
      toggleShowFilters,
      getAppliedFilterCount,
      progressiveLoading,
      academicDatabases,
    } = useLiteratureSearchStore();

    // Alternative sources store
    const {
      loading: loadingAlternative,
      sources: alternativeSources,
    } = useAlternativeSourcesStore();

    // Social media store
    const {
      loading: socialLoadingMap,
      platformConfigs,
      getEnabledPlatforms,
    } = useSocialMediaStore();

    // ==========================================================================
    // HOOKS
    // ==========================================================================

    const { cancelProgressiveSearch, isSearching } = useProgressiveSearch();
    const { handleSearch } = useLiteratureSearch();

    // ==========================================================================
    // REFS
    // ==========================================================================

    /**
     * Ref to StreamingSearchSection for WebSocket-first search
     * Phase 10.113 Week 10: WebSocket streaming integration
     */
    const streamingRef = useRef<StreamingSearchSectionHandle>(null);

    // ==========================================================================
    // MEMOIZED HANDLERS
    // ==========================================================================

    /**
     * Handle progressive search cancellation
     * Memoized to prevent unnecessary re-renders of ProgressiveLoadingIndicator
     *
     * @callback
     * @memoized
     */
    const handleCancelProgressiveSearch = useCallback((): void => {
      logger.info(
        'User cancelled progressive search',
        'LiteratureSearchContainer'
      );
      cancelProgressiveSearch();
    }, [cancelProgressiveSearch]);

    /**
     * Handle search with WebSocket-first strategy
     * Phase 10.113 Week 10: Try WebSocket streaming first, fall back to HTTP
     *
     * @callback
     * @memoized
     */
    const handleSearchWithStreaming = useCallback(async (): Promise<void> => {
      // Try WebSocket streaming first if available
      if (streamingRef.current?.isConnected) {
        logger.info('Triggering WebSocket streaming search', 'LiteratureSearchContainer');
        await streamingRef.current.triggerSearch();
      } else {
        // Fall back to HTTP search
        logger.info('WebSocket not available, using HTTP search', 'LiteratureSearchContainer');
        await handleSearch();
      }
    }, [handleSearch]);

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
     * Source counts computed locally from store data
     *
     * Phase 10.935 Day 1: Computed locally instead of passed as props
     *
     * For social media: Count only ENABLED platforms (not all platforms)
     * using the store's getEnabledPlatforms() selector.
     *
     * @computed
     * @memoized
     */
    const academicDatabasesCount = academicDatabases.length;
    const alternativeSourcesCount = alternativeSources.length;

    const socialPlatformsCount = useMemo(() => {
      // Use store selector to get only enabled platforms
      const enabledPlatforms = getEnabledPlatforms();
      return enabledPlatforms.length;
    }, [getEnabledPlatforms, platformConfigs]);

    /**
     * Check if ANY social media platform is loading
     *
     * Social media store uses Map<Platform, boolean> for loading state.
     * We need to check if any platform is currently loading.
     *
     * Defensive Programming: Handle case where Map might be corrupted
     * by persistence (Maps don't serialize to JSON correctly).
     *
     * @computed
     * @memoized
     */
    const loadingSocial = useMemo(() => {
      // Defensive: Check if it's actually a Map instance
      if (!(socialLoadingMap instanceof Map)) {
        logger.warn(
          'Social loading state is not a Map, returning false',
          'LiteratureSearchContainer',
          { received: typeof socialLoadingMap }
        );
        return false;
      }

      // Check if any platform is loading
      const loadingValues = Array.from(socialLoadingMap.values());
      return loadingValues.some((isLoading) => isLoading === true);
    }, [socialLoadingMap]);

    /**
     * Combined loading state from all sources
     *
     * Memoized to prevent SearchBar re-render when only other props change.
     * Boolean calculation is cheap, but memoization prevents creating new
     * reference for memoized child components.
     *
     * @computed
     * @memoized
     */
    const isLoading = useMemo(
      () => loadingAlternative || loadingSocial || isSearching,
      [loadingAlternative, loadingSocial, isSearching]
    );

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
              onSearch={handleSearchWithStreaming}
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

            {/* Phase 10.113 Week 10: WebSocket Streaming Section */}
            <div className="mt-4">
              <StreamingSearchSection ref={streamingRef} onHttpSearch={handleSearch} />
            </div>

            {/* Filter Panel */}
            <FilterPanel isVisible={showFilters} />

            {/* Academic Resources Panel - Phase 10.935 Day 11 Integration */}
            <div className="mt-6">
              <AcademicResourcesPanel />
            </div>

            {/* Alternative Sources Panel - Phase 10.935 Day 12 Integration */}
            <div className="mt-6">
              <AlternativeSourcesPanel />
            </div>

            {/* Social Media Panel - Phase 10.935 Day 13 Integration */}
            <div className="mt-6">
              <SocialMediaPanel />
            </div>

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

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

LiteratureSearchContainer.displayName = 'LiteratureSearchContainer';
