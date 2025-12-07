/**
 * Metrics Controller
 * Phase 8.6: Prometheus-Compatible Metrics Endpoint
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PROMETHEUS METRICS EXPORT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Exposes /metrics endpoint for Prometheus scraping.
 *
 * Features:
 * - Real-time system metrics (memory, CPU, connections)
 * - Circuit breaker status
 * - Business metrics (theme extractions, papers processed)
 * - API performance metrics (latency, error rates)
 *
 * Prometheus Configuration:
 * ```yaml
 * scrape_configs:
 *   - job_name: 'qmethod-backend'
 *     metrics_path: '/metrics'
 *     scrape_interval: 15s
 *     static_configs:
 *       - targets: ['localhost:3000']
 * ```
 *
 * Grafana Dashboard:
 * - Import template from /grafana-dashboard.json
 * - Visualize circuit breaker state, API latency, memory usage
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Controller, Get, Header, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MetricsService } from '../common/services/metrics.service';
import { PrismaService } from '../common/prisma.service';
import { ApiRateLimiterService } from '../modules/literature/services/api-rate-limiter.service';

/**
 * Prometheus metrics controller
 * PERF-8 FIX: Rate limited to prevent DoS via expensive metrics export
 */
@ApiTags('Metrics')
@Controller('metrics')
@Throttle({ default: { ttl: 60000, limit: 120 } })  // PERF-8: 120 requests per minute (2x Prometheus scrape rate)
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  // PERF-1 FIX: Cache database metrics to avoid unnecessary queries
  private lastDbMetricsUpdate = 0;
  private static readonly DB_METRICS_CACHE_MS = 10000; // 10 seconds cache

  constructor(
    private readonly metricsService: MetricsService,
    private readonly prismaService: PrismaService,
    private readonly rateLimiter: ApiRateLimiterService,
  ) {
    this.logger.log('✅ Metrics controller initialized (Prometheus endpoint: GET /metrics)');
  }

  /**
   * Prometheus metrics endpoint
   * GET /metrics
   *
   * Returns metrics in Prometheus text format
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus text format',
    schema: {
      type: 'string',
      example: `# HELP theme_extractions_total Total number of theme extraction operations
# TYPE theme_extractions_total counter
theme_extractions_total{purpose="q_methodology"} 1547
theme_extractions_total{purpose="qualitative"} 892

# HELP circuit_breaker_state Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
# TYPE circuit_breaker_state gauge
circuit_breaker_state{provider="openai"} 0
circuit_breaker_state{provider="groq"} 0`,
    },
  })
  async getMetrics(): Promise<string> {
    try {
      // BUG-2 FIX: Await async system metrics update
      await this.updateSystemMetrics();

      // Export in Prometheus format
      return this.metricsService.exportPrometheusText();
    } catch (error) {
      this.logger.error(`Metrics export failed: ${error instanceof Error ? error.message : String(error)}`);

      // Return minimal metrics even on error
      return `# Error exporting metrics: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
    }
  }

  /**
   * Update all system metrics
   * Called before each scrape
   * BUG-2 FIX: Made async to properly await database metrics
   * PERF-1 FIX: Cache database metrics for 10 seconds
   * @private
   */
  private async updateSystemMetrics(): Promise<void> {
    // 1. Memory metrics (synchronous)
    this.metricsService.updateSystemMetrics();

    // 2. Circuit breaker metrics (synchronous)
    try {
      const openaiCircuit = this.rateLimiter.getCircuitStatus('openai');
      this.metricsService.updateCircuitBreakerMetrics(
        'openai',
        openaiCircuit.state,
        openaiCircuit.failureCount,
      );

      const groqCircuit = this.rateLimiter.getCircuitStatus('groq');
      this.metricsService.updateCircuitBreakerMetrics(
        'groq',
        groqCircuit.state,
        groqCircuit.failureCount,
      );
    } catch (error) {
      // Circuit breaker metrics unavailable - continue
      this.logger.debug('Circuit breaker metrics unavailable');
    }

    // 3. Database connection pool metrics (async, with caching)
    // PERF-1 FIX: Only update if cache expired
    const now = Date.now();
    if (now - this.lastDbMetricsUpdate > MetricsController.DB_METRICS_CACHE_MS) {
      await this.updateDatabaseMetrics();
      this.lastDbMetricsUpdate = now;
    }
  }

  /**
   * Update database metrics
   * @private
   */
  private async updateDatabaseMetrics(): Promise<void> {
    try {
      const poolStats = await this.prismaService.getPoolStats();

      if (poolStats) {
        this.metricsService.recordGauge('db_connection_pool_active', poolStats.active || 0);
        this.metricsService.recordGauge('db_connection_pool_idle', poolStats.idle || 0);
      }
    } catch (error) {
      // Database metrics unavailable - continue
      this.logger.debug('Database metrics unavailable');
    }
  }
}
