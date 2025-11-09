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

// Default filter values
const defaultFilters: SearchFilters = {
  yearFrom: 2020,
  yearTo: new Date().getFullYear(),
  sortBy: 'relevance',
  publicationType: 'all',
  author: '',
  authorSearchMode: 'contains',
  includeAIMode: true,
};

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

      // Query actions
      setQuery: (query) => set({ query }),

      clearQuery: () => set({ query: '', papers: [], totalResults: 0, currentPage: 1 }),

      // Paper actions
      setPapers: (papers) => set({ papers }),

      addPapers: (papers) =>
        set((state) => ({
          papers: [...state.papers, ...papers],
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setTotalResults: (totalResults) => set({ totalResults }),

      setCurrentPage: (currentPage) => set({ currentPage }),

      // Filter actions
      setFilters: (partialFilters) =>
        set((state) => {
          // Filter out undefined values to satisfy exactOptionalPropertyTypes
          const cleanedFilters = Object.fromEntries(
            Object.entries(partialFilters).filter(([_, v]) => v !== undefined)
          ) as Partial<SearchFilters>;

          return {
            filters: { ...state.filters, ...cleanedFilters },
          };
        }),

      removeFilterProperty: (key) =>
        set((state) => {
          const newFilters = { ...state.filters };
          delete (newFilters as any)[key];
          return {
            filters: { ...defaultFilters, ...newFilters },
            appliedFilters: { ...defaultFilters, ...newFilters },
          };
        }),

      applyFilters: () =>
        set((state) => {
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
        set((state) => ({ showFilters: !state.showFilters })),

      getAppliedFilterCount: () => {
        const { appliedFilters } = get();
        let count = 0;
        if (appliedFilters.yearFrom !== defaultFilters.yearFrom) count++;
        if (appliedFilters.yearTo !== defaultFilters.yearTo) count++;
        if (appliedFilters.minCitations && appliedFilters.minCitations > 0) count++;
        if (appliedFilters.publicationType !== 'all') count++;
        if (appliedFilters.sortBy !== 'relevance') count++;
        if (appliedFilters.author && appliedFilters.author.trim().length > 0) count++;
        return count;
      },

      // Preset actions
      addPreset: (name) =>
        set((state) => {
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

      loadPreset: (presetId) =>
        set((state) => {
          const preset = state.savedPresets.find((p) => p.id === presetId);
          if (preset) {
            return {
              filters: preset.filters,
              appliedFilters: preset.filters,
              showPresets: false,
            };
          }
          return {};
        }),

      deletePreset: (presetId) =>
        set((state) => ({
          savedPresets: state.savedPresets.filter((p) => p.id !== presetId),
        })),

      toggleShowPresets: () =>
        set((state) => ({ showPresets: !state.showPresets })),

      // AI Suggestions actions
      setAISuggestions: (aiSuggestions) => set({ aiSuggestions }),

      clearAISuggestions: () =>
        set({ aiSuggestions: [], showSuggestions: false }),

      setShowSuggestions: (showSuggestions) => set({ showSuggestions }),

      setLoadingSuggestions: (loadingSuggestions) => set({ loadingSuggestions }),

      // Selection actions
      togglePaperSelection: (paperId) =>
        set((state) => {
          const newSet = new Set(state.selectedPapers);
          if (newSet.has(paperId)) {
            newSet.delete(paperId);
          } else {
            newSet.add(paperId);
          }
          return { selectedPapers: newSet };
        }),

      selectAllPapers: () =>
        set((state) => ({
          selectedPapers: new Set(state.papers.map((p) => p.id)),
        })),

      clearSelection: () => set({ selectedPapers: new Set() }),

      isSelected: (paperId) => get().selectedPapers.has(paperId),

      // Saved papers actions
      setSavedPapers: (savedPapers) => set({ savedPapers }),

      addSavedPaper: (paper) =>
        set((state) => ({
          savedPapers: [...state.savedPapers, paper],
        })),

      removeSavedPaper: (paperId) =>
        set((state) => ({
          savedPapers: state.savedPapers.filter((p) => p.id !== paperId),
        })),

      // Query correction actions
      setQueryCorrection: (queryCorrectionMessage) =>
        set({ queryCorrectionMessage }),

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
        }),
    }),
    {
      name: 'literature-search-store',
      // Only persist filters and presets
      partialize: (state) => ({
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
