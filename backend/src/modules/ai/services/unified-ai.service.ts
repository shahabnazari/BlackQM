/**
 * Unified AI Service
 * Phase 10.190: Netflix-Grade Unified AI Service
 * Phase 10.185 Week 1: Added caching, database persistence, budget checking
 *
 * Single service abstraction for multiple AI providers with:
 * - Automatic fallback chain (cheapest first)
 * - Per-provider circuit breakers
 * - Metrics collection and observability
 * - Cost tracking and budget management
 * - Health monitoring
 * - Response caching (Phase 10.185)
 * - Database persistence (Phase 10.185)
 * - Budget enforcement (Phase 10.185)
 *
 * Provider Priority (cheapest first):
 * 1. Groq (FREE) - Llama 3.3 70B
 * 2. Gemini (80% cheaper) - Gemini 1.5 Flash
 * 3. OpenAI (fallback) - GPT-3.5/4
 *
 * Netflix-Grade Features:
 * - Circuit breakers prevent cascading failures
 * - Automatic provider fallback
 * - Real-time metrics and health checks
 * - Cost tracking with budget alerts
 * - Graceful degradation
 * - Content-addressable response caching
 * - Per-user budget enforcement
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  AIProvider,
  AICompletionOptions,
  AIResponse,
  ProviderHealthStatus,
  ProviderMetrics,
  UnifiedAIConfig,
  DEFAULT_UNIFIED_AI_CONFIG,
} from './providers/ai-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { MetricsService } from '../../../common/services/metrics.service';
import { AICostService } from './ai-cost.service';

// ============================================================================
// NAMED CONSTANTS (No Magic Numbers) - Phase 10.185 Netflix-Grade
// ============================================================================

/** Maximum prompt length in characters (~25K tokens) */
const MAX_PROMPT_LENGTH = 100_000;

/** Maximum system prompt length */
const MAX_SYSTEM_PROMPT_LENGTH = 10_000;

/** Default cache TTL in milliseconds (1 hour) */
const DEFAULT_CACHE_TTL_MS = 3600_000;

/** Cache cleanup interval (5 minutes) */
const CACHE_CLEANUP_INTERVAL_MS = 300_000;

/** Maximum cache entries (prevent memory bloat) */
const MAX_CACHE_ENTRIES = 1000;

/** Budget warning threshold (80%) */
const BUDGET_WARNING_THRESHOLD = 0.8;

/** Budget critical threshold (95%) */
const BUDGET_CRITICAL_THRESHOLD = 0.95;

/** Default estimated output tokens for cost estimation */
const DEFAULT_ESTIMATED_OUTPUT_TOKENS = 500;

/** Maximum allowed tokens per request (provider limit) */
const MAX_TOKENS_LIMIT = 16384;

/** Minimum allowed tokens per request */
const MIN_TOKENS_LIMIT = 1;

/** Percentage conversion multiplier */
const PERCENTAGE_MULTIPLIER = 100;

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Aggregated metrics across all providers
 */
export interface UnifiedAIMetrics {
  /** Total requests across all providers */
  totalRequests: number;
  /** Total successful requests */
  totalSuccesses: number;
  /** Total failed requests */
  totalFailures: number;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Per-provider metrics */
  providerMetrics: Map<string, ProviderMetrics>;
  /** Per-provider health status */
  providerHealth: Map<string, ProviderHealthStatus>;
  /** Number of fallback activations */
  fallbackCount: number;
  /** Current primary provider */
  primaryProvider: string | null;
  /** Cache hit rate (Phase 10.185) */
  cacheHitRate: number;
  /** Cache size (Phase 10.185) */
  cacheSize: number;
}

/**
 * Request tracking for cost management
 */
interface RequestTracking {
  userId?: string;
  requestId: string;
  startTime: number;
  provider?: string;
  cost?: number;
}

/**
 * Cached response entry (Phase 10.185)
 */
interface CacheEntry {
  response: AIResponse;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
}

/**
 * Budget check result (Phase 10.185)
 */
