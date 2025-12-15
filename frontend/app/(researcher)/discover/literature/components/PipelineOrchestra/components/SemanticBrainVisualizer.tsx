/**
 * Phase 10.126: Semantic Brain Visualizer Component
 * Phase 10.147: Enterprise-Grade Optimization
 * Phase 10.150: User-Journey-Driven Redesign
 * Phase 10.151: WCAG 2.1 AA Compliance & Bug Fixes
 *
 * Neural network visualization for the 3-tier semantic ranking process.
 *
 * Phase 10.151 Fixes:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. FIX: papersProcessed > totalPapers bug (400/300)
 * 2. FIX: Tooltip works on hover at ANY state (not just complete)
 * 3. FIX: 100/100 with spinner - show complete state if at 100%
 * 4. ADD: WCAG 2.1 AA compliance (aria, focus, contrast)
 * 5. IMPROVE: Progress display clarity
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 * @updated Phase 10.151 - WCAG compliance and bug fixes
 */

'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, Loader2, ChevronRight, Clock, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SemanticBrainVisualizerProps, NeuralNodeState } from '../types';
import type { SemanticTierName } from '@/lib/types/search-stream.types';
import {
  SEMANTIC_TIER_COLORS,
  SEMANTIC_TIER_CONFIG,
  SPRING_PRESETS,
  NEURAL_MESH_LAYOUT,
  TOOLTIP_TRANSITIONS,
  DELAYED_TRANSITIONS,
  RANKING_TIER_LIMITS,
} from '../constants';

// ============================================================================
// PHASE 10.150/10.151: TIER CAPACITY CALCULATION
// ============================================================================

interface TierAllocation {
  tier: SemanticTierName;
  papersInTier: number;
  startPosition: number;
  endPosition: number;
  isFirstTier: boolean;
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

  // Phase 10.153: Calculate cumulative totals for clearer display
  // Shows "TOP 50", "TOP 200", "ALL 600" instead of confusing deltas like "+150", "+400"
  const refinedCumulative = quickLimit + refinedPapers;
  const completeCumulative = refinedLimit + completePapers;

  return [
    {
      tier: 'immediate',
      papersInTier: quickPapers,
      startPosition: 1,
      endPosition: Math.max(1, quickPapers),
      isFirstTier: true,
      // "TOP 50" - shows this tier ranks the first 50 papers
      displayLabel: quickPapers > 0 ? `TOP ${quickPapers}` : '—',
    },
    {
      tier: 'refined',
      papersInTier: refinedPapers,
      startPosition: quickLimit + 1,
      endPosition: refinedPapers > 0 ? quickLimit + refinedPapers : quickLimit + 1,
      isFirstTier: false,
      // "TOP 200" - shows this tier ranks up to top 200 papers (clearer than "+150")
      displayLabel: refinedPapers > 0 ? `TOP ${refinedCumulative}` : '—',
    },
    {
      tier: 'complete',
      papersInTier: completePapers,
      startPosition: refinedLimit + 1,
      endPosition: completePapers > 0 ? refinedLimit + completePapers : refinedLimit + 1,
      isFirstTier: false,
      // "ALL 600" - shows this tier ranks all papers up to 600 (clearer than "+400")
      displayLabel: completePapers > 0 ? `ALL ${completeCumulative}` : '—',
    },
  ];
}

// ============================================================================
// MEMOIZED STYLE OBJECTS
// ============================================================================

const TOOLTIP_ARROW_STYLE = Object.freeze({
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderBottom: '6px solid rgba(17, 24, 39, 0.98)',
});

const PROCESSING_INDICATOR_ANIMATION = Object.freeze({
  scale: [1, 1.2, 1],
  opacity: [1, 0.6, 1],
});

const PROCESSING_INDICATOR_TRANSITION = Object.freeze({
  duration: 1,
  repeat: Infinity,
});

const TIER_ORDER: readonly SemanticTierName[] = Object.freeze(['immediate', 'refined', 'complete']);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ProgressRing = memo<{
  progress: number;
  color: string;
  size: number;
  animate: boolean;
}>(function ProgressRing({ progress, color, size, animate }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className="absolute inset-0 -rotate-90"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={animate ? SPRING_PRESETS.gentle : { duration: 0 }}
      />
    </svg>
  );
});

