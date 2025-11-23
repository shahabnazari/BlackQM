/**
 * Gap Analysis Hook - Phase 10.91 Day 5 (MIGRATED TO ZUSTAND)
 *
 * **MIGRATION NOTE:** This hook is now a thin wrapper around GapAnalysisStore.
 * All state management has been migrated to Zustand for consistency and better performance.
 *
 * Enterprise-grade hook for analyzing research gaps from selected papers.
 * Extracts gap analysis logic from God Component.
 *
 * @module useGapAnalysis
 * @since Phase 10.1 Day 7
 * @migrated Phase 10.91 Day 5 - Zustand Migration
 * @author VQMethod Team
 *
 * **Features:**
 * - Analyzes research gaps from selected papers (via Zustand store)
 * - Validates paper selection
 * - Manages loading state
 * - Comprehensive error handling
 * - Detailed logging for debugging
 * - No useState - all state in Zustand store
 *
 * **Usage:**
 * ```typescript
 * const {
 *   gaps,
 *   analyzingGaps,
 *   handleAnalyzeGaps,
 * } = useGapAnalysis({
 *   selectedPapers,
 *   papers,
 *   setActiveTab,
 *   setActiveAnalysisSubTab,
 * });
 * ```
 */

import { useCallback } from 'react';
import { useGapAnalysisStore } from '@/lib/stores/gap-analysis.store';
import type { Paper, ResearchGap } from '@/lib/services/literature-api.service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Hook configuration
 */
export interface UseGapAnalysisConfig {
  /** Currently selected paper IDs */
  selectedPapers: Set<string>;
  /** All available papers */
  papers: Paper[];
  /** Tab navigation setter (optional) */
  setActiveTab?: (tab: string) => void;
  /** Sub-tab navigation setter (optional) */
  setActiveAnalysisSubTab?: (tab: 'themes' | 'gaps' | 'synthesis') => void;
}

/**
 * Hook return type
 */
export interface UseGapAnalysisReturn {
  /** Identified research gaps */
  gaps: ResearchGap[];
  /** Whether gap analysis is in progress */
  analyzingGaps: boolean;
  /** Handler to trigger gap analysis */
  handleAnalyzeGaps: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing research gap analysis
 *
 * **Phase 10.91 Day 5 Migration:**
 * - Removed useState for analyzingGaps (now in store)
 * - Removed setGaps parameter (gaps now in store)
 * - Hook now wraps store action with navigation callbacks
 * - Maintains backward compatibility with existing components
 *
 * **Architecture:**
 * - Validates paper selection before analysis
 * - Calls literature API for gap identification
 * - Manages loading state for UI feedback
 * - Switches to analysis tab on completion
 *
 * **Error Handling:**
 * - Validates selection before API call
 * - User-friendly error messages via toast
 * - Proper cleanup of loading states
 * - Detailed logging for debugging
 *
 * @param {UseGapAnalysisConfig} config - Configuration object
 * @returns {UseGapAnalysisReturn} State and handlers
 */
export function useGapAnalysis(
  config: UseGapAnalysisConfig
): UseGapAnalysisReturn {
  const { selectedPapers, papers, setActiveTab, setActiveAnalysisSubTab } = config;

  // ===========================
  // ZUSTAND STORE INTEGRATION
  // ===========================

  const gaps = useGapAnalysisStore(state => state.gaps);
  const analyzingGaps = useGapAnalysisStore(state => state.analyzingGaps);
  const handleAnalyzeGapsStore = useGapAnalysisStore(
    state => state.handleAnalyzeGaps
  );

  // ===========================
  // GAP ANALYSIS HANDLER
  // ===========================

  /**
   * Analyze research gaps from selected papers
   *
   * **Process:**
   * 1. Validate paper selection
   * 2. Filter selected papers from full list
   * 3. Send to API for gap analysis
   * 4. Update gaps state with results
   * 5. Switch to analysis tab
   * 6. Show success/error toast
   */
  const handleAnalyzeGaps = useCallback(async () => {
    await handleAnalyzeGapsStore(
      selectedPapers,
      papers,
      setActiveTab,
      setActiveAnalysisSubTab
    );
  }, [selectedPapers, papers, setActiveTab, setActiveAnalysisSubTab, handleAnalyzeGapsStore]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    gaps,
    analyzingGaps,
    handleAnalyzeGaps,
  };
}
