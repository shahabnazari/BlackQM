/**
 * Phase 10.113 Week 10: Search Stream DTOs
 *
 * Type definitions for progressive search streaming.
 * Enables <2s Time to First Result by streaming results as sources respond.
 *
 * @module LiteratureModule
 * @since Phase 10.113 Week 10
 */

import { Paper, LiteratureSource } from './literature.dto';

// ============================================================================
// SOURCE TIER CONFIGURATION
// ============================================================================

/**
 * Source tiers by expected response time
 * Used for progressive streaming - fast sources emit first
 */
export enum SourceTier {
  FAST = 'fast',       // <2s: OpenAlex, CrossRef, ERIC, arXiv
  MEDIUM = 'medium',   // <5s: Semantic Scholar, Springer
  SLOW = 'slow',       // <15s: PubMed, PMC, CORE
}

/**
 * Source tier configuration with expected response times
 */
export const SOURCE_TIER_CONFIG: Record<LiteratureSource, { tier: SourceTier; expectedMs: number }> = {
  [LiteratureSource.OPENALEX]: { tier: SourceTier.FAST, expectedMs: 1500 },
  [LiteratureSource.CROSSREF]: { tier: SourceTier.FAST, expectedMs: 1500 },
  [LiteratureSource.ERIC]: { tier: SourceTier.FAST, expectedMs: 1500 },
  [LiteratureSource.ARXIV]: { tier: SourceTier.FAST, expectedMs: 2000 },
  [LiteratureSource.SSRN]: { tier: SourceTier.FAST, expectedMs: 2000 },
  [LiteratureSource.SEMANTIC_SCHOLAR]: { tier: SourceTier.MEDIUM, expectedMs: 4000 },
  [LiteratureSource.SPRINGER]: { tier: SourceTier.MEDIUM, expectedMs: 4000 },
  [LiteratureSource.NATURE]: { tier: SourceTier.MEDIUM, expectedMs: 4000 },
  [LiteratureSource.PUBMED]: { tier: SourceTier.SLOW, expectedMs: 8000 },
  // Phase 10.116: Realistic PMC expected time (parallel batches: 25-40s for 300+ papers)
  [LiteratureSource.PMC]: { tier: SourceTier.SLOW, expectedMs: 35000 },
  [LiteratureSource.CORE]: { tier: SourceTier.SLOW, expectedMs: 12000 },
  [LiteratureSource.GOOGLE_SCHOLAR]: { tier: SourceTier.SLOW, expectedMs: 15000 },
  [LiteratureSource.WEB_OF_SCIENCE]: { tier: SourceTier.SLOW, expectedMs: 10000 },
  [LiteratureSource.SCOPUS]: { tier: SourceTier.SLOW, expectedMs: 10000 },
  [LiteratureSource.IEEE_XPLORE]: { tier: SourceTier.MEDIUM, expectedMs: 5000 },
  [LiteratureSource.WILEY]: { tier: SourceTier.MEDIUM, expectedMs: 5000 },
  [LiteratureSource.SAGE]: { tier: SourceTier.MEDIUM, expectedMs: 5000 },
  [LiteratureSource.TAYLOR_FRANCIS]: { tier: SourceTier.MEDIUM, expectedMs: 5000 },
};

// ============================================================================
// QUERY INTELLIGENCE CONSTANTS
// ============================================================================

/**
 * Confidence scores and thresholds for query intelligence analysis
 * Eliminates magic numbers across SearchStreamService and LiteratureController
 */
