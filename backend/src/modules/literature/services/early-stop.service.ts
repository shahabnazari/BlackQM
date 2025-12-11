/**
 * Early Stop Service
 * Phase 10.112 Week 2: Netflix-Grade Search Optimization
 *
 * Features:
 * - Skip lower-tier sources when sufficient results available
 * - Promise.race() pattern for non-blocking early termination
 * - Configurable thresholds per query complexity
 * - Metrics tracking for early-stop decisions
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Minimal Paper interface for early-stop evaluation
 */
interface EarlyStopPaper {
  id: string;
  qualityScore?: number;
}

/**
 * Query complexity levels affecting early-stop thresholds
 */
export type QueryComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Configuration for early-stop behavior
 */
export interface EarlyStopConfig {
  targetPaperCount: number;
  minHighQualityCount: number;
  skipLowerTiersThreshold: number;
  qualityScoreThreshold: number;
  maxTierLatencyMs: number;
  enabled: boolean;
}

/**
 * Result of early-stop evaluation
 */
export interface EarlyStopDecision {
  shouldStop: boolean;
  reason: string | null;
  papersCollected: number;
  highQualityCount: number;
  tiersCompleted: string[];
  tiersSkipped: string[];
  savedApiCalls: number;
  timeSavedMs: number;
}

/**
 * Metrics for early-stop tracking
 */
export interface EarlyStopMetrics {
  totalSearches: number;
  earlyStoppedSearches: number;
  earlyStopRate: number;
  averagePapersAtStop: number;
  averageTimeSavedMs: number;
  tierSkipCounts: Map<string, number>;
}

/**
 * Cancellation token for tier operations
 */
export interface TierCancellationToken {
  cancelled: boolean;
  reason: string | null;
  cancel: (reason: string) => void;
}

@Injectable()
export class EarlyStopService {
  private readonly logger = new Logger(EarlyStopService.name);

  private totalSearches = 0;
  private earlyStoppedSearches = 0;
  private totalPapersAtStop = 0;
  private totalTimeSavedMs = 0;
  private readonly tierSkipCounts: Map<string, number> = new Map();

  private static readonly CHECK_INTERVAL_MS = 500;
  private static readonly CANCELLATION_POLL_MS = 100;
  private static readonly MAX_CHECKER_TIMEOUT_MS = 30000;
  private static readonly ESTIMATED_TIME_PER_TIER_MS = 5000;
  private static readonly ESTIMATED_API_CALLS_PER_TIER = 2;
  private static readonly ALL_TIERS = ['tier1', 'tier2', 'tier3', 'tier4'];

  // Phase 10.114: Quality-First Search Strategy
  //
  // STRATEGY CHANGE: Search ALL sources exhaustively, then filter to top 300 at 80%+
  //
  // Previous approach (speed-first):
  // - Stop at 150 high-quality papers (70%+)
  // - Skip lower tiers if 400+ papers collected
  // - Result: Fast but mixed quality
  //
  // New approach (quality-first):
  // - Search ALL sources (no early-stop by default)
  // - Collect ALL papers (could be 2000-5000)
  // - Enrich ALL with citations/journal metrics
  // - Filter to 80%+ quality only
  // - Return TOP 300 highest quality
  //
  // For literature review, gap analysis, Q-method statement generation:
  // - 300 excellent papers > 500 mediocre papers
  // - Comprehensive coverage = no missed gems
  // - Willing to wait 30-45s for quality results
  //
  private static readonly DEFAULT_CONFIG: EarlyStopConfig = {
    targetPaperCount: 5000,          // Very high: effectively disabled
    minHighQualityCount: 300,        // Only stop if we have 300 papers at 80%+
    skipLowerTiersThreshold: 4000,   // Very high: never skip tiers
    qualityScoreThreshold: 80,       // Phase 10.114: 80% is the quality bar
    maxTierLatencyMs: 30000,         // 30s per tier: allow more time
    enabled: false,                  // DISABLED by default for comprehensive search
  };

