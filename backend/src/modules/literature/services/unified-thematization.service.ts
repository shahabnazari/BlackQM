/**
 * Phase 10.113 Week 6: Unified Thematization Service
 *
 * Netflix-grade orchestrator that integrates ALL Phase 10.113 enhancements
 * with the existing 6-stage Braun & Clarke thematic analysis pipeline.
 *
 * ============================================================================
 * ARCHITECTURE REFERENCE (CRITICAL - READ BEFORE MODIFYING)
 * ============================================================================
 *
 * This service ORCHESTRATES, it does NOT duplicate existing functionality.
 * All heavy lifting is delegated to specialized services.
 *
 * EXISTING SYSTEMS (Referenced, NOT Duplicated):
 * ----------------------------------------------
 *
 * 1. CORE PIPELINE: UnifiedThemeExtractionService
 *    Location: ./unified-theme-extraction.service.ts
 *    Purpose: 6-stage Braun & Clarke (2019) thematic analysis
 *    Entry Point: extractThemesAcademic() or extractThemesV2()
 *    Stages:
 *      - Stage 1: Familiarization (embedding generation)
 *      - Stage 2: Initial Coding (TF-based extraction)
 *      - Stage 3: Theme Generation (k-means++ clustering)
 *      - Stage 4: Theme Review (coherence validation)
 *      - Stage 5: Theme Refinement (deduplication, labeling)
 *      - Stage 6: Provenance (influence calculation)
 *    DO NOT: Re-implement embedding generation, clustering, or theme labeling
 *
 * 2. PROGRESS TRACKING: ThemeExtractionProgressService
 *    Location: ./theme-extraction-progress.service.ts
 *    Purpose: WebSocket progress emission, 4-part messaging
 *    Entry Point: emitProgress(), create4PartProgressMessage()
 *    DO NOT: Create separate progress tracking - use this service
 *
 * 3. LEGACY TIERS: ThemeExtractionService
 *    Location: ./theme-extraction.service.ts
 *    Purpose: Tier configurations (50-300 papers)
 *    Reference: THEMATIZATION_TIERS constant
 *    DO NOT: Duplicate tier logic - reference the types
 *
 * PHASE 10.113 ENHANCEMENTS (Orchestrated by this service):
 * ---------------------------------------------------------
 *
 * Week 2: ThemeFitScoringService (./theme-fit-scoring.service.ts)
 *    Purpose: Relevance scoring for papers
 *    Entry Point: scorePapers(papers, topic)
 *    Integration: PRE-FILTER before core pipeline
 *
 * Week 3: MetaThemeDiscoveryService (./meta-theme-discovery.service.ts)
 *    Purpose: Hierarchical theme extraction (meta-themes + sub-themes)
 *    Entry Point: discoverMetaThemes(papers, config)
 *    Integration: POST-CORE after theme generation
 *
 * Week 4: CitationControversyService (./citation-controversy.service.ts)
 *    Purpose: Citation-based controversy analysis
 *    Entry Point: analyzeControversy(papers, themes)
 *    Integration: POST-CORE after theme generation
 *
 * Week 5: ClaimExtractionService (./claim-extraction.service.ts)
 *    Purpose: Q-sort statement generation from abstracts
 *    Entry Point: extractClaims(papers, theme, config)
 *    Integration: POST-CORE after themes are finalized
 *
 * ORCHESTRATION FLOW:
 * -------------------
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 1. INITIALIZE                                                       │
 * │    - Validate config and papers                                     │
 * │    - Calculate cost estimate                                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 2. PRE-FILTER (Week 2 - Optional)                                   │
 * │    - ThemeFitScoringService.scorePapers()                           │
 * │    - Filter papers below threshold                                  │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 3. CORE PIPELINE (Braun & Clarke 6-Stage)                           │
 * │    - UnifiedThemeExtractionService.extractThemesAcademic()          │
 * │    - All 6 stages execute internally                                │
 * │    - Returns themes with provenance                                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 4. ENHANCEMENT: Hierarchical (Week 3 - Optional)                    │
 * │    - MetaThemeDiscoveryService.discoverMetaThemes()                 │
 * │    - Groups themes into meta-themes                                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 5. ENHANCEMENT: Controversy (Week 4 - Optional)                     │
 * │    - CitationControversyService.analyzeControversy()                │
 * │    - Detects citation camps and debate papers                       │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 6. POST-PROCESS: Claims (Week 5 - Optional)                         │
 * │    - ClaimExtractionService.extractClaims()                         │
 * │    - Generates Q-sort statements                                    │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 7. FINALIZE                                                         │
 * │    - Compile quality metrics                                        │
 * │    - Build result object                                            │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * @module UnifiedThematizationService
 * @since Phase 10.113 Week 6
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

// Core pipeline service (Braun & Clarke 6-stage)
import { UnifiedThemeExtractionService } from './unified-theme-extraction.service';

// Phase 10.113 Week services
import { ThemeFitScoringService } from './theme-fit-scoring.service';
import { MetaThemeDiscoveryService } from './meta-theme-discovery.service';
import { CitationControversyService } from './citation-controversy.service';
import { ClaimExtractionService } from './claim-extraction.service';
import { ThematizationPricingService } from './thematization-pricing.service';

// Week 7: WebSocket progress service
import { ThematizationProgressService } from './thematization-progress.service';

// Week 8: Metrics and Cache services
import { ThematizationMetricsService, ThematizationJobMetrics, StageTiming } from './thematization-metrics.service';
import { ThematizationCacheService } from './thematization-cache.service';

// Types
import {
  ThematizationPipelineConfig,
  ThematizationPipelineResult,
  ThematizationPipelineStage,
  ThematizationPaperInput,
  ThematizationTheme,
  ThematizationClaim,
  ThematizationQualityMetrics,
  ThematizationProgressCallback,
  ThematizationJobStatus,
  ThematizationCostEstimate,
  ThematizationTierCount,
  DEFAULT_PIPELINE_FLAGS,
  getTierConfig,
  isValidTier,
  isValidPaperInput,
} from '../types/unified-thematization.types';

// Claim extraction types
import type {
  ClaimExtractionThemeContext,
  ClaimExtractionPaperInput,
} from '../types/claim-extraction.types';

// Core pipeline types
import { ResearchPurpose } from '../types/unified-theme-extraction.types';

// DTO types (for Paper interface compatibility)
import { LiteratureSource } from '../dto/literature.dto';

// ============================================================================
// NAMED CONSTANTS (No Magic Numbers)
// ============================================================================

/** Minimum papers required for thematization */
const MIN_PAPERS_FOR_ANALYSIS = 10;

