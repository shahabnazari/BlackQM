/**
 * Phase 10.113 Week 12: Semantic Health Controller
 *
 * Netflix-grade health check and metrics endpoints for semantic ranking.
 * Provides production monitoring visibility into Week 11 features.
 *
 * Endpoints:
 * - GET /api/literature/semantic/health - Overall health status
 * - GET /api/literature/semantic/metrics - Detailed performance metrics
 * - GET /api/literature/semantic/circuits - Circuit breaker status
 * - POST /api/literature/semantic/circuits/:name/reset - Reset circuit
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 12
 */

import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  SemanticMetricsService,
  SemanticPerformanceReport,
  SemanticHealthResponse,
} from '../services/semantic-metrics.service';
import { SemanticCircuitBreakerService } from '../services/semantic-circuit-breaker.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Circuit status response
 */
interface CircuitStatusResponse {
  readonly circuits: Record<string, {
    readonly state: string;
    readonly failures: number;
    readonly successes: number;
    readonly lastFailure: number | null;
    readonly lastSuccess: number | null;
  }>;
  readonly serviceHealth: {
    readonly redis: string;
    readonly workerPool: string;
    readonly progressive: string;
  };
  readonly anyDegraded: boolean;
  readonly timestamp: string;
}

/**
 * Circuit reset response
 */
interface CircuitResetResponse {
  readonly success: boolean;
  readonly circuit: string;
  readonly message: string;
  readonly timestamp: string;
}

// ============================================================================
// CONTROLLER IMPLEMENTATION
// ============================================================================

@Controller('literature/semantic')
export class SemanticHealthController {
  private readonly logger = new Logger(SemanticHealthController.name);

  constructor(
    private readonly metrics: SemanticMetricsService,
    private readonly circuitBreaker: SemanticCircuitBreakerService,
  ) {
    this.logger.log('✅ [SemanticHealthController] Phase 10.113 Week 12 - Health endpoints registered');
  }

  // ==========================================================================
  // HEALTH CHECK ENDPOINT
  // ==========================================================================

  /**
   * Get overall semantic health status
   *
   * @returns Health status with key metrics
   *
   * @example
   * GET /api/literature/semantic/health
   *
   * Response:
   * {
   *   "status": "healthy",
   *   "workers": [{ "workerId": 0, "tasksCompleted": 150, "errors": 1, "healthy": true }],
   *   "metrics": { "tier1P95Ms": 450, "tier2P95Ms": 1200, "cacheHitRate": 0.72, "errorRate": 0.002 },
   *   "slaCompliance": { "tier1": true, "tier2": true, "cacheHitRate": true, "errorRate": true, "overall": true },
   *   "timestamp": "2024-12-11T15:30:00.000Z"
   * }
   */
  @Get('health')
  getHealth(): SemanticHealthResponse {
    return this.metrics.getHealthResponse();
  }

  // ==========================================================================
  // METRICS ENDPOINT
  // ==========================================================================

  /**
   * Get detailed performance metrics
   *
   * @returns Full performance report including all tier latencies
   *
   * @example
   * GET /api/literature/semantic/metrics
   *
   * Response:
   * {
   *   "tier1P95": 450,
   *   "tier2P95": 1200,
   *   "tier3P95": 3500,
   *   "cacheHitRate": 0.72,
   *   "workerUtilization": 0.85,
   *   "slaCompliance": { ... },
   *   "errorRate": 0.002,
   *   "timestamp": "2024-12-11T15:30:00.000Z"
   * }
   */
  @Get('metrics')
  getMetrics(): SemanticPerformanceReport {
    return this.metrics.getPerformanceReport();
  }

  // ==========================================================================
  // CIRCUIT BREAKER ENDPOINTS
  // ==========================================================================

