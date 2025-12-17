/**
 * Phase 10.170 Week 3: Diversity Scoring Service
 *
 * Enterprise-grade service for measuring and optimizing perspective diversity
 * in paper collections, specifically designed for Q-methodology concourse
 * development.
 *
 * SCIENTIFIC FOUNDATION:
 * - Q-Methodology concourse: Stephenson (1953), Brown (1980)
 * - Diversity measurement: Shannon Index, Simpson Index
 * - Perspective detection: Watts & Stenner (2012) guidelines
 *
 * KEY FEATURES:
 * - Perspective category detection from paper content
 * - Shannon and Simpson diversity indices
 * - Underrepresented perspective identification
 * - Diversity-aware paper selection
 *
 * WHY DIVERSITY MATTERS FOR Q-METHODOLOGY:
 * Q-methodology requires a diverse concourse of statements representing
 * ALL viewpoints on a topic. Mainstream bias (oversampling academic/consensus
 * views) undermines the validity of Q-sort factor analysis. This service
 * ensures diverse perspectives are represented.
 *
 * @module diversity-scoring.service
 * @since Phase 10.170 Week 3
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  PerspectiveCategory,
  PERSPECTIVE_CATEGORIES,
  PaperDiversityScore,
  CorpusDiversityMetrics,
  DiversityHealthStatus,
  ScoringPaperInput,
  getDiversityHealthStatus,
  validateDiversityMetrics,
} from '../types/purpose-aware-scoring.types';
import { ResearchPurpose } from '../types/purpose-aware.types';
// Phase 10.170 Week 4: Netflix-Grade Metrics Integration
import { PurposeAwareMetricsService } from './purpose-aware-metrics.service';

// ============================================================================
// PERSPECTIVE DETECTION CONFIGURATION
// ============================================================================

/**
 * Keywords that indicate each perspective category
 *
 * Based on Watts & Stenner (2012) concourse development guidelines
 * and content analysis best practices.
 */
const PERSPECTIVE_KEYWORDS: Readonly<Record<PerspectiveCategory, readonly string[]>> = {
  [PerspectiveCategory.ACADEMIC]: [
    'study', 'research', 'analysis', 'findings', 'evidence',
    'hypothesis', 'theory', 'empirical', 'methodology', 'literature',
    'peer-reviewed', 'publication', 'scholar', 'academic', 'university',
  ],
  [PerspectiveCategory.PRACTITIONER]: [
    'practice', 'implementation', 'case study', 'real-world', 'applied',
    'clinical', 'professional', 'field', 'hands-on', 'practical',
    'industry', 'business', 'management', 'operational', 'experience',
  ],
  [PerspectiveCategory.POLICY]: [
    'policy', 'regulation', 'government', 'legislation', 'governance',
    'public', 'reform', 'guidelines', 'framework', 'institutional',
    'stakeholder', 'decision-maker', 'political', 'authority', 'mandate',
  ],
  [PerspectiveCategory.PUBLIC]: [
    'community', 'citizen', 'public opinion', 'society', 'consumer',
    'patient', 'user', 'layperson', 'everyday', 'ordinary',
    'grassroots', 'voices', 'perception', 'attitude', 'belief',
  ],
  [PerspectiveCategory.CRITICAL]: [
    'critique', 'challenge', 'question', 'controversy', 'debate',
    'problematic', 'limitation', 'flaw', 'concern', 'risk',
    'opposition', 'alternative', 'counter', 'skeptic', 'dissent',
  ],
  [PerspectiveCategory.HISTORICAL]: [
    'history', 'historical', 'evolution', 'development', 'origin',
    'tradition', 'legacy', 'past', 'timeline', 'emergence',
    'retrospective', 'archival', 'chronological', 'heritage', 'roots',
  ],
  [PerspectiveCategory.EMERGING]: [
    'emerging', 'novel', 'innovative', 'future', 'trend',
    'cutting-edge', 'breakthrough', 'frontier', 'nascent', 'pioneering',
    'experimental', 'next-generation', 'disruptive', 'transformative', 'paradigm shift',
  ],
  [PerspectiveCategory.CROSS_CULTURAL]: [
    'cultural', 'cross-cultural', 'international', 'global', 'comparative',
    'multicultural', 'diverse', 'indigenous', 'ethnic', 'regional',
    'local', 'context', 'western', 'eastern', 'developing',
  ],
};

/**
 * Minimum keyword matches required to assign a perspective
 */
const MIN_KEYWORD_MATCHES = 2;

/**
 * Confidence boost for strong matches
 */
