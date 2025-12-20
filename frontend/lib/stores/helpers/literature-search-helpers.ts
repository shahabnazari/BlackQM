/**
 * Literature Search Store Helper Slices
 * Phase 10.91 Day 8 Afternoon - Store Architecture Refactoring
 *
 * **Purpose:**
 * Modular helper slices for literature search store to achieve <150 line target
 *
 * **Pattern:**
 * Factory functions that return state + actions for specific feature domains
 *
 * **Enterprise Standards:**
 * - ✅ All functions <100 lines
 * - ✅ Single Responsibility Principle
 * - ✅ TypeScript strict mode
 * - ✅ Comprehensive JSDoc
 *
 * @module LiteratureSearchHelpers
 * @since Phase 10.91 Day 8
 */

import type { StateCreator } from 'zustand';
import { logger } from '@/lib/utils/logger';
import type {
  Paper,
  SearchFilters,
  FilterPreset,
  QueryCorrection,
} from '@/lib/types/literature.types';
import type { ResearchPurpose } from '@/lib/services/literature-api.service';

// ============================================================================
// Type Definitions
// ============================================================================

// Progressive Loading State (Phase 10.1 Day 7)
export interface ProgressiveLoadingState {
  isActive: boolean;
  currentBatch: number;
  totalBatches: number;
  loadedPapers: number;
  targetPapers: number;
  averageQualityScore: number;
  status: 'idle' | 'loading' | 'complete' | 'error';
  errorMessage?: string;
  currentStage?: 1 | 2;
  visualPercentage?: number;
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

// Search Metadata (Phase 10.6 Day 14.5+)
export interface SearchMetadata {
  totalCollected: number;
  // sourceBreakdown can be either a simple count or detailed object
  // (API returns different formats depending on context)
  sourceBreakdown: Record<
    string,
    number | {
      papers: number;
      duration: number;
      error?: string;
    }
  >;
  uniqueAfterDedup: number;
  deduplicationRate: number;
  duplicatesRemoved: number;
  afterEnrichment: number;
  afterQualityFilter: number;
  qualityFiltered: number;
  totalQualified: number;
  displayed: number;
  searchDuration: number;
  queryExpansion?: {
    original: string;
    expanded: string;
  };
  qualificationCriteria?: {
    relevanceAlgorithm?: string; // Phase 10.942: 'BM25' - gold standard algorithm
    relevanceScoreMin: number;
    relevanceScoreDesc: string;
    qualityWeights: {
      citationImpact: number; // Phase 10.942: 30% FWCI
      journalPrestige: number; // Phase 10.942: 50% h-index/quartile
      recencyBoost?: number; // Phase 10.942: 20% exponential decay
    };
    filtersApplied: string[];
  };
  // Phase 10.7: Two-stage filtering metadata
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
  // Phase 10.6 Day 14.9: Dynamic allocation strategy
  allocationStrategy?: {
    targetPaperCount: number;
    queryComplexity?: string;
  };
}

// ============================================================================
// Utility: Deduplication (Defensive Programming)
// ============================================================================

/**
 * Defensive deduplication utility
 * Prevents duplicate React keys even if backend deduplication fails
 *
 * Phase 10.195: A+ Netflix-Grade - Reference equality optimization
 * Returns SAME array reference if no duplicates found, preventing
 * unnecessary React re-renders in useMemo/useEffect dependencies.
 *
 * @param papers - Array of papers that may contain duplicates
 * @returns Deduplicated array (same reference if no duplicates)
 */
export function deduplicatePapersByID(papers: Paper[]): Paper[] {
  // Phase 10.195: Quick check for duplicates before creating new array
  // This prevents unnecessary re-renders when papers array is updated
  // but contains no duplicates (common case)
  const seenIds = new Set<string>();
  let hasDuplicates = false;

  for (const paper of papers) {
    if (seenIds.has(paper.id)) {
      hasDuplicates = true;
      break;
    }
    seenIds.add(paper.id);
  }

  // If no duplicates, return SAME reference to prevent re-renders
  if (!hasDuplicates) {
    return papers;
  }

  // Only create new array if duplicates exist
  seenIds.clear();
  return papers.filter((paper) => {
    if (seenIds.has(paper.id)) {
      logger.warn(
        'Duplicate paper ID detected',
        'LiteratureSearchStore',
        { paperId: paper.id, title: paper.title.substring(0, 50) }
      );
      return false;
    }
    seenIds.add(paper.id);
    return true;
  });
}

// ============================================================================
// Search State Slice (Query, Papers, Loading, Error)
// ============================================================================

export interface SearchStateSlice {
  query: string;
  papers: Paper[];
  loading: boolean;
  error: Error | null;
  totalResults: number;
  currentPage: number;
  academicDatabases: string[];
  queryCorrectionMessage: QueryCorrection | null;
  searchMetadata: SearchMetadata | null;
  // Phase 10.170: Purpose-Aware Search Integration
  researchPurpose: ResearchPurpose | null;

