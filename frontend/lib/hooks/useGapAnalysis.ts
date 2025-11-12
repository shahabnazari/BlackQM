/**
 * Gap Analysis Hook - Phase 10.1 Day 7
 *
 * Enterprise-grade hook for analyzing research gaps from selected papers.
 * Extracts gap analysis logic from God Component.
 *
 * @module useGapAnalysis
 * @since Phase 10.1 Day 7
 * @author VQMethod Team
 *
 * **Features:**
 * - Analyzes research gaps from selected papers
 * - Validates paper selection
 * - Manages loading state
 * - Comprehensive error handling
 * - Detailed logging for debugging
 *
 * **Usage:**
 * ```typescript
 * const {
 *   analyzingGaps,
 *   handleAnalyzeGaps,
 * } = useGapAnalysis({
 *   selectedPapers,
 *   papers,
 *   setGaps,
 *   setActiveTab,
 *   setActiveAnalysisSubTab,
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { literatureAPI, type ResearchGap, type Paper } from '@/lib/services/literature-api.service';

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
  /** Setter for updating gaps */
  setGaps: (gaps: ResearchGap[]) => void;
  /** Tab navigation setter */
  setActiveTab?: (tab: string) => void;
  /** Sub-tab navigation setter */
  setActiveAnalysisSubTab?: (tab: 'themes' | 'gaps' | 'synthesis') => void;
}

/**
 * Hook return type
 */
export interface UseGapAnalysisReturn {
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
  const {
    selectedPapers,
    papers,
    setGaps,
    setActiveTab,
    setActiveAnalysisSubTab,
  } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [analyzingGaps, setAnalyzingGaps] = useState(false);

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
    // Validation
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to analyze for research gaps');
      return;
    }

    setAnalyzingGaps(true);
    try {
      console.log(
        '🔍 Analyzing research gaps from',
        selectedPapers.size,
        'papers'
      );

      // Get full paper objects for selected IDs
      const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));

      console.log(
        '📄 Selected paper objects:',
        selectedPaperObjects.length,
        'papers'
      );
      console.log(
        '📝 Sample paper:',
        selectedPaperObjects[0]
          ? {
              id: selectedPaperObjects[0].id,
              title: selectedPaperObjects[0].title,
              hasAbstract: !!selectedPaperObjects[0].abstract,
            }
          : 'No papers'
      );

      // Send full paper objects to API
      const researchGaps =
        await literatureAPI.analyzeGapsFromPapers(selectedPaperObjects);

      console.log(
        '✅ Gap analysis complete:',
        researchGaps.length,
        'gaps found'
      );

      // Update gaps state
      setGaps(researchGaps);

      // Navigate to analysis tab (if setters provided)
      if (setActiveTab) setActiveTab('analysis');
      if (setActiveAnalysisSubTab) setActiveAnalysisSubTab('gaps');

      toast.success(
        `Identified ${researchGaps.length} research opportunities from ${selectedPaperObjects.length} papers`
      );
    } catch (error: any) {
      console.error('❌ Gap analysis failed:', error);
      toast.error(`Gap analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setAnalyzingGaps(false);
    }
  }, [
    selectedPapers,
    papers,
    setGaps,
    setActiveTab,
    setActiveAnalysisSubTab,
  ]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    analyzingGaps,
    handleAnalyzeGaps,
  };
}
