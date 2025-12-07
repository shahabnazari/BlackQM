/**
 * Phase 10.98: Complete TypeScript Type Definitions
 * Purpose-Specific Theme Extraction Algorithms
 *
 * Version: 2.1 STRICT AUDIT CORRECTED
 * Date: 2025-11-24
 * Status: PRODUCTION-READY - Zero `any` types
 *
 * Type Safety Guarantees:
 * - Zero `any` types
 * - Strict null checking enabled
 * - Exact optional property types
 * - Full JSDoc documentation
 * - Type guards included
 *
 * STRICT AUDIT FIXES:
 * - Fixed useMiniBatch type: number → boolean
 * - Added error codes to AlgorithmError
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

  /** Use mini-batch k-means for large datasets (default: false) - CORRECTED: boolean not number */
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
// ALGORITHM ERROR TYPES
// ============================================================================

/**
 * Error code constants for programmatic error handling
 */
export enum AlgorithmErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONVERGENCE_FAILED = 'CONVERGENCE_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  LLM_API_FAILED = 'LLM_API_FAILED',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  QUALITY_GATE_FAILED = 'QUALITY_GATE_FAILED',
  PIPELINE_FAILED = 'PIPELINE_FAILED',
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
