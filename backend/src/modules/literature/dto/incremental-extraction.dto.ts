/**
 * Phase 10 Day 18: Iterative Theme Extraction DTOs
 *
 * Data Transfer Objects for incremental theme extraction with caching
 */

import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResearchPurpose {
  Q_METHODOLOGY = 'q_methodology',
  SURVEY_CONSTRUCTION = 'survey_construction',
  QUALITATIVE_ANALYSIS = 'qualitative_analysis',
  LITERATURE_SYNTHESIS = 'literature_synthesis',
  HYPOTHESIS_GENERATION = 'hypothesis_generation',
}

export enum UserExpertiseLevel {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export class IncrementalExtractionDto {
  @ApiProperty({
    description: 'Paper IDs already processed in previous extractions',
    example: ['paper1', 'paper2', 'paper3'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  existingPaperIds!: string[];

  @ApiProperty({
    description: 'New paper IDs to add to the corpus',
    example: ['paper4', 'paper5'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  newPaperIds!: string[];

  @ApiProperty({
    description: 'Research purpose for theme extraction',
    enum: ResearchPurpose,
    example: ResearchPurpose.QUALITATIVE_ANALYSIS,
  })
  @IsEnum(ResearchPurpose)
  purpose!: ResearchPurpose;

  @ApiProperty({
    description: 'User expertise level for interpretation complexity',
    enum: UserExpertiseLevel,
    example: UserExpertiseLevel.INTERMEDIATE,
  })
  @IsEnum(UserExpertiseLevel)
  userExpertiseLevel!: UserExpertiseLevel;

  @ApiProperty({
    description: 'Optional corpus ID to link to existing corpus',
    required: false,
    example: 'corpus123',
  })
  @IsOptional()
  @IsString()
  corpusId?: string;

  @ApiProperty({
    description: 'Optional corpus name for organization',
    required: false,
    example: 'COVID-19 Vaccine Hesitancy Literature',
  })
  @IsOptional()
  @IsString()
  corpusName?: string;

  @ApiProperty({
    description: 'Maximum number of themes to extract',
    required: false,
    example: 15,
    minimum: 3,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(50)
  maxThemes?: number;

  @ApiProperty({
    description: 'Minimum confidence threshold for themes (0-1)',
    required: false,
    example: 0.6,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;
}

export interface ThemeChange {
  themeId: string;
  themeName: string;
  changeType: 'new' | 'strengthened' | 'weakened' | 'unchanged';
  previousConfidence?: number;
  newConfidence: number;
  evidenceCount: number;
  newEvidenceAdded: number;
}

export interface SaturationAnalysis {
  isSaturated: boolean;
  confidenceLevel: number; // 0-1
  newThemesFound: number;
  existingThemesStrengthened: number;
  recommendation:
    | 'add_more_sources'
    | 'saturation_reached'
    | 'refine_search'
    | 'continue_extraction';
  rationale: string;
}

export interface CostSavings {
  cachehitsCount: number;
  embeddingsSaved: number; // Number of embedding API calls saved
  completionsSaved: number; // Number of completion API calls saved
  estimatedDollarsSaved: number;
  totalPapersProcessed: number;
  newPapersProcessed: number;
  cachedPapersReused: number;
}

export class IncrementalExtractionResponse {
  @ApiProperty({
    description: 'Merged themes from both existing and new papers',
    type: 'array',
  })
  themes!: any[]; // UnifiedTheme[] from unified-theme-api.service

  @ApiProperty({
    description: 'Statistics about the incremental extraction',
  })
  statistics!: {
    previousThemeCount: number;
    newThemesAdded: number;
    themesStrengthened: number;
    themesWeakened: number;
    totalThemeCount: number;
    newPapersProcessed: number;
    cachedPapersReused: number;
    processingTimeMs: number;
  };

  @ApiProperty({
    description: 'Theoretical saturation analysis',
  })
  saturation!: SaturationAnalysis;

  @ApiProperty({
    description: 'Cost savings from caching',
  })
  costSavings!: CostSavings;

  @ApiProperty({
    description: 'Detailed theme changes from previous extraction',
    type: [Object],
  })
  themeChanges!: ThemeChange[];

  @ApiProperty({
    description: 'Corpus ID for tracking iterations',
  })
  corpusId!: string;

  @ApiProperty({
    description: 'Corpus name',
  })
  corpusName!: string;
}
