/**
 * Alternative Sources Zustand Store
 * Phase 10.935 Day 1 - Enterprise-Grade Store Creation
 *
 * Centralized state management for alternative knowledge sources
 * (YouTube, podcasts, GitHub, StackOverflow, Medium, etc.)
 *
 * @module alternative-sources.store
 * @since Phase 10.935 Day 1
 * @author VQMethod Team
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export type AlternativeSourceType =
  | 'youtube'
  | 'podcasts'
  | 'github'
  | 'stackoverflow'
  | 'medium'
  | 'scholar';

export interface AlternativeSourceResult {
  id: string;
  source: AlternativeSourceType;
  title: string;
  author: string;
  url: string;
  description: string;
  publishedDate?: string;
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface TranscriptionOptions {
  /** Include video transcriptions in search */
  includeTranscripts: boolean;
  /** Extract themes from transcripts */
  extractThemes: boolean;
  /** Maximum number of results */
  maxResults: number;
}

// ============================================================================
// Store Interface
// ============================================================================

interface AlternativeSourcesState {
  // Source configuration
  sources: string[];

  // Search state
  results: AlternativeSourceResult[];
  loading: boolean;
  error: string | null;

  // YouTube/transcription state
  transcriptionOptions: TranscriptionOptions;

  // Actions - Source configuration
  setSources: (sources: string[]) => void;
  toggleSource: (source: string) => void;
  clearSources: () => void;

  // Actions - Search
  setResults: (results: AlternativeSourceResult[]) => void;
  addResults: (results: AlternativeSourceResult[]) => void;
  clearResults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Transcription
  setTranscriptionOptions: (options: Partial<TranscriptionOptions>) => void;

  // Utility actions
  reset: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SOURCES: string[] = [];

const DEFAULT_TRANSCRIPTION_OPTIONS: TranscriptionOptions = {
  includeTranscripts: false,
  extractThemes: false,
  maxResults: 10,
};

const INITIAL_STATE = {
  sources: DEFAULT_SOURCES,
  results: [],
  loading: false,
  error: null,
  transcriptionOptions: DEFAULT_TRANSCRIPTION_OPTIONS,
};

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Alternative Sources Zustand Store
 *
 * Manages state for alternative knowledge sources beyond academic databases.
 * Supports YouTube, podcasts, GitHub, StackOverflow, Medium, and Google Scholar.
 *
 * **Features:**
 * - Source selection management
 * - Search results storage
 * - Loading and error states
 * - Transcription options for video content
 * - Persistence for user preferences
 * - DevTools integration for debugging
 *
 * @example
 * ```typescript
 * const { sources, loading, setSources, setLoading } = useAlternativeSourcesStore();
 *
 * // Toggle a source
 * toggleSource('youtube');
 *
 * // Check loading state
 * if (loading) {
 *   // Show loading indicator
 * }
 * ```
 */
export const useAlternativeSourcesStore = create<AlternativeSourcesState>()(
  devtools(
    persist(
      (set, get) => ({
        // ======================================================================
        // STATE
        // ======================================================================

        ...INITIAL_STATE,

        // ======================================================================
        // ACTIONS - Source Configuration
        // ======================================================================

        /**
         * Set the selected sources
         *
         * @param sources - Array of source IDs to select
         */
        setSources: (sources: string[]): void => {
          logger.debug('Setting alternative sources', 'AlternativeSourcesStore', {
            sources,
          });
          set({ sources }, false, 'setSources');
        },

        /**
         * Toggle a source selection
         *
         * @param source - Source ID to toggle
         */
        toggleSource: (source: string): void => {
          const currentSources = get().sources;
          const newSources = currentSources.includes(source)
            ? currentSources.filter((s) => s !== source)
            : [...currentSources, source];

          logger.debug('Toggling alternative source', 'AlternativeSourcesStore', {
            source,
            wasSelected: currentSources.includes(source),
            newCount: newSources.length,
          });

          set({ sources: newSources }, false, 'toggleSource');
        },

        /**
         * Clear all selected sources
         */
        clearSources: (): void => {
          logger.debug('Clearing all sources', 'AlternativeSourcesStore');
          set({ sources: [] }, false, 'clearSources');
        },

        // ======================================================================
        // ACTIONS - Search
        // ======================================================================

        /**
         * Set search results (replaces existing)
         *
         * @param results - New results to set
         */
        setResults: (results: AlternativeSourceResult[]): void => {
          logger.debug('Setting alternative source results', 'AlternativeSourcesStore', {
            count: results.length,
          });
          set({ results, error: null }, false, 'setResults');
        },

        /**
         * Add results to existing results (append)
         *
         * @param results - Results to append
         */
        addResults: (results: AlternativeSourceResult[]): void => {
          const currentResults = get().results;
          const newResults = [...currentResults, ...results];

          logger.debug('Adding alternative source results', 'AlternativeSourcesStore', {
            added: results.length,
            total: newResults.length,
          });

          set({ results: newResults }, false, 'addResults');
        },

        /**
         * Clear all search results
         */
        clearResults: (): void => {
          logger.debug('Clearing results', 'AlternativeSourcesStore');
          set({ results: [], error: null }, false, 'clearResults');
        },

        /**
         * Set loading state
         *
         * @param loading - Loading state
         */
        setLoading: (loading: boolean): void => {
          logger.debug('Setting loading state', 'AlternativeSourcesStore', {
            loading,
          });
          set({ loading }, false, 'setLoading');
        },

        /**
         * Set error state
         *
         * @param error - Error message or null
         */
        setError: (error: string | null): void => {
          if (error) {
            logger.error('Alternative source error', 'AlternativeSourcesStore', error);
          }
          set({ error, loading: false }, false, 'setError');
        },

        // ======================================================================
        // ACTIONS - Transcription
        // ======================================================================

        /**
         * Update transcription options
         *
         * @param options - Partial transcription options to update
         */
        setTranscriptionOptions: (
          options: Partial<TranscriptionOptions>
        ): void => {
          const currentOptions = get().transcriptionOptions;
          const newOptions = { ...currentOptions, ...options };

          logger.debug('Updating transcription options', 'AlternativeSourcesStore', {
            options: newOptions,
          });

          set(
            { transcriptionOptions: newOptions },
            false,
            'setTranscriptionOptions'
          );
        },

        // ======================================================================
        // UTILITY ACTIONS
        // ======================================================================

        /**
         * Reset store to initial state
         */
        reset: (): void => {
          logger.info('Resetting alternative sources store', 'AlternativeSourcesStore');
          set(INITIAL_STATE, false, 'reset');
        },
      }),
      {
        name: 'alternative-sources-store',
        version: 1,
        // Only persist user preferences, not transient search state
        partialize: (state) => ({
          sources: state.sources,
          transcriptionOptions: state.transcriptionOptions,
        }),
      }
    ),
    {
      name: 'AlternativeSourcesStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select source configuration state
 */
export const selectSourceConfig = (state: AlternativeSourcesState) => ({
  sources: state.sources,
  sourcesCount: state.sources.length,
});

/**
 * Select search state
 */
export const selectSearchState = (state: AlternativeSourcesState) => ({
  results: state.results,
  loading: state.loading,
  error: state.error,
  resultsCount: state.results.length,
});

/**
 * Select transcription state
 */
export const selectTranscriptionState = (state: AlternativeSourcesState) => ({
  transcriptionOptions: state.transcriptionOptions,
});
