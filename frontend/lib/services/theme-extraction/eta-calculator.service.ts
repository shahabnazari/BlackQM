/**
 * ETA Calculator Service - Phase 10.93 Day 4
 *
 * Enterprise-grade estimated time remaining calculation.
 * Uses rolling average for accurate predictions.
 *
 * @module theme-extraction/ETACalculatorService
 * @since Phase 10.93 Day 4
 *
 * **Purpose:**
 * - Calculate estimated time remaining for long operations
 * - Provide user-friendly time formatting
 * - Use rolling window to adapt to varying task durations
 * - Handle edge cases (initial tasks, completed tasks, varying speeds)
 *
 * **Algorithm:**
 * 1. Track completion times for last N tasks (rolling window)
 * 2. Calculate average time per task
 * 3. Multiply by remaining tasks
 * 4. Format as human-readable string
 *
 * **Usage:**
 * ```typescript
 * const eta = new ETACalculator({ windowSize: 10 });
 *
 * // Record each task completion
 * const startTime = Date.now();
 * await processTask();
 * eta.recordCompletion(startTime, Date.now());
 *
 * // Get estimate
 * const estimate = eta.getEstimate(completed, total);
 * console.log(estimate.formatted); // "2m 30s remaining"
 * ```
 */

import { logger } from '@/lib/utils/logger';

/**
 * ETA calculation options
 */
export interface ETACalculatorOptions {
  /**
   * Number of recent completions to track (rolling window)
   * @default 10
   */
  windowSize?: number;

  /**
   * Minimum samples required before showing estimate
   * @default 3
   */
  minSamples?: number;
}

/**
 * ETA estimate result
 */
export interface ETAEstimate {
  /** Estimated milliseconds remaining */
  estimatedMs: number;

  /** Estimated seconds remaining (rounded) */
  estimatedSeconds: number;

  /** Human-readable formatted time */
  formatted: string;

  /** Average milliseconds per task (for debugging) */
  averageTaskMs: number;

  /** Number of samples used in calculation */
  samplesUsed: number;

  /** Whether estimate is reliable (enough samples) */
  isReliable: boolean;
}

/**
 * Default ETA calculator options
 */
const DEFAULT_ETA_OPTIONS: Required<ETACalculatorOptions> = {
  windowSize: 10,
  minSamples: 3,
};

/**
 * ETA Calculator Service
 *
 * Calculates estimated time remaining using rolling average.
 *
 * **Enterprise Features:**
 * - Adaptive estimation (rolling window)
 * - Handles varying task durations
 * - Reliability indicator (enough samples?)
 * - Human-readable formatting
 * - Edge case handling
 *
 * **Why Rolling Window?**
 * Tasks may vary in duration:
 * - Early tasks: Download metadata (fast)
 * - Later tasks: Extract full-text (slow)
 *
 * Rolling window focuses on recent tasks, providing more accurate
 * estimates as the operation progresses.
 *
 * **Example:**
 * ```
 * Tasks 1-5:   Fast (100ms each)  → Initial ETA: 10s for 100 tasks
 * Tasks 6-15:  Slow (2000ms each) → Updated ETA: 3m for remaining 85 tasks
 * ```
 */
export class ETACalculator {
  private completionTimes: number[] = [];
  private readonly options: Required<ETACalculatorOptions>;

  /**
   * Create a new ETA calculator
   *
   * @param options - Calculator options
   *
   * @example
   * ```typescript
   * const eta = new ETACalculator({
   *   windowSize: 20,  // Track last 20 completions
   *   minSamples: 5,   // Need 5 samples before showing estimate
   * });
   * ```
   */
  constructor(options: ETACalculatorOptions = {}) {
    this.options = {
      ...DEFAULT_ETA_OPTIONS,
      ...options,
    };

    logger.debug('ETA calculator created', 'ETACalculator', {
      windowSize: this.options.windowSize,
      minSamples: this.options.minSamples,
    });
  }

