/**
 * Phase 10.170: Purpose-Aware Search Service
 *
 * Enterprise-grade orchestration service that integrates purpose-aware
 * configuration with the existing search pipeline.
 *
 * RESPONSIBILITIES:
 * - Orchestrate purpose-aware paper searches
 * - Apply purpose-specific quality weights and thresholds
 * - Track full-text requirements per purpose
 * - Emit WebSocket events with purpose context
 * - Adaptive threshold relaxation when needed
 *
 * ARCHITECTURE:
 * - Wraps SearchPipelineService with purpose-aware configuration
 * - Uses PurposeAwareConfigService for configuration
 * - Integrates with existing WebSocket events
 *
 * @module purpose-aware-search.service
 * @since Phase 10.170
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ResearchPurpose,
  PurposeFetchingConfig,
  PurposeAwareSearchResult,
  DiversityMetrics,
  isValidResearchPurpose,
} from '../types/purpose-aware.types';
import {
  PurposeAwareConfigService,
  ConfigOverrideOptions,
  ResolvedConfig,
} from './purpose-aware-config.service';
import { Paper } from '../dto/literature.dto';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Purpose-aware search options
 */
export interface PurposeAwareSearchOptions {
  /** Search query */
  query: string;
  /** Research purpose */
  purpose: ResearchPurpose;
  /** Optional configuration overrides */
  overrides?: ConfigOverrideOptions;
  /** WebSocket session ID (for events) */
  sessionId?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Progress callback */
  onProgress?: (message: string, progress: number) => void;
}

/**
 * Search execution result with purpose context
 */
export interface PurposeAwareExecutionResult {
  /** Filtered papers */
  papers: Paper[];
  /** Search result summary */
  summary: PurposeAwareSearchResult;
  /** Resolved configuration used */
  config: ResolvedConfig;
}

/**
 * Quality scoring result
 */
export interface PurposeAwareQualityScore {
  /** Paper ID */
  paperId: string;
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Score breakdown by dimension */
  breakdown: {
    content: number;
    citation: number;
    journal: number;
    methodology: number;
    diversity?: number;
    fullTextBoost: number;
  };
  /** Whether paper meets threshold */
  meetsThreshold: boolean;
  /** Purpose used for scoring */
  purpose: ResearchPurpose;
}

// ============================================================================
// SERVICE CONSTANTS
// ============================================================================

/** Maximum threshold relaxation iterations */
const MAX_RELAXATION_ITERATIONS = 5;

/** Minimum papers to trigger threshold relaxation */
const MIN_PAPERS_FOR_RELAXATION = 10;

// ============================================================================
// OPTIMIZATION: Pre-computed keyword arrays (avoid recreating on each call)
// ============================================================================

/** Methodology keywords for content scoring */
const METHOD_KEYWORDS = Object.freeze([
  'method', 'approach', 'framework', 'analysis', 'study', 'research',
]);

/** Result keywords for content scoring */
const RESULT_KEYWORDS = Object.freeze([
  'results', 'findings', 'conclusion', 'evidence', 'data',
]);

/** Research design keywords for methodology scoring */
const DESIGN_KEYWORDS = Object.freeze([
  'randomized', 'controlled', 'longitudinal', 'cross-sectional',
  'meta-analysis', 'systematic review', 'qualitative', 'quantitative',
  'mixed methods', 'experimental', 'observational',
]);

/** Statistical rigor keywords for methodology scoring */
const STAT_KEYWORDS = Object.freeze([
  'p-value', 'significance', 'confidence interval', 'regression', 'correlation',
]);

/** Debate/controversy keywords for diversity scoring */
const DEBATE_KEYWORDS = Object.freeze([
  'debate', 'controversy', 'disagree', 'critique', 'alternative',
  'challenge', 'oppose', 'question', 'versus', 'however',
]);

