/**
 * Phase 10.113 Week 7: Thematization Query Service
 *
 * Netflix-grade AI query optimization specifically for thematization workflows.
 * Extends the general query expansion with thematization-specific features.
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * 1. Controversy Expansion - Suggest opposing terms to surface debates
 * 2. Methodology Terms - Auto-include Q-method, thematic analysis keywords
 * 3. Query Broadness Detection - Detect queries too broad for quality themes
 * 4. Thematization Suggestions - Domain-specific search suggestions
 * 5. Perspective Balance - Ensure queries surface multiple viewpoints
 *
 * ============================================================================
 * INTEGRATION
 * ============================================================================
 *
 * ThematizationQueryService
 *         ↓ uses
 * QueryExpansionService (AI module)
 *         ↓ produces
 * ThematizationExpandedQuery
 *         ↓ consumed by
 * Search Pipeline / Frontend
 *
 * @module ThematizationQueryService
 * @since Phase 10.113 Week 7
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing)
// ============================================================================

/**
 * Controversy expansion for surfacing debates
 */
export interface ControversyExpansion {
  readonly opposingTerms: readonly string[];
  readonly debateIndicators: readonly string[];
  readonly polarizingKeywords: readonly string[];
  readonly controversyScore: number;
}

/**
 * Methodology-specific terms for thematization
 */
export interface MethodologyTerms {
  readonly qMethodTerms: readonly string[];
  readonly thematicAnalysisTerms: readonly string[];
  readonly qualitativeTerms: readonly string[];
  readonly researchDesignTerms: readonly string[];
}

/**
 * Query broadness assessment
 */
export interface QueryBroadnessAssessment {
  readonly isTooBroad: boolean;
  readonly broadnessScore: number;
  readonly reasons: readonly string[];
  readonly narrowingSuggestions: readonly string[];
  readonly estimatedPaperCount: 'too_few' | 'optimal' | 'too_many';
}

/**
 * Thematization-specific query suggestions
 */
export interface ThematizationSuggestion {
  readonly query: string;
  readonly reason: string;
  readonly expectedControversy: number;
  readonly expectedThemeRichness: number;
  readonly category: 'narrowing' | 'controversy' | 'methodology' | 'related';
}

/**
 * Thematization-optimized expanded query
 */
export interface ThematizationExpandedQuery {
  readonly originalQuery: string;
  readonly expandedQuery: string;
  readonly controversyExpansion: ControversyExpansion;
  readonly methodologyTerms: MethodologyTerms;
  readonly broadnessAssessment: QueryBroadnessAssessment;
  readonly suggestions: readonly ThematizationSuggestion[];
  readonly warnings: readonly string[];
  readonly confidence: number;
  readonly recommendedTier: 50 | 100 | 150 | 200 | 250 | 300;
}

// ============================================================================
// CONSTANTS (Named Constants - No Magic Numbers)
// ============================================================================

/**
 * Controversy indicator patterns (regex-safe)
 */
const CONTROVERSY_INDICATORS: readonly string[] = [
  'debate',
  'controversy',
  'disputed',
  'contested',
  'opposing',
  'conflicting',
  'disagreement',
  'criticism',
  'critique',
  'challenge',
  'counter',
  'versus',
  'vs',
  'alternative',
  'competing',
  'tension',
  'paradox',
  'contradiction',
  'skeptic',
  'proponent',
  'advocate',
  'critic',
] as const;

/**
 * Opposing term pairs for controversy expansion
 */
const OPPOSING_TERM_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['support', 'oppose'],
  ['benefit', 'harm'],
  ['effective', 'ineffective'],
  ['positive', 'negative'],
  ['advantage', 'disadvantage'],
  ['pro', 'con'],
  ['success', 'failure'],
  ['improve', 'worsen'],
  ['increase', 'decrease'],
  ['strengthen', 'weaken'],
  ['accept', 'reject'],
  ['confirm', 'refute'],
  ['validate', 'invalidate'],
  ['traditional', 'modern'],
  ['quantitative', 'qualitative'],
] as const;

/**
 * Q-methodology specific terms
 */
