/**
 * Phase 10.170: Purpose-Aware Pipeline Types
 *
 * Enterprise-grade type definitions for purpose-aware paper fetching,
 * quality scoring, and full-text detection.
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Q-Methodology: Stephenson (1953), Brown (1980)
 * - Qualitative Analysis: Braun & Clarke (2019)
 * - Literature Synthesis: Noblit & Hare (1988)
 * - Hypothesis Generation: Glaser & Strauss (1967)
 * - Survey Construction: Churchill (1979), DeVellis (2016)
 *
 * SECURITY:
 * - Critical #1: Runtime enum validation (no compile-time only)
 * - Critical #2: No silent defaults (throw on invalid input)
 * - Critical #6: Config validation on every access
 * - Critical #7: Bounds checking for all numerical limits
 *
 * @module purpose-aware.types
 * @since Phase 10.170
 */

// ============================================================================
// RESEARCH PURPOSE ENUM
// ============================================================================

/**
 * Research purposes supported by the system
 *
 * Each purpose has scientifically-grounded configuration:
 * - Different paper quantity requirements
 * - Different quality weight distributions
 * - Different full-text requirements
 * - Different theme extraction methods
 */
export enum ResearchPurpose {
  /**
   * Q-METHODOLOGY: Breadth-focused
   * Goal: Generate 30-80 diverse statements for Q-sort concourse
   * Scientific Method: k-means++ breadth-maximizing (Stephenson 1953)
   * Papers: 500-800 (high volume for diversity)
   * Journal Weight: 0.00 (Einstein Insight - avoid mainstream bias)
   */
  Q_METHODOLOGY = 'q_methodology',

  /**
   * QUALITATIVE ANALYSIS: Saturation-driven
   * Goal: Extract 5-20 themes until data saturation
   * Scientific Method: Hierarchical + Bayesian saturation (Braun & Clarke 2019)
   * Papers: 50-200 (stop at saturation)
   */
  QUALITATIVE_ANALYSIS = 'qualitative_analysis',

  /**
   * LITERATURE SYNTHESIS: Comprehensive coverage
   * Goal: Extract 10-25 themes representing state of knowledge
   * Scientific Method: Meta-ethnography (Noblit & Hare 1988)
   * Papers: 400-500 (comprehensive breadth)
   */
  LITERATURE_SYNTHESIS = 'literature_synthesis',

  /**
   * HYPOTHESIS GENERATION: Theoretical depth
   * Goal: Extract 8-15 conceptual themes for theory-building
   * Scientific Method: Grounded theory (Glaser & Strauss 1967)
   * Papers: 100-300 (theoretical saturation)
   */
  HYPOTHESIS_GENERATION = 'hypothesis_generation',

  /**
   * SURVEY CONSTRUCTION: Construct validity
   * Goal: Extract 5-15 robust constructs for measurement scales
   * Scientific Method: Hierarchical + Cronbach's alpha (Churchill 1979)
   * Papers: 100-200 (validated constructs)
   */
  SURVEY_CONSTRUCTION = 'survey_construction',
}

/**
 * Array of all valid research purposes (for validation)
 * SECURITY: Used for runtime enum validation
 */
export const RESEARCH_PURPOSES = Object.values(ResearchPurpose) as readonly ResearchPurpose[];

/**
 * Type guard for ResearchPurpose enum
 * SECURITY (Critical #1): Runtime validation, not just compile-time
 */
export function isValidResearchPurpose(value: unknown): value is ResearchPurpose {
  return typeof value === 'string' && RESEARCH_PURPOSES.includes(value as ResearchPurpose);
}

// ============================================================================
// CONTENT PRIORITY
// ============================================================================

/**
 * Content priority levels for full-text requirements
 *
 * Determines how aggressively the system pursues full-text:
 * - low: Abstracts sufficient (Q-methodology)
 * - medium: Full-text preferred but optional
 * - high: Full-text strongly preferred (qualitative analysis)
 * - critical: Full-text required (literature synthesis)
 */
export type ContentPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Valid content priorities (for validation)
 */
