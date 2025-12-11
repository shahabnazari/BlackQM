/**
 * Phase 10.113 Week 5: Claim Extraction Types
 *
 * Netflix-grade types for extracting claims from paper abstracts
 * and mapping them to Q-methodology statements.
 *
 * Key concepts:
 * - Claim: A factual or position statement extracted from paper text
 * - Statement Potential: How suitable a claim is for Q-sort methodology
 * - Claim Provenance: Full traceability from paper to claim to statement
 */

// ============================================================================
// CLAIM EXTRACTION CONFIGURATION
// ============================================================================

/**
 * Configuration for claim extraction process
 */
export interface ClaimExtractionConfig {
  /** Minimum confidence score to accept a claim (0-1) */
  readonly minConfidence: number;
  /** Minimum statement potential to include in output (0-1) */
  readonly minStatementPotential: number;
  /** Maximum claims to extract per paper */
  readonly maxClaimsPerPaper: number;
  /** Maximum total claims across all papers */
  readonly maxTotalClaims: number;
  /** Minimum word count for a claim to be valid */
  readonly minClaimWords: number;
  /** Maximum word count for a claim (sortability constraint) */
  readonly maxClaimWords: number;
  /** Whether to normalize claims (clean up language) */
  readonly normalizeClaimText: boolean;
  /** Whether to deduplicate similar claims */
  readonly deduplicateClaims: boolean;
  /** Similarity threshold for deduplication (0-1, higher = more strict) */
  readonly deduplicationThreshold: number;
}

/**
 * Default configuration for claim extraction
 * Based on Q-methodology best practices
 */
export const DEFAULT_CLAIM_EXTRACTION_CONFIG: Readonly<ClaimExtractionConfig> = {
  minConfidence: 0.5,
  minStatementPotential: 0.4,
  maxClaimsPerPaper: 5,
  maxTotalClaims: 200,
  minClaimWords: 5,
  maxClaimWords: 30,
  normalizeClaimText: true,
  deduplicateClaims: true,
  deduplicationThreshold: 0.85,
} as const;

// ============================================================================
// CLAIM PERSPECTIVE
// ============================================================================

/**
 * Perspective classification for extracted claims
 */
export type ClaimPerspective = 'supportive' | 'critical' | 'neutral';

/**
 * Get all valid claim perspectives
 */
export const CLAIM_PERSPECTIVES: readonly ClaimPerspective[] = [
  'supportive',
  'critical',
  'neutral',
] as const;

// ============================================================================
// EXTRACTED CLAIM
// ============================================================================

/**
 * An extracted claim from a paper abstract
 * Core data structure for Week 5 implementation
 */
export interface ExtractedClaim {
  /** Unique claim identifier */
  readonly id: string;
  /** Source sub-theme this claim relates to */
  readonly sourceSubTheme: string;
  /** IDs of papers containing this claim */
  readonly sourcePapers: readonly string[];
  /** Exact quote from source paper(s) */
  readonly originalText: string;
  /** Cleaned up version suitable for Q-sort */
  readonly normalizedClaim: string;
  /** Perspective classification */
  readonly perspective: ClaimPerspective;
  /** How suitable this claim is for Q-methodology (0-1) */
  readonly statementPotential: number;
  /** Confidence score of extraction (0-1) */
  readonly confidence: number;
  /** Claim metadata */
  readonly metadata: ClaimMetadata;
}

/**
 * Mutable version for internal processing
 * Note: All properties are mutable (no readonly) for internal modification
 */
export interface MutableExtractedClaim {
  id: string;
  sourceSubTheme: string;
  sourcePapers: string[];
  originalText: string;
  normalizedClaim: string;
  perspective: ClaimPerspective;
  statementPotential: number;
  confidence: number;
  metadata: MutableClaimMetadata;
}

/**
 * Additional metadata for extracted claims
 */
