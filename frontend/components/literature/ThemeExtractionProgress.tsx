/**
 * Phase 10 Day 5.6: Theme Extraction Progress Component
 * Interactive progress visualization for theme extraction
 */

'use client';

import { useEffect, useState } from 'react';
import { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
} from 'lucide-react';

interface ThemeExtractionProgressProps {
  progress: ExtractionProgress;
}

export function ThemeExtractionProgressComponent({
  progress,
}: ThemeExtractionProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress.progress]);

  // Debug logging
  useEffect(() => {
    console.log('🟣 ThemeExtractionProgress component received props:', {
      isExtracting: progress.isExtracting,
      stage: progress.stage,
      progress: progress.progress,
      message: progress.message,
      currentSource: progress.currentSource,
      totalSources: progress.totalSources,
    });
  }, [progress]);

  if (
    !progress.isExtracting &&
    progress.stage !== 'complete' &&
    progress.stage !== 'error'
  ) {
    console.log('🟣 ThemeExtractionProgress: Returning null (not showing)');
    return null;
  }

  console.log('🟣 ThemeExtractionProgress: Rendering component');

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'preparing':
        return <Brain className="w-5 h-5 animate-pulse text-purple-500" />;
      case 'extracting':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'deduplicating':
        return <Sparkles className="w-5 h-5 animate-pulse text-yellow-500" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case 'preparing':
        return 'bg-purple-500';
      case 'extracting':
        return 'bg-blue-500';
      case 'deduplicating':
        return 'bg-yellow-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
      style={{ zIndex: 9999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStageIcon()}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {progress.stage === 'complete'
              ? 'Extraction Complete'
              : 'Extracting Themes'}
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {progress.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`absolute left-0 top-0 h-full ${getStageColor()} transition-all duration-500 ease-out`}
          style={{ width: `${animatedProgress}%` }}
        >
          {progress.isExtracting && (
            <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Message */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        {progress.message}
      </p>

      {/* Source Counter (only during extraction) */}
      {progress.stage === 'extracting' && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Processing sources</span>
          <span className="font-mono">
            {progress.currentSource} / {progress.totalSources}
          </span>
        </div>
      )}

      {/* Stats (only on complete) */}
      {progress.stage === 'complete' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sources:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                {progress.totalSources}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                Complete
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {progress.stage === 'error' && progress.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
          {progress.error}
        </div>
      )}
    </div>
  );
}
