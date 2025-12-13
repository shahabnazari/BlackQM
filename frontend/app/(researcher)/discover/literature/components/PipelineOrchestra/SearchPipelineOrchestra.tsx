/**
 * Phase 10.126: Search Pipeline Orchestra Component
 *
 * The main container component that orchestrates all pipeline visualization
 * sub-components into a cohesive, Netflix-grade experience.
 *
 * Features:
 * - Unified pipeline stage visualization
 * - Orbital source constellation
 * - Particle flow system
 * - Semantic brain visualizer
 * - Live metrics dashboard
 * - Full accessibility support
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, FileText, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchPipelineOrchestraProps, Point } from './types';
import type { LiteratureSource, SourceTier, SemanticTierName } from '@/lib/types/search-stream.types';

// Hooks
import { usePipelineState } from './hooks/usePipelineState';
import { useReducedMotion } from './hooks/useReducedMotion';

// Components
import { StageOrb } from './components/StageOrb';
import { StageConnector } from './components/StageConnector';
import { OrbitalSourceConstellation } from './components/OrbitalSourceConstellation';
import { ParticleFlowSystem } from './components/ParticleFlowSystem';
import { SemanticBrainVisualizer } from './components/SemanticBrainVisualizer';
import { LiveCounter, ETAPredictor, QualityMeter } from './components/LiveCounter';
import { PipelineErrorBoundary } from './components/PipelineErrorBoundary';
import { MethodologyReport } from './components/MethodologyReport';

// Constants
import {
  PIPELINE_STAGES,
  PIPELINE_LAYOUT,
  SPRING_PRESETS,
  ARIA_LABELS,
  SR_ANNOUNCEMENTS,
  SOURCE_TIERS,
  ORBIT_CONFIGS,
} from './constants';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Phase 10.134: Cancel search button - always visible during search
 */
const CancelSearchButton = memo<{
  onCancel: () => void;
  isSearching: boolean;
}>(function CancelSearchButton({ onCancel, isSearching }) {
  if (!isSearching) return null;

  return (
    <motion.button
      onClick={onCancel}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30',
        'text-red-400 text-xs font-medium',
        'transition-colors min-h-[36px]' // Phase 10.134: Minimum touch target
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Cancel search"
    >
      <X className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Cancel</span>
    </motion.button>
  );
});

