/**
 * Phase 10.126: Netflix-Grade Pipeline Visualization Types
 *
 * TypeScript interfaces for the SearchPipelineOrchestra component system.
 * These types power the orbital source constellation, particle flow system,
 * semantic brain visualizer, and stage orb components.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

import type { LucideIcon } from 'lucide-react';
import type {
  LiteratureSource,
  SourceStats,
  SourceTier,
  SearchStage,
  SemanticTierName,
  SemanticTierStats,
} from '@/lib/types/search-stream.types';

// ============================================================================
// PIPELINE STAGE TYPES
// ============================================================================

/**
 * Pipeline stage identifiers
 */
export type PipelineStageId = 'analyze' | 'discover' | 'refine' | 'rank' | 'ready';

/**
 * Pipeline stage status
 */
export type PipelineStageStatus = 'pending' | 'active' | 'complete' | 'error';

/**
 * Pipeline stage configuration
 */
export interface PipelineStageConfig {
  id: PipelineStageId;
  name: string;
  icon: LucideIcon;
  description: string;
  activeDescription: string;
  completeDescription: string;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  substages: string[];
}

/**
 * Derived pipeline stage state
 */
export interface PipelineStageState {
  id: PipelineStageId;
  status: PipelineStageStatus;
  progress: number;
  duration: number | null;
  message: string;
  substageProgress: Record<string, number>;
}

// ============================================================================
// SOURCE CONSTELLATION TYPES
// ============================================================================

/**
 * Source position in orbital space
 */