export const CONTENT_PRIORITIES: readonly ContentPriority[] = ['low', 'medium', 'high', 'critical'];

/**
 * Type guard for ContentPriority
 */
export function isValidContentPriority(value: unknown): value is ContentPriority {
  return typeof value === 'string' && CONTENT_PRIORITIES.includes(value as ContentPriority);
}

// ============================================================================
// PAPER LIMITS
// ============================================================================

/**
 * Paper limit configuration per purpose
 *
 * SECURITY (Critical #7): All values bounded 0-10000
 * INVARIANT: min <= target <= max
 */
export interface PaperLimits {
  /** Minimum papers to fetch (lower bound) */
  readonly min: number;
  /** Target number of papers (optimal) */
  readonly target: number;
  /** Maximum papers to fetch (upper bound) */
  readonly max: number;
}

/**
 * Bounds for paper limits
 * SECURITY (Critical #7): Prevents excessive resource consumption
 */
export const PAPER_LIMITS_BOUNDS = {
  /** Absolute minimum for any purpose */
  ABSOLUTE_MIN: 0,
  /** Absolute maximum for any purpose (prevents DoS) */
  ABSOLUTE_MAX: 10000,
} as const;

/**
 * Validate paper limits configuration
 * SECURITY (Critical #7): Bounds checking
 *
 * @throws Error if limits are invalid
 */
export function validatePaperLimits(limits: PaperLimits): void {
  // Check for NaN/Infinity (Critical: prevents validation bypass)
  if (!Number.isFinite(limits.min)) {
    throw new Error(`Paper limits min must be a finite number, got: ${limits.min}`);
  }
  if (!Number.isFinite(limits.target)) {
    throw new Error(`Paper limits target must be a finite number, got: ${limits.target}`);
  }
  if (!Number.isFinite(limits.max)) {
    throw new Error(`Paper limits max must be a finite number, got: ${limits.max}`);
  }

  // SECURITY (Critical #5): Check integer type - paper counts must be integers
  if (!Number.isInteger(limits.min)) {
    throw new Error(`Paper limits min must be an integer, got: ${limits.min}`);
  }
  if (!Number.isInteger(limits.target)) {
    throw new Error(`Paper limits target must be an integer, got: ${limits.target}`);
  }
  if (!Number.isInteger(limits.max)) {
    throw new Error(`Paper limits max must be an integer, got: ${limits.max}`);
  }

  // Check bounds
  if (limits.min < PAPER_LIMITS_BOUNDS.ABSOLUTE_MIN) {
    throw new Error(`Paper limits min (${limits.min}) cannot be negative`);
  }
  if (limits.max > PAPER_LIMITS_BOUNDS.ABSOLUTE_MAX) {
    throw new Error(`Paper limits max (${limits.max}) exceeds absolute maximum (${PAPER_LIMITS_BOUNDS.ABSOLUTE_MAX})`);
  }

  // Check invariant: min <= target <= max
  if (limits.min > limits.target) {
    throw new Error(`Paper limits min (${limits.min}) exceeds target (${limits.target})`);
  }
  if (limits.target > limits.max) {
    throw new Error(`Paper limits target (${limits.target}) exceeds max (${limits.max})`);
  }
}

// ============================================================================
// QUALITY WEIGHTS
// ============================================================================

/**
 * Quality weight configuration
 *
 * INVARIANT: All weights must sum to 1.0 (±0.001 tolerance)
 * CONSTRAINT: Each weight must be 0.0 to 1.0
 *
 * Einstein Insight: Q-methodology uses journal=0.00 to avoid mainstream bias
 */
export interface QualityWeights {
  /** Weight for content depth scoring (0-1) */
  readonly content: number;
  /** Weight for citation impact scoring (0-1) */
  readonly citation: number;
  /** Weight for journal prestige scoring (0-1) */
  readonly journal: number;
  /** Weight for methodology rigor scoring (0-1) */
  readonly methodology: number;
  /** Optional: Weight for perspective diversity (Q-methodology only) */
  readonly diversity?: number;
}

/**
 * Tolerance for weight sum validation
 * Allows for floating-point precision issues
 */
