/**
 * PaperQualityBadges Component
 * Phase 10.942 Day 3 - Quality Score v4.0 Integration
 *
 * Displays quality indicators: citations per year, quality score breakdown, and relevance tier
 *
 * Quality Weights (v4.0):
 * - 30% Citation Impact (FWCI)
 * - 50% Journal Prestige
 * - 20% Recency Boost
 * - Optional: +10 OA, +5 Data/Code, +5 Altmetric
 *
 * ✅ WCAG 2.1 compliant with proper ARIA relationships
 * ✅ Helper functions moved outside component (no recreation on render)
 * ✅ Magic numbers replaced with constants
 *
 * @module PaperQualityBadges
 */

'use client';

import React, { useState, useId } from 'react';
import { TrendingUp, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getQualityLabel,
  getQualityColorClasses,
  getRelevanceTierLabel,
  getRelevanceColorClasses,
  QUALITY_WEIGHTS,
  OPTIONAL_BONUSES,
} from './constants';

// ============================================================================
// Types - Phase 10.942 v4.0 Quality Scoring
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
  /** Relevance score (0-200+) - Phase 10.942 */
  relevanceScore?: number | null | undefined;
}

// ============================================================================
// Component
// ============================================================================

export function PaperQualityBadges({
  citationsPerYear,
  qualityScore,
  qualityScoreBreakdown,
  citationCount,
  relevanceScore,
}: PaperQualityBadgesProps) {
  const [showQualityTooltip, setShowQualityTooltip] = useState(false);

  // Generate unique ID for ARIA relationship (proper accessibility)
  const tooltipId = useId();

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

  return (
    <>
      {/* Relevance Tier Badge - Phase 10.942 */}
      {relevanceScore !== null && relevanceScore !== undefined && (
        <span
          className={cn(
            'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md border',
            getRelevanceColorClasses(relevanceScore)
          )}
          title={`Relevance score: ${relevanceScore}. BM25 algorithm (Robertson & Walker 1994) with position weighting.`}
          aria-label={`${getRelevanceTierLabel(relevanceScore)} - score ${relevanceScore}`}
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

      {/* Quality Score Badge with Tooltip */}
      {qualityScore !== null && qualityScore !== undefined && (
        <span className="relative inline-block">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md cursor-help border',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              getQualityColorClasses(qualityScore)
            )}
            onMouseEnter={() => setShowQualityTooltip(true)}
            onMouseLeave={() => setShowQualityTooltip(false)}
            onFocus={() => setShowQualityTooltip(true)}
            onBlur={() => setShowQualityTooltip(false)}
            aria-label={`Quality score: ${qualityScore} out of 100, rated ${getQualityLabel(qualityScore)}. Press to view detailed breakdown.`}
            aria-describedby={showQualityTooltip ? tooltipId : undefined}
          >
            <Award className="w-3 h-3" aria-hidden="true" />
            <span className="font-semibold">{qualityScore.toFixed(0)}</span>
            <span className="text-xs opacity-75">
              {getQualityLabel(qualityScore)}
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

          {/* Detailed Breakdown Tooltip - Phase 10.942 v4.0 */}
          {showQualityTooltip && (
            <div
              id={tooltipId}
              className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[380px]"
              role="tooltip"
              aria-live="polite"
            >
              <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4 border border-gray-700">
                <div className="font-bold text-sm text-purple-300 mb-3">
                  📊 QUALITY SCORE v4.0 BREAKDOWN
                </div>

                <div className="mb-3 pb-3 border-b border-gray-700">
                  <div className="text-lg font-bold text-white">
                    🎯 FINAL SCORE: {qualityScore.toFixed(0)}/100
                  </div>
                  {qualityScoreBreakdown?.coreScore !== undefined && (
                    <div className="text-gray-400 text-xs mt-1">
                      Core: {qualityScoreBreakdown.coreScore.toFixed(1)} + Bonuses: {totalBonuses}
                    </div>
                  )}
                </div>

                {/* Citation Impact - 30% */}
                {qualityScoreBreakdown?.citationImpact !== undefined && (
                  <div className="mb-2 pb-2 border-b border-gray-700">
                    <div className="font-semibold text-blue-300 mb-1 flex justify-between">
                      <span>📈 CITATION IMPACT (FWCI)</span>
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
                      <span>🏆 JOURNAL PRESTIGE</span>
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
                      <span>📅 RECENCY BOOST</span>
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
                      🎁 OPTIONAL BONUSES (+{totalBonuses})
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

                {/* Algorithm Reference */}
                <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-700">
                  v4.0 methodology: Waltman & van Eck (2019), Garfield (1980)
                </div>
              </div>
            </div>
          )}
        </span>
      )}
    </>
  );
}
