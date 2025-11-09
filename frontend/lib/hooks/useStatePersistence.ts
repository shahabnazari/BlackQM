/**
 * State Persistence Hook - Phase 10.1 Day 4
 *
 * Enterprise-grade hook for managing literature review state persistence.
 * Handles automatic save/restore with localStorage, URL params sync, and user notifications.
 *
 * @module useStatePersistence
 * @since Phase 10.1 Day 4
 * @author VQMethod Team
 *
 * **Features:**
 * - Automatic localStorage persistence with debouncing
 * - TTL-based expiration (24 hours)
 * - URL parameter synchronization
 * - State restoration banner with user choice
 * - Quota exceeded error handling
 * - Version compatibility checking
 *
 * **Usage:**
 * ```typescript
 * const {
 *   showRestoreBanner,
 *   restoreSummary,
 *   handleRestoreState,
 *   handleDismissRestore,
 *   saveCurrentState,
 * } = useStatePersistence({
 *   query,
 *   papers,
 *   filters,
 *   onRestore: (state) => {
 *     setQuery(state.query);
 *     setPapers(state.papers);
 *     // ... restore other state
 *   },
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// URL sync disabled for now (can be enabled via config)
// import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  saveLiteratureState,
  loadLiteratureState,
  clearLiteratureState,
  getSavedStateSummary,
} from '@/lib/services/literature-state-persistence.service';

/**
 * State shape for literature review persistence
 */
export interface LiteraturePersistenceState {
  // Search state
  query?: string;
  papers?: any[];
  totalResults?: number;
  currentPage?: number;
  filters?: any;
  appliedFilters?: any;

  // Selection state
  selectedPapers?: string[];
  savedPapers?: any[];

  // Analysis state
  unifiedThemes?: any[];
  gaps?: any[];
  extractionPurpose?: string | null;
  contentAnalysis?: any | null;

  // Enhanced Theme Integration
  selectedThemeIds?: string[];
  researchQuestions?: any[];
  hypotheses?: any[];
  constructMappings?: any[];

  // Video/multimedia state
  transcribedVideos?: any[];
  youtubeVideos?: any[];
}

/**
 * Configuration for useStatePersistence hook
 */
export interface UseStatePersistenceConfig {
  /** Current state to persist */
  currentState: Partial<LiteraturePersistenceState>;

  /** Callback when state is restored */
  onRestore: (state: Partial<LiteraturePersistenceState>) => void;

  /** Debounce delay for saving (ms) - default 1000ms */
  debounceDelay?: number;

  /** Enable URL parameter syncing - default false */
  enableUrlSync?: boolean;

  /** Enable automatic save on state change - default true */
  enableAutoSave?: boolean;
}

/**
 * Return type for useStatePersistence hook
 */
export interface UseStatePersistenceReturn {
  // Restore banner state
  showRestoreBanner: boolean;
  restoreSummary: {
    itemCount: number;
    hoursAgo?: number;
  } | null;

  // Handlers
  handleRestoreState: () => void;
  handleDismissRestore: () => void;
  saveCurrentState: () => void;
  clearPersistedState: () => void;

  // Utilities
  hasSavedData: boolean;
}

const DEFAULT_DEBOUNCE_DELAY = 1000; // 1 second

/**
 * Hook for managing literature review state persistence
 *
 * **Features:**
 * - Automatic detection of saved state on mount
 * - User-friendly restore banner with summary
 * - Debounced automatic saving to prevent excessive writes
 * - Error handling with graceful degradation
 * - URL parameter synchronization (optional)
 *
 * @param {UseStatePersistenceConfig} config - Configuration object
 * @returns {UseStatePersistenceReturn} State persistence operations
 */
