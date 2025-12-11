/**
 * Phase 10.113 Week 2: Theme-Fit Relevance Scoring Service
 *
 * Netflix-grade scoring algorithm optimized for Q-methodology thematization potential.
 * Analyzes papers for their suitability for theme extraction and Q-sort statement generation.
 *
 * SCORING COMPONENTS:
 * - Controversy Potential (30%): Does abstract contain opposing views?
 * - Statement Clarity (25%): Clear positions that can become statements
 * - Perspective Diversity (25%): Multiple viewpoints represented
 * - Citation Controversy (20%): Polarized citation patterns
 *
 * ARCHITECTURAL PATTERN:
 * - Strict TypeScript (NO any types)
 * - Netflix-grade performance (O(n) complexity)
 * - In-place processing for memory efficiency
 * - Comprehensive pattern matching for academic text
 *
 * @see PHASE_10.113_WORLD_CLASS_THEMATIZATION.md Week 2
 */

import { Injectable, Logger } from '@nestjs/common';
import type { Paper } from '../dto/literature.dto';
import type { CitationControversyIndex } from '../types/citation-controversy.types';

/**
 * Theme-Fit Score interface (strict typing)
 * Each component is normalized to 0-1 range
 */
export interface ThemeFitScore {
  /** 0-1: Does abstract contain opposing views? */
  readonly controversyPotential: number;
  /** 0-1: Clear positions that can become statements */
  readonly statementClarity: number;
  /** 0-1: Multiple viewpoints represented */
  readonly perspectiveDiversity: number;
  /** 0-1: Polarized citation patterns */
  readonly citationControversy: number;
  /** Weighted combination of all scores */
  readonly overallThemeFit: number;
  /** Explanation of the score for debugging */
  readonly explanation: string;
}

/**
 * Paper with Theme-Fit Score (extends Paper)
 */
export interface PaperWithThemeFit extends Paper {
  themeFitScore?: ThemeFitScore;
}

/**
 * Configuration for Theme-Fit scoring weights
 */
export interface ThemeFitWeights {
  readonly controversyPotential: number;
  readonly statementClarity: number;
  readonly perspectiveDiversity: number;
  readonly citationControversy: number;
}

/**
 * Pattern match result for internal scoring
 */
interface PatternMatchResult {
  readonly score: number;
  readonly matchCount: number;
  readonly patterns: readonly string[];
}

/**
 * Default weights for Theme-Fit scoring
 * Tuned for optimal Q-methodology thematization
 */
const DEFAULT_WEIGHTS: Readonly<ThemeFitWeights> = {
  controversyPotential: 0.30,
  statementClarity: 0.25,
  perspectiveDiversity: 0.25,
  citationControversy: 0.20,
} as const;

/**
 * Saturation points for pattern scoring (diminishing returns threshold)
 * Higher values = more matches needed to reach max score
 */
const SATURATION_POINTS = {
  CONTROVERSY: 5,
  STATEMENT: 8,
  PERSPECTIVE: 6,
  CITATION: 3,
} as const;

/**
 * Citation boost configuration
 * Controls how citation data affects controversy score
 */
const CITATION_BOOST_CONFIG = {
  /** Divisor for citation count boost (500 citations = max boost) */
  CITATION_COUNT_DIVISOR: 500,
  /** Maximum boost from citation count (0-1 range) */
  MAX_CITATION_BOOST: 0.2,
  /** Velocity thresholds: citations/year -> boost amount */
  VELOCITY_THRESHOLDS: [
    { minCitationsPerYear: 20, boost: 0.15 },
    { minCitationsPerYear: 10, boost: 0.10 },
    { minCitationsPerYear: 5, boost: 0.05 },
  ] as const,
} as const;

/**
 * Thematization tier configuration
 * Maps score thresholds to tier labels
 */
const THEMATIZATION_TIERS: readonly { readonly threshold: number; readonly label: string }[] = [
  { threshold: 0.80, label: 'Excellent for Q-Sort' },
  { threshold: 0.65, label: 'Very Good for Thematization' },
  { threshold: 0.50, label: 'Good for Thematization' },
  { threshold: 0.35, label: 'Moderate Potential' },
  { threshold: 0.20, label: 'Limited Potential' },
  { threshold: 0.00, label: 'Low Thematization Value' },
] as const;

/**
 * Threshold for "Good for Thematization" classification
 */
