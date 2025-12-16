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
import { X, Maximize2, Minimize2, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchPipelineOrchestraProps, Point } from './types';
import type { LiteratureSource, SourceTier, SemanticTierName } from '@/lib/types/search-stream.types';

// Hooks
import { usePipelineState } from './hooks/usePipelineState';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useCountStabilization } from './hooks/useCountStabilization';

// Components
import { StageOrb } from './components/StageOrb';
import { StageConnector } from './components/StageConnector';
import { OrbitalSourceConstellation } from './components/OrbitalSourceConstellation';
import { ParticleFlowSystem } from './components/ParticleFlowSystem';
import { SemanticBrainVisualizer } from './components/SemanticBrainVisualizer';
import { QualityFunnelVisualizer } from './components/QualityFunnelVisualizer';
import { LiveCounter, ETAPredictor, QualityMeter } from './components/LiveCounter';
import { PipelineErrorBoundary } from './components/PipelineErrorBoundary';
import { MethodologyReport } from './components/MethodologyReport';
import { StageFlowParticles } from './components/StageFlowParticles';

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
    // Phase 10.160: Quality selection state for funnel visualization
    selectionRankedCount,
    selectionSelectedCount,
    selectionAvgQuality,
    onCancel,
    onSourceClick,
    onTierClick,
    showParticles = true,
    showSemanticBrain = true,
    showQualityFunnel = true,
    compactMode = false,
  }) {
    // Reduced motion preference
    const reducedMotion = useReducedMotion();

    // Local state
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    // Derive pipeline state (Phase 10.156: Iteration state removed)
    // Phase 10.160: Added selection props for quality funnel visualization
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
      // Phase 10.160: Quality selection state (default to 0 if undefined)
      selectionRankedCount: selectionRankedCount ?? 0,
      selectionSelectedCount: selectionSelectedCount ?? 0,
      selectionAvgQuality: selectionAvgQuality ?? 0,
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

    // Phase 10.148: Auto-expand to semi-full screen when search starts
    // This gives users a better view of the pipeline process
    const hasAutoExpanded = useRef(false);
    useEffect(() => {
      // Only auto-expand once per search session, and only if not already expanded
      if (isSearching && !hasAutoExpanded.current) {
        setIsExpanded(true);
        hasAutoExpanded.current = true;
      }
      // Reset auto-expand flag when search completes so next search can auto-expand
      if (!isSearching && hasAutoExpanded.current) {
        hasAutoExpanded.current = false;
      }
    }, [isSearching]); // Only depend on isSearching - don't re-run on isExpanded changes

    // Phase 10.167: Responsive golden ratio scaling
    const [constellationSize, setConstellationSize] = useState({
      width: PIPELINE_LAYOUT.constellationWidth,
      height: PIPELINE_LAYOUT.constellationHeight,
    });

    useEffect(() => {
      const updateSize = () => {
        if (typeof window === 'undefined') return;

        const screenWidth = window.innerWidth;
        const baseWidth = PIPELINE_LAYOUT.constellationWidth;   // 480
        const baseHeight = PIPELINE_LAYOUT.constellationHeight; // 300
        const aspectRatio = baseHeight / baseWidth;             // 0.625 (≈ 1/φ)

        // Mobile (<640): Scale to 65% - still readable
        if (screenWidth < 640) {
          const scale = 0.65;
          const scaledWidth = Math.min(screenWidth - 40, baseWidth * scale);
          setConstellationSize({
            width: scaledWidth,
            height: scaledWidth * aspectRatio,
          });
        }
        // Tablet (640-1024): Scale to 80%
        else if (screenWidth < 1024) {
          const scale = 0.80;
          setConstellationSize({
            width: baseWidth * scale,
            height: baseHeight * scale,
          });
        }
        // Small desktop (1024-1280): Scale to 90%
        else if (screenWidth < 1280) {
          const scale = 0.90;
          setConstellationSize({
            width: baseWidth * scale,
            height: baseHeight * scale,
          });
        }
        // Large desktop: Full golden ratio size
        else {
          setConstellationSize({ width: baseWidth, height: baseHeight });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Phase 10.167: Calculate true center (no offset for balanced orbits)
    const constellationCenter = useMemo<Point>(() => ({
      x: constellationSize.width / 2 + (PIPELINE_LAYOUT.constellationCenterOffsetX ?? 0),
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

    // Phase 10.140: Calculate raw total papers (sum of all source counts)
    const rawTotalPapers = useMemo(() => {
      let total = 0;
      sourceStats.forEach((stats) => {
        total += stats.paperCount;
      });
      return total;
    }, [sourceStats]);

    // Phase 10.143: Detect when paper count stabilizes to stop particle flow
    const { isStabilized: isCountStabilized } = useCountStabilization({
      count: rawTotalPapers,
      isActive: isSearching,
    });

    // Phase 10.143: Particles only flow during collection phase (DISCOVER/ANALYZE)
    // and stop when count stabilizes
    const isCollectionPhase = pipelineState.currentStage === 'discover' || pipelineState.currentStage === 'analyze';
    const showParticleFlow = isSearching && isCollectionPhase && !isCountStabilized;

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
      // Phase 10.163: Updated for elliptical orbits
      sourceStats.forEach((_, source) => {
        const tier = SOURCE_TIERS[source];
        const tierSources = tierGroups.get(tier) || [];
        const sourceIndex = sourceIndices.get(source) ?? 0;
        const orbitConfig = ORBIT_CONFIGS[tier];

        // Phase 10.163: Use elliptical radii
        const rx = orbitConfig.radiusX ?? orbitConfig.radius;
        const ry = orbitConfig.radiusY ?? orbitConfig.radius;

        const angleStep = (2 * Math.PI) / Math.max(tierSources.length, 1);
        const angle = orbitConfig.startAngle + (sourceIndex * angleStep);

        positions.set(source, {
          x: constellationCenter.x + rx * Math.cos(angle),
          y: constellationCenter.y + ry * Math.sin(angle),
        });
      });

      return positions;
    }, [sourceStats, constellationCenter]);

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

    // Phase 10.135: Optimize stage state lookups - O(1) instead of O(n) find
    const stageStateMap = useMemo(() => {
      const map = new Map<string, typeof pipelineState.stages[0]>();
      pipelineState.stages.forEach((s) => map.set(s.id, s));
      return map;
    }, [pipelineState]);

    // Phase 10.148: Horizontal layout - all stages at same level (no arc)
    const arcPositions = useMemo(() => {
      // Return 0 offset for all stages - horizontal alignment
      return PIPELINE_STAGES.map(() => 0);
    }, []);

    // Phase 10.148: Horizontal SVG path for visual flow
    const svgArcPath = useMemo(() => {
      const startX = constellationSize.width * 0.15;
      const endX = constellationSize.width * 0.85;
      const lineY = 40; // Centered horizontally
      return `M ${startX} ${lineY} L ${endX} ${lineY}`;
    }, [constellationSize.width]);

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
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
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
            'relative rounded-xl',
            // Phase 10.165: Solid dark background with subtle blur - WCAG compliant
            'bg-gray-900 backdrop-blur-md',
            'border border-white/15 shadow-2xl',
            // Phase 10.163: Enterprise-grade expanded layout
            isExpanded && 'fixed inset-8 z-50 overflow-auto max-w-6xl mx-auto'
          )}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={SPRING_PRESETS.soft}
          role="region"
          aria-label={ARIA_LABELS.pipeline}
          tabIndex={-1}
        >
          {/* Background gradient - subtle for enterprise look */}
          <div
            className="absolute inset-0 opacity-20 overflow-hidden rounded-xl"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                          radial-gradient(ellipse at 70% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
            }}
          />

        {/* Content - Phase 10.163: Tighter padding for compact feel */}
        <div className={cn(
          'relative p-4',
          isExpanded && 'p-6',
          compactMode && 'p-3'
        )}>
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

          {/* Main Content Area - Phase 10.162: Compact Layout */}
          <div className={cn(
            'relative flex flex-col gap-4',
            'max-lg:gap-3',
            compactMode && 'gap-3'
          )}>
            {/* Phase 10.162: Pipeline Stages - Compact Horizontal Layout */}
            <div className="relative w-full flex justify-center overflow-visible" style={{ minHeight: '80px' }}>
              {/* Horizontal Container - Stages in a row */}
              <div className="relative w-full max-w-4xl flex items-center justify-center overflow-visible">
                {/* SVG Horizontal Path for Visual Flow (Decorative) */}
                {!reducedMotion && (
                  <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ height: '80px', overflow: 'visible' }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                        <stop offset="25%" stopColor="rgba(16, 185, 129, 0.3)" />
                        <stop offset="50%" stopColor="rgba(245, 158, 11, 0.3)" />
                        <stop offset="75%" stopColor="rgba(139, 92, 246, 0.3)" />
                        <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
                      </linearGradient>
                    </defs>
                    <path
                      d={svgArcPath}
                      fill="none"
                      stroke="url(#arcGradient)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.4"
                    />
                  </svg>
                )}

                {/* Phase 10.148: Stages in Horizontal Layout */}
                <div
                  className="relative flex items-center justify-center gap-3 overflow-visible"
                  style={{ width: '100%' }}
                >
                  {PIPELINE_STAGES.map((stageConfig, index) => {
                    // Phase 10.135: O(1) lookup instead of O(n) find
                    const stageState = stageStateMap.get(stageConfig.id);
                    if (!stageState) return null;

                    // Phase 10.135: Use memoized arc position (guaranteed to exist)
                    const arcOffset = arcPositions[index] ?? 0;
                    const prevArcOffset = index > 0 ? (arcPositions[index - 1] ?? 0) : 0;
                    const prevStageConfig = index > 0 ? PIPELINE_STAGES[index - 1] : null;
                    const prevStageState = prevStageConfig
                      ? stageStateMap.get(prevStageConfig.id)
                      : null;

                    return (
                      <React.Fragment key={stageConfig.id}>
                        {/* Connector */}
                        {index > 0 && prevStageState && (
                          <div
                            className="relative"
                            style={{
                              marginTop: `${Math.min(arcOffset, prevArcOffset)}px`,
                            }}
                          >
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
                          </div>
                        )}

                        {/* Stage Orb with Arc Positioning */}
                        <motion.div
                          className="relative flex-shrink-0"
                          style={{
                            marginTop: `${arcOffset}px`,
                          }}
                          initial={{ opacity: 0, y: -20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: reducedMotion ? 0 : index * 0.08,
                            ...SPRING_PRESETS.soft,
                          }}
                        >
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
                        </motion.div>
                      </React.Fragment>
                    );
                  })}

                  {/* Phase 10.142: Inter-stage particle flow visualization */}
                  <StageFlowParticles
                    stages={pipelineState.stages.map((s) => ({ id: s.id, status: s.status }))}
                    currentStage={pipelineState.currentStage}
                    isSearching={isSearching}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            </div>

            {/* Phase 10.168: Apple-Grade Layout - Galaxy left, Detail panels under stages */}
            <div className="relative flex items-start gap-6 max-lg:flex-col">
              {/* Left: Milky Way Galaxy */}
              <div
                className="relative flex-shrink-0"
                style={{ width: constellationSize.width, height: constellationSize.height }}
              >
                <PipelineErrorBoundary>
                  <OrbitalSourceConstellation
                    sources={pipelineState.sources}
                    activeTiers={activeTiers}
                    centerPosition={constellationCenter}
                    width={constellationSize.width}
                    height={constellationSize.height}
                    paperCount={papersFound}
                    rawTotalPapers={rawTotalPapers}
                    currentStage={pipelineState.currentStage}
                    isComplete={pipelineState.isComplete}
                    isSearching={isSearching}
                    onSourceHover={handleSourceHover}
                    onSourceClick={handleSourceClick}
                    reducedMotion={reducedMotion}
                  />
                </PipelineErrorBoundary>

                {showParticles && !reducedMotion && showParticleFlow && (
                  <PipelineErrorBoundary>
                    <ParticleFlowSystem
                      sources={sourceStats}
                      sourcePositions={sourcePositions}
                      targetPosition={constellationCenter}
                      intensity="high"
                      isActive={showParticleFlow}
                      width={constellationSize.width}
                      height={constellationSize.height}
                      reducedMotion={reducedMotion}
                    />
                  </PipelineErrorBoundary>
                )}
              </div>

              {/* Right: Detail Panels with Vertical Arrows */}
              <div className="flex-1 flex gap-5 max-lg:flex-col max-lg:w-full">
                {/* RANK → Semantic Ranking Column */}
                <div className="flex-1 flex flex-col items-center">
                  {/* Vertical Arrow from RANK stage */}
                  {showSemanticBrain && (pipelineState.currentStage === 'rank' || semanticTier) && (
                    <motion.div
                      className="flex flex-col items-center mb-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, ...SPRING_PRESETS.soft }}
                    >
                      {/* Arrow line */}
                      <div className="w-px h-8 bg-gradient-to-b from-purple-500/60 to-purple-500/20" />
                      {/* Arrow head */}
                      <svg width="12" height="8" viewBox="0 0 12 8" className="text-purple-500/60">
                        <path d="M6 8L0 0h12L6 8z" fill="currentColor" />
                      </svg>
                      {/* Label */}
                      <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider mt-1">
                        from RANK
                      </span>
                    </motion.div>
                  )}

                  {/* Semantic Ranking Panel */}
                  {showSemanticBrain && (pipelineState.currentStage === 'rank' || semanticTier) && (
                    <PipelineErrorBoundary>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, ...SPRING_PRESETS.soft }}
                        className="w-full"
                      >
                        <SemanticBrainVisualizer
                          currentTier={semanticTier}
                          tierStats={semanticTierStats}
                          papersProcessed={
                            semanticTierStats.get('complete')?.papersProcessed ||
                            semanticTierStats.get('refined')?.papersProcessed ||
                            semanticTierStats.get('immediate')?.papersProcessed ||
                            0
                          }
                          totalPapers={pipelineState.qualitySelection.rankedCount || papersFound}
                          isProcessing={stage === 'ranking'}
                          onTierHover={handleTierHover}
                          onTierClick={handleTierClick}
                          reducedMotion={reducedMotion}
                        />
                      </motion.div>
                    </PipelineErrorBoundary>
                  )}
                </div>

                {/* SELECT → Quality Filter Column */}
                <div className="flex-1 flex flex-col items-center">
                  {/* Vertical Arrow from SELECT stage */}
                  {showQualityFunnel && (
                    stage === 'selecting' ||
                    stage === 'complete' ||
                    pipelineState.qualitySelection.isSelecting ||
                    pipelineState.qualitySelection.isComplete
                  ) && (
                    <motion.div
                      className="flex flex-col items-center mb-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, ...SPRING_PRESETS.soft }}
                    >
                      {/* Arrow line */}
                      <div className="w-px h-8 bg-gradient-to-b from-cyan-500/60 to-cyan-500/20" />
                      {/* Arrow head */}
                      <svg width="12" height="8" viewBox="0 0 12 8" className="text-cyan-500/60">
                        <path d="M6 8L0 0h12L6 8z" fill="currentColor" />
                      </svg>
                      {/* Label */}
                      <span className="text-[10px] font-medium text-cyan-400/80 uppercase tracking-wider mt-1">
                        from SELECT
                      </span>
                    </motion.div>
                  )}

                  {/* Quality Filter Panel */}
                  {showQualityFunnel && (
                    stage === 'selecting' ||
                    stage === 'complete' ||
                    pipelineState.qualitySelection.isSelecting ||
                    pipelineState.qualitySelection.isComplete
                  ) && (
                    <PipelineErrorBoundary>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35, ...SPRING_PRESETS.soft }}
                        className="w-full"
                      >
                        <QualityFunnelVisualizer
                          rankedCount={pipelineState.qualitySelection.rankedCount}
                          selectedCount={pipelineState.qualitySelection.selectedCount}
                          targetCount={pipelineState.qualitySelection.targetCount}
                          avgQualityScore={pipelineState.qualitySelection.avgQualityScore}
                          isSelecting={pipelineState.qualitySelection.isSelecting || stage === 'selecting'}
                          isComplete={pipelineState.qualitySelection.isComplete || stage === 'complete'}
                          reducedMotion={reducedMotion}
                        />
                      </motion.div>
                    </PipelineErrorBoundary>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Dashboard + Methodology Report on same row */}
          <motion.div
            className="flex items-center justify-between gap-3 pt-4 border-t border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_PRESETS.soft}
          >
            <div className="flex items-center gap-3">
              <LiveCounter
                value={pipelineState.metrics.papers}
                label="Papers"
                icon={FileText}
                format="number"
                trend={pipelineState.metrics.papers > 0 ? 'up' : 'neutral'}
                animate={!reducedMotion}
                size="sm"
              />
              <LiveCounter
                value={pipelineState.metrics.elapsed}
                label="Elapsed"
                icon={Clock}
                format="duration"
                animate={!reducedMotion}
                size="sm"
              />
              <QualityMeter score={pipelineState.metrics.quality} animate={!reducedMotion} />
            </div>

            <div className="flex items-center gap-3">
              <ETAPredictor
                elapsedMs={pipelineState.metrics.elapsed}
                sourcesComplete={pipelineState.metrics.sourcesComplete}
                sourcesTotal={pipelineState.metrics.sourcesTotal}
                papersFound={pipelineState.metrics.papers}
                stage={stage}
                reducedMotion={reducedMotion}
              />
              {/* Methodology Report - inline with metrics */}
              {pipelineState.isComplete && (
                <MethodologyReport
                  query={message}
                  papersFound={papersFound}
                  sourcesQueried={Array.from(sourceStats.keys())}
                  elapsedMs={elapsedMs}
                  semanticTier={semanticTier}
                  duplicatesRemoved={Math.round(papersFound * 0.35)}
                  isComplete={pipelineState.isComplete}
                />
              )}
            </div>
          </motion.div>
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
