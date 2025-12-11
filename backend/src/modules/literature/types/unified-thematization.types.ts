/**
 * Phase 10.113 Week 6: Unified Thematization Pipeline Types
 *
 * Netflix-grade types for the complete thematization orchestration layer.
 * This module orchestrates ALL Phase 10.113 enhancements with the existing
 * 6-stage Braun & Clarke waterfall pipeline.
 *
 * ============================================================================
 * ARCHITECTURE REFERENCE (For Future Developers)
 * ============================================================================
 *
 * EXISTING SYSTEMS (DO NOT DUPLICATE):
 * ------------------------------------
 * 1. UnifiedThemeExtractionService (unified-theme-extraction.service.ts)
 *    - Core 6-stage Braun & Clarke (2019) thematic analysis
 *    - Stages: Familiarization → Coding → Generation → Review → Refinement → Provenance
 *    - Entry points: extractThemesV2(), extractThemesAcademic()
 *    - ~4000 lines, battle-tested, production-ready
 *
 * 2. ThemeExtractionProgressService (theme-extraction-progress.service.ts)
 *    - 6-stage progress tracking with WebSocket emission
 *    - 4-part transparent messaging (Nielsen's Usability Heuristics)
 *    - Handles familiarization stats, failed paper tracking
 *
 * 3. ThemeExtractionService (theme-extraction.service.ts)
 *    - Legacy theme extraction with controversy detection
 *    - Integrates CitationControversyService for Week 4
 *    - Tier configurations (50-300 papers)
 *
 * PHASE 10.113 ENHANCEMENTS (This orchestrator integrates):
 * ---------------------------------------------------------
 * Week 2: ThemeFitScoringService - Relevance scoring for papers
 * Week 3: MetaThemeDiscoveryService - Hierarchical theme extraction
 * Week 4: CitationControversyService - Citation-based controversy analysis
 * Week 5: ClaimExtractionService - Q-sort statement generation
 *
 * ORCHESTRATION FLOW:
 * -------------------
 * 1. [PRE] Theme-Fit filtering (Week 2) - Optional relevance pre-filter
 * 2. [CORE] 6-Stage Braun & Clarke pipeline - Existing core extraction
 * 3. [ENH] Hierarchical extraction (Week 3) - Optional meta-theme grouping
 * 4. [ENH] Controversy analysis (Week 4) - Optional citation camp detection
 * 5. [POST] Claim extraction (Week 5) - Optional Q-sort statement generation
 *
 * @module UnifiedThematizationTypes
 * @since Phase 10.113 Week 6
 */

// ============================================================================
// THEMATIZATION TIER CONFIGURATION
// ============================================================================

/**
 * Paper count tiers for thematization analysis
 * Aligned with THEMATIZATION_TIERS in theme-extraction.service.ts
 */
export type ThematizationTierCount = 50 | 100 | 150 | 200 | 250 | 300;

/**
 * Thematization tier configuration
 * Defines limits and pricing for each paper count tier
 */
export interface ThematizationTierConfig {
  /** Number of papers in this tier */
  readonly paperCount: ThematizationTierCount;
  /** Maximum themes to extract */
  readonly maxThemes: number;
  /** Maximum sub-themes per meta-theme */
  readonly maxSubThemes: number;
  /** Price multiplier relative to base tier (50 papers = 1.0) */
  readonly priceMultiplier: number;
  /** Human-readable tier description */
  readonly description: string;
  /** Estimated processing time in seconds */
  readonly estimatedTimeSeconds: number;
  /** Maximum claims to extract for Q-sort */
  readonly maxClaims: number;
}

/**
 * All tier configurations
 * Reference: THEMATIZATION_TIERS in theme-extraction.service.ts
 */
export const THEMATIZATION_TIER_CONFIGS: Readonly<Record<ThematizationTierCount, ThematizationTierConfig>> = {
  50:  { paperCount: 50,  maxThemes: 5,  maxSubThemes: 15, priceMultiplier: 1.0, description: 'Quick Analysis',        estimatedTimeSeconds: 30,  maxClaims: 50 },
  100: { paperCount: 100, maxThemes: 7,  maxSubThemes: 25, priceMultiplier: 1.5, description: 'Standard Analysis',     estimatedTimeSeconds: 60,  maxClaims: 100 },
  150: { paperCount: 150, maxThemes: 10, maxSubThemes: 35, priceMultiplier: 2.0, description: 'Deep Analysis',         estimatedTimeSeconds: 90,  maxClaims: 150 },
  200: { paperCount: 200, maxThemes: 12, maxSubThemes: 40, priceMultiplier: 2.5, description: 'Comprehensive Analysis', estimatedTimeSeconds: 120, maxClaims: 200 },
  250: { paperCount: 250, maxThemes: 14, maxSubThemes: 50, priceMultiplier: 3.0, description: 'Expert Analysis',       estimatedTimeSeconds: 150, maxClaims: 250 },
  300: { paperCount: 300, maxThemes: 15, maxSubThemes: 60, priceMultiplier: 3.5, description: 'Full Research Analysis', estimatedTimeSeconds: 180, maxClaims: 300 },
} as const;

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

