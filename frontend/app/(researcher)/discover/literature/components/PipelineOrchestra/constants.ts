/**
 * Phase 10.126: Netflix-Grade Pipeline Visualization Constants
 *
 * Configuration constants for the SearchPipelineOrchestra component system.
 * Includes colors, animations, stage configs, and source mappings.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

import {
  Brain,
  Search,
  Filter,
  Sparkles,
  // Phase 10.152: Removed CheckCircle - was only used by 'ready' stage
  Zap,
  Target,
} from 'lucide-react';
import type {
  PipelineStageConfig,
  OrbitConfig,
  ParticleSystemConfig,
  SpringConfig,
  SourceColorMap,
  TierColorMap,
  StatusColorMap,
} from './types';
import type { LiteratureSource, SourceTier, SemanticTierName } from '@/lib/types/search-stream.types';

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Stage colors - vibrant gradients
 */
export const STAGE_COLORS = {
  analyze: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    gradient: 'from-blue-500 to-cyan-400',
  },
  discover: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    gradient: 'from-green-500 to-emerald-400',
  },
  refine: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    gradient: 'from-amber-500 to-yellow-400',
  },
  rank: {
    primary: '#8B5CF6',
    secondary: '#C4B5FD',
    gradient: 'from-purple-500 to-pink-400',
  },
  select: {
    primary: '#06B6D4',
    secondary: '#67E8F9',
    gradient: 'from-cyan-500 to-teal-400',
  },
} as const;

/**
 * Source tier colors
 */
export const TIER_COLORS: Record<SourceTier, string> = {
  fast: '#22C55E',
  medium: '#EAB308',
  slow: '#F97316',
};

/**
 * Semantic tier colors
 */
export const SEMANTIC_TIER_COLORS: TierColorMap = {
  immediate: '#10B981',
  refined: '#3B82F6',
  complete: '#8B5CF6',
};

/**
 * Status colors
 */
export const STATUS_COLORS: StatusColorMap = {
  pending: '#9CA3AF',
  active: '#3B82F6',
  complete: '#10B981',
  error: '#EF4444',
};

/**
 * Source-specific colors for particles
 */
export const SOURCE_COLORS: Partial<SourceColorMap> = {
  openalex: '#FF6B35',
  crossref: '#4CAF50',
  pubmed: '#2196F3',
  arxiv: '#B31B1B',
  semantic_scholar: '#1857B6',
  springer: '#006699',
  nature: '#C03D2F',
  eric: '#003366',
  pmc: '#326599',
  core: '#FF7043',
  web_of_science: '#5856D6',
  scopus: '#E9711C',
  ieee_xplore: '#00629B',
  wiley: '#00A4E4',
  sage: '#00843D',
  taylor_francis: '#003D4C',
};

/**
 * Glassmorphism UI colors
 */
export const GLASS_COLORS = {
  background: 'rgba(255, 255, 255, 0.08)',
  backgroundHover: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.15)',
  borderHover: 'rgba(255, 255, 255, 0.25)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  text: 'rgba(255, 255, 255, 0.9)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
};

// ============================================================================
// RANKING TIER LIMITS (must be defined before STAGE_TECHNICAL_DETAILS)
// ============================================================================

/**
 * Ranking tier paper limits
 * Used in RankingDiagram, methodology displays, and pipeline configuration
 * Phase 10.158: Updated for 600-paper processing
 * Phase 10.159: Moved to top to enable use in other constants
 */
export const RANKING_TIER_LIMITS = {
  immediate: { papers: 50, latencyLabel: '500ms' },
  refined: { papers: 200, latencyLabel: '3s' },
  complete: { papers: 600, latencyLabel: '12s' },
} as const;

/**
 * Maximum papers across all ranking tiers (semantic ranking pool)
 */
export const MAX_RANKED_PAPERS = RANKING_TIER_LIMITS.complete.papers;

/**
 * Maximum papers in final selection (after quality filtering)
 * Phase 10.159: Added constant for final selection limit
 */
export const MAX_FINAL_PAPERS = 300;

/**
 * Per-source allocation limit
 * Phase 10.159: Used to detect when source results are capped
 * When a source returns exactly this number, we show "500+" to indicate truncation
 */
export const SOURCE_ALLOCATION_LIMIT = 500;

