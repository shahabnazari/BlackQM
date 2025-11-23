/**
 * Phase 10 Day 5.6 + Day 30: Theme Extraction Progress Hook
 * Provides real-time progress tracking for theme extraction operations
 * Day 30: Added transparentMessage for real-time familiarization metrics
 *
 * AUDIT FIX DX-001: Replaced console.log with enterprise logger
 */

import { useState, useCallback } from 'react';
import { TransparentProgressMessage } from '@/lib/api/services/unified-theme-api.service';
import { logger } from '@/lib/utils/logger';

export interface ExtractionProgress {
  isExtracting: boolean;
  currentSource: number;
  totalSources: number;
  progress: number; // 0-100
  message: string;
  stage: 'preparing' | 'extracting' | 'deduplicating' | 'complete' | 'error';
  error?: string;
  transparentMessage?: TransparentProgressMessage; // Phase 10 Day 30: Real-time WebSocket metrics
  // Phase 10.94 FIX: Accumulated metrics for all stages (bypasses React batching)
  // This is populated synchronously in the progress callback before React batches state updates
  accumulatedStageMetrics?: Record<number, TransparentProgressMessage>;
}

export function useThemeExtractionProgress() {
  const [progress, setProgress] = useState<ExtractionProgress>({
    isExtracting: false,
    currentSource: 0,
    totalSources: 0,
    progress: 0,
    message: '',
    stage: 'preparing',
  });

  const startExtraction = useCallback((totalSources: number) => {
    // AUDIT FIX DX-001: Use logger instead of console.log
    logger.debug('startExtraction called', 'useThemeExtractionProgress', {
      totalSources,
    });
    const newProgress = {
      isExtracting: true,
      currentSource: 0,
      totalSources,
      progress: 0,
      message: `Preparing to extract themes from ${totalSources} sources...`,
      stage: 'preparing' as const,
    };
    logger.debug('Setting progress', 'useThemeExtractionProgress', {
      stage: newProgress.stage,
      totalSources: newProgress.totalSources,
    });
    setProgress(newProgress);
  }, []);

  const updateProgress = useCallback(
    (currentSource: number, totalSources: number, transparentMessage?: TransparentProgressMessage) => {
      // STRICT AUDIT FIX: Enhanced diagnostic logging for Stage 1 familiarization stats issue
      // This helps trace why real-time stats show zeros during familiarization
      logger.debug('🔄 updateProgress called', 'useThemeExtractionProgress', {
        currentSource,
        totalSources,
        hasTransparentMessage: !!transparentMessage,
        timestamp: new Date().toISOString(),
      });

      if (transparentMessage) {
        // 🚨 CRITICAL DIAGNOSTIC: Log the actual liveStats values being received
        // If these show non-zero values but UI shows zeros, it's a React rendering issue
        // If these show zeros, the backend isn't sending updated stats
        logger.info('📊 Received transparentMessage with liveStats', 'useThemeExtractionProgress', {
          stageNumber: transparentMessage.stageNumber,
          stageName: transparentMessage.stageName,
          sourcesAnalyzed: transparentMessage.liveStats?.sourcesAnalyzed,
          fullTextRead: transparentMessage.liveStats?.fullTextRead,
          abstractsRead: transparentMessage.liveStats?.abstractsRead,
          totalWordsRead: transparentMessage.liveStats?.totalWordsRead,
          currentArticle: transparentMessage.liveStats?.currentArticle,
          totalArticles: transparentMessage.liveStats?.totalArticles,
          articleTitle: transparentMessage.liveStats?.articleTitle?.substring(0, 50),
        });
      } else {
        // 🚨 WARNING: This means no transparentMessage was passed - the callback might be broken
        logger.warn('⚠️ updateProgress called WITHOUT transparentMessage!', 'useThemeExtractionProgress', {
          currentSource,
          totalSources,
          callStack: new Error().stack?.split('\n').slice(0, 5).join('\n'),
        });
      }

      // AUDIT FIX: Defensive division - prevent NaN if totalSources is 0
      const progressPercent = totalSources > 0
        ? Math.round((currentSource / totalSources) * 100)
        : 0;

      // 🚨 CRITICAL FIX: Use functional update to ensure we're working with latest state
      // This prevents stale closure issues when multiple rapid updates occur
      setProgress(prev => {
        // Determine the transparentMessage to use (prefer new, fallback to prev)
        const finalTransparentMessage = transparentMessage || prev.transparentMessage;

        // Build new state with conditional transparentMessage
        // STRICT AUDIT FIX: Use conditional spread for exactOptionalPropertyTypes compliance
        const newState: ExtractionProgress = {
          ...prev,
          currentSource,
          progress: progressPercent,
          message: `Extracting themes from source ${currentSource} of ${totalSources}...`,
          stage: 'extracting' as const,
          // Only include transparentMessage if it exists (exactOptionalPropertyTypes)
          ...(finalTransparentMessage && { transparentMessage: finalTransparentMessage }),
        };

        // Log the state being set
        logger.debug('📝 Setting progress state', 'useThemeExtractionProgress', {
          prevWordsRead: prev.transparentMessage?.liveStats?.totalWordsRead,
          newWordsRead: newState.transparentMessage?.liveStats?.totalWordsRead,
          stateChanged: prev.transparentMessage !== newState.transparentMessage,
        });

        return newState;
      });
    },
    []
  );

  const setDeduplicating = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      progress: 90,
      message: 'Deduplicating and merging themes...',
      stage: 'deduplicating',
    }));
  }, []);

  const completeExtraction = useCallback((themesCount: number) => {
    // AUDIT FIX DX-001: Use logger instead of console.log
    logger.info('completeExtraction called', 'useThemeExtractionProgress', {
      themesCount,
    });
    setProgress(prev => ({
      ...prev,
      isExtracting: false,
      progress: 100,
      message: `Successfully extracted ${themesCount} themes!`,
      stage: 'complete',
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setProgress(prev => ({
      ...prev,
      isExtracting: false,
      message: error,
      stage: 'error',
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setProgress({
      isExtracting: false,
      currentSource: 0,
      totalSources: 0,
      progress: 0,
      message: '',
      stage: 'preparing',
    });
  }, []);

  return {
    progress,
    startExtraction,
    updateProgress,
    setDeduplicating,
    completeExtraction,
    setError,
    reset,
  };
}