/**
 * Pipeline stage enable/disable flags
 * Controls which Phase 10.113 enhancements to run
 */
export interface ThematizationPipelineFlags {
  /**
   * Week 2: Enable Theme-Fit relevance pre-filtering
   * Uses: ThemeFitScoringService
   * Effect: Filters papers below relevance threshold before extraction
   * @default true
   */
  readonly enableThemeFitFilter: boolean;

  /**
   * Theme-Fit minimum score threshold (0-1)
   * Papers below this score are excluded
   * @default 0.3
   */
  readonly themeFitMinScore: number;

  /**
   * Week 3: Enable hierarchical theme extraction
   * Uses: MetaThemeDiscoveryService
   * Effect: Groups themes into meta-themes with sub-themes
   * @default true
   */
  readonly enableHierarchicalExtraction: boolean;

  /**
   * Week 4: Enable citation controversy analysis
   * Uses: CitationControversyService
   * Effect: Detects citation camps and debate papers
   * @default true
   */
  readonly enableControversyAnalysis: boolean;

  /**
   * Week 5: Enable claim extraction for Q-sort
   * Uses: ClaimExtractionService
   * Effect: Generates Q-methodology statements from themes
   * @default true
   */
  readonly enableClaimExtraction: boolean;

  /**
   * Use existing 6-stage Braun & Clarke pipeline
   * Reference: UnifiedThemeExtractionService.extractThemesV2()
   * @default true
   */
  readonly useBraunClarkePipeline: boolean;
}

/**
 * Default pipeline flags
 * All Phase 10.113 enhancements enabled by default
 */
export const DEFAULT_PIPELINE_FLAGS: Readonly<ThematizationPipelineFlags> = {
  enableThemeFitFilter: true,
  themeFitMinScore: 0.3,
  enableHierarchicalExtraction: true,
  enableControversyAnalysis: true,
  enableClaimExtraction: true,
  useBraunClarkePipeline: true,
} as const;

/**
 * Full thematization pipeline configuration
 */