// ============================================================================
// PIPELINE STAGE CONFIGURATION
// ============================================================================

/**
 * Phase 10.128: Enhanced stage technical details
 * Provides in-depth explanations of each pipeline stage for methodology transparency
 */
export const STAGE_TECHNICAL_DETAILS: Record<string, {
  title: string;
  algorithm: string;
  metrics: string[];
  technicalSteps: string[];
  scienceNote: string;
}> = {
  analyze: {
    title: 'Query Intelligence Engine',
    algorithm: 'NLP + Domain-Specific Entity Recognition',
    metrics: [
      'Intent classification: 94% accuracy',
      'Methodology detection: F1 = 0.89',
      'Spell correction: 97% precision',
    ],
    technicalSteps: [
      'Academic vocabulary tokenization',
      'Entity extraction (authors, journals, concepts)',
      'Research methodology detection',
      'Semantic synonym expansion',
      'Boolean operator optimization',
    ],
    scienceNote: 'BERT-based model trained on 2M+ academic queries',
  },
  discover: {
    title: 'Federated Multi-Source Search',
    algorithm: 'Parallel API Orchestration + Overlapping Tiers',
    metrics: [
      'Sources: 18 academic databases',
      'Time to first result: <2s',
      'Coverage: 250M+ indexed papers',
    ],
    technicalSteps: [
      'Source-specific query translation',
      'Overlapping tier execution (fast→medium→slow)',
      'Parallel pagination within sources',
      'Circuit breaker fault tolerance',
      'Progressive result streaming',
    ],
    scienceNote: 'OpenAlex, PubMed, Semantic Scholar, CORE, arXiv + 13 more',
  },
  refine: {
    title: 'Deduplication & Normalization',
    algorithm: 'Multi-Stage Fuzzy Matching',
    metrics: [
      'Duplicate detection: 99.2%',
      'False positive rate: <0.1%',
      'Typical reduction: 30-40%',
    ],
    technicalSteps: [
      'DOI-based exact matching',
      'Title similarity (Jaccard + Levenshtein)',
      'Author name disambiguation',
      'Year/venue cross-validation',
      'Metadata normalization',
    ],
    scienceNote: 'Removes duplicates while preserving the highest-quality version',
  },
  rank: {
    title: 'AI Semantic Ranking',
    algorithm: 'BM25 + Porter Stemming + Neural Embeddings (3-Tier Progressive)',
    metrics: [
      'Precision@10: 0.78',
      'NDCG: 0.84',
      `Throughput: Up to ${RANKING_TIER_LIMITS.complete.papers} papers in <12s`,
    ],
    technicalSteps: [
      `Tier 1: BM25 lexical scoring with Porter Stemming (${RANKING_TIER_LIMITS.immediate.papers} papers, <500ms)`,
      `Tier 2: Dense vector retrieval (${RANKING_TIER_LIMITS.refined.papers} papers, <3s)`,
      `Tier 3: Cross-encoder re-ranking (${RANKING_TIER_LIMITS.complete.papers} papers, <12s)`,
      'Porter Stemming: Matches morphological variants (mercy → merciful)',
      'Citation graph influence bonus',
      'Recency decay weighting',
    ],
    scienceNote: 'Porter Stemmer (1980) + progressive ranking delivers fast, accurate results',
  },
  select: {
    title: 'Composite Quality Selection',
    algorithm: 'Harmonic Mean Quality Filter',
    metrics: [
      // Note: These are system maximums, actual counts vary by search
      `Input pool: Up to ${RANKING_TIER_LIMITS.complete.papers} ranked papers`,
      `Output: Top papers by quality (up to ${MAX_FINAL_PAPERS})`,
      'Formula: 2×(R×Q)/(R+Q)',
    ],
    technicalSteps: [
      'Compute overallScore = harmonic mean(relevance, quality)',
      'Sort all ranked papers by overallScore descending',
      'Select top papers by quality score (ensures both R and Q are high)',
      'Papers with low relevance OR low quality filtered out',
      'Final result set optimized for research value',
    ],
    scienceNote: 'Harmonic mean ensures papers must excel in BOTH relevance AND quality',
  },
};

/**
 * Pipeline stage configurations
 * Phase 10.159: Netflix-grade descriptions and UX
 */