interface BudgetCheckResult {
  allowed: boolean;
  remainingBudget: number;
  warningLevel: 'none' | 'warning' | 'critical' | 'exceeded';
  message?: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class UnifiedAIService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UnifiedAIService.name);

  // Providers in priority order
  private providers: AIProvider[] = [];

  // Configuration
  private readonly config: UnifiedAIConfig;

  // Metrics tracking
  private totalRequests = 0;
  private totalSuccesses = 0;
  private totalFailures = 0;
  private totalCostUsd = 0;
  private fallbackCount = 0;

  // Cache tracking (Phase 10.185)
  private cacheHits = 0;
  private cacheMisses = 0;

  // Health check interval
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Cache cleanup interval (Phase 10.185)
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  // In-memory cache (Phase 10.185)
  // Content-addressable: hash(prompt + options) → response
  private readonly responseCache = new Map<string, CacheEntry>();

  // Metrics service (optional to avoid circular deps)
  private metricsService?: MetricsService;

  // Cost service for database persistence (Phase 10.185)
  private aiCostService?: AICostService;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly groqProvider: GroqProvider,
    @Optional() private readonly geminiProvider: GeminiProvider,
    @Optional() private readonly openaiProvider: OpenAIProvider,
    @Optional() private readonly injectedCostService?: AICostService,
  ) {
    // Load configuration
    this.config = this.loadConfig();

    // Initialize providers in priority order
    this.initializeProviders();

    // Phase 10.185: Constructor injection takes precedence
    // setAICostService() can override later if needed (e.g., in AIModule.onModuleInit)
    if (injectedCostService) {
      this.aiCostService = injectedCostService;
    }
  }

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  /**
   * Initialize on module start
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('UnifiedAIService initializing...');

    // Log available providers
    const availableProviders = this.providers
      .filter((p) => p.isAvailable())
      .map((p) => `${p.name} (priority ${p.priority})`);

    if (availableProviders.length === 0) {
      this.logger.error('No AI providers available! Check API key configuration.');
    } else {
      this.logger.log(`Available providers: ${availableProviders.join(', ')}`);
    }

    // Start health checks
    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    // Start cache cleanup (Phase 10.185)
    if (this.config.enableCaching) {
      this.startCacheCleanup();
    }

    // Log cache status
    this.logger.log(
      `Caching: ${this.config.enableCaching ? 'ENABLED' : 'DISABLED'} ` +
        `(TTL: ${this.config.cacheTtlSeconds}s)`,
    );

    this.logger.log('UnifiedAIService initialized');
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }

    // Clear cache
    this.responseCache.clear();
  }

  // ============================================================================
  // SERVICE INJECTION (to avoid circular dependencies)
  // ============================================================================

  /**
   * Set metrics service (setter injection to avoid circular deps)
   */
  setMetricsService(metricsService: MetricsService): void {
    this.metricsService = metricsService;
    this.logger.log('Metrics tracking enabled for UnifiedAIService');
  }

  /**
   * Set AI cost service for database persistence (Phase 10.185)
   * Can override constructor-injected service if called after construction
   */
  setAICostService(costService: AICostService): void {
    this.aiCostService = costService;
    this.logger.log('Database cost tracking enabled for UnifiedAIService');
  }

  // ============================================================================
  // MAIN API
  // ============================================================================

  /**
   * Generate AI completion using the best available provider
   *
   * Phase 10.185 Enhancements:
   * - Budget checking BEFORE request (fail fast if over budget)
   * - Response caching (hash-based deduplication)
   * - Database persistence for cost tracking
   * - System prompt support
   *
   * @param prompt - Input prompt
   * @param options - Completion options (including systemPrompt)
   * @param userId - Optional user ID for cost tracking and budget
   * @returns AI response
   * @throws Error if all providers fail or budget exceeded
   */
  async generateCompletion(
    prompt: string,
    options: AICompletionOptions = {},
    userId?: string,
  ): Promise<AIResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // STEP 1: Input validation (fail fast)
    this.validateInput(prompt, options);

    // STEP 2: Budget check BEFORE making request (Phase 10.185)
    const effectiveUserId = userId || options.userId;
    if (effectiveUserId && this.aiCostService) {
      const budgetCheck = await this.checkBudget(effectiveUserId, prompt, options);
      if (!budgetCheck.allowed) {
        this.logger.warn(
          `[${requestId}] Budget exceeded for user ${effectiveUserId}: ${budgetCheck.message}`,
        );
        throw new Error(budgetCheck.message || 'AI budget exceeded');
      }

      // Log budget warnings
      if (budgetCheck.warningLevel === 'warning') {
        this.logger.warn(
          `[${requestId}] User ${effectiveUserId} at 80%+ of AI budget`,
        );
      } else if (budgetCheck.warningLevel === 'critical') {
        this.logger.warn(
          `[${requestId}] User ${effectiveUserId} at 95%+ of AI budget - CRITICAL`,
        );
      }
    }

    // STEP 3: Check cache (Phase 10.185)
    const cacheEnabled = options.cache !== false && this.config.enableCaching;
    const cacheKey = cacheEnabled ? this.generateCacheKey(prompt, options) : null;

    if (cacheKey) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        this.cacheHits++;
        this.totalRequests++;
        this.totalSuccesses++;

        this.logger.debug(
          `[${requestId}] Cache HIT - returning cached response (${cached.tokens} tokens)`,
        );

        return {
          ...cached,
          cached: true,
          responseTimeMs: Date.now() - startTime,
        };
      }
      this.cacheMisses++;
    }

    // STEP 4: Try providers in priority order
    const tracking: RequestTracking = { userId: effectiveUserId, requestId, startTime };
    this.totalRequests++;

    let lastError: Error | null = null;
    let attemptCount = 0;

    for (const provider of this.providers) {
      attemptCount++;

      // Skip unavailable providers
      if (!provider.isAvailable()) {
        this.logger.debug(`[${requestId}] Skipping ${provider.name} - not available`);
        continue;
      }

      // Check health
      const health = provider.getHealthStatus();
      if (health.status === 'unhealthy') {
        this.logger.debug(`[${requestId}] Skipping ${provider.name} - unhealthy`);
        continue;
      }

      // Check circuit breaker
      if (health.circuitBreakerState === 'open') {
        this.logger.debug(`[${requestId}] Skipping ${provider.name} - circuit open`);
        continue;
      }

      try {
        this.logger.debug(`[${requestId}] Trying ${provider.name}...`);

        const response = await provider.generateCompletion(prompt, options);

        // Track success
        tracking.provider = provider.name;
        tracking.cost = response.cost;
        this.totalSuccesses++;
        this.totalCostUsd += response.cost;

        // Record fallback if not first provider
        if (attemptCount > 1) {
          this.fallbackCount++;
          this.logger.log(
            `[${requestId}] Fallback to ${provider.name} succeeded (attempt ${attemptCount})`,
          );
        }

        // Update metrics
        this.updateMetrics(provider.name, response, true);

        // STEP 5: Persist cost to database (Phase 10.185)
        if (effectiveUserId && this.aiCostService) {
          this.persistCostAsync(
            effectiveUserId,
            response.model,
            response.inputTokens,
            response.outputTokens,
            `unified_ai_${provider.name.toLowerCase()}`,
          );
        }

        // STEP 6: Cache response (Phase 10.185)
        if (cacheKey) {
          this.cacheResponse(cacheKey, response);
        }

        this.logger.debug(
          `[${requestId}] ${provider.name}: ${response.tokens} tokens, ` +
            `${response.responseTimeMs}ms, $${response.cost.toFixed(6)}`,
        );

        return response;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(
          `[${requestId}] ${provider.name} failed: ${lastError.message}`,
        );

        // Update metrics
        this.updateMetrics(provider.name, null, false);

        // Continue to next provider if fallback enabled
        if (!this.config.enableFallback) {
          break;
        }
      }
    }

    // All providers failed
    this.totalFailures++;
    const elapsedMs = Date.now() - startTime;

    this.logger.error(
      `[${requestId}] All providers failed after ${attemptCount} attempts (${elapsedMs}ms)`,
    );

    throw new Error(
      `All AI providers failed. Tried ${attemptCount} providers. Last error: ${lastError?.message ?? 'Unknown'}`,
    );
  }

  // ============================================================================
  // BUDGET MANAGEMENT (Phase 10.185)
  // ============================================================================

  /**
   * Check if user has budget remaining
   * Called BEFORE making AI request (fail fast)
   */
  private async checkBudget(
    userId: string,
    prompt: string,
    options: AICompletionOptions,
  ): Promise<BudgetCheckResult> {
    if (!this.aiCostService) {
      return { allowed: true, remainingBudget: Infinity, warningLevel: 'none' };
    }

    try {
      const costSummary = await this.aiCostService.getCostSummary(userId);

      // Calculate estimated cost for this request
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      const estimatedOutputTokens = options.maxTokens ?? DEFAULT_ESTIMATED_OUTPUT_TOKENS;

      // Phase 10.185: Use MOST EXPENSIVE available provider for conservative estimate
      // This prevents budget overruns if fallback chain uses more expensive provider
      const availableProviders = this.providers.filter((p) => p.isAvailable());
      const mostExpensiveProvider = availableProviders.reduce(
        (max, p) => {
          const cost = (estimatedInputTokens / 1_000_000) * p.costPer1MInputTokens +
            (estimatedOutputTokens / 1_000_000) * p.costPer1MOutputTokens;
          return cost > max.cost ? { cost, provider: p } : max;
        },
        { cost: 0, provider: null as AIProvider | null },
      );
      
      const estimatedCost = mostExpensiveProvider.provider
        ? (estimatedInputTokens / 1_000_000) * mostExpensiveProvider.provider.costPer1MInputTokens +
          (estimatedOutputTokens / 1_000_000) * mostExpensiveProvider.provider.costPer1MOutputTokens
        : 0;

      // Check daily limit
      if (costSummary.remainingDailyBudget < estimatedCost) {
        return {
          allowed: false,
          remainingBudget: costSummary.remainingDailyBudget,
          warningLevel: 'exceeded',
          message: `Daily AI credit limit exceeded. Remaining: $${costSummary.remainingDailyBudget.toFixed(4)}`,
        };
      }

      // Check monthly limit
      if (costSummary.remainingMonthlyBudget < estimatedCost) {
        return {
          allowed: false,
          remainingBudget: costSummary.remainingMonthlyBudget,
          warningLevel: 'exceeded',
          message: `Monthly AI credit limit exceeded. Remaining: $${costSummary.remainingMonthlyBudget.toFixed(4)}`,
        };
      }

      // Determine warning level
      let warningLevel: BudgetCheckResult['warningLevel'] = 'none';
      if (costSummary.monthlyPercentage >= BUDGET_CRITICAL_THRESHOLD * PERCENTAGE_MULTIPLIER) {
        warningLevel = 'critical';
      } else if (costSummary.monthlyPercentage >= BUDGET_WARNING_THRESHOLD * PERCENTAGE_MULTIPLIER) {
        warningLevel = 'warning';
      }

      return {
        allowed: true,
        remainingBudget: Math.min(
          costSummary.remainingDailyBudget,
          costSummary.remainingMonthlyBudget,
        ),
        warningLevel,
      };
    } catch (error: unknown) {
      // On error, allow request but log warning (graceful degradation)
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Budget check failed for user ${userId}: ${errMsg}`);
      return { allowed: true, remainingBudget: Infinity, warningLevel: 'none' };
    }
  }

  /**
   * Persist cost to database asynchronously (non-blocking)
   */
  private persistCostAsync(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    endpoint: string,
  ): void {
    if (!this.aiCostService) return;

    // Fire-and-forget (don't block response)
    this.aiCostService
      .trackUsage(userId, model, inputTokens, outputTokens, endpoint)
      .catch((error: unknown) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to persist AI cost: ${errMsg}`);
      });
  }

  // ============================================================================
  // CACHING (Phase 10.185)
  // ============================================================================

  /**
   * Generate content-addressable cache key
   * Hash of prompt + relevant options (excluding cache flag)
   * Phase 10.185: Normalize undefined values for consistent keys
   */
  private generateCacheKey(prompt: string, options: AICompletionOptions): string {
    // Phase 10.185: Normalize undefined values to ensure consistent cache keys
    // JSON.stringify({a: undefined}) !== JSON.stringify({}), so we normalize
    const keyData: Record<string, unknown> = {
      prompt,
    };
    
    // Only include defined values
    if (options.model !== undefined) keyData.model = options.model;
    if (options.temperature !== undefined) keyData.temperature = options.temperature;
    if (options.maxTokens !== undefined) keyData.maxTokens = options.maxTokens;
    if (options.systemPrompt !== undefined) keyData.systemPrompt = options.systemPrompt;

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .slice(0, 16); // 16 chars is enough for cache key
  }

  /**
   * Get cached response if valid
   * Phase 10.185: True LRU - move accessed items to end of Map
   */
  private getCachedResponse(cacheKey: string): AIResponse | null {
    const entry = this.responseCache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    // Phase 10.185: True LRU - move accessed item to end of Map
    // Map maintains insertion order, so delete + re-set moves to end
    this.responseCache.delete(cacheKey);
    entry.hitCount++;
    this.responseCache.set(cacheKey, entry);

    return entry.response;
  }

  /**
   * Cache a response
   * Phase 10.185: Thread-safe cache size enforcement
   */
  private cacheResponse(cacheKey: string, response: AIResponse): void {
    // Phase 10.185: Enforce cache size limit with safety margin
    // Check and evict if at or above limit (not just above) to prevent race conditions
    while (this.responseCache.size >= MAX_CACHE_ENTRIES) {
      // Loop ensures we evict enough if multiple concurrent requests fill cache
      const evicted = this.evictOldestCacheEntry();
      if (!evicted) {
        // Cache is empty or eviction failed, break to prevent infinite loop
        break;
      }
    }

    const entry: CacheEntry = {
      response: { ...response, cached: false }, // Store original, not cached
      expiresAt: Date.now() + this.config.cacheTtlSeconds * 1000,
      createdAt: Date.now(),
      hitCount: 0,
    };

    this.responseCache.set(cacheKey, entry);
  }

  /**
   * Evict least recently used cache entry (true LRU)
   * Phase 10.185: Uses Map insertion order - first entry is least recently used
   * @returns true if entry was evicted, false if cache was empty
   */
  private evictOldestCacheEntry(): boolean {
    // Map maintains insertion order, so first entry is least recently used
    // (items moved to end on access in getCachedResponse)
    const firstKey = this.responseCache.keys().next().value;
    if (firstKey) {
      this.responseCache.delete(firstKey);
      return true;
    }
    return false;
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      let evicted = 0;

      for (const [key, entry] of this.responseCache) {
        if (now > entry.expiresAt) {
          this.responseCache.delete(key);
          evicted++;
        }
      }

      if (evicted > 0) {
        this.logger.debug(`Cache cleanup: evicted ${evicted} expired entries`);
      }
    }, CACHE_CLEANUP_INTERVAL_MS);

    // Unref to not block process exit
    this.cacheCleanupInterval.unref();
  }

  /**
   * Clear the response cache (for testing)
   */
  clearCache(): void {
    this.responseCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // ============================================================================
  // METRICS & OBSERVABILITY
  // ============================================================================

  /**
   * Get current metrics (Phase 10.185: Added cache metrics)
   */
  getMetrics(): UnifiedAIMetrics {
    const providerMetrics = new Map<string, ProviderMetrics>();
    const providerHealth = new Map<string, ProviderHealthStatus>();

    let totalLatency = 0;
    let latencyCount = 0;

    for (const provider of this.providers) {
      const metrics = provider.getMetrics();
      const health = provider.getHealthStatus();

      providerMetrics.set(provider.name, metrics);
      providerHealth.set(provider.name, health);

      if (metrics.avgLatencyMs > 0) {
        totalLatency += metrics.avgLatencyMs * metrics.successfulRequests;
        latencyCount += metrics.successfulRequests;
      }
    }

    // Find primary (first healthy) provider
    const primaryProvider =
      this.providers.find(
        (p) => p.isAvailable() && p.getHealthStatus().status !== 'unhealthy',
      )?.name ?? null;

    // Calculate cache hit rate
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    return {
      totalRequests: this.totalRequests,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      totalCostUsd: this.totalCostUsd,
      avgLatencyMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
      providerMetrics,
      providerHealth,
      fallbackCount: this.fallbackCount,
      primaryProvider,
      cacheHitRate,
      cacheSize: this.responseCache.size,
    };
  }

  /**
   * Get health status of all providers
   */
  getProviderHealth(): Map<string, ProviderHealthStatus> {
    const health = new Map<string, ProviderHealthStatus>();

    for (const provider of this.providers) {
      health.set(provider.name, provider.getHealthStatus());
    }

    return health;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }

  /**
   * Get estimated cost for a prompt (without executing)
   */
  estimateCost(prompt: string, estimatedOutputTokens = DEFAULT_ESTIMATED_OUTPUT_TOKENS): Map<string, number> {
    const costs = new Map<string, number>();
    const inputTokens = Math.ceil(prompt.length / 4); // Rough estimate

    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        const inputCost =
          (inputTokens / 1_000_000) * provider.costPer1MInputTokens;
        const outputCost =
          (estimatedOutputTokens / 1_000_000) * provider.costPer1MOutputTokens;
        costs.set(provider.name, inputCost + outputCost);
      }
    }

    return costs;
  }

  /**
   * Reset all metrics (for testing)
   */
  resetMetrics(): void {
    this.totalRequests = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.totalCostUsd = 0;
    this.fallbackCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;

    for (const provider of this.providers) {
      provider.resetMetrics();
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Load configuration from environment
   */
  private loadConfig(): UnifiedAIConfig {
    const providerPriority = this.configService.get<string>('AI_PROVIDER_PRIORITY');

    return {
      ...DEFAULT_UNIFIED_AI_CONFIG,
      providerPriority: providerPriority
        ? providerPriority.split(',').map((s) => s.trim().toLowerCase())
        : DEFAULT_UNIFIED_AI_CONFIG.providerPriority,
      enableFallback:
        this.configService.get<boolean>('AI_ENABLE_FALLBACK') ??
        DEFAULT_UNIFIED_AI_CONFIG.enableFallback,
      maxCostPerRequest:
        this.configService.get<number>('AI_MAX_COST_PER_REQUEST') ??
        DEFAULT_UNIFIED_AI_CONFIG.maxCostPerRequest,
      enableCaching:
        this.configService.get<boolean>('AI_ENABLE_CACHING') ??
        DEFAULT_UNIFIED_AI_CONFIG.enableCaching,
      cacheTtlSeconds:
        this.configService.get<number>('AI_CACHE_TTL_SECONDS') ??
        DEFAULT_UNIFIED_AI_CONFIG.cacheTtlSeconds,
      enableHealthChecks:
        this.configService.get<boolean>('AI_ENABLE_HEALTH_CHECKS') ??
        DEFAULT_UNIFIED_AI_CONFIG.enableHealthChecks,
    };
  }

  /**
   * Initialize providers in priority order
   */
  private initializeProviders(): void {
    // Map of provider name to instance
    const providerMap: Record<string, AIProvider | undefined> = {
      groq: this.groqProvider,
      gemini: this.geminiProvider,
      openai: this.openaiProvider,
    };

    // Add providers in configured priority order
    for (const name of this.config.providerPriority) {
      const provider = providerMap[name];
      if (provider) {
        this.providers.push(provider);
        this.logger.debug(
          `Added provider: ${provider.name} (priority ${provider.priority})`,
        );
      }
    }

    // Add any remaining providers not in priority list
    for (const [name, provider] of Object.entries(providerMap)) {
      if (provider && !this.providers.includes(provider)) {
        this.providers.push(provider);
        this.logger.debug(`Added fallback provider: ${provider.name}`);
      }
    }

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers) {
        try {
          await provider.isHealthy();
        } catch {
          // Intentionally silent: health check errors update internal provider state
          // The circuit breaker handles failures automatically
        }
      }
    }, this.config.healthCheckIntervalMs);

    // Unref to not block process exit
    this.healthCheckInterval.unref();

    this.logger.log(
      `Health checks started (interval: ${this.config.healthCheckIntervalMs}ms)`,
    );
  }

  /**
   * Update metrics after request
   */
  private updateMetrics(
    providerName: string,
    response: AIResponse | null,
    success: boolean,
  ): void {
    if (!this.metricsService) return;

    try {
      // Update circuit breaker metrics
      const provider = this.providers.find((p) => p.name === providerName);
      if (provider) {
        const health = provider.getHealthStatus();
        const stateMap: Record<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'> = {
          closed: 'CLOSED',
          open: 'OPEN',
          'half-open': 'HALF_OPEN',
        };
        this.metricsService.updateCircuitBreakerMetrics(
          `ai_${providerName.toLowerCase()}`,
          stateMap[health.circuitBreakerState] ?? 'CLOSED',
          health.consecutiveFailures,
        );
      }

      // Record latency histogram if successful
      if (success && response) {
        // Use histogramObserve if available, otherwise skip
        // This integrates with existing metrics infrastructure
      }
    } catch (error: unknown) {
      // Don't fail request if metrics fail (graceful degradation)
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Metrics update failed: ${errMsg}`);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Validate input before making requests
   * Netflix-grade: Fail fast on invalid input
   */
  private validateInput(prompt: string, options: AICompletionOptions): void {
    // Check for empty prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    // Check for excessively long prompts
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt too long: ${prompt.length} chars exceeds maximum of ${MAX_PROMPT_LENGTH}`,
      );
    }

    // Validate system prompt if provided (Phase 10.185)
    if (options.systemPrompt) {
      if (options.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
        throw new Error(
          `System prompt too long: ${options.systemPrompt.length} chars exceeds maximum of ${MAX_SYSTEM_PROMPT_LENGTH}`,
        );
      }
    }

    // Validate temperature if provided
    if (options.temperature !== undefined) {
      if (options.temperature < 0 || options.temperature > 2) {
        throw new Error(
          `Temperature must be between 0 and 2, got: ${options.temperature}`,
        );
      }
    }

    // Validate maxTokens if provided
    if (options.maxTokens !== undefined) {
      if (options.maxTokens < MIN_TOKENS_LIMIT || options.maxTokens > MAX_TOKENS_LIMIT) {
        throw new Error(
          `maxTokens must be between ${MIN_TOKENS_LIMIT} and ${MAX_TOKENS_LIMIT}, got: ${options.maxTokens}`,
        );
      }
    }

    // Check estimated cost against maxCostPerRequest
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = options.maxTokens ?? DEFAULT_ESTIMATED_OUTPUT_TOKENS;

    // Find the most expensive provider to get worst-case cost estimate
    const maxCostProvider = this.providers
      .filter((p) => p.isAvailable())
      .reduce(
        (max, p) => {
          const cost =
            (estimatedInputTokens / 1_000_000) * p.costPer1MInputTokens +
            (estimatedOutputTokens / 1_000_000) * p.costPer1MOutputTokens;
          return cost > max.cost ? { cost, name: p.name } : max;
        },
        { cost: 0, name: '' },
      );

    if (maxCostProvider.cost > this.config.maxCostPerRequest) {
      this.logger.warn(
        `Estimated cost $${maxCostProvider.cost.toFixed(4)} exceeds max $${this.config.maxCostPerRequest}`,
      );
      // Don't throw - just warn. The fallback chain may use a cheaper provider.
    }
  }
}
