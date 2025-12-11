/**
 * Metrics Service
 * Phase 8.6: Prometheus-Compatible Metrics Export
 * Phase 10.112: Netflix-Grade CPU & Memory Monitoring
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE OBSERVABILITY - PROMETHEUS METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides real-time metrics export in Prometheus text format for:
 * - Business metrics (theme extractions, papers processed, AI costs)
 * - Technical metrics (circuit breaker state, API latency, cache hit rates)
 * - Performance metrics (stage durations, memory usage, GC time)
 * - Phase 10.112: CPU metrics (user time, system time, load average)
 *
 * Innovation Level: ⭐⭐⭐⭐⭐ (Revolutionary for research tools)
 * - NO other Q methodology tool has production-grade metrics
 * - Enables real-time Grafana dashboards
 * - Supports proactive alerting (PagerDuty, OpsGenie)
 * - Scientific reproducibility through metrics auditing
 *
 * Usage Example:
 * ```typescript
 * metricsService.incrementCounter('theme_extractions_total', { purpose: 'q_methodology' });
 * metricsService.recordGauge('circuit_breaker_state', 1, { provider: 'openai' });
 * metricsService.recordHistogram('api_duration_seconds', 1.23, { provider: 'pubmed' });
 * const cpuUsage = metricsService.getCpuUsage(); // Phase 10.112
 * ```
 *
 * Prometheus Scrape:
 * ```yaml
 * - job_name: 'qmethod-backend'
 *   metrics_path: '/metrics'
 *   scrape_interval: 15s
 *   static_configs:
 *     - targets: ['localhost:3000']
 * ```
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

/**
 * Phase 10.112: CPU usage metrics structure
 */
export interface CpuUsageMetrics {
  /** CPU usage percentage (0-100) across all cores */
  usagePercent: number;
  /** User mode CPU time in microseconds */
  userMicroseconds: number;
  /** System mode CPU time in microseconds */
  systemMicroseconds: number;
  /** Total CPU time (user + system) in microseconds */
  totalMicroseconds: number;
  /** Number of CPU cores */
  cpuCount: number;
  /** 1-minute load average (Unix only, 0 on Windows) */
  loadAverage1m: number;
  /** 5-minute load average (Unix only, 0 on Windows) */
  loadAverage5m: number;
  /** 15-minute load average (Unix only, 0 on Windows) */
  loadAverage15m: number;
}

/**
 * Phase 10.112: Memory usage metrics structure
 */
export interface MemoryUsageMetrics {
  /** Heap memory used in bytes */
  heapUsedBytes: number;
  /** Total heap memory in bytes */
  heapTotalBytes: number;
  /** Resident Set Size in bytes */
  rssBytes: number;
  /** External memory (C++ objects) in bytes */
  externalBytes: number;
  /** ArrayBuffer memory in bytes */
  arrayBuffersBytes: number;
  /** Heap usage as percentage (0-100) */
  heapUsagePercent: number;
  /** Total system memory in bytes */
  totalSystemMemory: number;
  /** Free system memory in bytes */
  freeSystemMemory: number;
  /** System memory usage percentage (0-100) */
  systemMemoryUsagePercent: number;
}

/**
 * Metric types supported by Prometheus
 */
enum MetricType {
  COUNTER = 'counter',     // Monotonically increasing (e.g., total requests)
  GAUGE = 'gauge',         // Can go up or down (e.g., memory usage)
  HISTOGRAM = 'histogram', // Distribution of values (e.g., latency)
}

/**
 * Histogram bucket for latency tracking
 */
interface HistogramBucket {
  le: number; // Upper bound (less than or equal)
  count: number;
}

/**
 * Histogram metric with buckets and quantiles
 */