const GOOD_THEMATIZATION_THRESHOLD = 0.5;

/**
 * CCI Integration weights for blending citation controversy scores
 * When CCI data is available, we blend it with text-based analysis
 */
const CCI_BLEND_WEIGHTS = {
  /** Weight for CCI score (primary signal) */
  CCI_SCORE_WEIGHT: 0.7,
  /** Weight for text pattern score (fallback signal) */
  TEXT_PATTERN_WEIGHT: 0.3,
} as const;

/**
 * Controversy indicator patterns in academic text
 * Compiled once for performance (O(1) per pattern check)
 */
const CONTROVERSY_PATTERNS: readonly RegExp[] = [
  // Explicit disagreement markers
  /\bhowever\b/i,
  /\bnevertheless\b/i,
  /\bin contrast\b/i,
  /\bon the other hand\b/i,
  /\bconversely\b/i,
  /\balternatively\b/i,
  // Debate vocabulary
  /\bdebate[sd]?\b/i,
  /\bcontroversy\b/i,
  /\bcontroversial\b/i,
  /\bdisagree(?:ment|s|d)?\b/i,
  /\boppos(?:e[sd]?|ing|ition)\b/i,
  /\bcontest(?:ed|ing)?\b/i,
  // Challenge vocabulary
  /\bchallenge[sd]?\b/i,
  /\bquestion(?:ed|ing|s)?\b/i,
  /\brefute[sd]?\b/i,
  /\bcontradict(?:s|ed|ory)?\b/i,
  /\bdispute[sd]?\b/i,
  // Comparative patterns
  /\bsome researchers.*while others\b/i,
  /\bsome studies.*whereas\b/i,
  /\bsome argue.*others\b/i,
  /\bon one hand.*on the other\b/i,
  // Evidence patterns
  /\bconflicting evidence\b/i,
  /\bmixed results\b/i,
  /\binconsistent findings\b/i,
  /\bcontradictory (?:evidence|findings|results)\b/i,
  /\bcompeting (?:theories|hypotheses|models)\b/i,
] as const;

/**
 * Statement-ready patterns in academic text
 * Identifies clear positions suitable for Q-sort statements
 */
const STATEMENT_PATTERNS: readonly RegExp[] = [
  // Author claims
  /\bwe argue that\b/i,
  /\bwe propose that\b/i,
  /\bwe conclude that\b/i,
  /\bwe suggest that\b/i,
  /\bwe contend that\b/i,
  /\bwe assert that\b/i,
  /\bwe demonstrate that\b/i,
  /\bwe hypothesize that\b/i,
  // Evidence-based claims
  /\bevidence suggests\b/i,
  /\bfindings indicate\b/i,
  /\bresults show\b/i,
  /\bdata reveal[s]?\b/i,
  /\banalysis demonstrates\b/i,
  /\bresearch confirms\b/i,
  // Normative statements
  /\bshould\b/i,
  /\bmust\b/i,
  /\bneed to\b/i,
  /\bought to\b/i,
  /\bessential(?:ly)? to\b/i,
  // Importance markers
  /\bimportant(?:ly)?\b/i,
  /\bcritical(?:ly)?\b/i,
  /\bessential\b/i,
  /\bnecessary\b/i,
  /\bcrucial(?:ly)?\b/i,
  /\bfundamental(?:ly)?\b/i,
  // Definitive statements
  /\bclearly\b/i,
  /\bundoubtedly\b/i,
  /\bwithout doubt\b/i,
  /\bcertainly\b/i,
  /\bin fact\b/i,
] as const;

/**
 * Perspective diversity indicators
 * Detects multiple viewpoints in text
 */
const PERSPECTIVE_PATTERNS: readonly RegExp[] = [
  // Multiple viewpoint markers
  /\bfrom (?:a|the) (?:\w+) perspective\b/i,
  /\bfrom (?:a|the) (?:\w+) point of view\b/i,
  /\baccording to (?:\w+)\b/i,
  /\b(?:\w+) scholars\b/i,
  /\b(?:\w+) researchers\b/i,
  // Stakeholder references
  /\bpractitioners\b/i,
  /\bpolicymakers\b/i,
  /\bstakeholders\b/i,
  /\bpatients\b/i,
  /\bclinicians\b/i,
  /\bteachers\b/i,
  /\bstudents\b/i,
  /\bconsumers\b/i,
  /\bproviders\b/i,
  // Disciplinary perspectives
  /\bpsychological(?:ly)?\b/i,
  /\bsociological(?:ly)?\b/i,
  /\beconomic(?:ally)?\b/i,
  /\bpolitical(?:ly)?\b/i,
  /\bcultural(?:ly)?\b/i,
  /\bbiological(?:ly)?\b/i,
  // Comparative perspectives
  /\bwestern\b/i,
  /\beastern\b/i,
  /\bglobal(?:ly)?\b/i,
  /\blocal(?:ly)?\b/i,
  /\burban\b/i,
  /\brural\b/i,
] as const;

