/**
 * Phase 10.170 Week 3: Purpose-Aware Quality Scoring Service
 *
 * Enterprise-grade service for calculating paper quality scores
 * based on research purpose-specific weight configurations.
 *
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Only handles quality scoring
 * - Open/Closed: Extensible via weight configurations
 * - Dependency Inversion: Depends on abstractions (types)
 * - No side effects: Pure scoring calculations
 *
 * SCIENTIFIC FOUNDATIONS:
 * - FWCI (Field-Weighted Citation Impact): Normalized citations
 * - Journal metrics: Impact factor, h-index, quartile
 * - Content depth: Word count, section presence
 * - Methodology rigor: Study design indicators
 *
 * PERFORMANCE:
 * - O(n) complexity for batch scoring
 * - No external API calls during scoring
 * - Optimized for 1000+ papers per batch
 *
 * @module purpose-aware-scoring.service
 * @since Phase 10.170 Week 3
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  ResearchPurpose,
  QualityWeights,
  PurposeFetchingConfig,
} from '../types/purpose-aware.types';
import {
  ComponentScore,
  PurposeAwareScoreResult,
  ScoringPaperInput,
  BatchScoringRequest,
  BatchScoringResult,
  BatchScoringStats,
  SCORING_VERSION,
  validateScoringInput,
} from '../types/purpose-aware-scoring.types';
import { PurposeAwareConfigService } from './purpose-aware-config.service';
// Phase 10.170 Week 4: Netflix-Grade Infrastructure Integration
import { PurposeAwareCacheService } from './purpose-aware-cache.service';
import { PurposeAwareMetricsService } from './purpose-aware-metrics.service';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Content depth thresholds (word count)
 * Based on academic paper length research
 */
const CONTENT_DEPTH_THRESHOLDS = {
  /** Minimal content (abstract only) */
  MINIMAL: 200,
  /** Short content (extended abstract) */
  SHORT: 500,
  /** Moderate content (partial full-text) */
  MODERATE: 1500,
  /** Full content (complete paper) */
  FULL: 3000,
  /** Extensive content (long-form paper) */
  EXTENSIVE: 6000,
} as const;

/**
 * Citation impact normalization factors
 * Based on field-weighted citation impact methodology
 */
const CITATION_NORMALIZATION = {
  /** Excellent citation count (top 1%) */
  EXCELLENT: 50,
  /** High citation count (top 10%) */
  HIGH: 20,
  /** Good citation count (top 25%) */
  GOOD: 10,
  /** Average citation count (median) */
  AVERAGE: 5,
  /** Low citation count */
  LOW: 2,
} as const;

/**
 * Journal prestige tiers
 */
const JOURNAL_PRESTIGE_TIERS = {
  /** Top-tier journals (Nature, Science, etc.) */
  ELITE: 90,
  /** High-impact journals (Q1) */
  HIGH: 70,
  /** Good journals (Q2) */
  GOOD: 50,
  /** Average journals (Q3) */
  AVERAGE: 30,
  /** Low-tier journals (Q4) */
  LOW: 15,
  /** Unknown/preprint */
  UNKNOWN: 10,
} as const;

/**
 * Methodology indicators for rigor scoring
 */