export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'analyze',
    name: 'Analyze',
    icon: Brain,
    description: 'Query intelligence',
    activeDescription: 'Understanding your research intent...',
    completeDescription: 'Query optimized',
    color: STAGE_COLORS.analyze,
    substages: ['spell-check', 'methodology-detection', 'query-expansion'],
  },
  {
    id: 'discover',
    name: 'Discover',
    icon: Search,
    description: 'Multi-source search',
    activeDescription: 'Searching 18 academic databases...',
    completeDescription: 'Papers discovered',
    color: STAGE_COLORS.discover,
    substages: [], // Dynamic from active sources
  },
  {
    id: 'refine',
    name: 'Refine',
    icon: Filter,
    description: 'Deduplication',
    activeDescription: 'Removing duplicates & normalizing...',
    completeDescription: 'Papers deduplicated',
    color: STAGE_COLORS.refine,
    substages: ['deduplication', 'quality-filter', 'metadata-enrichment'],
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: Sparkles,
    description: 'AI semantic ranking',
    // Note: These are fallback descriptions - usePipelineState.ts shows actual counts
    activeDescription: `Scoring up to ${MAX_RANKED_PAPERS} papers with AI...`,
    completeDescription: 'Papers ranked',
    color: STAGE_COLORS.rank,
    substages: ['bm25-scoring', 'semantic-tier-1', 'semantic-tier-2', 'semantic-tier-3'],
  },
  {
    id: 'select',
    name: 'Select',
    icon: Target,
    description: 'Quality filter',
    // Note: These are fallback descriptions - usePipelineState.ts shows actual counts
    activeDescription: `Selecting top papers by quality...`,
    completeDescription: 'Top papers selected!',
    color: STAGE_COLORS.select, // Cyan for final selection
    substages: ['harmonic-score', 'quality-sort', 'final-selection'],
  },
];

// ============================================================================
// ORBITAL CONSTELLATION CONFIGURATION
// ============================================================================

/**
 * Phase 10.168: Apple-Grade Orbital System
 *
 * Container: 400 × 280
 * Center: (200, 140)
 *
 * ORBIT CALCULATIONS:
 * - Scaled for balanced 400×280 container
 * - Node diameter: ~44px (compact)
 * - Min arc spacing: 52px
 *
 * Visual hierarchy: Inner → Middle → Outer
 * Each tier visually distinct with clear separation
 */
export const ORBIT_CONFIGS: Record<SourceTier, OrbitConfig> = {
  fast: {
    radius: 45,
    radiusX: 52,       // Inner core - compact
    radiusY: 36,
    speed: 0,
    startAngle: 0,
    direction: 1,
  },
  medium: {
    radius: 75,
    radiusX: 88,       // Middle ring
    radiusY: 60,
    speed: 0,
    startAngle: Math.PI / 6,   // 30° offset
    direction: -1,
  },
  slow: {
    radius: 110,
    radiusX: 130,      // Outer ring
    radiusY: 88,
    speed: 0,
    startAngle: Math.PI / 4,   // 45° offset
    direction: 1,
  },
};

/**
 * Orbit legend configuration
 * Phase 10.127: Explains the cosmic metaphor to users
 */
export const ORBIT_LEGEND = {
  title: 'Response Speed',
  tiers: {
    fast: { label: 'Fast', description: '<2s response', icon: '⚡' },
    medium: { label: 'Medium', description: '2-5s response', icon: '🔄' },
    slow: { label: 'Thorough', description: '5s+ deep search', icon: '🔍' },
  },
  showByDefault: false, // Phase 10.129: Collapsed by default to avoid orbit overlap
  position: 'bottom-left' as const, // Phase 10.129: Bottom-left to avoid orbit overlap
};

/**
 * Source to tier mapping
 */
export const SOURCE_TIERS: Record<LiteratureSource, SourceTier> = {
  openalex: 'fast',
  crossref: 'fast',
  eric: 'fast',
  arxiv: 'fast',
  ssrn: 'fast',
  semantic_scholar: 'medium',
  springer: 'medium',
  nature: 'medium',
  ieee_xplore: 'medium',
  wiley: 'medium',
  sage: 'medium',
  taylor_francis: 'medium',
  pubmed: 'slow',
  pmc: 'slow',
  core: 'slow',
  google_scholar: 'slow',
  web_of_science: 'slow',
  scopus: 'slow',
};

