/**
 * Generate Report DTO
 * Phase 10 Day 1 Step 5: Backend Report Module
 *
 * Request validation for report generation endpoint
 * Includes comprehensive validation with class-validator
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Template types for report formatting
 */
export enum TemplateType {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  THESIS = 'thesis',
  CUSTOM = 'custom',
}

/**
 * Output format types
 */
export enum ReportFormat {
  HTML = 'html',
  PDF = 'pdf',
  WORD = 'word',
  LATEX = 'latex',
  MARKDOWN = 'markdown',
}

/**
 * Available report sections
 */
export enum ReportSection {
  ABSTRACT = 'abstract',
  INTRODUCTION = 'introduction',
  LITERATURE_REVIEW = 'literature_review',
  METHODS = 'methods',
  RESULTS = 'results',
  DISCUSSION = 'discussion',
  REFERENCES = 'references',
  APPENDIX_PROVENANCE = 'appendix_provenance',
}

/**
 * Request DTO for generating a comprehensive report
 */
export class GenerateReportDto {
  @ApiProperty({
    description: 'ID of the study to generate report for (CUID format)',
    example: 'cmhb52mig0008qlq2ee758c97',
  })
  @IsString()
  studyId!: string;

  @ApiPropertyOptional({
    description: 'Template type for academic formatting',
    enum: TemplateType,
    default: TemplateType.APA,
    example: TemplateType.APA,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  templateType?: TemplateType;

  @ApiPropertyOptional({
    description: 'Sections to include in the report',
    enum: ReportSection,
    isArray: true,
    example: [
      ReportSection.ABSTRACT,
      ReportSection.INTRODUCTION,
      ReportSection.LITERATURE_REVIEW,
      ReportSection.METHODS,
      ReportSection.RESULTS,
      ReportSection.DISCUSSION,
      ReportSection.REFERENCES,
      ReportSection.APPENDIX_PROVENANCE,
    ],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ReportSection, { each: true })
  includeSections?: ReportSection[];

  @ApiPropertyOptional({
    description: 'Whether to include full provenance chain tracing',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeProvenance?: boolean;

  @ApiPropertyOptional({
    description: 'Output format for the report',
    enum: ReportFormat,
    default: ReportFormat.HTML,
    example: ReportFormat.HTML,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({
    description: 'Custom title override (max 200 characters)',
    maxLength: 200,
    example: 'Understanding Climate Change Perspectives: A Q-Methodology Study',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customTitle?: string;

  @ApiPropertyOptional({
    description: 'Custom author list override',
    example: ['Dr. Jane Smith', 'Dr. John Doe'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  customAuthors?: string[];

  @ApiPropertyOptional({
    description: 'Institution name override',
    maxLength: 200,
    example: 'University of Cambridge',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customInstitution?: string;
}

/**
 * DTO for bulk report generation (multiple studies)
 */
export class GenerateBulkReportsDto {
  @ApiProperty({
    description: 'Array of study IDs to generate reports for (CUID format)',
    example: ['cmhb52mig0008qlq2ee758c97', 'cmhb52mig0008qlq2ee758c98'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studyIds!: string[];

  @ApiPropertyOptional({
    description: 'Template type for all reports',
    enum: TemplateType,
    default: TemplateType.APA,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  templateType?: TemplateType;

  @ApiPropertyOptional({
    description: 'Output format for all reports',
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}

/**
 * DTO for updating report metadata
 */
export class UpdateReportMetadataDto {
  @ApiPropertyOptional({
    description: 'Updated title',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated authors',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @ApiPropertyOptional({
    description: 'Updated institution',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;
}
