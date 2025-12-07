/**
 * Phase 10.98: Complete TypeScript Type Definitions
 * Purpose-Specific Theme Extraction Algorithms
 *
 * Version: 2.0 Enhanced
 * Date: 2025-11-24
 * Status: PRODUCTION-READY - Zero `any` types
 *
 * Type Safety Guarantees:
 * - Zero `any` types
 * - Strict null checking enabled
 * - Exact optional property types
 * - Full JSDoc documentation
 * - Type guards included
 */

// Import from unified types where these types are defined
import type { InitialCode, CandidateTheme } from './unified-theme-extraction.types';

// ============================================================================
// CORE CLUSTERING TYPES
// ============================================================================

/**
 * Represents a cluster of related codes
 * Used by all clustering algorithms (k-means, hierarchical, bisecting)
 */
export interface Cluster {
  /** Array of codes belonging to this cluster */
  codes: InitialCode[];

  /** Centroid embedding (mean of all code embeddings) */
  centroid: number[];

  /** Optional metadata for tracking */
  metadata?: {
    /** Cluster index (0-based) */
    clusterIndex?: number;

    /** Number of codes in cluster */
    size?: number;

    /** Algorithm that created this cluster */
    algorithm?: 'k-means++' | 'hierarchical' | 'bisecting-kmeans' | 'diversity-enforced';

    /** For merged clusters: original cluster indices */
    mergedFrom?: number[];
  };
}

/**
 * Configuration options for k-means clustering
 */
export interface KMeansOptions {
  /** Maximum iterations before stopping (default: 100) */
  maxIterations?: number;

  /** Convergence tolerance (centroid movement < this → stop) (default: 0.001) */
  convergenceTolerance?: number;

  /** Minimum cluster size (reject clusters smaller than this) (default: 1) */
  minClusterSize?: number;

  /** Use mini-batch k-means for large datasets (default: false) */
  useMiniBatch?: boolean;

  /** Batch size for mini-batch k-means (default: 100) */
  batchSize?: number;
}

/**
 * Quality metrics for evaluating clustering
 */
export interface ClusterQualityMetrics {
  /** Inertia (within-cluster sum of squares) - lower = better */
  inertia: number;

  /** Silhouette score (-1 to 1, higher = better) */
  silhouette: number;

  /** Davies-Bouldin index (0 to ∞, lower = better) */
  daviesBouldin: number;

  /** Calinski-Harabasz index (0 to ∞, higher = better) */
  calinskiHarabasz?: number;
}

// ============================================================================
// Q METHODOLOGY TYPES
// ============================================================================

/**
 * Result from LLM code splitting operation
 */
export interface SplitValidationResult {
  /** Original code ID that was split */
  originalCodeId: string;

  /** Array of atomic statements produced by splitting */
  atomicStatements: Array<{
    /** Label for the atomic statement */
    label: string;

    /** Brief description */
    description: string;

    /** Exact excerpt from source that grounds this statement */
    groundingExcerpt: string;

    /** Semantic similarity to grounding excerpt (0-1) */
    similarityScore?: number;
  }>;

  /** Number of statements that passed grounding validation */
  validatedCount: number;

  /** Number of statements rejected (hallucinations) */
  rejectedCount: number;
}

/**
 * Metrics for measuring theme diversity (Q methodology)
 */
export interface DiversityMetrics {
  /** Average pairwise similarity between themes (lower = more diverse) */
  avgPairwiseSimilarity: number;

  /** Maximum pairwise similarity (should be < 0.7 for Q methodology) */
  maxPairwiseSimilarity: number;

  /** Number of redundant theme pairs (similarity > 0.7) */
  redundantPairs: number;

  /** Davies-Bouldin index (lower = more diverse) */
  daviesBouldin: number;

  /** Percentage of sources represented in themes */
  sourceCoverage: number;
}

/**
 * Result from Q methodology pipeline
 */
export interface QMethodologyResult {
  /** Diverse themes (30-80) */
  themes: CandidateTheme[];

  /** Diversity metrics */
  diversityMetrics: DiversityMetrics;

  /** Number of codes enriched (via splitting) */
  codesEnriched: number;

  /** Optimal k selected */
  optimalK: number;

  /** Number of clusters bisected */
  clustersBisected: number;

  /** Execution time (ms) */
  executionTime: number;
}

// ============================================================================
// SURVEY CONSTRUCTION TYPES
// ============================================================================

/**
 * Psychometric metrics for survey constructs
 * Based on Churchill (1979) and DeVellis (2016) scale development paradigm
 */
