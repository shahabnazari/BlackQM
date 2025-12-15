/**
 * Phase 10.113 Week 10: Search WebSocket Hook
 *
 * React hook for progressive search streaming via WebSocket.
 * Enables <2s Time to First Result by streaming papers as sources respond.
 *
 * Features:
 * - Real-time connection management
 * - Progressive paper streaming
 * - Query intelligence display
 * - Source-by-source progress tracking
 * - Lazy enrichment on viewport
 * - Automatic reconnection
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 10
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
import { Paper } from '@/lib/types/literature.types';
import {
  ConnectionStatus,
  SearchStreamState,
  INITIAL_SEARCH_STREAM_STATE,
  StreamingSearchOptions,
  SearchStartedEvent,
  SourceStartedEvent,
  SourceCompleteEvent,
  SourceErrorEvent,
  PapersBatchEvent,
  SearchProgressEvent,
  PaperEnrichmentEvent,
  SearchCompleteEvent,
  SearchErrorEvent,
  LiteratureSource,
  SearchStage,
  // Phase 10.113 Week 11: Semantic tier types
  SemanticTierEvent,
  SemanticProgressEvent,
  // Phase 10.113 Week 12: Semantic tier stats
  SemanticTierStats,
  // Phase 10.113 Week 11 Bug 10: Rerank types
  PaperWithSemanticScore,
  RerankOptions,
  // Phase 10.155: Iterative fetch types
  IterationProgressEvent,
} from '@/lib/types/search-stream.types';

// Infer socket type from the io function return type
type SocketClient = ReturnType<typeof io>;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * WebSocket event names - must match backend gateway
 */
const WS_EVENTS = {
  // Client -> Server
  SEARCH_START: 'search:start',
  SEARCH_CANCEL: 'search:cancel',
  ENRICHMENT_REQUEST: 'enrichment:request',
  ENRICHMENT_PREFETCH: 'enrichment:prefetch',
  ENRICHMENT_STATUS: 'enrichment:status',

  // Server -> Client
  SEARCH_STARTED: 'search:started',
  SOURCE_STARTED: 'search:source-started',
  SOURCE_COMPLETE: 'search:source-complete',
  SOURCE_ERROR: 'search:source-error',
  PAPERS: 'search:papers',
  PROGRESS: 'search:progress',
  ENRICHMENT: 'search:enrichment',
  COMPLETE: 'search:complete',
  ERROR: 'search:error',
  // Phase 10.113 Week 11: Semantic tier events
  SEMANTIC_TIER: 'search:semantic-tier',
  SEMANTIC_PROGRESS: 'search:semantic-progress',
  // Phase 10.155: Iterative fetch events
  ITERATION_START: 'search:iteration-start',
  ITERATION_PROGRESS: 'search:iteration-progress',
  ITERATION_COMPLETE: 'search:iteration-complete',
} as const;

/**
 * Reconnection configuration
 * Phase 10.115: Increased timeouts for long-running multi-source searches
 */
const RECONNECTION_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 120000, // 2 minutes - matches backend pingTimeout for long searches
} as const;

/**
 * Elapsed time update interval (ms)
 */
const ELAPSED_UPDATE_INTERVAL = 100;

// ============================================================================
// HOOK INTERFACE
// ============================================================================

/**
 * Search WebSocket hook callbacks
 */
export interface SearchWebSocketCallbacks {
  /** Called when search starts with query intelligence */
  onSearchStarted?: (event: SearchStartedEvent) => void;
  /** Called when new papers arrive */
  onPapers?: (papers: Paper[], source: LiteratureSource, cumulative: number) => void;
  /** Called on progress updates */
  onProgress?: (event: SearchProgressEvent) => void;
  /** Called when paper is enriched */
  onEnrichment?: (event: PaperEnrichmentEvent) => void;
  /** Called when search completes */
  onComplete?: (event: SearchCompleteEvent) => void;
  /** Called on errors */
  onError?: (error: string, recoverable: boolean) => void;
  /** Called on connection status change */
  onConnectionChange?: (status: ConnectionStatus) => void;
  // Phase 10.113 Week 11: Semantic tier callbacks
  /** Called when semantic tier completes with re-ranked papers */
  onSemanticTier?: (event: SemanticTierEvent) => void;
  /** Called on semantic processing progress updates */
  onSemanticProgress?: (event: SemanticProgressEvent) => void;
  // Phase 10.113 Week 11 Bug 10: Rerank callback with position animation
  /** Called when papers are re-ranked with position changes for animation */
  onRerank?: (
    papers: PaperWithSemanticScore[],
    reason: 'semantic-tier' | 'user-sort' | 'filter-change',
    options: RerankOptions
  ) => void;
  // Phase 10.155: Iterative fetch callbacks
  /** Called when an iteration starts */
  onIterationStart?: (event: IterationProgressEvent) => void;
  /** Called during iteration progress updates */
  onIterationProgress?: (event: IterationProgressEvent) => void;
  /** Called when iteration completes (success or stopped) */
  onIterationComplete?: (event: IterationProgressEvent) => void;
}

