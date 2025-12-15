/**
 * Phase 10.155: Adaptive Quality Threshold Service
 *
 * Netflix-grade adaptive thresholding for iterative paper fetching.
 * Detects research field from query and applies field-appropriate quality thresholds.
 *
 * Key Innovation:
 * - Different academic fields have different metadata completeness patterns
 * - Biomedical papers have rich metadata → higher thresholds work
 * - Social science/humanities papers have sparse metadata → lower thresholds needed
 * - Adaptive thresholds ensure fair representation across fields
 *
 * Research Foundation:
 * - Metadata availability varies by discipline (Larivière et al., 2015)
 * - Citation patterns differ across fields (Garfield, 1979)
 * - Quality assessment must be domain-sensitive (CASP, 2018)
 *
 * @module LiteratureSearch
 * @since Phase 10.155
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of field detection from query analysis
 */
export interface FieldDetectionResult {
  /** Detected academic field */
  field: AcademicField;
  /** Confidence score (0-1) */
  confidence: number;
  /** Keywords that matched from the query */
  matchedKeywords: string[];
  /** Number of potential matches checked */
  totalKeywordsChecked: number;
}

/**
 * Threshold recommendation with context
 */
export interface ThresholdRecommendation {
  /** Recommended threshold value (0-100) */
  threshold: number;
  /** The field this threshold is optimized for */
  field: AcademicField;
  /** Explanation for the threshold choice */
  rationale: string;
  /** Whether this is a relaxed threshold from initial */
  isRelaxed: boolean;
  /** Iteration number (1 = initial) */
  iteration: number;
}

/**
 * Supported academic fields for threshold adaptation
 */
export type AcademicField =
  | 'biomedical'
  | 'physics'
  | 'computer-science'
  | 'social-science'
  | 'humanities'
  | 'interdisciplinary';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Field-specific initial quality thresholds
 *
 * Rationale:
 * - Biomedical: Rich metadata (PubMed, DOIs, citations) → high threshold viable
 * - Physics: Good metadata (arXiv, preprints indexed) → moderately high
 * - Computer Science: Good indexing (ACM, IEEE, arXiv) → moderately high
 * - Social Science: Sparser metadata, diverse sources → lower threshold
 * - Humanities: Limited indexing, book chapters, sparse citations → lowest
 * - Interdisciplinary: Conservative default for mixed results
 */
const FIELD_INITIAL_THRESHOLDS: Record<AcademicField, number> = {
  'biomedical': 60,
  'physics': 55,
  'computer-science': 55,
  'social-science': 45,
  'humanities': 40,
  'interdisciplinary': 50,
};

/**
 * Progressive relaxation sequence for when target isn't met
 * Each iteration relaxes the threshold to capture more papers
 */
const RELAXATION_SEQUENCE: readonly number[] = [60, 50, 40, 35, 30] as const;

/**
 * Minimum acceptable threshold - below this quality is too low
 */
const MIN_THRESHOLD = 30;

/**
 * Confidence threshold for field detection
 * Lowered from 0.6 to 0.35 to accept single strong keyword matches
 * (e.g., "quantum" → physics, "covid" → biomedical)
 */
const FIELD_CONFIDENCE_THRESHOLD = 0.35;

/**
 * Field detection keywords organized by academic discipline
 *
 * Each field has keywords that strongly indicate the discipline.
 * Keywords are case-insensitive and checked for substring matches.
 */
