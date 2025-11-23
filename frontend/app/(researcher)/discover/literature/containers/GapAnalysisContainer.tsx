/**
 * Gap Analysis Container
 * Phase 10.935 Day 1 Afternoon: Self-Contained Container Refactoring (ENTERPRISE-GRADE)
 *
 * **Purpose:**
 * Self-contained container for research gap analysis UI and logic.
 * Displays gaps, triggers analysis, and handles loading states WITHOUT requiring props.
 *
 * **Responsibilities:**
 * - Display identified research gaps from selected papers
 * - Trigger gap analysis with AI
 * - Show loading states during analysis
 * - Provide empty state with call-to-action
 * - Handle error states gracefully
 *
 * **Architecture Pattern:**
 * Self-Contained Container Component (Phase 10.935 Pattern)
 * - ZERO required props (fully self-contained)
 * - Gets ALL data from Zustand stores
 * - Uses store actions for analysis
 * - Optional config props only
 * - Fully independent and reusable
 *
 * **State Management:**
 * - useGapAnalysisStore: Gaps, analysis status
 * - usePaperManagementStore: Selected papers count
 * - useLiteratureSearchStore: All papers for analysis
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper hooks usage (dependency arrays)
 * - ✅ Accessibility (semantic HTML, ARIA labels, keyboard nav)
 * - ✅ Performance (React.memo, useCallback, useMemo)
 * - ✅ Error and loading state handling
 * - ✅ Self-contained (zero required props)
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Defensive programming (input validation)
 *
 * @module GapAnalysisContainer
 * @since Phase 10.935 Day 1 Afternoon
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GapVisualizationPanel } from '@/components/literature/GapVisualizationPanel';
import { logger } from '@/lib/utils/logger';

// Stores
import { useGapAnalysisStore } from '@/lib/stores/gap-analysis.store';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

// ============================================================================
// Component Props
// ============================================================================

/**
 * GapAnalysisContainer Props
 *
 * Phase 10.935 Day 1: Container is self-contained with ZERO required props.
 * All data and handlers come from Zustand stores.
 *
 * **Optional Configuration:**
 * - error: Optional error override (for manual error display)
 * - emptyStateMessage: Customize the message shown when no gaps exist
 * - analyzeButtonText: Customize the analyze button text
 * - minPapersRequired: Override minimum papers needed (default: 1)
 *
 * **Data Sources (from stores):**
 * - gaps: useGapAnalysisStore().gaps
 * - analyzingGaps: useGapAnalysisStore().analyzingGaps
 * - selectedPapers: usePaperManagementStore().selectedPapers
 * - papers: useLiteratureSearchStore().papers
 *
 * **Handlers (from store):**
 * - handleAnalyzeGaps: useGapAnalysisStore().handleAnalyzeGaps
 */
export interface GapAnalysisContainerProps {
  /** Optional: Error message override */
  error?: string | null;

  /** Optional: Custom empty state message */
  emptyStateMessage?: string;

  /** Optional: Custom analyze button text */
  analyzeButtonText?: string;