/**
 * Citation controversy indicators
 * Patterns suggesting polarized citation patterns
 */
const CITATION_CONTROVERSY_PATTERNS: readonly RegExp[] = [
  // Citing disagreement
  /\bcited.*(?:disagree|challenge|refute)\b/i,
  /\breferences.*(?:debate|controversy)\b/i,
  /\bprevious work.*(?:contradict|dispute)\b/i,
  // Response patterns
  /\bin response to\b/i,
  /\breplying to\b/i,
  /\bcountering\b/i,
  /\brebuttal\b/i,
  // Scholarly debate
  /\bscholarly debate\b/i,
  /\bacademic discourse\b/i,
  /\btheoretical debate\b/i,
  /\bmethodological debate\b/i,
  // Citation clusters
  /\bone school of thought\b/i,
  /\banother school\b/i,
  /\bcompeting schools\b/i,
  /\brival theories\b/i,
] as const;

@Injectable()
export class ThemeFitScoringService {
  private readonly logger = new Logger(ThemeFitScoringService.name);
  private readonly weights: Readonly<ThemeFitWeights>;

  // OPTIMIZATION: Cache currentYear to avoid Date() call per paper in batch processing
  private readonly currentYear: number;

  constructor() {
    this.weights = DEFAULT_WEIGHTS;
    this.currentYear = new Date().getFullYear();
    this.logger.log(
      `✅ [Phase 10.113 Week 2] ThemeFitScoringService initialized ` +
      `(weights: controversy=${this.weights.controversyPotential}, ` +
      `statement=${this.weights.statementClarity}, ` +
      `perspective=${this.weights.perspectiveDiversity}, ` +
      `citation=${this.weights.citationControversy})`
    );
  }

  /**
   * Calculate Theme-Fit score for a single paper
   *
   * @param paper - Paper to score
   * @returns Theme-Fit score components
   */
  calculateThemeFitScore(paper: Paper): ThemeFitScore {
    const text = this.extractAnalyzableText(paper);

    // Calculate individual components
    const controversyResult = this.calculateControversyPotential(text);
    const statementResult = this.calculateStatementClarity(text);
    const perspectiveResult = this.calculatePerspectiveDiversity(text);
    const citationResult = this.calculateCitationControversy(text, paper);

    // Calculate weighted overall score
    const overallThemeFit =
      controversyResult.score * this.weights.controversyPotential +
      statementResult.score * this.weights.statementClarity +
      perspectiveResult.score * this.weights.perspectiveDiversity +
      citationResult.score * this.weights.citationControversy;

    // Generate explanation
    const explanation = this.generateExplanation(
      controversyResult,
      statementResult,
      perspectiveResult,
      citationResult,
      overallThemeFit,
    );

    return {
      controversyPotential: controversyResult.score,
      statementClarity: statementResult.score,
      perspectiveDiversity: perspectiveResult.score,
      citationControversy: citationResult.score,
      overallThemeFit,
      explanation,
    };
  }

  /**
   * Calculate Theme-Fit scores for multiple papers (batch processing)
   * In-place mutation for memory efficiency
   *
   * @param papers - Papers to score
   * @returns Papers with Theme-Fit scores
   */
  calculateThemeFitScoresBatch<T extends Paper>(papers: T[]): (T & PaperWithThemeFit)[] {
    // Defensive: Handle empty array
    if (!papers || papers.length === 0) {
      this.logger.warn('⚠️  [ThemeFit] Batch scoring called with empty array');
      return [];
    }

    const startTime = Date.now();

    const scoredPapers = papers.map((paper): T & PaperWithThemeFit => ({
      ...paper,
      themeFitScore: this.calculateThemeFitScore(paper),
    }));

    const duration = Date.now() - startTime;

    // Safe division with fallback to 0
    const totalScore = scoredPapers.reduce(
      (sum, p) => sum + (p.themeFitScore?.overallThemeFit ?? 0),
      0,
    );
    const avgScore = scoredPapers.length > 0 ? totalScore / scoredPapers.length : 0;

    this.logger.log(
      `✅ [ThemeFit] Batch scored ${papers.length} papers in ${duration}ms ` +
      `(avg score: ${(avgScore * 100).toFixed(1)}%)`,
    );

    return scoredPapers;
  }

