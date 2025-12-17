/**
 * Phase 10.170 Week 4+: Specialized Pipeline Types
 *
 * Enterprise-grade type definitions for Literature Synthesis (Meta-ethnography)
 * and Hypothesis Generation (Grounded Theory) pipelines.
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Meta-ethnography: Noblit & Hare (1988)
 * - Grounded Theory: Glaser & Strauss (1967), Strauss & Corbin (1998)
 *
 * SECURITY:
 * - Critical #10: Two-stage filter (immutable copy)
 * - Critical #11: Theoretical sampling (infinite loop guards)
 * - Critical #12: Constant comparison (O(n²) optimization)
 *
 * @module specialized-pipeline.types
 * @since Phase 10.170 Week 4+
 */

import { ResearchPurpose } from './purpose-aware.types';
import type { InitialCode, CandidateTheme, SourceContent } from './unified-theme-extraction.types';

// ============================================================================
// TWO-STAGE FILTER TYPES (Critical #10)
// ============================================================================

/**
 * Content eligibility result from Stage 1 filtering
 */
export interface ContentEligibilityResult {
  /** Papers that passed content eligibility */
  readonly eligible: readonly PaperForFilter[];
  /** Papers that failed content eligibility */
  readonly rejected: readonly PaperForFilter[];
  /** Rejection reasons per paper ID */
  readonly rejectionReasons: ReadonlyMap<string, string>;
  /** Filter execution time (ms) */
  readonly durationMs: number;
}

/**
 * Quality filter result from Stage 2 filtering
 */
export interface QualityFilterResult {
  /** Papers that passed quality threshold */
  readonly qualified: readonly PaperForFilter[];
  /** Papers that failed quality threshold */
  readonly disqualified: readonly PaperForFilter[];
  /** Quality scores per paper ID */
  readonly qualityScores: ReadonlyMap<string, number>;
  /** Threshold used */
  readonly threshold: number;
  /** Filter execution time (ms) */
  readonly durationMs: number;
}

/**
 * Complete two-stage filter result
 */
export interface TwoStageFilterResult {
  /** Stage 1: Content eligibility result */
  readonly contentStage: ContentEligibilityResult;
  /** Stage 2: Quality filter result */
  readonly qualityStage: QualityFilterResult;
  /** Final papers passing both stages */
  readonly finalPapers: readonly PaperForFilter[];
  /** Total filter execution time (ms) */
  readonly totalDurationMs: number;
  /** Filter statistics */
  readonly stats: TwoStageFilterStats;
}

/**
 * Two-stage filter statistics
 */
export interface TwoStageFilterStats {
  /** Total input papers */
  readonly inputCount: number;
  /** Papers passing content stage */
  readonly contentPassCount: number;
  /** Papers passing quality stage */
  readonly qualityPassCount: number;
  /** Final pass rate (0-1) */
  readonly finalPassRate: number;
  /** Content rejection rate (0-1) */
  readonly contentRejectionRate: number;
  /** Quality rejection rate (0-1) */
  readonly qualityRejectionRate: number;
}

/**
 * Paper interface for filtering (minimal required fields)
 */
export interface PaperForFilter {
  readonly id: string;
  readonly title: string;
  readonly abstract: string | null;
  readonly doi: string | null;
  readonly year: number | null;
  readonly citationCount: number | null;
  readonly venue: string | null;
  readonly hasFullText: boolean;
  readonly qualityScore?: number;
}

// ============================================================================
// CONSTANT COMPARISON TYPES (Critical #12)
// ============================================================================

/**
 * Comparison result between two codes
 */
export interface CodeComparisonResult {
  /** First code ID */
  readonly codeAId: string;
  /** Second code ID */
  readonly codeBId: string;
  /** Similarity score (0-1) */
  readonly similarity: number;
  /** Whether codes should be merged */
  readonly shouldMerge: boolean;
  /** Relationship type */
  readonly relationship: CodeRelationship;
  /** Comparison timestamp */
  readonly comparedAt: number;
}

/**
 * Code relationship types for grounded theory
 */
export type CodeRelationship =
  | 'identical'      // Same concept, merge immediately
  | 'similar'        // Related concept, consider merging
  | 'related'        // Connected but distinct
  | 'contrasting'    // Opposing perspectives
  | 'independent';   // No meaningful relationship

/**
 * Constant comparison batch result
 */