const Q_METHOD_TERMS: readonly string[] = [
  'Q-methodology',
  'Q-sort',
  'Q-method',
  'Q-factor analysis',
  'concourse',
  'Q-sample',
  'P-set',
  'factor rotation',
  'subjectivity',
  'operant subjectivity',
  'viewpoint',
  'perspective',
  'discourse',
] as const;

/**
 * Thematic analysis terms
 */
const THEMATIC_ANALYSIS_TERMS: readonly string[] = [
  'thematic analysis',
  'theme extraction',
  'coding',
  'theme identification',
  'qualitative analysis',
  'content analysis',
  'grounded theory',
  'phenomenology',
  'narrative analysis',
  'discourse analysis',
  'Braun Clarke',
  'reflexive thematic analysis',
] as const;

/**
 * Qualitative research terms
 */
const QUALITATIVE_TERMS: readonly string[] = [
  'qualitative research',
  'qualitative study',
  'qualitative methods',
  'interview',
  'focus group',
  'case study',
  'ethnography',
  'participant observation',
  'interpretive',
  'constructivist',
  'phenomenological',
] as const;

/**
 * Research design terms
 */
const RESEARCH_DESIGN_TERMS: readonly string[] = [
  'research design',
  'methodology',
  'mixed methods',
  'triangulation',
  'validity',
  'reliability',
  'sampling',
  'data collection',
  'data analysis',
  'theoretical framework',
  'conceptual framework',
] as const;

/**
 * Broadness indicators - single words that are too vague
 */
const BROADNESS_SINGLE_WORDS: readonly string[] = [
  'climate',
  'health',
  'education',
  'technology',
  'society',
  'culture',
  'politics',
  'economy',
  'environment',
  'psychology',
  'business',
  'management',
  'science',
  'research',
  'study',
  'analysis',
] as const;

/**
 * Minimum query length for quality thematization
 */
const MIN_QUERY_LENGTH = 3;

/**
 * Maximum broadness score before warning
 */
const MAX_BROADNESS_SCORE = 0.7;

/**
 * Tier recommendations based on topic complexity
 */