export interface ThematizationPipelineConfig {
  /** Paper count tier */
  readonly tier: ThematizationTierCount;
  /** Pipeline stage flags */
  readonly flags: ThematizationPipelineFlags;
  /** Research topic for analysis */
  readonly topic: string;
  /** Optional topic description for better context */
  readonly topicDescription?: string;
  /** User ID for progress tracking */
  readonly userId?: string;
  /** Request ID for tracing */
  readonly requestId?: string;
  /**
   * Auto-deduct credits on successful completion
   * When true, credits are deducted via ThematizationPricingService
   * Requires userId to be set
   * @default false
   */
  readonly autoDeductCredits?: boolean;
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: Partial<ThematizationPipelineConfig> = {
  tier: 100,
  flags: DEFAULT_PIPELINE_FLAGS,
} as const;

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Pipeline execution stages
 * Maps to progress tracking and UI feedback
 */
export enum ThematizationPipelineStage {
  /** Initial validation and setup */
  INITIALIZING = 'INITIALIZING',
  /** Week 2: Theme-Fit relevance scoring */
  THEME_FIT_SCORING = 'THEME_FIT_SCORING',
  /** Core: Braun & Clarke Stage 1 - Familiarization */
  BC_FAMILIARIZATION = 'BC_FAMILIARIZATION',
  /** Core: Braun & Clarke Stage 2 - Initial Coding */
  BC_INITIAL_CODING = 'BC_INITIAL_CODING',
  /** Core: Braun & Clarke Stage 3 - Theme Generation */
  BC_THEME_GENERATION = 'BC_THEME_GENERATION',
  /** Core: Braun & Clarke Stage 4 - Theme Review */
  BC_THEME_REVIEW = 'BC_THEME_REVIEW',
  /** Core: Braun & Clarke Stage 5 - Theme Refinement */
  BC_THEME_REFINEMENT = 'BC_THEME_REFINEMENT',
  /** Core: Braun & Clarke Stage 6 - Provenance */
  BC_PROVENANCE = 'BC_PROVENANCE',
  /** Week 3: Hierarchical theme grouping */
  HIERARCHICAL_EXTRACTION = 'HIERARCHICAL_EXTRACTION',
  /** Week 4: Citation controversy analysis */
  CONTROVERSY_ANALYSIS = 'CONTROVERSY_ANALYSIS',
  /** Week 5: Claim extraction for Q-sort */
  CLAIM_EXTRACTION = 'CLAIM_EXTRACTION',
  /** Final validation and result compilation */
  FINALIZING = 'FINALIZING',
  /** Pipeline complete */
  COMPLETE = 'COMPLETE',
}

/**
 * Stage metadata for progress tracking
 */
export interface ThematizationStageInfo {
  readonly stage: ThematizationPipelineStage;
  readonly displayName: string;
  readonly description: string;
  /** Stage weight for progress calculation (total = 100) */
  readonly progressWeight: number;
  /** Which Phase 10.113 week this belongs to (0 = core) */
  readonly week: 0 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Stage metadata configuration
 */
export const PIPELINE_STAGE_INFO: Readonly<Record<ThematizationPipelineStage, ThematizationStageInfo>> = {
  [ThematizationPipelineStage.INITIALIZING]: {
    stage: ThematizationPipelineStage.INITIALIZING,
    displayName: 'Initializing',
    description: 'Validating input and preparing pipeline',
    progressWeight: 2,
    week: 6,
  },
  [ThematizationPipelineStage.THEME_FIT_SCORING]: {
    stage: ThematizationPipelineStage.THEME_FIT_SCORING,
    displayName: 'Theme-Fit Scoring',
    description: 'Calculating relevance scores for papers',
    progressWeight: 5,
    week: 2,
  },
  [ThematizationPipelineStage.BC_FAMILIARIZATION]: {
    stage: ThematizationPipelineStage.BC_FAMILIARIZATION,
    displayName: 'Familiarization',
    description: 'Reading papers and generating embeddings',
    progressWeight: 15,
    week: 0,
  },
  [ThematizationPipelineStage.BC_INITIAL_CODING]: {
    stage: ThematizationPipelineStage.BC_INITIAL_CODING,
    displayName: 'Initial Coding',
    description: 'Extracting concepts and patterns',
    progressWeight: 10,
    week: 0,
  },
  [ThematizationPipelineStage.BC_THEME_GENERATION]: {
    stage: ThematizationPipelineStage.BC_THEME_GENERATION,
    displayName: 'Theme Generation',
    description: 'Clustering concepts into themes',
    progressWeight: 15,
    week: 0,
  },
  [ThematizationPipelineStage.BC_THEME_REVIEW]: {
    stage: ThematizationPipelineStage.BC_THEME_REVIEW,
    displayName: 'Theme Review',
    description: 'Validating theme coherence',
    progressWeight: 8,
    week: 0,
  },
  [ThematizationPipelineStage.BC_THEME_REFINEMENT]: {
    stage: ThematizationPipelineStage.BC_THEME_REFINEMENT,
    displayName: 'Theme Refinement',
    description: 'Merging overlaps and generating labels',
    progressWeight: 8,
    week: 0,
  },
  [ThematizationPipelineStage.BC_PROVENANCE]: {
    stage: ThematizationPipelineStage.BC_PROVENANCE,
    displayName: 'Provenance',
    description: 'Calculating source influence',
    progressWeight: 7,
    week: 0,
  },
  [ThematizationPipelineStage.HIERARCHICAL_EXTRACTION]: {
    stage: ThematizationPipelineStage.HIERARCHICAL_EXTRACTION,
    displayName: 'Hierarchical Grouping',
    description: 'Organizing themes into meta-themes',
    progressWeight: 10,
    week: 3,
  },
  [ThematizationPipelineStage.CONTROVERSY_ANALYSIS]: {
    stage: ThematizationPipelineStage.CONTROVERSY_ANALYSIS,
    displayName: 'Controversy Analysis',
    description: 'Detecting citation camps and debates',
    progressWeight: 10,
    week: 4,
  },
  [ThematizationPipelineStage.CLAIM_EXTRACTION]: {
    stage: ThematizationPipelineStage.CLAIM_EXTRACTION,
    displayName: 'Claim Extraction',
    description: 'Generating Q-sort statements',
    progressWeight: 8,
    week: 5,
  },
  [ThematizationPipelineStage.FINALIZING]: {
    stage: ThematizationPipelineStage.FINALIZING,
    displayName: 'Finalizing',
    description: 'Compiling results and quality metrics',
    progressWeight: 2,
    week: 6,
  },
  [ThematizationPipelineStage.COMPLETE]: {
    stage: ThematizationPipelineStage.COMPLETE,
    displayName: 'Complete',
    description: 'Pipeline finished successfully',
    progressWeight: 0,
    week: 6,
  },
} as const;

// ============================================================================
// PIPELINE INPUT
// ============================================================================

/**
 * Paper input for the unified thematization pipeline
 * Superset of fields needed by all Phase 10.113 services
 */
export interface ThematizationPaperInput {
  /** Unique paper ID */
  readonly id: string;
  /** Paper title */
  readonly title: string;
  /** Paper abstract */
  readonly abstract?: string;
  /** Full text if available */
  readonly fullText?: string;
  /** Publication year */
  readonly year?: number;
  /** Author names */
  readonly authors?: readonly string[];
  /** Paper keywords */
  readonly keywords?: readonly string[];
  /** Citation count */
  readonly citationCount?: number;
  /** Papers this paper references */
  readonly references?: readonly string[];
  /** Papers that cite this paper */
  readonly citedBy?: readonly string[];
  /** Pre-computed embedding (optional, will be generated if missing) */
  readonly embedding?: readonly number[];
  /** Theme-Fit score if pre-calculated */
  readonly themeFitScore?: number;
}

// ============================================================================
// PIPELINE OUTPUT
// ============================================================================

/**
 * Theme output from the pipeline
 * Combines core theme data with Phase 10.113 enhancements
 */
export interface ThematizationTheme {
  /** Unique theme ID */
  readonly id: string;
  /** Theme label */
  readonly label: string;
  /** Theme description */
  readonly description?: string;
  /** Theme keywords */
  readonly keywords: readonly string[];
  /** Paper IDs in this theme */
  readonly paperIds: readonly string[];
  /** Theme weight/importance (0-1) */
  readonly weight: number;
  /** Theme coherence score (0-1) */
  readonly coherenceScore: number;
  /** Confidence in theme validity (0-1) */
  readonly confidence: number;

