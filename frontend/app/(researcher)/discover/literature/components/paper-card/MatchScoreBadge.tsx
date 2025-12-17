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
  /** Combined relevance score (0-100) - How well paper matches query */
  neuralRelevanceScore: number | null | undefined;
  /** Neural ranking position (1 = most relevant) */
  neuralRank: number | null | undefined;
  /** Explanation: "BM25=45, Sem=72, ThemeFit=58" */
  neuralExplanation: string | null | undefined;
  /** Paper quality score (0-100) for tier display */
  qualityScore: number | null | undefined;
  /** Phase 10.147: Composite overall score (0-100) - PRIMARY RANKING SCORE */
  /** Combines relevance + quality - ensures BEST papers rank highest */
  overallScore?: number | null | undefined;
  /** Citation count for tooltip context */
  citationCount: number | null | undefined;
  /** Citations per year for tooltip context */
  citationsPerYear: number | null | undefined;
  /** Venue/journal name for tooltip context */
  venue: string | null | undefined;
  /** Phase 10.169: Journal prestige score (0-100) from quality breakdown */
  journalPrestige?: number | null | undefined;
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

/**
 * Phase 10.169: Decode HTML entities in venue name
 * Fixes "&amp;" showing as literal text
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, match => entities[match] || match);
}

/**
 * Phase 10.169: Get journal prestige label from score
 */
function getJournalPrestigeLabel(score: number | null | undefined): string {
  if (score == null) return 'Unknown';
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Minimal';
}

/**
 * Phase 10.169: Get journal prestige color classes
 */
function getJournalPrestigeColors(score: number | null | undefined): string {
  if (score == null) return 'text-gray-400';
  if (score >= 80) return 'text-yellow-400';
  if (score >= 60) return 'text-green-400';
  if (score >= 40) return 'text-blue-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-gray-400';
}

// ============================================================================
// Component
// ============================================================================

