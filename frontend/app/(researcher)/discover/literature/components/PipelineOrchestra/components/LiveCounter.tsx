/**
 * Phase 10.126: Live Counter Component
 *
 * Animated counter with spring physics for displaying real-time metrics.
 * Features odometer-style number rolling, trend indicators, and sparklines.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveCounterProps, CounterFormat } from '../types';
import { SPRING_PRESETS, ARIA_LABELS, LIVE_COUNTER_CONFIG, QUALITY_METER_SIZE } from '../constants';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format number based on type
 */
function formatValue(value: number, format: CounterFormat): string {
  switch (format) {
    case 'duration':
      // Format as seconds with 1 decimal
      return `${(value / 1000).toFixed(1)}s`;
    case 'percentage':
      return `${Math.round(value)}%`;
    case 'compact':
      // K/M formatting for large numbers
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    default:
      return value.toLocaleString();
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Animated digit component
 */
const AnimatedDigit = memo<{
  value: number;
  animate: boolean;
}>(function AnimatedDigit({ value, animate }) {
  const springValue = useSpring(value, {
    ...SPRING_PRESETS.counter,
    restDelta: 0.01,
  });

  const displayValue = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  if (!animate) {
    return <span>{value}</span>;
  }

  return (
    <motion.span>
      {displayValue}
    </motion.span>
  );
});

/**
 * Trend indicator component
 */
const TrendIndicator = memo<{
  trend: 'up' | 'down' | 'neutral';
  animate: boolean;
}>(function TrendIndicator({ trend, animate }) {
  const Icon = trend === 'up' ? TrendingUp :
    trend === 'down' ? TrendingDown : Minus;

  const color = trend === 'up' ? 'text-green-400' :
    trend === 'down' ? 'text-red-400' : 'text-white/40';

  return (
    <motion.div
      initial={animate ? { opacity: 0, x: -5 } : false}
      animate={{ opacity: 1, x: 0 }}
      className={cn('ml-1', color)}
    >
      <Icon className="w-3 h-3" />
    </motion.div>
  );
});

/**
 * Mini sparkline chart
 */
const Sparkline = memo<{
  data: number[];
  color: string;
  width: number;
  height: number;
}>(function Sparkline({ data, color, width, height }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="ml-2"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Live Counter Component
 *
 * Displays an animated metric with optional trend indicator and sparkline.
 *
 * @example
 * ```tsx
 * <LiveCounter
 *   value={247}
 *   label="Papers"
 *   icon={FileText}
 *   format="number"
 *   trend="up"
 *   animate={true}
 *   size="md"
 * />
 * ```
 */
export const LiveCounter = memo<LiveCounterProps>(function LiveCounter({
  value,
  label,
  icon: Icon,
  format = 'number',
  trend = 'neutral',
  animate = true,
  size = 'md',
  showSparkline = false,
  sparklineData = [],
}) {
  // Track previous value for flash effect
  const [prevValue, setPrevValue] = useState(value);
  const [isFlashing, setIsFlashing] = useState(false);

  // Detect value changes for flash effect
  useEffect(() => {
    if (value !== prevValue && animate) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), LIVE_COUNTER_CONFIG.flashDuration);
      setPrevValue(value);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value, prevValue, animate]);

  // Size classes - Phase 10.134: Minimum font size 10px for readability
  const sizeClasses = useMemo(() => ({
    sm: {
      container: 'px-2.5 py-1.5',
      icon: 'w-3.5 h-3.5',
      value: 'text-lg',
      label: 'text-xs', // Phase 10.135: Increased from 10px to 12px for WCAG compliance
    },
    md: {
      container: 'px-3 py-2',
      icon: 'w-4 h-4',
      value: 'text-xl',
      label: 'text-xs', // Phase 10.134: Increased from 10px to 12px
    },
    lg: {
      container: 'px-4 py-2.5',
      icon: 'w-5 h-5',
      value: 'text-2xl',
      label: 'text-xs',
    },
  }), []);

  const classes = sizeClasses[size];
  const formattedValue = formatValue(value, format);

  return (
    <motion.div
      className={cn(
        'relative flex items-center gap-2 rounded-lg',
        'backdrop-blur-md bg-white/5 border border-white/10',
        classes.container,
        isFlashing && 'ring-1 ring-blue-400/50'
      )}
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_PRESETS.soft}
      aria-label={ARIA_LABELS.counter(label, formattedValue)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 text-white/60">
        <Icon className={classes.icon} />
      </div>

      {/* Value and Label */}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span
            className={cn(
              'font-bold tabular-nums text-white',
              classes.value
            )}
          >
            {format === 'number' && animate ? (
              <AnimatedDigit value={value} animate={animate} />
            ) : (
              formattedValue
            )}
          </span>

          {/* Trend Indicator */}
          {trend !== 'neutral' && (
            <TrendIndicator trend={trend} animate={animate} />
          )}

          {/* Sparkline */}
          {showSparkline && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              color={LIVE_COUNTER_CONFIG.sparkline.color}
              width={LIVE_COUNTER_CONFIG.sparkline.width}
              height={LIVE_COUNTER_CONFIG.sparkline.height}
            />
          )}
        </div>

        <span
          className={cn(
            'uppercase tracking-wider text-white/50 font-medium',
            classes.label
          )}
        >
          {label}
        </span>
      </div>

      {/* Flash Effect Overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-blue-400/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// ETA PREDICTOR COMPONENT
// ============================================================================

/**
 * Intelligent ETA predictor with context-aware messaging
 */
export const ETAPredictor = memo<{
  elapsedMs: number;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  stage: string | null;
  reducedMotion: boolean;
}>(function ETAPredictor({
  elapsedMs,
  sourcesComplete,
  sourcesTotal,
  papersFound: _papersFound,
  stage,
  reducedMotion,
}) {
  // Calculate ETA
  const eta = useMemo(() => {
    if (stage === 'complete' || !stage) return null;
    if (sourcesTotal === 0 || sourcesComplete === 0) return null;

    const avgTimePerSource = elapsedMs / sourcesComplete;
    const remainingSources = sourcesTotal - sourcesComplete;
    const estimatedSourceTime = avgTimePerSource * remainingSources;

    // Add buffer for ranking phase
    const rankingBuffer = stage === 'ranking' ? 0 : 2000;

    return Math.round(estimatedSourceTime + rankingBuffer);
  }, [elapsedMs, sourcesComplete, sourcesTotal, stage]);

  // Generate context-aware message
  const message = useMemo(() => {
    if (stage === 'complete') return 'Complete!';
    if (!eta) return 'Starting...';

    const seconds = Math.ceil(eta / 1000);

    if (seconds < 3) return 'Almost done...';
    if (seconds < 10) return `~${seconds}s remaining`;
    if (seconds < 30) return `About ${Math.ceil(seconds / 5) * 5}s left`;
    if (seconds < 60) return 'Under a minute';
    return `~${Math.ceil(seconds / 60)} min remaining`;
  }, [eta, stage]);

  return (
    <motion.div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-white/5 text-white/70 text-xs'
      )}
      initial={!reducedMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-blue-400"
        animate={!reducedMotion && stage !== 'complete' ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span>{message}</span>
    </motion.div>
  );
});

// ============================================================================
// QUALITY METER COMPONENT
// ============================================================================

/**
 * Quality tooltip content - extracted for memoization
 */
const QualityTooltipContent = memo(function QualityTooltipContent() {
  return (
    <div className="bg-gray-900/98 border border-white/20 rounded-lg shadow-xl p-3 backdrop-blur-xl pointer-events-auto">
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-white/20 transform rotate-45"></div>
      
      <h4 className="text-xs font-semibold text-white mb-1.5">
        Search Progress Quality Score
      </h4>
      
      <p className="text-xs text-white/80 leading-relaxed mb-2">
        This score indicates how complete and thorough the search process is, not the quality of individual papers.
      </p>
      
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-white/60 font-mono shrink-0">30pts</span>
          <span className="text-white/70">Source coverage (databases queried)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/60 font-mono shrink-0">30pts</span>
          <span className="text-white/70">Papers discovered (up to 200)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/60 font-mono shrink-0">40pts</span>
          <span className="text-white/70">Semantic analysis progress</span>
        </div>
      </div>
      
      <p className="text-xs text-white/60 mt-2 pt-2 border-t border-white/10">
        100% = All sources complete, papers found, full semantic analysis done
      </p>
    </div>
  );
});

/**
 * Quality score visualization with factor breakdown
 */
export const QualityMeter = memo<{
  score: number;
  animate: boolean;
}>(function QualityMeter({ score, animate }) {
  const springScore = useSpring(0, SPRING_PRESETS.counter);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (animate) {
      springScore.set(score);
    }
  }, [score, animate, springScore]);

  const displayScore = useTransform(springScore, (v) => Math.round(v));

  // Memoize quality level and color calculations
  const { qualityLevel, qualityColor } = useMemo(() => {
    const level = score >= 80 ? 'Excellent' :
      score >= 60 ? 'Good' :
      score >= 40 ? 'Fair' : 'Building...';
    
    const color = score >= 80 ? 'text-green-400' :
      score >= 60 ? 'text-blue-400' :
      score >= 40 ? 'text-yellow-400' : 'text-white/50';
    
    return { qualityLevel: level, qualityColor: color };
  }, [score]);

  // Memoize SVG constants
  const { viewBox, center } = useMemo(() => ({
    viewBox: QUALITY_METER_SIZE.viewBox,
    center: QUALITY_METER_SIZE.viewBox / 2,
  }), []);

  // Memoize tooltip handlers to prevent unnecessary re-renders
  const handleTooltipShow = useCallback(() => setShowTooltip(true), []);
  const handleTooltipHide = useCallback(() => setShowTooltip(false), []);

  return (
    <div className="flex items-center gap-2 relative group">
      {/* Score Ring */}
      <div
        className="relative"
        style={{ width: QUALITY_METER_SIZE.width, height: QUALITY_METER_SIZE.height }}
      >
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${viewBox} ${viewBox}`} aria-hidden="true">
          <circle
            cx={center}
            cy={center}
            r={QUALITY_METER_SIZE.radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={QUALITY_METER_SIZE.strokeWidth}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={QUALITY_METER_SIZE.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={QUALITY_METER_SIZE.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={100}
            className={qualityColor}
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - score }}
            transition={animate ? SPRING_PRESETS.gentle : { duration: 0 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className={cn('text-xs font-bold', qualityColor)}>
            {animate ? displayScore : score}
          </motion.span>
        </div>
      </div>

      {/* Label - Phase 10.134: Increased font sizes for readability */}
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', qualityColor)}>
          {qualityLevel}
        </span>
        <span className="text-xs text-white/50 uppercase tracking-wider"> {/* Phase 10.135: Increased from 10px to 12px */}
          Search Progress
        </span>
      </div>

      {/* Info Icon with Tooltip */}
      <button
        type="button"
        className="relative flex-shrink-0 w-4 h-4 text-white/40 hover:text-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
        onMouseEnter={handleTooltipShow}
        onMouseLeave={handleTooltipHide}
        onFocus={handleTooltipShow}
        onBlur={handleTooltipHide}
        aria-label="What does this quality score mean?"
      >
        <Info className="w-4 h-4" />
        
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 min-w-[240px] max-w-[280px] pointer-events-none">
            <QualityTooltipContent />
          </div>
        )}
      </button>
    </div>
  );
});

export default LiveCounter;
