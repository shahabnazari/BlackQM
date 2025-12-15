/**
 * Phase 10.155: Iterative Fetch Service
 *
 * Netflix-grade iterative paper fetching with adaptive quality thresholds.
 * Guarantees delivery of target papers (or maximum available) through
 * progressive threshold relaxation and iterative re-fetching.
 *
 * Key Innovation:
 * - Iterative loop: COLLECT → SCORE → FILTER → CHECK TARGET → (loop back if needed)
 * - Adaptive thresholds: Field-based initial values with progressive relaxation
 * - Smart stop conditions: Target reached, diminishing returns, source exhaustion
 * - Honest progress: Real-time iteration events for accurate UI feedback
 *
 * Architecture:
 * - Works alongside SearchPipelineService, not replacing it
 * - Uses overallScore (harmonic mean) for filtering, not qualityScore
 * - Coordinates with SearchStreamService for WebSocket events
 *
 * @module LiteratureSearch
 * @since Phase 10.155
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AdaptiveQualityThresholdService,
  AcademicField,
  ThresholdRecommendation,
} from './adaptive-quality-threshold.service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for iterative fetching
 */
export interface IterativeFetchConfig {
  /** Target number of papers to deliver */
  targetPaperCount: number;
  /** Maximum iterations before stopping */
  maxIterations: number;
  /** Base fetch limit per source */
  baseFetchLimit: number;
  /** Maximum fetch limit (cap) */
  maxFetchLimit: number;
  /** Minimum acceptable quality threshold */
  minThreshold: number;
  /** Diminishing returns threshold (0-1) - stop if yield rate drops below */
  diminishingReturnsThreshold: number;
  /** Source exhaustion threshold (0-1) - mark source exhausted if returns below this */
  sourceExhaustionThreshold: number;
  /** Timeout per iteration in milliseconds */
  iterationTimeoutMs: number;
}

/**
 * Result of a single iteration
 */
export interface IterationResult {
  /** Iteration number (1-based) */
  iteration: number;
  /** Current quality threshold used */
  threshold: number;
  /** Papers found that pass the threshold */
  papersFound: number;
  /** Target paper count */
  targetPapers: number;
  /** New unique papers found in this iteration */
  newPapersThisIteration: number;
  /** Yield rate (new papers found / new papers fetched) */
  yieldRate: number;
  /** Sources marked as exhausted */
  sourcesExhausted: string[];
  /** Whether iteration should continue */
  shouldContinue: boolean;
  /** Reason for stop/continue decision */
  reason: StopReason;
  /** Fetch limit used in this iteration */
  fetchLimit: number;
  /** Duration of this iteration in ms */
  durationMs: number;
  /** Timestamp when iteration completed */
  timestamp: number;
}

/**
 * Reasons for stopping the iteration loop
 */
export type StopReason =
  | 'TARGET_REACHED'        // filtered.length >= targetCount
  | 'RELAXING_THRESHOLD'    // Need more papers, relaxing threshold
  | 'MAX_ITERATIONS'        // Hit max iteration count
  | 'DIMINISHING_RETURNS'   // yieldRate < threshold
  | 'SOURCES_EXHAUSTED'     // All sources returned < 50% of requested
  | 'MIN_THRESHOLD'         // Cannot relax below minimum
  | 'USER_CANCELLED'        // User clicked cancel
  | 'TIMEOUT';              // Iteration timeout

/**
 * Progress event emitted during iteration
 */
export interface IterationProgressEvent {
  /** Event type */
  type: 'iteration_start' | 'iteration_progress' | 'iteration_complete';
  /** Search ID for correlation */
  searchId: string;
  /** Current iteration number */
  iteration: number;
  /** Total iterations allowed */
  totalIterations: number;
  /** Current fetch limit */
  fetchLimit: number;
  /** Current quality threshold */
  threshold: number;
  /** Papers found so far above threshold */
  papersFound: number;
  /** Target paper count */
  targetPapers: number;
  /** New papers found in this iteration */
  newPapersThisIteration: number;
  /** Yield rate for this iteration */
  yieldRate: number;
  /** Sources marked as exhausted */
  sourcesExhausted: string[];
  /** Stop reason (only on iteration_complete) */
  reason?: StopReason;
  /** Timestamp */
  timestamp: number;
}

/**
 * State for tracking iteration progress
 */
