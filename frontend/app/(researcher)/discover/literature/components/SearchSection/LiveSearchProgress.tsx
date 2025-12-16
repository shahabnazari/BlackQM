/**
 * Phase 10.113 Week 10: Live Search Progress Component
 *
 * Displays real-time search progress with:
 * - Source-by-source status grid
 * - Paper count accumulator
 * - ETA based on source performance
 * - Animated progress bar with stage indicators
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 10
 */

'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Database,
  Zap,
  Timer,
  AlertTriangle,
  SkipForward,
  HardDrive,
  Cpu,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
  SourceStats,
  SourceStatus,
  SourceTier,
  LiteratureSource,
  SearchStage,
  SemanticTierName,
  SemanticTierStats,
} from '@/lib/types/search-stream.types';
import { SEMANTIC_TIER_CONFIG } from '@/lib/types/search-stream.types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Source display names
 */
const SOURCE_DISPLAY_NAMES: Record<LiteratureSource, string> = {
  openalex: 'OpenAlex',
  crossref: 'CrossRef',
  eric: 'ERIC',
  arxiv: 'arXiv',
  ssrn: 'SSRN',
  semantic_scholar: 'Semantic Scholar',
  springer: 'Springer',
  nature: 'Nature',
  pubmed: 'PubMed',
  pmc: 'PMC',
  core: 'CORE',
  google_scholar: 'Google Scholar',
  web_of_science: 'Web of Science',
  scopus: 'Scopus',
  ieee_xplore: 'IEEE Xplore',
  wiley: 'Wiley',
  sage: 'SAGE',
  taylor_francis: 'Taylor & Francis',
};

/**
 * Stage display info
 */
const STAGE_INFO: Record<SearchStage, { label: string; color: string; percent: number }> = {
  'analyzing': { label: 'Analyzing Query', color: 'text-blue-600', percent: 5 },
  'fast-sources': { label: 'Fast Sources', color: 'text-green-600', percent: 25 },
  'medium-sources': { label: 'Medium Sources', color: 'text-yellow-600', percent: 50 },
  'slow-sources': { label: 'Slow Sources', color: 'text-orange-600', percent: 75 },
  'ranking': { label: 'Ranking Results', color: 'text-purple-600', percent: 90 },
  'selecting': { label: 'Selecting Best Papers', color: 'text-indigo-600', percent: 97 },
  'complete': { label: 'Complete', color: 'text-green-600', percent: 100 },
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface LiveSearchProgressProps {
  /** Whether search is active */
  isSearching: boolean;
  /** Current search stage */
  stage: SearchStage | null;
  /** Progress percentage (0-100) */
  percent: number;
  /** Status message */
  message: string;
  /** Source statistics map */
  sourceStats: Map<LiteratureSource, SourceStats>;
  /** Number of completed sources */
  sourcesComplete: number;
  /** Total number of sources */
  sourcesTotal: number;
  /** Total papers found so far */
  papersFound: number;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Optional callback to cancel search */
  onCancel?: () => void;
  // Phase 10.113 Week 11: Semantic tier props
  /** Current semantic tier (null if not started) */
  semanticTier?: SemanticTierName | null;
  /** Semantic tier version for ordering */
  semanticVersion?: number;
  // Phase 10.113 Week 12: Semantic tier stats for detailed display
  /** Stats for each semantic tier */
  semanticTierStats?: Map<SemanticTierName, SemanticTierStats>;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Source Status Icon
 */
const SourceStatusIcon = memo(function SourceStatusIcon({
  status,
}: {
  status: SourceStatus;
}) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    case 'searching':
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    case 'complete':
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    case 'skipped':
      return <SkipForward className="w-3.5 h-3.5 text-gray-400" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-gray-400" />;
  }
});

/**
 * Tier Badge
 */
