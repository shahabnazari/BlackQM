/**
 * PHASE 10.102 PHASE 6: NETFLIX-GRADE MONITORING & OBSERVABILITY
 * Enhanced Metrics Service with Golden Signals
 *
 * Golden Signals (Google SRE):
 * 1. LATENCY: How long it takes to service a request
 * 2. TRAFFIC: How much demand is placed on your system
 * 3. ERRORS: Rate of requests that fail
 * 4. SATURATION: How "full" your service is
 *
 * @see https://sre.google/sre-book/monitoring-distributed-systems/
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Gauge,
  Registry,
  collectDefaultMetrics,
  Summary,
} from 'prom-client';
import { ConfigService } from '@nestjs/config';

/**
 * Metric labels interface for type safety
 * (Exported for future use in metric filtering and querying)
 */
export interface HttpMetricLabels {
  method: string;
  route: string;
  status_code: string;
}

export interface LiteratureMetricLabels {
  source: string;
  status: 'success' | 'failure' | 'timeout' | 'cache_hit';
}

export interface AIMetricLabels {
  provider: 'openai' | 'groq' | 'local';
  operation: string;
  status: 'success' | 'failure';
}

@Injectable()
export class EnhancedMetricsService implements OnModuleInit {
  private readonly logger = new Logger(EnhancedMetricsService.name);
  private readonly registry: Registry;
  private readonly prefix = 'blackqmethod_';

  // ========== GOLDEN SIGNAL 1: LATENCY ==========

  /**
   * HTTP request duration histogram
   * Buckets optimized for API latency (10ms to 30s)
   */
  private readonly httpRequestDuration: Histogram<string>;

  /**
   * Literature search latency (specific to our domain)
   * Buckets: 100ms to 60s (searches can take longer)
   */
  private readonly literatureSearchDuration: Histogram<string>;

  /**
   * Theme extraction duration
   * Buckets: 1s to 600s (10 minutes)
   */
  private readonly themeExtractionDuration: Histogram<string>;

  /**
   * Database query duration
   * Buckets: 1ms to 10s
   */
  private readonly dbQueryDuration: Histogram<string>;

  /**
   * AI API call duration
   * Buckets: 100ms to 120s (API timeouts)
   */
  private readonly aiApiDuration: Histogram<string>;

  /**
   * Cache operation duration
   * Buckets: 1ms to 100ms (cache should be fast)
   */
  private readonly cacheOperationDuration: Histogram<string>;

  // ========== GOLDEN SIGNAL 2: TRAFFIC ==========

  /**
   * Total HTTP requests
   */
  private readonly httpRequestsTotal: Counter<string>;

  /**
   * Literature searches per second
   */
  private readonly literatureSearchesTotal: Counter<string>;

  /**
   * Theme extractions total
   */
  private readonly themeExtractionsTotal: Counter<string>;

  /**
   * AI API calls total
   */
  private readonly aiApiCallsTotal: Counter<string>;

  /**
   * WebSocket connections
   */
  private readonly websocketConnectionsTotal: Counter<string>;

  /**
   * Active WebSocket connections (gauge)
   */
  private readonly activeWebsocketConnections: Gauge<string>;

  // ========== GOLDEN SIGNAL 3: ERRORS ==========

  /**
   * HTTP errors by type
   */
  private readonly httpErrorsTotal: Counter<string>;

  /**
   * Literature search errors
   */
  private readonly literatureSearchErrors: Counter<string>;

  /**
   * Theme extraction errors
   */
  private readonly themeExtractionErrors: Counter<string>;

  /**
   * Database errors
   */
  private readonly dbErrorsTotal: Counter<string>;

  /**
   * AI API errors (circuit breaker integration)
   */
  private readonly aiApiErrors: Counter<string>;

  /**
   * Cache errors
   */
  private readonly cacheErrors: Counter<string>;

  /**
   * Validation errors (400-level errors)
   */
  private readonly validationErrors: Counter<string>;

  // ========== GOLDEN SIGNAL 4: SATURATION ==========

  /**
   * CPU usage percentage
   */
  private readonly cpuUsage: Gauge<string>;

  /**
   * Memory usage percentage
   */
  private readonly memoryUsage: Gauge<string>;

  /**
   * Active database connections
   */
  private readonly dbConnectionsActive: Gauge<string>;

