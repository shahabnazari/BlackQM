/**
 * Performance Metrics Service - Phase 10.93 Day 4
 *
 * Enterprise-grade performance tracking for theme extraction workflow.
 * Tracks timing, throughput, success rates, and resource usage.
 *
 * @module theme-extraction/PerformanceMetricsService
 * @since Phase 10.93 Day 4
 *
 * **Purpose:**
 * - Track operation timing (identify bottlenecks)
 * - Monitor success/failure rates
 * - Measure throughput (papers per second)
 * - Track memory usage (detect leaks)
 * - Generate performance reports
 *
 * **Usage:**
 * ```typescript
 * const metrics = new PerformanceMetricsService();
 *
 * metrics.startTimer('fullTextExtraction');
 * await extractFullText();
 * metrics.endTimer('fullTextExtraction');
 *
 * metrics.recordSuccess();
 * metrics.recordFailure();
 *
 * const report = metrics.generateReport();
 * logger.info('Performance', 'metrics', report);
 * ```
 */

import { logger } from '@/lib/utils/logger';

/**
 * Timer record for tracking operation duration
 */
interface TimerRecord {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
}

/**
 * Performance metrics report
 */
export interface PerformanceReport {
  // Timing metrics
  totalDurationMs: number;
  operationTimings: Record<string, number>;
  slowestOperation: {
    name: string;
    durationMs: number;
  } | null;

  // Success/failure metrics
  totalOperations: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-100

  // Throughput metrics
  itemsProcessed: number;
  itemsPerSecond: number;

  // Memory metrics
  peakMemoryMB: number;
  currentMemoryMB: number;

  // Timestamps
  startTime: number;
  endTime: number | null;
}

/**
 * Performance Metrics Service
 *
 * Tracks performance metrics for theme extraction operations.
 *
 * **Enterprise Features:**
 * - High-precision timing using performance.now()
 * - Memory usage tracking (when available)
 * - Bottleneck identification
 * - Throughput calculation
 * - Success rate monitoring
 * - Zero performance overhead when not tracking
 *
 * **Use Cases:**
 * - Production monitoring
 * - Performance optimization
 * - Capacity planning
 * - User feedback (ETA calculation)
 */
export class PerformanceMetricsService {
  private timers: Map<string, TimerRecord> = new Map();
  private completedTimers: TimerRecord[] = [];
  private successCount: number = 0;
  private failureCount: number = 0;
  private itemsProcessed: number = 0;
  private peakMemoryMB: number = 0;
  private workflowStartTime: number = 0;
  private workflowEndTime: number | null = null;

  /**
   * Create a new performance metrics service
   *
   * Automatically starts tracking workflow time.
   *
   * @example
   * ```typescript
   * const metrics = new PerformanceMetricsService();
   * // Workflow timing starts automatically
   * ```
   */
  constructor() {
    this.workflowStartTime = performance.now();
    this.trackMemoryUsage(); // Initial memory snapshot
  }

  /**
   * Start a named timer
   *
   * Tracks the start time of an operation. Call endTimer() with
   * the same name to record duration.
   *
   * @param name - Unique timer name
   *
   * @example
   * ```typescript
   * metrics.startTimer('paperSaving');
   * await savePapers();
   * metrics.endTimer('paperSaving');
   * ```
   */
  public startTimer(name: string): void {
    const startTime = performance.now();

    this.timers.set(name, {
      name,
      startTime,
    });

    logger.debug('Timer started', 'PerformanceMetricsService', { name });
  }

  /**
   * End a named timer and record duration
   *
   * Calculates elapsed time since startTimer() was called.
   *
   * @param name - Timer name (must match startTimer() call)
   * @returns Duration in milliseconds
   *
   * @throws {Error} If timer was not started
   *
   * @example
   * ```typescript
   * metrics.startTimer('metadataRefresh');
   * await refreshMetadata();
   * const durationMs = metrics.endTimer('metadataRefresh');
   * console.log(`Took ${durationMs}ms`);
   * ```
   */
  public endTimer(name: string): number {
    const timer = this.timers.get(name);

    if (!timer) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const endTime = performance.now();
    const durationMs = Math.round(endTime - timer.startTime);

    // Update timer record
    timer.endTime = endTime;
    timer.durationMs = durationMs;

    // Move to completed timers
    this.completedTimers.push(timer);
    this.timers.delete(name);

    logger.debug('Timer ended', 'PerformanceMetricsService', {
      name,
      durationMs,
    });

    return durationMs;
  }

  /**
   * Record a successful operation
   *
   * Increments success counter for success rate calculation.
   *
   * @example
   * ```typescript
   * try {
   *   await savePaper();
   *   metrics.recordSuccess();
   * } catch {
   *   metrics.recordFailure();
   * }
   * ```
   */
  public recordSuccess(): void {
    this.successCount++;
  }

  /**
   * Record a failed operation
   *
   * Increments failure counter for success rate calculation.
   *
   * @example
   * ```typescript
   * try {
   *   await savePaper();
   *   metrics.recordSuccess();
   * } catch {
   *   metrics.recordFailure();
   * }
   * ```
   */
  public recordFailure(): void {
    this.failureCount++;
  }

  /**
   * Record items processed
   *
   * Tracks number of items (papers, videos, etc.) processed
   * for throughput calculation.
   *
   * @param count - Number of items processed
   *
   * @example
   * ```typescript
   * metrics.recordItemsProcessed(25); // Processed 25 papers
   * ```
   */
  public recordItemsProcessed(count: number): void {
    this.itemsProcessed += count;
  }

