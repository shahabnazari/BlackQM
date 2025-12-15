/**
 * Phase 10.127: Enhanced Orbital Source Constellation Component
 *
 * A galaxy-like visualization of literature sources orbiting around
 * a central search core. Sources are positioned on orbital rings
 * based on their response speed tier (fast/medium/slow).
 *
 * Phase 10.127 Enhancements:
 * - Responsive orbit sizing that fits within container
 * - Clear legend explaining the cosmic metaphor
 * - Improved tier labels with icons
 * - Subtle starfield background for cosmic atmosphere
 * - Gradient orbit rings with connection beams
 * - Enhanced center core with pulse effects
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 * @updated Phase 10.127
 */

'use client';

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrbitalSourceConstellationProps } from '../types';
import type { LiteratureSource, SourceTier } from '@/lib/types/search-stream.types';
import { SourceNode } from './SourceNode';
import { useCountStabilization, STABILIZATION_CONFIG } from '../hooks/useCountStabilization';
import {
  ORBIT_CONFIGS,
  ORBIT_LEGEND,
  TIER_COLORS,
  SPRING_PRESETS,
  ARIA_LABELS,
} from '../constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_ORDER: SourceTier[] = ['fast', 'medium', 'slow'];
// Phase 10.130: Pre-computed reverse order to avoid creating new array on each render
const TIER_ORDER_REVERSED: SourceTier[] = ['slow', 'medium', 'fast'];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Subtle starfield background
 */
