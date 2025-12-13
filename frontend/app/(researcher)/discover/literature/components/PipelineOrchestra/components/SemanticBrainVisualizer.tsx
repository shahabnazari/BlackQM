/**
 * Phase 10.126: Semantic Brain Visualizer Component
 *
 * Neural network visualization for the 3-tier semantic ranking process.
 * Shows interconnected nodes with pulsing synapses and progress indicators.
 *
 * Features:
 * - Three-node neural network layout
 * - Animated synapse connections
 * - Progress rings per tier
 * - Cache hit indicators
 * - Tier completion celebrations
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SemanticBrainVisualizerProps, NeuralNodeState } from '../types';
import type { SemanticTierName } from '@/lib/types/search-stream.types';
import {
  SEMANTIC_TIER_COLORS,
  SEMANTIC_TIER_CONFIG,
  SPRING_PRESETS,
  NEURAL_MESH_LAYOUT,
  ARIA_LABELS,
  TOOLTIP_TRANSITIONS,
  DELAYED_TRANSITIONS,
} from '../constants';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Neural node progress ring
 */
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
        // Reduced-motion should still reflect *correct* progress, just without animation.
        animate={{ strokeDashoffset: offset }}
        transition={animate ? SPRING_PRESETS.gentle : { duration: 0 }}
      />
    </svg>
  );
});

/**
 * Synapse connection between nodes
 */