  /**
   * Track current memory usage
   *
   * Records peak memory usage if current usage is higher.
   * Only works in browsers that support performance.memory.
   *
   * **Note:** performance.memory is non-standard and may not be available.
   *
   * @example
   * ```typescript
   * // Track memory periodically
   * setInterval(() => metrics.trackMemoryUsage(), 1000);
   * ```
   */
  public trackMemoryUsage(): void {
    const currentMB = this.getCurrentMemoryUsageMB();

    if (currentMB > this.peakMemoryMB) {
      this.peakMemoryMB = currentMB;
    }
  }

  /**
   * Get current memory usage in MB
   *
   * Returns 0 if performance.memory is not available.
   *
   * @returns Current memory usage in MB
   *
   * @private
   */
  private getCurrentMemoryUsageMB(): number {
    // ===========================
    // TYPE-001 FIX: Proper type for non-standard performance.memory API
    // ===========================
    // Define interface for non-standard performance.memory API
    // Available in Chrome/Edge, not in Firefox/Safari
    interface PerformanceWithMemory extends Performance {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }

    const perf = performance as PerformanceWithMemory;

    if (perf.memory && perf.memory.usedJSHeapSize) {
      return Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
    }

    return 0;
  }

  /**
   * Mark workflow as complete
   *
   * Records end time for total duration calculation.
   *
   * @example
   * ```typescript
   * const metrics = new PerformanceMetricsService();
   * // ... do work ...
   * metrics.complete();
   * const report = metrics.generateReport();
   * ```
   */
  public complete(): void {
    this.workflowEndTime = performance.now();
    this.trackMemoryUsage(); // Final memory snapshot
  }

  /**
   * Generate performance report
   *
   * Compiles all tracked metrics into a comprehensive report.
   *
   * @returns Performance metrics report
   *
   * @example
   * ```typescript
   * const report = metrics.generateReport();
   * logger.info('Performance Report', 'metrics', {
   *   totalDurationMs: report.totalDurationMs,
   *   successRate: report.successRate,
   *   itemsPerSecond: report.itemsPerSecond,
   *   bottleneck: report.slowestOperation?.name,
   * });
   * ```
   */
  public generateReport(): PerformanceReport {
    // Calculate total duration
    const endTime = this.workflowEndTime || performance.now();
    const totalDurationMs = Math.round(endTime - this.workflowStartTime);

    // Compile operation timings
    const operationTimings: Record<string, number> = {};
    this.completedTimers.forEach((timer) => {
      if (timer.durationMs !== undefined) {
        operationTimings[timer.name] = timer.durationMs;
      }
    });

    // Find slowest operation
    let slowestOperation: { name: string; durationMs: number } | null = null;
    this.completedTimers.forEach((timer) => {
      if (
        timer.durationMs !== undefined &&
        (!slowestOperation || timer.durationMs > slowestOperation.durationMs)
      ) {
        slowestOperation = {
          name: timer.name,
          durationMs: timer.durationMs,
        };
      }
    });

    // Calculate success rate
    const totalOperations = this.successCount + this.failureCount;
    const successRate =
      totalOperations > 0
        ? Math.round((this.successCount / totalOperations) * 100)
        : 0;

    // Calculate throughput (items per second)
    const durationSeconds = totalDurationMs / 1000;
    const itemsPerSecond =
      durationSeconds > 0
        ? Math.round((this.itemsProcessed / durationSeconds) * 100) / 100 // 2 decimal places
        : 0;

    return {
      // Timing
      totalDurationMs,
      operationTimings,
      slowestOperation,

      // Success/failure
      totalOperations,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate,

      // Throughput
      itemsProcessed: this.itemsProcessed,
      itemsPerSecond,

      // Memory
      peakMemoryMB: this.peakMemoryMB,
      currentMemoryMB: this.getCurrentMemoryUsageMB(),

      // Timestamps
      startTime: this.workflowStartTime,
      endTime: this.workflowEndTime,
    };
  }

  /**
   * Get formatted performance summary
   *
   * Returns human-readable performance summary string.
   *
   * @returns Formatted summary
   *
   * @example
   * ```typescript
   * const summary = metrics.getSummary();
   * console.log(summary);
   * // Output: "Processed 25 items in 12.3s (2.03 items/s) - Success: 96%"
   * ```
   */
  public getSummary(): string {
    const report = this.generateReport();
    const durationSeconds = (report.totalDurationMs / 1000).toFixed(1);

    return (
      `Processed ${report.itemsProcessed} items in ${durationSeconds}s ` +
      `(${report.itemsPerSecond} items/s) - ` +
      `Success: ${report.successRate}%` +
      (report.slowestOperation
        ? ` - Bottleneck: ${report.slowestOperation.name} (${report.slowestOperation.durationMs}ms)`
        : '')
    );
  }

  /**
   * Reset all metrics
   *
   * Clears all tracked data and restarts workflow timer.
   *
   * @example
   * ```typescript
   * metrics.reset(); // Start fresh
   * ```
   */
  public reset(): void {
    this.timers.clear();
    this.completedTimers = [];
    this.successCount = 0;
    this.failureCount = 0;
    this.itemsProcessed = 0;
    this.peakMemoryMB = 0;
    this.workflowStartTime = performance.now();
    this.workflowEndTime = null;
  }
}