  /**
   * Get circuit breaker status for all services
   *
   * @returns Circuit status for Redis, WorkerPool, and Progressive
   *
   * @example
   * GET /api/literature/semantic/circuits
   *
   * Response:
   * {
   *   "circuits": {
   *     "redis": { "state": "closed", "failures": 0, "successes": 150 },
   *     "workerPool": { "state": "closed", "failures": 0, "successes": 200 },
   *     "progressive": { "state": "closed", "failures": 0, "successes": 50 }
   *   },
   *   "serviceHealth": { "redis": "normal", "workerPool": "normal", "progressive": "normal" },
   *   "anyDegraded": false,
   *   "timestamp": "2024-12-11T15:30:00.000Z"
   * }
   */
  @Get('circuits')
  getCircuitStatus(): CircuitStatusResponse {
    const circuits = this.circuitBreaker.getCircuitStats();
    const serviceHealth = this.circuitBreaker.getServiceHealth();
    const anyDegraded = this.circuitBreaker.isAnyDegraded();

    return {
      circuits: {
        redis: {
          state: circuits.redis.state,
          failures: circuits.redis.failures,
          successes: circuits.redis.successes,
          lastFailure: circuits.redis.lastFailure,
          lastSuccess: circuits.redis.lastSuccess,
        },
        workerPool: {
          state: circuits.workerPool.state,
          failures: circuits.workerPool.failures,
          successes: circuits.workerPool.successes,
          lastFailure: circuits.workerPool.lastFailure,
          lastSuccess: circuits.workerPool.lastSuccess,
        },
        progressive: {
          state: circuits.progressive.state,
          failures: circuits.progressive.failures,
          successes: circuits.progressive.successes,
          lastFailure: circuits.progressive.lastFailure,
          lastSuccess: circuits.progressive.lastSuccess,
        },
      },
      serviceHealth: {
        redis: serviceHealth.redis,
        workerPool: serviceHealth.workerPool,
        progressive: serviceHealth.progressive,
      },
      anyDegraded,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset a specific circuit breaker
   *
   * @param name Circuit name: 'redis' | 'workerPool' | 'progressive'
   * @returns Reset confirmation
   *
   * @example
   * POST /api/literature/semantic/circuits/redis/reset
   *
   * Response:
   * {
   *   "success": true,
   *   "circuit": "redis",
   *   "message": "Circuit breaker reset successfully",
   *   "timestamp": "2024-12-11T15:30:00.000Z"
   * }
   */
  @Post('circuits/:name/reset')
  @HttpCode(HttpStatus.OK)
  resetCircuit(@Param('name') name: string): CircuitResetResponse {
    const validCircuits = ['redis', 'workerPool', 'progressive'];

    if (!validCircuits.includes(name)) {
      return {
        success: false,
        circuit: name,
        message: `Invalid circuit name. Valid options: ${validCircuits.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    }

    this.circuitBreaker.resetCircuit(name as 'redis' | 'workerPool' | 'progressive');
    this.logger.log(`Circuit '${name}' reset via API`);

    return {
      success: true,
      circuit: name,
      message: 'Circuit breaker reset successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all circuit breakers
   *
   * @returns Reset confirmation
   *
   * @example
   * POST /api/literature/semantic/circuits/reset-all
   *
   * Response:
   * {
   *   "success": true,
   *   "circuit": "all",
   *   "message": "All circuit breakers reset successfully",
   *   "timestamp": "2024-12-11T15:30:00.000Z"
   * }
   */
  @Post('circuits/reset-all')
  @HttpCode(HttpStatus.OK)
  resetAllCircuits(): CircuitResetResponse {
    this.circuitBreaker.resetAll();
    this.logger.log('All circuits reset via API');

    return {
      success: true,
      circuit: 'all',
      message: 'All circuit breakers reset successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // SUMMARY ENDPOINT (for logging/debugging)
  // ==========================================================================

  /**
   * Get one-line summary for logging
   *
   * @returns Plain text summary
   *
   * @example
   * GET /api/literature/semantic/summary
   *
   * Response (text/plain):
   * tier1_p95=450ms | tier2_p95=1200ms | cache_hit=72.0% | error_rate=0.20% | sla=OK
   */
  @Get('summary')
  getSummary(): string {
    const metricsSummary = this.metrics.getSummary();
    const circuitSummary = this.circuitBreaker.getSummary();

    return `${metricsSummary}\nCircuits: ${circuitSummary}`;
  }
}