export interface ClaimMetadata {
  /** When the claim was extracted */
  readonly extractedAt: Date;
  /** AI model used for extraction */
  readonly extractionModel: string;
  /** Word count of original text */
  readonly originalWordCount: number;
  /** Word count of normalized claim */
  readonly normalizedWordCount: number;
  /** Key terms/phrases in the claim */
  readonly keyTerms: readonly string[];
  /** Semantic similarity to theme (0-1) */
  readonly themeRelevance: number;
  /** Whether this claim was deduplicated (merged with similar claims) */
  readonly isDeduplicated: boolean;
  /** IDs of similar claims that were merged into this one */
  readonly mergedClaimIds: readonly string[];
}

/**
 * Mutable metadata for internal processing
 * Note: All properties are mutable (no readonly) for internal modification
 */
export interface MutableClaimMetadata {
  extractedAt: Date;
  extractionModel: string;
  originalWordCount: number;
  normalizedWordCount: number;
  keyTerms: string[];
  themeRelevance: number;
  isDeduplicated: boolean;
  mergedClaimIds: string[];
}

// ============================================================================
// STATEMENT POTENTIAL COMPONENTS
// ============================================================================

/**
 * Component scores that make up the Statement Potential score
 */
export interface StatementPotentialComponents {
  /** Is the claim sortable on agree-disagree scale? (0-1) */
  readonly sortability: number;
  /** Does the claim express a clear position? (0-1) */
  readonly clarity: number;
  /** Is the claim neutral enough for Q-sort? (0-1) */
  readonly neutrality: number;
  /** Is the claim unique/distinct from others? (0-1) */
  readonly uniqueness: number;
  /** Does the claim have appropriate length? (0-1) */
  readonly lengthScore: number;
  /** Is the claim academically appropriate? (0-1) */
  readonly academicTone: number;
}

/**
 * Extended claim with detailed potential breakdown
 */
export interface ExtractedClaimWithPotential extends ExtractedClaim {
  /** Detailed breakdown of statement potential */
  readonly potentialComponents: StatementPotentialComponents;
}

// ============================================================================
// PAPER INPUT FOR CLAIM EXTRACTION
// ============================================================================

/**
 * Paper input for claim extraction
 */
export interface ClaimExtractionPaperInput {
  /** Unique paper ID */
  readonly id: string;
  /** Paper title */
  readonly title: string;
  /** Paper abstract (primary source for claims) */
  readonly abstract: string;
  /** Full text if available (optional) */
  readonly fullText?: string;
  /** Publication year */
  readonly year?: number;
  /** Author names */
  readonly authors?: readonly string[];
  /** Paper keywords */
  readonly keywords?: readonly string[];
  /** Theme ID this paper belongs to (if known) */
  readonly themeId?: string;
  /** Sub-theme ID this paper belongs to (if known) */
  readonly subThemeId?: string;
  /** Pre-computed embedding for similarity calculations */
  readonly embedding?: readonly number[];
}

// ============================================================================
// THEME INPUT FOR CLAIM EXTRACTION
// ============================================================================

/**
 * Theme context for claim extraction
 */
export interface ClaimExtractionThemeContext {
  /** Theme ID */
  readonly id: string;
  /** Theme label */
  readonly label: string;
  /** Theme description */
  readonly description?: string;
  /** Theme keywords for relevance scoring */
  readonly keywords: readonly string[];
  /** Sub-themes within this theme */
  readonly subThemes?: readonly ClaimExtractionSubTheme[];
  /** Whether this theme is controversial */
  readonly isControversial?: boolean;
  /** Pre-computed embedding for similarity calculations */
  readonly embedding?: readonly number[];
}

/**
 * Sub-theme context
 */
export interface ClaimExtractionSubTheme {
  /** Sub-theme ID */
  readonly id: string;
  /** Sub-theme label */
  readonly label: string;
  /** Sub-theme description */
  readonly description?: string;
  /** Sub-theme keywords */
  readonly keywords: readonly string[];
}

// ============================================================================
// CLAIM EXTRACTION RESULT
// ============================================================================

/**
 * Result of claim extraction process
 */