const FIELD_KEYWORDS: Record<AcademicField, readonly string[]> = {
  'biomedical': [
    'medical', 'clinical', 'health', 'disease', 'patient', 'drug', 'therapy',
    'cancer', 'covid', 'coronavirus', 'vaccine', 'treatment', 'diagnosis',
    'hospital', 'nursing', 'pharmaceutical', 'pathology', 'epidemiology',
    'surgery', 'cardio', 'neuro', 'oncology', 'pediatric', 'geriatric',
    'immunotherapy', 'biomarker', 'genomic', 'clinical trial', 'fda',
    'pubmed', 'medline', 'nih', 'cdc', 'who', 'healthcare'
  ],
  'physics': [
    'quantum', 'particle', 'physics', 'energy', 'matter', 'relativity',
    'cosmology', 'astrophysics', 'gravitational', 'electromagnetic',
    'thermodynamics', 'optics', 'mechanics', 'nuclear', 'plasma',
    'superconductor', 'photon', 'electron', 'proton', 'neutron',
    'higgs', 'cern', 'fermilab', 'accelerator', 'collision'
  ],
  'computer-science': [
    'algorithm', 'machine learning', 'artificial intelligence', 'ai', 'ml',
    'software', 'computing', 'neural network', 'deep learning', 'nlp',
    'computer vision', 'database', 'programming', 'cybersecurity',
    'blockchain', 'cryptocurrency', 'data mining', 'big data', 'cloud',
    'distributed system', 'operating system', 'compiler', 'gpu', 'cpu',
    'transformer', 'gpt', 'bert', 'llm', 'natural language processing',
    'reinforcement learning', 'computer science', 'acm', 'ieee'
  ],
  'social-science': [
    'social', 'political', 'economic', 'society', 'behavior', 'psychology',
    'policy', 'governance', 'democracy', 'election', 'voting', 'public opinion',
    'sociology', 'anthropology', 'ethnography', 'interview', 'survey',
    'qualitative', 'quantitative', 'mixed method', 'grounded theory',
    'phenomenology', 'case study', 'focus group', 'thematic analysis',
    'discourse analysis', 'content analysis', 'mental health', 'depression',
    'anxiety', 'wellbeing', 'education', 'learning', 'pedagogy', 'curriculum',
    'inequality', 'poverty', 'migration', 'gender', 'race', 'ethnicity'
  ],
  'humanities': [
    'history', 'philosophy', 'literature', 'art', 'culture', 'religion',
    'ethics', 'morality', 'aesthetic', 'narrative', 'hermeneutic',
    'postmodern', 'critical theory', 'feminist', 'colonial', 'medieval',
    'renaissance', 'ancient', 'classical', 'linguistic', 'semiotics',
    'rhetoric', 'poetry', 'novel', 'drama', 'music', 'film', 'archive',
    'museum', 'heritage', 'archaeology', 'manuscript', 'theology'
  ],
  'interdisciplinary': [
    // Fallback field - no specific keywords
    // This ensures interdisciplinary always has confidence 0.5 base
  ],
};

/**
 * Field rationales for user-facing explanations
 */
