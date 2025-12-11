/**
 * Performance Monitor Service Tests - Phase 10.112 Week 1
 * Netflix-Grade CPU Tracking Implementation
 */

import { PerformanceMonitorService } from '../performance-monitor.service';
import type { PipelinePerformanceReport, StageMetrics } from '../../types/performance.types';

describe('PerformanceMonitorService - Phase 10.112 Netflix-Grade', () => {
  let monitor: PerformanceMonitorService;

  beforeEach(() => {
    monitor = new PerformanceMonitorService('test query', 'specific');
  });

  describe('Basic Stage Tracking', () => {
    it('should start and end stages correctly', () => {
      monitor.startStage('Test Stage', 100);
      const metrics: StageMetrics = monitor.endStage('Test Stage', 50);

      expect(metrics.stageName).toBe('Test Stage');
      expect(metrics.inputCount).toBe(100);
      expect(metrics.outputCount).toBe(50);
      expect(metrics.passRate).toBe(50);
      expect(metrics.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple stages', () => {
      monitor.startStage('Stage 1', 1000);
      monitor.endStage('Stage 1', 500);

      monitor.startStage('Stage 2', 500);
      monitor.endStage('Stage 2', 200);

      const report = monitor.getReport();
      expect(report.stages.length).toBe(2);
    });

    it('should auto-end previous stage if new stage started', () => {
      monitor.startStage('Stage 1', 100);
      monitor.startStage('Stage 2', 50); // Should auto-end Stage 1

      const report = monitor.getReport();
      expect(report.stages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Phase 10.112: CPU Tracking', () => {
    it('should track CPU usage for stages', () => {
      monitor.startStage('CPU Stage', 1000);

      // Do some CPU work
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i);
      }

      monitor.endStage('CPU Stage', 1000);

      const report = monitor.getReport();
      expect(report.averageCpuUsage).toBeGreaterThanOrEqual(0);
      expect(report.averageCpuUsage).toBeLessThanOrEqual(100);
    });

    it('should calculate weighted average CPU', () => {
      // Two stages with different durations
      monitor.startStage('Short Stage', 100);
      monitor.endStage('Short Stage', 100);

      monitor.startStage('Long Stage', 100);
      // Simulate some work
      const arr = new Array(10000).fill(0).map((_, i) => i * 2);
      arr.sort((a, b) => b - a);
      monitor.endStage('Long Stage', 100);

      const report = monitor.getReport();
      expect(typeof report.averageCpuUsage).toBe('number');
      expect(report.averageCpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should include CPU metrics in report', () => {
      monitor.startStage('Test', 100);
      monitor.endStage('Test', 100);

      const report: PipelinePerformanceReport = monitor.getReport();

      expect(report).toHaveProperty('averageCpuUsage');
      expect(typeof report.averageCpuUsage).toBe('number');
    });
  });

  describe('Memory Tracking', () => {
    it('should track memory before and after stages', () => {
      monitor.startStage('Memory Stage', 100);
      const metrics = monitor.endStage('Memory Stage', 100);

      expect(metrics.memoryBefore).toHaveProperty('heapUsed');
      expect(metrics.memoryAfter).toHaveProperty('heapUsed');
      expect(metrics.memoryBefore).toHaveProperty('rss');
      expect(metrics.memoryAfter).toHaveProperty('rss');
    });

    it('should calculate memory delta', () => {
      monitor.startStage('Memory Delta', 100);

      // Allocate some memory
      const largeArray = new Array(100000).fill({ data: 'test' });

      const metrics = monitor.endStage('Memory Delta', 100);

      expect(typeof metrics.memoryDelta).toBe('number');
      // Memory delta could be positive (allocation) or negative (GC)
      expect(isFinite(metrics.memoryDelta)).toBe(true);
    });
  });

  describe('Performance Report', () => {
    it('should generate complete report', () => {
      monitor.setInitialPaperCount(1000);
      monitor.startStage('Stage 1', 1000);
      monitor.endStage('Stage 1', 500);

      const report: PipelinePerformanceReport = monitor.getReport();

      expect(report.pipelineId).toMatch(/^pipeline_/);
      expect(report.query).toBe('test query');
      expect(report.queryComplexity).toBe('specific');
      expect(report.initialPaperCount).toBe(1000);
      expect(report.finalPaperCount).toBe(500);
      expect(report.overallPassRate).toBe(50);
      expect(report.totalDuration).toBeGreaterThanOrEqual(0);
      expect(report.peakMemory).toBeGreaterThanOrEqual(0);
      expect(report.success).toBe(true);
    });

    it('should calculate peak memory', () => {
      monitor.startStage('Stage 1', 100);
      monitor.endStage('Stage 1', 100);

      monitor.startStage('Stage 2', 100);
      // Allocate memory
      const data = new Array(50000).fill({ x: 1, y: 2 });
      monitor.endStage('Stage 2', 100);

      const report = monitor.getReport();
      expect(report.peakMemory).toBeGreaterThan(0);
    });

    it('should track memory allocated and freed', () => {
      monitor.startStage('Stage', 100);
      const arr = new Array(10000).fill(0);
      monitor.endStage('Stage', 100);

      const report = monitor.getReport();
      expect(report.totalMemoryAllocated).toBeGreaterThanOrEqual(0);
      expect(report.totalMemoryFreed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Optimization Metadata', () => {
    it('should track array copies', () => {
      monitor.recordArrayCopy();
      monitor.recordArrayCopy();

      const metadata = monitor.getOptimizationMetadata();
      expect(metadata.arrayCopiesCreated).toBe(2);
    });

    it('should track sort operations', () => {
      monitor.recordSortOperation();

      const metadata = monitor.getOptimizationMetadata();
      expect(metadata.sortOperations).toBe(1);
    });

    it('should have correct optimization version', () => {
      const metadata = monitor.getOptimizationMetadata();
      expect(metadata.optimizationVersion).toContain('phase10.112');
    });
  });

  describe('Reset', () => {
    it('should reset all metrics', () => {
      monitor.startStage('Stage', 100);
      monitor.endStage('Stage', 50);
      monitor.recordArrayCopy();
      monitor.recordSortOperation();

      monitor.reset();

      expect(monitor.getCompletedStageCount()).toBe(0);
      expect(monitor.getOptimizationMetadata().arrayCopiesCreated).toBe(0);
      expect(monitor.getOptimizationMetadata().sortOperations).toBe(0);
    });
  });

  describe('Stage State Checking', () => {
    it('should report if stage is active', () => {
      expect(monitor.isStageActive()).toBe(false);

      monitor.startStage('Test', 100);
      expect(monitor.isStageActive()).toBe(true);

      monitor.endStage('Test', 100);
      expect(monitor.isStageActive()).toBe(false);
    });

    it('should return current stage name', () => {
      expect(monitor.getCurrentStageName()).toBeNull();

      monitor.startStage('Active Stage', 100);
      expect(monitor.getCurrentStageName()).toBe('Active Stage');

      monitor.endStage('Active Stage', 100);
      expect(monitor.getCurrentStageName()).toBeNull();
    });

    it('should count completed stages', () => {
      expect(monitor.getCompletedStageCount()).toBe(0);

      monitor.startStage('Stage 1', 100);
      monitor.endStage('Stage 1', 100);
      expect(monitor.getCompletedStageCount()).toBe(1);

      monitor.startStage('Stage 2', 100);
      monitor.endStage('Stage 2', 100);
      expect(monitor.getCompletedStageCount()).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw when ending non-existent stage', () => {
      expect(() => monitor.endStage('Non-existent', 100)).toThrow();
    });

    it('should handle negative input count', () => {
      monitor.startStage('Negative Input', -10);
      const metrics = monitor.endStage('Negative Input', 0);

      // Should use 0 instead of negative
      expect(metrics.inputCount).toBe(0);
    });

    it('should handle negative output count', () => {
      monitor.startStage('Negative Output', 100);
      const metrics = monitor.endStage('Negative Output', -10);

      // Should use 0 instead of negative
      expect(metrics.outputCount).toBe(0);
    });
  });

  describe('Logging', () => {
    it('should log report without throwing', () => {
      monitor.startStage('Stage', 100);
      monitor.endStage('Stage', 50);

      expect(() => monitor.logReport()).not.toThrow();
    });

    it('should log summary without throwing', () => {
      monitor.startStage('Stage', 100);
      monitor.endStage('Stage', 50);

      expect(() => monitor.logSummary()).not.toThrow();
    });
  });

  describe('Query Complexity', () => {
    it('should support different query complexities', () => {
      const broadMonitor = new PerformanceMonitorService('query', 'broad');
      const comprehensiveMonitor = new PerformanceMonitorService('query', 'comprehensive');

      expect(broadMonitor.getReport().queryComplexity).toBe('broad');
      expect(comprehensiveMonitor.getReport().queryComplexity).toBe('comprehensive');
    });
  });
});