const WEIGHT_SUM_TOLERANCE = 0.001;

/**
 * Validate that quality weights sum to 1.0
 *
 * @param weights Quality weights to validate
 * @returns true if weights sum to 1.0 (±tolerance)
 */
export function validateQualityWeights(weights: QualityWeights): boolean {
  const sum =
    weights.content +
    weights.citation +
    weights.journal +
    weights.methodology +
    (weights.diversity ?? 0);
  return Math.abs(sum - 1.0) < WEIGHT_SUM_TOLERANCE;
}

/**
 * Validate each weight is within bounds [0, 1]
 *
 * @param weights Quality weights to validate
 * @throws Error if any weight is out of bounds or invalid
 */
export function validateQualityWeightBounds(weights: QualityWeights): void {
  const entries: Array<[string, number]> = [
    ['content', weights.content],
    ['citation', weights.citation],
    ['journal', weights.journal],
    ['methodology', weights.methodology],
  ];

  if (weights.diversity !== undefined) {
    entries.push(['diversity', weights.diversity]);
  }

  for (const [name, value] of entries) {
    // Check for NaN/Infinity (Critical: prevents validation bypass)
    if (!Number.isFinite(value)) {
      throw new Error(`Quality weight '${name}' must be a finite number, got: ${value}`);
    }
    if (value < 0 || value > 1) {
      throw new Error(`Quality weight '${name}' (${value}) must be between 0 and 1`);
    }
  }
}

// ============================================================================
// QUALITY THRESHOLD
// ============================================================================

/**
 * Quality threshold configuration
 *
 * Supports adaptive threshold relaxation when insufficient papers found.
 * INVARIANT: min <= initial
 * INVARIANT: relaxationSteps must be descending
 */
export interface QualityThreshold {
  /** Initial quality threshold (percentage, 0-100) */
  readonly initial: number;
  /** Minimum threshold (never go below, 0-100) */
  readonly min: number;
  /** Relaxation steps for adaptive threshold (descending order) */
  readonly relaxationSteps: readonly number[];
}

/**
 * Validate quality threshold configuration
 *
 * @param threshold Quality threshold to validate
 * @throws Error if threshold is invalid
 */
export function validateQualityThreshold(threshold: QualityThreshold): void {
  // Check for NaN/Infinity (Critical: prevents validation bypass)
  if (!Number.isFinite(threshold.initial)) {
    throw new Error(`Initial threshold must be a finite number, got: ${threshold.initial}`);
  }
  if (!Number.isFinite(threshold.min)) {
    throw new Error(`Min threshold must be a finite number, got: ${threshold.min}`);
  }

  // Check bounds
  if (threshold.initial < 0 || threshold.initial > 100) {
    throw new Error(`Initial threshold (${threshold.initial}) must be 0-100`);
  }
  if (threshold.min < 0 || threshold.min > 100) {
    throw new Error(`Min threshold (${threshold.min}) must be 0-100`);
  }

  // Check invariant: min <= initial
  if (threshold.min > threshold.initial) {
    throw new Error(`Min threshold (${threshold.min}) exceeds initial (${threshold.initial})`);
  }

  // Check relaxation steps are descending
  const steps = threshold.relaxationSteps;
  for (let i = 1; i < steps.length; i++) {
    if (!Number.isFinite(steps[i])) {
      throw new Error(`Relaxation step at index ${i} must be a finite number, got: ${steps[i]}`);
    }
    if (steps[i] >= steps[i - 1]) {
      throw new Error(
        `Relaxation steps must be descending: ${steps[i - 1]} -> ${steps[i]}`,
      );
    }
  }

  // Check relaxation steps bounds (also checks first element)
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!Number.isFinite(step)) {
      throw new Error(`Relaxation step at index ${i} must be a finite number, got: ${step}`);
    }
    if (step < 0 || step > 100) {
      throw new Error(`Relaxation step (${step}) must be 0-100`);
    }
  }
}

// ============================================================================
// FULL-TEXT REQUIREMENT
// ============================================================================