const TierBadge = memo(function TierBadge({ tier }: { tier: SourceTier }) {
  const config = {
    fast: { label: 'Fast', color: 'bg-green-100 text-green-700 border-green-200' },
    medium: { label: 'Med', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    slow: { label: 'Slow', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  };

  return (
    <Badge variant="outline" className={`text-[10px] px-1 py-0 ${config[tier].color}`}>
      {config[tier].label}
    </Badge>
  );
});

/**
 * Source Card
 */
const SourceCard = memo(function SourceCard({
  source,
  stats,
}: {
  source: LiteratureSource;
  stats: SourceStats;
}) {
  const displayName = SOURCE_DISPLAY_NAMES[source] || source;
  const isActive = stats.status === 'searching';
  const isComplete = stats.status === 'complete';
  const hasError = stats.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-2 rounded-lg border transition-all ${
        isActive
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : isComplete
          ? 'bg-green-50 border-green-200'
          : hasError
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <SourceStatusIcon status={stats.status} />
          <span className="text-xs font-medium text-gray-700 truncate">
            {displayName}
          </span>
        </div>
        <TierBadge tier={stats.tier} />
      </div>

      {(isComplete || hasError) && (
        <div className="mt-1.5 flex items-center justify-between text-[10px]">
          {isComplete ? (
            <>
              <span className="text-green-600 font-medium">
                {stats.paperCount} papers
              </span>
              <span className="text-gray-400">
                {(stats.timeMs / 1000).toFixed(1)}s
              </span>
            </>
          ) : (
            <span className="text-red-600 truncate" title={stats.error}>
              {stats.error || 'Error'}
            </span>
          )}
        </div>
      )}

      {isActive && (
        <div className="mt-1.5">
          <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              animate={{ width: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
});

/**
 * Stage Indicator
 */
const StageIndicator = memo(function StageIndicator({
  currentStage,
}: {
  currentStage: SearchStage | null;
}) {
  const stages: SearchStage[] = ['analyzing', 'fast-sources', 'medium-sources', 'slow-sources', 'ranking', 'complete'];

  const currentIndex = currentStage ? stages.indexOf(currentStage) : -1;

  return (
    <div className="flex items-center justify-between gap-1">
      {stages.map((stage, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const info = STAGE_INFO[stage];

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                  isComplete
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-blue-500 ring-2 ring-blue-200'
                    : 'bg-gray-300'
                }`}
              >
                {isComplete && <CheckCircle2 className="w-2 h-2 text-white" />}
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className={`text-[9px] mt-1 whitespace-nowrap ${
                  isActive ? 'font-semibold text-blue-600' : 'text-gray-500'
                }`}
              >
                {info.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

/**
 * Phase 10.113 Week 11: Semantic Tier Indicator
 * Phase 10.113 Week 12: Enhanced with detailed stats display
 * Shows progressive semantic ranking progress with latency, cache hits, and papers processed
 */
const SemanticTierIndicator = memo(function SemanticTierIndicator({
  currentTier,
  version,
  tierStats,
}: {
  currentTier: SemanticTierName | null;
  version: number;
  tierStats?: Map<SemanticTierName, SemanticTierStats> | undefined;
}) {
  const tiers: SemanticTierName[] = ['immediate', 'refined', 'complete'];
  const currentIndex = currentTier ? tiers.indexOf(currentTier) : -1;

  // Calculate total stats for summary - moved before early return (React hooks rules)
  const totalStats = useMemo(() => {
    if (!tierStats || tierStats.size === 0) return null;

    let totalPapers = 0;
    let totalCacheHits = 0;
    let totalLatency = 0;
    let completedTiers = 0;

    tierStats.forEach((stats) => {
      if (stats.isComplete) {
        totalPapers += stats.papersProcessed;
        totalCacheHits += stats.cacheHits;
        totalLatency = Math.max(totalLatency, stats.latencyMs);
        completedTiers++;
      }
    });

    const cacheRate = totalPapers > 0 ? (totalCacheHits / totalPapers) * 100 : 0;

    return { totalPapers, totalCacheHits, totalLatency, cacheRate, completedTiers };
  }, [tierStats]);

  // Early return after hooks (React hooks rules compliant)
  if (!currentTier && version === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
      {/* Header with stats summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
            Semantic Ranking
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Summary stats badges */}
          {totalStats && totalStats.completedTiers > 0 && (
            <>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white border-green-200 text-green-600 flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5" />
                {totalStats.cacheRate.toFixed(0)}%
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white border-blue-200 text-blue-600 flex items-center gap-1">
                <Timer className="w-2.5 h-2.5" />
                {(totalStats.totalLatency / 1000).toFixed(1)}s
              </Badge>
            </>
          )}
          {version > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white border-purple-200 text-purple-600">
              v{version}
            </Badge>
          )}
        </div>
      </div>

      {/* Tier cards */}
      <div className="flex items-stretch gap-2">
        {tiers.map((tier, index) => {
          const config = SEMANTIC_TIER_CONFIG[tier];
          const stats = tierStats?.get(tier);
          const isActive = tier === currentTier && (!stats || !stats.isComplete);
          const isComplete = stats?.isComplete || index < currentIndex;
          const hasProgress = stats && !stats.isComplete && stats.progressPercent > 0;

          return (
            <React.Fragment key={tier}>
              <div className="flex-1">
                <div
                  className={`p-2 rounded-lg border-2 transition-all h-full ${
                    isComplete
                      ? 'bg-green-50 border-green-400'
                      : isActive
                      ? 'bg-purple-100 border-purple-500 shadow-sm'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {/* Tier name and status */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          isComplete
                            ? 'text-green-700'
                            : isActive
                            ? 'text-purple-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {config.displayName}
                      </span>
                    </div>
                    {/* Latency badge for completed tiers */}
                    {isComplete && stats?.latencyMs && (
                      <span className="text-[9px] text-green-600 font-medium">
                        {(stats.latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>

                  {/* Paper range */}
                  <div className="mt-1 text-[10px] text-gray-500">
                    {config.paperRange} papers
                  </div>

                  {/* Progress bar for active tier */}
                  {(isActive || hasProgress) && !isComplete && (
                    <div className="mt-2">
                      <div className="h-1 bg-purple-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${stats?.progressPercent ?? 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      {stats?.papersProcessed !== undefined && (
                        <div className="mt-1 text-[9px] text-purple-600">
                          {stats.papersProcessed} processed
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats for completed tiers */}
                  {isComplete && stats && (
                    <div className="mt-2 flex items-center gap-2 text-[9px] text-gray-500">
                      <div className="flex items-center gap-0.5" title="Papers processed">
                        <FileText className="w-2.5 h-2.5" />
                        <span>{stats.papersProcessed}</span>
                      </div>
                      {stats.cacheHits > 0 && (
                        <div className="flex items-center gap-0.5 text-green-600" title="Cache hits">
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>{stats.cacheHits}</span>
                        </div>
                      )}
                      {stats.usedWorkerPool && (
                        <div className="flex items-center gap-0.5 text-blue-600" title="Worker pool used">
                          <Cpu className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {index < tiers.length - 1 && (
                <div className="flex items-center">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      index < currentIndex ? 'text-green-400' : 'text-gray-300'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status message */}
      <div className="mt-3 text-xs">
        {currentTier === 'immediate' && !tierStats?.get('immediate')?.isComplete && (
          <span className="text-purple-600">Quick preview ready - papers re-ranking in progress...</span>
        )}
        {currentTier === 'refined' && !tierStats?.get('refined')?.isComplete && (
          <span className="text-purple-600">Refining analysis with extended paper set...</span>
        )}
        {tierStats?.get('complete')?.isComplete && (
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">
              Full semantic analysis complete - highest quality ranking
            </span>
            {totalStats && (
              <span className="text-gray-500">
                {totalStats.totalPapers} papers ranked
              </span>
            )}
          </div>
        )}
        {currentTier === 'complete' && !tierStats?.get('complete')?.isComplete && (
          <span className="text-purple-600">Completing final deep analysis...</span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LiveSearchProgress = memo(function LiveSearchProgress({
  isSearching,
  stage,
  percent,
  message,
  sourceStats,
  sourcesComplete,
  sourcesTotal,
  papersFound,
  elapsedMs,
  onCancel,
  semanticTier,
  semanticVersion = 0,
  semanticTierStats,
}: LiveSearchProgressProps) {
  // Group sources by tier
  const sourcesByTier = useMemo(() => {
    const result: Record<SourceTier, Array<[LiteratureSource, SourceStats]>> = {
      fast: [],
      medium: [],
      slow: [],
    };

    sourceStats.forEach((stats, source) => {
      result[stats.tier].push([source, stats]);
    });

    return result;
  }, [sourceStats]);

  // Calculate ETA
  const eta = useMemo(() => {
    if (!isSearching || sourcesComplete === 0) return null;

    const avgTimePerSource = elapsedMs / sourcesComplete;
    const remainingSources = sourcesTotal - sourcesComplete;
    const remainingMs = avgTimePerSource * remainingSources;

    return Math.max(0, Math.ceil(remainingMs / 1000));
  }, [isSearching, elapsedMs, sourcesComplete, sourcesTotal]);

  // Format elapsed time
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

  if (!isSearching && sourceStats.size === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
          {/* Header with Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                <span className="font-semibold text-gray-900">
                  {isSearching ? 'Searching...' : 'Search Complete'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              {/* Papers Found */}
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{papersFound}</span>
                <span className="text-gray-500">papers</span>
              </div>

              {/* Sources */}
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {sourcesComplete}/{sourcesTotal}
                </span>
                <span className="text-gray-500">sources</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{elapsedSeconds}s</span>
                {eta !== null && isSearching && (
                  <span className="text-gray-400">
                    (~{eta}s left)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{message}</span>
              <span className="font-medium text-gray-900">{Math.round(percent)}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>

          {/* Stage Indicator */}
          <StageIndicator currentStage={stage} />

          {/* Phase 10.113 Week 11/12: Semantic Tier Indicator with stats */}
          <SemanticTierIndicator
            currentTier={semanticTier ?? null}
            version={semanticVersion}
            tierStats={semanticTierStats}
          />

          {/* Source Grid */}
          {sourceStats.size > 0 && (
            <div className="space-y-3">
              {/* Fast Sources */}
              {sourcesByTier.fast.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Fast Sources (&lt;2s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sourcesByTier.fast.map(([source, stats]) => (
                      <SourceCard key={source} source={source} stats={stats} />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Sources */}
              {sourcesByTier.medium.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Medium Sources (&lt;5s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sourcesByTier.medium.map(([source, stats]) => (
                      <SourceCard key={source} source={source} stats={stats} />
                    ))}
                  </div>
                </div>
              )}

              {/* Slow Sources */}
              {sourcesByTier.slow.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Slow Sources (&lt;15s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sourcesByTier.slow.map(([source, stats]) => (
                      <SourceCard key={source} source={source} stats={stats} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {isSearching && onCancel && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default LiveSearchProgress;
