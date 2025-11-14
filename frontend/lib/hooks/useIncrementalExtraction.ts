/**
 * Phase 10 Day 18: Incremental Extraction State Management Hook
 * Manages corpus selection, incremental extraction flow, and theme evolution tracking
 */

import { useState, useCallback, useEffect } from 'react';
import {
  incrementalExtractionApi,
  type CorpusInfo,
  type CorpusStats,
  type IncrementalExtractionResponse,
} from '@/lib/api/services/incremental-extraction-api.service';

export interface IncrementalExtractionState {
  // Corpus Management
  corpusList: CorpusInfo[];
  corpusStats: CorpusStats | null;
  selectedCorpus: CorpusInfo | null;
  isLoadingCorpuses: boolean;
  corpusError: string | null;

  // Extraction Flow
  isExtracting: boolean;
  extractionProgress: number;
  extractionMessage: string;
  extractionResult: IncrementalExtractionResponse | null;
  extractionError: string | null;

  // UI State
  showCorpusManagementModal: boolean;
  showIncrementalExtractionModal: boolean;
  showSaturationDashboard: boolean;
  showCelebrationAnimation: boolean;
}

export function useIncrementalExtraction() {
  const [state, setState] = useState<IncrementalExtractionState>({
    corpusList: [],
    corpusStats: null,
    selectedCorpus: null,
    isLoadingCorpuses: false,
    corpusError: null,
    isExtracting: false,
    extractionProgress: 0,
    extractionMessage: '',
    extractionResult: null,
    extractionError: null,
    showCorpusManagementModal: false,
    showIncrementalExtractionModal: false,
    showSaturationDashboard: false,
    showCelebrationAnimation: false,
  });

  // Load corpus list and stats on mount
  useEffect(() => {
    loadCorpusData();
  }, []);

  const loadCorpusData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingCorpuses: true, corpusError: null }));

    try {
      const [corpuses, stats] = await Promise.all([
        incrementalExtractionApi.getCorpusList(),
        incrementalExtractionApi.getCorpusStats(),
      ]);

      setState(prev => ({
        ...prev,
        corpusList: corpuses,
        corpusStats: stats,
        isLoadingCorpuses: false,
      }));
    } catch (error: any) {
      // Phase 10.1 Day 7: Suppress expected 401 errors for unauthenticated users
      if (error?.response?.status === 401 || error?.message === 'Unauthorized') {
        // Silent skip for unauthenticated users (expected behavior)
        setState(prev => ({
          ...prev,
          corpusList: [],
          corpusStats: null,
          isLoadingCorpuses: false,
        }));
      } else {
        // Store error in state for UI display
        setState(prev => ({
          ...prev,
          corpusError:
            error instanceof Error
              ? error.message
              : 'Failed to load corpus data',
          isLoadingCorpuses: false,
        }));
      }
    }
  }, []);

  const selectCorpus = useCallback((corpus: CorpusInfo | null) => {
    setState(prev => ({ ...prev, selectedCorpus: corpus }));
  }, []);

  const openCorpusManagement = useCallback(() => {
    setState(prev => ({ ...prev, showCorpusManagementModal: true }));
  }, []);

  const closeCorpusManagement = useCallback(() => {
    setState(prev => ({ ...prev, showCorpusManagementModal: false }));
    loadCorpusData(); // Refresh data when closing
  }, [loadCorpusData]);

  const openIncrementalExtraction = useCallback((corpus?: CorpusInfo) => {
    setState(prev => ({
      ...prev,
      showIncrementalExtractionModal: true,
      selectedCorpus: corpus || prev.selectedCorpus,
    }));
  }, []);

  const closeIncrementalExtraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      showIncrementalExtractionModal: false,
      extractionResult: null,
      extractionError: null,
    }));
  }, []);

  const openSaturationDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showSaturationDashboard: true }));
  }, []);

  const closeSaturationDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showSaturationDashboard: false }));
  }, []);

  const performIncrementalExtraction = useCallback(
    async (
      request: Parameters<
        typeof incrementalExtractionApi.extractThemesIncremental
      >[0]
    ) => {
      setState(prev => ({
        ...prev,
        isExtracting: true,
        extractionProgress: 0,
        extractionMessage: 'Starting incremental extraction...',
        extractionError: null,
      }));

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState(prev => {
            if (prev.extractionProgress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return {
              ...prev,
              extractionProgress: Math.min(prev.extractionProgress + 10, 90),
              extractionMessage:
                prev.extractionProgress < 30
                  ? 'Fetching cached content...'
                  : prev.extractionProgress < 60
                    ? 'Extracting themes from new sources...'
                    : 'Analyzing theme evolution...',
            };
          });
        }, 500);

        const result =
          await incrementalExtractionApi.extractThemesIncremental(request);

        clearInterval(progressInterval);

        // Check for saturation
        const isSaturated = result.saturation?.isSaturated || false;

        setState(prev => ({
          ...prev,
          isExtracting: false,
          extractionProgress: 100,
          extractionMessage: `Extraction complete! ${result.themes.length} themes identified.`,
          extractionResult: result,
          showCelebrationAnimation: isSaturated,
        }));

        // Reload corpus data to get updated stats
        await loadCorpusData();

        // Auto-hide celebration after 5 seconds
        if (isSaturated) {
          setTimeout(() => {
            setState(prev => ({ ...prev, showCelebrationAnimation: false }));
          }, 5000);
        }

        return result;
      } catch (error) {
        // Store error in state for UI display
        setState(prev => ({
          ...prev,
          isExtracting: false,
          extractionProgress: 0,
          extractionError:
            error instanceof Error ? error.message : 'Extraction failed',
        }));
        throw error;
      }
    },
    [loadCorpusData]
  );

  const createCorpus = useCallback(
    async (name: string, purpose: string, paperIds: string[]) => {
      try {
        const newCorpus = await incrementalExtractionApi.createCorpus(
          name,
          purpose as any,
          paperIds
        );
        await loadCorpusData();
        return newCorpus;
      } catch (error) {
        // Error propagated to caller for handling
        throw error;
      }
    },
    [loadCorpusData]
  );

  const updateCorpus = useCallback(
    async (corpusId: string, updates: { name?: string; purpose?: string }) => {
      try {
        const updatedCorpus = await incrementalExtractionApi.updateCorpus(
          corpusId,
          updates
        );
        await loadCorpusData();
        return updatedCorpus;
      } catch (error) {
        // Error propagated to caller for handling
        throw error;
      }
    },
    [loadCorpusData]
  );

  const deleteCorpus = useCallback(
    async (corpusId: string) => {
      try {
        await incrementalExtractionApi.deleteCorpus(corpusId);
        await loadCorpusData();

        // Clear selected corpus if it was deleted
        setState(prev => ({
          ...prev,
          selectedCorpus:
            prev.selectedCorpus?.id === corpusId ? null : prev.selectedCorpus,
        }));
      } catch (error) {
        // Error propagated to caller for handling
        throw error;
      }
    },
    [loadCorpusData]
  );

  const retryLoadCorpusData = useCallback(() => {
    loadCorpusData();
  }, [loadCorpusData]);

  const dismissCelebration = useCallback(() => {
    setState(prev => ({ ...prev, showCelebrationAnimation: false }));
  }, []);

  return {
    // State
    ...state,

    // Corpus Management Actions
    loadCorpusData,
    selectCorpus,
    createCorpus,
    updateCorpus,
    deleteCorpus,
    retryLoadCorpusData,

    // Modal Actions
    openCorpusManagement,
    closeCorpusManagement,
    openIncrementalExtraction,
    closeIncrementalExtraction,
    openSaturationDashboard,
    closeSaturationDashboard,

    // Extraction Actions
    performIncrementalExtraction,

    // UI Actions
    dismissCelebration,
  };
}