  /** Optional: Minimum papers required for analysis */
  minPapersRequired?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * GapAnalysisContainer - Self-contained research gap analysis UI
 *
 * Enterprise-grade, self-contained container for gap analysis functionality.
 *
 * **Phase 10.935 Day 1 Afternoon:** Self-Contained Container Pattern
 * - ZERO required props
 * - All data from Zustand stores
 * - All handlers from store actions
 * - Optional config props only
 * - Fully independent and reusable
 *
 * This container encapsulates gap analysis functionality:
 * - Displays identified research gaps using GapVisualizationPanel
 * - Provides analyze button when no gaps exist
 * - Shows loading state during analysis
 * - Handles validation (minimum paper count)
 * - Displays errors gracefully
 *
 * @example
 * ```tsx
 * // No props needed!
 * <GapAnalysisContainer />
 *
 * // Or with custom config
 * <GapAnalysisContainer
 *   emptyStateMessage="Select papers to identify research opportunities"
 *   minPapersRequired={2}
 * />
 * ```
 */
export const GapAnalysisContainer = memo(function GapAnalysisContainer({
  error = null,
  emptyStateMessage,
  analyzeButtonText,
  minPapersRequired = 1,
}: GapAnalysisContainerProps) {
  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  // Gap analysis store
  const {
    gaps,
    analyzingGaps,
    handleAnalyzeGaps,
  } = useGapAnalysisStore();

  // Paper management store (for selected papers)
  const selectedPapers = usePaperManagementStore(state => state.selectedPapers);

  // Literature search store (for all papers - needed by analysis)
  const papers = useLiteratureSearchStore(state => state.papers);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const selectedPapersCount = useMemo(
    () => selectedPapers.size,
    [selectedPapers.size]
  );

  // ==========================================================================
  // MEMOIZED HANDLERS
  // ==========================================================================

  /**
   * Handle gap analysis trigger
   * Validates paper count before calling store action
   */
  const handleAnalyze = useCallback(() => {
    // Validation: Check minimum papers
    if (selectedPapersCount < minPapersRequired) {
      logger.warn('Insufficient papers selected for gap analysis', 'GapAnalysisContainer', {
        required: minPapersRequired,
        selected: selectedPapersCount
      });
      return;
    }

    // Validation: Check if already analyzing
    if (analyzingGaps) {
      logger.info('Analysis already in progress, ignoring duplicate request', 'GapAnalysisContainer');
      return;
    }

    // Trigger analysis via store action
    handleAnalyzeGaps(selectedPapers, papers);
  }, [selectedPapersCount, minPapersRequired, analyzingGaps, selectedPapers, papers, handleAnalyzeGaps]);

  // ==========================================================================
  // Memoized Derived State
  // ==========================================================================

  /**
   * Check if analyze button should be disabled
   */
  const isAnalyzeDisabled = useMemo(() => {
    return selectedPapersCount < minPapersRequired || analyzingGaps;
  }, [selectedPapersCount, minPapersRequired, analyzingGaps]);

  /**
   * Get validation message for insufficient papers
   */
  const validationMessage = useMemo(() => {
    if (selectedPapersCount === 0) {
      return 'Select papers from the Results tab to analyze gaps';
    }
    if (selectedPapersCount < minPapersRequired) {
      return `Select at least ${minPapersRequired} ${minPapersRequired === 1 ? 'paper' : 'papers'} to analyze gaps`;
    }
    return null;
  }, [selectedPapersCount, minPapersRequired]);

  // ==========================================================================
  // Error State
  // ==========================================================================

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong className="font-semibold">Gap Analysis Error:</strong>{' '}
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  // ==========================================================================
  // Loading State (Analyzing)
  // ==========================================================================

  if (analyzingGaps) {
    return (
      <div
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8"
        role="status"
        aria-live="polite"
        aria-label="Analyzing research gaps"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2
            className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Analyzing Research Gaps
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Our AI is analyzing {selectedPapersCount}{' '}
              {selectedPapersCount === 1 ? 'paper' : 'papers'} to identify
              promising research opportunities, methodology gaps, and emerging
              trends...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Main Content - Gaps Exist
  // ==========================================================================

  if (gaps.length > 0) {
    return (
      <div className="space-y-4">
        {/* Gap Count Summary */}
        <div
          className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              <strong>{gaps.length}</strong> Research{' '}
              {gaps.length === 1 ? 'Gap' : 'Gaps'} Identified
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzeDisabled}
            className="text-xs"
          >
            <TrendingUp className="w-3 h-3 mr-1" aria-hidden="true" />
            Re-analyze
          </Button>
        </div>

        {/* Gap Visualization */}
        <GapVisualizationPanel
          gaps={gaps}
          loading={false}
        />

        {/* Accessibility: Screen reader summary */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {gaps.length} research gaps identified from {selectedPapersCount} papers.
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Empty State - No Gaps Yet
  // ==========================================================================

  return (
    <div className="space-y-4">
      {/* Empty State Message */}
      <div
        className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/20 rounded-lg border border-gray-200 dark:border-gray-800"
        role="status"
        aria-live="polite"
      >
        <TrendingUp
          className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Research Gaps Analyzed Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
          {emptyStateMessage ||
            'Select papers from your search results and click the button below to identify promising research opportunities using AI-powered gap analysis.'}
        </p>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzeDisabled}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500"
          size="lg"
          aria-label={`Analyze research gaps from ${selectedPapersCount} selected papers`}
        >
          <TrendingUp className="w-5 h-5 mr-2" aria-hidden="true" />
          {analyzeButtonText || `Find Research Gaps from ${selectedPapersCount} Papers`}
        </Button>

        {/* Validation Message */}
        {validationMessage && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            {validationMessage}
          </p>
        )}
      </div>

      {/* Accessibility: Screen reader guidance */}
      <div className="sr-only" aria-live="polite">
        {isAnalyzeDisabled
          ? validationMessage
          : `Ready to analyze ${selectedPapersCount} papers for research gaps.`}
      </div>
    </div>
  );
});

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

GapAnalysisContainer.displayName = 'GapAnalysisContainer';
