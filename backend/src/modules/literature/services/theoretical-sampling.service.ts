/**
 * Phase 10.170 Week 4+: Theoretical Sampling Service
 *
 * Enterprise-grade implementation of theoretical sampling for Grounded Theory
 * research methodology (Glaser & Strauss, 1967; Strauss & Corbin, 1998).
 *
 * SECURITY (Critical #11): Infinite Loop Guards
 * - maxWaves: Limits sampling iterations
 * - maxTotalPapers: Caps total papers collected
 * - maxExecutionTimeMs: Hard timeout on execution
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Theoretical sampling: Sampling based on emerging theory
 * - Saturation: Point where no new concepts emerge
 * - Constant comparison: Continuous code-to-code analysis
 *
 * @module theoretical-sampling.service
 * @since Phase 10.170 Week 4+
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TheoreticalSamplingState,
  TheoreticalSamplingConfig,
  TheoreticalConcept,
  SaturationMetrics,
  PaperForFilter,
  DEFAULT_THEORETICAL_SAMPLING_CONFIG,
  validateTheoreticalSamplingConfig,
} from '../types/specialized-pipeline.types';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Paper search function for theoretical sampling
 */
export type TheoreticalSearchFn = (
  query: string,
  limit: number,
) => Promise<readonly PaperForFilter[]>;

/**
 * Concept extraction function
 */
export type ConceptExtractionFn = (
  papers: readonly PaperForFilter[],
) => Promise<readonly ExtractedConcept[]>;

/**
 * Extracted concept from papers
 */
export interface ExtractedConcept {
  readonly label: string;
  readonly frequency: number;
  readonly sourcePaperIds: readonly string[];
}

/**
 * Wave result from single sampling iteration
 */
