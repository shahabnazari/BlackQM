/**
 * API Rate Limiter Service
 *
 * Phase 10.101 Task 3 - Phase 8: Extract Rate Limiting Module
 *
 * RESPONSIBILITIES:
 * - Retry with exponential backoff for rate-limited API calls
 * - Parse provider-specific rate limit error messages (Groq, OpenAI)
 * - Model selection based on availability and cost
 * - Enterprise-grade error handling with detailed logging
 *
 * EXTRACTED FROM: unified-theme-extraction.service.ts
 * REDUCES MAIN FILE BY: ~200 lines
 *
 * @module literature
 * @service ApiRateLimiterService
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { RateLimitError } from '../types/unified-theme-extraction.types';
import { MetricsService } from '../../../common/services/metrics.service'; // PHASE 8.6: Metrics tracking
import { safeGet } from '../../../common/utils/array-utils'; // Netflix-Grade: Safe array access

// ============================================================================
// CIRCUIT BREAKER PATTERN (Phase 8.5 Enhancement)
// ============================================================================

/**
 * Circuit Breaker States
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Too many failures, block all requests
 * - HALF_OPEN: Testing if service recovered, allow single request
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit Breaker per provider
 * Prevents cascading failures when API is consistently failing
 *
 * BUG FIX (Phase 8.5 Strict Audit - BUG-2):
 * - Added halfOpenRequestInFlight to prevent race condition
 * - Ensures only one test request in HALF_OPEN state
 */
interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
  halfOpenRequestInFlight: boolean; // BUG-2 FIX: Prevent multiple concurrent HALF_OPEN requests
}

/**
 * Service for handling API rate limiting and retry logic
 *
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Only handles rate limiting and retries
 * - Provider Agnostic: Supports multiple AI providers (Groq, OpenAI)
 * - Type Safe: Strict TypeScript with no `any` types
 * - Enterprise Grade: Detailed logging and error handling
 */
@Injectable()
export class ApiRateLimiterService {
  private readonly logger = new Logger(ApiRateLimiterService.name);

  // CONSTANTS
  private static readonly GROQ_CODING_MODEL = 'llama-3.3-70b-versatile'; // FREE, high quality
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_RETRY_DELAY_SECONDS = 300; // 5 minutes
  private static readonly BASE_BACKOFF_MS = 5000; // 5 seconds
  // HIGH-001 FIX: Security constants for ReDoS prevention
  private static readonly MAX_ERROR_MESSAGE_LENGTH = 1000; // Prevent ReDoS attacks
  // LOW-002 FIX: Maximum reasonable retry wait time
  private static readonly MAX_RETRY_SECONDS = 3600; // 1 hour max
  // MEDIUM-003 FIX: Extract cost constants for easy updates
  private static readonly OPENAI_CHAT_COST_PER_EXTRACTION = '~$0.13';
  private static readonly GROQ_CHAT_COST = '$0.00';

  // PHASE 8.5 ENHANCEMENT: Circuit Breaker configuration
  private static readonly CIRCUIT_FAILURE_THRESHOLD = 5; // Open circuit after 5 failures
  private static readonly CIRCUIT_SUCCESS_THRESHOLD = 2; // Close circuit after 2 successes in half-open
  private static readonly CIRCUIT_TIMEOUT_MS = 60000; // Try recovery after 60 seconds
  private static readonly CIRCUIT_HALF_OPEN_TIMEOUT_MS = 30000; // Half-open timeout

  // Provider clients
  private readonly openai: OpenAI;
  private readonly groq: OpenAI | null;
  private readonly useGroqForChat: boolean;

  // PHASE 8.5 ENHANCEMENT: Circuit breakers per provider
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();