/**
 * Full-text requirement specification
 *
 * Configures how the system handles full-text availability:
 * - minRequired: Minimum papers with full-text needed
 * - strictRequirement: Whether to fail if requirement not met
 * - fullTextBoost: Quality score boost for papers with full-text
 */
export interface FullTextRequirement {
  /** Minimum papers with full-text required */
  readonly minRequired: number;
  /** Whether full-text is strictly required or recommended */
  readonly strictRequirement: boolean;
  /** Boost score for papers with full-text (0-100) */
  readonly fullTextBoost: number;
}

/**
 * Validate full-text requirement configuration
 *
 * @param requirement Full-text requirement to validate
 * @throws Error if requirement is invalid
 */
export function validateFullTextRequirement(requirement: FullTextRequirement): void {
  // Check for NaN/Infinity (Critical: prevents validation bypass)
  if (!Number.isFinite(requirement.minRequired)) {
    throw new Error(`Min full-text required must be a finite number, got: ${requirement.minRequired}`);
  }
  if (!Number.isFinite(requirement.fullTextBoost)) {
    throw new Error(`Full-text boost must be a finite number, got: ${requirement.fullTextBoost}`);
  }

  if (requirement.minRequired < 0) {
    throw new Error(`Min full-text required (${requirement.minRequired}) cannot be negative`);
  }
  if (requirement.fullTextBoost < 0) {
    throw new Error(`Full-text boost (${requirement.fullTextBoost}) cannot be negative`);
  }
  if (requirement.fullTextBoost > 100) {
    throw new Error(`Full-text boost (${requirement.fullTextBoost}) exceeds maximum (100)`);
  }
}

// ============================================================================
// VALIDATION THRESHOLDS
// ============================================================================

/**
 * Validation thresholds for theme extraction quality
 *
 * Used to ensure extracted themes meet scientific standards.
 */
export interface ValidationThresholds {
  /** Minimum sources per theme */
  readonly minSources: number;
  /** Minimum coherence score (0-1) */
  readonly minCoherence: number;
  /** Minimum distinctiveness score (0-1) */
  readonly minDistinctiveness: number;
}

/**
 * Validate validation thresholds
 *
 * @param thresholds Validation thresholds to validate
 * @throws Error if thresholds are invalid
 */
export function validateValidationThresholds(thresholds: ValidationThresholds): void {
  if (thresholds.minSources < 1) {
    throw new Error(`Min sources (${thresholds.minSources}) must be at least 1`);
  }
  if (thresholds.minCoherence < 0 || thresholds.minCoherence > 1) {
    throw new Error(`Min coherence (${thresholds.minCoherence}) must be 0-1`);
  }
  if (thresholds.minDistinctiveness < 0 || thresholds.minDistinctiveness > 1) {
    throw new Error(`Min distinctiveness (${thresholds.minDistinctiveness}) must be 0-1`);
  }
}

// ============================================================================
// TARGET THEMES
// ============================================================================

/**
 * Target theme count range for extraction
 */
export interface TargetThemes {
  /** Minimum themes to extract */
  readonly min: number;
  /** Maximum themes to extract */
  readonly max: number;
}

/**
 * Validate target themes configuration
 *
 * @param targets Target themes to validate
 * @throws Error if targets are invalid
 */
export function validateTargetThemes(targets: TargetThemes): void {
  if (targets.min < 1) {
    throw new Error(`Target themes min (${targets.min}) must be at least 1`);
  }
  if (targets.min > targets.max) {
    throw new Error(`Target themes min (${targets.min}) exceeds max (${targets.max})`);
  }
  if (targets.max > 200) {
    throw new Error(`Target themes max (${targets.max}) exceeds reasonable limit (200)`);
  }
}

// ============================================================================
// PURPOSE FETCHING CONFIG
// ============================================================================

/**
 * Complete purpose-specific fetching configuration
 *
 * This is the main configuration interface that combines all
 * purpose-specific settings into a single, validated structure.
 */
