/**
 * Phase 10.113 Week 10: Search Stream Types
 *
 * Frontend types for progressive search streaming via WebSocket.
 * Mirrors backend DTOs from search-stream.dto.ts for type safety.
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 10
 */

import { Paper } from './literature.types';

// ============================================================================
// SOURCE TIER CONFIGURATION
// ============================================================================

/**
 * Source tiers by expected response time
 */
export type SourceTier = 'fast' | 'medium' | 'slow';

/**
 * All available literature sources
 */
export type LiteratureSource =
  | 'openalex'
  | 'crossref'
  | 'eric'
  | 'arxiv'
  | 'ssrn'
  | 'semantic_scholar'
  | 'springer'
  | 'nature'
  | 'pubmed'
  | 'pmc'
  | 'core'
  | 'google_scholar'
  | 'web_of_science'
  | 'scopus'
  | 'ieee_xplore'
  | 'wiley'
  | 'sage'
  | 'taylor_francis';

/**
 * Source tier configuration with expected response times
 */
export const SOURCE_TIER_CONFIG: Record<LiteratureSource, { tier: SourceTier; expectedMs: number }> = {
  openalex: { tier: 'fast', expectedMs: 1500 },
  crossref: { tier: 'fast', expectedMs: 1500 },
  eric: { tier: 'fast', expectedMs: 1500 },
  arxiv: { tier: 'fast', expectedMs: 2000 },
  ssrn: { tier: 'fast', expectedMs: 2000 },
  semantic_scholar: { tier: 'medium', expectedMs: 4000 },
  springer: { tier: 'medium', expectedMs: 4000 },
  nature: { tier: 'medium', expectedMs: 4000 },
  pubmed: { tier: 'slow', expectedMs: 8000 },
  pmc: { tier: 'slow', expectedMs: 10000 },
  core: { tier: 'slow', expectedMs: 12000 },
  google_scholar: { tier: 'slow', expectedMs: 15000 },
  web_of_science: { tier: 'slow', expectedMs: 10000 },
  scopus: { tier: 'slow', expectedMs: 10000 },
  ieee_xplore: { tier: 'medium', expectedMs: 5000 },
  wiley: { tier: 'medium', expectedMs: 5000 },
  sage: { tier: 'medium', expectedMs: 5000 },
  taylor_francis: { tier: 'medium', expectedMs: 5000 },
};

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
  originalQuery: string;
  corrections: SpellCorrection | null;
  correctedQuery: string;
  quality: QueryQuality;
  methodology: MethodologyDetection;
  controversy: ControversyScore;
  broadness: BroadnessAssessment;
  estimate: {
    min: number;
    max: number;
    confidence: number;
  };
  suggestions: QuerySuggestion[];
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
 * Search progress stages
 * Phase 10.158: Added 'selecting' stage for quality selection (600 → 300)
 */
export type SearchStage = 'analyzing' | 'fast-sources' | 'medium-sources' | 'slow-sources' | 'ranking' | 'selecting' | 'complete';

/**
 * Search progress event
 */
export interface SearchProgressEvent {
  searchId: string;
  stage: SearchStage;
  percent: number;
  message: string;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  timestamp: number;
}

/**
 * Paper enrichment event
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

/**
 * Search error event
 */
export interface SearchErrorEvent {
  searchId: string;
  error: string;
  code?: string;
  recoverable: boolean;
  timestamp: number;
}

/**
 * Phase 10.158: Quality selection complete event
 * Emitted when 600 ranked papers are filtered to top 300
 */
