import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormat {
  BIBTEX = 'bibtex',
  RIS = 'ris',
  JSON = 'json',
  CSV = 'csv',
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
}

export enum LiteratureSource {
  SEMANTIC_SCHOLAR = 'semantic_scholar',
  CROSSREF = 'crossref',
  PUBMED = 'pubmed',
  ARXIV = 'arxiv',
  GOOGLE_SCHOLAR = 'google_scholar',
}

export class SearchLiteratureDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Databases to search', type: [String] })
  @IsArray()
  @IsOptional()
  sources?: LiteratureSource[];

  @ApiPropertyOptional({ description: 'Year range start' })
  @IsNumber()
  @IsOptional()
  yearFrom?: number;

  @ApiPropertyOptional({ description: 'Year range end' })
  @IsNumber()
  @IsOptional()
  yearTo?: number;

  @ApiPropertyOptional({ description: 'Field of study filter' })
  @IsString()
  @IsOptional()
  field?: string;

  @ApiPropertyOptional({ description: 'Number of results per page' })
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Include citation count' })
  @IsBoolean()
  @IsOptional()
  includeCitations?: boolean;

  @ApiPropertyOptional({ description: 'Sort by relevance or date' })
  @IsString()
  @IsOptional()
  sortBy?: 'relevance' | 'date' | 'citations';
}

export class SavePaperDto {
  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Paper authors', type: [String] })
  @IsArray()
  authors!: string[];

  @ApiProperty({ description: 'Publication year' })
  @IsNumber()
  year!: number;

  @ApiPropertyOptional({ description: 'Paper abstract' })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiPropertyOptional({ description: 'DOI identifier' })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiPropertyOptional({ description: 'Paper URL' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Journal or venue' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ description: 'Citation count' })
  @IsNumber()
  @IsOptional()
  citationCount?: number;

  @ApiPropertyOptional({ description: 'User tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection ID to save to' })
  @IsString()
  @IsOptional()
  collectionId?: string;
}

export class ExportCitationsDto {
  @ApiProperty({ description: 'Paper IDs to export', type: [String] })
  @IsArray()
  paperIds!: string[];

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({ description: 'Include abstracts in export' })
  @IsBoolean()
  @IsOptional()
  includeAbstracts?: boolean;
}

export class ExtractThemesDto {
  @ApiProperty({ description: 'Paper IDs to analyze', type: [String] })
  @IsArray()
  paperIds!: string[];

  @ApiPropertyOptional({ description: 'Number of themes to extract' })
  @IsNumber()
  @IsOptional()
  numThemes?: number = 5;

  @ApiPropertyOptional({ description: 'Include keywords' })
  @IsBoolean()
  @IsOptional()
  includeKeywords?: boolean;
}

export class AnalyzeGapsDto {
  @ApiProperty({ description: 'Research field or topic' })
  @IsString()
  field!: string;

  @ApiPropertyOptional({ description: 'Specific subtopics', type: [String] })
  @IsArray()
  @IsOptional()
  subtopics?: string[];

  @ApiPropertyOptional({ description: 'Time range in years' })
  @IsNumber()
  @IsOptional()
  timeRange?: number = 5;

  @ApiPropertyOptional({ description: 'Include funding opportunities' })
  @IsBoolean()
  @IsOptional()
  includeFunding?: boolean;

  @ApiPropertyOptional({ description: 'Include collaboration suggestions' })
  @IsBoolean()
  @IsOptional()
  includeCollaborations?: boolean;
}

export class Paper {
  id!: string;
  title!: string;
  authors!: string[];
  year!: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  references?: string[];
  citations?: string[];
  keywords?: string[];
  fieldsOfStudy?: string[];
  source!: LiteratureSource;
}

export class Theme {
  id!: string;
  name!: string;
  keywords!: string[];
  papers!: string[];
  relevanceScore!: number;
  emergenceYear?: number;
  trendDirection?: 'rising' | 'stable' | 'declining';
}

export class ResearchGap {
  id!: string;
  title!: string;
  description!: string;
  relatedThemes!: string[];
  opportunityScore!: number;
  suggestedMethods!: string[];
  potentialImpact!: string;
  fundingOpportunities?: string[];
  collaborators?: string[];
}

export class KnowledgeGraphNode {
  id!: string;
  label!: string;
  type!: 'paper' | 'author' | 'concept' | 'method' | 'theme';
  properties!: Record<string, any>;
  connections!: string[];
}

export class CitationNetwork {
  nodes!: KnowledgeGraphNode[];
  edges!: Array<{
    source: string;
    target: string;
    type: 'cites' | 'cited_by' | 'related' | 'contradicts';
    weight?: number;
  }>;
  clusters?: Array<{
    id: string;
    name: string;
    nodeIds: string[];
  }>;
}