  private static readonly COMPLEXITY_CONFIGS: Record<QueryComplexity, Partial<EarlyStopConfig>> = {
    simple: {
      // Simple queries: still fetch comprehensively for quality
      targetPaperCount: 2000,
      minHighQualityCount: 200,
      skipLowerTiersThreshold: 1500,
      enabled: false,                // DISABLED: search all sources
    },
    moderate: {
      // Moderate queries: comprehensive search
      targetPaperCount: 3000,
      minHighQualityCount: 250,
      skipLowerTiersThreshold: 2500,
      enabled: false,                // DISABLED: search all sources
    },
    complex: {
      // Complex/comprehensive queries: absolutely no early stopping
      // This is the mode for literature review, gap analysis, Q-method
      targetPaperCount: 5000,
      minHighQualityCount: 300,
      skipLowerTiersThreshold: 4000,
      enabled: false,                // DISABLED: must search ALL sources
    },
  };

  /**
   * Get early-stop configuration based on query complexity
   */
  getConfig(complexity: QueryComplexity = 'moderate'): EarlyStopConfig {
    return {
      ...EarlyStopService.DEFAULT_CONFIG,
      ...EarlyStopService.COMPLEXITY_CONFIGS[complexity],
    };
  }

  /**
   * Create a cancellation token for tier operations
   */
  createCancellationToken(): TierCancellationToken {
    const token: TierCancellationToken = {
      cancelled: false,
      reason: null,
      cancel: (reason: string) => {
        token.cancelled = true;
        token.reason = reason;
      },
    };
    return token;
  }

  /**
   * Evaluate whether to stop early based on collected papers
   */
  shouldStopEarly(
    papers: EarlyStopPaper[],
    config: EarlyStopConfig,
    completedTiers: string[] = [],
  ): EarlyStopDecision {
    if (!config.enabled) {
      return this.createDecision(false, null, papers, completedTiers, []);
    }

    const paperCount = papers.length;
    const highQualityCount = this.countHighQualityPapers(papers, config.qualityScoreThreshold);

    if (paperCount >= config.skipLowerTiersThreshold) {
      return this.createDecision(
        true,
        `Reached paper threshold: ${paperCount} >= ${config.skipLowerTiersThreshold}`,
        papers,
        completedTiers,
        this.getPendingTiers(completedTiers),
      );
    }

    if (highQualityCount >= config.minHighQualityCount) {
      return this.createDecision(
        true,
        `Reached quality threshold: ${highQualityCount} high-quality papers >= ${config.minHighQualityCount}`,
        papers,
        completedTiers,
        this.getPendingTiers(completedTiers),
      );
    }

    if (paperCount >= config.targetPaperCount) {
      return this.createDecision(
        true,
        `Reached target: ${paperCount} >= ${config.targetPaperCount}`,
        papers,
        completedTiers,
        this.getPendingTiers(completedTiers),
      );
    }

    return this.createDecision(false, null, papers, completedTiers, []);
  }

  /**
   * Create an early-stop checker that monitors papers and triggers cancellation
   */
  createEarlyStopChecker(
    papersRef: { current: EarlyStopPaper[] },
    config: EarlyStopConfig,
    completedTiersRef: { current: string[] },
    cancellationTokens: Map<string, TierCancellationToken>,
    tiersToCancel: string[],
  ): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const decision = this.shouldStopEarly(
          papersRef.current,
          config,
          completedTiersRef.current,
        );