export const QUERY_INTELLIGENCE_CONFIG = {
  // Correction confidence when query differs from optimized
  CORRECTION_CONFIDENCE: 0.9,

  // Methodology detection confidence
  METHODOLOGY_DETECTED_CONFIDENCE: 0.85,
  METHODOLOGY_NOT_DETECTED_CONFIDENCE: 0,

  // Controversy scores
  CONTROVERSY_HAS_TERMS_SCORE: 0.7,
  CONTROVERSY_NEUTRAL_SCORE: 0.3,

  // Result estimates
  ESTIMATE_MIN: 20,
  ESTIMATE_MAX: 500,
  ESTIMATE_CONFIDENCE: 0.6,

  // Search limits
  // Phase 10.115: Increased from 20/50 to match tier allocations (300-500)
  DEFAULT_LIMIT: 300,
  MAX_PER_SOURCE_LIMIT: 500,

  // Query suggestions
  MAX_SUGGESTIONS: 3,

  // Broadness threshold (queries with fewer words are "too broad")
  MIN_WORDS_FOR_FOCUSED: 2,
} as const;

// ============================================================================
// QUERY INTELLIGENCE TYPES
// ============================================================================

/**
 * Spell correction result
 */
export interface SpellCorrection {
  original: string;
  corrected: string;
  confidence: number;
}

/**
 * Detected research methodology
 */
export interface MethodologyDetection {
  detected: string | null;
  confidence: number;
  relatedTerms: string[];
}

/**
 * Controversy scoring for Q-methodology
 */
export interface ControversyScore {
  score: number;           // 0-1 scale
  terms: string[];         // Contributing terms
  explanation: string;
}

/**
 * Query broadness assessment
 */
export interface BroadnessAssessment {
  isTooBroad: boolean;
  score: number;           // 0-1 scale, lower is more focused
  suggestions: string[];   // Refinement suggestions
}

/**
 * Query quality assessment
 */
export interface QueryQuality {
  score: number;           // 0-100
  issues: string[];        // Identified issues
  suggestions: string[];   // Improvement suggestions
}

/**
 * Query refinement suggestion
 */
export interface QuerySuggestion {
  query: string;
  reason: string;
  expectedImprovement: string;
}

/**
 * Complete query intelligence result
 * Returned by /search/analyze endpoint
 */
export interface QueryIntelligence {
  // Original query
  originalQuery: string;

  // Spell correction
  corrections: SpellCorrection | null;
  correctedQuery: string;

  // Query quality
  quality: QueryQuality;

  // Methodology detection
  methodology: MethodologyDetection;

  // Controversy potential (for Q-methodology)
  controversy: ControversyScore;

  // Broadness assessment
  broadness: BroadnessAssessment;

  // Estimated results
  estimate: {
    min: number;
    max: number;
    confidence: number;
  };

  // Suggested refinements
  suggestions: QuerySuggestion[];

  // Processing time
  analysisTimeMs: number;
}

// ============================================================================
// SEARCH STREAM EVENTS
// ============================================================================

/**
 * Source status for real-time tracking
 */
export type SourceStatus = 'pending' | 'searching' | 'complete' | 'error' | 'skipped';

/**
 * Individual source statistics
 */
export interface SourceStats {
  source: LiteratureSource;
  status: SourceStatus;
  tier: SourceTier;
  paperCount: number;
  timeMs: number;
  error?: string;
}

/**
 * Search started event payload
 */
export interface SearchStartedEvent {
  searchId: string;
  query: string;
  correctedQuery: string;
  intelligence: QueryIntelligence;
  timestamp: number;
}

/**
 * Source started searching event
 */
export interface SourceStartedEvent {
  searchId: string;
  source: LiteratureSource;
  tier: SourceTier;
  estimatedTimeMs: number;
  timestamp: number;
}

/**
 * Source completed event
 */
export interface SourceCompleteEvent {
  searchId: string;
  source: LiteratureSource;
  tier: SourceTier;
  paperCount: number;
  timeMs: number;
  timestamp: number;
}

/**
 * Source error event
 */
export interface SourceErrorEvent {
  searchId: string;
  source: LiteratureSource;
  error: string;
  recoverable: boolean;
  timestamp: number;
}

/**
 * Papers batch event - streamed progressively
 */
export interface PapersBatchEvent {
  searchId: string;
  papers: Paper[];
  source: LiteratureSource;
  batchNumber: number;
  cumulativeCount: number;
  timestamp: number;
}