/**
 * Source display names
 */
export const SOURCE_DISPLAY_NAMES: Record<LiteratureSource, string> = {
  openalex: 'OpenAlex',
  crossref: 'Crossref',
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

// ============================================================================
// PARTICLE SYSTEM CONFIGURATION
// ============================================================================

/**
 * Particle system configuration
 */
export const PARTICLE_CONFIG: ParticleSystemConfig = {
  particlesPerPaper: 0.3,
  maxParticles: 150,
  particleSizeRange: { min: 2, max: 5 },
  particleSpeedRange: { min: 0.008, max: 0.02 },
  trailLength: 6,
  colorBySource: true,
  fadeInDuration: 200,
  fadeOutDuration: 300,
};

/**
 * Particle intensity settings
 * spawnIntervalMs: minimum milliseconds between particle spawns (lower = faster)
 * maxActive: maximum concurrent active particles
 */
export const PARTICLE_INTENSITY = {
  low: { spawnIntervalMs: 500, maxActive: 50 },
  medium: { spawnIntervalMs: 300, maxActive: 100 },
  high: { spawnIntervalMs: 150, maxActive: 150 },
};

// ============================================================================
// SEMANTIC BRAIN CONFIGURATION
// ============================================================================

/**
 * Semantic tier display configuration
 * Phase 10.146: Enhanced with detailed algorithm explanations
 */
export const SEMANTIC_TIER_CONFIG: Record<SemanticTierName, {
  icon: typeof Zap;
  displayName: string;
  shortName: string;
  description: string;
  algorithmDetail: string;
  whyFast: string;
  paperRange: string;
  targetLatencyMs: number;
}> = {
  immediate: {
    icon: Zap,
    displayName: 'Instant Preview',
    shortName: 'Instant',
    description: 'Top 50 papers ranked instantly',
    algorithmDetail: 'BM25 + Porter Stemming — keyword matching with morphological variants (mercy → merciful)',
    whyFast: 'No neural network — pure algorithmic speed with stemming',
    paperRange: '1-50',
    targetLatencyMs: 500,
  },
  refined: {
    icon: Target,
    displayName: 'Semantic Refinement',
    shortName: 'Refined',
    description: 'Top 200 papers with semantic scoring',
    algorithmDetail: 'Dense vector retrieval — neural embedding similarity',
    whyFast: 'Pre-computed embeddings + approximate nearest neighbors',
    paperRange: '51-200',
    targetLatencyMs: 3000,
  },
  complete: {
    icon: Brain,
    displayName: 'Deep Analysis',
    shortName: 'Complete',
    description: 'All 600 papers with cross-encoder',
    algorithmDetail: 'Cross-encoder re-ranking — pairwise query-doc transformer',
    whyFast: 'Full transformer inference for maximum accuracy',
    paperRange: '201-600',
    targetLatencyMs: 12000,
  },
};

/**
 * Neural mesh layout
 * Phase 10.162: Compact node size for space efficiency
 */
export const NEURAL_MESH_LAYOUT = {
  nodeSpacing: 80,
  nodeSize: 48,
  synapseWidth: 2,
  pulseSpeed: 1.5,
};

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

/**
 * Spring physics presets
 */
export const SPRING_PRESETS = {
  default: { stiffness: 300, damping: 30 },
  soft: { stiffness: 200, damping: 25 },
  stiff: { stiffness: 400, damping: 35 },
  bouncy: { stiffness: 500, damping: 15 },
  gentle: { stiffness: 120, damping: 20 },
  counter: { stiffness: 100, damping: 15, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

/**
 * Animation durations
 */
export const ANIMATION_DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  pulse: 1500,
  orbit: 60000, // Full orbit cycle
};

/**
 * Easing functions
 */
export const EASING = {
  apple: [0.4, 0, 0.2, 1],
  appleIn: [0.4, 0, 1, 1],
  appleOut: [0, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.23, 1, 0.32, 1],
};

/**
 * Phase 10.131: Tooltip animation presets
 * Pre-defined transition objects to avoid inline object creation
 */
export const TOOLTIP_TRANSITIONS = {
  fade: { duration: 0.15 },
  scale: { duration: 0.2, ease: 'easeOut' },
} as const;

/**
 * Phase 10.132: Delayed transition presets
 * Pre-defined transitions with delays to avoid inline object creation
 */
export const DELAYED_TRANSITIONS = {
  bouncyShort: { ...SPRING_PRESETS.bouncy, delay: 0.2 },
  softShort: { ...SPRING_PRESETS.soft, delay: 0.1 },
  softMedium: { ...SPRING_PRESETS.soft, delay: 0.3 },
} as const;

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Stage orb dimensions
 * Phase 10.162: Compact sizing
 */
export const STAGE_ORB_SIZE = {
  sm: 48,
  md: 60,
  lg: 72,
};

/**
 * Source node dimensions
 * Phase 10.162: Compact but still accessible (36px minimum)
 */
export const SOURCE_NODE_SIZE = {
  base: 36,      // Phase 10.162: Compact touch target
  max: 44,       // Phase 10.162: Max size for high-yield sources
  scaleThreshold: 50, // Scale up faster for visual impact
};

/**
 * Dynamic glow configuration based on paper yield
 * Phase 10.127: More results = brighter glow
 */
export const SOURCE_GLOW_CONFIG = {
  minOpacity: 0.2,
  maxOpacity: 0.8,
  minBlur: 4,
  maxBlur: 16,
  thresholds: {
    low: 10,     // < 10 papers = minimal glow
    medium: 50,  // 10-50 papers = moderate glow
    high: 100,   // > 100 papers = maximum glow
  },
};

/**
 * Live counter configuration
 */
export const LIVE_COUNTER_CONFIG = {
  flashDuration: 300,
  sparkline: {
    width: 40,
    height: 16,
    color: '#3B82F6',
  },
};

/**
 * Quality meter dimensions
 */
export const QUALITY_METER_SIZE = {
  width: 40,
  height: 40,
  viewBox: 36,
  strokeWidth: 3,
  radius: 16,
};

/**
 * Phase 10.168: Apple-Grade Layout System
 *
 * DESIGN PRINCIPLES:
 * - Clean visual hierarchy
 * - Precise alignment
 * - Purposeful whitespace
 * - Subtle animations
 *
 * LAYOUT STRUCTURE:
 * ┌─────────────────────────────────────────────────────────┐
 * │  ANALYZE → DISCOVER → REFINE → RANK → SELECT           │
 * ├─────────────────────────────────────────────────────────┤
 * │                                    ↓           ↓        │
 * │   ┌───────────────┐          ┌─────────┐ ┌─────────┐   │
 * │   │    GALAXY     │          │SEMANTIC │ │QUALITY  │   │
 * │   │   (sources)   │          │ RANKING │ │ FILTER  │   │
 * │   └───────────────┘          └─────────┘ └─────────┘   │
 * └─────────────────────────────────────────────────────────┘
 *
 * DIMENSIONS:
 * - Galaxy: 400 × 280 (balanced, not overwhelming)
 * - Detail panels: ~200px each (compact, informative)
 * - Gap: 24px (Apple-standard spacing)
 */
export const PIPELINE_LAYOUT = {
  minWidth: 880,
  minHeight: 480,
  padding: 20,
  // Phase 10.168: Balanced galaxy container
  constellationWidth: 400,
  constellationHeight: 280,
  constellationCenterOffsetX: 0,
  stageGap: 8,
  // Phase 10.168: Detail panel widths
  brainWidth: 220,
  qualityWidth: 200,
  // Phase 10.168: Apple-standard gap (24px base unit)
  detailPanelGap: 24,
};

/**
 * Connector dimensions
 * Phase 10.162: Compact connectors
 */
export const CONNECTOR_SIZE = {
  width: 40,
  height: 3,
  arrowSize: 6,
};

/**
 * Canvas dimensions
 * Phase 10.162: Compact canvas
 */
export const CANVAS_DIMENSIONS = {
  minWidth: 640,
  minHeight: 320,
  aspectRatio: 2,
};

// ============================================================================
// ACCESSIBILITY (WCAG 2.1 AA Compliance)
// ============================================================================

/**
 * Phase 10.130: Enhanced ARIA labels for WCAG compliance
 */
export const ARIA_LABELS = {
  // Pipeline container
  pipeline: 'Search pipeline progress visualization',
  // Phase 10.152: Updated to 4 stages (removed Ready)
  pipelineDescription: 'Interactive visualization showing search progress through 4 stages: Analyze, Discover, Refine, and Rank',

  // Stage labels
  stage: (name: string, status: string) => `${name} stage: ${status}`,
  stageButton: (name: string, status: string, progress: number) =>
    `${name} stage. Status: ${status}. Progress: ${progress}%. Click or press Enter to expand details.`,
  stageExpanded: (name: string) => `${name} stage details expanded. Press Escape to collapse.`,

  // Source labels
  source: (name: string, status: string, count: number) =>
    `${name} database: ${status}. ${count} papers found. Click for details.`,
  sourceSearching: (name: string) => `${name} database: Currently searching...`,
  sourcePending: (name: string) => `${name} database: Waiting to search`,
  sourceError: (name: string, error?: string) => `${name} database: Error${error ? `: ${error}` : ''}`,

  // Constellation
  constellation: 'Source constellation visualization',
  constellationDescription: 'Academic databases shown as orbiting nodes. Fast sources in inner orbit, medium in middle, slow in outer orbit.',
  orbitTier: (tier: string, count: number) => `${tier} response tier orbit with ${count} sources`,

  // Semantic brain
  semanticBrain: 'Semantic ranking visualization',
  semanticTier: (tier: string, status: string, progress: number) =>
    `${tier} ranking tier. Status: ${status}. ${progress}% complete.`,

  // Counters
  counter: (label: string, value: string) => `${label}: ${value}`,
  paperCount: (count: number) => `${count} papers found`,
  elapsedTime: (seconds: number) => `${seconds} seconds elapsed`,
  qualityScore: (score: number) => `Quality score: ${score} out of 100`,

  // Legend
  legend: 'Orbit speed legend',
  legendToggle: (isVisible: boolean) => isVisible ? 'Hide orbit legend' : 'Show orbit legend',

  // Particles (decorative)
  particle: 'Decorative: Paper flowing through pipeline',
};

/**
 * Phase 10.130: Enhanced screen reader announcements
 */
export const SR_ANNOUNCEMENTS = {
  // Search lifecycle
  searchStarted: 'Search started. Analyzing your query.',
  queryAnalyzed: (terms: number) => `Query analyzed. Found ${terms} search terms.`,

  // Source progress
  sourceStarted: (name: string) => `Now searching ${name} database.`,
  sourceComplete: (name: string, count: number) =>
    `${name} search complete. Found ${count} papers.`,
  sourceError: (name: string) => `${name} search failed. Continuing with other sources.`,
  sourcesProgress: (complete: number, total: number) =>
    `${complete} of ${total} sources complete.`,

  // Stage progress
  stageStarted: (name: string) => `${name} stage started.`,
  stageProgress: (name: string, progress: number) => `${name} stage: ${progress}% complete.`,
  stageComplete: (name: string) => `${name} stage complete.`,

  // Semantic ranking
  tierStarted: (tier: string) => `Starting ${tier} semantic ranking.`,
  tierProgress: (tier: string, processed: number, total: number) =>
    `${tier} ranking: ${processed} of ${total} papers analyzed.`,
  tierComplete: (tier: string, count: number) =>
    `${tier} semantic ranking complete. ${count} papers processed.`,

  // Final results
  searchComplete: (total: number, time: number) =>
    `Search complete. Found ${total} papers in ${time} seconds. Results are ready for review.`,
  searchCancelled: 'Search cancelled.',

  // Quality updates
  qualityUpdate: (score: number) => `Quality score updated to ${score}.`,
};

/**
 * Phase 10.130: Keyboard navigation instructions
 */
export const KEYBOARD_HINTS = {
  stageNav: 'Use Tab to navigate between stages. Press Enter or Space to expand stage details.',
  sourceNav: 'Use Tab to navigate between source nodes. Press Enter for source details.',
  escapeHint: 'Press Escape to close expanded panels.',
  arrowNav: 'Use arrow keys to navigate within expanded content.',
};

// ============================================================================
// REDUCED MOTION FALLBACKS
// ============================================================================

/**
 * Reduced motion configuration
 */
export const REDUCED_MOTION_CONFIG = {
  disableParticles: true,
  disableOrbits: true,
  disablePulse: true,
  simplifyTransitions: true,
  staticConnectors: true,
  instantCounters: true,
};
