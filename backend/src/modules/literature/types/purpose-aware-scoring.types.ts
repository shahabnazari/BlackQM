/**
 * Phase 10.170 Week 3: Purpose-Aware Scoring Types
 *
 * Enterprise-grade type definitions for purpose-aware quality scoring,
 * adaptive threshold relaxation, and diversity tracking.
 *
 * DESIGN PRINCIPLES:
 * - Strict typing with no `any` or loose types
 * - Readonly interfaces for immutability
 * - Comprehensive validation functions
 * - Full documentation with scientific references
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Q-Methodology diversity: Watts & Stenner (2012)
 * - Quality scoring: FWCI (Field-Weighted Citation Impact)
 * - Adaptive thresholds: Saturation-based relaxation
 *
 * @module purpose-aware-scoring.types
 * @since Phase 10.170 Week 3
 */

import { ResearchPurpose, QualityWeights } from './purpose-aware.types';

// ============================================================================
// SCORING RESULT TYPES
// ============================================================================

/**
 * Individual component score with provenance
 *
 * Tracks both raw and weighted scores for transparency.
 */
export interface ComponentScore {
  /** Raw score (0-100) before weight applied */
  readonly raw: number;
  /** Weight applied to this component (0-1) */
  readonly weight: number;
  /** Weighted contribution to total (raw * weight) */
  readonly weighted: number;
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Complete purpose-aware quality score breakdown
 *
 * Provides full transparency into how the score was calculated.
 */
export interface PurposeAwareScoreResult {
  /** Paper identifier (DOI or internal ID) */
  readonly paperId: string;
  /** Research purpose used for scoring */
  readonly purpose: ResearchPurpose;
  /** Final composite score (0-100) */
  readonly totalScore: number;
  /** Individual component scores */
  readonly components: {
    readonly content: ComponentScore;
    readonly citation: ComponentScore;
    readonly journal: ComponentScore;
    readonly methodology: ComponentScore;
    readonly diversity?: ComponentScore;
  };
  /** Full-text bonus applied (if any) */
  readonly fullTextBonus: number;
  /** Whether paper has full-text available */
  readonly hasFullText: boolean;
  /** Timestamp of scoring */
  readonly scoredAt: number;
  /** Scoring version for cache invalidation */
  readonly version: string;
}

/**
 * Validate a purpose-aware score result
 *
 * @param result Score result to validate
 * @throws Error if result is invalid
 */
export function validateScoreResult(result: PurposeAwareScoreResult): void {
  // Validate total score bounds
  if (!Number.isFinite(result.totalScore)) {
    throw new Error(`Total score must be finite, got: ${result.totalScore}`);
  }
  if (result.totalScore < 0 || result.totalScore > 100) {
    throw new Error(`Total score (${result.totalScore}) must be 0-100`);
  }

  // Validate component scores
  const components = ['content', 'citation', 'journal', 'methodology'] as const;
  for (const name of components) {
    const component = result.components[name];
    validateComponentScore(component, name);
  }

  // Validate diversity component if present
  if (result.components.diversity !== undefined) {
    validateComponentScore(result.components.diversity, 'diversity');
  }

  // Validate full-text bonus
  if (!Number.isFinite(result.fullTextBonus)) {
    throw new Error(`Full-text bonus must be finite, got: ${result.fullTextBonus}`);
  }
  if (result.fullTextBonus < 0) {
    throw new Error(`Full-text bonus (${result.fullTextBonus}) cannot be negative`);
  }
}

/**
 * Validate a single component score
 */
function validateComponentScore(component: ComponentScore, name: string): void {
  if (!Number.isFinite(component.raw)) {
    throw new Error(`${name} raw score must be finite, got: ${component.raw}`);
  }
  if (component.raw < 0 || component.raw > 100) {
    throw new Error(`${name} raw score (${component.raw}) must be 0-100`);
  }
  if (!Number.isFinite(component.weight)) {
    throw new Error(`${name} weight must be finite, got: ${component.weight}`);
  }
  if (component.weight < 0 || component.weight > 1) {
    throw new Error(`${name} weight (${component.weight}) must be 0-1`);
  }
}

// ============================================================================
// ADAPTIVE THRESHOLD TYPES
// ============================================================================

/**
 * Threshold relaxation result
 *
 * Tracks the progression of threshold relaxation.
 */
export interface ThresholdRelaxationResult {
  /** Original (initial) threshold */
  readonly originalThreshold: number;
  /** Current (possibly relaxed) threshold */
  readonly currentThreshold: number;
  /** Number of relaxation steps applied */
  readonly stepsApplied: number;
  /** Maximum steps available */
  readonly maxSteps: number;
  /** Papers passing at current threshold */
  readonly passingPapers: number;
  /** Target paper count */
  readonly targetCount: number;
  /** Whether target was met */
  readonly targetMet: boolean;
  /** Whether minimum threshold reached */
  readonly atMinimum: boolean;
  /** History of relaxation steps with counts */
  readonly history: readonly ThresholdStep[];
}

/**
 * Single threshold relaxation step
 */
export interface ThresholdStep {
  /** Step number (1-indexed) */
  readonly step: number;
  /** Threshold value at this step */
  readonly threshold: number;
  /** Papers passing at this threshold */
  readonly passingCount: number;
  /** Timestamp when step was applied */
  readonly appliedAt: number;
}

/**
 * Validate threshold relaxation result
 */
export function validateThresholdRelaxation(result: ThresholdRelaxationResult): void {
  if (!Number.isFinite(result.originalThreshold)) {
    throw new Error(`Original threshold must be finite`);
  }
  if (!Number.isFinite(result.currentThreshold)) {
    throw new Error(`Current threshold must be finite`);
  }
  if (result.currentThreshold > result.originalThreshold) {
    throw new Error(`Current threshold cannot exceed original`);
  }
  if (result.stepsApplied < 0) {
    throw new Error(`Steps applied cannot be negative`);
  }
  if (result.stepsApplied > result.maxSteps) {
    throw new Error(`Steps applied exceeds max steps`);
  }
}

// ============================================================================
// DIVERSITY SCORING TYPES
// ============================================================================

/**
 * Perspective categories for Q-methodology diversity
 *
 * Based on Watts & Stenner (2012) concourse development guidelines.
 */
export enum PerspectiveCategory {
  /** Academic/scientific viewpoint */
  ACADEMIC = 'academic',
  /** Industry/practitioner viewpoint */
  PRACTITIONER = 'practitioner',
  /** Policy/governmental viewpoint */
  POLICY = 'policy',
  /** Public/lay viewpoint */
  PUBLIC = 'public',
  /** Critical/opposing viewpoint */
  CRITICAL = 'critical',
  /** Historical/traditional viewpoint */
  HISTORICAL = 'historical',
  /** Emerging/innovative viewpoint */
  EMERGING = 'emerging',
  /** Cross-cultural viewpoint */
  CROSS_CULTURAL = 'cross_cultural',
}

/**
 * Array of all perspective categories
 */
export const PERSPECTIVE_CATEGORIES = Object.values(PerspectiveCategory) as readonly PerspectiveCategory[];

/**
 * Type guard for PerspectiveCategory
 */
export function isValidPerspectiveCategory(value: unknown): value is PerspectiveCategory {
  return typeof value === 'string' && PERSPECTIVE_CATEGORIES.includes(value as PerspectiveCategory);
}

/**
 * Diversity score for a single paper
 */
export interface PaperDiversityScore {
  /** Paper identifier */
  readonly paperId: string;
  /** Detected perspective categories */
  readonly perspectives: readonly PerspectiveCategory[];
  /** Primary perspective (highest confidence) */
  readonly primaryPerspective: PerspectiveCategory | null;
  /** Confidence score for detection (0-1) */
  readonly confidence: number;
  /** Whether this paper adds unique perspective to corpus */
  readonly isUniquePerspective: boolean;
  /** Diversity contribution score (0-100) */
  readonly diversityContribution: number;
  /** Keywords that triggered perspective detection */
  readonly triggerKeywords: readonly string[];
}

/**
 * Corpus-level diversity metrics
 */
export interface CorpusDiversityMetrics {
  /** Total papers analyzed */
  readonly totalPapers: number;
  /** Unique perspectives represented */
  readonly uniquePerspectives: number;
  /** Coverage ratio (represented/total categories) */
  readonly coverageRatio: number;
  /** Shannon diversity index (higher = more diverse) */
  readonly shannonIndex: number;
  /** Simpson diversity index (0-1, higher = more diverse) */
  readonly simpsonIndex: number;
  /** Distribution across categories */
  readonly distribution: Readonly<Record<PerspectiveCategory, number>>;
  /** Underrepresented categories */
  readonly underrepresented: readonly PerspectiveCategory[];
  /** Overrepresented categories */
  readonly overrepresented: readonly PerspectiveCategory[];
  /** Diversity health status */
  readonly healthStatus: DiversityHealthStatus;
}

/**
 * Diversity health status
 */
export type DiversityHealthStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';

/**
 * Get diversity health status from metrics
 */
export function getDiversityHealthStatus(metrics: CorpusDiversityMetrics): DiversityHealthStatus {
  const { coverageRatio, shannonIndex } = metrics;

  // Excellent: 80%+ coverage, high Shannon index
  if (coverageRatio >= 0.8 && shannonIndex >= 1.8) {
    return 'excellent';
  }
  // Good: 60%+ coverage, moderate Shannon index
  if (coverageRatio >= 0.6 && shannonIndex >= 1.4) {
    return 'good';
  }
  // Moderate: 40%+ coverage
  if (coverageRatio >= 0.4 && shannonIndex >= 1.0) {
    return 'moderate';
  }
  // Poor: 25%+ coverage
  if (coverageRatio >= 0.25) {
    return 'poor';
  }
  // Critical: less than 25% coverage
  return 'critical';
}

/**
 * Validate corpus diversity metrics
 */
export function validateDiversityMetrics(metrics: CorpusDiversityMetrics): void {
  if (!Number.isFinite(metrics.coverageRatio)) {
    throw new Error(`Coverage ratio must be finite`);
  }
  if (metrics.coverageRatio < 0 || metrics.coverageRatio > 1) {
    throw new Error(`Coverage ratio must be 0-1`);
  }
  if (!Number.isFinite(metrics.shannonIndex)) {
    throw new Error(`Shannon index must be finite`);
  }
  if (metrics.shannonIndex < 0) {
    throw new Error(`Shannon index cannot be negative`);
  }
  if (!Number.isFinite(metrics.simpsonIndex)) {
    throw new Error(`Simpson index must be finite`);
  }
  if (metrics.simpsonIndex < 0 || metrics.simpsonIndex > 1) {
    throw new Error(`Simpson index must be 0-1`);
  }
}

// ============================================================================
// SCORING INPUT TYPES
// ============================================================================

/**
 * Paper data required for purpose-aware scoring
 *
 * Minimal interface to avoid coupling to specific Paper types.
 */
export interface ScoringPaperInput {
  /** Paper identifier (DOI or internal ID) */
  readonly id: string;
  /** Paper title */
  readonly title: string;
  /** Paper abstract */
  readonly abstract: string | null;
  /** Keywords/MeSH terms */
  readonly keywords: readonly string[];
  /** Citation count */
  readonly citationCount: number | null;
  /** Publication year */
  readonly year: number | null;
  /** Journal/venue name */
  readonly venue: string | null;
  /** Journal impact factor (if known) */
  readonly impactFactor: number | null;
  /** Whether full-text is available */
  readonly hasFullText: boolean;
  /** Word count (for content depth) */
  readonly wordCount: number | null;
  /** Existing quality score (if pre-calculated) */
  readonly existingQualityScore: number | null;
}

/**
 * Validate scoring paper input
 */
export function validateScoringInput(input: ScoringPaperInput): void {
  if (!input.id || typeof input.id !== 'string') {
    throw new Error('Paper ID is required and must be a string');
  }
  if (!input.title || typeof input.title !== 'string') {
    throw new Error('Paper title is required and must be a string');
  }
  if (input.citationCount !== null && (!Number.isFinite(input.citationCount) || input.citationCount < 0)) {
    throw new Error(`Citation count must be null or non-negative, got: ${input.citationCount}`);
  }
  if (input.year !== null && (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100)) {
    throw new Error(`Year must be null or between 1900-2100, got: ${input.year}`);
  }
}

// ============================================================================
// BATCH SCORING TYPES
// ============================================================================

/**
 * Batch scoring request
 */
export interface BatchScoringRequest {
  /** Papers to score */
  readonly papers: readonly ScoringPaperInput[];
  /** Research purpose for scoring */
  readonly purpose: ResearchPurpose;
  /** Optional: Override quality weights */
  readonly weightOverrides?: Partial<QualityWeights>;
  /** Optional: Enable diversity scoring */
  readonly enableDiversity?: boolean;
  /** Optional: Enable adaptive thresholds */
  readonly enableAdaptiveThreshold?: boolean;
  /** Optional: Target paper count (for adaptive thresholds) */
  readonly targetCount?: number;
}

/**
 * Batch scoring result
 */
export interface BatchScoringResult {
  /** Scored papers with results */
  readonly scores: readonly PurposeAwareScoreResult[];
  /** Threshold relaxation result (if adaptive enabled) */
  readonly thresholdResult: ThresholdRelaxationResult | null;
  /** Corpus diversity metrics (if diversity enabled) */
  readonly diversityMetrics: CorpusDiversityMetrics | null;
  /** Papers passing current threshold */
  readonly passingPapers: readonly PurposeAwareScoreResult[];
  /** Papers failing current threshold */
  readonly failingPapers: readonly PurposeAwareScoreResult[];
  /** Execution time in milliseconds */
  readonly executionTimeMs: number;
  /** Scoring statistics */
  readonly stats: BatchScoringStats;
}

/**
 * Batch scoring statistics
 */
export interface BatchScoringStats {
  /** Total papers processed */
  readonly totalProcessed: number;
  /** Papers passing threshold */
  readonly passingCount: number;
  /** Papers failing threshold */
  readonly failingCount: number;
  /** Pass rate (0-1) */
  readonly passRate: number;
  /** Average score */
  readonly averageScore: number;
  /** Median score */
  readonly medianScore: number;
  /** Score standard deviation */
  readonly stdDeviation: number;
  /** Minimum score */
  readonly minScore: number;
  /** Maximum score */
  readonly maxScore: number;
  /** Papers with full-text */
  readonly fullTextCount: number;
  /** Full-text rate (0-1) */
  readonly fullTextRate: number;
}

// ============================================================================
// SCORING VERSION
// ============================================================================

/**
 * Current scoring algorithm version
 * Increment when algorithm changes to invalidate caches
 */
export const SCORING_VERSION = '3.0.0' as const;

/**
 * Scoring version type
 */
export type ScoringVersion = typeof SCORING_VERSION;
