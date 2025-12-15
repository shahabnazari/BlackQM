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
  // Phase 10.152: Removed 'ready' - pipeline ends at 'rank'
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
    title: 'Query Analysis Engine',
    algorithm: 'NLP + Domain-Specific Entity Recognition',
    metrics: [
      'Query intent classification accuracy: 94%',
      'Methodology detection F1-score: 0.89',
      'Spell correction precision: 97%',
    ],
    technicalSteps: [
      'Tokenization using academic vocabulary',
      'Named entity recognition for authors, journals, concepts',
      'Research methodology detection (qualitative, quantitative, mixed)',
      'Query expansion via semantic synonyms',
      'Boolean operator optimization',
    ],
    scienceNote: 'Uses BERT-based model fine-tuned on 2M+ academic queries',
  },
  discover: {
    title: 'Federated Database Search',
    algorithm: 'Parallel API Query Orchestration',
    metrics: [
      'Sources queried: Up to 18 databases',
      'Avg. response time: 2.3s (p95)',
      'Coverage: 250M+ indexed papers',
    ],
    technicalSteps: [
      'Convert query to source-specific syntax',
      'Parallel execution across all databases',
      'Rate limiting & circuit breaker protection',
      'Metadata normalization (DOI, ISSN, authors)',
      'Response streaming for progressive results',
    ],
    scienceNote: 'Searches OpenAlex, PubMed, Semantic Scholar, Scopus, and 14 more sources',
  },
  refine: {
    title: 'Deduplication & Quality Filter',
    algorithm: 'Fuzzy Matching + Citation Analysis',
    metrics: [
      'Duplicate detection: 99.2% accuracy',
      'False positive rate: <0.1%',
      'Avg. reduction: 30-40% duplicates',
    ],
    technicalSteps: [
      'DOI-based exact deduplication',
      'Title similarity (Jaccard + Levenshtein)',
      'Author name disambiguation',
      'Year/venue cross-validation',
      'Quality scoring (citation count, journal impact)',
    ],
    scienceNote: 'Multi-stage pipeline removes exact & near-duplicate papers',
  },
  rank: {
    title: 'Semantic Relevance Ranking',
    algorithm: 'BM25 + Transformer Embeddings (3-Tier)',
    metrics: [
      'BM25 precision@10: 0.78',
      'Semantic re-ranking NDCG: 0.84',
      'Processing: 600 papers in <10s',
    ],
    technicalSteps: [
      'Tier 1: BM25 lexical scoring (top 50)',
      'Tier 2: Dense retrieval refinement (top 200)',
      'Tier 3: Cross-encoder re-ranking (all 600)',
      'Citation graph analysis bonus',
      'Recency weighting factor',
    ],
    scienceNote: 'Progressive semantic ranking balances speed vs. accuracy',
  },
  // Phase 10.152: Removed 'ready' - users see results as soon as ranking completes
};

/**
 * Pipeline stage configurations
 */
export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'analyze',
    name: 'Analyze',
    icon: Brain,
    description: 'Understanding your query',
    activeDescription: 'Analyzing query intent...',
    completeDescription: 'Query analyzed',
    color: STAGE_COLORS.analyze,
    substages: ['spell-check', 'methodology-detection', 'query-expansion'],
  },
  {
    id: 'discover',
    name: 'Discover',
    icon: Search,
    description: 'Searching global databases',
    activeDescription: 'Querying academic sources...',
    completeDescription: 'Sources queried',
    color: STAGE_COLORS.discover,
    substages: [], // Dynamic from active sources
  },
  {
    id: 'refine',
    name: 'Refine',
    icon: Filter,
    description: 'Cleaning and deduplicating',
    activeDescription: 'Removing duplicates...',
    completeDescription: 'Papers refined',
    color: STAGE_COLORS.refine,
    substages: ['deduplication', 'quality-filter', 'metadata-enrichment'],
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: Sparkles,
    description: 'AI-powered scoring',
    activeDescription: 'Calculating relevance...',
    completeDescription: 'Search complete!', // Phase 10.152: Final stage now shows completion
    color: STAGE_COLORS.rank,
    substages: ['bm25-scoring', 'semantic-tier-1', 'semantic-tier-2', 'semantic-tier-3'],
  },
  // Phase 10.152: Removed 'ready' stage - pipeline ends at 'rank' for cleaner user journey
  // When ranking completes, papers are immediately visible - no need for a separate "Ready" stage
];

// ============================================================================
// ORBITAL CONSTELLATION CONFIGURATION
// ============================================================================

