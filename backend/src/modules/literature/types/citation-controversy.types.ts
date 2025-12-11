/**
 * Phase 10.113 Week 4: Citation-Based Controversy Analysis Types
 *
 * Netflix-grade types for identifying controversial papers through citation patterns.
 * Integrates with Theme-Fit scoring and hierarchical theme extraction.
 *
 * Key concepts:
 * - Citation Controversy Index (CCI): Measures how controversial a paper is based on citations
 * - Debate Papers: Papers cited heavily by opposing camps
 * - Citation Camps: Groups of papers that cite each other but not the opposing group
 */

// ============================================================================
// CITATION ANALYSIS CONFIGURATION
// ============================================================================

/**
 * Configuration for citation controversy analysis
 */
export interface CitationControversyConfig {
  /** Minimum citations to consider a paper for controversy analysis */
  readonly minCitationsForAnalysis: number;
  /** Threshold for considering citation velocity "high" (citations per year) */
  readonly highVelocityThreshold: number;
  /** Minimum papers in each camp to detect a debate */
  readonly minPapersPerCamp: number;
  /** Threshold for Citation Controversy Index to flag as controversial (0-1) */
  readonly controversyThreshold: number;
  /** Weight for cross-camp citations in CCI calculation */
  readonly crossCampWeight: number;
  /** Weight for citation velocity in CCI calculation */
  readonly velocityWeight: number;
  /** Maximum age of papers to include in controversy analysis (years) */
  readonly maxPaperAge: number;
}

/**
 * Default configuration for citation controversy analysis
 * Based on bibliometric research best practices
 */
export const DEFAULT_CITATION_CONTROVERSY_CONFIG: Readonly<CitationControversyConfig> = {
  minCitationsForAnalysis: 5,
  highVelocityThreshold: 10, // 10+ citations per year
  minPapersPerCamp: 3,
  controversyThreshold: 0.6,
  crossCampWeight: 0.6,
  velocityWeight: 0.4,
  maxPaperAge: 20,
} as const;

// ============================================================================
// CITATION CAMP TYPES
// ============================================================================

/**
 * A "camp" of papers that share similar citation patterns
 * Papers in the same camp tend to cite each other and share viewpoints
 */
export interface CitationCamp {
  /** Unique identifier for this camp */
  readonly id: string;
  /** Human-readable label for the camp's position */
  readonly label: string;
  /** Brief description of the camp's stance */
  readonly description: string;
  /** Paper IDs belonging to this camp */
  readonly paperIds: readonly string[];
  /** Key papers that define this camp's position */
  readonly keyPaperIds: readonly string[];
  /** Average citation count within this camp */
  readonly avgCitationCount: number;
  /** Internal cohesion score (how much papers in this camp cite each other) */
  readonly internalCohesion: number;
  /** Keywords associated with this camp's papers */
  readonly keywords: readonly string[];
  /** Stance indicators extracted from abstracts */
  readonly stanceIndicators: readonly string[];
}

/**
 * A mutable version of CitationCamp for internal processing
 */
export interface MutableCitationCamp extends Omit<CitationCamp, 'paperIds' | 'keyPaperIds' | 'keywords' | 'stanceIndicators'> {
  paperIds: string[];
  keyPaperIds: string[];
  keywords: string[];
  stanceIndicators: string[];
}

// ============================================================================
// DEBATE PAPER TYPES
// ============================================================================

/**
 * A "debate paper" - cited significantly by multiple opposing camps
 * These papers often represent foundational work or bridging perspectives
 */
export interface DebatePaper {
  /** Paper ID */
  readonly paperId: string;
  /** Paper title */
  readonly title: string;
  /** Total citation count */
  readonly citationCount: number;
  /** Citations from each camp */
  readonly citationsByCamp: readonly CampCitation[];
  /** Debate Paper Score: how evenly cited across camps (0-1, higher = more balanced) */
  readonly debateScore: number;
  /** Whether this paper bridges opposing viewpoints */
  readonly isBridgingPaper: boolean;
  /** Classification of the paper's role in the debate */
  readonly debateRole: DebatePaperRole;
}

/**
 * Citation information from a specific camp
 */
export interface CampCitation {
  /** Camp ID */
  readonly campId: string;
  /** Camp label */
  readonly campLabel: string;
  /** Number of citations from this camp */
  readonly citationCount: number;
  /** Percentage of this camp's papers that cite this paper */
  readonly citationPercentage: number;
}

/**
 * Classification of a paper's role in a debate
 */
