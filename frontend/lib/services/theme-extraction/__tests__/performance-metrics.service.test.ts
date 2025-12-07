/**
 * PerformanceMetricsService Unit Tests - Phase 10.93 Day 4
 *
 * Tests performance tracking and metrics reporting.
 *
 * @module theme-extraction/__tests__/performance-metrics.service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMetricsService } from '../performance-metrics.service';

describe('PerformanceMetricsService', () => {
  let metrics: PerformanceMetricsService;

  beforeEach(() => {
    metrics = new PerformanceMetricsService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('timer operations', () => {
    it('should track operation timing', () => {
      // Arrange
      metrics.startTimer('testOperation');

      // Act - Advance time by 1000ms
      vi.advanceTimersByTime(1000);
      metrics.endTimer('testOperation');

      const report = metrics.generateReport();

      // Assert
      expect(report.operationTimings['testOperation']).toBeGreaterThanOrEqual(1000);
      expect(report.operationTimings['testOperation']).toBeLessThan(1100);
    });

    it('should track multiple operations independently', () => {
      // Arrange & Act
      metrics.startTimer('operation1');
      vi.advanceTimersByTime(500);

      metrics.startTimer('operation2');
      vi.advanceTimersByTime(300);
      metrics.endTimer('operation1'); // Total 800ms

      vi.advanceTimersByTime(200);
      metrics.endTimer('operation2'); // Total 500ms

      const report = metrics.generateReport();

      // Assert
      expect(report.operationTimings['operation1']).toBeGreaterThanOrEqual(800);
      expect(report.operationTimings['operation1']).toBeLessThan(900);

      expect(report.operationTimings['operation2']).toBeGreaterThanOrEqual(500);
      expect(report.operationTimings['operation2']).toBeLessThan(600);
    });

    it('should handle endTimer for non-existent operation gracefully', () => {
      // Act
      metrics.endTimer('nonExistentOperation');

      const report = metrics.generateReport();

      // Assert - Should not crash, but operation won't be in report
      expect(report.operationTimings['nonExistentOperation']).toBeUndefined();
    });

    it('should handle duplicate startTimer calls by overwriting', () => {
      // Arrange
      metrics.startTimer('operation');
      vi.advanceTimersByTime(500);

      // Act - Start again (should overwrite)
      metrics.startTimer('operation');
      vi.advanceTimersByTime(200);
      metrics.endTimer('operation');

      const report = metrics.generateReport();

      // Assert - Should only count time from second start (200ms)
      expect(report.operationTimings['operation']).toBeGreaterThanOrEqual(200);
      expect(report.operationTimings['operation']).toBeLessThan(300);
    });
  });

  describe('success/failure tracking', () => {
    it('should track success and failure counts', () => {
      // Act
      metrics.recordSuccess();
      metrics.recordSuccess();
      metrics.recordFailure();

      const report = metrics.generateReport();

      // Assert
      expect(report.successCount).toBe(2);
      expect(report.failureCount).toBe(1);
      expect(report.successRate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });

    it('should calculate 0% success rate when all operations fail', () => {
      // Act
      metrics.recordFailure();
      metrics.recordFailure();
      metrics.recordFailure();

      const report = metrics.generateReport();

      // Assert
      expect(report.successRate).toBe(0);
    });

    it('should calculate 100% success rate when all operations succeed', () => {
      // Act
      metrics.recordSuccess();
      metrics.recordSuccess();
      metrics.recordSuccess();

      const report = metrics.generateReport();

      // Assert
      expect(report.successRate).toBe(100);
    });

    it('should return 100% success rate when no operations recorded', () => {
      // Act
      const report = metrics.generateReport();

      // Assert
      expect(report.successRate).toBe(100);
    });
  });

  describe('items processed tracking', () => {
    it('should track items processed', () => {
      // Act
      metrics.recordItemsProcessed(10);
      metrics.recordItemsProcessed(5);
      metrics.recordItemsProcessed(3);

      const report = metrics.generateReport();

      // Assert
      expect(report.totalItemsProcessed).toBe(18);
    });

    it('should calculate items per second', () => {
      // Arrange
      metrics.startTimer('batch');
      vi.advanceTimersByTime(2000); // 2 seconds
      metrics.endTimer('batch');

      // Act
      metrics.recordItemsProcessed(20); // 20 items in 2 seconds = 10/sec

      const report = metrics.generateReport();

      // Assert
      expect(report.itemsPerSecond).toBeCloseTo(10, 1);
    });

    it('should return 0 items/sec when total duration is 0', () => {
      // Arrange
      metrics.complete(); // Immediately complete without any operations

      // Act
      metrics.recordItemsProcessed(10);
      const report = metrics.generateReport();

      // Assert
      expect(report.itemsPerSecond).toBe(0);
    });
  });

  describe('report generation', () => {
    it('should generate comprehensive performance report', () => {
      // Arrange
      metrics.startTimer('operation1');
      vi.advanceTimersByTime(1000);
      metrics.endTimer('operation1');

      metrics.startTimer('operation2');
      vi.advanceTimersByTime(500);
      metrics.endTimer('operation2');

      metrics.recordSuccess();
      metrics.recordFailure();
      metrics.recordItemsProcessed(50);
      metrics.complete();

      // Act
      const report = metrics.generateReport();

      // Assert
      expect(report).toMatchObject({
        totalDurationMs: expect.any(Number),
        operationTimings: {
          operation1: expect.any(Number),
          operation2: expect.any(Number),
        },
        successCount: 1,
        failureCount: 1,
        successRate: 50,
        totalItemsProcessed: 50,
        itemsPerSecond: expect.any(Number),
      });

      expect(report.totalDurationMs).toBeGreaterThan(0);
      expect(report.peakMemoryMB).toBeGreaterThanOrEqual(0);
    });

    it('should identify slowest operation as bottleneck', () => {
      // Arrange
      metrics.startTimer('fastOperation');
      vi.advanceTimersByTime(100);
      metrics.endTimer('fastOperation');

      metrics.startTimer('slowOperation');
      vi.advanceTimersByTime(5000);
      metrics.endTimer('slowOperation');

      metrics.startTimer('mediumOperation');
      vi.advanceTimersByTime(1000);
      metrics.endTimer('mediumOperation');

      metrics.complete();

      // Act
      const report = metrics.generateReport();

      // Assert
      expect(report.slowestOperation).toBeDefined();
      expect(report.slowestOperation?.name).toBe('slowOperation');
      expect(report.slowestOperation?.durationMs).toBeGreaterThanOrEqual(5000);
    });

    it('should return undefined slowestOperation when no operations tracked', () => {
      // Arrange
      metrics.complete();

      // Act
      const report = metrics.generateReport();

      // Assert
      expect(report.slowestOperation).toBeUndefined();
    });
  });

  describe('complete', () => {
    it('should mark metrics as complete and finalize total duration', () => {
      // Arrange
      metrics.startTimer('operation');
      vi.advanceTimersByTime(1000);
      metrics.endTimer('operation');

      // Act
      const beforeComplete = metrics.generateReport();
      metrics.complete();
      const afterComplete = metrics.generateReport();

      // Assert
      expect(beforeComplete.totalDurationMs).toBeGreaterThan(0);
      expect(afterComplete.totalDurationMs).toBeGreaterThanOrEqual(beforeComplete.totalDurationMs);
    });
  });
});
