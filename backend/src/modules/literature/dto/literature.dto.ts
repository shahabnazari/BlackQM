import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Minimum citation count' })
  @IsNumber()
  @IsOptional()
  minCitations?: number;

  @ApiPropertyOptional({
    description: 'Publication type filter',
    enum: ['all', 'journal', 'conference', 'preprint'],
  })
  @IsString()
  @IsOptional()
  publicationType?: 'all' | 'journal' | 'conference' | 'preprint';

  @ApiPropertyOptional({ description: 'Author name filter' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({
    description: 'Author search mode',
    enum: ['contains', 'exact', 'fuzzy'],
    default: 'contains',
  })
  @IsString()
  @IsOptional()
  authorSearchMode?: 'contains' | 'exact' | 'fuzzy';

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

// ============================================
// PHASE 9 DAY 20: UNIFIED THEME EXTRACTION
// ============================================

export enum SourceType {
  PAPER = 'paper',
  YOUTUBE = 'youtube',
  PODCAST = 'podcast',
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram',
}

export class SourceContentDto {
  @ApiProperty({ description: 'Source ID (paper ID, video ID, etc.)' })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Source type',
    enum: SourceType,
  })
  @IsEnum(SourceType)
  type!: SourceType;

  @ApiPropertyOptional({ description: 'Source title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Source content or abstract' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Source keywords', type: [String] })
  @IsArray()
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ description: 'DOI identifier (for papers)' })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiPropertyOptional({ description: 'Authors (for papers)', type: [String] })
  @IsArray()
  @IsOptional()
  authors?: string[];

  @ApiPropertyOptional({ description: 'Publication year (for papers)' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ExtractionOptionsDto {
  @ApiPropertyOptional({
    description: 'Minimum confidence threshold (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Theme deduplication similarity threshold (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  deduplicationThreshold?: number;

  @ApiPropertyOptional({ description: 'Include full provenance tracking' })
  @IsBoolean()
  @IsOptional()
  includeProvenance?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of themes to extract',
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @IsOptional()
  maxThemes?: number;
}

export class ExtractUnifiedThemesDto {
  @ApiProperty({
    description: 'Sources to extract themes from (at least 1 required)',
    type: [SourceContentDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one source is required for theme extraction',
  })
  @ValidateNested({ each: true })
  @Type(() => SourceContentDto)
  sources!: SourceContentDto[];

  @ApiPropertyOptional({
    description: 'Extraction options',
    type: ExtractionOptionsDto,
  })
  @ValidateNested()
  @Type(() => ExtractionOptionsDto)
  @IsOptional()
  options?: ExtractionOptionsDto;
}

export class CompareStudyThemesDto {
  @ApiProperty({
    description: 'Study IDs to compare',
    type: [String],
  })
  @IsArray()
  studyIds!: string[];
}

// ==================== CROSS-PLATFORM SYNTHESIS DTOs (Phase 9 Day 22) ====================

export class CrossPlatformSynthesisDto {
  @ApiProperty({
    description: 'Research query to synthesize across platforms',
    example: 'climate change adaptation strategies',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Maximum results per platform',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  maxResults?: number;

  @ApiPropertyOptional({
    description: 'Include full transcripts for video content',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeTranscripts?: boolean;

  @ApiPropertyOptional({
    description: 'Time window in days for analysis',
    minimum: 1,
    maximum: 365,
    default: 90,
  })
  @IsNumber()
  @IsOptional()
  timeWindow?: number;
}

export class PlatformFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific platforms',
    type: [String],
    example: ['paper', 'youtube', 'tiktok'],
  })
  @IsArray()
  @IsOptional()
  platforms?: ('paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram')[];

  @ApiPropertyOptional({
    description: 'Minimum relevance score (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  minRelevance?: number;
}

// ==================== YOUTUBE ENHANCEMENT DTOs (Phase 9 Day 21) ====================

export class ScoreVideoRelevanceDto {
  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  @IsString()
  videoId!: string;

  @ApiProperty({
    description: 'Video title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Video description',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Channel name',
  })
  @IsString()
  channelName!: string;

  @ApiProperty({
    description: 'Duration in seconds',
  })
  @IsNumber()
  duration!: number;

  @ApiProperty({
    description: 'Research context for relevance scoring',
    example: 'climate change adaptation strategies',
  })
  @IsString()
  researchContext!: string;
}

export class BatchScoreVideosDto {
  @ApiProperty({
    description: 'Array of video metadata',
    type: [ScoreVideoRelevanceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreVideoRelevanceDto)
  videos!: ScoreVideoRelevanceDto[];

  @ApiProperty({
    description: 'Research context',
  })
  @IsString()
  researchContext!: string;
}

export class AISelectVideosDto {
  @ApiProperty({
    description: 'Array of video metadata',
    type: [ScoreVideoRelevanceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreVideoRelevanceDto)
  videos!: ScoreVideoRelevanceDto[];

  @ApiProperty({
    description: 'Research context',
  })
  @IsString()
  researchContext!: string;

  @ApiPropertyOptional({
    description: 'Number of top videos to select',
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  topN?: number;
}

export class ExpandQueryDto {
  @ApiProperty({
    description: 'User query to expand',
    example: 'climate',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Research domain',
    enum: ['climate', 'health', 'education', 'general'],
  })
  @IsString()
  @IsOptional()
  domain?: 'climate' | 'health' | 'education' | 'general';
}
