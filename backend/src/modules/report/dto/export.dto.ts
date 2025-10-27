/**
 * Export DTOs - Phase 10 Day 2
 * Data transfer objects for export and AI manuscript generation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * Export format options
 */
export enum ExportFormat {
  PDF = 'pdf',
  WORD = 'word',
  LATEX = 'latex',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

/**
 * Citation style options
 */
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  IEEE = 'ieee',
  HARVARD = 'harvard',
}

/**
 * Journal template options for LaTeX
 */
export enum JournalTemplate {
  SPRINGER = 'springer',
  ELSEVIER = 'elsevier',
  IEEE = 'ieee',
  PLOS = 'plos',
  NATURE = 'nature',
  APA = 'apa',
}

/**
 * Export report request DTO
 */
export class ExportReportDto {
  @ApiProperty({ description: 'Study ID to export' })
  @IsString()
  studyId!: string;

  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({
    enum: CitationStyle,
    description: 'Citation style',
    default: 'apa',
  })
  @IsEnum(CitationStyle)
  @IsOptional()
  citationStyle?: CitationStyle = CitationStyle.APA;

  @ApiPropertyOptional({
    description: 'Include table of contents',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeTableOfContents?: boolean = true;

  @ApiPropertyOptional({ description: 'Include page numbers', default: true })
  @IsBoolean()
  @IsOptional()
  includePageNumbers?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include provenance appendix',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeProvenance?: boolean = true;

  @ApiPropertyOptional({
    enum: JournalTemplate,
    description: 'Journal template (LaTeX only)',
  })
  @IsEnum(JournalTemplate)
  @IsOptional()
  journalTemplate?: JournalTemplate;

  @ApiPropertyOptional({
    description: 'Document class (LaTeX only)',
    default: 'article',
  })
  @IsString()
  @IsOptional()
  documentClass?: 'article' | 'report' | 'book' | 'thesis' = 'article';

  @ApiPropertyOptional({
    description: 'Font size (LaTeX only)',
    default: '11pt',
  })
  @IsString()
  @IsOptional()
  fontSize?: '10pt' | '11pt' | '12pt' = '11pt';

  @ApiPropertyOptional({
    description: 'Paper size (LaTeX only)',
    default: 'a4paper',
  })
  @IsString()
  @IsOptional()
  paperSize?: 'a4paper' | 'letterpaper' = 'a4paper';

  @ApiPropertyOptional({
    description: 'Dissertation-specific options (for thesis document class)',
    example: {
      degree: 'Doctor of Philosophy',
      department: 'Computer Science',
      institution: 'University Name',
      committee: [
        { name: 'Dr. John Smith', title: 'Chair' },
        { name: 'Dr. Jane Doe', title: 'Member' },
      ],
      dedication: 'To my family',
      acknowledgements: 'I would like to thank...',
      includeCopyrightPage: true,
      includeListOfFigures: true,
      includeListOfTables: true,
    },
  })
  @IsObject()
  @IsOptional()
  dissertationOptions?: {
    degree?: string;
    department?: string;
    institution?: string;
    committee?: { name: string; title: string }[];
    dedication?: string;
    acknowledgements?: string;
    includeCopyrightPage?: boolean;
    includeListOfFigures?: boolean;
    includeListOfTables?: boolean;
  };
}

/**
 * Manuscript section selection DTO
 */
export class ManuscriptSectionsDto {
  @ApiPropertyOptional({
    description: 'Include introduction section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  introduction?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include literature review section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  literatureReview?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include methods section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  methods?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include results section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  results?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include discussion section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  discussion?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include conclusion section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  conclusion?: boolean = true;
}

/**
 * AI manuscript generation request DTO
 */
export class GenerateManuscriptDto {
  @ApiProperty({ description: 'Study ID to generate manuscript for' })
  @IsString()
  studyId!: string;

  @ApiPropertyOptional({
    enum: CitationStyle,
    description: 'Journal citation style',
    default: 'apa',
  })
  @IsEnum(CitationStyle)
  @IsOptional()
  journalStyle?: CitationStyle = CitationStyle.APA;

  @ApiPropertyOptional({ description: 'Target journal name' })
  @IsString()
  @IsOptional()
  targetJournal?: string;

  @ApiPropertyOptional({ description: 'Word limit for manuscript' })
  @IsNumber()
  @IsOptional()
  wordLimit?: number;

  @ApiPropertyOptional({
    description: 'Sections to include',
    type: ManuscriptSectionsDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ManuscriptSectionsDto)
  @IsOptional()
  sections?: ManuscriptSectionsDto = new ManuscriptSectionsDto();
}

/**
 * Citation formatting request DTO
 */
export class FormatCitationDto {
  @ApiProperty({ description: 'Paper ID to format as citation' })
  @IsString()
  paperId!: string;

  @ApiProperty({ enum: CitationStyle, description: 'Citation style' })
  @IsEnum(CitationStyle)
  style!: CitationStyle;
}

/**
 * Multiple citations formatting request DTO
 */
export class FormatCitationsDto {
  @ApiProperty({
    description: 'Array of paper IDs to format as citations',
    type: [String],
  })
  @IsString({ each: true })
  paperIds!: string[];

  @ApiProperty({ enum: CitationStyle, description: 'Citation style' })
  @IsEnum(CitationStyle)
  style!: CitationStyle;
}

/**
 * DOI resolution request DTO
 */
export class ResolveDOIDto {
  @ApiProperty({
    description: 'DOI to resolve',
    example: '10.1007/s11135-023-01234-5',
  })
  @IsString()
  doi!: string;
}

/**
 * Export response DTO
 */
export class ExportResponseDto {
  @ApiProperty({ description: 'Export success status' })
  success!: boolean;

  @ApiProperty({ description: 'Filename of exported document' })
  filename!: string;

  @ApiProperty({ description: 'MIME type of exported document' })
  mimeType!: string;

  @ApiProperty({ description: 'Size of exported document in bytes' })
  size!: number;

  @ApiProperty({ description: 'Export format used' })
  format!: ExportFormat;

  @ApiPropertyOptional({ description: 'Download URL (if applicable)' })
  downloadUrl?: string;
}

/**
 * Manuscript generation response DTO
 */
export class ManuscriptResponseDto {
  @ApiProperty({ description: 'Generation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Number of sections generated' })
  sectionsGenerated!: number;

  @ApiProperty({ description: 'Total word count' })
  totalWordCount!: number;

  @ApiProperty({ description: 'Number of citations included' })
  citationCount!: number;

  @ApiProperty({ description: 'Generated manuscript ID' })
  manuscriptId!: string;

  @ApiProperty({ description: 'AI generation metadata' })
  metadata!: {
    model: string;
    generatedAt: Date;
    journalStyle: string;
    sections: string[];
  };
}

/**
 * Citation response DTO
 */
export class CitationResponseDto {
  @ApiProperty({ description: 'In-text citation format' })
  inText!: string;

  @ApiProperty({ description: 'Full bibliography entry' })
  full!: string;

  @ApiPropertyOptional({ description: 'BibTeX format (for LaTeX)' })
  bibtex?: string;

  @ApiProperty({ description: 'Citation style used' })
  style!: CitationStyle;
}

/**
 * Bibliography response DTO
 */
export class BibliographyResponseDto {
  @ApiProperty({
    description: 'Formatted bibliography entries',
    type: [String],
  })
  entries!: string[];

  @ApiProperty({ description: 'Number of citations' })
  count!: number;

  @ApiProperty({ description: 'Citation style used' })
  style!: CitationStyle;

  @ApiPropertyOptional({ description: 'Complete BibTeX (for LaTeX)' })
  bibtex?: string;
}
