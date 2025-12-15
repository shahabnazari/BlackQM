/**
 * Phase 10.126: Pipeline State Derivation Hook
 *
 * Derives visual pipeline state from WebSocket search state.
 * Transforms raw search data into displayable component states.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

import { useMemo } from 'react';
import type {
  SearchStage,
  LiteratureSource,
  SourceStats,
  SemanticTierName,
  SemanticTierStats,
} from '@/lib/types/search-stream.types';
import type {
  DerivedPipelineState,
  PipelineStageState,
  PipelineStageId,
  PipelineStageStatus,
  SourceNodeState,
  NeuralNodeState,
  SynapseState,
  PipelineMetrics,
  Point,
} from '../types';
import {
  PIPELINE_STAGES,
  ORBIT_CONFIGS,
  SOURCE_TIERS,
} from '../constants';

// ============================================================================
// TYPES
// ============================================================================

interface PipelineStateInput {
  isSearching: boolean;
  stage: SearchStage | null;
  percent: number;
  message: string;
  sourceStats: Map<LiteratureSource, SourceStats>;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  elapsedMs: number;
  semanticTier: SemanticTierName | null;
  semanticVersion: number;
  semanticTierStats: Map<SemanticTierName, SemanticTierStats>;
}

// ============================================================================
// STAGE DERIVATION
// ============================================================================

/**
 * Map WebSocket search stage to pipeline stage ID
 * Phase 10.152: Removed 'ready' stage - 'complete' now maps to 'rank' (final stage)
 */
function mapSearchStageToPipelineStage(stage: SearchStage | null): PipelineStageId | null {
  switch (stage) {
    case 'analyzing':
      return 'analyze';
    case 'fast-sources':
    case 'medium-sources':
    case 'slow-sources':
      return 'discover';
    case 'ranking':
    case 'complete': // Phase 10.152: Pipeline ends at 'rank', so 'complete' = 'rank' done
      return 'rank';
    default:
      return null;
  }
}

/**
 * Derive stage status from search state
 * Phase 10.142: Fixed REFINE stage activation - REFINE becomes active when DISCOVER completes
 * but before RANK starts (since REFINE has no explicit WebSocket stage)
 * Phase 10.152: Removed 'ready' stage - pipeline now ends at 'rank'
 */
function deriveStageStatus(
  stageId: PipelineStageId,
  currentStage: PipelineStageId | null,
  isSearching: boolean,
  isComplete: boolean
): PipelineStageStatus {
  // Phase 10.152: Pipeline is now 4 stages - removed 'ready'
  const stageOrder: PipelineStageId[] = ['analyze', 'discover', 'refine', 'rank'];
  const stageIndex = stageOrder.indexOf(stageId);
  const currentIndex = currentStage ? stageOrder.indexOf(currentStage) : -1;

  if (!isSearching && !isComplete) {
    return 'pending';
  }

  if (isComplete) {
    return 'complete';
  }

  // Phase 10.142: REFINE stage activation logic (must check BEFORE stageIndex < currentIndex)
  // REFINE becomes active when DISCOVER is complete and RANK is starting
  // Since REFINE has no explicit WebSocket stage, we infer it from the transition
  // REFINE should be 'active' when RANK starts to enable REFINE→RANK particle flow
  if (stageId === 'refine') {
    const discoverIndex = stageOrder.indexOf('discover');
    const rankIndex = stageOrder.indexOf('rank');
    
    // REFINE is active when:
    // - DISCOVER is complete (currentIndex > discoverIndex)
    // - AND we're at RANK (currentIndex === rankIndex)
    // This enables REFINE→RANK particle flow visualization
    if (currentIndex > discoverIndex && currentIndex === rankIndex) {
      return 'active';
    }
  }

  if (stageIndex < currentIndex) {
    return 'complete';
  }

  if (stageIndex === currentIndex) {
    return 'active';
  }

  return 'pending';
}

/**
 * Derive all pipeline stage states
 */
function deriveStageStates(input: PipelineStateInput): PipelineStageState[] {
  const currentStage = mapSearchStageToPipelineStage(input.stage);
  const isComplete = input.stage === 'complete';

  return PIPELINE_STAGES.map((stageConfig) => {
    const status = deriveStageStatus(
      stageConfig.id,
      currentStage,
      input.isSearching,
      isComplete
    );

    // Calculate stage-specific progress
    let progress = 0;
    let duration: number | null = null;
    let message = stageConfig.description;

    if (status === 'complete') {
      progress = 100;
      message = stageConfig.completeDescription;
    } else if (status === 'active') {
      message = stageConfig.activeDescription;

      switch (stageConfig.id) {
        case 'analyze':
          progress = input.stage === 'analyzing' ? 50 : 100;
          break;
        case 'discover':
          progress = input.sourcesTotal > 0
            ? (input.sourcesComplete / input.sourcesTotal) * 100
            : 0;
          break;
        case 'rank':
          // Based on semantic tier progress
          if (input.semanticTier === 'immediate') progress = 33;
          else if (input.semanticTier === 'refined') progress = 66;
          else if (input.semanticTier === 'complete') progress = 100;
          else progress = input.percent;
          break;
        default:
          progress = input.percent;
      }
    }

    // Calculate substage progress
    const substageProgress: Record<string, number> = {};
    if (stageConfig.id === 'discover' && input.sourceStats.size > 0) {
      input.sourceStats.forEach((stats, source) => {
        substageProgress[source] = stats.status === 'complete' ? 100 :
          stats.status === 'searching' ? 50 : 0;
      });
    }

    return {
      id: stageConfig.id,
      status,
      progress,
      duration,
      message,
      substageProgress,
    };
  });
}

