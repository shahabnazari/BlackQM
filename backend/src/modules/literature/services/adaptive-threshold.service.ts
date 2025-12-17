/**
 * Phase 10.170 Week 3: Adaptive Threshold Relaxation Service
 *
 * Enterprise-grade service for progressive quality threshold relaxation
 * when insufficient papers meet the initial threshold.
 *
 * ALGORITHM:
 * 1. Start with purpose-specific initial threshold
 * 2. If target not met, relax to next step
 * 3. Continue until target met OR minimum threshold reached
 * 4. Return final threshold with full history
 *
 * SCIENTIFIC FOUNDATION:
 * - Saturation-based sampling (Braun & Clarke, 2019)
 * - Adaptive threshold algorithms (Robertson & Walker, 1994)
 * - Purpose-specific bounds (Phase 10.170 research)
 *
 * GUARANTEES:
 * - Never goes below minimum threshold
 * - Always returns deterministic results
 * - Full audit trail of relaxation steps
 *
 * @module adaptive-threshold.service
 * @since Phase 10.170 Week 3
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ResearchPurpose,
  QualityThreshold,
} from '../types/purpose-aware.types';
import {
  ThresholdRelaxationResult,
  ThresholdStep,
  PurposeAwareScoreResult,
  validateThresholdRelaxation,
} from '../types/purpose-aware-scoring.types';
import { PurposeAwareConfigService } from './purpose-aware-config.service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Relaxation strategy options
 */
export interface RelaxationOptions {
  /** Maximum relaxation steps to attempt (default: all available) */
  readonly maxSteps?: number;
  /** Minimum papers required (overrides config) */
  readonly minPapers?: number;
  /** Whether to emit progress events */
  readonly emitProgress?: boolean;
  /** Callback for progress updates */
  readonly onStepComplete?: (step: ThresholdStep) => void;
}

/**
 * Internal state during relaxation
 */
