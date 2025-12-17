/**
 * Phase 10.170: Purpose-Aware Configuration Constants
 *
 * Enterprise-grade configuration constants for purpose-aware paper fetching.
 * Each research purpose has scientifically-grounded configuration based on
 * established methodological best practices.
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Q-Methodology: Stephenson (1953), Brown (1980), Watts & Stenner (2012)
 * - Qualitative Analysis: Braun & Clarke (2019), Charmaz (2006)
 * - Literature Synthesis: Noblit & Hare (1988), Thomas & Harden (2008)
 * - Hypothesis Generation: Glaser & Strauss (1967), Strauss & Corbin (1990)
 * - Survey Construction: Churchill (1979), DeVellis (2016)
 *
 * SECURITY:
 * - Critical #6: All configs validated at startup AND on every access
 * - Critical #7: Paper limits bounded (0-10000)
 * - No mutable exports (frozen objects)
 *
 * @module purpose-config.constants
 * @since Phase 10.170
 */

import {
  ResearchPurpose,
  PurposeFetchingConfig,
  validatePurposeFetchingConfig,
  RESEARCH_PURPOSES,
} from '../types/purpose-aware.types';

// ============================================================================
// PURPOSE FETCHING CONFIGURATION
// ============================================================================

/**
 * Purpose-Aware Paper Fetching Configuration
 *
 * Each purpose is configured based on its scientific requirements:
 *
 * | Purpose              | Papers   | Content Priority | Full-Text | Journal Weight |
 * |----------------------|----------|------------------|-----------|----------------|
 * | Q-Methodology        | 500-800  | low              | Optional  | 0.00 (zero!)   |
 * | Qualitative Analysis | 50-200   | high             | Preferred | 0.20           |
 * | Literature Synthesis | 400-500  | critical         | Required  | 0.25           |
 * | Hypothesis Gen.      | 100-300  | high             | Required  | 0.20           |
 * | Survey Construction  | 100-200  | high             | Preferred | 0.25           |
 */
export const PURPOSE_FETCHING_CONFIG: Readonly<
  Record<ResearchPurpose, PurposeFetchingConfig>
