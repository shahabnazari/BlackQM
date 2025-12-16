/**
 * Phase 10.126: Streaming Search Section
 *
 * Enhanced search section that integrates WebSocket streaming for
 * <2s Time to First Result. This component wraps the existing search
 * functionality with real-time streaming capabilities.
 *
 * Features:
 * - WebSocket progressive search streaming
 * - Query intelligence panel
 * - Netflix-grade pipeline visualization (Phase 10.126)
 * - Lazy enrichment on viewport
 * - Automatic fallback to HTTP on WebSocket failure
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 10
 * @updated Phase 10.126 - Netflix-grade pipeline visualization
 */

'use client';

import React, { useCallback, useEffect, useState, memo, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Zap, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useSearchWebSocket } from '@/lib/hooks/useSearchWebSocket';
import { QueryIntelligencePanel } from '../components/SearchSection/QueryIntelligencePanel';
// Phase 10.126: Netflix-grade pipeline visualization (replaces LiveSearchProgress)
import { SearchPipelineOrchestra } from '../components/PipelineOrchestra';
import type { QuerySuggestion } from '@/lib/types/search-stream.types';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const FEATURE_FLAGS = {
  /** Enable WebSocket streaming by default */
  STREAMING_ENABLED_DEFAULT: true,
  /** Show query intelligence panel - DISABLED: Adds clutter, "Controversy Potential" is confusing */
  SHOW_QUERY_INTELLIGENCE: false,
  /** Show live progress component */
  SHOW_LIVE_PROGRESS: true,
} as const;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface StreamingSearchSectionProps {
  /** Callback for search execution (fallback to HTTP) */
  onHttpSearch?: () => Promise<void>;
}

/**
 * Ref handle for StreamingSearchSection
 * Exposes methods for parent component to trigger searches
 */
