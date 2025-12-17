/**
 * Phase 10.170 Week 4+: Two-Stage Filter Service
 *
 * SECURITY FIX (Critical #10): Immutable copy to prevent race conditions
 *
 * Enterprise-grade two-stage paper filtering:
 * - Stage 1: Content eligibility (abstract presence, language, relevance)
 * - Stage 2: Quality scoring (citations, journal, methodology)
 *
 * DESIGN PRINCIPLES:
 * - Immutable operations (no mutation of input arrays)
 * - Pure functions for deterministic results
 * - Comprehensive logging for audit trail
 * - Configurable thresholds per purpose
 *
 * @module two-stage-filter.service
 * @since Phase 10.170 Week 4+
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { ResearchPurpose } from '../types/purpose-aware.types';
import {
  PaperForFilter,
  TwoStageFilterResult,
  ContentEligibilityResult,
  QualityFilterResult,
  TwoStageFilterStats,
} from '../types/specialized-pipeline.types';
// Phase 10.170 Week 4+: Gap #3 Fix - Integration with Week 3 scoring
import { PurposeAwareScoringService } from './purpose-aware-scoring.service';
import type { ScoringPaperInput } from '../types/purpose-aware-scoring.types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Get dynamic max year (current year + 1)
 *
 * QUALITY FIX: Computed dynamically to avoid stale values across year boundaries.
 * Previously was computed at module load time, which would cause incorrect rejections
 * if server ran across January 1st.
 */
const getDynamicMaxYear = (): number => new Date().getFullYear() + 1;

/**
 * Content eligibility configuration per purpose
 * Note: maxYear is set to 0 as a placeholder - use getDynamicMaxYear() for actual check
 */
const CONTENT_ELIGIBILITY_CONFIG: Readonly<Record<ResearchPurpose, ContentEligibilityConfig>> = {
  [ResearchPurpose.Q_METHODOLOGY]: {
    requireAbstract: false,  // Q-methodology works with titles too
    minAbstractLength: 50,
    requireYear: false,
    minYear: 1950,
    maxYear: 0, // Use getDynamicMaxYear() in validation
  },
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: {
    requireAbstract: true,
    minAbstractLength: 100,
    requireYear: false,
    minYear: 1970,
    maxYear: 0, // Use getDynamicMaxYear() in validation
  },
  [ResearchPurpose.LITERATURE_SYNTHESIS]: {
    requireAbstract: true,
    minAbstractLength: 150,
    requireYear: true,
    minYear: 1980,
    maxYear: 0, // Use getDynamicMaxYear() in validation
  },
  [ResearchPurpose.HYPOTHESIS_GENERATION]: {
    requireAbstract: true,
    minAbstractLength: 100,
    requireYear: false,
    minYear: 1960,
    maxYear: 0, // Use getDynamicMaxYear() in validation
  },
  [ResearchPurpose.SURVEY_CONSTRUCTION]: {
    requireAbstract: true,
    minAbstractLength: 100,
    requireYear: false,
    minYear: 1970,
    maxYear: 0, // Use getDynamicMaxYear() in validation
  },
} as const;

/**
 * Quality threshold configuration per purpose
 */
const QUALITY_THRESHOLD_CONFIG: Readonly<Record<ResearchPurpose, number>> = {
  [ResearchPurpose.Q_METHODOLOGY]: 40,          // Lower threshold for diversity
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: 50,   // Moderate threshold
  [ResearchPurpose.LITERATURE_SYNTHESIS]: 60,   // Higher threshold for quality
  [ResearchPurpose.HYPOTHESIS_GENERATION]: 45,  // Moderate threshold
  [ResearchPurpose.SURVEY_CONSTRUCTION]: 55,    // Higher for construct validity
} as const;

/**
 * MAINTAINABILITY FIX: Quality score calculation constants
 * All magic numbers extracted to named constants for easy tuning and documentation
 */