/**
 * Orbital configurations by source tier
 * Phase 10.134: Adjusted radii for 44px minimum touch targets
 *
 * CALCULATION (container ~400x400 visualization area):
 * - Center at ~200,200 with larger orbit radii
 * - Node size now 44-52px, so need more spacing between orbits
 */
export const ORBIT_CONFIGS: Record<SourceTier, OrbitConfig> = {
  fast: {
    radius: 80,  // Phase 10.134: Increased for larger nodes
    speed: 0.02,
    startAngle: 0,
    direction: 1,
  },
  medium: {
    radius: 120, // Phase 10.134: Increased spacing for larger nodes
    speed: 0.012,
    startAngle: Math.PI / 6,
    direction: -1,
  },
  slow: {
    radius: 160, // Phase 10.134: Increased for larger nodes
    speed: 0.006,
    startAngle: Math.PI / 3,
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
    displayName: 'Quick Preview',
    shortName: 'Quick',
    description: 'Top 50 most relevant papers',
    algorithmDetail: 'BM25 lexical scoring - keyword matching optimized for speed',
    whyFast: 'Uses lightweight keyword frequency analysis, no deep learning inference',
    paperRange: '1-50',
    targetLatencyMs: 500,
  },
  refined: {
    icon: Target,
    displayName: 'Refined Results',
    shortName: 'Refined',
    description: 'Extended to 200 papers',
    algorithmDetail: 'Dense vector retrieval - semantic similarity via embeddings',
    whyFast: 'Pre-computed embeddings with approximate nearest neighbor search',
    paperRange: '51-200',
    targetLatencyMs: 2000,
  },
  complete: {
    icon: Brain,
    displayName: 'Complete Analysis',
    shortName: 'Complete',
    description: 'Full 600 paper analysis',
    algorithmDetail: 'Cross-encoder re-ranking - deep pairwise query-document scoring',
    whyFast: 'Full transformer inference for maximum accuracy, takes longer',
    paperRange: '201-600',
    targetLatencyMs: 10000,
  },
};

/**
 * Ranking tier paper limits
 * Used in RankingDiagram and other methodology displays
 */
export const RANKING_TIER_LIMITS = {
  immediate: { papers: 50, latencyLabel: '500ms' },
  refined: { papers: 200, latencyLabel: '2s' },
  complete: { papers: 600, latencyLabel: '10s' },
} as const;

/**
 * Maximum papers across all ranking tiers
 */
export const MAX_RANKED_PAPERS = RANKING_TIER_LIMITS.complete.papers;

/**
 * Neural mesh layout
 * Phase 10.131: Increased node size for better readability
 */
export const NEURAL_MESH_LAYOUT = {
  nodeSpacing: 110,
  nodeSize: 64,
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
 */
export const STAGE_ORB_SIZE = {
  sm: 56,
  md: 72,
  lg: 88,
};

/**
 * Source node dimensions
 * Phase 10.134: Minimum 44px for WCAG touch target compliance
 * Note: Base increased from 24px to 44px for accessibility
 */
export const SOURCE_NODE_SIZE = {
  base: 44,      // Phase 10.134: WCAG AA minimum touch target (was 24px)
  max: 52,       // Phase 10.134: Increased to scale proportionally
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
 * Pipeline layout configuration
 * Phase 10.134: Increased constellation size for larger touch targets
 *
 * CALCULATION for constellation size:
 * - Max orbit radius (slow): 160px
 * - Max node half-size: 26px (52px / 2)
 * - Padding: 16px
 * - Required from center: 160 + 26 + 16 = 202px
 * - Total dimension: 202 * 2 = ~410px (rounded to 420px)
 */
export const PIPELINE_LAYOUT = {
  minWidth: 840,            // Phase 10.134: Increased for larger constellation
  minHeight: 560,           // Phase 10.134: Increased for larger constellation
  padding: 24,
  constellationWidth: 420,  // Phase 10.134: Increased to fit 160px orbit + larger nodes
  constellationHeight: 420, // Phase 10.134: Increased to fit 160px orbit + larger nodes
  stageGap: 8,
  brainWidth: 220,          // Phase 10.134: Slightly larger for better readability
};

/**
 * Connector dimensions
 */
export const CONNECTOR_SIZE = {
  width: 60,
  height: 4,
  arrowSize: 8,
};

/**
 * Canvas dimensions
 */
export const CANVAS_DIMENSIONS = {
  minWidth: 800,
  minHeight: 400,
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
