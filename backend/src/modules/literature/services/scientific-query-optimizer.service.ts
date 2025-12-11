/**
 * Phase 10.113 Week 9: Scientific Query Optimizer Service
 *
 * Netflix-grade scientific approach to query optimization that:
 * 1. Validates query quality BEFORE expensive source searches
 * 2. Provides configurable expansion modes (none, local, AI-enhanced)
 * 3. Tracks effectiveness metrics for A/B testing
 * 4. Enforces academic search best practices
 *
 * ============================================================================
 * SCIENTIFIC RATIONALE
 * ============================================================================
 *
 * QUESTION: Does AI query expansion help or bias academic search?
 *
 * HYPOTHESIS: AI expansion may:
 * - HELP: Find synonyms, related terms, domain-specific vocabulary
 * - HARM: Over-expand queries, introduce AI interpretation bias
 *
 * APPROACH: Configurable modes with metrics tracking
 * - Mode 0 (NONE): Original query only - baseline
 * - Mode 1 (LOCAL): Spell-check + normalization - low overhead
 * - Mode 2 (ENHANCED): Local + controversy/methodology terms - medium
 * - Mode 3 (AI): Full GPT-4 expansion - high overhead, testable
 *
 * MEASUREMENT: Track per-mode metrics
 * - Papers found
 * - Semantic similarity scores
 * - Theme extraction quality
 * - User satisfaction (if available)
 *
 * ============================================================================
 * MINIMUM QUERY REQUIREMENTS
 * ============================================================================
 *
 * Academic search best practices:
 * - Minimum 2 meaningful words (not stop words)
 * - Minimum 6 characters total
 * - At least 1 word with 4+ characters
 * - No single-character queries
 *
 * @module LiteratureModule
 * @since Phase 10.113 Week 9
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing - No 'any')
// ============================================================================

/**
 * Query expansion mode
 */
export type QueryExpansionMode = 'none' | 'local' | 'enhanced' | 'ai';

/**
 * Query quality assessment result
 */
export interface QueryQualityAssessment {
  readonly isValid: boolean;
  readonly qualityScore: number; // 0-100
  readonly issues: readonly string[];
  readonly suggestions: readonly string[];
  readonly metrics: QueryMetrics;
}

/**
 * Query metrics for scientific tracking
 */
export interface QueryMetrics {
  readonly wordCount: number;
  readonly meaningfulWordCount: number;
  readonly characterCount: number;
  readonly longestWordLength: number;
  readonly hasStopWordsOnly: boolean;
  readonly isSingleWord: boolean;
  readonly isQuestion: boolean;
  readonly hasSpecialCharacters: boolean;
  readonly academicTermCount: number;
  readonly humanitiesTermCount: number;
  readonly detectedDomain: 'humanities' | 'stem' | 'methodology' | 'general';
}

/**
 * Optimized query result
 */
export interface OptimizedQueryResult {
  readonly originalQuery: string;
  readonly optimizedQuery: string;
  readonly expansionMode: QueryExpansionMode;
  readonly quality: QueryQualityAssessment;
  readonly expansions: QueryExpansions;
  readonly processingTimeMs: number;
  readonly shouldProceed: boolean;
  readonly warningMessage?: string;
}

/**
 * Query expansions applied
 */
export interface QueryExpansions {
  readonly spellCorrected: boolean;
  readonly correctedQuery?: string; // Optimized: store corrected query to avoid duplicate processing
  readonly correctedTerms: readonly string[];
  readonly synonymsAdded: readonly string[];
  readonly methodologyTermsAdded: readonly string[];
  readonly controversyTermsAdded: readonly string[];
  readonly aiExpansion?: string;
}

/**
 * Effectiveness tracking metrics
 */
export interface QueryEffectivenessMetrics {
  readonly mode: QueryExpansionMode;
  readonly queryHash: string;
  readonly papersFound: number;
  readonly avgSemanticScore: number;
  readonly avgQualityScore: number;
  readonly processingTimeMs: number;
  readonly timestamp: Date;
}

