/**
 * Source Capability Service
 * Phase 10.112 Week 2: Netflix-Grade Source Management
 *
 * Features:
 * - Per-source circuit breaker (CLOSED/OPEN/HALF_OPEN states)
 * - Dynamic credential detection at module initialization
 * - Health score tracking with automatic recovery
 * - Proactive source availability checking
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LiteratureSource } from '../dto/literature.dto';

/**
 * Circuit breaker states following Netflix Hystrix pattern
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Reason why a source is unavailable
 */
export type UnavailableReason =
  | 'missing_api_key'
  | 'rate_limited'
  | 'circuit_open'
  | 'health_check_failed'
  | 'maintenance';

/**
 * Source credential requirements
 */
interface SourceCredentialConfig {
  source: LiteratureSource;
  envKey: string | null;
  required: boolean;
  fallbackEnvKey?: string;
}

/**
 * Health status for a single source
 */
export interface SourceHealth {
  source: LiteratureSource;
  isAvailable: boolean;
  hasCredentials: boolean;
  circuitState: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  lastHealthCheck: number;
  healthScore: number;
  reason?: UnavailableReason;
  totalRequests: number;
  totalFailures: number;
  averageLatencyMs: number;
}

/**
 * Aggregated capability status
 */
export interface SourceCapabilityStatus {
  totalSources: number;
  availableSources: number;
  unavailableSources: number;
  circuitOpenSources: number;
  sourcesWithCredentials: number;
  healthScoreAverage: number;
  lastUpdated: number;
}

