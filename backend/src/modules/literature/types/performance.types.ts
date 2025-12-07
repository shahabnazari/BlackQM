/**
 * Enterprise-Grade Performance Monitoring Types
 * Phase 10.99 Week 2 Post-Implementation Performance Optimization
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STRICT TYPE SAFETY - PRODUCTION READY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Comprehensive performance tracking and instrumentation
 * Type Safety: 100% strict TypeScript, zero `any` types
 * Immutability: readonly properties, Object.freeze() for runtime safety
 * Enterprise-Grade: Complete type coverage, JSDoc documentation
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS (Must be at top of file per ES6 module specification)
// ═══════════════════════════════════════════════════════════════════════════

import { Paper } from '../dto/literature.dto';

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY TRACKING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Memory usage snapshot at a specific point in time
 * Captures all Node.js memory usage metrics
 *
 * @see https://nodejs.org/api/process.html#processmemoryusage
 */
export interface MemorySnapshot {
  /** Timestamp when snapshot was captured (milliseconds since epoch) */
  readonly timestamp: number;

  /** Heap memory currently used (bytes) */
  readonly heapUsed: number;

  /** Total heap memory allocated (bytes) */
  readonly heapTotal: number;

  /** Memory used by C++ objects bound to JavaScript (bytes) */
  readonly external: number;

  /** Memory used by ArrayBuffer and SharedArrayBuffer (bytes) */
  readonly arrayBuffers: number;

  /** Resident Set Size - total memory allocated for the process (bytes) */
  readonly rss: number;
}

/**
 * Memory delta between two snapshots
 * Helps track memory growth/shrinkage during operations
 */
export interface MemoryDelta {
  /** Change in heap used (bytes, positive = growth, negative = shrinkage) */
  readonly heapUsedDelta: number;

  /** Change in heap total (bytes) */
  readonly heapTotalDelta: number;

  /** Change in external memory (bytes) */
  readonly externalDelta: number;

  /** Change in RSS (bytes) */
  readonly rssDelta: number;

  /** Duration between snapshots (milliseconds) */
  readonly duration: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE STAGE METRICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Performance metrics for a single pipeline stage
 * Tracks timing, throughput, and memory usage
 */
export interface StageMetrics {
  /** Unique stage identifier (e.g., "BM25 Scoring", "Neural Reranking") */
  readonly stageName: string;

  /** Stage start timestamp (milliseconds since epoch) */
  readonly startTime: number;

  /** Stage end timestamp (milliseconds since epoch) */
  readonly endTime: number;

  /** Total stage duration (milliseconds) */
  readonly duration: number;

  /** Number of papers entering the stage */
  readonly inputCount: number;

  /** Number of papers exiting the stage */
  readonly outputCount: number;

  /** Pass rate percentage (outputCount / inputCount * 100) */
  readonly passRate: number;

  /** Memory snapshot before stage execution */
  readonly memoryBefore: MemorySnapshot;

  /** Memory snapshot after stage execution */
  readonly memoryAfter: MemorySnapshot;

  /** Memory change during stage (bytes, positive = allocation, negative = GC) */
  readonly memoryDelta: number;

  /** Optional: Number of operations performed (e.g., sort count, API calls) */
  readonly operationCount?: number;

  /** Optional: Any warnings generated during stage */
  readonly warnings?: ReadonlyArray<string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE PIPELINE PERFORMANCE REPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprehensive performance report for entire literature search pipeline
 * Aggregates all stage metrics and provides overall statistics
 */
export interface PipelinePerformanceReport {
  /** Unique pipeline execution identifier */
  readonly pipelineId: string;

  /** Search query that triggered this pipeline */
  readonly query: string;

  /** Query complexity classification */
  readonly queryComplexity: 'broad' | 'specific' | 'comprehensive';

  /** Pipeline start timestamp (milliseconds since epoch) */
  readonly startTime: number;

  /** Pipeline end timestamp (milliseconds since epoch) */
  readonly endTime: number;

  /** Total pipeline duration (milliseconds) */
  readonly totalDuration: number;

  /** Metrics for each individual stage */
  readonly stages: ReadonlyArray<StageMetrics>;

  /** Peak memory usage across all stages (bytes) */
  readonly peakMemory: number;

  /** Total memory allocated during pipeline (sum of positive deltas) */
  readonly totalMemoryAllocated: number;

