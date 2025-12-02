/**
 * Phase 10.102 Day 3 - Phase 3: Custom Exception for Literature Search
 *
 * Provides user-friendly error messages with actionable guidance.
 * Enterprise-grade error handling with error codes for debugging.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

export enum LiteratureSearchErrorCode {
  EMPTY_QUERY = 'EMPTY_QUERY',
  INVALID_SOURCES = 'INVALID_SOURCES',
  NO_SOURCES_AVAILABLE = 'NO_SOURCES_AVAILABLE',
  SEARCH_TIMEOUT = 'SEARCH_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface LiteratureSearchErrorResponse {
  message: string;
  userMessage: string;
  errorCode: LiteratureSearchErrorCode;
  suggestedAction: string;
  technicalDetails?: string;
  retryable: boolean;
}

/**
 * Custom exception for literature search errors
 *
 * Features:
 * - User-friendly messages (non-technical)
 * - Actionable guidance (what user should do)
 * - Error codes (for debugging/monitoring)
 * - Retry guidance (is error transient?)
 */
export class LiteratureSearchException extends HttpException {
  public readonly errorCode: LiteratureSearchErrorCode;
  public readonly userMessage: string;
  public readonly suggestedAction: string;
  public readonly retryable: boolean;
  public readonly technicalDetails?: string;

  constructor(
    errorCode: LiteratureSearchErrorCode,
    userMessage: string,
    suggestedAction: string,
    retryable: boolean,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    technicalDetails?: string
  ) {
    const response: LiteratureSearchErrorResponse = {
      message: userMessage, // For NestJS compatibility
      userMessage,
      errorCode,
      suggestedAction,
      technicalDetails,
      retryable,
    };

    super(response, httpStatus);
    this.errorCode = errorCode;
    this.userMessage = userMessage;
    this.suggestedAction = suggestedAction;
    this.retryable = retryable;
    this.technicalDetails = technicalDetails;
  }

  /**
   * Factory methods for common error scenarios
   */

  static emptyQuery(): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.EMPTY_QUERY,
      'Please provide a search query',
      'Enter keywords or phrases related to your research topic (e.g., "climate change education")',
      false, // Not retryable - user needs to fix input
      HttpStatus.BAD_REQUEST
    );
  }

  static invalidSources(invalidSources: string[]): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.INVALID_SOURCES,
      `Invalid literature sources: ${invalidSources.join(', ')}`,
      'Please select valid sources from the available list or leave sources empty to search all',
      false,
      HttpStatus.BAD_REQUEST,
      `Received invalid sources: ${invalidSources.join(', ')}`
    );
  }

  static noSourcesAvailable(): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.NO_SOURCES_AVAILABLE,
      'No literature sources are currently available',
      'Please try again in a few moments. If the problem persists, contact support.',
      true, // Retryable - might be temporary
      HttpStatus.SERVICE_UNAVAILABLE,
      'All configured literature sources are unavailable or disabled'
    );
  }

  static searchTimeout(timeoutMs: number): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.SEARCH_TIMEOUT,
      `Search request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
      'Try a more specific query or reduce the number of sources. You can also retry the search.',
      true, // Retryable
      HttpStatus.REQUEST_TIMEOUT,
      `Search exceeded ${timeoutMs}ms timeout`
    );
  }

  static rateLimitExceeded(retryAfterSeconds: number): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many search requests. Please wait before trying again.',
      `Please wait ${retryAfterSeconds} seconds before making another search request.`,
      true, // Retryable after delay
      HttpStatus.TOO_MANY_REQUESTS,
      `Rate limit exceeded, retry after ${retryAfterSeconds}s`
    );
  }

  static apiError(sourceName: string, error: string): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.API_ERROR,
      `Unable to search ${sourceName} at this time`,
      'We\'re experiencing issues with one of our literature sources. Your search will continue with other sources.',
      true, // Retryable
      HttpStatus.INTERNAL_SERVER_ERROR,
      `${sourceName} API error: ${error}`
    );
  }

  static networkError(): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.NETWORK_ERROR,
      'Network connection error',
      'Please check your internet connection and try again.',
      true, // Retryable
      HttpStatus.SERVICE_UNAVAILABLE,
      'Network request failed'
    );
  }

  static unknownError(error: string): LiteratureSearchException {
    return new LiteratureSearchException(
      LiteratureSearchErrorCode.UNKNOWN_ERROR,
      'An unexpected error occurred while searching',
      'Please try again. If the problem persists, contact support with error code UNKNOWN_ERROR.',
      true, // Retryable - might be transient
      HttpStatus.INTERNAL_SERVER_ERROR,
      error
    );
  }
}
