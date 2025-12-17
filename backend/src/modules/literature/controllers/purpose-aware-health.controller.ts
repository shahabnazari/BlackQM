/**
 * Phase 10.170 Week 4: Purpose-Aware Health Controller
 *
 * REST endpoints for monitoring purpose-aware pipeline health,
 * metrics, and circuit breaker status.
 *
 * ENDPOINTS:
 * - GET /health - Overall health status
 * - GET /metrics - Detailed metrics summary
 * - GET /circuits - Circuit breaker status
 * - POST /circuits/:name/reset - Reset a circuit breaker
 *
 * @module purpose-aware-health.controller
 * @since Phase 10.170 Week 4
 */

import {
  Controller,
  Get,
  Post,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PurposeAwareMetricsService } from '../services/purpose-aware-metrics.service';
import { PurposeAwareCacheService } from '../services/purpose-aware-cache.service';
import { PurposeAwareCircuitBreakerService } from '../services/purpose-aware-circuit-breaker.service';
import { PurposeAwareConfigService } from '../services/purpose-aware-config.service';
import {
  PurposeAwareHealthResponse,
  ComponentHealth,
  ComponentHealthStatus,
  PurposeAwareCircuitName,
  PurposeAwareMetricsSummary,
  CircuitBreakerStatus,
  CacheStats,
  calculateOverallHealth,
} from '../types/purpose-aware-metrics.types';
import { ResearchPurpose } from '../types/purpose-aware.types';

// ============================================================================
// CONTROLLER IMPLEMENTATION
// ============================================================================

@Controller('literature/purpose-aware')
export class PurposeAwareHealthController {
  private readonly logger = new Logger(PurposeAwareHealthController.name);

  constructor(
    private readonly metricsService: PurposeAwareMetricsService,
    private readonly cacheService: PurposeAwareCacheService,
    private readonly circuitBreakerService: PurposeAwareCircuitBreakerService,
    private readonly configService: PurposeAwareConfigService,
  ) {
    this.logger.log('✅ [PurposeAwareHealthController] Phase 10.170 Week 4 - Controller initialized');
  }

  // ==========================================================================
  // HEALTH ENDPOINT
  // ==========================================================================

