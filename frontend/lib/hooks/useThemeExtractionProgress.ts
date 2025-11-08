/**
 * Phase 10 Day 5.6 + Day 30: Theme Extraction Progress Hook
 * Provides real-time progress tracking for theme extraction operations
 * Day 30: Added transparentMessage for real-time familiarization metrics
 */

import { useState, useCallback } from 'react';
import { TransparentProgressMessage } from '@/lib/api/services/unified-theme-api.service';

export interface ExtractionProgress {
  isExtracting: boolean;
  currentSource: number;
  totalSources: number;
  progress: number; // 0-100
  message: string;
  stage: 'preparing' | 'extracting' | 'deduplicating' | 'complete' | 'error';
  error?: string;
  transparentMessage?: TransparentProgressMessage; // Phase 10 Day 30: Real-time WebSocket metrics
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
    console.log(
      '🟣 useThemeExtractionProgress: startExtraction called with',
      totalSources,
      'sources'
    );
    const newProgress = {
      isExtracting: true,
      currentSource: 0,
      totalSources,
      progress: 0,
      message: `Preparing to extract themes from ${totalSources} sources...`,
      stage: 'preparing' as const,
    };
    console.log('🟣 Setting progress to:', newProgress);
    setProgress(newProgress);
  }, []);

  const updateProgress = useCallback(
    (currentSource: number, totalSources: number, transparentMessage?: TransparentProgressMessage) => {
      console.log(
        `🟣 useThemeExtractionProgress: updateProgress called (${currentSource}/${totalSources})`
      );
      if (transparentMessage) {
        console.log(`🟣 updateProgress received transparentMessage with liveStats:`, transparentMessage.liveStats);
      }
      const progressPercent = Math.round((currentSource / totalSources) * 100);
      setProgress(prev => ({
        ...prev,
        currentSource,
        progress: progressPercent,
        message: `Extracting themes from source ${currentSource} of ${totalSources}...`,
        stage: 'extracting',
        ...(transparentMessage && { transparentMessage }), // Phase 10 Day 30: Store real-time WebSocket metrics (conditional)
      }));
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
    console.log(
      `🟣 useThemeExtractionProgress: completeExtraction called with ${themesCount} themes`
    );
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