const QUALITY_SCORE_WEIGHTS = {
  // Title quality scoring (max 15 points)
  TITLE: {
    MAX_POINTS: 15,
    OPTIMAL_MIN_LENGTH: 30,
    OPTIMAL_MAX_LENGTH: 200,
    OPTIMAL_POINTS: 15,
    SHORT_MIN_LENGTH: 15,
    SHORT_POINTS: 10,
    MINIMAL_POINTS: 5,
  },
  // Abstract quality scoring (max 25 points)
  ABSTRACT: {
    MAX_POINTS: 25,
    EXCELLENT_LENGTH: 500,
    EXCELLENT_POINTS: 25,
    GOOD_LENGTH: 200,
    GOOD_POINTS: 20,
    ADEQUATE_LENGTH: 100,
    ADEQUATE_POINTS: 15,
    MINIMAL_POINTS: 10,
  },
  // Citation impact scoring (max 20 points)
  CITATIONS: {
    MAX_POINTS: 20,
    HIGH_IMPACT_THRESHOLD: 50,
    HIGH_IMPACT_POINTS: 20,
    MEDIUM_IMPACT_THRESHOLD: 20,
    MEDIUM_IMPACT_POINTS: 15,
    LOW_IMPACT_THRESHOLD: 5,
    LOW_IMPACT_POINTS: 10,
    MINIMAL_THRESHOLD: 1,
    MINIMAL_POINTS: 5,
  },
  // Recency bonus scoring (max 15 points)
  RECENCY: {
    MAX_POINTS: 15,
    RECENT_AGE: 2,
    RECENT_POINTS: 15,
    FAIRLY_RECENT_AGE: 5,
    FAIRLY_RECENT_POINTS: 12,
    MODERATE_AGE: 10,
    MODERATE_POINTS: 8,
    OLDER_AGE: 20,
    OLDER_POINTS: 5,
  },
  // Metadata quality scoring
  VENUE_PRESENT_POINTS: 10,
  DOI_PRESENT_POINTS: 10,
  FULLTEXT_PRESENT_POINTS: 5,
  // Total max score
  MAX_TOTAL_SCORE: 100,
} as const;

/**
 * Content eligibility configuration interface
 */