export interface SelectionCompleteEvent {
  searchId: string;
  rankedCount: number;      // Papers before selection (600)
  selectedCount: number;    // Papers after selection (300)
  targetCount: number;      // Target count (300)
  avgQualityScore: number;  // Average quality of selected papers
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
  // Phase 10.158: Quality selection event
  | 'search:selection-complete';

/**
 * WebSocket event name to payload type mapping
 */
export interface SearchStreamEventMap {
  'search:started': SearchStartedEvent;
  'search:source-started': SourceStartedEvent;
  'search:source-complete': SourceCompleteEvent;
  'search:source-error': SourceErrorEvent;
  'search:papers': PapersBatchEvent;
  'search:progress': SearchProgressEvent;
  'search:enrichment': PaperEnrichmentEvent;
  'search:complete': SearchCompleteEvent;
  'search:error': SearchErrorEvent;
}

// ============================================================================
// SEARCH OPTIONS
// ============================================================================

/**
 * Research purpose for purpose-aware search configuration
 * Phase 10.170: Purpose-Aware Search Integration
 */
export type ResearchPurpose =
  | 'q_methodology'
  | 'qualitative_analysis'
  | 'literature_synthesis'
  | 'hypothesis_generation'
  | 'survey_construction';

/**
 * Search options for progressive streaming
 *
 * Phase 10.115: Added sources field for user-selected database filtering
 * Phase 10.170: Added purpose field for purpose-aware search configuration
 */
export interface StreamingSearchOptions {
  /** Maximum papers to return (default: tier-based allocation 300-500) */
  limit?: number;
  page?: number;
  yearFrom?: number;
  yearTo?: number;
  minCitations?: number;
  publicationType?: string;
  author?: string;
  sortBy?: 'relevance' | 'date' | 'citations';
  /**
   * Phase 10.115: User-selected sources for search
   * If not provided, all available sources will be queried
   * Source names should match LiteratureSource enum values (e.g., 'pubmed', 'arxiv', 'openalex')
   */
  sources?: string[];
  /**
   * Phase 10.170: Research purpose for purpose-aware search configuration
   * Affects quality weights, paper limits, and full-text requirements
   */
  purpose?: ResearchPurpose;
  /**
   * Phase 10.195: Only return papers with full-text available
   * When true, filters out papers without hasFullText=true
   */
  hasFullTextOnly?: boolean;
  /**
   * Phase 10.195: Exclude books and book chapters from results
   * When true, filters out books, handbooks, encyclopedias, etc.
   */
  excludeBooks?: boolean;
}

// ============================================================================
// CONNECTION STATE
// ============================================================================

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Search stream state for UI
 */
export interface SearchStreamState {
  // Connection
  connectionStatus: ConnectionStatus;

  // Search state
  searchId: string | null;
  isSearching: boolean;
  query: string;

  // Query intelligence
  intelligence: QueryIntelligence | null;

  // Progress
  stage: SearchStage | null;
  percent: number;
  message: string;

  // Sources
  sourceStats: Map<LiteratureSource, SourceStats>;
  sourcesComplete: number;
  sourcesTotal: number;

  // Results
  papers: Paper[];
  papersFound: number;

  // Enrichment
  enrichedPaperIds: Set<string>;
  enrichmentPending: number;

  // Phase 10.160: Quality selection state (from selection-complete event)
  selectionRankedCount: number;    // Papers before quality filter (from semantic ranking)
  selectionSelectedCount: number;  // Papers after quality filter
  selectionAvgQuality: number;     // Average quality score (0-1)

  // Timing
  startTime: number | null;
  elapsedMs: number;

  // Error
  error: string | null;

  // Phase 10.113 Week 11: Semantic tier tracking
  semanticTier: 'immediate' | 'refined' | 'complete' | null;
  semanticVersion: number;

  // Phase 10.113 Week 12: Semantic tier stats for detailed UI display
  /** Stats for each completed semantic tier */
  semanticTierStats: Map<SemanticTierName, SemanticTierStats>;

