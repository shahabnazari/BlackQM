/**
 * Phase 10.126: Stage Orb Component
 *
 * A glassmorphism-styled pipeline stage visualization with animated
 * progress ring, status indicators, and expandable detail panel.
 *
 * Features:
 * - Frosted glass aesthetic (Apple-inspired)
 * - Circular progress ring animation
 * - Status-based icon animations (pulse, spin, shake)
 * - Expandable substage details
 * - Full accessibility support
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, ChevronDown, Info, Cpu, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StageOrbProps } from '../types';
import {
  SPRING_PRESETS,
  STATUS_COLORS,
  STAGE_ORB_SIZE,
  ARIA_LABELS,
  STAGE_TECHNICAL_DETAILS,
  TOOLTIP_TRANSITIONS,
} from '../constants';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Circular progress ring SVG
 */
const ProgressRing = memo<{
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
  animate: boolean;
}>(function ProgressRing({ progress, color, size, strokeWidth, animate }) {
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
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
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
        animate={{ strokeDashoffset: animate ? offset : circumference }}
        transition={animate ? SPRING_PRESETS.gentle : { duration: 0 }}
      />
    </svg>
  );
});

/**
 * Phase 10.130: Technical tooltip showing detailed methodology
 * Enhanced with higher z-index and viewport-safe positioning
 * Now supports smart horizontal alignment based on stage position
 */