/**
 * Search progress event
 */
export interface SearchProgressEvent {
  searchId: string;
  stage: 'analyzing' | 'fast-sources' | 'medium-sources' | 'slow-sources' | 'ranking' | 'complete';
  percent: number;
  message: string;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  timestamp: number;
}

/**
 * Enrichment result for a paper
 */
export interface PaperEnrichmentEvent {
  searchId: string;
  paperId: string;
  citationCount: number;
  impactFactor?: number;
  hIndexJournal?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  venue?: string;
  fieldsOfStudy?: string[];
  timestamp: number;
}

/**
 * Search complete event
 */
export interface SearchCompleteEvent {
  searchId: string;
  totalPapers: number;
  uniquePapers: number;
  totalTimeMs: number;
  sourceStats: SourceStats[];
  enrichmentStats: {
    enriched: number;
    pending: number;
    failed: number;
  };
  timestamp: number;
}

// ============================================================================
// STREAM CONFIGURATION
// ============================================================================

/**
 * Configuration for progressive search streaming
 */
export interface SearchStreamConfig {
  // Emit batching
  minBatchSize: number;           // Min papers per emit (default: 5)
  maxBatchWaitMs: number;         // Max wait before emit (default: 500)

  // Progressive enrichment
  enrichOnView: boolean;          // Only enrich papers in viewport
  enrichBatchSize: number;        // Papers to enrich per batch

  // Timeouts
  fastSourceTimeoutMs: number;    // Timeout for fast sources
  mediumSourceTimeoutMs: number;  // Timeout for medium sources
  slowSourceTimeoutMs: number;    // Timeout for slow sources

  // Quality thresholds
  minPapersBeforeRanking: number; // Min papers before initial ranking
}

/**
 * Phase 10.115: Netflix-Grade Stream Configuration
 *
 * TIMEOUT OPTIMIZATION FOR 300-500 PAPER FETCHES:
 * - Fast sources: 3s → 8s (allows fetching up to 500 papers from OpenAlex, CrossRef)
 * - Medium sources: 8s → 15s (allows fetching up to 400 papers from Semantic Scholar)
 * - Slow sources: 20s → 35s (allows fetching up to 300 papers from PubMed, PMC)
 *
 * These timeouts align with TIER_ALLOCATIONS in source-allocation.constants.ts:
 * - Tier 1 (Premium): 500 papers
 * - Tier 2 (Good): 400 papers
 * - Tier 3 (Standard): 300 papers
 * - Tier 4 (Supplementary): 300 papers
 */
export const DEFAULT_STREAM_CONFIG: SearchStreamConfig = {
  minBatchSize: 5,
  maxBatchWaitMs: 500,
  enrichOnView: true,
  enrichBatchSize: 10,
  // Phase 10.115: Increased timeouts for 300-500 paper fetches
  // Phase 10.116: Aligned with AdaptiveTimeoutService.DEFAULT_TIMEOUTS (PMC: 65s)
  fastSourceTimeoutMs: 8000,     // 3s → 8s (was too tight for 300+ papers)
  mediumSourceTimeoutMs: 15000,  // 8s → 15s (allows 400 papers from Semantic Scholar)
  slowSourceTimeoutMs: 70000,    // 60s → 70s (PMC needs 65s max with parallel batches, +5s buffer)
  minPapersBeforeRanking: 10,
};

// ============================================================================
// LAZY ENRICHMENT TYPES
// ============================================================================

/**
 * Enrichment request from frontend
 */
export interface EnrichmentRequest {
  searchId: string;
  paperIds: string[];
  priority: 'high' | 'normal';  // High = user clicked/hovered
}

/**
 * Enrichment batch result
 */
export interface EnrichmentBatchResult {
  searchId: string;
  enrichments: PaperEnrichmentEvent[];
  failedIds: string[];
  timeMs: number;
}

// ============================================================================
// PHASE 10.113 WEEK 11: SEMANTIC TIER TYPES
// ============================================================================