  /**
   * Get the overall Theme-Fit score for a paper (convenience method)
   *
   * @param paper - Paper to score
   * @returns Overall Theme-Fit score (0-1)
   */
  getOverallThemeFitScore(paper: Paper): number {
    return this.calculateThemeFitScore(paper).overallThemeFit;
  }

  /**
   * Calculate Theme-Fit scores with actual Citation Controversy Index data
   * Integrates Week 4 CCI scores for more accurate citation controversy component
   *
   * @param papers - Papers to score
   * @param cciMap - Map of paper IDs to CCI data from CitationControversyService
   * @returns Papers with enhanced Theme-Fit scores
   */
  calculateThemeFitScoresWithCCI<T extends Paper>(
    papers: T[],
    cciMap: Map<string, CitationControversyIndex>,
  ): (T & PaperWithThemeFit)[] {
    if (!papers || papers.length === 0) {
      this.logger.warn('⚠️  [ThemeFit+CCI] Batch scoring called with empty array');
      return [];
    }

    const startTime = Date.now();

    const scoredPapers = papers.map((paper): T & PaperWithThemeFit => {
      const text = this.extractAnalyzableText(paper);

      // Calculate base components
      const controversyResult = this.calculateControversyPotential(text);
      const statementResult = this.calculateStatementClarity(text);
      const perspectiveResult = this.calculatePerspectiveDiversity(text);

      // Get CCI-enhanced citation controversy score
      const cci = cciMap.get(paper.id);
      const citationResult = this.calculateCitationControversyWithCCI(text, paper, cci);

      // Calculate weighted overall score
      const overallThemeFit =
        controversyResult.score * this.weights.controversyPotential +
        statementResult.score * this.weights.statementClarity +
        perspectiveResult.score * this.weights.perspectiveDiversity +
        citationResult.score * this.weights.citationControversy;

      // Generate explanation with CCI integration note
      const explanation = this.generateExplanationWithCCI(
        controversyResult,
        statementResult,
        perspectiveResult,
        citationResult,
        overallThemeFit,
        cci,
      );

      return {
        ...paper,
        themeFitScore: {
          controversyPotential: controversyResult.score,
          statementClarity: statementResult.score,
          perspectiveDiversity: perspectiveResult.score,
          citationControversy: citationResult.score,
          overallThemeFit,
          explanation,
        },
      };
    });

    const duration = Date.now() - startTime;
    const totalScore = scoredPapers.reduce(
      (sum, p) => sum + (p.themeFitScore?.overallThemeFit ?? 0),
      0,
    );
    const avgScore = scoredPapers.length > 0 ? totalScore / scoredPapers.length : 0;

    this.logger.log(
      `✅ [ThemeFit+CCI] Batch scored ${papers.length} papers with CCI in ${duration}ms ` +
      `(avg score: ${(avgScore * 100).toFixed(1)}%, CCI available: ${cciMap.size})`,
    );

    return scoredPapers;
  }

  /**
   * Calculate citation controversy score enhanced with actual CCI data
   * Falls back to text-based analysis if CCI not available
   *
   * @param text - Text to analyze
   * @param paper - Paper with potential citation data
   * @param cci - Citation Controversy Index from Week 4 (optional)
   * @returns Enhanced pattern match result
   */
  private calculateCitationControversyWithCCI(
    text: string,
    paper: Paper,
    cci?: CitationControversyIndex,
  ): PatternMatchResult {
    // If CCI is available, use it as the primary signal
    if (cci) {
      // Blend CCI score with text patterns for robustness
      const textResult = this.calculatePatternScore(
        text,
        CITATION_CONTROVERSY_PATTERNS,
        SATURATION_POINTS.CITATION,
      );

      // CCI-weighted blend: using named constants
      const blendedScore = cci.score * CCI_BLEND_WEIGHTS.CCI_SCORE_WEIGHT + textResult.score * CCI_BLEND_WEIGHTS.TEXT_PATTERN_WEIGHT;

      return {
        score: Math.min(1, blendedScore),
        matchCount: textResult.matchCount,
        patterns: textResult.patterns,
      };
    }

    // Fall back to original text-based calculation
    return this.calculateCitationControversy(text, paper);
  }