export interface WaveResult {
  readonly wave: number;
  readonly papersAdded: readonly PaperForFilter[];
  readonly newConcepts: readonly TheoreticalConcept[];
  readonly saturationMetrics: SaturationMetrics;
  readonly durationMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Saturation detection thresholds
 */
const SATURATION_THRESHOLDS = {
  /** Waves without new concepts for saturation */
  WAVES_WITHOUT_NEW_CONCEPTS: 2,
  /** Minimum concept density for saturation */
  MIN_CONCEPT_DENSITY: 0.8,
  /** Minimum overall saturation score */
  MIN_SATURATION_SCORE: 0.85,
  /** Concept growth rate below which saturation is near */
  LOW_GROWTH_RATE: 0.1,
} as const;

/**
 * Query generation templates by concept type
 */
const QUERY_TEMPLATES = {
  expand: (concept: string) => `"${concept}" OR related:"${concept}"`,
  contrast: (concept: string) => `"${concept}" AND (controversy OR debate OR critique)`,
  boundary: (concept: string) => `"${concept}" AND (limitation OR boundary OR scope)`,
} as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class TheoreticalSamplingService {
  private readonly logger = new Logger(TheoreticalSamplingService.name);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Execute theoretical sampling with infinite loop guards
   *
   * SECURITY (Critical #11): All three guards enforced:
   * 1. maxWaves - limits iterations
   * 2. maxTotalPapers - limits collection size
   * 3. maxExecutionTimeMs - hard timeout
   *
   * @param initialPapers Papers to start sampling from
   * @param searchFn Function to search for more papers
   * @param extractFn Function to extract concepts from papers
   * @param config Sampling configuration with guards
   * @returns Final sampling state with saturation metrics
   */
  async executeSampling(
    initialPapers: readonly PaperForFilter[],
    searchFn: TheoreticalSearchFn,
    extractFn: ConceptExtractionFn,
    config: Partial<TheoreticalSamplingConfig> = {},
  ): Promise<TheoreticalSamplingState> {
    const startTime = Date.now();

    // Merge with defaults and validate
    const fullConfig: TheoreticalSamplingConfig = {
      ...DEFAULT_THEORETICAL_SAMPLING_CONFIG,
      ...config,
    };
    validateTheoreticalSamplingConfig(fullConfig);

    this.logger.log(
      `Starting theoretical sampling: maxWaves=${fullConfig.maxWaves}, ` +
        `maxPapers=${fullConfig.maxTotalPapers}, timeout=${fullConfig.maxExecutionTimeMs}ms`,
    );

    // Initialize state
    let state = this.initializeState(initialPapers);

    // Extract initial concepts
    const initialConcepts = await extractFn(initialPapers);
    state = this.updateConceptsFromExtraction(state, initialConcepts, 1);

    // SECURITY: Track last new concept wave for saturation
    let lastWaveWithNewConcepts = 1;
    let wavesSinceNewConcept = 0;

    // SECURITY (Critical #11): Main sampling loop with guards
    for (let wave = 2; wave <= fullConfig.maxWaves; wave++) {
      // GUARD 1: Check execution time
      const elapsed = Date.now() - startTime;
      if (elapsed >= fullConfig.maxExecutionTimeMs) {
        this.logger.warn(
          `Theoretical sampling terminated: execution timeout at wave ${wave} ` +
            `(${elapsed}ms >= ${fullConfig.maxExecutionTimeMs}ms)`,
        );
        break;
      }

      // GUARD 2: Check total papers
      if (state.papers.length >= fullConfig.maxTotalPapers) {
        this.logger.warn(
          `Theoretical sampling terminated: paper limit at wave ${wave} ` +
            `(${state.papers.length} >= ${fullConfig.maxTotalPapers})`,
        );
        break;
      }

      // Check for saturation before continuing
      if (this.isSaturated(state.saturationMetrics, fullConfig)) {
        this.logger.log(
          `Theoretical sampling complete: saturation reached at wave ${wave - 1}`,
        );
        state = this.markSaturationReached(state);
        break;
      }

      // Execute wave
      const waveResult = await this.executeWave(
        wave,
        state,
        searchFn,
        extractFn,
        fullConfig,
      );

      // Update state with wave results
      state = this.integrateWaveResult(state, waveResult);

      // Track concept emergence for saturation
      if (waveResult.newConcepts.length > 0) {
        lastWaveWithNewConcepts = wave;
        wavesSinceNewConcept = 0;
      } else {
        wavesSinceNewConcept = wave - lastWaveWithNewConcepts;
      }

      // Update saturation metrics with wave tracking
      state = this.updateSaturationMetrics(state, wavesSinceNewConcept);

      this.logger.debug(
        `Wave ${wave} complete: +${waveResult.papersAdded.length} papers, ` +
          `+${waveResult.newConcepts.length} concepts, ` +
          `saturation=${(state.saturationMetrics.overallSaturation * 100).toFixed(1)}%`,
      );
    }

    // Calculate final duration
    const totalDuration = Date.now() - startTime;

    return {
      ...state,
      durationMs: totalDuration,
    };
  }

  /**
   * Execute single sampling wave
   *
   * @param wave Wave number
   * @param state Current state
   * @param searchFn Search function
   * @param extractFn Concept extraction function
   * @param config Configuration
   * @returns Wave result
   */
  async executeWave(
    wave: number,
    state: TheoreticalSamplingState,
    searchFn: TheoreticalSearchFn,
    extractFn: ConceptExtractionFn,
    config: TheoreticalSamplingConfig,
  ): Promise<WaveResult> {
    const waveStart = Date.now();

    // Generate queries from unsaturated concepts
    const queries = this.generateQueriesFromConcepts(
      state.concepts.filter((c) => !c.isSaturated),
    );

    // Search for new papers
    const existingIds = new Set(state.papers.map((p) => p.id));
    const allNewPapers: PaperForFilter[] = [];

    for (const query of queries) {
      // Check if we have enough papers for this wave
      if (allNewPapers.length >= config.papersPerWave) {
        break;
      }

      // QUALITY FIX: Wrap searchFn in try/catch to handle API failures gracefully
      let searchResults: readonly PaperForFilter[];
      try {
        searchResults = await searchFn(
          query,
          config.papersPerWave - allNewPapers.length,
        );
      } catch (error) {
        this.logger.warn(
          `[TheoreticalSampling] Search failed for query "${query.substring(0, 50)}...": ${error}`,
        );
        // Continue with next query instead of failing entire wave
        continue;
      }

      // Filter out duplicates
      for (const paper of searchResults) {
        if (!existingIds.has(paper.id)) {
          allNewPapers.push(paper);
          existingIds.add(paper.id);

          if (allNewPapers.length >= config.papersPerWave) {
            break;
          }
        }
      }
    }

    // Extract concepts from new papers
    // QUALITY FIX: Wrap extractFn in try/catch to handle failures gracefully
    let extractedConcepts: readonly ExtractedConcept[];
    try {
      extractedConcepts = await extractFn(allNewPapers);
    } catch (error) {
      this.logger.warn(
        `[TheoreticalSampling] Concept extraction failed: ${error}`,
      );
      extractedConcepts = []; // Continue with no new concepts
    }

    // Identify new concepts (not in existing state)
    const existingConceptLabels = new Set(state.concepts.map((c) => c.label.toLowerCase()));
    const newConcepts: TheoreticalConcept[] = [];
    // QUALITY FIX: Guard against division by zero
    const newPaperCount = Math.max(1, allNewPapers.length);

    for (const extracted of extractedConcepts) {
      if (!existingConceptLabels.has(extracted.label.toLowerCase())) {
        newConcepts.push({
          id: this.generateConceptId(extracted.label),
          label: extracted.label,
          supportingPaperIds: extracted.sourcePaperIds,
          density: extracted.frequency / newPaperCount,
          isSaturated: false,
          firstWave: wave,
          lastActiveWave: wave,
        });
      }
    }

    // Calculate saturation metrics for this wave
    const saturationMetrics = this.calculateWaveSaturationMetrics(
      state.concepts,
      newConcepts,
      wave,
    );

    return {
      wave,
      papersAdded: allNewPapers,
      newConcepts,
      saturationMetrics,
      durationMs: Date.now() - waveStart,
    };
  }

  /**
   * Check if a specific concept is saturated
   *
   * @param concept Concept to check
   * @param currentWave Current wave number
   * @param inactiveWaveThreshold Waves of inactivity for saturation
   * @returns Whether concept is saturated
   */
  isConceptSaturated(
    concept: TheoreticalConcept,
    currentWave: number,
    inactiveWaveThreshold: number = SATURATION_THRESHOLDS.WAVES_WITHOUT_NEW_CONCEPTS,
  ): boolean {
    const wavesInactive = currentWave - concept.lastActiveWave;
    return wavesInactive >= inactiveWaveThreshold && concept.density >= SATURATION_THRESHOLDS.MIN_CONCEPT_DENSITY;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Initialize sampling state from initial papers
   */
  private initializeState(papers: readonly PaperForFilter[]): TheoreticalSamplingState {
    return {
      wave: 1,
      papers: [...papers],
      concepts: [],
      saturationReached: false,
      saturationMetrics: {
        newConceptsLastWave: 0,
        conceptGrowthRate: 1.0,
        saturatedPercentage: 0,
        overallSaturation: 0,
        wavesSinceNewConcept: 0,
      },
      durationMs: 0,
    };
  }

  /**
   * Update concepts from extraction results
   *
   * QUALITY FIX: Guards against division by zero when state.papers is empty
   */
  private updateConceptsFromExtraction(
    state: TheoreticalSamplingState,
    extracted: readonly ExtractedConcept[],
    wave: number,
  ): TheoreticalSamplingState {
    // Guard against division by zero
    const paperCount = Math.max(1, state.papers.length);

    const newConcepts: TheoreticalConcept[] = extracted.map((e) => ({
      id: this.generateConceptId(e.label),
      label: e.label,
      supportingPaperIds: e.sourcePaperIds,
      density: e.frequency / paperCount,
      isSaturated: false,
      firstWave: wave,
      lastActiveWave: wave,
    }));

    return {
      ...state,
      concepts: [...state.concepts, ...newConcepts],
      saturationMetrics: {
        ...state.saturationMetrics,
        newConceptsLastWave: newConcepts.length,
        conceptGrowthRate: newConcepts.length / wave,
      },
    };
  }

  /**
   * Generate queries from concepts for theoretical sampling
   */
  private generateQueriesFromConcepts(concepts: readonly TheoreticalConcept[]): readonly string[] {
    if (concepts.length === 0) {
      return [];
    }

    const queries: string[] = [];

    // Prioritize concepts by density (lower density = need more sampling)
    const sortedConcepts = [...concepts].sort((a, b) => a.density - b.density);

    // Generate different query types
    for (const concept of sortedConcepts.slice(0, 5)) {
      // Expansion query - find more of the same
      queries.push(QUERY_TEMPLATES.expand(concept.label));

      // If density is low, also add contrasting query
      if (concept.density < 0.5) {
        queries.push(QUERY_TEMPLATES.contrast(concept.label));
      }
    }

    // Add boundary queries for high-density concepts
    for (const concept of sortedConcepts.filter((c) => c.density >= 0.7).slice(0, 3)) {
      queries.push(QUERY_TEMPLATES.boundary(concept.label));
    }

    return queries;
  }

  /**
   * Integrate wave result into state
   */
  private integrateWaveResult(
    state: TheoreticalSamplingState,
    waveResult: WaveResult,
  ): TheoreticalSamplingState {
    // Update existing concepts with new paper support
    const updatedConcepts = state.concepts.map((concept) => {
      // Check if any new papers support this concept
      const newSupportingPapers = waveResult.papersAdded
        .filter((p) =>
          // Simple heuristic: check if concept label appears in title/abstract
          p.title.toLowerCase().includes(concept.label.toLowerCase()) ||
          (p.abstract?.toLowerCase().includes(concept.label.toLowerCase()) ?? false),
        )
        .map((p) => p.id);

      if (newSupportingPapers.length > 0) {
        return {
          ...concept,
          supportingPaperIds: [...concept.supportingPaperIds, ...newSupportingPapers],
          lastActiveWave: waveResult.wave,
          density: (concept.supportingPaperIds.length + newSupportingPapers.length) /
            (state.papers.length + waveResult.papersAdded.length),
        };
      }
      return concept;
    });

    return {
      ...state,
      wave: waveResult.wave,
      papers: [...state.papers, ...waveResult.papersAdded],
      concepts: [...updatedConcepts, ...waveResult.newConcepts],
      saturationMetrics: waveResult.saturationMetrics,
    };
  }

  /**
   * Calculate saturation metrics for a wave
   */
  private calculateWaveSaturationMetrics(
    existingConcepts: readonly TheoreticalConcept[],
    newConcepts: readonly TheoreticalConcept[],
    wave: number,
  ): SaturationMetrics {
    const totalConcepts = existingConcepts.length + newConcepts.length;
    const saturatedConcepts = existingConcepts.filter(
      (c) => this.isConceptSaturated(c, wave),
    ).length;

    const saturatedPercentage = totalConcepts > 0 ? saturatedConcepts / totalConcepts : 0;
    const conceptGrowthRate = wave > 1 ? newConcepts.length / wave : newConcepts.length;

    // Calculate overall saturation score
    // Factors: percentage saturated, growth rate decline, waves without new concepts
    const growthFactor = Math.max(0, 1 - conceptGrowthRate / SATURATION_THRESHOLDS.LOW_GROWTH_RATE);
    const overallSaturation = (saturatedPercentage * 0.6 + growthFactor * 0.4);

    return {
      newConceptsLastWave: newConcepts.length,
      conceptGrowthRate,
      saturatedPercentage,
      overallSaturation: Math.min(1, overallSaturation),
      wavesSinceNewConcept: newConcepts.length > 0 ? 0 : 1,
    };
  }

  /**
   * Update saturation metrics with wave tracking
   */
  private updateSaturationMetrics(
    state: TheoreticalSamplingState,
    wavesSinceNewConcept: number,
  ): TheoreticalSamplingState {
    return {
      ...state,
      saturationMetrics: {
        ...state.saturationMetrics,
        wavesSinceNewConcept,
        overallSaturation: this.calculateOverallSaturation(
          state.saturationMetrics,
          wavesSinceNewConcept,
          state.concepts.length,
        ),
      },
    };
  }

  /**
   * Calculate overall saturation score
   */
  private calculateOverallSaturation(
    metrics: SaturationMetrics,
    wavesSinceNewConcept: number,
    totalConcepts: number,
  ): number {
    // Saturation increases when:
    // 1. Many waves pass without new concepts
    // 2. High percentage of concepts are saturated
    // 3. Growth rate is declining

    const wavesFactor = Math.min(1, wavesSinceNewConcept / SATURATION_THRESHOLDS.WAVES_WITHOUT_NEW_CONCEPTS);
    const saturatedFactor = metrics.saturatedPercentage;
    const growthFactor = Math.max(0, 1 - metrics.conceptGrowthRate);

    // Weighted combination
    const overallSaturation = (
      wavesFactor * 0.4 +
      saturatedFactor * 0.4 +
      growthFactor * 0.2
    );

    return Math.min(1, Math.max(0, overallSaturation));
  }

  /**
   * Check if saturation has been reached
   */
  private isSaturated(metrics: SaturationMetrics, config: TheoreticalSamplingConfig): boolean {
    // Multiple criteria for saturation:
    // 1. Enough waves without new concepts
    // 2. High enough saturation score
    // 3. Low enough growth rate

    const waveCriteria = metrics.wavesSinceNewConcept >= config.saturationThreshold;
    const scoreCriteria = metrics.overallSaturation >= SATURATION_THRESHOLDS.MIN_SATURATION_SCORE;
    const growthCriteria = metrics.conceptGrowthRate < SATURATION_THRESHOLDS.LOW_GROWTH_RATE;
    const densityCriteria = metrics.saturatedPercentage >= config.conceptDensityThreshold;

    // Saturation reached if wave criteria met AND (score or density criteria)
    return waveCriteria && (scoreCriteria || densityCriteria || growthCriteria);
  }

  /**
   * Mark saturation as reached in state
   */
  private markSaturationReached(state: TheoreticalSamplingState): TheoreticalSamplingState {
    return {
      ...state,
      saturationReached: true,
      saturationMetrics: {
        ...state.saturationMetrics,
        overallSaturation: 1.0,
      },
    };
  }

  /**
   * Generate unique concept ID
   *
   * QUALITY FIX: Added random component to prevent collisions under high concurrency.
   * Previously used only Date.now() which could collide in parallel processing.
   */
  private generateConceptId(label: string): string {
    const normalized = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8); // 6 random chars
    return `concept_${normalized}_${timestamp}_${random}`;
  }
}