  setQuery: (query: string) => void;
  clearQuery: () => void;
  setPapers: (papers: Paper[] | ((prev: Paper[]) => Paper[])) => void;
  addPapers: (papers: Paper[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setTotalResults: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setAcademicDatabases: (databases: string[]) => void;
  setQueryCorrection: (correction: QueryCorrection | null) => void;
  setSearchMetadata: (metadata: SearchMetadata | null) => void;
  // Phase 10.170: Purpose-Aware Search Integration
  setResearchPurpose: (purpose: ResearchPurpose | null) => void;
}

export const createSearchStateSlice: StateCreator<
  SearchStateSlice,
  [],
  [],
  SearchStateSlice
> = (set) => ({
  // State
  query: '',
  papers: [],
  loading: false,
  error: null,
  totalResults: 0,
  currentPage: 1,
  academicDatabases: [],
  queryCorrectionMessage: null,
  searchMetadata: null,
  // Phase 10.170: Purpose-Aware Search Integration
  researchPurpose: null,

  // Actions
  setQuery: (query) => set({ query }),

  clearQuery: () =>
    set({ query: '', papers: [], totalResults: 0, currentPage: 1 }),

  setPapers: (papers) =>
    set((state) => {
      // Support both direct values and updater functions (like React's useState)
      const newPapers = typeof papers === 'function' ? papers(state.papers) : papers;
      const deduped = deduplicatePapersByID(newPapers);
      if (deduped.length !== newPapers.length) {
        logger.warn(
          'Removed duplicate papers (defensive check)',
          'LiteratureSearchStore',
          {
            original: newPapers.length,
            deduplicated: deduped.length,
            removed: newPapers.length - deduped.length,
          }
        );
      }
      return { papers: deduped };
    }),

  addPapers: (papers) =>
    set((state) => {
      const combined = [...state.papers, ...papers];
      const deduped = deduplicatePapersByID(combined);
      if (deduped.length !== combined.length) {
        logger.warn(
          'Removed duplicate papers when adding',
          'LiteratureSearchStore',
          {
            combined: combined.length,
            deduplicated: deduped.length,
            removed: combined.length - deduped.length,
          }
        );
      }
      return { papers: deduped };
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTotalResults: (totalResults) => set({ totalResults }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setAcademicDatabases: (academicDatabases) => set({ academicDatabases }),
  setQueryCorrection: (queryCorrectionMessage) => set({ queryCorrectionMessage }),
  setSearchMetadata: (searchMetadata) => set({ searchMetadata }),
  // Phase 10.170: Purpose-Aware Search Integration
  setResearchPurpose: (researchPurpose) => set({ researchPurpose }),
});

// ============================================================================
// Filter Slice (Filter Management)
// ============================================================================

export interface FilterSlice {
  filters: SearchFilters;
  appliedFilters: SearchFilters;
  showFilters: boolean;

  setFilters: (filters: Partial<SearchFilters>) => void;
  removeFilterProperty: (key: keyof SearchFilters) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  toggleShowFilters: () => void;
  getAppliedFilterCount: () => number;
}

export const createFilterSlice = (
  defaultFilters: SearchFilters
): StateCreator<FilterSlice, [], [], FilterSlice> => (set, get) => ({
  // State
  filters: defaultFilters,
  appliedFilters: defaultFilters,
  showFilters: false,

  // Actions
  setFilters: (partialFilters) =>
    set((state) => {
      // Filter out undefined values (exactOptionalPropertyTypes compliance)
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
      delete newFilters[key];
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
    // Phase 10.201: A+ Netflix-Grade - Consistent filter counting
    // Both filters count when CHANGED from defaults (uniform user mental model)
    if (appliedFilters.hasFullTextOnly !== defaultFilters.hasFullTextOnly) count++;
    if (appliedFilters.excludeBooks !== defaultFilters.excludeBooks) count++;
    return count;
  },
});

// ============================================================================
// Preset Slice (Filter Preset Management)
// ============================================================================

export interface PresetSlice {
  savedPresets: FilterPreset[];
  showPresets: boolean;

  addPreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  toggleShowPresets: () => void;
}

export const createPresetSlice: StateCreator<PresetSlice & FilterSlice, [], [], PresetSlice> = (
  set
) => ({
  // State
  savedPresets: [],
  showPresets: false,

  // Actions
  addPreset: (name) =>
    set((state) => {
      // Input validation
      const trimmedName = name.trim();
      if (!trimmedName) {
        logger.warn('Empty preset name', 'LiteratureSearchStore');
        return {};
      }

      // Limit preset name length (DoS prevention)
      const MAX_PRESET_NAME_LENGTH = 100;
      const sanitizedName = trimmedName.substring(0, MAX_PRESET_NAME_LENGTH);

      if (trimmedName.length > MAX_PRESET_NAME_LENGTH) {
        logger.warn(
          'Preset name too long, truncating',
          'LiteratureSearchStore',
          { length: trimmedName.length, max: MAX_PRESET_NAME_LENGTH }
        );
      }

      const preset: FilterPreset = {
        id: crypto.randomUUID(), // ✅ SECURITY FIX: Use cryptographically secure UUID
        name: sanitizedName,
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
});

// ============================================================================
// AI Suggestions Slice
// ============================================================================

export interface AISuggestionsSlice {
  aiSuggestions: string[];
  showSuggestions: boolean;
  loadingSuggestions: boolean;

  setAISuggestions: (suggestions: string[]) => void;
  clearAISuggestions: () => void;
  setShowSuggestions: (show: boolean) => void;
  setLoadingSuggestions: (loading: boolean) => void;
}

export const createAISuggestionsSlice: StateCreator<
  AISuggestionsSlice,
  [],
  [],
  AISuggestionsSlice
> = (set) => ({
  // State
  aiSuggestions: [],
  showSuggestions: false,
  loadingSuggestions: false,

  // Actions
  setAISuggestions: (aiSuggestions) => set({ aiSuggestions }),

  clearAISuggestions: () =>
    set({ aiSuggestions: [], showSuggestions: false }),

  setShowSuggestions: (showSuggestions) => set({ showSuggestions }),

  setLoadingSuggestions: (loadingSuggestions) => set({ loadingSuggestions }),
});

// ============================================================================
// Selection Slice (Paper Selection)
// ============================================================================

export interface SelectionSlice {
  selectedPapers: Set<string>;
  savedPapers: Paper[];

  togglePaperSelection: (paperId: string) => void;
  selectAllPapers: () => void;
  selectMultiplePapers: (paperIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (paperId: string) => boolean;
  setSavedPapers: (papers: Paper[]) => void;
  addSavedPaper: (paper: Paper) => void;
  removeSavedPaper: (paperId: string) => void;
}

export const createSelectionSlice: StateCreator<
  SelectionSlice & SearchStateSlice,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  // State
  selectedPapers: new Set(),
  savedPapers: [],

  // Actions
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

  selectMultiplePapers: (paperIds) =>
    set((state) => {
      const newSet = new Set(state.selectedPapers);
      paperIds.forEach((id) => newSet.add(id));
      return { selectedPapers: newSet };
    }),

  clearSelection: () => set({ selectedPapers: new Set() }),

  isSelected: (paperId) => get().selectedPapers.has(paperId),

  setSavedPapers: (savedPapers) => set({ savedPapers }),

  addSavedPaper: (paper) =>
    set((state) => ({
      savedPapers: [...state.savedPapers, paper],
    })),

  removeSavedPaper: (paperId) =>
    set((state) => ({
      savedPapers: state.savedPapers.filter((p) => p.id !== paperId),
    })),
});

// ============================================================================
// Progressive Loading Slice
// ============================================================================

export interface ProgressiveLoadingSlice {
  progressiveLoading: ProgressiveLoadingState;

  startProgressiveLoading: (targetPapers: number) => void;
  updateProgressiveLoading: (updates: Partial<ProgressiveLoadingState>) => void;
  completeProgressiveLoading: () => void;
  cancelProgressiveLoading: () => void;
  resetProgressiveLoading: () => void;
}

/**
 * ✅ PERF-001 FIX: Milestone-based logging (not every update)
 *
 * BEFORE: 2 logs per update × 10 updates/sec = 20 logs/sec
 * AFTER: Only log significant milestones = ~1 log/sec
 */

// ✅ Track last logged milestone to prevent spam
let lastLoggedMilestone: { stage?: number; batch?: number } = {};

export const createProgressiveLoadingSlice: StateCreator<
  ProgressiveLoadingSlice & SearchStateSlice,
  [],
  [],
  ProgressiveLoadingSlice
> = (set) => ({
  // State
  progressiveLoading: {
    isActive: false,
    currentBatch: 0,
    totalBatches: 10,
    loadedPapers: 0,
    targetPapers: 200,
    averageQualityScore: 0,
    status: 'idle',
  },

  // Actions
  startProgressiveLoading: (targetPapers) => {
    // ✅ Log start event
    logger.info(
      `Starting progressive loading (target: ${targetPapers} papers)`,
      'LiteratureSearchStore',
    );
    lastLoggedMilestone = { stage: 1, batch: 1 };  // Reset tracking

    set({
      progressiveLoading: {
        isActive: true,
        currentBatch: 1,
        totalBatches: 10,
        loadedPapers: 0,
        targetPapers,
        averageQualityScore: 0,
        status: 'loading',
        currentStage: 1,
      },
      papers: [],
      loading: true,
    });
  },

  updateProgressiveLoading: (updates) => {
    // ✅ PERFORMANCE FIX: Only log significant events
    const shouldLog = (
      // Log stage transitions (important)
      (updates.currentStage !== undefined &&
       updates.currentStage !== lastLoggedMilestone.stage) ||
      // Log status changes (important)
      (updates.status !== undefined && updates.status !== 'loading') ||
      // Log every 5th batch (reduce noise)
      (updates.currentBatch !== undefined &&
       updates.currentBatch % 5 === 0 &&
       updates.currentBatch !== lastLoggedMilestone.batch)
    );

    // ✅ Only log in development and only milestones
    if (shouldLog && process.env.NODE_ENV === 'development') {
      logger.debug(
        'Progressive loading milestone',
        'LiteratureSearchStore',
        {
          stage: updates.currentStage,
          batch: updates.currentBatch,
          status: updates.status,
          progress: updates.loadedPapers
            ? `${updates.loadedPapers}/${updates.targetPapers}`
            : undefined,
        }
      );

      // Update last logged milestone
      if (updates.currentStage !== undefined) {
        lastLoggedMilestone.stage = updates.currentStage;
      }
      if (updates.currentBatch !== undefined) {
        lastLoggedMilestone.batch = updates.currentBatch;
      }
    }

    // ✅ Direct state update without extra logging
    set((state) => ({
      progressiveLoading: {
        ...state.progressiveLoading,
        ...updates,
      },
    }));
  },

  completeProgressiveLoading: () => {
    logger.info('Progressive loading complete', 'LiteratureSearchStore');
    lastLoggedMilestone = {};  // Reset for next search

    set((state) => ({
      progressiveLoading: {
        ...state.progressiveLoading,
        status: 'complete',
        isActive: true,
      },
      loading: false,
    }));
  },

  cancelProgressiveLoading: () =>
    set({
      progressiveLoading: {
        isActive: false,
        currentBatch: 0,
        totalBatches: 10,
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
        totalBatches: 10,
        loadedPapers: 0,
        targetPapers: 200,
        averageQualityScore: 0,
        status: 'idle',
      },
    }),
});