const METHODOLOGY_KEYWORDS = {
  /** Experimental design indicators */
  EXPERIMENTAL: [
    'randomized', 'controlled', 'double-blind', 'placebo',
    'experimental', 'rct', 'trial', 'intervention',
  ],
  /** Quantitative indicators */
  QUANTITATIVE: [
    'regression', 'correlation', 'anova', 'statistical',
    'sample size', 'p-value', 'confidence interval', 'hypothesis',
  ],
  /** Qualitative indicators */
  QUALITATIVE: [
    'interview', 'focus group', 'thematic analysis', 'grounded theory',
    'phenomenological', 'ethnographic', 'case study', 'narrative',
  ],
  /** Mixed methods indicators */
  MIXED: [
    'mixed method', 'triangulation', 'multi-method',
    'convergent design', 'sequential design',
  ],
  /** Systematic review indicators */
  SYSTEMATIC: [
    'systematic review', 'meta-analysis', 'prisma',
    'inclusion criteria', 'exclusion criteria', 'search strategy',
  ],
} as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareScoringService {
  private readonly logger = new Logger(PurposeAwareScoringService.name);

  constructor(
    private readonly configService: PurposeAwareConfigService,
    // Phase 10.170 Week 4: Netflix-Grade Infrastructure
    @Optional() private readonly cacheService?: PurposeAwareCacheService,
    @Optional() private readonly metricsService?: PurposeAwareMetricsService,
  ) {
    this.logger.log('✅ [PurposeAwareScoring] Phase 10.170 Week 3 - Service initialized');
    // Phase 10.170 Week 4: Log infrastructure status
    if (cacheService) {
      this.logger.log('✅ [Phase 10.170 Week 4] Score caching enabled');
    }
    if (metricsService) {
      this.logger.log('✅ [Phase 10.170 Week 4] Metrics collection enabled');
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Score a single paper based on research purpose
   *
   * Phase 10.170 Week 4: Cache-aware with metrics
   *
   * @param paper Paper data to score
   * @param purpose Research purpose for scoring
   * @param weightOverrides Optional weight overrides
   * @returns Purpose-aware score result
   */
  scorePaper(
    paper: ScoringPaperInput,
    purpose: ResearchPurpose,
    weightOverrides?: Partial<QualityWeights>,
  ): PurposeAwareScoreResult {
    const startTime = Date.now();

    // Validate input
    validateScoringInput(paper);

    // Phase 10.170 Week 4: Check cache first (only if no weight overrides)
    if (!weightOverrides && this.cacheService) {
      const cached = this.cacheService.getCachedScore(paper.id, purpose);
      if (cached.found && cached.value) {
        this.logger.debug(`[Scoring] Cache HIT for paper ${paper.id}`);
        return cached.value;
      }
    }

    // Get purpose configuration
    const config = this.configService.getConfig(purpose);

    // Merge weights with overrides
    const weights = this.mergeWeights(config.qualityWeights, weightOverrides);

    // Calculate component scores
    const contentScore = this.calculateContentScore(paper);
    const citationScore = this.calculateCitationScore(paper);
    const journalScore = this.calculateJournalScore(paper);
    const methodologyScore = this.calculateMethodologyScore(paper);

    // Build component results
    const components: PurposeAwareScoreResult['components'] = {
      content: this.buildComponentScore(contentScore, weights.content, 'Content depth assessment'),
      citation: this.buildComponentScore(citationScore, weights.citation, 'Citation impact analysis'),
      journal: this.buildComponentScore(journalScore, weights.journal, 'Journal prestige evaluation'),
      methodology: this.buildComponentScore(methodologyScore, weights.methodology, 'Methodology rigor detection'),
    };

    // Add diversity component if weight specified
    if (weights.diversity !== undefined && weights.diversity > 0) {
      const diversityScore = this.calculateDiversityPotential(paper);
      (components as { diversity?: ComponentScore }).diversity =
        this.buildComponentScore(diversityScore, weights.diversity, 'Diversity potential assessment');
    }

    // Calculate base total score
    let totalScore =
      components.content.weighted +
      components.citation.weighted +
      components.journal.weighted +
      components.methodology.weighted +
      ((components as { diversity?: ComponentScore }).diversity?.weighted ?? 0);

    // Apply full-text bonus
    const fullTextBonus = paper.hasFullText ? config.fullTextRequirement.fullTextBoost : 0;
    totalScore = Math.min(100, totalScore + fullTextBonus);

    // Clamp to valid range
    totalScore = Math.max(0, Math.min(100, totalScore));

    const result: PurposeAwareScoreResult = {
      paperId: paper.id,
      purpose,
      totalScore: Math.round(totalScore * 100) / 100, // 2 decimal precision
      components,
      fullTextBonus,
      hasFullText: paper.hasFullText,
      scoredAt: Date.now(),
      version: SCORING_VERSION,
    };

    // Phase 10.170 Week 4: Cache result (only if no weight overrides)
    if (!weightOverrides && this.cacheService) {
      this.cacheService.setCachedScore(paper.id, purpose, result);
    }

    // Phase 10.170 Week 4: Record metrics
    const durationMs = Date.now() - startTime;
    this.metricsService?.recordPaperScored(purpose, result.totalScore, durationMs);

    return result;
  }

  /**
   * Score a paper with pre-fetched weights (batch optimization)
   *
   * Avoids repeated config lookups when scoring many papers.
   * @internal Used by scoreBatch for performance
   */
  private scorePaperWithWeights(
    paper: ScoringPaperInput,
    purpose: ResearchPurpose,
    weights: QualityWeights,
    config: PurposeFetchingConfig,
  ): PurposeAwareScoreResult {
    // Validate input
    validateScoringInput(paper);

    // Calculate component scores
    const contentScore = this.calculateContentScore(paper);
    const citationScore = this.calculateCitationScore(paper);
    const journalScore = this.calculateJournalScore(paper);
    const methodologyScore = this.calculateMethodologyScore(paper);

    // Build component results
    const components: PurposeAwareScoreResult['components'] = {
      content: this.buildComponentScore(contentScore, weights.content, 'Content depth assessment'),
      citation: this.buildComponentScore(citationScore, weights.citation, 'Citation impact analysis'),
      journal: this.buildComponentScore(journalScore, weights.journal, 'Journal prestige evaluation'),
      methodology: this.buildComponentScore(methodologyScore, weights.methodology, 'Methodology rigor detection'),
    };

    // Add diversity component if weight specified
    if (weights.diversity !== undefined && weights.diversity > 0) {
      const diversityScore = this.calculateDiversityPotential(paper);
      (components as { diversity?: ComponentScore }).diversity =
        this.buildComponentScore(diversityScore, weights.diversity, 'Diversity potential assessment');
    }

    // Calculate base total score
    let totalScore =
      components.content.weighted +
      components.citation.weighted +
      components.journal.weighted +
      components.methodology.weighted +
      ((components as { diversity?: ComponentScore }).diversity?.weighted ?? 0);

    // Apply full-text bonus
    const fullTextBonus = paper.hasFullText ? config.fullTextRequirement.fullTextBoost : 0;
    totalScore = Math.min(100, totalScore + fullTextBonus);

    // Clamp to valid range
    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      paperId: paper.id,
      purpose,
      totalScore: Math.round(totalScore * 100) / 100, // 2 decimal precision
      components,
      fullTextBonus,
      hasFullText: paper.hasFullText,
      scoredAt: Date.now(),
      version: SCORING_VERSION,
    };
  }

  /**
   * Score multiple papers in batch
   *
   * Phase 10.170 Week 4: Batch cache-aware with metrics
   * Optimized for large batches (1000+ papers).
   *
   * @param request Batch scoring request
   * @returns Batch scoring result with statistics
   */
  scoreBatch(request: BatchScoringRequest): BatchScoringResult {
    const startTime = Date.now();

    // Get configuration once (cached via configService)
    const config = this.configService.getConfig(request.purpose);
    const threshold = config.qualityThreshold.initial;
    const weights = this.mergeWeights(config.qualityWeights, request.weightOverrides);

    // Phase 10.170 Week 4: Batch cache lookup (only if no weight overrides)
    let cachedScores = new Map<string, PurposeAwareScoreResult>();
    const papersToScore: ScoringPaperInput[] = [];

    if (!request.weightOverrides && this.cacheService) {
      const paperIds = request.papers.map((p) => p.id);
      cachedScores = this.cacheService.batchGetCachedScores(paperIds, request.purpose);

      // Split papers into cached and to-score
      for (const paper of request.papers) {
        if (!cachedScores.has(paper.id)) {
          papersToScore.push(paper);
        }
      }

      if (cachedScores.size > 0) {
        this.logger.debug(
          `[Scoring] Batch cache: ${cachedScores.size} hits, ${papersToScore.length} to score`
        );
      }
    } else {
      // No caching - score all papers
      papersToScore.push(...request.papers);
    }

    // Score papers not in cache
    const scores: PurposeAwareScoreResult[] = [];
    const newScores: PurposeAwareScoreResult[] = [];
    const passingPapers: PurposeAwareScoreResult[] = [];
    const failingPapers: PurposeAwareScoreResult[] = [];

    // Add cached scores first
    for (const cachedScore of cachedScores.values()) {
      scores.push(cachedScore);
      if (cachedScore.totalScore >= threshold) {
        passingPapers.push(cachedScore);
      } else {
        failingPapers.push(cachedScore);
      }
    }

    // Score uncached papers with pre-fetched weights (avoids repeated config lookups)
    for (const paper of papersToScore) {
      const score = this.scorePaperWithWeights(paper, request.purpose, weights, config);
      scores.push(score);
      newScores.push(score);

      // Partition in same pass
      if (score.totalScore >= threshold) {
        passingPapers.push(score);
      } else {
        failingPapers.push(score);
      }
    }

    // Phase 10.170 Week 4: Batch cache new scores (only if no weight overrides)
    if (!request.weightOverrides && this.cacheService && newScores.length > 0) {
      this.cacheService.batchSetCachedScores(newScores, request.purpose);
    }

    // Calculate statistics
    const stats = this.calculateBatchStats(scores, threshold);

    const executionTimeMs = Date.now() - startTime;

    // Phase 10.170 Week 4: Record batch metrics
    this.metricsService?.recordBatchScored(
      request.purpose,
      scores.length,
      stats.averageScore,
      executionTimeMs
    );

    this.logger.log(
      `[PurposeAwareScoring] Batch complete: ${scores.length} papers, ` +
      `${passingPapers.length} passing (${(stats.passRate * 100).toFixed(1)}%), ` +
      `avg=${stats.averageScore.toFixed(1)}, ${executionTimeMs}ms`
    );

    return {
      scores,
      thresholdResult: null, // Adaptive threshold handled separately
      diversityMetrics: null, // Diversity metrics handled separately
      passingPapers,
      failingPapers,
      executionTimeMs,
      stats,
    };
  }

  /**
   * Get raw component scores without weighting
   *
   * Useful for debugging and transparency.
   */
  getRawScores(paper: ScoringPaperInput): {
    content: number;
    citation: number;
    journal: number;
    methodology: number;
    diversity: number;
  } {
    return {
      content: this.calculateContentScore(paper),
      citation: this.calculateCitationScore(paper),
      journal: this.calculateJournalScore(paper),
      methodology: this.calculateMethodologyScore(paper),
      diversity: this.calculateDiversityPotential(paper),
    };
  }

  // ==========================================================================
  // COMPONENT SCORING METHODS
  // ==========================================================================

  /**
   * Calculate content depth score (0-100)
   *
   * Based on word count and structural indicators.
   */
  private calculateContentScore(paper: ScoringPaperInput): number {
    const wordCount = paper.wordCount ?? this.estimateWordCount(paper);

    // Score based on word count thresholds
    if (wordCount >= CONTENT_DEPTH_THRESHOLDS.EXTENSIVE) {
      return 100;
    }
    if (wordCount >= CONTENT_DEPTH_THRESHOLDS.FULL) {
      return 85 + (wordCount - CONTENT_DEPTH_THRESHOLDS.FULL) /
        (CONTENT_DEPTH_THRESHOLDS.EXTENSIVE - CONTENT_DEPTH_THRESHOLDS.FULL) * 15;
    }
    if (wordCount >= CONTENT_DEPTH_THRESHOLDS.MODERATE) {
      return 65 + (wordCount - CONTENT_DEPTH_THRESHOLDS.MODERATE) /
        (CONTENT_DEPTH_THRESHOLDS.FULL - CONTENT_DEPTH_THRESHOLDS.MODERATE) * 20;
    }
    if (wordCount >= CONTENT_DEPTH_THRESHOLDS.SHORT) {
      return 40 + (wordCount - CONTENT_DEPTH_THRESHOLDS.SHORT) /
        (CONTENT_DEPTH_THRESHOLDS.MODERATE - CONTENT_DEPTH_THRESHOLDS.SHORT) * 25;
    }
    if (wordCount >= CONTENT_DEPTH_THRESHOLDS.MINIMAL) {
      return 20 + (wordCount - CONTENT_DEPTH_THRESHOLDS.MINIMAL) /
        (CONTENT_DEPTH_THRESHOLDS.SHORT - CONTENT_DEPTH_THRESHOLDS.MINIMAL) * 20;
    }

    // Minimal content
    return Math.max(5, (wordCount / CONTENT_DEPTH_THRESHOLDS.MINIMAL) * 20);
  }

  /**
   * Calculate citation impact score (0-100)
   *
   * Based on raw citation count with decay for age.
   * Uses field-weighted citation impact principles.
   */
  private calculateCitationScore(paper: ScoringPaperInput): number {
    const citations = paper.citationCount ?? 0;
    const year = paper.year ?? new Date().getFullYear();
    const paperAge = Math.max(1, new Date().getFullYear() - year);

    // Calculate citations per year (normalized for age)
    const citationsPerYear = citations / paperAge;

    // Score based on citations per year thresholds
    if (citationsPerYear >= CITATION_NORMALIZATION.EXCELLENT) {
      return 100;
    }
    if (citationsPerYear >= CITATION_NORMALIZATION.HIGH) {
      return 80 + (citationsPerYear - CITATION_NORMALIZATION.HIGH) /
        (CITATION_NORMALIZATION.EXCELLENT - CITATION_NORMALIZATION.HIGH) * 20;
    }
    if (citationsPerYear >= CITATION_NORMALIZATION.GOOD) {
      return 60 + (citationsPerYear - CITATION_NORMALIZATION.GOOD) /
        (CITATION_NORMALIZATION.HIGH - CITATION_NORMALIZATION.GOOD) * 20;
    }
    if (citationsPerYear >= CITATION_NORMALIZATION.AVERAGE) {
      return 40 + (citationsPerYear - CITATION_NORMALIZATION.AVERAGE) /
        (CITATION_NORMALIZATION.GOOD - CITATION_NORMALIZATION.AVERAGE) * 20;
    }
    if (citationsPerYear >= CITATION_NORMALIZATION.LOW) {
      return 20 + (citationsPerYear - CITATION_NORMALIZATION.LOW) /
        (CITATION_NORMALIZATION.AVERAGE - CITATION_NORMALIZATION.LOW) * 20;
    }

    // Very few citations
    return Math.max(5, (citationsPerYear / CITATION_NORMALIZATION.LOW) * 20);
  }

  /**
   * Calculate journal prestige score (0-100)
   *
   * Based on impact factor and journal name heuristics.
   */
  private calculateJournalScore(paper: ScoringPaperInput): number {
    const impactFactor = paper.impactFactor;
    const venue = paper.venue?.toLowerCase() ?? '';

    // If impact factor available, use it directly
    if (impactFactor !== null && Number.isFinite(impactFactor)) {
      if (impactFactor >= 20) return JOURNAL_PRESTIGE_TIERS.ELITE;
      if (impactFactor >= 10) return JOURNAL_PRESTIGE_TIERS.HIGH;
      if (impactFactor >= 5) return JOURNAL_PRESTIGE_TIERS.GOOD;
      if (impactFactor >= 2) return JOURNAL_PRESTIGE_TIERS.AVERAGE;
      if (impactFactor >= 1) return JOURNAL_PRESTIGE_TIERS.LOW;
      return JOURNAL_PRESTIGE_TIERS.UNKNOWN;
    }

    // Heuristic-based scoring for unknown journals
    // Check for elite journal names
    const eliteJournals = ['nature', 'science', 'cell', 'lancet', 'nejm', 'jama', 'bmj'];
    if (eliteJournals.some(j => venue.includes(j))) {
      return JOURNAL_PRESTIGE_TIERS.ELITE;
    }

    // Check for preprint servers
    const preprintServers = ['arxiv', 'biorxiv', 'medrxiv', 'ssrn', 'preprint'];
    if (preprintServers.some(p => venue.includes(p))) {
      return JOURNAL_PRESTIGE_TIERS.UNKNOWN;
    }

    // Check for high-impact publishers
    const highImpactPublishers = ['plos', 'frontiers', 'mdpi', 'springer'];
    if (highImpactPublishers.some(p => venue.includes(p))) {
      return JOURNAL_PRESTIGE_TIERS.GOOD;
    }

    // Default to average for unknown journals
    return JOURNAL_PRESTIGE_TIERS.AVERAGE;
  }

  /**
   * Calculate methodology rigor score (0-100)
   *
   * Based on methodology keywords detected in abstract/title.
   */
  private calculateMethodologyScore(paper: ScoringPaperInput): number {
    const text = `${paper.title} ${paper.abstract ?? ''}`.toLowerCase();

    // Count methodology indicators
    let score = 0;
    let indicatorCount = 0;

    // Check each category
    const categories = Object.entries(METHODOLOGY_KEYWORDS);
    for (const [_category, keywords] of categories) {
      const matches = keywords.filter(kw => text.includes(kw)).length;
      if (matches > 0) {
        indicatorCount++;
        score += Math.min(20, matches * 10); // Cap per category
      }
    }

    // Bonus for multiple categories (indicates rigorous methodology)
    if (indicatorCount >= 3) score += 20;
    else if (indicatorCount >= 2) score += 10;

    // Clamp to valid range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate diversity potential score (0-100)
   *
   * For Q-methodology: Higher score for diverse/critical perspectives.
   */
  private calculateDiversityPotential(paper: ScoringPaperInput): number {
    const text = `${paper.title} ${paper.abstract ?? ''}`.toLowerCase();

    let score = 50; // Base score

    // Boost for diversity indicators
    const diversityIndicators = [
      'perspective', 'viewpoint', 'debate', 'controversy', 'contested',
      'alternative', 'critical', 'challenging', 'opposing', 'different',
      'multiple', 'diverse', 'various', 'range of', 'spectrum',
    ];

    const matches = diversityIndicators.filter(ind => text.includes(ind)).length;
    score += Math.min(30, matches * 8);

    // Boost for geographic diversity
    const geoIndicators = [
      'global', 'international', 'cross-cultural', 'comparative',
      'developing', 'western', 'eastern', 'african', 'asian', 'european',
    ];
    const geoMatches = geoIndicators.filter(ind => text.includes(ind)).length;
    score += Math.min(20, geoMatches * 10);

    // Clamp to valid range
    return Math.min(100, Math.max(0, score));
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Estimate word count from title and abstract
   */
  private estimateWordCount(paper: ScoringPaperInput): number {
    const title = paper.title ?? '';
    const abstract = paper.abstract ?? '';
    const text = `${title} ${abstract}`;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Merge base weights with optional overrides
   */
  private mergeWeights(
    base: QualityWeights,
    overrides?: Partial<QualityWeights>,
  ): QualityWeights {
    if (!overrides) return base;

    return {
      content: overrides.content ?? base.content,
      citation: overrides.citation ?? base.citation,
      journal: overrides.journal ?? base.journal,
      methodology: overrides.methodology ?? base.methodology,
      diversity: overrides.diversity ?? base.diversity,
    };
  }

  /**
   * Build a component score result
   */
  private buildComponentScore(
    raw: number,
    weight: number,
    explanation: string,
  ): ComponentScore {
    return {
      raw: Math.round(raw * 100) / 100,
      weight,
      weighted: Math.round(raw * weight * 100) / 100,
      explanation,
    };
  }

  /**
   * Calculate batch statistics
   */
  private calculateBatchStats(
    scores: readonly PurposeAwareScoreResult[],
    threshold: number,
  ): BatchScoringStats {
    if (scores.length === 0) {
      return {
        totalProcessed: 0,
        passingCount: 0,
        failingCount: 0,
        passRate: 0,
        averageScore: 0,
        medianScore: 0,
        stdDeviation: 0,
        minScore: 0,
        maxScore: 0,
        fullTextCount: 0,
        fullTextRate: 0,
      };
    }

    const totalScores = scores.map(s => s.totalScore);
    const sortedScores = [...totalScores].sort((a, b) => a - b);

    const sum = totalScores.reduce((a, b) => a + b, 0);
    const mean = sum / totalScores.length;

    // Calculate standard deviation
    const squaredDiffs = totalScores.map(s => Math.pow(s - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / totalScores.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Calculate median
    const mid = Math.floor(sortedScores.length / 2);
    const median = sortedScores.length % 2 !== 0
      ? sortedScores[mid]
      : (sortedScores[mid - 1] + sortedScores[mid]) / 2;

    const passingCount = scores.filter(s => s.totalScore >= threshold).length;
    const fullTextCount = scores.filter(s => s.hasFullText).length;

    return {
      totalProcessed: scores.length,
      passingCount,
      failingCount: scores.length - passingCount,
      passRate: passingCount / scores.length,
      averageScore: Math.round(mean * 100) / 100,
      medianScore: Math.round(median * 100) / 100,
      stdDeviation: Math.round(stdDev * 100) / 100,
      minScore: Math.round(sortedScores[0] * 100) / 100,
      maxScore: Math.round(sortedScores[sortedScores.length - 1] * 100) / 100,
      fullTextCount,
      fullTextRate: fullTextCount / scores.length,
    };
  }
}
