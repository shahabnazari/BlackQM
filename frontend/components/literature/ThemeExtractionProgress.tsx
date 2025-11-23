/**
 * Phase 10 Day 5.6: Theme Extraction Progress Component
 * Interactive progress visualization for theme extraction
 *
 * PERF-001: Logger calls moved to useEffect (not render body)
 * PERF-002: Wrapped with React.memo() for shallow prop comparison
 * PERF-003: getStageIcon/getStageColor moved outside component (no re-creation)
 */

'use client';

import { memo, useEffect, useState, useMemo } from 'react';
import { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
} from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface ThemeExtractionProgressProps {
  progress: ExtractionProgress;
}

// PERF-003: Stage color map moved outside component (no re-creation)
const STAGE_COLORS: Record<string, string> = {
  preparing: 'bg-purple-500',
  extracting: 'bg-blue-500',
  deduplicating: 'bg-yellow-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
  default: 'bg-gray-500',
};

// PERF-002: Wrapped with React.memo for shallow prop comparison
export const ThemeExtractionProgressComponent = memo(function ThemeExtractionProgressComponent({
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

  // PERF-001: Debug logging in useEffect (not render body)
  // PERF-004: Specific dependencies instead of entire progress object
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('ThemeExtractionProgress received props', 'ThemeExtractionProgress', {
        isExtracting: progress.isExtracting,
        stage: progress.stage,
        progress: progress.progress,
        message: progress.message,
        currentSource: progress.currentSource,
        totalSources: progress.totalSources,
      });
    }
  }, [progress.isExtracting, progress.stage, progress.progress, progress.message, progress.currentSource, progress.totalSources]);

  // PERF-003: Memoized stage icon to prevent re-creation
  const stageIcon = useMemo(() => {
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
  }, [progress.stage]);

  // PERF-003: Use lookup instead of function
  const stageColor = STAGE_COLORS[progress.stage] || STAGE_COLORS['default'];

  // Early return AFTER hooks (Rules of Hooks compliance)
  if (
    !progress.isExtracting &&
    progress.stage !== 'complete' &&
    progress.stage !== 'error'
  ) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
      style={{ zIndex: 9999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {stageIcon}
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
          className={`absolute left-0 top-0 h-full ${stageColor} transition-all duration-500 ease-out`}
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
});

// PERF-002: displayName for React DevTools debugging
ThemeExtractionProgressComponent.displayName = 'ThemeExtractionProgressComponent';