  /** Total memory freed during pipeline (sum of negative deltas from GC) */
  readonly totalMemoryFreed: number;

  /** Average CPU usage during pipeline (percentage, 0-100) */
  readonly averageCpuUsage: number;

  /** Whether pipeline completed successfully */
  readonly success: boolean;

  /** Error message if pipeline failed */
  readonly errorMessage?: string;

  /** Final number of papers returned */
  readonly finalPaperCount: number;

  /** Total number of papers initially collected */
  readonly initialPaperCount: number;

  /** Overall pipeline efficiency (finalCount / initialCount * 100) */
  readonly overallPassRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAPER TYPES FOR TYPE-SAFE MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Paper with mutable scoring properties for in-place mutations
 *
 * ARCHITECTURAL DECISION (Phase 10.99 Week 2 Strict Audit):
 * ───────────────────────────────────────────────────────────────────────────
 * MutablePaper is now a simple type alias to Paper, as Paper class has been
 * extended with all scoring properties needed for the search pipeline.
 *
 * PREVIOUS DESIGN (Removed for DRY principle):
 * - Had 7 redundant property declarations
 * - Created dual source of truth
 * - Required synchronization between two type definitions
 *
 * CURRENT DESIGN (Enterprise-Grade):
 * - Single source of truth: Paper class (literature.dto.ts)
 * - No type redundancy
 * - Full type compatibility throughout pipeline
 * - Simpler maintenance
 *
 * TYPE SAFETY GUARANTEE:
 * - MutablePaper === Paper at compile time
 * - All 70+ Paper properties available
 * - Scoring properties (relevanceScore, neuralRelevanceScore, etc.) included
 * - No type assertions needed when converting MutablePaper[] → Paper[]
 *
 * USAGE:
 * - Use MutablePaper[] in performance-critical pipeline sections (Stages 1-8)
 * - Signals developer intent: "this array will be mutated in-place"
 * - Convert to Paper[] via .slice() before returning to caller
 *
 * BUG FIX (Phase 10.99 Week 2 Architecture Verification):
 * - Changed from standalone interface to type alias
 * - Eliminates 7 redundant property declarations
 * - Maintains backward compatibility with existing code
 */
export type MutablePaper = Paper;

/**
 * Result of a pipeline stage
 * Wraps papers with associated metrics
 */
export interface StageResult<T> {
  /** Papers output from this stage */
  readonly papers: ReadonlyArray<T>;

  /** Performance metrics for this stage */
  readonly metrics: StageMetrics;

  /** Any warnings generated during stage */
  readonly warnings: ReadonlyArray<string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sorting comparator function type
 * Returns negative if a < b, positive if a > b, zero if equal
 */
export type PaperComparator<T> = (a: T, b: T) => number;

/**
 * Filter predicate function type
 * Returns true to keep paper, false to filter out
 */
export type PaperPredicate<T> = (paper: T) => boolean;

/**
 * Paper transformation function type
 * Returns transformed paper (may mutate in-place for performance)
 */
export type PaperTransformer<TIn, TOut> = (paper: TIn) => TOut;

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interface for performance monitoring service
 * Provides type-safe API for tracking pipeline performance
 */
export interface IPerformanceMonitor {
  /**
   * Start tracking a new pipeline stage
   * @param stageName - Unique identifier for this stage
   * @param inputCount - Number of papers entering the stage
   */
  startStage(stageName: string, inputCount: number): void;

  /**
   * End current stage and record metrics
   * @param stageName - Stage identifier (must match startStage call)
   * @param outputCount - Number of papers exiting the stage
   * @returns Complete metrics for the finished stage
   * @throws Error if no stage is currently active or stage name mismatch
   */
  endStage(stageName: string, outputCount: number): StageMetrics;

  /**
   * Get complete performance report for entire pipeline
   * @returns Aggregated performance metrics
   */
  getReport(): PipelinePerformanceReport;

  /**
   * Reset all metrics (for reusing monitor instance)
   */
  reset(): void;

  /**
   * Log comprehensive performance report to logger
   */
  logReport(): void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE DISTRIBUTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Histogram bins for relevance score distribution
 * Used for quality analysis and debugging
 */
export interface ScoreBins {
  /** Papers with score 0-3 (very low relevance) */
  readonly veryLow: number;

  /** Papers with score 3-5 (low relevance) */
  readonly low: number;