export interface ConstantComparisonBatchResult {
  /** All comparisons performed */
  readonly comparisons: readonly CodeComparisonResult[];
  /** Suggested merge groups */
  readonly mergeGroups: readonly CodeMergeGroup[];
  /** Codes that should remain independent */
  readonly independentCodes: readonly string[];
  /** Execution time (ms) */
  readonly durationMs: number;
  /** Cache statistics */
  readonly cacheStats: ComparisonCacheStats;
}

/**
 * Group of codes to be merged
 */
export interface CodeMergeGroup {
  /** Codes in this merge group */
  readonly codeIds: readonly string[];
  /** Suggested merged label */
  readonly suggestedLabel: string;
  /** Average internal similarity */
  readonly internalSimilarity: number;
  /** Merge confidence (0-1) */
  readonly confidence: number;
}

/**
 * Comparison cache statistics
 */
export interface ComparisonCacheStats {
  /** Total cache size */
  readonly size: number;
  /** Cache hits */
  readonly hits: number;
  /** Cache misses */
  readonly misses: number;
  /** Hit rate (0-1) */
  readonly hitRate: number;
}

// ============================================================================
// THEORETICAL SAMPLING TYPES (Critical #11)
// ============================================================================

/**
 * Theoretical sampling state
 */
export interface TheoreticalSamplingState {
  /** Current sampling wave (1-indexed) */
  readonly wave: number;
  /** Papers collected so far */
  readonly papers: readonly PaperForFilter[];
  /** Concepts being explored */
  readonly concepts: readonly TheoreticalConcept[];
  /** Whether saturation has been reached */
  readonly saturationReached: boolean;
  /** Saturation metrics */
  readonly saturationMetrics: SaturationMetrics;
  /** Execution time (ms) */
  readonly durationMs: number;
}

/**
 * Theoretical concept being explored
 */
export interface TheoreticalConcept {
  /** Concept identifier */
  readonly id: string;
  /** Concept label */
  readonly label: string;
  /** Papers supporting this concept */
  readonly supportingPaperIds: readonly string[];
  /** Concept density (papers per wave) */
  readonly density: number;
  /** Whether concept is saturated */
  readonly isSaturated: boolean;
  /** First wave where concept appeared */
  readonly firstWave: number;
  /** Last wave with new evidence */
  readonly lastActiveWave: number;
}

/**
 * Saturation metrics for grounded theory
 */
export interface SaturationMetrics {
  /** New concepts discovered in last wave */
  readonly newConceptsLastWave: number;
  /** Concept growth rate (concepts per wave) */
  readonly conceptGrowthRate: number;
  /** Percentage of saturated concepts */
  readonly saturatedPercentage: number;
  /** Overall saturation score (0-1) */
  readonly overallSaturation: number;
  /** Waves since last new concept */
  readonly wavesSinceNewConcept: number;
}

/**
 * Theoretical sampling configuration
 */
export interface TheoreticalSamplingConfig {
  /** Maximum sampling waves */
  readonly maxWaves: number;
  /** Maximum total papers */
  readonly maxTotalPapers: number;
  /** Maximum execution time (ms) */
  readonly maxExecutionTimeMs: number;
  /** Papers per wave */
  readonly papersPerWave: number;
  /** Saturation threshold (waves without new concepts) */
  readonly saturationThreshold: number;
  /** Concept density threshold for saturation */
  readonly conceptDensityThreshold: number;
}

/**
 * Default theoretical sampling configuration
 * SECURITY (Critical #11): Infinite loop guards
 */
export const DEFAULT_THEORETICAL_SAMPLING_CONFIG: Readonly<TheoreticalSamplingConfig> = {
  maxWaves: 5,
  maxTotalPapers: 1000,
  maxExecutionTimeMs: 30 * 60 * 1000, // 30 minutes
  papersPerWave: 50,
  saturationThreshold: 2, // 2 waves without new concepts
  conceptDensityThreshold: 0.8, // 80% of concepts saturated
} as const;

// ============================================================================
// LITERATURE SYNTHESIS TYPES (Meta-ethnography)
// ============================================================================

/**
 * Meta-ethnography synthesis result
 */
