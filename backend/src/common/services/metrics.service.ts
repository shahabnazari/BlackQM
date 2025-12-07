/**
 * Metrics Service
 * Phase 8.6: Prometheus-Compatible Metrics Export
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE OBSERVABILITY - PROMETHEUS METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides real-time metrics export in Prometheus text format for:
 * - Business metrics (theme extractions, papers processed, AI costs)
 * - Technical metrics (circuit breaker state, API latency, cache hit rates)
 * - Performance metrics (stage durations, memory usage, GC time)
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

  constructor() {
    // Initialize standard metrics
    this.initializeStandardMetrics();
    this.logger.log('✅ Metrics service initialized (Prometheus-compatible)');
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
   * Update system metrics (memory, circuit breaker, etc.)
   * Call this periodically or on-demand
   * @public
   */
  public updateSystemMetrics(): void {
    // Memory metrics
    const memory = process.memoryUsage();
    this.recordGauge('memory_heap_used_bytes', memory.heapUsed);
    this.recordGauge('memory_heap_total_bytes', memory.heapTotal);
  }

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
    this.logger.warn('⚠️  All metrics reset');
  }
}
