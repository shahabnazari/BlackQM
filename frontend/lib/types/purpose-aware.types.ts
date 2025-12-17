/**
 * Phase 10.170: Purpose-Aware Pipeline Types (Frontend)
 *
 * TypeScript type definitions for purpose-aware paper fetching and
 * theme extraction. Mirrors backend types for type safety.
 *
 * @module purpose-aware.types
 * @since Phase 10.170
 */

// ============================================================================
// RESEARCH PURPOSE ENUM
// ============================================================================

/**
 * Research purposes supported by the system
 *
 * Must match backend enum values exactly.
 */
export enum ResearchPurpose {
  Q_METHODOLOGY = 'q_methodology',
  QUALITATIVE_ANALYSIS = 'qualitative_analysis',
  LITERATURE_SYNTHESIS = 'literature_synthesis',
  HYPOTHESIS_GENERATION = 'hypothesis_generation',
  SURVEY_CONSTRUCTION = 'survey_construction',
}

/**
 * Array of all valid research purposes
 */
export const RESEARCH_PURPOSES = Object.values(ResearchPurpose) as readonly ResearchPurpose[];

/**
 * Type guard for ResearchPurpose enum
 */
export function isValidResearchPurpose(value: unknown): value is ResearchPurpose {
  return typeof value === 'string' && RESEARCH_PURPOSES.includes(value as ResearchPurpose);
}

// ============================================================================
// CONTENT PRIORITY
// ============================================================================

/**
 * Content priority levels for full-text requirements
 */
export type ContentPriority = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Paper limits configuration
 */
export interface PaperLimits {
  min: number;
  target: number;
  max: number;
}

/**
 * Quality weights configuration
 */
export interface QualityWeights {
  content: number;
  citation: number;
  journal: number;
  methodology: number;
  diversity?: number;
}

/**
 * Full-text requirement configuration
 */
export interface FullTextRequirement {
  minRequired: number;
  strictRequirement: boolean;
  fullTextBoost: number;
}

/**
 * Validation thresholds for theme extraction
 */
export interface ValidationThresholds {
  minSources: number;
  minCoherence: number;
  minDistinctiveness: number;
}

/**
 * Target theme count range
 */
export interface TargetThemes {
  min: number;
  max: number;
}

// ============================================================================
// PURPOSE METADATA
// ============================================================================

/**
 * Human-readable metadata for research purposes
 */
export interface PurposeMetadata {
  purpose: ResearchPurpose;
  displayName: string;
  description: string;
  scientificFoundation: string;
  characteristics: readonly string[];
  useCases: readonly string[];
}

/**
 * Purpose metadata for all research purposes
 */
export const PURPOSE_METADATA: Readonly<Record<ResearchPurpose, PurposeMetadata>> = {
  [ResearchPurpose.Q_METHODOLOGY]: {
    purpose: ResearchPurpose.Q_METHODOLOGY,
    displayName: 'Q-Methodology',
    description: 'Generate diverse statements for Q-sort concourse development',
    scientificFoundation: 'Stephenson (1953), Brown (1980)',
    characteristics: [
      'Breadth-focused (500-800 papers)',
      'Zero journal weight (avoid mainstream bias)',
      'Diversity tracking enabled',
      'Abstracts sufficient',
    ],
    useCases: [
      'Q-sort statement generation',
      'Concourse development',
      'Subjectivity research',
    ],
  },
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: {
    purpose: ResearchPurpose.QUALITATIVE_ANALYSIS,
    displayName: 'Qualitative Analysis',
    description: 'Extract themes until data saturation',
    scientificFoundation: 'Braun & Clarke (2019)',
    characteristics: [
      'Saturation-driven (50-200 papers)',
      'Content-first filtering',
      'Full-text preferred',
      'Moderate quality threshold',
    ],
    useCases: [
      'Thematic analysis',
      'Phenomenological research',
      'Grounded coding',
    ],
  },
  [ResearchPurpose.LITERATURE_SYNTHESIS]: {
    purpose: ResearchPurpose.LITERATURE_SYNTHESIS,
    displayName: 'Literature Synthesis',
    description: 'Comprehensive coverage of research landscape',
    scientificFoundation: 'Noblit & Hare (1988)',
    characteristics: [
      'Comprehensive (400-500 papers)',
      'High quality threshold',
      'Full-text required',
      'Journal prestige matters',
    ],
    useCases: [
      'Systematic reviews',
      'Meta-ethnography',
      'Research mapping',
    ],
  },
  [ResearchPurpose.HYPOTHESIS_GENERATION]: {
    purpose: ResearchPurpose.HYPOTHESIS_GENERATION,
    displayName: 'Hypothesis Generation',
    description: 'Build theory from conceptual themes',
    scientificFoundation: 'Glaser & Strauss (1967)',
    characteristics: [
      'Theory-focused (100-300 papers)',
      'Full-text preferred',
      'Iterative sampling',
      'Gap identification',
    ],
    useCases: [
      'Theory building',
      'Grounded theory',
      'Conceptual development',
    ],
  },
  [ResearchPurpose.SURVEY_CONSTRUCTION]: {
    purpose: ResearchPurpose.SURVEY_CONSTRUCTION,
    displayName: 'Survey Construction',
    description: 'Extract validated constructs for measurement scales',
    scientificFoundation: 'Churchill (1979), DeVellis (2016)',
    characteristics: [
      'Construct-focused (100-200 papers)',
      'Psychometric rigor',
      'Full-text preferred',
      'High distinctiveness required',
    ],
    useCases: [
      'Scale development',
      'Questionnaire design',
      'Construct operationalization',
    ],
  },
};

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Purpose-aware search request
 */
