/**
 * NETFLIX-GRADE TypeScript Error Types
 * 
 * Strict type definitions for all API errors - NO `any` types allowed.
 * Phase 10.102: Enterprise Production-Ready Implementation
 */

import { AxiosError, AxiosResponse } from 'axios';

/**
 * Standard API Error Response Structure
 */
export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Typed Axios Error with proper response structure
 */
export type TypedAxiosError<T = ApiErrorResponse> = AxiosError<T>;

/**
 * Network Error (no response received)
 */
export interface NetworkError extends Error {
  code?: string;
  isNetworkError: true;
  request?: unknown;
}

/**
 * API Error (response received with error status)
 */
export interface ApiError extends Error {
  statusCode: number;
  response?: AxiosResponse<ApiErrorResponse>;
  isApiError: true;
}

/**
 * Type guard: Check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is TypedAxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true
  );
}

/**
 * Type guard: Check if error is a network error (no response)
 */
export function isNetworkError(error: unknown): error is NetworkError {
  if (!isAxiosError(error)) {
    return false;
  }
  return !error.response && !!error.request;
}

/**
 * Type guard: Check if error is an API error (has response)
 */
export function isApiError(error: unknown): error is ApiError {
  if (!isAxiosError(error)) {
    return false;
  }
  return !!error.response && error.response.status >= 400;
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'API request failed';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Unknown error occurred';
}

/**
 * Extract status code from unknown error type
 */
export function extractStatusCode(error: unknown): number | undefined {
  if (isAxiosError(error) && error.response) {
    return error.response.status;
  }
  return undefined;
}

/**
 * Extract error code from unknown error type
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (isAxiosError(error) && error.response?.data?.code) {
    return error.response.data.code;
  }
  return undefined;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }
  
  if (isApiError(error)) {
    const status = error.response?.status;
    // Retry on 5xx errors and 429 (rate limit)
    return status !== undefined && (status >= 500 || status === 429);
  }
  
  return false;
}