// ============================================================================
// SOURCE CONSTELLATION DERIVATION
// ============================================================================

/**
 * Calculate source position in orbital space
 * Phase 10.135: Improved angle distribution to ensure nodes align perfectly on orbit rings
 */
function calculateSourcePosition(
  source: LiteratureSource,
  sourceIndex: number,
  tierSourceCount: number,
  centerX: number,
  centerY: number
): Point {
  const tier = SOURCE_TIERS[source];
  const orbitConfig = ORBIT_CONFIGS[tier];

  // Distribute sources evenly around the orbit
  // Use full circle (2π) and ensure proper distribution
  const angleStep = (2 * Math.PI) / Math.max(tierSourceCount, 1);
  
  // Calculate angle: start from orbit's startAngle and distribute evenly
  // Add small offset per source to spread them around the orbit
  const angle = orbitConfig.startAngle + (sourceIndex * angleStep);

  // Calculate position on the orbit ring
  const x = centerX + orbitConfig.radius * Math.cos(angle);
  const y = centerY + orbitConfig.radius * Math.sin(angle);

  return { x, y };
}

/**
 * Derive source node states
 * Phase 10.135: Fixed center calculation to match actual constellation size (420x420)
 * Also improved node positioning to ensure proper alignment on orbital rings
 */
function deriveSourceStates(
  sourceStats: Map<LiteratureSource, SourceStats>,
  centerX: number = 210,  // PIPELINE_LAYOUT.constellationWidth / 2 = 420/2
  centerY: number = 210   // PIPELINE_LAYOUT.constellationHeight / 2 = 420/2
): SourceNodeState[] {
  const sources: SourceNodeState[] = [];

  // Group sources by tier for positioning (using Map for O(1) lookups)
  const tierGroups: Map<string, LiteratureSource[]> = new Map([
    ['fast', []],
    ['medium', []],
    ['slow', []],
  ]);

  // Build tier groups and create index map for O(1) lookups
  const sourceIndices = new Map<LiteratureSource, number>();
  sourceStats.forEach((_, source) => {
    const tier = SOURCE_TIERS[source];
    const tierArray = tierGroups.get(tier)!;
    sourceIndices.set(source, tierArray.length); // Store index BEFORE push
    tierArray.push(source);
  });

  // Calculate positions for each source using pre-computed indices
  sourceStats.forEach((stats, source) => {
    const tier = SOURCE_TIERS[source];
    const tierSources = tierGroups.get(tier) || [];
    const sourceIndex = sourceIndices.get(source) ?? 0; // O(1) lookup instead of indexOf
    
    const position = calculateSourcePosition(
      source,
      sourceIndex,
      tierSources.length,
      centerX,
      centerY
    );

    // Calculate angle from center to ensure proper alignment
    const angleFromCenter = Math.atan2(position.y - centerY, position.x - centerX);

    sources.push({
      source,
      tier,
      status: stats.status === 'pending' ? 'pending' :
        stats.status === 'searching' ? 'searching' :
        stats.status === 'complete' ? 'complete' :
        stats.status === 'error' ? 'error' : 'skipped',
      position: {
        ...position,
        angle: angleFromCenter,
        radius: ORBIT_CONFIGS[tier].radius,
      },
      paperCount: stats.paperCount,
      timeMs: stats.timeMs,
      // Only include error if it exists (exactOptionalPropertyTypes compliance)
      ...(stats.error !== undefined && { error: stats.error }),
      isHovered: false,
      isExpanded: false,
    });
  });

  return sources;
}

// ============================================================================
// SEMANTIC BRAIN DERIVATION
// ============================================================================

/**
 * Derive neural node states for semantic visualization
 */
function deriveSemanticNodes(
  tierStats: Map<SemanticTierName, SemanticTierStats>,
  currentTier: SemanticTierName | null
): NeuralNodeState[] {
  const tiers: SemanticTierName[] = ['immediate', 'refined', 'complete'];
  const spacing = 100;

  return tiers.map((tier, index) => {
    const stats = tierStats.get(tier);
    const tierOrder = tiers.indexOf(tier);
    const currentTierOrder = currentTier ? tiers.indexOf(currentTier) : -1;

    let status: 'pending' | 'processing' | 'complete' = 'pending';
    if (stats?.isComplete) {
      status = 'complete';
    } else if (tierOrder === currentTierOrder || (stats && !stats.isComplete)) {
      status = 'processing';
    }

    return {
      tier,
      position: { x: index * spacing, y: 0 },
      status,
      progress: stats?.progressPercent || 0,
      papersProcessed: stats?.papersProcessed || 0,
      cacheHits: stats?.cacheHits || 0,
      latencyMs: stats?.latencyMs || 0,
      isActive: status === 'processing',
    };
  });
}

