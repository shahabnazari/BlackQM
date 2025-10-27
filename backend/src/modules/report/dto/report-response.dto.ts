/**
 * Report Response DTOs
 * Phase 10 Day 1 Step 5: Backend Report Module
 *
 * Type-safe response objects for report endpoints
 * Includes Swagger documentation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportFormat, TemplateType } from './generate-report.dto';

/**
 * Report metadata response
 */
export class ReportMetadataDto {
  @ApiProperty({
    description: 'Report title',
    example: 'Understanding Climate Change Perspectives: A Q-Methodology Study',
  })
  title!: string;

  @ApiProperty({
    description: 'Report authors',
    example: ['Dr. Jane Smith', 'Dr. John Doe'],
  })
  authors!: string[];

  @ApiPropertyOptional({
    description: 'Institution name',
    example: 'University of Cambridge',
  })
  institution?: string;

  @ApiProperty({
    description: 'Report generation date',
    example: '2024-01-15T10:30:00Z',
  })
  date!: Date;

  @ApiProperty({
    description: 'Report version',
    example: '1.0.0',
  })
  version!: string;

  @ApiProperty({
    description: 'Study ID this report is for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  studyId!: string;
}

/**
 * Report section response
 */
export class ReportSectionDto {
  @ApiProperty({
    description: 'Section identifier',
    example: 'introduction',
  })
  id!: string;

  @ApiProperty({
    description: 'Section title',
    example: 'Introduction',
  })
  title!: string;

  @ApiProperty({
    description: 'Section content (markdown or formatted text)',
    example: '## Introduction\n\nThis study investigates...',
  })
  content!: string;

  @ApiProperty({
    description: 'Section order in the report',
    example: 1,
  })
  order!: number;
}

/**
 * Provenance chain node
 */
export class ProvenanceNodeDto {
  @ApiPropertyOptional({
    description: 'Source paper information',
  })
  paper?: {
    id: string;
    title: string;
    authors: string;
    year: number;
  };

  @ApiPropertyOptional({
    description: 'Research gap information',
  })
  gap?: {
    id: string;
    description: string;
  };

  @ApiPropertyOptional({
    description: 'Research question information',
  })
  question?: {
    id: string;
    text: string;
    squareitScore: number;
  };

  @ApiPropertyOptional({
    description: 'Hypothesis information',
  })
  hypothesis?: {
    id: string;
    text: string;
    type: string;
  };

  @ApiPropertyOptional({
    description: 'Theme information',
  })
  theme?: {
    id: string;
    label: string;
    description: string;
  };

  @ApiPropertyOptional({
    description: 'Statement information',
  })
  statement?: {
    id: string;
    text: string;
    statementNumber: number;
  };

  @ApiPropertyOptional({
    description: 'Factor information',
  })
  factor?: {
    id: string;
    name: string;
    variance: number;
  };
}

/**
 * Complete report response
 */
export class ReportResponseDto {
  @ApiProperty({
    description: 'Report UUID',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Study UUID this report belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  studyId!: string;

  @ApiProperty({
    description: 'User UUID who generated the report',
    example: '450e8400-e29b-41d4-a716-446655440000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Report metadata',
    type: ReportMetadataDto,
  })
  metadata!: ReportMetadataDto;

  @ApiProperty({
    description: 'Report sections',
    type: [ReportSectionDto],
  })
  sections!: ReportSectionDto[];

  @ApiPropertyOptional({
    description: 'Full provenance chain for traceability',
    type: [ProvenanceNodeDto],
  })
  provenance?: ProvenanceNodeDto[];

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    example: ReportFormat.HTML,
  })
  format!: ReportFormat;

  @ApiPropertyOptional({
    description: 'Template type used',
    enum: TemplateType,
    example: TemplateType.APA,
  })
  templateType?: TemplateType;

  @ApiPropertyOptional({
    description: 'Rendered content (if format was specified)',
    example: '<!DOCTYPE html><html>...</html>',
  })
  content?: string;

  @ApiProperty({
    description: 'Report creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Report last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  updatedAt!: Date;
}

/**
 * List of reports response
 */
export class ReportListResponseDto {
  @ApiProperty({
    description: 'Array of reports',
    type: [ReportResponseDto],
  })
  reports!: ReportResponseDto[];

  @ApiProperty({
    description: 'Total number of reports',
    example: 42,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  pageSize!: number;
}

/**
 * Report deletion response
 */
export class DeleteReportResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Report deleted successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Deleted report ID',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  reportId!: string;
}

/**
 * Bulk report generation response
 */
export class BulkReportResponseDto {
  @ApiProperty({
    description: 'Array of generated reports',
    type: [ReportResponseDto],
  })
  reports!: ReportResponseDto[];

  @ApiProperty({
    description: 'Number of successful generations',
    example: 5,
  })
  successCount!: number;

  @ApiProperty({
    description: 'Number of failed generations',
    example: 0,
  })
  failureCount!: number;

  @ApiPropertyOptional({
    description: 'Error details for failed generations',
    example: [{ studyId: '123', error: 'Study not found' }],
  })
  errors?: Array<{ studyId: string; error: string }>;
}
