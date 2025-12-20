/**
 * Phase 10.113 Week 5: Claim Extraction Service
 *
 * Netflix-grade service for extracting claims from paper abstracts
 * and scoring their potential for Q-methodology statements.
 *
 * Features:
 * - AI-powered claim extraction from abstracts
 * - Statement potential scoring (sortability, clarity, neutrality)
 * - Perspective classification (supportive, critical, neutral)
 * - Semantic deduplication of similar claims
 * - Sub-theme grouping for organized output
 * - Full provenance tracking
 * - AbortSignal support for cancellation
 * - Progress callbacks for UI feedback
 */

import { Injectable, Logger } from '@nestjs/common';
// Phase 10.185: Migrated from OpenAIService to UnifiedAIService
// Benefits: Groq FREE tier first, 80% cost reduction with Gemini fallback
import { UnifiedAIService } from '../../ai/services/unified-ai.service';
import { LocalEmbeddingService } from './local-embedding.service';
import {
  ClaimExtractionConfig,
  ClaimExtractionPaperInput,
  ClaimExtractionThemeContext,
  ClaimExtractionResult,
  MutableClaimExtractionResult,
  ExtractedClaim,
  MutableExtractedClaim,
  ClaimPerspective,
  CLAIM_PERSPECTIVES,
  ClaimExtractionStage,
  ClaimExtractionProgressCallback,
  ClaimExtractionQualityMetrics,
  MutableClaimExtractionQualityMetrics,
  StatementPotentialComponents,
  DEFAULT_CLAIM_EXTRACTION_CONFIG,
  calculatePerspectiveBalance,
} from '../types/claim-extraction.types';
import * as crypto from 'crypto';

// ============================================================================
// NAMED CONSTANTS (No Magic Numbers)
// ============================================================================

/** Minimum papers required for claim extraction */
const MIN_PAPERS_FOR_EXTRACTION = 1;

/** Minimum abstract length (characters) for extraction */
const MIN_ABSTRACT_LENGTH = 100;

/** AI model for claim extraction */
const EXTRACTION_AI_MODEL = 'gpt-4-turbo-preview';

/** Temperature for claim extraction (balanced creativity/accuracy) */
const EXTRACTION_TEMPERATURE = 0.5;

/** Max tokens for extraction response */
const EXTRACTION_MAX_TOKENS = 2000;

/** Temperature for perspective classification */
const CLASSIFICATION_TEMPERATURE = 0.3;

/** Max tokens for classification response */
const CLASSIFICATION_MAX_TOKENS = 500;

// ============================================================================
// STATEMENT POTENTIAL SCORING CONSTANTS
// ============================================================================

/** Optimal word count range for Q-sort statements */
const OPTIMAL_WORD_COUNT_MIN = 8;
const OPTIMAL_WORD_COUNT_MAX = 20;

/** Penalty per word outside optimal range */
const LENGTH_PENALTY_PER_WORD = 0.05;

/** Minimum length score (floor) */
const MIN_LENGTH_SCORE = 0.3;

/** Weight for sortability in overall potential */
const WEIGHT_SORTABILITY = 0.25;

/** Weight for clarity in overall potential */
const WEIGHT_CLARITY = 0.25;

/** Weight for neutrality in overall potential */
const WEIGHT_NEUTRALITY = 0.15;

/** Weight for uniqueness in overall potential */
const WEIGHT_UNIQUENESS = 0.15;

/** Weight for length score in overall potential */
const WEIGHT_LENGTH = 0.10;

/** Weight for academic tone in overall potential */
const WEIGHT_ACADEMIC_TONE = 0.10;

// ============================================================================
// DEDUPLICATION CONSTANTS
// ============================================================================

/** Minimum similarity to consider claims as duplicates */
const DEDUP_SIMILARITY_THRESHOLD = 0.85;

/** Boost for claims with more source papers when merging */
const SOURCE_PAPER_BOOST = 0.05;

// ============================================================================
// BATCH PROCESSING CONSTANTS (Performance Optimization)
// ============================================================================

/** Maximum concurrent AI extraction requests */
const AI_EXTRACTION_CONCURRENCY = 5;

/** Batch size for embedding generation */
const EMBEDDING_BATCH_SIZE = 20;

// ============================================================================
// SCORING BASE VALUES AND ADJUSTMENTS
// ============================================================================

/** Fallback confidence when AI doesn't provide one */
const FALLBACK_CONFIDENCE = 0.7;

/** Initial uniqueness score (refined during deduplication) */
const INITIAL_UNIQUENESS_SCORE = 0.7;

/** Base score for sortability calculation */
const BASE_SORTABILITY_SCORE = 0.5;

/** Base score for clarity calculation */
const BASE_CLARITY_SCORE = 0.7;

/** Base score for neutrality calculation */
const BASE_NEUTRALITY_SCORE = 0.8;

/** Base score for academic tone calculation */
const BASE_ACADEMIC_TONE_SCORE = 0.6;

/** Threshold for high-quality claims (potential > this value) */
const HIGH_QUALITY_THRESHOLD = 0.7;

/** Fallback theme relevance when embedding fails */
const FALLBACK_THEME_RELEVANCE = 0.5;

