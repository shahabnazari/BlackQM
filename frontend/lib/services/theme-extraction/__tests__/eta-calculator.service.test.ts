/**
 * ETACalculatorService Unit Tests - Phase 10.93 Day 4
 *
 * Tests estimated time remaining calculation with rolling window average.
 *
 * @module theme-extraction/__tests__/eta-calculator.service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ETACalculator } from '../eta-calculator.service';

describe('ETACalculatorService', () => {
  let calculator: ETACalculator;

  beforeEach(() => {
    calculator = new ETACalculator({
      windowSize: 5,
      minSamples: 2,
    });
  });

  describe('recordCompletion', () => {
    it('should record task completion time', () => {
      // Arrange
      const startTime = 1000;
      const endTime = 1500;

      // Act
      calculator.recordCompletion(startTime, endTime);

      const estimate = calculator.getEstimate(1, 10);

      // Assert - Should have 1 sample
      expect(estimate.averageTaskMs).toBeCloseTo(500, 0); // 1500 - 1000
    });

    it('should maintain rolling window of completions', () => {
      // Arrange - Record 7 completions with window size 5
      calculator.recordCompletion(0, 100); // 100ms
      calculator.recordCompletion(100, 300); // 200ms
      calculator.recordCompletion(300, 600); // 300ms
      calculator.recordCompletion(600, 1000); // 400ms
      calculator.recordCompletion(1000, 1500); // 500ms
      calculator.recordCompletion(1500, 2100); // 600ms (oldest 100ms dropped)
      calculator.recordCompletion(2100, 2800); // 700ms (oldest 200ms dropped)

      // Act
      const estimate = calculator.getEstimate(7, 10);

      // Assert - Average should be (300+400+500+600+700)/5 = 500ms
      expect(estimate.averageTaskMs).toBeCloseTo(500, 0);
    });

    it('should ignore invalid time ranges', () => {
      // Arrange
      const startTime = 1500;
      const endTime = 1000; // End before start

      // Act
      calculator.recordCompletion(startTime, endTime);

      const estimate = calculator.getEstimate(1, 10);

      // Assert - Should have no samples
      expect(estimate.isReliable).toBe(false);
      expect(estimate.samplesUsed).toBe(0);
    });
  });

  describe('getEstimate', () => {
    it('should mark estimate as unreliable when insufficient samples', () => {
      // Arrange
      calculator.recordCompletion(0, 100); // Only 1 sample, need 2

      // Act
      const estimate = calculator.getEstimate(1, 10);

      // Assert
      expect(estimate.isReliable).toBe(false);
      expect(estimate.samplesUsed).toBe(1);
      expect(estimate.formatted).toBe('Calculating...');
    });

    it('should mark estimate as reliable when sufficient samples', () => {
      // Arrange
      calculator.recordCompletion(0, 1000); // 1s
      calculator.recordCompletion(1000, 2000); // 1s

      // Act
      const estimate = calculator.getEstimate(2, 10);

      // Assert
      expect(estimate.isReliable).toBe(true);
      expect(estimate.samplesUsed).toBe(2);
    });

    it('should calculate remaining time correctly', () => {
      // Arrange - Average task time = 1000ms
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);
      calculator.recordCompletion(2000, 3000);

      // Act - 3 completed, 10 total = 7 remaining * 1000ms = 7000ms
      const estimate = calculator.getEstimate(3, 10);

      // Assert
      expect(estimate.isReliable).toBe(true);
      expect(estimate.estimatedMs).toBeCloseTo(7000, 0);
    });

    it('should return 0 remaining time when all tasks complete', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act
      const estimate = calculator.getEstimate(10, 10);

      // Assert
      expect(estimate.estimatedMs).toBe(0);
      expect(estimate.formatted).toBe('Complete');
    });

    it('should adapt to changing task durations', () => {
      // Arrange - Tasks get slower over time
      calculator.recordCompletion(0, 500); // 500ms
      calculator.recordCompletion(500, 1500); // 1000ms
      calculator.recordCompletion(1500, 3000); // 1500ms

      // Act
      const estimate = calculator.getEstimate(3, 10);

      // Assert - Average = (500+1000+1500)/3 = 1000ms
      // Remaining = 7 * 1000 = 7000ms
      expect(estimate.averageTaskMs).toBeCloseTo(1000, 0);
      expect(estimate.estimatedMs).toBeCloseTo(7000, 0);
    });
  });

  describe('formatTime', () => {
    it('should format time less than 1 second', () => {
      // Arrange
      calculator.recordCompletion(0, 100);
      calculator.recordCompletion(100, 300);

      // Act - 2 completed, 3 total = 1 * 200ms = 200ms remaining
      const estimate = calculator.getEstimate(2, 3);

      // Assert
      expect(estimate.formatted).toBe('< 1s');
    });

    it('should format seconds only (1-59s)', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 47 total = 45 * 1000ms = 45000ms = 45s
      const estimate = calculator.getEstimate(2, 47);

      // Assert
      expect(estimate.formatted).toBe('45s');
    });

    it('should format minutes and seconds (1-59m)', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 152 total = 150 * 1000ms = 150000ms = 2m 30s
      const estimate = calculator.getEstimate(2, 152);

      // Assert
      expect(estimate.formatted).toBe('2m 30s');
    });

    it('should format hours and minutes (1-23h)', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 5402 total = 5400 * 1000ms = 5400000ms = 1h 30m
      const estimate = calculator.getEstimate(2, 5402);

      // Assert
      expect(estimate.formatted).toBe('1h 30m');
    });

    it('should format as > 24h for very long operations', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 86402 total = 86400 * 1000ms = 86400000ms = 24h
      const estimate = calculator.getEstimate(2, 86402);

      // Assert
      expect(estimate.formatted).toBe('> 24h');
    });

    it('should handle edge case of exactly 1 minute', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 62 total = 60 * 1000ms = 60000ms = 1m
      const estimate = calculator.getEstimate(2, 62);

      // Assert
      expect(estimate.formatted).toBe('1m');
    });

    it('should handle edge case of exactly 1 hour', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      // Act - 2 completed, 3602 total = 3600 * 1000ms = 3600000ms = 1h
      const estimate = calculator.getEstimate(2, 3602);

      // Assert
      expect(estimate.formatted).toBe('1h');
    });
  });

  describe('reset', () => {
    it('should clear all samples', () => {
      // Arrange
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);
      calculator.recordCompletion(2000, 3000);

      let estimate = calculator.getEstimate(3, 10);
      expect(estimate.isReliable).toBe(true);

      // Act
      calculator.reset();

      estimate = calculator.getEstimate(0, 10);

      // Assert
      expect(estimate.isReliable).toBe(false);
      expect(estimate.samplesUsed).toBe(0);
    });

    it('should allow new samples after reset', () => {
      // Arrange
      calculator.recordCompletion(0, 500);
      calculator.reset();

      // Act
      calculator.recordCompletion(0, 1000);
      calculator.recordCompletion(1000, 2000);

      const estimate = calculator.getEstimate(2, 10);

      // Assert
      expect(estimate.isReliable).toBe(true);
      expect(estimate.averageTaskMs).toBeCloseTo(1000, 0); // Not 500ms from before reset
    });
  });
});
