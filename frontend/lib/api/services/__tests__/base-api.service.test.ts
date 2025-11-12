/**
 * Base API Service Unit Tests
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module base-api.service.test
 */

import { BaseApiService } from '../base-api.service';
import { apiClient } from '../../client';

// Mock apiClient
jest.mock('../../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Test implementation of BaseApiService
class TestApiService extends BaseApiService {
  constructor() {
    super('/test');
  }

  // Expose protected methods for testing
  public testGet<T>(path: string, options?: any) {
    return this.get<T>(path, options);
  }

  public testPost<T>(path: string, data?: any, options?: any) {
    return this.post<T>(path, data, options);
  }

  public testCreateCancellableRequest<T>(
    requestId: string,
    executor: (signal: AbortSignal) => Promise<T>
  ) {
    return this.createCancellableRequest(requestId, executor);
  }

  public testCancel(requestId: string) {
    return this.cancel(requestId);
  }

  public testCancelAll() {
    return this.cancelAll();
  }

  public testBatch<T>(requests: Array<() => Promise<T>>) {
    return this.batch(requests);
  }

  public testSequence<T>(requests: Array<() => Promise<T>>) {
    return this.sequence(requests);
  }
}

describe('BaseApiService', () => {
  let service: TestApiService;

  beforeEach(() => {
    service = new TestApiService();
    jest.clearAllMocks();
  });

  describe('HTTP Methods', () => {
    it('should make GET requests with correct path', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await service.testGet('/endpoint');

      expect(apiClient.get).toHaveBeenCalledWith('/test/endpoint', undefined);
    });

    it('should make POST requests with data', async () => {
      const mockResponse = { data: { id: 1 } };
      const mockData = { name: 'Test' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await service.testPost('/endpoint', mockData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/test/endpoint',
        mockData,
        undefined
      );
    });

    it('should make PUT requests with data', async () => {
      const mockResponse = { data: { id: 1 } };
      const mockData = { name: 'Updated' };
      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      await service.testPost('/endpoint', mockData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/test/endpoint',
        mockData,
        undefined
      );
    });
  });

  describe('Request Cancellation', () => {
    it('should create cancellable request', async () => {
      const mockData = { result: 'success' };
      const executor = jest.fn().mockResolvedValue(mockData);

      const { promise, cancel } = service.testCreateCancellableRequest(
        'test-request',
        executor
      );

      const result = await promise;

      expect(result).toEqual(mockData);
      expect(executor).toHaveBeenCalled();
    });

    it('should cancel pending request', async () => {
      const executor = jest.fn((signal: AbortSignal) => {
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('Request cancelled'));
          });
          setTimeout(() => resolve({ data: 'done' }), 1000);
        });
      });

      const { promise, cancel } = service.testCreateCancellableRequest(
        'test-request',
        executor
      );

      cancel();

      await expect(promise).rejects.toThrow('Request cancelled');
    });

    it('should cancel specific request by ID', () => {
      const executor = jest.fn().mockResolvedValue({ data: 'done' });

      const request1 = service.testCreateCancellableRequest(
        'request-1',
        executor
      );
      const request2 = service.testCreateCancellableRequest(
        'request-2',
        executor
      );

      service.testCancel('request-1');

      // No error should be thrown
      expect(() => service.testCancel('request-1')).not.toThrow();
    });

    it('should cancel all pending requests', () => {
      const executor = jest.fn().mockResolvedValue({ data: 'done' });

      service.testCreateCancellableRequest('request-1', executor);
      service.testCreateCancellableRequest('request-2', executor);
      service.testCreateCancellableRequest('request-3', executor);

      service.testCancelAll();

      // No error should be thrown
      expect(() => service.testCancelAll()).not.toThrow();
    });
  });

  describe('Batch Operations', () => {
    it('should execute requests in parallel', async () => {
      const requests = [
        () => Promise.resolve({ data: 1 }),
        () => Promise.resolve({ data: 2 }),
        () => Promise.resolve({ data: 3 }),
      ];

      const results = await service.testBatch(requests);

      expect(results).toEqual([{ data: 1 }, { data: 2 }, { data: 3 }]);
    });

    it('should execute requests in sequence', async () => {
      const executionOrder: number[] = [];

      const requests = [
        async () => {
          executionOrder.push(1);
          return { data: 1 };
        },
        async () => {
          executionOrder.push(2);
          return { data: 2 };
        },
        async () => {
          executionOrder.push(3);
          return { data: 3 };
        },
      ];

      const results = await service.testSequence(requests);

      expect(results).toEqual([{ data: 1 }, { data: 2 }, { data: 3 }]);
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should handle batch request failures', async () => {
      const requests = [
        () => Promise.resolve({ data: 1 }),
        () => Promise.reject(new Error('Request failed')),
        () => Promise.resolve({ data: 3 }),
      ];

      await expect(service.testBatch(requests)).rejects.toThrow(
        'Request failed'
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests with skipRetry=false', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Server error' } },
      };

      (apiClient.get as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await service.testGet('/endpoint');

      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: { success: true } });
    });

    it('should not retry when skipRetry=true', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Server error' } },
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        service.testGet('/endpoint', { skipRetry: true })
      ).rejects.toMatchObject(mockError);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      const mockError = {
        response: { status: 404, data: { message: 'Not found' } },
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(service.testGet('/endpoint')).rejects.toMatchObject(
        mockError
      );

      // Should only attempt once (no retries)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockError = {
        code: 'ECONNREFUSED',
        message: 'Network error',
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(service.testGet('/endpoint')).rejects.toMatchObject(
        mockError
      );
    });

    it('should handle timeout errors', async () => {
      const mockError = {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(service.testGet('/endpoint')).rejects.toMatchObject(
        mockError
      );
    });

    it('should handle cancellation errors', async () => {
      const mockError = {
        code: 'ERR_CANCELED',
        message: 'Request cancelled',
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(service.testGet('/endpoint')).rejects.toMatchObject(
        mockError
      );

      // Should only attempt once (no retries for cancellations)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty path', async () => {
      const mockResponse = { data: { success: true } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await service.testGet('');

      expect(apiClient.get).toHaveBeenCalledWith('/test', undefined);
    });

    it('should handle path with leading slash', async () => {
      const mockResponse = { data: { success: true } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await service.testGet('/endpoint');

      expect(apiClient.get).toHaveBeenCalledWith('/test/endpoint', undefined);
    });

    it('should handle cancelling non-existent request', () => {
      expect(() => service.testCancel('non-existent')).not.toThrow();
    });

    it('should handle empty batch', async () => {
      const results = await service.testBatch([]);

      expect(results).toEqual([]);
    });

    it('should handle empty sequence', async () => {
      const results = await service.testSequence([]);

      expect(results).toEqual([]);
    });
  });
});
