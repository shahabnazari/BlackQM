/**
 * Phase 10.170 Week 4: Purpose-Aware Metrics Types
 *
 * Netflix-grade type definitions for production monitoring of
 * purpose-aware pipeline components: scoring, detection, diversity, caching.
 *
 * DESIGN PRINCIPLES:
 * - Strict typing with readonly interfaces
 * - No `any` types
 * - Prometheus-compatible metric names
 * - Full documentation
 *
 * @module purpose-aware-metrics.types
 * @since Phase 10.170 Week 4
 */

import { ResearchPurpose } from './purpose-aware.types';

// ============================================================================
// ROLLING WINDOW TYPES
// ============================================================================

/**
 * Configuration for rolling window latency tracking
 */
export interface RollingWindowConfig {
  /** Maximum entries to track (default: 1000) */
  readonly size: number;
}

// ============================================================================
// SLA TARGETS
// ============================================================================

/**
 * SLA targets for purpose-aware operations
 * Based on Netflix-grade latency requirements
 */
export const PURPOSE_AWARE_SLA_TARGETS = {
  /** Single paper scoring p95 target (ms) */
  SCORING_SINGLE_P95_MS: 10,
  /** Batch scoring (100 papers) p95 target (ms) */
  SCORING_BATCH_P95_MS: 100,
  /** Full-text detection p95 target (ms) */
  DETECTION_P95_MS: 5000,
  /** Diversity analysis p95 target (ms) */
  DIVERSITY_P95_MS: 50,
  /** Cache hit rate target */
  CACHE_HIT_RATE: 0.6,
  /** Error rate threshold */
  ERROR_RATE_THRESHOLD: 0.01,
} as const;

// ============================================================================
// METRICS TYPES
// ============================================================================

/**
 * Detection tier names for metrics tracking
 */
export type DetectionTierName =
  | 'database'
  | 'direct_url'
  | 'pmc_pattern'
  | 'unpaywall'
  | 'publisher_html'
  | 'secondary_links'
  | 'ai_verification';

/**
 * Cache operation types
 */
export type CacheOperation = 'get' | 'set' | 'delete' | 'invalidate';

/**
 * Per-purpose metrics snapshot
 */
export interface PurposeMetricsSnapshot {
  /** Research purpose */
  readonly purpose: ResearchPurpose;
  /** Papers scored count */
  readonly papersScored: number;
  /** Average quality score */
  readonly avgQualityScore: number;
  /** P95 scoring latency (ms) */
  readonly scoringP95Ms: number;
  /** Threshold relaxation count */
  readonly thresholdRelaxations: number;
  /** Average Shannon diversity index */
  readonly avgShannonIndex: number;
  /** Full-text discovery rate (0-1) */
  readonly fullTextDiscoveryRate: number;
}

/**
 * Detection metrics snapshot
 */
export interface DetectionMetricsSnapshot {
  /** Total detection attempts */
  readonly totalAttempts: number;
  /** Successful detections */
  readonly successCount: number;
  /** Success rate (0-1) */
  readonly successRate: number;
  /** P95 detection latency (ms) */
  readonly detectionP95Ms: number;
  /** Per-tier statistics */
  readonly tierStats: Readonly<Record<DetectionTierName, TierStats>>;
}

/**
 * Statistics for a single detection tier
 */
export interface TierStats {
  /** Attempts at this tier */
  readonly attempts: number;
  /** Successes at this tier */
  readonly successes: number;
  /** Average latency (ms) */
  readonly avgLatencyMs: number;
}

/**
 * Cache metrics snapshot
 */
export interface CacheMetricsSnapshot {
  /** Score cache stats */
  readonly scores: CacheStats;
  /** Diversity cache stats */
  readonly diversity: CacheStats;
  /** Detection cache stats (existing) */
  readonly detection: CacheStats;
  /** Overall hit rate */
  readonly overallHitRate: number;
}

/**
 * Statistics for a single cache
 */
export interface CacheStats {
  /** Current size */
  readonly size: number;
  /** Maximum size */
  readonly maxSize: number;
  /** Hit count */
  readonly hits: number;
  /** Miss count */
  readonly misses: number;
  /** Hit rate (0-1) */
  readonly hitRate: number;
  /** Eviction count */
  readonly evictions: number;
  /** Memory usage estimate (bytes) */
  readonly memoryBytes: number;
}

/**
 * SLA compliance status
 */
export interface SLAComplianceStatus {
  /** Scoring SLA compliance */
  readonly scoring: boolean;
  /** Detection SLA compliance */
  readonly detection: boolean;
  /** Cache hit rate compliance */
  readonly cacheHitRate: boolean;
  /** Error rate compliance */
  readonly errorRate: boolean;
  /** Overall compliance */
  readonly overall: boolean;
}

/**
 * Complete purpose-aware metrics summary
 */
