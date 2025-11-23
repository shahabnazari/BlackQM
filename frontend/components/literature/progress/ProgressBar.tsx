/**
 * ProgressBar Component
 * Phase 10.91 Day 11 - Component Refactoring
 *
 * Animated progress bar with heat map gradient and dynamic counter.
 * Features:
 * - Two-stage progress (0-50%: Collection, 50-100%: Filtering)
 * - Heat map gradient (Green → Red → Green)
 * - Dynamic counter showing real backend data
 * - Smooth animations with shimmer effect
 *
 * @module progress/ProgressBar
 * @since Phase 10.91 Day 11
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatCount } from './constants';

// ============================================================================
// Types
// ============================================================================

interface ProgressBarProps {
  /** Current progress value */
  current: number;
  /** Total target value */
  total: number;
  /** Loading status */
  status: 'idle' | 'loading' | 'complete' | 'error';
  /** Current stage (1 = collecting, 2 = filtering) */
  currentStage?: 1 | 2;
  /** Smooth time-based percentage for animation (0-100) */
  visualPercentage?: number;
  /** Total papers collected in stage 1 */
  stage1TotalCollected?: number;
  /** Final papers selected in stage 2 */
  stage2FinalSelected?: number;
  /** Stage 1 metadata for source information */
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  };
}

