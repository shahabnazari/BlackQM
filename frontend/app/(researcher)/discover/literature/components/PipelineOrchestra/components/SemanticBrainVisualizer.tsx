/**
 * Phase 10.162: Semantic Ranking Visualizer (Compact Enterprise Design)
 *
 * Clean, compact visualization for the 3-tier semantic ranking process.
 * Designed for maximum information density without sacrificing clarity.
 *
 * @module PipelineOrchestra
 * @since Phase 10.162
 */

'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SemanticBrainVisualizerProps } from '../types';
import type { SemanticTierName } from '@/lib/types/search-stream.types';
import {
  SEMANTIC_TIER_COLORS,
  SEMANTIC_TIER_CONFIG,
  SPRING_PRESETS,
  RANKING_TIER_LIMITS,
} from '../constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_ORDER: readonly SemanticTierName[] = ['immediate', 'refined', 'complete'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface TierAllocation {
  tier: SemanticTierName;
  papersInTier: number;
  displayLabel: string;
}

function calculateTierAllocations(totalPapers: number): TierAllocation[] {
  const quickLimit = RANKING_TIER_LIMITS.immediate.papers;
  const refinedLimit = RANKING_TIER_LIMITS.refined.papers;
  const completeLimit = RANKING_TIER_LIMITS.complete.papers;

  const safeTotalPapers = Math.max(0, totalPapers);
  const effectiveTotal = Math.min(safeTotalPapers, completeLimit);

  const quickPapers = Math.min(quickLimit, effectiveTotal);
  const refinedPapers = Math.max(0, Math.min(refinedLimit, effectiveTotal) - quickLimit);
  const completePapers = Math.max(0, effectiveTotal - refinedLimit);

  return [
    { tier: 'immediate', papersInTier: quickPapers, displayLabel: quickPapers > 0 ? `${quickPapers}` : '—' },
    { tier: 'refined', papersInTier: refinedPapers, displayLabel: refinedPapers > 0 ? `${refinedPapers}` : '—' },
    { tier: 'complete', papersInTier: completePapers, displayLabel: completePapers > 0 ? `${completePapers}` : '—' },
  ];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Compact tier node with inline progress
 */
const TierNode = memo<{
  tier: SemanticTierName;
  allocation: TierAllocation;
  status: 'pending' | 'processing' | 'complete';
  progress: number;
  isHovered: boolean;
  onHover: (tier: SemanticTierName | null) => void;
  onClick: (tier: SemanticTierName) => void;
  reducedMotion: boolean;
}>(function TierNode({
  tier,
  allocation,
  status,
  progress,
  isHovered,
  onHover,
  onClick,
  reducedMotion,
}) {
  // Phase 10.169: Use rich SEMANTIC_TIER_CONFIG for full algorithm details
  const config = SEMANTIC_TIER_CONFIG[tier];
  const color = SEMANTIC_TIER_COLORS[tier];
  const Icon = config.icon;

  const isComplete = status === 'complete' || progress >= 100;
  const isProcessing = status === 'processing' && !isComplete;

  return (
    <motion.button
      className={cn(
        'relative flex flex-col items-center p-2 rounded-lg',
        'min-w-[60px]',
        'bg-white/5 border border-white/10',
        'hover:bg-white/10 hover:border-white/20',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'transition-colors duration-150',
        status === 'pending' && 'opacity-50'
      )}
      onMouseEnter={() => onHover(tier)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(tier)}
      onBlur={() => onHover(null)}
      onClick={() => onClick(tier)}
      type="button"
      aria-label={`${config.displayName}: ${allocation.displayLabel} papers. ${config.description}`}
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center mb-1',
          'transition-colors duration-200'
        )}
        style={{
          backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.2)' : `${color}20`,
        }}
      >
        {isComplete ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : isProcessing ? (
          <Loader2
            className={cn('w-4 h-4', !reducedMotion && 'animate-spin')}
            style={{ color }}
          />
        ) : (
          <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
        )}
      </div>

      {/* Paper Count */}
      <span
        className={cn(
          'text-sm font-bold tabular-nums',
          status === 'pending' && 'text-white/40',
          isProcessing && 'text-white',
          isComplete && 'text-green-400'
        )}
      >
        {allocation.displayLabel}
      </span>

      {/* Tier Label */}
      <span className="text-[9px] text-white/50 uppercase tracking-wide">
        {config.shortName}
      </span>

      {/* Progress Bar (when processing) */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-lg overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Completion Badge */}
      {isComplete && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SPRING_PRESETS.bouncy}
        >
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </motion.div>
      )}

      {/* Phase 10.169: Enhanced tooltip with full algorithm details from SEMANTIC_TIER_CONFIG */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
              'w-64 p-3 rounded-lg',
              'bg-gray-900/95 border border-white/20',
              'shadow-xl backdrop-blur-xl'
            )}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-sm font-semibold text-white">{config.displayName}</span>
            </div>

            {/* Description */}
            <p className="text-[11px] text-white/70 mb-2">{config.description}</p>

            {/* Algorithm Detail */}
            <div className="bg-white/5 rounded-md p-2 mb-2">
              <p className="text-[10px] font-medium text-white/80 mb-1">Algorithm:</p>
              <p className="text-[10px] text-white/60">{config.algorithmDetail}</p>
            </div>

            {/* Why Fast/Slow */}
            <p className="text-[10px] text-purple-300/80 italic mb-2">{config.whyFast}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex flex-col">
                <span className="text-white/50">Paper range:</span>
                <span className="text-white font-medium">{config.paperRange}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/50">Target latency:</span>
                <span className="text-white font-medium">{config.targetLatencyMs < 1000 ? `${config.targetLatencyMs}ms` : `${config.targetLatencyMs / 1000}s`}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/50">Papers in tier:</span>
                <span className="text-white font-medium">{allocation.papersInTier}</span>
              </div>
              {isProcessing && (
                <div className="flex flex-col">
                  <span className="text-white/50">Progress:</span>
                  <span className="font-medium" style={{ color }}>{Math.round(progress)}%</span>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {isComplete && (
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Tier complete</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

/**
 * Arrow connector between tiers
 */
const TierArrow = memo<{
  isActive: boolean;
  color: string;
  reducedMotion: boolean;
}>(function TierArrow({ isActive, color, reducedMotion }) {
  return (
    <div className="flex items-center justify-center w-4 h-full">
      <motion.div
        className={cn('flex items-center', isActive ? 'opacity-100' : 'opacity-30')}
        animate={isActive && !reducedMotion ? { x: [0, 2, 0] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <ChevronRight
          className="w-3 h-3"
          style={{ color: isActive ? color : 'rgba(255,255,255,0.3)' }}
        />
      </motion.div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SemanticBrainVisualizer = memo<SemanticBrainVisualizerProps>(
  function SemanticBrainVisualizer({
    currentTier,
    tierStats,
    papersProcessed,
    totalPapers,
    isProcessing,
    onTierHover,
    onTierClick,
    reducedMotion,
  }) {
    const [hoveredTier, setHoveredTier] = useState<SemanticTierName | null>(null);

    const handleHover = useCallback((tier: SemanticTierName | null) => {
      setHoveredTier(tier);
      onTierHover(tier);
    }, [onTierHover]);

    const allocations = useMemo(
      () => calculateTierAllocations(totalPapers),
      [totalPapers]
    );

    const nodes = useMemo(() => {
      const currentTierOrder = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;

      return TIER_ORDER.map((tier, tierIndex) => {
        const stats = tierStats.get(tier);

        let status: 'pending' | 'processing' | 'complete' = 'pending';
        if (stats?.isComplete) {
          status = 'complete';
        } else if (currentTierOrder >= 0) {
          if (tierIndex < currentTierOrder) status = 'complete';
          else if (tierIndex === currentTierOrder) status = 'processing';
        } else if (stats && stats.progressPercent > 0) {
          status = 'processing';
        }

        return {
          tier,
          status,
          progress: stats?.progressPercent ?? 0,
        };
      });
    }, [tierStats, currentTier]);

    const safePapersProcessed = Math.min(papersProcessed, totalPapers);
    const overallProgress = totalPapers > 0 ? Math.round((safePapersProcessed / totalPapers) * 100) : 0;

    const tierTotals = useMemo(() => {
      const sum = allocations.reduce((acc, a) => acc + a.papersInTier, 0);
      return sum;
    }, [allocations]);

    return (
      <motion.div
        className={cn(
          'flex flex-col gap-2 p-3 rounded-xl',
          'bg-white/5 border border-white/10',
          'backdrop-blur-sm'
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_PRESETS.soft}
        role="region"
        aria-label="3-tier semantic ranking progress"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
              Semantic Ranking
            </span>
          </div>

          {/* Progress Badge */}
          {isProcessing && (
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                animate={reducedMotion ? {} : { scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] text-blue-400 font-medium tabular-nums">
                {overallProgress}%
              </span>
            </div>
          )}
        </div>

        {/* Ranking info */}
        <div className="flex items-center justify-between text-[10px] text-white/50">
          <span>Ranking <span className="text-white font-medium">{totalPapers}</span> papers</span>
          <span className="tabular-nums">{safePapersProcessed}/{totalPapers}</span>
        </div>

        {/* Tier Nodes */}
        <div className="flex items-center justify-center gap-1">
          {nodes.map((node, index) => {
            const allocation = allocations[index];
            if (!allocation) return null;

            const showArrow = index < nodes.length - 1;
            const nextNode = nodes[index + 1];
            const arrowActive = node.status === 'complete' && nextNode?.status === 'processing';

            return (
              <React.Fragment key={node.tier}>
                <TierNode
                  tier={node.tier}
                  allocation={allocation}
                  status={node.status}
                  progress={node.progress}
                  isHovered={hoveredTier === node.tier}
                  onHover={handleHover}
                  onClick={onTierClick}
                  reducedMotion={reducedMotion}
                />
                {showArrow && (
                  <TierArrow
                    isActive={arrowActive}
                    color={SEMANTIC_TIER_COLORS[node.tier]}
                    reducedMotion={reducedMotion}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Tier sum equation */}
        <div className="flex items-center justify-center gap-1 text-[9px] text-white/40">
          <span className="tabular-nums">{allocations[0]?.papersInTier ?? 0}</span>
          <span>+</span>
          <span className="tabular-nums">{allocations[1]?.papersInTier ?? 0}</span>
          <span>+</span>
          <span className="tabular-nums">{allocations[2]?.papersInTier ?? 0}</span>
          <span>=</span>
          <span className="font-semibold text-green-400/70 tabular-nums">{tierTotals}</span>
        </div>

        {/* Screen reader summary */}
        <div className="sr-only" role="status" aria-live="polite">
          Semantic ranking: {safePapersProcessed} of {totalPapers} papers analyzed.
          {nodes.filter(n => n.status === 'complete').length} of 3 tiers complete.
        </div>
      </motion.div>
    );
  }
);

export default SemanticBrainVisualizer;
