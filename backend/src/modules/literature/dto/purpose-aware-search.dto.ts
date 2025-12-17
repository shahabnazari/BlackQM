/**
 * Phase 10.170: Purpose-Aware Search DTOs
 *
 * Enterprise-grade DTOs with strict validation for purpose-aware search API.
 *
 * SECURITY:
 * - Critical #1: @IsEnum validation for ResearchPurpose
 * - All inputs validated with class-validator
 * - Swagger documentation for API consumers
 * - No implicit any types
 *
 * @module purpose-aware-search.dto
 * @since Phase 10.170
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ResearchPurpose } from '../types/purpose-aware.types';
import { LiteratureSource } from './literature.dto';

// ============================================================================
// PAPER LIMITS DTO
// ============================================================================

/**
 * Paper limits override DTO
 * Allows users to override default paper limits for a purpose
 */
export class PaperLimitsDto {
  @ApiPropertyOptional({
    description: 'Minimum papers to fetch',
    minimum: 1,
    maximum: 10000,
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Minimum papers must be at least 1' })
  @Max(10000, { message: 'Minimum papers cannot exceed 10000' })
  min?: number;

  @ApiPropertyOptional({
    description: 'Target number of papers',
    minimum: 1,
    maximum: 10000,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Target papers must be at least 1' })
  @Max(10000, { message: 'Target papers cannot exceed 10000' })
  target?: number;

  @ApiPropertyOptional({
    description: 'Maximum papers to fetch',
    minimum: 1,
    maximum: 10000,
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Maximum papers must be at least 1' })
  @Max(10000, { message: 'Maximum papers cannot exceed 10000' })
  max?: number;
}

// ============================================================================
// MAIN SEARCH DTO
// ============================================================================

/**
 * Purpose-Aware Search Request DTO
 *
 * Main DTO for initiating a purpose-aware paper search.
 *
 * SECURITY (Critical #1): Uses @IsEnum for ResearchPurpose validation
 */
export class PurposeAwareSearchDto {
  @ApiProperty({
    description: 'Search query string',
    minLength: 1,
    maxLength: 500,
    example: 'climate change adaptation strategies',
  })
  @IsString()
  @MinLength(1, { message: 'Query must not be empty' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
  query!: string;

  @ApiProperty({
    description: 'Research purpose for this search',
    enum: ResearchPurpose,
    example: ResearchPurpose.QUALITATIVE_ANALYSIS,
    enumName: 'ResearchPurpose',
  })
  @IsEnum(ResearchPurpose, {
    message: `Purpose must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
  })
  purpose!: ResearchPurpose;

  @ApiPropertyOptional({
    description: 'Override paper limits (partial)',
    type: PaperLimitsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PaperLimitsDto)
  paperLimitsOverride?: PaperLimitsDto;

  @ApiPropertyOptional({
    description: 'Override quality threshold (0-100)',
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Quality threshold must be at least 0' })
  @Max(100, { message: 'Quality threshold cannot exceed 100' })
  qualityThresholdOverride?: number;

  @ApiPropertyOptional({
    description: 'Force full-text requirement',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  forceFullText?: boolean;

  @ApiPropertyOptional({
    description: 'Full-text boost score (0-50)',
    minimum: 0,
    maximum: 50,
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Full-text boost must be at least 0' })
  @Max(50, { message: 'Full-text boost cannot exceed 50' })
  fullTextBoost?: number;

  @ApiPropertyOptional({
    description: 'Databases to search',
    type: [String],
    enum: LiteratureSource,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LiteratureSource, { each: true })
  sources?: LiteratureSource[];

  @ApiPropertyOptional({
    description: 'Year range start',
    minimum: 1900,
    maximum: 2100,
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'Year must be at least 1900' })
  @Max(2100, { message: 'Year cannot exceed 2100' })
  yearFrom?: number;

  @ApiPropertyOptional({
    description: 'Year range end',
    minimum: 1900,
    maximum: 2100,
    example: 2025,
  })
  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'Year must be at least 1900' })
  @Max(2100, { message: 'Year cannot exceed 2100' })
  yearTo?: number;

  @ApiPropertyOptional({
    description: 'Sort option for results',
    enum: ['relevance', 'citations', 'date', 'quality'],
    example: 'relevance',
  })
  @IsOptional()
  @IsString()
  sortOption?: 'relevance' | 'citations' | 'date' | 'quality';
}

// ============================================================================
// RESPONSE DTOS
// ============================================================================

/**
 * Quality weights response
 */
export class QualityWeightsResponseDto {
  @ApiProperty({ description: 'Content weight', example: 0.40 })
  content!: number;

  @ApiProperty({ description: 'Citation weight', example: 0.20 })
  citation!: number;

  @ApiProperty({ description: 'Journal weight', example: 0.20 })
  journal!: number;

  @ApiProperty({ description: 'Methodology weight', example: 0.20 })
  methodology!: number;

  @ApiPropertyOptional({ description: 'Diversity weight (Q-methodology only)', example: 0.30 })
  diversity?: number;
}

/**
 * Paper limits response
 */
export class PaperLimitsResponseDto {
  @ApiProperty({ description: 'Minimum papers', example: 50 })
  min!: number;

  @ApiProperty({ description: 'Target papers', example: 100 })
  target!: number;

  @ApiProperty({ description: 'Maximum papers', example: 200 })
  max!: number;
}

/**
 * Purpose configuration response
 */
export class PurposeConfigResponseDto {
  @ApiProperty({
    description: 'Research purpose',
    enum: ResearchPurpose,
    example: ResearchPurpose.QUALITATIVE_ANALYSIS,
  })
  purpose!: ResearchPurpose;

  @ApiProperty({
    description: 'Display name',
    example: 'Qualitative Analysis',
  })
  displayName!: string;

  @ApiProperty({
    description: 'Scientific method',
    example: 'Hierarchical clustering + Bayesian saturation (Braun & Clarke 2019)',
  })
  scientificMethod!: string;

  @ApiProperty({
    description: 'Paper limits',
    type: PaperLimitsResponseDto,
  })
  paperLimits!: PaperLimitsResponseDto;

  @ApiProperty({
    description: 'Quality weights',
    type: QualityWeightsResponseDto,
  })
  qualityWeights!: QualityWeightsResponseDto;

  @ApiProperty({
    description: 'Initial quality threshold',
    example: 60,
  })
  initialThreshold!: number;

  @ApiProperty({
    description: 'Content priority',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  contentPriority!: string;

  @ApiProperty({
    description: 'Full-text required',
    example: false,
  })
  fullTextRequired!: boolean;

  @ApiProperty({
    description: 'Diversity required',
    example: false,
  })
  diversityRequired!: boolean;

  @ApiProperty({
    description: 'Target themes minimum',
    example: 5,
  })
  targetThemesMin!: number;

  @ApiProperty({
    description: 'Target themes maximum',
    example: 20,
  })
  targetThemesMax!: number;
}

/**
 * Search result summary response
 */
export class PurposeAwareSearchResultDto {
  @ApiProperty({
    description: 'Research purpose used',
    enum: ResearchPurpose,
  })
  purpose!: ResearchPurpose;

  @ApiProperty({
    description: 'Total papers fetched',
    example: 150,
  })
  totalFetched!: number;

  @ApiProperty({
    description: 'Papers passing quality threshold',
    example: 120,
  })
  qualifiedPapers!: number;

  @ApiProperty({
    description: 'Papers with full-text available',
    example: 45,
  })
  fullTextCount!: number;

  @ApiProperty({
    description: 'Actual quality threshold used',
    example: 55,
  })
  actualThreshold!: number;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 3500,
  })
  processingTimeMs!: number;

  @ApiPropertyOptional({
    description: 'Whether configuration overrides were applied',
    example: false,
  })
  hasOverrides?: boolean;

  @ApiPropertyOptional({
    description: 'Applied override descriptions',
    example: ['paperLimits: {"target": 200}'],
  })
  appliedOverrides?: string[];
}

// ============================================================================
// GET CONFIG DTO
// ============================================================================

/**
 * Get purpose config request params
 */
export class GetPurposeConfigDto {
  @ApiProperty({
    description: 'Research purpose',
    enum: ResearchPurpose,
    example: ResearchPurpose.Q_METHODOLOGY,
  })
  @IsEnum(ResearchPurpose, {
    message: `Purpose must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
  })
  purpose!: ResearchPurpose;
}

// ============================================================================
// COMPARE CONFIGS DTO
// ============================================================================

/**
 * Compare configs request
 */
export class ComparePurposeConfigsDto {
  @ApiProperty({
    description: 'First research purpose',
    enum: ResearchPurpose,
    example: ResearchPurpose.Q_METHODOLOGY,
  })
  @IsEnum(ResearchPurpose, {
    message: `Purpose must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
  })
  purpose1!: ResearchPurpose;

  @ApiProperty({
    description: 'Second research purpose',
    enum: ResearchPurpose,
    example: ResearchPurpose.QUALITATIVE_ANALYSIS,
  })
  @IsEnum(ResearchPurpose, {
    message: `Purpose must be one of: ${Object.values(ResearchPurpose).join(', ')}`,
  })
  purpose2!: ResearchPurpose;
}

/**
 * Compare configs response
 */
export class ComparePurposeConfigsResponseDto {
  @ApiProperty({
    description: 'Configuration differences',
    example: [
      'Paper target: q_methodology=600, qualitative_analysis=100',
      'Journal weight: q_methodology=0.00, qualitative_analysis=0.20',
    ],
  })
  differences!: string[];

  @ApiProperty({
    description: 'First purpose configuration',
    type: PurposeConfigResponseDto,
  })
  config1!: PurposeConfigResponseDto;

  @ApiProperty({
    description: 'Second purpose configuration',
    type: PurposeConfigResponseDto,
  })
  config2!: PurposeConfigResponseDto;
}

// ============================================================================
// THEME EXTRACTION WITH PURPOSE DTO
// ============================================================================

/**
 * Purpose-aware theme extraction request
 */
export class PurposeAwareThemeExtractionDto {
  @ApiProperty({
    description: 'Search query',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query!: string;

  @ApiProperty({
    description: 'Research purpose',
    enum: ResearchPurpose,
  })
  @IsEnum(ResearchPurpose)
  purpose!: ResearchPurpose;

  @ApiPropertyOptional({
    description: 'Session ID for tracking',
    example: 'session_abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Override paper limits',
    type: PaperLimitsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaperLimitsDto)
  paperLimitsOverride?: PaperLimitsDto;

  @ApiPropertyOptional({
    description: 'Enable real-time WebSocket updates',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableWebSocket?: boolean;
}

// ============================================================================
// VALIDATION ERROR RESPONSE
// ============================================================================

/**
 * Validation error response
 */
export class PurposeValidationErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message!: string;

  @ApiProperty({
    description: 'Validation error details',
    example: [
      'purpose must be one of: q_methodology, qualitative_analysis, literature_synthesis, hypothesis_generation, survey_construction',
    ],
  })
  errors!: string[];
}
