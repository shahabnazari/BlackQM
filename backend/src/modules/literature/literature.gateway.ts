import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LiteratureService } from './literature.service';
import { getCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { ErrorCodes, ErrorCode } from '../../common/constants/error-codes';
// Phase 10.113 Week 10: Progressive Search Streaming
import { SearchStreamService } from './services/search-stream.service';
import { LazyEnrichmentService } from './services/lazy-enrichment.service';
// Phase 10.170: Purpose-Aware Pipeline
import { PurposeAwareSearchService } from './services/purpose-aware-search.service';
import { ResearchPurpose, isValidResearchPurpose } from './types/purpose-aware.types';
// Phase 10.170 Week 2: Intelligent Full-Text Detection
import { IntelligentFullTextDetectionService } from './services/intelligent-fulltext-detection.service';
import { DetectionProgressEvent } from './types/fulltext-detection.types';
import {
  SearchStreamEvent,
  EnrichmentRequest,
  DEFAULT_STREAM_CONFIG,
} from './dto/search-stream.dto';
import { SearchLiteratureDto } from './dto/literature.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/literature',
  // Phase 10.115: Increase timeouts for long-running searches
  // Default pingTimeout is 20s which is too short for multi-source searches
  pingTimeout: 120000, // 2 minutes - allows slow sources (Semantic Scholar, PMC) to respond
  pingInterval: 25000, // 25 seconds - keep connection alive during search
})
export class LiteratureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiteratureGateway.name);
  private activeSearches = new Map<string, Set<string>>();
  // Phase 10.113 Week 10: Track active progressive searches
  private progressiveSearches = new Map<string, string>(); // socketId -> searchId

  constructor(
    private readonly literatureService: LiteratureService,
    // Phase 10.113 Week 10: Progressive Search Services
    private readonly searchStream: SearchStreamService,
    private readonly lazyEnrichment: LazyEnrichmentService,
    // Phase 10.170: Purpose-Aware Pipeline
    private readonly purposeAwareSearch: PurposeAwareSearchService,
    // Phase 10.170 Week 2: Intelligent Full-Text Detection
    private readonly fulltextDetection: IntelligentFullTextDetectionService,
  ) {
    this.logger.log('✅ [LiteratureGateway] Phase 10.113 Week 10 - Progressive search streaming enabled');
    this.logger.log('✅ [LiteratureGateway] Phase 10.170 - Purpose-aware pipeline enabled');
    this.logger.log('✅ [LiteratureGateway] Phase 10.170 Week 2 - Intelligent full-text detection enabled');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to literature: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from literature: ${client.id}`);
    // Clean up any active searches
    this.activeSearches.forEach((clients, searchId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.activeSearches.delete(searchId);
      }
    });

    // Phase 10.113 Week 10: Cancel progressive search if client disconnects
    const searchId = this.progressiveSearches.get(client.id);
    if (searchId) {
      this.searchStream.cancelSearch(searchId);
      this.lazyEnrichment.cleanupSearch(searchId);
      this.progressiveSearches.delete(client.id);
      this.logger.log(`Cancelled progressive search ${searchId} due to disconnect`);
    }
  }

  @SubscribeMessage('join-search')
  handleJoinSearch(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId } = data;
      if (!searchId) {
        this.emitError(client, 'VAL002', undefined, 'searchId is required');
        return;
      }

      client.join(`search-${searchId}`);

      if (!this.activeSearches.has(searchId)) {
        this.activeSearches.set(searchId, new Set());
      }
      this.activeSearches.get(searchId)?.add(client.id);

      this.logger.log(`Client ${client.id} joined search ${searchId}`);
    } catch (error) {
      this.logger.error(`Failed to join search: ${(error as Error).message}`, (error as Error).stack);
      this.emitError(client, 'WS003', undefined, (error as Error).message);
    }
  }

  @SubscribeMessage('leave-search')
  handleLeaveSearch(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId } = data;
      if (!searchId) {
        return; // Silent fail for leave - not critical
      }

      client.leave(`search-${searchId}`);

      if (this.activeSearches.has(searchId)) {
        this.activeSearches.get(searchId)?.delete(client.id);
        if (this.activeSearches.get(searchId)?.size === 0) {
          this.activeSearches.delete(searchId);
        }
      }

      this.logger.log(`Client ${client.id} left search ${searchId}`);
    } catch (error) {
      this.logger.error(`Failed to leave search: ${(error as Error).message}`, (error as Error).stack);
      // Don't emit error for leave - not critical
    }
  }

  @SubscribeMessage('knowledge-graph-update')
  handleKnowledgeGraphUpdate(
    @MessageBody() data: { graphId: string; nodes: any[]; edges: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data?.graphId) {
        this.emitError(client, 'VAL002', undefined, 'graphId is required');
        return;
      }
      // Broadcast knowledge graph updates to all clients viewing the same graph
      client.to(`graph-${data.graphId}`).emit('graph-updated', data);
    } catch (error) {
      this.logger.error(`Failed to update graph: ${(error as Error).message}`, (error as Error).stack);
      this.emitError(client, 'WS002', undefined, (error as Error).message);
    }
  }

  // ==========================================================================
  // Phase 10.113 Week 10: Progressive Search Streaming
  // ==========================================================================

  /**
   * Start a progressive search with real-time streaming
   *
   * This is the main entry point for Week 10 streaming search.
   * Instead of returning all results at once, it streams:
   * - Query intelligence (immediately)
   * - Fast source results (<2s)
   * - Medium source results (<5s)
   * - Slow source results (<15s)
   * - Final ranked results
   *
   * @event search:start { query: string; options: SearchLiteratureDto }
   * @emits search:started, search:source-started, search:papers, search:progress, search:complete
   */
  @SubscribeMessage('search:start')
  async handleProgressiveSearchStart(
    @MessageBody() data: { query: string; options?: Partial<SearchLiteratureDto> },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { query, options = {} } = data;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        this.emitError(client, 'VAL002', undefined, 'Query is required');
        return { success: false, error: 'Query is required' };
      }

      this.logger.log(`🚀 [Progressive Search] Client ${client.id} starting search: "${query}"`);

      // Build search options with defaults
      // Phase 10.159: REMOVED limit default - source-router uses tier-based allocation (500 per tier)
      // Gateway MUST NOT set a limit, letting search-stream pass undefined to source-router
      // which then applies getSourceAllocation() per source
      const searchOptions: SearchLiteratureDto = {
        query: query.trim(),
        // limit: REMOVED - tier allocations handle this (500 per source)
        page: options.page ?? 1,
        yearFrom: options.yearFrom,
        yearTo: options.yearTo,
        minCitations: options.minCitations,
        publicationType: options.publicationType,
        author: options.author,
        sortBy: options.sortBy ?? 'relevance',
        // Phase 10.115: Pass user-selected sources to search-stream.service
        // If not provided, search-stream.service uses ALL_PROGRESSIVE_SOURCES filtered by availability
        sources: options.sources,
      };

      // Create event emitter that streams to this client
      const emit = (event: SearchStreamEvent) => {
        client.emit(event.type, event.data);
      };

      // Start progressive search
      const searchId = await this.searchStream.startProgressiveSearch(
        query.trim(),
        searchOptions,
        emit,
        DEFAULT_STREAM_CONFIG,
      );

      // Track this search for cleanup on disconnect
      this.progressiveSearches.set(client.id, searchId);

      // Join the search room for any broadcast messages
      client.join(`search-${searchId}`);

      return { success: true, searchId };

    } catch (error) {
      this.logger.error(
        `Failed to start progressive search: ${(error as Error).message}`,
        (error as Error).stack,
      );
      this.emitError(client, 'WS002', undefined, (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Cancel an active progressive search
   *
   * @event search:cancel { searchId: string }
   */
  @SubscribeMessage('search:cancel')
  handleProgressiveSearchCancel(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId } = data;

      if (!searchId) {
        return { success: false, error: 'searchId is required' };
      }

      // Verify this client owns the search
      const clientSearchId = this.progressiveSearches.get(client.id);
      if (clientSearchId !== searchId) {
        return { success: false, error: 'Not authorized to cancel this search' };
      }

      const cancelled = this.searchStream.cancelSearch(searchId);
      if (cancelled) {
        this.progressiveSearches.delete(client.id);
        client.leave(`search-${searchId}`);
        this.logger.log(`🛑 [Progressive Search] Client ${client.id} cancelled search ${searchId}`);
      }

      return { success: cancelled };

    } catch (error) {
      this.logger.error(
        `Failed to cancel search: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Request enrichment for papers in viewport
   *
   * Instead of enriching all papers upfront (180+ seconds),
   * this enriches only papers currently visible to the user.
   *
   * @event enrichment:request { searchId: string; paperIds: string[]; priority: 'high' | 'normal' }
   * @emits search:enrichment for each enriched paper
   */
  @SubscribeMessage('enrichment:request')
  async handleEnrichmentRequest(
    @MessageBody() data: EnrichmentRequest,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId, paperIds, priority = 'normal' } = data;

      if (!searchId || !paperIds || !Array.isArray(paperIds)) {
        return { success: false, error: 'searchId and paperIds are required' };
      }

      if (paperIds.length === 0) {
        return { success: true, enriched: 0 };
      }

      this.logger.debug(
        `📊 [Enrichment] Client ${client.id} requesting ${paperIds.length} papers (${priority})`,
      );

      // Stream enrichments to client
      const result = await this.lazyEnrichment.requestEnrichment(
        { searchId, paperIds, priority },
        (enrichment) => {
          client.emit('search:enrichment', enrichment);
        },
      );

      return {
        success: true,
        enriched: result.enrichments.length,
        failed: result.failedIds.length,
        timeMs: result.timeMs,
      };

    } catch (error) {
      this.logger.error(
        `Failed to enrich papers: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pre-fetch enrichment for papers about to be viewed
   *
   * Call this when user is scrolling towards new papers.
   * Uses low priority to not interfere with viewport enrichment.
   *
   * @event enrichment:prefetch { searchId: string; paperIds: string[] }
   */
  @SubscribeMessage('enrichment:prefetch')
  async handleEnrichmentPrefetch(
    @MessageBody() data: { searchId: string; paperIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId, paperIds } = data;

      if (!searchId || !paperIds || !Array.isArray(paperIds)) {
        return { success: false };
      }

      // Fire and forget - don't wait for completion
      this.lazyEnrichment.prefetchEnrichment(searchId, paperIds).catch((err) => {
        this.logger.debug(`Prefetch error (non-critical): ${err.message}`);
      });

      return { success: true };

    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Check enrichment status for papers
   *
   * @event enrichment:status { searchId: string; paperIds: string[] }
   * @returns Record<paperId, boolean> indicating which papers are enriched
   */
  @SubscribeMessage('enrichment:status')
  handleEnrichmentStatus(
    @MessageBody() data: { searchId: string; paperIds: string[] },
    @ConnectedSocket() _client: Socket,
  ) {
    try {
      const { searchId, paperIds } = data;

      if (!searchId || !paperIds) {
        return { success: false, error: 'searchId and paperIds are required' };
      }

      const status = this.lazyEnrichment.areEnriched(searchId, paperIds);
      return { success: true, status };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Server-side methods to emit events

  emitSearchProgress(searchId: string, progress: number, message: string) {
    this.server.to(`search-${searchId}`).emit('search-progress', {
      searchId,
      progress,
      message,
    });
  }

  emitPaperFound(searchId: string, paper: any) {
    this.server.to(`search-${searchId}`).emit('paper-found', {
      searchId,
      paper,
    });
  }

  emitSearchComplete(searchId: string, results: any) {
    this.server.to(`search-${searchId}`).emit('search-complete', {
      searchId,
      results,
    });
  }

  emitThemeExtracted(userId: string, theme: any) {
    this.server.to(`user-${userId}`).emit('theme-extracted', theme);
  }

  emitGapIdentified(userId: string, gap: any) {
    this.server.to(`user-${userId}`).emit('gap-identified', gap);
  }

  emitGraphNodeAdded(graphId: string, node: any) {
    this.server.to(`graph-${graphId}`).emit('node-added', node);
  }

  emitGraphEdgeAdded(graphId: string, edge: any) {
    this.server.to(`graph-${graphId}`).emit('edge-added', edge);
  }

  /**
   * Phase 10.943: Emit standardized error to client
   * Use this to notify clients when operations fail
   */
  emitError(
    target: string | Socket,
    errorCode: ErrorCode,
    correlationId?: string,
    additionalMessage?: string,
  ) {
    const errorDetails = ErrorCodes[errorCode];
    const corrId = correlationId || getCorrelationId() || 'unknown';

    const errorPayload = {
      event: 'error',
      errorCode: errorDetails.code,
      message: additionalMessage
        ? `${errorDetails.message}: ${additionalMessage}`
        : errorDetails.message,
      correlationId: corrId,
      timestamp: new Date().toISOString(),
      recoverable: !['WS001', 'WS004', 'AUTH001', 'SYS001'].includes(errorCode),
    };

    this.logger.error(
      `[WS][${errorDetails.code}] ${errorPayload.message}`,
      JSON.stringify({ correlationId: corrId, target: typeof target === 'string' ? target : target.id }),
    );

    if (typeof target === 'string') {
      this.server.to(target).emit('error', errorPayload);
    } else {
      target.emit('error', errorPayload);
    }
  }

  /**
   * Phase 10.943: Emit search error to search room
   */
  emitSearchError(searchId: string, errorCode: ErrorCode, message?: string) {
    this.emitError(`search-${searchId}`, errorCode, getCorrelationId() || undefined, message);
  }

  // ==========================================================================
  // Phase 10.170: Purpose-Aware Pipeline WebSocket Integration
  // ==========================================================================

  /**
   * Handle purpose-aware search started event
   * Forwards EventEmitter2 events to WebSocket clients
   */
  @OnEvent('purpose-aware-search.started')
  handlePurposeAwareSearchStarted(payload: {
    sessionId: string;
    purpose: ResearchPurpose;
    displayName: string;
    config: Record<string, unknown>;
    timestamp: number;
  }): void {
    this.server.to(`search-${payload.sessionId}`).emit('purpose-aware:started', {
      purpose: payload.purpose,
      displayName: payload.displayName,
      config: payload.config,
      timestamp: payload.timestamp,
    });
    this.logger.debug(`[Purpose-Aware] Search started: ${payload.displayName} (${payload.sessionId})`);
  }

  /**
   * Handle purpose-aware search progress event
   */
  @OnEvent('purpose-aware-search.progress')
  handlePurposeAwareSearchProgress(payload: {
    sessionId: string;
    purpose: ResearchPurpose;
    stage: string;
    progress: number;
    details?: Record<string, unknown>;
    timestamp: number;
  }): void {
    this.server.to(`search-${payload.sessionId}`).emit('purpose-aware:progress', {
      purpose: payload.purpose,
      stage: payload.stage,
      progress: payload.progress,
      details: payload.details,
      timestamp: payload.timestamp,
    });
  }

  /**
   * Handle purpose-aware search completed event
   */
  @OnEvent('purpose-aware-search.completed')
  handlePurposeAwareSearchCompleted(payload: {
    sessionId: string;
    purpose: ResearchPurpose;
    displayName: string;
    result: Record<string, unknown>;
    timestamp: number;
  }): void {
    this.server.to(`search-${payload.sessionId}`).emit('purpose-aware:completed', {
      purpose: payload.purpose,
      displayName: payload.displayName,
      result: payload.result,
      timestamp: payload.timestamp,
    });
    this.logger.log(`[Purpose-Aware] Search completed: ${payload.displayName} (${payload.sessionId})`);
  }

  /**
   * Get purpose configuration via WebSocket
   *
   * @event purpose-aware:get-config { purpose: ResearchPurpose }
   * @returns Purpose configuration
   */
  @SubscribeMessage('purpose-aware:get-config')
  handleGetPurposeConfig(
    @MessageBody() data: { purpose: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { purpose } = data;

      if (!purpose || !isValidResearchPurpose(purpose)) {
        return {
          success: false,
          error: `Invalid purpose: ${purpose}. Must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
        };
      }

      const config = this.purposeAwareSearch.getResolvedConfig(purpose as ResearchPurpose);
      const metadata = this.purposeAwareSearch.getMetadata(purpose as ResearchPurpose);

      return {
        success: true,
        config: {
          purpose,
          displayName: metadata.displayName,
          paperLimits: config.paperLimits,
          qualityWeights: config.qualityWeights,
          qualityThreshold: config.qualityThreshold.initial,
          contentPriority: config.contentPriority,
          fullTextRequired: config.fullTextRequirement.strictRequirement,
          diversityRequired: config.diversityRequired,
          scientificMethod: config.scientificMethod,
          targetThemes: config.targetThemes,
        },
      };
    } catch (error) {
      this.logger.error(`[Purpose-Aware] Get config failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Join purpose-aware search room
   *
   * @event purpose-aware:join { sessionId: string }
   */
  @SubscribeMessage('purpose-aware:join')
  handleJoinPurposeAwareSearch(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        return { success: false, error: 'sessionId is required' };
      }

      client.join(`search-${sessionId}`);
      this.logger.debug(`[Purpose-Aware] Client ${client.id} joined session ${sessionId}`);

      return { success: true, sessionId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ==========================================================================
  // Phase 10.170 Week 2: Intelligent Full-Text Detection WebSocket Integration
  // ==========================================================================

  /**
   * Handle full-text detection progress event
   * Forwards EventEmitter2 events to WebSocket clients
   */
  @OnEvent('fulltext-detection.progress')
  handleFulltextDetectionProgress(payload: DetectionProgressEvent): void {
    this.server.to(`detection-${payload.paperId}`).emit('fulltext:progress', {
      paperId: payload.paperId,
      currentTier: payload.currentTier,
      totalTiers: payload.totalTiers,
      tierName: payload.tierName,
      message: payload.message,
      timestamp: payload.timestamp,
    });
  }

  /**
   * Detect full-text for a paper via WebSocket
   *
   * @event fulltext:detect { paperId: string; doi?: string; title?: string }
   * @emits fulltext:progress, fulltext:result
   */
  @SubscribeMessage('fulltext:detect')
  async handleFulltextDetect(
    @MessageBody() data: { paperId: string; doi?: string; title?: string; pdfUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { paperId, doi, title, pdfUrl } = data;

      if (!paperId) {
        return { success: false, error: 'paperId is required' };
      }

      // Join the detection room for progress updates
      client.join(`detection-${paperId}`);

      this.logger.debug(`[FullText] Client ${client.id} starting detection for paper ${paperId}`);

      // Perform detection
      const result = await this.fulltextDetection.detectFullText({
        id: paperId,
        doi,
        title,
        pdfUrl,
      });

      // Emit result
      client.emit('fulltext:result', {
        paperId,
        ...result,
      });

      // Leave the detection room
      client.leave(`detection-${paperId}`);

      return { success: true, result };
    } catch (error) {
      this.logger.error(`[FullText] Detection error: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch detect full-text for multiple papers via WebSocket
   *
   * @event fulltext:detect-batch { papers: Array<{ id, doi?, title? }> }
   * @emits fulltext:batch-result
   */
  @SubscribeMessage('fulltext:detect-batch')
  async handleFulltextDetectBatch(
    @MessageBody() data: { papers: Array<{ id: string; doi?: string; title?: string }> },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { papers } = data;

      if (!papers || !Array.isArray(papers) || papers.length === 0) {
        return { success: false, error: 'papers array is required' };
      }

      this.logger.debug(`[FullText] Client ${client.id} starting batch detection for ${papers.length} papers`);

      // Perform batch detection
      const result = await this.fulltextDetection.detectBatch(papers);

      // Emit result
      client.emit('fulltext:batch-result', result);

      return { success: true, stats: { total: papers.length, successful: result.successfulPapers.length, failed: result.failedPapers.length } };
    } catch (error) {
      this.logger.error(`[FullText] Batch detection error: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}