  // Phase 10.113 Week 11 Bug 10: User interaction state preservation
  /** IDs of papers user has selected */
  selectedPaperIds: Set<string>;
  /** IDs of papers user has expanded */
  expandedPaperIds: Set<string>;
  /** Scroll position to preserve during re-ranking */
  scrollPosition: number;
}

/**
 * Phase 10.113 Week 12: Semantic tier stats for UI display
 */
export interface SemanticTierStats {
  /** Tier name */
  tier: SemanticTierName;
  /** Whether this tier has completed */
  isComplete: boolean;
  /** Latency in ms from search start */
  latencyMs: number;
  /** Papers processed */
  papersProcessed: number;
  /** Cache hits */
  cacheHits: number;
  /** Embeddings generated */
  embedGenerated: number;
  /** Whether worker pool was used */
  usedWorkerPool: boolean;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Progress message */
  progressMessage: string;
}

/**
 * Initial search stream state
 */
export const INITIAL_SEARCH_STREAM_STATE: SearchStreamState = {
  connectionStatus: 'disconnected',
  searchId: null,
  isSearching: false,
  query: '',
  intelligence: null,
  stage: null,
  percent: 0,
  message: '',
  sourceStats: new Map(),
  sourcesComplete: 0,
  sourcesTotal: 0,
  papers: [],
  papersFound: 0,
  enrichedPaperIds: new Set(),
  enrichmentPending: 0,
  // Phase 10.160: Quality selection state
  selectionRankedCount: 0,
  selectionSelectedCount: 0,
  selectionAvgQuality: 0,
  startTime: null,
  elapsedMs: 0,
  error: null,
  // Phase 10.113 Week 11: Semantic tier state
  semanticTier: null,
  semanticVersion: 0,
  // Phase 10.113 Week 12: Semantic tier stats
  semanticTierStats: new Map(),
  // Phase 10.113 Week 11 Bug 10: User interaction state
  selectedPaperIds: new Set(),
  expandedPaperIds: new Set(),
  scrollPosition: 0,
};

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
 * Paper with semantic score attached
 */
export interface PaperWithSemanticScore extends Paper {
  /** Semantic similarity score (0-1) */
  semanticScore: number;
  /** Combined score (BM25 + Semantic + ThemeFit) */
  combinedScore?: number;
}

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
  papers: PaperWithSemanticScore[];
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

/**
 * Phase 10.113 Week 11 Bug 10: Position change for animation
 */
export interface PositionChange {
  /** Paper ID */
  paperId: string;
  /** Previous position in list */
  from: number;
  /** New position in list */
  to: number;
}

/**
 * Phase 10.113 Week 11 Bug 10: Rerank event with animation metadata
 */
export interface RerankEvent {
  searchId: string;
  papers: PaperWithSemanticScore[];
  reason: 'semantic-tier' | 'user-sort' | 'filter-change';
  tier?: SemanticTierName;
  timestamp: number;
}

/**
 * Phase 10.113 Week 11 Bug 10: Rerank callback options
 */
export interface RerankOptions {
  /** Whether to animate position changes */
  animate: boolean;
  /** Map of paper IDs to position changes */
  positionChanges: Map<string, { from: number; to: number }>;
}

/**
 * Extended WebSocket event types with semantic events
 */
export type ExtendedSearchStreamEventType =
  | SearchStreamEventType
  | 'search:semantic-tier'
  | 'search:semantic-progress';

/**
 * Extended event map with semantic events
 */
export interface ExtendedSearchStreamEventMap extends SearchStreamEventMap {
  'search:semantic-tier': SemanticTierEvent;
  'search:semantic-progress': SemanticProgressEvent;
}

/**
 * Semantic tier display configuration
 * Used for UI tier indicators
 * Phase 10.159: Netflix-grade descriptions aligned with constants.ts
 */
export const SEMANTIC_TIER_CONFIG: Record<SemanticTierName, {
  displayName: string;
  description: string;
  paperRange: string;
  targetLatencyMs: number;
  color: string;
}> = {
  immediate: {
    displayName: 'Instant Preview',
    description: 'Top 50 papers ranked instantly',
    paperRange: '1-50',
    targetLatencyMs: 500,
    color: 'green',
  },
  refined: {
    displayName: 'Semantic Refinement',
    description: 'Top 200 papers with semantic scoring',
    paperRange: '51-200',
    targetLatencyMs: 3000,
    color: 'blue',
  },
  complete: {
    displayName: 'Deep Analysis',
    description: 'All 600 papers with cross-encoder',
    paperRange: '201-600',
    targetLatencyMs: 12000,
    color: 'purple',
  },
};

/**
 * Extended search stream state with semantic tier tracking
 */
export interface ExtendedSearchStreamState extends SearchStreamState {
  /** Current semantic tier */
  semanticTier: SemanticTierName | null;
  /** Semantic tier version (for ordering) */
  semanticVersion: number;
  /** Papers with semantic scores */
  semanticPapers: PaperWithSemanticScore[];
  /** Semantic processing metadata */
  semanticMetadata: SemanticTierMetadata | null;
}

/**
 * Initial extended state
 */
export const INITIAL_EXTENDED_SEARCH_STATE: ExtendedSearchStreamState = {
  ...INITIAL_SEARCH_STREAM_STATE,
  semanticTier: null,
  semanticVersion: 0,
  semanticPapers: [],
  semanticMetadata: null,
};