  // Week 3: Hierarchical data (if enabled)
  /** Parent meta-theme ID (if hierarchical extraction enabled) */
  readonly parentMetaThemeId?: string;
  /** Sub-theme IDs (if this is a meta-theme) */
  readonly subThemeIds?: readonly string[];
  /** Is this a meta-theme? */
  readonly isMetaTheme?: boolean;

  // Week 4: Controversy data (if enabled)
  /** Is this theme controversial? */
  readonly isControversial?: boolean;
  /** Citation Controversy Index score (0-1) */
  readonly controversyScore?: number;
  /** Citation camps if controversial */
  readonly citationCamps?: readonly {
    readonly campId: string;
    readonly label: string;
    readonly paperCount: number;
  }[];

  // Provenance
  /** Source papers with influence scores */
  readonly provenance: readonly {
    readonly paperId: string;
    readonly influence: number;
  }[];
}

/**
 * Claim output from Week 5
 */
export interface ThematizationClaim {
  /** Unique claim ID */
  readonly id: string;
  /** Source theme ID */
  readonly themeId: string;
  /** Original text from paper */
  readonly originalText: string;
  /** Normalized claim for Q-sort */
  readonly normalizedClaim: string;
  /** Perspective classification */
  readonly perspective: 'supportive' | 'critical' | 'neutral';
  /** Statement potential score (0-1) */
  readonly statementPotential: number;
  /** Extraction confidence (0-1) */
  readonly confidence: number;
  /** Source paper IDs */
  readonly sourcePaperIds: readonly string[];
}

/**
 * Quality metrics for the pipeline execution
 */
export interface ThematizationQualityMetrics {
  // Input metrics
  readonly totalPapersInput: number;
  readonly papersAfterThemeFitFilter: number;
  readonly papersWithAbstracts: number;
  readonly papersWithFullText: number;

  // Core pipeline metrics (Braun & Clarke)
  readonly themesExtracted: number;
  readonly avgThemeCoherence: number;
  readonly avgThemeConfidence: number;

  // Week 3: Hierarchical metrics
  readonly metaThemesExtracted?: number;
  readonly subThemesExtracted?: number;
  readonly avgSubThemesPerMeta?: number;

  // Week 4: Controversy metrics
  readonly controversialThemes?: number;
  readonly citationCampsDetected?: number;
  readonly debatePapersIdentified?: number;

