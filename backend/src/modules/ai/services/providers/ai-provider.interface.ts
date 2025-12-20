/**
 * AI Provider Interface
 * Phase 10.190: Netflix-Grade Unified AI Service
 *
 * Provides abstraction for multiple AI providers with:
 * - Standardized interface for all providers
 * - Health status monitoring
 * - Metrics collection
 * - Cost tracking
 *
 * Supported Providers:
 * - Groq (Llama 3.3 70B) - FREE
 * - Gemini (1.5 Flash) - 80% cheaper
 * - OpenAI (GPT-3.5/4) - Fallback
 */

/**
 * AI completion request options
 * Phase 10.185 Week 1: Added systemPrompt for Netflix-grade prompt engineering
 */
export interface AICompletionOptions {
  /** Model tier: 'fast' for quick responses, 'smart' for better quality */
  model?: 'fast' | 'smart';
  /** Temperature for response creativity (0-2, default varies by provider) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /**
   * System prompt for context setting (Phase 10.185)
   * - Sets AI behavior, persona, and constraints
   * - Applied before user prompt
   * - Critical for consistent, high-quality outputs
   */
  systemPrompt?: string;
  /** Enable response caching (reduces cost, improves latency) */
  cache?: boolean;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /**
   * User ID for cost tracking and budget enforcement (Phase 10.185)
   * - Required for per-user budget limits
   * - Enables cost attribution
   */
  userId?: string;
  /**
   * Force JSON output format (Phase 10.195)
   * - Ensures response is valid JSON
   * - Provider must support json_object response format
   */
  jsonMode?: boolean;
}

/**
 * AI completion response
 */
export interface AIResponse {
  /** Generated content */
  content: string;
  /** Total tokens used (input + output) */
  tokens: number;
  /** Input tokens used */
  inputTokens: number;
  /** Output tokens used */
  outputTokens: number;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Whether response was from cache */
  cached: boolean;
  /** Estimated cost in USD */
  cost: number;
  /** Provider that generated the response */
  provider: string;
  /** Model used */
  model: string;
}

/**
 * Provider health status
 */
export interface ProviderHealthStatus {
  /** Current health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Average latency in milliseconds */
  latencyMs: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Timestamp of last health check */
  lastCheckTimestamp: number;
  /** Circuit breaker state */
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  /** Number of consecutive failures */
  consecutiveFailures: number;
}

/**
 * Provider metrics for observability
 */
export interface ProviderMetrics {
  /** Provider name */
  provider: string;
  /** Total requests made */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** P95 latency in milliseconds */
  p95LatencyMs: number;
  /** P99 latency in milliseconds */
  p99LatencyMs: number;
  /** Current circuit breaker state */
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  /** Requests per minute (rolling window) */
  requestsPerMinute: number;
}

/**
 * AI Provider Interface
 *
 * All AI providers must implement this interface to be used
 * with the UnifiedAIService.
 */
export interface AIProvider {
  /** Unique provider name */
  readonly name: string;

  /** Cost per 1M input tokens in USD */
  readonly costPer1MInputTokens: number;

  /** Cost per 1M output tokens in USD */
  readonly costPer1MOutputTokens: number;

  /** Provider priority (lower = higher priority) */
  readonly priority: number;

  /**
   * Check if provider is available (API key configured)
   */
  isAvailable(): boolean;

  /**
   * Check if provider is healthy (can make requests)
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get current health status
   */
  getHealthStatus(): ProviderHealthStatus;

  /**
   * Generate AI completion
   *
   * @param prompt - Input prompt
   * @param options - Completion options
   * @returns AI response
   * @throws Error if provider fails
   */
  generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AIResponse>;

  /**
   * Get provider metrics
   */
  getMetrics(): ProviderMetrics;

  /**
   * Reset provider metrics (for testing)
   */
  resetMetrics(): void;

  /**
   * Record a successful request (for circuit breaker)
   */
  recordSuccess(latencyMs: number, cost: number): void;

  /**
   * Record a failed request (for circuit breaker)
   */
  recordFailure(): void;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** API key environment variable name */
  apiKeyEnvVar: string;
  /** Base URL for API (optional, for custom endpoints) */
  baseUrl?: string;
  /** Default timeout in milliseconds */
  defaultTimeoutMs: number;
  /** Maximum retries */
  maxRetries: number;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold: number;
  /** Circuit breaker reset timeout in milliseconds */
  circuitBreakerResetMs: number;
}

/**
 * Unified AI service configuration
 */
export interface UnifiedAIConfig {
  /** Provider priority order (provider names) */
  providerPriority: string[];
  /** Enable automatic fallback on failure */
  enableFallback: boolean;
  /** Maximum total cost per request (USD) */
  maxCostPerRequest: number;
  /** Enable request caching */
  enableCaching: boolean;
  /** Cache TTL in seconds */
  cacheTtlSeconds: number;
  /** Enable health checks */
  enableHealthChecks: boolean;
  /** Health check interval in milliseconds */
  healthCheckIntervalMs: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_UNIFIED_AI_CONFIG: UnifiedAIConfig = {
  providerPriority: ['groq', 'gemini', 'openai'],
  enableFallback: true,
  maxCostPerRequest: 0.10, // $0.10 max per request
  enableCaching: true,
  cacheTtlSeconds: 3600, // 1 hour
  enableHealthChecks: true,
  healthCheckIntervalMs: 30000, // 30 seconds
};