export interface MetaEthnographyResult {
  /** Reciprocal translations (N-way theme comparisons) */
  readonly reciprocalTranslations: readonly ReciprocalTranslation[];
  /** Line-of-argument synthesis (consensus themes) */
  readonly lineOfArgument: LineOfArgumentSynthesis;
  /** Refutational synthesis (contradictory findings) */
  readonly refutationalSynthesis: RefutationalSynthesis;
  /** Final synthesized themes */
  readonly synthesizedThemes: readonly SynthesizedTheme[];
  /** Synthesis quality metrics */
  readonly qualityMetrics: SynthesisQualityMetrics;
  /** Execution time (ms) */
  readonly durationMs: number;
}

/**
 * Reciprocal translation between studies
 * N-way comparison of themes across studies
 */
export interface ReciprocalTranslation {
  /** Translation identifier */
  readonly id: string;
  /** Source study themes being translated */
  readonly sourceThemes: readonly ThemeReference[];
  /** Target study themes being compared */
  readonly targetThemes: readonly ThemeReference[];
  /** Translation mappings */
  readonly mappings: readonly ThemeMapping[];
  /** Translation confidence (0-1) */
  readonly confidence: number;
  /** Whether translation is reciprocal (bidirectional) */
  readonly isReciprocal: boolean;
}

/**
 * Reference to a theme from a specific study
 */
export interface ThemeReference {
  /** Study/paper identifier */
  readonly studyId: string;
  /** Theme identifier within study */
  readonly themeId: string;
  /** Theme label */
  readonly label: string;
  /** Theme description */
  readonly description: string;
}

/**
 * Mapping between themes in translation
 */
export interface ThemeMapping {
  /** Source theme reference */
  readonly source: ThemeReference;
  /** Target theme reference */
  readonly target: ThemeReference;
  /** Mapping type */
  readonly mappingType: ThemeMappingType;
  /** Similarity score (0-1) */
  readonly similarity: number;
  /** Evidence supporting mapping */
  readonly evidence: readonly string[];
}

/**
 * Theme mapping types in meta-ethnography
 */
export type ThemeMappingType =
  | 'direct'          // Direct conceptual match
  | 'analogous'       // Similar but distinct
  | 'refutational'    // Contradictory
  | 'partial'         // Partial overlap
  | 'hierarchical';   // Parent-child relationship

/**
 * Line-of-argument synthesis
 * Builds consensus themes across studies
 */
export interface LineOfArgumentSynthesis {
  /** Central argument/thesis */
  readonly centralArgument: string;
  /** Supporting themes */
  readonly supportingThemes: readonly ConsensusTheme[];
  /** Argument strength (0-1) */
  readonly strength: number;
  /** Studies contributing to argument */
  readonly contributingStudyIds: readonly string[];
  /** Evidence chain */
  readonly evidenceChain: readonly EvidenceLink[];
}

/**
 * Consensus theme from line-of-argument synthesis
 */
export interface ConsensusTheme {
  /** Theme identifier */
  readonly id: string;
  /** Theme label */
  readonly label: string;
  /** Theme description */
  readonly description: string;
  /** Studies supporting this theme */
  readonly supportingStudyCount: number;
  /** Consensus strength (0-1) */
  readonly consensusStrength: number;
  /** Contributing translations */
  readonly translationIds: readonly string[];
}

/**
 * Link in evidence chain
 */
export interface EvidenceLink {
  /** From theme/study */
  readonly from: string;
  /** To theme/study */
  readonly to: string;
  /** Link type */
  readonly linkType: 'supports' | 'extends' | 'contextualizes';
  /** Link strength (0-1) */
  readonly strength: number;
}

/**
 * Refutational synthesis
 * Identifies contradictory findings
 */
export interface RefutationalSynthesis {
  /** Identified contradictions */
  readonly contradictions: readonly Contradiction[];
  /** Possible explanations for contradictions */
  readonly explanations: readonly ContradictionExplanation[];
  /** Unresolved tensions */
  readonly unresolvedTensions: readonly string[];
  /** Refutation complexity score (0-1) */
  readonly complexityScore: number;
}

/**
 * Contradiction between studies
 */
export interface Contradiction {
  /** Contradiction identifier */
  readonly id: string;
  /** First position */
  readonly positionA: ContradictionPosition;
  /** Second position */
  readonly positionB: ContradictionPosition;
  /** Contradiction type */
  readonly type: ContradictionType;
  /** Severity (0-1) */
  readonly severity: number;
}

/**
 * Position in a contradiction
 */