interface ContentEligibilityConfig {
  readonly requireAbstract: boolean;
  readonly minAbstractLength: number;
  readonly requireYear: boolean;
  readonly minYear: number;
  readonly maxYear: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class TwoStageFilterService {
  private readonly logger = new Logger(TwoStageFilterService.name);

  constructor(
    // Phase 10.170 Week 4+: Gap #3 Fix - Optional Week 3 scoring integration
    // When available, uses purpose-aware scoring for consistency across pipeline
    // Falls back to basic scoring when not injected (standalone usage)
    @Optional() private readonly purposeAwareScoring?: PurposeAwareScoringService,
  ) {
    this.logger.log('✅ [TwoStageFilter] Phase 10.170 Week 4+ - Service initialized');
    this.logger.log('✅ [SECURITY] Critical #10: Immutable copy protection enabled');
    if (this.purposeAwareScoring) {
      this.logger.log('✅ [INTEGRATION] Gap #3 Fixed: PurposeAwareScoringService integrated');
    } else {
      this.logger.log('ℹ️ [STANDALONE] Using basic quality scoring (no PurposeAwareScoringService)');
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Execute two-stage filter on papers
   *
   * SECURITY (Critical #10): Creates immutable copy to prevent race conditions
   *
   * @param papers Papers to filter
   * @param purpose Research purpose for filtering
   * @param qualityThresholdOverride Optional quality threshold override
   * @returns Two-stage filter result
   */
  twoStageFilter(
    papers: readonly PaperForFilter[],
    purpose: ResearchPurpose,
    qualityThresholdOverride?: number,
  ): TwoStageFilterResult {
    const startTime = Date.now();

    // SECURITY (Critical #10): Create deep immutable copy
    // This prevents race conditions when papers array is modified elsewhere
    const papersCopy: PaperForFilter[] = papers.map(p => this.deepCopyPaper(p));

    this.logger.log(
      `[TwoStageFilter] Starting filter: ${papersCopy.length} papers, ` +
      `purpose=${purpose}`
    );

    // Stage 1: Content eligibility
    const contentStage = this.executeContentStage(papersCopy, purpose);

    // Stage 2: Quality filtering (only on content-eligible papers)
    // Gap #3 Fix: Pass purpose for purpose-aware scoring when service is available
    const qualityThreshold = qualityThresholdOverride ?? QUALITY_THRESHOLD_CONFIG[purpose];
    const qualityStage = this.executeQualityStage(
      contentStage.eligible as PaperForFilter[],
      qualityThreshold,
      purpose,
    );

    // Calculate statistics
    const stats = this.calculateStats(
      papersCopy.length,
      contentStage.eligible.length,
      qualityStage.qualified.length,
    );

    const totalDurationMs = Date.now() - startTime;

    this.logger.log(
      `[TwoStageFilter] Complete: ${stats.inputCount} → ` +
      `${stats.contentPassCount} (content) → ` +
      `${stats.qualityPassCount} (quality), ` +
      `pass rate=${(stats.finalPassRate * 100).toFixed(1)}%, ` +
      `${totalDurationMs}ms`
    );

    return {
      contentStage,
      qualityStage,
      finalPapers: qualityStage.qualified,
      totalDurationMs,
      stats,
    };
  }

  /**
   * Execute only content eligibility stage
   *
   * @param papers Papers to check
   * @param purpose Research purpose
   * @returns Content eligibility result
   */
  contentEligibilityOnly(
    papers: readonly PaperForFilter[],
    purpose: ResearchPurpose,
  ): ContentEligibilityResult {
    // SECURITY (Critical #10): Create immutable copy
    const papersCopy = papers.map(p => this.deepCopyPaper(p));
    return this.executeContentStage(papersCopy, purpose);
  }

  /**
   * Execute only quality filter stage
   *
   * @param papers Papers to filter (assumed content-eligible)
   * @param threshold Quality threshold (0-100)
   * @returns Quality filter result
   */
  qualityFilterOnly(
    papers: readonly PaperForFilter[],
    threshold: number,
  ): QualityFilterResult {
    // SECURITY (Critical #10): Create immutable copy
    const papersCopy = papers.map(p => this.deepCopyPaper(p));
    return this.executeQualityStage(papersCopy, threshold);
  }

  /**
   * Get content eligibility config for purpose
   * Returns config with dynamic maxYear computed at call time
   */
  getContentConfig(purpose: ResearchPurpose): ContentEligibilityConfig {
    const staticConfig = CONTENT_ELIGIBILITY_CONFIG[purpose];
    // Return with dynamic maxYear to avoid stale values
    return {
      ...staticConfig,
      maxYear: getDynamicMaxYear(),
    };
  }

  /**
   * Get default quality threshold for purpose
   */
  getQualityThreshold(purpose: ResearchPurpose): number {
    return QUALITY_THRESHOLD_CONFIG[purpose];
  }

  // ==========================================================================
  // STAGE 1: CONTENT ELIGIBILITY
  // ==========================================================================

  /**
   * Execute content eligibility stage
   */
  private executeContentStage(
    papers: PaperForFilter[],
    purpose: ResearchPurpose,
  ): ContentEligibilityResult {
    const startTime = Date.now();
    const config = CONTENT_ELIGIBILITY_CONFIG[purpose];

    const eligible: PaperForFilter[] = [];
    const rejected: PaperForFilter[] = [];
    const rejectionReasons = new Map<string, string>();

    for (const paper of papers) {
      const reason = this.checkContentEligibility(paper, config);

      if (reason === null) {
        eligible.push(paper);
      } else {
        rejected.push(paper);
        rejectionReasons.set(paper.id, reason);
      }
    }

    const durationMs = Date.now() - startTime;

    this.logger.debug(
      `[ContentStage] ${eligible.length}/${papers.length} eligible, ${durationMs}ms`
    );

    return {
      eligible,
      rejected,
      rejectionReasons,
      durationMs,
    };
  }

  /**
   * Check single paper for content eligibility
   *
   * @returns null if eligible, rejection reason string if not
   */
  private checkContentEligibility(
    paper: PaperForFilter,
    config: ContentEligibilityConfig,
  ): string | null {
    // Check title exists
    if (!paper.title || paper.title.trim().length === 0) {
      return 'Missing title';
    }

    // Check abstract requirement
    if (config.requireAbstract) {
      if (!paper.abstract || paper.abstract.trim().length === 0) {
        return 'Missing abstract (required for this purpose)';
      }
    }

    // Check abstract length
    if (paper.abstract && paper.abstract.trim().length > 0) {
      if (paper.abstract.trim().length < config.minAbstractLength) {
        return `Abstract too short (${paper.abstract.length} < ${config.minAbstractLength} chars)`;
      }
    }

    // Check year requirement
    if (config.requireYear && paper.year === null) {
      return 'Missing publication year (required for this purpose)';
    }

    // Check year bounds
    if (paper.year !== null) {
      if (paper.year < config.minYear) {
        return `Publication year too old (${paper.year} < ${config.minYear})`;
      }
      // QUALITY FIX: Use dynamic max year to avoid stale values across year boundaries
      const dynamicMaxYear = getDynamicMaxYear();
      if (paper.year > dynamicMaxYear) {
        return `Publication year in future (${paper.year} > ${dynamicMaxYear})`;
      }
    }

    // Paper passes all content checks
    return null;
  }

  // ==========================================================================
  // STAGE 2: QUALITY FILTERING
  // ==========================================================================

  /**
   * Execute quality filter stage
   *
   * Gap #3 Fix: Uses PurposeAwareScoringService when available for consistency
   * with Week 3 scoring. Falls back to basic scoring for standalone usage.
   */
  private executeQualityStage(
    papers: PaperForFilter[],
    threshold: number,
    purpose?: ResearchPurpose,
  ): QualityFilterResult {
    const startTime = Date.now();

    const qualified: PaperForFilter[] = [];
    const disqualified: PaperForFilter[] = [];
    const qualityScores = new Map<string, number>();

    // Gap #3 Fix: Use purpose-aware scoring when available and purpose is provided
    const usePurposeAwareScoring = this.purposeAwareScoring && purpose;

    if (usePurposeAwareScoring) {
      this.logger.debug(
        `[QualityStage] Using PurposeAwareScoringService (purpose=${purpose})`
      );
    }

    for (const paper of papers) {
      let score: number;

      // Priority: 1. existing score, 2. purpose-aware, 3. basic
      if (paper.qualityScore !== undefined) {
        score = paper.qualityScore;
      } else if (usePurposeAwareScoring) {
        // Gap #3 Fix: Convert to ScoringPaperInput and use purpose-aware scoring
        const scoringInput = this.convertToScoringInput(paper);
        const result = this.purposeAwareScoring!.scorePaper(scoringInput, purpose!);
        score = result.totalScore;
      } else {
        score = this.calculateBasicQualityScore(paper);
      }

      qualityScores.set(paper.id, score);

      if (score >= threshold) {
        qualified.push(paper);
      } else {
        disqualified.push(paper);
      }
    }

    const durationMs = Date.now() - startTime;

    this.logger.debug(
      `[QualityStage] ${qualified.length}/${papers.length} qualified ` +
      `(threshold=${threshold}, scoring=${usePurposeAwareScoring ? 'purpose-aware' : 'basic'}), ${durationMs}ms`
    );

    return {
      qualified,
      disqualified,
      qualityScores,
      threshold,
      durationMs,
    };
  }

  /**
   * Convert PaperForFilter to ScoringPaperInput
   *
   * Gap #3 Fix: Type adapter for purpose-aware scoring integration
   */
  private convertToScoringInput(paper: PaperForFilter): ScoringPaperInput {
    return {
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: [], // PaperForFilter doesn't have keywords
      citationCount: paper.citationCount,
      year: paper.year,
      venue: paper.venue,
      impactFactor: null, // PaperForFilter doesn't have impact factor
      hasFullText: paper.hasFullText,
      wordCount: paper.abstract ? paper.abstract.split(/\s+/).length : null,
      existingQualityScore: paper.qualityScore ?? null,
    };
  }

  /**
   * Calculate basic quality score for papers without pre-calculated scores
   *
   * This is a simplified scorer for filtering purposes.
   * Full scoring should use PurposeAwareScoringService.
   *
   * MAINTAINABILITY FIX: All magic numbers extracted to QUALITY_SCORE_WEIGHTS constants
   */
  private calculateBasicQualityScore(paper: PaperForFilter): number {
    const W = QUALITY_SCORE_WEIGHTS; // Alias for readability
    let score = 0;

    // Title quality (0-15)
    if (paper.title) {
      const titleLength = paper.title.length;
      if (titleLength >= W.TITLE.OPTIMAL_MIN_LENGTH && titleLength <= W.TITLE.OPTIMAL_MAX_LENGTH) {
        score += W.TITLE.OPTIMAL_POINTS;
      } else if (titleLength >= W.TITLE.SHORT_MIN_LENGTH) {
        score += W.TITLE.SHORT_POINTS;
      } else {
        score += W.TITLE.MINIMAL_POINTS;
      }
    }

    // Abstract quality (0-25)
    if (paper.abstract) {
      const abstractLength = paper.abstract.length;
      if (abstractLength >= W.ABSTRACT.EXCELLENT_LENGTH) {
        score += W.ABSTRACT.EXCELLENT_POINTS;
      } else if (abstractLength >= W.ABSTRACT.GOOD_LENGTH) {
        score += W.ABSTRACT.GOOD_POINTS;
      } else if (abstractLength >= W.ABSTRACT.ADEQUATE_LENGTH) {
        score += W.ABSTRACT.ADEQUATE_POINTS;
      } else {
        score += W.ABSTRACT.MINIMAL_POINTS;
      }
    }

    // Citation impact (0-20)
    const citations = paper.citationCount ?? 0;
    if (citations >= W.CITATIONS.HIGH_IMPACT_THRESHOLD) {
      score += W.CITATIONS.HIGH_IMPACT_POINTS;
    } else if (citations >= W.CITATIONS.MEDIUM_IMPACT_THRESHOLD) {
      score += W.CITATIONS.MEDIUM_IMPACT_POINTS;
    } else if (citations >= W.CITATIONS.LOW_IMPACT_THRESHOLD) {
      score += W.CITATIONS.LOW_IMPACT_POINTS;
    } else if (citations >= W.CITATIONS.MINIMAL_THRESHOLD) {
      score += W.CITATIONS.MINIMAL_POINTS;
    }

    // Recency bonus (0-15)
    if (paper.year !== null) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - paper.year;
      if (age <= W.RECENCY.RECENT_AGE) {
        score += W.RECENCY.RECENT_POINTS;
      } else if (age <= W.RECENCY.FAIRLY_RECENT_AGE) {
        score += W.RECENCY.FAIRLY_RECENT_POINTS;
      } else if (age <= W.RECENCY.MODERATE_AGE) {
        score += W.RECENCY.MODERATE_POINTS;
      } else if (age <= W.RECENCY.OLDER_AGE) {
        score += W.RECENCY.OLDER_POINTS;
      }
    }

    // Venue presence (0-10)
    if (paper.venue && paper.venue.trim().length > 0) {
      score += W.VENUE_PRESENT_POINTS;
    }

    // DOI presence (0-10)
    if (paper.doi && paper.doi.trim().length > 0) {
      score += W.DOI_PRESENT_POINTS;
    }

    // Full-text availability (0-5)
    if (paper.hasFullText) {
      score += W.FULLTEXT_PRESENT_POINTS;
    }

    return Math.min(W.MAX_TOTAL_SCORE, Math.max(0, score));
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Create deep copy of paper to ensure immutability
   * SECURITY (Critical #10): Prevents race conditions
   */
  private deepCopyPaper(paper: PaperForFilter): PaperForFilter {
    return {
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      doi: paper.doi,
      year: paper.year,
      citationCount: paper.citationCount,
      venue: paper.venue,
      hasFullText: paper.hasFullText,
      qualityScore: paper.qualityScore,
    };
  }

  /**
   * Calculate filter statistics
   */
  private calculateStats(
    inputCount: number,
    contentPassCount: number,
    qualityPassCount: number,
  ): TwoStageFilterStats {
    return {
      inputCount,
      contentPassCount,
      qualityPassCount,
      finalPassRate: inputCount > 0 ? qualityPassCount / inputCount : 0,
      contentRejectionRate: inputCount > 0 ? (inputCount - contentPassCount) / inputCount : 0,
      qualityRejectionRate: contentPassCount > 0
        ? (contentPassCount - qualityPassCount) / contentPassCount
        : 0,
    };
  }
}