export interface PurposeFetchingConfig {
  /** Paper quantity limits */
  readonly paperLimits: PaperLimits;
  /** Quality scoring weights */
  readonly qualityWeights: QualityWeights;
  /** Quality threshold settings */
  readonly qualityThreshold: QualityThreshold;
  /** Content priority level */
  readonly contentPriority: ContentPriority;
  /** Full-text requirements */
  readonly fullTextRequirement: FullTextRequirement;
  /** Whether diversity tracking is enabled */
  readonly diversityRequired: boolean;
  /** Scientific method name for this purpose */
  readonly scientificMethod: string;
  /** Target theme count range */
  readonly targetThemes: TargetThemes;
  /** Validation thresholds */
  readonly validation: ValidationThresholds;
}

// ============================================================================
// PURPOSE METADATA
// ============================================================================

/**
 * Human-readable metadata for research purposes
 *
 * Used for UI display and documentation.
 */
export interface PurposeMetadata {
  /** Purpose enum value */
  readonly purpose: ResearchPurpose;
  /** Human-readable name */
  readonly displayName: string;
  /** Short description */
  readonly description: string;
  /** Scientific foundation */
  readonly scientificFoundation: string;
  /** Key characteristics */
  readonly characteristics: readonly string[];
  /** Typical use cases */
  readonly useCases: readonly string[];
}

/**
 * Purpose metadata for all research purposes
 */
export const PURPOSE_METADATA: Readonly<Record<ResearchPurpose, PurposeMetadata>> = {
  [ResearchPurpose.Q_METHODOLOGY]: {
    purpose: ResearchPurpose.Q_METHODOLOGY,
    displayName: 'Q-Methodology',
    description: 'Generate diverse statements for Q-sort concourse development',
    scientificFoundation: 'Stephenson (1953), Brown (1980)',
    characteristics: [
      'Breadth-focused (500-800 papers)',
      'Zero journal weight (avoid mainstream bias)',
      'Diversity tracking enabled',
      'Abstracts sufficient',
    ],
    useCases: [
      'Q-sort statement generation',
      'Concourse development',
      'Subjectivity research',
    ],
  },
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: {
    purpose: ResearchPurpose.QUALITATIVE_ANALYSIS,
    displayName: 'Qualitative Analysis',
    description: 'Extract themes until data saturation',
    scientificFoundation: 'Braun & Clarke (2019)',
    characteristics: [
      'Saturation-driven (50-200 papers)',
      'Content-first filtering',
      'Full-text preferred',
      'Moderate quality threshold',
    ],
    useCases: [
      'Thematic analysis',
      'Phenomenological research',
      'Grounded coding',
    ],
  },
  [ResearchPurpose.LITERATURE_SYNTHESIS]: {
    purpose: ResearchPurpose.LITERATURE_SYNTHESIS,
    displayName: 'Literature Synthesis',
    description: 'Comprehensive coverage of research landscape',
    scientificFoundation: 'Noblit & Hare (1988)',
    characteristics: [
      'Comprehensive (400-500 papers)',
      'High quality threshold',
      'Full-text required',
      'Journal prestige matters',
    ],
    useCases: [
      'Systematic reviews',
      'Meta-ethnography',
      'Research mapping',
    ],
  },
  [ResearchPurpose.HYPOTHESIS_GENERATION]: {
    purpose: ResearchPurpose.HYPOTHESIS_GENERATION,
    displayName: 'Hypothesis Generation',
    description: 'Build theory from conceptual themes',
    scientificFoundation: 'Glaser & Strauss (1967)',
    characteristics: [
      'Theory-focused (100-300 papers)',
      'Full-text preferred',
      'Iterative sampling',
      'Gap identification',
    ],
    useCases: [
      'Theory building',
      'Grounded theory',
      'Conceptual development',
    ],
  },
  [ResearchPurpose.SURVEY_CONSTRUCTION]: {
    purpose: ResearchPurpose.SURVEY_CONSTRUCTION,
    displayName: 'Survey Construction',
    description: 'Extract validated constructs for measurement scales',
    scientificFoundation: 'Churchill (1979), DeVellis (2016)',
    characteristics: [
      'Construct-focused (100-200 papers)',
      'Psychometric rigor',
      'Full-text preferred',
      'High distinctiveness required',
    ],
    useCases: [
      'Scale development',
      'Questionnaire design',
      'Construct operationalization',
    ],
  },
};