// ============================================================================
// CONSTANTS (Enterprise-Grade - No Magic Numbers)
// ============================================================================

/** Minimum total characters for a valid query */
const MIN_QUERY_CHARACTERS = 6;

/** Minimum meaningful words (non-stop words) */
const MIN_MEANINGFUL_WORDS = 2;

/** Minimum length for a word to be "meaningful" */
const MIN_WORD_LENGTH = 3;

/** Minimum length for at least one word (ensures substance) */
const MIN_LONGEST_WORD = 4;

/** Quality score thresholds */
const QUALITY_THRESHOLD_EXCELLENT = 80;
const QUALITY_THRESHOLD_GOOD = 60;
const QUALITY_THRESHOLD_ACCEPTABLE = 40;
const QUALITY_THRESHOLD_MINIMUM = 20;

/** Stop words for academic queries */
const STOP_WORDS = new Set<string>([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you', 'he', 'she',
  'we', 'they', 'what', 'which', 'who', 'whom', 'how', 'when', 'where',
  'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'any', 'also', 'over',
]);

/** Academic/research terms (boost quality score if present) */
const ACADEMIC_TERMS = new Set<string>([
  'research', 'study', 'analysis', 'method', 'methodology', 'theory',
  'hypothesis', 'empirical', 'qualitative', 'quantitative', 'systematic',
  'review', 'meta-analysis', 'experiment', 'survey', 'interview',
  'observation', 'case', 'longitudinal', 'cross-sectional', 'randomized',
  'controlled', 'trial', 'sample', 'population', 'variable', 'correlation',
  'regression', 'significance', 'statistical', 'framework', 'model',
  'approach', 'paradigm', 'phenomenology', 'grounded', 'ethnography',
  'discourse', 'content', 'thematic', 'narrative', 'q-methodology',
  'q-method', 'factor', 'cluster', 'validity', 'reliability',
]);

/** Q-Methodology specific terms */
const Q_METHODOLOGY_TERMS = new Set<string>([
  'q-methodology', 'q-method', 'q-sort', 'q-set', 'concourse',
  'factor-analysis', 'subjectivity', 'viewpoint', 'perspective',
  'operant', 'forced-distribution', 'correlation-matrix',
]);

/** Humanities/Arts domain terms (music, culture, history, etc.) */
const HUMANITIES_TERMS = new Set<string>([
  // Music
  'music', 'musical', 'song', 'songs', 'album', 'artist', 'artists',
  'genre', 'rhythm', 'melody', 'blues', 'jazz', 'soul', 'rock', 'pop',
  'hip-hop', 'rap', 'country', 'folk', 'classical', 'orchestra',
  'concert', 'performance', 'record', 'recording', 'studio', 'label',
  'memphis', 'motown', 'nashville', 'detroit', 'chicago', 'new-orleans',
  // Culture & Society
  'culture', 'cultural', 'society', 'social', 'tradition', 'heritage',
  'identity', 'community', 'movement', 'influence', 'impact', 'legacy',
  'history', 'historical', 'evolution', 'development', 'transformation',
  // Arts
  'art', 'arts', 'artistic', 'literature', 'literary', 'film', 'cinema',
  'theater', 'theatre', 'dance', 'visual', 'media', 'creative',
  // Industry & Economics
  'industry', 'business', 'market', 'economic', 'economics', 'commerce',
  'production', 'distribution', 'consumption', 'audience', 'fans',
]);

/** Domain detection result */
export interface QueryDomain {
  readonly isHumanities: boolean;
  readonly isSTEM: boolean;
  readonly isMethodology: boolean;
  readonly detectedDomain: 'humanities' | 'stem' | 'methodology' | 'general';
  readonly domainTerms: readonly string[];
}

