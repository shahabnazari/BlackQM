/**
 * Phase 10.162: Quality Selection Visualizer (Compact Enterprise Design)
 *
 * Clean, compact visualization for the quality selection stage.
 * Replaces confusing funnel/particle design with clear progress indicator.
 *
 * Shows:
 * - Input/output paper counts in compact format
 * - Quality score as a clean gauge
 * - Selection progress bar
 *
 * @module PipelineOrchestra
 * @since Phase 10.162
 */

'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_PRESETS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface QualityFunnelProps {
  /** Number of papers entering (from semantic ranking) */
  rankedCount: number;
  /** Number of papers selected after quality filter */
  selectedCount: number;
  /** Target maximum papers */
  targetCount: number;
  /** Average quality score (0-1) */
  avgQualityScore: number;
  /** Whether quality selection is in progress */
  isSelecting: boolean;
  /** Whether quality selection is complete */
  isComplete: boolean;
  /** Respect reduced motion preferences */
  reducedMotion: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUALITY_THRESHOLDS = {
  excellent: { min: 0.7, color: '#22c55e', label: 'High' },
  good: { min: 0.5, color: '#84cc16', label: 'Good' },
  moderate: { min: 0.3, color: '#eab308', label: 'Fair' },
  low: { min: 0, color: '#f97316', label: 'Low' },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getQualityInfo(score: number): { color: string; label: string } {
  if (score >= QUALITY_THRESHOLDS.excellent.min) return QUALITY_THRESHOLDS.excellent;
  if (score >= QUALITY_THRESHOLDS.good.min) return QUALITY_THRESHOLDS.good;
  if (score >= QUALITY_THRESHOLDS.moderate.min) return QUALITY_THRESHOLDS.moderate;
  return QUALITY_THRESHOLDS.low;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Quality Selection Visualizer - Compact Enterprise Design
 *
 * Clean, space-efficient display of quality filtering results.
 * No confusing animations - just clear data.
 */
export const QualityFunnelVisualizer = memo<QualityFunnelProps>(
  function QualityFunnelVisualizer({
    rankedCount,
    selectedCount,
    targetCount: _targetCount,
    avgQualityScore,
    isSelecting,
    isComplete,
    reducedMotion,
  }) {
    const qualityInfo = useMemo(() => getQualityInfo(avgQualityScore), [avgQualityScore]);
    const reductionPercent = useMemo(() =>
      rankedCount > 0 ? Math.round((1 - selectedCount / rankedCount) * 100) : 0,
      [rankedCount, selectedCount]
    );
    const qualityPercent = Math.round(avgQualityScore * 100);
    const isActive = isSelecting || isComplete;

    return (
      <motion.div
        className={cn(
          'flex flex-col gap-2 p-3 rounded-xl',
          'bg-white/5 border border-white/10',
          'backdrop-blur-sm',
          'min-w-[180px]',
          !isActive && 'opacity-50'
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_PRESETS.soft}
        role="region"
        aria-label={
          isComplete
            ? `Quality selection complete: ${selectedCount} papers selected with ${qualityPercent}% quality`
            : isSelecting
            ? `Filtering ${rankedCount} papers...`
            : 'Quality selection pending'
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center',
              isComplete ? 'bg-green-500/20' : 'bg-purple-500/20'
            )}>
              {isComplete ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : isSelecting ? (
                <Loader2 className={cn('w-3.5 h-3.5 text-purple-400', !reducedMotion && 'animate-spin')} />
              ) : (
                <Filter className="w-3.5 h-3.5 text-purple-400" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
              Quality Filter
            </span>
          </div>

          {/* Status Badge */}
          {isComplete && (
            <motion.span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Done
            </motion.span>
          )}
        </div>

        {/* Flow Display: Input → Output */}
        <div className="flex items-center justify-between gap-2">
          {/* Input Count */}
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-lg font-bold text-white tabular-nums">
              {rankedCount}
            </span>
            <span className="text-[9px] text-white/50 uppercase">In</span>
          </div>

          {/* Arrow with reduction */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <ArrowDown className="w-4 h-4 text-white/30" />
            {isActive && reductionPercent > 0 && (
              <span className="text-[9px] font-medium text-purple-400">
                -{reductionPercent}%
              </span>
            )}
          </div>

          {/* Output Count */}
          <div className="flex flex-col items-center min-w-[50px]">
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: isComplete ? '#22c55e' : 'white' }}
            >
              {selectedCount}
            </span>
            <span className="text-[9px] text-white/50 uppercase">Out</span>
          </div>
        </div>

        {/* Quality Score Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-white/50">Quality Score</span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: qualityInfo.color }}
            >
              {qualityPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: qualityInfo.color }}
              initial={{ width: 0 }}
              animate={{ width: `${qualityPercent}%` }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Quality Label */}
          <div className="flex justify-end">
            <span
              className="text-[9px] font-medium"
              style={{ color: qualityInfo.color }}
            >
              {qualityInfo.label} Quality
            </span>
          </div>
        </div>

        {/* Processing Indicator */}
        <AnimatePresence>
          {isSelecting && !isComplete && (
            <motion.div
              className="flex items-center justify-center gap-1.5 pt-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.div
                className="w-1 h-1 rounded-full bg-purple-400"
                animate={reducedMotion ? {} : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] text-purple-400">
                Filtering...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export default QualityFunnelVisualizer;