/** Minimum abstract length for paper to be useful */
const MIN_ABSTRACT_LENGTH = 50;

/** Base cost in credits for tier 50 */
const BASE_COST_CREDITS = 10;

/** Cost per optional feature (hierarchical, controversy, claims) */
const FEATURE_COST_CREDITS = 5;

// ============================================================================
// TYPE GUARDS (Strict Type Safety)
// ============================================================================

/**
 * Type guard: Check if value is an Error instance
 * Avoids unsafe 'as Error' casts in catch blocks
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safely extract error message from unknown catch value
 * @param error - Unknown error from catch block
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Type guard: Check if paper has valid year
 * Used for controversy analysis which requires year as number
 */
function hasValidYear(paper: ThematizationPaperInput): paper is ThematizationPaperInput & { year: number } {
  return typeof paper.year === 'number';
}

// ============================================================================
// METHODOLOGY REPORT INTERFACE (Strict Typing)
// ============================================================================

/**
 * Methodology report structure from core pipeline
 * Avoids unsafe 'as' cast on coreResult.methodology
 */
interface MethodologyReport {
  readonly coherence?: number;
  readonly avgConfidence?: number;
}

/**
 * Type guard: Check if value is a valid methodology report
 */
function isMethodologyReport(value: unknown): value is MethodologyReport {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // Optional fields must be undefined or numbers
  if (obj.coherence !== undefined && typeof obj.coherence !== 'number') {
    return false;
  }
  if (obj.avgConfidence !== undefined && typeof obj.avgConfidence !== 'number') {
    return false;
  }
  return true;
}

// ============================================================================
// QUALITY METRICS CONSTANTS
// ============================================================================

/** Fallback average theme coherence when methodology report unavailable */
const FALLBACK_AVG_COHERENCE = 0.7;

/** Fallback average confidence when methodology report unavailable */
const FALLBACK_AVG_CONFIDENCE = 0.8;

// ============================================================================
// STAGE TIMING WEIGHT CONSTANTS
// ============================================================================

/** Familiarization stage weight (25% of core pipeline) */
const STAGE_WEIGHT_FAMILIARIZATION = 0.25;

/** Initial coding stage weight (15% of core pipeline) */
const STAGE_WEIGHT_INITIAL_CODING = 0.15;

/** Theme generation stage weight (25% of core pipeline) */
const STAGE_WEIGHT_THEME_GENERATION = 0.25;

/** Theme review stage weight (12% of core pipeline) */
const STAGE_WEIGHT_THEME_REVIEW = 0.12;

/** Theme refinement stage weight (12% of core pipeline) */
const STAGE_WEIGHT_THEME_REFINEMENT = 0.12;

/** Provenance stage weight (11% of core pipeline) */
const STAGE_WEIGHT_PROVENANCE = 0.11;

// ============================================================================
// HIERARCHICAL EXTRACTION CONSTANTS
// ============================================================================

/** Default minimum meta-themes to extract */
const DEFAULT_MIN_META_THEMES = 5;

/** Divisor for calculating min meta-themes from theme count */
const META_THEME_DIVISOR = 3;

/** Default maximum meta-themes to extract */
const DEFAULT_MAX_META_THEMES = 8;

/** Minimum sub-themes per meta-theme */
const MIN_SUB_THEMES_PER_META = 2;

/** Minimum papers per cluster for hierarchical extraction */
const MIN_PAPERS_PER_CLUSTER = 2;

/** Default coherence threshold for hierarchical clustering */
const HIERARCHICAL_COHERENCE_THRESHOLD = 0.3;

// ============================================================================
// CLAIM EXTRACTION CONSTANTS
// ============================================================================

/** Maximum claims to extract per paper */
const MAX_CLAIMS_PER_PAPER = 3;

/** Minimum confidence for claim acceptance */
const MIN_CLAIM_CONFIDENCE = 0.5;

/** Minimum statement potential for claim acceptance */
const MIN_STATEMENT_POTENTIAL = 0.4;

/** Expected proportion for balanced perspectives (1/3 each) */
const EXPECTED_PERSPECTIVE_PROPORTION = 1 / 3;

/** Maximum deviation for perspective balance calculation */
const MAX_PERSPECTIVE_DEVIATION = 2;

// ============================================================================
// JOB MANAGEMENT CONSTANTS
// ============================================================================

/** Maximum active jobs to track in memory */
const MAX_ACTIVE_JOBS_CACHE = 100;