export interface IterationState {
  /** All unique papers collected (deduped by DOI/title) */
  allPapers: Map<string, PaperWithOverallScore>;
  /** Current quality threshold */
  currentThreshold: number;
  /** Current iteration number */
  currentIteration: number;
  /** Sources marked as exhausted */
  exhaustedSources: Set<string>;
  /** Previous count of filtered papers (for yield rate) */
  previousFilteredCount: number;
  /** Whether user has cancelled */
  cancelled: boolean;
  /** Detected academic field */
  field: AcademicField;
  /** Start timestamp */
  startTime: number;
}

/**
 * Paper type with guaranteed overallScore
 */
export interface PaperWithOverallScore {
  /** Unique identifier (DOI or normalized title) */
  id: string;
  /** Paper DOI if available */
  doi?: string;
  /** Paper title */
  title: string;
  /** Paper abstract */
  abstract?: string;
  /** Quality score (metadata-based) */
  qualityScore?: number;
  /** Overall score (harmonic mean of relevance + quality) */
  overallScore: number;
  /** Neural relevance score */
  neuralRelevanceScore?: number;
  /** Source this paper came from */
  source?: string;
  /** All other paper properties */
  [key: string]: unknown;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration for iterative fetching
 */
const DEFAULT_CONFIG: IterativeFetchConfig = {
  targetPaperCount: 300,
  maxIterations: 4,
  baseFetchLimit: 600,
  maxFetchLimit: 2000,
  minThreshold: 30,
  diminishingReturnsThreshold: 0.05, // 5%
  sourceExhaustionThreshold: 0.5, // 50%
  iterationTimeoutMs: 40000, // 40 seconds
};

/**
 * Fetch limit multipliers per iteration
 * Each iteration increases fetch to find more papers
 * Iteration 1: 600, 2: 900, 3: 1350, 4: 2000
 */
const FETCH_MULTIPLIERS = [1, 1.5, 2.25, 3.33] as const;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class IterativeFetchService {
  private readonly logger = new Logger(IterativeFetchService.name);

  constructor(
    private readonly adaptiveThreshold: AdaptiveQualityThresholdService,
  ) {}

  /**
   * Create initial state for a new iteration loop
   *
   * @param query - Search query for field detection
   * @param config - Iteration configuration
   * @returns Initial iteration state
   */
  createInitialState(query: string, config: IterativeFetchConfig = DEFAULT_CONFIG): IterationState {
    const detection = this.adaptiveThreshold.detectField(query);
    const initialThreshold = this.adaptiveThreshold.getInitialThreshold(detection.field);

    this.logger.log(
      `Creating iteration state for query: "${query.substring(0, 50)}..."` +
      `\n  Field: ${detection.field} (confidence: ${detection.confidence.toFixed(2)})` +
      `\n  Initial threshold: ${initialThreshold}` +
      `\n  Target papers: ${config.targetPaperCount}`
    );

    return {
      allPapers: new Map(),
      currentThreshold: initialThreshold,
      currentIteration: 0,
      exhaustedSources: new Set(),
      previousFilteredCount: 0,
      cancelled: false,
      field: detection.field,
      startTime: Date.now(),
    };
  }

  /**
   * Get the fetch limit for the current iteration
   *
   * @param iteration - Current iteration number (1-based)
   * @param config - Iteration configuration
   * @returns Fetch limit for this iteration
   */
  getFetchLimitForIteration(iteration: number, config: IterativeFetchConfig = DEFAULT_CONFIG): number {
    const multiplierIndex = Math.min(iteration - 1, FETCH_MULTIPLIERS.length - 1);
    const multiplier = FETCH_MULTIPLIERS[multiplierIndex];
    const fetchLimit = Math.round(config.baseFetchLimit * multiplier);
    return Math.min(fetchLimit, config.maxFetchLimit);
  }

  /**
   * Generate a unique key for paper deduplication
   *
   * Priority: DOI > normalized title
   *
   * @param paper - Paper to generate key for
   * @returns Unique key string
   */
  generatePaperKey(paper: { doi?: string; title?: string }): string {
    // Prefer DOI if available (most reliable)
    if (paper.doi && paper.doi.trim().length > 0) {
      return `doi:${paper.doi.toLowerCase().trim()}`;
    }

    // Fallback to normalized title
    if (paper.title && paper.title.trim().length > 0) {
      return `title:${this.normalizeTitle(paper.title)}`;
    }

    // Last resort: random key (should rarely happen)
    return `unknown:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize title for deduplication
   *
   * Removes punctuation, lowercase, collapse whitespace
   *
   * @param title - Paper title
   * @returns Normalized title
   */
  normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim()
      .substring(0, 100);       // Truncate for efficiency
  }

  /**
   * Check if an iteration should continue
   *
   * @param state - Current iteration state
   * @param filteredCount - Papers passing current threshold
   * @param newPapersCount - New unique papers found this iteration
   * @param totalSourceCount - Total number of sources being queried
   * @param config - Iteration configuration
   * @returns Stop reason and whether to continue
   */
  shouldContinue(
    state: IterationState,
    filteredCount: number,
    newPapersCount: number,
    totalSourceCount: number,
    config: IterativeFetchConfig = DEFAULT_CONFIG,
  ): { shouldContinue: boolean; reason: StopReason } {
    // Check user cancellation
    if (state.cancelled) {
      return { shouldContinue: false, reason: 'USER_CANCELLED' };
    }

    // Check target reached
    if (filteredCount >= config.targetPaperCount) {
      return { shouldContinue: false, reason: 'TARGET_REACHED' };
    }

    // Check max iterations
    if (state.currentIteration >= config.maxIterations) {
      return { shouldContinue: false, reason: 'MAX_ITERATIONS' };
    }

    // Check source exhaustion
    if (state.exhaustedSources.size >= totalSourceCount) {
      return { shouldContinue: false, reason: 'SOURCES_EXHAUSTED' };
    }

    // Check diminishing returns (only after first iteration)
    if (state.currentIteration > 1) {
      const newFilteredCount = filteredCount - state.previousFilteredCount;
      const yieldRate = newPapersCount > 0 ? newFilteredCount / newPapersCount : 0;

      if (yieldRate < config.diminishingReturnsThreshold) {
        return { shouldContinue: false, reason: 'DIMINISHING_RETURNS' };
      }
    }

    // Check if we can relax threshold further
    const nextThreshold = this.adaptiveThreshold.getNextThreshold(
      state.currentThreshold,
      state.currentIteration,
    );

    if (nextThreshold === null) {
      return { shouldContinue: false, reason: 'MIN_THRESHOLD' };
    }

    // Continue with relaxed threshold
    return { shouldContinue: true, reason: 'RELAXING_THRESHOLD' };
  }

  /**
   * Process iteration results and update state
   *
   * @param state - Current iteration state
   * @param newPapers - New papers fetched in this iteration
   * @param config - Iteration configuration
   * @returns Iteration result
   */
  processIterationResults(
    state: IterationState,
    newPapers: PaperWithOverallScore[],
    sourcePaperCounts: Map<string, number>,
    totalSourceCount: number,
    config: IterativeFetchConfig = DEFAULT_CONFIG,
  ): IterationResult {
    const iterationStartTime = Date.now();
    state.currentIteration++;

    // Deduplicate and merge new papers
    let newUniquePapers = 0;
    for (const paper of newPapers) {
      const key = this.generatePaperKey(paper);
      if (!state.allPapers.has(key)) {
        state.allPapers.set(key, paper);
        newUniquePapers++;
      }
    }

    // Track exhausted sources
    const fetchLimit = this.getFetchLimitForIteration(state.currentIteration, config);
    const exhaustionThreshold = fetchLimit * config.sourceExhaustionThreshold;

    sourcePaperCounts.forEach((count, source) => {
      if (count < exhaustionThreshold) {
        state.exhaustedSources.add(source);
      }
    });

    // Filter papers by current threshold
    const filteredPapers = [...state.allPapers.values()].filter(
      paper => paper.overallScore >= state.currentThreshold
    );

    // Calculate yield rate
    const newFilteredCount = filteredPapers.length - state.previousFilteredCount;
    const yieldRate = newUniquePapers > 0 ? newFilteredCount / newUniquePapers : 0;

    // Determine if we should continue
    const { shouldContinue, reason } = this.shouldContinue(
      state,
      filteredPapers.length,
      newUniquePapers,
      totalSourceCount,
      config,
    );

    // Update state for next iteration
    state.previousFilteredCount = filteredPapers.length;

    // If continuing, relax threshold for next iteration
    if (shouldContinue && reason === 'RELAXING_THRESHOLD') {
      const nextThreshold = this.adaptiveThreshold.getNextThreshold(
        state.currentThreshold,
        state.currentIteration,
      );
      if (nextThreshold !== null) {
        state.currentThreshold = nextThreshold;
      }
    }

    const result: IterationResult = {
      iteration: state.currentIteration,
      threshold: state.currentThreshold,
      papersFound: filteredPapers.length,
      targetPapers: config.targetPaperCount,
      newPapersThisIteration: newUniquePapers,
      yieldRate,
      sourcesExhausted: [...state.exhaustedSources],
      shouldContinue,
      reason,
      fetchLimit,
      durationMs: Date.now() - iterationStartTime,
      timestamp: Date.now(),
    };

    this.logger.log(
      `Iteration ${result.iteration} complete:` +
      `\n  Papers found: ${result.papersFound}/${result.targetPapers}` +
      `\n  New unique: ${result.newPapersThisIteration}` +
      `\n  Yield rate: ${(result.yieldRate * 100).toFixed(1)}%` +
      `\n  Threshold: ${result.threshold}` +
      `\n  Reason: ${result.reason}` +
      `\n  Continue: ${result.shouldContinue}`
    );

    return result;
  }

  /**
   * Get papers from state that pass the current threshold
   *
   * @param state - Iteration state
   * @param targetCount - Number of papers to return
   * @returns Sorted, filtered papers
   */
  getFilteredPapers(state: IterationState, targetCount: number): PaperWithOverallScore[] {
    const papers = [...state.allPapers.values()];

    // Filter by current threshold
    const filtered = papers.filter(p => p.overallScore >= state.currentThreshold);

    // Sort by overall score (descending)
    filtered.sort((a, b) => b.overallScore - a.overallScore);

    // Return top N
    return filtered.slice(0, targetCount);
  }

  /**
   * Create iteration progress event for WebSocket emission
   *
   * @param searchId - Search ID for correlation
   * @param result - Iteration result
   * @param type - Event type
   * @returns Progress event
   */
  createProgressEvent(
    searchId: string,
    result: IterationResult,
    type: 'iteration_start' | 'iteration_progress' | 'iteration_complete',
  ): IterationProgressEvent {
    return {
      type,
      searchId,
      iteration: result.iteration,
      totalIterations: DEFAULT_CONFIG.maxIterations,
      fetchLimit: result.fetchLimit,
      threshold: result.threshold,
      papersFound: result.papersFound,
      targetPapers: result.targetPapers,
      newPapersThisIteration: result.newPapersThisIteration,
      yieldRate: result.yieldRate,
      sourcesExhausted: result.sourcesExhausted,
      reason: type === 'iteration_complete' ? result.reason : undefined,
      timestamp: result.timestamp,
    };
  }

  /**
   * Cancel the current iteration loop
   *
   * @param state - Iteration state to cancel
   */
  cancelIteration(state: IterationState): void {
    state.cancelled = true;
    this.logger.log(`Iteration cancelled after ${state.currentIteration} iterations`);
  }

  /**
   * Get default configuration
   *
   * @returns Default iteration config
   */
  getDefaultConfig(): IterativeFetchConfig {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Get threshold recommendation for a query
   *
   * @param query - Search query
   * @returns Threshold recommendation with context
   */
  getThresholdRecommendation(query: string): ThresholdRecommendation {
    return this.adaptiveThreshold.getThresholdRecommendation(query);
  }

  /**
   * Get stats summary for logging/debugging
   *
   * @param state - Iteration state
   * @param config - Configuration
   * @returns Human-readable summary
   */
  getStatsSummary(state: IterationState, config: IterativeFetchConfig = DEFAULT_CONFIG): string {
    const filtered = this.getFilteredPapers(state, config.targetPaperCount);
    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);

    return [
      `\n${'═'.repeat(60)}`,
      `ITERATIVE FETCH SUMMARY`,
      `${'═'.repeat(60)}`,
      `  Field: ${state.field}`,
      `  Iterations: ${state.currentIteration}/${config.maxIterations}`,
      `  Final threshold: ${state.currentThreshold}`,
      `  Total unique papers: ${state.allPapers.size}`,
      `  Papers above threshold: ${filtered.length}`,
      `  Target: ${config.targetPaperCount}`,
      `  Achievement: ${((filtered.length / config.targetPaperCount) * 100).toFixed(1)}%`,
      `  Exhausted sources: ${state.exhaustedSources.size}`,
      `  Elapsed time: ${elapsed}s`,
      `${'═'.repeat(60)}\n`,
    ].join('\n');
  }
}
