/**
 * Phase 10.170: Purpose-Aware Configuration Service
 *
 * Enterprise-grade service for managing purpose-specific configurations.
 * Single source of truth for all purpose-aware pipeline settings.
 *
 * RESPONSIBILITIES:
 * - Provide validated configurations for each research purpose
 * - Enforce runtime validation on every access (no stale configs)
 * - Support configuration overrides with validation
 * - Log configuration usage for monitoring
 *
 * SECURITY:
 * - Critical #1: Runtime enum validation (BadRequestException)
 * - Critical #2: No silent defaults (throws on invalid)
 * - Critical #6: Config validation on every access
 * - Critical #7: Bounds checking for all numerical values
 *
 * @module purpose-aware-config.service
 * @since Phase 10.170
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ResearchPurpose,
  PurposeFetchingConfig,
  QualityWeights,
  PaperLimits,
  QualityThreshold,
  ValidationThresholds,
  TargetThemes,
  ContentPriority,
  PurposeMetadata,
  PURPOSE_METADATA,
  RESEARCH_PURPOSES,
  isValidResearchPurpose,
  validatePurposeFetchingConfig,
  validatePaperLimits,
  validateQualityThreshold,
} from '../types/purpose-aware.types';
import {
  PURPOSE_FETCHING_CONFIG,
  CONTENT_PRIORITY_WORD_COUNTS,
  QUALITY_THRESHOLD_BOUNDS,
  FULLTEXT_BOOST_LIMITS,
} from '../constants/purpose-config.constants';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Configuration override options
 * Allows partial overrides while maintaining validation
 */
export interface ConfigOverrideOptions {
  /** Override paper limits */
  paperLimits?: Partial<PaperLimits>;
  /** Override quality threshold */
  qualityThreshold?: number;
  /** Override full-text requirement */
  forceFullText?: boolean;
  /** Override full-text boost */
  fullTextBoost?: number;
}

/**
 * Resolved configuration with overrides applied
 */