> = Object.freeze({
  // ==========================================================================
  // Q-METHODOLOGY: Breadth-Focused
  // ==========================================================================
  /**
   * Q-METHODOLOGY Configuration
   *
   * Goal: Generate 30-80 diverse statements for Q-sort concourse
   * Scientific Method: k-means++ breadth-maximizing (Stephenson 1953)
   *
   * EINSTEIN INSIGHT: NO journal weight (0.00)!
   * Journal prestige creates mainstream bias. Q-methodology needs diverse
   * viewpoints from ALL sources, including niche journals and grey literature.
   * A controversial opinion in a small journal is MORE valuable than
   * consensus in Nature for Q-methodology concourse development.
   *
   * Reference: Watts & Stenner (2012) warn against mainstream bias in concourse
   */
  [ResearchPurpose.Q_METHODOLOGY]: Object.freeze({
    paperLimits: Object.freeze({
      min: 500,
      target: 600,
      max: 800,
    }),
    qualityWeights: Object.freeze({
      content: 0.50,      // PRIMARY: Content for statement generation
      citation: 0.20,     // Lower: Avoid mainstream bias
      journal: 0.00,      // ZERO! Avoid prestigious journal bias
      methodology: 0.00,  // Not relevant for viewpoint diversity
      diversity: 0.30,    // Critical: Perspective diversity
    }),
    qualityThreshold: Object.freeze({
      initial: 40,        // Very lenient (include diverse viewpoints)
      min: 20,            // Never filter out diverse papers
      relaxationSteps: Object.freeze([40, 35, 30, 25, 20]),
    }),
    contentPriority: 'low' as const,  // Abstracts sufficient for statements
    fullTextRequirement: Object.freeze({
      minRequired: 0,           // Not required
      strictRequirement: false,
      fullTextBoost: 5,         // Small boost (not critical)
    }),
    diversityRequired: true,
    scientificMethod: 'k-means++ breadth-maximizing (Stephenson 1953)',
    targetThemes: Object.freeze({ min: 30, max: 80 }),
    validation: Object.freeze({
      minSources: 1,           // Single source OK for diverse viewpoints
      minCoherence: 0.5,       // Lower coherence (diversity > coherence)
      minDistinctiveness: 0.10, // Lower distinctiveness (more themes)
    }),
  }),

  // ==========================================================================
  // QUALITATIVE ANALYSIS: Saturation-Driven
  // ==========================================================================
  /**
   * QUALITATIVE ANALYSIS Configuration
   *
   * Goal: Extract 5-20 themes until data saturation
   * Scientific Method: Hierarchical + Bayesian saturation (Braun & Clarke 2019)
   *
   * Key principle: Stop when no new themes emerge (theoretical saturation)
   * Typically achieved with 12-20 papers, but we fetch more for quality filtering
   *
   * Reference: Braun & Clarke (2019) recommend continuing until saturation
   */
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: Object.freeze({
    paperLimits: Object.freeze({
      min: 50,
      target: 100,
      max: 200,
    }),
    qualityWeights: Object.freeze({
      content: 0.40,      // Critical for coding
      citation: 0.20,     // Moderate importance
      journal: 0.20,      // Maintain rigor signal
      methodology: 0.20,  // Important for qualitative rigor
    }),
    qualityThreshold: Object.freeze({
      initial: 60,        // Moderate (content-first)
      min: 40,            // Ensure content quality
      relaxationSteps: Object.freeze([60, 55, 50, 45, 40]),
    }),
    contentPriority: 'high' as const,  // Full-text preferred
    fullTextRequirement: Object.freeze({
      minRequired: 3,            // 3+ recommended
      strictRequirement: false,
      fullTextBoost: 15,         // Significant boost
    }),
    diversityRequired: false,
    scientificMethod: 'Hierarchical clustering + Bayesian saturation (Braun & Clarke 2019)',
    targetThemes: Object.freeze({ min: 5, max: 20 }),
    validation: Object.freeze({
      minSources: 2,           // Multiple sources for triangulation
      minCoherence: 0.6,       // Moderate coherence
      minDistinctiveness: 0.15, // Distinct themes
    }),
  }),

  // ==========================================================================
  // LITERATURE SYNTHESIS: Comprehensive Coverage
  // ==========================================================================
  /**
   * LITERATURE SYNTHESIS Configuration
   *
   * Goal: Extract 10-25 themes representing state of knowledge
   * Scientific Method: Meta-ethnography (Noblit & Hare 1988)
   *
   * Key principle: Comprehensive coverage with high quality
   * Full-text is REQUIRED for synthesis (not just abstracts)
   *
   * Reference: Thomas & Harden (2008) - Full-text essential for synthesis quality
   */
  [ResearchPurpose.LITERATURE_SYNTHESIS]: Object.freeze({
    paperLimits: Object.freeze({
      min: 400,
      target: 450,
      max: 500,
    }),
    qualityWeights: Object.freeze({
      content: 0.30,      // Important for synthesis
      citation: 0.25,     // Important for seminal works
      journal: 0.25,      // Journal prestige matters
      methodology: 0.20,  // Methodology rigor important
    }),
    qualityThreshold: Object.freeze({
      initial: 70,        // Higher (comprehensive + quality)
      min: 50,            // Maintain rigor
      relaxationSteps: Object.freeze([70, 65, 60, 55, 50]),
    }),
    contentPriority: 'critical' as const,  // Full-text required
    fullTextRequirement: Object.freeze({
      minRequired: 10,           // 10+ required
      strictRequirement: true,
      fullTextBoost: 20,         // Large boost
    }),
    diversityRequired: true,  // Comprehensive coverage
    scientificMethod: 'Meta-ethnography (Noblit & Hare 1988)',
    targetThemes: Object.freeze({ min: 10, max: 25 }),
    validation: Object.freeze({
      minSources: 3,           // Strong triangulation
      minCoherence: 0.7,       // High coherence
      minDistinctiveness: 0.20, // Clear distinctions
    }),
  }),

  // ==========================================================================
  // HYPOTHESIS GENERATION: Theoretical Depth
  // ==========================================================================
  /**
   * HYPOTHESIS GENERATION Configuration
   *
   * Goal: Extract 8-15 conceptual themes for theory-building
   * Scientific Method: Grounded theory (Glaser & Strauss 1967)
   *
   * Key principle: Iterative theoretical sampling to fill gaps
   * Full-text required for theory building (abstract insufficient)
   *
   * Reference: Strauss & Corbin (1990) - Constant comparison method
   */
  [ResearchPurpose.HYPOTHESIS_GENERATION]: Object.freeze({
    paperLimits: Object.freeze({
      min: 100,
      target: 150,
      max: 300,
    }),
    qualityWeights: Object.freeze({
      content: 0.40,      // Content for theory-building
      citation: 0.20,     // Moderate importance
      journal: 0.20,      // Maintain quality signal
      methodology: 0.20,  // Important for theoretical rigor
    }),
    qualityThreshold: Object.freeze({
      initial: 60,        // Moderate (content-first)
      min: 40,            // Ensure content quality
      relaxationSteps: Object.freeze([60, 55, 50, 45, 40]),
    }),
    contentPriority: 'high' as const,  // Full-text preferred
    fullTextRequirement: Object.freeze({
      minRequired: 8,            // 8+ required
      strictRequirement: true,
      fullTextBoost: 15,
    }),
    diversityRequired: false,
    scientificMethod: 'Grounded theory + constant comparison (Glaser & Strauss 1967)',
    targetThemes: Object.freeze({ min: 8, max: 15 }),
    validation: Object.freeze({
      minSources: 2,           // Multiple sources
      minCoherence: 0.6,       // Coherent concepts
      minDistinctiveness: 0.20, // Clear distinctions for theory
    }),
  }),

  // ==========================================================================
  // SURVEY CONSTRUCTION: Construct Validity
  // ==========================================================================
  /**
   * SURVEY CONSTRUCTION Configuration
   *
   * Goal: Extract 5-15 robust constructs for measurement scales
   * Scientific Method: Hierarchical + Cronbach's alpha (Churchill 1979)
   *
   * Key principle: Constructs must be operationalizable and measurable
   * High distinctiveness required for valid scale items
   *
   * Reference: DeVellis (2016) - Scale development best practices
   */
  [ResearchPurpose.SURVEY_CONSTRUCTION]: Object.freeze({
    paperLimits: Object.freeze({
      min: 100,
      target: 150,
      max: 200,
    }),
    qualityWeights: Object.freeze({
      content: 0.35,      // Content for construct operationalization
      citation: 0.20,     // Important for validated scales
      journal: 0.25,      // Journal prestige for psychometric rigor
      methodology: 0.20,  // Methodology rigor critical
    }),
    qualityThreshold: Object.freeze({
      initial: 60,        // Moderate (psychometric quality)
      min: 40,            // Ensure construct validity
      relaxationSteps: Object.freeze([60, 55, 50, 45, 40]),
    }),
    contentPriority: 'high' as const,  // Full-text preferred
    fullTextRequirement: Object.freeze({
      minRequired: 5,            // 5+ recommended
      strictRequirement: false,
      fullTextBoost: 15,
    }),
    diversityRequired: false,
    scientificMethod: 'Hierarchical clustering + Cronbach\'s alpha (Churchill 1979)',
    targetThemes: Object.freeze({ min: 5, max: 15 }),
    validation: Object.freeze({
      minSources: 3,           // Strong triangulation for constructs
      minCoherence: 0.7,       // High coherence for valid constructs
      minDistinctiveness: 0.25, // High distinctiveness for scale items
    }),
  }),
});

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

