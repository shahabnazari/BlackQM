/**
 * Graceful Degradation Service
 * Phase 10.112 Week 4: Netflix-Grade Multi-Level Fallback Cascade
 *
 * Features:
 * - Multi-level fallback hierarchy
 * - Automatic fallback selection based on availability
 * - Quality tracking per fallback level
 * - Transparent degradation reporting
 * - Automatic recovery when primary becomes available
 *
 * Netflix Pattern:
 * - Always return something to the user
 * - Quality degrades gracefully through fallback levels
 * - User is informed of degradation transparently
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Degradation level
 */
export type DegradationLevel = 'full' | 'reduced' | 'cached' | 'static' | 'error';

/**
 * Fallback function type
 */
export type FallbackFn<T> = () => Promise<T>;

/**
 * Fallback configuration
 */
export interface FallbackConfig<T> {
  level: DegradationLevel;
  fn: FallbackFn<T>;
  timeout?: number;
  description: string;
}

/**
 * Degradation result
 */
export interface DegradationResult<T> {
  data: T;
  level: DegradationLevel;
  fallbacksAttempted: number;
  fallbacksSucceeded: number;
  fallbacksFailed: string[];
  latencyMs: number;
  message: string;
  isFullQuality: boolean;
}

/**
 * Degradation statistics
 */
export interface DegradationStats {
  totalRequests: number;
  fullQualityResponses: number;
  reducedQualityResponses: number;
  cachedResponses: number;
  staticResponses: number;
  errorResponses: number;
  averageLatencyMs: number;
  degradationRate: number;
}

/**
 * Operation-level statistics
 */
interface OperationStats {
  requests: number;
  byLevel: Record<DegradationLevel, number>;
  totalLatencyMs: number;
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
}

@Injectable()
export class GracefulDegradationService {
  private readonly logger = new Logger(GracefulDegradationService.name);

  // Per-operation statistics
  private readonly stats: Map<string, OperationStats> = new Map();

  // Global statistics
  private globalStats: DegradationStats = {
    totalRequests: 0,
    fullQualityResponses: 0,
    reducedQualityResponses: 0,
    cachedResponses: 0,
    staticResponses: 0,
    errorResponses: 0,
    averageLatencyMs: 0,
    degradationRate: 0,
  };

  private totalLatencyMs = 0;

  // Configuration constants
  private static readonly DEFAULT_TIMEOUT_MS = 30000;
  private static readonly MIN_REQUESTS_FOR_HEALTH = 10;
  private static readonly CRITICAL_DEGRADATION_THRESHOLD = 0.5;
  private static readonly WARNING_DEGRADATION_THRESHOLD = 0.2;
  private static readonly LEVEL_PRIORITY: DegradationLevel[] = [
    'full',
    'reduced',
    'cached',
    'static',
    'error',
  ];

  constructor() {
    this.logger.log('[GracefulDegradation] Initialized with multi-level fallback cascade');
  }

