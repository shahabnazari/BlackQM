/**
 * Phase 10.102 Day 3 - Phase 3: Custom Exception for Source Allocation
 *
 * Handles errors specific to source tier allocation and validation.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

export enum SourceAllocationErrorCode {
  INVALID_SOURCE_INPUT = 'INVALID_SOURCE_INPUT',
  ALLOCATION_FAILED = 'ALLOCATION_FAILED',
  UNMAPPED_SOURCES = 'UNMAPPED_SOURCES',
}

export interface SourceAllocationErrorResponse {
  message: string;
  userMessage: string;
  errorCode: SourceAllocationErrorCode;
  suggestedAction: string;
  technicalDetails?: string;
  unmappedSources?: string[];
}

/**
 * Custom exception for source allocation errors
 */
export class SourceAllocationException extends HttpException {
  public readonly errorCode: SourceAllocationErrorCode;
  public readonly userMessage: string;
  public readonly suggestedAction: string;
  public readonly technicalDetails?: string;
  public readonly unmappedSources?: string[];

  constructor(
    errorCode: SourceAllocationErrorCode,
    userMessage: string,
    suggestedAction: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    technicalDetails?: string,
    unmappedSources?: string[]
  ) {
    const response: SourceAllocationErrorResponse = {
      message: userMessage,
      userMessage,
      errorCode,
      suggestedAction,
      technicalDetails,
      unmappedSources,
    };

    super(response, httpStatus);
    this.errorCode = errorCode;
    this.userMessage = userMessage;
    this.suggestedAction = suggestedAction;
    this.technicalDetails = technicalDetails;
    this.unmappedSources = unmappedSources;
  }

  /**
   * Factory methods for common scenarios
   */

  static invalidInput(): SourceAllocationException {
    return new SourceAllocationException(
      SourceAllocationErrorCode.INVALID_SOURCE_INPUT,
      'Invalid source configuration provided',
      'Please provide a valid array of literature sources',
      HttpStatus.BAD_REQUEST,
      'Expected array of LiteratureSource, received invalid input'
    );
  }

  static allocationFailed(reason: string): SourceAllocationException {
    return new SourceAllocationException(
      SourceAllocationErrorCode.ALLOCATION_FAILED,
      'Failed to allocate sources to quality tiers',
      'Please contact support with error code ALLOCATION_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
      reason
    );
  }

  static unmappedSources(unmapped: string[]): SourceAllocationException {
    return new SourceAllocationException(
      SourceAllocationErrorCode.UNMAPPED_SOURCES,
      `Some sources could not be mapped: ${unmapped.join(', ')}`,
      'These sources will be treated as premium tier sources for safety. Please verify your source selection.',
      HttpStatus.OK, // Not an error, but a warning
      `Unmapped sources defaulted to Tier 1: ${unmapped.join(', ')}`,
      unmapped
    );
  }
}