  // PHASE 8.6 ENHANCEMENT: Metrics tracking (optional to avoid circular deps)
  private metricsService?: MetricsService;

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Initialize OpenAI client (REQUIRED)
    // CRITICAL-001 FIX: Validate API key exists before initialization
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for ApiRateLimiterService. ' +
        'Please set OPENAI_API_KEY in your .env file or environment variables.'
      );
    }
    this.openai = new OpenAI({
      apiKey: openaiKey,
    });

    // Initialize Groq client (OPTIONAL - FREE alternative)
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqApiKey) {
      this.groq = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.useGroqForChat = true;
      this.logger.log('✅ Groq client initialized (FREE tier)');
    } else {
      this.groq = null;
      this.useGroqForChat = false;
      this.logger.warn('⚠️ Groq API key not found - falling back to OpenAI ($$$)');
    }
  }

  // ============================================================================
  // PHASE 8.6: METRICS INTEGRATION (Setter Injection)
  // ============================================================================

  /**
   * Set metrics service (optional, avoids circular dependencies)
   * Call this from the module to enable metrics tracking
   * @public
   */
  public setMetricsService(metrics: MetricsService): void {
    this.metricsService = metrics;
    this.logger.log('✅ Metrics tracking enabled for API rate limiter');
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get the chat client and model for text generation
   *
   * STRATEGY:
   * 1. Use Groq (FREE) if available
   * 2. Fall back to OpenAI if Groq unavailable
   *
   * Phase 10.944: Uses Groq (FREE) if available, falls back to OpenAI
   * LOW-001 FIX: Explicit public modifier for clarity
   *
   * @returns Client and model name for chat completions
   * @public
   */
  public getChatClientAndModel(): { client: OpenAI; model: string } {
    if (this.useGroqForChat && this.groq) {
      return {
        client: this.groq,
        model: ApiRateLimiterService.GROQ_CODING_MODEL,
      };
    }
    return {
      client: this.openai,
      model: 'gpt-4-turbo-preview', // Phase 10.98: Hardcoded (AI coding deprecated)
    };
  }

  /**
   * Get provider information for logging and cost estimation
   *
   * MEDIUM-003 FIX: Uses extracted constants for cost values
   * LOW-001 FIX: Explicit public modifier for clarity
   *
   * @returns Provider details including name and cost
   * @public
   */
  public getProviderInfo(): { provider: string; cost: string } {
    if (this.useGroqForChat) {
      return {
        provider: 'Groq',
        cost: ApiRateLimiterService.GROQ_CHAT_COST,
      };
    }
    return {
      provider: 'OpenAI',
      cost: ApiRateLimiterService.OPENAI_CHAT_COST_PER_EXTRACTION,
    };
  }

  /**
   * Execute AI operation with retry logic for rate limits
   *
   * FEATURES:
   * - Automatic retry with exponential backoff
   * - Provider-specific error parsing
   * - Detailed logging of rate limit details
   * - Throws RateLimitError after max retries
   *
   * Phase 10.99: Enterprise-grade retry mechanism with exponential backoff
   * LOW-001 FIX: Explicit public modifier for clarity
   *
   * @param operation - Async function to execute
   * @param context - Description for logging (e.g., "Theme Extraction")
   * @param provider - AI provider being used ('groq' | 'openai')
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Result of the operation
   * @throws RateLimitError if max retries exceeded
   * @throws Original error if non-rate-limit error occurs
   * @public
   *
   * @deprecated Phase 10.98 FIX: No longer used (AI coding removed)
   */
  public async executeWithRateLimitRetry<T>(
    operation: () => Promise<T>,
    context: string,
    provider: 'groq' | 'openai' = 'groq',
    maxRetries: number = ApiRateLimiterService.DEFAULT_MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;

    // PHASE 8.5 ENHANCEMENT: Check circuit breaker before attempting
    if (this.isCircuitOpen(provider)) {
      const circuit = this.getCircuitBreaker(provider);
      const waitTime = circuit.nextAttemptTime
        ? Math.ceil((circuit.nextAttemptTime - Date.now()) / 1000)
        : 60;
      throw new Error(
        `Circuit breaker OPEN for ${provider.toUpperCase()} API. ` +
        `Service is unavailable due to repeated failures. ` +
        `Retry in ${waitTime}s.`
      );
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        // PHASE 8.5 ENHANCEMENT: Record success in circuit breaker
        this.recordSuccess(provider);
        return result;
      } catch (error: unknown) {
        // Type-safe error checking
        const errorObj = error as { status?: number; message?: string };
        const is429 =
          errorObj?.status === 429 ||
          (typeof errorObj?.message === 'string' &&
            (errorObj.message.includes('429') || errorObj.message.includes('Rate limit')));

        if (is429) {
          const { retryAfter, details } = this.parseGroqRateLimitError(error);

          this.logger.warn(`⚠️ [${context}] Rate limit hit (attempt ${attempt}/${maxRetries})`);
          this.logger.warn(`   Provider: ${provider.toUpperCase()}`);
          if (details) {
            this.logger.warn(
              `   Usage: ${details.used.toLocaleString()}/${details.limit.toLocaleString()} tokens (${((details.used / details.limit) * 100).toFixed(1)}%)`,
            );
          }
          this.logger.warn(`   Retry after: ${retryAfter}s`);

          // If this is the last attempt, throw RateLimitError
          if (attempt === maxRetries) {
            throw new RateLimitError(
              `${provider.toUpperCase()} API rate limit exceeded. ${details ? `Used ${details.used}/${details.limit} tokens.` : ''} Retry after ${retryAfter}s.`,
              provider,
              retryAfter,
              details,
            );
          }

          // Exponential backoff: min(retryAfter, 2^attempt * 5 seconds)
          const backoffDelay = Math.min(
            retryAfter * 1000,
            Math.pow(2, attempt) * ApiRateLimiterService.BASE_BACKOFF_MS,
          );
          this.logger.log(`   Waiting ${(backoffDelay / 1000).toFixed(1)}s before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));

          // MEDIUM-002 FIX: Only store last error, avoid creating new Error objects
          // on each retry to prevent potential memory accumulation
          if (error instanceof Error) {
            lastError = error;
          } else if (!lastError) {
            // Only create Error object once if error is not already an Error
            lastError = new Error('Rate limit retry failed');
          }
          continue;
        }

        // Non-rate-limit error: record failure and throw immediately
        // PHASE 8.5 ENHANCEMENT: Track non-rate-limit failures in circuit breaker
        //
        // DX-4 DESIGN DECISION (Phase 8.5 Strict Audit):
        // Circuit breaker opens for ANY error type, not just rate limits.
        // Rationale:
        // - Network errors, timeouts, 500s indicate provider unavailability
        // - Opening circuit prevents cascading failures and wasted retries
        // - 60-second timeout allows provider to recover
        // - Alternative (rate-limit-only) would miss provider outages
        this.recordFailure(provider);
        throw error;
      }
    }

    // Should never reach here, but TypeScript requires return statement
    throw lastError || new Error('Unexpected error in retry logic');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Parse Groq 429 error to extract retry timing and usage stats
   *
   * PARSING STRATEGY:
   * 1. Extract retry time from: "Please try again in 6m54.72s"
   * 2. Extract usage stats from: "Limit 100000, Used 99996, Requested 484"
   * 3. Default to 5 minutes if parsing fails
   *
   * Phase 10.99: Enterprise-grade error parsing with strict typing
   *
   * @param error - Error object from API call
   * @returns Retry timing and usage details
   * @private
   */
  private parseGroqRateLimitError(error: unknown): {
    retryAfter: number;
    details?: { limit: number; used: number; requested: number };
  } {
    // Default: retry after 5 minutes
    let retryAfter = ApiRateLimiterService.DEFAULT_RETRY_DELAY_SECONDS;
    let details: { limit: number; used: number; requested: number } | undefined;

    // Type-safe error message extraction
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);

    // HIGH-001 FIX: Truncate error message to prevent ReDoS attacks
    const safeErrorMessage = errorMessage.slice(0, ApiRateLimiterService.MAX_ERROR_MESSAGE_LENGTH);

    // Parse retry time: "Please try again in 6m54.72s"
    // HIGH-001 FIX: Add length bounds to regex to prevent catastrophic backtracking
    const retryMatch = safeErrorMessage.match(/try again in (\d{1,3})m([\d.]{1,10})s/);
    if (retryMatch) {
      // Netflix-Grade: Safe array access for regex matches
      const minutesStr = safeGet(retryMatch, 1, '0');
      const secondsStr = safeGet(retryMatch, 2, '0');
      const minutes = parseInt(minutesStr, 10);
      const seconds = parseFloat(secondsStr);
      // LOW-002 FIX: Validate parsed values are reasonable (max 1 hour)
      retryAfter = Math.min(
        Math.ceil(minutes * 60 + seconds),
        ApiRateLimiterService.MAX_RETRY_SECONDS
      );
    }

    // Parse usage stats: "Limit 100000, Used 99996, Requested 484"
    // HIGH-001 FIX: Add length bounds to regex
    const statsMatch = safeErrorMessage.match(/Limit (\d{1,10}), Used (\d{1,10}), Requested (\d{1,10})/);
    if (statsMatch) {
      // Netflix-Grade: Safe array access for regex matches
      const limitStr = safeGet(statsMatch, 1, '0');
      const usedStr = safeGet(statsMatch, 2, '0');
      const requestedStr = safeGet(statsMatch, 3, '0');
      details = {
        limit: parseInt(limitStr, 10),
        used: parseInt(usedStr, 10),
        requested: parseInt(requestedStr, 10),
      };
    }

    return { retryAfter, details };
  }

  // ============================================================================
  // PHASE 8.5 ENHANCEMENT: CIRCUIT BREAKER METHODS
  // ============================================================================

  /**
   * Get or initialize circuit breaker for provider
   * TYPE-1 FIX (Phase 8.5 Strict Audit): Removed non-null assertion
   * @private
   */
  private getCircuitBreaker(provider: string): CircuitBreaker {
    let circuit = this.circuitBreakers.get(provider);

    if (!circuit) {
      circuit = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        halfOpenRequestInFlight: false, // BUG-2 FIX: Initialize race condition prevention
      };
      this.circuitBreakers.set(provider, circuit);
    }

    return circuit; // TYPE-1 FIX: No non-null assertion needed
  }

  /**
   * Check if circuit breaker allows request
   *
   * DX-1 NOTE (Phase 8.5 Strict Audit):
   * - Method name suggests query but has side effects (state mutations)
   * - This is intentional for circuit breaker pattern
   * - Side effects: May transition OPEN → HALF_OPEN, sets halfOpenRequestInFlight
   *
   * BUG-2 FIX: Added race condition prevention for HALF_OPEN state
   * @private
   */
  private isCircuitOpen(provider: string): boolean {
    const circuit = this.getCircuitBreaker(provider);
    const now = Date.now();

    // State: CLOSED - Allow all requests
    if (circuit.state === CircuitState.CLOSED) {
      return false;
    }

    // State: OPEN - Check if timeout elapsed
    if (circuit.state === CircuitState.OPEN) {
      if (circuit.nextAttemptTime && now >= circuit.nextAttemptTime) {
        // Transition to HALF_OPEN: allow single test request
        circuit.state = CircuitState.HALF_OPEN;
        circuit.halfOpenRequestInFlight = true; // BUG-2 FIX: Mark test request in-flight
        circuit.nextAttemptTime = now + ApiRateLimiterService.CIRCUIT_HALF_OPEN_TIMEOUT_MS;
        this.logger.log(
          `🔄 Circuit breaker HALF_OPEN for ${provider.toUpperCase()} - Testing recovery`
        );
        return false;
      }
      // Still in OPEN state - block request
      return true;
    }

    // State: HALF_OPEN - Check if test request already in-flight
    if (circuit.state === CircuitState.HALF_OPEN) {
      // BUG-2 FIX: Block concurrent requests while test request in-flight
      if (circuit.halfOpenRequestInFlight) {
        this.logger.debug(
          `Circuit breaker HALF_OPEN for ${provider.toUpperCase()} - Test request in-flight, blocking concurrent request`
        );
        return true; // Block: test request already running
      }
      // Allow first request and mark as in-flight
      circuit.halfOpenRequestInFlight = true;
      return false;
    }

    return false;
  }

  /**
   * Record successful API call
   *
   * DX-2 NOTE (Phase 8.5 Strict Audit):
   * - If called in OPEN state: does nothing (circuit remains OPEN)
   * - This is intentional - successes in OPEN state are ignored
   *
   * BUG-2 FIX: Resets halfOpenRequestInFlight flag
   * @private
   */
  private recordSuccess(provider: string): void {
    const circuit = this.getCircuitBreaker(provider);

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.halfOpenRequestInFlight = false; // BUG-2 FIX: Reset in-flight flag
      circuit.successCount++;
      this.logger.debug(
        `Circuit breaker success count: ${circuit.successCount}/${ApiRateLimiterService.CIRCUIT_SUCCESS_THRESHOLD} for ${provider.toUpperCase()}`
      );

      // Transition to CLOSED after enough successes
      if (circuit.successCount >= ApiRateLimiterService.CIRCUIT_SUCCESS_THRESHOLD) {
        circuit.state = CircuitState.CLOSED;
        circuit.failureCount = 0;
        circuit.successCount = 0;
        circuit.lastFailureTime = null;
        circuit.nextAttemptTime = null;
        this.logger.log(
          `✅ Circuit breaker CLOSED for ${provider.toUpperCase()} - Service recovered`
        );

        // PHASE 8.6: Update metrics
        if (this.metricsService) {
          this.metricsService.updateCircuitBreakerMetrics(provider, 'CLOSED', 0);
        }
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success
      circuit.failureCount = 0;
    }
    // DX-2: OPEN state is explicitly not handled (success ignored in OPEN state)
  }

  /**
   * Record failed API call
   *
   * DX-3 FIX (Phase 8.5 Strict Audit): Cap failureCount to prevent unbounded growth
   * BUG-2 FIX: Reset halfOpenRequestInFlight flag
   * @private
   */
  private recordFailure(provider: string): void {
    const circuit = this.getCircuitBreaker(provider);
    const now = Date.now();

    // DX-3 FIX: Cap failureCount at threshold + 10 to prevent unbounded growth
    if (circuit.failureCount < ApiRateLimiterService.CIRCUIT_FAILURE_THRESHOLD + 10) {
      circuit.failureCount++;
    }
    circuit.lastFailureTime = now;

    this.logger.debug(
      `Circuit breaker failure count: ${circuit.failureCount}/${ApiRateLimiterService.CIRCUIT_FAILURE_THRESHOLD} for ${provider.toUpperCase()}`
    );

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Single failure in HALF_OPEN reopens circuit
      circuit.state = CircuitState.OPEN;
      circuit.halfOpenRequestInFlight = false; // BUG-2 FIX: Reset in-flight flag
      circuit.nextAttemptTime = now + ApiRateLimiterService.CIRCUIT_TIMEOUT_MS;
      circuit.successCount = 0;
      this.logger.warn(
        `🔴 Circuit breaker OPEN for ${provider.toUpperCase()} - Recovery failed, retry in ${ApiRateLimiterService.CIRCUIT_TIMEOUT_MS / 1000}s`
      );

      // PHASE 8.6: Update metrics
      if (this.metricsService) {
        this.metricsService.updateCircuitBreakerMetrics(provider, 'OPEN', circuit.failureCount);
      }
    } else if (
      circuit.state === CircuitState.CLOSED &&
      circuit.failureCount >= ApiRateLimiterService.CIRCUIT_FAILURE_THRESHOLD
    ) {
      // Transition to OPEN after threshold
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptTime = now + ApiRateLimiterService.CIRCUIT_TIMEOUT_MS;
      this.logger.error(
        `🔴 Circuit breaker OPEN for ${provider.toUpperCase()} - Too many failures (${circuit.failureCount}), retry in ${ApiRateLimiterService.CIRCUIT_TIMEOUT_MS / 1000}s`
      );

      // PHASE 8.6: Update metrics
      if (this.metricsService) {
        this.metricsService.updateCircuitBreakerMetrics(provider, 'OPEN', circuit.failureCount);
      }
    }
    // Note: In OPEN state, failureCount continues to increment (capped) until timeout
  }

  /**
   * Get circuit breaker status for monitoring
   *
   * TYPE-2 FIX (Phase 8.5 Strict Audit): Use string literal union instead of generic string
   * @public
   */
  public getCircuitStatus(provider: string): {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; // TYPE-2 FIX: Explicit string literals
    failureCount: number;
    successCount: number;
    nextAttemptTime: number | null;
  } {
    const circuit = this.getCircuitBreaker(provider);
    return {
      state: circuit.state, // CircuitState enum values ('CLOSED', 'OPEN', 'HALF_OPEN')
      failureCount: circuit.failureCount,
      successCount: circuit.successCount,
      nextAttemptTime: circuit.nextAttemptTime,
    };
  }
}
