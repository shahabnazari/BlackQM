/**
 * Phase 10.113 Week 12: Pipeline Progress Visualization Container
 *
 * A visual pipeline flow that reveals the search architecture to users
 * through intuitive visual metaphors. Netflix-grade UX with strict typing.
 *
 * Pipeline stages:
 * 1. Understand - Query analysis, spell check, methodology detection
 * 2. Discover - Parallel source fetching with bubble visualization
 * 3. Refine - Deduplication and quality filtering
 * 4. Analyze - AI semantic ranking (3 tiers)
 * 5. Results - Complete
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 12
 */

'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Database,
  Filter,
  Sparkles,
  CheckCircle,
  Loader2,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SourceStats,
  LiteratureSource,
  SearchStage,
  SemanticTierName,
} from '@/lib/types/search-stream.types';

// ============================================================================
// TYPE DEFINITIONS - Netflix-grade strict typing
// ============================================================================

/**
 * Pipeline stage status
 */
type PipelineStageStatus = 'pending' | 'active' | 'complete' | 'error';

/**
 * Sub-stage definition
 */
interface SubStage {
  readonly id: string;
  readonly name: string;
  readonly status?: PipelineStageStatus;
}

/**
 * Pipeline stage configuration
 */
interface PipelineStageConfig {
  readonly id: string;
  readonly name: string;
  readonly icon: LucideIcon;
  readonly description: string;
  readonly substages?: readonly SubStage[];
}

/**
 * Stage node props
 */
interface StageNodeProps {
  readonly stage: PipelineStageConfig;
  readonly status: PipelineStageStatus;
  readonly duration: number | undefined;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}

/**
 * Pipeline progress container props
 */
interface PipelineProgressContainerProps {
  /** Current search stage */
  readonly currentStage: SearchStage | null;
  /** Source statistics */
  readonly sourceStats: Map<LiteratureSource, SourceStats>;
  /** Current semantic tier */
  readonly semanticTier: SemanticTierName | null;
  /** Total papers found */
  readonly papersFound: number;
  /** Elapsed time in ms */
  readonly elapsedMs: number;
  /** Whether search is active */
  readonly isSearching: boolean;
  /** Stage start times for duration calculation */
  readonly stageStartTimes?: Map<string, number>;
}

// ============================================================================
// PIPELINE STAGES CONFIGURATION
// ============================================================================

/**
 * Pipeline stage definitions
 */
const PIPELINE_STAGES: readonly PipelineStageConfig[] = [
  {
    id: 'query-analysis',
    name: 'Understand',
    icon: Brain,
    description: 'Analyzing your query for optimal search',
    substages: [
      { id: 'spell-check', name: 'Spell Check' },
      { id: 'methodology-detect', name: 'Methodology Detection' },
      { id: 'query-expand', name: 'Query Expansion' },
    ],
  },
  {
    id: 'source-fetch',
    name: 'Discover',
    icon: Database,
    description: 'Searching academic databases worldwide',
    substages: [], // Dynamic - populated from sourceStats
  },
  {
    id: 'clean-dedup',
    name: 'Refine',
    icon: Filter,
    description: 'Removing duplicates & low-quality papers',
    substages: [
      { id: 'deduplication', name: 'Deduplication' },
      { id: 'quality-filter', name: 'Quality Filter (80%+)' },
    ],
  },
  {
    id: 'semantic-rank',
    name: 'Analyze',
    icon: Sparkles,
    description: 'AI-powered relevance scoring',
    substages: [
      { id: 'tier-1', name: 'Quick Results (50 papers)' },
      { id: 'tier-2', name: 'Refined Ranking (200 papers)' },
      { id: 'tier-3', name: 'Full Analysis (600 papers)' },
    ],
  },
  {
    id: 'complete',
    name: 'Results',
    icon: CheckCircle,
    description: 'Your papers are ready',
  },
] as const;