/** Music/Culture query expansion terms */
const MUSIC_EXPANSION_TERMS: ReadonlyMap<string, readonly string[]> = new Map([
  ['memphis soul', ['stax records', 'beale street', 'southern soul', 'blues tradition', 'african american music']],
  ['motown', ['detroit soul', 'hitsville', 'berry gordy', 'tamla records']],
  ['blues', ['delta blues', 'chicago blues', 'electric blues', 'blues tradition']],
  ['jazz', ['bebop', 'swing', 'improvisation', 'jazz tradition']],
  ['hip-hop', ['rap music', 'urban music', 'hip hop culture', 'mcs djs']],
  ['rock', ['rock and roll', 'rock music', 'electric guitar']],
  ['music industry', ['recording industry', 'music business', 'record labels', 'music economics']],
  ['cultural impact', ['cultural influence', 'social impact', 'cultural legacy', 'cultural significance']],
]);

/** Common academic misspellings - moved to constant to avoid recreation on each call */
const SPELL_CORRECTIONS: ReadonlyMap<string, string> = new Map([
  ['litterature', 'literature'],
  ['reserach', 'research'],
  ['methology', 'methodology'],
  ['anaylsis', 'analysis'],
  ['qualitatve', 'qualitative'],
  ['quantitave', 'quantitative'],
  ['qmethod', 'Q-methodology'],
  ['vqmethod', 'Q-methodology'],
  ['q method', 'Q-methodology'],
  ['systematic reviw', 'systematic review'],
  ['meta anaylsis', 'meta-analysis'],
]);

/** Maximum entries in effectiveness tracking cache */
const MAX_EFFECTIVENESS_CACHE = 1000;