// Scoring adjustments
const SORTABLE_PATTERN_BOOST = 0.1;
const NON_SORTABLE_PATTERN_PENALTY = 0.2;
const QUESTION_PENALTY = 0.3;
const FIRST_PERSON_BOOST = 0.1;
const LONG_SENTENCE_PENALTY = 0.2;
const COMMA_PENALTY = 0.1;
const PARENTHETICAL_PENALTY = 0.1;
const JARGON_PENALTY = 0.1;
const EXTREME_WORD_PENALTY = 0.2;
const EMOTIONAL_WORD_PENALTY = 0.2;
const VALUE_JUDGMENT_PENALTY = 0.1;
const ACADEMIC_PATTERN_BOOST = 0.1;
const INFORMAL_PATTERN_PENALTY = 0.15;

/** Maximum claims to send for AI classification (token limit protection) */
const MAX_CLAIMS_FOR_AI_CLASSIFICATION = 20;

/** Perfect length score value */
const PERFECT_LENGTH_SCORE = 1.0;

// ============================================================================
// PERSPECTIVE CLASSIFICATION KEYWORDS
// ============================================================================

const SUPPORTIVE_KEYWORDS = [
  'support', 'confirm', 'validate', 'demonstrate', 'show',
  'prove', 'establish', 'benefit', 'advantage', 'positive',
  'effective', 'successful', 'improve', 'enhance', 'promote',
] as const;

const CRITICAL_KEYWORDS = [
  'challenge', 'question', 'critique', 'limit', 'concern',
  'problem', 'issue', 'fail', 'negative', 'risk',
  'disadvantage', 'drawback', 'weakness', 'flaw', 'oppose',
] as const;

const NEUTRAL_KEYWORDS = [
  'examine', 'explore', 'investigate', 'analyze', 'describe',
  'observe', 'note', 'find', 'suggest', 'indicate',
  'compare', 'contrast', 'relate', 'associate', 'identify',
] as const;

// ============================================================================
// SORTABILITY INDICATORS
// ============================================================================

const SORTABLE_PATTERNS = [
  /should/i,
  /must/i,
  /is (important|essential|crucial|necessary)/i,
  /plays a (key|crucial|significant) role/i,
  /has (significant|major|substantial) (impact|effect)/i,
  /leads to/i,
  /results in/i,
  /contributes to/i,
  /affects/i,
  /influences/i,
] as const;

const NON_SORTABLE_PATTERNS = [
  /^\s*(the|this|that|these|those)\s+(study|research|paper)/i,
  /^(we|researchers|authors)\s+(found|examined|analyzed)/i,
  /^(in|during|throughout)\s+this\s+(study|research)/i,
  /^(data|results|findings)\s+(show|indicate|suggest)/i,
] as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Phase 10.185: System prompt for claim extraction AI
 * Netflix-grade: Consistent, high-quality extraction behavior
 */
const CLAIM_EXTRACTION_SYSTEM_PROMPT = `You are an expert Q-methodology researcher specializing in extracting claims from academic literature. Your task is to identify and extract claims that can be used in Q-sort exercises.

CRITICAL REQUIREMENTS:
1. Claims must express a clear position or finding (not just describe methodology)
2. Claims must be sortable on an agree-disagree scale
3. Claims should be concise and self-contained (8-20 words optimal)
4. Preserve academic tone while ensuring clarity
5. Output ONLY valid JSON - no markdown, no explanation, no commentary

You are precise, consistent, and always follow the exact output format requested.`;

/**
 * Phase 10.185: System prompt for perspective classification AI
 */
const PERSPECTIVE_CLASSIFICATION_SYSTEM_PROMPT = `You are an expert in analyzing academic claims and classifying their perspective stance. You classify claims into three categories:
- "supportive": Claims that support, validate, promote, or show benefits of the topic
- "critical": Claims that challenge, critique, question, or show concerns about the topic
- "neutral": Claims that describe, observe, or analyze without taking a position

Output ONLY valid JSON arrays - no markdown, no explanation.`;

@Injectable()
export class ClaimExtractionService {
  private readonly logger = new Logger(ClaimExtractionService.name);

  constructor(
    // Phase 10.185: Unified AI Service with Groq FREE → Gemini → OpenAI fallback
    private readonly aiService: UnifiedAIService,
    private readonly embeddingService: LocalEmbeddingService,
  ) {}

  /**
   * Extract claims from papers with full analysis pipeline
   *
   * @param papers - Papers to extract claims from
   * @param theme - Theme context for relevance scoring
   * @param config - Extraction configuration (optional)
   * @param progressCallback - Progress callback (optional)
   * @param signal - AbortSignal for cancellation (optional)
   * @returns Claim extraction result with quality metrics
   */
  async extractClaims(
    papers: readonly ClaimExtractionPaperInput[],
    theme: ClaimExtractionThemeContext,
    config: Partial<ClaimExtractionConfig> = {},
    progressCallback?: ClaimExtractionProgressCallback,
    signal?: AbortSignal,
  ): Promise<ClaimExtractionResult> {
    const startTime = new Date();
    const mergedConfig: ClaimExtractionConfig = {
      ...DEFAULT_CLAIM_EXTRACTION_CONFIG,
      ...config,
    };

    this.logger.log(
      `📝 [ClaimExtraction] Starting extraction for theme "${theme.label}" ` +
      `from ${papers.length} papers`,
    );

    // STAGE 1: Initialize
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.INITIALIZING,
      5,
      'Initializing claim extraction...',
    );