interface HistogramMetric {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

/**
 * Enterprise-grade metrics service with Prometheus text format export
 * Phase 10.112: Enhanced with Netflix-grade CPU & memory monitoring
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Metric storage
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, Map<string, HistogramMetric>> = new Map();

  // Metric metadata (help text)
  private metricHelp: Map<string, string> = new Map();

  // Standard histogram buckets (Prometheus default + custom)
  private static readonly HISTOGRAM_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0,
    2.5, 5.0, 7.5, 10.0, 25.0, 50.0, 75.0, 100.0, 250.0, 500.0,
  ];

  // PERF-7: Cardinality limits to prevent unbounded memory growth
  private static readonly MAX_LABEL_COMBINATIONS_PER_METRIC = 1000;
  private cardinalityWarningsIssued: Set<string> = new Set();

  // Phase 10.112: CPU tracking state for delta calculations
  private lastCpuUsage: NodeJS.CpuUsage | null = null;
  private lastCpuUsageTime: number = 0;
  private static readonly CPU_SAMPLE_INTERVAL_MS = 1000; // Minimum interval between samples

  constructor() {
    // Initialize standard metrics
    this.initializeStandardMetrics();
    // Phase 10.112: Initialize CPU baseline
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuUsageTime = Date.now();
    this.logger.log('✅ Metrics service initialized (Prometheus-compatible, CPU monitoring enabled)');
  }

  /**
   * Initialize standard application metrics
   * @private
   */
  private initializeStandardMetrics(): void {
    // Business metrics
    this.registerMetric('theme_extractions_total', MetricType.COUNTER, 'Total number of theme extraction operations');
    this.registerMetric('papers_processed_total', MetricType.COUNTER, 'Total number of papers processed');
    this.registerMetric('ai_cost_dollars_total', MetricType.COUNTER, 'Total AI API cost in USD');

    // Circuit breaker metrics
    this.registerMetric('circuit_breaker_state', MetricType.GAUGE, 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)');
    this.registerMetric('circuit_breaker_failures', MetricType.GAUGE, 'Circuit breaker failure count');

    // API metrics
    this.registerMetric('api_calls_total', MetricType.COUNTER, 'Total API calls to external providers');
    this.registerMetric('api_errors_total', MetricType.COUNTER, 'Total API errors');
    this.registerMetric('api_duration_seconds', MetricType.HISTOGRAM, 'API call duration in seconds');

    // Cache metrics
    this.registerMetric('cache_hits_total', MetricType.COUNTER, 'Total cache hits');
    this.registerMetric('cache_misses_total', MetricType.COUNTER, 'Total cache misses');
    this.registerMetric('cache_hit_rate_percent', MetricType.GAUGE, 'Cache hit rate percentage');

    // Performance metrics
    this.registerMetric('stage_duration_seconds', MetricType.HISTOGRAM, 'Pipeline stage duration in seconds');
    this.registerMetric('memory_heap_used_bytes', MetricType.GAUGE, 'Node.js heap memory used in bytes');
    this.registerMetric('memory_heap_total_bytes', MetricType.GAUGE, 'Node.js heap memory total in bytes');

    // Database metrics
    this.registerMetric('db_connection_pool_active', MetricType.GAUGE, 'Active database connections');
    this.registerMetric('db_connection_pool_idle', MetricType.GAUGE, 'Idle database connections');

    // Phase 10.112: Netflix-grade CPU metrics
    this.registerMetric('cpu_usage_percent', MetricType.GAUGE, 'CPU usage percentage across all cores');
    this.registerMetric('cpu_user_microseconds', MetricType.COUNTER, 'CPU time spent in user mode (microseconds)');
    this.registerMetric('cpu_system_microseconds', MetricType.COUNTER, 'CPU time spent in system mode (microseconds)');
    this.registerMetric('cpu_load_average_1m', MetricType.GAUGE, '1-minute CPU load average');
    this.registerMetric('cpu_load_average_5m', MetricType.GAUGE, '5-minute CPU load average');
    this.registerMetric('cpu_load_average_15m', MetricType.GAUGE, '15-minute CPU load average');

    // Phase 10.112: Enhanced memory metrics
    this.registerMetric('memory_rss_bytes', MetricType.GAUGE, 'Resident Set Size in bytes');
    this.registerMetric('memory_external_bytes', MetricType.GAUGE, 'External C++ memory in bytes');
    this.registerMetric('memory_array_buffers_bytes', MetricType.GAUGE, 'ArrayBuffer memory in bytes');
    this.registerMetric('memory_heap_usage_percent', MetricType.GAUGE, 'Heap memory usage percentage');
    this.registerMetric('memory_system_total_bytes', MetricType.GAUGE, 'Total system memory in bytes');
    this.registerMetric('memory_system_free_bytes', MetricType.GAUGE, 'Free system memory in bytes');
    this.registerMetric('memory_system_usage_percent', MetricType.GAUGE, 'System memory usage percentage');
  }

