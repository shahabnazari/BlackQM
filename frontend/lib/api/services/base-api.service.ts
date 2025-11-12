/**
 * Base API Service
 * Enterprise-grade base class for all API services with:
 * - Request cancellation (AbortController)
 * - Automatic retry with exponential backoff
 * - Centralized error handling
 * - Request/response interceptors
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module base-api.service
 */

import { AxiosRequestConfig, AxiosError } from 'axios';
import { apiClient, ApiResponse } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RequestOptions extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  skipRetry?: boolean;
  onRetry?: (attempt: number, error: AxiosError) => void;
}

export interface CancellableRequest<T> {
  promise: Promise<T>;
  cancel: (reason?: string) => void;
}

// ============================================================================
// Base API Service Class
// ============================================================================

export class BaseApiService {
  protected basePath: string;
  private abortControllers: Map<string, AbortController>;
  private retryConfig: RetryConfig;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.abortControllers = new Map();
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };
  }

  // ============================================================================
  // Request Cancellation Support
  // ============================================================================

  /**
   * Create a cancellable request
   * @param requestId - Unique identifier for this request
   * @param executor - Function that executes the request
   */
  protected createCancellableRequest<T>(
    requestId: string,
    executor: (signal: AbortSignal) => Promise<T>
  ): CancellableRequest<T> {
    // Cancel any existing request with this ID
    this.cancel(requestId);

    // Create new AbortController
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    // Execute request with abort signal
    const promise = executor(controller.signal).finally(() => {
      // Clean up controller after request completes
      this.abortControllers.delete(requestId);
    });

    return {
      promise,
      cancel: (reason?: string) => {
        controller.abort(reason);
        this.abortControllers.delete(requestId);
      },
    };
  }

  /**
   * Cancel a specific request by ID
   */
  protected cancel(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort('Request cancelled');
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancel all pending requests
   */
  protected cancelAll(): void {
    this.abortControllers.forEach(controller => {
      controller.abort('All requests cancelled');
    });
    this.abortControllers.clear();
  }

  // ============================================================================
  // HTTP Methods with Retry and Cancellation
  // ============================================================================

  /**
   * GET request with automatic retry and cancellation support
   */
  protected async get<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;
    const {
      skipRetry = false,
      retries,
      retryDelay,
      onRetry,
      ...config
    } = options;

    if (skipRetry) {
      return apiClient.get<T>(url, config);
    }

    return this.withRetry(
      () => apiClient.get<T>(url, config),
      retries,
      retryDelay,
      onRetry
    );
  }

  /**
   * POST request with automatic retry and cancellation support
   */
  protected async post<T>(
    path: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;
    const {
      skipRetry = false,
      retries,
      retryDelay,
      onRetry,
      ...config
    } = options;

    if (skipRetry) {
      return apiClient.post<T>(url, data, config);
    }

    return this.withRetry(
      () => apiClient.post<T>(url, data, config),
      retries,
      retryDelay,
      onRetry
    );
  }

  /**
   * PUT request with automatic retry and cancellation support
   */
  protected async put<T>(
    path: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;
    const {
      skipRetry = false,
      retries,
      retryDelay,
      onRetry,
      ...config
    } = options;

    if (skipRetry) {
      return apiClient.put<T>(url, data, config);
    }

    return this.withRetry(
      () => apiClient.put<T>(url, data, config),
      retries,
      retryDelay,
      onRetry
    );
  }

  /**
   * PATCH request with automatic retry and cancellation support
   */
  protected async patch<T>(
    path: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;
    const {
      skipRetry = false,
      retries,
      retryDelay,
      onRetry,
      ...config
    } = options;

    if (skipRetry) {
      return apiClient.patch<T>(url, data, config);
    }

    return this.withRetry(
      () => apiClient.patch<T>(url, data, config),
      retries,
      retryDelay,
      onRetry
    );
  }

  /**
   * DELETE request with automatic retry and cancellation support
   */
  protected async delete<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;
    const {
      skipRetry = false,
      retries,
      retryDelay,
      onRetry,
      ...config
    } = options;

    if (skipRetry) {
      return apiClient.delete<T>(url, config);
    }

    return this.withRetry(
      () => apiClient.delete<T>(url, config),
      retries,
      retryDelay,
      onRetry
    );
  }

  // ============================================================================
  // Retry Logic with Exponential Backoff
  // ============================================================================

  /**
   * Execute request with automatic retry and exponential backoff
   */
  private async withRetry<T>(
    request: () => Promise<T>,
    maxRetries: number = this.retryConfig.maxRetries,
    initialDelay: number = this.retryConfig.initialDelay,
    onRetry?: (attempt: number, error: AxiosError) => void
  ): Promise<T> {
    let lastError: AxiosError | Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (error: any) {
        lastError = error;

        // Don't retry if request was cancelled
        if (
          error.code === 'ERR_CANCELED' ||
          error.message?.includes('cancel')
        ) {
          throw error;
        }

        // Don't retry on client errors (4xx except 429)
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500 &&
          error.response.status !== 429 // Retry on rate limiting
        ) {
          throw error;
        }

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Error Handling Utilities
  // ============================================================================

  /**
   * Extract error message from API error
   */
  protected getErrorMessage(error: AxiosError | Error): string {
    if (
      'response' in error &&
      error.response?.data &&
      typeof error.response.data === 'object'
    ) {
      const data = error.response.data as { message?: string };
      if (data.message) {
        return data.message;
      }
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  /**
   * Check if error is a network error
   */
  protected isNetworkError(error: AxiosError | Error): boolean {
    const axiosError = error as AxiosError;
    return (
      !axiosError.response ||
      axiosError.code === 'ECONNREFUSED' ||
      axiosError.code === 'ENOTFOUND' ||
      axiosError.code === 'ETIMEDOUT' ||
      axiosError.code === 'ECONNRESET'
    );
  }

  /**
   * Check if error is a timeout error
   */
  protected isTimeoutError(error: AxiosError | Error): boolean {
    const axiosError = error as AxiosError;
    return (
      axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT'
    );
  }

  /**
   * Check if error is a cancellation
   */
  protected isCancellationError(error: AxiosError | Error): boolean {
    const axiosError = error as AxiosError;
    return (
      axiosError.code === 'ERR_CANCELED' || error.message?.includes('cancel')
    );
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Execute multiple requests in parallel
   * Returns empty array if requests array is empty
   */
  protected async batch<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    if (requests.length === 0) {
      return [];
    }
    return Promise.all(requests.map(req => req()));
  }

  /**
   * Execute requests in sequence (one at a time)
   * Returns empty array if requests array is empty
   */
  protected async sequence<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    if (requests.length === 0) {
      return [];
    }
    const results: T[] = [];
    for (const request of requests) {
      results.push(await request());
    }
    return results;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update retry configuration
   */
  protected setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  protected getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}
