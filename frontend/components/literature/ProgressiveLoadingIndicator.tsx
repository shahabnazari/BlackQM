/**
 * Progressive Loading Indicator Component
 * Phase 10.91 Day 11 - Refactored for Maintainability
 *
 * Orchestrates the display of search progress with modular sub-components.
 * Features:
 * - Animated progress bar with heat map gradient
 * - Real-time source breakdown during search
 * - Detailed transparency summary after completion
 * - Smooth transitions and animations
 *
 * @module ProgressiveLoadingIndicator
 * @since Phase 10.1 Day 7 (Refactored Phase 10.91 Day 11)
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { ProgressBar } from './progress/ProgressBar';
import { SourceBreakdown } from './progress/SourceBreakdown';
import { SearchTransparencySummary } from './progress/SearchTransparencySummary';

// ============================================================================
// Types
// ============================================================================

export interface ProgressiveLoadingState {
  /** Whether progressive loading is active */
  isActive: boolean;
  /** Current batch number (1, 2, or 3) */
  currentBatch: number;
  /** Total number of batches */
  totalBatches: number;
  /** Number of papers loaded so far */
  loadedPapers: number;
  /** Target number of papers (200) */
  targetPapers: number;
  /** Average quality score (0-100) */
  averageQualityScore: number;
  /** Loading status */
  status: 'idle' | 'loading' | 'complete' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Current stage: 1 = collecting, 2 = filtering */
  currentStage?: 1 | 2;
  /** Smooth time-based percentage for animation (0-100) */
  visualPercentage?: number;
  /** Stage 1 metadata (from backend) */
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  };
  /** Stage 2 metadata (from backend) */
  stage2?: {
    startingPapers: number;
    afterEnrichment: number;
    afterRelevanceFilter: number;
    finalSelected: number;
  };
}

interface ProgressiveLoadingIndicatorProps {
  state: ProgressiveLoadingState;
  onCancel?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ProgressiveLoadingIndicator: React.FC<
  ProgressiveLoadingIndicatorProps
> = ({ state, onCancel }) => {
  const { isActive, status } = state;

  // 🎯 Map stage1/stage2 data to searchMetadata format for transparency panel
  const searchMetadata = React.useMemo(() => {
    if (!state.stage1 || !state.stage2) return undefined;
    
    return {
      sourcesQueried: state.stage1.sourcesSearched || 6,
      sourcesWithResults: state.stage1.sourceBreakdown
        ? Object.values(state.stage1.sourceBreakdown).filter(countData => {
            const count = typeof countData === 'number' ? countData : countData.papers;
            return count > 0;
          }).length
        : 0,
      totalCollected: state.stage1.totalCollected || 0,
      uniqueAfterDedup: state.stage2.afterEnrichment || state.stage1.totalCollected || 0,
      finalSelected: state.stage2.finalSelected || 0,
      sourceBreakdown: state.stage1.sourceBreakdown,
    };
  }, [state.stage1, state.stage2]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: status === 'loading' ? 360 : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: status === 'loading' ? Infinity : 0,
                    ease: 'linear',
                  }}
                >
                  <FileText className="h-6 w-6 text-blue-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {status === 'complete' 
                      ? `Found ${state.stage2?.finalSelected?.toLocaleString() || state.loadedPapers} High-Quality Papers`
                      : 'Searching Academic Databases'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {status === 'complete'
                      ? `From ${state.stage1?.sourcesSearched || 6} academic sources`
                      : status === 'error'
                      ? state.errorMessage || 'An error occurred'
                      : 'Two-stage filtering: Collection → Quality ranking'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Progress Bar */}
            <ProgressBar
              current={state.loadedPapers}
              total={state.targetPapers}
              status={status}
              currentStage={state.currentStage || 1}
              {...(state.visualPercentage !== undefined && { visualPercentage: state.visualPercentage })}
              {...(state.stage1?.totalCollected !== undefined && { stage1TotalCollected: state.stage1.totalCollected })}
              {...(state.stage2?.finalSelected !== undefined && { stage2FinalSelected: state.stage2.finalSelected })}
              {...(state.stage1 && { stage1: state.stage1 })}
            />

            {/* Source breakdown during loading */}
            {state.stage1?.sourceBreakdown && (
              <SourceBreakdown
                sourceBreakdown={state.stage1.sourceBreakdown}
                totalCollected={state.stage1.totalCollected}
                status={status}
              />
            )}

            {/* Cancel Button */}
            {status === 'loading' && onCancel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel Search
                </button>
              </motion.div>
            )}

            {/* Search transparency summary after completion */}
            {searchMetadata && (
              <SearchTransparencySummary
                searchMetadata={searchMetadata}
                status={status}
              />
            )}
           </div>
         </div>
       </motion.div>
     </AnimatePresence>
   );
 };

// ============================================================================
// Export
// ============================================================================

export default ProgressiveLoadingIndicator;