/**
 * Search WebSocket hook return type
 */
export interface SearchWebSocketReturn {
  // State
  state: SearchStreamState;
  isConnected: boolean;
  isSearching: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  startSearch: (query: string, options?: StreamingSearchOptions) => Promise<{ success: boolean; searchId?: string; error?: string }>;
  cancelSearch: () => Promise<boolean>;

  // Enrichment
  requestEnrichment: (paperIds: string[], priority?: 'high' | 'normal') => Promise<void>;
  prefetchEnrichment: (paperIds: string[]) => void;

  // Phase 10.113 Week 11 Bug 10: User interaction state management
  /** Select a paper (preserve during re-ranking) */
  selectPaper: (paperId: string) => void;
  /** Deselect a paper */
  deselectPaper: (paperId: string) => void;
  /** Expand a paper (preserve during re-ranking) */
  expandPaper: (paperId: string) => void;
  /** Collapse a paper */
  collapsePaper: (paperId: string) => void;
  /** Update scroll position (preserve during re-ranking) */
  setScrollPosition: (position: number) => void;

  // Utilities
  resetState: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Phase 10.113 Week 11 Bug 10: Calculate position changes for smooth animation
 *
 * @param oldPapers - Previous paper list
 * @param newPapers - New paper list after re-ranking
 * @returns Map of paper IDs to position changes
 */
function calculatePositionChanges(
  oldPapers: Paper[] | undefined,
  newPapers: Paper[]
): Map<string, { from: number; to: number }> {
  const changes = new Map<string, { from: number; to: number }>();

  if (!oldPapers || oldPapers.length === 0) {
    return changes;
  }

  // Create map of old positions
  const oldPositions = new Map<string, number>();
  oldPapers.forEach((paper, index) => {
    oldPositions.set(paper.id, index);
  });

  // Find papers that changed position
  newPapers.forEach((paper, newIndex) => {
    const oldIndex = oldPositions.get(paper.id);
    if (oldIndex !== undefined && oldIndex !== newIndex) {
      changes.set(paper.id, { from: oldIndex, to: newIndex });
    }
  });

  return changes;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for progressive search streaming via WebSocket
 *
 * @param callbacks - Event callbacks
 * @returns Search WebSocket controls and state
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   isConnected,
 *   startSearch,
 *   cancelSearch,
 *   requestEnrichment,
 * } = useSearchWebSocket({
 *   onPapers: (papers) => setPapers(prev => [...prev, ...papers]),
 *   onProgress: (event) => setProgress(event.percent),
 *   onComplete: (event) => setLoading(false),
 * });
 * ```
 */
export function useSearchWebSocket(
  callbacks: SearchWebSocketCallbacks = {}
): SearchWebSocketReturn {
  // Socket ref
  const socketRef = useRef<SocketClient | null>(null);

  // Callbacks ref to avoid stale closures
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // State
  const [state, setState] = useState<SearchStreamState>(INITIAL_SEARCH_STREAM_STATE);

  // Elapsed time timer ref
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  /**
   * Update connection status
   */
  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setState(prev => ({ ...prev, connectionStatus: status }));
    callbacksRef.current.onConnectionChange?.(status);
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionStatus('connecting');

    // WebSocket connects to base URL without /api prefix
    // REST: http://localhost:4000/api  (NEXT_PUBLIC_API_URL)
    // WebSocket: http://localhost:4000 (base URL)
    const restApiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
    const wsBaseUrl = restApiUrl.replace(/\/api\/?$/, ''); // Strip /api suffix for WebSocket
    const socket = io(`${wsBaseUrl}/literature`, {
      transports: ['websocket', 'polling'],
      ...RECONNECTION_CONFIG,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[SearchWebSocket] Connected to /literature namespace');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[SearchWebSocket] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[SearchWebSocket] Connection error:', error.message);
      setConnectionStatus('error');
      callbacksRef.current.onError?.(`Connection failed: ${error.message}`, true);
    });

    socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SearchWebSocket] Reconnection attempt ${attempt}`);
      setConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect', () => {
      console.log('[SearchWebSocket] Reconnected');
      setConnectionStatus('connected');
    });

    socket.io.on('reconnect_failed', () => {
      console.error('[SearchWebSocket] Reconnection failed');
      setConnectionStatus('error');
      callbacksRef.current.onError?.('Failed to reconnect after multiple attempts', false);
    });

    // Search events
    socket.on(WS_EVENTS.SEARCH_STARTED, (event: SearchStartedEvent) => {
      console.log('[SearchWebSocket] Search started:', event.searchId);
      setState(prev => ({
        ...prev,
        searchId: event.searchId,
        isSearching: true,
        query: event.query,
        intelligence: event.intelligence,
        startTime: event.timestamp,
        error: null,
      }));
      callbacksRef.current.onSearchStarted?.(event);
    });

    socket.on(WS_EVENTS.SOURCE_STARTED, (event: SourceStartedEvent) => {
      setState(prev => {
        const newSourceStats = new Map(prev.sourceStats);
        newSourceStats.set(event.source, {
          source: event.source,
          status: 'searching',
          tier: event.tier,
          paperCount: 0,
          timeMs: 0,
        });
        return { ...prev, sourceStats: newSourceStats };
      });
    });

    socket.on(WS_EVENTS.SOURCE_COMPLETE, (event: SourceCompleteEvent) => {
      setState(prev => {
        const newSourceStats = new Map(prev.sourceStats);
        newSourceStats.set(event.source, {
          source: event.source,
          status: 'complete',
          tier: event.tier,
          paperCount: event.paperCount,
          timeMs: event.timeMs,
        });
        return {
          ...prev,
          sourceStats: newSourceStats,
          sourcesComplete: prev.sourcesComplete + 1,
        };
      });
    });

    socket.on(WS_EVENTS.SOURCE_ERROR, (event: SourceErrorEvent) => {
      setState(prev => {
        const newSourceStats = new Map(prev.sourceStats);
        const existing = prev.sourceStats.get(event.source);
        if (existing) {
          newSourceStats.set(event.source, {
            ...existing,
            status: 'error',
            error: event.error,
          });
        }
        return { ...prev, sourceStats: newSourceStats };
      });
    });

    socket.on(WS_EVENTS.PAPERS, (event: PapersBatchEvent) => {
      setState(prev => ({
        ...prev,
        papers: [...prev.papers, ...event.papers],
        papersFound: event.cumulativeCount,
      }));
      callbacksRef.current.onPapers?.(event.papers, event.source, event.cumulativeCount);
    });

    socket.on(WS_EVENTS.PROGRESS, (event: SearchProgressEvent) => {
      setState(prev => ({
        ...prev,
        stage: event.stage as SearchStage,
        percent: event.percent,
        message: event.message,
        sourcesComplete: event.sourcesComplete,
        sourcesTotal: event.sourcesTotal,
        papersFound: event.papersFound,
      }));
      callbacksRef.current.onProgress?.(event);
    });

    socket.on(WS_EVENTS.ENRICHMENT, (event: PaperEnrichmentEvent) => {
      setState(prev => {
        const newEnriched = new Set(prev.enrichedPaperIds);
        newEnriched.add(event.paperId);

        // Update paper in the list
        const newPapers = prev.papers.map((paper): Paper => {
          if (paper.id === event.paperId) {
            const updatedPaper: Paper = {
              ...paper,
              citationCount: event.citationCount,
            };
            if (event.impactFactor !== undefined) updatedPaper.impactFactor = event.impactFactor;
            if (event.hIndexJournal !== undefined) updatedPaper.hIndexJournal = event.hIndexJournal;
            if (event.quartile !== undefined) updatedPaper.quartile = event.quartile;
            if (event.venue !== undefined) updatedPaper.venue = event.venue;
            if (event.fieldsOfStudy !== undefined) updatedPaper.fieldsOfStudy = event.fieldsOfStudy;
            return updatedPaper;
          }
          return paper;
        });

        return {
          ...prev,
          papers: newPapers,
          enrichedPaperIds: newEnriched,
          enrichmentPending: Math.max(0, prev.enrichmentPending - 1),
        };
      });
      callbacksRef.current.onEnrichment?.(event);
    });

    // Phase 10.113 Week 11: Semantic tier events with Bug 10 fix
    // Phase 10.113 Week 12: Enhanced with tier stats tracking
    socket.on(WS_EVENTS.SEMANTIC_TIER, (event: SemanticTierEvent) => {
      console.log(`[SearchWebSocket] Semantic tier ${event.tier} complete: ${event.papers.length} papers, ${event.latencyMs}ms, cache: ${event.metadata?.cacheHits ?? 0}`);

      // Store previous papers for position change calculation
      let previousPapers: Paper[] = [];

      // Only update if this is a newer version (prevents out-of-order updates)
      setState(prev => {
        if (event.version <= prev.semanticVersion) {
          console.log(`[SearchWebSocket] Skipping stale semantic tier v${event.version} (current: v${prev.semanticVersion})`);
          return prev;
        }

        // Bug 10 FIX: Store previous papers for position animation
        previousPapers = prev.papers;

        // Bug 10 FIX: Merge new papers while preserving user state
        const mergedPapers = event.papers.map(newPaper => {
          const existingPaper = prev.papers.find(p => p.id === newPaper.id);
          return {
            ...newPaper,
            // Preserve any user-added notes from existing paper
            ...(existingPaper && 'userNotes' in existingPaper ? { userNotes: existingPaper.userNotes } : {}),
          };
        });

        // Phase 10.113 Week 12: Create tier stats from event metadata
        const newTierStats = new Map(prev.semanticTierStats);
        const tierStats: SemanticTierStats = {
          tier: event.tier,
          isComplete: true,
          latencyMs: event.latencyMs,
          papersProcessed: event.metadata?.papersProcessed ?? event.papers.length,
          cacheHits: event.metadata?.cacheHits ?? 0,
          embedGenerated: event.metadata?.embedGenerated ?? 0,
          usedWorkerPool: event.metadata?.usedWorkerPool ?? false,
          progressPercent: 100,
          progressMessage: `Completed in ${(event.latencyMs / 1000).toFixed(1)}s`,
        };
        newTierStats.set(event.tier, tierStats);

        return {
          ...prev,
          semanticTier: event.tier,
          semanticVersion: event.version,
          semanticTierStats: newTierStats,
          // Bug 10 FIX: Use merged papers that preserve user notes
          papers: mergedPapers,
          // Bug 10 FIX: Preserve all user interaction state
          selectedPaperIds: prev.selectedPaperIds,
          expandedPaperIds: prev.expandedPaperIds,
          scrollPosition: prev.scrollPosition,
        };
      });

      // Bug 10 FIX: Calculate position changes for animation
      const positionChanges = calculatePositionChanges(previousPapers, event.papers);

      // Bug 10 FIX: Call onRerank with position animation data
      if (callbacksRef.current.onRerank) {
        callbacksRef.current.onRerank(
          event.papers,
          'semantic-tier',
          {
            animate: positionChanges.size > 0,
            positionChanges,
          }
        );
      }

      callbacksRef.current.onSemanticTier?.(event);
    });

    // Phase 10.113 Week 12: Track semantic progress with stats
    socket.on(WS_EVENTS.SEMANTIC_PROGRESS, (event: SemanticProgressEvent) => {
      console.log(`[SearchWebSocket] Semantic progress: ${event.tier} - ${event.percent}% (${event.papersProcessed}/${event.papersTotal})`);

      // Update tier stats with progress
      setState(prev => {
        const newTierStats = new Map(prev.semanticTierStats);
        const existing = newTierStats.get(event.tier);

        const updatedStats: SemanticTierStats = {
          tier: event.tier,
          isComplete: false,
          latencyMs: existing?.latencyMs ?? 0,
          papersProcessed: event.papersProcessed,
          cacheHits: existing?.cacheHits ?? 0,
          embedGenerated: existing?.embedGenerated ?? 0,
          usedWorkerPool: existing?.usedWorkerPool ?? false,
          progressPercent: event.percent,
          progressMessage: event.message,
        };
        newTierStats.set(event.tier, updatedStats);

        return { ...prev, semanticTierStats: newTierStats };
      });

      callbacksRef.current.onSemanticProgress?.(event);
    });

    // Phase 10.155: Iterative fetch event handlers
    socket.on(WS_EVENTS.ITERATION_START, (event: IterationProgressEvent) => {
      console.log(`[SearchWebSocket] Iteration ${event.iteration} started: threshold=${event.threshold}, fetchLimit=${event.fetchLimit}`);
      callbacksRef.current.onIterationStart?.(event);
    });

    socket.on(WS_EVENTS.ITERATION_PROGRESS, (event: IterationProgressEvent) => {
      console.log(`[SearchWebSocket] Iteration ${event.iteration} progress: ${event.papersFound}/${event.targetPapers} papers (yield: ${(event.yieldRate * 100).toFixed(1)}%)`);
      callbacksRef.current.onIterationProgress?.(event);
    });

    socket.on(WS_EVENTS.ITERATION_COMPLETE, (event: IterationProgressEvent) => {
      console.log(`[SearchWebSocket] Iteration complete: ${event.papersFound}/${event.targetPapers} papers, reason=${event.reason}`);
      callbacksRef.current.onIterationComplete?.(event);
    });

    socket.on(WS_EVENTS.COMPLETE, (event: SearchCompleteEvent) => {
      console.log('[SearchWebSocket] Search complete:', event.totalTimeMs, 'ms');

      // Stop elapsed timer
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isSearching: false,
        stage: 'complete',
        percent: 100,
        message: `Found ${event.uniquePapers} papers in ${(event.totalTimeMs / 1000).toFixed(1)}s`,
        elapsedMs: event.totalTimeMs,
      }));
      callbacksRef.current.onComplete?.(event);
    });

    socket.on(WS_EVENTS.ERROR, (event: SearchErrorEvent) => {
      console.error('[SearchWebSocket] Search error:', event.error);

      // Stop elapsed timer
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isSearching: false,
        error: event.error,
      }));
      callbacksRef.current.onError?.(event.error, event.recoverable);
    });

    // Generic error handler
    socket.on('error', (error: { message: string; recoverable?: boolean }) => {
      console.error('[SearchWebSocket] Error:', error);
      callbacksRef.current.onError?.(error.message, error.recoverable ?? true);
    });

    socketRef.current = socket;
  }, [setConnectionStatus]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  // ===========================================================================
  // SEARCH ACTIONS
  // ===========================================================================

  /**
   * Start a progressive search
   */
  const startSearch = useCallback(async (
    query: string,
    options: StreamingSearchOptions = {}
  ): Promise<{ success: boolean; searchId?: string; error?: string }> => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return { success: false, error: 'Not connected to server' };
    }

    if (!query.trim()) {
      return { success: false, error: 'Query is required' };
    }

    // Reset state for new search
    setState(prev => ({
      ...INITIAL_SEARCH_STREAM_STATE,
      connectionStatus: prev.connectionStatus,
      query: query.trim(),
      isSearching: true,
      startTime: Date.now(),
    }));

    // Start elapsed time tracker
    elapsedTimerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.startTime && prev.isSearching) {
          return { ...prev, elapsedMs: Date.now() - prev.startTime };
        }
        return prev;
      });
    }, ELAPSED_UPDATE_INTERVAL);

    return new Promise((resolve) => {
      socket.emit(
        WS_EVENTS.SEARCH_START,
        { query: query.trim(), options },
        (response: { success: boolean; searchId?: string; error?: string }) => {
          if (!response.success) {
            if (elapsedTimerRef.current) {
              clearInterval(elapsedTimerRef.current);
              elapsedTimerRef.current = null;
            }
            setState(prev => ({
              ...prev,
              isSearching: false,
              error: response.error || 'Search failed to start',
            }));
          }
          resolve(response);
        }
      );
    });
  }, []);

  /**
   * Cancel current search
   */
  const cancelSearch = useCallback(async (): Promise<boolean> => {
    const socket = socketRef.current;

    if (!socket?.connected || !state.searchId) {
      return false;
    }

    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    return new Promise((resolve) => {
      socket.emit(
        WS_EVENTS.SEARCH_CANCEL,
        { searchId: state.searchId },
        (response: { success: boolean }) => {
          if (response.success) {
            setState(prev => ({
              ...prev,
              isSearching: false,
              message: 'Search cancelled',
            }));
          }
          resolve(response.success);
        }
      );
    });
  }, [state.searchId]);

  // ===========================================================================
  // ENRICHMENT ACTIONS
  // ===========================================================================

  /**
   * Request enrichment for papers in viewport
   */
  const requestEnrichment = useCallback(async (
    paperIds: string[],
    priority: 'high' | 'normal' = 'normal'
  ): Promise<void> => {
    const socket = socketRef.current;

    if (!socket?.connected || !state.searchId || paperIds.length === 0) {
      return;
    }

    // Filter already enriched papers
    const needEnrichment = paperIds.filter(id => !state.enrichedPaperIds.has(id));

    if (needEnrichment.length === 0) {
      return;
    }

    setState(prev => ({
      ...prev,
      enrichmentPending: prev.enrichmentPending + needEnrichment.length,
    }));

    socket.emit(WS_EVENTS.ENRICHMENT_REQUEST, {
      searchId: state.searchId,
      paperIds: needEnrichment,
      priority,
    });
  }, [state.searchId, state.enrichedPaperIds]);

  /**
   * Pre-fetch enrichment for papers about to be viewed
   */
  const prefetchEnrichment = useCallback((paperIds: string[]): void => {
    const socket = socketRef.current;

    if (!socket?.connected || !state.searchId || paperIds.length === 0) {
      return;
    }

    socket.emit(WS_EVENTS.ENRICHMENT_PREFETCH, {
      searchId: state.searchId,
      paperIds,
    });
  }, [state.searchId]);

  // ===========================================================================
  // PHASE 10.113 WEEK 11 BUG 10: USER STATE MANAGEMENT
  // ===========================================================================

  /**
   * Select a paper (preserved during re-ranking)
   */
  const selectPaper = useCallback((paperId: string): void => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPaperIds);
      newSelected.add(paperId);
      return { ...prev, selectedPaperIds: newSelected };
    });
  }, []);

  /**
   * Deselect a paper
   */
  const deselectPaper = useCallback((paperId: string): void => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPaperIds);
      newSelected.delete(paperId);
      return { ...prev, selectedPaperIds: newSelected };
    });
  }, []);

  /**
   * Expand a paper (preserved during re-ranking)
   */
  const expandPaper = useCallback((paperId: string): void => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedPaperIds);
      newExpanded.add(paperId);
      return { ...prev, expandedPaperIds: newExpanded };
    });
  }, []);

  /**
   * Collapse a paper
   */
  const collapsePaper = useCallback((paperId: string): void => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedPaperIds);
      newExpanded.delete(paperId);
      return { ...prev, expandedPaperIds: newExpanded };
    });
  }, []);

  /**
   * Update scroll position (preserved during re-ranking)
   */
  const setScrollPosition = useCallback((position: number): void => {
    setState(prev => ({ ...prev, scrollPosition: position }));
  }, []);

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Reset state to initial
   */
  const resetState = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    setState(prev => ({
      ...INITIAL_SEARCH_STREAM_STATE,
      connectionStatus: prev.connectionStatus,
    }));
  }, []);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Auto-connect on mount, cleanup on unmount
   */
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // ===========================================================================
  // RETURN
  // ===========================================================================

  return {
    state,
    isConnected: state.connectionStatus === 'connected',
    isSearching: state.isSearching,

    connect,
    disconnect,
    startSearch,
    cancelSearch,

    requestEnrichment,
    prefetchEnrichment,

    // Phase 10.113 Week 11 Bug 10: User state management
    selectPaper,
    deselectPaper,
    expandPaper,
    collapsePaper,
    setScrollPosition,

    resetState,
  };
}

export default useSearchWebSocket;
