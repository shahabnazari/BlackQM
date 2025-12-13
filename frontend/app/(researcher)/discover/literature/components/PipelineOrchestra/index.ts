/**
 * Phase 10.126: Pipeline Orchestra Module
 *
 * Netflix-grade pipeline visualization for literature search.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

// Main component
export { SearchPipelineOrchestra } from './SearchPipelineOrchestra';
export { default } from './SearchPipelineOrchestra';

// Sub-components
export { StageOrb } from './components/StageOrb';
export { StageConnector } from './components/StageConnector';
export { OrbitalSourceConstellation } from './components/OrbitalSourceConstellation';
export { SourceNode } from './components/SourceNode';
export { ParticleFlowSystem } from './components/ParticleFlowSystem';
export { SemanticBrainVisualizer } from './components/SemanticBrainVisualizer';
export { LiveCounter, ETAPredictor, QualityMeter } from './components/LiveCounter';
export { PipelineErrorBoundary } from './components/PipelineErrorBoundary';
export { MethodologyReport } from './components/MethodologyReport';

// Hooks
export { usePipelineState } from './hooks/usePipelineState';
export { useReducedMotion, getMotionProps, getTransitionDuration, getSpringConfig } from './hooks/useReducedMotion';

// Types
export type {
  // Stage types
  PipelineStageId,
  PipelineStageStatus,
  PipelineStageConfig,
  PipelineStageState,
  StageOrbProps,
  StageConnectorProps,

  // Source types
  SourcePosition,
  OrbitConfig,
  SourceNodeState,
  OrbitalSourceConstellationProps,

  // Particle types
  Point,
  BezierControls,
  FlowParticle,
  ParticleSystemConfig,
  ParticleFlowSystemProps,

  // Semantic types
  NeuralNodeState,
  SynapseState,
  SemanticBrainVisualizerProps,

  // Counter types
  CounterFormat,
  LiveCounterProps,
  ETAPredictorProps,
  QualityMeterProps,

  // Orchestrator types
  PipelineMetrics,
  DerivedPipelineState,
  SearchPipelineOrchestraProps,

  // Animation types
  SpringConfig,
  AnimationState,
  KeyframeConfig,

  // Utility types
  SourceColorMap,
  TierColorMap,
  StatusColorMap,
} from './types';

// Methodology Report types
export type { MethodologyReportProps } from './components/MethodologyReport';

// Constants
export {
  // Colors
  STAGE_COLORS,
  TIER_COLORS,
  SEMANTIC_TIER_COLORS,
  STATUS_COLORS,
  SOURCE_COLORS,
  GLASS_COLORS,

  // Configs
  PIPELINE_STAGES,
  STAGE_TECHNICAL_DETAILS,
  ORBIT_CONFIGS,
  SOURCE_TIERS,
  SOURCE_DISPLAY_NAMES,
  PARTICLE_CONFIG,
  PARTICLE_INTENSITY,
  SEMANTIC_TIER_CONFIG,
  RANKING_TIER_LIMITS,
  MAX_RANKED_PAPERS,
  NEURAL_MESH_LAYOUT,

  // Animation
  SPRING_PRESETS,
  ANIMATION_DURATIONS,
  EASING,

  // Layout
  STAGE_ORB_SIZE,
  SOURCE_NODE_SIZE,
  LIVE_COUNTER_CONFIG,
  QUALITY_METER_SIZE,
  PIPELINE_LAYOUT,
  CONNECTOR_SIZE,
  CANVAS_DIMENSIONS,

  // Accessibility
  ARIA_LABELS,
  SR_ANNOUNCEMENTS,
  REDUCED_MOTION_CONFIG,
} from './constants';
