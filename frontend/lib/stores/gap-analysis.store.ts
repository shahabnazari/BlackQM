/**
 * Gap Analysis Zustand Store
 * Phase 10.91 Day 8 - Store Architecture Refactoring
 *
 * **Refactoring:** Reduced from 375 → <100 lines using helper slices
 * **Pattern:** Compose slices using Zustand spread pattern
 *
 * Enterprise-grade centralized state management for research gap analysis.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ResearchGap } from '@/lib/services/literature-api.service';
import { logger } from '@/lib/utils/logger';
import {
  createGapAnalysisActionsSlice,
  createGapAnalysisHelpersSlice,
  type GapAnalysisActionsSlice,
  type GapAnalysisHelpersSlice,
} from './helpers/gap-analysis-helpers';

// ============================================================================
// Combined Store Interface
// ============================================================================

export interface GapAnalysisState
  extends GapAnalysisActionsSlice,
    GapAnalysisHelpersSlice {
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_STATE = {
  gaps: [] as ResearchGap[],
  analyzingGaps: false,
  gapVisualizationData: null,
  lastAnalysisTimestamp: null,
  lastAnalyzedPaperCount: 0,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useGapAnalysisStore = create<GapAnalysisState>()(
  devtools(
    persist(
      (...args) => ({
        ...createGapAnalysisActionsSlice(...args),
        ...createGapAnalysisHelpersSlice(...args),

        reset: () => {
          logger.info('Resetting store to initial state', 'GapAnalysisStore');
          args[0](INITIAL_STATE);
        },
      }),
      {
        name: 'gap-analysis-store',
        partialize: (state) => ({
          gaps: state.gaps,
          gapVisualizationData: state.gapVisualizationData,
          lastAnalysisTimestamp: state.lastAnalysisTimestamp,
          lastAnalyzedPaperCount: state.lastAnalyzedPaperCount,
        }),
      }
    ),
    { name: 'GapAnalysisStore' }
  )
);

// ============================================================================
// OPTIMIZED SELECTORS
// ============================================================================

/**
 * Optimized selector for gap count
 * Prevents unnecessary re-renders when only count is needed
 */
export const useGapCount = () => useGapAnalysisStore(state => state.gaps.length);

/**
 * Optimized selector for checking if gaps exist
 * Prevents unnecessary re-renders when only boolean is needed
 */
export const useHasGaps = () => useGapAnalysisStore(state => state.gaps.length > 0);

/**
 * Optimized selector for analyzing state
 * Prevents unnecessary re-renders
 */
export const useIsAnalyzingGaps = () =>
  useGapAnalysisStore(state => state.analyzingGaps);

/**
 * Optimized selector for last analysis metadata
 * Useful for showing "Last analyzed X minutes ago"
 */
export const useLastAnalysisMetadata = () =>
  useGapAnalysisStore(state => ({
    timestamp: state.lastAnalysisTimestamp,
    paperCount: state.lastAnalyzedPaperCount,
  }));