  /**
   * Record task completion
   *
   * Tracks duration of completed task for average calculation.
   * Maintains rolling window of size `windowSize`.
   *
   * @param startTimeMs - Task start time (from Date.now() or performance.now())
   * @param endTimeMs - Task end time
   *
   * @example
   * ```typescript
   * const eta = new ETACalculator();
   *
   * for (const task of tasks) {
   *   const start = Date.now();
   *   await processTask(task);
   *   eta.recordCompletion(start, Date.now());
   * }
   * ```
   */
  public recordCompletion(startTimeMs: number, endTimeMs: number): void {
    const durationMs = endTimeMs - startTimeMs;

    // Add to completion times
    this.completionTimes.push(durationMs);

    // Maintain rolling window (remove oldest if exceeds window size)
    if (this.completionTimes.length > this.options.windowSize) {
      this.completionTimes.shift(); // Remove first (oldest) element
    }

    logger.debug('Task completion recorded', 'ETACalculator', {
      durationMs: Math.round(durationMs),
      samplesStored: this.completionTimes.length,
      windowSize: this.options.windowSize,
    });
  }

  /**
   * Get estimated time remaining
   *
   * **Calculation:**
   * 1. Calculate average time per task (from rolling window)
   * 2. Multiply by remaining tasks (total - completed)
   * 3. Format as human-readable string
   *
   * **Edge Cases:**
   * - No samples: Returns "Calculating..." (not reliable)
   * - Few samples (< minSamples): Returns estimate but marked as unreliable
   * - All tasks complete: Returns "Complete" (0ms remaining)
   *
   * @param completed - Number of completed tasks
   * @param total - Total number of tasks
   * @returns ETA estimate
   *
   * @example
   * ```typescript
   * const estimate = eta.getEstimate(23, 100);
   *
   * if (estimate.isReliable) {
   *   console.log(`ETA: ${estimate.formatted}`); // "2m 15s remaining"
   * } else {
   *   console.log('Calculating ETA...');
   * }
   * ```
   */
  public getEstimate(completed: number, total: number): ETAEstimate {
    // Edge case: All tasks complete
    if (completed >= total) {
      return {
        estimatedMs: 0,
        estimatedSeconds: 0,
        formatted: 'Complete',
        averageTaskMs: 0,
        samplesUsed: this.completionTimes.length,
        isReliable: true,
      };
    }

    // Edge case: No samples yet
    if (this.completionTimes.length === 0) {
      return {
        estimatedMs: 0,
        estimatedSeconds: 0,
        formatted: 'Calculating...',
        averageTaskMs: 0,
        samplesUsed: 0,
        isReliable: false,
      };
    }

    // Calculate average time per task
    const totalTime = this.completionTimes.reduce((sum, time) => sum + time, 0);
    const averageTaskMs = totalTime / this.completionTimes.length;

    // Calculate remaining tasks
    const remainingTasks = total - completed;

    // Calculate estimated time remaining
    const estimatedMs = Math.round(averageTaskMs * remainingTasks);
    const estimatedSeconds = Math.round(estimatedMs / 1000);

    // Format time
    const formatted = this.formatTimeRemaining(estimatedMs);

    // Determine reliability
    const isReliable = this.completionTimes.length >= this.options.minSamples;

    logger.debug('ETA calculated', 'ETACalculator', {
      completed,
      total,
      remainingTasks,
      averageTaskMs: Math.round(averageTaskMs),
      estimatedMs,
      formatted,
      samplesUsed: this.completionTimes.length,
      isReliable,
    });

    return {
      estimatedMs,
      estimatedSeconds,
      formatted,
      averageTaskMs,
      samplesUsed: this.completionTimes.length,
      isReliable,
    };
  }