const StarfieldBackground = memo<{
  width: number;
  height: number;
}>(function StarfieldBackground({ width, height }) {
  // Generate deterministic star positions
  const stars = useMemo(() => {
    const result: Array<{ x: number; y: number; size: number; opacity: number }> = [];
    const seed = 42; // Deterministic seed
    for (let i = 0; i < 30; i++) {
      const pseudoRandom = (seed * (i + 1) * 9301 + 49297) % 233280;
      const rand = pseudoRandom / 233280;
      result.push({
        x: (rand * width * 0.9) + width * 0.05,
        y: ((pseudoRandom * 7) % 233280 / 233280) * height * 0.9 + height * 0.05,
        size: 0.5 + (rand * 1.5),
        opacity: 0.2 + (rand * 0.4),
      });
    }
    return result;
  }, [width, height]);

  return (
    <g className="starfield">
      {stars.map((star, i) => (
        <motion.circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="white"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </g>
  );
});

/**
 * Enhanced orbital ring with gradient and glow
 * Phase 10.128: Added isSearching prop to control rotating animation
 */
const OrbitRing = memo<{
  tier: SourceTier;
  centerX: number;
  centerY: number;
  isActive: boolean;
  isSearching: boolean;
  reducedMotion: boolean;
}>(function OrbitRing({ tier, centerX, centerY, isActive, isSearching, reducedMotion }) {
  const config = ORBIT_CONFIGS[tier];
  const color = TIER_COLORS[tier];
  const id = `orbit-${tier}`;

  return (
    <g>
      {/* Gradient definition */}
      <defs>
        <radialGradient id={`${id}-gradient`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={isActive ? 0.3 : 0.05} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Subtle fill for active orbits */}
      {isActive && (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={config.radius}
          fill={`url(#${id}-gradient)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Main orbit ring */}
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={config.radius}
        fill="none"
        stroke={isActive ? color : 'rgba(255, 255, 255, 0.1)'}
        strokeWidth={isActive ? 1.5 : 0.5}
        strokeDasharray={isActive ? 'none' : '2 4'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isActive ? 0.8 : 0.3,
          scale: 1,
        }}
        transition={SPRING_PRESETS.soft}
      />

      {/* Rotating highlight - only shows while actively searching */}
      {isActive && isSearching && !reducedMotion && (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={`${Math.PI * config.radius * 0.1} ${Math.PI * config.radius * 1.9}`}
          strokeLinecap="round"
          initial={{ rotate: config.startAngle * (180 / Math.PI) }}
          animate={{ rotate: 360 + config.startAngle * (180 / Math.PI) }}
          transition={{
            duration: 20 / config.speed,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
      )}

      {/* Static completion indicator - shows when search complete */}
      {isActive && !isSearching && (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={`${Math.PI * config.radius * 0.15} ${Math.PI * config.radius * 1.85}`}
          strokeLinecap="round"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            transform: `rotate(${config.startAngle * (180 / Math.PI)}deg)`,
          }}
        />
      )}
    </g>
  );
});

/**
 * Enhanced center core with clearer visual hierarchy
 * Phase 10.140: Added stage-aware data flow visualization
 * - DISCOVER: Shows raw total, particles flow INWARD (collection phase)
 * - RANK: Particles flow OUTWARD/UPWARD (processing phase)
 * - COMPLETE: Final count with completion animation (Phase 10.152: no separate READY stage)
 *
 * Phase 10.141: Fixed critical bugs:
 * - Stage mapping: 'rank' (not 'refine') for processing phase
 * - Completion animation now triggers via AnimatePresence
 * - Uses ORBIT_CONFIGS for dynamic radius
 */
const CenterCore = memo<{
  centerX: number;
  centerY: number;
  isSearching: boolean;
  paperCount: number;
  rawTotalPapers?: number;
  currentStage?: string | null;
  isComplete?: boolean;
  reducedMotion: boolean;
}>(function CenterCore({
  centerX,
  centerY,
  isSearching,
  paperCount,
  rawTotalPapers = 0,
  currentStage,
  isComplete = false,
  reducedMotion,
}) {
  // Phase 10.141: Track completion state transitions for one-shot animation
  const prevCompleteRef = useRef(isComplete);
  const [showCompletionBurst, setShowCompletionBurst] = useState(false);

  // Phase 10.143: Use shared hook for stabilization detection (DRY principle)
  const { isStabilized: isCountStabilized } = useCountStabilization({
    count: rawTotalPapers,
    isActive: isSearching,
  });

  // Detect transition to complete state
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isComplete && !prevCompleteRef.current) {
      setShowCompletionBurst(true);
      // Auto-hide after animation
      timer = setTimeout(() => setShowCompletionBurst(false), 1500);
    }
    prevCompleteRef.current = isComplete;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isComplete]);

  // Phase 10.141: Fixed stage detection
  // WebSocket stages: 'analyzing' → 'analyze', 'fast/medium/slow-sources' → 'discover', 'ranking'/'complete' → 'rank'
  // Phase 10.152: 'complete' now maps to 'rank' (no separate 'ready' stage)
  const isCollectionPhase = currentStage === 'discover' || currentStage === 'analyze';
  const isProcessingPhase = currentStage === 'rank'; // Fixed: 'refine' stage doesn't exist!

  // Phase 10.143: Only show inward flow while actively collecting (count still increasing)
  const showInwardFlow = isCollectionPhase && !isCountStabilized;

  // Display count: raw total during collection, final count after
  const displayCount = isCollectionPhase && rawTotalPapers > 0 ? rawTotalPapers : paperCount;

  // Phase 10.141: Use ORBIT_CONFIGS for dynamic radius
  const outerRadius = ORBIT_CONFIGS.slow.radius; // Use largest orbit as reference

  return (
    <g>
      {/* Phase 10.140: INWARD flow during collection (DISCOVER) - Phase 10.143: Stops when count stabilizes */}
      {isSearching && showInwardFlow && !reducedMotion && (
        <g className="inward-flow">
          {/* Particles flowing IN from outer edge - from all 4 quadrants */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI * 2) / 4 + Math.PI / 4; // 45°, 135°, 225°, 315°
            const startX = centerX + Math.cos(angle) * outerRadius;
            const startY = centerY + Math.sin(angle) * outerRadius;
            return (
              <motion.circle
                key={`in-${i}`}
                r={3}
                fill="rgba(34, 197, 94, 0.8)"
                initial={{ cx: startX, cy: startY, opacity: 0 }}
                animate={{
                  cx: [startX, centerX],
                  cy: [startY, centerY],
                  opacity: [0, 0.9, 0.9, 0],
                  scale: [1, 0.6],
                }}
                transition={{
                  duration: 1.8,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: 'easeIn',
                }}
              />
            );
          })}
          {/* Collecting glow effect - contracts toward center */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={25}
            fill="none"
            stroke="rgba(34, 197, 94, 0.3)"
            strokeWidth={2}
            animate={{
              r: [40, 25],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        </g>
      )}

      {/* Phase 10.143: Collection complete indicator - shows when count stabilizes during DISCOVER */}
      {isSearching && isCollectionPhase && isCountStabilized && !reducedMotion && (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={30}
          fill="none"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth={2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Phase 10.142: Processing indicator - subtle pulse during RANK (no flow, flow is between stages) */}
      {isSearching && isProcessingPhase && !reducedMotion && (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={32}
          fill="none"
          stroke="rgba(147, 51, 234, 0.3)"
          strokeWidth={2}
          animate={{
            r: [32, 38, 32],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Phase 10.141: Completion burst - fires ONCE on transition via AnimatePresence */}
      <AnimatePresence>
        {showCompletionBurst && !reducedMotion && (
          <g className="completion-effect">
            <motion.circle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke="rgba(34, 197, 94, 0.7)"
              strokeWidth={3}
              initial={{ r: 25, opacity: 1 }}
              animate={{ r: 70, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.circle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={2}
              initial={{ r: 20, opacity: 1 }}
              animate={{ r: 55, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
            />
            {/* Success checkmark flash */}
            <motion.circle
              cx={centerX}
              cy={centerY}
              r={15}
              fill="rgba(34, 197, 94, 0.3)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </g>
        )}
      </AnimatePresence>

      {/* Outer pulse ring */}
      {isSearching && !reducedMotion && (
        <>
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={30}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth={1}
            animate={{
              r: [30, 45, 30],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={30}
            fill="none"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth={1}
            animate={{
              r: [30, 50, 30],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Core gradient background */}
      <defs>
        <radialGradient id="core-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
          <stop offset="70%" stopColor="rgba(59, 130, 246, 0.1)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </radialGradient>
      </defs>

      {/* Core glow */}
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={32}
        fill="url(#core-gradient)"
        initial={{ scale: 0 }}
        animate={{ scale: isSearching ? [1, 1.1, 1] : 1 }}
        transition={isSearching && !reducedMotion ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        } : SPRING_PRESETS.soft}
      />

      {/* Core outer ring */}
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={28}
        fill="rgba(15, 23, 42, 0.8)"
        stroke="rgba(59, 130, 246, 0.5)"
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={SPRING_PRESETS.soft}
      />

      {/* Core inner ring */}
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={20}
        fill="rgba(59, 130, 246, 0.15)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth={1}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING_PRESETS.soft, delay: 0.1 }}
      />

      {/* Paper count - Phase 10.141: Stage-aware display with smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.text
          key={`count-${isCollectionPhase ? 'collect' : isComplete ? 'final' : 'process'}`}
          x={centerX}
          y={centerY - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isComplete ? 'rgba(74, 222, 128, 1)' : isProcessingPhase ? 'rgba(192, 132, 252, 1)' : 'white'}
          fontSize={displayCount > 999 ? 11 : 14}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {displayCount > 9999 ? `${(displayCount / 1000).toFixed(1)}k` : displayCount.toLocaleString()}
        </motion.text>
      </AnimatePresence>
      <motion.text
        x={centerX}
        y={centerY + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={
          isCollectionPhase ? 'rgba(74, 222, 128, 0.7)' :
          isProcessingPhase ? 'rgba(192, 132, 252, 0.7)' :
          isComplete ? 'rgba(74, 222, 128, 0.7)' :
          'rgba(255, 255, 255, 0.5)'
        }
        fontSize={7}
        fontWeight="600"
        letterSpacing="0.5px"
        fontFamily="system-ui, -apple-system, sans-serif"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isCollectionPhase ? 'FOUND' : isProcessingPhase ? 'RANKING' : isComplete ? 'FINAL' : 'PAPERS'}
      </motion.text>
    </g>
  );
});

/**
 * Phase 10.128: TierIndicator removed - info moved to OrbitLegend
 * The labels were covering the orbits, so we consolidated into a corner legend.
 */

/**
 * Phase 10.128: Enhanced Legend with visual orbit rings
 * Shows orbit tiers with colored ring indicators
 */
const OrbitLegend = memo<{
  isVisible: boolean;
  onToggle: () => void;
  activeTiers: Set<SourceTier>;
}>(function OrbitLegend({ isVisible, onToggle, activeTiers }) {
  return (
    // Phase 10.129: Moved legend to bottom-left to avoid orbit overlap
    <div className="absolute bottom-1 left-1 z-10">
      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.div
            key="legend"
            className={cn(
              'p-2.5 rounded-lg',
              'bg-gray-900/95 backdrop-blur-md',
              'border border-white/10',
              'shadow-xl'
            )}
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
              <span className="text-xs text-white/80 font-semibold tracking-wide uppercase"> {/* Phase 10.135: Increased from 10px to 12px */}
                Source Orbits
              </span>
              <button
                onClick={onToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle();
                  }
                }}
                className="text-white/40 hover:text-white/70 transition-colors ml-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded text-sm"
                aria-label="Close legend"
              >
                ×
              </button>
            </div>

            {/* Visual orbit rings mini-preview */}
            <div className="relative w-[60px] h-[60px] mx-auto mb-2">
              <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
                {/* Mini orbit rings */}
                {TIER_ORDER.map((tier, i) => {
                  const isActive = activeTiers.has(tier);
                  const radius = 10 + i * 8;
                  return (
                    <circle
                      key={tier}
                      cx="30"
                      cy="30"
                      r={radius}
                      fill="none"
                      stroke={TIER_COLORS[tier]}
                      strokeWidth={isActive ? 2 : 1}
                      strokeOpacity={isActive ? 0.8 : 0.3}
                      strokeDasharray={isActive ? 'none' : '2 2'}
                    />
                  );
                })}
                {/* Center dot */}
                <circle cx="30" cy="30" r="4" fill="rgba(59, 130, 246, 0.6)" />
              </svg>
            </div>

            {/* Tier labels */}
            <div className="space-y-1.5">
              {TIER_ORDER.map((tier) => {
                const config = ORBIT_LEGEND.tiers[tier];
                const isActive = activeTiers.has(tier);
                return (
                  <div
                    key={tier}
                    className={cn(
                      'flex items-center gap-2 px-1 py-0.5 rounded',
                      isActive ? 'bg-white/5' : 'opacity-40'
                    )}
                  >
                    {/* Colored ring indicator */}
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{
                        borderColor: TIER_COLORS[tier],
                        backgroundColor: isActive ? `${TIER_COLORS[tier]}20` : 'transparent',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-white/90 font-semibold"> {/* Phase 10.135: Increased from 9px to 10px minimum */}
                          {config.label}
                        </span>
                        <span className="text-[8px]">{config.icon}</span>
                      </div>
                      <span className="text-[8px] text-white/50 block">
                        {config.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="toggle"
            onClick={onToggle}
            className={cn(
              'w-6 h-6 rounded-full',
              'bg-gray-900/90 backdrop-blur-sm',
              'border border-white/20',
              'flex items-center justify-center',
              'text-white/60 hover:text-white/90',
              'transition-all hover:border-white/40'
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            aria-label="Show orbit legend"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Connection beam from source to center
 */
const ConnectionBeam = memo<{
  sourceX: number;
  sourceY: number;
  centerX: number;
  centerY: number;
  color: string;
  isActive: boolean;
  paperCount: number;
  reducedMotion: boolean;
}>(function ConnectionBeam({
  sourceX, sourceY, centerX, centerY, color, isActive, paperCount, reducedMotion
}) {
  if (!isActive || paperCount === 0) return null;

  // Calculate beam intensity based on paper count
  const intensity = Math.min(paperCount / 100, 1);
  const opacity = 0.1 + intensity * 0.3;

  return (
    <motion.line
      x1={sourceX}
      y1={sourceY}
      x2={centerX}
      y2={centerY}
      stroke={color}
      strokeWidth={1 + intensity}
      strokeOpacity={opacity}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: 1,
        opacity: reducedMotion ? opacity : [opacity * 0.5, opacity, opacity * 0.5],
      }}
      transition={reducedMotion ? { duration: 0.3 } : {
        pathLength: { duration: 0.5 },
        opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enhanced Orbital Source Constellation Component
 * Phase 10.127: Improved visual clarity and cosmic atmosphere
 * Note: Props interface imported from ../types.ts for single source of truth
 */
export const OrbitalSourceConstellation = memo<OrbitalSourceConstellationProps>(
  function OrbitalSourceConstellation({
    sources,
    activeTiers,
    centerPosition,
    width,
    height,
    paperCount,
    rawTotalPapers,
    currentStage,
    isComplete,
    isSearching,
    onSourceHover,
    onSourceClick,
    reducedMotion,
  }) {
    const [hoveredSource, setHoveredSource] = useState<LiteratureSource | null>(null);
    const [showLegend, setShowLegend] = useState(ORBIT_LEGEND.showByDefault);

    // Phase 10.143/10.152: Use shared hook for orbital animation state
    // Planets orbit clockwise after initial paper count stabilizes
    // Phase 10.152 FIX: Orbit now persists briefly after search ends
    const { isStabilized } = useCountStabilization({
      count: rawTotalPapers ?? 0,
      isActive: isSearching,
    });

    // Phase 10.152 FIX: Orbit when stabilized - continues briefly after search ends
    // The useCountStabilization hook now handles persistence after completion
    const isOrbiting = isStabilized;

    // Phase 10.130: Memoize containerSize to prevent unnecessary SourceNode re-renders
    const containerSize = useMemo(() => ({ width, height }), [width, height]);

    // Handle hover
    const handleHover = useCallback((source: LiteratureSource | null) => {
      setHoveredSource(source);
      onSourceHover(source);
    }, [onSourceHover]);

    // Toggle legend
    const handleToggleLegend = useCallback(() => {
      setShowLegend(prev => !prev);
    }, []);

    return (
      <div
        className="relative overflow-visible rounded-xl"
        style={{ width, height }}
        // Phase 10.130: Enhanced WCAG accessibility
        role="region"
        aria-label={ARIA_LABELS.constellation}
        aria-describedby="constellation-description"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Screen reader description */}
        <span id="constellation-description" className="sr-only">
          {ARIA_LABELS.constellationDescription}
        </span>
        {/* SVG Layer */}
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          {/* Starfield background */}
          {!reducedMotion && (
            <StarfieldBackground width={width} height={height} />
          )}

          {/* Connection beams from sources to center */}
          {sources.map((source) => {
            const sourceColor = TIER_COLORS[source.tier];
            return (
              <ConnectionBeam
                key={`beam-${source.source}`}
                sourceX={source.position.x}
                sourceY={source.position.y}
                centerX={centerPosition.x}
                centerY={centerPosition.y}
                color={sourceColor}
                isActive={source.status === 'complete'}
                paperCount={source.paperCount}
                reducedMotion={reducedMotion}
              />
            );
          })}

          {/* Orbital Rings - render in reverse order (outer first) */}
          {TIER_ORDER_REVERSED.map((tier) => (
            <OrbitRing
              key={tier}
              tier={tier}
              centerX={centerPosition.x}
              centerY={centerPosition.y}
              isActive={activeTiers.has(tier)}
              isSearching={isSearching}
              reducedMotion={reducedMotion}
            />
          ))}

          {/* Phase 10.128: Removed TierIndicator labels - info moved to corner legend */}

          {/* Center Core */}
          <CenterCore
            centerX={centerPosition.x}
            centerY={centerPosition.y}
            isSearching={isSearching}
            paperCount={paperCount}
            rawTotalPapers={rawTotalPapers ?? 0}
            currentStage={currentStage ?? null}
            isComplete={isComplete ?? false}
            reducedMotion={reducedMotion}
          />
        </svg>

        {/* Phase 10.153: Netflix-Grade CSS Keyframes for buttery-smooth orbital animation */}
        {/* Uses translate3d(0,0,0) to force GPU layer and prevent jank */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes orbitClockwise {
                0% { transform: rotate(0deg) translate3d(0,0,0); }
                100% { transform: rotate(360deg) translate3d(0,0,0); }
              }
              @keyframes orbitCounterRotate {
                0% { transform: rotate(0deg) translate3d(0,0,0); }
                100% { transform: rotate(-360deg) translate3d(0,0,0); }
              }
            `,
          }}
        />

        {/* HTML Layer - Source Nodes with Phase 10.153 orbital animation */}
        {/* Sources orbit like planets around sun after particle collection stops */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            // Phase 10.153: Netflix-grade planetary orbit animation
            // Rotates around the center (sun) when particles stop flowing
            transformOrigin: `${centerPosition.x}px ${centerPosition.y}px`,
            animation: isOrbiting && !reducedMotion
              ? `orbitClockwise ${STABILIZATION_CONFIG.orbitDurationSeconds}s linear infinite`
              : 'none',
            // Phase 10.153: Comprehensive GPU acceleration for smooth 60fps rotation
            willChange: isOrbiting ? 'transform' : 'auto',
            // Note: Keyframes include translate3d(0,0,0) for GPU compositing
            // Static transform only needed when NOT animating for layer promotion
            ...(isOrbiting ? {} : { transform: 'translate3d(0,0,0)' }),
            backfaceVisibility: 'hidden', // Prevent flicker during rotation
          }}
        >
          {sources.map((source) => (
            <SourceNode
              key={source.source}
              nodeState={source}
              centerPosition={centerPosition}
              containerSize={containerSize}
              onHover={handleHover}
              onClick={onSourceClick}
              reducedMotion={reducedMotion}
              isHovered={hoveredSource === source.source}
              isOrbiting={isOrbiting}
            />
          ))}
        </div>

        {/* Legend */}
        <OrbitLegend
          isVisible={showLegend}
          onToggle={handleToggleLegend}
          activeTiers={activeTiers}
        />
      </div>
    );
  }
);

export default OrbitalSourceConstellation;
