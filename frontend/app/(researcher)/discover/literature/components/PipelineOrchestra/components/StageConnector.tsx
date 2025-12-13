/**
 * Phase 10.126: Stage Connector Component
 *
 * Animated connector line between pipeline stages with flowing
 * particle effect and status-based styling.
 *
 * Features:
 * - Gradient-filled connector line
 * - Animated data flow particles
 * - Status-based coloring
 * - Responsive width
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StageConnectorProps } from '../types';
import { STATUS_COLORS } from '../constants';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Stage Connector Component
 *
 * Connects two pipeline stages with an animated line.
 *
 * @example
 * ```tsx
 * <StageConnector
 *   fromStatus="complete"
 *   toStatus="active"
 *   isActive={true}
 *   progress={50}
 *   reducedMotion={false}
 * />
 * ```
 */
export const StageConnector = memo<StageConnectorProps>(function StageConnector({
  fromStatus,
  toStatus,
  isActive,
  progress,
  reducedMotion,
}) {
  // Determine connector state
  const isComplete = fromStatus === 'complete';
  const isPartiallyActive = fromStatus === 'complete' && toStatus === 'active';
  const isPending = fromStatus === 'pending' || toStatus === 'pending';
  const hasError = fromStatus === 'error' || toStatus === 'error';

  // Calculate colors
  const lineColor = useMemo(() => {
    if (hasError) return STATUS_COLORS.error;
    if (isComplete) return STATUS_COLORS.complete;
    if (isActive) return STATUS_COLORS.active;
    return 'rgba(255, 255, 255, 0.15)';
  }, [hasError, isComplete, isActive]);

  const bgColor = useMemo(() => {
    if (isPending) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.12)';
  }, [isPending]);

  // Flow animation
  const flowAnimation = useMemo(() => {
    if (reducedMotion || !isActive || !isPartiallyActive) return undefined;
    return {
      backgroundPosition: ['0% 50%', '100% 50%'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    };
  }, [reducedMotion, isActive, isPartiallyActive]);

  return (
    <div
      className="relative flex items-center mx-1"
      style={{ width: '48px' }}
      aria-hidden="true"
    >
      {/* Background Line */}
      <div
        className={cn(
          'absolute inset-0 h-[3px] my-auto rounded-full',
          'overflow-hidden'
        )}
        style={{ backgroundColor: bgColor }}
      >
        {/* Progress Fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: lineColor }}
          initial={{ width: '0%' }}
          animate={{ width: `${isComplete ? 100 : progress}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Animated Flow Effect */}
      {isPartiallyActive && !reducedMotion && flowAnimation ? (
        <motion.div
          className="absolute inset-0 h-[3px] my-auto rounded-full overflow-hidden"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              ${STATUS_COLORS.active}60 50%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
          }}
          animate={flowAnimation}
        />
      ) : null}

      {/* Data Particles */}
      {isPartiallyActive && !reducedMotion && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.active }}
              initial={{ left: '0%', opacity: 0 }}
              animate={{
                left: ['0%', '100%'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}

      {/* Arrow Head */}
      <div
        className="absolute right-0 transform translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: `6px solid ${isComplete ? lineColor : bgColor}`,
        }}
      />
    </div>
  );
});

export default StageConnector;