export function useStatePersistence(
  config: UseStatePersistenceConfig
): UseStatePersistenceReturn {
  const {
    currentState,
    onRestore,
    debounceDelay = DEFAULT_DEBOUNCE_DELAY,
    enableUrlSync = false,
    enableAutoSave = true,
  } = config;

  // URL sync disabled for now (can be enabled via config)
  // const router = useRouter();
  // const searchParams = useSearchParams();

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<{
    itemCount: number;
    hoursAgo?: number;
  } | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Refs for debouncing and preventing duplicate operations
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // ===========================
  // INITIALIZATION
  // ===========================

  /**
   * Check for saved state on mount
   * Shows restore banner if valid state exists
   */
  useEffect(() => {
    const summary = getSavedStateSummary();
    console.log('🔍 [useStatePersistence] Checking for saved state:', summary);

    if (summary.exists && summary.itemCount > 0) {
      console.log('✅ [useStatePersistence] Found saved state:', {
        itemCount: summary.itemCount,
        hoursAgo: summary.hoursAgo?.toFixed(1),
      });
      setRestoreSummary({
        itemCount: summary.itemCount,
        ...(summary.hoursAgo !== undefined && { hoursAgo: summary.hoursAgo }),
      });
      setShowRestoreBanner(true);
      setHasSavedData(true);
    } else {
      console.log('ℹ️ [useStatePersistence] No saved state found');
      setHasSavedData(false);
    }
  }, []); // Run once on mount

  // ===========================
  // RESTORE HANDLERS
  // ===========================

  /**
   * Restore state from localStorage
   *
   * Loads saved state and calls onRestore callback to update parent component state
   */
  const handleRestoreState = useCallback(() => {
    if (isRestoringRef.current) {
      console.log('⏳ [useStatePersistence] Restore already in progress, skipping...');
      return;
    }

    try {
      isRestoringRef.current = true;
      console.log('🔄 [useStatePersistence] Restoring literature state...');

      const state = loadLiteratureState();

      if (Object.keys(state).length === 0) {
        console.log('ℹ️ [useStatePersistence] No state to restore');
        setShowRestoreBanner(false);
        return;
      }

      // Call parent restore callback
      onRestore(state);

      // Hide banner and show success message
      setShowRestoreBanner(false);

      // Calculate summary for toast
      const itemCount =
        (state.papers?.length || 0) +
        (state.unifiedThemes?.length || 0) +
        (state.researchQuestions?.length || 0);

      toast.success(
        `Restored ${state.unifiedThemes?.length || 0} themes, ${state.papers?.length || 0} papers`
      );

      console.log(
        `✅ [useStatePersistence] State restored successfully (${itemCount} items)`
      );
    } catch (error) {
      console.error('❌ [useStatePersistence] Error restoring state:', error);
      toast.error('Failed to restore previous session');
      setShowRestoreBanner(false);
    } finally {
      isRestoringRef.current = false;
    }
  }, [onRestore]);

  /**
   * Dismiss restore banner and clear saved state
   *
   * User chooses to start fresh instead of restoring
   */
  const handleDismissRestore = useCallback(() => {
    console.log('❌ [useStatePersistence] User dismissed restore banner');
    setShowRestoreBanner(false);
    clearLiteratureState();
    setHasSavedData(false);
    toast.info('Starting fresh session');
  }, []);

  // ===========================
  // SAVE HANDLERS
  // ===========================

  /**
   * Save current state immediately (no debounce)
   *
   * Useful for critical operations like navigation or manual save
   */
  const saveCurrentState = useCallback(() => {
    try {
      console.log('💾 [useStatePersistence] Saving current state immediately...');
      saveLiteratureState(currentState);
      setHasSavedData(true);
    } catch (error) {
      console.error('❌ [useStatePersistence] Error saving state:', error);
      // Graceful degradation: Continue without showing error to user
    }
  }, [currentState]);

  /**
   * Clear persisted state
   */
  const clearPersistedState = useCallback(() => {
    console.log('🗑️ [useStatePersistence] Clearing persisted state...');
    clearLiteratureState();
    setHasSavedData(false);
    setShowRestoreBanner(false);
  }, []);

  // ===========================
  // AUTO-SAVE WITH DEBOUNCING
  // ===========================

  /**
   * Automatically save state when it changes (debounced)
   *
   * Prevents excessive localStorage writes by debouncing saves
   */
  useEffect(() => {
    if (!enableAutoSave) {
      return;
    }

    // Skip if no meaningful state
    const hasData =
      currentState.query ||
      (currentState.papers && currentState.papers.length > 0) ||
      (currentState.unifiedThemes && currentState.unifiedThemes.length > 0);

    if (!hasData) {
      return;
    }

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce saves to avoid excessive writes
    saveTimerRef.current = setTimeout(() => {
      try {
        console.log(
          `💾 [useStatePersistence] Auto-saving state (debounced ${debounceDelay}ms)...`
        );
        saveLiteratureState(currentState);
        setHasSavedData(true);
      } catch (error) {
        console.error('❌ [useStatePersistence] Auto-save error:', error);

        // Handle quota exceeded error
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('⚠️ [useStatePersistence] localStorage quota exceeded');
          toast.error(
            'Storage quota exceeded. Please clear old data or reduce selections.'
          );
          clearLiteratureState();
        }
      }
    }, debounceDelay);

    // Cleanup on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentState, debounceDelay, enableAutoSave]);

  // ===========================
  // URL PARAMETER SYNC (OPTIONAL)
  // ===========================

  /**
   * Sync state to URL parameters for bookmarkable searches
   *
   * Only enabled if enableUrlSync is true
   */
  useEffect(() => {
    if (!enableUrlSync) {
      return;
    }

    const { query, filters } = currentState;

    if (!query) {
      return;
    }

    // Build URL search params
    const params = new URLSearchParams();
    params.set('q', query);

    if (filters) {
      if (filters.yearFrom) params.set('yearFrom', filters.yearFrom.toString());
      if (filters.yearTo) params.set('yearTo', filters.yearTo.toString());
      if (filters.minCitations)
        params.set('minCitations', filters.minCitations.toString());
      if (filters.publicationType && filters.publicationType !== 'all')
        params.set('type', filters.publicationType);
      if (filters.sortBy && filters.sortBy !== 'relevance')
        params.set('sort', filters.sortBy);
    }

    // Update URL without triggering navigation
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      window.history.replaceState({}, '', newUrl);
      console.log('🔗 [useStatePersistence] URL parameters synced');
    }
  }, [currentState, enableUrlSync]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Restore banner state
    showRestoreBanner,
    restoreSummary,

    // Handlers
    handleRestoreState,
    handleDismissRestore,
    saveCurrentState,
    clearPersistedState,

    // Utilities
    hasSavedData,
  };
}