  /**
   * Event loop lag (Node.js specific saturation metric)
   */
  private readonly eventLoopLag: Gauge<string>;

  /**
   * Processing queue size
   */
  private readonly queueSize: Gauge<string>;

  /**
   * Active concurrent searches
   */
  private readonly activeConcurrentSearches: Gauge<string>;

  // ========== BUSINESS METRICS ==========

  /**
   * Literature search success rate
   */
  private readonly searchSuccessRate: Gauge<string>;

  /**
   * Average papers returned per search
   */
  private readonly avgPapersPerSearch: Gauge<string>;

  /**
   * Cache hit rate
   */
  private readonly cacheHitRate: Gauge<string>;

  /**
   * Source availability (per source)
   */
  private readonly sourceAvailability: Gauge<string>;

  /**
   * Theme quality score
   */
  private readonly themeQualityScore: Summary<string>;

  /**
   * User satisfaction (if applicable)
   * @future - Reserved for future user feedback integration
   */
  private readonly userSatisfaction!: Gauge<string>;

  // ========== COST METRICS ==========

  /**
   * AI API cost tracker (dollars)
   */
  private readonly aiApiCost: Counter<string>;

  /**
   * Estimated infrastructure cost
   * @future - Reserved for cloud cost tracking integration
   */
  private readonly infrastructureCost!: Gauge<string>;

  // ========== SLO/SLA METRICS ==========

  /**
   * SLO: 99.9% availability target
   */
  private readonly sloAvailability: Gauge<string>;

  /**
   * SLO: P95 latency < 2s target
   */
  private readonly sloLatencyP95: Gauge<string>;

  /**
   * SLO: Error rate < 0.1% target
   */
  private readonly sloErrorRate: Gauge<string>;

  constructor(
    // Reserved for configuration-based metric thresholds
    private readonly configService?: ConfigService
  ) {
    this.registry = new Registry();

    // Collect default Node.js metrics (CPU, memory, GC, event loop)
    collectDefaultMetrics({
      register: this.registry,
      prefix: this.prefix,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // GC duration buckets
    });

    // ========== INITIALIZE LATENCY METRICS ==========

    this.httpRequestDuration = new Histogram({
      name: `${this.prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds (Golden Signal: Latency)',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30], // 10ms to 30s
      registers: [this.registry],
    });

    this.literatureSearchDuration = new Histogram({
      name: `${this.prefix}literature_search_duration_seconds`,
      help: 'Literature search duration in seconds',
      labelNames: ['source', 'cache_status'] as const,
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60], // 100ms to 60s
      registers: [this.registry],
    });

    this.themeExtractionDuration = new Histogram({
      name: `${this.prefix}theme_extraction_duration_seconds`,
      help: 'Theme extraction duration in seconds',
      labelNames: ['paper_count', 'extraction_mode'] as const,
      buckets: [1, 5, 10, 30, 60, 120, 300, 600], // 1s to 10min
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: `${this.prefix}db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'] as const,
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10], // 1ms to 10s
      registers: [this.registry],
    });