export interface PsychometricMetrics {
  /** Cronbach's alpha (internal consistency, 0-1, α ≥ 0.70 acceptable) */
  cronbachAlpha: number;

  /** Item-total correlations (all should be > 0.30) */
  itemTotalCorrelations: number[];

  /** Average inter-item correlation (0.15-0.50 ideal range) */
  avgInterItemCorrelation: number;

  /** Construct validity estimate (0-1, based on convergent/discriminant validity) */
  constructValidity: number;

  /** Number of items in construct */
  itemCount: number;

  /** Reliability classification */
  reliabilityLevel: 'excellent' | 'good' | 'acceptable' | 'questionable' | 'poor' | 'unacceptable';
}

/**
 * Survey construct with psychometric validation
 */
export interface ConstructWithMetrics extends Cluster {
  /** Construct label (generated by AI) */
  label: string;

  /** Construct description */
  description: string;

  /** Psychometric quality metrics */
  metrics: PsychometricMetrics;

  /** Whether this construct passed quality gates (α ≥ 0.60) */
  passedQualityGate: boolean;

  /** Suggested Likert scale type */
  suggestedScale: 'likert-5' | 'likert-7' | 'semantic-differential' | 'visual-analog';
}

/**
 * Result from Survey Construction pipeline
 */
export interface SurveyConstructionResult {
  /** Valid constructs (5-15) with α ≥ 0.60 */
  constructs: ConstructWithMetrics[];

  /** Number of constructs rejected for low internal consistency */
  constructsRejected: number;

  /** Average Cronbach's alpha across all valid constructs */
  avgCronbachAlpha: number;

  /** Lowest Cronbach's alpha among valid constructs */
  minCronbachAlpha: number;

  /** Highest Cronbach's alpha among valid constructs */
  maxCronbachAlpha: number;

  /** Number of merges performed */
  mergesPerformed: number;

  /** Whether merging stopped early due to alpha drop */
  earlyStopDueToAlpha: boolean;

  /** Execution time (ms) */
  executionTime: number;
}

// ============================================================================
// ALGORITHM ERROR TYPES
// ============================================================================

/**
 * Error code constants for programmatic error handling
 * Phase 8.90 Priority 5.2: Added CANCELLED for AbortController support
 */
export enum AlgorithmErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONVERGENCE_FAILED = 'CONVERGENCE_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  LLM_API_FAILED = 'LLM_API_FAILED',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  QUALITY_GATE_FAILED = 'QUALITY_GATE_FAILED',
  PIPELINE_FAILED = 'PIPELINE_FAILED',
  CANCELLED = 'CANCELLED', // Phase 8.90 Priority 5.2: User cancelled operation
}

/**
 * Custom error for algorithm failures with standardized error codes
 */
export class AlgorithmError extends Error {
  constructor(
    message: string,
    public readonly algorithm: string,
    public readonly stage: string,
    public readonly code: AlgorithmErrorCode = AlgorithmErrorCode.PIPELINE_FAILED,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'AlgorithmError';

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlgorithmError);
    }
  }
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard for Cluster interface
 */
export function isCluster(obj: unknown): obj is Cluster {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'codes' in obj &&
    Array.isArray((obj as Cluster).codes) &&
    'centroid' in obj &&
    Array.isArray((obj as Cluster).centroid)
  );
}

/**
 * Type guard for QMethodologyResult interface
 */
export function isQMethodologyResult(obj: unknown): obj is QMethodologyResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'themes' in obj &&
    Array.isArray((obj as QMethodologyResult).themes) &&
    'diversityMetrics' in obj &&
    typeof (obj as QMethodologyResult).optimalK === 'number'
  );
}

/**
 * Type guard for SurveyConstructionResult interface
 */
export function isSurveyConstructionResult(obj: unknown): obj is SurveyConstructionResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'constructs' in obj &&
    Array.isArray((obj as SurveyConstructionResult).constructs) &&
    'avgCronbachAlpha' in obj &&
    typeof (obj as SurveyConstructionResult).avgCronbachAlpha === 'number'
  );
}

/**
 * Type guard for Error objects
 */
export function isError(obj: unknown): obj is Error {
  return obj instanceof Error || (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    'name' in obj
  );
}

// ============================================================================
// QUALITATIVE ANALYSIS SATURATION TYPES (Phase 10.98 Day 5-6)
// ============================================================================

/**
 * Point on theme emergence curve
 * Tracks how many new themes appeared when adding each source
 *
 * Scientific Foundation:
 * - Glaser & Strauss (1967): Theoretical saturation detection
 * - Francis et al. (2010): Information power and sample size
 */