export interface ClaimExtractionResult {
  /** Theme being analyzed */
  readonly theme: ClaimExtractionThemeContext;
  /** Extracted claims */
  readonly claims: readonly ExtractedClaim[];
  /** Claims grouped by sub-theme */
  readonly claimsBySubTheme: ReadonlyMap<string, readonly ExtractedClaim[]>;
  /** Claims grouped by perspective */
  readonly claimsByPerspective: ReadonlyMap<ClaimPerspective, readonly ExtractedClaim[]>;
  /** Quality metrics for the extraction */
  readonly qualityMetrics: ClaimExtractionQualityMetrics;
  /** Extraction metadata */
  readonly metadata: ClaimExtractionMetadata;
}

/**
 * Mutable result for internal processing
 */
export interface MutableClaimExtractionResult {
  theme: ClaimExtractionThemeContext;
  claims: MutableExtractedClaim[];
  claimsBySubTheme: Map<string, MutableExtractedClaim[]>;
  claimsByPerspective: Map<ClaimPerspective, MutableExtractedClaim[]>;
  qualityMetrics: MutableClaimExtractionQualityMetrics;
  metadata: MutableClaimExtractionMetadata;
}

/**
 * Quality metrics for claim extraction
 */
export interface ClaimExtractionQualityMetrics {
  /** Number of papers processed */
  readonly papersProcessed: number;
  /** Number of claims extracted */
  readonly claimsExtracted: number;
  /** Number of claims after deduplication */
  readonly claimsAfterDedup: number;
  /** Average confidence score */
  readonly avgConfidence: number;
  /** Average statement potential */
  readonly avgStatementPotential: number;
  /** Perspective distribution (counts) */
  readonly perspectiveDistribution: ReadonlyMap<ClaimPerspective, number>;
  /** Sub-theme coverage (percentage of sub-themes with claims) */
  readonly subThemeCoverage: number;
  /** Claims per paper (average) */
  readonly avgClaimsPerPaper: number;
  /** High-quality claim count (potential > 0.7) */
  readonly highQualityClaims: number;
}

/**
 * Mutable quality metrics for internal processing
 */
export interface MutableClaimExtractionQualityMetrics extends Omit<ClaimExtractionQualityMetrics, 'perspectiveDistribution'> {
  perspectiveDistribution: Map<ClaimPerspective, number>;
}

/**
 * Metadata about the claim extraction process
 */
export interface ClaimExtractionMetadata {
  /** When extraction started */
  readonly startTime: Date;
  /** When extraction completed */
  readonly endTime: Date;
  /** Total processing time in milliseconds */
  readonly processingTimeMs: number;
  /** Configuration used */
  readonly config: ClaimExtractionConfig;
  /** Warnings generated during extraction */
  readonly warnings: readonly string[];
  /** Request ID for tracing */
  readonly requestId?: string;
}

/**
 * Mutable metadata for internal processing
 */
export interface MutableClaimExtractionMetadata extends Omit<ClaimExtractionMetadata, 'warnings'> {
  warnings: string[];
}

// ============================================================================
// CLAIM TO STATEMENT MAPPING
// ============================================================================

/**
 * Mapping from claims to Q-sort statements
 */
export interface ClaimToStatementMapping {
  /** Source claim ID */
  readonly claimId: string;
  /** Generated statement text */
  readonly statementText: string;
  /** Statement perspective (may differ from claim) */
  readonly perspective: ClaimPerspective | 'balanced';
  /** Confidence in the mapping (0-1) */
  readonly confidence: number;
  /** How much the statement was modified from original claim */
  readonly modificationLevel: ClaimModificationLevel;
  /** Provenance chain */
  readonly provenance: ClaimStatementProvenance;
}

/**
 * How much a claim was modified to become a statement
 */
export type ClaimModificationLevel = 'none' | 'minor' | 'moderate' | 'significant';

/**
 * Full provenance from paper to statement
 */
export interface ClaimStatementProvenance {
  /** Source paper IDs */
  readonly paperIds: readonly string[];
  /** Theme ID */
  readonly themeId: string;
  /** Sub-theme ID (if applicable) */
  readonly subThemeId?: string;
  /** Claim ID */
  readonly claimId: string;
  /** Original claim text */
  readonly originalClaimText: string;
  /** When the statement was generated */
  readonly generatedAt: Date;
  /** AI model used for statement generation */
  readonly generationModel: string;
}