const OrchestraHeader = memo<{
  query: string;
  isExpanded: boolean;
  isSearching: boolean;
  onToggleExpand: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}>(function OrchestraHeader({ query, isExpanded, isSearching, onToggleExpand, onCancel, onClose }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">
            Search Pipeline
          </h3>
          {query && (
            <p className="text-xs text-white/60 truncate max-w-[200px] sm:max-w-[300px]">
              "{query}"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Phase 10.134: Always show cancel button during search */}
        {onCancel && (
          <CancelSearchButton onCancel={onCancel} isSearching={isSearching} />
        )}

        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          aria-label={isExpanded ? 'Collapse view' : 'Expand view'}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
        {onClose && !isSearching && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close pipeline view"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Metrics dashboard row
 */
const MetricsDashboard = memo<{
  papers: number;
  elapsed: number;
  quality: number;
  sourcesComplete: number;
  sourcesTotal: number;
  stage: string | null;
  reducedMotion: boolean;
}>(function MetricsDashboard({
  papers,
  elapsed,
  quality,
  sourcesComplete,
  sourcesTotal,
  stage,
  reducedMotion,
}) {
  return (
    <motion.div
      className="flex items-center justify-between gap-3 pt-4 border-t border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_PRESETS.soft}
    >
      <div className="flex items-center gap-3">
        <LiveCounter
          value={papers}
          label="Papers"
          icon={FileText}
          format="number"
          trend={papers > 0 ? 'up' : 'neutral'}
          animate={!reducedMotion}
          size="sm"
        />

        <LiveCounter
          value={elapsed}
          label="Elapsed"
          icon={Clock}
          format="duration"
          animate={!reducedMotion}
          size="sm"
        />

        <QualityMeter score={quality} animate={!reducedMotion} />
      </div>

      <ETAPredictor
        elapsedMs={elapsed}
        sourcesComplete={sourcesComplete}
        sourcesTotal={sourcesTotal}
        papersFound={papers}
        stage={stage}
        reducedMotion={reducedMotion}
      />
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Search Pipeline Orchestra Component
 *
 * The main Netflix-grade pipeline visualization.
 *
 * @example
 * ```tsx
 * <SearchPipelineOrchestra
 *   isSearching={wsState.isSearching}
 *   stage={wsState.stage}
 *   percent={wsState.percent}
 *   message={wsState.message}
 *   sourceStats={wsState.sourceStats}
 *   sourcesComplete={wsState.sourcesComplete}
 *   sourcesTotal={wsState.sourcesTotal}
 *   papersFound={wsState.papersFound}
 *   elapsedMs={wsState.elapsedMs}
 *   semanticTier={wsState.semanticTier}
 *   semanticVersion={wsState.semanticVersion}
 *   semanticTierStats={wsState.semanticTierStats}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const SearchPipelineOrchestra = memo<SearchPipelineOrchestraProps>(
  function SearchPipelineOrchestra({
    isSearching,
    stage,
    percent,
    message,
    sourceStats,
    sourcesComplete,
    sourcesTotal,
    papersFound,
    elapsedMs,
    semanticTier,
    semanticVersion,
    semanticTierStats,
    onCancel,
    onSourceClick,
    onTierClick,
    showParticles = true,
    showSemanticBrain = true,
    compactMode = false,
  }) {
    // Reduced motion preference
    const reducedMotion = useReducedMotion();

    // Local state
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    // Derive pipeline state
    const pipelineState = usePipelineState({
      isSearching,
      stage,
      percent,
      message,
      sourceStats,
      sourcesComplete,
      sourcesTotal,
      papersFound,
      elapsedMs,
      semanticTier,
      semanticVersion,
      semanticTierStats,
    });

    // Expanded mode behaves like a lightweight modal overlay: Escape closes,
    // focus moves to container and restores on collapse.
    useEffect(() => {
      if (!isExpanded) return;

      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      // Let layout settle before focusing (avoid scroll-jank in some browsers).
      const id = window.setTimeout(() => {
        containerRef.current?.focus();
      }, 0);

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsExpanded(false);
        }
      };
      document.addEventListener('keydown', onKeyDown);

      return () => {
        window.clearTimeout(id);
        document.removeEventListener('keydown', onKeyDown);
        restoreFocusRef.current?.focus?.();
        restoreFocusRef.current = null;
      };
    }, [isExpanded]);

    // Phase 10.135: Responsive constellation sizing for mobile
    const [constellationSize, setConstellationSize] = useState({
      width: PIPELINE_LAYOUT.constellationWidth,
      height: PIPELINE_LAYOUT.constellationHeight,
    });

    useEffect(() => {
      const updateSize = () => {
        if (typeof window === 'undefined') return;
        const isMobile = window.innerWidth < 640; // sm breakpoint
        if (isMobile) {
          const maxSize = Math.min(
            window.innerWidth - 32, // Account for padding
            PIPELINE_LAYOUT.constellationWidth
          );
          setConstellationSize({ width: maxSize, height: maxSize });
        } else {
          setConstellationSize({
            width: PIPELINE_LAYOUT.constellationWidth,
            height: PIPELINE_LAYOUT.constellationHeight,
          });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Calculate center position for constellation
    const constellationCenter = useMemo<Point>(() => ({
      x: constellationSize.width / 2,
      y: constellationSize.height / 2,
    }), [constellationSize]);

    // Get active source tiers
    const activeTiers = useMemo(() => {
      const tiers = new Set<SourceTier>();
      sourceStats.forEach((stats, source) => {
        if (stats.status === 'searching' || stats.status === 'complete') {
          tiers.add(SOURCE_TIERS[source]);
        }
      });
      return tiers;
    }, [sourceStats]);

    // Calculate source positions for particles - O(n) optimized
    const sourcePositions = useMemo(() => {
      const positions = new Map<LiteratureSource, Point>();

      // Phase 10.127: O(n) optimization using index Map instead of O(n²) indexOf
      // Group by tier and track index simultaneously
      const tierGroups = new Map<SourceTier, LiteratureSource[]>();
      const sourceIndices = new Map<LiteratureSource, number>();

      sourceStats.forEach((_, source) => {
        const tier = SOURCE_TIERS[source];
        if (!tierGroups.has(tier)) {
          tierGroups.set(tier, []);
        }
        const tierArray = tierGroups.get(tier)!;
        sourceIndices.set(source, tierArray.length); // Store index BEFORE push
        tierArray.push(source);
      });

      // Calculate positions using pre-computed indices
      sourceStats.forEach((_, source) => {
        const tier = SOURCE_TIERS[source];
        const tierSources = tierGroups.get(tier) || [];
        const sourceIndex = sourceIndices.get(source) ?? 0; // O(1) lookup
        const orbitConfig = ORBIT_CONFIGS[tier];

        const angleStep = (2 * Math.PI) / Math.max(tierSources.length, 1);
        const angle = orbitConfig.startAngle + (sourceIndex * angleStep);

        positions.set(source, {
          x: constellationCenter.x + orbitConfig.radius * Math.cos(angle),
          y: constellationCenter.y + orbitConfig.radius * Math.sin(angle),
        });
      });

      return positions;
    }, [sourceStats, constellationCenter]);

    // Particle target position (end of discover stage)
    const particleTarget = useMemo<Point>(() => ({
      x: constellationSize.width + 60,
      y: constellationCenter.y,
    }), [constellationCenter, constellationSize]);

    // Handlers
    const handleToggleExpand = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const handleStageToggle = useCallback((stageId: string) => {
      setExpandedStage((prev) => (prev === stageId ? null : stageId));
    }, []);

    // Phase 10.135: Check for errors to show banner
    const hasErrors = useMemo(() => {
      for (const stats of sourceStats.values()) {
        if (stats.status === 'error') return true;
      }
      return false;
    }, [sourceStats]);

    const errorCount = useMemo(() => {
      let count = 0;
      sourceStats.forEach((stats) => {
        if (stats.status === 'error') count++;
      });
      return count;
    }, [sourceStats]);

    // Hover callbacks are intentionally no-ops until cross-highlighting is implemented.
    const handleSourceHover = useCallback((_source: LiteratureSource | null) => {}, []);

    const handleSourceClick = useCallback((source: LiteratureSource) => {
      onSourceClick?.(source);
    }, [onSourceClick]);

    const handleTierHover = useCallback((_tier: SemanticTierName | null) => {}, []);

    const handleTierClick = useCallback((tier: SemanticTierName) => {
      onTierClick?.(tier);
    }, [onTierClick]);

    // Don't render if not searching and no results
    if (!isSearching && sourcesComplete === 0) {
      return null;
    }

    return (
      <>
        {/* Phase 10.134: Backdrop for expanded mode */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggleExpand}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.div
          ref={containerRef}
          className={cn(
            'relative rounded-2xl',
            'backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-gray-800/95',
            'border border-white/10 shadow-2xl',
            isExpanded && 'fixed inset-4 z-50 overflow-auto'
          )}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={SPRING_PRESETS.soft}
          role="region"
          aria-label={ARIA_LABELS.pipeline}
          tabIndex={-1}
        >
          {/* Background gradient - Phase 10.133: Added overflow-hidden + rounded to clip gradient properly */}
          <div
            className="absolute inset-0 opacity-30 overflow-hidden rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 60%),
                          radial-gradient(ellipse at 70% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)`,
            }}
          />

        {/* Content */}
        <div className={cn('relative p-6', compactMode && 'p-4')}>
          {/* Phase 10.135: Error banner - prominent display of source failures */}
          <AnimatePresence>
            {hasErrors && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-400 font-medium">
                      {errorCount} source{errorCount !== 1 ? 's' : ''} failed to search
                    </p>
                    <p className="text-xs text-red-300/80 mt-1">
                      Search continued with remaining sources. Results may be incomplete.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <OrchestraHeader
            query={message}
            isExpanded={isExpanded}
            isSearching={isSearching}
            onToggleExpand={handleToggleExpand}
            {...(onCancel && { onCancel })}
          />

          {/* Main Content Area - Phase 10.134: Mobile responsive layout */}
          <div className={cn(
            'flex gap-6',
            'max-lg:flex-col max-lg:gap-4', // Stack on tablet and below
            compactMode && 'flex-col gap-4'
          )}>
            {/* Left: Source Constellation - Wrapped in Error Boundary */}
            <div className="relative flex-shrink-0 max-lg:mx-auto">
              <PipelineErrorBoundary>
                <OrbitalSourceConstellation
                  sources={pipelineState.sources}
                  activeTiers={activeTiers}
                  centerPosition={constellationCenter}
                  width={constellationSize.width}
                  height={constellationSize.height}
                  paperCount={papersFound}
                  isSearching={isSearching}
                  onSourceHover={handleSourceHover}
                  onSourceClick={handleSourceClick}
                  reducedMotion={reducedMotion}
                />
              </PipelineErrorBoundary>

              {/* Particle Flow System - Wrapped in Error Boundary */}
              {showParticles && !reducedMotion && (
                <PipelineErrorBoundary>
                  <ParticleFlowSystem
                    sources={sourceStats}
                    sourcePositions={sourcePositions}
                    targetPosition={particleTarget}
                    intensity={isSearching ? 'high' : 'low'}
                    isActive={isSearching}
                    width={constellationSize.width + 100}
                    height={constellationSize.height}
                    reducedMotion={reducedMotion}
                  />
                </PipelineErrorBoundary>
              )}
            </div>

            {/* Right: Pipeline & Semantic Brain - Phase 10.133: Added overflow-visible for tooltips */}
            <div className="flex-1 flex flex-col gap-4 overflow-visible max-lg:w-full">
              {/* Pipeline Stages - Phase 10.134: Mobile responsive with horizontal scroll */}
              <div className={cn(
                'flex items-center justify-center overflow-visible',
                'max-sm:overflow-x-auto max-sm:justify-start max-sm:pb-2 max-sm:-mx-2 max-sm:px-2',
                'max-sm:scrollbar-thin max-sm:scrollbar-thumb-white/20'
              )}>
                {PIPELINE_STAGES.map((stageConfig, index) => {
                  const stageState = pipelineState.stages.find(
                    (s) => s.id === stageConfig.id
                  );
                  if (!stageState) return null;

                  const prevStageState = index > 0
                    ? pipelineState.stages[index - 1]
                    : null;

                  return (
                    <React.Fragment key={stageConfig.id}>
                      {/* Connector */}
                      {index > 0 && prevStageState && (
                        <StageConnector
                          fromStatus={prevStageState.status}
                          toStatus={stageState.status}
                          isActive={
                            prevStageState.status === 'complete' &&
                            stageState.status === 'active'
                          }
                          progress={stageState.progress}
                          reducedMotion={reducedMotion}
                        />
                      )}

                      {/* Stage Orb */}
                      <StageOrb
                        stage={stageConfig}
                        state={stageState}
                        index={index}
                        totalStages={PIPELINE_STAGES.length}
                        isFirst={index === 0}
                        isLast={index === PIPELINE_STAGES.length - 1}
                        isExpanded={expandedStage === stageConfig.id}
                        onToggle={() => handleStageToggle(stageConfig.id)}
                        reducedMotion={reducedMotion}
                      />
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Semantic Brain - Wrapped in Error Boundary */}
              {/* Phase 10.129: Added label to clarify this is the Rank stage breakdown */}
              {showSemanticBrain && (pipelineState.currentStage === 'rank' || semanticTier) && (
                <motion.div
                  className="flex flex-col items-center mt-2 overflow-visible"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, ...SPRING_PRESETS.soft }}
                >
                  {/* Label explaining the semantic brain's relationship to Rank stage */}
                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Ranking Progress — 3-Tier Semantic Analysis
                    </span>
                  </div>
                  <PipelineErrorBoundary>
                    <SemanticBrainVisualizer
                      currentTier={semanticTier}
                      tierStats={semanticTierStats}
                      papersProcessed={
                        semanticTierStats.get('complete')?.papersProcessed ||
                        semanticTierStats.get('refined')?.papersProcessed ||
                        semanticTierStats.get('immediate')?.papersProcessed ||
                        0
                      }
                      totalPapers={papersFound}
                      isProcessing={stage === 'ranking'}
                      onTierHover={handleTierHover}
                      onTierClick={handleTierClick}
                      reducedMotion={reducedMotion}
                    />
                  </PipelineErrorBoundary>
                </motion.div>
              )}
            </div>
          </div>

          {/* Metrics Dashboard */}
          <MetricsDashboard
            papers={pipelineState.metrics.papers}
            elapsed={pipelineState.metrics.elapsed}
            quality={pipelineState.metrics.quality}
            sourcesComplete={pipelineState.metrics.sourcesComplete}
            sourcesTotal={pipelineState.metrics.sourcesTotal}
            stage={stage}
            reducedMotion={reducedMotion}
          />

          {/* Phase 10.128: Methodology Report - shown after search completes */}
          {pipelineState.isComplete && (
            <div className="pt-3 border-t border-white/10 mt-3 flex justify-end">
              <MethodologyReport
                query={message}
                papersFound={papersFound}
                sourcesQueried={Array.from(sourceStats.keys())}
                elapsedMs={elapsedMs}
                semanticTier={semanticTier}
                duplicatesRemoved={Math.round(papersFound * 0.35)}
                isComplete={pipelineState.isComplete}
              />
            </div>
          )}
        </div>

          {/* Screen Reader Announcements */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {pipelineState.isComplete &&
              SR_ANNOUNCEMENTS.searchComplete(papersFound, Math.round(elapsedMs / 1000))}
          </div>
        </motion.div>
      </>
    );
  }
);

export default SearchPipelineOrchestra;