    // Validate input
    const validPapers = this.validateAndFilterPapers(papers, mergedConfig);
    if (validPapers.length < MIN_PAPERS_FOR_EXTRACTION) {
      return this.createEmptyResult(theme, startTime, mergedConfig, [
        `Insufficient valid papers: ${validPapers.length} (minimum: ${MIN_PAPERS_FOR_EXTRACTION})`,
      ]);
    }

    // Check cancellation
    this.checkCancellation(signal);

    // Initialize result
    const result: MutableClaimExtractionResult = {
      theme,
      claims: [],
      claimsBySubTheme: new Map(),
      claimsByPerspective: new Map(),
      qualityMetrics: this.initializeQualityMetrics(),
      metadata: {
        startTime,
        endTime: new Date(),
        processingTimeMs: 0,
        config: mergedConfig,
        warnings: [],
        requestId: crypto.randomUUID(),
      },
    };

    // STAGE 2: Extract claims from papers
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.EXTRACTING_CLAIMS,
      15,
      `Extracting claims from ${validPapers.length} papers...`,
    );

    const rawClaims = await this.extractClaimsFromPapers(
      validPapers,
      theme,
      mergedConfig,
      signal,
    );
    this.logger.log(`   Extracted ${rawClaims.length} raw claims`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 3: Score statement potential
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.SCORING_POTENTIAL,
      35,
      'Scoring statement potential...',
    );

    const scoredClaims = await this.scoreStatementPotential(
      rawClaims,
      theme,
      mergedConfig,
    );
    this.logger.log(`   Scored ${scoredClaims.length} claims`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 4: Classify perspectives
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.CLASSIFYING_PERSPECTIVE,
      50,
      'Classifying perspectives...',
    );

    const classifiedClaims = await this.classifyPerspectives(
      scoredClaims,
      theme,
      signal,
    );
    this.logger.log(`   Classified ${classifiedClaims.length} claims`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 5: Deduplicate claims
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.DEDUPLICATING,
      65,
      'Removing duplicate claims...',
    );

    const deduplicatedClaims = mergedConfig.deduplicateClaims
      ? await this.deduplicateClaims(classifiedClaims, mergedConfig)
      : classifiedClaims;
    this.logger.log(
      `   Deduplicated: ${classifiedClaims.length} → ${deduplicatedClaims.length} claims`,
    );

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 6: Group claims
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.GROUPING,
      80,
      'Grouping claims by theme and perspective...',
    );

    result.claims = deduplicatedClaims;
    result.claimsBySubTheme = this.groupBySubTheme(deduplicatedClaims);
    result.claimsByPerspective = this.groupByPerspective(deduplicatedClaims);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 7: Calculate quality metrics
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.QUALITY_ANALYSIS,
      90,
      'Analyzing extraction quality...',
    );

    result.qualityMetrics = this.calculateQualityMetrics(
      validPapers,
      rawClaims.length,
      deduplicatedClaims,
      theme,
    );

    // Finalize metadata
    const endTime = new Date();
    result.metadata = {
      ...result.metadata,
      endTime,
      processingTimeMs: endTime.getTime() - startTime.getTime(),
    };

    // STAGE 8: Complete
    this.emitProgress(
      progressCallback,
      ClaimExtractionStage.COMPLETE,
      100,
      'Claim extraction complete',
    );

    this.logger.log(
      `✅ [ClaimExtraction] Complete: ${result.claims.length} claims extracted ` +
      `in ${result.metadata.processingTimeMs}ms ` +
      `(avg potential: ${(result.qualityMetrics.avgStatementPotential * 100).toFixed(1)}%)`,
    );

    return this.freezeResult(result);
  }

  // ============================================================================
  // CLAIM EXTRACTION
  // ============================================================================

  /**
   * Extract claims from papers using AI
   * OPTIMIZED: Uses batch processing with concurrency control
   */
  private async extractClaimsFromPapers(
    papers: readonly ClaimExtractionPaperInput[],
    theme: ClaimExtractionThemeContext,
    config: ClaimExtractionConfig,
    signal?: AbortSignal,
  ): Promise<MutableExtractedClaim[]> {
    const allClaims: MutableExtractedClaim[] = [];

    // Process papers in batches with concurrency control
    const batches = this.chunkArray([...papers], AI_EXTRACTION_CONCURRENCY);

    for (const batch of batches) {
      this.checkCancellation(signal);

      // Process batch concurrently
      const batchPromises = batch.map(paper =>
        this.extractClaimsFromPaper(paper, theme, config),
      );

      const batchResults = await Promise.all(batchPromises);

      // Collect claims from batch
      for (const paperClaims of batchResults) {
        const limitedClaims = paperClaims.slice(0, config.maxClaimsPerPaper);
        allClaims.push(...limitedClaims);

        // Early exit if total limit reached
        if (allClaims.length >= config.maxTotalClaims) {
          return allClaims.slice(0, config.maxTotalClaims);
        }
      }
    }

    return allClaims.slice(0, config.maxTotalClaims);
  }

  /**
   * Split array into chunks for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Extract claims from a single paper
   */
  private async extractClaimsFromPaper(
    paper: ClaimExtractionPaperInput,
    theme: ClaimExtractionThemeContext,
    config: ClaimExtractionConfig,
  ): Promise<MutableExtractedClaim[]> {
    const subThemeContext = this.buildSubThemeContext(theme);

    const prompt = `Extract key claims from this academic paper abstract for Q-methodology analysis.

THEME CONTEXT: "${theme.label}"
${theme.description ? `THEME DESCRIPTION: ${theme.description}` : ''}
${subThemeContext}

PAPER TITLE: "${paper.title}"

ABSTRACT:
${paper.abstract}

TASK:
Extract ${config.maxClaimsPerPaper} distinct claims that:
1. Express a clear position or finding
2. Are relevant to the theme "${theme.label}"
3. Can be sorted on an agree-disagree scale
4. Are concise (${config.minClaimWords}-${config.maxClaimWords} words)

FORMAT (JSON array):
[
  {
    "originalText": "exact quote from abstract",
    "normalizedClaim": "cleaned up version suitable for Q-sort",
    "subTheme": "most relevant sub-theme (or 'general' if none)",
    "confidence": 0.0-1.0
  }
]

Return ONLY the JSON array, no other text.`;

    try {
      // Phase 10.185: Use UnifiedAIService with system prompt
      // Provider chain: Groq FREE → Gemini (80% cheaper) → OpenAI
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: EXTRACTION_TEMPERATURE,
        maxTokens: EXTRACTION_MAX_TOKENS,
        systemPrompt: CLAIM_EXTRACTION_SYSTEM_PROMPT,
        cache: true, // Enable response caching for repeated similar prompts
      });

      const parsed = this.parseExtractionResponse(response.content);

      return parsed.map((item, index) => this.createClaim(
        item,
        paper,
        theme,
        config,
        index,
      ));
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(
        `[ClaimExtraction] Failed to extract claims from paper "${paper.title}": ${err.message || 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Parse AI extraction response
   */
  private parseExtractionResponse(
    response: string,
  ): Array<{
    originalText: string;
    normalizedClaim: string;
    subTheme: string;
    confidence: number;
  }> {
    try {
      // Clean response (remove markdown code blocks if present)
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is {
          originalText: string;
          normalizedClaim: string;
          subTheme: string;
          confidence: number;
        } =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.originalText === 'string' &&
          typeof item.normalizedClaim === 'string',
      );
    } catch {
      this.logger.warn('[ClaimExtraction] Failed to parse extraction response');
      return [];
    }
  }

  /**
   * Create a claim object from parsed data
   */
  private createClaim(
    parsed: {
      originalText: string;
      normalizedClaim: string;
      subTheme: string;
      confidence: number;
    },
    paper: ClaimExtractionPaperInput,
    theme: ClaimExtractionThemeContext,
    config: ClaimExtractionConfig,
    index: number,
  ): MutableExtractedClaim {
    const normalizedText = config.normalizeClaimText
      ? this.normalizeClaim(parsed.normalizedClaim)
      : parsed.normalizedClaim;

    const originalWordCount = this.countWords(parsed.originalText);
    const normalizedWordCount = this.countWords(normalizedText);

    // Find matching sub-theme
    const subThemeId = this.findSubThemeId(parsed.subTheme, theme);

    return {
      id: `claim-${paper.id}-${index}-${crypto.randomUUID().slice(0, 8)}`,
      sourceSubTheme: subThemeId || theme.id,
      sourcePapers: [paper.id],
      originalText: parsed.originalText,
      normalizedClaim: normalizedText,
      perspective: 'neutral', // Will be classified later
      statementPotential: 0, // Will be scored later
      confidence: Math.max(0, Math.min(1, parsed.confidence || FALLBACK_CONFIDENCE)),
      metadata: {
        extractedAt: new Date(),
        extractionModel: EXTRACTION_AI_MODEL,
        originalWordCount,
        normalizedWordCount,
        keyTerms: this.extractKeyTerms(normalizedText),
        themeRelevance: 0, // Will be calculated
        isDeduplicated: false,
        mergedClaimIds: [],
      },
    };
  }

  // ============================================================================
  // STATEMENT POTENTIAL SCORING
  // ============================================================================

  /**
   * Score statement potential for all claims
   */
  private async scoreStatementPotential(
    claims: MutableExtractedClaim[],
    theme: ClaimExtractionThemeContext,
    config: ClaimExtractionConfig,
  ): Promise<MutableExtractedClaim[]> {
    const themeEmbedding = theme.embedding || await this.getThemeEmbedding(theme);

    for (const claim of claims) {
      const components = await this.calculatePotentialComponents(
        claim,
        themeEmbedding,
      );

      claim.statementPotential = this.calculateOverallPotential(components);

      // Update theme relevance
      if (themeEmbedding) {
        claim.metadata.themeRelevance = await this.calculateThemeRelevance(
          claim.normalizedClaim,
          themeEmbedding,
        );
      }
    }

    // Filter by minimum potential
    return claims.filter(c => c.statementPotential >= config.minStatementPotential);
  }

  /**
   * Calculate individual potential components
   */
  private async calculatePotentialComponents(
    claim: MutableExtractedClaim,
    _themeEmbedding?: readonly number[],
  ): Promise<StatementPotentialComponents> {
    const text = claim.normalizedClaim;

    return {
      sortability: this.calculateSortability(text),
      clarity: this.calculateClarity(text),
      neutrality: this.calculateNeutrality(text),
      uniqueness: INITIAL_UNIQUENESS_SCORE, // Will be refined during deduplication
      lengthScore: this.calculateLengthScore(text),
      academicTone: this.calculateAcademicTone(text),
    };
  }

  /**
   * Calculate overall potential from components
   */
  private calculateOverallPotential(components: StatementPotentialComponents): number {
    const weighted =
      components.sortability * WEIGHT_SORTABILITY +
      components.clarity * WEIGHT_CLARITY +
      components.neutrality * WEIGHT_NEUTRALITY +
      components.uniqueness * WEIGHT_UNIQUENESS +
      components.lengthScore * WEIGHT_LENGTH +
      components.academicTone * WEIGHT_ACADEMIC_TONE;

    return Math.max(0, Math.min(1, weighted));
  }

  /**
   * Calculate sortability score (can it be placed on agree-disagree scale?)
   */
  private calculateSortability(text: string): number {
    let score = BASE_SORTABILITY_SCORE;

    // Check for sortable patterns (positive indicators)
    for (const pattern of SORTABLE_PATTERNS) {
      if (pattern.test(text)) {
        score += SORTABLE_PATTERN_BOOST;
      }
    }

    // Check for non-sortable patterns (negative indicators)
    for (const pattern of NON_SORTABLE_PATTERNS) {
      if (pattern.test(text)) {
        score -= NON_SORTABLE_PATTERN_PENALTY;
      }
    }

    // Questions are not sortable
    if (text.includes('?')) {
      score -= QUESTION_PENALTY;
    }

    // First-person statements are sortable
    if (/\b(I|we|one)\s+(believe|think|feel|argue)/i.test(text)) {
      score += FIRST_PERSON_BOOST;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate clarity score
   */
  private calculateClarity(text: string): number {
    let score = BASE_CLARITY_SCORE;

    // Penalize very long sentences
    const sentenceCount = (text.match(/[.!?]/g) || []).length || 1;
    const wordsPerSentence = this.countWords(text) / sentenceCount;
    if (wordsPerSentence > 25) {
      score -= LONG_SENTENCE_PENALTY;
    }

    // Penalize excessive commas (complex sentence structure)
    const commaCount = (text.match(/,/g) || []).length;
    if (commaCount > 3) {
      score -= COMMA_PENALTY;
    }

    // Penalize parenthetical expressions
    if (/\([^)]+\)/.test(text)) {
      score -= PARENTHETICAL_PENALTY;
    }

    // Penalize jargon-heavy text (multiple consecutive capitalized words)
    if (/[A-Z]{3,}/.test(text)) {
      score -= JARGON_PENALTY;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate neutrality score (avoid loaded language)
   */
  private calculateNeutrality(text: string): number {
    let score = BASE_NEUTRALITY_SCORE;

    // Penalize extreme words
    const extremeWords = /\b(always|never|completely|totally|absolutely|definitely)\b/i;
    if (extremeWords.test(text)) {
      score -= EXTREME_WORD_PENALTY;
    }

    // Penalize emotional language
    const emotionalWords = /\b(terrible|amazing|horrible|wonderful|devastating|brilliant)\b/i;
    if (emotionalWords.test(text)) {
      score -= EMOTIONAL_WORD_PENALTY;
    }

    // Penalize value judgments
    const valueJudgments = /\b(should|must|ought|need to|have to)\b/i;
    if (valueJudgments.test(text)) {
      score -= VALUE_JUDGMENT_PENALTY;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate length score (optimal for Q-sort)
   */
  private calculateLengthScore(text: string): number {
    const wordCount = this.countWords(text);

    // Perfect score for optimal range
    if (wordCount >= OPTIMAL_WORD_COUNT_MIN && wordCount <= OPTIMAL_WORD_COUNT_MAX) {
      return PERFECT_LENGTH_SCORE;
    }

    // Penalize outside optimal range
    let penalty = 0;
    if (wordCount < OPTIMAL_WORD_COUNT_MIN) {
      penalty = (OPTIMAL_WORD_COUNT_MIN - wordCount) * LENGTH_PENALTY_PER_WORD;
    } else {
      penalty = (wordCount - OPTIMAL_WORD_COUNT_MAX) * LENGTH_PENALTY_PER_WORD;
    }

    return Math.max(MIN_LENGTH_SCORE, 1 - penalty);
  }

  /**
   * Calculate academic tone score
   */
  private calculateAcademicTone(text: string): number {
    let score = BASE_ACADEMIC_TONE_SCORE;

    // Academic indicators (positive)
    const academicPatterns = [
      /\b(research|study|findings|evidence|analysis)\b/i,
      /\b(suggests?|indicates?|demonstrates?)\b/i,
      /\b(significant|substantial|considerable)\b/i,
    ];

    for (const pattern of academicPatterns) {
      if (pattern.test(text)) {
        score += ACADEMIC_PATTERN_BOOST;
      }
    }

    // Informal indicators (negative)
    const informalPatterns = [
      /\b(stuff|things|kind of|sort of)\b/i,
      /\b(really|very|totally|super)\b/i,
      /!/,
    ];

    for (const pattern of informalPatterns) {
      if (pattern.test(text)) {
        score -= INFORMAL_PATTERN_PENALTY;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  // ============================================================================
  // PERSPECTIVE CLASSIFICATION
  // ============================================================================

  /**
   * Classify perspectives for all claims
   */
  private async classifyPerspectives(
    claims: MutableExtractedClaim[],
    theme: ClaimExtractionThemeContext,
    signal?: AbortSignal,
  ): Promise<MutableExtractedClaim[]> {
    // First pass: keyword-based classification
    for (const claim of claims) {
      claim.perspective = this.classifyByKeywords(claim.normalizedClaim);
    }

    // Second pass: AI-based classification for ambiguous cases
    const ambiguousClaims = claims.filter(c => c.perspective === 'neutral');

    if (ambiguousClaims.length > 0 && ambiguousClaims.length <= MAX_CLAIMS_FOR_AI_CLASSIFICATION) {
      this.checkCancellation(signal);
      await this.classifyWithAI(ambiguousClaims, theme);
    }

    return claims;
  }

  /**
   * Classify perspective using keywords
   */
  private classifyByKeywords(text: string): ClaimPerspective {
    const lowerText = text.toLowerCase();

    let supportiveScore = 0;
    let criticalScore = 0;
    let neutralScore = 0;

    for (const keyword of SUPPORTIVE_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        supportiveScore++;
      }
    }

    for (const keyword of CRITICAL_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        criticalScore++;
      }
    }

    for (const keyword of NEUTRAL_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        neutralScore++;
      }
    }

    // Determine winner
    const maxScore = Math.max(supportiveScore, criticalScore, neutralScore);

    if (maxScore === 0 || neutralScore >= maxScore) {
      return 'neutral';
    }

    if (supportiveScore > criticalScore) {
      return 'supportive';
    }

    if (criticalScore > supportiveScore) {
      return 'critical';
    }

    return 'neutral';
  }

  /**
   * Classify ambiguous claims using AI
   */
  private async classifyWithAI(
    claims: MutableExtractedClaim[],
    theme: ClaimExtractionThemeContext,
  ): Promise<void> {
    const claimTexts = claims.map((c, i) => `${i + 1}. "${c.normalizedClaim}"`).join('\n');

    const prompt = `Classify these claims about "${theme.label}" by perspective.

CLAIMS:
${claimTexts}

For each claim, determine if the perspective is:
- "supportive": Supports, validates, or promotes the topic
- "critical": Questions, challenges, or critiques the topic
- "neutral": Describes without taking a position

FORMAT (JSON array of perspectives in order):
["supportive", "neutral", "critical", ...]

Return ONLY the JSON array.`;

    try {
      // Phase 10.185: Use UnifiedAIService with system prompt
      // Classification uses 'fast' model for cost efficiency
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: CLASSIFICATION_TEMPERATURE,
        maxTokens: CLASSIFICATION_MAX_TOKENS,
        systemPrompt: PERSPECTIVE_CLASSIFICATION_SYSTEM_PROMPT,
        cache: true, // Enable response caching
      });

      const perspectives = this.parseClassificationResponse(response.content);

      // Apply classifications
      perspectives.forEach((perspective, index) => {
        if (index < claims.length && this.isValidPerspective(perspective)) {
          claims[index]!.perspective = perspective as ClaimPerspective;
        }
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(
        `[ClaimExtraction] AI classification failed: ${err.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Parse AI classification response
   */
  private parseClassificationResponse(response: string): string[] {
    try {
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if a perspective is valid
   */
  private isValidPerspective(value: unknown): boolean {
    return typeof value === 'string' && CLAIM_PERSPECTIVES.includes(value as ClaimPerspective);
  }

  // ============================================================================
  // DEDUPLICATION
  // ============================================================================

  /**
   * Deduplicate similar claims
   */
  private async deduplicateClaims(
    claims: MutableExtractedClaim[],
    config: ClaimExtractionConfig,
  ): Promise<MutableExtractedClaim[]> {
    if (claims.length <= 1) {
      return claims;
    }

    // Get embeddings for all claims
    const embeddings = await this.getClaimEmbeddings(claims);

    // Find duplicate groups
    const duplicateGroups = this.findDuplicateGroups(
      claims,
      embeddings,
      config.deduplicationThreshold,
    );

    // Merge each group into a single claim
    const mergedClaims: MutableExtractedClaim[] = [];

    for (const group of duplicateGroups) {
      const merged = this.mergeDuplicateClaims(group);
      mergedClaims.push(merged);
    }

    return mergedClaims;
  }

  /**
   * Get embeddings for all claims
   * OPTIMIZED: Uses batch processing with concurrency control
   */
  private async getClaimEmbeddings(
    claims: MutableExtractedClaim[],
  ): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();

    // Process in batches for better throughput
    const batches = this.chunkArray(claims, EMBEDDING_BATCH_SIZE);

    for (const batch of batches) {
      // Process batch with concurrency limit
      const batchPromises = batch.map(async claim => {
        try {
          const embedding = await this.embeddingService.generateEmbedding(
            claim.normalizedClaim,
          );
          return { id: claim.id, embedding };
        } catch {
          return null; // Skip claims that fail embedding
        }
      });

      const results = await Promise.all(batchPromises);

      // Collect successful embeddings
      for (const result of results) {
        if (result) {
          embeddings.set(result.id, result.embedding);
        }
      }
    }

    return embeddings;
  }

  /**
   * Find groups of duplicate claims
   */
  private findDuplicateGroups(
    claims: MutableExtractedClaim[],
    embeddings: Map<string, number[]>,
    threshold: number,
  ): MutableExtractedClaim[][] {
    const assigned = new Set<string>();
    const groups: MutableExtractedClaim[][] = [];

    for (const claim of claims) {
      if (assigned.has(claim.id)) {
        continue;
      }

      const group: MutableExtractedClaim[] = [claim];
      assigned.add(claim.id);

      const claimEmbedding = embeddings.get(claim.id);
      if (!claimEmbedding) {
        groups.push(group);
        continue;
      }

      // Find similar claims
      for (const other of claims) {
        if (assigned.has(other.id)) {
          continue;
        }

        const otherEmbedding = embeddings.get(other.id);
        if (!otherEmbedding) {
          continue;
        }

        const similarity = this.cosineSimilarity(claimEmbedding, otherEmbedding);
        if (similarity >= threshold) {
          group.push(other);
          assigned.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Merge duplicate claims into one
   */
  private mergeDuplicateClaims(
    group: MutableExtractedClaim[],
  ): MutableExtractedClaim {
    if (group.length === 1) {
      return group[0]!;
    }

    // Sort by score: confidence + source paper count boost
    const scored = group.map(claim => ({
      claim,
      score: claim.confidence + claim.sourcePapers.length * SOURCE_PAPER_BOOST,
    }));

    scored.sort((a, b) => b.score - a.score);

    const primary = scored[0]!.claim;

    // Merge source papers and IDs
    const allPaperIds = new Set<string>();
    const mergedClaimIds: string[] = [];

    for (const { claim } of scored) {
      for (const paperId of claim.sourcePapers) {
        allPaperIds.add(paperId);
      }
      if (claim.id !== primary.id) {
        mergedClaimIds.push(claim.id);
      }
    }

    // Update primary claim
    primary.sourcePapers = Array.from(allPaperIds);
    primary.metadata.isDeduplicated = true;
    primary.metadata.mergedClaimIds = mergedClaimIds;

    // Boost confidence for claims with multiple sources
    primary.confidence = Math.min(
      1,
      primary.confidence + allPaperIds.size * SOURCE_PAPER_BOOST,
    );

    return primary;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // ============================================================================
  // GROUPING
  // ============================================================================

  /**
   * Group claims by sub-theme
   */
  private groupBySubTheme(
    claims: MutableExtractedClaim[],
  ): Map<string, MutableExtractedClaim[]> {
    const groups = new Map<string, MutableExtractedClaim[]>();

    for (const claim of claims) {
      const subThemeId = claim.sourceSubTheme;
      const existing = groups.get(subThemeId) || [];
      existing.push(claim);
      groups.set(subThemeId, existing);
    }

    return groups;
  }

  /**
   * Group claims by perspective
   */
  private groupByPerspective(
    claims: MutableExtractedClaim[],
  ): Map<ClaimPerspective, MutableExtractedClaim[]> {
    const groups = new Map<ClaimPerspective, MutableExtractedClaim[]>();

    for (const perspective of CLAIM_PERSPECTIVES) {
      groups.set(perspective, []);
    }

    for (const claim of claims) {
      const existing = groups.get(claim.perspective) || [];
      existing.push(claim);
      groups.set(claim.perspective, existing);
    }

    return groups;
  }

  // ============================================================================
  // QUALITY METRICS
  // ============================================================================

  /**
   * Calculate quality metrics for the extraction
   */
  private calculateQualityMetrics(
    papers: readonly ClaimExtractionPaperInput[],
    rawClaimCount: number,
    claims: MutableExtractedClaim[],
    theme: ClaimExtractionThemeContext,
  ): MutableClaimExtractionQualityMetrics {
    const perspectiveDistribution = new Map<ClaimPerspective, number>();
    for (const perspective of CLAIM_PERSPECTIVES) {
      perspectiveDistribution.set(
        perspective,
        claims.filter(c => c.perspective === perspective).length,
      );
    }

    const subThemesWithClaims = new Set(claims.map(c => c.sourceSubTheme));
    const totalSubThemes = (theme.subThemes?.length || 0) + 1; // +1 for general theme

    const avgConfidence = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
      : 0;

    const avgPotential = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.statementPotential, 0) / claims.length
      : 0;

    const highQualityClaims = claims.filter(c => c.statementPotential > HIGH_QUALITY_THRESHOLD).length;

    return {
      papersProcessed: papers.length,
      claimsExtracted: rawClaimCount,
      claimsAfterDedup: claims.length,
      avgConfidence,
      avgStatementPotential: avgPotential,
      perspectiveDistribution,
      subThemeCoverage: totalSubThemes > 0 ? subThemesWithClaims.size / totalSubThemes : 0,
      avgClaimsPerPaper: papers.length > 0 ? claims.length / papers.length : 0,
      highQualityClaims,
    };
  }

  /**
   * Initialize empty quality metrics
   */
  private initializeQualityMetrics(): MutableClaimExtractionQualityMetrics {
    const perspectiveDistribution = new Map<ClaimPerspective, number>();
    for (const perspective of CLAIM_PERSPECTIVES) {
      perspectiveDistribution.set(perspective, 0);
    }

    return {
      papersProcessed: 0,
      claimsExtracted: 0,
      claimsAfterDedup: 0,
      avgConfidence: 0,
      avgStatementPotential: 0,
      perspectiveDistribution,
      subThemeCoverage: 0,
      avgClaimsPerPaper: 0,
      highQualityClaims: 0,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate and filter papers
   */
  private validateAndFilterPapers(
    papers: readonly ClaimExtractionPaperInput[],
    config: ClaimExtractionConfig,
  ): ClaimExtractionPaperInput[] {
    return papers.filter(paper => {
      if (!paper.abstract || paper.abstract.length < MIN_ABSTRACT_LENGTH) {
        return false;
      }

      const wordCount = this.countWords(paper.abstract);
      return wordCount >= config.minClaimWords;
    });
  }

  /**
   * Create empty result for edge cases
   */
  private createEmptyResult(
    theme: ClaimExtractionThemeContext,
    startTime: Date,
    config: ClaimExtractionConfig,
    warnings: string[],
  ): ClaimExtractionResult {
    const endTime = new Date();

    return {
      theme,
      claims: [],
      claimsBySubTheme: new Map(),
      claimsByPerspective: new Map(
        CLAIM_PERSPECTIVES.map(p => [p, [] as ExtractedClaim[]]),
      ),
      qualityMetrics: {
        papersProcessed: 0,
        claimsExtracted: 0,
        claimsAfterDedup: 0,
        avgConfidence: 0,
        avgStatementPotential: 0,
        perspectiveDistribution: new Map(CLAIM_PERSPECTIVES.map(p => [p, 0])),
        subThemeCoverage: 0,
        avgClaimsPerPaper: 0,
        highQualityClaims: 0,
      },
      metadata: {
        startTime,
        endTime,
        processingTimeMs: endTime.getTime() - startTime.getTime(),
        config,
        warnings,
        requestId: crypto.randomUUID(),
      },
    };
  }

  /**
   * Freeze mutable result to immutable
   */
  private freezeResult(result: MutableClaimExtractionResult): ClaimExtractionResult {
    return {
      theme: result.theme,
      claims: result.claims as readonly ExtractedClaim[],
      claimsBySubTheme: result.claimsBySubTheme as ReadonlyMap<string, readonly ExtractedClaim[]>,
      claimsByPerspective: result.claimsByPerspective as ReadonlyMap<ClaimPerspective, readonly ExtractedClaim[]>,
      qualityMetrics: {
        ...result.qualityMetrics,
        perspectiveDistribution: result.qualityMetrics.perspectiveDistribution as ReadonlyMap<ClaimPerspective, number>,
      },
      metadata: {
        ...result.metadata,
        warnings: result.metadata.warnings as readonly string[],
      },
    };
  }

  /**
   * Normalize claim text for Q-sort
   */
  private normalizeClaim(text: string): string {
    return text
      .trim()
      // Remove leading articles
      .replace(/^(the|a|an)\s+/i, '')
      // Capitalize first letter
      .replace(/^([a-z])/, (_, c) => c.toUpperCase())
      // Ensure ends with period
      .replace(/([^.!?])$/, '$1.')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove quotes
      .replace(/[""'']/g, '');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Extract key terms from claim
   */
  private extractKeyTerms(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'that',
      'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its',
      'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from',
      'and', 'or', 'but', 'not', 'as', 'if', 'than', 'so', 'yet',
    ]);

    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i)
      .slice(0, 10);
  }

  /**
   * Find sub-theme ID from label
   */
  private findSubThemeId(
    label: string,
    theme: ClaimExtractionThemeContext,
  ): string | undefined {
    if (!theme.subThemes || label === 'general') {
      return undefined;
    }

    const lowerLabel = label.toLowerCase();

    const match = theme.subThemes.find(
      st => st.label.toLowerCase() === lowerLabel ||
            st.label.toLowerCase().includes(lowerLabel) ||
            lowerLabel.includes(st.label.toLowerCase()),
    );

    return match?.id;
  }

  /**
   * Build sub-theme context string for prompts
   */
  private buildSubThemeContext(theme: ClaimExtractionThemeContext): string {
    if (!theme.subThemes || theme.subThemes.length === 0) {
      return '';
    }

    const subThemeList = theme.subThemes
      .map(st => `- ${st.label}${st.description ? `: ${st.description}` : ''}`)
      .join('\n');

    return `\nSUB-THEMES:\n${subThemeList}`;
  }

  /**
   * Get theme embedding
   */
  private async getThemeEmbedding(
    theme: ClaimExtractionThemeContext,
  ): Promise<number[] | undefined> {
    try {
      const text = `${theme.label}. ${theme.description || ''} ${theme.keywords.join(', ')}`;
      return await this.embeddingService.generateEmbedding(text);
    } catch {
      return undefined;
    }
  }

  /**
   * Calculate theme relevance using embeddings
   */
  private async calculateThemeRelevance(
    claimText: string,
    themeEmbedding: readonly number[],
  ): Promise<number> {
    try {
      const claimEmbedding = await this.embeddingService.generateEmbedding(claimText);
      return this.cosineSimilarity(claimEmbedding, [...themeEmbedding]);
    } catch {
      return FALLBACK_THEME_RELEVANCE;
    }
  }

  /**
   * Emit progress update
   */
  private emitProgress(
    callback: ClaimExtractionProgressCallback | undefined,
    stage: ClaimExtractionStage,
    progress: number,
    message: string,
  ): void {
    if (callback) {
      callback(stage, progress, message);
    }
  }

  /**
   * Check for cancellation
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Claim extraction cancelled by user');
    }
  }
}