/**
 * Map SearchStage to pipeline stage ID
 */
const STAGE_MAP: Record<SearchStage, string> = {
  'analyzing': 'query-analysis',
  'fast-sources': 'source-fetch',
  'medium-sources': 'source-fetch',
  'slow-sources': 'source-fetch',
  'ranking': 'semantic-rank',
  'complete': 'complete',
};

// ============================================================================
// STAGE NODE COMPONENT
// ============================================================================

/**
 * Visual representation of a single pipeline stage
 */
const StageNode = memo(function StageNode({
  stage,
  status,
  duration,
  isExpanded,
  onToggle,
}: StageNodeProps) {
  const Icon = stage.icon;
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const hasError = status === 'error';
  const hasSubstages = stage.substages && stage.substages.length > 0;

  return (
    <motion.div
      className={cn(
        'relative flex flex-col rounded-xl transition-all cursor-pointer',
        'border-2',
        isActive && 'bg-blue-50 border-blue-400 shadow-lg',
        isComplete && 'bg-green-50 border-green-300',
        hasError && 'bg-red-50 border-red-300',
        !isActive && !isComplete && !hasError && 'bg-gray-50 border-gray-200 opacity-60',
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={hasSubstages ? onToggle : undefined}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon with status indicator */}
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isActive && 'bg-blue-100',
              isComplete && 'bg-green-100',
              hasError && 'bg-red-100',
              !isActive && !isComplete && !hasError && 'bg-gray-100',
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                isActive && 'text-blue-600',
                isComplete && 'text-green-600',
                hasError && 'text-red-600',
                !isActive && !isComplete && !hasError && 'text-gray-400',
              )}
            />
          </div>

          {/* Active spinner ring */}
          {isActive && (
            <motion.div
              className="absolute inset-0 border-2 border-blue-400 rounded-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Complete checkmark */}
          {isComplete && (
            <motion.div
              className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}

          {/* Error indicator */}
          {hasError && (
            <motion.div
              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <AlertTriangle className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Stage info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold',
                isActive && 'text-blue-700',
                isComplete && 'text-green-700',
                hasError && 'text-red-700',
                !isActive && !isComplete && !hasError && 'text-gray-500',
              )}
            >
              {stage.name}
            </span>
            {duration !== undefined && (isComplete || isActive) && (
              <span className="text-xs text-gray-400">
                {isComplete ? `${(duration / 1000).toFixed(1)}s` : 'Processing...'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{stage.description}</p>
        </div>

        {/* Expand button for substages */}
        {hasSubstages && (
          <button className="p-1 hover:bg-gray-200 rounded">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Substages (expandable) */}
      <AnimatePresence>
        {isExpanded && hasSubstages && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200"
          >
            <div className="p-2 space-y-1">
              {stage.substages?.map((substage) => (
                <div
                  key={substage.id}
                  className="flex items-center gap-2 text-xs text-gray-600 pl-2"
                >
                  {substage.status === 'complete' ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : substage.status === 'active' ? (
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-300" />
                  )}
                  <span>{substage.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// PIPELINE CONNECTOR
// ============================================================================

/**
 * Arrow connector between stages
 */
const PipelineConnector = memo(function PipelineConnector({
  isComplete,
}: {
  readonly isComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-center w-8 flex-shrink-0">
      <motion.div
        className={cn(
          'w-6 h-0.5 rounded-full',
          isComplete ? 'bg-green-400' : 'bg-gray-300',
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2 }}
      />
    </div>
  );
});

// ============================================================================
// SMART ETA COMPONENT
// ============================================================================

/**
 * Context-aware time estimation
 */
const SmartETA = memo(function SmartETA({
  currentStage,
  sourceStats,
  papersFound,
  semanticTier,
}: {
  readonly currentStage: SearchStage | null;
  readonly sourceStats: Map<LiteratureSource, SourceStats>;
  readonly papersFound: number;
  readonly semanticTier: SemanticTierName | null;
}) {
  const message = useMemo(() => {
    if (!currentStage) return 'Ready to search';

    // During source fetch
    if (['fast-sources', 'medium-sources', 'slow-sources'].includes(currentStage)) {
      const pending = Array.from(sourceStats.values()).filter(
        (s) => s.status === 'searching',
      );
      const slowSources = pending.filter((s) => s.tier === 'slow');

      if (slowSources.length > 0) {
        return `Waiting on ${slowSources.length} slower source${slowSources.length > 1 ? 's' : ''}...`;
      }

      return `Searching ${pending.length} source${pending.length > 1 ? 's' : ''}...`;
    }

    // During semantic ranking
    if (currentStage === 'ranking') {
      if (semanticTier === 'immediate') {
        return `Quick results ready, refining ${papersFound} papers...`;
      }
      if (semanticTier === 'refined') {
        return 'Rankings refined, completing analysis...';
      }
      return `AI analyzing ${papersFound} papers for relevance...`;
    }

    // Query analysis
    if (currentStage === 'analyzing') {
      return 'Understanding your query...';
    }

    // Complete
    if (currentStage === 'complete') {
      return `${papersFound} papers ready for exploration`;
    }

    return 'Processing...';
  }, [currentStage, sourceStats, papersFound, semanticTier]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
      <Clock className="w-4 h-4 text-gray-400" />
      <span>{message}</span>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PipelineProgressContainer = memo(function PipelineProgressContainer({
  currentStage,
  sourceStats,
  semanticTier,
  papersFound,
  elapsedMs,
  isSearching,
  stageStartTimes,
}: PipelineProgressContainerProps) {
  // Track expanded stages
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Toggle stage expansion
  const toggleStage = useCallback((stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  }, []);

  // Get stage status
  const getStageStatus = useCallback(
    (stageId: string): PipelineStageStatus => {
      if (!currentStage) return 'pending';

      const currentMappedId = STAGE_MAP[currentStage];
      const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stageId);
      const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentMappedId);

      if (stageIndex < currentIndex) return 'complete';
      if (stageIndex === currentIndex) return 'active';
      return 'pending';
    },
    [currentStage],
  );

  // Get stage duration
  const getStageDuration = useCallback(
    (stageId: string): number | undefined => {
      if (!stageStartTimes) return undefined;
      const startTime = stageStartTimes.get(stageId);
      if (!startTime) return undefined;

      const status = getStageStatus(stageId);
      if (status === 'complete') {
        // Get next stage start time or use elapsed
        const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stageId);
        const nextStage = PIPELINE_STAGES[stageIndex + 1];
        const endTime = nextStage ? stageStartTimes.get(nextStage.id) : undefined;
        return endTime ? endTime - startTime : elapsedMs - startTime;
      }
      if (status === 'active') {
        return Date.now() - startTime;
      }
      return undefined;
    },
    [stageStartTimes, getStageStatus, elapsedMs],
  );

  // Don't render if not searching and no stages
  if (!isSearching && !currentStage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          <span className="font-semibold text-gray-900">
            {isSearching ? 'Search Pipeline' : 'Search Complete'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {(elapsedMs / 1000).toFixed(1)}s elapsed
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <StageNode
                stage={stage}
                status={getStageStatus(stage.id)}
                duration={getStageDuration(stage.id)}
                isExpanded={expandedStages.has(stage.id)}
                onToggle={() => toggleStage(stage.id)}
              />
            </div>
            {index < PIPELINE_STAGES.length - 1 && (
              <PipelineConnector
                isComplete={getStageStatus(stage.id) === 'complete'}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Smart ETA */}
      <SmartETA
        currentStage={currentStage}
        sourceStats={sourceStats}
        papersFound={papersFound}
        semanticTier={semanticTier}
      />
    </motion.div>
  );
});

export default PipelineProgressContainer;