  /**
   * Execute with graceful degradation through fallback cascade
   */
  async executeWithFallbacks<T>(
    operation: string,
    fallbacks: FallbackConfig<T>[],
    signal?: AbortSignal,
  ): Promise<DegradationResult<T>> {
    const startTime = Date.now();
    const failedFallbacks: string[] = [];
    let fallbacksAttempted = 0;

    // Initialize stats for operation
    this.ensureOperationStats(operation);

    // Sort fallbacks by priority
    const sortedFallbacks = this.sortFallbacksByPriority(fallbacks);

    // Try each fallback in order
    for (const fallback of sortedFallbacks) {
      fallbacksAttempted++;

      // Check for cancellation
      if (signal?.aborted) {
        break;
      }

      try {
        const result = await this.executeFallbackWithTimeout(
          fallback,
          fallback.timeout ?? GracefulDegradationService.DEFAULT_TIMEOUT_MS,
          signal,
        );

        const latencyMs = Date.now() - startTime;

        // Record success
        this.recordSuccess(operation, fallback.level, latencyMs);

        return {
          data: result,
          level: fallback.level,
          fallbacksAttempted,
          fallbacksSucceeded: 1,
          fallbacksFailed: failedFallbacks,
          latencyMs,
          message: this.generateMessage(fallback.level, failedFallbacks),
          isFullQuality: fallback.level === 'full',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        failedFallbacks.push(`${fallback.description}: ${errorMessage}`);

        this.logger.warn(
          `[GracefulDegradation] ${operation}: Fallback '${fallback.description}' failed: ${errorMessage}`
        );
      }
    }

    // All fallbacks failed
    const latencyMs = Date.now() - startTime;
    this.recordFailure(operation, latencyMs);

    throw new Error(
      `All ${fallbacksAttempted} fallbacks failed for ${operation}: ${failedFallbacks.join('; ')}`
    );
  }

  /**
   * Execute a single operation with automatic fallback to cached/static data
   */
  async executeWithCache<T>(
    operation: string,
    primaryFn: FallbackFn<T>,
    getCachedFn: FallbackFn<T | null>,
    getStaticFn?: FallbackFn<T>,
    signal?: AbortSignal,
  ): Promise<DegradationResult<T>> {
    const fallbacks: FallbackConfig<T>[] = [
      { level: 'full', fn: primaryFn, description: 'Primary data source' },
    ];

    // Add cached fallback
    fallbacks.push({
      level: 'cached',
      fn: async () => {
        const cached = await getCachedFn();
        if (cached === null) {
          throw new Error('No cached data available');
        }
        return cached;
      },
      description: 'Cached data',
    });

    // Add static fallback if provided
    if (getStaticFn) {
      fallbacks.push({
        level: 'static',
        fn: getStaticFn,
        description: 'Static fallback data',
      });
    }

    return this.executeWithFallbacks(operation, fallbacks, signal);
  }

  /**
   * Execute with reduced quality fallback
   */
  async executeWithReduced<T>(
    operation: string,
    fullQualityFn: FallbackFn<T>,
    reducedQualityFn: FallbackFn<T>,
    signal?: AbortSignal,
  ): Promise<DegradationResult<T>> {
    return this.executeWithFallbacks(
      operation,
      [
        { level: 'full', fn: fullQualityFn, description: 'Full quality' },
        { level: 'reduced', fn: reducedQualityFn, description: 'Reduced quality' },
      ],
      signal,
    );
  }

  /**
   * Get statistics for an operation
   */
  getOperationStats(operation: string): OperationStats | null {
    return this.stats.get(operation) ?? null;
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): DegradationStats {
    return { ...this.globalStats };
  }

  /**
   * Get degradation rate for an operation
   */
  getDegradationRate(operation: string): number {
    const stats = this.stats.get(operation);
    if (!stats || stats.requests === 0) {
      return 0;
    }

    const degraded = stats.byLevel.reduced + stats.byLevel.cached + stats.byLevel.static;
    return Math.round((degraded / stats.requests) * 100) / 100;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.clear();
    this.globalStats = {
      totalRequests: 0,
      fullQualityResponses: 0,
      reducedQualityResponses: 0,
      cachedResponses: 0,
      staticResponses: 0,
      errorResponses: 0,
      averageLatencyMs: 0,
      degradationRate: 0,
    };
    this.totalLatencyMs = 0;
  }

  /**
   * Log current status
   */
  logStatus(): void {
    const stats = this.globalStats;

    this.logger.log(
      `[GracefulDegradation] Status: ${stats.totalRequests} requests, ` +
      `Full: ${stats.fullQualityResponses}, Reduced: ${stats.reducedQualityResponses}, ` +
      `Cached: ${stats.cachedResponses}, Static: ${stats.staticResponses}, ` +
      `Errors: ${stats.errorResponses}, ` +
      `Degradation rate: ${(stats.degradationRate * 100).toFixed(1)}%`
    );
  }

  /**
   * Get health status
   */
  getHealthStatus(): { healthy: boolean; status: string; degradationRate: number } {
    const stats = this.globalStats;

    if (stats.totalRequests < GracefulDegradationService.MIN_REQUESTS_FOR_HEALTH) {
      return {
        healthy: true,
        status: 'OK: Insufficient data',
        degradationRate: 0,
      };
    }

    if (stats.degradationRate > GracefulDegradationService.CRITICAL_DEGRADATION_THRESHOLD) {
      return {
        healthy: false,
        status: 'CRITICAL: High degradation rate',
        degradationRate: stats.degradationRate,
      };
    }

    if (stats.degradationRate > GracefulDegradationService.WARNING_DEGRADATION_THRESHOLD) {
      return {
        healthy: true,
        status: 'WARNING: Elevated degradation rate',
        degradationRate: stats.degradationRate,
      };
    }

    return {
      healthy: true,
      status: 'OK: Normal operation',
      degradationRate: stats.degradationRate,
    };
  }

  /**
   * Execute fallback with timeout
   */
  private async executeFallbackWithTimeout<T>(
    fallback: FallbackConfig<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Setup abort handler
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Request cancelled'));
      };

      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      // Execute fallback
      fallback.fn()
        .then(result => {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          reject(error);
        });
    });
  }

  /**
   * Sort fallbacks by priority level
   */
  private sortFallbacksByPriority<T>(fallbacks: FallbackConfig<T>[]): FallbackConfig<T>[] {
    return [...fallbacks].sort((a, b) => {
      const aIndex = GracefulDegradationService.LEVEL_PRIORITY.indexOf(a.level);
      const bIndex = GracefulDegradationService.LEVEL_PRIORITY.indexOf(b.level);
      return aIndex - bIndex;
    });
  }

  /**
   * Ensure operation stats exist
   */
  private ensureOperationStats(operation: string): void {
    if (!this.stats.has(operation)) {
      this.stats.set(operation, {
        requests: 0,
        byLevel: {
          full: 0,
          reduced: 0,
          cached: 0,
          static: 0,
          error: 0,
        },
        totalLatencyMs: 0,
        failures: 0,
        lastFailure: null,
        lastSuccess: null,
      });
    }
  }

  /**
   * Record successful response
   */
  private recordSuccess(operation: string, level: DegradationLevel, latencyMs: number): void {
    const opStats = this.stats.get(operation)!;
    opStats.requests++;
    opStats.byLevel[level]++;
    opStats.totalLatencyMs += latencyMs;
    opStats.lastSuccess = Date.now();

    // Update global stats
    this.globalStats.totalRequests++;
    this.totalLatencyMs += latencyMs;

    switch (level) {
      case 'full':
        this.globalStats.fullQualityResponses++;
        break;
      case 'reduced':
        this.globalStats.reducedQualityResponses++;
        break;
      case 'cached':
        this.globalStats.cachedResponses++;
        break;
      case 'static':
        this.globalStats.staticResponses++;
        break;
    }

    // Update average latency
    this.globalStats.averageLatencyMs = Math.round(
      this.totalLatencyMs / this.globalStats.totalRequests
    );

    this.updateDegradationRate();
  }

  /**
   * Record failure
   */
  private recordFailure(operation: string, latencyMs: number): void {
    const opStats = this.stats.get(operation)!;
    opStats.requests++;
    opStats.byLevel.error++;
    opStats.failures++;
    opStats.totalLatencyMs += latencyMs;
    opStats.lastFailure = Date.now();

    // Update global stats
    this.globalStats.totalRequests++;
    this.globalStats.errorResponses++;
    this.totalLatencyMs += latencyMs;

    this.updateDegradationRate();
  }

  /**
   * Update global degradation rate (extracted to avoid duplication)
   */
  private updateDegradationRate(): void {
    const degraded = this.globalStats.reducedQualityResponses +
      this.globalStats.cachedResponses +
      this.globalStats.staticResponses +
      this.globalStats.errorResponses;
    this.globalStats.degradationRate = Math.round(
      (degraded / this.globalStats.totalRequests) * 100
    ) / 100;
  }

  /**
   * Generate user-friendly message
   */
  private generateMessage(level: DegradationLevel, failedFallbacks: string[]): string {
    switch (level) {
      case 'full':
        return 'Results retrieved at full quality';
      case 'reduced':
        return 'Results retrieved at reduced quality for faster response';
      case 'cached':
        return 'Results retrieved from cache (may not be latest)';
      case 'static':
        return 'Using fallback data due to temporary issues';
      case 'error':
        return `Unable to retrieve results: ${failedFallbacks.join('; ')}`;
    }
  }
}
