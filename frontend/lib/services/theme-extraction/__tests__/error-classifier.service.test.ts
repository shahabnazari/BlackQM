/**
 * ErrorClassifierService Unit Tests - Phase 10.93 Day 4
 *
 * Tests error classification and user-friendly message generation.
 *
 * @module theme-extraction/__tests__/error-classifier.service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorClassifierService, ErrorCategory } from '../error-classifier.service';

describe('ErrorClassifierService', () => {
  let classifier: ErrorClassifierService;

  beforeEach(() => {
    classifier = new ErrorClassifierService();
  });

  describe('classify', () => {
    it('should classify cancellation errors', () => {
      // Arrange
      const errors = [
        new Error('User cancelled operation'),
        new Error('Request aborted'),
        new Error('Operation cancelled by user'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.CANCELLATION);
        expect(result.isRetryable).toBe(false);
        expect(result.userMessage).toBe('Operation cancelled');
        expect(result.suggestedAction).toBe('No action required');
        expect(result.retryDelayMs).toBeUndefined();
      });
    });

    it('should classify authentication errors', () => {
      // Arrange
      const errors = [
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
        new Error('Invalid credentials'),
        new Error('Authentication failed'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(result.isRetryable).toBe(false);
        expect(result.userMessage).toContain('Authentication');
        expect(result.suggestedAction).toContain('sign in');
      });
    });

    it('should classify rate limit errors', () => {
      // Arrange
      const errors = [
        new Error('429 Too Many Requests'),
        new Error('Rate limit exceeded'),
        new Error('Too many requests'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(result.isRetryable).toBe(true);
        expect(result.userMessage).toContain('busy');
        expect(result.retryDelayMs).toBeGreaterThan(0);
      });
    });

    it('should classify timeout errors', () => {
      // Arrange
      const errors = [
        new Error('Request timeout'),
        new Error('ETIMEDOUT'),
        new Error('Operation timed out'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.TIMEOUT);
        expect(result.isRetryable).toBe(true);
        expect(result.userMessage).toContain('timeout');
        expect(result.retryDelayMs).toBeGreaterThan(0);
      });
    });

    it('should classify transient network errors', () => {
      // Arrange
      const errors = [
        new Error('Network error'),
        new Error('Connection failed'),
        new Error('fetch failed'),
        new Error('ECONNRESET'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.TRANSIENT);
        expect(result.isRetryable).toBe(true);
        expect(result.userMessage).toContain('Connection');
        expect(result.retryDelayMs).toBeGreaterThan(0);
      });
    });

    it('should classify server errors (5xx)', () => {
      // Arrange
      const errors = [
        new Error('500 Internal Server Error'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.SERVER_ERROR);
        expect(result.isRetryable).toBe(true);
        expect(result.userMessage).toContain('server');
        expect(result.retryDelayMs).toBeGreaterThan(0);
      });
    });

    it('should classify not found errors', () => {
      // Arrange
      const errors = [
        new Error('404 Not Found'),
        new Error('Resource not found'),
        new Error('Paper not found'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.NOT_FOUND);
        expect(result.isRetryable).toBe(false);
        expect(result.userMessage).toContain('not found');
      });
    });

    it('should classify client errors (4xx)', () => {
      // Arrange
      const errors = [
        new Error('400 Bad Request'),
        new Error('422 Unprocessable Entity'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.CLIENT_ERROR);
        expect(result.isRetryable).toBe(false);
        expect(result.userMessage).toContain('Invalid');
      });
    });

    it('should classify validation errors', () => {
      // Arrange
      const errors = [
        new Error('Validation failed'),
        new Error('Invalid parameter'),
        new Error('Invalid input'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.category).toBe(ErrorCategory.VALIDATION);
        expect(result.isRetryable).toBe(false);
        expect(result.userMessage).toContain('Invalid');
      });
    });

    it('should classify unknown errors as UNKNOWN category', () => {
      // Arrange
      const error = new Error('Something unexpected happened');

      // Act
      const result = classifier.classify(error);

      // Assert
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toContain('unexpected');
      expect(result.originalError).toBe('Something unexpected happened');
    });

    it('should preserve original error message', () => {
      // Arrange
      const error = new Error('Network connection lost - ERR_NETWORK_TIMEOUT');

      // Act
      const result = classifier.classify(error);

      // Assert
      expect(result.originalError).toBe('Network connection lost - ERR_NETWORK_TIMEOUT');
    });

    it('should provide suggested actions for all error types', () => {
      // Arrange
      const errors = [
        new Error('Network error'),
        new Error('401 Unauthorized'),
        new Error('429 Too Many Requests'),
        new Error('500 Internal Server Error'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const result = classifier.classify(error);
        expect(result.suggestedAction).toBeTruthy();
        expect(result.suggestedAction.length).toBeGreaterThan(0);
      });
    });

    it('should only include retryDelayMs for retryable errors (exactOptionalPropertyTypes compliance)', () => {
      // Arrange
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('401 Unauthorized');

      // Act
      const retryableResult = classifier.classify(retryableError);
      const nonRetryableResult = classifier.classify(nonRetryableError);

      // Assert
      expect(retryableResult.isRetryable).toBe(true);
      expect(retryableResult.retryDelayMs).toBeDefined();
      expect(retryableResult.retryDelayMs).toBeGreaterThan(0);

      expect(nonRetryableResult.isRetryable).toBe(false);
      expect(nonRetryableResult.retryDelayMs).toBeUndefined();
    });
  });

  describe('error priority', () => {
    it('should prioritize cancellation over other patterns', () => {
      // Arrange - Error message that could match multiple patterns
      const error = new Error('User cancelled network request');

      // Act
      const result = classifier.classify(error);

      // Assert - Should match CANCELLATION (first in pattern list) not TRANSIENT
      expect(result.category).toBe(ErrorCategory.CANCELLATION);
    });

    it('should prioritize authentication over client errors', () => {
      // Arrange
      const error = new Error('401 Bad Request'); // Could match both

      // Act
      const result = classifier.classify(error);

      // Assert - Should match AUTHENTICATION (comes before CLIENT_ERROR)
      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
    });
  });

  describe('user message quality', () => {
    it('should provide friendly messages without technical jargon', () => {
      // Arrange
      const error = new Error('ECONNREFUSED');

      // Act
      const result = classifier.classify(error);

      // Assert
      expect(result.userMessage).not.toContain('ECONNREFUSED');
      expect(result.userMessage).toContain('Connection');
    });

    it('should provide actionable suggested actions', () => {
      // Arrange
      const networkError = new Error('Network timeout');

      // Act
      const result = classifier.classify(networkError);

      // Assert
      expect(result.suggestedAction).toContain('internet');
    });
  });
});