const SynapseConnection = memo<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  dataFlowing: boolean;
  color: string;
  reducedMotion: boolean;
}>(function SynapseConnection({
  fromX,
  fromY,
  toX,
  toY,
  isActive,
  dataFlowing,
  color,
  reducedMotion,
}) {
  const midX = (fromX + toX) / 2;

  return (
    <g>
      {/* Base line */}
      <motion.line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={isActive ? color : 'rgba(255, 255, 255, 0.1)'}
        strokeWidth={isActive ? 2 : 1}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={SPRING_PRESETS.soft}
      />

      {/* Data flow pulse */}
      {dataFlowing && !reducedMotion && (
        <motion.circle
          r={4}
          fill={color}
          initial={{ cx: fromX, cy: fromY, opacity: 0 }}
          animate={{
            cx: [fromX, midX, toX],
            cy: [fromY, fromY, toY],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </g>
  );
});

/**
 * Individual neural node
 */
const NeuralNode = memo<{
  node: NeuralNodeState;
  tierConfig: typeof SEMANTIC_TIER_CONFIG[SemanticTierName];
  color: string;
  onHover: (tier: SemanticTierName | null) => void;
  onClick: (tier: SemanticTierName) => void;
  isHovered: boolean;
  reducedMotion: boolean;
}>(function NeuralNode({
  node,
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

  // Animation variants - memoized for performance (Phase 10.132)
  const nodeVariants = useMemo(() => ({
    pending: { scale: 0.9, opacity: 0.5 },
    processing: { scale: 1, opacity: 1 },
    complete: { scale: 1, opacity: 1 },
  }), []);

  // Pulse animation
  const pulseAnimation = useMemo(() => {
    if (reducedMotion || !isActive) return undefined;
    return {
      boxShadow: [
        `0 0 0 0 ${color}40`,
        `0 0 0 12px ${color}00`,
      ],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeOut' as const,
      },
    };
  }, [isActive, color, reducedMotion]);

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      variants={nodeVariants}
      animate={status}
      transition={SPRING_PRESETS.soft}
    >
      {/* Progress Ring */}
      <ProgressRing
        progress={progress}
        color={color}
        size={size}
        animate={!reducedMotion}
      />

      {/* Main Node - Phase 10.131: Better contrast and sizing */}
      <motion.button
        className={cn(
          'absolute inset-1 rounded-full',
          'flex flex-col items-center justify-center gap-1',
          'backdrop-blur-md border-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'transition-colors duration-200',
          status === 'pending' && 'bg-white/10 border-white/30',
          status === 'processing' && 'bg-white/20 border-current',
          status === 'complete' && 'bg-green-500/20 border-green-400'
        )}
        style={{
          borderColor: status === 'processing' ? color : undefined,
        }}
        {...(!reducedMotion && { whileHover: { scale: 1.05 } })}
        {...(!reducedMotion && { whileTap: { scale: 0.95 } })}
        onMouseEnter={() => onHover(tier)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(tier)}
        onBlur={() => onHover(null)}
        onClick={() => onClick(tier)}
        type="button"
        aria-label={ARIA_LABELS.semanticTier(tierConfig.displayName, status, progress)}
        aria-busy={status === 'processing'}
      >
        {/* Pulse Effect */}
        {isActive && !reducedMotion && pulseAnimation ? (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={pulseAnimation}
          />
        ) : null}

        {/* Icon - Phase 10.131: Larger icons for visibility */}
        {status === 'complete' ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : status === 'processing' ? (
          <Loader2
            className={cn('w-5 h-5', !reducedMotion && 'animate-spin')}
            style={{ color }}
          />
        ) : (
          <Icon className="w-5 h-5 text-white/60" />
        )}

        {/* Short Name - Phase 10.131: Larger, more readable text */}
        <span
          className={cn(
            'text-xs font-bold uppercase tracking-wide', // Phase 10.135: Increased from 10px to 12px for WCAG compliance
            status === 'pending' && 'text-white/60',
            status === 'processing' && 'text-white',
            status === 'complete' && 'text-white/90'
          )}
        >
          {tierConfig.shortName}
        </span>
      </motion.button>

      {/* Status Badge */}
      {status === 'complete' && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SPRING_PRESETS.bouncy}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      )}

      {/* Cache Hit Indicator */}
      {cacheHits > 0 && status === 'complete' && (
        <motion.div
          className="absolute -bottom-1 -left-1 px-1 py-0.5 rounded bg-yellow-500/80 flex items-center gap-0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={DELAYED_TRANSITIONS.bouncyShort}
        >
          <Zap className="w-2 h-2 text-yellow-900" />
          <span className="text-[7px] font-bold text-yellow-900">
            {cacheHits}
          </span>
        </motion.div>
      )}

      {/* Tooltip - Phase 10.133: Fixed positioning - now appears BELOW nodes to avoid overlap with title/badge */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[60]',
              'min-w-[150px] p-2.5 rounded-lg',
              'backdrop-blur-xl bg-gray-900/95 border border-white/20',
              'shadow-xl pointer-events-none'
            )}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={TOOLTIP_TRANSITIONS.fade}
          >
            {/* Arrow pointing UP to the node */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid rgba(17, 24, 39, 0.95)',
              }}
            />

            <p className="text-sm font-semibold text-white mb-1">
              {tierConfig.displayName}
            </p>
            <p className="text-xs text-white/80 mb-2">
              {tierConfig.description}
            </p>

            <div className="space-y-1 text-xs">
              {status === 'complete' && (
                <>
                  <p className="text-green-400 font-medium">
                    {papersProcessed} papers ranked
                  </p>
                  {cacheHits > 0 && (
                    <p className="text-yellow-400 font-medium">
                      {cacheHits} cache hits
                    </p>
                  )}
                  <p className="text-white/70">
                    {(latencyMs / 1000).toFixed(1)}s
                  </p>
                </>
              )}
              {status === 'processing' && (
                <p className="text-blue-400 font-medium">{progress}% complete</p>
              )}
              {status === 'pending' && (
                <p className="text-white/60">Waiting...</p>
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

/**
 * Semantic Brain Visualizer Component
 *
 * Displays the 3-tier semantic ranking process as a neural network.
 *
 * @example
 * ```tsx
 * <SemanticBrainVisualizer
 *   currentTier="refined"
 *   tierStats={tierStatsMap}
 *   papersProcessed={150}
 *   totalPapers={600}
 *   isProcessing={true}
 *   onTierHover={handleHover}
 *   onTierClick={handleClick}
 * />
 * ```
 */
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

    // Handle hover
    const handleHover = useCallback((tier: SemanticTierName | null) => {
      setHoveredTier(tier);
      onTierHover(tier);
    }, [onTierHover]);

    // Derive node states
    const nodes: NeuralNodeState[] = useMemo(() => {
      const tiers: SemanticTierName[] = ['immediate', 'refined', 'complete'];
      const spacing = NEURAL_MESH_LAYOUT.nodeSpacing;

      return tiers.map((tier, index) => {
        const stats = tierStats.get(tier);
        const tierOrder = tiers.indexOf(tier);
        const currentTierOrder = currentTier ? tiers.indexOf(currentTier) : -1;

        let status: 'pending' | 'processing' | 'complete' = 'pending';
        if (stats?.isComplete) {
          status = 'complete';
        } else if (currentTierOrder >= 0) {
          // Earlier tiers should read as complete once we move past them.
          if (tierOrder < currentTierOrder) status = 'complete';
          else if (tierOrder === currentTierOrder) status = 'processing';
          else status = 'pending';
        } else if (stats && !stats.isComplete) {
          // If we have stats for a tier but no currentTier (edge cases), show activity.
          status = stats.progressPercent > 0 ? 'processing' : 'pending';
        }

        return {
          tier,
          position: { x: index * spacing, y: 0 },
          status,
          progress: stats?.progressPercent || 0,
          papersProcessed: stats?.papersProcessed || 0,
          cacheHits: stats?.cacheHits || 0,
          latencyMs: stats?.latencyMs || 0,
          isActive: status === 'processing',
        };
      });
    }, [tierStats, currentTier]);

    // Calculate container dimensions
    const containerWidth = (nodes.length - 1) * NEURAL_MESH_LAYOUT.nodeSpacing +
      NEURAL_MESH_LAYOUT.nodeSize;
    const containerHeight = NEURAL_MESH_LAYOUT.nodeSize + 20;

    return (
      <div
        className="relative flex flex-col items-center overflow-visible"
        role="group"
        aria-label={ARIA_LABELS.semanticBrain}
      >
        {/* Title - Phase 10.132: Improved z-index and visibility */}
        <motion.div
          className="relative z-10 flex items-center gap-2 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_PRESETS.soft}
        >
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white/90 uppercase tracking-wider">
            Semantic Ranking
          </span>
          {isProcessing && !reducedMotion && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Neural Network - Phase 10.133: Added overflow-visible for tooltips */}
        <div
          className="relative overflow-visible"
          style={{ width: containerWidth, height: containerHeight }}
        >
          {/* SVG Connections */}
          <svg
            className="absolute inset-0"
            width={containerWidth}
            height={containerHeight}
            style={{ overflow: 'visible' }}
            aria-hidden="true"
          >
            {nodes.slice(0, -1).map((node, index) => {
              const nextNode = nodes[index + 1];
              // Guard against undefined (TypeScript strictness with slice)
              if (!nextNode) return null;

              const fromX = node.position.x + NEURAL_MESH_LAYOUT.nodeSize / 2;
              const toX = nextNode.position.x + NEURAL_MESH_LAYOUT.nodeSize / 2;
              const y = NEURAL_MESH_LAYOUT.nodeSize / 2;

              return (
                <SynapseConnection
                  key={`synapse-${node.tier}-${nextNode.tier}`}
                  fromX={fromX}
                  fromY={y}
                  toX={toX}
                  toY={y}
                  isActive={node.status === 'complete'}
                  dataFlowing={node.status === 'complete' && nextNode.status === 'processing'}
                  color={SEMANTIC_TIER_COLORS[node.tier]}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          <div className="relative flex items-center justify-between">
            {nodes.map((node) => (
              <NeuralNode
                key={node.tier}
                node={node}
                tierConfig={SEMANTIC_TIER_CONFIG[node.tier]}
                color={SEMANTIC_TIER_COLORS[node.tier]}
                onHover={handleHover}
                onClick={onTierClick}
                isHovered={hoveredTier === node.tier}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-xs text-white/50"> {/* Phase 10.135: Increased from 10px to 12px */}
            {papersProcessed} / {totalPapers} papers analyzed
          </span>
        </motion.div>
      </div>
    );
  }
);

export default SemanticBrainVisualizer;
