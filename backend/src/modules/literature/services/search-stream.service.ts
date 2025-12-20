/**
 * Phase 10.113 Week 10: Search Stream Service
 *
 * Progressive search streaming service that achieves <2s Time to First Result.
 * Streams search results via WebSocket as sources respond, instead of waiting
 * for all sources to complete.
 *
 * Key Features:
 * - Tiered source execution (fast sources emit first)
 * - Real-time progress updates
 * - Batched paper emission for smooth UX
 * - Graceful source failures (never block on errors)
 * - Deduplication as papers stream in
 *
 * @module LiteratureModule
 * @since Phase 10.113 Week 10
 */

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SearchStreamConfig,
  DEFAULT_STREAM_CONFIG,
  SOURCE_TIER_CONFIG,
  QUERY_INTELLIGENCE_CONFIG,
  SourceTier,
  SourceStats,
  SearchStartedEvent,
  SourceStartedEvent,
  SourceCompleteEvent,
  SourceErrorEvent,
  PapersBatchEvent,
  SearchProgressEvent,
  SearchCompleteEvent,
  SearchStreamEvent,
  QueryIntelligence,
  // Phase 10.113 Week 11: Semantic tier types
  SemanticTierEvent,
  SemanticProgressEvent,
} from '../dto/search-stream.dto';
import { Paper, LiteratureSource, SearchLiteratureDto } from '../dto/literature.dto';
import { SourceRouterService } from './source-router.service';
import { LiteratureUtilsService } from './literature-utils.service';
import { ScientificQueryOptimizerService } from './scientific-query-optimizer.service';
// Phase 10.115: Netflix-Grade Integration - Semantic Pipeline + Source Capability
import { SearchPipelineService } from './search-pipeline.service';
import { SourceCapabilityService } from './source-capability.service';
import { detectQueryComplexity } from '../constants/source-allocation.constants';
// Phase 10.113 Week 11: Strict typing for semantic tier results
import { PaperWithSemanticScore } from './progressive-semantic.service';
// Phase 10.180: BM25 scoring for progressive semantic ranking
import { compileQueryPatterns, calculateBM25RelevanceScore } from '../utils/relevance-scoring.util';
// Phase 10.156: Simplified sort-based selection (iteration system removed)
// NOTE (Phase 10.182): Abstract enrichment moved to full-text fetching stage (HtmlFullTextService)

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Precompiled regex patterns for paper ID generation
 * Improves performance by avoiding regex compilation on each call
 */
const DOI_URL_PATTERN = /https?:\/\/doi\.org\//i;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]/g;

/**
 * Phase 10.181: Document types to EXCLUDE from search results
 * We only want peer-reviewed articles, not books, datasets, etc.
 *
 * CrossRef document types reference:
 * https://api.crossref.org/types
 *
 * INCLUDED (not in this list):
 * - journal-article ✅
 * - proceedings-article ✅
 * - posted-content (preprints) ✅
 * - peer-review ✅
 * - dissertation ✅
 *
 * EXCLUDED:
 * - book ❌
 * - book-chapter ❌
 * - book-section ❌
 * - book-part ❌
 * - monograph ❌
 * - edited-book ❌
 * - reference-book ❌
 * - reference-entry ❌
 * - dataset ❌
 * - standard ❌
 * - report ❌ (often not peer-reviewed)
 * - grant ❌
 * - component ❌
 */
const EXCLUDED_DOCUMENT_TYPES = new Set([
  'book',
  'book-chapter',
  'book-section',
  'book-part',
  'book-track',
  'monograph',
  'edited-book',
  'reference-book',
  'reference-entry',
  'dataset',
  'database',
  'standard',
  'grant',
  'component',
  // Lowercase variations for safety
  'Book',
  'Book Chapter',
]);

/**
 * Default expected response time for unknown sources (ms)
 */
const DEFAULT_EXPECTED_MS = 5000;

/**
 * Years back from current for "recent research" suggestion
 */
const RECENT_RESEARCH_YEARS_BACK = 5;

/**
 * Progress percentages for each stage
 */
const PROGRESS_STAGES = {
  analyzing: 5,
  'fast-sources': 25,
  'medium-sources': 50,
  'slow-sources': 75,
  ranking: 90,
  selecting: 97, // Phase 10.158: Quality selection stage (600 → 300)
  complete: 100,
} as const;

/**
 * Human-readable messages for each stage
 */
const STAGE_MESSAGES: Record<string, string[]> = {
  analyzing: [
    'Understanding your research intent...',
    'Detecting methodology & expanding terms...',
    'Query optimized for 18 databases...',
  ],
  'fast-sources': [
    'Searching OpenAlex, CrossRef, arXiv...',
    'Fast sources responding...',
    'Streaming first results...',
  ],
  'medium-sources': [
    'Searching Semantic Scholar, Springer...',
    'Retrieving peer-reviewed articles...',
    'Medium sources completing...',
  ],
  'slow-sources': [
    'Deep search: PubMed, PMC, CORE...',
    'Final databases responding...',
    'Gathering comprehensive results...',
  ],
  ranking: [
    'AI scoring papers with neural embeddings...',
    'BM25 + semantic embeddings...',
    'Cross-encoder re-ranking...',
  ],
  // Phase 10.160: Removed hardcoded counts - actual counts shown in dynamic messages
  selecting: [
    'Computing composite quality scores...',
    'Filtering by harmonic mean (R×Q)...',
    'Selecting top papers by quality...',
  ],
};

/**
 * Phase 10.115: Complete source list for progressive streaming
 *
 * ALL 16 sources are included. SourceCapabilityService filters based on:
 * - ORCID authentication status (for Scopus, Web of Science, IEEE, Wiley, SAGE, T&F)
 * - API key availability
 * - Circuit breaker health
 *
 * Sources requiring ORCID auth will be automatically excluded if user not authenticated.
 */
