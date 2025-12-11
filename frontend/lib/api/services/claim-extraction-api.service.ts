/**
 * Phase 10.113 Week 5: Claim Extraction API Service
 *
 * Netflix-grade frontend service for claim extraction.
 * Integrates with backend ClaimExtractionService via thematization endpoints.
 *
 * @module ClaimExtractionAPI
 * @since Phase 10.113 Week 5
 */

// Note: logger available if needed for future API calls
// import { logger } from '@/lib/utils/logger';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing - No 'any')
// ============================================================================

/**
 * Claim perspective classification
 */
export type ClaimPerspective = 'supportive' | 'critical' | 'neutral';

/**
 * Claim extraction stages
 */
export type ClaimExtractionStage =
  | 'INITIALIZING'
  | 'EXTRACTING_CLAIMS'
  | 'SCORING_POTENTIAL'
  | 'CLASSIFYING_PERSPECTIVE'
  | 'DEDUPLICATING'
  | 'GROUPING'
  | 'QUALITY_ANALYSIS'
  | 'COMPLETE';

/**
 * Extracted claim from backend
 */
export interface ExtractedClaim {
  readonly id: string;
  readonly sourceSubTheme: string;
  readonly sourcePapers: readonly string[];
  readonly originalText: string;
  readonly normalizedClaim: string;
  readonly perspective: ClaimPerspective;
  readonly statementPotential: number;
  readonly confidence: number;
  readonly metadata: {
    readonly extractedAt: string;
    readonly extractionModel: string;
    readonly originalWordCount: number;
    readonly normalizedWordCount: number;
    readonly keyTerms: readonly string[];
    readonly themeRelevance: number;
    readonly isDeduplicated: boolean;
    readonly mergedClaimIds: readonly string[];
  };
}

/**
 * Quality metrics for claim extraction
 */
export interface ClaimExtractionQualityMetrics {
  readonly papersProcessed: number;
  readonly claimsExtracted: number;
  readonly claimsAfterDedup: number;
  readonly avgConfidence: number;
  readonly avgStatementPotential: number;
  readonly perspectiveDistribution: {
    readonly supportive: number;
    readonly critical: number;
    readonly neutral: number;
  };
  readonly subThemeCoverage: number;
  readonly avgClaimsPerPaper: number;
  readonly highQualityClaims: number;
}

/**
 * Claim extraction result from thematization
 */
export interface ClaimExtractionResult {
  readonly claims: readonly ExtractedClaim[];
  readonly qualityMetrics: ClaimExtractionQualityMetrics;
  readonly processingTimeMs: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get perspective badge color
 */
export function getPerspectiveBadgeColor(perspective: ClaimPerspective): string {
  switch (perspective) {
    case 'supportive':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'neutral':
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

/**
 * Get perspective icon
 */
export function getPerspectiveIcon(perspective: ClaimPerspective): string {
  switch (perspective) {
    case 'supportive':
      return '👍';
    case 'critical':
      return '⚠️';
    case 'neutral':
      return '➖';
  }
}

/**
 * Get perspective label
 */
export function getPerspectiveLabel(perspective: ClaimPerspective): string {
  switch (perspective) {
    case 'supportive':
      return 'Supportive';
    case 'critical':
      return 'Critical';
    case 'neutral':
      return 'Neutral';
  }
}

/**
 * Get statement potential indicator
 */
export function getStatementPotentialIndicator(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 0.8) {
    return { label: 'Excellent', color: 'text-green-600', emoji: '✨' };
  }
  if (score >= 0.6) {
    return { label: 'Good', color: 'text-blue-600', emoji: '👍' };
  }
  if (score >= 0.4) {
    return { label: 'Fair', color: 'text-yellow-600', emoji: '⚠️' };
  }
  return { label: 'Low', color: 'text-red-600', emoji: '❌' };
}

/**
 * Get stage label
 */
export function getStageLabel(stage: ClaimExtractionStage): string {
  const labels: Record<ClaimExtractionStage, string> = {
    INITIALIZING: 'Initializing...',
    EXTRACTING_CLAIMS: 'Extracting claims from papers...',
    SCORING_POTENTIAL: 'Scoring statement potential...',
    CLASSIFYING_PERSPECTIVE: 'Classifying perspectives...',
    DEDUPLICATING: 'Removing duplicates...',
    GROUPING: 'Grouping by theme...',
    QUALITY_ANALYSIS: 'Analyzing quality...',
    COMPLETE: 'Complete',
  };
  return labels[stage];
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Format statement potential as percentage
 */
export function formatPotential(potential: number): string {
  return `${Math.round(potential * 100)}%`;
}

/**
 * Group claims by perspective
 */
export function groupClaimsByPerspective(
  claims: readonly ExtractedClaim[]
): Map<ClaimPerspective, ExtractedClaim[]> {
  const groups = new Map<ClaimPerspective, ExtractedClaim[]>();
  groups.set('supportive', []);
  groups.set('critical', []);
  groups.set('neutral', []);

  for (const claim of claims) {
    const group = groups.get(claim.perspective);
    if (group) {
      group.push(claim);
    }
  }

  return groups;
}

/**
 * Filter high-quality claims (potential > threshold)
 */
export function filterHighQualityClaims(
  claims: readonly ExtractedClaim[],
  threshold: number = 0.7
): ExtractedClaim[] {
  return claims.filter((claim) => claim.statementPotential >= threshold);
}

/**
 * Sort claims by statement potential (descending)
 */
export function sortClaimsByPotential(
  claims: readonly ExtractedClaim[]
): ExtractedClaim[] {
  return [...claims].sort((a, b) => b.statementPotential - a.statementPotential);
}

export default {
  getPerspectiveBadgeColor,
  getPerspectiveIcon,
  getPerspectiveLabel,
  getStatementPotentialIndicator,
  getStageLabel,
  formatConfidence,
  formatPotential,
  groupClaimsByPerspective,
  filterHighQualityClaims,
  sortClaimsByPotential,
};
