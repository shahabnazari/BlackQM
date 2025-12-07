/**
 * RetryService Unit Tests - Phase 10.93 Day 4
 *
 * Tests exponential backoff retry logic with jitter.
 *
 * @module theme-extraction/__tests__/retry.service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryService, isRetryableError } from '../retry.service';

describe('RetryService', () => {
  let retryService: RetryService;

  beforeEach(() => {
    retryService = new RetryService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt without retry', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');
      const onRetry = vi.fn();

      // Act
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry,
      });

      await vi.runAllTimersAsync();
      const result = await promise;

      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('should retry and eventually succeed', async () => {
      // Arrange
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      // Act
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry,
      });

      await vi.runAllTimersAsync();
      const result = await promise;

      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should throw after all retry attempts exhausted', async () => {
      // Arrange
      const error = new Error('Persistent error');
      const mockOperation = vi.fn().mockRejectedValue(error);
      const onRetry = vi.fn();

      // Act & Assert
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        onRetry,
      });

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(mockOperation).toHaveBeenCalledTimes(3); // All attempts used
      expect(onRetry).toHaveBeenCalledTimes(2); // maxAttempts - 1
    });

    it('should respect custom shouldRetry predicate', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      const authError = new Error('Authentication failed');

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(networkError) // Should retry
        .mockRejectedValueOnce(authError); // Should NOT retry

      const onRetry = vi.fn();
      const shouldRetry = vi.fn((error: Error) => error.message.includes('Network'));

      // Act & Assert
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        shouldRetry,
        onRetry,
      });

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Authentication failed');
      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry, then stop
      expect(shouldRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1); // Only retry network error
    });

    it('should invoke onRetry callback with correct parameters', async () => {
      // Arrange
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      // Act
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(2);

      // First failure (attempt 1 failed, will retry as attempt 2)
      expect(onRetry).toHaveBeenNthCalledWith(
        1,
        1, // current attempt number that failed
        error1,
        expect.any(Number) // delayMs
      );

      // Second failure (attempt 2 failed, will retry as attempt 3)
      expect(onRetry).toHaveBeenNthCalledWith(
        2,
        2, // current attempt number that failed
        error2,
        expect.any(Number) // delayMs
      );
    });

    it('should implement exponential backoff with jitter', async () => {
      // Arrange
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = vi.fn((attempt: number, error: Error, delayMs: number) => {
        delays.push(delayMs);
      });

      // Act
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // Assert
      expect(delays).toHaveLength(2);

      // First retry: delay ~1000ms + jitter
      expect(delays[0]).toBeGreaterThanOrEqual(1000);
      expect(delays[0]).toBeLessThanOrEqual(1200); // 1000 + 20% jitter

      // Second retry: delay ~2000ms + jitter (exponential)
      expect(delays[1]).toBeGreaterThanOrEqual(2000);
      expect(delays[1]).toBeLessThanOrEqual(2400); // 2000 + 20% jitter
    });

    it('should enforce maxDelay cap', async () => {
      // Arrange
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = vi.fn((attempt: number, error: Error, delayMs: number) => {
        delays.push(delayMs);
      });

      // Act
      const promise = retryService.executeWithRetry(mockOperation, {
        maxAttempts: 4,
        baseDelayMs: 1000,
        maxDelayMs: 2500, // Cap at 2.5s
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // Assert
      expect(delays).toHaveLength(3);

      // First retry: ~1000ms
      expect(delays[0]).toBeLessThanOrEqual(1200);

      // Second retry: ~2000ms
      expect(delays[1]).toBeLessThanOrEqual(2400);

      // Third retry: CAPPED at maxDelay (would be ~4000ms without cap)
      expect(delays[2]).toBeLessThanOrEqual(2500);
    });

    it('should validate configuration (BUG-001 fix)', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act & Assert - Invalid maxAttempts
      await expect(
        retryService.executeWithRetry(mockOperation, {
          maxAttempts: 0,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
        })
      ).rejects.toThrow('Invalid retry configuration: maxAttempts must be positive');

      await expect(
        retryService.executeWithRetry(mockOperation, {
          maxAttempts: -1,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
        })
      ).rejects.toThrow('Invalid retry configuration: maxAttempts must be positive');

      // Invalid baseDelayMs
      await expect(
        retryService.executeWithRetry(mockOperation, {
          maxAttempts: 3,
          baseDelayMs: 0,
          maxDelayMs: 10000,
        })
      ).rejects.toThrow('Invalid retry configuration: baseDelayMs must be positive');

      // Invalid maxDelayMs < baseDelayMs
      await expect(
        retryService.executeWithRetry(mockOperation, {
          maxAttempts: 3,
          baseDelayMs: 10000,
          maxDelayMs: 5000,
        })
      ).rejects.toThrow(
        'Invalid retry configuration: maxDelayMs (5000) must be >= baseDelayMs (10000)'
      );
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('Network timeout'))).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
      expect(isRetryableError(new Error('Connection reset'))).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      expect(isRetryableError(new Error('500 Internal Server Error'))).toBe(true);
      expect(isRetryableError(new Error('502 Bad Gateway'))).toBe(true);
      expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('should identify 429 rate limit as retryable', () => {
      expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true);
      expect(isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      expect(isRetryableError(new Error('Request timeout'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    });

    it('should NOT identify client errors as retryable', () => {
      expect(isRetryableError(new Error('400 Bad Request'))).toBe(false);
      expect(isRetryableError(new Error('401 Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('403 Forbidden'))).toBe(false);
      expect(isRetryableError(new Error('404 Not Found'))).toBe(false);
    });

    it('should identify unknown errors as retryable (conservative approach)', () => {
      // Unknown errors are retried conservatively (better to retry than fail)
      expect(isRetryableError(new Error('Something went wrong'))).toBe(true);
      expect(isRetryableError(new Error('Custom error'))).toBe(true);
    });
  });
});
