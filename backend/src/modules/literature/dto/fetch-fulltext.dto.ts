/**
 * Phase 10.92 Day 1: Full-Text Fetch DTOs
 *
 * Enterprise-grade data transfer objects for full-text extraction endpoints.
 * Provides type safety, validation, and API documentation.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * Full-text status enum
 */
export enum FullTextStatus {
  NOT_FETCHED = 'not_fetched',
  FETCHING = 'fetching',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * Request DTO for fetching full-text for a single paper
 */
export class FetchFullTextParamsDto {
  @ApiProperty({
    description: 'Paper ID (CUID format)',
    example: 'cmi2n24cl00079kt7xu9k82xo',
    type: String,
  })
  @IsString({ message: 'Paper ID must be a string' })
  @IsNotEmpty({ message: 'Paper ID is required' })
  @Matches(/^c[a-z0-9]{24,}$/, { message: 'Paper ID must be a valid CUID' })
  paperId!: string;
}

/**
 * Response DTO for fetch full-text endpoint
 */
export class FetchFullTextResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Job ID for tracking the extraction process',
    example: 'pdf-550e8400-e29b-41d4-a716-446655440000-1731756123456',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Paper ID that was queued',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  paperId!: string;

  @ApiProperty({
    description: 'Human-readable message',
    example: 'Paper queued for full-text extraction',
  })
  message!: string;

  @ApiProperty({
    description: 'Current full-text status',
    enum: FullTextStatus,
    example: FullTextStatus.FETCHING,
  })
  fullTextStatus!: FullTextStatus;
}

/**
 * Authenticated user interface
 * Used for @CurrentUser() decorator
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username?: string;
}
