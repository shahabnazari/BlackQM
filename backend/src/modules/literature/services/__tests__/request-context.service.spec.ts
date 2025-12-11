/**
 * Request Context Service Tests
 * Phase 10.112 Week 2: Netflix-Grade Request Cancellation
 */

import {
  RequestContextService,
  RequestCancelledException,
  withAbortSignal,
} from '../request-context.service';

describe('RequestContextService - Phase 10.112 Week 2', () => {
  let service: RequestContextService;

  beforeEach(() => {
    service = new RequestContextService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Initialization', () => {
    it('should create with default values', () => {
      const context = service.context;

      expect(context.requestId).toMatch(/^req_/);
      expect(context.cancelled).toBe(false);
      expect(context.cancellationReason).toBeNull();
      expect(context.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should initialize with custom options', () => {
      service.initialize({
        requestId: 'custom-req-id',
        timeoutMs: 5000,
      });

      const context = service.context;
      expect(context.requestId).toBe('custom-req-id');
      expect(context.timeout).toBe(5000);
    });
  });

  describe('AbortSignal', () => {
    it('should provide abort signal', () => {
      expect(service.signal).toBeInstanceOf(AbortSignal);
      expect(service.signal.aborted).toBe(false);
    });

    it('should abort signal on cancel', () => {
      service.cancel('manual');

      expect(service.signal.aborted).toBe(true);
    });
  });

  describe('Cancellation', () => {
    it('should cancel with reason', () => {
      service.cancel('client_disconnect');

      expect(service.isCancelled).toBe(true);
      expect(service.context.cancellationReason).toBe('client_disconnect');
      expect(service.context.cancellationTime).not.toBeNull();
    });

    it('should not cancel twice', () => {
      service.cancel('timeout');
      const firstCancelTime = service.context.cancellationTime;

      service.cancel('manual');

      expect(service.context.cancellationReason).toBe('timeout');
      expect(service.context.cancellationTime).toBe(firstCancelTime);
    });

    it('should call onCancel callback', () => {
      const onCancel = jest.fn();
      service.initialize({ onCancel });

      service.cancel('timeout');

      expect(onCancel).toHaveBeenCalledWith('timeout');
    });

    it('should handle client disconnect', () => {
      service.onClientDisconnect();

      expect(service.isCancelled).toBe(true);
      expect(service.context.cancellationReason).toBe('client_disconnect');
    });
  });

  describe('Timing', () => {
    it('should track elapsed time', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(service.elapsedMs).toBeGreaterThanOrEqual(50);
    });

    it('should calculate remaining time', () => {
      service.initialize({ timeoutMs: 10000 });

      const remaining = service.remainingMs;
      expect(remaining).toBeLessThanOrEqual(10000);
      expect(remaining).toBeGreaterThan(0);
    });

    it('should return 0 remaining when timeout exceeded', async () => {
      service.initialize({ timeoutMs: 10 });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(service.remainingMs).toBe(0);
    });
  });

  describe('throwIfCancelled', () => {
    it('should not throw when not cancelled', () => {
      expect(() => service.throwIfCancelled()).not.toThrow();
    });

    it('should throw RequestCancelledException when cancelled', () => {
      service.cancel('manual');

      expect(() => service.throwIfCancelled()).toThrow(RequestCancelledException);
    });

    it('should include request ID and reason in exception', () => {
      service.initialize({ requestId: 'test-req' });
      service.cancel('timeout');

      try {
        service.throwIfCancelled();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestCancelledException);
        const cancelError = error as RequestCancelledException;
        expect(cancelError.requestId).toBe('test-req');
        expect(cancelError.reason).toBe('timeout');
      }
    });
  });

  describe('executeWithCancellation', () => {
    it('should execute operation successfully', async () => {
      const result = await service.executeWithCancellation(
        async () => 'success',
        'test-op',
      );

      expect(result).toBe('success');
    });

    it('should throw when already cancelled', async () => {
      service.cancel('manual');

      await expect(
        service.executeWithCancellation(async () => 'should not run', 'test-op')
      ).rejects.toThrow(RequestCancelledException);
    });

    it('should pass signal to operation', async () => {
      let receivedSignal: AbortSignal | null = null;

      await service.executeWithCancellation(
        async (signal) => {
          receivedSignal = signal;
          return 'done';
        },
        'test-op',
      );

      expect(receivedSignal).toBe(service.signal);
    });
  });

  describe('Child Context', () => {
    it('should create child context with independent timeout', () => {
      const child = service.createChildContext(5000);

      expect(child.signal).toBeInstanceOf(AbortSignal);
      expect(child.signal.aborted).toBe(false);
    });

    it('should allow manual child cancellation', () => {
      const child = service.createChildContext(5000);

      child.cancel('test-reason');

      expect(child.signal.aborted).toBe(true);
    });

    it('should cancel child when parent cancelled', () => {
      const child = service.createChildContext(5000);

      service.cancel('manual');

      expect(child.signal.aborted).toBe(true);
    });

    it('should cleanup child resources', () => {
      const child = service.createChildContext(5000);

      expect(() => child.cleanup()).not.toThrow();
    });
  });

  describe('Timeout Auto-Cancellation', () => {
    it('should auto-cancel on timeout', async () => {
      service.initialize({ timeoutMs: 50 });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(service.isCancelled).toBe(true);
      expect(service.context.cancellationReason).toBe('timeout');
    });
  });

  describe('Destroy', () => {
    it('should cleanup on destroy', () => {
      service.destroy();

      expect(service.isCancelled).toBe(true);
    });
  });
});

describe('withAbortSignal Utility', () => {
  it('should execute operation with signal', async () => {
    const controller = new AbortController();

    const result = await withAbortSignal(
      controller.signal,
      async () => 'success',
    );

    expect(result).toBe('success');
  });

  it('should reject when signal already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      withAbortSignal(controller.signal, async () => 'should not run')
    ).rejects.toThrow('Request cancelled');
  });

  it('should reject when signal aborted during operation', async () => {
    const controller = new AbortController();

    const promise = withAbortSignal(
      controller.signal,
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'should not complete';
      },
    );

    setTimeout(() => controller.abort(), 10);

    await expect(promise).rejects.toThrow('Request cancelled');
  });
});

describe('RequestCancelledException', () => {
  it('should have correct properties', () => {
    const error = new RequestCancelledException('req-123', 'timeout');

    expect(error.name).toBe('RequestCancelledException');
    expect(error.requestId).toBe('req-123');
    expect(error.reason).toBe('timeout');
    expect(error.message).toContain('req-123');
    expect(error.message).toContain('timeout');
  });
});