const ALL_PROGRESSIVE_SOURCES: LiteratureSource[] = [
  // Fast tier (<3s) - Free, no auth required
  LiteratureSource.OPENALEX,
  LiteratureSource.CROSSREF,
  LiteratureSource.ERIC,
  LiteratureSource.ARXIV,
  LiteratureSource.SSRN,
  // Medium tier (<8s) - Mix of free and auth-required
  LiteratureSource.SEMANTIC_SCHOLAR,
  LiteratureSource.SPRINGER,
  LiteratureSource.NATURE,
  LiteratureSource.GOOGLE_SCHOLAR,
  // Medium tier - ORCID auth required for full access
  LiteratureSource.IEEE_XPLORE,
  LiteratureSource.WILEY,
  LiteratureSource.SAGE,
  LiteratureSource.TAYLOR_FRANCIS,
  // Slow tier (<20s) - Comprehensive databases
  LiteratureSource.PUBMED,
  LiteratureSource.PMC,
  LiteratureSource.CORE,
  // Premium tier - ORCID/Institutional auth required
  LiteratureSource.SCOPUS,
  LiteratureSource.WEB_OF_SCIENCE,
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Callback for emitting search events
 */
type EventEmitter = (event: SearchStreamEvent) => void;

/**
 * Internal search state tracking
 */
interface SearchState {
  searchId: string;
  query: string;
  correctedQuery: string;
  startTime: number;
  papers: Map<string, Paper>;  // Deduplication by ID
  sourceStats: Map<LiteratureSource, SourceStats>;
  currentStage: keyof typeof PROGRESS_STAGES;
  batchNumber: number;
  emit: EventEmitter;
  config: SearchStreamConfig;
  aborted: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SearchStreamService {
  private readonly logger = new Logger(SearchStreamService.name);
  private readonly activeSearches = new Map<string, SearchState>();

  constructor(
    private readonly sourceRouter: SourceRouterService,
    private readonly literatureUtils: LiteratureUtilsService,
    private readonly queryOptimizer: ScientificQueryOptimizerService,
    // Phase 10.115: Netflix-Grade Integration
    private readonly searchPipeline: SearchPipelineService,
    private readonly sourceCapability: SourceCapabilityService,
    // NOTE (Phase 10.182): Abstract enrichment moved to HtmlFullTextService (post-search)
  ) {
    this.logger.log(
      '✅ [SearchStreamService] Phase 10.156 - Simplified Sort-Based Ranking',
    );
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Start a progressive search with real-time streaming
   */
  async startProgressiveSearch(
    query: string,
    options: SearchLiteratureDto,
    emit: EventEmitter,
    config: SearchStreamConfig = DEFAULT_STREAM_CONFIG,
  ): Promise<string> {
    const searchId = uuidv4();
    const startTime = Date.now();

    this.logger.log(
      `🚀 [SearchStream] Starting progressive search: "${query}" (ID: ${searchId})`,
    );

    // Initialize search state (Phase 10.156: No iteration state needed)
    const state: SearchState = {
      searchId,
      query,
      correctedQuery: query,
      startTime,
      papers: new Map(),
      sourceStats: new Map(),
      currentStage: 'analyzing',
      batchNumber: 0,
      emit,
      config,
      aborted: false,
    };

    this.activeSearches.set(searchId, state);

    // Phase 10.119: Global heartbeat to keep WebSocket alive during long operations
    // This prevents ping timeout during slow source fetching and ranking
    const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds
    let heartbeatCount = 0;
    const heartbeatInterval = setInterval(() => {
      heartbeatCount++;
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const completedSources = this.getCompletedSourceCount(state);
      const totalSources = state.sourceStats.size || 1;

      // Calculate progress based on current stage
      // Use time-based progress for more consistent UX
      let heartbeatPercent: number;
      if (state.currentStage === 'ranking') {
        // During ranking: 90-98% based on elapsed time (up to 30s)
        const rankingElapsed = Math.min(elapsedSec - 30, 30); // Assume sources take ~30s
        heartbeatPercent = 90 + Math.min(Math.floor(rankingElapsed / 4), 8);
      } else {
        // During source collection: 10-85% based on heartbeat count
        heartbeatPercent = 10 + Math.min(heartbeatCount * 5, 75);
      }

      this.logger.debug(
        `💓 [Heartbeat] ${heartbeatPercent}% - ${state.currentStage} (${completedSources}/${totalSources} sources, ${state.papers.size} papers, ${elapsedSec}s)`
      );

      // Emit progress event to keep WebSocket alive
      const progressEvent: SearchProgressEvent = {
        searchId: state.searchId,
        stage: state.currentStage,
        percent: heartbeatPercent,
        message: `Searching... (${state.papers.size} papers found, ${elapsedSec}s)`,
        sourcesComplete: completedSources,
        sourcesTotal: totalSources,
        papersFound: state.papers.size,
        timestamp: Date.now(),
      };
      state.emit({
        type: 'search:progress',
        data: progressEvent,
      });
    }, HEARTBEAT_INTERVAL_MS);

    try {
      // Stage 1: Analyze query (<100ms)
      await this.stageAnalyzeQuery(state, options);

      if (state.aborted) {
        clearInterval(heartbeatInterval);
        return searchId;
      }

      // Stage 2-4: Execute tiered sources in parallel groups
      await this.stageExecuteSources(state, options);

      if (state.aborted) {
        clearInterval(heartbeatInterval);
        return searchId;
      }

      // NOTE (Phase 10.182): Abstract enrichment moved to post-search full-text fetching stage
      // Rationale: When papers are selected for theme extraction, full-text service visits
      // publisher pages and can extract abstracts from same HTML/PDF (no redundant requests)
      // See: HtmlFullTextService.fetchFullTextWithAbstract()

      // Stage 5: Final ranking (Netflix-grade semantic pipeline)
      await this.stageFinalRanking(state, options);

      // Stage 6: Complete
      clearInterval(heartbeatInterval);
      this.emitComplete(state);

    } catch (error) {
      clearInterval(heartbeatInterval);
      this.logger.error(
        `❌ [SearchStream] Search failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      this.emitError(state, (error as Error).message);
    } finally {
      // Cleanup
      clearInterval(heartbeatInterval);
      this.activeSearches.delete(searchId);
    }

    return searchId;
  }

  /**
   * Cancel an active search
   */
  cancelSearch(searchId: string): boolean {
    const state = this.activeSearches.get(searchId);
    if (state) {
      state.aborted = true;

      this.logger.log(`🛑 [SearchStream] Search cancelled: ${searchId}`);
      return true;
    }
    return false;
  }

  /**
   * Get current search state (for debugging)
   */
  getSearchState(searchId: string): SearchState | undefined {
    return this.activeSearches.get(searchId);
  }

  // ==========================================================================
  // STAGE 1: ANALYZE QUERY
  // ==========================================================================

  private async stageAnalyzeQuery(
    state: SearchState,
    _options: SearchLiteratureDto,
  ): Promise<void> {
    this.emitProgress(state, 'analyzing', STAGE_MESSAGES.analyzing[0]);

    const analysisStart = Date.now();

    // Use ScientificQueryOptimizer to analyze and expand query
    const result = await this.queryOptimizer.optimizeQuery(state.query, 'local');

    // Calculate broadness from quality metrics
    const isTooBroad = result.quality.metrics.isSingleWord ||
      result.quality.metrics.wordCount < QUERY_INTELLIGENCE_CONFIG.MIN_WORDS_FOR_FOCUSED;

    const hasMethodology = result.expansions.methodologyTermsAdded.length > 0;
    const hasControversy = result.expansions.controversyTermsAdded.length > 0;

    // Build query intelligence object from optimization result
    const intelligence: QueryIntelligence = {
      originalQuery: state.query,
      corrections: result.optimizedQuery !== state.query
        ? {
            original: state.query,
            corrected: result.optimizedQuery,
            confidence: QUERY_INTELLIGENCE_CONFIG.CORRECTION_CONFIDENCE,
          }
        : null,
      correctedQuery: result.optimizedQuery,
      quality: {
        score: result.quality.qualityScore,
        issues: [...result.quality.issues],
        suggestions: [...result.quality.suggestions],
      },
      methodology: {
        detected: hasMethodology ? result.expansions.methodologyTermsAdded[0] : null,
        confidence: hasMethodology
          ? QUERY_INTELLIGENCE_CONFIG.METHODOLOGY_DETECTED_CONFIDENCE
          : QUERY_INTELLIGENCE_CONFIG.METHODOLOGY_NOT_DETECTED_CONFIDENCE,
        relatedTerms: [...result.expansions.methodologyTermsAdded],
      },
      controversy: {
        score: hasControversy
          ? QUERY_INTELLIGENCE_CONFIG.CONTROVERSY_HAS_TERMS_SCORE
          : QUERY_INTELLIGENCE_CONFIG.CONTROVERSY_NEUTRAL_SCORE,
        terms: [...result.expansions.controversyTermsAdded],
        explanation: hasControversy
          ? 'Query contains terms that may indicate debated topics'
          : 'Query appears neutral',
      },
      broadness: {
        isTooBroad,
        score: Math.min(1, QUERY_INTELLIGENCE_CONFIG.MIN_WORDS_FOR_FOCUSED / state.query.split(' ').length),
        suggestions: isTooBroad ? ['Consider adding more specific terms'] : [],
      },
      estimate: {
        min: QUERY_INTELLIGENCE_CONFIG.ESTIMATE_MIN,
        max: QUERY_INTELLIGENCE_CONFIG.ESTIMATE_MAX,
        confidence: QUERY_INTELLIGENCE_CONFIG.ESTIMATE_CONFIDENCE,
      },
      suggestions: this.generateQuerySuggestions(state.query, {
        methodologyTerms: [...result.expansions.methodologyTermsAdded],
        controversyTerms: [...result.expansions.controversyTermsAdded],
      }),
      analysisTimeMs: Date.now() - analysisStart,
    };

    // Update state with optimized query
    state.correctedQuery = result.optimizedQuery;

    // Emit search started event with intelligence
    const startedEvent: SearchStartedEvent = {
      searchId: state.searchId,
      query: state.query,
      correctedQuery: state.correctedQuery,
      intelligence,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:started',
      data: startedEvent,
    });

    this.logger.log(
      `📊 [SearchStream] Query analyzed in ${intelligence.analysisTimeMs}ms: ` +
      `corrections=${intelligence.corrections ? 'yes' : 'no'}, ` +
      `methodology=${intelligence.methodology.detected || 'none'}`,
    );
  }

  // ==========================================================================
  // STAGE 2-4: EXECUTE TIERED SOURCES
  // ==========================================================================

  private async stageExecuteSources(
    state: SearchState,
    options: SearchLiteratureDto,
  ): Promise<void> {
    // Phase 10.115: Netflix-Grade Source Selection
    // ============================================================================
    // PRIORITY ORDER:
    // 1. User-selected sources from options.sources (if provided)
    // 2. All available sources filtered by SourceCapabilityService (ORCID auth, health)
    // 3. Fallback to ALL_PROGRESSIVE_SOURCES filtered by availability
    //
    // ORCID-GATED SOURCES (require authentication):
    // - Scopus, Web of Science, IEEE Xplore, Wiley, SAGE, Taylor & Francis
    // These are automatically filtered out if user hasn't authenticated via ORCID.
    // ============================================================================

    // Get available sources (respects ORCID auth, circuit breakers, health scores)
    const availableSources = this.sourceCapability.getAvailableSources();

    // Use user-selected sources if provided, otherwise use all available
    let sourcesToQuery: LiteratureSource[];
    if (options.sources && options.sources.length > 0) {
      // Filter user selection through availability
      sourcesToQuery = options.sources.filter(s => availableSources.includes(s));
      const unavailable = options.sources.filter(s => !availableSources.includes(s));
      if (unavailable.length > 0) {
        this.logger.warn(
          `⚠️ [SearchStream] ${unavailable.length} sources unavailable (ORCID auth or health): ${unavailable.join(', ')}`
        );
      }
    } else {
      // Use all available sources from the complete list
      sourcesToQuery = ALL_PROGRESSIVE_SOURCES.filter(s => availableSources.includes(s));
    }

    this.logger.log(
      `📡 [SearchStream] Using ${sourcesToQuery.length}/${ALL_PROGRESSIVE_SOURCES.length} sources ` +
      `(${availableSources.length} available, ${ALL_PROGRESSIVE_SOURCES.length - availableSources.length} require ORCID auth)`
    );
    // Phase 10.159: Log actual sources being searched for debugging
    this.logger.log(`📡 [SearchStream] Querying: ${sourcesToQuery.join(', ')}`);

    // Group sources by tier
    const tiers = this.groupSourcesByTier(sourcesToQuery);

    this.logger.log(
      `📡 [SearchStream] Sources by tier: ` +
      `fast=${tiers.fast.length}, medium=${tiers.medium.length}, slow=${tiers.slow.length}`,
    );

    // Phase 10.159: Overlapping tier execution for maximum throughput
    // Start all tiers with staggered delays - fast results arrive first, but we don't wait
    // for fast to complete before starting medium/slow sources

    const tierPromises: Promise<void>[] = [];

    // TIER 1: Fast sources - start immediately
    if (tiers.fast.length > 0 && !state.aborted) {
      this.emitProgress(state, 'fast-sources', STAGE_MESSAGES['fast-sources'][0]);
      tierPromises.push(this.executeTierSources(state, options, tiers.fast, SourceTier.FAST));
    }

    // TIER 2: Medium sources - start after 300ms delay (fast sources start emitting)
    if (tiers.medium.length > 0 && !state.aborted) {
      tierPromises.push(
        new Promise<void>(resolve => setTimeout(resolve, 300)).then(async () => {
          if (!state.aborted) {
            this.emitProgress(state, 'medium-sources', STAGE_MESSAGES['medium-sources'][0]);
            await this.executeTierSources(state, options, tiers.medium, SourceTier.MEDIUM);
          }
        })
      );
    }

    // TIER 3: Slow sources - start after 800ms delay (fast sources mostly done)
    if (tiers.slow.length > 0 && !state.aborted) {
      tierPromises.push(
        new Promise<void>(resolve => setTimeout(resolve, 800)).then(async () => {
          if (!state.aborted) {
            this.emitProgress(state, 'slow-sources', STAGE_MESSAGES['slow-sources'][0]);
            await this.executeTierSources(state, options, tiers.slow, SourceTier.SLOW);
          }
        })
      );
    }

    // Wait for all tiers to complete
    await Promise.allSettled(tierPromises);
  }

  private groupSourcesByTier(
    sources: LiteratureSource[],
  ): Record<'fast' | 'medium' | 'slow', LiteratureSource[]> {
    const tiers: Record<'fast' | 'medium' | 'slow', LiteratureSource[]> = {
      fast: [],
      medium: [],
      slow: [],
    };

    for (const source of sources) {
      const config = SOURCE_TIER_CONFIG[source];
      if (config) {
        tiers[config.tier].push(source);
      } else {
        // Default to slow for unknown sources
        tiers.slow.push(source);
      }
    }

    return tiers;
  }

  private async executeTierSources(
    state: SearchState,
    options: SearchLiteratureDto,
    sources: LiteratureSource[],
    tier: SourceTier,
  ): Promise<void> {
    // Get timeout for this tier
    const timeout = this.getTierTimeout(state.config, tier);

    // Execute all sources in parallel within the tier with timeout
    const promises = sources.map(source =>
      this.executeSourceWithTimeout(state, options, source, tier, timeout),
    );

    await Promise.allSettled(promises);
  }

  private async executeSourceWithTimeout(
    state: SearchState,
    options: SearchLiteratureDto,
    source: LiteratureSource,
    tier: SourceTier,
    timeout: number,
  ): Promise<void> {
    const sourceConfig = SOURCE_TIER_CONFIG[source];
    const startTime = Date.now();

    // Initialize source stats
    state.sourceStats.set(source, {
      source,
      status: 'searching',
      tier,
      paperCount: 0,
      timeMs: 0,
    });

    // Emit source started event
    const startedEvent: SourceStartedEvent = {
      searchId: state.searchId,
      source,
      tier,
      estimatedTimeMs: sourceConfig?.expectedMs || DEFAULT_EXPECTED_MS,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:source-started',
      data: startedEvent,
    });

    try {
      // Build search DTO with corrected query
      // Phase 10.159 FIX: Explicitly set limit to undefined to use tier-based allocation
      // The ...options spread was passing options.limit which capped results at 300
      // Now source-router will use getSourceAllocation(source) for tier allocations (500 each)
      const searchDto: SearchLiteratureDto = {
        ...options,
        query: state.correctedQuery,
        limit: undefined, // CRITICAL: Let source-router use tier allocation, not frontend limit
      };

      // Execute search with timeout
      const papers = await Promise.race([
        this.sourceRouter.searchBySource(source, searchDto),
        new Promise<Paper[]>((_, reject) =>
          setTimeout(() => reject(new Error('Source timeout')), timeout),
        ),
      ]);

      const duration = Date.now() - startTime;

      // Update source stats
      const stats = state.sourceStats.get(source)!;
      stats.status = 'complete';
      stats.paperCount = papers.length;
      stats.timeMs = duration;

      // Add papers with deduplication
      const newPapers = this.addPapersWithDedup(state, papers, source);

      // Emit papers batch if we got any new ones
      if (newPapers.length > 0) {
        this.emitPapersBatch(state, newPapers, source);
      }

      // Emit source complete event (ALWAYS emit, even if 0 papers)
      const completeEvent: SourceCompleteEvent = {
        searchId: state.searchId,
        source,
        tier,
        paperCount: papers.length,
        timeMs: duration,
        timestamp: Date.now(),
      };

      state.emit({
        type: 'search:source-complete',
        data: completeEvent,
      });

      this.logger.log(
        `✓ [${source}] ${papers.length} papers (${newPapers.length} new) in ${duration}ms - emitting source-complete event`,
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = (error as Error).message === 'Source timeout';

      // Update source stats
      const stats = state.sourceStats.get(source)!;
      stats.status = isTimeout ? 'skipped' : 'error';
      stats.timeMs = duration;
      stats.error = (error as Error).message;

      // Emit source error event
      const errorEvent: SourceErrorEvent = {
        searchId: state.searchId,
        source,
        error: (error as Error).message,
        recoverable: true,
        timestamp: Date.now(),
      };

      state.emit({
        type: 'search:source-error',
        data: errorEvent,
      });

      this.logger.warn(
        `⚠️ [${source}] ${isTimeout ? 'Timeout' : 'Error'} after ${duration}ms: ${(error as Error).message}`,
      );
    }

    // Update overall progress
    this.updateProgress(state);
  }

  private getTierTimeout(config: SearchStreamConfig, tier: SourceTier): number {
    switch (tier) {
      case SourceTier.FAST:
        return config.fastSourceTimeoutMs;
      case SourceTier.MEDIUM:
        return config.mediumSourceTimeoutMs;
      case SourceTier.SLOW:
        return config.slowSourceTimeoutMs;
    }
  }

  // ==========================================================================
  // STAGE 5: FINAL RANKING - NETFLIX-GRADE SEMANTIC PIPELINE
  // ==========================================================================

  /**
   * Phase 10.115: Netflix-Grade Final Ranking
   * Phase 10.113 Week 11: Progressive Semantic Tier Streaming
   *
   * BEFORE: Simple sort by relevanceScore (papers already have relevanceScore from sources)
   * NOW: Full semantic pipeline with BM25 + Neural + ThemeFit scoring
   *
   * Scoring Formula: 0.15×BM25 + 0.55×Semantic + 0.30×ThemeFit
   *
   * NEW (Week 11): Progressive semantic tiers:
   * - Tier 1 (immediate): Top 50 papers → <500ms
   * - Tier 2 (refined): Next 100 papers → <2s
   * - Tier 3 (complete): Remaining 150 papers → background
   * Phase 10.157: Updated to match 300-paper target (50+100+150=300)
   *
   * This ensures WebSocket streaming path gets the SAME quality ranking as HTTP REST API
   * with PROGRESSIVE results via semantic tier events.
   */
  // Phase 10.119: Ranking timeout aligned with WebSocket ping timeout (120s)
  // Previous: 30s was too short for 300+ papers with semantic ranking
  private static readonly RANKING_TIMEOUT_MS = 90000; // 90s (under 120s ping timeout)

  // Phase 10.113 Week 11: Enable progressive semantic streaming (feature flag)
  private static readonly ENABLE_PROGRESSIVE_SEMANTIC = true;

  // Phase 10.158: Maximum papers for semantic ranking (increased for better quality selection)
  // Process 600 papers to ensure quality top-300 selection from larger pool
  // Papers beyond this limit are pre-filtered by BM25 relevance score
  private static readonly MAX_SEMANTIC_PAPERS = 600;

  /**
   * Phase 10.156: Simplified Sort-Based Ranking
   *
   * Design: Sort ALL papers by overallScore and take top N.
   * This replaces the complex threshold relaxation loop.
   *
   * Flow:
   * 1. Ranks all papers using semantic scoring (BM25 + Semantic + ThemeFit)
   * 2. Calculates overallScore (harmonic mean of relevance + quality)
   * 3. Sorts ALL papers by overallScore descending
   * 4. Returns top N papers
   *
   * Rationale: If we're taking top N sorted by quality anyway, thresholds don't matter.
   * Simpler code, same quality results, fewer bugs.
   */
  private async stageFinalRanking(
    state: SearchState,
    options: SearchLiteratureDto,
  ): Promise<void> {
    let papers = Array.from(state.papers.values());
    const collectedCount = papers.length;

    // Phase 10.159: Scientific message with actual count
    this.emitProgress(state, 'ranking', `AI scoring ${collectedCount} papers (BM25 + neural embeddings)...`);

    if (papers.length === 0) {
      this.logger.warn(`⚠️ [SearchStream] No papers to rank`);
      return;
    }

    const startTime = Date.now();
    // Phase 10.158: Use TARGET_FINAL_RESULTS (300) as the final output limit
    // This ensures we always output exactly 300 papers regardless of how many were ranked
    const limit = options.limit || QUERY_INTELLIGENCE_CONFIG.TARGET_FINAL_RESULTS;

    // Phase 10.119: Pre-filter papers to MAX_SEMANTIC_PAPERS to prevent event loop blocking
    // Papers are pre-sorted by BM25 relevance score, keeping top candidates
    if (papers.length > SearchStreamService.MAX_SEMANTIC_PAPERS) {
      this.logger.log(
        `⚡ [SearchStream] Pre-filtering ${papers.length} → ${SearchStreamService.MAX_SEMANTIC_PAPERS} papers (BM25 top candidates)`,
      );
      // Sort by existing relevance score and take top N
      papers = papers
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .slice(0, SearchStreamService.MAX_SEMANTIC_PAPERS);
    }

    this.logger.log(
      `🧠 [SearchStream] Starting semantic ranking for ${papers.length} papers (limit: ${limit})...`,
    );

    let rankedPapers: Paper[];

    // Phase 10.115: Create AbortController for ranking timeout
    const rankingController = new AbortController();
    const rankingTimeout = setTimeout(() => {
      rankingController.abort();
      this.logger.warn(`⚠️ [SearchStream] Ranking timeout after ${SearchStreamService.RANKING_TIMEOUT_MS}ms`);
    }, SearchStreamService.RANKING_TIMEOUT_MS);

    // Phase 10.118: Heartbeat interval to keep WebSocket alive during long ranking
    let heartbeatCount = 0;
    const heartbeatInterval = setInterval(() => {
      heartbeatCount++;
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const progressPercent = Math.min(90 + heartbeatCount, 98);
      this.emitRankingHeartbeat(state, progressPercent, `Ranking ${collectedCount} papers → top ${limit}... (${elapsedSec}s)`);
    }, 3000);

    // Phase 10.121: Track if progressive semantic was used
    let usedProgressiveSemantic = false;

    try {
      // ============================================================================
      // STEP 1: RANK ALL PAPERS ONCE (expensive operation - do only once)
      // ============================================================================
      if (SearchStreamService.ENABLE_PROGRESSIVE_SEMANTIC && papers.length >= 20) {
        rankedPapers = await this.executeProgressiveSemanticRanking(
          state,
          papers,
          limit,
          startTime,
          rankingController.signal,
        );
        usedProgressiveSemantic = true;
      } else {
        rankedPapers = await this.executeStandardRanking(
          state,
          papers,
          options,
          rankingController.signal,
        );
      }

      clearTimeout(rankingTimeout);
      const rankingDuration = Date.now() - startTime;
      this.logger.log(
        `✅ [SearchStream] Semantic ranking complete: ${rankedPapers.length} papers in ${rankingDuration}ms`,
      );

      // ============================================================================
      // STEP 2: QUALITY-BASED FINAL SELECTION (Phase 10.158)
      // ============================================================================
      // Design: Sort ALL papers by overallScore (composite quality) and take top N
      // Flow: 600 ranked papers → sort by quality → select top 300
      // This is the final stage that produces the user-visible results

      const rankedCount = rankedPapers.length;

      // Emit selection stage start event for pipeline visualization
      this.emitProgress(state, 'selecting', `Filtering ${rankedCount}→${limit} by harmonic mean (relevance × quality)...`);

      // Sort by overallScore descending (best papers first)
      rankedPapers = rankedPapers
        .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
        .slice(0, limit);

      // Calculate quality statistics for the selected papers
      // Phase 10.161 FIX: overallScore is on 0-100 scale, normalize to 0-1 for frontend
      const avgQualityRaw = rankedPapers.length > 0
        ? rankedPapers.reduce((sum, p) => sum + (p.overallScore ?? 0), 0) / rankedPapers.length
        : 0;
      const avgQuality = avgQualityRaw / 100; // Normalize to 0-1 scale

      this.logger.log(
        `🎯 [Phase 10.158] Quality selection complete: ${rankedPapers.length}/${rankedCount} papers selected (avg quality: ${(avgQuality * 100).toFixed(1)}%)`,
      );

      // Emit selection complete event for pipeline visualization
      state.emit({
        type: 'search:selection-complete',
        data: {
          searchId: state.searchId,
          rankedCount,
          selectedCount: rankedPapers.length,
          targetCount: limit,
          avgQualityScore: avgQuality,
          timestamp: Date.now(),
        },
      });

    } catch (error) {
      clearInterval(heartbeatInterval);
      clearTimeout(rankingTimeout);

      // Graceful fallback to simple sorting if semantic pipeline fails or times out
      const isTimeout = (error as Error).message?.includes('cancelled') || (error as Error).message?.includes('aborted');
      this.logger.warn(
        `⚠️ [SearchStream] Semantic ranking ${isTimeout ? 'timed out' : 'failed'}, falling back to simple sort: ${(error as Error).message}`,
      );

      // Fallback: Simple sorting by relevance score
      rankedPapers = papers
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .slice(0, limit);
    } finally {
      clearInterval(heartbeatInterval);
    }

    // Ensure we respect the limit
    rankedPapers = rankedPapers.slice(0, limit);

    // Update papers map with ranked order
    state.papers.clear();
    for (const paper of rankedPapers) {
      state.papers.set(paper.id || this.generatePaperId(paper), paper);
    }

    // Phase 10.118: Emit 99% progress with accurate final count before batch
    this.emitRankingHeartbeat(state, 99, `Ranked ${collectedCount} → ${rankedPapers.length} top papers`);

    // Phase 10.121: Skip emitPapersBatch when progressive semantic was used
    // Papers were already sent via search:semantic-tier events - emitting here would cause duplicates
    if (!usedProgressiveSemantic) {
      // Emit final ranked batch only for standard ranking (non-progressive)
      this.emitPapersBatch(state, rankedPapers, undefined, true);
    }

    this.logger.log(
      `📊 [SearchStream] Final ranked results: ${rankedPapers.length} papers (from ${collectedCount} collected)${usedProgressiveSemantic ? ' [via semantic-tier events]' : ''}`,
    );
  }

  /**
   * Phase 10.113 Week 11: Progressive Semantic Ranking with Tier Streaming
   *
   * Executes semantic ranking with progressive tier events:
   * - Tier 1 (immediate): Emits first 50 papers quickly for fast UX
   * - Tier 2 (refined): Emits refined 150 papers after deeper analysis
   * - Tier 3 (complete): Emits all 400 papers for full analysis
   *
   * Each tier emits a 'search:semantic-tier' event that frontend can handle
   * for progressive UI updates with smooth animations.
   */
  private async executeProgressiveSemanticRanking(
    state: SearchState,
    papers: Paper[],
    limit: number,
    startTime: number,
    signal?: AbortSignal,
  ): Promise<Paper[]> {
    this.logger.log(
      `🚀 [Phase 10.113 Week 11] Starting progressive semantic ranking for ${papers.length} papers`,
    );

    // Phase 10.180 FIX: Calculate BM25 scores BEFORE semantic ranking
    // Without this, papers have no relevanceScore and Keywords shows 0 in UI
    const compiledQuery = compileQueryPatterns(state.correctedQuery);
    const papersWithBM25 = papers.map(paper => ({
      ...paper,
      relevanceScore: calculateBM25RelevanceScore(paper, compiledQuery),
    }));

    this.logger.log(
      `✅ [Phase 10.180] BM25 scoring complete: ${papersWithBM25.length} papers scored`,
    );

    // Use PaperWithSemanticScore for proper typing of combinedScore
    let finalPapers: PaperWithSemanticScore[] = papersWithBM25.map(p => ({
      ...p,
      semanticScore: p.relevanceScore ?? 0,
    }));

    try {
      // Stream progressive tier results
      for await (const tierResult of this.searchPipeline.streamProgressiveSemanticScores(
        papersWithBM25, // Pass papers WITH BM25 scores
        state.correctedQuery,
        signal,
      )) {
        // Phase 10.147 FIX: Calculate combined scores BEFORE emit so overallScore is included
        // This ensures papers have combinedScore, neuralRelevanceScore, and overallScore set
        finalPapers = this.searchPipeline.calculateCombinedScores(tierResult.papers);

        // Phase 10.161 FIX: Emit ALL ranked papers (up to MAX_SEMANTIC_PAPERS = 600)
        // This allows frontend to show full 3-tier semantic ranking before quality selection
        // Quality selection (600 → 300) happens AFTER semantic ranking, not during
        const emittedPapers = finalPapers.slice(0, SearchStreamService.MAX_SEMANTIC_PAPERS);
        this.emitSemanticTier(state, {
          searchId: state.searchId,
          tier: tierResult.tier,
          version: tierResult.version,
          papers: emittedPapers,
          latencyMs: Date.now() - startTime,
          isComplete: tierResult.isComplete,
          metadata: tierResult.metadata,
          timestamp: Date.now(),
        });

        this.logger.log(
          `✨ [Semantic Tier ${tierResult.tier}] Emitted ${emittedPapers.length} papers (v${tierResult.version})`,
        );

        // Emit semantic progress for UI feedback
        this.emitSemanticProgress(state, {
          searchId: state.searchId,
          tier: tierResult.tier,
          papersProcessed: tierResult.metadata.papersProcessed,
          papersTotal: papers.length,
          percent: tierResult.isComplete ? 100 : (tierResult.version / 3) * 100,
          message: `${tierResult.tier} tier complete - ${tierResult.papers.length} papers ranked`,
          timestamp: Date.now(),
        });

        // Check for abort
        if (signal?.aborted) {
          this.logger.warn('[ProgressiveSemantic] Aborted during tier streaming');
          break;
        }
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ [ProgressiveSemantic] Tier streaming failed: ${(error as Error).message}. Using last successful results.`,
      );
    }

    // Sort and slice to MAX_SEMANTIC_PAPERS before detection
    let rankedPapers = finalPapers
      .sort((a, b) => (b.combinedScore ?? b.relevanceScore ?? 0) - (a.combinedScore ?? a.relevanceScore ?? 0))
      .slice(0, SearchStreamService.MAX_SEMANTIC_PAPERS);

    // Phase 10.180: Run Stage 9 Full-Text Detection on ranked papers
    // This was previously skipped in progressive semantic path because it doesn't use executeOptimizedPipeline
    // Detection sets hasFullText flag for content analysis in theme extraction
    try {
      this.logger.log(
        `🔍 [Phase 10.180] Running Stage 9 Full-Text Detection on ${rankedPapers.length} papers`,
      );
      // Create a map of original semanticScores to preserve during detection
      const semanticScoreMap = new Map<string, number>();
      for (const paper of rankedPapers) {
        if (paper.id) {
          semanticScoreMap.set(paper.id, paper.semanticScore);
        }
      }

      const detectedPapers = await this.searchPipeline.runFullTextDetection(
        rankedPapers,
        (message, _progress) => {
          this.logger.debug(`[Stage 9] ${message}`);
        },
      );

      // Re-apply semanticScores that were lost during type conversion
      rankedPapers = detectedPapers.map(p => ({
        ...p,
        semanticScore: p.id ? (semanticScoreMap.get(p.id) ?? p.relevanceScore ?? 0) : (p.relevanceScore ?? 0),
      })) as PaperWithSemanticScore[];

      const detectedCount = rankedPapers.filter(p => p.hasFullText).length;
      this.logger.log(
        `✅ [Phase 10.180] Stage 9 complete: ${detectedCount}/${rankedPapers.length} papers with full-text detected`,
      );
    } catch (error) {
      this.logger.warn(
        `⚠️ [Phase 10.180] Stage 9 detection failed: ${(error as Error).message}. Papers returned without detection.`,
      );
    }

    // Phase 10.161 FIX: Return ALL ranked papers (up to MAX_SEMANTIC_PAPERS = 600)
    // Quality selection (600 → 300) happens in stageFinalRanking AFTER this function returns
    return rankedPapers;
  }

  /**
   * Phase 10.115: Standard Ranking Pipeline (fallback)
   *
   * Used when progressive semantic is disabled or paper count is too small.
   */
  private async executeStandardRanking(
    state: SearchState,
    papers: Paper[],
    options: SearchLiteratureDto,
    signal?: AbortSignal,
  ): Promise<Paper[]> {
    const limit = options.limit || QUERY_INTELLIGENCE_CONFIG.MAX_PER_SOURCE_LIMIT;
    const queryComplexity = detectQueryComplexity(state.correctedQuery);

    const pipelineStageProgress: Record<string, number> = {
      'BM25 Scoring': 91,
      'Pre-filtering': 92,
      'Neural Reranking': 93,
      'Domain Classification': 94,
      'Aspect Filtering': 95,
      'Quality Scoring': 96,
      'Sorting': 97,
      'Quality Threshold': 98,
    };

    // Phase 10.170: Pass purpose to pipeline for purpose-aware quality weights and paper limits
    return this.searchPipeline.executeOptimizedPipeline(
      papers,
      {
        query: state.correctedQuery,
        queryComplexity,
        targetPaperCount: limit,
        sortOption: options.sortBy || 'relevance',
        emitProgress: (message: string, _progress: number) => {
          this.logger.debug(`[Semantic] ${message}`);
          const stageMatch = Object.keys(pipelineStageProgress).find(stage =>
            message.toLowerCase().includes(stage.toLowerCase())
          );
          if (stageMatch) {
            this.emitRankingHeartbeat(state, pipelineStageProgress[stageMatch], message);
          }
        },
        signal,
        // Phase 10.170: Purpose-Aware Pipeline Integration
        purpose: options.purpose,
      },
    );
  }

  /**
   * Phase 10.113 Week 11: Emit semantic tier event
   * Phase 10.122: Map combinedScore → neuralRelevanceScore for frontend transparency
   * Phase 10.124: Debug logging to verify pipeline deduplication
   */
  private emitSemanticTier(state: SearchState, event: SemanticTierEvent): void {
    // Phase 10.124: Debug - verify no duplicates from pipeline (should be 0)
    const idCounts = new Map<string, number>();
    for (const paper of event.papers) {
      const id = paper.id || 'no-id';
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    }
    const duplicateIds = Array.from(idCounts.entries()).filter(([, count]) => count > 1);

    // Log paper count for debugging
    this.logger.log(
      `📤 [SemanticTier ${event.tier}] Emitting ${event.papers.length} papers (unique IDs: ${idCounts.size})`,
    );

    if (duplicateIds.length > 0) {
      // This should NOT happen if pipeline deduplication is working
      this.logger.error(
        `🚨 [SemanticTier ${event.tier}] BUG: Found ${duplicateIds.length} duplicate IDs - pipeline dedup failed!`,
        { duplicates: duplicateIds.slice(0, 5).map(([id, count]) => `${id.substring(0, 30)}...(${count}x)`) },
      );
    }

    // Phase 10.122: Transform papers to include neuralRelevanceScore for frontend
    // This is the ACTUAL SORTING SCORE that should be displayed to users
    // Note: event.papers are already deduplicated by search pipeline

    // Phase 10.154: Papers from calculateCombinedScores already have all scores calculated:
    // - combinedScore (the weighted BM25 + Semantic + ThemeFit)
    // - neuralRelevanceScore (= combinedScore for display)
    // - neuralExplanation (with CORRECT min-max normalized BM25)
    // - overallScore (harmonic mean of relevance + quality)
    //
    // We only need to add neuralRank (position in sorted list)
    // DO NOT recalculate neuralExplanation - it would use wrong normalization!

    const transformedPapers = event.papers.map((paper, index) => {
      // Cast to access semantic scoring fields
      const scoredPaper = paper as Paper & {
        combinedScore?: number;
        semanticScore?: number;
      };

      return {
        ...paper,
        // Use pre-calculated combinedScore as neuralRelevanceScore
        // Falls back to relevanceScore only if combinedScore not available
        neuralRelevanceScore: scoredPaper.combinedScore ?? paper.neuralRelevanceScore ?? paper.relevanceScore ?? 0,
        // Add ranking position (1-indexed)
        neuralRank: index + 1,
        // PRESERVE neuralExplanation from calculateCombinedScores (has correct BM25 normalization)
        // Only set if paper already has it (from calculateCombinedScores)
        neuralExplanation: paper.neuralExplanation,
        // Preserve semantic score for frontend (use cast to access it)
        semanticScore: scoredPaper.semanticScore,
        // Preserve overallScore from calculateCombinedScores
        overallScore: paper.overallScore,
      };
    });

    state.emit({
      type: 'search:semantic-tier',
      data: {
        ...event,
        papers: transformedPapers,
      },
    });
  }

  /**
   * Phase 10.113 Week 11: Emit semantic progress event
   */
  private emitSemanticProgress(state: SearchState, event: SemanticProgressEvent): void {
    state.emit({
      type: 'search:semantic-progress',
      data: event,
    });
  }

  // ==========================================================================
  // PAPER MANAGEMENT
  // ==========================================================================

  private addPapersWithDedup(
    state: SearchState,
    papers: Paper[],
    source: LiteratureSource,
  ): Paper[] {
    const newPapers: Paper[] = [];
    let excludedCount = 0;

    for (const paper of papers) {
      // Phase 10.181: Filter out books, book chapters, datasets, and other non-article types
      // This prevents books from Springer, CrossRef, etc. from appearing in results
      if (this.isExcludedDocumentType(paper)) {
        excludedCount++;
        continue;
      }

      // Generate consistent ID for deduplication
      const dedupId = this.generatePaperId(paper);

      // Check if already exists
      if (!state.papers.has(dedupId)) {
        // Add source tracking
        const enrichedPaper: Paper = {
          ...paper,
          id: dedupId,
          source: source,
        };
        state.papers.set(dedupId, enrichedPaper);
        newPapers.push(enrichedPaper);
      }
    }

    // Log excluded items for transparency
    if (excludedCount > 0) {
      this.logger.debug(
        `[${source}] Excluded ${excludedCount} non-article items (books, datasets, etc.)`,
      );
    }

    return newPapers;
  }

  /**
   * Phase 10.181: Check if paper should be excluded based on document type
   * Filters out books, book chapters, datasets, and other non-research-article content
   *
   * @param paper - Paper to check
   * @returns true if paper should be EXCLUDED
   */
  private isExcludedDocumentType(paper: Paper): boolean {
    // Check publicationType array (from CrossRef, PubMed, etc.)
    if (paper.publicationType && paper.publicationType.length > 0) {
      for (const docType of paper.publicationType) {
        if (EXCLUDED_DOCUMENT_TYPES.has(docType)) {
          return true;
        }
        // Also check lowercase version
        if (EXCLUDED_DOCUMENT_TYPES.has(docType.toLowerCase())) {
          return true;
        }
      }
    }

    // Additional heuristic: Check URL patterns for book content
    // Springer books have specific URL patterns like /book/ or /chapter/
    if (paper.url) {
      const urlLower = paper.url.toLowerCase();
      if (
        urlLower.includes('/book/') ||
        urlLower.includes('/chapter/') ||
        urlLower.includes('/referencework/') ||
        urlLower.includes('/encyclopedia/')
      ) {
        return true;
      }
    }

    // Additional heuristic: Check venue/title for book indicators
    const venue = paper.venue?.toLowerCase() || '';
    if (
      venue.includes('handbook of') ||
      venue.includes('encyclopedia of') ||
      venue.includes('encyclopedia ') ||
      venue.includes(' handbook')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate a consistent paper ID for deduplication
   * Uses precompiled regex patterns for performance
   */
  private generatePaperId(paper: Paper): string {
    // Prefer DOI for deduplication (most reliable)
    if (paper.doi) {
      return `doi:${paper.doi.toLowerCase().replace(DOI_URL_PATTERN, '')}`;
    }
    // Fall back to PMID
    if (paper.pmid) {
      return `pmid:${paper.pmid}`;
    }
    // Fall back to title-based hash
    if (paper.title) {
      const normalizedTitle = paper.title.toLowerCase()
        .replace(NON_ALPHANUMERIC_PATTERN, '')
        .substring(0, 100);
      return `title:${normalizedTitle}`;
    }
    // Last resort: use existing ID or generate UUID
    return paper.id || uuidv4();
  }

  // ==========================================================================
  // EVENT EMISSION
  // ==========================================================================

  private emitProgress(
    state: SearchState,
    stage: keyof typeof PROGRESS_STAGES,
    message: string,
  ): void {
    state.currentStage = stage;

    const progressEvent: SearchProgressEvent = {
      searchId: state.searchId,
      stage,
      percent: PROGRESS_STAGES[stage],
      message,
      sourcesComplete: this.getCompletedSourceCount(state),
      sourcesTotal: state.sourceStats.size,
      papersFound: state.papers.size,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:progress',
      data: progressEvent,
    });
  }

  /**
   * Phase 10.118: Emit ranking heartbeat to keep WebSocket alive during long ranking
   *
   * This method emits progress updates between 90-99% to prevent WebSocket
   * disconnect during the semantic ranking pipeline. The heartbeat provides
   * detailed progress information about which pipeline stage is executing.
   */
  private emitRankingHeartbeat(
    state: SearchState,
    percent: number,
    message: string,
  ): void {
    const progressEvent: SearchProgressEvent = {
      searchId: state.searchId,
      stage: 'ranking',
      percent: Math.min(99, Math.max(90, percent)), // Keep between 90-99%
      message,
      sourcesComplete: this.getCompletedSourceCount(state),
      sourcesTotal: state.sourceStats.size,
      papersFound: state.papers.size,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:progress',
      data: progressEvent,
    });

    this.logger.debug(`💓 [Heartbeat] ${percent}% - ${message}`);
  }

  private updateProgress(state: SearchState): void {
    const completed = this.getCompletedSourceCount(state);
    const total = state.sourceStats.size;

    // Calculate weighted progress based on current stage
    const stageBase = PROGRESS_STAGES[state.currentStage] || 0;
    const stageNext = this.getNextStagePercent(state.currentStage);
    const stageProgress = total > 0 ? (completed / total) * (stageNext - stageBase) : 0;
    const percent = Math.min(99, stageBase + stageProgress);

    const messages = STAGE_MESSAGES[state.currentStage] || ['Searching...'];
    const message = messages[Math.floor(Math.random() * messages.length)];

    const progressEvent: SearchProgressEvent = {
      searchId: state.searchId,
      stage: state.currentStage,
      percent: Math.round(percent),
      message,
      sourcesComplete: completed,
      sourcesTotal: total,
      papersFound: state.papers.size,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:progress',
      data: progressEvent,
    });
  }

  private getNextStagePercent(currentStage: keyof typeof PROGRESS_STAGES): number {
    const stages = Object.keys(PROGRESS_STAGES) as Array<keyof typeof PROGRESS_STAGES>;
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      return PROGRESS_STAGES[stages[currentIndex + 1]];
    }
    return 100;
  }

  private getCompletedSourceCount(state: SearchState): number {
    let count = 0;
    for (const stats of state.sourceStats.values()) {
      if (stats.status === 'complete' || stats.status === 'error' || stats.status === 'skipped') {
        count++;
      }
    }
    return count;
  }

  private emitPapersBatch(
    state: SearchState,
    papers: Paper[],
    source?: LiteratureSource,
    _isFinal = false,
  ): void {
    if (papers.length === 0) return;

    state.batchNumber++;

    const batchEvent: PapersBatchEvent = {
      searchId: state.searchId,
      papers,
      source: source || LiteratureSource.OPENALEX, // Default for ranked results
      batchNumber: state.batchNumber,
      cumulativeCount: state.papers.size,
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:papers',
      data: batchEvent,
    });

    this.logger.debug(
      `📦 [SearchStream] Emitted batch #${state.batchNumber}: ${papers.length} papers`,
    );
  }

  private emitComplete(state: SearchState): void {
    const duration = Date.now() - state.startTime;

    const completeEvent: SearchCompleteEvent = {
      searchId: state.searchId,
      totalPapers: state.papers.size,
      uniquePapers: state.papers.size,
      totalTimeMs: duration,
      sourceStats: Array.from(state.sourceStats.values()),
      enrichmentStats: {
        enriched: 0,  // Lazy enrichment happens later
        pending: state.papers.size,
        failed: 0,
      },
      timestamp: Date.now(),
    };

    state.emit({
      type: 'search:complete',
      data: completeEvent,
    });

    this.emitProgress(state, 'complete', 'Search complete!');

    this.logger.log(
      `✅ [SearchStream] Search complete: ${state.papers.size} papers in ${(duration / 1000).toFixed(1)}s`,
    );
  }

  private emitError(state: SearchState, message: string): void {
    state.emit({
      type: 'search:error',
      data: {
        searchId: state.searchId,
        error: message,
        recoverable: false,
        timestamp: Date.now(),
      },
    });
  }

  // ==========================================================================
  // QUERY ANALYSIS HELPERS
  // ==========================================================================

  private generateQuerySuggestions(
    query: string,
    expansions: {
      methodologyTerms: string[];
      controversyTerms: string[];
    },
  ): Array<{ query: string; reason: string; expectedImprovement: string }> {
    const suggestions: Array<{ query: string; reason: string; expectedImprovement: string }> = [];

    // Suggest methodology-specific refinement
    if (expansions.methodologyTerms.length > 0) {
      const methodology = expansions.methodologyTerms[0];
      suggestions.push({
        query: `"${methodology}" ${query}`,
        reason: 'Add explicit methodology focus',
        expectedImprovement: 'More relevant results for your methodology',
      });
    }

    // Suggest controversy focus for Q-methodology
    if (query.toLowerCase().includes('q-method') || query.toLowerCase().includes('qmethod')) {
      suggestions.push({
        query: `${query} debate OR controversy`,
        reason: 'Q-methodology benefits from controversial topics',
        expectedImprovement: 'Better themes for Q-sort statements',
      });
    }

    // Suggest year restriction for recent research (dynamic year range)
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - RECENT_RESEARCH_YEARS_BACK;
    suggestions.push({
      query: `${query} ${startYear}..${currentYear}`,
      reason: 'Focus on recent research',
      expectedImprovement: 'More up-to-date findings',
    });

    return suggestions.slice(0, QUERY_INTELLIGENCE_CONFIG.MAX_SUGGESTIONS);
  }

}