function MatchScoreBadgeComponent({
  neuralRelevanceScore,
  neuralRank,
  neuralExplanation,
  qualityScore,
  overallScore,
  citationCount,
  citationsPerYear,
  venue,
  journalPrestige,
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

  /** Phase 10.147: Use overallScore (relevance + quality) as primary, fallback to relevance */
  /** Overall score ensures BEST papers (high relevance + high quality) are shown */
  /** Enterprise-Grade: Full validation, edge case handling, type safety */
  const score = useMemo(() => {
    // Prefer overallScore if available (composite of relevance + quality)
    const primaryScore = overallScore ?? neuralRelevanceScore;
    
    // Strict validation: null, undefined, NaN check
    if (
      primaryScore === null ||
      primaryScore === undefined ||
      Number.isNaN(primaryScore)
    ) {
      return null;
    }
    
    // Infinity handling: clamp to valid range
    if (!Number.isFinite(primaryScore)) {
      return primaryScore > 0 ? 100 : 0;
    }
    
    // Clamp to valid range [0, 100]
    return Math.max(0, Math.min(100, primaryScore));
  }, [overallScore, neuralRelevanceScore]);

  /** Check if we're using composite overall score (validated) */
  // Netflix-Grade: Simple boolean check, no need for useMemo (cheap operation)
  const isCompositeScore = overallScore != null && 
                          Number.isFinite(overallScore) && 
                          !Number.isNaN(overallScore);

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
  // Phase 10.147: Allow score of 0 if overallScore exists (composite score is valid even at 0)
  // Only hide if score is null OR if it's 0 with no explanation AND no overallScore
  // ============================================================================
  if (score === null || (score === 0 && !parsedExplanation && !isCompositeScore)) {
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
        aria-label={`${isCompositeScore ? 'Overall' : 'Match'} score: ${score.toFixed(0)}, ${matchLabel}. ${tierLabel}. Rank #${neuralRank ?? 'unknown'}. Click or tap for details.`}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-expanded={showTooltip}
        aria-haspopup="dialog"
      >
        <Zap className="w-3 h-3" aria-hidden="true" />
        <span className="font-bold">{score.toFixed(0)}</span>
        <span className="text-xs opacity-75">{matchLabel}</span>
        {/* Phase 10.147: Visual indicator for composite score */}
        {isCompositeScore && (
          <span 
            className="text-[9px] px-1 bg-purple-500/30 dark:bg-purple-400/30 text-purple-200 dark:text-purple-100 rounded font-medium"
            title="Composite score combining relevance and quality"
            aria-label="Composite score"
          >
            ⭐
          </span>
        )}
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

      {/* Tooltip - Phase 10.155: Compact 2-column WCAG-compliant design */}
      {showTooltip && (
        <div
          id={tooltipId}
          role="dialog"
          aria-label={isCompositeScore ? "Overall Score Details" : "Match Score Details"}
          aria-modal="false"
          className={cn(
            'absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            // Phase 10.155: Responsive width, max-height with scroll
            'w-[420px] max-w-[calc(100vw-1rem)] max-h-[80vh] overflow-y-auto',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
        >
          <div className="bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg shadow-2xl p-3 border border-purple-500/80 dark:border-purple-400/80">
            {/* Header Row - Score + Rank */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {score.toFixed(0)}
                </span>
                <span className="text-gray-400 text-sm">/100</span>
                {neuralRank != null && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">
                    Rank #{neuralRank}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded font-medium',
                getMatchScoreColors(score)
              )}>
                {matchLabel}
              </span>
            </div>

            {/* Phase 10.155: 2-Column Grid Layout */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* LEFT COLUMN: Relevance Breakdown */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide mb-1">
                  Relevance ({neuralRelevanceScore?.toFixed(0) ?? '?'}/100)
                </div>

                {parsedExplanation ? (
                  <div className="space-y-1">
                    {/* BM25 */}
                    <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-blue-400" aria-hidden="true" />
                        <span className="text-blue-300">Keywords</span>
                      </div>
                      <span className="text-blue-200 font-semibold">
                        {parsedExplanation.bm25}
                        <span className="text-gray-500 text-[9px] ml-0.5">({RANKING_WEIGHTS.BM25}%)</span>
                      </span>
                    </div>

                    {/* Semantic */}
                    <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3 h-3 text-green-400" aria-hidden="true" />
                        <span className="text-green-300">Semantic</span>
                      </div>
                      <span className="text-green-200 font-semibold">
                        {parsedExplanation.semantic}
                        <span className="text-gray-500 text-[9px] ml-0.5">({RANKING_WEIGHTS.SEMANTIC}%)</span>
                      </span>
                    </div>

                    {/* Topic Fit */}
                    <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-orange-400" aria-hidden="true" />
                        <span className="text-orange-300">Topic Fit</span>
                      </div>
                      <span className="text-orange-200 font-semibold">
                        {parsedExplanation.themeFit}
                        <span className="text-gray-500 text-[9px] ml-0.5">({RANKING_WEIGHTS.THEME_FIT}%)</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-900/20 border border-amber-700/30 rounded text-amber-300 text-[10px]">
                    Breakdown unavailable
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Quality + Overall */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide mb-1">
                  Quality ({qualityScore?.toFixed(0) ?? '?'}/100)
                </div>

                {/* Quality Tier */}
                <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {tierIcon && (
                      <span role="img" aria-label={tierLabel} className="text-sm">
                        {tierIcon}
                      </span>
                    )}
                    <span className={getQualityTierColors(qualityTier)}>{tierLabel}</span>
                  </div>
                  <span className="text-gray-300 font-semibold">
                    {qualityScore?.toFixed(0) ?? '?'}
                  </span>
                </div>

                {/* Phase 10.169: Journal Prestige with proper label and score */}
                <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                  <span className="text-gray-400">Journal Prestige</span>
                  <span className={cn('font-semibold', getJournalPrestigeColors(journalPrestige))}>
                    {journalPrestige != null ? (
                      <>
                        {getJournalPrestigeLabel(journalPrestige)}
                        <span className="text-gray-500 text-[9px] ml-0.5">
                          ({journalPrestige})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </span>
                </div>

                {/* Citations */}
                {citationCount != null && (
                  <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[11px]">
                    <span className="text-gray-400">Citations</span>
                    <span className="text-gray-200">
                      {citationCount}
                      {citationsPerYear != null && (
                        <span className="text-gray-500 text-[9px] ml-0.5">
                          ({citationsPerYear.toFixed(1)}/yr)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Phase 10.169: Venue with proper label and decoded HTML entities */}
                {venue && (
                  <div className="flex items-center justify-between p-1.5 bg-gray-800/60 rounded text-[10px]">
                    <span className="text-gray-500">Journal:</span>
                    <span className="text-gray-300 truncate ml-1 max-w-[140px]" title={decodeHtmlEntities(venue)}>
                      {decodeHtmlEntities(venue)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Phase 10.155: Composite Score Formula (compact) */}
            {/* Phase 10.156: Only show when ALL values are valid numbers */}
            {isCompositeScore &&
             neuralRelevanceScore != null && Number.isFinite(neuralRelevanceScore) &&
             qualityScore != null && Number.isFinite(qualityScore) &&
             score != null && (
              <div className="p-2 bg-purple-900/30 border border-purple-600/40 rounded mb-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-300">
                    Overall = 2×(R×Q)/(R+Q)
                  </span>
                  <span className="text-purple-200 font-bold">
                    2×({Math.round(neuralRelevanceScore)}×{Math.round(qualityScore)})/({Math.round(neuralRelevanceScore)}+{Math.round(qualityScore)}) = {score.toFixed(0)}
                  </span>
                </div>
                <div className="text-[9px] text-purple-400/80 mt-1">
                  Harmonic mean ensures both relevance AND quality must be high
                </div>
              </div>
            )}

            {/* Footer: Keyboard hint */}
            <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1 border-t border-gray-700/50">
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400">Esc</kbd> to close
              </span>
              <span className="text-gray-600">Phase 10.155</span>
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
  // Phase 10.147: Include overallScore in comparison (critical for composite scoring)
  // Phase 10.169: Include journalPrestige in comparison
  return (
    prev.neuralRelevanceScore === next.neuralRelevanceScore &&
    prev.neuralRank === next.neuralRank &&
    prev.neuralExplanation === next.neuralExplanation &&
    prev.qualityScore === next.qualityScore &&
    prev.overallScore === next.overallScore &&
    prev.citationCount === next.citationCount &&
    prev.citationsPerYear === next.citationsPerYear &&
    prev.venue === next.venue &&
    prev.journalPrestige === next.journalPrestige
  );
});

MatchScoreBadge.displayName = 'MatchScoreBadge';
