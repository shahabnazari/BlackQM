import { describe, it, expect } from 'vitest';
import { ApiError, handleApiError, isNetworkError } from '../error-handler';

describe('Error Handler', () => {
  describe('ApiError', () => {
    it('should create an ApiError with message and status code', () => {
      const error = new ApiError('Test error', 404, { detail: 'Not found' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ detail: 'Not found' });
      expect(error.name).toBe('ApiError');
    });

    it('should create an ApiError with just message', () => {
      const error = new ApiError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    it('should handle server response errors', () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            errors: ['Invalid field']
          }
        }
      };

      const result = handleApiError(mockError);
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Bad request');
      expect(result.statusCode).toBe(400);
      expect(result.details).toEqual({ message: 'Bad request', errors: ['Invalid field'] });
    });

    it('should handle server response without message', () => {
      const mockError = {
        response: {
          status: 500,
          data: {}
        }
      };

      const result = handleApiError(mockError);
      
      expect(result.message).toBe('Server error');
      expect(result.statusCode).toBe(500);
    });

    it('should handle network errors', () => {
      const mockError = {
        request: {},
        message: 'Network error'
      };

      const result = handleApiError(mockError);
      
      expect(result.message).toBe('Network error - server not responding');
      expect(result.statusCode).toBe(0);
    });

    it('should handle unknown errors', () => {
      const mockError = {
        message: 'Something went wrong'
      };

      const result = handleApiError(mockError);
      
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle errors without message', () => {
      const mockError = {};

      const result = handleApiError(mockError);
      
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('isNetworkError', () => {
    it('should identify ECONNREFUSED errors', () => {
      const error = { code: 'ECONNREFUSED' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify ENOTFOUND errors', () => {
      const error = { code: 'ENOTFOUND' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify Network message errors', () => {
      const error = { message: 'Network request failed' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify errors without response', () => {
      const error = { request: {} };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should not identify regular errors as network errors', () => {
      const error = { 
        response: { status: 400 },
        message: 'Bad request' 
      };
      expect(isNetworkError(error)).toBe(false);
    });

    it('should not identify non-network errors', () => {
      const error = { 
        code: 'VALIDATION_ERROR',
        message: 'Invalid input' 
      };
      expect(isNetworkError(error)).toBe(false);
    });
  });
});