export interface SourcePosition {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

/**
 * Orbital configuration for source tier
 */
export interface OrbitConfig {
  radius: number;
  speed: number;
  startAngle: number;
  direction: 1 | -1;
}

/**
 * Source node visual state
 */
export interface SourceNodeState {
  source: LiteratureSource;
  tier: SourceTier;
  status: 'pending' | 'searching' | 'complete' | 'error' | 'skipped';
  position: SourcePosition;
  paperCount: number;
  timeMs: number;
  error?: string;
  isHovered: boolean;
  isExpanded: boolean;
}

/**
 * Source constellation props
 * Phase 10.127: Updated to match actual component interface
 */
export interface OrbitalSourceConstellationProps {
  sources: SourceNodeState[];
  activeTiers: Set<SourceTier>;
  centerPosition: Point;
  width: number;
  height: number;
  paperCount: number;
  isSearching: boolean;
  onSourceHover: (source: LiteratureSource | null) => void;
  onSourceClick: (source: LiteratureSource) => void;
  reducedMotion: boolean;
}

// ============================================================================
// PARTICLE FLOW TYPES
// ============================================================================

/**
 * 2D point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bezier curve control points
 */
export interface BezierControls {
  cp1: Point;
  cp2: Point;
}

/**
 * Flow particle state
 */
export interface FlowParticle {
  id: string;
  source: LiteratureSource;
  sourcePosition: Point;
  targetPosition: Point;
  bezierControls: BezierControls;
  progress: number;
  size: number;
  color: string;
  opacity: number;
  trail: Point[];
  createdAt: number;
}

/**
 * Particle system configuration
 */
export interface ParticleSystemConfig {
  particlesPerPaper: number;
  maxParticles: number;
  particleSizeRange: { min: number; max: number };
  particleSpeedRange: { min: number; max: number };
  trailLength: number;
  colorBySource: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
}

/**
 * Particle flow system props
 */
export interface ParticleFlowSystemProps {
  sources: Map<LiteratureSource, SourceStats>;
  sourcePositions: Map<LiteratureSource, Point>;
  targetPosition: Point;
  intensity: 'low' | 'medium' | 'high';
  isActive: boolean;
  width: number;
  height: number;
}

// ============================================================================
// SEMANTIC BRAIN TYPES
// ============================================================================

/**
 * Neural node state
 */
export interface NeuralNodeState {
  tier: SemanticTierName;
  position: Point;
  status: 'pending' | 'processing' | 'complete';
  progress: number;
  papersProcessed: number;
  cacheHits: number;
  latencyMs: number;
  isActive: boolean;
}

/**
 * Synapse connection state
 */
export interface SynapseState {
  from: SemanticTierName;
  to: SemanticTierName;
  isActive: boolean;
  pulseProgress: number;
  dataFlowing: boolean;
}

/**
 * Semantic brain visualizer props
 * Phase 10.127: Added reducedMotion for accessibility
 */
export interface SemanticBrainVisualizerProps {
  currentTier: SemanticTierName | null;
  tierStats: Map<SemanticTierName, SemanticTierStats>;
  papersProcessed: number;
  totalPapers: number;
  isProcessing: boolean;
  onTierHover: (tier: SemanticTierName | null) => void;
  onTierClick: (tier: SemanticTierName) => void;
  reducedMotion: boolean;
}

// ============================================================================
// STAGE ORB TYPES
// ============================================================================

/**
 * Stage orb props
 */
export interface StageOrbProps {
  stage: PipelineStageConfig;
  state: PipelineStageState;
  index: number;
  totalStages: number; // Phase 10.130: For smart tooltip positioning
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
}

/**
 * Stage connector props
 */
export interface StageConnectorProps {
  fromStatus: PipelineStageStatus;
  toStatus: PipelineStageStatus;
  isActive: boolean;
  progress: number;
  reducedMotion: boolean;
}

// ============================================================================
// LIVE COUNTER TYPES
// ============================================================================

/**
 * Counter format type
 */
export type CounterFormat = 'number' | 'duration' | 'percentage' | 'compact';

/**
 * Live counter props
 */
export interface LiveCounterProps {
  value: number;
  label: string;
  icon: LucideIcon;
  format?: CounterFormat;
  trend?: 'up' | 'down' | 'neutral';
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  sparklineData?: number[];
}

/**
 * ETA predictor props
 */
export interface ETAPredictorProps {
  elapsedMs: number;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  stage: SearchStage | null;
}

/**
 * Quality meter props
 */
export interface QualityMeterProps {
  score: number;
  factors: {
    sources: number;
    recency: number;
    citations: number;
    relevance: number;
  };
  animate?: boolean;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

/**
 * Pipeline metrics
 */
export interface PipelineMetrics {
  papers: number;
  elapsed: number;
  quality: number;
  eta: number | null;
  sourcesComplete: number;
  sourcesTotal: number;
}

/**
 * Derived pipeline state
 */
export interface DerivedPipelineState {
  stages: PipelineStageState[];
  currentStage: PipelineStageId | null;
  sources: SourceNodeState[];
  activeSource: LiteratureSource | null;
  particles: FlowParticle[];
  semanticNodes: NeuralNodeState[];
  synapses: SynapseState[];
  metrics: PipelineMetrics;
  isSearching: boolean;
  isComplete: boolean;
}

/**
 * Search pipeline orchestra props
 */
export interface SearchPipelineOrchestraProps {
  // WebSocket state
  isSearching: boolean;
  stage: SearchStage | null;
  percent: number;
  message: string;
  sourceStats: Map<LiteratureSource, SourceStats>;
  sourcesComplete: number;
  sourcesTotal: number;
  papersFound: number;
  elapsedMs: number;

  // Semantic state
  semanticTier: SemanticTierName | null;
  semanticVersion: number;
  semanticTierStats: Map<SemanticTierName, SemanticTierStats>;

  // Callbacks
  onCancel?: () => void;
  onSourceClick?: (source: LiteratureSource) => void;
  onTierClick?: (tier: SemanticTierName) => void;

  // Options
  showParticles?: boolean;
  showSemanticBrain?: boolean;
  compactMode?: boolean;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Spring animation config
 */
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

/**
 * Animation state
 */
export interface AnimationState {
  isPlaying: boolean;
  progress: number;
  iteration: number;
}

/**
 * Keyframe animation config
 */
export interface KeyframeConfig {
  duration: number;
  delay?: number;
  repeat?: number | 'infinite';
  ease?: string | number[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Source to color mapping
 */
export type SourceColorMap = Record<LiteratureSource, string>;

/**
 * Tier to color mapping
 */
export type TierColorMap = Record<SemanticTierName, string>;

/**
 * Status to color mapping
 */
export type StatusColorMap = Record<PipelineStageStatus, string>;
