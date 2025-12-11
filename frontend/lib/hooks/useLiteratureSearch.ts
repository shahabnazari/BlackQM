/**
 * ⚠️ MANDATORY READING BEFORE MODIFYING THIS FILE ⚠️
 *
 * READ FIRST: Main Docs/PHASE_TRACKER_PART3.md
 * Section: "📖 LITERATURE PAGE DEVELOPMENT PRINCIPLES (MANDATORY FOR ALL FUTURE WORK)"
 * Location: Lines 4092-4244 (RIGHT BEFORE Phase 10.7)
 *
 * This hook is part of the Literature Discovery Page (/discover/literature)
 * ALL modifications must follow 10 enterprise-grade principles documented in Phase Tracker Part 3
 *
 * Key Requirements for Hook Layer:
 * - ✅ Single Responsibility: Manage ONE feature's state (literature search only)
 * - ✅ Hook-based state management (useState, useEffect, useCallback)
 * - ✅ NO business logic (business logic belongs in Service layer)
 * - ✅ API calls through dedicated API service layer only
 * - ✅ Type safety: strict TypeScript, explicit return types, no any types
 * - ✅ Error handling: user-friendly messages, no silent failures
 * - ✅ Zero TypeScript errors (MANDATORY before commit)
 *
 * Architecture Pattern (Hook Layer Position):
 * User → Component → **[HOOK]** → API Service → Controller → Main Service → Source Services → External APIs
 *
 * Reference: IMPLEMENTATION_GUIDE_PART6.md for hook implementation patterns
 *
 * ⚠️ DO NOT add business logic here. Read the principles first. ⚠️
 */

/**
 * Literature Search Hook - Phase 10.1 Day 5
 *
 * Enterprise-grade hook for managing academic literature search operations.
 * Extracts search logic from God Component pattern to improve maintainability.
 *
 * @module useLiteratureSearch
 * @since Phase 10.1 Day 5
 * @author VQMethod Team
 *
 * **Features:**
 * - Academic database selection and management
 * - Search execution with comprehensive filtering
 * - Query correction and validation
 * - Auto-selection of results
 * - Integration with Zustand store for state persistence
 * - TypeScript strict mode compliance
 *
 * **Usage:**
 * ```typescript
 * const {
 *   academicDatabases,
 *   setAcademicDatabases,
 *   queryCorrectionMessage,
 *   handleSearch,
 *   isSearching,
 * } = useLiteratureSearch();
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useProgressiveSearch } from './useProgressiveSearch';
import { logger } from '@/lib/utils/logger';

/**
 * Query correction message structure
 */
export interface QueryCorrectionMessage {
  original: string;
  corrected: string;
}

/**
 * Search hook configuration options
 */
export interface UseLiteratureSearchConfig {
  /** Callback when search completes successfully */
  onSearchSuccess?: (paperCount: number, total: number, papers: any[]) => void;
  /** Callback when search fails */
  onSearchError?: (error: Error) => void;
  /** Auto-select all papers after search (default: true) */
  autoSelectPapers?: boolean;
  /** Switch to results tab after search (default: true) */
  autoSwitchToResults?: boolean;
}

/**
 * Return type for useLiteratureSearch hook
 */
export interface UseLiteratureSearchReturn {
  // Database selection state
  academicDatabases: string[];
  setAcademicDatabases: (databases: string[]) => void;

  // Query correction
  queryCorrectionMessage: QueryCorrectionMessage | null;
  clearQueryCorrection: () => void;

  // Search operations
  handleSearch: () => Promise<void>;
  isSearching: boolean;

  // Zustand store access (for convenience)
  query: string;
  papers: any[];
  loading: boolean;
  totalResults: number;
  filters: any;
  appliedFilters: any;
}

/**
 * Hook for managing literature search operations
 *
 * **Architecture:**
 * - Wraps Zustand store for global state management
 * - Adds search-specific logic and handlers
 * - Database selection now in Zustand (Phase 10.7.10: persisted in localStorage)
 * - Handles query correction notifications
 *
 * @param {UseLiteratureSearchConfig} config - Configuration options
 * @returns {UseLiteratureSearchReturn} Search state and operations
 */
