/**
 * Paper Management Container
 * Phase 10.935 Day 1 Afternoon: Self-Contained Container Refactoring (ENTERPRISE-GRADE)
 *
 * **Purpose:**
 * Centralized, self-contained container for paper library management.
 * Displays and manages user's saved papers WITHOUT requiring props.
 *
 * **Responsibilities:**
 * - Display saved papers from user's library
 * - Handle paper selection and save/unsave actions
 * - Show extraction status for each paper
 * - Provide empty state when no saved papers
 *
 * **Architecture Pattern:**
 * Self-Contained Container Component (Phase 10.935 Pattern)
 * - ZERO props required (fully self-contained)
 * - Gets ALL data from Zustand store (usePaperManagementStore)
 * - Uses store actions for handlers
 * - Optional config props only (emptyStateMessage)
 * - Fully independent and reusable
 *
 * **State Management:**
 * - usePaperManagementStore: Paper selection, library, extraction state
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper hooks usage (dependency arrays)
 * - ✅ Accessibility (semantic HTML, ARIA labels, keyboard nav)
 * - ✅ Performance (React.memo, useCallback, useMemo)
 * - ✅ Error and loading state handling
 * - ✅ Self-contained (zero required props)
 *
 * @module PaperManagementContainer
 * @since Phase 10.935 Day 1 Afternoon
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Star } from 'lucide-react';
import { PaperCard } from '../components/PaperCard';
import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Component Props
// ============================================================================

/**
 * PaperManagementContainer Props
 *
 * Phase 10.935 Day 1: Container is self-contained with OPTIONAL config props only.
 * All data and handlers come from usePaperManagementStore().
 *
 * **Optional Configuration:**
 * - emptyStateMessage: Customize the message shown when library is empty
 *
 * **Data Sources (from store):**
 * - savedPapers: usePaperManagementStore().savedPapers
 * - selectedPapers: usePaperManagementStore().selectedPapers
 * - extractingPapers: usePaperManagementStore().extractingPapers
 * - extractedPapers: usePaperManagementStore().extractedPapers
 * - isLoadingLibrary: usePaperManagementStore().isLoadingLibrary
 *
 * **Handlers (from store):**
 * - togglePaperSelection: usePaperManagementStore().togglePaperSelection
 * - handleTogglePaperSave: usePaperManagementStore().handleTogglePaperSave
 */