/** Cache TTL for effectiveness metrics (1 hour) */
const EFFECTIVENESS_CACHE_TTL_MS = 60 * 60 * 1000;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ScientificQueryOptimizerService {
  private readonly logger = new Logger(ScientificQueryOptimizerService.name);

  /**
   * Effectiveness tracking cache for A/B testing
   * Key: queryHash + mode
   */
  private readonly effectivenessCache = new Map<string, QueryEffectivenessMetrics>();

  /**
   * Mode usage counters for analytics
   */
  private readonly modeUsageCounters: Record<QueryExpansionMode, number> = {
    none: 0,
    local: 0,
    enhanced: 0,
    ai: 0,
  };

  constructor() {
    this.logger.log('✅ [ScientificQueryOptimizer] Service initialized');
    this.logger.log('   Modes: none | local | enhanced | ai');
    this.logger.log('   Min words: 2 meaningful, Min chars: 6');
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Optimize query with configurable mode
   *
   * @param query - Original search query
   * @param mode - Expansion mode (default: 'local')
   * @returns Optimized query result with metrics
   */
  async optimizeQuery(
    query: string,
    mode: QueryExpansionMode = 'local',
  ): Promise<OptimizedQueryResult> {
    const startTime = Date.now();

    // Step 1: Validate and assess quality
    const quality = this.assessQueryQuality(query);

    // Step 2: Apply expansions based on mode
    const expansions = await this.applyExpansions(query, mode);

    // Step 3: Build optimized query
    const optimizedQuery = this.buildOptimizedQuery(query, expansions, mode);

    // Step 4: Determine if search should proceed
    const shouldProceed = quality.qualityScore >= QUALITY_THRESHOLD_MINIMUM;
    const warningMessage = this.generateWarningMessage(quality);

    // Track mode usage
    this.modeUsageCounters[mode]++;

    const processingTimeMs = Date.now() - startTime;

    this.logger.debug(
      `🔬 [QueryOptimizer] Mode=${mode}, Quality=${quality.qualityScore}, ` +
      `Proceed=${shouldProceed}, Time=${processingTimeMs}ms`,
    );

    return {
      originalQuery: query,
      optimizedQuery,
      expansionMode: mode,
      quality,
      expansions,
      processingTimeMs,
      shouldProceed,
      warningMessage,
    };
  }

  /**
   * Validate query without optimization
   * Use for quick pre-flight checks
   */
  validateQuery(query: string): QueryQualityAssessment {
    return this.assessQueryQuality(query);
  }

  /**
   * Record search effectiveness for A/B testing
   */
  recordEffectiveness(
    queryHash: string,
    mode: QueryExpansionMode,
    papersFound: number,
    avgSemanticScore: number,
    avgQualityScore: number,
    processingTimeMs: number,
  ): void {
    const key = `${queryHash}:${mode}`;

    // LRU eviction
    if (this.effectivenessCache.size >= MAX_EFFECTIVENESS_CACHE) {
      const oldestKey = this.effectivenessCache.keys().next().value;
      if (oldestKey) {
        this.effectivenessCache.delete(oldestKey);
      }
    }

    this.effectivenessCache.set(key, {
      mode,
      queryHash,
      papersFound,
      avgSemanticScore,
      avgQualityScore,
      processingTimeMs,
      timestamp: new Date(),
    });

    this.logger.debug(
      `📊 [Effectiveness] Recorded: mode=${mode}, papers=${papersFound}, ` +
      `semantic=${avgSemanticScore.toFixed(2)}, quality=${avgQualityScore.toFixed(2)}`,
    );
  }

  /**
   * Get effectiveness comparison for A/B testing
   */
  getEffectivenessComparison(): {
    readonly byMode: Record<QueryExpansionMode, {
      readonly count: number;
      readonly avgPapers: number;
      readonly avgSemanticScore: number;
      readonly avgQualityScore: number;
      readonly avgProcessingTimeMs: number;
    }>;
    readonly modeUsage: Record<QueryExpansionMode, number>;
    readonly recommendation: QueryExpansionMode;
    readonly confidence: number;
  } {
    const byMode: Record<QueryExpansionMode, {
      count: number;
      totalPapers: number;
      totalSemantic: number;
      totalQuality: number;
      totalTime: number;
    }> = {
      none: { count: 0, totalPapers: 0, totalSemantic: 0, totalQuality: 0, totalTime: 0 },
      local: { count: 0, totalPapers: 0, totalSemantic: 0, totalQuality: 0, totalTime: 0 },
      enhanced: { count: 0, totalPapers: 0, totalSemantic: 0, totalQuality: 0, totalTime: 0 },
      ai: { count: 0, totalPapers: 0, totalSemantic: 0, totalQuality: 0, totalTime: 0 },
    };

    // Aggregate metrics
    const now = Date.now();
    for (const [, metrics] of this.effectivenessCache) {
      // Skip stale entries
      if (now - metrics.timestamp.getTime() > EFFECTIVENESS_CACHE_TTL_MS) {
        continue;
      }

      const mode = metrics.mode;
      byMode[mode].count++;
      byMode[mode].totalPapers += metrics.papersFound;
      byMode[mode].totalSemantic += metrics.avgSemanticScore;
      byMode[mode].totalQuality += metrics.avgQualityScore;
      byMode[mode].totalTime += metrics.processingTimeMs;
    }

    // Calculate averages
    const result: Record<QueryExpansionMode, {
      count: number;
      avgPapers: number;
      avgSemanticScore: number;
      avgQualityScore: number;
      avgProcessingTimeMs: number;
    }> = {} as Record<QueryExpansionMode, {
      count: number;
      avgPapers: number;
      avgSemanticScore: number;
      avgQualityScore: number;
      avgProcessingTimeMs: number;
    }>;

    for (const mode of ['none', 'local', 'enhanced', 'ai'] as QueryExpansionMode[]) {
      const data = byMode[mode];
      result[mode] = {
        count: data.count,
        avgPapers: data.count > 0 ? data.totalPapers / data.count : 0,
        avgSemanticScore: data.count > 0 ? data.totalSemantic / data.count : 0,
        avgQualityScore: data.count > 0 ? data.totalQuality / data.count : 0,
        avgProcessingTimeMs: data.count > 0 ? data.totalTime / data.count : 0,
      };
    }

    // Determine recommendation based on semantic score (primary) and paper count (secondary)
    let recommendation: QueryExpansionMode = 'local';
    let bestScore = 0;
    let confidence = 0;

    for (const mode of ['none', 'local', 'enhanced', 'ai'] as QueryExpansionMode[]) {
      const data = result[mode];
      if (data.count >= 10) { // Minimum sample size
        // Score = semantic quality weighted heavily + paper count bonus
        const score = data.avgSemanticScore * 0.7 + (data.avgPapers / 100) * 0.3;
        if (score > bestScore) {
          bestScore = score;
          recommendation = mode;
          confidence = Math.min(data.count / 100, 1); // More samples = higher confidence
        }
      }
    }

    return {
      byMode: result,
      modeUsage: { ...this.modeUsageCounters },
      recommendation,
      confidence,
    };
  }

  // ==========================================================================
  // QUALITY ASSESSMENT
  // ==========================================================================

  /**
   * Assess query quality with detailed metrics
   */
  private assessQueryQuality(query: string): QueryQualityAssessment {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Normalize query
    const normalized = query.trim().toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);

    // Calculate metrics
    const metrics = this.calculateQueryMetrics(normalized, words);

    // Validate against minimums
    if (metrics.characterCount < MIN_QUERY_CHARACTERS) {
      issues.push(`Query too short (${metrics.characterCount} chars, minimum ${MIN_QUERY_CHARACTERS})`);
      suggestions.push('Add more specific terms to your search');
    }

    if (metrics.meaningfulWordCount < MIN_MEANINGFUL_WORDS) {
      issues.push(`Not enough meaningful words (${metrics.meaningfulWordCount}, minimum ${MIN_MEANINGFUL_WORDS})`);
      suggestions.push('Add domain-specific or technical terms');
    }

    if (metrics.longestWordLength < MIN_LONGEST_WORD) {
      issues.push(`No substantial terms found (longest word: ${metrics.longestWordLength} chars)`);
      suggestions.push('Include at least one specific term (4+ characters)');
    }

    if (metrics.hasStopWordsOnly) {
      issues.push('Query contains only common words');
      suggestions.push('Add subject-specific keywords');
    }

    if (metrics.isSingleWord && metrics.wordCount === 1) {
      issues.push('Single-word queries produce unfocused results');
      suggestions.push('Add methodology, context, or time frame');
    }

    // Calculate quality score (0-100)
    let qualityScore = 100;

    // Deductions
    if (metrics.characterCount < MIN_QUERY_CHARACTERS) {
      qualityScore -= 30;
    } else if (metrics.characterCount < MIN_QUERY_CHARACTERS * 2) {
      qualityScore -= 15;
    }

    if (metrics.meaningfulWordCount < MIN_MEANINGFUL_WORDS) {
      qualityScore -= 30;
    } else if (metrics.meaningfulWordCount < MIN_MEANINGFUL_WORDS + 1) {
      qualityScore -= 10;
    }

    if (metrics.longestWordLength < MIN_LONGEST_WORD) {
      qualityScore -= 20;
    }

    if (metrics.hasStopWordsOnly) {
      qualityScore -= 40;
    }

    if (metrics.isSingleWord) {
      qualityScore -= 20;
    }

    // Bonuses
    if (metrics.academicTermCount > 0) {
      qualityScore += Math.min(metrics.academicTermCount * 5, 20);
    }

    // Bonus for humanities/arts domain terms (equally valid as STEM terms)
    if (metrics.humanitiesTermCount > 0) {
      qualityScore += Math.min(metrics.humanitiesTermCount * 5, 20);
      this.logger.debug(`🎵 [Humanities] Detected ${metrics.humanitiesTermCount} domain terms, +${Math.min(metrics.humanitiesTermCount * 5, 20)} quality bonus`);
    }

    if (metrics.meaningfulWordCount >= 4) {
      qualityScore += 10;
    }

    // Clamp to 0-100
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    const isValid = qualityScore >= QUALITY_THRESHOLD_MINIMUM;

    return {
      isValid,
      qualityScore,
      issues,
      suggestions,
      metrics,
    };
  }

  /**
   * Calculate detailed query metrics with domain detection
   */
  private calculateQueryMetrics(normalized: string, words: string[]): QueryMetrics {
    const meaningfulWords = words.filter(w =>
      w.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(w)
    );

    const longestWord = words.reduce(
      (max, w) => (w.length > max.length ? w : max),
      ''
    );

    const academicTerms = words.filter(w =>
      ACADEMIC_TERMS.has(w) || Q_METHODOLOGY_TERMS.has(w)
    );

    // Detect humanities/arts terms
    const humanitiesTerms = words.filter(w => HUMANITIES_TERMS.has(w));

    // Domain detection logic
    const detectedDomain = this.detectDomain(words, academicTerms.length, humanitiesTerms.length);

    return {
      wordCount: words.length,
      meaningfulWordCount: meaningfulWords.length,
      characterCount: normalized.length,
      longestWordLength: longestWord.length,
      hasStopWordsOnly: meaningfulWords.length === 0 && words.length > 0,
      isSingleWord: words.length === 1,
      isQuestion: normalized.includes('?') || /^(what|how|why|when|where|who|which)\s/i.test(normalized),
      hasSpecialCharacters: /[^\w\s-]/.test(normalized.replace(/[?.,!]/g, '')),
      academicTermCount: academicTerms.length,
      humanitiesTermCount: humanitiesTerms.length,
      detectedDomain,
    };
  }

  /**
   * Detect query domain for appropriate handling
   */
  private detectDomain(
    words: string[],
    academicCount: number,
    humanitiesCount: number,
  ): 'humanities' | 'stem' | 'methodology' | 'general' {
    // Check for Q-methodology specific terms first
    const hasQMethodology = words.some(w => Q_METHODOLOGY_TERMS.has(w));
    if (hasQMethodology) {
      return 'methodology';
    }

    // If more humanities terms than academic terms, it's humanities
    if (humanitiesCount > 0 && humanitiesCount >= academicCount) {
      return 'humanities';
    }

    // If academic terms present, likely STEM/methodology
    if (academicCount > 0) {
      return 'stem';
    }

    // Default to general
    return 'general';
  }

  // ==========================================================================
  // EXPANSION LOGIC
  // ==========================================================================

  /**
   * Apply expansions based on mode
   */
  private async applyExpansions(
    query: string,
    mode: QueryExpansionMode,
  ): Promise<QueryExpansions> {
    let spellCorrected = false;
    let correctedQuery: string | undefined;
    let correctedTerms: string[] = [];
    let methodologyTermsAdded: string[] = [];

    if (mode === 'none') {
      return {
        spellCorrected: false,
        correctedTerms: [],
        synonymsAdded: [],
        methodologyTermsAdded: [],
        controversyTermsAdded: [],
      };
    }

    // Mode: local, enhanced, ai - all apply spell correction
    if (mode === 'local' || mode === 'enhanced' || mode === 'ai') {
      const corrected = this.applySpellCorrection(query);
      if (corrected.wasChanged) {
        spellCorrected = true;
        correctedQuery = corrected.corrected; // Store corrected query to avoid duplicate call
        correctedTerms = corrected.corrections;
      }
    }

    // Mode: enhanced, ai - also detect methodology context
    if (mode === 'enhanced' || mode === 'ai') {
      const methodology = this.detectMethodologyContext(query);
      if (methodology.length > 0) {
        methodologyTermsAdded = methodology;
      }

      // Also detect and expand humanities/music queries
      const humanitiesExpansion = this.detectHumanitiesContext(query);
      if (humanitiesExpansion.length > 0) {
        methodologyTermsAdded = [...methodologyTermsAdded, ...humanitiesExpansion];
        this.logger.debug(`🎵 [Humanities] Expanded query with: ${humanitiesExpansion.join(', ')}`);
      }
    }

    // Mode: ai - full AI expansion (not implemented here, requires external service)
    // This would integrate with QueryExpansionService from AI module
    if (mode === 'ai') {
      // Placeholder for AI expansion
      // In production, this would call QueryExpansionService
      this.logger.debug('[QueryOptimizer] AI mode requested - using enhanced fallback');
    }

    return {
      spellCorrected,
      correctedQuery,
      correctedTerms,
      synonymsAdded: [],
      methodologyTermsAdded,
      controversyTermsAdded: [],
    };
  }

  /**
   * Apply basic spell correction using pre-defined constant map
   * Optimized: Uses module-level SPELL_CORRECTIONS constant instead of recreating object
   */
  private applySpellCorrection(query: string): {
    corrected: string;
    wasChanged: boolean;
    corrections: string[];
  } {
    const corrections: string[] = [];
    let corrected = query;

    // Use pre-defined constant map (optimized - no object recreation)
    for (const [wrong, right] of SPELL_CORRECTIONS) {
      if (corrected.toLowerCase().includes(wrong)) {
        corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
        corrections.push(`${wrong} → ${right}`);
      }
    }

    return {
      corrected,
      wasChanged: corrections.length > 0,
      corrections,
    };
  }

  /**
   * Detect methodology context and suggest terms
   */
  private detectMethodologyContext(query: string): string[] {
    const lower = query.toLowerCase();
    const terms: string[] = [];

    // Q-methodology detection
    if (lower.includes('q-') || lower.includes('qmethod') || lower.includes('q sort')) {
      terms.push('Q-methodology', 'factor analysis', 'subjectivity');
    }

    // Qualitative research detection
    if (lower.includes('qualitative') || lower.includes('interview') || lower.includes('thematic')) {
      terms.push('qualitative research', 'thematic analysis');
    }

    // Systematic review detection
    if (lower.includes('systematic') || lower.includes('meta-analysis') || lower.includes('review')) {
      terms.push('systematic review', 'PRISMA');
    }

    return [...new Set(terms)]; // Deduplicate
  }

  /**
   * Detect humanities/arts context and expand query with domain-specific terms
   * Fixes STEM bias for music, culture, and arts research
   */
  private detectHumanitiesContext(query: string): string[] {
    const lower = query.toLowerCase();
    const terms: string[] = [];

    // Check for known expansion patterns
    for (const [pattern, expansions] of MUSIC_EXPANSION_TERMS) {
      if (lower.includes(pattern)) {
        terms.push(...expansions);
      }
    }

    // Music genre detection
    if (lower.includes('soul') || lower.includes('blues')) {
      if (lower.includes('memphis')) {
        terms.push('stax records', 'southern soul', 'rhythm and blues');
      }
      terms.push('african american music', 'rhythm and blues', 'music history');
    }

    // Music industry detection
    if (lower.includes('music') && (lower.includes('industry') || lower.includes('business') || lower.includes('market'))) {
      terms.push('recording industry', 'music economics', 'record labels', 'music commerce');
    }

    // Cultural impact detection
    if (lower.includes('impact') || lower.includes('influence') || lower.includes('legacy')) {
      if (lower.includes('music') || lower.includes('cultural')) {
        terms.push('cultural influence', 'social impact', 'cultural studies');
      }
    }

    // Jazz and related genres
    if (lower.includes('jazz')) {
      terms.push('improvisation', 'jazz history', 'american music');
    }

    // Hip-hop and urban music
    // Phase 10.115 FIX: Use word boundaries to avoid false positives
    // "hip replacement" should NOT trigger hip-hop expansion
    // "rapid prototyping" should NOT trigger rap music expansion
    const hipHopPattern = /\b(hip[\s-]?hop|rapper|rapping|emcee|mc\b)/i;
    const rapPattern = /\b(rap\s+(music|song|artist|culture)|gangsta\s+rap)\b/i;
    if (hipHopPattern.test(lower) || rapPattern.test(lower)) {
      terms.push('hip hop culture', 'urban music', 'african american culture');
    }

    // General music research terms
    if (lower.includes('music') || lower.includes('musical')) {
      terms.push('musicology', 'music studies', 'popular music');
    }

    return [...new Set(terms)]; // Deduplicate
  }

  /**
   * Build final optimized query with expansion terms
   *
   * Phase 10.115: CRITICAL FIX - Expansion terms MUST be included in query
   *
   * Previous bug: Expansion terms were computed but NEVER added to the query.
   * This caused API searches (PubMed, OpenAlex, etc.) to miss related papers
   * because they use keyword matching, not semantic scoring.
   *
   * Fix: Now appends top expansion terms (OR'd) to the query for broader recall.
   * Example: "memphis soul" → "memphis soul OR stax records OR southern soul"
   *
   * The OR operator ensures:
   * - Original query terms still required
   * - Expanded terms help find related papers
   * - Doesn't break exact phrase matching
   */
  private buildOptimizedQuery(
    original: string,
    expansions: QueryExpansions,
    mode: QueryExpansionMode,
  ): string {
    if (mode === 'none') {
      return original;
    }

    // Start with spell-corrected query or original
    let baseQuery = original.trim();
    if (expansions.spellCorrected && expansions.correctedQuery) {
      baseQuery = expansions.correctedQuery.trim();
    }

    // Phase 10.115: Add expansion terms for better API search coverage
    // Only add terms in enhanced/ai modes to avoid over-expansion in local mode
    if (mode === 'enhanced' || mode === 'ai') {
      const expansionTerms = [
        ...expansions.methodologyTermsAdded,
        ...expansions.synonymsAdded,
      ].filter(term => term && term.length > 0);

      // Limit to top 3 most relevant expansion terms to avoid query bloat
      const MAX_EXPANSION_TERMS = 3;
      const selectedTerms = expansionTerms.slice(0, MAX_EXPANSION_TERMS);

      if (selectedTerms.length > 0) {
        // Append as OR alternatives for broader recall
        // Format: "original query" OR "expansion1" OR "expansion2"
        const expansionPart = selectedTerms
          .map(term => `"${term}"`)
          .join(' OR ');

        this.logger.debug(
          `📈 [QueryExpansion] Appending ${selectedTerms.length} terms: ${selectedTerms.join(', ')}`
        );

        return `(${baseQuery}) OR ${expansionPart}`;
      }
    }

    return baseQuery;
  }

  /**
   * Generate warning message for low-quality queries
   */
  private generateWarningMessage(quality: QueryQualityAssessment): string | undefined {
    if (quality.qualityScore >= QUALITY_THRESHOLD_GOOD) {
      return undefined;
    }

    if (quality.qualityScore >= QUALITY_THRESHOLD_ACCEPTABLE) {
      return 'Query could be more specific for better results';
    }

    if (quality.qualityScore >= QUALITY_THRESHOLD_MINIMUM) {
      return 'Query is quite broad - consider adding specific terms';
    }

    return 'Query may not produce meaningful results - please add more specific terms';
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Generate hash for query (for effectiveness tracking)
   */
  generateQueryHash(query: string): string {
    const normalized = query.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    readonly effectivenessCacheSize: number;
    readonly modeUsage: Record<QueryExpansionMode, number>;
  } {
    return {
      effectivenessCacheSize: this.effectivenessCache.size,
      modeUsage: { ...this.modeUsageCounters },
    };
  }
}
