/**
 * Request Hedging Service
 * Phase 10.112 Week 4: Netflix-Grade Parallel Backup Requests
 *
 * Features:
 * - Hedged requests: sends backup request after P50 timeout
 * - Takes fastest response, cancels others
 * - Reduces tail latency without increasing total requests significantly
 * - Configurable delay and max concurrent hedges
 * - Request deduplication to prevent duplicate work
 *
 * Netflix Pattern:
 * - Fire backup request if primary is slow (beyond P50)
 * - Accept first successful response, cancel remaining
 * - Dramatically reduces P99 latency at cost of ~5% more requests
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Hedging configuration
 */
export interface HedgingConfig {
  enabled: boolean;
  hedgeDelayMs: number;
  maxHedges: number;
  hedgeOnlyOnSlowResponses: boolean;
}

/**
 * Hedged request result
 */
export interface HedgedResult<T> {
  result: T;
  wasHedged: boolean;
  primaryCompleted: boolean;
  hedgeCompleted: boolean;
  latencyMs: number;
  hedgeLatencyMs?: number;
  winner: 'primary' | 'hedge';
}

/**
 * Hedging statistics
 */
export interface HedgingStats {
  totalRequests: number;
  hedgedRequests: number;
  primaryWins: number;
  hedgeWins: number;
  hedgeSavedMs: number;
  averageLatencyMs: number;
  hedgeRatio: number;
}

/**
 * Operation-level hedging config
 */
interface OperationHedgingConfig {
  hedgeDelayMs: number;
  maxHedges: number;
  enabled: boolean;
}

@Injectable()
export class RequestHedgingService {
  private readonly logger = new Logger(RequestHedgingService.name);

  // Statistics tracking
  private totalRequests = 0;
  private hedgedRequests = 0;
  private primaryWins = 0;
  private hedgeWins = 0;
  private totalHedgeSavedMs = 0;
  private totalLatencyMs = 0;

  // Active hedged operations (to prevent duplicate hedges)
  private readonly activeHedges: Set<string> = new Set();

  // Configuration constants
  private static readonly DEFAULT_HEDGE_DELAY_MS = 100;
  private static readonly DEFAULT_MAX_HEDGES = 2;
  private static readonly CLEANUP_INTERVAL_MS = 60000;
  private static readonly STALE_HEDGE_THRESHOLD = 100;
  private static readonly HEDGE_WIN_ALERT_MULTIPLIER = 2;

  // Per-operation configuration
  // Phase 10.115: Added PMC with hedging disabled (slow by nature, batched XML parsing)
  private static readonly OPERATION_CONFIGS: Record<string, OperationHedgingConfig> = {
    'search:pubmed': { hedgeDelayMs: 200, maxHedges: 1, enabled: true },
    'search:semantic_scholar': { hedgeDelayMs: 200, maxHedges: 1, enabled: true },
    'search:openalex': { hedgeDelayMs: 150, maxHedges: 1, enabled: true },
    'search:crossref': { hedgeDelayMs: 200, maxHedges: 1, enabled: true },
    'search:pmc': { hedgeDelayMs: 30000, maxHedges: 1, enabled: false }, // PMC is inherently slow (batched XML), don't hedge
    'embedding:batch': { hedgeDelayMs: 500, maxHedges: 1, enabled: false }, // Don't hedge expensive ops
    'enrichment:citations': { hedgeDelayMs: 300, maxHedges: 1, enabled: true },
  };

  constructor() {
    this.logger.log('[RequestHedging] Initialized with parallel backup requests');

    // Periodic cleanup of stale active hedges
    const cleanupInterval = setInterval(
      () => this.cleanupStaleHedges(),
      RequestHedgingService.CLEANUP_INTERVAL_MS,
    );
    cleanupInterval.unref();
  }

  // Default timeout if not specified (30 seconds - Netflix-grade reliability)
  private static readonly DEFAULT_TIMEOUT_MS = 30000;