export interface PaperManagementContainerProps {
  /** Optional: Custom empty state message */
  emptyStateMessage?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PaperManagementContainer - Displays and manages user's saved paper library
 *
 * Enterprise-grade, self-contained container for paper library management.
 *
 * **Phase 10.935 Day 1 Afternoon:** Self-Contained Container Pattern
 * - ZERO required props
 * - All data from usePaperManagementStore
 * - All handlers from store actions
 * - Optional config props only
 * - Fully independent and reusable
 *
 * This container encapsulates the paper library UI, handling:
 * - Rendering saved papers with metadata and actions
 * - Selection state for bulk operations
 * - Extraction status indicators
 * - Empty state when no papers are saved
 * - Loading and error states
 *
 * @example
 * ```tsx
 * // No props needed!
 * <PaperManagementContainer />
 *
 * // Or with custom empty message
 * <PaperManagementContainer
 *   emptyStateMessage="Start by searching for papers above"
 * />
 * ```
 */
export const PaperManagementContainer = memo(function PaperManagementContainer({
  emptyStateMessage,
}: PaperManagementContainerProps = {}) {
  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  // Paper management store - get all data and actions
  const {
    savedPapers,
    selectedPapers,
    extractingPapers,
    extractedPapers,
    isLoadingLibrary,
    togglePaperSelection,
    handleTogglePaperSave,
  } = usePaperManagementStore();

  // ==========================================================================
  // MEMOIZED HANDLERS
  // ==========================================================================

  /**
   * Handle paper selection toggle
   * Memoized to prevent unnecessary re-renders
   *
   * Uses store action directly with defensive programming
   */
  const handleToggleSelection = useCallback(
    (paperId: string) => {
      // Input validation
      if (!paperId || typeof paperId !== 'string') {
        logger.warn('Invalid paperId for selection', 'PaperManagementContainer', { paperId });
        return;
      }

      togglePaperSelection(paperId);
    },
    [togglePaperSelection]
  );

  /**
   * Handle paper save/unsave toggle
   * Memoized to prevent unnecessary re-renders
   *
   * Uses store action directly with defensive programming
   */
  const handleToggleSave = useCallback(
    (paper: Paper) => {
      // Input validation
      if (!paper || typeof paper !== 'object' || !paper.id) {
        logger.warn('Invalid paper for save toggle', 'PaperManagementContainer', {
          hasId: !!paper?.id,
          type: typeof paper
        });
        return;
      }

      handleTogglePaperSave(paper);
    },
    [handleTogglePaperSave]
  );

  // ==========================================================================
  // Memoized Derived State
  // ==========================================================================

  /**
   * Count of selected saved papers
   * Used for displaying statistics
   */
  const selectedCount = useMemo(() => {
    return savedPapers.filter(p => selectedPapers.has(p.id)).length;
  }, [savedPapers, selectedPapers]);

  /**
   * Count of extracted papers in library
   * Used for displaying extraction progress
   */
  const extractedCount = useMemo(() => {
    return savedPapers.filter(p => extractedPapers.has(p.id)).length;
  }, [savedPapers, extractedPapers]);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  /**
   * Display loading state while library is being fetched from backend
   * Uses isLoadingLibrary from store instead of prop
   */
  if (isLoadingLibrary) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-label="Loading saved papers"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading your library...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Empty State
  // ==========================================================================

  if (savedPapers.length === 0) {
    return (
      <div
        className="text-center py-12 text-gray-500"
        role="status"
        aria-live="polite"
      >
        <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
        <p className="text-base font-medium mb-1">
          No Saved Papers Yet
        </p>
        <p className="text-sm text-gray-400">
          {emptyStateMessage || 'Star papers from search results to add them to your library.'}
        </p>
      </div>
    );
  }

  // ==========================================================================
  // Main Render - Paper Library List
  // ==========================================================================

  return (
    <div className="space-y-4">
      {/* Library Statistics */}
      {savedPapers.length > 0 && (
        <div
          className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pb-2 border-b"
          role="status"
          aria-live="polite"
        >
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {savedPapers.length}
            </strong>{' '}
            saved {savedPapers.length === 1 ? 'paper' : 'papers'}
          </span>
          {selectedCount > 0 && (
            <span>
              <strong className="text-blue-600 dark:text-blue-400">
                {selectedCount}
              </strong>{' '}
              selected
            </span>
          )}
          {extractedCount > 0 && (
            <span>
              <strong className="text-green-600 dark:text-green-400">
                {extractedCount}
              </strong>{' '}
              extracted
            </span>
          )}
        </div>
      )}

      {/* Paper Cards List */}
      <div
        className="space-y-4"
        role="list"
        aria-label="Saved papers library"
      >
        {savedPapers.map((paper) => (
          <div key={paper.id} role="listitem">
            <PaperCard
              paper={paper}
              isSelected={selectedPapers.has(paper.id)}
              isSaved={true}
              isExtracting={extractingPapers.has(paper.id)}
              isExtracted={extractedPapers.has(paper.id)}
              onToggleSelection={handleToggleSelection}
              onToggleSave={handleToggleSave}
              getSourceIcon={getAcademicIcon}
            />
          </div>
        ))}
      </div>

      {/* Accessibility: Screen reader summary */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {savedPapers.length} saved papers.
        {selectedCount > 0 && ` ${selectedCount} papers selected.`}
        {extractedCount > 0 && ` ${extractedCount} papers have been analyzed for themes.`}
      </div>
    </div>
  );
});

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

PaperManagementContainer.displayName = 'PaperManagementContainer';