  /**
   * Generate explanation that includes CCI integration information
   */
  private generateExplanationWithCCI(
    controversy: PatternMatchResult,
    statement: PatternMatchResult,
    perspective: PatternMatchResult,
    citation: PatternMatchResult,
    overall: number,
    cci?: CitationControversyIndex,
  ): string {
    const parts: string[] = [];

    parts.push(`ThemeFit=${(overall * 100).toFixed(0)}%`);

    if (controversy.matchCount > 0) {
      parts.push(`Controversy=${(controversy.score * 100).toFixed(0)}%(${controversy.matchCount})`);
    }

    if (statement.matchCount > 0) {
      parts.push(`Statements=${(statement.score * 100).toFixed(0)}%(${statement.matchCount})`);
    }

    if (perspective.matchCount > 0) {
      parts.push(`Perspectives=${(perspective.score * 100).toFixed(0)}%(${perspective.matchCount})`);
    }

    // Enhanced citation info with CCI
    if (cci) {
      parts.push(
        `CitationCCI=${(cci.score * 100).toFixed(0)}%(${cci.classification})`
      );
      if (cci.isDebatePaper) {
        parts.push('🎯DebatePaper');
      }
    } else if (citation.matchCount > 0) {
      parts.push(`CitationDebate=${(citation.score * 100).toFixed(0)}%(${citation.matchCount})`);
    }

    return parts.join(', ');
  }

  /**
   * Check if a paper is "Good for Thematization"
   * Threshold defined by GOOD_THEMATIZATION_THRESHOLD constant
   *
   * @param paper - Paper to check
   * @returns Boolean indicating thematization suitability
   */
  isGoodForThematization(paper: Paper): boolean {
    const score = this.getOverallThemeFitScore(paper);
    return score >= GOOD_THEMATIZATION_THRESHOLD;
  }

  /**
   * Get thematization tier label for UI display
   * Uses THEMATIZATION_TIERS constant for maintainability
   *
   * @param score - Theme-Fit score (0-1)
   * @returns Tier label
   */
  getThematizationTier(score: number): string {
    for (const tier of THEMATIZATION_TIERS) {
      if (score >= tier.threshold) {
        return tier.label;
      }
    }
    // Fallback (should never reach due to 0.00 threshold)
    return THEMATIZATION_TIERS[THEMATIZATION_TIERS.length - 1].label;
  }

  /**
   * Extract analyzable text from paper
   * Combines title, abstract, and keywords for comprehensive analysis
   *
   * @param paper - Paper to extract text from
   * @returns Combined analyzable text
   */
  private extractAnalyzableText(paper: Paper): string {
    const parts: string[] = [];

    if (paper.title) {
      parts.push(paper.title);
    }

    if (paper.abstract) {
      parts.push(paper.abstract);
    }

    if (paper.keywords && paper.keywords.length > 0) {
      parts.push(paper.keywords.join(' '));
    }

    return parts.join(' ');
  }

  /**
   * Calculate controversy potential score
   * Detects opposing views and debate markers in text
   *
   * @param text - Text to analyze
   * @returns Pattern match result with score
   */
  private calculateControversyPotential(text: string): PatternMatchResult {
    return this.calculatePatternScore(text, CONTROVERSY_PATTERNS, SATURATION_POINTS.CONTROVERSY);
  }

  /**
   * Calculate statement clarity score
   * Identifies clear positions suitable for Q-sort statements
   *
   * @param text - Text to analyze
   * @returns Pattern match result with score
   */
  private calculateStatementClarity(text: string): PatternMatchResult {
    return this.calculatePatternScore(text, STATEMENT_PATTERNS, SATURATION_POINTS.STATEMENT);
  }

  /**
   * Calculate perspective diversity score
   * Detects multiple viewpoints in text
   *
   * @param text - Text to analyze
   * @returns Pattern match result with score
   */
  private calculatePerspectiveDiversity(text: string): PatternMatchResult {
    return this.calculatePatternScore(text, PERSPECTIVE_PATTERNS, SATURATION_POINTS.PERSPECTIVE);
  }

