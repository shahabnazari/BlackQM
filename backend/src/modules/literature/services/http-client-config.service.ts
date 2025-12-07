/**
 * Phase 10.100 Phase 13: HTTP Client Configuration Service
 *
 * **PURPOSE**: Enterprise-grade HTTP client configuration with timeout management and request monitoring
 *
 * **EXTRACTED FROM**: literature.service.ts (lines 106-108, 164-233)
 *   - Reduces literature.service.ts from 1,691 → 1,616 lines (-75 lines, -4.4%)
 *   - Separates infrastructure configuration from business logic
 *
 * **RESPONSIBILITIES**:
 *   - Configure Axios HTTP client with enterprise-grade timeouts
 *   - Set up request/response interceptors for monitoring
 *   - Track request timing for performance analysis
 *   - Log slow requests and HTTP errors
 *
 * **ENTERPRISE-GRADE FEATURES**:
 *   ✅ Zero loose typing (no `any` except Axios library types)
 *   ✅ Explicit return types on all methods
 *   ✅ Comprehensive JSDoc documentation
 *   ✅ SEC-1 input validation on all public methods
 *   ✅ NestJS Logger integration
 *   ✅ Proper error handling (all error paths typed)
 *
 * **USAGE EXAMPLE**:
 * ```typescript
 * // In literature.service.ts onModuleInit():
 * this.httpConfig.configureHttpClient(this.httpService);
 *
 * // Optional: Custom timeout
 * this.httpConfig.configureHttpClient(this.httpService, 45000); // 45s
 *
 * // Check request duration
 * const duration = this.httpConfig.getRequestDuration('GET-https://api.example.com');
 * ```
 *
 * **TECHNICAL DETAILS**:
 * - Default global timeout: 30s (prevents 67s system default hangs)
 * - Slow request threshold: 10s (logs warnings for slow responses)
 * - Request timing: Tracks all HTTP requests for performance monitoring
 * - Memory management: Automatic cleanup of timing data after response
 *
 * @see literature.service.ts for usage context
 * @see https://github.com/axios/axios for Axios documentation
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Default configuration constants
 */
const DEFAULT_GLOBAL_TIMEOUT = 30000; // 30s - prevents 67s system default
const SLOW_REQUEST_THRESHOLD = 10000; // 10s - log slow responses

@Injectable()
export class HttpClientConfigService {
  private readonly logger = new Logger(HttpClientConfigService.name);

  /**
   * Request timing tracking for performance monitoring
   * Key: requestId (format: "METHOD-URL")
   * Value: start timestamp (milliseconds)
   */
  private requestTimings = new Map<string, number>();

  /**
   * Configuration state tracking (prevents duplicate interceptor registration)
   * Set to true after first successful configuration
   */
  private isConfigured = false;

