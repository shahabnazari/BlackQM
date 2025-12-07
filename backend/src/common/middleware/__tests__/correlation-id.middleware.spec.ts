/**
 * Correlation ID Middleware Tests - Phase 10.943
 */

import { CorrelationIdMiddleware, getCorrelationId, getRequestContext, correlationStorage } from '../correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();

    mockRequest = {
      headers: {},
      user: null,
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('Correlation ID generation', () => {
    it('should generate a new UUID when no correlation ID is provided', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should preserve existing correlation ID from header', () => {
      const existingId = 'existing-correlation-id-123';
      mockRequest.headers['x-correlation-id'] = existingId;

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBe(existingId);
    });

    it('should add correlation ID to response headers', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        mockRequest.correlationId
      );
    });
  });

  describe('Request context', () => {
    it('should attach correlation ID to request object', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBeDefined();
    });

    it('should call next() to continue request chain', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should run next() in AsyncLocalStorage context', (done) => {
      middleware.use(mockRequest, mockResponse, () => {
        const context = getRequestContext();
        expect(context).toBeDefined();
        expect(context?.correlationId).toBe(mockRequest.correlationId);
        done();
      });
    });
  });

  describe('User context', () => {
    it('should include user ID in context when authenticated', (done) => {
      mockRequest.user = { id: 'user-123' };

      middleware.use(mockRequest, mockResponse, () => {
        const context = getRequestContext();
        expect(context?.userId).toBe('user-123');
        done();
      });
    });

    it('should handle user with sub claim', (done) => {
      mockRequest.user = { sub: 'sub-user-456' };

      middleware.use(mockRequest, mockResponse, () => {
        const context = getRequestContext();
        expect(context?.userId).toBe('sub-user-456');
        done();
      });
    });

    it('should handle unauthenticated requests', (done) => {
      middleware.use(mockRequest, mockResponse, () => {
        const context = getRequestContext();
        expect(context?.userId).toBeUndefined();
        done();
      });
    });
  });

  describe('Performance tracking', () => {
    it('should record start time in context', (done) => {
      const startTime = Date.now();

      middleware.use(mockRequest, mockResponse, () => {
        const context = getRequestContext();
        expect(context?.startTime).toBeDefined();
        expect(context?.startTime).toBeGreaterThanOrEqual(startTime);
        done();
      });
    });
  });
});

describe('getCorrelationId helper', () => {
  it('should return undefined when not in request context', () => {
    const correlationId = getCorrelationId();
    expect(correlationId).toBeUndefined();
  });

  it('should return correlation ID when in request context', (done) => {
    correlationStorage.run(
      { correlationId: 'test-id', startTime: Date.now() },
      () => {
        const correlationId = getCorrelationId();
        expect(correlationId).toBe('test-id');
        done();
      }
    );
  });
});

describe('getRequestContext helper', () => {
  it('should return undefined when not in request context', () => {
    const context = getRequestContext();
    expect(context).toBeUndefined();
  });

  it('should return full context when in request context', (done) => {
    const testContext = {
      correlationId: 'test-correlation-id',
      userId: 'test-user',
      startTime: Date.now(),
    };

    correlationStorage.run(testContext, () => {
      const context = getRequestContext();
      expect(context).toEqual(testContext);
      done();
    });
  });
});