/**
 * Phase 10.150: Directional arrow between tiers
 */
const TierArrow = memo<{
  isActive: boolean;
  isFlowing: boolean;
  color: string;
  reducedMotion: boolean;
}>(function TierArrow({ isActive, isFlowing, color, reducedMotion }) {
  const shouldAnimate = isFlowing && !reducedMotion;

  return (
    <div
      className="flex items-center justify-center w-6 h-6 mx-0.5"
      aria-hidden="true"
    >
      <motion.div
        className={cn(
          'flex items-center justify-center',
          isActive ? 'opacity-100' : 'opacity-30'
        )}
        animate={shouldAnimate ? { x: [0, 3, 0] } : { x: 0 }}
        transition={shouldAnimate ? { duration: 0.8, repeat: Infinity } : { duration: 0 }}
      >
        <ChevronRight
          className="w-4 h-4"
          style={{ color: isActive ? color : 'rgba(255,255,255,0.3)' }}
        />
      </motion.div>
    </div>
  );
});

/**
 * Phase 10.151: Enhanced Neural Node with WCAG compliance
 */
const NeuralNode = memo<{
  node: NeuralNodeState;
  allocation: TierAllocation;
  tierConfig: typeof SEMANTIC_TIER_CONFIG[SemanticTierName];
  color: string;
  onHover: (tier: SemanticTierName | null) => void;
  onClick: (tier: SemanticTierName) => void;
  isHovered: boolean;
  reducedMotion: boolean;
}>(function NeuralNode({
  node,
  allocation,
  tierConfig,
  color,
  onHover,
  onClick,
  isHovered,
  reducedMotion,
}) {
  const { tier, status, progress, papersProcessed, cacheHits, latencyMs, isActive } = node;
  const size = NEURAL_MESH_LAYOUT.nodeSize;
  const Icon = tierConfig.icon;

  // Phase 10.151 FIX: If progress is 100%, treat as complete for display purposes
  const effectiveStatus = progress >= 100 && status === 'processing' ? 'complete' : status;
  const isEffectivelyComplete = effectiveStatus === 'complete';

  const nodeVariants = useMemo(() => ({
    pending: { scale: 0.9, opacity: 0.5 },
    processing: { scale: 1, opacity: 1 },
    complete: { scale: 1, opacity: 1 },
  }), []);

  const pulseAnimation = useMemo(() => {
    if (reducedMotion || !isActive || isEffectivelyComplete) return undefined;
    return {
      boxShadow: [
        `0 0 0 0 ${color}40`,
        `0 0 0 10px ${color}00`,
      ],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeOut' as const,
      },
    };
  }, [isActive, isEffectivelyComplete, color, reducedMotion]);

  // Phase 10.151 FIX: Calculate tier-specific progress correctly
  const tierProgress = useMemo(() => {
    if (allocation.papersInTier === 0) return { processed: 0, total: 0, percent: 0 };
    // Cap processed at the tier's allocation
    const processed = Math.min(papersProcessed, allocation.papersInTier);
    return {
      processed,
      total: allocation.papersInTier,
      percent: Math.round((processed / allocation.papersInTier) * 100),
    };
  }, [papersProcessed, allocation.papersInTier]);

  // Phase 10.151: WCAG accessible status description
  const statusDescription = useMemo(() => {
    if (isEffectivelyComplete) {
      return `Complete. ${tierProgress.total} papers ranked in ${(latencyMs / 1000).toFixed(1)} seconds`;
    }
    if (status === 'processing') {
      return `Processing. ${tierProgress.processed} of ${tierProgress.total} papers ranked (${tierProgress.percent}%)`;
    }
    return 'Waiting for previous tier to complete';
  }, [isEffectivelyComplete, status, tierProgress, latencyMs]);

  return (
    <motion.div
      className="relative flex flex-col items-center"
      style={{ width: size + 16 }}
      variants={nodeVariants}
      animate={effectiveStatus}
      transition={SPRING_PRESETS.soft}
    >
      {/* The Node */}
      <div className="relative" style={{ width: size, height: size }}>
        <ProgressRing
          progress={isEffectivelyComplete ? 100 : (status === 'processing' ? progress : 0)}
          color={color}
          size={size}
          animate={!reducedMotion}
        />

        {/* Phase 10.151: WCAG-compliant button with proper focus states */}
        <motion.button
          className={cn(
            'absolute inset-1 rounded-full',
            'flex flex-col items-center justify-center',
            'backdrop-blur-md border-2',
            // Phase 10.151: High contrast focus ring for WCAG 2.4.7
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
            'transition-colors duration-200',
            status === 'pending' && 'bg-white/10 border-white/30',
            status === 'processing' && !isEffectivelyComplete && 'bg-white/20 border-current',
            isEffectivelyComplete && 'bg-green-500/20 border-green-400'
          )}
          style={{
            borderColor: status === 'processing' && !isEffectivelyComplete ? color : undefined,
          }}
          {...(!reducedMotion && { whileHover: { scale: 1.05 } })}
          {...(!reducedMotion && { whileTap: { scale: 0.95 } })}
          onMouseEnter={() => onHover(tier)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(tier)}
          onBlur={() => onHover(null)}
          onClick={() => onClick(tier)}
          type="button"
          // Phase 10.151: WCAG 4.1.2 - Proper accessible name and description
          aria-label={`${tierConfig.displayName}: ${allocation.displayLabel} papers`}
          aria-describedby={`tier-${tier}-status`}
          aria-busy={status === 'processing' && !isEffectivelyComplete}
        >
          {/* Hidden status for screen readers */}
          <span id={`tier-${tier}-status`} className="sr-only">
            {statusDescription}
          </span>

          {/* Pulse Effect */}
          {isActive && !isEffectivelyComplete && !reducedMotion && pulseAnimation ? (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={pulseAnimation}
              aria-hidden="true"
            />
          ) : null}

          {/* Paper count label */}
          <span
            className={cn(
              'text-sm font-bold tabular-nums leading-tight',
              status === 'pending' && 'text-white/50',
              status === 'processing' && !isEffectivelyComplete && 'text-white',
              isEffectivelyComplete && 'text-green-400'
            )}
            aria-hidden="true"
          >
            {allocation.displayLabel}
          </span>

          {/* Status indicator */}
          <div className="mt-0.5" aria-hidden="true">
            {isEffectivelyComplete ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : status === 'processing' ? (
              <Loader2
                className={cn('w-3.5 h-3.5', !reducedMotion && 'animate-spin')}
                style={{ color }}
              />
            ) : (
              <Clock className="w-3.5 h-3.5 text-white/40" />
            )}
          </div>
        </motion.button>

        {/* Completion Badge */}
        {isEffectivelyComplete && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING_PRESETS.bouncy}
            aria-hidden="true"
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}

        {/* Cache Hit Indicator */}
        {cacheHits > 0 && isEffectivelyComplete && (
          <motion.div
            className="absolute -bottom-1 -left-1 px-1 py-0.5 rounded bg-yellow-500/80 flex items-center gap-0.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={DELAYED_TRANSITIONS.bouncyShort}
            role="img"
            aria-label={`${cacheHits} cached results used`}
          >
            <Zap className="w-2 h-2 text-yellow-900" aria-hidden="true" />
            <span className="text-[7px] font-bold text-yellow-900">
              {cacheHits}
            </span>
          </motion.div>
        )}
      </div>

      {/* Tier label BELOW the node */}
      <div className="mt-1.5 text-center" aria-hidden="true">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wider block',
            status === 'pending' && 'text-white/40',
            status === 'processing' && !isEffectivelyComplete && 'text-white/80',
            isEffectivelyComplete && 'text-green-400/80'
          )}
        >
          {tierConfig.shortName}
        </span>
        {/* Phase 10.151: Clearer progress display */}
        {status === 'processing' && !isEffectivelyComplete && tierProgress.total > 0 && (
          <span className="text-[9px] text-white/50 tabular-nums block">
            {tierProgress.percent}%
          </span>
        )}
        {isEffectivelyComplete && (
          <span className="text-[9px] text-green-400/60 tabular-nums block">
            ✓ done
          </span>
        )}
        {status === 'pending' && (
          <span className="text-[9px] text-white/30 block">
            waiting
          </span>
        )}
      </div>

      {/* Phase 10.151: Tooltip that works on ANY hover state */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 mt-10 z-[60]',
              'w-[280px] p-3 rounded-xl',
              'backdrop-blur-xl bg-gray-900/98 border border-white/20',
              'shadow-2xl'
            )}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={TOOLTIP_TRANSITIONS.fade}
            role="tooltip"
            id={`tooltip-${tier}`}
          >
            {/* Arrow */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px"
              style={TOOLTIP_ARROW_STYLE}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {tierConfig.displayName}
                  </p>
                  {allocation.papersInTier > 0 ? (
                    <p className="text-[10px] text-white/50">
                      Papers {allocation.startPosition}-{allocation.endPosition}
                    </p>
                  ) : (
                    <p className="text-[10px] text-white/40 italic">
                      No papers in this tier
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color }}>
                  {allocation.papersInTier}
                </p>
                <p className="text-[10px] text-white/50 uppercase">papers</p>
              </div>
            </div>

            {/* Algorithm explanation */}
            <div className="mb-2">
              <p className="text-xs text-white/90 leading-relaxed mb-1.5">
                {tierConfig.description}
              </p>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 flex items-start gap-2">
                <Cpu className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-[10px] text-cyan-400 font-mono leading-relaxed">
                  {tierConfig.algorithmDetail}
                </p>
              </div>
            </div>

            {/* Why explanation */}
            <p className="text-[10px] text-white/50 italic mb-2">
              💡 {tierConfig.whyFast}
            </p>

            {/* Status-specific stats - Phase 10.151: ALWAYS show stats regardless of status */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-white/10">
              {isEffectivelyComplete ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Papers ranked:</span>
                    <span className="text-green-400 font-semibold">{tierProgress.total}</span>
                  </div>
                  {cacheHits > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Cache hits:</span>
                      <span className="text-yellow-400 font-semibold">{cacheHits}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Time taken:</span>
                    <span className="text-white/90 font-mono">{(latencyMs / 1000).toFixed(1)}s</span>
                  </div>
                </>
              ) : status === 'processing' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Progress:</span>
                    <span className="text-blue-400 font-semibold">
                      {tierProgress.processed} / {tierProgress.total} ({tierProgress.percent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Expected time:</span>
                    <span className="text-white/60 font-mono">~{tierConfig.targetLatencyMs / 1000}s</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Papers to rank:</span>
                    <span className="text-white/60">{allocation.papersInTier}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Expected time:</span>
                    <span className="text-white/60 font-mono">~{tierConfig.targetLatencyMs / 1000}s</span>
                  </div>
                  <p className="text-white/40 text-center pt-1 text-[10px]">
                    ⏳ Waiting for previous tier...
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

    const nodes: NeuralNodeState[] = useMemo(() => {
      const spacing = NEURAL_MESH_LAYOUT.nodeSpacing;
      const currentTierOrder = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;

      return TIER_ORDER.map((tier, tierIndex) => {
        const stats = tierStats.get(tier);

        let status: 'pending' | 'processing' | 'complete' = 'pending';
        if (stats?.isComplete) {
          status = 'complete';
        } else if (currentTierOrder >= 0) {
          if (tierIndex < currentTierOrder) status = 'complete';
          else if (tierIndex === currentTierOrder) status = 'processing';
          else status = 'pending';
        } else if (stats && !stats.isComplete) {
          status = stats.progressPercent > 0 ? 'processing' : 'pending';
        }

        return {
          tier,
          position: { x: tierIndex * spacing, y: 0 },
          status,
          progress: stats?.progressPercent ?? 0,
          papersProcessed: stats?.papersProcessed ?? 0,
          cacheHits: stats?.cacheHits ?? 0,
          latencyMs: stats?.latencyMs ?? 0,
          isActive: status === 'processing',
        };
      });
    }, [tierStats, currentTier]);

    const tierTotals = useMemo(() => {
      const sum = allocations.reduce((acc, a) => acc + a.papersInTier, 0);
      return { sum, matches: sum === Math.min(totalPapers, RANKING_TIER_LIMITS.complete.papers) };
    }, [allocations, totalPapers]);

    // Phase 10.151 FIX: Cap papersProcessed at totalPapers to prevent 400/300 bug
    const safePapersProcessed = Math.min(papersProcessed, totalPapers);

    // Phase 10.151: Calculate overall progress percentage
    const overallProgress = useMemo(() => {
      if (totalPapers === 0) return 0;
      return Math.round((safePapersProcessed / totalPapers) * 100);
    }, [safePapersProcessed, totalPapers]);

    return (
      <div
        className="relative flex flex-col items-center overflow-visible"
        role="region"
        aria-label="3-tier semantic ranking progress"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-white/70">
            Ranking <span className="text-white font-semibold">{totalPapers}</span> papers
          </p>
        </motion.div>

        {/* Processing indicator */}
        {isProcessing && !reducedMotion && (
          <motion.div
            className="flex items-center gap-2 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="status"
            aria-live="polite"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={PROCESSING_INDICATOR_ANIMATION}
              transition={PROCESSING_INDICATOR_TRANSITION}
              aria-hidden="true"
            />
            <span className="text-xs text-blue-400 font-medium">
              {overallProgress}% complete
            </span>
          </motion.div>
        )}

        {/* Tier nodes */}
        <div
          className="flex items-start justify-center overflow-visible"
          role="list"
          aria-label="Ranking tiers"
        >
          {nodes.map((node, index) => {
            const allocation = allocations[index];
            const nextNode = nodes[index + 1];
            const showArrow = index < nodes.length - 1;

            if (!allocation) return null;

            const arrowActive = node.status === 'complete' || (node.progress >= 100);
            const arrowFlowing = arrowActive && nextNode?.status === 'processing';

            return (
              <React.Fragment key={node.tier}>
                <div role="listitem">
                  <NeuralNode
                    node={node}
                    allocation={allocation}
                    tierConfig={SEMANTIC_TIER_CONFIG[node.tier]}
                    color={SEMANTIC_TIER_COLORS[node.tier]}
                    onHover={handleHover}
                    onClick={onTierClick}
                    isHovered={hoveredTier === node.tier}
                    reducedMotion={reducedMotion}
                  />
                </div>
                {showArrow && (
                  <TierArrow
                    isActive={arrowActive}
                    isFlowing={arrowFlowing}
                    color={SEMANTIC_TIER_COLORS[node.tier]}
                    reducedMotion={reducedMotion}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Math equation */}
        {totalPapers > 0 && (
          <motion.div
            className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            aria-hidden="true"
          >
            <span className="tabular-nums">{allocations[0]?.papersInTier ?? 0}</span>
            <span>+</span>
            <span className="tabular-nums">{allocations[1]?.papersInTier ?? 0}</span>
            <span>+</span>
            <span className="tabular-nums">{allocations[2]?.papersInTier ?? 0}</span>
            <span>=</span>
            <span className={cn(
              'font-semibold',
              tierTotals.matches ? 'text-green-400/70' : 'text-yellow-400/70'
            )}>
              {tierTotals.sum} {tierTotals.matches && '✓'}
            </span>
          </motion.div>
        )}

        {/* Progress Summary - Phase 10.151 FIX: Use capped value */}
        <motion.div
          className="mt-1.5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-[11px] text-white/50">
            {safePapersProcessed} / {totalPapers} analyzed
          </span>
        </motion.div>

        {/* Screen reader summary */}
        <div className="sr-only" role="status" aria-live="polite">
          Semantic ranking: {safePapersProcessed} of {totalPapers} papers analyzed.
          {nodes.filter(n => n.status === 'complete').length} of 3 tiers complete.
        </div>
      </div>
    );
  }
);

export default SemanticBrainVisualizer;