// ============================================================================
// Component
// ============================================================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  status,
  currentStage = 1,
  visualPercentage,
  stage1TotalCollected,
  stage2FinalSelected,
  stage1,
}) => {
  // Edge case handling - Clamp values to safe ranges
  const safeCurrent = Math.max(0, Math.min(current, total));

  // Calculate percentage using time-based animation or fallback
  const percentage = React.useMemo(() => {
    if (visualPercentage !== undefined) {
      // Use smooth time-based percentage
      return Math.max(0, Math.min(100, visualPercentage));
    }
    // Fallback: Calculate from current/total
    const safeTotal = Math.max(1, total);
    const rawPercentage = (safeCurrent / safeTotal) * 100;
    const unclamped = currentStage === 1
      ? rawPercentage / 2              // Stage 1: 0-50%
      : 50 + (rawPercentage / 2);      // Stage 2: 50-100%
    return Math.max(0, Math.min(100, unclamped));
  }, [visualPercentage, safeCurrent, total, currentStage]);

  const isComplete = status === 'complete';

  // Counter shows REAL backend data, no animation until data available
  const displayCount = React.useMemo(() => {
    // If no backend data, return null (waiting for data)
    if (!stage1TotalCollected && !stage2FinalSelected) {
      return null;
    }

    if (isComplete && stage2FinalSelected) {
      // Complete: Show REAL final selected count
      return stage2FinalSelected;
    }

    // Only interpolate if we have REAL backend data
    if (currentStage === 1 && stage1TotalCollected) {
      // Stage 1 (0-50%): Count UP from 0 to stage1TotalCollected
      const stage1Percent = Math.min(1, (percentage / 50));
      const count = Math.round(stage1TotalCollected * stage1Percent);
      return Math.max(0, Math.min(count, stage1TotalCollected));
    } else if (currentStage === 2 && stage1TotalCollected && stage2FinalSelected) {
      // Stage 2 (50-100%): Count DOWN from stage1TotalCollected to stage2FinalSelected
      const stage2Percent = Math.min(1, ((percentage - 50) / 50));
      const count = Math.round(stage1TotalCollected - (stage1TotalCollected - stage2FinalSelected) * stage2Percent);
      return Math.max(stage2FinalSelected, Math.min(count, stage1TotalCollected));
    }

    // Fallback: show actual current if no metadata available
    return safeCurrent;
  }, [isComplete, currentStage, percentage, stage1TotalCollected, stage2FinalSelected, safeCurrent]);

  // Heat map gradient: Light Green → Red (middle) → Green (end)
  const getHeatMapGradient = () => {
    if (isComplete) {
      return 'from-green-400 via-emerald-500 to-green-600';
    }

    if (percentage < 50) {
      // Stage 1: Light Green → Red (heating up)
      if (percentage < 12.5) return 'from-green-300 via-emerald-400 to-teal-400';
      if (percentage < 25) return 'from-teal-400 via-lime-500 to-yellow-400';
      if (percentage < 37.5) return 'from-yellow-400 via-amber-500 to-orange-500';
      return 'from-orange-500 via-red-500 to-red-600';
    } else {
      // Stage 2: Red → Green (cooling down)
      if (percentage < 62.5) return 'from-red-500 via-red-600 to-orange-500';
      if (percentage < 75) return 'from-orange-400 via-amber-500 to-yellow-500';
      if (percentage < 87.5) return 'from-yellow-400 via-lime-500 to-green-400';
      return 'from-green-400 via-emerald-500 to-green-500';
    }
  };

  // Division by zero protection
  if (total === 0 || total < 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-500 text-center py-4">
          Initializing search...
        </div>
      </div>
    );
  }

  // Zero results handling
  if (isComplete && (stage2FinalSelected === 0 || (stage1TotalCollected === 0 && stage2FinalSelected === undefined))) {
    return (
      <div className="space-y-3">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm font-medium text-gray-700">No papers found</div>
          <div className="text-xs text-gray-500 mt-1">Try adjusting your search query</div>
          <div className="text-xs text-gray-400 mt-2">
            • Use broader terms<br/>
            • Check spelling<br/>
            • Try different keywords
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Heat Map Progress Bar with Counter Badge */}
      <div
        className="relative h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-visible shadow-inner"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Search progress: ${Math.round(percentage)}% complete, Stage ${currentStage} of 2`}
      >
        {/* Main progress fill with heat map gradient */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getHeatMapGradient()} shadow-lg`}
        >
          {/* Dynamic counter badge - sticks to end of bar */}
          {displayCount !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                color: isComplete ? '#10b981' : currentStage === 1 ? '#ef4444' : '#10b981',
              }}
              transition={{
                duration: 0.3,
                color: { duration: 0.8, ease: 'easeInOut' },
              }}
              className="absolute -top-8 px-3 py-1 bg-white rounded-full shadow-lg border-2 border-current transition-transform duration-300"
              style={{
                right: percentage < 5 ? '0px' : '-8px',
                transform: percentage < 2 ? 'translateX(-50%)' : 'translateX(0)',
              }}
            >
              <motion.span
                key={displayCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold whitespace-nowrap"
              >
                {formatCount(displayCount)}
                {isComplete && ' 👍'}
              </motion.span>
            </motion.div>
          )}

          {/* Shimmer effect during loading */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 1, x: '-200%' }}
              animate={{
                x: ['-200%', '200%'],
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                x: { duration: 2, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.5 },
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ width: '50%' }}
            />
          )}

          {/* Glow effect */}
          {status === 'loading' && (
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-white/20 rounded-full blur-sm"
            />
          )}
        </motion.div>
      </div>

      {/* Status text and percentage */}
      <div className="flex items-center justify-between">
        <motion.span
          key={`${currentStage}-${Math.round(percentage)}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-semibold text-gray-700"
        >
          {percentage === 0 ? (
            'Starting search...'
          ) : percentage < 1 ? (
            stage1?.sourcesSearched
              ? `Fetching eligible papers from ${stage1.sourcesSearched} sources...`
              : 'Connecting to academic databases...'
          ) : percentage < 49 ? (
            stage1?.sourcesSearched
              ? `Stage 1: Fetching eligible papers from ${stage1.sourcesSearched} sources`
              : 'Stage 1: Fetching eligible papers'
          ) : percentage === 50 || (percentage > 49 && percentage < 51) ? (
            stage1TotalCollected
              ? `✅ Fetched ${stage1TotalCollected.toLocaleString()} papers - Starting quality filtering...`
              : 'Starting quality filtering...'
          ) : percentage < 100 ? (
            'Stage 2: Filtering to highest quality papers'
          ) : (
            stage2FinalSelected
              ? `✅ Finalized ${stage2FinalSelected.toLocaleString()} high-quality papers`
              : 'Search complete!'
          )}
        </motion.span>
        <motion.span
          key={percentage.toFixed(1)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`text-sm font-bold ${
            isComplete ? 'text-green-600' : 'text-blue-600'
          }`}
        >
          {percentage === 0
            ? '0%'
            : percentage < 1
            ? `${percentage.toFixed(1)}%`
            : `${Math.ceil(percentage)}%`
          }
        </motion.span>
      </div>
    </div>
  );
};

export default ProgressBar;
