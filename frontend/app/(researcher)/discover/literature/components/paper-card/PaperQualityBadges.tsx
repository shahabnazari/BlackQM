/**
 * PaperQualityBadges Component
 * Phase 10.123 - Quality Score Display (Ranking moved to MatchScoreBadge)
 *
 * QUALITY SCORE (measures paper quality, NOT used for sorting):
 * - Citation Impact: Citations per year, normalized by field
 * - Journal Prestige: Impact factor, h-index, quartile
 * - Recency: Exponential decay (4.6yr half-life)
 *
 * NOTE: Ranking score display moved to MatchScoreBadge in Phase 10.123 Phase 2
 *
 * WCAG 2.1 compliant with proper ARIA relationships
 *
 * @module PaperQualityBadges
 */

'use client';

import React, { useState, useId, useCallback, memo } from 'react';
import { TrendingUp, Award, Target, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetadataCompleteness } from '@/lib/types/literature.types';
import {
  getQualityLabel,
  getQualityColorClasses,
  getRelevanceTierLabel,
  getRelevanceColorClasses,
  getConfidenceLabel,
  getConfidenceColorClasses,
  getConfidenceExplanation,
  getScoreCap,
  QUALITY_WEIGHTS,
  OPTIONAL_BONUSES,
} from './constants';

// ============================================================================
// Types - Phase 10.107 Honest Quality Scoring
// ============================================================================

interface QualityScoreBreakdown {
  /** Citation impact score (0-100), 30% weight */
  citationImpact?: number;
  /** Journal prestige score (0-100), 50% weight */
  journalPrestige?: number;
  /** Recency boost score (0-100), 20% weight - Phase 10.942 */
  recencyBoost?: number;
  /** Open access bonus (+10) - Phase 10.942 */
  openAccessBonus?: number;
  /** Reproducibility bonus (+5) - Phase 10.942 */
  reproducibilityBonus?: number;
  /** Altmetric bonus (+5) - Phase 10.942 */
  altmetricBonus?: number;
  /** Core score before bonuses */
  coreScore?: number;
  /** Phase 10.107: Metadata completeness for transparency */
  metadataCompleteness?: MetadataCompleteness;
}

interface PaperQualityBadgesProps {
  /** Citations per year */
  citationsPerYear?: number | null | undefined;
  /** Overall quality score (0-100) */
  qualityScore?: number | null | undefined;
  /** Detailed quality score breakdown */
  qualityScoreBreakdown?: QualityScoreBreakdown | undefined;
  /** Citation count */
  citationCount?: number | null | undefined;
  /** BM25 relevance score (0-200+) - Phase 10.942 (fallback when no neural score) */
  relevanceScore?: number | null | undefined;
  /** Phase 10.107: Metadata completeness */
  metadataCompleteness?: MetadataCompleteness | undefined;
}

// ============================================================================
// Component
// ============================================================================

