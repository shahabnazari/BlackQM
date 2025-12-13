/**
 * Phase 10.126: Source Node Component
 *
 * Individual source node in the orbital constellation with status animations,
 * paper count badges, and interactive tooltips.
 *
 * Features:
 * - Status-based animations (pulse, spin, shake)
 * - Paper count badge with animation
 * - Hover tooltip with detailed stats
 * - Tier-based coloring
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceNodeState, Point } from '../types';
import type { LiteratureSource } from '@/lib/types/search-stream.types';
import {
  SPRING_PRESETS,
  TIER_COLORS,
  SOURCE_COLORS,
  SOURCE_DISPLAY_NAMES,
  SOURCE_NODE_SIZE,
  SOURCE_GLOW_CONFIG,
  ARIA_LABELS,
  TOOLTIP_TRANSITIONS,
} from '../constants';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Paper count badge
 */
const PaperCountBadge = memo<{
  count: number;
  animate: boolean;
}>(function PaperCountBadge({ count, animate }) {
  if (count === 0) return null;

  return (
    <motion.div
      className={cn(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
        'flex items-center justify-center',
        'rounded-full bg-white text-gray-900',
        'text-xs font-bold shadow-md' // Phase 10.135: Increased from 10px to 12px for WCAG compliance
      )}
      initial={animate ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={SPRING_PRESETS.bouncy}
    >
      {count > 999 ? '999+' : count}
    </motion.div>
  );
});

/**
 * Status indicator
 */
const StatusIndicator = memo<{
  status: SourceNodeState['status'];
  animate: boolean;
}>(function StatusIndicator({ status, animate }) {
  if (status === 'pending') return null;

  return (
    <motion.div
      className={cn(
        'absolute -bottom-0.5 -right-0.5 w-4 h-4',
        'flex items-center justify-center',
        'rounded-full shadow-sm',
        status === 'complete' && 'bg-green-500',
        status === 'error' && 'bg-red-500',
        status === 'searching' && 'bg-blue-500',
        status === 'skipped' && 'bg-gray-500'
      )}
      initial={animate ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={SPRING_PRESETS.bouncy}
    >
      {status === 'complete' && <Check className="w-2.5 h-2.5 text-white" />}
      {status === 'error' && <AlertCircle className="w-2.5 h-2.5 text-white" />}
      {status === 'searching' && (
        <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
      )}
    </motion.div>
  );
});

/**
 * Smart tooltip with viewport-aware positioning
 * Phase 10.129: Netflix-grade tooltip positioning that stays within viewport
 */
const SourceTooltip = memo<{
  source: LiteratureSource;
  status: SourceNodeState['status'];
  paperCount: number;
  timeMs: number;
  error?: string;
  nodePosition: Point; // Position of node relative to container center
  containerSize: { width: number; height: number };
}>(function SourceTooltip({ source, status, paperCount, timeMs, error, nodePosition, containerSize }) {
  const displayName = SOURCE_DISPLAY_NAMES[source] || source;

  // Smart positioning: determine if tooltip should appear above/below and adjust horizontal
  const isNearTop = nodePosition.y < containerSize.height * 0.35;
  const isNearLeft = nodePosition.x < containerSize.width * 0.3;
  const isNearRight = nodePosition.x > containerSize.width * 0.7;

  // Determine vertical position
  const showBelow = isNearTop;

  // Determine horizontal alignment
  const horizontalAlign = isNearLeft ? 'left' : isNearRight ? 'right' : 'center';

  const positionClasses = cn(
    'absolute z-[60] min-w-[160px] p-2.5 rounded-lg', // Phase 10.131: Wider with more padding
    'backdrop-blur-xl bg-gray-900/95 border border-white/20',
    'shadow-xl pointer-events-none',
    // Vertical positioning
    showBelow ? 'top-full mt-2' : 'bottom-full mb-2',
    // Horizontal positioning
    horizontalAlign === 'center' && 'left-1/2 -translate-x-1/2',
    horizontalAlign === 'left' && 'left-0',
    horizontalAlign === 'right' && 'right-0'
  );

  // Arrow position adjustments
  const arrowClasses = cn(
    'absolute -mt-px',
    showBelow ? 'bottom-full' : 'top-full',
    horizontalAlign === 'center' && 'left-1/2 -translate-x-1/2',
    horizontalAlign === 'left' && 'left-4',
    horizontalAlign === 'right' && 'right-4'
  );

  const arrowStyle = showBelow
    ? {
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '6px solid rgba(17, 24, 39, 0.95)',
      }
    : {
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid rgba(17, 24, 39, 0.95)',
      };

  return (
    <motion.div
      className={positionClasses}
      initial={{ opacity: 0, y: showBelow ? -5 : 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: showBelow ? -5 : 5, scale: 0.95 }}
      transition={TOOLTIP_TRANSITIONS.fade}
      // Phase 10.130: WCAG tooltip accessibility
      role="tooltip"
      id={`source-tooltip-${source}`}
      aria-hidden={false}
    >
      {/* Arrow */}
      <div className={arrowClasses} style={arrowStyle} aria-hidden="true" />

      {/* Content - Phase 10.131: Improved readability */}
      <p className="text-sm font-semibold text-white mb-1.5">{displayName}</p>

      <div className="space-y-1 text-xs">
        {status === 'complete' && (
          <>
            <p className="text-green-400 font-medium">
              {paperCount} paper{paperCount !== 1 ? 's' : ''} found
            </p>
            <p className="text-white/70">{(timeMs / 1000).toFixed(1)}s</p>
          </>
        )}
        {status === 'searching' && (
          <p className="text-blue-400 font-medium" aria-live="polite">Searching...</p>
        )}
        {status === 'pending' && (
          <p className="text-white/60">Waiting...</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 font-medium" role="alert">{error || 'Failed'}</p>
        )}
        {status === 'skipped' && (
          <p className="text-white/60">Skipped</p>
        )}
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SourceNodeProps {
  nodeState: SourceNodeState;
  centerPosition: Point;
  containerSize: { width: number; height: number }; // Phase 10.129: For smart tooltip positioning
  onHover: (source: LiteratureSource | null) => void;
  onClick: (source: LiteratureSource) => void;
  reducedMotion: boolean;
  isHovered: boolean;
}

/**
 * Source Node Component
 *
 * Individual node in the orbital source constellation.
 *
 * @example
 * ```tsx
 * <SourceNode
 *   nodeState={sourceState}
 *   centerPosition={{ x: 200, y: 200 }}
 *   onHover={handleHover}
 *   onClick={handleClick}
 *   reducedMotion={false}
 *   isHovered={hoveredSource === source}
 * />
 * ```
 */
export const SourceNode = memo<SourceNodeProps>(function SourceNode({
  nodeState,
  centerPosition: _centerPosition,
  containerSize,
  onHover,
  onClick,
  reducedMotion,
  isHovered,
}) {
  const {
    source,
    tier,
    status,
    position,
    paperCount,
    timeMs,
    error,
  } = nodeState;

  // Get colors
  const tierColor = TIER_COLORS[tier];
  const sourceColor = SOURCE_COLORS[source] || tierColor;

  // Calculate node size based on paper count
  const nodeSize = useMemo(() => {
    const countFactor = Math.min(paperCount / SOURCE_NODE_SIZE.scaleThreshold, 1);
    return SOURCE_NODE_SIZE.base + countFactor * (SOURCE_NODE_SIZE.max - SOURCE_NODE_SIZE.base);
  }, [paperCount]);

  // Phase 10.127: Calculate dynamic glow intensity based on paper yield
  const glowStyle = useMemo(() => {
    if (status !== 'complete' || paperCount === 0) {
      return {};
    }

    const { thresholds, minOpacity, maxOpacity, minBlur, maxBlur } = SOURCE_GLOW_CONFIG;
    let intensity: number;

    if (paperCount < thresholds.low) {
      intensity = 0.2;
    } else if (paperCount < thresholds.medium) {
      intensity = 0.2 + ((paperCount - thresholds.low) / (thresholds.medium - thresholds.low)) * 0.4;
    } else if (paperCount < thresholds.high) {
      intensity = 0.6 + ((paperCount - thresholds.medium) / (thresholds.high - thresholds.medium)) * 0.3;
    } else {
      intensity = 1;
    }

    const opacity = minOpacity + intensity * (maxOpacity - minOpacity);
    const blur = minBlur + intensity * (maxBlur - minBlur);

    return {
      boxShadow: `0 0 ${blur}px ${blur / 2}px ${sourceColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    };
  }, [status, paperCount, sourceColor]);

  // Animation variants
  const nodeVariants = useMemo(() => ({
    pending: {
      scale: 0.8,
      opacity: 0.4,
    },
    searching: {
      scale: 1,
      opacity: 1,
    },
    complete: {
      scale: 1,
      opacity: 1,
    },
    error: {
      scale: 0.9,
      opacity: 0.7,
    },
    skipped: {
      scale: 0.7,
      opacity: 0.3,
    },
  }), []);

  // Pulse animation for searching state
  const pulseAnimation = useMemo(() => {
    if (reducedMotion || status !== 'searching') return undefined;
    return {
      boxShadow: [
        `0 0 0 0 ${sourceColor}60`,
        `0 0 0 10px ${sourceColor}00`,
      ],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeOut' as const,
      },
    };
  }, [status, sourceColor, reducedMotion]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x - nodeSize / 2,
        top: position.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, ...SPRING_PRESETS.soft }}
    >
      {/* Main Node - Phase 10.130: Enhanced WCAG accessibility */}
      <motion.button
        className={cn(
          'w-full h-full rounded-full',
          'flex items-center justify-center',
          'backdrop-blur-md border-2',
          // Phase 10.130: Enhanced focus ring for keyboard navigation
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          'transition-all duration-200',
          status === 'pending' && 'bg-white/5 border-white/10',
          status === 'searching' && 'bg-white/15 border-current',
          status === 'complete' && 'bg-white/10 border-current',
          status === 'error' && 'bg-red-500/20 border-red-500/50',
          status === 'skipped' && 'bg-white/5 border-white/10'
        )}
        style={{
          borderColor: status === 'searching' || status === 'complete'
            ? sourceColor
            : undefined,
          ...glowStyle, // Phase 10.127: Dynamic glow based on paper yield
        }}
        variants={nodeVariants}
        animate={status}
        {...(!reducedMotion && { whileHover: { scale: 1.1 } })}
        {...(!reducedMotion && { whileTap: { scale: 0.95 } })}
        onMouseEnter={() => onHover(source)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(source)}
        onBlur={() => onHover(null)}
        onClick={() => onClick(source)}
        // Phase 10.130: Enhanced WCAG ARIA attributes
        role="button"
        tabIndex={0}
        aria-label={
          status === 'searching'
            ? ARIA_LABELS.sourceSearching(SOURCE_DISPLAY_NAMES[source])
            : status === 'error'
            ? ARIA_LABELS.sourceError(SOURCE_DISPLAY_NAMES[source], error)
            : status === 'pending'
            ? ARIA_LABELS.sourcePending(SOURCE_DISPLAY_NAMES[source])
            : ARIA_LABELS.source(SOURCE_DISPLAY_NAMES[source], status, paperCount)
        }
        aria-busy={status === 'searching'}
        aria-describedby={`source-tooltip-${source}`}
      >
        {/* Pulse Effect */}
        {status === 'searching' && !reducedMotion && pulseAnimation ? (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: sourceColor }}
            animate={pulseAnimation}
          />
        ) : null}

        {/* Source Initial */}
        <span
          className={cn(
            'text-xs font-bold uppercase',
            status === 'pending' && 'text-white/30',
            (status === 'searching' || status === 'complete') && 'text-white',
            status === 'error' && 'text-red-300',
            status === 'skipped' && 'text-white/20'
          )}
        >
          {source.slice(0, 2)}
        </span>

        {/* Paper Count Badge */}
        {status === 'complete' && (
          <PaperCountBadge count={paperCount} animate={!reducedMotion} />
        )}

        {/* Status Indicator */}
        <StatusIndicator status={status} animate={!reducedMotion} />
      </motion.button>

      {/* Tooltip - Phase 10.129: Smart viewport-aware positioning */}
      <AnimatePresence>
        {isHovered && (
          <SourceTooltip
            source={source}
            status={status}
            paperCount={paperCount}
            timeMs={timeMs}
            nodePosition={position}
            containerSize={containerSize}
            {...(error && { error })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default SourceNode;