  /**
   * Format time remaining as human-readable string
   *
   * **Format Rules:**
   * - < 1s: "< 1s"
   * - 1-59s: "Xs" (e.g., "23s")
   * - 1-59m 0s: "Xm" (e.g., "5m")
   * - 1-59m with seconds: "Xm Ys" (e.g., "2m 30s")
   * - 1-23h: "Xh Ym" (e.g., "1h 15m")
   * - 24h+: "> 24h"
   *
   * @param ms - Milliseconds remaining
   * @returns Formatted time string
   *
   * @private
   *
   * @example
   * ```typescript
   * formatTimeRemaining(500);      // "< 1s"
   * formatTimeRemaining(5000);     // "5s"
   * formatTimeRemaining(65000);    // "1m 5s"
   * formatTimeRemaining(300000);   // "5m"
   * formatTimeRemaining(3900000);  // "1h 5m"
   * ```
   */
  private formatTimeRemaining(ms: number): string {
    // Less than 1 second
    if (ms < 1000) {
      return '< 1s';
    }

    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    // 24+ hours
    if (hours >= 24) {
      return '> 24h';
    }

    // Hours (1-23h)
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }

    // Minutes (1-59m)
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    }

    // Seconds only (1-59s)
    return `${seconds}s`;
  }

  /**
   * Get formatted ETA string for UI
   *
   * Convenience method that returns formatted ETA or fallback message.
   *
   * @param completed - Number of completed tasks
   * @param total - Total number of tasks
   * @returns Formatted ETA string
   *
   * @example
   * ```typescript
   * const eta = calculator.getFormattedETA(25, 100);
   * console.log(`${eta} remaining`); // "2m 15s remaining"
   * ```
   */
  public getFormattedETA(completed: number, total: number): string {
    const estimate = this.getEstimate(completed, total);
    return estimate.formatted;
  }

  /**
   * Check if ETA estimate is reliable
   *
   * Returns true if enough samples have been collected.
   *
   * @returns true if estimate is reliable
   *
   * @example
   * ```typescript
   * if (eta.isReliable()) {
   *   showETA();
   * } else {
   *   showSpinner();
   * }
   * ```
   */
  public isReliable(): boolean {
    return this.completionTimes.length >= this.options.minSamples;
  }

  /**
   * Get average task duration
   *
   * Returns average milliseconds per task based on rolling window.
   *
   * @returns Average task duration in milliseconds, or 0 if no samples
   *
   * @example
   * ```typescript
   * const avgMs = eta.getAverageTaskDuration();
   * console.log(`Average: ${avgMs}ms per task`);
   * ```
   */
  public getAverageTaskDuration(): number {
    if (this.completionTimes.length === 0) {
      return 0;
    }

    const total = this.completionTimes.reduce((sum, time) => sum + time, 0);
    return Math.round(total / this.completionTimes.length);
  }

  /**
   * Reset ETA calculator
   *
   * Clears all completion time samples.
   *
   * @example
   * ```typescript
   * eta.reset(); // Start fresh for new batch
   * ```
   */
  public reset(): void {
    this.completionTimes = [];
    logger.debug('ETA calculator reset', 'ETACalculator');
  }

  /**
   * Get statistics
   *
   * Returns current state for debugging/monitoring.
   *
   * @returns Calculator statistics
   *
   * @example
   * ```typescript
   * const stats = eta.getStats();
   * console.log(`Samples: ${stats.samplesStored}`);
   * console.log(`Average: ${stats.averageMs}ms`);
   * ```
   */
  public getStats(): {
    samplesStored: number;
    windowSize: number;
    averageMs: number;
    minMs: number;
    maxMs: number;
  } {
    const averageMs = this.getAverageTaskDuration();
    const minMs =
      this.completionTimes.length > 0 ? Math.min(...this.completionTimes) : 0;
    const maxMs =
      this.completionTimes.length > 0 ? Math.max(...this.completionTimes) : 0;

    return {
      samplesStored: this.completionTimes.length,
      windowSize: this.options.windowSize,
      averageMs: Math.round(averageMs),
      minMs: Math.round(minMs),
      maxMs: Math.round(maxMs),
    };
  }
}