export interface StreamingSearchSectionHandle {
  /** Trigger a streaming search with HTTP fallback */
  triggerSearch: () => Promise<void>;
  /** Check if WebSocket is connected */
  isConnected: boolean;
  /** Check if search is in progress */
  isSearching: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StreamingSearchSection = memo(forwardRef<StreamingSearchSectionHandle, StreamingSearchSectionProps>(function StreamingSearchSection({
  onHttpSearch,
}, ref) {
  // ==========================================================================
  // LOCAL STATE
  // ==========================================================================

  const [streamingEnabled, setStreamingEnabled] = useState<boolean>(FEATURE_FLAGS.STREAMING_ENABLED_DEFAULT);
  const [showSettings, setShowSettings] = useState(false);
  const [correctionApplied, setCorrectionApplied] = useState(false);

  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  const {
    query,
    setQuery,
    setPapers,
    setLoading,
    setTotalResults,
    // Phase 10.115: Get user-selected sources for WebSocket search
    academicDatabases,
    // Phase 10.115: Clear selection on new search to prevent stale selection counts
    clearSelection,
  } = useLiteratureSearchStore();

  // ==========================================================================
  // WEBSOCKET HOOK
  // ==========================================================================

  const {
    state: wsState,
    isConnected,
    isSearching,
    startSearch,
    cancelSearch,
    resetState,
  } = useSearchWebSocket({
    onSearchStarted: (event) => {
      logger.info('WebSocket search started', 'StreamingSearchSection', {
        searchId: event.searchId,
        query: event.query,
      });
    },
    onPapers: (papers, source, cumulativeCount) => {
      logger.debug(`Received ${papers.length} papers from ${source} (total: ${cumulativeCount})`, 'StreamingSearchSection');
      // Note: Papers are accumulated in wsState.papers by the hook
      // We sync to store via the useEffect below to avoid stale closures
    },
    onComplete: (event) => {
      logger.info('WebSocket search complete', 'StreamingSearchSection', {
        totalPapers: event.totalPapers,
        timeMs: event.totalTimeMs,
      });
      setTotalResults(event.uniquePapers);
      setLoading(false);
    },
    onError: (error, recoverable) => {
      logger.error('WebSocket search error', 'StreamingSearchSection', { error, recoverable });
      if (!recoverable) {
        // Fall back to HTTP search
        setStreamingEnabled(false);
      }
      setLoading(false);
    },
    onConnectionChange: (status) => {
      logger.debug(`Connection status: ${status}`, 'StreamingSearchSection');
    },
  });

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle accepting spell correction
   */
  const handleAcceptCorrection = useCallback((correctedQuery: string) => {
    setQuery(correctedQuery);
    setCorrectionApplied(true);
  }, [setQuery]);

  /**
   * Handle undoing spell correction
   */
  const handleUndoCorrection = useCallback((originalQuery: string) => {
    setQuery(originalQuery);
    setCorrectionApplied(false);
  }, [setQuery]);

  /**
   * Handle suggestion selection
   */
  const handleSelectSuggestion = useCallback((suggestion: QuerySuggestion) => {
    setQuery(suggestion.query);
  }, [setQuery]);

  /**
   * Handle cancel search
   */
  const handleCancelSearch = useCallback(async () => {
    await cancelSearch();
    setLoading(false);
  }, [cancelSearch, setLoading]);

  /**
   * Toggle streaming mode
   */
  const handleToggleStreaming = useCallback((checked: boolean) => {
    setStreamingEnabled(checked);
  }, []);

  /**
   * Handle streaming search with HTTP fallback
   * Exposed for parent component to trigger searches
   */
  const handleStreamingSearch = useCallback(async (): Promise<void> => {
    if (!query.trim()) return;

    // If streaming is disabled or not connected, fall back to HTTP
    if (!streamingEnabled || !isConnected) {
      if (onHttpSearch) {
        await onHttpSearch();
      }
      return;
    }

    setLoading(true);
    resetState();
    setCorrectionApplied(false);
    // Phase 10.115: Clear selection on new search to prevent stale selection counts
    clearSelection();

    // Phase 10.115: Remove hardcoded limit - let backend use tier-based allocation
    // Tier 1 (Premium): 500 papers, Tier 2 (Good): 400, Tier 3/4: 300
    // Pass user-selected sources to backend for filtering
    const result = await startSearch(query, {
      sortBy: 'relevance',
      // Phase 10.115: Pass user-selected sources from store
      // Backend will filter these through SourceCapabilityService for availability/ORCID auth
      sources: academicDatabases,
    });

    if (!result.success) {
      logger.warn('Streaming search failed, falling back to HTTP', 'StreamingSearchSection');
      // Fall back to HTTP search on failure
      if (onHttpSearch) {
        await onHttpSearch();
      }
    }
  }, [query, streamingEnabled, isConnected, startSearch, resetState, setLoading, onHttpSearch, academicDatabases, clearSelection]);

  // ==========================================================================
  // IMPERATIVE HANDLE
  // ==========================================================================

  /**
   * Expose methods to parent component via ref
   */
  useImperativeHandle(ref, () => ({
    triggerSearch: handleStreamingSearch,
    isConnected,
    isSearching,
  }), [handleStreamingSearch, isConnected, isSearching]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Sync WebSocket papers to store
   */
  useEffect(() => {
    if (wsState.papers.length > 0) {
      setPapers(wsState.papers);
    }
  }, [wsState.papers, setPapers]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-4">
      {/* Connection Status & Settings Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div
            className="flex items-center gap-1.5"
            role="status"
            aria-live="polite"
            aria-label={
              isConnected
                ? 'WebSocket connected - Real-time streaming enabled'
                : 'WebSocket disconnected - Using HTTP fallback'
            }
            title={
              isConnected
                ? 'WebSocket connected - Real-time streaming enabled'
                : 'WebSocket disconnected - Using HTTP fallback'
            }
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" aria-hidden="true" />
                <span className="text-xs text-green-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Offline</span>
              </>
            )}
          </div>

          {/* Streaming Mode Badge */}
          {streamingEnabled && isConnected && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
              <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
              Streaming
            </Badge>
          )}
        </div>

        {/* Settings Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Toggle streaming settings"
          aria-expanded={showSettings}
          aria-controls="streaming-settings-panel"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              id="streaming-settings-panel"
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
              role="region"
              aria-label="Streaming search settings"
            >
              <div className="flex items-center justify-between">
                <div>
                  <label
                    id="streaming-toggle-label"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Real-time Streaming
                  </label>
                  <p id="streaming-toggle-description" className="text-xs text-gray-500">
                    Stream results as they arrive (&lt;2s to first result)
                  </p>
                </div>
                <Switch
                  checked={streamingEnabled}
                  onCheckedChange={handleToggleStreaming}
                  disabled={!isConnected}
                  aria-labelledby="streaming-toggle-label"
                  aria-describedby="streaming-toggle-description"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label
                    id="intelligence-toggle-label"
                    className="text-sm font-medium text-gray-700"
                  >
                    Query Intelligence
                  </label>
                  <p id="intelligence-toggle-description" className="text-xs text-gray-500">
                    Show spell corrections, methodology detection
                  </p>
                </div>
                <Switch
                  checked={FEATURE_FLAGS.SHOW_QUERY_INTELLIGENCE}
                  disabled
                  aria-labelledby="intelligence-toggle-label"
                  aria-describedby="intelligence-toggle-description"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Query Intelligence Panel */}
      {FEATURE_FLAGS.SHOW_QUERY_INTELLIGENCE && wsState.intelligence && (
        <QueryIntelligencePanel
          intelligence={wsState.intelligence}
          visible={!isSearching && wsState.intelligence !== null}
          onAcceptCorrection={handleAcceptCorrection}
          onUndoCorrection={handleUndoCorrection}
          onSelectSuggestion={handleSelectSuggestion}
          correctionApplied={correctionApplied}
        />
      )}

      {/* Phase 10.126: Netflix-Grade Pipeline Visualization */}
      {/* Phase 10.155 FIX: Use searchId as key to force remount on new search */}
      {/* This ensures all animations restart when a new search begins */}
      <AnimatePresence mode="wait">
        {FEATURE_FLAGS.SHOW_LIVE_PROGRESS && (isSearching || wsState.sourceStats.size > 0) && (
          <SearchPipelineOrchestra
            key={wsState.searchId || 'initial'}
            isSearching={isSearching}
            stage={wsState.stage}
            percent={wsState.percent}
            message={wsState.message}
            sourceStats={wsState.sourceStats}
            sourcesComplete={wsState.sourcesComplete}
            sourcesTotal={wsState.sourcesTotal}
            papersFound={wsState.papersFound}
            elapsedMs={wsState.elapsedMs}
            // Phase 10.113 Week 11: Semantic tier progress
            semanticTier={wsState.semanticTier}
            semanticVersion={wsState.semanticVersion}
            // Phase 10.113 Week 12: Semantic tier stats for detailed display
            semanticTierStats={wsState.semanticTierStats}
            // Phase 10.160: Quality selection state for funnel visualization
            selectionRankedCount={wsState.selectionRankedCount}
            selectionSelectedCount={wsState.selectionSelectedCount}
            selectionAvgQuality={wsState.selectionAvgQuality}
            // Phase 10.126: Callbacks
            onCancel={handleCancelSearch}
            // Optional: Enable/disable features
            showParticles={true}
            showSemanticBrain={true}
            showQualityFunnel={true}
            compactMode={false}
          />
        )}
      </AnimatePresence>

      {/* Error Display */}
      {wsState.error && (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-700">{wsState.error}</p>
          <p className="text-xs text-red-500 mt-1">
            Search will automatically fall back to standard mode.
          </p>
        </div>
      )}
    </div>
  );
}));

export default StreamingSearchSection;