  /**
   * Register a metric with help text
   * @private
   */
  private registerMetric(name: string, type: MetricType, help: string): void {
    this.metricHelp.set(name, help);

    // Initialize storage based on type
    if (type === MetricType.COUNTER && !this.counters.has(name)) {
      this.counters.set(name, new Map());
    } else if (type === MetricType.GAUGE && !this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    } else if (type === MetricType.HISTOGRAM && !this.histograms.has(name)) {
      this.histograms.set(name, new Map());
    }
  }

  /**
   * Generate label string for metrics
   * SEC-1 FIX: Sanitize label values to prevent Prometheus format injection
   * @private
   */
  private serializeLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => {
        // SEC-1 FIX: Escape special characters in label values
        // - Replace backslash with double backslash
        // - Replace double quote with escaped quote
        // - Replace newline with escaped n
        const sanitizedValue = String(value)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n');
        return `${key}="${sanitizedValue}"`;
      })
      .join(',');

    return labelPairs;
  }

  // ============================================================================
  // PUBLIC API: COUNTER METRICS
  // ============================================================================

  /**
   * Increment a counter metric
   * @public
   */
  public incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    const labelKey = this.serializeLabels(labels);
    let countersForMetric = this.counters.get(name);

    if (!countersForMetric) {
      this.logger.warn(`Counter metric "${name}" not registered. Registering now.`);
      this.registerMetric(name, MetricType.COUNTER, `Auto-registered counter: ${name}`);
      countersForMetric = new Map();
      this.counters.set(name, countersForMetric);
    }

    // PERF-7 FIX: Enforce cardinality limit to prevent memory exhaustion
    if (!countersForMetric.has(labelKey)) {
      if (countersForMetric.size >= MetricsService.MAX_LABEL_COMBINATIONS_PER_METRIC) {
        // Only log warning once per metric to avoid log spam
        if (!this.cardinalityWarningsIssued.has(name)) {
          this.logger.error(
            `⚠️  METRIC CARDINALITY LIMIT REACHED: "${name}" ` +
            `(${countersForMetric.size} label combinations). ` +
            `Refusing new series. This indicates high-cardinality labels (e.g., user IDs). ` +
            `Consider using lower-cardinality labels or aggregating data differently.`
          );
          this.cardinalityWarningsIssued.add(name);
        }
        return;  // Drop this metric to prevent OOM
      }
    }

    // TYPE-1 FIX: No non-null assertion needed
    const currentValue = countersForMetric.get(labelKey) || 0;
    countersForMetric.set(labelKey, currentValue + value);
  }

  // ============================================================================
  // PUBLIC API: GAUGE METRICS
  // ============================================================================

  /**
   * Set a gauge metric value
   * @public
   */
  public recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    const labelKey = this.serializeLabels(labels);
    let gaugesForMetric = this.gauges.get(name);

    if (!gaugesForMetric) {
      this.logger.warn(`Gauge metric "${name}" not registered. Registering now.`);
      this.registerMetric(name, MetricType.GAUGE, `Auto-registered gauge: ${name}`);
      gaugesForMetric = new Map();
      this.gauges.set(name, gaugesForMetric);
    }

    // PERF-7 FIX: Enforce cardinality limit
    if (!gaugesForMetric.has(labelKey)) {
      if (gaugesForMetric.size >= MetricsService.MAX_LABEL_COMBINATIONS_PER_METRIC) {
        if (!this.cardinalityWarningsIssued.has(name)) {
          this.logger.error(
            `⚠️  METRIC CARDINALITY LIMIT REACHED: "${name}" (gauge)`
          );
          this.cardinalityWarningsIssued.add(name);
        }
        return;
      }
    }

    // TYPE-1 FIX: No non-null assertion needed
    gaugesForMetric.set(labelKey, value);
  }

  // ============================================================================
  // PUBLIC API: HISTOGRAM METRICS
  // ============================================================================

  /**
   * Record a histogram observation (e.g., latency)
   * @public
   */
  public recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const labelKey = this.serializeLabels(labels);
    let histogramsForMetric = this.histograms.get(name);

    if (!histogramsForMetric) {
      this.logger.warn(`Histogram metric "${name}" not registered. Registering now.`);
      this.registerMetric(name, MetricType.HISTOGRAM, `Auto-registered histogram: ${name}`);
      histogramsForMetric = new Map();
      this.histograms.set(name, histogramsForMetric);
    }

    // TYPE-1 FIX: No non-null assertion needed
    let histogram = histogramsForMetric.get(labelKey);
    if (!histogram) {
      // PERF-7 FIX: Enforce cardinality limit
      if (histogramsForMetric.size >= MetricsService.MAX_LABEL_COMBINATIONS_PER_METRIC) {
        if (!this.cardinalityWarningsIssued.has(name)) {
          this.logger.error(
            `⚠️  METRIC CARDINALITY LIMIT REACHED: "${name}" (histogram)`
          );
          this.cardinalityWarningsIssued.add(name);
        }
        return;
      }

      histogram = {
        buckets: MetricsService.HISTOGRAM_BUCKETS.map(le => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      histogramsForMetric.set(labelKey, histogram);
    }

    // Update buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    // Update sum and count
    histogram.sum += value;
    histogram.count++;
  }

  // ============================================================================
  // PUBLIC API: METRICS EXPORT (Prometheus Text Format)
  // ============================================================================

  /**
   * Export all metrics in Prometheus text format
   * PERF-2 FIX: Use array + join instead of string concatenation for O(n) performance
   * @public
   */
  public exportPrometheusText(): string {
    const lines: string[] = [];

    // Export counters
    for (const [name, countersMap] of this.counters.entries()) {
      const help = this.metricHelp.get(name) || 'No description';
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} counter`);

      for (const [labelKey, value] of countersMap.entries()) {
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}${labelStr} ${value}`);
      }
      lines.push('');  // Empty line separator
    }

    // Export gauges
    for (const [name, gaugesMap] of this.gauges.entries()) {
      const help = this.metricHelp.get(name) || 'No description';
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} gauge`);

      for (const [labelKey, value] of gaugesMap.entries()) {
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}${labelStr} ${value}`);
      }
      lines.push('');  // Empty line separator
    }

    // Export histograms
    for (const [name, histogramsMap] of this.histograms.entries()) {
      const help = this.metricHelp.get(name) || 'No description';
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} histogram`);

      for (const [labelKey, histogram] of histogramsMap.entries()) {
        const baseLabels = labelKey ? `${labelKey},` : '';

        // Buckets
        for (const bucket of histogram.buckets) {
          lines.push(`${name}_bucket{${baseLabels}le="${bucket.le}"} ${bucket.count}`);
        }
        lines.push(`${name}_bucket{${baseLabels}le="+Inf"} ${histogram.count}`);

        // Sum and count (BUG-1 FIX: Proper label formatting)
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}_sum${labelStr} ${histogram.sum}`);
        lines.push(`${name}_count${labelStr} ${histogram.count}`);
      }
      lines.push('');  // Empty line separator
    }

    // PERF-2 FIX: Single join operation instead of thousands of concatenations
    return lines.join('\n');
  }

  // ============================================================================
  // CONVENIENCE METHODS: UPDATE SYSTEM METRICS
  // ============================================================================

  /**
   * Update system metrics (memory, CPU, etc.)
   * Phase 10.112: Enhanced with Netflix-grade CPU & memory monitoring
   * Call this periodically or on-demand
   * @public
   */
  public updateSystemMetrics(): void {
    // Memory metrics (original)
    const memory = process.memoryUsage();
    this.recordGauge('memory_heap_used_bytes', memory.heapUsed);
    this.recordGauge('memory_heap_total_bytes', memory.heapTotal);

    // Phase 10.112: Enhanced memory metrics
    const memMetrics = this.getMemoryUsage();
    this.recordGauge('memory_rss_bytes', memMetrics.rssBytes);
    this.recordGauge('memory_external_bytes', memMetrics.externalBytes);
    this.recordGauge('memory_array_buffers_bytes', memMetrics.arrayBuffersBytes);
    this.recordGauge('memory_heap_usage_percent', memMetrics.heapUsagePercent);
    this.recordGauge('memory_system_total_bytes', memMetrics.totalSystemMemory);
    this.recordGauge('memory_system_free_bytes', memMetrics.freeSystemMemory);
    this.recordGauge('memory_system_usage_percent', memMetrics.systemMemoryUsagePercent);

    // Phase 10.112: CPU metrics
    const cpuMetrics = this.getCpuUsage();
    this.recordGauge('cpu_usage_percent', cpuMetrics.usagePercent);
    this.incrementCounter('cpu_user_microseconds', undefined, cpuMetrics.userMicroseconds);
    this.incrementCounter('cpu_system_microseconds', undefined, cpuMetrics.systemMicroseconds);
    this.recordGauge('cpu_load_average_1m', cpuMetrics.loadAverage1m);
    this.recordGauge('cpu_load_average_5m', cpuMetrics.loadAverage5m);
    this.recordGauge('cpu_load_average_15m', cpuMetrics.loadAverage15m);
  }

  // ============================================================================
  // Phase 10.112: NETFLIX-GRADE CPU MONITORING
  // ============================================================================

  /**
   * Get current CPU usage metrics
   * Phase 10.112: Netflix-grade CPU monitoring implementation
   *
   * Uses process.cpuUsage() delta calculation for accurate CPU percentage.
   * Falls back to OS-level metrics for load averages.
   *
   * @returns CpuUsageMetrics - Comprehensive CPU metrics
   * @public
   */
  public getCpuUsage(): CpuUsageMetrics {
    const now = Date.now();
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage ?? undefined);
    const elapsedMs = now - this.lastCpuUsageTime;

    // Calculate CPU percentage based on time delta
    // CPU time is in microseconds, elapsed is in milliseconds
    const totalCpuMicros = currentCpuUsage.user + currentCpuUsage.system;
    const elapsedMicros = elapsedMs * 1000; // Convert ms to microseconds
    const cpuCount = os.cpus().length;

    // CPU percentage = (CPU time used / available CPU time) * 100
    // Available CPU time = elapsed time * number of CPUs
    let usagePercent = 0;
    if (elapsedMicros > 0 && cpuCount > 0) {
      usagePercent = Math.min(100, (totalCpuMicros / (elapsedMicros * cpuCount)) * 100);
    }

    // Get load averages (Unix only, returns [0,0,0] on Windows)
    const loadAverages = os.loadavg();

    // Update baseline for next calculation (only if enough time has passed)
    if (elapsedMs >= MetricsService.CPU_SAMPLE_INTERVAL_MS) {
      this.lastCpuUsage = process.cpuUsage();
      this.lastCpuUsageTime = now;
    }

    return {
      usagePercent: Math.round(usagePercent * 100) / 100, // 2 decimal places
      userMicroseconds: currentCpuUsage.user,
      systemMicroseconds: currentCpuUsage.system,
      totalMicroseconds: totalCpuMicros,
      cpuCount,
      loadAverage1m: Math.round(loadAverages[0] * 100) / 100,
      loadAverage5m: Math.round(loadAverages[1] * 100) / 100,
      loadAverage15m: Math.round(loadAverages[2] * 100) / 100,
    };
  }

  /**
   * Get simple CPU usage percentage (convenience method)
   * Phase 10.112: For quick CPU checks in neural budget calculations
   *
   * @returns number - CPU usage percentage (0-100)
   * @public
   */
  public getCpuUsagePercent(): number {
    return this.getCpuUsage().usagePercent;
  }

  // ============================================================================
  // Phase 10.112: NETFLIX-GRADE MEMORY MONITORING
  // ============================================================================

  /**
   * Get comprehensive memory usage metrics
   * Phase 10.112: Netflix-grade memory monitoring implementation
   *
   * Combines Node.js process memory with OS-level system memory.
   *
   * @returns MemoryUsageMetrics - Comprehensive memory metrics
   * @public
   */
  public getMemoryUsage(): MemoryUsageMetrics {
    const processMemory = process.memoryUsage();
    const totalSystemMemory = os.totalmem();
    const freeSystemMemory = os.freemem();

    const heapUsagePercent = processMemory.heapTotal > 0
      ? (processMemory.heapUsed / processMemory.heapTotal) * 100
      : 0;

    const systemMemoryUsagePercent = totalSystemMemory > 0
      ? ((totalSystemMemory - freeSystemMemory) / totalSystemMemory) * 100
      : 0;

    return {
      heapUsedBytes: processMemory.heapUsed,
      heapTotalBytes: processMemory.heapTotal,
      rssBytes: processMemory.rss,
      externalBytes: processMemory.external,
      arrayBuffersBytes: processMemory.arrayBuffers,
      heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
      totalSystemMemory,
      freeSystemMemory,
      systemMemoryUsagePercent: Math.round(systemMemoryUsagePercent * 100) / 100,
    };
  }

  /**
   * Get heap usage in megabytes (convenience method)
   * Phase 10.112: For quick memory checks
   *
   * @returns { heapUsed: number, heapTotal: number, rss: number } - Memory in MB
   * @public
   */
  public getMemoryUsageMB(): { heapUsed: number; heapTotal: number; rss: number } {
    const mem = process.memoryUsage();
    return {
      heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
      rss: Math.round(mem.rss / (1024 * 1024)),
    };
  }

  /**
   * Check if system is under memory pressure
   * Phase 10.112: For adaptive behavior under load
   *
   * @param thresholdPercent - Memory usage threshold (default 80%)
   * @returns boolean - True if memory usage exceeds threshold
   * @public
   */
  public isMemoryPressure(thresholdPercent: number = 80): boolean {
    const metrics = this.getMemoryUsage();
    return metrics.heapUsagePercent > thresholdPercent ||
           metrics.systemMemoryUsagePercent > thresholdPercent;
  }

  /**
   * Check if system is under CPU pressure
   * Phase 10.112: For adaptive behavior under load
   *
   * @param thresholdPercent - CPU usage threshold (default 80%)
   * @returns boolean - True if CPU usage exceeds threshold
   * @public
   */
  public isCpuPressure(thresholdPercent: number = 80): boolean {
    return this.getCpuUsagePercent() > thresholdPercent;
  }

  // ============================================================================
  // EXISTING CONVENIENCE METHODS
  // ============================================================================

  /**
   * Update circuit breaker metrics
   * @public
   */
  public updateCircuitBreakerMetrics(
    provider: string,
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    failureCount: number,
  ): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.recordGauge('circuit_breaker_state', stateValue, { provider });
    this.recordGauge('circuit_breaker_failures', failureCount, { provider });
  }

  /**
   * Record API call duration
   * @public
   */
  public recordAPICall(provider: string, durationSeconds: number, success: boolean): void {
    this.incrementCounter('api_calls_total', { provider, success: success.toString() });
    this.recordHistogram('api_duration_seconds', durationSeconds, { provider });

    if (!success) {
      this.incrementCounter('api_errors_total', { provider });
    }
  }

  /**
   * Record cache hit/miss
   * @public
   */
  public recordCacheAccess(cacheType: string, hit: boolean): void {
    if (hit) {
      this.incrementCounter('cache_hits_total', { cache_type: cacheType });
    } else {
      this.incrementCounter('cache_misses_total', { cache_type: cacheType });
    }
  }

  /**
   * Reset all metrics (for testing)
   * @public
   */
  public reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.initializeStandardMetrics();
    // Phase 10.112: Reset CPU baseline
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuUsageTime = Date.now();
    this.logger.warn('⚠️  All metrics reset');
  }
}