/**
 * Configuration for circuit breaker behavior
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  recoveryTimeoutMs: number;
  healthCheckIntervalMs: number;
}

@Injectable()
export class SourceCapabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SourceCapabilityService.name);
  private readonly health: Map<LiteratureSource, SourceHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Phase 10.114: Lowered threshold to ensure ALL available sources are searched
  // Previous value (50) excluded sources with minor issues
  // New value (0) ensures any available source is used for comprehensive coverage
  private static readonly MIN_HEALTH_SCORE_FOR_DEFAULT = 0;

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    recoveryTimeoutMs: 60000,
    healthCheckIntervalMs: 300000,
  };

  private static readonly CREDENTIAL_MAP: SourceCredentialConfig[] = [
    { source: LiteratureSource.SEMANTIC_SCHOLAR, envKey: 'SEMANTIC_SCHOLAR_API_KEY', required: false },
    { source: LiteratureSource.CROSSREF, envKey: 'CROSSREF_EMAIL', required: false },
    { source: LiteratureSource.PUBMED, envKey: 'NCBI_API_KEY', required: false },
    { source: LiteratureSource.ARXIV, envKey: null, required: false },
    { source: LiteratureSource.PMC, envKey: 'NCBI_API_KEY', required: false },
    { source: LiteratureSource.ERIC, envKey: null, required: false },
    { source: LiteratureSource.CORE, envKey: 'CORE_API_KEY', required: true },
    { source: LiteratureSource.SPRINGER, envKey: 'SPRINGER_API_KEY', required: true },
    { source: LiteratureSource.NATURE, envKey: 'SPRINGER_API_KEY', required: true },
    { source: LiteratureSource.IEEE_XPLORE, envKey: 'IEEE_API_KEY', required: true },
    { source: LiteratureSource.SCOPUS, envKey: 'SCOPUS_API_KEY', required: true },
    { source: LiteratureSource.WEB_OF_SCIENCE, envKey: 'WOS_API_KEY', required: true },
    { source: LiteratureSource.OPENALEX, envKey: 'OPENALEX_EMAIL', required: false },
    { source: LiteratureSource.GOOGLE_SCHOLAR, envKey: null, required: false },
    { source: LiteratureSource.SSRN, envKey: null, required: false },
    { source: LiteratureSource.WILEY, envKey: 'WILEY_API_KEY', required: true },
    { source: LiteratureSource.SAGE, envKey: 'SAGE_API_KEY', required: true },
    { source: LiteratureSource.TAYLOR_FRANCIS, envKey: 'TAYLOR_FRANCIS_API_KEY', required: true },
  ];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeSourceHealth();
    this.startHealthCheckInterval();
    this.logCapabilitySummary();
  }

  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async initializeSourceHealth(): Promise<void> {
    for (const credConfig of SourceCapabilityService.CREDENTIAL_MAP) {
      const hasCredentials = this.checkCredentials(credConfig);
      const isAvailable = !credConfig.required || hasCredentials;

      const initialHealth: SourceHealth = {
        source: credConfig.source,
        isAvailable,
        hasCredentials,
        circuitState: CircuitState.CLOSED,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastFailure: null,
        lastSuccess: null,
        lastHealthCheck: Date.now(),
        healthScore: isAvailable ? 100 : 0,
        reason: !isAvailable ? 'missing_api_key' : undefined,
        totalRequests: 0,
        totalFailures: 0,
        averageLatencyMs: 0,
      };

      this.health.set(credConfig.source, initialHealth);
    }
  }

  private checkCredentials(config: SourceCredentialConfig): boolean {
    if (!config.envKey) return true;

    const value = this.configService.get<string>(config.envKey);
    if (value && value.trim().length > 0) return true;

    if (config.fallbackEnvKey) {
      const fallback = this.configService.get<string>(config.fallbackEnvKey);
      return !!(fallback && fallback.trim().length > 0);
    }

    return false;
  }

  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
    this.healthCheckInterval.unref();
  }

  private performHealthCheck(): void {
    const now = Date.now();

    for (const [source, health] of this.health.entries()) {
      if (health.circuitState === CircuitState.OPEN) {
        const timeSinceFailure = health.lastFailure ? now - health.lastFailure : Infinity;
        if (timeSinceFailure >= this.config.recoveryTimeoutMs) {
          health.circuitState = CircuitState.HALF_OPEN;
          this.logger.log(`[${source}] Circuit HALF_OPEN: attempting recovery`);
        }
      }

      this.updateHealthScore(health);
      health.lastHealthCheck = now;
    }
  }

  private updateHealthScore(health: SourceHealth): void {
    if (!health.isAvailable) {
      health.healthScore = 0;
      return;
    }

    if (health.totalRequests === 0) {
      health.healthScore = 100;
      return;
    }

    const successRate = 1 - (health.totalFailures / health.totalRequests);
    const circuitPenalty = health.circuitState === CircuitState.OPEN ? 0.5 : 1;
    const recencyBonus = health.lastSuccess && health.lastSuccess > (health.lastFailure ?? 0) ? 1.1 : 1;

    health.healthScore = Math.min(100, Math.round(successRate * 100 * circuitPenalty * recencyBonus));
  }

  /**
   * Record a successful operation for a source
   */
  recordSuccess(source: LiteratureSource, latencyMs: number): void {
    const health = this.health.get(source);
    if (!health) return;

    health.totalRequests++;
    health.consecutiveSuccesses++;
    health.consecutiveFailures = 0;
    health.lastSuccess = Date.now();

    health.averageLatencyMs = health.totalRequests === 1
      ? latencyMs
      : (health.averageLatencyMs * (health.totalRequests - 1) + latencyMs) / health.totalRequests;

    if (health.circuitState === CircuitState.HALF_OPEN) {
      if (health.consecutiveSuccesses >= this.config.successThreshold) {
        health.circuitState = CircuitState.CLOSED;
        health.reason = undefined;
        this.logger.log(`[${source}] Circuit CLOSED: recovered after ${this.config.successThreshold} successes`);
      }
    }

    this.updateHealthScore(health);
  }

  /**
   * Record a failed operation for a source
   */
  recordFailure(source: LiteratureSource, error: Error): void {
    const health = this.health.get(source);
    if (!health) return;

    health.totalRequests++;
    health.totalFailures++;
    health.consecutiveFailures++;
    health.consecutiveSuccesses = 0;
    health.lastFailure = Date.now();

    if (health.circuitState === CircuitState.HALF_OPEN) {
      health.circuitState = CircuitState.OPEN;
      health.reason = 'circuit_open';
      this.logger.warn(`[${source}] Circuit OPEN: recovery failed`);
    } else if (health.circuitState === CircuitState.CLOSED) {
      if (health.consecutiveFailures >= this.config.failureThreshold) {
        health.circuitState = CircuitState.OPEN;
        health.reason = 'circuit_open';
        this.logger.error(
          `[${source}] Circuit OPEN: ${health.consecutiveFailures} consecutive failures ` +
          `(last error: ${error.message})`
        );
      }
    }

    this.updateHealthScore(health);
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    source: LiteratureSource,
    operation: () => Promise<T>,
  ): Promise<T | null> {
    const health = this.health.get(source);
    if (!health) {
      this.logger.warn(`[${source}] Unknown source, executing without circuit breaker`);
      return operation();
    }

    if (!health.isAvailable) {
      this.logger.debug(`[${source}] Skipped: ${health.reason ?? 'unavailable'}`);
      return null;
    }

    if (health.circuitState === CircuitState.OPEN) {
      const timeSinceFailure = health.lastFailure ? Date.now() - health.lastFailure : Infinity;
      if (timeSinceFailure < this.config.recoveryTimeoutMs) {
        this.logger.debug(`[${source}] Circuit OPEN: skipping (${Math.round(timeSinceFailure / 1000)}s since failure)`);
        return null;
      }
      health.circuitState = CircuitState.HALF_OPEN;
      this.logger.log(`[${source}] Circuit HALF_OPEN: attempting recovery`);
    }

    const startTime = Date.now();

    try {
      const result = await operation();
      this.recordSuccess(source, Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(source, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get available sources (configured and circuit not open)
   */
  getAvailableSources(): LiteratureSource[] {
    return Array.from(this.health.entries())
      .filter(([_, health]) => health.isAvailable && health.circuitState !== CircuitState.OPEN)
      .map(([source]) => source);
  }

  /**
   * Get default sources for search (available and high health score)
   */
  getDefaultSources(): LiteratureSource[] {
    return Array.from(this.health.entries())
      .filter(([_, health]) =>
        health.isAvailable &&
        health.circuitState !== CircuitState.OPEN &&
        health.healthScore >= SourceCapabilityService.MIN_HEALTH_SCORE_FOR_DEFAULT
      )
      .sort((a, b) => b[1].healthScore - a[1].healthScore)
      .map(([source]) => source);
  }

  /**
   * Get health status for a specific source
   */
  getSourceHealth(source: LiteratureSource): SourceHealth | undefined {
    return this.health.get(source);
  }

  /**
   * Check if a source is available for requests
   */
  isSourceAvailable(source: LiteratureSource): boolean {
    const health = this.health.get(source);
    return !!(health && health.isAvailable && health.circuitState !== CircuitState.OPEN);
  }

  /**
   * Get aggregated capability status
   */
  getCapabilityStatus(): SourceCapabilityStatus {
    const healthArray = Array.from(this.health.values());
    const available = healthArray.filter(h => h.isAvailable && h.circuitState !== CircuitState.OPEN);
    const withCredentials = healthArray.filter(h => h.hasCredentials);
    const circuitOpen = healthArray.filter(h => h.circuitState === CircuitState.OPEN);
    const avgHealth = healthArray.reduce((sum, h) => sum + h.healthScore, 0) / healthArray.length;

    return {
      totalSources: healthArray.length,
      availableSources: available.length,
      unavailableSources: healthArray.length - available.length,
      circuitOpenSources: circuitOpen.length,
      sourcesWithCredentials: withCredentials.length,
      healthScoreAverage: Math.round(avgHealth),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get all source health statuses
   */
  getAllSourceHealth(): Map<LiteratureSource, SourceHealth> {
    return new Map(this.health);
  }

  /**
   * Force reset circuit for a source (for testing/admin)
   */
  resetCircuit(source: LiteratureSource): void {
    const health = this.health.get(source);
    if (!health) return;

    health.circuitState = CircuitState.CLOSED;
    health.consecutiveFailures = 0;
    health.consecutiveSuccesses = 0;
    health.reason = undefined;
    this.logger.log(`[${source}] Circuit manually reset to CLOSED`);
  }

  private logCapabilitySummary(): void {
    const status = this.getCapabilityStatus();
    const unavailable = Array.from(this.health.entries())
      .filter(([_, h]) => !h.isAvailable)
      .map(([s, h]) => `${s}(${h.reason})`);

    this.logger.log(
      `[SourceCapability] Initialized: ${status.availableSources}/${status.totalSources} available, ` +
      `${status.sourcesWithCredentials} with credentials` +
      (unavailable.length > 0 ? `. Unavailable: ${unavailable.join(', ')}` : '')
    );
  }
}