function PaperQualityBadgesComponent({
  citationsPerYear,
  qualityScore,
  qualityScoreBreakdown,
  citationCount,
  relevanceScore,
  metadataCompleteness,
}: PaperQualityBadgesProps) {
  const [showQualityTooltip, setShowQualityTooltip] = useState(false);

  // Memoized tooltip handlers to prevent unnecessary re-renders
  const handleShowTooltip = useCallback(() => setShowQualityTooltip(true), []);
  const handleHideTooltip = useCallback(() => setShowQualityTooltip(false), []);

  // Generate unique IDs for ARIA relationships (proper accessibility)
  const qualityTooltipId = useId();

  // Get metadata completeness from breakdown or props
  const metadata = qualityScoreBreakdown?.metadataCompleteness ?? metadataCompleteness;
  const availableMetrics = metadata?.availableMetrics ?? 0;
  const totalMetrics = metadata?.totalMetrics ?? 4;

  // Don't render if no quality data
  const hasQualityData =
    (citationsPerYear !== null &&
      citationsPerYear !== undefined &&
      citationsPerYear > 0) ||
    (qualityScore !== null && qualityScore !== undefined) ||
    (relevanceScore !== null && relevanceScore !== undefined);

  if (!hasQualityData) {
    return null;
  }

  // Calculate total bonuses
  const totalBonuses =
    (qualityScoreBreakdown?.openAccessBonus ?? 0) +
    (qualityScoreBreakdown?.reproducibilityBonus ?? 0) +
    (qualityScoreBreakdown?.altmetricBonus ?? 0);

  // Get score cap for current data completeness
  const scoreCap = getScoreCap(availableMetrics);

  return (
    <>
      {/* BM25 Relevance Tier Badge - Phase 10.942 (fallback when MatchScoreBadge not available) */}
      {relevanceScore !== null && relevanceScore !== undefined && (
        <span
          className={cn(
            'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md border',
            getRelevanceColorClasses(relevanceScore)
          )}
          title={`BM25 relevance score: ${relevanceScore}. Keyword matching score.`}
          aria-label={`${getRelevanceTierLabel(relevanceScore)} - BM25 score ${relevanceScore}`}
        >
          <Target className="w-3 h-3" aria-hidden="true" />
          <span className="text-xs">{getRelevanceTierLabel(relevanceScore)}</span>
        </span>
      )}

      {/* Citations per Year */}
      {citationsPerYear !== null &&
        citationsPerYear !== undefined &&
        citationsPerYear > 0 && (
          <span
            className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
            title="Citation velocity (citations per year) - measures ongoing research impact. Higher values indicate influential work that continues to be cited."
            aria-label={`${citationsPerYear.toFixed(1)} citations per year`}
          >
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span className="font-semibold">{citationsPerYear.toFixed(1)}</span>
            <span className="text-xs opacity-75">cites/yr</span>
          </span>
        )}

      {/* Quality Score Badge with Confidence - Phase 10.107 */}
      {qualityScore !== null && qualityScore !== undefined && (
        <span className="relative inline-block">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md cursor-help border',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              getQualityColorClasses(qualityScore)
            )}
            onMouseEnter={handleShowTooltip}
            onMouseLeave={handleHideTooltip}
            onFocus={handleShowTooltip}
            onBlur={handleHideTooltip}
            aria-label={`Quality score: ${qualityScore} out of 100, rated ${getQualityLabel(qualityScore)}. Confidence: ${getConfidenceLabel(availableMetrics)} (${availableMetrics}/${totalMetrics} metrics). Press to view detailed breakdown.`}
            aria-describedby={showQualityTooltip ? qualityTooltipId : undefined}
          >
            <Award className="w-3 h-3" aria-hidden="true" />
            <span className="font-semibold">{qualityScore.toFixed(0)}</span>
            <span className="text-xs opacity-75">
              {getQualityLabel(qualityScore)}
            </span>
            {/* Confidence indicator inline */}
            <span
              className={cn(
                'text-[10px] px-1 rounded ml-0.5',
                getConfidenceColorClasses(availableMetrics)
              )}
              title={`Confidence: ${getConfidenceLabel(availableMetrics)} - ${getConfidenceExplanation(availableMetrics)}`}
            >
              {availableMetrics}/{totalMetrics}
            </span>
            <svg
              className="w-3 h-3 ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Detailed Breakdown Tooltip - Phase 10.107 */}
          {showQualityTooltip && (
            <div
              id={qualityTooltipId}
              className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[400px]"
              role="tooltip"
              aria-live="polite"
            >
              <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4 border border-gray-700">
                {/* Header with Confidence Badge */}
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-sm text-purple-300">
                    QUALITY SCORE v4.1
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium',
                    getConfidenceColorClasses(availableMetrics)
                  )}>
                    <Shield className="w-3 h-3" />
                    {getConfidenceLabel(availableMetrics)} Confidence ({availableMetrics}/{totalMetrics})
                  </div>
                </div>

                {/* Score and Cap */}
                <div className="mb-3 pb-3 border-b border-gray-700">
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    SCORE: {qualityScore.toFixed(0)}/100
                    {availableMetrics < 4 && (
                      <span className="text-xs text-amber-400 font-normal">
                        (capped at {scoreCap} with {availableMetrics}/{totalMetrics} metrics)
                      </span>
                    )}
                  </div>
                  {qualityScoreBreakdown?.coreScore !== undefined && (
                    <div className="text-gray-400 text-xs mt-1">
                      Core: {qualityScoreBreakdown.coreScore.toFixed(1)} + Bonuses: {totalBonuses}
                    </div>
                  )}
                </div>

                {/* Data Availability Section - Phase 10.107 */}
                <div className="mb-3 pb-3 border-b border-gray-700">
                  <div className="font-semibold text-cyan-300 mb-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    DATA TRANSPARENCY
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-2">
                    <div className="flex items-center gap-1">
                      {metadata?.hasCitations ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">✗</span>
                      )}
                      <span className={metadata?.hasCitations ? 'text-white' : 'text-gray-500'}>
                        Citations
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {metadata?.hasJournalMetrics ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">✗</span>
                      )}
                      <span className={metadata?.hasJournalMetrics ? 'text-white' : 'text-gray-500'}>
                        Journal Metrics
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {metadata?.hasYear ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">✗</span>
                      )}
                      <span className={metadata?.hasYear ? 'text-white' : 'text-gray-500'}>
                        Year
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {metadata?.hasAbstract ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">✗</span>
                      )}
                      <span className={metadata?.hasAbstract ? 'text-white' : 'text-gray-500'}>
                        Abstract
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400 ml-2">
                    {getConfidenceExplanation(availableMetrics)}
                  </div>
                </div>

                {/* Citation Impact - 30% */}
                {qualityScoreBreakdown?.citationImpact !== undefined && (
                  <div className="mb-2 pb-2 border-b border-gray-700">
                    <div className="font-semibold text-blue-300 mb-1 flex justify-between">
                      <span>CITATION IMPACT</span>
                      <span className="text-blue-400">{QUALITY_WEIGHTS.CITATION_IMPACT}%</span>
                    </div>
                    <div className="ml-2 flex justify-between">
                      <span>Score:</span>
                      <span>{qualityScoreBreakdown.citationImpact.toFixed(1)}</span>
                    </div>
                    {citationCount !== null && citationCount !== undefined && (
                      <div className="ml-2 text-gray-400 flex justify-between">
                        <span>Total citations:</span>
                        <span>{citationCount}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Journal Prestige - 50% */}
                {qualityScoreBreakdown?.journalPrestige !== undefined && (
                  <div className="mb-2 pb-2 border-b border-gray-700">
                    <div className="font-semibold text-green-300 mb-1 flex justify-between">
                      <span>JOURNAL PRESTIGE</span>
                      <span className="text-green-400">{QUALITY_WEIGHTS.JOURNAL_PRESTIGE}%</span>
                    </div>
                    <div className="ml-2 flex justify-between">
                      <span>Score:</span>
                      <span>{qualityScoreBreakdown.journalPrestige.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {/* Recency Boost - 20% (Phase 10.942) */}
                {qualityScoreBreakdown?.recencyBoost !== undefined && (
                  <div className="mb-2 pb-2 border-b border-gray-700">
                    <div className="font-semibold text-orange-300 mb-1 flex justify-between">
                      <span>RECENCY BOOST</span>
                      <span className="text-orange-400">{QUALITY_WEIGHTS.RECENCY_BOOST}%</span>
                    </div>
                    <div className="ml-2 flex justify-between">
                      <span>Score:</span>
                      <span>{qualityScoreBreakdown.recencyBoost.toFixed(1)}</span>
                    </div>
                    <div className="ml-2 text-gray-400 text-[10px]">
                      Exponential decay (λ=0.15, half-life 4.6 years)
                    </div>
                  </div>
                )}

                {/* Optional Bonuses - Phase 10.942 */}
                {totalBonuses > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-yellow-300 mb-1">
                      OPTIONAL BONUSES (+{totalBonuses})
                    </div>
                    <div className="ml-2 space-y-1">
                      {qualityScoreBreakdown?.openAccessBonus !== undefined &&
                        qualityScoreBreakdown.openAccessBonus > 0 && (
                          <div className="flex justify-between text-green-300">
                            <span>✓ Open Access</span>
                            <span>+{OPTIONAL_BONUSES.OPEN_ACCESS}</span>
                          </div>
                        )}
                      {qualityScoreBreakdown?.reproducibilityBonus !== undefined &&
                        qualityScoreBreakdown.reproducibilityBonus > 0 && (
                          <div className="flex justify-between text-cyan-300">
                            <span>✓ Data/Code Shared</span>
                            <span>+{OPTIONAL_BONUSES.REPRODUCIBILITY}</span>
                          </div>
                        )}
                      {qualityScoreBreakdown?.altmetricBonus !== undefined &&
                        qualityScoreBreakdown.altmetricBonus > 0 && (
                          <div className="flex justify-between text-pink-300">
                            <span>✓ Social Impact</span>
                            <span>+{OPTIONAL_BONUSES.ALTMETRIC}</span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Low Confidence Warning */}
                {availableMetrics < 2 && (
                  <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700 rounded flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-amber-200 text-[10px]">
                      <strong>Limited Data:</strong> This source doesn&apos;t provide complete metadata.
                      The quality score is based on {availableMetrics === 0 ? 'no' : 'minimal'} metrics
                      and should be interpreted with caution.
                    </div>
                  </div>
                )}

                {/* Algorithm Reference */}
                <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-700">
                  v4.1 methodology: Honest scoring - only scores what we know.
                  Waltman & van Eck (2019), Garfield (1980)
                </div>
              </div>
            </div>
          )}
        </span>
      )}
    </>
  );
}

// ============================================================================
// Memoized Export with Custom Comparison
// ============================================================================

export const PaperQualityBadges = memo(
  PaperQualityBadgesComponent,
  (prev, next) => {
    return (
      prev.citationsPerYear === next.citationsPerYear &&
      prev.qualityScore === next.qualityScore &&
      prev.citationCount === next.citationCount &&
      prev.relevanceScore === next.relevanceScore &&
      prev.qualityScoreBreakdown === next.qualityScoreBreakdown &&
      prev.metadataCompleteness === next.metadataCompleteness
    );
  }
);

PaperQualityBadges.displayName = 'PaperQualityBadges';