  /**
   * Calculate citation controversy score
   * Combines text patterns with actual citation data if available
   *
   * @param text - Text to analyze
   * @param paper - Paper with potential citation data
   * @returns Pattern match result with score
   */
  private calculateCitationControversy(text: string, paper: Paper): PatternMatchResult {
    const textResult = this.calculatePatternScore(
      text,
      CITATION_CONTROVERSY_PATTERNS,
      SATURATION_POINTS.CITATION,
    );

    // Boost score if paper has high citation count (indicates academic interest)
    let citationBoost = 0;
    if (paper.citationCount !== undefined && paper.citationCount !== null) {
      // Papers with high citations often have controversial or foundational content
      citationBoost = Math.min(
        paper.citationCount / CITATION_BOOST_CONFIG.CITATION_COUNT_DIVISOR,
        CITATION_BOOST_CONFIG.MAX_CITATION_BOOST,
      );
    }

    // Calculate citations per year if available (controversial papers often get cited more rapidly)
    let velocityBoost = 0;
    if (paper.citationCount && paper.year) {
      // OPTIMIZED: Use cached currentYear instead of new Date() per paper
      const age = Math.max(1, this.currentYear - paper.year);
      const citationsPerYear = paper.citationCount / age;

      // Find the highest matching velocity threshold
      for (const threshold of CITATION_BOOST_CONFIG.VELOCITY_THRESHOLDS) {
        if (citationsPerYear >= threshold.minCitationsPerYear) {
          velocityBoost = threshold.boost;
          break;
        }
      }
    }

    // Combine text patterns with citation data
    const combinedScore = Math.min(
      textResult.score + citationBoost + velocityBoost,
      1.0,
    );

    return {
      score: combinedScore,
      matchCount: textResult.matchCount,
      patterns: textResult.patterns,
    };
  }

  /**
   * Generic pattern matching score calculator
   * Counts pattern matches and normalizes to 0-1 score
   *
   * @param text - Text to search
   * @param patterns - Regex patterns to match
   * @param saturationPoint - Number of matches for max score
   * @returns Pattern match result
   */
  private calculatePatternScore(
    text: string,
    patterns: readonly RegExp[],
    saturationPoint: number,
  ): PatternMatchResult {
    if (!text || text.length === 0) {
      return { score: 0, matchCount: 0, patterns: [] };
    }

    const matchedPatterns: string[] = [];
    let matchCount = 0;

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matchCount += matches.length;
        matchedPatterns.push(pattern.source);
      }
    }

    // Normalize score with saturation (diminishing returns after saturationPoint matches)
    // Using logarithmic scaling: score = log(1 + matches) / log(1 + saturation)
    const score = Math.min(
      Math.log(1 + matchCount) / Math.log(1 + saturationPoint),
      1.0
    );

    return {
      score,
      matchCount,
      patterns: matchedPatterns,
    };
  }

  /**
   * Generate human-readable explanation of Theme-Fit score
   *
   * @param controversy - Controversy potential result
   * @param statement - Statement clarity result
   * @param perspective - Perspective diversity result
   * @param citation - Citation controversy result
   * @param overall - Overall score
   * @returns Explanation string
   */
  private generateExplanation(
    controversy: PatternMatchResult,
    statement: PatternMatchResult,
    perspective: PatternMatchResult,
    citation: PatternMatchResult,
    overall: number,
  ): string {
    const parts: string[] = [];

    parts.push(`ThemeFit=${(overall * 100).toFixed(0)}%`);

    if (controversy.matchCount > 0) {
      parts.push(`Controversy=${(controversy.score * 100).toFixed(0)}%(${controversy.matchCount})`);
    }

    if (statement.matchCount > 0) {
      parts.push(`Statements=${(statement.score * 100).toFixed(0)}%(${statement.matchCount})`);
    }

    if (perspective.matchCount > 0) {
      parts.push(`Perspectives=${(perspective.score * 100).toFixed(0)}%(${perspective.matchCount})`);
    }

    if (citation.matchCount > 0) {
      parts.push(`CitationDebate=${(citation.score * 100).toFixed(0)}%(${citation.matchCount})`);
    }

    return parts.join(', ');
  }
}
