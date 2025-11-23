/**
 * Gap Analysis Store Helper Slices
 * Phase 10.91 Day 8 Afternoon - Store Architecture Refactoring
 *
 * **Purpose:**
 * Modular helper slices for gap analysis store to achieve <100 line target
 *
 * **Pattern:**
 * Factory functions that return state + actions for gap analysis feature
 *
 * **Enterprise Standards:**
 * - ✅ All functions <100 lines
 * - ✅ Single Responsibility Principle
 * - ✅ TypeScript strict mode
 * - ✅ Comprehensive JSDoc
 *
 * @module GapAnalysisHelpers
 * @since Phase 10.91 Day 8
 */

import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import {
  literatureAPI,
  type ResearchGap,
  type Paper,
} from '@/lib/services/literature-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Gap Analysis Actions Slice
// ============================================================================

export interface GapAnalysisActionsSlice {
  gaps: ResearchGap[];
  analyzingGaps: boolean;
  gapVisualizationData: any | null;
  lastAnalysisTimestamp: number | null;
  lastAnalyzedPaperCount: number;

  handleAnalyzeGaps: (
    selectedPaperIds: Set<string>,
    allPapers: Paper[],
    setActiveTab?: (tab: string) => void,
    setActiveAnalysisSubTab?: (tab: 'themes' | 'gaps' | 'synthesis') => void
  ) => Promise<void>;
  setGaps: (gaps: ResearchGap[] | ((prev: ResearchGap[]) => ResearchGap[])) => void;
  setAnalyzingGaps: (analyzing: boolean) => void;
  setGapVisualizationData: (data: any) => void;
  clearGaps: () => void;
}

export const createGapAnalysisActionsSlice: StateCreator<
  GapAnalysisActionsSlice,
  [],
  [],
  GapAnalysisActionsSlice
> = (set) => ({
  // State
  gaps: [],
  analyzingGaps: false,
  gapVisualizationData: null,
  lastAnalysisTimestamp: null,
  lastAnalyzedPaperCount: 0,

  // Actions
  handleAnalyzeGaps: async (
    selectedPaperIds: Set<string>,
    allPapers: Paper[],
    setActiveTab?: (tab: string) => void,
    setActiveAnalysisSubTab?: (tab: 'themes' | 'gaps' | 'synthesis') => void
  ) => {
    // Validation
    if (selectedPaperIds.size === 0) {
      toast.error('Please select papers to analyze for research gaps');
      return;
    }

    set({ analyzingGaps: true });

    try {
      logger.info(
        'Analyzing research gaps from selected papers',
        'GapAnalysisStore',
        { paperCount: selectedPaperIds.size }
      );

      // Get full paper objects for selected IDs
      const selectedPaperObjects = allPapers.filter((p) =>
        selectedPaperIds.has(p.id)
      );

      logger.debug('Selected paper objects for analysis', 'GapAnalysisStore', {
        count: selectedPaperObjects.length,
        sample: selectedPaperObjects[0]
          ? {
              id: selectedPaperObjects[0].id,
              title: selectedPaperObjects[0].title,
              hasAbstract: !!selectedPaperObjects[0].abstract,
            }
          : 'No papers',
      });

      // Send full paper objects to API
      const researchGaps =
        await literatureAPI.analyzeGapsFromPapers(selectedPaperObjects);

      logger.info('Gap analysis complete', 'GapAnalysisStore', {
        gapsFound: researchGaps.length,
      });

      // Update state
      set({
        gaps: researchGaps,
        analyzingGaps: false,
        lastAnalysisTimestamp: Date.now(),
        lastAnalyzedPaperCount: selectedPaperObjects.length,
      });

      // Navigate to analysis tab (if setters provided)
      if (setActiveTab) setActiveTab('analysis');
      if (setActiveAnalysisSubTab) setActiveAnalysisSubTab('gaps');

      toast.success(
        `Identified ${researchGaps.length} research opportunities from ${selectedPaperObjects.length} papers`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Gap analysis failed', 'GapAnalysisStore', { error });
      set({ analyzingGaps: false });
      toast.error(`Gap analysis failed: ${errorMessage}`);
    }
  },

  setGaps: (gaps) => {
    logger.debug('Setting gaps', 'GapAnalysisStore');
    set((state) => ({
      gaps: typeof gaps === 'function' ? gaps(state.gaps) : gaps,
      lastAnalysisTimestamp: Date.now(),
    }));
  },

  setAnalyzingGaps: (analyzing: boolean) => {
    logger.debug('Setting analyzing state', 'GapAnalysisStore', { analyzing });
    set({ analyzingGaps: analyzing });
  },

  setGapVisualizationData: (data: any) => {
    logger.debug('Setting gap visualization data', 'GapAnalysisStore');
    set({ gapVisualizationData: data });
  },

  clearGaps: () => {
    logger.info('Clearing all gaps', 'GapAnalysisStore');
    set({
      gaps: [],
      gapVisualizationData: null,
      lastAnalysisTimestamp: null,
      lastAnalyzedPaperCount: 0,
    });
  },
});

// ============================================================================
// Gap Analysis Helpers Slice
// ============================================================================

export interface GapAnalysisHelpersSlice {
  hasGaps: () => boolean;
  getGapCount: () => number;
}

export const createGapAnalysisHelpersSlice: StateCreator<
  GapAnalysisActionsSlice & GapAnalysisHelpersSlice,
  [],
  [],
  GapAnalysisHelpersSlice
> = (_set, get) => ({
  hasGaps: (): boolean => {
    return get().gaps.length > 0;
  },

  getGapCount: (): number => {
    return get().gaps.length;
  },
});