export function useLiteratureSearch(
  config: UseLiteratureSearchConfig = {}
): UseLiteratureSearchReturn {
  const {
    onSearchSuccess,
    onSearchError,
    // autoSelectPapers handled by page.tsx after progressive search completes
    // autoSwitchToResults not implemented yet - reserved for future use
  } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  // Local state (not in Zustand)
  const [queryCorrectionMessage, setQueryCorrectionMessage] =
    useState<QueryCorrectionMessage | null>(null);

  // Zustand store state and actions (Phase 10.7.10: academicDatabases moved to Zustand)
  // ✅ PERFORMANCE FIX: Use selective subscriptions to prevent re-render storm
  // Each selector only subscribes to its specific value, not the entire store
  const query = useLiteratureSearchStore((state) => state.query);
  const papers = useLiteratureSearchStore((state) => state.papers);
  const loading = useLiteratureSearchStore((state) => state.loading);
  const totalResults = useLiteratureSearchStore((state) => state.totalResults);
  const filters = useLiteratureSearchStore((state) => state.filters);
  const appliedFilters = useLiteratureSearchStore((state) => state.appliedFilters);
  const academicDatabases = useLiteratureSearchStore((state) => state.academicDatabases);
  const setAcademicDatabases = useLiteratureSearchStore((state) => state.setAcademicDatabases);
  // Phase 10.115: Clear selection on new search to prevent stale selection counts
  const clearSelection = useLiteratureSearchStore((state) => state.clearSelection);

  // Prevent duplicate search requests
  const isSearchingRef = useRef(false);

  // Progressive search integration (Phase 10.1 Day 7)
  const { executeProgressiveSearch, isSearching: progressiveSearching } = useProgressiveSearch();

  // ===========================
  // SEARCH OPERATIONS
  // ===========================

  /**
   * Execute academic literature search with progressive loading
   *
   * **Phase 10.1 Day 7: Progressive Loading Integration**
   * Now uses progressive search hook to load papers in batches with:
   * - Real-time progress bar with source breakdown
   * - Quality score tracking
   * - Two-stage filtering visualization
   * - Smooth 30-second animation
   *
   * **Features:**
   * - Validates query before searching
   * - Delegates to progressive search for execution
   * - Auto-selects papers for extraction
   * - Maintains backward compatibility with callbacks
   * - Prevents duplicate concurrent searches
   *
   * **Flow:**
   * 1. Validate query
   * 2. Prevent duplicate searches
   * 3. Execute progressive search (handles all loading, progress, metadata)
   * 4. Trigger callbacks for success/error
   * 5. Auto-select papers (handled by page.tsx)
   */
  const handleSearch = useCallback(async () => {
    // Input validation
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    // Prevent duplicate searches
    if (isSearchingRef.current || progressiveSearching) {
      logger.debug('Search already in progress, skipping duplicate request', 'useLiteratureSearch');
      return;
    }

    isSearchingRef.current = true;

    // Phase 10.115: Clear selection on new search to prevent stale selection counts
    clearSelection();

    try {
      logger.group('SEARCH START (Progressive Loading)');
      logger.info('Search parameters', 'useLiteratureSearch', {
        query,
        appliedFilters,
        selectedSources: academicDatabases,
        sourceCount: academicDatabases.length,
      });

      // Execute progressive search (handles all loading, progress, metadata, toasts)
      // This will:
      // - Show progress bar with source breakdown
      // - Load papers in batches
      // - Update store with results
      // - Display completion summary
      await executeProgressiveSearch();

      // Get results from store (progressive search updates it)
      const finalPapers = useLiteratureSearchStore.getState().papers;
      const finalTotal = useLiteratureSearchStore.getState().totalResults;

      logger.info('Progressive search complete', 'useLiteratureSearch', {
        finalPapersCount: finalPapers.length,
        totalResults: finalTotal,
      });
      logger.groupEnd();

      // Success callback - pass papers array for auto-selection
      // (page.tsx uses this to auto-select papers)
      if (finalPapers.length > 0) {
        onSearchSuccess?.(finalPapers.length, finalTotal, finalPapers);
      }
    } catch (error) {
      logger.error('Progressive search error', 'useLiteratureSearch', {
        error: error instanceof Error ? error.message : String(error),
      });
      logger.groupEnd();
      // Error toast already shown by progressive search hook
      onSearchError?.(error as Error);
    } finally {
      isSearchingRef.current = false;
    }
  }, [
    query,
    appliedFilters,
    academicDatabases,
    executeProgressiveSearch,
    progressiveSearching,
    onSearchSuccess,
    onSearchError,
    clearSelection,
  ]);

  /**
   * Clear query correction message
   */
  const clearQueryCorrection = useCallback(() => {
    setQueryCorrectionMessage(null);
  }, []);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Database selection
    academicDatabases,
    setAcademicDatabases,

    // Query correction
    queryCorrectionMessage,
    clearQueryCorrection,

    // Search operations
    handleSearch,
    isSearching: isSearchingRef.current,

    // Zustand store access (convenience)
    query,
    papers,
    loading,
    totalResults,
    filters,
    appliedFilters,
  };
}