    this.aiApiDuration = new Histogram({
      name: `${this.prefix}ai_api_duration_seconds`,
      help: 'AI API call duration in seconds',
      labelNames: ['provider', 'operation', 'model'] as const,
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120], // 100ms to 2min
      registers: [this.registry],
    });

    this.cacheOperationDuration = new Histogram({
      name: `${this.prefix}cache_operation_duration_seconds`,
      help: 'Cache operation duration in seconds',
      labelNames: ['operation', 'cache_type'] as const,
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1], // 1ms to 100ms
      registers: [this.registry],
    });

    // ========== INITIALIZE TRAFFIC METRICS ==========

    this.httpRequestsTotal = new Counter({
      name: `${this.prefix}http_requests_total`,
      help: 'Total HTTP requests (Golden Signal: Traffic)',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [this.registry],
    });

    this.literatureSearchesTotal = new Counter({
      name: `${this.prefix}literature_searches_total`,
      help: 'Total literature searches',
      labelNames: ['source', 'status'] as const,
      registers: [this.registry],
    });

    this.themeExtractionsTotal = new Counter({
      name: `${this.prefix}theme_extractions_total`,
      help: 'Total theme extractions',
      labelNames: ['status', 'paper_count_range'] as const,
      registers: [this.registry],
    });

    this.aiApiCallsTotal = new Counter({
      name: `${this.prefix}ai_api_calls_total`,
      help: 'Total AI API calls',
      labelNames: ['provider', 'operation', 'status'] as const,
      registers: [this.registry],
    });

    this.websocketConnectionsTotal = new Counter({
      name: `${this.prefix}websocket_connections_total`,
      help: 'Total WebSocket connections',
      labelNames: ['event_type'] as const,
      registers: [this.registry],
    });

    this.activeWebsocketConnections = new Gauge({
      name: `${this.prefix}active_websocket_connections`,
      help: 'Currently active WebSocket connections',
      registers: [this.registry],
    });

    // ========== INITIALIZE ERROR METRICS ==========

    this.httpErrorsTotal = new Counter({
      name: `${this.prefix}http_errors_total`,
      help: 'Total HTTP errors (Golden Signal: Errors)',
      labelNames: ['method', 'route', 'status_code', 'error_type'] as const,
      registers: [this.registry],
    });

    this.literatureSearchErrors = new Counter({
      name: `${this.prefix}literature_search_errors_total`,
      help: 'Literature search errors',
      labelNames: ['source', 'error_type'] as const,
      registers: [this.registry],
    });

    this.themeExtractionErrors = new Counter({
      name: `${this.prefix}theme_extraction_errors_total`,
      help: 'Theme extraction errors',
      labelNames: ['error_type', 'stage'] as const,
      registers: [this.registry],
    });

    this.dbErrorsTotal = new Counter({
      name: `${this.prefix}db_errors_total`,
      help: 'Database errors',
      labelNames: ['operation', 'error_type'] as const,
      registers: [this.registry],
    });

    this.aiApiErrors = new Counter({
      name: `${this.prefix}ai_api_errors_total`,
      help: 'AI API errors',
      labelNames: ['provider', 'operation', 'error_type'] as const,
      registers: [this.registry],
    });

    this.cacheErrors = new Counter({
      name: `${this.prefix}cache_errors_total`,
      help: 'Cache operation errors',
      labelNames: ['operation', 'error_type'] as const,
      registers: [this.registry],
    });

    this.validationErrors = new Counter({
      name: `${this.prefix}validation_errors_total`,
      help: 'Input validation errors',
      labelNames: ['field', 'error_type'] as const,
      registers: [this.registry],
    });

    // ========== INITIALIZE SATURATION METRICS ==========

    this.cpuUsage = new Gauge({
      name: `${this.prefix}cpu_usage_percent`,
      help: 'CPU usage percentage (Golden Signal: Saturation)',
      registers: [this.registry],
    });

    this.memoryUsage = new Gauge({
      name: `${this.prefix}memory_usage_percent`,
      help: 'Memory usage percentage',
      registers: [this.registry],
    });

    this.dbConnectionsActive = new Gauge({
      name: `${this.prefix}db_connections_active`,
      help: 'Active database connections',
      labelNames: ['status'] as const,
      registers: [this.registry],
    });

    this.eventLoopLag = new Gauge({
      name: `${this.prefix}event_loop_lag_seconds`,
      help: 'Event loop lag in seconds (Node.js saturation metric)',
      registers: [this.registry],
    });

    this.queueSize = new Gauge({
      name: `${this.prefix}queue_size`,
      help: 'Processing queue size',
      labelNames: ['queue_name'] as const,
      registers: [this.registry],
    });

    this.activeConcurrentSearches = new Gauge({
      name: `${this.prefix}active_concurrent_searches`,
      help: 'Number of currently active concurrent searches',
      registers: [this.registry],
    });

    // ========== INITIALIZE BUSINESS METRICS ==========

    this.searchSuccessRate = new Gauge({
      name: `${this.prefix}search_success_rate`,
      help: 'Literature search success rate (0-1)',
      registers: [this.registry],
    });

    this.avgPapersPerSearch = new Gauge({
      name: `${this.prefix}avg_papers_per_search`,
      help: 'Average number of papers returned per search',
      registers: [this.registry],
    });

    this.cacheHitRate = new Gauge({
      name: `${this.prefix}cache_hit_rate`,
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'] as const,
      registers: [this.registry],
    });

    this.sourceAvailability = new Gauge({
      name: `${this.prefix}source_availability`,
      help: 'Literature source availability (0-1)',
      labelNames: ['source'] as const,
      registers: [this.registry],
    });

    this.themeQualityScore = new Summary({
      name: `${this.prefix}theme_quality_score`,
      help: 'Theme extraction quality score',
      labelNames: ['extraction_mode'] as const,
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [this.registry],
    });

    this.userSatisfaction = new Gauge({
      name: `${this.prefix}user_satisfaction_score`,
      help: 'User satisfaction score (1-5)',
      labelNames: ['feature'] as const,
      registers: [this.registry],
    });

    // ========== INITIALIZE COST METRICS ==========

    this.aiApiCost = new Counter({
      name: `${this.prefix}ai_api_cost_dollars`,
      help: 'AI API cost in dollars',
      labelNames: ['provider', 'model'] as const,
      registers: [this.registry],
    });

    this.infrastructureCost = new Gauge({
      name: `${this.prefix}infrastructure_cost_dollars_per_hour`,
      help: 'Estimated infrastructure cost per hour',
      labelNames: ['component'] as const,
      registers: [this.registry],
    });

    // ========== INITIALIZE SLO METRICS ==========

    this.sloAvailability = new Gauge({
      name: `${this.prefix}slo_availability`,
      help: 'SLO: System availability (target: 0.999)',
      registers: [this.registry],
    });

    this.sloLatencyP95 = new Gauge({
      name: `${this.prefix}slo_latency_p95_seconds`,
      help: 'SLO: P95 latency in seconds (target: 2.0)',
      registers: [this.registry],
    });

    this.sloErrorRate = new Gauge({
      name: `${this.prefix}slo_error_rate`,
      help: 'SLO: Error rate (target: 0.001)',
      registers: [this.registry],
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('✅ Enhanced Metrics Service initialized (Netflix-Grade)');
    this.logger.log(`Metrics prefix: ${this.prefix}`);
    this.logger.log(`Total metrics registered: ${(await this.registry.getMetricsAsJSON()).length}`);

    // Start background saturation monitoring
    this.startSaturationMonitoring();
  }

  // ========== PUBLIC API: LATENCY ==========

  /**
   * Record HTTP request duration
   */
  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
    };

    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpErrorsTotal.inc({
        method,
        route,
        status_code: statusCode.toString(),
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  /**
   * Record literature search duration
   */
  recordLiteratureSearch(
    source: string,
    durationSeconds: number,
    success: boolean,
    cacheHit: boolean = false,
  ): void {
    this.literatureSearchDuration.observe(
      {
        source,
        cache_status: cacheHit ? 'hit' : 'miss',
      },
      durationSeconds,
    );

    this.literatureSearchesTotal.inc({
      source,
      status: success ? 'success' : 'failure',
    });

    if (!success) {
      this.literatureSearchErrors.inc({
        source,
        error_type: 'search_failed',
      });
    }
  }

  /**
   * Record theme extraction duration
   */
  recordThemeExtraction(
    paperCount: number,
    extractionMode: string,
    durationSeconds: number,
    success: boolean,
  ): void {
    const paperCountRange = this.getPaperCountRange(paperCount);

    this.themeExtractionDuration.observe(
      {
        paper_count: paperCount.toString(),
        extraction_mode: extractionMode,
      },
      durationSeconds,
    );

    this.themeExtractionsTotal.inc({
      status: success ? 'success' : 'failure',
      paper_count_range: paperCountRange,
    });
  }

  /**
   * Record database query duration
   */
  recordDbQuery(operation: string, table: string, durationSeconds: number, error?: Error): void {
    this.dbQueryDuration.observe({ operation, table }, durationSeconds);

    if (error) {
      this.dbErrorsTotal.inc({
        operation,
        error_type: error.name || 'UnknownError',
      });
    }
  }

  /**
   * Record AI API call duration
   */
  recordAIApiCall(
    provider: string,
    operation: string,
    model: string,
    durationSeconds: number,
    success: boolean,
    cost?: number,
  ): void {
    this.aiApiDuration.observe({ provider, operation, model }, durationSeconds);

    this.aiApiCallsTotal.inc({
      provider,
      operation,
      status: success ? 'success' : 'failure',
    });

    if (!success) {
      this.aiApiErrors.inc({
        provider,
        operation,
        error_type: 'api_failure',
      });
    }

    if (cost !== undefined) {
      this.aiApiCost.inc({ provider, model }, cost);
    }
  }

  /**
   * Record cache operation duration
   */
  recordCacheOperation(
    operation: 'get' | 'set' | 'delete',
    cacheType: string,
    durationSeconds: number,
    error?: Error,
  ): void {
    this.cacheOperationDuration.observe({ operation, cache_type: cacheType }, durationSeconds);

    if (error) {
      this.cacheErrors.inc({
        operation,
        error_type: error.name || 'UnknownError',
      });
    }
  }

  // ========== PUBLIC API: TRAFFIC ==========

  /**
   * Increment WebSocket connections
   */
  incrementWebSocketConnection(eventType: 'connect' | 'disconnect' | 'error'): void {
    this.websocketConnectionsTotal.inc({ event_type: eventType });

    if (eventType === 'connect') {
      this.activeWebsocketConnections.inc();
    } else if (eventType === 'disconnect') {
      this.activeWebsocketConnections.dec();
    }
  }

  // ========== PUBLIC API: ERRORS ==========

  /**
   * Record validation error
   */
  recordValidationError(field: string, errorType: string): void {
    this.validationErrors.inc({ field, error_type: errorType });
  }

  /**
   * Record theme extraction error
   */
  recordThemeExtractionError(errorType: string, stage: string): void {
    this.themeExtractionErrors.inc({ error_type: errorType, stage });
  }

  // ========== PUBLIC API: SATURATION ==========

  /**
   * Set queue size
   */
  setQueueSize(queueName: string, size: number): void {
    this.queueSize.set({ queue_name: queueName }, size);
  }

  /**
   * Set active concurrent searches
   */
  setActiveConcurrentSearches(count: number): void {
    this.activeConcurrentSearches.set(count);
  }

  /**
   * Set database connection pool status
   */
  setDbConnectionPool(active: number, idle: number, waiting: number): void {
    this.dbConnectionsActive.set({ status: 'active' }, active);
    this.dbConnectionsActive.set({ status: 'idle' }, idle);
    this.dbConnectionsActive.set({ status: 'waiting' }, waiting);
  }

  // ========== PUBLIC API: BUSINESS METRICS ==========

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(cacheType: string, hitRate: number): void {
    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  /**
   * Update source availability
   */
  updateSourceAvailability(source: string, availability: number): void {
    this.sourceAvailability.set({ source }, availability);
  }

  /**
   * Record theme quality score
   */
  recordThemeQuality(extractionMode: string, score: number): void {
    this.themeQualityScore.observe({ extraction_mode: extractionMode }, score);
  }

  /**
   * Update search success rate
   */
  updateSearchSuccessRate(rate: number): void {
    this.searchSuccessRate.set(rate);
  }

  /**
   * Update average papers per search
   */
  updateAvgPapersPerSearch(avg: number): void {
    this.avgPapersPerSearch.set(avg);
  }

  // ========== PUBLIC API: SLO ==========

  /**
   * Update SLO metrics
   */
  updateSLO(availability: number, latencyP95: number, errorRate: number): void {
    this.sloAvailability.set(availability);
    this.sloLatencyP95.set(latencyP95);
    this.sloErrorRate.set(errorRate);
  }

  // ========== PROMETHEUS EXPORT ==========

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJson(): Promise<any> {
    return this.registry.getMetricsAsJSON();
  }

  // ========== PRIVATE HELPERS ==========

  private getPaperCountRange(count: number): string {
    if (count < 10) return '1-9';
    if (count < 50) return '10-49';
    if (count < 100) return '50-99';
    if (count < 500) return '100-499';
    if (count < 1000) return '500-999';
    return '1000+';
  }

  /**
   * Start background saturation monitoring
   */
  private startSaturationMonitoring(): void {
    const monitoringInterval = 5000; // 5 seconds

    setInterval(() => {
      // CPU usage
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / monitoringInterval;
      this.cpuUsage.set(Math.min(cpuPercent * 100, 100));

      // Memory usage
      const memoryUsage = process.memoryUsage();
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      this.memoryUsage.set(memoryPercent);

      // Event loop lag (simplified)
      const lagStart = Date.now();
      setImmediate(() => {
        const lag = (Date.now() - lagStart) / 1000;
        this.eventLoopLag.set(lag);
      });
    }, monitoringInterval);
  }
}