export interface PurposeAwareMetricsSummary {
  /** Per-purpose metrics */
  readonly byPurpose: Readonly<Record<ResearchPurpose, PurposeMetricsSnapshot>>;
  /** Detection metrics */
  readonly detection: DetectionMetricsSnapshot;
  /** Cache metrics */
  readonly cache: CacheMetricsSnapshot;
  /** SLA compliance */
  readonly sla: SLAComplianceStatus;
  /** Error rate (0-1) */
  readonly errorRate: number;
  /** Total operations count */
  readonly totalOperations: number;
  /** Report timestamp */
  readonly timestamp: string;
}

// ============================================================================
// CIRCUIT BREAKER TYPES
// ============================================================================

/**
 * Circuit breaker states
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name for logging */
  readonly name: string;
  /** Failures before opening circuit */
  readonly failureThreshold: number;
  /** Successes needed to close from half-open */
  readonly successThreshold: number;
  /** Timeout before trying again (ms) */
  readonly timeout: number;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /** Current state */
  readonly state: CircuitState;
  /** Recent failure count */
  readonly failures: number;
  /** Recent success count */
  readonly successes: number;
  /** Last failure timestamp */
  readonly lastFailure: number | null;
  /** Last success timestamp */
  readonly lastSuccess: number | null;
  /** Total historical failures */
  readonly totalFailures: number;
  /** Total historical successes */
  readonly totalSuccesses: number;
}

/**
 * Circuit breaker names for purpose-aware services
 */
export type PurposeAwareCircuitName = 'unpaywall' | 'publisher' | 'aiVerification';

/**
 * Circuit breaker status response
 */
export interface CircuitBreakerStatus {
  /** Per-circuit statistics */
  readonly circuits: Readonly<Record<PurposeAwareCircuitName, CircuitBreakerStats>>;
  /** Overall health */
  readonly healthy: boolean;
  /** Degradation level */
  readonly degradationLevel: 'normal' | 'degraded' | 'critical';
}

// ============================================================================
// HEALTH RESPONSE TYPES
// ============================================================================

/**
 * Component health status
 */
export type ComponentHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Individual component health
 */
export interface ComponentHealth {
  /** Component status */
  readonly status: ComponentHealthStatus;
  /** Status message */
  readonly message: string;
  /** Key metric value */
  readonly metric?: number;
}

/**
 * Complete health response for purpose-aware services
 */
export interface PurposeAwareHealthResponse {
  /** Overall status */
  readonly status: ComponentHealthStatus;
  /** Component health */
  readonly components: {
    readonly configService: ComponentHealth;
    readonly scoringService: ComponentHealth;
    readonly detectionService: ComponentHealth;
    readonly diversityService: ComponentHealth;
    readonly cacheService: ComponentHealth;
  };
  /** Circuit breaker status */
  readonly circuits: CircuitBreakerStatus;
  /** Cache metrics */
  readonly cache: CacheMetricsSnapshot;
  /** SLA compliance */
  readonly sla: SLAComplianceStatus;
  /** Response timestamp */
  readonly timestamp: string;
}

// ============================================================================
// CACHE ENTRY TYPES
// ============================================================================

/**
 * Cache entry with metadata for TTL tracking
 */
export interface CacheEntry<T> {
  /** Cached value */
  readonly value: T;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Expiration timestamp (fresh TTL) */
  readonly expiresAt: number;
  /** Stale expiration timestamp */
  readonly staleExpiresAt: number;
  /** Cache key for debugging */
  readonly key: string;
}

/**
 * Cache tier (fresh, stale, or expired)
 */
export type CacheTier = 'fresh' | 'stale' | 'expired';

/**
 * Cache lookup result
 */
export interface CacheLookupResult<T> {
  /** Whether entry was found */
  readonly found: boolean;
  /** Cache tier of the result */
  readonly tier: CacheTier;
  /** The cached value (if found) */
  readonly value: T | null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate cache stats
 */
export function validateCacheStats(stats: CacheStats): void {
  if (!Number.isFinite(stats.size) || stats.size < 0) {
    throw new Error(`Cache size must be non-negative, got: ${stats.size}`);
  }
  if (!Number.isFinite(stats.hitRate) || stats.hitRate < 0 || stats.hitRate > 1) {
    throw new Error(`Hit rate must be 0-1, got: ${stats.hitRate}`);
  }
}

/**
 * Validate circuit breaker stats
 */
export function validateCircuitStats(stats: CircuitBreakerStats): void {
  const validStates: CircuitState[] = ['closed', 'open', 'half-open'];
  if (!validStates.includes(stats.state)) {
    throw new Error(`Invalid circuit state: ${stats.state}`);
  }
  if (!Number.isInteger(stats.failures) || stats.failures < 0) {
    throw new Error(`Failures must be non-negative integer, got: ${stats.failures}`);
  }
}

/**
 * Calculate overall health status from components
 */
export function calculateOverallHealth(
  components: PurposeAwareHealthResponse['components'],
): ComponentHealthStatus {
  const statuses = Object.values(components).map(c => c.status);

  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }
  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }
  return 'healthy';
}