export interface PurposeAwareSearchRequest {
  query: string;
  purpose: ResearchPurpose;
  paperLimitsOverride?: Partial<PaperLimits>;
  qualityThresholdOverride?: number;
  forceFullText?: boolean;
  fullTextBoost?: number;
  sources?: string[];
  yearFrom?: number;
  yearTo?: number;
  sortOption?: 'relevance' | 'citations' | 'date' | 'quality';
}

/**
 * Purpose configuration response
 */
export interface PurposeConfigResponse {
  purpose: ResearchPurpose;
  displayName: string;
  scientificMethod: string;
  paperLimits: PaperLimits;
  qualityWeights: QualityWeights;
  initialThreshold: number;
  contentPriority: ContentPriority;
  fullTextRequired: boolean;
  diversityRequired: boolean;
  targetThemesMin: number;
  targetThemesMax: number;
}

/**
 * Diversity metrics response
 */
export interface DiversityMetrics {
  uniquePerspectives: number;
  entropyScore: number;
  giniCoefficient: number;
  underrepresentedPerspectives: readonly string[];
}

/**
 * Purpose-aware search result
 */
export interface PurposeAwareSearchResult {
  purpose: ResearchPurpose;
  totalFetched: number;
  qualifiedPapers: number;
  fullTextCount: number;
  actualThreshold: number;
  diversityMetrics?: DiversityMetrics;
  processingTimeMs: number;
  hasOverrides?: boolean;
  appliedOverrides?: string[];
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name for a purpose
 */
export function getPurposeDisplayName(purpose: ResearchPurpose): string {
  return PURPOSE_METADATA[purpose]?.displayName ?? purpose;
}

/**
 * Get description for a purpose
 */
export function getPurposeDescription(purpose: ResearchPurpose): string {
  return PURPOSE_METADATA[purpose]?.description ?? '';
}

/**
 * Get characteristics for a purpose
 */
export function getPurposeCharacteristics(purpose: ResearchPurpose): readonly string[] {
  return PURPOSE_METADATA[purpose]?.characteristics ?? [];
}

/**
 * Get use cases for a purpose
 */
export function getPurposeUseCases(purpose: ResearchPurpose): readonly string[] {
  return PURPOSE_METADATA[purpose]?.useCases ?? [];
}

/**
 * Get scientific foundation for a purpose
 */
export function getPurposeScientificFoundation(purpose: ResearchPurpose): string {
  return PURPOSE_METADATA[purpose]?.scientificFoundation ?? '';
}

// ============================================================================
// CONTENT PRIORITY HELPERS
// ============================================================================

/**
 * Content priority colors for UI
 */
export const CONTENT_PRIORITY_COLORS: Record<ContentPriority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-amber-500',
  critical: 'text-red-500',
};

/**
 * Content priority labels for UI
 */
export const CONTENT_PRIORITY_LABELS: Record<ContentPriority, string> = {
  low: 'Abstract sufficient',
  medium: 'Extended abstract',
  high: 'Full-text preferred',
  critical: 'Full-text required',
};

/**
 * Get content priority color
 */
export function getContentPriorityColor(priority: ContentPriority): string {
  return CONTENT_PRIORITY_COLORS[priority] ?? 'text-gray-500';
}

/**
 * Get content priority label
 */
export function getContentPriorityLabel(priority: ContentPriority): string {
  return CONTENT_PRIORITY_LABELS[priority] ?? priority;
}

// ============================================================================
// PURPOSE SELECTION HELPERS
// ============================================================================

/**
 * Get all purposes as select options
 */
export function getPurposeSelectOptions(): Array<{
  value: ResearchPurpose;
  label: string;
  description: string;
}> {
  return RESEARCH_PURPOSES.map(purpose => ({
    value: purpose,
    label: PURPOSE_METADATA[purpose].displayName,
    description: PURPOSE_METADATA[purpose].description,
  }));
}

/**
 * Default purpose for new searches
 */
export const DEFAULT_PURPOSE = ResearchPurpose.QUALITATIVE_ANALYSIS;