export enum DebatePaperRole {
  /** Foundational paper cited by all sides */
  FOUNDATIONAL = 'FOUNDATIONAL',
  /** Bridge paper that connects opposing viewpoints */
  BRIDGE = 'BRIDGE',
  /** Contested paper with disputed interpretations */
  CONTESTED = 'CONTESTED',
  /** Catalyst paper that sparked the debate */
  CATALYST = 'CATALYST',
  /** Neutral methodology paper used by all sides */
  METHODOLOGY = 'METHODOLOGY',
}

// ============================================================================
// CITATION CONTROVERSY INDEX
// ============================================================================

/**
 * Citation Controversy Index (CCI) for a paper
 * Measures how controversial a paper is based on citation patterns
 */
export interface CitationControversyIndex {
  /** Paper ID */
  readonly paperId: string;
  /** Overall CCI score (0-1, higher = more controversial) */
  readonly score: number;
  /** Component scores that make up the CCI */
  readonly components: CitationControversyComponents;
  /** Human-readable explanation of the score */
  readonly explanation: string;
  /** Controversy classification */
  readonly classification: ControversyClassification;
  /** Camps that cite this paper */
  readonly citingCamps: readonly string[];
  /** Whether this paper is a debate paper */
  readonly isDebatePaper: boolean;
}

/**
 * Component scores for Citation Controversy Index calculation
 */
export interface CitationControversyComponents {
  /** Cross-camp citation score (cited by opposing camps) */
  readonly crossCampScore: number;
  /** Citation velocity score (rapid citation accumulation) */
  readonly velocityScore: number;
  /** Polarization score (uneven distribution across camps) */
  readonly polarizationScore: number;
  /** Recency score (recent papers in active debates) */
  readonly recencyScore: number;
  /** Self-citation exclusion factor */
  readonly selfCitationPenalty: number;
}

/**
 * Classification of controversy level
 */
export enum ControversyClassification {
  /** Very low controversy (CCI < 0.2) */
  CONSENSUS = 'CONSENSUS',
  /** Low controversy (0.2 <= CCI < 0.4) */
  MINOR_DEBATE = 'MINOR_DEBATE',
  /** Moderate controversy (0.4 <= CCI < 0.6) */
  ACTIVE_DEBATE = 'ACTIVE_DEBATE',
  /** High controversy (0.6 <= CCI < 0.8) */
  MAJOR_CONTROVERSY = 'MAJOR_CONTROVERSY',
  /** Very high controversy (CCI >= 0.8) */
  POLARIZED = 'POLARIZED',
}

// ============================================================================
// CONTROVERSY ANALYSIS RESULT
// ============================================================================

/**
 * Result of citation controversy analysis for a topic/theme
 */
export interface CitationControversyAnalysis {
  /** Topic or theme being analyzed */
  readonly topic: string;
  /** Description of the controversy */
  readonly description: string;
  /** Identified citation camps */
  readonly camps: readonly CitationCamp[];
  /** Debate papers (cited by multiple camps) */
  readonly debatePapers: readonly DebatePaper[];
  /** Citation Controversy Index for all analyzed papers */
  readonly paperCCIs: readonly CitationControversyIndex[];
  /** Overall controversy score for the topic (0-1) */
  readonly topicControversyScore: number;
  /** Quality metrics for the analysis */
  readonly qualityMetrics: ControversyQualityMetrics;
  /** Analysis metadata */
  readonly metadata: ControversyAnalysisMetadata;
}

/**
 * Quality metrics for controversy analysis
 */
export interface ControversyQualityMetrics {
  /** Number of papers analyzed */
  readonly papersAnalyzed: number;
  /** Number of camps identified */
  readonly campsIdentified: number;
  /** Number of debate papers found */
  readonly debatePapersFound: number;
  /** Average camp cohesion */
  readonly avgCampCohesion: number;
  /** Camp separation score (how distinct are the camps) */
  readonly campSeparation: number;
  /** Coverage (percentage of papers assigned to camps) */
  readonly coverage: number;
}

/**
 * Metadata about the controversy analysis
 */
export interface ControversyAnalysisMetadata {
  /** When the analysis was performed */
  readonly timestamp: Date;
  /** Processing time in milliseconds */
  readonly processingTimeMs: number;
  /** Configuration used for analysis */
  readonly config: CitationControversyConfig;
  /** Any warnings or notes about the analysis */
  readonly warnings: readonly string[];
}

// ============================================================================
// PAPER INPUT FOR CONTROVERSY ANALYSIS
// ============================================================================

/**
 * Paper input for citation controversy analysis
 */