/**
 * Semantic ranking tier names
 * - immediate: First 50 papers, <500ms latency
 * - refined: Next 150 papers, <2s latency
 * - complete: Remaining 400 papers, background
 */
export type SemanticTierName = 'immediate' | 'refined' | 'complete';

/**
 * Semantic tier processing metadata
 */
export interface SemanticTierMetadata {
  /** Papers processed in this tier */
  papersProcessed: number;
  /** Cache hits */
  cacheHits: number;
  /** New embeddings generated */
  embedGenerated: number;
  /** Worker pool used */
  usedWorkerPool: boolean;
}

/**
 * Semantic tier result event
 * Emitted when a tier completes processing
 */
export interface SemanticTierEvent {
  /** Search ID */
  searchId: string;
  /** Tier that completed */
  tier: SemanticTierName;
  /** Version number for ordering guarantee */
  version: number;
  /** Re-ranked papers after this tier */
  papers: Paper[];
  /** Total latency from search start */
  latencyMs: number;
  /** Whether this is the final tier */
  isComplete: boolean;
  /** Processing metadata */
  metadata: SemanticTierMetadata;
  /** Timestamp */
  timestamp: number;
}

/**
 * Semantic processing progress event
 */
export interface SemanticProgressEvent {
  searchId: string;
  tier: SemanticTierName;
  papersProcessed: number;
  papersTotal: number;
  percent: number;
  message: string;
  timestamp: number;
}

// ============================================================================
// PHASE 10.155: ITERATIVE FETCH TYPES
// ============================================================================

/**
 * Stop reasons for iterative fetching loop
 */
export type IterationStopReason =
  | 'TARGET_REACHED'        // filtered.length >= targetCount
  | 'RELAXING_THRESHOLD'    // Need more papers, relaxing threshold
  | 'MAX_ITERATIONS'        // Hit max iteration count
  | 'DIMINISHING_RETURNS'   // yieldRate < threshold
  | 'SOURCES_EXHAUSTED'     // All sources returned < 50% of requested
  | 'MIN_THRESHOLD'         // Cannot relax below minimum
  | 'USER_CANCELLED'        // User clicked cancel
  | 'TIMEOUT';              // Iteration timeout

/**
 * Iterative fetch progress event
 * Emitted during iterative paper fetching to show honest progress
 *
 * Phase 10.155: Netflix-grade iterative fetching
 */
export interface IterationProgressEvent {
  /** Event type */
  type: 'iteration_start' | 'iteration_progress' | 'iteration_complete';
  /** Search ID for correlation */
  searchId: string;
  /** Current iteration number (1-based) */
  iteration: number;
  /** Total iterations allowed */
  totalIterations: number;
  /** Current fetch limit per source */
  fetchLimit: number;
  /** Current quality threshold (overallScore) */
  threshold: number;
  /** Papers found so far above threshold */
  papersFound: number;
  /** Target paper count */
  targetPapers: number;
  /** New papers found in this iteration */
  newPapersThisIteration: number;
  /** Yield rate for this iteration (0-1) */
  yieldRate: number;
  /** Sources marked as exhausted */
  sourcesExhausted: string[];
  /** Stop reason (only on iteration_complete) */
  reason?: IterationStopReason;
  /** Detected academic field */
  field?: string;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

/**
 * All possible WebSocket event types
 */
export type SearchStreamEventType =
  | 'search:started'
  | 'search:source-started'
  | 'search:source-complete'
  | 'search:source-error'
  | 'search:papers'
  | 'search:progress'
  | 'search:enrichment'
  | 'search:complete'
  | 'search:error'
  // Phase 10.113 Week 11: Semantic tier events
  | 'search:semantic-tier'
  | 'search:semantic-progress'
  // Phase 10.155: Iterative fetch events
  | 'search:iteration-start'
  | 'search:iteration-progress'
  | 'search:iteration-complete';

/**
 * Generic search stream event
 */
export interface SearchStreamEvent<T = unknown> {
  type: SearchStreamEventType;
  data: T;
}
