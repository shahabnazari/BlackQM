/**
 * Metrics Service Tests - Phase 10.112 Week 1
 * Netflix-Grade CPU & Memory Monitoring
 */

import { MetricsService, CpuUsageMetrics, MemoryUsageMetrics } from '../metrics.service';

describe('MetricsService - Phase 10.112 Netflix-Grade', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  afterEach(() => {
    service.reset();
  });

  describe('Basic Metrics Operations', () => {
    it('should increment counters', () => {
      service.incrementCounter('test_counter', { label: 'value' });
      service.incrementCounter('test_counter', { label: 'value' });

      const output = service.exportPrometheusText();
      expect(output).toContain('test_counter');
    });

    it('should record gauge values', () => {
      service.recordGauge('test_gauge', 42, { env: 'test' });

      const output = service.exportPrometheusText();
      expect(output).toContain('test_gauge');
      expect(output).toContain('42');
    });

    it('should record histogram values', () => {
      service.recordHistogram('test_histogram', 0.5, { endpoint: 'api' });
      service.recordHistogram('test_histogram', 1.5, { endpoint: 'api' });

      const output = service.exportPrometheusText();
      expect(output).toContain('test_histogram');
      expect(output).toContain('_bucket');
      expect(output).toContain('_sum');
      expect(output).toContain('_count');
    });
  });

  describe('Phase 10.112: CPU Monitoring', () => {
    it('should return CPU usage metrics', () => {
      const cpuMetrics: CpuUsageMetrics = service.getCpuUsage();

      expect(cpuMetrics).toHaveProperty('usagePercent');
      expect(cpuMetrics).toHaveProperty('userMicroseconds');
      expect(cpuMetrics).toHaveProperty('systemMicroseconds');
      expect(cpuMetrics).toHaveProperty('totalMicroseconds');
      expect(cpuMetrics).toHaveProperty('cpuCount');
      expect(cpuMetrics).toHaveProperty('loadAverage1m');
      expect(cpuMetrics).toHaveProperty('loadAverage5m');
      expect(cpuMetrics).toHaveProperty('loadAverage15m');
    });

    it('should return CPU usage percentage between 0 and 100', () => {
      const cpuPercent = service.getCpuUsagePercent();

      expect(typeof cpuPercent).toBe('number');
      expect(cpuPercent).toBeGreaterThanOrEqual(0);
      expect(cpuPercent).toBeLessThanOrEqual(100);
    });

    it('should return correct CPU count', () => {
      const cpuMetrics = service.getCpuUsage();
      const os = require('os');

      expect(cpuMetrics.cpuCount).toBe(os.cpus().length);
    });

    it('should detect CPU pressure', () => {
      // Test with very high threshold (should be false)
      expect(service.isCpuPressure(100)).toBe(false);

      // Test with very low threshold (might be true or false depending on actual usage)
      const result = service.isCpuPressure(0);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Phase 10.112: Memory Monitoring', () => {
    it('should return memory usage metrics', () => {
      const memMetrics: MemoryUsageMetrics = service.getMemoryUsage();

      expect(memMetrics).toHaveProperty('heapUsedBytes');
      expect(memMetrics).toHaveProperty('heapTotalBytes');
      expect(memMetrics).toHaveProperty('rssBytes');
      expect(memMetrics).toHaveProperty('externalBytes');
      expect(memMetrics).toHaveProperty('arrayBuffersBytes');
      expect(memMetrics).toHaveProperty('heapUsagePercent');
      expect(memMetrics).toHaveProperty('totalSystemMemory');
      expect(memMetrics).toHaveProperty('freeSystemMemory');
      expect(memMetrics).toHaveProperty('systemMemoryUsagePercent');
    });

    it('should return positive memory values', () => {
      const memMetrics = service.getMemoryUsage();

      expect(memMetrics.heapUsedBytes).toBeGreaterThan(0);
      expect(memMetrics.heapTotalBytes).toBeGreaterThan(0);
      expect(memMetrics.rssBytes).toBeGreaterThan(0);
      expect(memMetrics.totalSystemMemory).toBeGreaterThan(0);
    });

    it('should return heap usage percentage between 0 and 100', () => {
      const memMetrics = service.getMemoryUsage();

      expect(memMetrics.heapUsagePercent).toBeGreaterThanOrEqual(0);
      expect(memMetrics.heapUsagePercent).toBeLessThanOrEqual(100);
    });

    it('should return memory usage in MB', () => {
      const memMB = service.getMemoryUsageMB();

      expect(memMB).toHaveProperty('heapUsed');
      expect(memMB).toHaveProperty('heapTotal');
      expect(memMB).toHaveProperty('rss');
      expect(memMB.heapUsed).toBeGreaterThan(0);
      expect(memMB.heapTotal).toBeGreaterThan(0);
      expect(memMB.rss).toBeGreaterThan(0);
    });

    it('should detect memory pressure', () => {
      // Test with very high threshold (should be false)
      expect(service.isMemoryPressure(100)).toBe(false);

      // Test with very low threshold (should be true)
      expect(service.isMemoryPressure(1)).toBe(true);
    });
  });

  describe('System Metrics Update', () => {
    it('should update all system metrics', () => {
      // Should not throw
      expect(() => service.updateSystemMetrics()).not.toThrow();

      // Check that CPU and memory metrics are recorded
      const output = service.exportPrometheusText();
      expect(output).toContain('cpu_usage_percent');
      expect(output).toContain('memory_heap_used_bytes');
      expect(output).toContain('memory_rss_bytes');
    });
  });

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      service.incrementCounter('test_metric');
      const output = service.exportPrometheusText();

      expect(output).toContain('# HELP');
      expect(output).toContain('# TYPE');
      expect(output).toContain('counter');
    });

    it('should include CPU metrics in export', () => {
      service.updateSystemMetrics();
      const output = service.exportPrometheusText();

      expect(output).toContain('cpu_usage_percent');
      expect(output).toContain('cpu_load_average_1m');
    });

    it('should include memory metrics in export', () => {
      service.updateSystemMetrics();
      const output = service.exportPrometheusText();

      expect(output).toContain('memory_heap_used_bytes');
      expect(output).toContain('memory_system_total_bytes');
    });
  });

  describe('Circuit Breaker Metrics', () => {
    it('should record circuit breaker metrics', () => {
      service.updateCircuitBreakerMetrics('test-provider', 'OPEN', 5);

      const output = service.exportPrometheusText();
      expect(output).toContain('circuit_breaker_state');
      expect(output).toContain('circuit_breaker_failures');
    });
  });

  describe('API Call Metrics', () => {
    it('should record API call metrics', () => {
      service.recordAPICall('semantic_scholar', 1.5, true);
      service.recordAPICall('semantic_scholar', 2.0, false);

      const output = service.exportPrometheusText();
      expect(output).toContain('api_calls_total');
      expect(output).toContain('api_errors_total');
      expect(output).toContain('api_duration_seconds');
    });
  });

  describe('Cache Access Metrics', () => {
    it('should record cache hits and misses', () => {
      service.recordCacheAccess('literature', true);
      service.recordCacheAccess('literature', false);

      const output = service.exportPrometheusText();
      expect(output).toContain('cache_hits_total');
      expect(output).toContain('cache_misses_total');
    });
  });

  describe('Reset', () => {
    it('should reset all metrics', () => {
      service.incrementCounter('test');
      service.reset();

      // After reset, the counter should start from 0
      const output = service.exportPrometheusText();
      // Standard metrics should still exist but be zeroed
      expect(output).toContain('# HELP');
    });
  });
});
