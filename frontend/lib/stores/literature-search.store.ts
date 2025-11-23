/**
 * Literature Search Zustand Store
 * Phase 10.91 Day 8 - Store Architecture Refactoring
 *
 * **Refactoring:** Reduced from 646 → 149 lines using helper slices
 * **Pattern:** Compose multiple slices using Zustand spread pattern
 *
 * Centralized state management for search functionality
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import type { SearchFilters } from '@/lib/types/literature.types';
import {
  createSearchStateSlice,
  createFilterSlice,
  createPresetSlice,
  createAISuggestionsSlice,
  createSelectionSlice,
  createProgressiveLoadingSlice,
  type SearchStateSlice,
  type FilterSlice,
  type PresetSlice,
  type AISuggestionsSlice,
  type SelectionSlice,
  type ProgressiveLoadingSlice,
  type ProgressiveLoadingState,
  type SearchMetadata,
} from './helpers/literature-search-helpers';

// Re-export types for external use
export type { ProgressiveLoadingState, SearchMetadata };

// ============================================================================
// Constants
// ============================================================================

const defaultFilters: SearchFilters = {
  yearFrom: 2010,
  yearTo: new Date().getFullYear(),
  sortBy: 'relevance',
  publicationType: 'all',
  author: '',
  authorSearchMode: 'contains',
  includeAIMode: true,
};

const DEFAULT_ACADEMIC_DATABASES = [
  'pubmed',
  'pmc',
  'arxiv',
  'semantic_scholar',
  'ssrn',
  'crossref',
  'eric',
  'core',
  'springer',
];

const INITIAL_PROGRESSIVE_STATE: ProgressiveLoadingState = {
  isActive: false,
  currentBatch: 0,
  totalBatches: 10,
  loadedPapers: 0,
  targetPapers: 200,
  averageQualityScore: 0,
  status: 'idle',
};

// ============================================================================
// Combined Store Interface
// ============================================================================

interface SearchState
  extends SearchStateSlice,
    FilterSlice,
    PresetSlice,
    AISuggestionsSlice,
    SelectionSlice,
    ProgressiveLoadingSlice {
  reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useLiteratureSearchStore = create<SearchState>()(
  persist(
    (...args) => ({
      ...createSearchStateSlice(...args),
      ...createFilterSlice(defaultFilters)(...args),
      ...createPresetSlice(...args),
      ...createAISuggestionsSlice(...args),
      ...createSelectionSlice(...args),
      ...createProgressiveLoadingSlice(...args),

      academicDatabases: DEFAULT_ACADEMIC_DATABASES,

      reset: () =>
        args[0]({
          query: '',
          papers: [],
          loading: false,
          error: null,
          totalResults: 0,
          currentPage: 1,
          academicDatabases: DEFAULT_ACADEMIC_DATABASES,
          selectedPapers: new Set(),
          aiSuggestions: [],
          showSuggestions: false,
          queryCorrectionMessage: null,
          progressiveLoading: INITIAL_PROGRESSIVE_STATE,
        }),
    }),
    {
      name: 'literature-search-store',
      version: 2,
      partialize: (state) => ({
        savedPresets: state.savedPresets,
        filters: state.filters,
        appliedFilters: state.appliedFilters,
        academicDatabases: state.academicDatabases,
      }),
      migrate: (persistedState: any, version: number) => {
        // ✅ SECURITY FIX: Validate persisted state structure
        if (!persistedState || typeof persistedState !== 'object') {
          logger.warn(
            'Invalid persisted state structure, resetting to defaults',
            'LiteratureSearchStore'
          );
          return {
            savedPresets: [],
            filters: defaultFilters,
            appliedFilters: defaultFilters,
            academicDatabases: DEFAULT_ACADEMIC_DATABASES,
          };
        }

        if (version < 2) {
          logger.info(
            'Store migration: v1 → v2 (adding academicDatabases)',
            'LiteratureSearchStore',
            { fromVersion: version, toVersion: 2 }
          );

          // ✅ SECURITY FIX: Validate and sanitize academicDatabases
          if (
            !Array.isArray(persistedState.academicDatabases) ||
            !persistedState.academicDatabases.every(
              (db: any) => typeof db === 'string'
            )
          ) {
            logger.warn(
              'Invalid academicDatabases in persisted state, using defaults',
              'LiteratureSearchStore',
              { received: persistedState.academicDatabases }
            );
            persistedState.academicDatabases = DEFAULT_ACADEMIC_DATABASES;
          } else {
            // Whitelist validation: only allow known database names
            const ALLOWED_DATABASES = new Set(DEFAULT_ACADEMIC_DATABASES);
            const validDatabases = persistedState.academicDatabases.filter(
              (db: string) => ALLOWED_DATABASES.has(db)
            );

            if (validDatabases.length === 0) {
              logger.warn(
                'All academicDatabases filtered out, using defaults',
                'LiteratureSearchStore'
              );
              persistedState.academicDatabases = DEFAULT_ACADEMIC_DATABASES;
            } else {
              persistedState.academicDatabases = validDatabases;
            }
          }
        }

        return persistedState;
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectSearchState = (state: SearchState) => ({
  query: state.query,
  papers: state.papers,
  loading: state.loading,
  error: state.error,
  totalResults: state.totalResults,
  currentPage: state.currentPage,
});

export const selectFilterState = (state: SearchState) => ({
  filters: state.filters,
  appliedFilters: state.appliedFilters,
  showFilters: state.showFilters,
  filterCount: state.getAppliedFilterCount(),
});

export const selectSelectionState = (state: SearchState) => ({
  selectedPapers: state.selectedPapers,
  selectedCount: state.selectedPapers.size,
  isSelected: state.isSelected,
});