// ============================================================================
// SEARCH REQUEST INTERFACE
// ============================================================================

/**
 * Purpose-aware search request
 *
 * Input structure for initiating a purpose-aware paper search.
 */
export interface PurposeAwareSearchRequest {
  /** Search query */
  readonly query: string;
  /** Research purpose */
  readonly purpose: ResearchPurpose;
  /** Optional: Override paper limits */
  readonly paperLimitsOverride?: Partial<PaperLimits>;
  /** Optional: Override quality threshold */
  readonly qualityThresholdOverride?: number;
  /** Optional: Force full-text requirement */
  readonly forceFullText?: boolean;
}

/**
 * Purpose-aware search result
 *
 * Output structure from a purpose-aware paper search.
 */
export interface PurposeAwareSearchResult {
  /** Research purpose used */
  readonly purpose: ResearchPurpose;
  /** Configuration used for this search */
  readonly config: PurposeFetchingConfig;
  /** Total papers fetched */
  readonly totalFetched: number;
  /** Papers passing quality threshold */
  readonly qualifiedPapers: number;
  /** Papers with full-text available */
  readonly fullTextCount: number;
  /** Actual quality threshold used (may have relaxed) */
  readonly actualThreshold: number;
  /** Diversity metrics (if diversity required) */
  readonly diversityMetrics?: DiversityMetrics;
  /** Processing time in milliseconds */
  readonly processingTimeMs: number;
}

// ============================================================================
// DIVERSITY METRICS
// ============================================================================

/**
 * Diversity metrics for Q-methodology
 *
 * Tracks perspective diversity to ensure concourse coverage.
 */
export interface DiversityMetrics {
  /** Number of unique perspectives identified */
  readonly uniquePerspectives: number;
  /** Shannon entropy of perspective distribution */
  readonly entropyScore: number;
  /** Gini coefficient of perspective coverage */
  readonly giniCoefficient: number;
  /** List of underrepresented perspectives */
  readonly underrepresentedPerspectives: readonly string[];
}

// ============================================================================
// FULL-TEXT DETECTION TYPES
// ============================================================================

/**
 * IMPORTANT: Full-text detection types are now defined in fulltext-detection.types.ts
 * (Phase 10.170 Week 2). Import from there instead:
 *
 * import {
 *   FullTextSource,
 *   DetectionConfidence,
 *   FullTextDetectionResult,
 * } from '../types/fulltext-detection.types';
 *
 * The Week 2 types are the comprehensive, actively-used versions with:
 * - 12 source types (including preprint servers)
 * - Extended result interface with tiersAttempted, alternativeUrls, etc.
 * - Full security validation functions
 *
 * @see fulltext-detection.types.ts for all detection-related types
 * @deprecated These types were removed in Phase 10.170 Week 2 Audit
 */

// ============================================================================
// EXPORT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate complete purpose fetching config
 * SECURITY (Critical #6): Called on every config access
 *
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validatePurposeFetchingConfig(config: PurposeFetchingConfig): void {
  // Validate paper limits
  validatePaperLimits(config.paperLimits);

  // Validate quality weights
  validateQualityWeightBounds(config.qualityWeights);
  if (!validateQualityWeights(config.qualityWeights)) {
    throw new Error('Quality weights must sum to 1.0');
  }

  // Validate quality threshold
  validateQualityThreshold(config.qualityThreshold);

  // Validate content priority
  if (!isValidContentPriority(config.contentPriority)) {
    throw new Error(`Invalid content priority: ${config.contentPriority}`);
  }

  // Validate full-text requirement
  validateFullTextRequirement(config.fullTextRequirement);

  // Validate target themes
  validateTargetThemes(config.targetThemes);

  // Validate validation thresholds
  validateValidationThresholds(config.validation);

  // Validate scientific method is not empty
  if (!config.scientificMethod || config.scientificMethod.trim().length === 0) {
    throw new Error('Scientific method cannot be empty');
  }
}