export interface ContradictionPosition {
  /** Study identifier */
  readonly studyId: string;
  /** Claim/theme being contradicted */
  readonly claim: string;
  /** Evidence supporting position */
  readonly evidence: readonly string[];
}

/**
 * Types of contradictions
 */
export type ContradictionType =
  | 'direct'          // Direct opposition
  | 'methodological'  // Different methods led to different conclusions
  | 'contextual'      // Context-dependent differences
  | 'temporal';       // Time-dependent differences

/**
 * Explanation for contradiction
 */
export interface ContradictionExplanation {
  /** Contradiction being explained */
  readonly contradictionId: string;
  /** Explanation text */
  readonly explanation: string;
  /** Explanation type */
  readonly type: 'methodological' | 'contextual' | 'temporal' | 'definitional';
  /** Plausibility score (0-1) */
  readonly plausibility: number;
}

/**
 * Synthesized theme from meta-ethnography
 */
export interface SynthesizedTheme {
  /** Theme identifier */
  readonly id: string;
  /** Theme label */
  readonly label: string;
  /** Theme description */
  readonly description: string;
  /** Synthesis method used */
  readonly synthesisMethod: 'reciprocal' | 'refutational' | 'line_of_argument';
  /** Contributing studies */
  readonly contributingStudyIds: readonly string[];
  /** Synthesis confidence (0-1) */
  readonly confidence: number;
  /** Key findings */
  readonly keyFindings: readonly string[];
}

/**
 * Synthesis quality metrics
 */
export interface SynthesisQualityMetrics {
  /** Study coverage (studies included / total studies) */
  readonly studyCoverage: number;
  /** Theme saturation (0-1) */
  readonly themeSaturation: number;
  /** Reciprocal translation completeness */
  readonly translationCompleteness: number;
  /** Contradiction resolution rate */
  readonly contradictionResolutionRate: number;
  /** Overall quality score (0-1) */
  readonly overallQuality: number;
}

// ============================================================================
// HYPOTHESIS GENERATION TYPES (Grounded Theory)
// ============================================================================

/**
 * Grounded theory result
 */
export interface GroundedTheoryResult {
  /** Open coding results */
  readonly openCoding: OpenCodingResult;
  /** Axial coding results */
  readonly axialCoding: AxialCodingResult;
  /** Selective coding results */
  readonly selectiveCoding: SelectiveCodingResult;
  /** Theoretical framework */
  readonly theoreticalFramework: TheoreticalFramework;
  /** Generated hypotheses */
  readonly hypotheses: readonly GeneratedHypothesis[];
  /** Quality metrics */
  readonly qualityMetrics: GroundedTheoryQualityMetrics;
  /** Execution time (ms) */
  readonly durationMs: number;
}

/**
 * Open coding result (initial categorization)
 */
export interface OpenCodingResult {
  /** Initial codes discovered */
  readonly codes: readonly OpenCode[];
  /** Code frequency distribution */
  readonly frequencyDistribution: ReadonlyMap<string, number>;
  /** In-vivo codes (participant language) */
  readonly inVivoCodes: readonly string[];
  /** Coding density (codes per source) */
  readonly codingDensity: number;
}

/**
 * Open code from initial coding
 */
export interface OpenCode {
  /** Code identifier */
  readonly id: string;
  /** Code label */
  readonly label: string;
  /** Code definition */
  readonly definition: string;
  /** Source excerpts */
  readonly excerpts: readonly string[];
  /** Frequency count */
  readonly frequency: number;
  /** Is in-vivo code */
  readonly isInVivo: boolean;
  /** Properties (dimensions of the code) */
  readonly properties: readonly CodeProperty[];
}

/**
 * Code property (dimension)
 */
export interface CodeProperty {
  /** Property name */
  readonly name: string;
  /** Property dimension range */
  readonly dimensionRange: readonly string[];
  /** Current position on dimension */
  readonly position: string;
}

/**
 * Axial coding result (paradigm model)
 * Strauss & Corbin (1998) paradigm
 */
export interface AxialCodingResult {
  /** Categories with their paradigm components */
  readonly categories: readonly AxialCategory[];
  /** Category relationships */
  readonly relationships: readonly CategoryRelationship[];
  /** Paradigm completeness score (0-1) */
  readonly paradigmCompleteness: number;
}

/**
 * Axial category with paradigm model components
 * Conditions → Actions → Consequences
 */