  /**
   * GET /literature/purpose-aware/health
   *
   * Returns overall health status of purpose-aware services.
   */
  @Get('health')
  getHealth(): PurposeAwareHealthResponse {
    const components = this.getComponentHealth();
    const circuits = this.circuitBreakerService.getCircuitStatus();
    const sla = this.metricsService.getSLACompliance();
    const cacheMetrics = this.metricsService.getCacheMetrics();

    const status = calculateOverallHealth(components);

    // Log health check
    this.logger.debug(
      `[Health] status=${status}, sla=${sla.overall ? 'OK' : 'BREACH'}, ` +
      `circuits=${circuits.degradationLevel}`
    );

    return {
      status,
      components,
      circuits,
      cache: cacheMetrics,
      sla,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // METRICS ENDPOINT
  // ==========================================================================

  /**
   * GET /literature/purpose-aware/metrics
   *
   * Returns detailed metrics summary for all purpose-aware operations.
   */
  @Get('metrics')
  getMetrics(): PurposeAwareMetricsSummary {
    return this.metricsService.getMetricsSummary();
  }

  /**
   * GET /literature/purpose-aware/metrics/summary
   *
   * Returns one-line summary for logging.
   */
  @Get('metrics/summary')
  getMetricsSummary(): { summary: string } {
    return { summary: this.metricsService.getSummary() };
  }

  // ==========================================================================
  // CIRCUIT BREAKER ENDPOINTS
  // ==========================================================================

  /**
   * GET /literature/purpose-aware/circuits
   *
   * Returns circuit breaker status for all circuits.
   */
  @Get('circuits')
  getCircuits(): CircuitBreakerStatus {
    return this.circuitBreakerService.getCircuitStatus();
  }

  /**
   * GET /literature/purpose-aware/circuits/:name
   *
   * Returns status for a specific circuit breaker.
   */
  @Get('circuits/:name')
  getCircuit(@Param('name') name: string): CircuitBreakerStatus['circuits'][PurposeAwareCircuitName] {
    if (!this.isValidCircuitName(name)) {
      throw new HttpException(
        `Invalid circuit name: ${name}. Valid names: unpaywall, publisher, aiVerification`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.circuitBreakerService.getCircuitStats(name as PurposeAwareCircuitName);
  }

  /**
   * POST /literature/purpose-aware/circuits/:name/reset
   *
   * Reset a specific circuit breaker.
   */
  @Post('circuits/:name/reset')
  resetCircuit(@Param('name') name: string): { success: boolean; message: string } {
    if (!this.isValidCircuitName(name)) {
      throw new HttpException(
        `Invalid circuit name: ${name}. Valid names: unpaywall, publisher, aiVerification`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.circuitBreakerService.resetCircuit(name as PurposeAwareCircuitName);

    this.logger.log(`[CircuitReset] Circuit ${name} reset via API`);

    return {
      success: true,
      message: `Circuit ${name} has been reset`,
    };
  }

  /**
   * POST /literature/purpose-aware/circuits/reset-all
   *
   * Reset all circuit breakers.
   */
  @Post('circuits/reset-all')
  resetAllCircuits(): { success: boolean; message: string } {
    this.circuitBreakerService.resetAllCircuits();

    this.logger.log('[CircuitReset] All circuits reset via API');

    return {
      success: true,
      message: 'All circuits have been reset',
    };
  }

  // ==========================================================================
  // CACHE ENDPOINTS
  // ==========================================================================

  /**
   * GET /literature/purpose-aware/cache/stats
   *
   * Returns cache statistics.
   */
  @Get('cache/stats')
  getCacheStats(): { scores: CacheStats; diversity: CacheStats } {
    return {
      scores: this.cacheService.getScoreCacheStats(),
      diversity: this.cacheService.getDiversityCacheStats(),
    };
  }

  /**
   * POST /literature/purpose-aware/cache/clear
   *
   * Clear all caches.
   */
  @Post('cache/clear')
  clearCache(): { success: boolean; message: string } {
    this.cacheService.clear();

    this.logger.log('[CacheClear] All caches cleared via API');

    return {
      success: true,
      message: 'All caches have been cleared',
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Get health status for each component
   */
  private getComponentHealth(): PurposeAwareHealthResponse['components'] {
    return {
      configService: this.getConfigServiceHealth(),
      scoringService: this.getScoringServiceHealth(),
      detectionService: this.getDetectionServiceHealth(),
      diversityService: this.getDiversityServiceHealth(),
      cacheService: this.getCacheServiceHealth(),
    };
  }

  /**
   * Get config service health
   */
  private getConfigServiceHealth(): ComponentHealth {
    try {
      // Verify all purposes are configured
      let validPurposes = 0;
      for (const purpose of Object.values(ResearchPurpose)) {
        try {
          this.configService.getConfig(purpose);
          validPurposes++;
        } catch {
          // Purpose config invalid
        }
      }

      const totalPurposes = Object.values(ResearchPurpose).length;
      const status: ComponentHealthStatus = validPurposes === totalPurposes
        ? 'healthy'
        : validPurposes > 0
          ? 'degraded'
          : 'unhealthy';

      return {
        status,
        message: `${validPurposes}/${totalPurposes} purposes configured`,
        metric: validPurposes,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Config service error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Get scoring service health
   */
  private getScoringServiceHealth(): ComponentHealth {
    const sla = this.metricsService.getSLACompliance();
    const metrics = this.metricsService.getMetricsSummary();

    const status: ComponentHealthStatus = sla.scoring
      ? 'healthy'
      : metrics.totalOperations > 0
        ? 'degraded'
        : 'healthy'; // No operations yet is OK

    return {
      status,
      message: sla.scoring ? 'SLA compliant' : 'SLA breach',
      metric: metrics.totalOperations,
    };
  }

  /**
   * Get detection service health
   */
  private getDetectionServiceHealth(): ComponentHealth {
    const detection = this.metricsService.getDetectionMetrics();

    const status: ComponentHealthStatus = detection.successRate >= 0.5
      ? 'healthy'
      : detection.successRate >= 0.2
        ? 'degraded'
        : detection.totalAttempts > 0
          ? 'unhealthy'
          : 'healthy'; // No attempts yet is OK

    return {
      status,
      message: `${(detection.successRate * 100).toFixed(1)}% success rate`,
      metric: detection.successRate,
    };
  }

  /**
   * Get diversity service health
   */
  private getDiversityServiceHealth(): ComponentHealth {
    // Diversity service health based on cache usage
    const cacheStats = this.cacheService.getDiversityCacheStats();

    return {
      status: 'healthy',
      message: `${cacheStats.size} cached analyses`,
      metric: cacheStats.size,
    };
  }

  /**
   * Get cache service health
   */
  private getCacheServiceHealth(): ComponentHealth {
    const cache = this.metricsService.getCacheMetrics();

    const status: ComponentHealthStatus = cache.overallHitRate >= 0.5
      ? 'healthy'
      : cache.overallHitRate >= 0.2
        ? 'degraded'
        : cache.scores.size + cache.diversity.size > 0
          ? 'unhealthy'
          : 'healthy'; // Empty cache is OK at start

    return {
      status,
      message: `${(cache.overallHitRate * 100).toFixed(1)}% hit rate`,
      metric: cache.overallHitRate,
    };
  }

  /**
   * Validate circuit breaker name
   */
  private isValidCircuitName(name: string): name is PurposeAwareCircuitName {
    return ['unpaywall', 'publisher', 'aiVerification'].includes(name);
  }
}