/**
 * Derive synapse states between semantic nodes
 */
function deriveSynapseStates(
  nodes: NeuralNodeState[]
): SynapseState[] {
  const synapses: SynapseState[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];

    // Guard against undefined (TypeScript strictness)
    if (!from || !to) continue;

    synapses.push({
      from: from.tier,
      to: to.tier,
      isActive: from.status === 'complete' && to.status !== 'pending',
      pulseProgress: from.status === 'complete' ? 1 : 0,
      dataFlowing: to.status === 'processing',
    });
  }

  return synapses;
}

// ============================================================================
// METRICS DERIVATION
// ============================================================================

/**
 * Calculate quality score from search results
 */
function calculateQualityScore(
  sourcesComplete: number,
  sourcesTotal: number,
  papersFound: number,
  semanticTier: SemanticTierName | null
): number {
  let score = 0;

  // Source coverage (0-30 points)
  if (sourcesTotal > 0) {
    score += (sourcesComplete / sourcesTotal) * 30;
  }

  // Paper count (0-30 points)
  if (papersFound > 0) {
    score += Math.min(papersFound / 200, 1) * 30;
  }

  // Semantic ranking (0-40 points)
  if (semanticTier === 'immediate') score += 15;
  else if (semanticTier === 'refined') score += 30;
  else if (semanticTier === 'complete') score += 40;

  return Math.round(score);
}

/**
 * Estimate remaining time
 */
function estimateRemainingTime(
  elapsedMs: number,
  sourcesComplete: number,
  sourcesTotal: number,
  stage: SearchStage | null
): number | null {
  if (stage === 'complete' || !stage) return null;
  if (sourcesTotal === 0 || sourcesComplete === 0) return null;

  // Estimate based on source completion rate
  const avgTimePerSource = elapsedMs / sourcesComplete;
  const remainingSources = sourcesTotal - sourcesComplete;
  const estimatedSourceTime = avgTimePerSource * remainingSources;

  // Add buffer for ranking phase
  const rankingBuffer = stage === 'ranking' ? 0 : 2000;

  return Math.round(estimatedSourceTime + rankingBuffer);
}

/**
 * Derive pipeline metrics
 */
function deriveMetrics(input: PipelineStateInput): PipelineMetrics {
  return {
    papers: input.papersFound,
    elapsed: input.elapsedMs,
    quality: calculateQualityScore(
      input.sourcesComplete,
      input.sourcesTotal,
      input.papersFound,
      input.semanticTier
    ),
    eta: estimateRemainingTime(
      input.elapsedMs,
      input.sourcesComplete,
      input.sourcesTotal,
      input.stage
    ),
    sourcesComplete: input.sourcesComplete,
    sourcesTotal: input.sourcesTotal,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook to derive visual pipeline state from WebSocket search state
 *
 * @param input - Raw search state from WebSocket
 * @returns Derived pipeline state for visualization
 *
 * @example
 * ```tsx
 * const pipelineState = usePipelineState({
 *   isSearching: wsState.isSearching,
 *   stage: wsState.stage,
 *   percent: wsState.percent,
 *   // ... other WebSocket state
 * });
 *
 * return <SearchPipelineOrchestra state={pipelineState} />;
 * ```
 */
export function usePipelineState(input: PipelineStateInput): DerivedPipelineState {
  // Memoize derived state to prevent unnecessary recalculations
  const stages = useMemo(
    () => deriveStageStates(input),
    [input.isSearching, input.stage, input.percent, input.sourcesComplete, input.sourcesTotal, input.semanticTier]
  );

  const currentStage = useMemo(
    () => mapSearchStageToPipelineStage(input.stage),
    [input.stage]
  );

  const sources = useMemo(
    () => deriveSourceStates(input.sourceStats),
    [input.sourceStats]
  );

  const activeSource = useMemo(() => {
    for (const [source, stats] of input.sourceStats) {
      if (stats.status === 'searching') return source;
    }
    return null;
  }, [input.sourceStats]);

  const semanticNodes = useMemo(
    () => deriveSemanticNodes(input.semanticTierStats, input.semanticTier),
    [input.semanticTierStats, input.semanticTier]
  );

  const synapses = useMemo(
    () => deriveSynapseStates(semanticNodes),
    [semanticNodes]
  );

  const metrics = useMemo(
    () => deriveMetrics(input),
    [input.papersFound, input.elapsedMs, input.sourcesComplete, input.sourcesTotal, input.semanticTier, input.stage]
  );

  return useMemo(() => ({
    stages,
    currentStage,
    sources,
    activeSource,
    particles: [], // Managed by particle system hook
    semanticNodes,
    synapses,
    metrics,
    isSearching: input.isSearching,
    isComplete: input.stage === 'complete',
  }), [stages, currentStage, sources, activeSource, semanticNodes, synapses, metrics, input.isSearching, input.stage]);
}

export default usePipelineState;
