/**
 * Phase 10.170 Week 4: Purpose-Aware Circuit Breaker Service Tests
 *
 * Tests for Netflix-grade 3-state circuit breaker service.
 *
 * @module purpose-aware-circuit-breaker.service.spec
 * @since Phase 10.170 Week 4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PurposeAwareCircuitBreakerService } from '../purpose-aware-circuit-breaker.service';

describe('PurposeAwareCircuitBreakerService', () => {
  let service: PurposeAwareCircuitBreakerService;

  beforeEach(() => {
    service = new PurposeAwareCircuitBreakerService();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with all circuits closed', () => {
      const status = service.getCircuitStatus();

      expect(status.circuits.unpaywall.state).toBe('closed');
      expect(status.circuits.publisher.state).toBe('closed');
      expect(status.circuits.aiVerification.state).toBe('closed');
    });

    it('should report healthy status on init', () => {
      const status = service.getCircuitStatus();

      expect(status.healthy).toBe(true);
      expect(status.degradationLevel).toBe('normal');
    });

    it('should have zero failures and successes on init', () => {
      const stats = service.getCircuitStats('unpaywall');

      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
    });
  });

  // ==========================================================================
  // UNPAYWALL CIRCUIT TESTS
  // ==========================================================================

  describe('unpaywall circuit', () => {
    it('should execute operation when circuit is closed', async () => {
      const result = await service.withUnpaywall(
        async () => 'success',
        async () => 'fallback',
      );

      expect(result).toBe('success');
    });

    it('should record success after successful operation', async () => {
      await service.withUnpaywall(
        async () => 'success',
        async () => 'fallback',
      );

      const stats = service.getCircuitStats('unpaywall');
      expect(stats.totalSuccesses).toBe(1);
    });

    it('should execute fallback after operation failure', async () => {
      const result = await service.withUnpaywall(
        async () => {
          throw new Error('API Error');
        },
        async () => 'fallback',
      );

      expect(result).toBe('fallback');
    });

    it('should record failure after operation failure', async () => {
      await service.withUnpaywall(
        async () => {
          throw new Error('API Error');
        },
        async () => 'fallback',
      );

      const stats = service.getCircuitStats('unpaywall');
      expect(stats.failures).toBe(1);
    });

    it('should open circuit after 5 failures', async () => {
      // Trigger 5 failures (unpaywall threshold)
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(
          async () => {
            throw new Error('API Error');
          },
          async () => 'fallback',
        );
      }

      expect(service.isCircuitOpen('unpaywall')).toBe(true);
      expect(service.getCircuitStats('unpaywall').state).toBe('open');
    });

    it('should use fallback when circuit is open', async () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(
          async () => {
            throw new Error('API Error');
          },
          async () => 'fallback',
        );
      }

      // Next call should use fallback without attempting operation
      let operationCalled = false;
      const result = await service.withUnpaywall(
        async () => {
          operationCalled = true;
          return 'success';
        },
        async () => 'fallback',
      );

      expect(result).toBe('fallback');
      expect(operationCalled).toBe(false);
    });
  });

  // ==========================================================================
  // PUBLISHER CIRCUIT TESTS
  // ==========================================================================

  describe('publisher circuit', () => {
    it('should execute operation when circuit is closed', async () => {
      const result = await service.withPublisherScraping(
        async () => 'scraped',
        async () => 'cached',
      );

      expect(result).toBe('scraped');
    });

    it('should open circuit after 3 failures', async () => {
      // Trigger 3 failures (publisher threshold)
      for (let i = 0; i < 3; i++) {
        await service.withPublisherScraping(
          async () => {
            throw new Error('Scrape Error');
          },
          async () => 'cached',
        );
      }

      expect(service.isCircuitOpen('publisher')).toBe(true);
    });

    it('should track stats independently from other circuits', async () => {
      await service.withPublisherScraping(
        async () => 'success',
        async () => 'fallback',
      );

      const publisherStats = service.getCircuitStats('publisher');
      const unpaywallStats = service.getCircuitStats('unpaywall');

      expect(publisherStats.totalSuccesses).toBe(1);
      expect(unpaywallStats.totalSuccesses).toBe(0);
    });
  });

  // ==========================================================================
  // AI VERIFICATION CIRCUIT TESTS
  // ==========================================================================

  describe('aiVerification circuit', () => {
    it('should execute operation when circuit is closed', async () => {
      const result = await service.withAIVerification(
        async () => 'ai-verified',
        async () => 'heuristic',
      );

      expect(result).toBe('ai-verified');
    });

    it('should open circuit after 3 failures', async () => {
      // Trigger 3 failures (aiVerification threshold)
      for (let i = 0; i < 3; i++) {
        await service.withAIVerification(
          async () => {
            throw new Error('AI Error');
          },
          async () => 'heuristic',
        );
      }

      expect(service.isCircuitOpen('aiVerification')).toBe(true);
    });

    it('should fall back to heuristic when open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.withAIVerification(
          async () => {
            throw new Error('AI Error');
          },
          async () => 'heuristic',
        );
      }

      const result = await service.withAIVerification(
        async () => 'ai-verified',
        async () => 'heuristic',
      );

      expect(result).toBe('heuristic');
    });
  });

  // ==========================================================================
  // CIRCUIT STATE TRANSITIONS
  // ==========================================================================

  describe('state transitions', () => {
    it('should reset failure count after success in closed state', async () => {
      // Generate some failures (but not enough to open)
      for (let i = 0; i < 2; i++) {
        await service.withUnpaywall(
          async () => {
            throw new Error('Error');
          },
          async () => 'fallback',
        );
      }

      // One success should reset
      await service.withUnpaywall(
        async () => 'success',
        async () => 'fallback',
      );

      const stats = service.getCircuitStats('unpaywall');
      expect(stats.failures).toBe(0);
      expect(stats.totalFailures).toBe(2); // Total still tracked
    });

    it('should track total counts across resets', async () => {
      // Multiple cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        await service.withUnpaywall(
          async () => {
            throw new Error('Error');
          },
          async () => 'fallback',
        );
        await service.withUnpaywall(
          async () => 'success',
          async () => 'fallback',
        );
      }

      const stats = service.getCircuitStats('unpaywall');
      expect(stats.totalFailures).toBe(3);
      expect(stats.totalSuccesses).toBe(3);
    });
  });

  // ==========================================================================
  // CIRCUIT RESET TESTS
  // ==========================================================================

  describe('circuit reset', () => {
    it('should reset a specific circuit', async () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(
          async () => {
            throw new Error('Error');
          },
          async () => 'fallback',
        );
      }

      expect(service.isCircuitOpen('unpaywall')).toBe(true);

      // Reset it
      service.resetCircuit('unpaywall');

      expect(service.isCircuitOpen('unpaywall')).toBe(false);
      expect(service.getCircuitStats('unpaywall').state).toBe('closed');
    });

    it('should reset all circuits', async () => {
      // Open multiple circuits
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(async () => { throw new Error('E'); }, async () => 'f');
      }
      for (let i = 0; i < 3; i++) {
        await service.withPublisherScraping(async () => { throw new Error('E'); }, async () => 'f');
      }

      expect(service.isCircuitOpen('unpaywall')).toBe(true);
      expect(service.isCircuitOpen('publisher')).toBe(true);

      // Reset all
      service.resetAllCircuits();

      expect(service.isCircuitOpen('unpaywall')).toBe(false);
      expect(service.isCircuitOpen('publisher')).toBe(false);
    });
  });

  // ==========================================================================
  // STATUS AND SUMMARY TESTS
  // ==========================================================================

  describe('status and summary', () => {
    it('should report degraded when one circuit is open', async () => {
      // Open one circuit
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(async () => { throw new Error('E'); }, async () => 'f');
      }

      const status = service.getCircuitStatus();
      expect(status.healthy).toBe(false);
      expect(status.degradationLevel).toBe('degraded');
    });

    it('should report critical when two circuits are open', async () => {
      // Open two circuits
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(async () => { throw new Error('E'); }, async () => 'f');
      }
      for (let i = 0; i < 3; i++) {
        await service.withPublisherScraping(async () => { throw new Error('E'); }, async () => 'f');
      }

      const status = service.getCircuitStatus();
      expect(status.healthy).toBe(false);
      expect(status.degradationLevel).toBe('critical');
    });

    it('should generate summary string', () => {
      const summary = service.getSummary();

      expect(summary).toContain('[CircuitBreaker]');
      expect(summary).toContain('unpaywall:closed');
      expect(summary).toContain('publisher:closed');
      expect(summary).toContain('aiVerification:closed');
      expect(summary).toContain('level=normal');
    });

    it('should update summary after state changes', async () => {
      // Open a circuit
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(async () => { throw new Error('E'); }, async () => 'f');
      }

      const summary = service.getSummary();
      expect(summary).toContain('unpaywall:open');
      expect(summary).toContain('level=degraded');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle async fallback functions', async () => {
      const result = await service.withUnpaywall(
        async () => {
          throw new Error('Error');
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'async-fallback';
        },
      );

      expect(result).toBe('async-fallback');
    });

    it('should propagate errors from both operation and fallback', async () => {
      // Open circuit first
      for (let i = 0; i < 5; i++) {
        await service.withUnpaywall(async () => { throw new Error('E'); }, async () => 'f');
      }

      // When circuit is open, fallback is used - test that fallback errors propagate
      await expect(
        service.withUnpaywall(
          async () => 'success',
          async () => {
            throw new Error('Fallback Error');
          },
        ),
      ).rejects.toThrow('Fallback Error');
    });

    it('should handle rapid sequential calls', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          service.withUnpaywall(
            async () => `result-${i}`,
            async () => 'fallback',
          ),
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every((r) => r.startsWith('result-'))).toBe(true);
    });

    it('should maintain separate state per circuit type', async () => {
      // Exercise all circuits differently
      await service.withUnpaywall(async () => 'u1', async () => 'f');
      await service.withUnpaywall(async () => 'u2', async () => 'f');
      await service.withPublisherScraping(async () => 'p1', async () => 'f');
      await service.withAIVerification(async () => { throw new Error('E'); }, async () => 'f');

      const status = service.getCircuitStatus();
      expect(status.circuits.unpaywall.totalSuccesses).toBe(2);
      expect(status.circuits.publisher.totalSuccesses).toBe(1);
      expect(status.circuits.aiVerification.totalFailures).toBe(1);
    });
  });
});