/** Default tier when not specified */
const DEFAULT_TIER: ThematizationTierCount = 100;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class UnifiedThematizationService {
  private readonly logger = new Logger(UnifiedThematizationService.name);

  // Active job tracking
  private readonly activeJobs = new Map<string, ThematizationJobStatus>();

  constructor(
    // Core pipeline (Braun & Clarke 6-stage)
    // Reference: unified-theme-extraction.service.ts
    private readonly coreExtractionService: UnifiedThemeExtractionService,

    // Week 2: Theme-Fit scoring
    // Reference: theme-fit-scoring.service.ts
    private readonly themeFitService: ThemeFitScoringService,

    // Week 3: Hierarchical extraction
    // Reference: meta-theme-discovery.service.ts
    private readonly hierarchicalService: MetaThemeDiscoveryService,

    // Week 4: Controversy analysis
    // Reference: citation-controversy.service.ts
    private readonly controversyService: CitationControversyService,

    // Week 5: Claim extraction
    // Reference: claim-extraction.service.ts
    private readonly claimService: ClaimExtractionService,

    // Week 6: Pricing service (for auto-deduct feature)
    // Reference: thematization-pricing.service.ts
    private readonly pricingService: ThematizationPricingService,

    // Week 7: WebSocket progress service
    // Reference: thematization-progress.service.ts
    private readonly progressService: ThematizationProgressService,

    // Week 8: Metrics tracking service
    // Reference: thematization-metrics.service.ts
    private readonly metricsService: ThematizationMetricsService,

    // Week 8: Result caching service
    // Reference: thematization-cache.service.ts
    private readonly cacheService: ThematizationCacheService,
  ) {
    this.logger.log('✅ [UnifiedThematization] Service initialized');
    this.logger.log('   Orchestrates: Week 2 (Theme-Fit), Week 3 (Hierarchical),');
    this.logger.log('                 Week 4 (Controversy), Week 5 (Claims)');
    this.logger.log('   Core: Braun & Clarke 6-stage pipeline');
    this.logger.log('   Pricing: Auto-deduct credits enabled');
    this.logger.log('   Progress: WebSocket emission enabled');
    this.logger.log('   Metrics: Prometheus tracking enabled');
    this.logger.log('   Cache: Result caching enabled');
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Execute the full thematization pipeline
   *
   * Orchestrates all Phase 10.113 enhancements with the core
   * Braun & Clarke 6-stage pipeline.
   *
   * @param papers - Papers to analyze
   * @param config - Pipeline configuration
   * @param progressCallback - Optional progress callback
   * @param signal - Optional AbortSignal for cancellation
   * @returns Complete pipeline result
   */
  async executeThematizationPipeline(
    papers: readonly ThematizationPaperInput[],
    config: ThematizationPipelineConfig,
    progressCallback?: ThematizationProgressCallback,
    signal?: AbortSignal,
  ): Promise<ThematizationPipelineResult> {
    const requestId = config.requestId || crypto.randomUUID();
    const startTime = new Date();
    const warnings: string[] = [];

    this.logger.log(
      `🚀 [UnifiedThematization] Starting pipeline for topic "${config.topic}"`,
    );
    this.logger.log(
      `   Papers: ${papers.length}, Tier: ${config.tier}, RequestId: ${requestId}`,
    );

    // Week 8: Check cache before processing
    const tier = config.tier ?? DEFAULT_TIER;
    const flags = config.flags ?? DEFAULT_PIPELINE_FLAGS;
    const paperIds = papers.map(p => p.id);
    const cacheKey = this.cacheService.generateCacheKey(config.topic, paperIds, tier, flags);

    const cacheResult = this.cacheService.get(cacheKey, tier);
    if (cacheResult.hit && cacheResult.result) {
      // Week 8: Track cache hit in metrics (separate from job count)
      this.metricsService.recordCacheHit(tier);
      this.logger.log(`✅ [Cache] HIT - Returning cached result for ${cacheKey.substring(0, 8)}...`);
      return cacheResult.result;
    }

    // Week 8: Record metrics job start
    this.metricsService.recordJobStart(tier);

    // Initialize job tracking
    this.updateJobStatus(requestId, {
      requestId,
      userId: config.userId,
      status: 'running',
      currentStage: ThematizationPipelineStage.INITIALIZING,
      progress: 0,
      message: 'Initializing pipeline...',
      startTime,
    });

    // Week 7: Initialize WebSocket progress tracking
    if (config.userId) {
      this.progressService.initializeProgress({
        userId: config.userId,
        requestId,
        tier: config.tier ?? DEFAULT_TIER,
        totalPapers: papers.length,
        startTimeMs: startTime.getTime(),
      });
    }

    try {
      // ========================================================================
      // STAGE 1: INITIALIZE
      // ========================================================================
      this.emitProgress(
        progressCallback,
        ThematizationPipelineStage.INITIALIZING,
        0,
        'Validating input and preparing pipeline...',
      );

      // Week 7: WebSocket progress emission
      this.emitWebSocketProgress(
        requestId,
        config.userId,
        ThematizationPipelineStage.INITIALIZING,
        50,
        'Validating input and preparing pipeline...',
      );

      // Validate config
      const mergedConfig = this.validateAndMergeConfig(config);
      const tierConfig = getTierConfig(mergedConfig.tier);

      // ========================================================================
      // PRE-CHECK: Affordability (Week 6 - Auto-Deduct Feature)
      // ========================================================================
      if (mergedConfig.autoDeductCredits && mergedConfig.userId) {
        const affordability = this.pricingService.canAfford(
          mergedConfig.userId,
          mergedConfig.tier,
          mergedConfig.flags,
        );

        if (!affordability.canAfford) {
          throw new Error(
            affordability.reason ||
            `Insufficient credits: ${affordability.availableCredits} available, ` +
            `${affordability.requiredCredits} required`,
          );
        }

        this.logger.log(
          `💳 [Pricing] User ${mergedConfig.userId} pre-authorized for ` +
          `${affordability.requiredCredits} credits`,
        );
      }

      // Validate papers
      const validatedPapers = this.validatePapers(papers, warnings);
      if (validatedPapers.length < MIN_PAPERS_FOR_ANALYSIS) {
        throw new Error(
          `Insufficient valid papers: ${validatedPapers.length} ` +
          `(minimum: ${MIN_PAPERS_FOR_ANALYSIS})`,
        );
      }

      // Limit to tier max
      const limitedPapers = validatedPapers.slice(0, tierConfig.paperCount);
      if (validatedPapers.length > tierConfig.paperCount) {
        warnings.push(
          `Papers limited from ${validatedPapers.length} to ${tierConfig.paperCount} (tier limit)`,
        );
      }

      this.checkCancellation(signal);

      // Stage timings map
      const stageTimings = new Map<ThematizationPipelineStage, number>();
      let stageStart = Date.now();

      stageTimings.set(
        ThematizationPipelineStage.INITIALIZING,
        Date.now() - stageStart,
      );

      // ========================================================================
      // STAGE 2: THEME-FIT SCORING (Week 2 - Optional)
      // Reference: ThemeFitScoringService.scorePapers()
      // ========================================================================
      let filteredPapers = limitedPapers;
      let papersAfterThemeFitFilter = limitedPapers.length;

      if (mergedConfig.flags.enableThemeFitFilter) {
        stageStart = Date.now();
        this.emitProgress(
          progressCallback,
          ThematizationPipelineStage.THEME_FIT_SCORING,
          0,
          'Calculating theme-fit relevance scores...',
        );

        // Week 7: WebSocket progress
        this.emitWebSocketProgress(
          requestId,
          config.userId,
          ThematizationPipelineStage.THEME_FIT_SCORING,
          0,
          'Calculating theme-fit relevance scores...',
          { papersProcessed: 0, currentOperation: 'Scoring paper relevance' },
        );

        this.logger.log(`📊 [Week 2] Theme-Fit scoring for ${limitedPapers.length} papers`);

        try {
          // Score papers for relevance using ThemeFitScoringService
          // Reference: theme-fit-scoring.service.ts - calculateThemeFitScoresBatch()
          // Paper interface requires: source (LiteratureSource), authors (string[])
          const themeFitPapers = limitedPapers.map(p => ({
            id: p.id,
            title: p.title,
            abstract: p.abstract ?? '',
            keywords: p.keywords ? [...p.keywords] : [],
            citationCount: p.citationCount ?? 0,
            year: p.year ?? new Date().getFullYear(),
            authors: p.authors ? [...p.authors] : [],
            hasFullText: Boolean(p.fullText),
            source: LiteratureSource.SEMANTIC_SCHOLAR, // Default source for Paper interface compatibility
          }));
          const scoredPapers = this.themeFitService.calculateThemeFitScoresBatch(themeFitPapers);

          // Filter by minimum score (O(n) lookup via Map)
          const minScore = mergedConfig.flags.themeFitMinScore;
          const scoreMap = new Map(scoredPapers.map(s => [s.id, s]));
          filteredPapers = limitedPapers.filter(paper => {
            const scored = scoreMap.get(paper.id);
            return scored && scored.themeFitScore && scored.themeFitScore.overallThemeFit >= minScore;
          });

          papersAfterThemeFitFilter = filteredPapers.length;

          this.logger.log(
            `   Filtered: ${limitedPapers.length} → ${filteredPapers.length} ` +
            `(threshold: ${minScore})`,
          );

          if (filteredPapers.length < MIN_PAPERS_FOR_ANALYSIS) {
            warnings.push(
              `Theme-Fit filter reduced papers below minimum. ` +
              `Using all ${limitedPapers.length} papers instead.`,
            );
            filteredPapers = limitedPapers;
            papersAfterThemeFitFilter = limitedPapers.length;
          }
        } catch (error: unknown) {
          const errorMsg = getErrorMessage(error);
          warnings.push(`Theme-Fit scoring failed: ${errorMsg}. Skipping filter.`);
          this.logger.warn(`⚠️ [Week 2] Theme-Fit failed: ${errorMsg}`);
        }

        stageTimings.set(
          ThematizationPipelineStage.THEME_FIT_SCORING,
          Date.now() - stageStart,
        );

        this.checkCancellation(signal);
      }

      // ========================================================================
      // STAGE 3-8: CORE BRAUN & CLARKE PIPELINE
      // Reference: UnifiedThemeExtractionService.extractThemesAcademic()
      // DO NOT duplicate - delegate to the existing service
      // ========================================================================
      stageStart = Date.now();
      this.emitProgress(
        progressCallback,
        ThematizationPipelineStage.BC_FAMILIARIZATION,
        0,
        'Starting Braun & Clarke 6-stage analysis...',
      );

      // Week 7: WebSocket progress
      this.emitWebSocketProgress(
        requestId,
        config.userId,
        ThematizationPipelineStage.BC_FAMILIARIZATION,
        0,
        'Starting Braun & Clarke 6-stage analysis...',
        { papersProcessed: 0, currentOperation: 'Generating embeddings' },
      );

      this.logger.log(
        `📚 [Core] Braun & Clarke pipeline for ${filteredPapers.length} papers`,
      );

      // Convert papers to format expected by core service
      // Reference: SourceContent interface in unified-theme-extraction.types.ts
      // type is SourceTypeUnion: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram'
      // contentSource is: 'full-text' | 'abstract' | 'none'
      const coreSourceContents = filteredPapers.map(paper => ({
        id: paper.id,
        type: 'paper' as const,
        title: paper.title,
        content: paper.fullText || paper.abstract || paper.title,
        contentSource: (paper.fullText ? 'full-text' : paper.abstract ? 'abstract' : 'none') as 'full-text' | 'abstract' | 'none',
        keywords: paper.keywords ? [...paper.keywords] : [],
        authors: paper.authors ? [...paper.authors] : [],
        year: paper.year,
      }));

      // Execute core pipeline
      // This internally handles all 6 stages with progress tracking
      let coreThemes: ThematizationTheme[] = [];
      let coreQualityMetrics = {
        avgThemeCoherence: 0,
        avgThemeConfidence: 0,
      };

      if (mergedConfig.flags.useBraunClarkePipeline) {
        try {
          // Reference: unified-theme-extraction.service.ts - extractThemesAcademic()
          // Signature: extractThemesAcademic(sources, options, progressCallback?)
          // AcademicExtractionOptions: purpose, maxThemes, validationLevel, methodology, userId
          const coreResult = await this.coreExtractionService.extractThemesAcademic(
            coreSourceContents,
            {
              purpose: ResearchPurpose.Q_METHODOLOGY,
              maxThemes: tierConfig.maxThemes,
              validationLevel: 'rigorous',
              methodology: 'reflexive_thematic',
              userId: config.userId,
              requestId,
            },
          );

          // Convert core themes to our format
          // UnifiedTheme has: id, label, description, keywords, weight, controversial,
          // confidence, sources[], provenance, extractedAt, extractionModel
          coreThemes = (coreResult.themes || []).map(theme => this.convertCoreTheme(theme));

          // Extract quality metrics from methodology report (strict type guard)
          const methodology = isMethodologyReport(coreResult.methodology)
            ? coreResult.methodology
            : undefined;

          coreQualityMetrics = {
            avgThemeCoherence: methodology?.coherence ?? FALLBACK_AVG_COHERENCE,
            avgThemeConfidence: methodology?.avgConfidence ?? FALLBACK_AVG_CONFIDENCE,
          };

          this.logger.log(`   Extracted ${coreThemes.length} themes`);
        } catch (error: unknown) {
          throw new Error(`Core pipeline failed: ${getErrorMessage(error)}`);
        }
      }

      // Record core pipeline timing (all 6 stages combined)
      const corePipelineTime = Date.now() - stageStart;
      stageTimings.set(ThematizationPipelineStage.BC_FAMILIARIZATION, corePipelineTime * STAGE_WEIGHT_FAMILIARIZATION);
      stageTimings.set(ThematizationPipelineStage.BC_INITIAL_CODING, corePipelineTime * STAGE_WEIGHT_INITIAL_CODING);
      stageTimings.set(ThematizationPipelineStage.BC_THEME_GENERATION, corePipelineTime * STAGE_WEIGHT_THEME_GENERATION);
      stageTimings.set(ThematizationPipelineStage.BC_THEME_REVIEW, corePipelineTime * STAGE_WEIGHT_THEME_REVIEW);
      stageTimings.set(ThematizationPipelineStage.BC_THEME_REFINEMENT, corePipelineTime * STAGE_WEIGHT_THEME_REFINEMENT);
      stageTimings.set(ThematizationPipelineStage.BC_PROVENANCE, corePipelineTime * STAGE_WEIGHT_PROVENANCE);

      this.checkCancellation(signal);

      // ========================================================================
      // STAGE 9: HIERARCHICAL EXTRACTION (Week 3 - Optional)
      // Reference: MetaThemeDiscoveryService.discoverMetaThemes()
      // ========================================================================
      let metaThemesExtracted = 0;
      let subThemesExtracted = 0;

      if (mergedConfig.flags.enableHierarchicalExtraction && coreThemes.length > 0) {
        stageStart = Date.now();
        this.emitProgress(
          progressCallback,
          ThematizationPipelineStage.HIERARCHICAL_EXTRACTION,
          0,
          'Organizing themes into hierarchy...',
        );

        // Week 7: WebSocket progress
        this.emitWebSocketProgress(
          requestId,
          config.userId,
          ThematizationPipelineStage.HIERARCHICAL_EXTRACTION,
          0,
          'Organizing themes into hierarchy...',
          { themesFound: coreThemes.length, currentOperation: 'Building meta-theme hierarchy' },
        );

        this.logger.log(`🏗️ [Week 3] Hierarchical extraction from ${coreThemes.length} themes`);

        try {
          // Reference: meta-theme-discovery.service.ts - extractHierarchicalThemes()
          const hierarchyResult = await this.hierarchicalService.extractHierarchicalThemes(
            filteredPapers.map(p => ({
              id: p.id,
              title: p.title,
              abstract: p.abstract,
              themeFitScore: p.themeFitScore,
            })),
            {
              minMetaThemes: Math.min(DEFAULT_MIN_META_THEMES, Math.ceil(coreThemes.length / META_THEME_DIVISOR)),
              maxMetaThemes: Math.min(DEFAULT_MAX_META_THEMES, coreThemes.length),
              minSubThemesPerMeta: MIN_SUB_THEMES_PER_META,
              maxSubThemesPerMeta: tierConfig.maxSubThemes,
              minPapersPerCluster: MIN_PAPERS_PER_CLUSTER,
              coherenceThreshold: HIERARCHICAL_COHERENCE_THRESHOLD,
              useAILabeling: true,
              detectControversies: mergedConfig.flags.enableControversyAnalysis,
            },
          );

          // Update themes with hierarchical data
          metaThemesExtracted = hierarchyResult.metaThemes.length;
          subThemesExtracted = hierarchyResult.metaThemes.reduce(
            (sum: number, mt: { subThemes: readonly unknown[] }) => sum + mt.subThemes.length,
            0,
          );

          this.logger.log(
            `   Created ${metaThemesExtracted} meta-themes with ${subThemesExtracted} sub-themes`,
          );
        } catch (error: unknown) {
          const errorMsg = getErrorMessage(error);
          warnings.push(`Hierarchical extraction failed: ${errorMsg}`);
          this.logger.warn(`⚠️ [Week 3] Hierarchical extraction failed: ${errorMsg}`);
        }

        stageTimings.set(
          ThematizationPipelineStage.HIERARCHICAL_EXTRACTION,
          Date.now() - stageStart,
        );

        this.checkCancellation(signal);
      }

      // ========================================================================
      // STAGE 10: CONTROVERSY ANALYSIS (Week 4 - Optional)
      // Reference: CitationControversyService.analyzeControversy()
      // ========================================================================
      let topicControversyScore: number | undefined;
      let controversialThemes = 0;
      let citationCampsDetected = 0;
      let debatePapersIdentified = 0;
      let debatePapers: ThematizationPipelineResult['debatePapers'];

      if (mergedConfig.flags.enableControversyAnalysis && coreThemes.length > 0) {
        stageStart = Date.now();
        this.emitProgress(
          progressCallback,
          ThematizationPipelineStage.CONTROVERSY_ANALYSIS,
          0,
          'Analyzing citation patterns for controversy...',
        );

        // Week 7: WebSocket progress
        this.emitWebSocketProgress(
          requestId,
          config.userId,
          ThematizationPipelineStage.CONTROVERSY_ANALYSIS,
          0,
          'Analyzing citation patterns for controversy...',
          { papersProcessed: filteredPapers.length, currentOperation: 'Detecting citation camps' },
        );

        this.logger.log(`🔥 [Week 4] Controversy analysis for ${filteredPapers.length} papers`);

        try {
          // Reference: citation-controversy.service.ts - analyzeCitationControversy()
          // Filter papers with valid year using type guard (strict typing)
          const papersWithYear = filteredPapers.filter(hasValidYear);
          const controversyResult = await this.controversyService.analyzeCitationControversy(
            papersWithYear.map(p => ({
              id: p.id,
              title: p.title,
              abstract: p.abstract || '',
              year: p.year, // Type-safe: hasValidYear guarantees year is number
              citationCount: p.citationCount || 0,
              references: p.references ? [...p.references] : [],
              citedBy: p.citedBy ? [...p.citedBy] : [],
            })),
            mergedConfig.topic, // Topic is required for controversy analysis
          );

          // CitationControversyAnalysis uses topicControversyScore (not overallControversyScore)
          topicControversyScore = controversyResult.topicControversyScore;
          citationCampsDetected = controversyResult.camps?.length || 0;
          debatePapersIdentified = controversyResult.debatePapers?.length || 0;

          // Convert debate papers (DebatePaper has debateRole, not role)
          debatePapers = controversyResult.debatePapers?.map(dp => ({
            paperId: dp.paperId,
            title: dp.title,
            debateScore: dp.debateScore,
            role: dp.debateRole, // Map debateRole to role
          }));

          // Enrich themes with controversy data
          coreThemes = this.enrichThemesWithControversy(coreThemes, {
            topicControversyScore: controversyResult.topicControversyScore,
            camps: controversyResult.camps?.map(c => ({
              campId: c.id,
              label: c.label,
              paperIds: c.paperIds,
            })),
          });
          controversialThemes = coreThemes.filter(t => t.isControversial).length;

          const safeControversyScore = topicControversyScore ?? 0;
          this.logger.log(
            `   Controversy score: ${(safeControversyScore * 100).toFixed(1)}%, ` +
            `${citationCampsDetected} camps, ${debatePapersIdentified} debate papers`,
          );
        } catch (error: unknown) {
          const errorMsg = getErrorMessage(error);
          warnings.push(`Controversy analysis failed: ${errorMsg}`);
          this.logger.warn(`⚠️ [Week 4] Controversy analysis failed: ${errorMsg}`);
        }

        stageTimings.set(
          ThematizationPipelineStage.CONTROVERSY_ANALYSIS,
          Date.now() - stageStart,
        );

        this.checkCancellation(signal);
      }

      // ========================================================================
      // STAGE 11: CLAIM EXTRACTION (Week 5 - Optional)
      // Reference: ClaimExtractionService.extractClaims()
      // ========================================================================
      let claims: ThematizationClaim[] = [];
      let claimsExtracted = 0;
      let avgClaimPotential = 0;
      let highQualityClaims = 0;
      let perspectiveBalance = 0;

      if (mergedConfig.flags.enableClaimExtraction && coreThemes.length > 0) {
        stageStart = Date.now();
        this.emitProgress(
          progressCallback,
          ThematizationPipelineStage.CLAIM_EXTRACTION,
          0,
          'Extracting claims for Q-sort statements...',
        );

        // Week 7: WebSocket progress
        this.emitWebSocketProgress(
          requestId,
          config.userId,
          ThematizationPipelineStage.CLAIM_EXTRACTION,
          0,
          'Extracting claims for Q-sort statements...',
          { themesFound: coreThemes.length, currentOperation: 'Generating Q-sort statements' },
        );

        this.logger.log(`📝 [Week 5] Claim extraction from ${filteredPapers.length} papers`);

        try {
          // Process claims for each theme (O(n) lookup via Set)
          for (const theme of coreThemes) {
            const themePaperIdSet = new Set(theme.paperIds);
            const themePapers = filteredPapers.filter(p =>
              themePaperIdSet.has(p.id),
            );

            if (themePapers.length === 0) continue;

            // Build theme context for claim extraction
            const themeContext: ClaimExtractionThemeContext = {
              id: theme.id,
              label: theme.label,
              description: theme.description,
              keywords: [...theme.keywords],
            };

            // Convert papers to claim extraction format
            const claimPapers: ClaimExtractionPaperInput[] = themePapers.map(p => ({
              id: p.id,
              title: p.title,
              abstract: p.abstract || '',
              year: p.year,
              authors: p.authors ? [...p.authors] : undefined,
              keywords: p.keywords ? [...p.keywords] : undefined,
              themeId: theme.id,
            }));

            // Extract claims
            const claimResult = await this.claimService.extractClaims(
              claimPapers,
              themeContext,
              {
                maxClaimsPerPaper: MAX_CLAIMS_PER_PAPER,
                maxTotalClaims: Math.ceil(tierConfig.maxClaims / coreThemes.length),
                minConfidence: MIN_CLAIM_CONFIDENCE,
                minStatementPotential: MIN_STATEMENT_POTENTIAL,
              },
            );

            // Convert claims to our format
            const themeClaims = claimResult.claims.map(claim =>
              this.convertClaim(claim, theme.id),
            );

            claims.push(...themeClaims);

            // Aggregate metrics
            if (claimResult.qualityMetrics) {
              highQualityClaims += claimResult.qualityMetrics.highQualityClaims;
            }
          }

          claimsExtracted = claims.length;
          avgClaimPotential = claims.length > 0
            ? claims.reduce((sum, c) => sum + c.statementPotential, 0) / claims.length
            : 0;

          // Calculate perspective balance
          const perspectives = { supportive: 0, critical: 0, neutral: 0 };
          for (const claim of claims) {
            perspectives[claim.perspective]++;
          }
          const total = claims.length || 1;
          const deviation = Object.values(perspectives).reduce(
            (sum, count) => sum + Math.abs(count / total - EXPECTED_PERSPECTIVE_PROPORTION),
            0,
          );
          perspectiveBalance = 1 - deviation / MAX_PERSPECTIVE_DEVIATION;

          this.logger.log(
            `   Extracted ${claimsExtracted} claims, ` +
            `avg potential: ${(avgClaimPotential * 100).toFixed(1)}%`,
          );
        } catch (error: unknown) {
          const errorMsg = getErrorMessage(error);
          warnings.push(`Claim extraction failed: ${errorMsg}`);
          this.logger.warn(`⚠️ [Week 5] Claim extraction failed: ${errorMsg}`);
        }

        stageTimings.set(
          ThematizationPipelineStage.CLAIM_EXTRACTION,
          Date.now() - stageStart,
        );

        this.checkCancellation(signal);
      }

      // ========================================================================
      // STAGE 12: FINALIZE
      // ========================================================================
      stageStart = Date.now();
      this.emitProgress(
        progressCallback,
        ThematizationPipelineStage.FINALIZING,
        0,
        'Compiling results and quality metrics...',
      );

      // Week 7: WebSocket progress
      this.emitWebSocketProgress(
        requestId,
        config.userId,
        ThematizationPipelineStage.FINALIZING,
        50,
        'Compiling results and quality metrics...',
        { themesFound: coreThemes.length, claimsExtracted, currentOperation: 'Building final report' },
      );

      const endTime = new Date();
      const processingTimeMs = endTime.getTime() - startTime.getTime();

      stageTimings.set(ThematizationPipelineStage.FINALIZING, Date.now() - stageStart);

      // Build quality metrics
      const qualityMetrics: ThematizationQualityMetrics = {
        totalPapersInput: papers.length,
        papersAfterThemeFitFilter,
        papersWithAbstracts: filteredPapers.filter(p => p.abstract).length,
        papersWithFullText: filteredPapers.filter(p => p.fullText).length,
        themesExtracted: coreThemes.length,
        avgThemeCoherence: coreQualityMetrics.avgThemeCoherence,
        avgThemeConfidence: coreQualityMetrics.avgThemeConfidence,
        metaThemesExtracted: metaThemesExtracted || undefined,
        subThemesExtracted: subThemesExtracted || undefined,
        avgSubThemesPerMeta: metaThemesExtracted > 0
          ? subThemesExtracted / metaThemesExtracted
          : undefined,
        controversialThemes: controversialThemes || undefined,
        citationCampsDetected: citationCampsDetected || undefined,
        debatePapersIdentified: debatePapersIdentified || undefined,
        claimsExtracted: claimsExtracted || undefined,
        avgClaimPotential: avgClaimPotential || undefined,
        highQualityClaims: highQualityClaims || undefined,
        perspectiveBalance: perspectiveBalance || undefined,
        processingTimeMs,
        stageTimings,
      };

      // ========================================================================
      // AUTO-DEDUCT CREDITS (Week 6 - On Successful Completion)
      // ========================================================================
      let creditsDeducted: number | undefined;
      let creditsRemaining: number | undefined;

      if (mergedConfig.autoDeductCredits && mergedConfig.userId) {
        try {
          // Get cost estimate first to know the actual job cost
          const costEstimate = this.pricingService.calculateDetailedCost(
            mergedConfig.tier,
            mergedConfig.flags,
            mergedConfig.userId,
          );

          const usageAfter = this.pricingService.deductCredits(
            mergedConfig.userId,
            mergedConfig.tier,
            mergedConfig.flags,
          );

          creditsDeducted = costEstimate.finalCost; // Actual job cost, not cumulative
          creditsRemaining = usageAfter.creditsRemaining;

          this.logger.log(
            `💰 [Pricing] Deducted ${creditsDeducted} credits for user ${mergedConfig.userId}. ` +
            `Remaining: ${creditsRemaining}`,
          );
        } catch (deductError: unknown) {
          // Credit deduction failure should not fail the pipeline
          // Add warning instead of throwing
          const deductErrorMsg = getErrorMessage(deductError);
          warnings.push(`Credit deduction failed: ${deductErrorMsg}`);
          this.logger.warn(`⚠️ [Pricing] Credit deduction failed: ${deductErrorMsg}`);
        }
      }

      // Build result
      const result: ThematizationPipelineResult = {
        requestId,
        topic: mergedConfig.topic,
        tier: mergedConfig.tier,
        config: mergedConfig,
        themes: coreThemes,
        claims: claims.length > 0 ? claims : undefined,
        topicControversyScore,
        debatePapers,
        qualityMetrics,
        startTime,
        endTime,
        warnings,
        creditsDeducted,
        creditsRemaining,
      };

      // Update job status
      this.updateJobStatus(requestId, {
        requestId,
        userId: config.userId,
        status: 'completed',
        currentStage: ThematizationPipelineStage.COMPLETE,
        progress: 100,
        message: 'Pipeline completed successfully',
        startTime,
      });

      this.emitProgress(
        progressCallback,
        ThematizationPipelineStage.COMPLETE,
        100,
        `Pipeline complete: ${coreThemes.length} themes, ${claimsExtracted} claims`,
      );

      // Week 7: WebSocket completion emission
      this.emitWebSocketComplete(
        requestId,
        config.userId,
        coreThemes.length,
        claimsExtracted > 0 ? claimsExtracted : undefined,
      );

      this.logger.log(
        `✅ [UnifiedThematization] Complete in ${processingTimeMs}ms: ` +
        `${coreThemes.length} themes, ${claimsExtracted} claims`,
      );

      // Week 8: Record metrics for successful completion
      const stageTimingsArray: StageTiming[] = Array.from(stageTimings.entries()).map(
        ([stage, durationMs]) => ({ stage, durationMs }),
      );

      const jobMetrics: ThematizationJobMetrics = {
        requestId,
        tier: mergedConfig.tier,
        status: 'completed',
        papersProcessed: filteredPapers.length,
        themesExtracted: coreThemes.length,
        claimsExtracted,
        creditsConsumed: creditsDeducted ?? 0,
        subscription: this.getUserSubscription(config.userId),
        totalDurationMs: processingTimeMs,
        stageTimings: stageTimingsArray,
        avgThemeConfidence: coreQualityMetrics.avgThemeConfidence,
        avgClaimPotential,
      };
      this.metricsService.recordJobCompletion(jobMetrics);

      // Week 8: Store result in cache
      this.cacheService.set(cacheKey, result);

      return result;

    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);

      this.updateJobStatus(requestId, {
        requestId,
        userId: config.userId,
        status: 'failed',
        currentStage: ThematizationPipelineStage.INITIALIZING,
        progress: 0,
        message: 'Pipeline failed',
        startTime,
        error: errorMsg,
      });

      // Week 7: WebSocket error emission
      this.emitWebSocketError(requestId, config.userId, errorMsg);

      // Week 8: Record error metrics
      const errorType = this.classifyError(error);
      this.metricsService.recordError(
        errorType,
        ThematizationPipelineStage.INITIALIZING,
        tier,
      );

      this.logger.error(`❌ [UnifiedThematization] Failed: ${errorMsg}`);
      // Re-throw as Error with proper message
      throw isError(error) ? error : new Error(errorMsg);
    }
  }

  /**
   * Get cost estimate for a thematization job
   */
  estimateCost(config: Partial<ThematizationPipelineConfig>): ThematizationCostEstimate {
    const tier = config.tier ?? DEFAULT_TIER;
    // Validate tier before using (strict typing - no unsafe cast)
    if (!isValidTier(tier)) {
      throw new Error(`Invalid tier: ${tier}. Valid tiers: 50, 100, 150, 200, 250, 300`);
    }
    const tierConfig = getTierConfig(tier);
    const flags = config.flags ?? DEFAULT_PIPELINE_FLAGS;

    let totalFeatureCost = 0;
    let hierarchicalCost: number | undefined;
    let controversyCost: number | undefined;
    let claimCost: number | undefined;

    if (flags.enableHierarchicalExtraction) {
      hierarchicalCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    if (flags.enableControversyAnalysis) {
      controversyCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    if (flags.enableClaimExtraction) {
      claimCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    const featureCosts: ThematizationCostEstimate['featureCosts'] = {
      hierarchicalExtraction: hierarchicalCost,
      controversyAnalysis: controversyCost,
      claimExtraction: claimCost,
    };

    const baseCost = BASE_COST_CREDITS * tierConfig.priceMultiplier;
    const totalCost = baseCost + totalFeatureCost;

    return {
      tier,
      baseCost,
      tierMultiplier: tierConfig.priceMultiplier,
      featureCosts,
      totalCost,
      estimatedTimeSeconds: tierConfig.estimatedTimeSeconds,
    };
  }

  /**
   * Get job status
   */
  getJobStatus(requestId: string): ThematizationJobStatus | undefined {
    return this.activeJobs.get(requestId);
  }

  /**
   * Cancel a running job
   */
  cancelJob(requestId: string): boolean {
    const job = this.activeJobs.get(requestId);
    if (!job || job.status !== 'running') {
      return false;
    }

    this.updateJobStatus(requestId, {
      ...job,
      status: 'cancelled',
      message: 'Job cancelled by user',
    });

    return true;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate and merge configuration with defaults
   */
  private validateAndMergeConfig(
    config: ThematizationPipelineConfig,
  ): ThematizationPipelineConfig {
    if (!config.topic || config.topic.trim().length === 0) {
      throw new Error('Topic is required');
    }

    const tier = config.tier || DEFAULT_TIER;
    if (!isValidTier(tier)) {
      throw new Error(`Invalid tier: ${tier}. Valid tiers: 50, 100, 150, 200, 250, 300`);
    }

    return {
      ...config,
      tier,
      flags: {
        ...DEFAULT_PIPELINE_FLAGS,
        ...config.flags,
      },
    };
  }

  /**
   * Validate papers and filter invalid ones
   */
  private validatePapers(
    papers: readonly ThematizationPaperInput[],
    warnings: string[],
  ): ThematizationPaperInput[] {
    const valid: ThematizationPaperInput[] = [];
    let invalidCount = 0;

    for (const paper of papers) {
      if (!isValidPaperInput(paper)) {
        invalidCount++;
        continue;
      }

      if (!paper.abstract && !paper.fullText) {
        invalidCount++;
        continue;
      }

      if (paper.abstract && paper.abstract.length < MIN_ABSTRACT_LENGTH) {
        invalidCount++;
        continue;
      }

      valid.push(paper);
    }

    if (invalidCount > 0) {
      warnings.push(`Filtered ${invalidCount} papers with missing/invalid content`);
    }

    return valid;
  }

  /**
   * Convert UnifiedTheme to ThematizationTheme
   * Reference: UnifiedTheme in unified-theme-extraction.types.ts has:
   *   id, label, description, keywords, weight, controversial, confidence,
   *   sources[], provenance, extractedAt, extractionModel
   */
  private convertCoreTheme(coreTheme: {
    id: string;
    label: string;
    description?: string;
    keywords: string[];
    weight: number;
    controversial: boolean;
    confidence: number;
    sources: Array<{ sourceId: string; influence: number }>;
  }): ThematizationTheme {
    // Extract paper IDs from sources array
    const paperIds = coreTheme.sources.map(s => s.sourceId);

    // Build provenance from sources
    const provenance = coreTheme.sources.map(s => ({
      paperId: s.sourceId,
      influence: s.influence,
    }));

    return {
      id: coreTheme.id,
      label: coreTheme.label,
      description: coreTheme.description,
      keywords: coreTheme.keywords,
      paperIds,
      weight: coreTheme.weight,
      coherenceScore: coreTheme.confidence, // Use confidence as coherence fallback
      confidence: coreTheme.confidence,
      provenance,
    };
  }

  /**
   * Convert claim to our format
   */
  private convertClaim(
    claim: {
      id: string;
      originalText: string;
      normalizedClaim: string;
      perspective: 'supportive' | 'critical' | 'neutral';
      statementPotential: number;
      confidence: number;
      sourcePapers: readonly string[];
    },
    themeId: string,
  ): ThematizationClaim {
    return {
      id: claim.id,
      themeId,
      originalText: claim.originalText,
      normalizedClaim: claim.normalizedClaim,
      perspective: claim.perspective,
      statementPotential: claim.statementPotential,
      confidence: claim.confidence,
      sourcePaperIds: claim.sourcePapers,
    };
  }

  /**
   * Enrich themes with controversy data
   */
  private enrichThemesWithControversy(
    themes: ThematizationTheme[],
    controversyResult: {
      topicControversyScore: number;
      camps?: readonly { campId: string; label: string; paperIds: readonly string[] }[];
    },
  ): ThematizationTheme[] {
    // Mark themes as controversial based on paper overlap with camps
    const camps = controversyResult.camps || [];
    const campPaperSets = camps.map(camp => ({
      ...camp,
      paperSet: new Set(camp.paperIds),
    }));

    return themes.map(theme => {
      const themePaperSet = new Set(theme.paperIds);

      // Find overlapping camps
      const overlappingCamps = campPaperSets.filter(camp => {
        const overlap = [...themePaperSet].filter(id => camp.paperSet.has(id));
        return overlap.length > 0;
      });

      const isControversial = overlappingCamps.length > 1;

      return {
        ...theme,
        isControversial,
        controversyScore: isControversial
          ? controversyResult.topicControversyScore
          : undefined,
        citationCamps: isControversial
          ? overlappingCamps.map(c => ({
              campId: c.campId,
              label: c.label,
              paperCount: c.paperIds.length,
            }))
          : undefined,
      };
    });
  }

  /**
   * Update job status
   */
  private updateJobStatus(requestId: string, status: ThematizationJobStatus): void {
    this.activeJobs.set(requestId, status);

    // Clean up old jobs (keep last MAX_ACTIVE_JOBS_CACHE)
    if (this.activeJobs.size > MAX_ACTIVE_JOBS_CACHE) {
      const oldestKey = this.activeJobs.keys().next().value;
      if (oldestKey) {
        this.activeJobs.delete(oldestKey);
      }
    }
  }

  /**
   * Emit progress update (callback-based)
   */
  private emitProgress(
    callback: ThematizationProgressCallback | undefined,
    stage: ThematizationPipelineStage,
    progress: number,
    message: string,
    details?: Record<string, unknown>,
  ): void {
    if (callback) {
      callback(stage, progress, message, details);
    }
  }

  /**
   * Emit progress update via WebSocket (Week 7)
   * Null-safe: Only emits if userId is provided
   */
  private emitWebSocketProgress(
    requestId: string,
    userId: string | undefined,
    stage: ThematizationPipelineStage,
    stageProgress: number,
    message: string,
    data?: {
      papersProcessed?: number;
      themesFound?: number;
      claimsExtracted?: number;
      currentOperation?: string;
    },
  ): void {
    if (!userId) {
      return;
    }

    this.progressService.emitStageProgress(
      requestId,
      stage,
      stageProgress,
      message,
      data,
    );
  }

  /**
   * Emit completion via WebSocket (Week 7)
   */
  private emitWebSocketComplete(
    requestId: string,
    userId: string | undefined,
    themesCount: number,
    claimsCount?: number,
  ): void {
    if (!userId) {
      return;
    }

    this.progressService.emitComplete(requestId, themesCount, claimsCount);
  }

  /**
   * Emit error via WebSocket (Week 7)
   */
  private emitWebSocketError(
    requestId: string,
    userId: string | undefined,
    message: string,
  ): void {
    if (!userId) {
      return;
    }

    this.progressService.emitError(requestId, userId, 'THEME001', message);
  }

  /**
   * Check for cancellation
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Pipeline cancelled by user');
    }
  }

  // ==========================================================================
  // WEEK 8: METRICS HELPER METHODS
  // ==========================================================================

  /**
   * Get user subscription tier for metrics
   * Falls back to 'FREE' if user not found or not provided
   */
  private getUserSubscription(userId: string | undefined): 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' {
    if (!userId) {
      return 'FREE';
    }
    // In production, this would look up from PricingService or database
    // For now, default to FREE - the pricing service tracks actual subscriptions
    try {
      const usage = this.pricingService.getUserUsage(userId);
      const subscription = usage.subscription.toUpperCase();
      if (subscription === 'FREE' || subscription === 'BASIC' || subscription === 'PRO' || subscription === 'ENTERPRISE') {
        return subscription;
      }
      return 'FREE';
    } catch {
      return 'FREE';
    }
  }

  /**
   * Classify error type for metrics
   */
  private classifyError(error: unknown): 'validation_error' | 'insufficient_credits' | 'service_error' | 'timeout_error' | 'cancellation' | 'unknown_error' {
    if (!isError(error)) {
      return 'unknown_error';
    }

    const message = error.message.toLowerCase();

    if (message.includes('cancel') || message.includes('abort')) {
      return 'cancellation';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout_error';
    }
    if (message.includes('credit') || message.includes('afford') || message.includes('insufficient')) {
      return 'insufficient_credits';
    }
    if (message.includes('valid') || message.includes('required') || message.includes('invalid')) {
      return 'validation_error';
    }

    return 'service_error';
  }
}