const STRONG_MATCH_THRESHOLD = 5;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class DiversityScoringService {
  private readonly logger = new Logger(DiversityScoringService.name);

  constructor(
    // Phase 10.170 Week 4: Netflix-Grade Metrics Integration
    @Optional() private readonly metricsService?: PurposeAwareMetricsService,
  ) {
    this.logger.log('✅ [DiversityScoring] Phase 10.170 Week 3 - Service initialized');
    this.logger.log(
      `[DiversityScoring] Tracking ${PERSPECTIVE_CATEGORIES.length} perspective categories`
    );
    if (metricsService) {
      this.logger.log('✅ [Phase 10.170 Week 4] Metrics collection enabled for diversity');
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Score a single paper's diversity contribution
   *
   * Detects which perspective categories the paper represents
   * and calculates its diversity contribution score.
   *
   * @param paper Paper to analyze
   * @param existingPerspectives Perspectives already in corpus (for uniqueness)
   * @returns Paper diversity score
   */
  scorePaperDiversity(
    paper: ScoringPaperInput,
    existingPerspectives: ReadonlySet<PerspectiveCategory> = new Set(),
  ): PaperDiversityScore {
    const text = this.extractAnalyzableText(paper);
    const detection = this.detectPerspectives(text);

    // Calculate uniqueness
    const uniquePerspectives = detection.perspectives.filter(
      p => !existingPerspectives.has(p)
    );
    const isUnique = uniquePerspectives.length > 0;

    // Calculate diversity contribution
    let diversityContribution = 0;
    if (isUnique) {
      // High contribution for bringing new perspectives
      diversityContribution = 50 + (uniquePerspectives.length * 15);
    } else if (detection.perspectives.length > 0) {
      // Moderate contribution for representing existing perspectives
      diversityContribution = 20 + (detection.perspectives.length * 5);
    } else {
      // Low contribution for unclassified papers
      diversityContribution = 10;
    }

    // Boost for multiple perspectives (cross-disciplinary)
    if (detection.perspectives.length >= 3) {
      diversityContribution += 20;
    }

    // Clamp to valid range
    diversityContribution = Math.min(100, Math.max(0, diversityContribution));

    return {
      paperId: paper.id,
      perspectives: detection.perspectives,
      primaryPerspective: detection.primary,
      confidence: detection.confidence,
      isUniquePerspective: isUnique,
      diversityContribution,
      triggerKeywords: detection.triggerKeywords,
    };
  }

  /**
   * Analyze diversity of an entire paper corpus
   *
   * Calculates Shannon and Simpson indices, identifies underrepresented
   * perspectives, and provides actionable recommendations.
   *
   * @param papers Papers in the corpus
   * @param purpose Optional research purpose for metrics tracking
   * @returns Corpus diversity metrics
   */
  analyzeCorpusDiversity(
    papers: readonly ScoringPaperInput[],
    purpose?: ResearchPurpose,
  ): CorpusDiversityMetrics {
    const startTime = Date.now();

    if (papers.length === 0) {
      return this.buildEmptyMetrics();
    }

    // Score all papers
    const existingPerspectives = new Set<PerspectiveCategory>();
    const paperScores: PaperDiversityScore[] = [];

    for (const paper of papers) {
      const score = this.scorePaperDiversity(paper, existingPerspectives);
      paperScores.push(score);

      // Update existing perspectives
      for (const perspective of score.perspectives) {
        existingPerspectives.add(perspective);
      }
    }

    // Calculate distribution
    const distribution = this.calculateDistribution(paperScores);

    // Calculate diversity indices
    const shannonIndex = this.calculateShannonIndex(distribution);
    const simpsonIndex = this.calculateSimpsonIndex(distribution);

    // Identify coverage
    const uniquePerspectives = existingPerspectives.size;
    const coverageRatio = uniquePerspectives / PERSPECTIVE_CATEGORIES.length;

    // Identify under/over represented categories
    const avgCount = papers.length / PERSPECTIVE_CATEGORIES.length;
    const underrepresented: PerspectiveCategory[] = [];
    const overrepresented: PerspectiveCategory[] = [];

    for (const category of PERSPECTIVE_CATEGORIES) {
      const count = distribution[category];
      if (count < avgCount * 0.5) {
        underrepresented.push(category);
      } else if (count > avgCount * 2) {
        overrepresented.push(category);
      }
    }

    const metrics: CorpusDiversityMetrics = {
      totalPapers: papers.length,
      uniquePerspectives,
      coverageRatio,
      shannonIndex,
      simpsonIndex,
      distribution,
      underrepresented,
      overrepresented,
      healthStatus: 'moderate', // Will be set below
    };

    // Set health status
    (metrics as { healthStatus: DiversityHealthStatus }).healthStatus =
      getDiversityHealthStatus(metrics);

    // Validate
    validateDiversityMetrics(metrics);

    this.logger.log(
      `[DiversityScoring] Corpus analysis: ${papers.length} papers, ` +
      `${uniquePerspectives}/${PERSPECTIVE_CATEGORIES.length} perspectives (${(coverageRatio * 100).toFixed(1)}%), ` +
      `Shannon=${shannonIndex.toFixed(2)}, Simpson=${simpsonIndex.toFixed(2)}, ` +
      `health=${metrics.healthStatus}`
    );

    // Phase 10.170 Week 4: Record metrics
    if (purpose && this.metricsService) {
      const durationMs = Date.now() - startTime;
      this.metricsService.recordDiversityAnalysis(purpose, shannonIndex, durationMs);
    }

    return metrics;
  }

  /**
   * Select papers to maximize diversity
   *
   * Greedy algorithm that selects papers bringing maximum diversity
   * contribution at each step.
   *
   * @param papers Candidate papers
   * @param targetCount Target number of papers
   * @param minQualityScore Minimum quality score to consider
   * @returns Selected papers ordered by selection priority
   */
  selectForMaxDiversity(
    papers: readonly (ScoringPaperInput & { qualityScore?: number })[],
    targetCount: number,
    minQualityScore: number = 0,
  ): readonly ScoringPaperInput[] {
    // Filter by quality
    const eligible = papers.filter(p => (p.qualityScore ?? 100) >= minQualityScore);

    if (eligible.length <= targetCount) {
      return eligible;
    }

    const selected: ScoringPaperInput[] = [];
    const coveredPerspectives = new Set<PerspectiveCategory>();

    // OPTIMIZATION: Use index tracking instead of splice (O(1) removal vs O(n))
    // Mark indices as used rather than removing from array
    const usedIndices = new Set<number>();

    while (selected.length < targetCount && usedIndices.size < eligible.length) {
      // Score remaining papers for diversity contribution
      let bestIdx = -1;
      let bestScore = -1;
      let bestDiversityResult: PaperDiversityScore | null = null;

      for (let i = 0; i < eligible.length; i++) {
        // Skip already selected papers (O(1) lookup)
        if (usedIndices.has(i)) continue;

        // Score paper for diversity
        const diversityScore = this.scorePaperDiversity(eligible[i], coveredPerspectives);

        // Prefer papers with unique perspectives
        let score = diversityScore.diversityContribution;
        if (diversityScore.isUniquePerspective) {
          score += 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
          // OPTIMIZATION: Cache the diversity result to avoid duplicate scoring
          bestDiversityResult = diversityScore;
        }
      }

      // No more papers to select
      if (bestIdx === -1 || !bestDiversityResult) break;

      // Select best paper
      selected.push(eligible[bestIdx]);
      usedIndices.add(bestIdx);

      // Update covered perspectives using cached result (avoids duplicate scorePaperDiversity call)
      for (const perspective of bestDiversityResult.perspectives) {
        coveredPerspectives.add(perspective);
      }
    }

    this.logger.log(
      `[DiversityScoring] Selected ${selected.length}/${papers.length} papers for diversity, ` +
      `covering ${coveredPerspectives.size}/${PERSPECTIVE_CATEGORIES.length} perspectives`
    );

    return selected;
  }

  /**
   * Get recommendations to improve diversity
   *
   * Returns actionable recommendations for improving corpus diversity.
   */
  getRecommendations(metrics: CorpusDiversityMetrics): readonly string[] {
    const recommendations: string[] = [];

    // Coverage recommendations
    if (metrics.coverageRatio < 0.5) {
      recommendations.push(
        `Coverage is low (${(metrics.coverageRatio * 100).toFixed(0)}%). ` +
        `Consider adding papers from: ${metrics.underrepresented.slice(0, 3).join(', ')}`
      );
    }

    // Shannon index recommendations
    if (metrics.shannonIndex < 1.5) {
      recommendations.push(
        `Shannon diversity index (${metrics.shannonIndex.toFixed(2)}) is below optimal. ` +
        `The corpus is dominated by few perspectives.`
      );
    }

    // Underrepresented perspectives
    if (metrics.underrepresented.length > 0) {
      const missing = metrics.underrepresented
        .map(p => p.replace('_', ' '))
        .join(', ');
      recommendations.push(
        `Underrepresented perspectives: ${missing}. ` +
        `Search for papers with these viewpoints.`
      );
    }

    // Overrepresented perspectives
    if (metrics.overrepresented.length > 0) {
      const over = metrics.overrepresented
        .map(p => p.replace('_', ' '))
        .join(', ');
      recommendations.push(
        `Overrepresented perspectives: ${over}. ` +
        `Consider reducing papers from these categories.`
      );
    }

    // Health-specific recommendations
    if (metrics.healthStatus === 'critical') {
      recommendations.push(
        'CRITICAL: Diversity is severely compromised. ' +
        'The corpus may not be suitable for Q-methodology concourse development.'
      );
    } else if (metrics.healthStatus === 'poor') {
      recommendations.push(
        'WARNING: Diversity is poor. ' +
        'Consider broadening search terms to include alternative viewpoints.'
      );
    }

    return recommendations;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Extract analyzable text from paper
   */
  private extractAnalyzableText(paper: ScoringPaperInput): string {
    const parts = [
      paper.title,
      paper.abstract ?? '',
      paper.keywords.join(' '),
    ];
    return parts.join(' ').toLowerCase();
  }

  /**
   * Detect perspectives in text
   */
  private detectPerspectives(text: string): {
    perspectives: PerspectiveCategory[];
    primary: PerspectiveCategory | null;
    confidence: number;
    triggerKeywords: string[];
  } {
    const perspectives: PerspectiveCategory[] = [];
    const matchCounts: Map<PerspectiveCategory, number> = new Map();
    const allTriggerKeywords: string[] = [];

    for (const category of PERSPECTIVE_CATEGORIES) {
      const keywords = PERSPECTIVE_KEYWORDS[category];
      const matches = keywords.filter(kw => text.includes(kw));

      if (matches.length >= MIN_KEYWORD_MATCHES) {
        perspectives.push(category);
        matchCounts.set(category, matches.length);
        allTriggerKeywords.push(...matches);
      }
    }

    // Determine primary perspective (most matches)
    let primary: PerspectiveCategory | null = null;
    let maxMatches = 0;
    for (const [category, count] of matchCounts) {
      if (count > maxMatches) {
        maxMatches = count;
        primary = category;
      }
    }

    // Calculate confidence
    let confidence = 0;
    if (perspectives.length > 0) {
      confidence = Math.min(1, maxMatches / STRONG_MATCH_THRESHOLD);
    }

    return {
      perspectives,
      primary,
      confidence,
      triggerKeywords: [...new Set(allTriggerKeywords)], // Dedupe
    };
  }

  /**
   * Calculate distribution across categories
   */
  private calculateDistribution(
    paperScores: readonly PaperDiversityScore[],
  ): Readonly<Record<PerspectiveCategory, number>> {
    const distribution: Record<PerspectiveCategory, number> = {} as Record<PerspectiveCategory, number>;

    // Initialize all categories to 0
    for (const category of PERSPECTIVE_CATEGORIES) {
      distribution[category] = 0;
    }

    // Count papers in each category
    for (const score of paperScores) {
      for (const perspective of score.perspectives) {
        distribution[perspective]++;
      }
    }

    return distribution;
  }

  /**
   * Calculate Shannon diversity index
   *
   * H = -Σ(pi * ln(pi))
   * Higher values indicate more diversity.
   */
  private calculateShannonIndex(
    distribution: Readonly<Record<PerspectiveCategory, number>>,
  ): number {
    const counts = Object.values(distribution);
    const total = counts.reduce((a, b) => a + b, 0);

    if (total === 0) return 0;

    let shannon = 0;
    for (const count of counts) {
      if (count > 0) {
        const p = count / total;
        shannon -= p * Math.log(p);
      }
    }

    return shannon;
  }

  /**
   * Calculate Simpson diversity index
   *
   * D = 1 - Σ(ni(ni-1) / N(N-1))
   * Values closer to 1 indicate more diversity.
   */
  private calculateSimpsonIndex(
    distribution: Readonly<Record<PerspectiveCategory, number>>,
  ): number {
    const counts = Object.values(distribution);
    const N = counts.reduce((a, b) => a + b, 0);

    if (N <= 1) return 0;

    let sumNiNi1 = 0;
    for (const ni of counts) {
      sumNiNi1 += ni * (ni - 1);
    }

    return 1 - (sumNiNi1 / (N * (N - 1)));
  }

  /**
   * Build empty metrics for empty corpus
   */
  private buildEmptyMetrics(): CorpusDiversityMetrics {
    const distribution: Record<PerspectiveCategory, number> = {} as Record<PerspectiveCategory, number>;
    for (const category of PERSPECTIVE_CATEGORIES) {
      distribution[category] = 0;
    }

    return {
      totalPapers: 0,
      uniquePerspectives: 0,
      coverageRatio: 0,
      shannonIndex: 0,
      simpsonIndex: 0,
      distribution,
      underrepresented: [...PERSPECTIVE_CATEGORIES],
      overrepresented: [],
      healthStatus: 'critical',
    };
  }
}