        if (decision.shouldStop) {
          clearInterval(checkInterval);

          for (const tierName of tiersToCancel) {
            const token = cancellationTokens.get(tierName);
            if (token && !token.cancelled) {
              token.cancel(decision.reason ?? 'early-stop');
              this.incrementTierSkipCount(tierName);
            }
          }

          this.recordEarlyStop(decision);
          this.logger.log(
            `[EarlyStop] Triggered: ${decision.reason} | ` +
            `Papers: ${decision.papersCollected}, High-quality: ${decision.highQualityCount}, ` +
            `Tiers skipped: ${decision.tiersSkipped.join(', ') || 'none'}`
          );

          resolve();
        }
      }, EarlyStopService.CHECK_INTERVAL_MS);

      checkInterval.unref();

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, EarlyStopService.MAX_CHECKER_TIMEOUT_MS);
    });
  }

  /**
   * Execute tier search with cancellation support
   * Uses cleanup pattern to prevent memory leaks from orphaned intervals
   */
  async executeWithCancellation<T>(
    tierName: string,
    operation: () => Promise<T>,
    cancellationToken: TierCancellationToken,
  ): Promise<T | null> {
    if (cancellationToken.cancelled) {
      this.logger.debug(`[${tierName}] Skipped: ${cancellationToken.reason}`);
      return null;
    }

    let cleanupInterval: NodeJS.Timeout | null = null;

    const cancellationPromise = new Promise<never>((_, reject) => {
      cleanupInterval = setInterval(() => {
        if (cancellationToken.cancelled) {
          reject(new Error(`${tierName} cancelled: ${cancellationToken.reason}`));
        }
      }, EarlyStopService.CANCELLATION_POLL_MS);
      cleanupInterval.unref();
    });

    try {
      const result = await Promise.race<T>([
        operation(),
        cancellationPromise,
      ]);

      return result;
    } catch (error) {
      if (cancellationToken.cancelled) {
        this.logger.debug(`[${tierName}] Cancelled during execution: ${cancellationToken.reason}`);
        return null;
      }
      throw error;
    } finally {
      // Critical: Always cleanup interval to prevent memory leak
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
    }
  }

  private countHighQualityPapers(papers: EarlyStopPaper[], threshold: number): number {
    return papers.filter(p => (p.qualityScore ?? 0) >= threshold).length;
  }

  private createDecision(
    shouldStop: boolean,
    reason: string | null,
    papers: EarlyStopPaper[],
    completedTiers: string[],
    skippedTiers: string[],
  ): EarlyStopDecision {
    const estimatedTimeSaved = skippedTiers.length * EarlyStopService.ESTIMATED_TIME_PER_TIER_MS;
    const estimatedApiCallsSaved = skippedTiers.length * EarlyStopService.ESTIMATED_API_CALLS_PER_TIER;

    return {
      shouldStop,
      reason,
      papersCollected: papers.length,
      highQualityCount: this.countHighQualityPapers(papers, EarlyStopService.DEFAULT_CONFIG.qualityScoreThreshold),
      tiersCompleted: completedTiers,
      tiersSkipped: skippedTiers,
      savedApiCalls: estimatedApiCallsSaved,
      timeSavedMs: estimatedTimeSaved,
    };
  }

  private getPendingTiers(completedTiers: string[]): string[] {
    return EarlyStopService.ALL_TIERS.filter(t => !completedTiers.includes(t));
  }

  private incrementTierSkipCount(tierName: string): void {
    const current = this.tierSkipCounts.get(tierName) ?? 0;
    this.tierSkipCounts.set(tierName, current + 1);
  }

  private recordEarlyStop(decision: EarlyStopDecision): void {
    this.earlyStoppedSearches++;
    this.totalPapersAtStop += decision.papersCollected;
    this.totalTimeSavedMs += decision.timeSavedMs;
  }

  /**
   * Record a search completion (for metrics)
   */
  recordSearchCompletion(wasEarlyStopped: boolean): void {
    this.totalSearches++;
    if (!wasEarlyStopped) {
      this.totalPapersAtStop += 0;
    }
  }

  /**
   * Get early-stop metrics
   */
  getMetrics(): EarlyStopMetrics {
    return {
      totalSearches: this.totalSearches,
      earlyStoppedSearches: this.earlyStoppedSearches,
      earlyStopRate: this.totalSearches > 0
        ? Math.round((this.earlyStoppedSearches / this.totalSearches) * 100)
        : 0,
      averagePapersAtStop: this.earlyStoppedSearches > 0
        ? Math.round(this.totalPapersAtStop / this.earlyStoppedSearches)
        : 0,
      averageTimeSavedMs: this.earlyStoppedSearches > 0
        ? Math.round(this.totalTimeSavedMs / this.earlyStoppedSearches)
        : 0,
      tierSkipCounts: new Map(this.tierSkipCounts),
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.totalSearches = 0;
    this.earlyStoppedSearches = 0;
    this.totalPapersAtStop = 0;
    this.totalTimeSavedMs = 0;
    this.tierSkipCounts.clear();
  }
}