const FIELD_RATIONALES: Record<AcademicField, string> = {
  'biomedical': 'Biomedical papers have rich metadata from PubMed/DOI indexing',
  'physics': 'Physics papers are well-indexed in arXiv and major journals',
  'computer-science': 'CS papers are comprehensively indexed in ACM/IEEE/arXiv',
  'social-science': 'Social science papers have variable metadata completeness',
  'humanities': 'Humanities papers often have sparse citation/metadata records',
  'interdisciplinary': 'Mixed-field query using conservative threshold',
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AdaptiveQualityThresholdService {
  private readonly logger = new Logger(AdaptiveQualityThresholdService.name);

  /**
   * Detect the academic field from a search query
   *
   * Uses keyword matching with confidence scoring.
   * If confidence is below threshold, defaults to 'interdisciplinary'.
   *
   * @param query - The user's search query
   * @returns Field detection result with confidence
   */
  detectField(query: string): FieldDetectionResult {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    let bestMatch: FieldDetectionResult = {
      field: 'interdisciplinary',
      confidence: 0.5, // Base confidence for fallback
      matchedKeywords: [],
      totalKeywordsChecked: 0,
    };

    // Check each field's keywords
    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
      if (field === 'interdisciplinary') continue; // Skip fallback field

      const matches: string[] = [];

      for (const keyword of keywords) {
        // Check for substring match in query
        if (queryLower.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
        // Also check word-level match for short keywords
        else if (keyword.length <= 4 && queryWords.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      // Calculate confidence based on matches
      // More matches = higher confidence, but normalize by keyword count
      const matchCount = matches.length;
      const keywordCount = keywords.length;

      // Use a logarithmic scale: 1 match = 0.4, 2 = 0.6, 3 = 0.75, 4+ = 0.85+
      const confidence = matchCount > 0
        ? Math.min(0.95, 0.4 + (Math.log(matchCount + 1) / Math.log(keywordCount + 1)) * 0.55)
        : 0;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          field: field as AcademicField,
          confidence,
          matchedKeywords: matches,
          totalKeywordsChecked: keywordCount,
        };
      }
    }

    // If confidence is below threshold, fall back to interdisciplinary
    if (bestMatch.confidence < FIELD_CONFIDENCE_THRESHOLD) {
      this.logger.debug(
        `Field detection below threshold (${bestMatch.confidence.toFixed(2)} < ${FIELD_CONFIDENCE_THRESHOLD}), ` +
        `using interdisciplinary. Query: "${query.substring(0, 50)}..."`,
      );

      return {
        field: 'interdisciplinary',
        confidence: 0.5,
        matchedKeywords: bestMatch.matchedKeywords,
        totalKeywordsChecked: bestMatch.totalKeywordsChecked,
      };
    }

    this.logger.debug(
      `Detected field: ${bestMatch.field} (confidence: ${bestMatch.confidence.toFixed(2)}, ` +
      `matched: ${bestMatch.matchedKeywords.slice(0, 3).join(', ')}...)`,
    );

    return bestMatch;
  }

  /**
   * Get the initial quality threshold for a field
   *
   * @param field - The academic field
   * @returns Initial threshold value (0-100)
   */
  getInitialThreshold(field: AcademicField): number {
    return FIELD_INITIAL_THRESHOLDS[field] ?? FIELD_INITIAL_THRESHOLDS['interdisciplinary'];
  }

  /**
   * Get threshold recommendation with full context
   *
   * @param query - The search query
   * @returns Threshold recommendation with rationale
   */
  getThresholdRecommendation(query: string): ThresholdRecommendation {
    const detection = this.detectField(query);
    const threshold = this.getInitialThreshold(detection.field);

    return {
      threshold,
      field: detection.field,
      rationale: `${FIELD_RATIONALES[detection.field]}. Starting at ${threshold}% threshold.`,
      isRelaxed: false,
      iteration: 1,
    };
  }

  /**
   * Get the next relaxed threshold after current one
   *
   * Used when current threshold doesn't yield enough papers.
   * Returns null if already at minimum threshold.
   *
   * @param currentThreshold - The current threshold value
   * @param iteration - Current iteration number (1-based)
   * @returns Next threshold value, or null if at minimum
   */
  getNextThreshold(currentThreshold: number, iteration: number): number | null {
    // Find the next lower value in the relaxation sequence
    const nextValue = RELAXATION_SEQUENCE.find(v => v < currentThreshold);

    if (nextValue === undefined || nextValue < MIN_THRESHOLD) {
      this.logger.debug(
        `Cannot relax threshold further. Current: ${currentThreshold}, Min: ${MIN_THRESHOLD}`,
      );
      return null;
    }

    this.logger.debug(
      `Relaxing threshold: ${currentThreshold} → ${nextValue} (iteration ${iteration + 1})`,
    );

    return nextValue;
  }

  /**
   * Get next threshold recommendation with context
   *
   * @param currentThreshold - Current threshold
   * @param field - Academic field
   * @param iteration - Current iteration
   * @param papersFound - Papers found so far
   * @param targetPapers - Target paper count
   * @returns Next threshold recommendation, or null if cannot relax
   */
  getNextThresholdRecommendation(
    currentThreshold: number,
    field: AcademicField,
    iteration: number,
    papersFound: number,
    targetPapers: number,
  ): ThresholdRecommendation | null {
    const nextThreshold = this.getNextThreshold(currentThreshold, iteration);

    if (nextThreshold === null) {
      return null;
    }

    return {
      threshold: nextThreshold,
      field,
      rationale: `Found ${papersFound}/${targetPapers} papers at ${currentThreshold}% threshold. ` +
                 `Relaxing to ${nextThreshold}% to find more papers.`,
      isRelaxed: true,
      iteration: iteration + 1,
    };
  }

  /**
   * Check if a threshold can be relaxed further
   *
   * @param currentThreshold - The current threshold value
   * @returns true if threshold can be lowered
   */
  canRelaxThreshold(currentThreshold: number): boolean {
    return currentThreshold > MIN_THRESHOLD;
  }

  /**
   * Get the minimum acceptable threshold
   *
   * @returns Minimum threshold value
   */
  getMinThreshold(): number {
    return MIN_THRESHOLD;
  }

  /**
   * Get all field thresholds for debugging/display
   *
   * @returns Map of field to initial threshold
   */
  getAllFieldThresholds(): Record<AcademicField, number> {
    return { ...FIELD_INITIAL_THRESHOLDS };
  }

  /**
   * Get the relaxation sequence for debugging/display
   *
   * @returns Array of threshold values in relaxation order
   */
  getRelaxationSequence(): readonly number[] {
    return RELAXATION_SEQUENCE;
  }
}