const TechnicalTooltip = memo<{
  stageId: string;
  isVisible: boolean;
  position: 'top' | 'bottom';
  stageColor: string;
  stageIndex: number; // Phase 10.130: For smart horizontal positioning
  totalStages: number;
}>(function TechnicalTooltip({ stageId, isVisible, position, stageColor, stageIndex, totalStages }) {
  // Phase 10.130: Smart horizontal alignment based on stage position
  // Left stages: align left, center stages: center, right stages: align right
  // NOTE: Must be called before any early returns (React hooks rule)
  const horizontalAlign = useMemo(() => {
    // Guard against division by zero (single stage edge case)
    if (totalStages <= 1) return 'center';
    const normalizedPos = stageIndex / (totalStages - 1); // 0 to 1
    if (normalizedPos <= 0.25) return 'left';
    if (normalizedPos >= 0.75) return 'right';
    return 'center';
  }, [stageIndex, totalStages]);

  const details = STAGE_TECHNICAL_DETAILS[stageId];
  if (!details) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'absolute z-[60] w-[300px]', // Phase 10.131: Wider for better readability
            'backdrop-blur-xl bg-gray-900/98 border border-white/20',
            'rounded-xl shadow-2xl overflow-hidden',
            position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3',
            // Phase 10.130: Smart horizontal alignment
            horizontalAlign === 'center' && 'left-1/2 -translate-x-1/2',
            horizontalAlign === 'left' && 'left-0',
            horizontalAlign === 'right' && 'right-0'
          )}
          initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
          transition={TOOLTIP_TRANSITIONS.fade}
        >
          {/* Header */}
          <div
            className="px-3 py-2.5 border-b border-white/10"
            style={{ background: `linear-gradient(135deg, ${stageColor}20 0%, transparent 100%)` }}
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" style={{ color: stageColor }} />
              <span className="text-sm font-semibold text-white">{details.title}</span>
            </div>
            <p className="text-xs text-white/80 mt-1 font-mono">
              {details.algorithm}
            </p>
          </div>

          {/* Metrics */}
          <div className="px-3 py-2.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                Performance Metrics
              </span>
            </div>
            <div className="space-y-1.5">
              {details.metrics.map((metric, i) => (
                <p key={i} className="text-xs text-white/90 font-mono leading-relaxed">
                  • {metric}
                </p>
              ))}
            </div>
          </div>

          {/* Technical Steps */}
          <div className="px-3 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                Process Steps
              </span>
            </div>
            <ol className="space-y-1.5">
              {details.technicalSteps.map((step, i) => (
                <li key={i} className="text-xs text-white/90 flex items-start gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" // Phase 10.135: Increased from 10px to 12px
                    style={{ backgroundColor: `${stageColor}40`, color: stageColor }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Science Note */}
          <div className="px-3 py-2.5 bg-gradient-to-r from-blue-500/15 to-purple-500/15">
            <p className="text-xs text-white/80 italic leading-relaxed">
              📊 {details.scienceNote}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/**
 * Substage header with completion count
 * Optimized: Memoizes completion count calculation
 */
const SubstageHeader = memo<{
  substages: string[];
  substageProgress: Record<string, number>;
}>(function SubstageHeader({ substages, substageProgress }) {
  const completedCount = useMemo(
    () => substages.filter(s => (substageProgress[s] || 0) === 100).length,
    [substages, substageProgress]
  );

  return (
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">
        Substages ({substages.length})
      </p>
      <span className="text-[10px] text-white/50 uppercase">
        {completedCount}/{substages.length} complete
      </span>
    </div>
  );
});

/**
 * Status badge overlay
 */
const StatusBadge = memo<{
  status: 'complete' | 'error';
  animate: boolean;
}>(function StatusBadge({ status, animate }) {
  const isComplete = status === 'complete';

  return (
    <motion.div
      className={cn(
        'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
        'shadow-lg border-2 border-white/20',
        isComplete ? 'bg-green-500' : 'bg-red-500'
      )}
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRING_PRESETS.bouncy}
    >
      {isComplete ? (
        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-white" />
      )}
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Stage Orb Component
 *
 * A floating orb representing a pipeline stage with glassmorphism styling.
 *
 * @example
 * ```tsx
 * <StageOrb
 *   stage={PIPELINE_STAGES[0]}
 *   state={stageStates[0]}
 *   index={0}
 *   isFirst={true}
 *   isLast={false}
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   reducedMotion={false}
 * />
 * ```
 */
export const StageOrb = memo<StageOrbProps>(function StageOrb({
  stage,
  state,
  index,
  totalStages,
  isFirst: _isFirst,
  isLast: _isLast,
  isExpanded,
  onToggle,
  reducedMotion,
}) {
  // Hover state for technical tooltip
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Derive visual state
  const isActive = state.status === 'active';
  const isComplete = state.status === 'complete';
  const isError = state.status === 'error';
  const isPending = state.status === 'pending';
  const showBadge = isComplete || isError;

  // Icon component
  const IconComponent = stage.icon;

  // Animation variants - Phase 10.129: Added transitions for smooth state changes
  // Phase 10.140: Fixed - all states use scale: 1 for consistent circle sizes
  const orbVariants = useMemo(() => ({
    pending: {
      scale: 1,
      opacity: 0.6,
      transition: SPRING_PRESETS.soft,
    },
    active: {
      scale: 1,
      opacity: 1,
      transition: SPRING_PRESETS.soft,
    },
    complete: {
      scale: 1,
      opacity: 1,
      transition: SPRING_PRESETS.soft,
    },
    error: {
      scale: 1,
      opacity: 1,
      transition: SPRING_PRESETS.soft,
    },
  }), []);

  // Icon animation variants
  const iconVariants = useMemo(() => ({
    pending: { rotate: 0, scale: 1 },
    active: reducedMotion
      ? { rotate: 0, scale: 1 }
      : {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
    complete: { rotate: 0, scale: 1 },
    error: reducedMotion
      ? { rotate: 0, scale: 1 }
      : {
          x: [-2, 2, -2, 2, 0],
          transition: {
            duration: 0.4,
            repeat: 2,
          },
        },
  }), [reducedMotion]);

  // Pulse animation for active state
  const pulseAnimation = useMemo(() => {
    if (reducedMotion || !isActive) return undefined;
    return {
      boxShadow: [
        `0 0 0 0 ${stage.color.primary}40`,
        `0 0 0 12px ${stage.color.primary}00`,
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeOut' as const,
      },
    };
  }, [isActive, reducedMotion, stage.color.primary]);

  return (
    <motion.div
      className="relative flex flex-col items-center min-w-[120px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reducedMotion ? 0 : index * 0.1,
        ...SPRING_PRESETS.soft,
      }}
    >
      {/* Technical Tooltip - Phase 10.130: Smart positioning based on stage position */}
      <TechnicalTooltip
        stageId={stage.id}
        isVisible={isHovered && !isExpanded}
        position="bottom"
        stageColor={stage.color.primary}
        stageIndex={index}
        totalStages={totalStages}
      />

      {/* Phase 10.140: Active stage glow ring */}
      {isActive && !reducedMotion && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: STAGE_ORB_SIZE.md + 24,
            height: STAGE_ORB_SIZE.md + 24,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${stage.color.primary}20, transparent 70%)`,
            boxShadow: `0 0 40px ${stage.color.primary}40, 0 0 80px ${stage.color.primary}20`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1.1, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main Orb Button */}
      <motion.button
        className={cn(
          'relative rounded-full',
          'flex items-center justify-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-blue-500',
          // Glassmorphism base - removed transition-colors to avoid conflict with Framer
          'backdrop-blur-xl',
          // Status-based styling
          isPending && 'bg-white/10 border border-white/30',
          isActive && `bg-gradient-to-br ${stage.color.gradient} border-2 border-white/40`,
          isComplete && 'bg-white/10 border border-white/20',
          isError && 'bg-red-500/20 border border-red-500/30'
        )}
        style={{
          width: STAGE_ORB_SIZE.md,
          height: STAGE_ORB_SIZE.md,
          boxShadow: isActive ? `0 0 20px ${stage.color.primary}60, 0 0 40px ${stage.color.primary}30` : undefined,
        }}
        variants={orbVariants}
        initial="pending"
        animate={state.status}
        {...(!reducedMotion && { whileHover: { scale: 1.08 } })}
        {...(!reducedMotion && { whileTap: { scale: 0.95 } })}
        transition={SPRING_PRESETS.soft}
        onClick={onToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && isExpanded) {
            e.preventDefault();
            onToggle();
          }
        }}
        // Phase 10.130: Enhanced WCAG ARIA attributes
        role="button"
        tabIndex={0}
        aria-label={ARIA_LABELS.stageButton(stage.name, state.status, state.progress)}
        aria-expanded={isExpanded}
        aria-controls={`stage-detail-${stage.id}`}
        aria-describedby={`stage-desc-${stage.id}`}
        aria-busy={isActive}
      >
        {/* Progress Ring */}
        <ProgressRing
          progress={state.progress}
          color={isError ? STATUS_COLORS.error : stage.color.primary}
          size={STAGE_ORB_SIZE.md}
          strokeWidth={3}
          animate={!reducedMotion}
        />

        {/* Pulse Effect (Active) */}
        {isActive && !reducedMotion && pulseAnimation ? (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={pulseAnimation}
          />
        ) : null}

        {/* Inner Content - Phase 10.131: Better icon visibility */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            variants={iconVariants}
            animate={state.status}
          >
            <IconComponent
              className={cn(
                'w-7 h-7',
                isPending && 'text-white/70',
                isActive && 'text-white',
                isComplete && 'text-white/90',
                isError && 'text-red-400'
              )}
            />
          </motion.div>
        </div>

        {/* Status Badge */}
        <AnimatePresence>
          {showBadge && (
            <StatusBadge
              status={isError ? 'error' : 'complete'}
              animate={!reducedMotion}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Stage Label - Phase 10.131: Improved readability */}
      <motion.div
        className="mt-2.5 text-center w-full min-h-[60px] flex flex-col justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : index * 0.1 + 0.2 }}
        id={`stage-desc-${stage.id}`}
      >
        <p
          className={cn(
            'text-sm font-bold tracking-wide uppercase whitespace-nowrap',
            isPending && 'text-white/70',
            isActive && 'text-white',
            isComplete && 'text-white/90',
            isError && 'text-red-400'
          )}
        >
          {stage.name}
        </p>
        <p
          className={cn(
            'text-xs mt-1 w-full truncate',
            isPending && 'text-white/60',
            (isActive || isComplete) && 'text-white/80',
            isError && 'text-red-400/80'
          )}
          aria-live={isActive ? 'polite' : 'off'}
        >
          {state.message}
        </p>
      </motion.div>

      {/* Expand Indicator - Phase 10.146: Improved UX with text label and clearer visual */}
      {stage.substages.length > 0 && (
        <motion.button
          className={cn(
            'mt-2 flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-all',
            'border backdrop-blur-sm',
            isExpanded
              ? 'bg-white/15 border-white/25 hover:bg-white/20'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
            'group/chevron'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          animate={{ scale: isExpanded ? 1.02 : 1 }}
          transition={SPRING_PRESETS.soft}
          title={isExpanded ? 'Click to collapse details' : `Click to see ${stage.substages.length} substage${stage.substages.length > 1 ? 's' : ''}`}
          aria-label={isExpanded ? 'Collapse substage details' : `Expand ${stage.substages.length} substages`}
          type="button"
        >
          <span className={cn(
            'text-[10px] font-medium uppercase tracking-wider transition-colors',
            isExpanded
              ? 'text-white/80'
              : 'text-white/50 group-hover/chevron:text-white/70'
          )}>
            {isExpanded ? 'Hide' : 'Details'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={SPRING_PRESETS.soft}
          >
            <ChevronDown className={cn(
              'w-3 h-3 transition-colors',
              isExpanded
                ? 'text-white/80'
                : 'text-white/50 group-hover/chevron:text-white/70'
            )} />
          </motion.div>
        </motion.button>
      )}

      {/* Expanded Detail Panel - Phase 10.131: Improved readability */}
      <AnimatePresence>
        {isExpanded && stage.substages.length > 0 && (
          <motion.div
            id={`stage-detail-${stage.id}`}
            className={cn(
              'absolute top-full mt-3 z-[55]',
              'min-w-[200px] max-w-[260px] p-3.5 rounded-xl',
              'backdrop-blur-xl bg-gray-900/95 border border-white/20',
              'shadow-xl',
              'left-1/2 -translate-x-1/2' // Center the panel relative to the orb
            )}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={SPRING_PRESETS.soft}
          >
            <SubstageHeader
              substages={stage.substages}
              substageProgress={state.substageProgress}
            />
            <ul className="space-y-2">
              {stage.substages.map((substage) => {
                const substageProgress = state.substageProgress[substage] || 0;
                const isSubstageComplete = substageProgress === 100;
                const isSubstageActive = substageProgress > 0 && substageProgress < 100;

                return (
                  <li
                    key={substage}
                    className="flex items-center gap-2.5"
                  >
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shrink-0',
                        isSubstageComplete ? 'bg-green-400 shadow-sm shadow-green-400/50' :
                          isSubstageActive ? 'bg-blue-400 animate-pulse shadow-sm shadow-blue-400/50' :
                          'bg-white/40'
                      )}
                    />
                    <span className="text-sm text-white/90 capitalize flex-1">
                      {substage.replace(/-/g, ' ')}
                    </span>
                    {isSubstageActive && (
                      <span className="text-xs text-white/60 font-mono">
                        {Math.round(substageProgress)}%
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default StageOrb;
