/**
 * PaperQualityBadges Component
 * Phase 10.123 - Quality Score Display (Ranking moved to MatchScoreBadge)
 * Phase 10.145 - Dark mode support for all badge colors
 * Phase 10.146 - Touch/click support for mobile devices
 * Phase 10.154 - Apple-grade simplicity: Quality badge REMOVED (shown in MatchScoreBadge)
 *
 * NOW SHOWS ONLY:
 * - Citations per year badge (unique metric not shown elsewhere)
 *
 * REMOVED (Phase 10.154):
 * - Quality Score badge (duplicate - already shown in MatchScoreBadge composite breakdown)
 *
 * The detailed quality breakdown (citation impact, journal prestige, recency boost)
 * is now exclusively available via the MatchScoreBadge tooltip, avoiding UI clutter.
 *
 * @module PaperQualityBadges
 */

'use client';

import React, { memo } from 'react';
import { TrendingUp } from 'lucide-react';
// Phase 10.154: Removed unused imports (Award, Shield, AlertCircle, cn, constants)
// Quality badge removed - shown in MatchScoreBadge composite breakdown

// ============================================================================
// Types
// ============================================================================

/**
 * Phase 10.154: Simplified props - only citations per year shown
 * Quality score moved to MatchScoreBadge composite breakdown
 */
interface PaperQualityBadgesProps {
  /** Citations per year */
  citationsPerYear?: number | null | undefined;
  /** Citation count (shown in tooltip) */
  citationCount?: number | null | undefined;
  // Phase 10.154: qualityScore, qualityScoreBreakdown, metadataCompleteness REMOVED
  // These are now shown exclusively in MatchScoreBadge composite breakdown
}

// ============================================================================
// Component
// ============================================================================

/**
 * Phase 10.154: Simplified to only show citations per year
 * Quality score badge REMOVED - shown in MatchScoreBadge composite breakdown
 */
function PaperQualityBadgesComponent({
  citationsPerYear,
  citationCount,
}: PaperQualityBadgesProps) {
  // Don't render if no citation data
  if (
    citationsPerYear === null ||
    citationsPerYear === undefined ||
    citationsPerYear <= 0
  ) {
    return null;
  }

  return (
    <span
      className="flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-2 py-0.5 rounded-md"
      title={`Citation velocity: ${citationsPerYear.toFixed(1)} citations per year. This measures ongoing research impact - higher values indicate influential work that continues to be cited by other researchers.${citationCount ? ` Total citations: ${citationCount}.` : ''}`}
      aria-label={`${citationsPerYear.toFixed(1)} citations per year${citationCount ? ` (${citationCount} total citations)` : ''}. Citation velocity measures ongoing research impact.`}
    >
      <TrendingUp className="w-3 h-3" aria-hidden="true" />
      <span className="font-semibold">{citationsPerYear.toFixed(1)}</span>
      <span className="text-xs opacity-75">cites/yr</span>
    </span>
  );
}

// ============================================================================
// Memoized Export
// ============================================================================

/**
 * Phase 10.154: Simplified memoization - only citations per year checked
 */
export const PaperQualityBadges = memo(
  PaperQualityBadgesComponent,
  (prev, next) => {
    return (
      prev.citationsPerYear === next.citationsPerYear &&
      prev.citationCount === next.citationCount
    );
  }
);

PaperQualityBadges.displayName = 'PaperQualityBadges';