export interface ResolvedConfig extends PurposeFetchingConfig {
  /** Whether any overrides were applied */
  hasOverrides: boolean;
  /** Applied overrides (for logging) */
  appliedOverrides: string[];
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareConfigService {
  private readonly logger = new Logger(PurposeAwareConfigService.name);

  /**
   * Phase 10.170 Week 2 Optimization: Validated configs cache
   *
   * OPTIMIZATION INSIGHT:
   * - Configs are frozen with Object.freeze() at module load
   * - Configs are validated at startup in purpose-config.constants.ts
   * - Re-validating on every getConfig() call is wasteful
   * - This Set tracks which purposes have been validated this session
   * - First access validates, subsequent accesses skip validation
   */
  private readonly validatedPurposes = new Set<ResearchPurpose>();

  // ==========================================================================
  // CORE CONFIG METHODS
  // ==========================================================================

  /**
   * Get configuration for a specific research purpose
   *
   * SECURITY (Critical #2): Throws on invalid purpose - NO silent defaults!
   *
   * OPTIMIZATION (Phase 10.170 Week 2 Audit):
   * - Configs are validated at startup AND on first access
   * - Subsequent accesses skip full validation (configs are frozen)
   * - Reduces overhead from ~15 validation steps to ~1 enum check
   *
   * @param purpose Research purpose
   * @returns Validated configuration
   * @throws BadRequestException if purpose is invalid
   * @throws InternalServerErrorException if config is missing
   */
  getConfig(purpose: ResearchPurpose): PurposeFetchingConfig {
    // Runtime enum validation (Critical #1, #2) - ALWAYS performed
    if (!isValidResearchPurpose(purpose)) {
      throw new BadRequestException(
        `Invalid ResearchPurpose: ${purpose}. Must be one of: ${RESEARCH_PURPOSES.join(', ')}`,
      );
    }

    const config = PURPOSE_FETCHING_CONFIG[purpose];

    if (!config) {
      // This should never happen if enum validation passes, but guard anyway
      throw new InternalServerErrorException(
        `Configuration missing for valid purpose: ${purpose}`,
      );
    }

    // OPTIMIZATION: Skip full validation if already validated this session
    // Configs are frozen and can't change, so first validation is sufficient
    if (!this.validatedPurposes.has(purpose)) {
      try {
        validatePurposeFetchingConfig(config);
        this.validatedPurposes.add(purpose);
        this.logger.debug(`[Optimization] Config validated and cached for: ${purpose}`);
      } catch (error) {
        throw new InternalServerErrorException(
          `Configuration validation failed for ${purpose}: ${(error as Error).message}`,
        );
      }
    }

    return config;
  }

  /**
   * Get configuration with optional overrides
   *
   * @param purpose Research purpose
   * @param overrides Optional configuration overrides
   * @returns Resolved configuration with overrides applied
   */
  getConfigWithOverrides(
    purpose: ResearchPurpose,
    overrides?: ConfigOverrideOptions,
  ): ResolvedConfig {
    const baseConfig = this.getConfig(purpose);
    const appliedOverrides: string[] = [];

    if (!overrides) {
      return {
        ...baseConfig,
        hasOverrides: false,
        appliedOverrides: [],
      };
    }

    // Apply paper limits override
    let paperLimits = baseConfig.paperLimits;
    if (overrides.paperLimits) {
      paperLimits = {
        min: overrides.paperLimits.min ?? baseConfig.paperLimits.min,
        target: overrides.paperLimits.target ?? baseConfig.paperLimits.target,
        max: overrides.paperLimits.max ?? baseConfig.paperLimits.max,
      };

      // Validate overridden limits
      try {
        validatePaperLimits(paperLimits);
        appliedOverrides.push(`paperLimits: ${JSON.stringify(paperLimits)}`);
      } catch (error) {
        throw new BadRequestException(
          `Invalid paper limits override: ${(error as Error).message}`,
        );
      }
    }

    // Apply quality threshold override
    let qualityThreshold = baseConfig.qualityThreshold;
    if (overrides.qualityThreshold !== undefined) {
      const threshold = overrides.qualityThreshold;

      // SECURITY (Critical #9): Check for NaN/Infinity FIRST
      if (!Number.isFinite(threshold)) {
        throw new BadRequestException(
          `Quality threshold must be a finite number, got: ${threshold}`,
        );
      }

      // Validate threshold bounds
      if (threshold < QUALITY_THRESHOLD_BOUNDS.ABSOLUTE_MIN ||
          threshold > QUALITY_THRESHOLD_BOUNDS.ABSOLUTE_MAX) {
        throw new BadRequestException(
          `Quality threshold (${threshold}) must be between ${QUALITY_THRESHOLD_BOUNDS.ABSOLUTE_MIN} and ${QUALITY_THRESHOLD_BOUNDS.ABSOLUTE_MAX}`,
        );
      }

      qualityThreshold = {
        ...qualityThreshold,
        initial: threshold,
        min: Math.min(threshold, qualityThreshold.min),
      };

      // SECURITY (Critical #3): Validate complete threshold config after override
      try {
        validateQualityThreshold(qualityThreshold);
      } catch (error) {
        throw new BadRequestException(
          `Invalid quality threshold override: ${(error as Error).message}`,
        );
      }

      appliedOverrides.push(`qualityThreshold: ${threshold}`);
    }

    // Apply full-text requirement override
    let fullTextRequirement = baseConfig.fullTextRequirement;
    if (overrides.forceFullText !== undefined || overrides.fullTextBoost !== undefined) {
      const strictRequirement = overrides.forceFullText ?? fullTextRequirement.strictRequirement;
      let fullTextBoost = overrides.fullTextBoost ?? fullTextRequirement.fullTextBoost;

      // SECURITY (Critical #8): Check for NaN/Infinity FIRST
      if (!Number.isFinite(fullTextBoost)) {
        throw new BadRequestException(
          `Full-text boost must be a finite number, got: ${fullTextBoost}`,
        );
      }

      // Validate boost bounds
      if (fullTextBoost < FULLTEXT_BOOST_LIMITS.MIN ||
          fullTextBoost > FULLTEXT_BOOST_LIMITS.MAX) {
        throw new BadRequestException(
          `Full-text boost (${fullTextBoost}) must be between ${FULLTEXT_BOOST_LIMITS.MIN} and ${FULLTEXT_BOOST_LIMITS.MAX}`,
        );
      }

      fullTextRequirement = {
        ...fullTextRequirement,
        strictRequirement,
        fullTextBoost,
      };

      if (overrides.forceFullText !== undefined) {
        appliedOverrides.push(`forceFullText: ${strictRequirement}`);
      }
      if (overrides.fullTextBoost !== undefined) {
        appliedOverrides.push(`fullTextBoost: ${fullTextBoost}`);
      }
    }

    const resolvedConfig: ResolvedConfig = {
      ...baseConfig,
      paperLimits,
      qualityThreshold,
      fullTextRequirement,
      hasOverrides: appliedOverrides.length > 0,
      appliedOverrides,
    };

    // SECURITY (Critical #1): Validate complete resolved config before returning
    // This catches any invariant violations that individual validations might miss
    try {
      validatePurposeFetchingConfig(resolvedConfig);
    } catch (error) {
      throw new BadRequestException(
        `Invalid resolved configuration: ${(error as Error).message}`,
      );
    }

    // Log override application
    if (appliedOverrides.length > 0) {
      this.logger.log(
        `Config overrides applied for ${purpose}: ${appliedOverrides.join(', ')}`,
      );
    }

    return resolvedConfig;
  }

  // ==========================================================================
  // PAPER LIMITS METHODS
  // ==========================================================================

  /**
   * Get paper limits for a purpose
   *
   * @param purpose Research purpose
   * @returns Paper limits configuration
   */
  getPaperLimits(purpose: ResearchPurpose): PaperLimits {
    return this.getConfig(purpose).paperLimits;
  }

  /**
   * Get target paper count for a purpose
   *
   * @param purpose Research purpose
   * @returns Target number of papers
   */
  getTargetPaperCount(purpose: ResearchPurpose): number {
    return this.getPaperLimits(purpose).target;
  }

  /**
   * Get maximum paper count for a purpose
   *
   * @param purpose Research purpose
   * @returns Maximum number of papers
   */
  getMaxPaperCount(purpose: ResearchPurpose): number {
    return this.getPaperLimits(purpose).max;
  }

  /**
   * Get minimum paper count for a purpose
   *
   * @param purpose Research purpose
   * @returns Minimum number of papers
   */
  getMinPaperCount(purpose: ResearchPurpose): number {
    return this.getPaperLimits(purpose).min;
  }

  // ==========================================================================
  // QUALITY SCORING METHODS
  // ==========================================================================

  /**
   * Get quality weights for a purpose
   *
   * @param purpose Research purpose
   * @returns Quality weights configuration
   */
  getQualityWeights(purpose: ResearchPurpose): QualityWeights {
    return this.getConfig(purpose).qualityWeights;
  }

  /**
   * Get initial quality threshold for a purpose
   *
   * @param purpose Research purpose
   * @returns Initial quality threshold (0-100)
   */
  getInitialThreshold(purpose: ResearchPurpose): number {
    return this.getConfig(purpose).qualityThreshold.initial;
  }

  /**
   * Get minimum quality threshold for a purpose
   *
   * @param purpose Research purpose
   * @returns Minimum quality threshold (0-100)
   */
  getMinThreshold(purpose: ResearchPurpose): number {
    return this.getConfig(purpose).qualityThreshold.min;
  }

  /**
   * Get threshold relaxation steps for a purpose
   *
   * @param purpose Research purpose
   * @returns Array of threshold values in descending order
   */
  getRelaxationSteps(purpose: ResearchPurpose): readonly number[] {
    return this.getConfig(purpose).qualityThreshold.relaxationSteps;
  }

  // ==========================================================================
  // FULL-TEXT METHODS
  // ==========================================================================

  /**
   * Get minimum full-text papers required
   *
   * @param purpose Research purpose
   * @returns Minimum papers with full-text required
   */
  getMinFullTextRequired(purpose: ResearchPurpose): number {
    return this.getConfig(purpose).fullTextRequirement.minRequired;
  }

  /**
   * Check if full-text is strictly required
   *
   * @param purpose Research purpose
   * @returns true if full-text is strictly required
   */
  isFullTextRequired(purpose: ResearchPurpose): boolean {
    return this.getConfig(purpose).fullTextRequirement.strictRequirement;
  }

  /**
   * Get full-text boost score for a purpose
   *
   * @param purpose Research purpose
   * @returns Score boost for papers with full-text
   */
  getFullTextBoost(purpose: ResearchPurpose): number {
    return this.getConfig(purpose).fullTextRequirement.fullTextBoost;
  }

  /**
   * Get content priority for a purpose
   *
   * @param purpose Research purpose
   * @returns Content priority level
   */
  getContentPriority(purpose: ResearchPurpose): ContentPriority {
    return this.getConfig(purpose).contentPriority;
  }

  /**
   * Get minimum word count for a purpose's content priority
   *
   * @param purpose Research purpose
   * @returns Minimum word count required
   */
  getMinWordCount(purpose: ResearchPurpose): number {
    const priority = this.getContentPriority(purpose);
    return CONTENT_PRIORITY_WORD_COUNTS[priority];
  }

  // ==========================================================================
  // DIVERSITY METHODS
  // ==========================================================================

  /**
   * Check if diversity tracking is required
   *
   * @param purpose Research purpose
   * @returns true if diversity tracking is required
   */
  isDiversityRequired(purpose: ResearchPurpose): boolean {
    return this.getConfig(purpose).diversityRequired;
  }

  /**
   * Get diversity weight (Q-methodology only)
   *
   * @param purpose Research purpose
   * @returns Diversity weight or 0 if not applicable
   */
  getDiversityWeight(purpose: ResearchPurpose): number {
    return this.getQualityWeights(purpose).diversity ?? 0;
  }

  // ==========================================================================
  // VALIDATION METHODS
  // ==========================================================================

  /**
   * Get validation thresholds for theme extraction
   *
   * @param purpose Research purpose
   * @returns Validation thresholds
   */
  getValidationThresholds(purpose: ResearchPurpose): ValidationThresholds {
    return this.getConfig(purpose).validation;
  }

  /**
   * Get target theme count range
   *
   * @param purpose Research purpose
   * @returns Target themes configuration
   */
  getTargetThemes(purpose: ResearchPurpose): TargetThemes {
    return this.getConfig(purpose).targetThemes;
  }

  // ==========================================================================
  // METADATA METHODS
  // ==========================================================================

  /**
   * Get scientific method description for a purpose
   *
   * @param purpose Research purpose
   * @returns Scientific method description
   */
  getScientificMethod(purpose: ResearchPurpose): string {
    return this.getConfig(purpose).scientificMethod;
  }

  /**
   * Get metadata for a purpose (display name, description, etc.)
   *
   * @param purpose Research purpose
   * @returns Purpose metadata
   */
  getMetadata(purpose: ResearchPurpose): PurposeMetadata {
    // Validate purpose first
    if (!isValidResearchPurpose(purpose)) {
      throw new BadRequestException(
        `Invalid ResearchPurpose: ${purpose}`,
      );
    }

    const metadata = PURPOSE_METADATA[purpose];

    if (!metadata) {
      throw new InternalServerErrorException(
        `Metadata missing for valid purpose: ${purpose}`,
      );
    }

    return metadata;
  }

  /**
   * Get all available purposes with metadata
   *
   * @returns Array of purpose metadata
   */
  getAllPurposes(): PurposeMetadata[] {
    return Object.values(PURPOSE_METADATA);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Validate a research purpose string
   *
   * @param value Value to validate
   * @returns true if value is a valid ResearchPurpose
   */
  isValidPurpose(value: unknown): value is ResearchPurpose {
    return isValidResearchPurpose(value);
  }

  /**
   * Parse a purpose string to enum
   *
   * @param value String value to parse
   * @returns ResearchPurpose enum value
   * @throws BadRequestException if value is invalid
   */
  parsePurpose(value: string): ResearchPurpose {
    if (!isValidResearchPurpose(value)) {
      throw new BadRequestException(
        `Invalid ResearchPurpose: ${value}. Must be one of: ${RESEARCH_PURPOSES.join(', ')}`,
      );
    }
    return value;
  }

  /**
   * Log configuration summary for debugging
   *
   * @param purpose Research purpose
   */
  logConfigSummary(purpose: ResearchPurpose): void {
    const config = this.getConfig(purpose);
    const metadata = this.getMetadata(purpose);

    this.logger.log(`
=== Purpose-Aware Configuration ===
Purpose: ${metadata.displayName} (${purpose})
Scientific Method: ${config.scientificMethod}

Paper Limits:
  - Min: ${config.paperLimits.min}
  - Target: ${config.paperLimits.target}
  - Max: ${config.paperLimits.max}

Quality Weights:
  - Content: ${config.qualityWeights.content}
  - Citation: ${config.qualityWeights.citation}
  - Journal: ${config.qualityWeights.journal}
  - Methodology: ${config.qualityWeights.methodology}
  - Diversity: ${config.qualityWeights.diversity ?? 'N/A'}

Quality Threshold:
  - Initial: ${config.qualityThreshold.initial}%
  - Min: ${config.qualityThreshold.min}%

Full-Text:
  - Priority: ${config.contentPriority}
  - Min Required: ${config.fullTextRequirement.minRequired}
  - Strict: ${config.fullTextRequirement.strictRequirement}
  - Boost: +${config.fullTextRequirement.fullTextBoost}

Target Themes: ${config.targetThemes.min}-${config.targetThemes.max}
Diversity Required: ${config.diversityRequired}
===================================
    `);
  }

  /**
   * Compare configurations between two purposes
   *
   * @param purpose1 First purpose
   * @param purpose2 Second purpose
   * @returns Comparison summary
   */
  compareConfigs(
    purpose1: ResearchPurpose,
    purpose2: ResearchPurpose,
  ): {
    differences: string[];
    config1: PurposeFetchingConfig;
    config2: PurposeFetchingConfig;
  } {
    const config1 = this.getConfig(purpose1);
    const config2 = this.getConfig(purpose2);
    const differences: string[] = [];

    // Compare paper limits
    if (config1.paperLimits.target !== config2.paperLimits.target) {
      differences.push(
        `Paper target: ${purpose1}=${config1.paperLimits.target}, ${purpose2}=${config2.paperLimits.target}`,
      );
    }

    // Compare journal weight
    if (config1.qualityWeights.journal !== config2.qualityWeights.journal) {
      differences.push(
        `Journal weight: ${purpose1}=${config1.qualityWeights.journal}, ${purpose2}=${config2.qualityWeights.journal}`,
      );
    }

    // Compare content priority
    if (config1.contentPriority !== config2.contentPriority) {
      differences.push(
        `Content priority: ${purpose1}=${config1.contentPriority}, ${purpose2}=${config2.contentPriority}`,
      );
    }

    // Compare diversity requirement
    if (config1.diversityRequired !== config2.diversityRequired) {
      differences.push(
        `Diversity required: ${purpose1}=${config1.diversityRequired}, ${purpose2}=${config2.diversityRequired}`,
      );
    }

    return { differences, config1, config2 };
  }
}