interface RelaxationState {
  currentThreshold: number;
  stepsApplied: number;
  history: ThresholdStep[];
  passingCount: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class AdaptiveThresholdService {
  private readonly logger = new Logger(AdaptiveThresholdService.name);

  constructor(
    private readonly configService: PurposeAwareConfigService,
  ) {
    this.logger.log('✅ [AdaptiveThreshold] Phase 10.170 Week 3 - Service initialized');
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Apply adaptive threshold relaxation to scored papers
   *
   * Progressively relaxes the quality threshold until the target paper
   * count is met or the minimum threshold is reached.
   *
   * @param scores Pre-scored papers with total scores
   * @param purpose Research purpose (determines threshold config)
   * @param targetCount Target number of papers to achieve
   * @param options Optional relaxation options
   * @returns Threshold relaxation result with passing papers
   */
  applyAdaptiveThreshold(
    scores: readonly PurposeAwareScoreResult[],
    purpose: ResearchPurpose,
    targetCount: number,
    options?: RelaxationOptions,
  ): ThresholdRelaxationResult {
    // Get purpose-specific threshold configuration
    const config = this.configService.getConfig(purpose);
    const thresholdConfig = config.qualityThreshold;

    // Validate inputs
    this.validateInputs(scores, targetCount, thresholdConfig);

    // Initialize state
    const state: RelaxationState = {
      currentThreshold: thresholdConfig.initial,
      stepsApplied: 0,
      history: [],
      passingCount: this.countPassing(scores, thresholdConfig.initial),
    };

    // Log initial state
    this.logger.log(
      `[AdaptiveThreshold] Starting: ${scores.length} papers, ` +
      `target=${targetCount}, initial threshold=${thresholdConfig.initial}%, ` +
      `initial passing=${state.passingCount}`
    );

    // Add initial step to history
    state.history.push({
      step: 0,
      threshold: thresholdConfig.initial,
      passingCount: state.passingCount,
      appliedAt: Date.now(),
    });

    // Check if target already met
    if (state.passingCount >= targetCount) {
      return this.buildResult(state, thresholdConfig, targetCount);
    }

    // Apply relaxation steps
    const maxSteps = options?.maxSteps ?? thresholdConfig.relaxationSteps.length;
    const relaxationSteps = thresholdConfig.relaxationSteps.slice(0, maxSteps);

    for (const nextThreshold of relaxationSteps) {
      // Skip if already below this threshold
      if (state.currentThreshold <= nextThreshold) {
        continue;
      }

      // Skip if below minimum
      if (nextThreshold < thresholdConfig.min) {
        this.logger.warn(
          `[AdaptiveThreshold] Skipping step ${nextThreshold}% (below minimum ${thresholdConfig.min}%)`
        );
        continue;
      }

      // Apply relaxation
      state.stepsApplied++;
      state.currentThreshold = nextThreshold;
      state.passingCount = this.countPassing(scores, nextThreshold);

      // Record step
      const step: ThresholdStep = {
        step: state.stepsApplied,
        threshold: nextThreshold,
        passingCount: state.passingCount,
        appliedAt: Date.now(),
      };
      state.history.push(step);

      // Emit progress if requested
      options?.onStepComplete?.(step);

      this.logger.log(
        `[AdaptiveThreshold] Step ${state.stepsApplied}: ` +
        `threshold=${nextThreshold}%, passing=${state.passingCount}`
      );

      // Check if target met
      if (state.passingCount >= targetCount) {
        break;
      }
    }

    // Build and validate result
    const result = this.buildResult(state, thresholdConfig, targetCount);
    validateThresholdRelaxation(result);

    // Log final state
    this.logger.log(
      `[AdaptiveThreshold] Complete: ${state.stepsApplied} steps, ` +
      `final threshold=${state.currentThreshold}%, ` +
      `passing=${state.passingCount}/${targetCount} (${result.targetMet ? 'TARGET MET' : 'target not met'})`
    );

    return result;
  }

  /**
   * Get optimal threshold for a target count
   *
   * Binary search for the highest threshold that yields at least targetCount papers.
   *
   * @param scores Pre-scored papers
   * @param targetCount Target number of papers
   * @param minThreshold Minimum acceptable threshold
   * @param maxThreshold Maximum threshold (default: 100)
   * @returns Optimal threshold value
   */
  findOptimalThreshold(
    scores: readonly PurposeAwareScoreResult[],
    targetCount: number,
    minThreshold: number,
    maxThreshold: number = 100,
  ): number {
    // Binary search for optimal threshold
    let low = minThreshold;
    let high = maxThreshold;
    let optimal = minThreshold;

    while (low <= high) {
      const mid = Math.round((low + high) / 2);
      const count = this.countPassing(scores, mid);

      if (count >= targetCount) {
        // Can potentially use higher threshold
        optimal = mid;
        low = mid + 1;
      } else {
        // Need lower threshold
        high = mid - 1;
      }
    }

    return optimal;
  }

  /**
   * Simulate relaxation without modifying state
   *
   * Useful for previewing the effect of relaxation.
   *
   * @param scores Pre-scored papers
   * @param purpose Research purpose
   * @param targetCount Target number of papers
   * @returns Simulated relaxation result
   */
  simulateRelaxation(
    scores: readonly PurposeAwareScoreResult[],
    purpose: ResearchPurpose,
    targetCount: number,
  ): ThresholdRelaxationResult {
    return this.applyAdaptiveThreshold(scores, purpose, targetCount);
  }

  /**
   * Get threshold distribution analysis
   *
   * Shows how many papers would pass at each threshold level.
   */
  analyzeThresholdDistribution(
    scores: readonly PurposeAwareScoreResult[],
    steps: readonly number[] = [90, 80, 70, 60, 50, 40, 30, 20],
  ): ReadonlyArray<{ threshold: number; passingCount: number; percentage: number }> {
    return steps.map(threshold => ({
      threshold,
      passingCount: this.countPassing(scores, threshold),
      percentage: scores.length > 0
        ? Math.round((this.countPassing(scores, threshold) / scores.length) * 100)
        : 0,
    }));
  }

  /**
   * Get recommended threshold for purpose
   *
   * Based on score distribution and purpose requirements.
   */
  getRecommendedThreshold(
    scores: readonly PurposeAwareScoreResult[],
    purpose: ResearchPurpose,
  ): {
    recommended: number;
    reason: string;
    coverage: number;
  } {
    const config = this.configService.getConfig(purpose);
    const targetCount = config.paperLimits.target;

    // Find threshold that achieves target
    const optimal = this.findOptimalThreshold(
      scores,
      targetCount,
      config.qualityThreshold.min,
      config.qualityThreshold.initial,
    );

    const coverage = this.countPassing(scores, optimal);

    let reason: string;
    if (optimal >= config.qualityThreshold.initial) {
      reason = 'Initial threshold achieves target count';
    } else if (optimal > config.qualityThreshold.min) {
      reason = `Relaxed threshold to achieve ${targetCount} papers`;
    } else {
      reason = 'Minimum threshold reached; target may not be achievable';
    }

    return { recommended: optimal, reason, coverage };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Count papers passing a threshold
   */
  private countPassing(
    scores: readonly PurposeAwareScoreResult[],
    threshold: number,
  ): number {
    return scores.filter(s => s.totalScore >= threshold).length;
  }

  /**
   * Validate inputs
   */
  private validateInputs(
    scores: readonly PurposeAwareScoreResult[],
    targetCount: number,
    thresholdConfig: QualityThreshold,
  ): void {
    if (!Array.isArray(scores)) {
      throw new Error('Scores must be an array');
    }
    if (!Number.isInteger(targetCount) || targetCount < 0) {
      throw new Error(`Target count must be non-negative integer, got: ${targetCount}`);
    }
    if (thresholdConfig.initial < thresholdConfig.min) {
      throw new Error(
        `Initial threshold (${thresholdConfig.initial}) cannot be less than minimum (${thresholdConfig.min})`
      );
    }
  }

  /**
   * Build final relaxation result
   */
  private buildResult(
    state: RelaxationState,
    thresholdConfig: QualityThreshold,
    targetCount: number,
  ): ThresholdRelaxationResult {
    return {
      originalThreshold: thresholdConfig.initial,
      currentThreshold: state.currentThreshold,
      stepsApplied: state.stepsApplied,
      maxSteps: thresholdConfig.relaxationSteps.length,
      passingPapers: state.passingCount,
      targetCount,
      targetMet: state.passingCount >= targetCount,
      atMinimum: state.currentThreshold <= thresholdConfig.min,
      history: Object.freeze([...state.history]),
    };
  }
}
