/**
 * CircuitBreakerService Unit Tests - Phase 10.93 Day 4
 *
 * Tests circuit breaker state machine and failure prevention.
 *
 * @module theme-extraction/__tests__/circuit-breaker.service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerOpenError,
} from '../circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 5000, // 5 seconds for faster tests
      successThreshold: 2,
      name: 'TestCircuit',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute operation successfully in CLOSED state', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act
      const result = await circuitBreaker.execute(mockOperation);

      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should remain CLOSED after single failure', async () => {
      // Arrange
      const mockOperation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Act & Assert
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after consecutive failures reach threshold', async () => {
      // Arrange
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      // Act - Fail 3 times (threshold)
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Persistent failure');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Persistent failure');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Persistent failure');

      // Assert - Circuit should now be OPEN
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset failure count on success', async () => {
      // Arrange
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('success') // Reset counter
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockRejectedValueOnce(new Error('Failure 4'))
        .mockRejectedValueOnce(new Error('Failure 5'));

      // Act
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure 1');
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure 2');

      // Success resets counter
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      // Need 3 more failures to open
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure 3');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure 4');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure 5');

      // Assert - Circuit should now be OPEN (3 consecutive failures)
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      // Force circuit to OPEN by causing failures
      const failingOp = vi.fn().mockRejectedValue(new Error('Failure'));
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject requests immediately when OPEN', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act & Assert
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
        CircuitBreakerOpenError
      );

      // Operation should NOT be called
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should throw CircuitBreakerOpenError with reset time', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act & Assert
      try {
        await circuitBreaker.execute(mockOperation);
        expect.fail('Should have thrown CircuitBreakerOpenError');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        expect((error as Error).message).toContain('TestCircuit');
        expect((error as Error).message).toContain('OPEN');
      }
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Assert - Initially OPEN
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Act - Advance time by reset timeout (5000ms)
      await vi.advanceTimersByTimeAsync(5000);

      // Assert - Should transition to HALF_OPEN
      // Need to attempt an operation to trigger state check
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      // Force circuit to OPEN
      const failingOp = vi.fn().mockRejectedValue(new Error('Failure'));
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();

      // Transition to HALF_OPEN
      await vi.advanceTimersByTimeAsync(5000);
    });

    it('should allow requests through in HALF_OPEN state', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act
      const result = await circuitBreaker.execute(mockOperation);

      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should transition back to OPEN on any failure in HALF_OPEN', async () => {
      // Arrange
      const mockOperation = vi.fn().mockRejectedValue(new Error('Still failing'));

      // Act & Assert
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Still failing');

      // Circuit should immediately reopen
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Subsequent requests should fail fast
      const nextOp = vi.fn();
      await expect(circuitBreaker.execute(nextOp)).rejects.toThrow(CircuitBreakerOpenError);
      expect(nextOp).not.toHaveBeenCalled();
    });

    it('should transition to CLOSED after consecutive successes reach threshold', async () => {
      // Arrange
      const mockOperation = vi.fn().mockResolvedValue('success');

      // Act - First success
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Second success should close circuit (successThreshold = 2)
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');

      // Assert - Circuit should now be CLOSED
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset success count if failure occurs before threshold', async () => {
      // Arrange
      const mockOperation = vi
        .fn()
        .mockResolvedValueOnce('success 1')
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      // Act
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success 1');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Failure reopens circuit
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout and try again
      await vi.advanceTimersByTimeAsync(5000);

      // Need 2 consecutive successes again
      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);

      await expect(circuitBreaker.execute(mockOperation)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('getStats', () => {
    it('should return circuit breaker statistics', async () => {
      // Arrange
      const successOp = vi.fn().mockResolvedValue('success');
      const failOp = vi.fn().mockRejectedValue(new Error('Failure'));

      // Act
      await circuitBreaker.execute(successOp);
      await circuitBreaker.execute(successOp);
      await expect(circuitBreaker.execute(failOp)).rejects.toThrow();

      const stats = circuitBreaker.getStats();

      // Assert
      expect(stats).toMatchObject({
        name: 'TestCircuit',
        state: CircuitState.CLOSED,
        failureCount: 1,
        successCount: 0, // Reset on failure in CLOSED state
      });
      expect(stats.nextAttemptTime).toBeInstanceOf(Date);
    });
  });
});