/** Opinion/perspective keywords for diversity scoring */
const OPINION_KEYWORDS = Object.freeze([
  'perspective', 'viewpoint', 'opinion', 'belief', 'attitude',
  'perception', 'experience', 'narrative', 'voice',
]);

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareSearchService {
  private readonly logger = new Logger(PurposeAwareSearchService.name);

  constructor(
    private readonly configService: PurposeAwareConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('✅ [Phase 10.170] PurposeAwareSearchService initialized');
  }

  // ==========================================================================
  // CORE SEARCH METHODS
  // ==========================================================================

  /**
   * Get resolved configuration for a purpose-aware search
   *
   * @param purpose Research purpose
   * @param overrides Optional configuration overrides
   * @returns Resolved configuration
   */
  getResolvedConfig(
    purpose: ResearchPurpose,
    overrides?: ConfigOverrideOptions,
  ): ResolvedConfig {
    // Validate purpose
    if (!isValidResearchPurpose(purpose)) {
      throw new BadRequestException(
        `Invalid ResearchPurpose: ${purpose}. Must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
      );
    }

    return this.configService.getConfigWithOverrides(purpose, overrides);
  }

  /**
   * Calculate purpose-aware quality score for a paper
   *
   * Uses purpose-specific weights to score papers differently based on
   * the research methodology requirements.
   *
   * OPTIMIZATION: Accepts optional config to avoid repeated lookups when batch processing
   *
   * @param paper Paper to score
   * @param purpose Research purpose
   * @param hasFullText Whether paper has full-text available
   * @param cachedConfig Optional pre-fetched config (for batch processing)
   * @returns Quality score with breakdown
   */
  calculateQualityScore(
    paper: Paper,
    purpose: ResearchPurpose,
    hasFullText: boolean,
    cachedConfig?: PurposeFetchingConfig,
  ): PurposeAwareQualityScore {
    // OPTIMIZATION: Use cached config or fetch once
    const config = cachedConfig ?? this.configService.getConfig(purpose);
    const weights = config.qualityWeights;
    const threshold = config.qualityThreshold.initial;

    // OPTIMIZATION: Compute text once, pass to all scoring methods
    const cachedText = this.getPaperText(paper);

    // Calculate individual dimension scores (0-100)
    const contentScore = this.calculateContentScore(paper, cachedText);
    const citationScore = this.calculateCitationScore(paper);
    const journalScore = this.calculateJournalScore(paper);
    const methodologyScore = this.calculateMethodologyScore(paper, cachedText);
    const diversityScore = weights.diversity ? this.calculateDiversityScore(paper, cachedText) : 0;

    // Calculate full-text boost
    const fullTextBoost = hasFullText ? config.fullTextRequirement.fullTextBoost : 0;

    // Calculate weighted overall score
    let overallScore =
      contentScore * weights.content +
      citationScore * weights.citation +
      journalScore * weights.journal +
      methodologyScore * weights.methodology;

    // Add diversity if applicable (Q-methodology)
    if (weights.diversity) {
      overallScore += diversityScore * weights.diversity;
    }

    // Add full-text boost (additive, not weighted)
    overallScore = Math.min(100, overallScore + fullTextBoost);

    return {
      paperId: paper.id ?? paper.title ?? 'unknown',
      overallScore: Math.round(overallScore * 100) / 100,
      breakdown: {
        content: contentScore,
        citation: citationScore,
        journal: journalScore,
        methodology: methodologyScore,
        diversity: weights.diversity ? diversityScore : undefined,
        fullTextBoost,
      },
      meetsThreshold: overallScore >= threshold,
      purpose,
    };
  }

  /**
   * Filter papers by purpose-aware quality threshold
   *
   * Implements adaptive threshold relaxation if insufficient papers found.
   *
   * OPTIMIZATION: Fetches config once for entire batch instead of per-paper
   *
   * @param papers Papers to filter
   * @param purpose Research purpose
   * @param hasFullTextMap Map of paper IDs to full-text availability
   * @returns Filtered papers and actual threshold used
   */
  filterByQualityThreshold(
    papers: Paper[],
    purpose: ResearchPurpose,
    hasFullTextMap: Map<string, boolean>,
  ): { papers: Paper[]; actualThreshold: number } {
    // OPTIMIZATION: Fetch config ONCE for entire batch
    const config = this.configService.getConfig(purpose);
    const minPapers = config.paperLimits.min;
    const relaxationSteps = config.qualityThreshold.relaxationSteps;

    // OPTIMIZATION: Score all papers with cached config
    const scoredPapers = papers.map(paper => ({
      paper,
      score: this.calculateQualityScore(
        paper,
        purpose,
        hasFullTextMap.get(paper.id ?? paper.title ?? '') ?? false,
        config, // Pass cached config to avoid N lookups
      ),
    }));

    // Sort by score descending
    scoredPapers.sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Adaptive threshold relaxation
    let actualThreshold = config.qualityThreshold.initial;
    let filteredPapers = scoredPapers.filter(p => p.score.meetsThreshold);

    // Relax threshold if not enough papers
    for (let i = 0; i < relaxationSteps.length && filteredPapers.length < minPapers; i++) {
      actualThreshold = relaxationSteps[i];
      filteredPapers = scoredPapers.filter(p => p.score.overallScore >= actualThreshold);

      this.logger.log(
        `📉 [Phase 10.170] Threshold relaxed: ${relaxationSteps[i - 1] ?? config.qualityThreshold.initial} → ${actualThreshold} ` +
        `(${filteredPapers.length} papers now qualify)`,
      );
    }

    return {
      papers: filteredPapers.map(p => p.paper),
      actualThreshold,
    };
  }

  /**
   * Check if full-text requirements are met for a purpose
   *
   * @param fullTextCount Number of papers with full-text
   * @param purpose Research purpose
   * @returns Whether requirements are met
   */
  checkFullTextRequirements(
    fullTextCount: number,
    purpose: ResearchPurpose,
  ): { met: boolean; required: number; actual: number; strict: boolean } {
    const config = this.configService.getConfig(purpose);
    const requirement = config.fullTextRequirement;

    return {
      met: fullTextCount >= requirement.minRequired,
      required: requirement.minRequired,
      actual: fullTextCount,
      strict: requirement.strictRequirement,
    };
  }

  // ==========================================================================
  // DIVERSITY METHODS (Q-Methodology)
  // ==========================================================================

  /**
   * Calculate diversity metrics for Q-methodology
   *
   * @param papers Papers to analyze
   * @returns Diversity metrics
   */
  calculateDiversityMetrics(papers: Paper[]): DiversityMetrics {
    // Extract perspectives/viewpoints from papers
    const perspectives = this.extractPerspectives(papers);
    const perspectiveCounts = new Map<string, number>();

    for (const perspective of perspectives) {
      const count = perspectiveCounts.get(perspective) || 0;
      perspectiveCounts.set(perspective, count + 1);
    }

    const uniquePerspectives = perspectiveCounts.size;
    const totalPapers = papers.length;

    // Calculate Shannon entropy
    let entropy = 0;
    for (const count of perspectiveCounts.values()) {
      const p = count / totalPapers;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    // Normalize entropy (0-1)
    const maxEntropy = Math.log2(uniquePerspectives || 1);
    const entropyScore = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Calculate Gini coefficient
    const counts = Array.from(perspectiveCounts.values()).sort((a, b) => a - b);
    let giniNumerator = 0;
    for (let i = 0; i < counts.length; i++) {
      giniNumerator += (2 * (i + 1) - counts.length - 1) * counts[i];
    }
    const giniCoefficient = counts.length > 0
      ? giniNumerator / (counts.length * counts.reduce((a, b) => a + b, 0))
      : 0;

    // Identify underrepresented perspectives (< 5% of papers)
    const threshold = totalPapers * 0.05;
    const underrepresentedPerspectives = Array.from(perspectiveCounts.entries())
      .filter(([, count]) => count < threshold)
      .map(([perspective]) => perspective);

    return {
      uniquePerspectives,
      entropyScore: Math.round(entropyScore * 1000) / 1000,
      giniCoefficient: Math.round(giniCoefficient * 1000) / 1000,
      underrepresentedPerspectives,
    };
  }

  // ==========================================================================
  // EVENT EMISSION METHODS
  // ==========================================================================

  /**
   * Emit purpose-aware search started event
   *
   * @param sessionId WebSocket session ID
   * @param purpose Research purpose
   * @param config Resolved configuration
   */
  emitSearchStarted(
    sessionId: string,
    purpose: ResearchPurpose,
    config: ResolvedConfig,
  ): void {
    const metadata = this.configService.getMetadata(purpose);

    this.eventEmitter.emit('purpose-aware-search.started', {
      sessionId,
      purpose,
      displayName: metadata.displayName,
      config: {
        paperLimits: config.paperLimits,
        qualityThreshold: config.qualityThreshold.initial,
        contentPriority: config.contentPriority,
        fullTextRequired: config.fullTextRequirement.strictRequirement,
        scientificMethod: config.scientificMethod,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit purpose-aware search progress event
   *
   * @param sessionId WebSocket session ID
   * @param purpose Research purpose
   * @param stage Current stage
   * @param progress Progress percentage
   * @param details Optional details
   */
  emitSearchProgress(
    sessionId: string,
    purpose: ResearchPurpose,
    stage: string,
    progress: number,
    details?: Record<string, unknown>,
  ): void {
    this.eventEmitter.emit('purpose-aware-search.progress', {
      sessionId,
      purpose,
      stage,
      progress,
      details,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit purpose-aware search completed event
   *
   * @param sessionId WebSocket session ID
   * @param result Search result
   */
  emitSearchCompleted(
    sessionId: string,
    result: PurposeAwareSearchResult,
  ): void {
    const metadata = this.configService.getMetadata(result.purpose);

    this.eventEmitter.emit('purpose-aware-search.completed', {
      sessionId,
      purpose: result.purpose,
      displayName: metadata.displayName,
      result,
      timestamp: Date.now(),
    });
  }

  // ==========================================================================
  // PRIVATE SCORING METHODS
  // ==========================================================================

  /**
   * Calculate content depth score (0-100)
   * OPTIMIZED: Uses pre-computed keyword arrays
   */
  private calculateContentScore(paper: Paper, cachedText?: string): number {
    let score = 0;

    // Abstract length (up to 40 points)
    const abstractLength = paper.abstract?.length ?? 0;
    if (abstractLength > 1500) score += 40;
    else if (abstractLength > 1000) score += 30;
    else if (abstractLength > 500) score += 20;
    else if (abstractLength > 200) score += 10;

    // Has full text indicator (30 points)
    if (paper.pdfUrl || paper.hasPdf || paper.hasFullText) {
      score += 30;
    }

    // OPTIMIZATION: Use cached text or compute once
    const text = cachedText ?? this.getPaperText(paper);

    // Has methodology indicators (15 points)
    if (METHOD_KEYWORDS.some(kw => text.includes(kw))) {
      score += 15;
    }

    // Has results indicators (15 points)
    if (RESULT_KEYWORDS.some(kw => text.includes(kw))) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate citation impact score (0-100)
   */
  private calculateCitationScore(paper: Paper): number {
    const citations = paper.citationCount ?? 0;

    // Logarithmic scaling (more citations = diminishing returns)
    if (citations >= 1000) return 100;
    if (citations >= 500) return 90;
    if (citations >= 200) return 80;
    if (citations >= 100) return 70;
    if (citations >= 50) return 60;
    if (citations >= 20) return 50;
    if (citations >= 10) return 40;
    if (citations >= 5) return 30;
    if (citations >= 1) return 20;
    return 10; // Base score for uncited papers
  }

  /**
   * Calculate journal prestige score (0-100)
   */
  private calculateJournalScore(paper: Paper): number {
    let score = 50; // Base score

    // Venue/journal name presence (20 points)
    if (paper.venue) {
      score += 20;
    }

    // Venue type indicators
    const venue = (paper.venue ?? '').toLowerCase();
    if (venue.includes('nature') || venue.includes('science') || venue.includes('lancet')) {
      score += 30; // Top-tier journals
    } else if (venue.includes('journal') || venue.includes('review')) {
      score += 15; // Standard journals
    } else if (venue.includes('conference') || venue.includes('proceedings')) {
      score += 10; // Conference papers
    }

    return Math.min(100, score);
  }

  /**
   * Calculate methodology rigor score (0-100)
   * OPTIMIZED: Uses pre-computed keyword arrays
   */
  private calculateMethodologyScore(paper: Paper, cachedText?: string): number {
    let score = 30; // Base score

    // OPTIMIZATION: Use cached text or compute once
    const text = cachedText ?? this.getPaperText(paper);

    // Research design indicators (30 points)
    const designMatches = DESIGN_KEYWORDS.filter(kw => text.includes(kw)).length;
    score += Math.min(30, designMatches * 10);

    // Sample size indicators (20 points)
    if (text.match(/n\s*=\s*\d+/) || text.includes('participants') || text.includes('sample')) {
      score += 20;
    }

    // Statistical rigor (20 points)
    if (STAT_KEYWORDS.some(kw => text.includes(kw))) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate perspective diversity score (0-100)
   * Used for Q-methodology to identify diverse viewpoints
   * OPTIMIZED: Uses pre-computed keyword arrays
   */
  private calculateDiversityScore(paper: Paper, cachedText?: string): number {
    let score = 50; // Base score

    // OPTIMIZATION: Use cached text or compute once
    const text = cachedText ?? this.getPaperText(paper);

    // Controversial/debate indicators (25 points)
    if (DEBATE_KEYWORDS.some(kw => text.includes(kw))) {
      score += 25;
    }

    // Opinion/perspective indicators (25 points)
    if (OPINION_KEYWORDS.some(kw => text.includes(kw))) {
      score += 25;
    }

    return Math.min(100, score);
  }

  /**
   * Get paper text for scoring (cached computation)
   * OPTIMIZATION: Computes text once, can be passed to multiple scoring methods
   */
  private getPaperText(paper: Paper): string {
    return `${paper.title ?? ''} ${paper.abstract ?? ''}`.toLowerCase();
  }

  /**
   * Extract perspectives/viewpoints from papers
   * Used for diversity analysis in Q-methodology
   */
  private extractPerspectives(papers: Paper[]): string[] {
    const perspectives: string[] = [];

    for (const paper of papers) {
      const text = `${paper.title ?? ''} ${paper.abstract ?? ''}`.toLowerCase();

      // Extract domain/topic perspective
      if (paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0) {
        perspectives.push(paper.fieldsOfStudy[0]);
      }

      // Extract methodological perspective
      if (text.includes('qualitative')) {
        perspectives.push('qualitative');
      } else if (text.includes('quantitative')) {
        perspectives.push('quantitative');
      } else if (text.includes('mixed')) {
        perspectives.push('mixed-methods');
      }

      // Extract stance perspective
      if (text.includes('support') || text.includes('advocate')) {
        perspectives.push('supportive');
      } else if (text.includes('critique') || text.includes('challenge')) {
        perspectives.push('critical');
      } else if (text.includes('neutral') || text.includes('objective')) {
        perspectives.push('neutral');
      }
    }

    return perspectives;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get summary for a purpose-aware search
   *
   * @param purpose Research purpose
   * @param papers Resulting papers
   * @param fullTextCount Papers with full-text
   * @param actualThreshold Actual threshold used
   * @param processingTimeMs Processing time
   * @param config Resolved configuration
   * @returns Search result summary
   */
  createSearchSummary(
    purpose: ResearchPurpose,
    papers: Paper[],
    fullTextCount: number,
    actualThreshold: number,
    processingTimeMs: number,
    config: ResolvedConfig,
  ): PurposeAwareSearchResult {
    return {
      purpose,
      config,
      totalFetched: papers.length,
      qualifiedPapers: papers.length,
      fullTextCount,
      actualThreshold,
      diversityMetrics: config.diversityRequired
        ? this.calculateDiversityMetrics(papers)
        : undefined,
      processingTimeMs,
    };
  }

  /**
   * Log purpose-aware search start
   */
  logSearchStart(purpose: ResearchPurpose, query: string): void {
    const metadata = this.configService.getMetadata(purpose);
    const config = this.configService.getConfig(purpose);

    this.logger.log(
      `\n${'═'.repeat(80)}` +
      `\n🎯 PURPOSE-AWARE SEARCH (Phase 10.170)` +
      `\n   Purpose: ${metadata.displayName}` +
      `\n   Query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"` +
      `\n   Method: ${config.scientificMethod}` +
      `\n   Target Papers: ${config.paperLimits.target}` +
      `\n   Quality Threshold: ${config.qualityThreshold.initial}%` +
      `\n${'═'.repeat(80)}\n`,
    );
  }

  /**
   * Log purpose-aware search completion
   */
  logSearchComplete(result: PurposeAwareSearchResult): void {
    const metadata = this.configService.getMetadata(result.purpose);

    this.logger.log(
      `\n${'═'.repeat(80)}` +
      `\n✅ PURPOSE-AWARE SEARCH COMPLETE` +
      `\n   Purpose: ${metadata.displayName}` +
      `\n   Papers Found: ${result.qualifiedPapers}` +
      `\n   Full-Text Available: ${result.fullTextCount}` +
      `\n   Actual Threshold: ${result.actualThreshold}%` +
      `\n   Processing Time: ${result.processingTimeMs}ms` +
      (result.diversityMetrics
        ? `\n   Unique Perspectives: ${result.diversityMetrics.uniquePerspectives}` +
          `\n   Entropy Score: ${result.diversityMetrics.entropyScore}`
        : '') +
      `\n${'═'.repeat(80)}\n`,
    );
  }

  /**
   * Get purpose metadata (public accessor for gateway)
   *
   * @param purpose Research purpose
   * @returns Purpose metadata
   */
  getMetadata(purpose: ResearchPurpose) {
    return this.configService.getMetadata(purpose);
  }
}