export interface AxialCategory {
  /** Category identifier */
  readonly id: string;
  /** Category label */
  readonly label: string;
  /** Category description */
  readonly description: string;
  /** Causal conditions (what leads to this) */
  readonly causalConditions: readonly string[];
  /** Context (specific conditions) */
  readonly context: readonly string[];
  /** Intervening conditions (broader context) */
  readonly interveningConditions: readonly string[];
  /** Action/interaction strategies */
  readonly actionStrategies: readonly string[];
  /** Consequences */
  readonly consequences: readonly string[];
  /** Subcategories */
  readonly subcategories: readonly string[];
  /** Open codes grouped under this category */
  readonly openCodeIds: readonly string[];
}

/**
 * Relationship between categories
 */
export interface CategoryRelationship {
  /** Source category ID */
  readonly sourceId: string;
  /** Target category ID */
  readonly targetId: string;
  /** Relationship type */
  readonly type: CategoryRelationshipType;
  /** Relationship strength (0-1) */
  readonly strength: number;
  /** Evidence supporting relationship */
  readonly evidence: readonly string[];
}

/**
 * Category relationship types
 */
export type CategoryRelationshipType =
  | 'causal'          // A causes B
  | 'conditional'     // A if B
  | 'sequential'      // A then B
  | 'bidirectional'   // A <-> B
  | 'hierarchical';   // A contains B

/**
 * Selective coding result (core category)
 */
export interface SelectiveCodingResult {
  /** Core category */
  readonly coreCategory: CoreCategory;
  /** How other categories relate to core */
  readonly categoryIntegration: readonly CategoryIntegration[];
  /** Storyline (narrative) */
  readonly storyline: string;
  /** Theoretical saturation achieved */
  readonly theoreticalSaturation: boolean;
}

/**
 * Core category (central phenomenon)
 */
export interface CoreCategory {
  /** Category identifier */
  readonly id: string;
  /** Category label */
  readonly label: string;
  /** Category description */
  readonly description: string;
  /** Centrality score (0-1) */
  readonly centrality: number;
  /** Explanatory power (0-1) */
  readonly explanatoryPower: number;
  /** Variation accounted for (0-1) */
  readonly variationAccountedFor: number;
}

/**
 * How a category integrates with core category
 */
export interface CategoryIntegration {
  /** Category ID */
  readonly categoryId: string;
  /** Role in relation to core */
  readonly role: CategoryRole;
  /** Integration strength (0-1) */
  readonly strength: number;
  /** Narrative position */
  readonly narrativePosition: string;
}

/**
 * Role of category in relation to core
 */
export type CategoryRole =
  | 'condition'       // Provides conditions for core
  | 'context'         // Provides context
  | 'strategy'        // Action strategy related to core
  | 'consequence'     // Consequence of core
  | 'mediator'        // Mediates core's effects
  | 'moderator';      // Moderates core's effects

/**
 * Theoretical framework
 */
export interface TheoreticalFramework {
  /** Framework identifier */
  readonly id: string;
  /** Framework name */
  readonly name: string;
  /** Framework description */
  readonly description: string;
  /** Core construct */
  readonly coreConstruct: string;
  /** Key constructs */
  readonly constructs: readonly TheoreticalConstruct[];
  /** Propositions */
  readonly propositions: readonly TheoreticalProposition[];
  /** Boundary conditions */
  readonly boundaryConditions: readonly string[];
  /** Framework diagram (mermaid syntax) */
  readonly diagramMermaid: string;
}

/**
 * Theoretical construct
 */
export interface TheoreticalConstruct {
  /** Construct identifier */
  readonly id: string;
  /** Construct name */
  readonly name: string;
  /** Definition */
  readonly definition: string;
  /** Dimensions */
  readonly dimensions: readonly string[];
  /** Indicators */
  readonly indicators: readonly string[];
  /** Source categories */
  readonly sourceCategoryIds: readonly string[];
}

/**
 * Theoretical proposition
 */
export interface TheoreticalProposition {
  /** Proposition identifier */
  readonly id: string;
  /** Proposition statement */
  readonly statement: string;
  /** Constructs involved */
  readonly constructIds: readonly string[];
  /** Relationship type */
  readonly relationshipType: 'positive' | 'negative' | 'conditional' | 'moderating';
  /** Evidence strength (0-1) */
  readonly evidenceStrength: number;
  /** Testability score (0-1) */
  readonly testability: number;
}

