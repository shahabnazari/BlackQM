/**
 * Literature Search Zustand Store
 * Centralized state management for search functionality
 * Phase 10 Day 31 - Refactoring
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Paper,
  SearchFilters,
  FilterPreset,
  QueryCorrection,
} from '@/lib/types/literature.types';

// ============================================================================
// Defensive Deduplication Utility (Phase 10.6 Day 14.5)
// Prevents duplicate React keys even if backend deduplication fails
// ============================================================================

function deduplicatePapersByID(papers: Paper[]): Paper[] {
  const seenIds = new Set<string>();
  return papers.filter((paper) => {
    if (seenIds.has(paper.id)) {
      console.warn(
        `[Deduplication] Duplicate paper ID detected: ${paper.id} (${paper.title.substring(0, 50)}...)`
      );
      return false;
    }
    seenIds.add(paper.id);
    return true;
  });
}

// Default filter values
const defaultFilters: SearchFilters = {
  yearFrom: 2010, // Default to last 15 years of research
  yearTo: new Date().getFullYear(),
  sortBy: 'relevance',
  publicationType: 'all',
  author: '',
  authorSearchMode: 'contains',
  includeAIMode: true,
};

// ============================================================================
// Progressive Loading State (Phase 10.1 Day 7)
// ============================================================================

export interface ProgressiveLoadingState {
  isActive: boolean;
  currentBatch: number;
  totalBatches: number;
  loadedPapers: number;
  targetPapers: number;
  averageQualityScore: number;
  status: 'idle' | 'loading' | 'complete' | 'error';
  errorMessage?: string;
  // Phase 10.7 Day 6: Two-stage filtering
  currentStage?: 1 | 2; // 1 = collecting from sources, 2 = quality filtering
  visualPercentage?: number; // Smooth time-based percentage for animation (0-100)
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  };
  stage2?: {
    startingPapers: number;
    afterEnrichment: number;
    afterRelevanceFilter: number;
    finalSelected: number;
  };
}

// ============================================================================
// Search Metadata (Phase 10.6 Day 14.5+)
// ENTERPRISE TRANSPARENCY: Complete search pipeline tracking
// ============================================================================

export interface SearchMetadata {
  // Step 1: Initial collection from all sources
  totalCollected: number; // Papers before any processing
  sourceBreakdown: Record<
    string,
    {
      papers: number; // Papers from this source (INITIAL count)
      duration: number; // API call duration (ms)
      error?: string; // Error message if failed
    }
  >;

  // Step 2: Deduplication
  uniqueAfterDedup: number; // Papers after removing duplicates
  deduplicationRate: number; // Percentage of duplicates removed
  duplicatesRemoved: number; // Number of duplicates removed

  // Step 3: Quality scoring & filtering
  afterEnrichment: number; // After OpenAlex citation enrichment
  afterQualityFilter: number; // After relevance/quality filters
  qualityFiltered: number; // Papers removed by quality filters

  // Step 4: Final results
  totalQualified: number; // Papers meeting all criteria (pre-pagination)
  displayed: number; // Papers shown in current page

  // Performance & query info
  searchDuration: number; // Total search time (ms)
  queryExpansion?: {
    original: string;
    expanded: string;
  };

  // Phase 10.6 Day 14.7: Qualification criteria transparency
  qualificationCriteria?: {
    relevanceScoreMin: number;
    relevanceScoreDesc: string;
    qualityWeights: {
      citationImpact: number;
      journalPrestige: number;
    };
    filtersApplied: string[];
  };
}

// ============================================================================
// Store Interface
// ============================================================================

interface SearchState {
  // Query state
  query: string;
  papers: Paper[];
  loading: boolean;
  error: Error | null;
  totalResults: number;
  currentPage: number;

  // Filter state
  filters: SearchFilters;
  appliedFilters: SearchFilters;
  showFilters: boolean;

  // Preset state
  savedPresets: FilterPreset[];
  showPresets: boolean;

  // AI Suggestions
  aiSuggestions: string[]; // Array of suggestion text strings
  showSuggestions: boolean;
  loadingSuggestions: boolean;

  // Selection state
  selectedPapers: Set<string>;
  savedPapers: Paper[];

  // Query correction
  queryCorrectionMessage: QueryCorrection | null;

  // Progressive Loading (Phase 10.1 Day 7)
  progressiveLoading: ProgressiveLoadingState;

  // Search Metadata (Phase 10.6 Day 14.5)
  searchMetadata: SearchMetadata | null;

  // Actions - Query
  setQuery: (query: string) => void;
  clearQuery: () => void;

  // Actions - Papers
  setPapers: (papers: Paper[]) => void;
  addPapers: (papers: Paper[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setTotalResults: (total: number) => void;
  setCurrentPage: (page: number) => void;

  // Actions - Filters
  setFilters: (filters: Partial<SearchFilters>) => void;
  removeFilterProperty: (key: keyof SearchFilters) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  toggleShowFilters: () => void;
  getAppliedFilterCount: () => number;

  // Actions - Presets
  addPreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  toggleShowPresets: () => void;

  // Actions - AI Suggestions
  setAISuggestions: (suggestions: string[]) => void;
  clearAISuggestions: () => void;
  setShowSuggestions: (show: boolean) => void;
  setLoadingSuggestions: (loading: boolean) => void;

  // Actions - Selection
  togglePaperSelection: (paperId: string) => void;
  selectAllPapers: () => void;
  clearSelection: () => void;
  isSelected: (paperId: string) => boolean;

  // Actions - Saved Papers
  setSavedPapers: (papers: Paper[]) => void;
  addSavedPaper: (paper: Paper) => void;
  removeSavedPaper: (paperId: string) => void;

  // Actions - Query Correction
  setQueryCorrection: (correction: QueryCorrection | null) => void;

  // Actions - Search Metadata (Phase 10.6 Day 14.5)
  setSearchMetadata: (metadata: SearchMetadata | null) => void;

  // Actions - Progressive Loading (Phase 10.1 Day 7)
  startProgressiveLoading: (targetPapers: number) => void;
  updateProgressiveLoading: (
    updates: Partial<ProgressiveLoadingState>
  ) => void;
  completeProgressiveLoading: () => void;
  cancelProgressiveLoading: () => void;
  resetProgressiveLoading: () => void;

  // Actions - Reset
  reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useLiteratureSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      papers: [],
      loading: false,
      error: null,
      totalResults: 0,
      currentPage: 1,
      filters: defaultFilters,
      appliedFilters: defaultFilters,
      showFilters: false,
      savedPresets: [],
      showPresets: false,
      aiSuggestions: [],
      showSuggestions: false,
      loadingSuggestions: false,
      selectedPapers: new Set(),
      savedPapers: [],
      queryCorrectionMessage: null,

      // Search Metadata initial state (Phase 10.6 Day 14.5)
      searchMetadata: null,

      // Progressive Loading initial state (Phase 10.1 Day 7)
      progressiveLoading: {
        isActive: false,
        currentBatch: 0,
        totalBatches: 10, // 🔧 FIX: 10 batches of 20 papers each
        loadedPapers: 0,
        targetPapers: 200,
        averageQualityScore: 0,
        status: 'idle',
      },

      // Query actions
      setQuery: query => set({ query }),

      clearQuery: () =>
        set({ query: '', papers: [], totalResults: 0, currentPage: 1 }),

      // Paper actions
      // Phase 10.6 Day 14.5: Add defensive deduplication to prevent duplicate React keys
      setPapers: papers => {
        const deduped = deduplicatePapersByID(papers);
        if (deduped.length !== papers.length) {
          console.warn(
            `[LiteratureStore] Removed ${papers.length - deduped.length} duplicate papers (defensive check)`
          );
        }
        set({ papers: deduped });
      },

      addPapers: papers =>
        set(state => {
          const combined = [...state.papers, ...papers];
          const deduped = deduplicatePapersByID(combined);
          if (deduped.length !== combined.length) {
            console.warn(
              `[LiteratureStore] Removed ${combined.length - deduped.length} duplicate papers when adding (defensive check)`
            );
          }
          return { papers: deduped };
        }),

      setLoading: loading => set({ loading }),

      setError: error => set({ error }),

      setTotalResults: totalResults => set({ totalResults }),

      setCurrentPage: currentPage => set({ currentPage }),

      // Filter actions
      setFilters: partialFilters =>
        set(state => {
          // Filter out undefined values to satisfy exactOptionalPropertyTypes
          const cleanedFilters = Object.fromEntries(
            Object.entries(partialFilters).filter(([_, v]) => v !== undefined)
          ) as Partial<SearchFilters>;

          return {
            filters: { ...state.filters, ...cleanedFilters },
          };
        }),

      removeFilterProperty: key =>
        set(state => {
          const newFilters = { ...state.filters };
          delete newFilters[key];
          return {
            filters: { ...defaultFilters, ...newFilters },
            appliedFilters: { ...defaultFilters, ...newFilters },
          };
        }),

      applyFilters: () =>
        set(state => {
          // Auto-correct invalid filter values
          const correctedFilters = { ...state.filters };

          // Auto-correct year range
          if (correctedFilters.yearFrom && correctedFilters.yearTo) {
            if (correctedFilters.yearFrom > correctedFilters.yearTo) {
              correctedFilters.yearTo = correctedFilters.yearFrom;
            }
          }

          return {
            appliedFilters: correctedFilters,
            filters: correctedFilters,
            showFilters: false,
          };
        }),

      resetFilters: () =>
        set({
          filters: defaultFilters,
          appliedFilters: defaultFilters,
        }),

      toggleShowFilters: () =>
        set(state => ({ showFilters: !state.showFilters })),

      getAppliedFilterCount: () => {
        const { appliedFilters } = get();
        let count = 0;
        if (appliedFilters.yearFrom !== defaultFilters.yearFrom) count++;
        if (appliedFilters.yearTo !== defaultFilters.yearTo) count++;
        if (appliedFilters.minCitations && appliedFilters.minCitations > 0)
          count++;
        if (appliedFilters.publicationType !== 'all') count++;
        if (appliedFilters.sortBy !== 'relevance') count++;
        if (appliedFilters.author && appliedFilters.author.trim().length > 0)
          count++;
        return count;
      },

      // Preset actions
      addPreset: name =>
        set(state => {
          const preset: FilterPreset = {
            id: Date.now().toString(),
            name: name.trim(),
            filters: state.appliedFilters,
            createdAt: new Date().toISOString(),
          };

          return {
            savedPresets: [...state.savedPresets, preset],
            showPresets: false,
          };
        }),

      loadPreset: presetId =>
        set(state => {
          const preset = state.savedPresets.find(p => p.id === presetId);
          if (preset) {
            return {
              filters: preset.filters,
              appliedFilters: preset.filters,
              showPresets: false,
            };
          }
          return {};
        }),

      deletePreset: presetId =>
        set(state => ({
          savedPresets: state.savedPresets.filter(p => p.id !== presetId),
        })),

      toggleShowPresets: () =>
        set(state => ({ showPresets: !state.showPresets })),

      // AI Suggestions actions
      setAISuggestions: aiSuggestions => set({ aiSuggestions }),

      clearAISuggestions: () =>
        set({ aiSuggestions: [], showSuggestions: false }),

      setShowSuggestions: showSuggestions => set({ showSuggestions }),

      setLoadingSuggestions: loadingSuggestions => set({ loadingSuggestions }),

      // Selection actions
      togglePaperSelection: paperId =>
        set(state => {
          const newSet = new Set(state.selectedPapers);
          if (newSet.has(paperId)) {
            newSet.delete(paperId);
          } else {
            newSet.add(paperId);
          }
          return { selectedPapers: newSet };
        }),

      selectAllPapers: () =>
        set(state => ({
          selectedPapers: new Set(state.papers.map(p => p.id)),
        })),

      clearSelection: () => set({ selectedPapers: new Set() }),

      isSelected: paperId => get().selectedPapers.has(paperId),

      // Saved papers actions
      setSavedPapers: savedPapers => set({ savedPapers }),

      addSavedPaper: paper =>
        set(state => ({
          savedPapers: [...state.savedPapers, paper],
        })),

      removeSavedPaper: paperId =>
        set(state => ({
          savedPapers: state.savedPapers.filter(p => p.id !== paperId),
        })),

      // Query correction actions
      setQueryCorrection: queryCorrectionMessage =>
        set({ queryCorrectionMessage }),

      // Search Metadata actions (Phase 10.6 Day 14.5)
      setSearchMetadata: searchMetadata => set({ searchMetadata }),

      // Progressive Loading actions (Phase 10.1 Day 7)
      startProgressiveLoading: targetPapers =>
        set({
          progressiveLoading: {
            isActive: true,
            currentBatch: 1,
            totalBatches: 10, // 🔧 FIX: 10 batches of 20 papers each
            loadedPapers: 0,
            targetPapers,
            averageQualityScore: 0,
            status: 'loading',
            // Phase 10.7 Day 6: Start at Stage 1 (collecting from sources)
            currentStage: 1,
            // Omit stage1 and stage2 instead of setting to undefined (exactOptionalPropertyTypes compliance)
          },
          papers: [], // Clear existing papers
          loading: true,
        }),

      updateProgressiveLoading: updates => {
        console.log('🔄 [Zustand] updateProgressiveLoading called with:', updates);
        set(state => {
          const newState = {
            ...state.progressiveLoading,
            ...updates,
          };
          console.log('🔄 [Zustand] New progressiveLoading state:', newState);
          return {
            progressiveLoading: newState,
          };
        });
      },

      completeProgressiveLoading: () =>
        set(state => ({
          progressiveLoading: {
            ...state.progressiveLoading,
            status: 'complete',
            isActive: true, // Keep showing the indicator
          },
          loading: false,
        })),

      cancelProgressiveLoading: () =>
        set({
          progressiveLoading: {
            isActive: false,
            currentBatch: 0,
            totalBatches: 10, // 🔧 FIX: 10 batches
            loadedPapers: 0,
            targetPapers: 200,
            averageQualityScore: 0,
            status: 'idle',
          },
          loading: false,
        }),

      resetProgressiveLoading: () =>
        set({
          progressiveLoading: {
            isActive: false,
            currentBatch: 0,
            totalBatches: 10, // 🔧 FIX: 10 batches
            loadedPapers: 0,
            targetPapers: 200,
            averageQualityScore: 0,
            status: 'idle',
          },
        }),

      // Reset action
      reset: () =>
        set({
          query: '',
          papers: [],
          loading: false,
          error: null,
          totalResults: 0,
          currentPage: 1,
          selectedPapers: new Set(),
          aiSuggestions: [],
          showSuggestions: false,
          queryCorrectionMessage: null,
          progressiveLoading: {
            isActive: false,
            currentBatch: 0,
            totalBatches: 10, // 🔧 FIX: 10 batches
            loadedPapers: 0,
            targetPapers: 200,
            averageQualityScore: 0,
            status: 'idle',
          },
        }),
    }),
    {
      name: 'literature-search-store',
      // Only persist filters and presets
      partialize: state => ({
        savedPresets: state.savedPresets,
        filters: state.filters,
        appliedFilters: state.appliedFilters,
      }),
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
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