// ============================================================================
// PROGRESS AND CANCELLATION
// ============================================================================

/**
 * Stages of claim extraction process
 */
export enum ClaimExtractionStage {
  INITIALIZING = 'INITIALIZING',
  EXTRACTING_CLAIMS = 'EXTRACTING_CLAIMS',
  SCORING_POTENTIAL = 'SCORING_POTENTIAL',
  CLASSIFYING_PERSPECTIVE = 'CLASSIFYING_PERSPECTIVE',
  DEDUPLICATING = 'DEDUPLICATING',
  GROUPING = 'GROUPING',
  QUALITY_ANALYSIS = 'QUALITY_ANALYSIS',
  COMPLETE = 'COMPLETE',
}

/**
 * Progress callback for claim extraction
 */
export type ClaimExtractionProgressCallback = (
  stage: ClaimExtractionStage,
  progress: number,
  message: string,
) => void;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for ExtractedClaim
 */
export function isExtractedClaim(obj: unknown): obj is ExtractedClaim {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'originalText' in obj &&
    'normalizedClaim' in obj &&
    'perspective' in obj &&
    'statementPotential' in obj
  );
}

/**
 * Type guard for ClaimPerspective
 */
export function isClaimPerspective(value: unknown): value is ClaimPerspective {
  return (
    typeof value === 'string' &&
    CLAIM_PERSPECTIVES.includes(value as ClaimPerspective)
  );
}

/**
 * Type guard for ClaimExtractionPaperInput
 */
export function isClaimExtractionPaperInput(obj: unknown): obj is ClaimExtractionPaperInput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'abstract' in obj &&
    typeof (obj as ClaimExtractionPaperInput).abstract === 'string'
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable label for claim perspective
 */
export function getClaimPerspectiveLabel(perspective: ClaimPerspective): string {
  const labels: Record<ClaimPerspective, string> = {
    supportive: 'Supportive',
    critical: 'Critical',
    neutral: 'Neutral',
  };
  return labels[perspective];
}

/**
 * Get human-readable label for modification level
 */
export function getModificationLevelLabel(level: ClaimModificationLevel): string {
  const labels: Record<ClaimModificationLevel, string> = {
    none: 'Unchanged',
    minor: 'Minor Edits',
    moderate: 'Moderate Changes',
    significant: 'Significantly Rewritten',
  };
  return labels[level];
}

/**
 * Get human-readable label for extraction stage
 */
export function getExtractionStageLabel(stage: ClaimExtractionStage): string {
  const labels: Record<ClaimExtractionStage, string> = {
    [ClaimExtractionStage.INITIALIZING]: 'Initializing',
    [ClaimExtractionStage.EXTRACTING_CLAIMS]: 'Extracting Claims',
    [ClaimExtractionStage.SCORING_POTENTIAL]: 'Scoring Statement Potential',
    [ClaimExtractionStage.CLASSIFYING_PERSPECTIVE]: 'Classifying Perspectives',
    [ClaimExtractionStage.DEDUPLICATING]: 'Removing Duplicates',
    [ClaimExtractionStage.GROUPING]: 'Grouping by Theme',
    [ClaimExtractionStage.QUALITY_ANALYSIS]: 'Analyzing Quality',
    [ClaimExtractionStage.COMPLETE]: 'Complete',
  };
  return labels[stage];
}

/**
 * Calculate perspective balance score (0-1, higher = more balanced)
 */
export function calculatePerspectiveBalance(
  distribution: ReadonlyMap<ClaimPerspective, number>,
): number {
  const counts = Array.from(distribution.values());
  if (counts.length === 0) return 0;

  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0;

  const expectedProportion = 1 / CLAIM_PERSPECTIVES.length;
  const actualProportions = counts.map(c => c / total);

  // Calculate deviation from perfect balance
  const deviation = actualProportions.reduce(
    (sum, p) => sum + Math.abs(p - expectedProportion),
    0,
  );

  // Normalize: max deviation is 2*(1-1/n) for n perspectives
  const maxDeviation = 2 * (1 - expectedProportion);

  return 1 - (deviation / maxDeviation);
}