const TIER_RECOMMENDATIONS: ReadonlyArray<{
  readonly minComplexity: number;
  readonly tier: 50 | 100 | 150 | 200 | 250 | 300;
}> = [
  { minComplexity: 0.9, tier: 300 },
  { minComplexity: 0.75, tier: 250 },
  { minComplexity: 0.6, tier: 200 },
  { minComplexity: 0.45, tier: 150 },
  { minComplexity: 0.3, tier: 100 },
  { minComplexity: 0, tier: 50 },
] as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationQueryService {
  private readonly logger = new Logger(ThematizationQueryService.name);

  /**
   * Cache for expanded queries (LRU-style)
   */
  private readonly cache = new Map<string, {
    readonly result: ThematizationExpandedQuery;
    readonly timestamp: number;
  }>();

  /**
   * Cache TTL in milliseconds (30 minutes)
   */
  private readonly CACHE_TTL_MS = 30 * 60 * 1000;

  /**
   * Maximum cache entries
   */
  private readonly MAX_CACHE_ENTRIES = 200;

  constructor() {
    this.logger.log('✅ [ThematizationQuery] Service initialized');
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Expand query with thematization-specific optimizations
   *
   * @param query - Original search query
   * @param options - Expansion options
   * @returns Thematization-optimized expanded query
   */
  expandForThematization(
    query: string,
    options?: {
      readonly includeControversy?: boolean;
      readonly includeMethodology?: boolean;
      readonly targetTier?: 50 | 100 | 150 | 200 | 250 | 300;
    },
  ): ThematizationExpandedQuery {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${normalizedQuery}:${JSON.stringify(options ?? {})}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.debug(`📦 [Cache] HIT for query: ${query.substring(0, 30)}...`);
      return cached.result;
    }

    this.logger.log(`🔍 [ThematizationQuery] Expanding: "${query}"`);

    // Analyze query
    const broadnessAssessment = this.assessQueryBroadness(normalizedQuery);
    const controversyExpansion = this.expandForControversy(normalizedQuery);
    const methodologyTerms = this.getMethodologyTerms(normalizedQuery);

    // Build expanded query
    const expandedQuery = this.buildExpandedQuery(
      query,
      controversyExpansion,
      methodologyTerms,
      options,
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      normalizedQuery,
      broadnessAssessment,
      controversyExpansion,
    );

    // Collect warnings
    const warnings = this.collectWarnings(broadnessAssessment, normalizedQuery);

    // Calculate confidence
    const confidence = this.calculateConfidence(broadnessAssessment, controversyExpansion);

    // Recommend tier
    const recommendedTier = this.recommendTier(
      broadnessAssessment,
      controversyExpansion,
      options?.targetTier,
    );

    const result: ThematizationExpandedQuery = {
      originalQuery: query,
      expandedQuery,
      controversyExpansion,
      methodologyTerms,
      broadnessAssessment,
      suggestions,
      warnings,
      confidence,
      recommendedTier,
    };

    // Cache result
    this.cacheResult(cacheKey, result);

    this.logger.log(
      `✅ [ThematizationQuery] Expanded: "${expandedQuery.substring(0, 50)}..." ` +
      `(confidence: ${confidence.toFixed(2)}, tier: ${recommendedTier})`,
    );

    return result;
  }

  /**
   * Get controversy expansion terms for a topic
   */
  getControversyTerms(topic: string): ControversyExpansion {
    return this.expandForControversy(topic.toLowerCase().trim());
  }

  /**
   * Check if query is suitable for thematization
   */
  isQuerySuitableForThematization(query: string): {
    readonly suitable: boolean;
    readonly score: number;
    readonly issues: readonly string[];
    readonly suggestions: readonly string[];
  } {
    const normalizedQuery = query.trim().toLowerCase();
    const broadness = this.assessQueryBroadness(normalizedQuery);
    const controversy = this.expandForControversy(normalizedQuery);

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check length
    if (normalizedQuery.split(/\s+/).length < MIN_QUERY_LENGTH) {
      issues.push('Query is too short for quality thematization');
      suggestions.push('Add more specific terms or context');
    }

    // Check broadness
    if (broadness.isTooBroad) {
      issues.push('Query is too broad - themes may be unfocused');
      suggestions.push(...broadness.narrowingSuggestions);
    }

    // Check controversy potential
    if (controversy.controversyScore < 0.3) {
      issues.push('Low controversy potential - may produce homogeneous themes');
      suggestions.push('Consider adding debate-related terms or opposing viewpoints');
    }

    const score = this.calculateSuitabilityScore(broadness, controversy, normalizedQuery);
    const suitable = score >= 0.5 && issues.length <= 1;

    return { suitable, score, issues, suggestions };
  }

  /**
   * Get methodology terms relevant to a query
   */
  getRelevantMethodologyTerms(query: string): MethodologyTerms {
    return this.getMethodologyTerms(query.toLowerCase().trim());
  }

  // ==========================================================================
  // CONTROVERSY EXPANSION
  // ==========================================================================

  /**
   * Expand query for controversy surfacing
   */
  private expandForControversy(query: string): ControversyExpansion {
    const words = query.split(/\s+/);

    // Find opposing terms
    const opposingTerms: string[] = [];
    for (const word of words) {
      for (const [term1, term2] of OPPOSING_TERM_PAIRS) {
        if (word.includes(term1)) {
          opposingTerms.push(term2);
        } else if (word.includes(term2)) {
          opposingTerms.push(term1);
        }
      }
    }

    // Find debate indicators present in query
    const debateIndicators = CONTROVERSY_INDICATORS.filter(indicator =>
      query.includes(indicator),
    );

    // Generate polarizing keywords
    const polarizingKeywords = this.generatePolarizingKeywords(query);

    // Calculate controversy score
    const controversyScore = this.calculateControversyScore(
      query,
      opposingTerms,
      debateIndicators,
    );

    return {
      opposingTerms: [...new Set(opposingTerms)],
      debateIndicators,
      polarizingKeywords,
      controversyScore,
    };
  }

  /**
   * Generate polarizing keywords for a topic
   */
  private generatePolarizingKeywords(query: string): readonly string[] {
    const keywords: string[] = [];

    // Add general debate terms
    keywords.push(`${query} debate`);
    keywords.push(`${query} controversy`);
    keywords.push(`${query} criticism`);
    keywords.push(`${query} critique`);
    keywords.push(`${query} opposing views`);
    keywords.push(`${query} supporters vs critics`);

    // Add perspective markers
    keywords.push(`pro ${query}`);
    keywords.push(`anti ${query}`);
    keywords.push(`against ${query}`);
    keywords.push(`for ${query}`);

    return keywords;
  }

  /**
   * Calculate controversy score
   */
  private calculateControversyScore(
    query: string,
    opposingTerms: readonly string[],
    debateIndicators: readonly string[],
  ): number {
    let score = 0;

    // Base score from debate indicators
    score += Math.min(debateIndicators.length * 0.15, 0.4);

    // Score from opposing terms found
    score += Math.min(opposingTerms.length * 0.1, 0.3);

    // Check for inherently controversial topics
    const controversialTopics = [
      'climate change',
      'gun control',
      'abortion',
      'immigration',
      'vaccine',
      'artificial intelligence ethics',
      'genetic engineering',
      'nuclear energy',
      'privacy',
      'surveillance',
    ];

    for (const topic of controversialTopics) {
      if (query.includes(topic)) {
        score += 0.2;
        break;
      }
    }

    // Check for comparative/evaluative language
    const comparativePatterns = [
      /better|worse/,
      /more|less/,
      /should|must/,
      /vs|versus/,
      /compared to/,
      /effective|ineffective/,
    ];

    for (const pattern of comparativePatterns) {
      if (pattern.test(query)) {
        score += 0.05;
      }
    }

    return Math.min(score, 1);
  }

  // ==========================================================================
  // METHODOLOGY TERMS
  // ==========================================================================

  /**
   * Get methodology-specific terms relevant to query
   */
  private getMethodologyTerms(query: string): MethodologyTerms {
    // Determine relevance of each methodology category
    const qMethodRelevance = this.calculateMethodologyRelevance(query, Q_METHOD_TERMS);
    const thematicRelevance = this.calculateMethodologyRelevance(query, THEMATIC_ANALYSIS_TERMS);
    const qualitativeRelevance = this.calculateMethodologyRelevance(query, QUALITATIVE_TERMS);
    const designRelevance = this.calculateMethodologyRelevance(query, RESEARCH_DESIGN_TERMS);

    return {
      qMethodTerms: qMethodRelevance > 0.3 ? Q_METHOD_TERMS : Q_METHOD_TERMS.slice(0, 5),
      thematicAnalysisTerms: thematicRelevance > 0.3 ? THEMATIC_ANALYSIS_TERMS : THEMATIC_ANALYSIS_TERMS.slice(0, 5),
      qualitativeTerms: qualitativeRelevance > 0.3 ? QUALITATIVE_TERMS : QUALITATIVE_TERMS.slice(0, 5),
      researchDesignTerms: designRelevance > 0.3 ? RESEARCH_DESIGN_TERMS : RESEARCH_DESIGN_TERMS.slice(0, 5),
    };
  }

  /**
   * Calculate relevance of methodology terms to query
   */
  private calculateMethodologyRelevance(
    query: string,
    terms: readonly string[],
  ): number {
    let matchCount = 0;
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        matchCount++;
      }
    }
    return matchCount / terms.length;
  }

  // ==========================================================================
  // BROADNESS ASSESSMENT
  // ==========================================================================

  /**
   * Assess how broad/vague a query is
   */
  private assessQueryBroadness(query: string): QueryBroadnessAssessment {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const reasons: string[] = [];
    let broadnessScore = 0;

    // Check if single word
    if (words.length === 1) {
      broadnessScore += 0.4;
      reasons.push('Single-word queries are too broad');
    }

    // Check if common broad term
    const broadWords = words.filter(w => BROADNESS_SINGLE_WORDS.includes(w));
    if (broadWords.length > 0) {
      broadnessScore += broadWords.length * 0.15;
      reasons.push(`Broad terms detected: ${broadWords.join(', ')}`);
    }

    // Check word count
    if (words.length < 3) {
      broadnessScore += 0.2;
      reasons.push('Query has few terms');
    }

    // Check for specificity indicators
    const specificityIndicators = [
      /\d{4}/, // Year
      /specific|particular|case study/,
      /\w+[-']\w+/, // Hyphenated terms
      /[A-Z]{2,}/, // Acronyms
    ];

    let specificityCount = 0;
    for (const pattern of specificityIndicators) {
      if (pattern.test(query)) {
        specificityCount++;
      }
    }

    if (specificityCount > 0) {
      broadnessScore -= specificityCount * 0.1;
    }

    // Clamp score
    broadnessScore = Math.max(0, Math.min(1, broadnessScore));

    // Generate narrowing suggestions
    const narrowingSuggestions = this.generateNarrowingSuggestions(query, words);

    // Estimate paper count category
    const estimatedPaperCount = this.estimatePaperCountCategory(broadnessScore);

    return {
      isTooBroad: broadnessScore > MAX_BROADNESS_SCORE,
      broadnessScore,
      reasons,
      narrowingSuggestions,
      estimatedPaperCount,
    };
  }

  /**
   * Generate narrowing suggestions for broad query
   */
  private generateNarrowingSuggestions(
    query: string,
    words: readonly string[],
  ): readonly string[] {
    const suggestions: string[] = [];

    // Add methodology specifiers
    suggestions.push(`${query} qualitative research`);
    suggestions.push(`${query} case study`);
    suggestions.push(`${query} systematic review`);

    // Add temporal specifiers
    suggestions.push(`${query} recent research 2020-2024`);

    // Add geographic specifiers
    suggestions.push(`${query} in [specific country/region]`);

    // Add domain specifiers
    if (words.length === 1) {
      suggestions.push(`${query} in education`);
      suggestions.push(`${query} in healthcare`);
      suggestions.push(`${query} policy implications`);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Estimate paper count category based on broadness
   */
  private estimatePaperCountCategory(
    broadnessScore: number,
  ): 'too_few' | 'optimal' | 'too_many' {
    if (broadnessScore > 0.8) {
      return 'too_many';
    }
    if (broadnessScore < 0.2) {
      return 'too_few';
    }
    return 'optimal';
  }

  // ==========================================================================
  // QUERY BUILDING
  // ==========================================================================

  /**
   * Build expanded query string
   */
  private buildExpandedQuery(
    originalQuery: string,
    controversy: ControversyExpansion,
    methodology: MethodologyTerms,
    options?: {
      readonly includeControversy?: boolean;
      readonly includeMethodology?: boolean;
    },
  ): string {
    const parts: string[] = [originalQuery];

    // Add controversy terms if requested
    if (options?.includeControversy !== false && controversy.controversyScore < 0.5) {
      // Only add if query doesn't already have controversy terms
      if (controversy.polarizingKeywords.length > 0) {
        parts.push(`OR "${controversy.polarizingKeywords[0]}"`);
      }
    }

    // Add methodology terms if requested
    if (options?.includeMethodology !== false) {
      const methodTerms = [
        ...methodology.qMethodTerms.slice(0, 2),
        ...methodology.thematicAnalysisTerms.slice(0, 2),
      ];

      if (methodTerms.length > 0) {
        parts.push(`AND (${methodTerms.slice(0, 3).join(' OR ')})`);
      }
    }

    return parts.join(' ');
  }

  // ==========================================================================
  // SUGGESTIONS
  // ==========================================================================

  /**
   * Generate thematization suggestions
   */
  private generateSuggestions(
    query: string,
    broadness: QueryBroadnessAssessment,
    controversy: ControversyExpansion,
  ): readonly ThematizationSuggestion[] {
    const suggestions: ThematizationSuggestion[] = [];

    // Add narrowing suggestions if too broad
    if (broadness.isTooBroad) {
      for (const narrowed of broadness.narrowingSuggestions.slice(0, 2)) {
        suggestions.push({
          query: narrowed,
          reason: 'More focused query for better theme quality',
          expectedControversy: controversy.controversyScore,
          expectedThemeRichness: 0.7,
          category: 'narrowing',
        });
      }
    }

    // Add controversy suggestions
    if (controversy.controversyScore < 0.5) {
      suggestions.push({
        query: `${query} debate perspectives`,
        reason: 'Add controversy terms to surface opposing viewpoints',
        expectedControversy: Math.min(controversy.controversyScore + 0.3, 1),
        expectedThemeRichness: 0.8,
        category: 'controversy',
      });
    }

    // Add methodology suggestions
    suggestions.push({
      query: `${query} Q-methodology qualitative`,
      reason: 'Include Q-method terms for relevant methodology papers',
      expectedControversy: controversy.controversyScore,
      expectedThemeRichness: 0.75,
      category: 'methodology',
    });

    // Add related suggestions
    suggestions.push({
      query: `${query} thematic analysis themes`,
      reason: 'Find papers with explicit thematic analysis',
      expectedControversy: controversy.controversyScore,
      expectedThemeRichness: 0.85,
      category: 'related',
    });

    return suggestions;
  }

  // ==========================================================================
  // WARNINGS & CONFIDENCE
  // ==========================================================================

  /**
   * Collect warnings for the query
   */
  private collectWarnings(
    broadness: QueryBroadnessAssessment,
    query: string,
  ): readonly string[] {
    const warnings: string[] = [];

    if (broadness.isTooBroad) {
      warnings.push(
        'Query may be too broad for focused thematization. ' +
        'Consider narrowing to get more coherent themes.',
      );
    }

    if (query.length < 10) {
      warnings.push(
        'Short queries may not surface enough diverse papers. ' +
        'Consider adding more context.',
      );
    }

    if (broadness.estimatedPaperCount === 'too_few') {
      warnings.push(
        'This query may return too few papers for meaningful thematization. ' +
        'Consider broadening slightly.',
      );
    }

    if (broadness.estimatedPaperCount === 'too_many') {
      warnings.push(
        'This query may return too many papers. ' +
        'Higher tiers (200-300) recommended for comprehensive analysis.',
      );
    }

    return warnings;
  }

  /**
   * Calculate confidence in the expansion
   */
  private calculateConfidence(
    broadness: QueryBroadnessAssessment,
    controversy: ControversyExpansion,
  ): number {
    let confidence = 0.7; // Base confidence

    // Reduce for broadness
    confidence -= broadness.broadnessScore * 0.3;

    // Increase for controversy (debates = richer themes)
    confidence += controversy.controversyScore * 0.2;

    // Clamp
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Calculate suitability score
   */
  private calculateSuitabilityScore(
    broadness: QueryBroadnessAssessment,
    controversy: ControversyExpansion,
    query: string,
  ): number {
    let score = 0.5;

    // Penalize for broadness
    score -= broadness.broadnessScore * 0.3;

    // Reward controversy potential
    score += controversy.controversyScore * 0.25;

    // Reward longer queries
    const wordCount = query.split(/\s+/).length;
    if (wordCount >= 3 && wordCount <= 10) {
      score += 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  // ==========================================================================
  // TIER RECOMMENDATION
  // ==========================================================================

  /**
   * Recommend optimal tier based on query analysis
   */
  private recommendTier(
    broadness: QueryBroadnessAssessment,
    controversy: ControversyExpansion,
    targetTier?: 50 | 100 | 150 | 200 | 250 | 300,
  ): 50 | 100 | 150 | 200 | 250 | 300 {
    // If target tier specified, use it
    if (targetTier !== undefined) {
      return targetTier;
    }

    // Calculate complexity score
    const complexity =
      (1 - broadness.broadnessScore) * 0.4 +
      controversy.controversyScore * 0.4 +
      0.2; // Base complexity

    // Find appropriate tier
    for (const rec of TIER_RECOMMENDATIONS) {
      if (complexity >= rec.minComplexity) {
        return rec.tier;
      }
    }

    return 100; // Default
  }

  // ==========================================================================
  // CACHING
  // ==========================================================================

  /**
   * Cache result with LRU eviction
   */
  private cacheResult(key: string, result: ThematizationExpandedQuery): void {
    // LRU eviction
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    readonly size: number;
    readonly maxSize: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_ENTRIES,
    };
  }
}