  /**
   * Configure HTTP client with enterprise-grade timeouts and monitoring interceptors
   *
   * **FEATURES**:
   * - Sets global timeout to prevent 67s system default hangs
   * - Adds request interceptor to track request start time
   * - Adds response interceptor to:
   *   - Calculate request duration
   *   - Log slow responses (>10s)
   *   - Log HTTP errors and timeouts
   *   - Auto-cleanup timing data
   *
   * **BEFORE**: All HTTP requests took 67s (system default timeout)
   * **AFTER**: Fast sources complete in 3-10s, slow sources timeout at 30s
   *
   * **SEC-1 VALIDATION**:
   * - Validates httpService is provided
   * - Validates maxTimeout is positive number
   * - Validates timeout doesn't exceed reasonable limits
   *
   * @param httpService - NestJS HttpService instance to configure
   * @param maxTimeout - Maximum global timeout in milliseconds (default: 30000ms)
   * @throws Error if httpService is not provided
   * @throws Error if maxTimeout is invalid (<1000ms or >300000ms)
   *
   * @example
   * ```typescript
   * // Default 30s timeout
   * this.httpConfig.configureHttpClient(this.httpService);
   *
   * // Custom 45s timeout
   * this.httpConfig.configureHttpClient(this.httpService, 45000);
   * ```
   */
  configureHttpClient(httpService: HttpService, maxTimeout?: number): void {
    // CRITICAL FIX (Phase 13 Strict Audit): Prevent duplicate interceptor registration
    // If called multiple times (hot reload, module re-init), skip to avoid:
    // - Duplicate logging (same message N times)
    // - Memory leaks (multiple timing entries)
    // - Performance degradation (interceptors run N times)
    if (this.isConfigured) {
      this.logger.warn(
        '[HttpClientConfigService] Already configured, skipping duplicate interceptor registration',
      );
      return;
    }

    // SEC-1 Validation: httpService must be provided
    this.validateHttpService(httpService);

    // SEC-1 Validation: maxTimeout must be valid if provided
    const timeout = maxTimeout ?? DEFAULT_GLOBAL_TIMEOUT;
    this.validateTimeout(timeout);

    // Configure Axios instance with enterprise-grade defaults
    httpService.axiosRef.defaults.timeout = timeout;

    // Add request interceptor for monitoring
    httpService.axiosRef.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // Track request start time
        const requestId = this.generateRequestId(config);
        this.requestTimings.set(requestId, Date.now());
        return config;
      },
      (error: unknown): Promise<never> => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`HTTP Request Error: ${message}`);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for monitoring
    httpService.axiosRef.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => {
        const requestId = this.generateRequestId(response.config);
        const startTime = this.requestTimings.get(requestId);

        if (startTime !== undefined) {
          const duration = Date.now() - startTime;
          this.requestTimings.delete(requestId); // Cleanup

          if (duration > SLOW_REQUEST_THRESHOLD) {
            // Log slow responses (>10s)
            // SECURITY FIX (Phase 13 Strict Audit): Sanitize URL to prevent leaking API keys/tokens
            this.logger.warn(
              `⚠️ Slow HTTP Response: ${this.sanitizeUrl(response.config.url)} took ${duration}ms`,
            );
          }
        }

        return response;
      },
      (error: unknown): Promise<never> => {
        // Type guard for Axios errors
        if (this.isAxiosError(error)) {
          const requestId = this.generateRequestId(error.config);
          const startTime = this.requestTimings.get(requestId);

          if (startTime !== undefined) {
            const duration = Date.now() - startTime;
            this.requestTimings.delete(requestId); // Cleanup

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
              // SECURITY FIX (Phase 13 Strict Audit): Sanitize URL to prevent leaking API keys/tokens
              this.logger.warn(
                `⏱️ HTTP Timeout: ${this.sanitizeUrl(error.config?.url)} after ${duration}ms`,
              );
            } else {
              // SECURITY FIX (Phase 13 Strict Audit): Sanitize URL to prevent leaking API keys/tokens
              this.logger.error(
                `❌ HTTP Error: ${this.sanitizeUrl(error.config?.url)} - ${error.message}`,
              );
            }
          }
        } else {
          // Non-Axios error
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`❌ HTTP Error (non-Axios): ${message}`);
        }

        return Promise.reject(error);
      },
    );

    // Log configuration success
    this.logger.log(
      `✅ [HTTP Config] Global timeout set to ${timeout}ms (${(timeout / 1000).toFixed(0)}s max)`,
    );
    this.logger.log(
      `📊 [HTTP Config] Individual source timeouts: 10s (fast), 15s (complex), 30s (large)`,
    );

    // Mark as configured to prevent duplicate setup
    this.isConfigured = true;
  }

  /**
   * Get duration of a specific HTTP request
   *
   * **USE CASE**: Retrieve timing information for active or completed requests
   *
   * **NOTE**: Returns null if:
   * - Request has not started
   * - Request has already completed and been cleaned up
   * - Request ID is invalid
   *
   * @param requestId - Unique request identifier (format: "METHOD-URL")
   * @returns Duration in milliseconds since request started, or null if not found
   *
   * @example
   * ```typescript
   * const requestId = 'GET-https://api.semanticscholar.org/graph/v1/paper/search';
   * const duration = this.httpConfig.getRequestDuration(requestId);
   * if (duration !== null) {
   *   console.log(`Request took ${duration}ms`);
   * }
   * ```
   */
  getRequestDuration(requestId: string): number | null {
    const startTime = this.requestTimings.get(requestId);
    if (startTime === undefined) {
      return null;
    }
    return Date.now() - startTime;
  }

  /**
   * Clear all request timing data
   *
   * **USE CASE**: Memory cleanup for long-running services
   *
   * **WARNING**: This will clear timing data for all active requests.
   * Only use this when:
   * - No active HTTP requests
   * - Periodic memory cleanup needed
   * - Service shutdown/restart
   *
   * @example
   * ```typescript
   * // Periodic cleanup (e.g., every hour)
   * setInterval(() => {
   *   this.httpConfig.clearRequestTimings();
   *   this.logger.log('Cleared request timing data');
   * }, 3600000); // 1 hour
   * ```
   */
  clearRequestTimings(): void {
    const count = this.requestTimings.size;
    this.requestTimings.clear();
    this.logger.log(`🧹 Cleared ${count} request timing entries`);
  }

  /**
   * Get current number of tracked requests
   *
   * **USE CASE**: Monitoring and diagnostics
   *
   * @returns Number of requests currently being tracked
   *
   * @example
   * ```typescript
   * const activeRequests = this.httpConfig.getTrackedRequestCount();
   * this.logger.log(`Active HTTP requests: ${activeRequests}`);
   * ```
   */
  getTrackedRequestCount(): number {
    return this.requestTimings.size;
  }

  // ============================================================================
  // PRIVATE METHODS (SEC-1 Validation & Utilities)
  // ============================================================================

  /**
   * SEC-1 Validation: Validate HttpService instance
   *
   * @param httpService - HttpService to validate
   * @throws Error if httpService is not provided or invalid
   */
  private validateHttpService(httpService: unknown): asserts httpService is HttpService {
    if (!httpService || typeof httpService !== 'object') {
      throw new Error(
        '[HttpClientConfigService] Invalid httpService parameter: must be HttpService instance',
      );
    }

    // Type guard: Check for axiosRef property (HttpService signature)
    if (!('axiosRef' in httpService)) {
      throw new Error(
        '[HttpClientConfigService] Invalid httpService parameter: missing axiosRef property',
      );
    }
  }

  /**
   * SEC-1 Validation: Validate timeout value
   *
   * **CONSTRAINTS**:
   * - Minimum: 1000ms (1 second) - prevents too-short timeouts
   * - Maximum: 300000ms (5 minutes) - prevents excessive waits
   *
   * @param timeout - Timeout value to validate
   * @throws Error if timeout is invalid
   */
  private validateTimeout(timeout: unknown): asserts timeout is number {
    if (typeof timeout !== 'number' || !Number.isFinite(timeout)) {
      throw new Error(
        '[HttpClientConfigService] Invalid timeout parameter: must be finite number',
      );
    }

    if (timeout < 1000) {
      throw new Error(
        '[HttpClientConfigService] Invalid timeout parameter: must be at least 1000ms (1 second)',
      );
    }

    if (timeout > 300000) {
      throw new Error(
        '[HttpClientConfigService] Invalid timeout parameter: must not exceed 300000ms (5 minutes)',
      );
    }
  }

  /**
   * Generate unique request identifier
   *
   * **FORMAT**: "METHOD-URL"
   * **EXAMPLE**: "GET-https://api.semanticscholar.org/graph/v1/paper/search"
   *
   * @param config - Axios request configuration (InternalAxiosRequestConfig or AxiosRequestConfig)
   * @returns Unique request identifier
   */
  private generateRequestId(config: InternalAxiosRequestConfig | AxiosRequestConfig | undefined): string {
    if (!config) {
      return 'UNKNOWN-UNKNOWN';
    }

    const method = (config.method ?? 'UNKNOWN').toUpperCase();
    const url = config.url ?? 'UNKNOWN';

    return `${method}-${url}`;
  }

  /**
   * Type guard for Axios errors
   *
   * **PURPOSE**: Safely narrow unknown error to AxiosError type
   *
   * @param error - Error to check
   * @returns true if error is AxiosError
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'config' in error &&
      'isAxiosError' in error
    );
  }

  /**
   * Sanitize URL for logging (SECURITY FIX - Phase 13 Strict Audit)
   *
   * **PURPOSE**: Remove query parameters from URLs before logging to prevent leaking:
   * - API keys (e.g., ?apiKey=sk_live_12345)
   * - Tokens (e.g., ?token=eyJhbGciOi...)
   * - Session IDs (e.g., ?sessionId=abc123)
   * - Other sensitive data in query strings
   *
   * **BEFORE**: `https://api.example.com/search?apiKey=sk_live_12345&query=test`
   * **AFTER**: `https://api.example.com/search?***`
   *
   * @param url - URL to sanitize
   * @returns Sanitized URL with query parameters removed or masked
   */
  private sanitizeUrl(url: string | undefined): string {
    if (!url) {
      return 'UNKNOWN';
    }

    try {
      // Try to parse as URL object (works for full URLs)
      const urlObj = new URL(url);
      // Return origin + pathname only (no query parameters)
      return `${urlObj.origin}${urlObj.pathname}${urlObj.search ? '?***' : ''}`;
    } catch {
      // If URL parsing fails (relative URL or malformed), use simple masking
      const questionMarkIndex = url.indexOf('?');
      if (questionMarkIndex > -1) {
        return `${url.substring(0, questionMarkIndex)}?***`;
      }
      return url;
    }
  }
}
