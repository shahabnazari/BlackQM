/**
 * MatchScoreBadge Component
 * Phase 10.123 Phase 2: Netflix-Grade Accessible Badge
 *
 * FEATURES:
 * - Touch/tap support for mobile devices
 * - Keyboard navigation (Enter/Space to toggle, Escape to close)
 * - Hover support for desktop
 * - Auto-dismiss on touch (3 second timeout)
 * - WCAG 2.1 AA compliant with proper ARIA
 * - Screen reader support with sr-only text
 * - Dark mode support
 * - Quality tier indicator (Gold/Silver/Bronze)
 * - Memory leak prevention (timeout cleanup)
 *
 * @module MatchScoreBadge
 */

'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useId,
  useMemo,
  useEffect,
  memo,
} from 'react';
import { Zap, Target, Brain, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getQualityTier,
  getQualityTierIcon,
  getQualityTierLabel,
  getQualityTierColors,
  getMatchScoreLabel,
  getMatchScoreColors,
  parseNeuralExplanation,
  RANKING_WEIGHTS,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface MatchScoreBadgeProps {
  /** Combined ranking score (0-100) - THIS IS THE SORTING SCORE */
  neuralRelevanceScore: number | null | undefined;
  /** Neural ranking position (1 = most relevant) */
  neuralRank: number | null | undefined;
  /** Explanation: "BM25=45, Sem=72, ThemeFit=58" */
  neuralExplanation: string | null | undefined;
  /** Paper quality score (0-100) for tier display */
  qualityScore: number | null | undefined;
  /** Citation count for tooltip context */
  citationCount: number | null | undefined;
  /** Citations per year for tooltip context */
  citationsPerYear: number | null | undefined;
  /** Venue/journal name for tooltip context */
  venue: string | null | undefined;
  /** Optional callback when tooltip is opened (for analytics) */
  onTooltipOpen?: (() => void) | undefined;
  /** Optional callback when tooltip is closed (for analytics) */
  onTooltipClose?: (() => void) | undefined;
}

// ============================================================================
// Constants
// ============================================================================

/** Auto-dismiss timeout for touch devices (ms) */
const TOUCH_AUTO_DISMISS_MS = 3000;

/** Delay before closing tooltip on blur (allows clicking tooltip content) */
const BLUR_CLOSE_DELAY_MS = 150;

// ============================================================================
// Component
// ============================================================================

function MatchScoreBadgeComponent({
  neuralRelevanceScore,
  neuralRank,
  neuralExplanation,
  qualityScore,
  citationCount,
  citationsPerYear,
  venue,
  onTooltipOpen,
  onTooltipClose,
}: MatchScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Track if touch event occurred to prevent click double-fire on mobile */
  const isTouchEventRef = useRef(false);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current !== null) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
      if (blurTimeoutRef.current !== null) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // Memoized Values
  // ============================================================================

  /** Validate and normalize score */
  const score = useMemo(() => {
    if (
      neuralRelevanceScore === null ||
      neuralRelevanceScore === undefined ||
      Number.isNaN(neuralRelevanceScore)
    ) {
      return null;
    }
    if (!Number.isFinite(neuralRelevanceScore)) {
      return neuralRelevanceScore > 0 ? 100 : 0;
    }
    return Math.max(0, Math.min(100, neuralRelevanceScore));
  }, [neuralRelevanceScore]);

  /** Quality tier from score */
  const qualityTier = useMemo(() => getQualityTier(qualityScore), [qualityScore]);

  /** Parsed neural explanation breakdown */
  const parsedExplanation = useMemo(
    () => parseNeuralExplanation(neuralExplanation ?? undefined),
    [neuralExplanation]
  );

  /** Match label for display */
  const matchLabel = useMemo(() => getMatchScoreLabel(score), [score]);

  /** Tier icon for display */
  const tierIcon = useMemo(() => getQualityTierIcon(qualityTier), [qualityTier]);

  /** Tier label for accessibility */
  const tierLabel = useMemo(() => getQualityTierLabel(qualityTier), [qualityTier]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /** Open tooltip with analytics callback */
  const openTooltip = useCallback(() => {
    setShowTooltip(true);
    onTooltipOpen?.();
  }, [onTooltipOpen]);

  /** Close tooltip with analytics callback */
  const closeTooltip = useCallback(() => {
    setShowTooltip(false);
    onTooltipClose?.();
  }, [onTooltipClose]);

  /** Desktop hover enter */
  const handleMouseEnter = useCallback(() => {
    // Clear any pending blur close
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    openTooltip();
  }, [openTooltip]);

  /** Desktop hover leave */
  const handleMouseLeave = useCallback(() => {
    closeTooltip();
  }, [closeTooltip]);

  /** Click/tap toggle - skips if touch event already handled */
  const handleClick = useCallback(() => {
    // Skip if touch event already handled this interaction
    if (isTouchEventRef.current) {
      return;
    }

    setShowTooltip((prev) => {
      const newValue = !prev;
      if (newValue) {
        onTooltipOpen?.();
      } else {
        onTooltipClose?.();
      }
      return newValue;
    });
  }, [onTooltipOpen, onTooltipClose]);

  /** Touch start - show tooltip with auto-dismiss */
  const handleTouchStart = useCallback(() => {
    // Mark that touch event occurred (prevents onClick from firing)
    isTouchEventRef.current = true;

    openTooltip();

    // Clear existing timeout
    if (touchTimeoutRef.current !== null) {
      clearTimeout(touchTimeoutRef.current);
    }

    // Auto-dismiss after delay
    touchTimeoutRef.current = setTimeout(() => {
      touchTimeoutRef.current = null;
      closeTooltip();
    }, TOUCH_AUTO_DISMISS_MS);
  }, [openTooltip, closeTooltip]);

  /** Touch end - reset touch flag after a delay */
  const handleTouchEnd = useCallback(() => {
    // Reset touch flag after click event would have fired
    setTimeout(() => {
      isTouchEventRef.current = false;
    }, 100);
  }, []);

  /** Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTooltip();
        buttonRef.current?.focus();
      }
    },
    [handleClick, closeTooltip]
  );

  /** Focus handler */
  const handleFocus = useCallback(() => {
    // Clear any pending blur close
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    openTooltip();
  }, [openTooltip]);

  /** Blur handler with delay to allow clicking tooltip content */
  const handleBlur = useCallback(() => {
    // Clear any existing blur timeout
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
    }

    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      closeTooltip();
    }, BLUR_CLOSE_DELAY_MS);
  }, [closeTooltip]);

  // ============================================================================
  // Render null if no valid score
  // ============================================================================
  if (score === null) {
    return null;
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <span className="relative inline-block">
      {/* Main Badge Button */}
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md cursor-help border',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
          'dark:focus:ring-offset-gray-900',
          'transition-all duration-200',
          getMatchScoreColors(score)
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Match score: ${score.toFixed(0)}, ${matchLabel}. ${tierLabel}. Rank #${neuralRank ?? 'unknown'}. Click or tap for details.`}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-expanded={showTooltip}
        aria-haspopup="dialog"
      >
        <Zap className="w-3 h-3" aria-hidden="true" />
        <span className="font-bold">{score.toFixed(0)}</span>
        <span className="text-xs opacity-75">{matchLabel}</span>
        {tierIcon && (
          <span
            role="img"
            aria-label={tierLabel}
            title={tierLabel}
            className={cn('ml-0.5', getQualityTierColors(qualityTier))}
          >
            {tierIcon}
          </span>
        )}
        {neuralRank !== null && neuralRank !== undefined && (
          <span className="text-[10px] px-1 bg-white/20 dark:bg-black/20 rounded">
            #{neuralRank}
          </span>
        )}
      </button>

      {/* Screen Reader Only - Full Description */}
      <span className="sr-only">
        Match Score: {score.toFixed(0)} out of 100, ranked number{' '}
        {neuralRank ?? 'unknown'}. Breakdown: BM25 keyword match{' '}
        {parsedExplanation?.bm25 ?? 'unknown'} ({RANKING_WEIGHTS.BM25}% weight),
        Semantic similarity {parsedExplanation?.semantic ?? 'unknown'} (
        {RANKING_WEIGHTS.SEMANTIC}% weight), Theme fit for Q-methodology{' '}
        {parsedExplanation?.themeFit ?? 'unknown'} ({RANKING_WEIGHTS.THEME_FIT}%
        weight). Paper Quality: {tierLabel} (
        {qualityScore?.toFixed(0) ?? 'unknown'} out of 100).
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          id={tooltipId}
          role="dialog"
          aria-label="Match Score Details"
          aria-modal="false"
          className={cn(
            'absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[380px]',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
        >
          <div className="bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg shadow-2xl p-4 border border-purple-500 dark:border-purple-400">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-sm text-purple-300 dark:text-purple-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4" aria-hidden="true" />
                MATCH SCORE
              </div>
              <div className="bg-purple-600 dark:bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                SORTING SCORE
              </div>
            </div>

            {/* Score Display */}
            <div className="mb-3 pb-3 border-b border-gray-700 dark:border-gray-600">
              <div className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  {score.toFixed(0)}/100
                </span>
                {neuralRank !== null && neuralRank !== undefined && (
                  <span className="text-sm text-gray-400 dark:text-gray-300 font-normal">
                    #{neuralRank}
                  </span>
                )}
              </div>
              <div className="text-gray-400 dark:text-gray-300 text-xs mt-1">
                {matchLabel} - Papers are sorted by this score
              </div>
            </div>

            {/* Breakdown Section */}
            <div className="space-y-2 mb-3 pb-3 border-b border-gray-700 dark:border-gray-600">
              <div className="font-semibold text-cyan-300 dark:text-cyan-200 text-xs">
                WHY THIS PAPER RANKS HERE:
              </div>

              {/* BM25 */}
              <div className="flex items-center justify-between p-2 bg-gray-800/50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-2">
                  <Target
                    className="w-4 h-4 text-blue-400"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold text-blue-300 dark:text-blue-200">
                      Keyword Match
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-300">
                      BM25 exact terms
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-300 dark:text-blue-200 font-bold">
                    {parsedExplanation?.bm25 ?? '?'}/100
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {RANKING_WEIGHTS.BM25}% weight
                  </div>
                </div>
              </div>

              {/* Semantic */}
              <div className="flex items-center justify-between p-2 bg-gray-800/50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-2">
                  <Brain
                    className="w-4 h-4 text-green-400"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold text-green-300 dark:text-green-200">
                      Semantic Similarity
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-300">
                      AI embeddings
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-300 dark:text-green-200 font-bold">
                    {parsedExplanation?.semantic ?? '?'}/100
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {RANKING_WEIGHTS.SEMANTIC}% weight
                  </div>
                </div>
              </div>

              {/* Theme Fit */}
              <div className="flex items-center justify-between p-2 bg-gray-800/50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className="w-4 h-4 text-orange-400"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold text-orange-300 dark:text-orange-200">
                      Topic Fit
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-300">
                      Q-method suitability
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-orange-300 dark:text-orange-200 font-bold">
                    {parsedExplanation?.themeFit ?? '?'}/100
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {RANKING_WEIGHTS.THEME_FIT}% weight
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Tier Section */}
            <div className="space-y-1">
              <div className="font-semibold text-cyan-300 dark:text-cyan-200 text-xs flex items-center gap-1">
                PAPER QUALITY:
                {tierIcon && (
                  <span role="img" aria-label={tierLabel}>
                    {tierIcon}
                  </span>
                )}
                <span className={getQualityTierColors(qualityTier)}>
                  {tierLabel}
                </span>
                <span className="text-gray-400 dark:text-gray-300">
                  ({qualityScore?.toFixed(0) ?? '?'}/100)
                </span>
              </div>
              {citationCount !== null && citationCount !== undefined && (
                <div className="text-[10px] text-gray-400 dark:text-gray-300">
                  {citationCount} citations
                  {citationsPerYear !== null && citationsPerYear !== undefined
                    ? ` (${citationsPerYear.toFixed(1)}/year)`
                    : ''}
                  {venue ? ` · ${venue}` : ''}
                </div>
              )}
            </div>

            {/* Keyboard Hint */}
            <div className="mt-3 pt-2 border-t border-gray-700 dark:border-gray-600 text-[10px] text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1 bg-gray-700 rounded">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

// ============================================================================
// Memoized Export with Custom Comparison
// ============================================================================

export const MatchScoreBadge = memo(MatchScoreBadgeComponent, (prev, next) => {
  return (
    prev.neuralRelevanceScore === next.neuralRelevanceScore &&
    prev.neuralRank === next.neuralRank &&
    prev.neuralExplanation === next.neuralExplanation &&
    prev.qualityScore === next.qualityScore &&
    prev.citationCount === next.citationCount &&
    prev.citationsPerYear === next.citationsPerYear &&
    prev.venue === next.venue
  );
});

MatchScoreBadge.displayName = 'MatchScoreBadge';