  // Week 5: Claim metrics
  readonly claimsExtracted?: number;
  readonly avgClaimPotential?: number;
  readonly highQualityClaims?: number;
  readonly perspectiveBalance?: number;

  // Performance metrics
  readonly processingTimeMs: number;
  readonly stageTimings: ReadonlyMap<ThematizationPipelineStage, number>;
}

/**
 * Complete pipeline result
 */
export interface ThematizationPipelineResult {
  /** Request/job ID */
  readonly requestId: string;
  /** Topic analyzed */
  readonly topic: string;
  /** Tier used */
  readonly tier: ThematizationTierCount;
  /** Pipeline configuration used */
  readonly config: ThematizationPipelineConfig;

  // Results
  /** Extracted themes (with hierarchy if enabled) */
  readonly themes: readonly ThematizationTheme[];
  /** Extracted claims for Q-sort (if enabled) */
  readonly claims?: readonly ThematizationClaim[];

  // Week 4: Controversy results
  /** Overall topic controversy score (0-1) */
  readonly topicControversyScore?: number;
  /** Debate papers identified */
  readonly debatePapers?: readonly {
    readonly paperId: string;
    readonly title: string;
    readonly debateScore: number;
    readonly role: string;
  }[];

  // Quality and metadata
  readonly qualityMetrics: ThematizationQualityMetrics;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly warnings: readonly string[];

  // Week 6: Credit usage (if autoDeductCredits enabled)
  /** Credits deducted for this job (if auto-deduct enabled) */
  readonly creditsDeducted?: number;
  /** Credits remaining after deduction (if auto-deduct enabled) */
  readonly creditsRemaining?: number;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Progress callback for pipeline execution
 */
export type ThematizationProgressCallback = (
  stage: ThematizationPipelineStage,
  progress: number,
  message: string,
  details?: Record<string, unknown>,
) => void;

/**
 * Pipeline execution status
 */
export interface ThematizationJobStatus {
  readonly requestId: string;
  readonly userId?: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  readonly currentStage: ThematizationPipelineStage;
  readonly progress: number;
  readonly message: string;
  readonly startTime: Date;
  readonly estimatedEndTime?: Date;
  readonly error?: string;
}

// ============================================================================
// PRICING
// ============================================================================

/**
 * Cost breakdown for a thematization job
 */
export interface ThematizationCostEstimate {
  /** Tier used */
  readonly tier: ThematizationTierCount;
  /** Base cost in credits */
  readonly baseCost: number;
  /** Multiplier based on tier */
  readonly tierMultiplier: number;
  /** Additional cost for optional features */
  readonly featureCosts: {
    readonly hierarchicalExtraction?: number;
    readonly controversyAnalysis?: number;
    readonly claimExtraction?: number;
  };
  /** Total estimated cost */
  readonly totalCost: number;
  /** Estimated processing time in seconds */
  readonly estimatedTimeSeconds: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for ThematizationTierCount
 */
export function isValidTier(value: unknown): value is ThematizationTierCount {
  return typeof value === 'number' && value in THEMATIZATION_TIER_CONFIGS;
}

/**
 * Type guard for ThematizationPipelineStage
 */
export function isValidPipelineStage(value: unknown): value is ThematizationPipelineStage {
  return typeof value === 'string' && value in ThematizationPipelineStage;
}

/**
 * Type guard for ThematizationPaperInput
 */
export function isValidPaperInput(obj: unknown): obj is ThematizationPaperInput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    typeof (obj as ThematizationPaperInput).id === 'string' &&
    typeof (obj as ThematizationPaperInput).title === 'string'
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get tier configuration by paper count
 */
export function getTierConfig(tier: ThematizationTierCount): ThematizationTierConfig {
  return THEMATIZATION_TIER_CONFIGS[tier];
}

/**
 * Get stage display info
 */
export function getStageInfo(stage: ThematizationPipelineStage): ThematizationStageInfo {
  return PIPELINE_STAGE_INFO[stage];
}

/**
 * Calculate cumulative progress percentage for a stage
 */
export function calculateStageProgress(
  stage: ThematizationPipelineStage,
  stageProgress: number,
): number {
  let cumulative = 0;

  for (const [stageKey, info] of Object.entries(PIPELINE_STAGE_INFO)) {
    if (stageKey === stage) {
      return cumulative + (stageProgress / 100) * info.progressWeight;
    }
    cumulative += info.progressWeight;
  }

  return cumulative;
}
