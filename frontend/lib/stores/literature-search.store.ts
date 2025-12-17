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

/**
 * Phase 10.115: Netflix-Grade Default Sources
 *
 * Ordered by tier (premium first) for optimal search coverage:
 * - Tier 1 (Premium): OpenAlex (250M+ papers), Semantic Scholar (220M+ papers)
 * - Tier 2 (Good): PubMed, CrossRef, Springer
 * - Tier 3 (Preprint): arXiv, SSRN, PMC
 * - Tier 4 (Supplementary): ERIC, CORE
 *
 * Sources requiring ORCID auth (Scopus, Web of Science, IEEE, Wiley, SAGE, T&F)
 * are NOT included by default - they're added when user authenticates.
 */
const DEFAULT_ACADEMIC_DATABASES = [
  // Tier 1: Premium free sources (500 paper allocation)
  'openalex',         // 250M+ works, comprehensive metadata, 100% free
  'semantic_scholar', // 220M+ papers, citation context, AI-powered
  // Tier 2: High-quality databases (400 paper allocation)
  'pubmed',           // 36M+ biomedical papers
  'crossref',         // 150M+ DOIs, comprehensive metadata
  'springer',         // 13M+ STM articles
  // Tier 3: Preprint/specialized (300 paper allocation)
  'arxiv',            // 2.4M+ preprints (physics, CS, math)
  'ssrn',             // 1M+ social science preprints
  'pmc',              // 8M+ full-text biomedical
  // Tier 4: Supplementary (300 paper allocation)
  'eric',             // 1.8M+ education research
  'core',             // 250M+ open access aggregator
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
          // Phase 10.170: Purpose-Aware Search Integration
          researchPurpose: null,
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
        // Phase 10.170: Persist research purpose selection
        researchPurpose: state.researchPurpose,
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
            // Phase 10.115: Include ALL possible sources (including ORCID-gated ones)
            // so users who authenticated previously keep their selections
            const ALLOWED_DATABASES = new Set([
              ...DEFAULT_ACADEMIC_DATABASES,
              // ORCID-gated sources (user may have authenticated)
              'scopus', 'web_of_science', 'ieee_xplore', 'wiley', 'sage', 'taylor_francis',
              // Other valid sources
              'nature', 'google_scholar',
            ]);
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