/**
 * Validate all configurations at startup
 * SECURITY (Critical #6): Fail fast on invalid configuration
 */
(function validateAllConfigsAtStartup(): void {
  // SECURITY (Critical #2): Use constant instead of recreating array each time
  const purposes = RESEARCH_PURPOSES;

  for (const purpose of purposes) {
    const config = PURPOSE_FETCHING_CONFIG[purpose];

    if (!config) {
      throw new Error(`Missing configuration for purpose: ${purpose}`);
    }

    try {
      validatePurposeFetchingConfig(config);
    } catch (error) {
      throw new Error(
        `Invalid configuration for ${purpose}: ${(error as Error).message}`,
      );
    }
  }
})();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get configuration for a research purpose with runtime validation
 * SECURITY (Critical #2): Throws on invalid purpose, no silent defaults
 *
 * @param purpose Research purpose
 * @returns Configuration for the purpose
 * @throws Error if purpose is invalid or config is missing
 */
export function getConfigForPurpose(purpose: ResearchPurpose): PurposeFetchingConfig {
  // SECURITY (Critical #2): Runtime enum validation using constant for performance
  if (!RESEARCH_PURPOSES.includes(purpose)) {
    throw new Error(
      `Invalid ResearchPurpose: ${purpose}. Valid values: ${RESEARCH_PURPOSES.join(', ')}`,
    );
  }

  const config = PURPOSE_FETCHING_CONFIG[purpose];

  if (!config) {
    throw new Error(`Configuration missing for valid purpose: ${purpose}`);
  }

  // Runtime validation on every access
  validatePurposeFetchingConfig(config);

  return config;
}

/**
 * Get default paper limits for a purpose
 *
 * @param purpose Research purpose
 * @returns Paper limits configuration
 */
export function getDefaultPaperLimits(purpose: ResearchPurpose): {
  min: number;
  target: number;
  max: number;
} {
  return getConfigForPurpose(purpose).paperLimits;
}

/**
 * Get quality weights for a purpose
 *
 * @param purpose Research purpose
 * @returns Quality weights configuration
 */
export function getQualityWeights(purpose: ResearchPurpose): {
  content: number;
  citation: number;
  journal: number;
  methodology: number;
  diversity?: number;
} {
  return getConfigForPurpose(purpose).qualityWeights;
}

/**
 * Check if a purpose requires diversity tracking
 *
 * @param purpose Research purpose
 * @returns true if diversity tracking is required
 */
export function requiresDiversity(purpose: ResearchPurpose): boolean {
  return getConfigForPurpose(purpose).diversityRequired;
}

/**
 * Check if a purpose requires full-text
 *
 * @param purpose Research purpose
 * @returns true if full-text is strictly required
 */
export function requiresFullText(purpose: ResearchPurpose): boolean {
  return getConfigForPurpose(purpose).fullTextRequirement.strictRequirement;
}

/**
 * Get the scientific method description for a purpose
 *
 * @param purpose Research purpose
 * @returns Scientific method description
 */
export function getScientificMethod(purpose: ResearchPurpose): string {
  return getConfigForPurpose(purpose).scientificMethod;
}

// ============================================================================
// CONTENT PRIORITY WORD COUNTS
// ============================================================================

/**
 * Minimum word counts for content priority levels
 *
 * Used for content eligibility filtering (Two-Stage Content-First Architecture)
 * Patent Innovation #27: Content eligibility before quality scoring
 */
export const CONTENT_PRIORITY_WORD_COUNTS = Object.freeze({
  /** Low priority: Abstract sufficient (200 words) */
  low: 200,
  /** Medium priority: Extended abstract (500 words) */
  medium: 500,
  /** High priority: Full-text preferred (1000 words) */
  high: 1000,
  /** Critical priority: Full-text required (3000 words) */
  critical: 3000,
} as const);

/**
 * Get minimum word count for a content priority level
 *
 * @param priority Content priority level
 * @returns Minimum word count required
 */
export function getMinWordCount(priority: 'low' | 'medium' | 'high' | 'critical'): number {
  return CONTENT_PRIORITY_WORD_COUNTS[priority];
}

// ============================================================================
// QUALITY THRESHOLD RANGES
// ============================================================================

/**
 * Quality threshold bounds
 *
 * Defines the valid range for quality thresholds.
 */
export const QUALITY_THRESHOLD_BOUNDS = Object.freeze({
  /** Absolute minimum quality threshold */
  ABSOLUTE_MIN: 0,
  /** Absolute maximum quality threshold */
  ABSOLUTE_MAX: 100,
  /** Default initial threshold */
  DEFAULT_INITIAL: 60,
  /** Default minimum threshold */
  DEFAULT_MIN: 40,
} as const);

// ============================================================================
// FULL-TEXT BOOST LIMITS
// ============================================================================

/**
 * Full-text boost limits
 *
 * Defines the valid range for full-text score boosts.
 */
export const FULLTEXT_BOOST_LIMITS = Object.freeze({
  /** Minimum boost value */
  MIN: 0,
  /** Maximum boost value */
  MAX: 50,
  /** Default boost for low priority */
  DEFAULT_LOW: 5,
  /** Default boost for medium priority */
  DEFAULT_MEDIUM: 10,
  /** Default boost for high priority */
  DEFAULT_HIGH: 15,
  /** Default boost for critical priority */
  DEFAULT_CRITICAL: 20,
} as const);
