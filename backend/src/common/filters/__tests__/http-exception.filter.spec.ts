/**
 * HTTP Exception Filter Tests - Phase 10.943
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from '../http-exception.filter';

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(async () => {
    filter = new GlobalHttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/literature/search',
      method: 'GET',
      correlationId: 'test-correlation-id-123',
      user: { id: 'user-123' },
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      query: {},
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  describe('HTTP Exception handling', () => {
    it('should return standardized error response for BadRequestException', () => {
      const exception = new BadRequestException('Invalid query');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          errorCode: expect.any(String),
          message: expect.stringContaining('Invalid query'),
          correlationId: 'test-correlation-id-123',
          path: '/api/literature/search',
          method: 'GET',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should return standardized error response for InternalServerErrorException', () => {
      const exception = new InternalServerErrorException('Database error');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          errorCode: expect.stringMatching(/^(SYS|DB)\d+$/),
          correlationId: 'test-correlation-id-123',
        }),
      );
    });

    it('should include correlationId in response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'test-correlation-id-123',
        }),
      );
    });
  });

  describe('Error detection', () => {
    it('should detect timeout errors', () => {
      const exception = new Error('Request timed out after 30000ms');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(504);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'LIT002', // Timeout error code
        }),
      );
    });

    it('should detect rate limit errors', () => {
      const exception = new Error('Rate limit exceeded (429)');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'LIT003', // Rate limit error code
        }),
      );
    });

    it('should detect database errors', () => {
      const exception = new Error('Prisma client error');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'DB002', // Database error code
        }),
      );
    });
  });

  describe('Sensitive data sanitization', () => {
    it('should sanitize API keys from error messages', () => {
      const exception = new Error('Failed with api_key=sk_live_123456789');

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringContaining('sk_live_123456789'),
          message: expect.stringContaining('[REDACTED]'),
        }),
      );
    });

    it('should sanitize tokens from error messages', () => {
      const exception = new Error('Token validation failed: token=eyJhbGciOiJIUzI1NiJ9');

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('[REDACTED]'),
        }),
      );
    });
  });

  describe('Unknown exception handling', () => {
    it('should handle unknown errors gracefully', () => {
      const exception = 'String error';

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          errorCode: 'SYS005',
          message: 'An unexpected error occurred',
        }),
      );
    });

    it('should handle null exception', () => {
      filter.catch(null, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'SYS005',
        }),
      );
    });
  });
});