  /** Papers with score 5-10 (medium relevance) */
  readonly medium: number;

  /** Papers with score 10-20 (high relevance) */
  readonly high: number;

  /** Papers with score 20+ (excellent relevance) */
  readonly excellent: number;
}

/**
 * Statistical summary of score distribution
 */
export interface ScoreDistribution {
  /** Minimum score */
  readonly min: number;

  /** Maximum score */
  readonly max: number;

  /** Mean (average) score */
  readonly mean: number;

  /** Median (50th percentile) score */
  readonly median: number;

  /** 25th percentile score */
  readonly p25: number;

  /** 75th percentile score */
  readonly p75: number;

  /** 90th percentile score */
  readonly p90: number;

  /** Score histogram bins */
  readonly bins: ScoreBins;

  /** Total number of scores */
  readonly count: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE OPTIMIZATION METADATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Metadata about optimization applied during pipeline
 * Helps track which optimizations were used
 */
export interface OptimizationMetadata {
  /** Whether in-place mutations were used */
  readonly inPlaceMutations: boolean;

  /** Number of array copies created (target: 2, baseline: 7) */
  readonly arrayCopiesCreated: number;

  /** Number of sort operations (target: 1, baseline: 4) */
  readonly sortOperations: number;

  /** Whether performance monitoring was enabled */
  readonly monitoringEnabled: boolean;

  /** Optimization version identifier */
  readonly optimizationVersion: string;
}

/**
 * Complete performance optimization report
 * Combines pipeline metrics with optimization metadata
 */
export interface OptimizationReport extends PipelinePerformanceReport {
  /** Optimization metadata */
  readonly optimization: OptimizationMetadata;

  /** Comparison with baseline (if available) */
  readonly baseline?: {
    readonly duration: number;
    readonly peakMemory: number;
    readonly improvement: {
      readonly durationPercent: number;  // Negative = faster
      readonly memoryPercent: number;    // Negative = less memory
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS AND UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type guard to check if object is a valid MemorySnapshot
 */
export function isMemorySnapshot(obj: unknown): obj is MemorySnapshot {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'timestamp' in obj &&
    'heapUsed' in obj &&
    'heapTotal' in obj &&
    'external' in obj &&
    'arrayBuffers' in obj &&
    'rss' in obj &&
    typeof (obj as MemorySnapshot).timestamp === 'number' &&
    typeof (obj as MemorySnapshot).heapUsed === 'number' &&
    typeof (obj as MemorySnapshot).heapTotal === 'number'
  );
}

/**
 * Type guard to check if object is a valid StageMetrics
 */
export function isStageMetrics(obj: unknown): obj is StageMetrics {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'stageName' in obj &&
    'duration' in obj &&
    'inputCount' in obj &&
    'outputCount' in obj &&
    typeof (obj as StageMetrics).stageName === 'string' &&
    typeof (obj as StageMetrics).duration === 'number'
  );
}

/**
 * Safely calculate pass rate percentage
 * @param outputCount - Number of papers after filtering
 * @param inputCount - Number of papers before filtering
 * @returns Pass rate as percentage (0-100), or 0 if inputCount is 0
 */
export function calculatePassRate(outputCount: number, inputCount: number): number {
  if (inputCount === 0) return 0;
  return (outputCount / inputCount) * 100;
}

/**
 * Format bytes as human-readable string
 * @param bytes - Number of bytes (can be negative for memory deltas)
 * @returns Formatted string (e.g., "1.2 MB", "-500 KB")
 *
 * BUG FIX (Phase 10.99 Week 2 Code Review):
 * - Added support for negative values (memory freed during GC)
 * - Added PB and EB units to prevent array bounds errors
 * - Clamped index to valid range
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  // Handle negative values (memory freed during GC)
  const sign = bytes < 0 ? '-' : '';
  const absBytes = Math.abs(bytes);

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const k = 1024;
  const i = Math.min(
    Math.floor(Math.log(absBytes) / Math.log(k)),
    units.length - 1  // Clamp to valid index range
  );

  return `${sign}${(absBytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format milliseconds as human-readable duration
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "1.2s", "500ms", "2m 30s")
 *
 * BUG FIX (Phase 10.99 Week 2 Code Review):
 * - Added handling for negative values (clock changes)
 */
export function formatDuration(ms: number): string {
  // Handle negative durations (system clock changes)
  if (ms < 0) return '0ms';

  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