export interface ThemeEmergencePoint {
  /** Index of source in analysis order (0-based) */
  sourceIndex: number;

  /** Title of source for reference */
  sourceTitle: string;

  /** Number of NEW themes that appeared with this source */
  newThemes: number;

  /** Total themes discovered up to and including this source */
  cumulativeThemes: number;

  /** Percentage of new themes (newThemes / cumulativeThemes) */
  percentageNew: number;
}

/**
 * Power law fit parameters for emergence curve
 * Models: y = a × x^(-b) where y = new themes, x = source index
 *
 * Interpretation:
 * - b > 0.5: Strong saturation signal (rapid decline in new themes)
 * - b < 0.5: Weak saturation (linear or slow decline)
 * - rSquared > 0.7: Good model fit (curve is predictable)
 */
export interface PowerLawFit {
  /** Scaling parameter (intercept in log space) */
  a: number;

  /** Decay exponent (slope in log space, negated) */
  b: number;

  /** Goodness of fit (0-1, higher = better) */
  rSquared: number;

  /** Whether data shows saturation (b > 0.5 && rSquared > 0.7) */
  saturating: boolean;
}

/**
 * Bayesian posterior distribution parameters
 * Uses Beta distribution to model probability of finding new themes
 *
 * Scientific Foundation:
 * - Beta(α, β) is conjugate prior for binomial likelihood
 * - α increases when new themes found (success)
 * - β increases when no new themes (failure/saturation)
 */
export interface BayesianSaturationResult {
  /** Whether saturation detected (posterior probability > 0.8) */
  isSaturated: boolean;

  /** Source index where saturation first detected (null if not saturated) */
  saturationPoint: number | null;

  /** Posterior probability that p(new themes) < 0.2 */
  posteriorProbability: number;

  /** 95% credible interval for p(new themes) */
  credibleInterval: readonly [number, number];

  /** Beta distribution alpha parameter (successes + prior) */
  alpha: number;

  /** Beta distribution beta parameter (failures + prior) */
  beta: number;

  /** Posterior mean: α / (α + β) */
  posteriorMean: number;
}

/**
 * Robustness analysis from sensitivity testing
 * Tests saturation across multiple random source orderings
 */
export interface RobustnessAnalysis {
  /** Proportion of permutations showing saturation (0-1) */
  robustnessScore: number;

  /** Number of permutations tested */
  numPermutations: number;

  /** Whether saturation is robust (score > 0.75) */
  isRobust: boolean;

  /** Detailed results for each permutation */
  permutationResults: readonly boolean[];
}

/**
 * Comprehensive saturation analysis result
 * Combines Bayesian, power law, and robustness analyses
 *
 * Patent Claim #27: Automated Theoretical Saturation Detection
 * - First tool using Bayesian posterior probabilities for saturation
 * - Combines 3 independent signals (Bayesian, power law, robustness)
 * - Provides actionable recommendations
 */
export interface SaturationAnalysis {
  /** Overall saturation status */
  isSaturated: boolean;

  /** Source index where saturation detected (null if not saturated) */
  saturationPoint: number | null;

  /** Bayesian analysis results */
  bayesian: BayesianSaturationResult;

  /** Theme emergence curve across sources */
  emergenceCurve: readonly ThemeEmergencePoint[];

  /** Power law model fit */
  powerLawFit: PowerLawFit;

  /** Robustness analysis (order-independence) */
  robustness: RobustnessAnalysis;

  /** Confidence score (0-1): geometric mean of Bayesian prob, R², robustness */
  confidenceScore: number;

  /** Human-readable recommendation */
  recommendation: string;
}

/**
 * Result from Qualitative Analysis pipeline
 */
export interface QualitativeAnalysisResult {
  /** Themes identified (5-20) */
  themes: CandidateTheme[];

  /** Saturation analysis data */
  saturationAnalysis: SaturationAnalysis;

  /** Number of sources analyzed */
  sourcesAnalyzed: number;

  /** Average themes per source */
  avgThemesPerSource: number;

  /** Execution time (ms) */
  executionTime: number;
}

/**
 * Type guard for QualitativeAnalysisResult interface
 */
export function isQualitativeAnalysisResult(obj: unknown): obj is QualitativeAnalysisResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'themes' in obj &&
    Array.isArray((obj as QualitativeAnalysisResult).themes) &&
    'saturationAnalysis' in obj &&
    typeof (obj as QualitativeAnalysisResult).saturationAnalysis === 'object'
  );
}