export interface CitationAnalysisPaperInput {
  /** Unique paper ID */
  readonly id: string;
  /** Paper title */
  readonly title: string;
  /** Paper abstract */
  readonly abstract?: string;
  /** Publication year */
  readonly year: number;
  /** Total citation count */
  readonly citationCount: number;
  /** IDs of papers this paper cites */
  readonly references?: readonly string[];
  /** IDs of papers that cite this paper */
  readonly citedBy?: readonly string[];
  /** Paper keywords */
  readonly keywords?: readonly string[];
  /** Pre-computed embedding for similarity calculations */
  readonly embedding?: readonly number[];
  /** Theme-fit score from Week 2 */
  readonly themeFitScore?: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Enhanced paper with citation controversy data
 * Used for integration with Theme-Fit scoring
 */
export interface PaperWithControversy {
  /** Base paper data */
  readonly id: string;
  readonly title: string;
  readonly abstract?: string;
  readonly year: number;
  readonly citationCount: number;
  /** Citation Controversy Index */
  readonly cci: CitationControversyIndex;
  /** Camp membership (if any) */
  readonly campId?: string;
  /** Debate paper status */
  readonly isDebatePaper: boolean;
  /** Debate paper role (if applicable) */
  readonly debateRole?: DebatePaperRole;
}

/**
 * Progress callback for controversy analysis
 */
export type ControversyProgressCallback = (
  stage: ControversyAnalysisStage,
  progress: number,
  message: string,
) => void;

/**
 * Stages of controversy analysis
 */
export enum ControversyAnalysisStage {
  INITIALIZING = 'INITIALIZING',
  BUILDING_CITATION_GRAPH = 'BUILDING_CITATION_GRAPH',
  DETECTING_CAMPS = 'DETECTING_CAMPS',
  CALCULATING_CCI = 'CALCULATING_CCI',
  IDENTIFYING_DEBATE_PAPERS = 'IDENTIFYING_DEBATE_PAPERS',
  GENERATING_LABELS = 'GENERATING_LABELS',
  QUALITY_ANALYSIS = 'QUALITY_ANALYSIS',
  COMPLETE = 'COMPLETE',
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for CitationCamp
 */
export function isCitationCamp(obj: unknown): obj is CitationCamp {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'label' in obj &&
    'paperIds' in obj &&
    Array.isArray((obj as CitationCamp).paperIds)
  );
}

/**
 * Type guard for DebatePaper
 */
export function isDebatePaper(obj: unknown): obj is DebatePaper {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'paperId' in obj &&
    'debateScore' in obj &&
    'citationsByCamp' in obj &&
    Array.isArray((obj as DebatePaper).citationsByCamp)
  );
}

/**
 * Type guard for CitationControversyIndex
 */
export function isCitationControversyIndex(obj: unknown): obj is CitationControversyIndex {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'paperId' in obj &&
    'score' in obj &&
    'components' in obj &&
    'classification' in obj
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get controversy classification from CCI score
 */
export function getControversyClassification(score: number): ControversyClassification {
  if (score < 0.2) return ControversyClassification.CONSENSUS;
  if (score < 0.4) return ControversyClassification.MINOR_DEBATE;
  if (score < 0.6) return ControversyClassification.ACTIVE_DEBATE;
  if (score < 0.8) return ControversyClassification.MAJOR_CONTROVERSY;
  return ControversyClassification.POLARIZED;
}

/**
 * Get human-readable label for controversy classification
 */
export function getControversyLabel(classification: ControversyClassification): string {
  const labels: Record<ControversyClassification, string> = {
    [ControversyClassification.CONSENSUS]: 'Consensus',
    [ControversyClassification.MINOR_DEBATE]: 'Minor Debate',
    [ControversyClassification.ACTIVE_DEBATE]: 'Active Debate',
    [ControversyClassification.MAJOR_CONTROVERSY]: 'Major Controversy',
    [ControversyClassification.POLARIZED]: 'Highly Polarized',
  };
  return labels[classification];
}

/**
 * Get human-readable label for debate paper role
 */
export function getDebatePaperRoleLabel(role: DebatePaperRole): string {
  const labels: Record<DebatePaperRole, string> = {
    [DebatePaperRole.FOUNDATIONAL]: 'Foundational Work',
    [DebatePaperRole.BRIDGE]: 'Bridging Perspectives',
    [DebatePaperRole.CONTESTED]: 'Contested Interpretations',
    [DebatePaperRole.CATALYST]: 'Debate Catalyst',
    [DebatePaperRole.METHODOLOGY]: 'Shared Methodology',
  };
  return labels[role];
}