  /**
   * Execute a hedged request with timeout enforcement
   * Sends backup request after hedge delay if primary is slow
   *
   * Phase 10.112 Week 4 Fix: Added mandatory timeout to prevent infinite hangs
   */
  async executeHedged<T>(
    operation: string,
    primaryFn: (signal?: AbortSignal) => Promise<T>,
    hedgeFn?: (signal?: AbortSignal) => Promise<T>,
    requestId?: string,
    timeoutMs?: number,
  ): Promise<HedgedResult<T>> {
    const config = this.getOperationConfig(operation);
    const hedgeKey = requestId ?? `${operation}-${Date.now()}`;
    const effectiveTimeout = timeoutMs ?? RequestHedgingService.DEFAULT_TIMEOUT_MS;

    // If hedging disabled or already hedging this request, just execute primary
    if (!config.enabled || !hedgeFn || this.activeHedges.has(hedgeKey)) {
      const startTime = Date.now();

      // Phase 10.112 Fix: Enforce timeout even for non-hedged requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${effectiveTimeout}ms`)), effectiveTimeout);
      });

      try {
        const result = await Promise.race([primaryFn(), timeoutPromise]);
        const latencyMs = Date.now() - startTime;

        this.totalRequests++;
        this.totalLatencyMs += latencyMs;

        return {
          result,
          wasHedged: false,
          primaryCompleted: true,
          hedgeCompleted: false,
          latencyMs,
          winner: 'primary',
        };
      } catch (error) {
        this.totalRequests++;
        throw error;
      }
    }

    // Mark as actively hedging
    this.activeHedges.add(hedgeKey);

    try {
      return await this.executeWithHedge(primaryFn, hedgeFn, config, effectiveTimeout);
    } finally {
      this.activeHedges.delete(hedgeKey);
    }
  }

  /**
   * Execute with hedge (internal)
   * Phase 10.112 Week 4 Fix: Added timeout enforcement to prevent infinite hangs
   */
  private async executeWithHedge<T>(
    primaryFn: (signal?: AbortSignal) => Promise<T>,
    hedgeFn: (signal?: AbortSignal) => Promise<T>,
    config: OperationHedgingConfig,
    timeoutMs: number,
  ): Promise<HedgedResult<T>> {
    const startTime = Date.now();

    // Create abort controllers for each request
    const primaryController = new AbortController();
    const hedgeController = new AbortController();

    let primaryCompleted = false;
    let hedgeCompleted = false;
    let hedgeStarted = false;

    // Wrap primary with completion tracking
    const primaryPromise = primaryFn(primaryController.signal)
      .then(result => {
        primaryCompleted = true;
        return { type: 'primary' as const, result };
      })
      .catch(error => {
        primaryCompleted = true;
        throw error;
      });

    // Create hedge promise that fires after delay
    const hedgePromise = new Promise<{ type: 'hedge'; result: T }>((resolve, reject) => {
      const hedgeTimer = setTimeout(async () => {
        // Only start hedge if primary hasn't completed
        if (primaryCompleted) {
          return;
        }

        hedgeStarted = true;
        this.hedgedRequests++;

        try {
          const result = await hedgeFn(hedgeController.signal);
          hedgeCompleted = true;
          resolve({ type: 'hedge', result });
        } catch (error) {
          hedgeCompleted = true;
          reject(error);
        }
      }, config.hedgeDelayMs);

      // Allow cleanup on primary completion
      primaryPromise.then(() => {
        clearTimeout(hedgeTimer);
        if (!hedgeStarted) {
          // Resolve with a never-completing promise since we don't need the hedge
          // This will never win the race
        }
      }).catch(() => {
        clearTimeout(hedgeTimer);
      });
    });

    // Phase 10.112 Fix: Create timeout promise to prevent infinite hangs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        // Abort both requests on timeout
        primaryController.abort();
        hedgeController.abort();
        reject(new Error(`Hedged request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race primary vs hedge
    this.totalRequests++;

    try {
      // Phase 10.112 Fix: Include timeout in the race to prevent hanging
      const winner = await Promise.race([
        primaryPromise,
        hedgePromise.catch(() => primaryPromise), // If hedge fails, wait for primary
        timeoutPromise, // Critical: timeout prevents infinite hang
      ]);

      const latencyMs = Date.now() - startTime;
      this.totalLatencyMs += latencyMs;

      // Cancel the loser
      if (winner.type === 'primary') {
        hedgeController.abort();
        this.primaryWins++;
      } else {
        primaryController.abort();
        this.hedgeWins++;
        // Calculate time saved
        // (We don't know exact primary latency, estimate based on hedge delay)
        this.totalHedgeSavedMs += config.hedgeDelayMs;
      }

      return {
        result: winner.result,
        wasHedged: hedgeStarted,
        primaryCompleted,
        hedgeCompleted,
        latencyMs,
        hedgeLatencyMs: hedgeStarted ? latencyMs : undefined,
        winner: winner.type,
      };
    } catch (error) {
      // Both failed or timed out
      // Ensure both are aborted
      primaryController.abort();
      hedgeController.abort();
      throw error;
    }
  }

  /**
   * Get operation-specific hedging config
   */
  private getOperationConfig(operation: string): OperationHedgingConfig {
    return RequestHedgingService.OPERATION_CONFIGS[operation] ?? {
      hedgeDelayMs: RequestHedgingService.DEFAULT_HEDGE_DELAY_MS,
      maxHedges: RequestHedgingService.DEFAULT_MAX_HEDGES,
      enabled: true,
    };
  }

  /**
   * Check if hedging is enabled for an operation
   */
  isHedgingEnabled(operation: string): boolean {
    return this.getOperationConfig(operation).enabled;
  }

  /**
   * Get hedging statistics
   */
  getStats(): HedgingStats {
    return {
      totalRequests: this.totalRequests,
      hedgedRequests: this.hedgedRequests,
      primaryWins: this.primaryWins,
      hedgeWins: this.hedgeWins,
      hedgeSavedMs: this.totalHedgeSavedMs,
      averageLatencyMs: this.totalRequests > 0
        ? Math.round(this.totalLatencyMs / this.totalRequests)
        : 0,
      hedgeRatio: this.totalRequests > 0
        ? Math.round((this.hedgedRequests / this.totalRequests) * 100) / 100
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalRequests = 0;
    this.hedgedRequests = 0;
    this.primaryWins = 0;
    this.hedgeWins = 0;
    this.totalHedgeSavedMs = 0;
    this.totalLatencyMs = 0;
  }

  /**
   * Cleanup stale hedge markers
   */
  private cleanupStaleHedges(): void {
    // Active hedges should be cleaned up by their finally blocks
    // This is a safety net for any leaked markers
    if (this.activeHedges.size > RequestHedgingService.STALE_HEDGE_THRESHOLD) {
      this.logger.warn(`[RequestHedging] Cleaning ${this.activeHedges.size} stale hedge markers`);
      this.activeHedges.clear();
    }
  }

  /**
   * Log hedging statistics
   */
  logStats(): void {
    const stats = this.getStats();

    this.logger.log(
      `[RequestHedging] Stats: ${stats.totalRequests} total, ` +
      `${stats.hedgedRequests} hedged (${(stats.hedgeRatio * 100).toFixed(1)}%), ` +
      `Primary wins: ${stats.primaryWins}, Hedge wins: ${stats.hedgeWins}, ` +
      `Saved: ${stats.hedgeSavedMs}ms, Avg latency: ${stats.averageLatencyMs}ms`
    );
  }

  /**
   * Get health status
   */
  getHealthStatus(): { healthy: boolean; status: string } {
    const stats = this.getStats();

    // If hedge win rate is very high, something might be wrong with primary
    if (stats.totalRequests > RequestHedgingService.STALE_HEDGE_THRESHOLD && stats.hedgeWins > stats.primaryWins * RequestHedgingService.HEDGE_WIN_ALERT_MULTIPLIER) {
      return {
        healthy: false,
        status: 'WARNING: Hedges winning too often - primary requests may be slow',
      };
    }

    return {
      healthy: true,
      status: `OK: Hedge ratio ${(stats.hedgeRatio * 100).toFixed(1)}%`,
    };
  }
}