/**
 * Generated hypothesis
 */
export interface GeneratedHypothesis {
  /** Hypothesis identifier */
  readonly id: string;
  /** Hypothesis statement */
  readonly statement: string;
  /** Type */
  readonly type: HypothesisType;
  /** Variables involved */
  readonly variables: readonly HypothesisVariable[];
  /** Grounding (evidence from data) */
  readonly grounding: readonly string[];
  /** Testability score (0-1) */
  readonly testability: number;
  /** Novelty score (0-1) */
  readonly novelty: number;
  /** Source propositions */
  readonly sourcePropositionIds: readonly string[];
}

/**
 * Hypothesis types
 */
export type HypothesisType =
  | 'causal'          // X causes Y
  | 'correlational'   // X relates to Y
  | 'moderating'      // Z moderates X-Y
  | 'mediating'       // M mediates X-Y
  | 'conditional';    // X -> Y if Z

/**
 * Variable in hypothesis
 */
export interface HypothesisVariable {
  /** Variable name */
  readonly name: string;
  /** Variable role */
  readonly role: 'independent' | 'dependent' | 'moderator' | 'mediator' | 'control';
  /** Source construct */
  readonly constructId: string;
}

/**
 * Grounded theory quality metrics
 */
export interface GroundedTheoryQualityMetrics {
  /** Theoretical sampling adequacy (0-1) */
  readonly samplingAdequacy: number;
  /** Coding density */
  readonly codingDensity: number;
  /** Category development completeness (0-1) */
  readonly categoryCompleteness: number;
  /** Paradigm model completeness (0-1) */
  readonly paradigmCompleteness: number;
  /** Core category centrality (0-1) */
  readonly coreCategoryCentrality: number;
  /** Theoretical saturation (0-1) */
  readonly theoreticalSaturation: number;
  /** Framework coherence (0-1) */
  readonly frameworkCoherence: number;
  /** Overall quality score (0-1) */
  readonly overallQuality: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate theoretical sampling config
 */
export function validateTheoreticalSamplingConfig(config: TheoreticalSamplingConfig): void {
  if (config.maxWaves < 1 || config.maxWaves > 20) {
    throw new Error(`maxWaves must be 1-20, got: ${config.maxWaves}`);
  }
  if (config.maxTotalPapers < 10 || config.maxTotalPapers > 10000) {
    throw new Error(`maxTotalPapers must be 10-10000, got: ${config.maxTotalPapers}`);
  }
  if (config.maxExecutionTimeMs < 60000 || config.maxExecutionTimeMs > 3600000) {
    throw new Error(`maxExecutionTimeMs must be 1-60 minutes, got: ${config.maxExecutionTimeMs}ms`);
  }
  if (config.papersPerWave < 5 || config.papersPerWave > 200) {
    throw new Error(`papersPerWave must be 5-200, got: ${config.papersPerWave}`);
  }
}

/**
 * Validate synthesis quality metrics
 */
export function validateSynthesisQualityMetrics(metrics: SynthesisQualityMetrics): void {
  const fields: Array<[string, number]> = [
    ['studyCoverage', metrics.studyCoverage],
    ['themeSaturation', metrics.themeSaturation],
    ['translationCompleteness', metrics.translationCompleteness],
    ['contradictionResolutionRate', metrics.contradictionResolutionRate],
    ['overallQuality', metrics.overallQuality],
  ];

  for (const [name, value] of fields) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${name} must be 0-1, got: ${value}`);
    }
  }
}

/**
 * Validate grounded theory quality metrics
 */
export function validateGroundedTheoryQualityMetrics(metrics: GroundedTheoryQualityMetrics): void {
  const fields: Array<[string, number]> = [
    ['samplingAdequacy', metrics.samplingAdequacy],
    ['categoryCompleteness', metrics.categoryCompleteness],
    ['paradigmCompleteness', metrics.paradigmCompleteness],
    ['coreCategoryCentrality', metrics.coreCategoryCentrality],
    ['theoreticalSaturation', metrics.theoreticalSaturation],
    ['frameworkCoherence', metrics.frameworkCoherence],
    ['overallQuality', metrics.overallQuality],
  ];

  for (const [name, value] of fields) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${name} must be 0-1, got: ${value}`);
    }
  }
}
