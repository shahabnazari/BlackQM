import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { MetadataCompleteness } from '../utils/paper-quality.util';

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
  // Phase 10.6 Day 3: Additional academic sources (bioRxiv/medRxiv/ChemRxiv removed - <500k papers)
  SSRN = 'ssrn',
  // Phase 10.6 Day 4: PubMed Central (PMC) - Full-text articles
  PMC = 'pmc',
  // Phase 10.6 Day 5: ERIC - Education research database
  ERIC = 'eric',
  // Phase 10.7.10: CORE - Open access aggregator (250M+ papers)
  CORE = 'core',
  // Phase 10.106 Phase 1: OpenAlex - Comprehensive open database (250M+ works, 100% free)
  OPENALEX = 'openalex',
  // Phase 10.6 Day 6: Web of Science - Premium academic database
  WEB_OF_SCIENCE = 'web_of_science',
  // Phase 10.6 Day 7: Scopus - Premium Elsevier database
  SCOPUS = 'scopus',
  // Phase 10.6 Day 8: IEEE Xplore - Engineering and computer science database
  IEEE_XPLORE = 'ieee_xplore',
  // Phase 10.6 Day 9: SpringerLink - Multidisciplinary STM publisher
  SPRINGER = 'springer',
  // Phase 10.6 Day 10: Nature - High-impact multidisciplinary journal
  NATURE = 'nature',
  // Phase 10.6 Day 11: Wiley Online Library - 6M+ articles, strong in engineering/medicine
  WILEY = 'wiley',
  // Phase 10.6 Day 12: SAGE Publications - 1000+ journals, social sciences focus
  SAGE = 'sage',
  // Phase 10.6 Day 13: Taylor & Francis - 2700+ journals, humanities focus
  TAYLOR_FRANCIS = 'taylor_francis',
}

export class SearchLiteratureDto {
  @ApiProperty({ description: 'Search query string', minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1, { message: 'Query must not be empty' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
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

  @ApiPropertyOptional({
    description:
      'Minimum word count (excluding references) for paper eligibility',
    minimum: 0,
    default: 1000,
  })
  @IsNumber()
  @IsOptional()
  minWordCount?: number;

  @ApiPropertyOptional({
    description:
      'Minimum abstract length in words (default: 100 - academic standard)',
    minimum: 0,
    default: 100,
  })
  @IsNumber()
  @IsOptional()
  minAbstractLength?: number;

  @ApiPropertyOptional({
    description: 'Enhanced sorting options for enterprise research',
    enum: [
      'relevance',
      'date',
      'citations',
      'citations_per_year',
      'word_count',
      'quality_score',
    ],
    default: 'relevance',
  })
  @IsString()
  @IsOptional()
  sortByEnhanced?:
    | 'relevance'
    | 'date'
    | 'citations'
    | 'citations_per_year'
    | 'word_count'
    | 'quality_score';
}

export class SavePaperDto {
  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Paper authors', type: [String], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100, { message: 'Authors array cannot exceed 100 items' })
  @IsString({ each: true })
  @MaxLength(500, { each: true, message: 'Each author name cannot exceed 500 characters' })
  authors!: string[];

  @ApiPropertyOptional({ description: 'Publication year' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Source database (semantic_scholar, pubmed, crossref, etc.)',
    enum: LiteratureSource,
  })
  @IsEnum(LiteratureSource)
  @IsOptional()
  source?: LiteratureSource;

  @ApiPropertyOptional({ description: 'Paper abstract' })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiPropertyOptional({ description: 'DOI identifier' })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiPropertyOptional({ description: 'PubMed ID (PMID) for PMC full-text lookup' })
  @IsString()
  @IsOptional()
  pmid?: string;

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

  @ApiPropertyOptional({
    description: 'Keywords extracted from paper',
    type: [String],
    maxItems: 100,
  })
  @IsArray()
  @ArrayMaxSize(100, { message: 'Keywords array cannot exceed 100 items' })
  @IsString({ each: true })
  @MaxLength(200, { each: true, message: 'Each keyword cannot exceed 200 characters' })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'User tags',
    type: [String],
    maxItems: 50,
  })
  @IsArray()
  @ArrayMaxSize(50, { message: 'Tags array cannot exceed 50 items' })
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each tag cannot exceed 100 characters' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection ID to save to' })
  @IsString()
  @IsOptional()
  collectionId?: string;

  // Phase 10.6 Day 2: Enhanced PubMed Metadata
  // Phase 10.943: Security hardening - array size limits
  @ApiPropertyOptional({
    description: 'MeSH terms (Medical Subject Headings) from PubMed',
    type: 'array',
    maxItems: 200,
    items: {
      type: 'object',
      properties: {
        descriptor: { type: 'string' },
        qualifiers: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @IsArray()
  @ArrayMaxSize(200, { message: 'MeSH terms array cannot exceed 200 items' })
  @IsOptional()
  meshTerms?: Array<{ descriptor: string; qualifiers: string[] }>;

  @ApiPropertyOptional({
    description: 'Publication types from PubMed',
    type: [String],
    maxItems: 20,
    example: ['Journal Article', 'Randomized Controlled Trial']
  })
  @IsArray()
  @ArrayMaxSize(20, { message: 'Publication types cannot exceed 20 items' })
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each publication type cannot exceed 100 characters' })
  @IsOptional()
  publicationType?: string[];

  @ApiPropertyOptional({
    description: 'Author affiliations from PubMed',
    type: 'array',
    maxItems: 100,
    items: {
      type: 'object',
      properties: {
        author: { type: 'string' },
        affiliation: { type: 'string' }
      }
    }
  })
  @IsArray()
  @ArrayMaxSize(100, { message: 'Author affiliations cannot exceed 100 items' })
  @IsOptional()
  authorAffiliations?: Array<{ author: string; affiliation: string }>;

  @ApiPropertyOptional({
    description: 'Grant information from PubMed',
    type: 'array',
    maxItems: 50,
    items: {
      type: 'object',
      properties: {
        grantId: { type: 'string', nullable: true },
        agency: { type: 'string', nullable: true },
        country: { type: 'string', nullable: true }
      }
    }
  })
  @IsArray()
  @ArrayMaxSize(50, { message: 'Grants array cannot exceed 50 items' })
  @IsOptional()
  grants?: Array<{ grantId: string | null; agency: string | null; country: string | null }>;
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

  /**
   * Phase 10.113: Thematization tier selection
   * Controls how many papers to analyze (50-300)
   * Higher tiers provide deeper analysis but cost more
   */
  @ApiPropertyOptional({
    description: 'Thematization tier: 50 (Quick), 100 (Standard), 150 (Deep), 200 (Comprehensive), 250 (Expert), 300 (Full)',
    enum: [50, 100, 150, 200, 250, 300],
  })
  @IsNumber()
  @IsOptional()
  tier?: 50 | 100 | 150 | 200 | 250 | 300;

  @ApiPropertyOptional({ description: 'Include controversy detection' })
  @IsBoolean()
  @IsOptional()
  includeControversies?: boolean;

  @ApiPropertyOptional({ description: 'Generate Q-sort statements from themes' })
  @IsBoolean()
  @IsOptional()
  generateStatements?: boolean;
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

// NEW: DTO for gap analysis with paper content
export class PaperContentDto {
  @ApiProperty({ description: 'Paper ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Paper abstract' })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiPropertyOptional({ description: 'Authors', type: [String] })
  @IsArray()
  @IsOptional()
  authors?: string[];

  @ApiPropertyOptional({ description: 'Publication year' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Keywords', type: [String] })
  @IsArray()
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ description: 'DOI' })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiPropertyOptional({ description: 'Venue/Journal' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ description: 'Citation count' })
  @IsNumber()
  @IsOptional()
  citationCount?: number;
}

export class AnalyzeGapsFromPapersDto {
  @ApiProperty({
    description: 'Papers to analyze for research gaps',
    type: [PaperContentDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one paper is required' })
  @ValidateNested({ each: true })
  @Type(() => PaperContentDto)
  papers!: PaperContentDto[];
}

export class Paper {
  id!: string;
  title!: string;
  authors!: string[];
  year?: number; // Phase 10.6 Day 3.5: Made optional (not all papers have publication year)
  abstract?: string;
  doi?: string;
  pmid?: string; // Phase 10.6 Day 3.5: PubMed ID for PMC full-text lookup
  pmcId?: string; // Phase 10.94 Day 1-2: PubMed Central ID for direct full-text access
  arXivId?: string; // Phase 10.94 Day 1-2: arXiv ID for preprint identification
  url?: string;
  venue?: string;
  citationCount?: number;
  references?: string[];
  citations?: string[];
  keywords?: string[];
  fieldsOfStudy?: string[];
  source!: LiteratureSource;
  wordCount?: number; // Word count excluding references (Phase 10 Day 5.13+)
  wordCountExcludingRefs?: number; // Alias for clarity
  isEligible?: boolean; // Meets minimum word count threshold (1000 words)

  // PDF availability (Phase 10 Day 5.17.4+)
  pdfUrl?: string | null; // Direct URL to open access PDF
  openAccessStatus?: string | null; // Open access status (e.g., 'GOLD', 'GREEN', 'HYBRID', 'BRONZE')
  hasPdf?: boolean; // Whether PDF is available

  // Full-text availability (Phase 10 Day 5.17.4+)
  hasFullText?: boolean; // Whether full-text is available (PDF or other source)
  fullTextStatus?:
    | 'not_fetched'
    | 'fetching'
    | 'success'
    | 'failed'
    | 'available'; // Full-text fetch status
  fullTextSource?:
    | 'unpaywall'
    | 'manual'
    | 'abstract_overflow'
    | 'pmc'
    | 'eric'
    | 'web_of_science'
    | 'scopus'
    | 'ieee'
    | 'springer'
    | 'nature'
    | 'wiley'
    | 'sage'
    | 'taylor_francis'
    | 'publisher'; // Where full-text came from
  fullTextWordCount?: number; // Word count from full-text (when fetched)
  fullText?: string; // Full-text content (when fetched)

  // Phase 10 Day 5.13+ (Extension 2): Enterprise Quality Metrics
  abstractWordCount?: number; // Abstract length for minimum filtering
  citationsPerYear?: number; // Citation velocity (normalized by age)
  impactFactor?: number; // Journal impact factor (from OpenAlex)
  sjrScore?: number; // SCImago Journal Rank
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Journal quartile ranking
  hIndexJournal?: number; // Journal h-index
  qualityScore?: number; // Composite quality score (0-100)
  isHighQuality?: boolean; // Meets enterprise quality standards

  // Phase 10.111: Clean quality score breakdown
  qualityScoreBreakdown?: {
    citationImpact: number;   // 0-100 (35% weight, field-weighted)
    journalPrestige: number;  // 0-100 (45% weight)
    recencyBoost: number;     // 0-100 (20% weight, exponential decay)
    openAccessBonus?: number; // 0-10 (if paper is OA)
    reproducibilityBonus?: number; // 0-5 (if data/code available)
    altmetricBonus?: number;  // 0-5 (if high social impact)
  };

  // Phase 10.6 Day 14.8 (v3.0): Field normalization and bonus metrics
  fieldOfStudy?: string[]; // OpenAlex field classification (e.g., ['Biology', 'Medicine'])
  fwci?: number; // Field-Weighted Citation Impact (OpenAlex)
  isOpenAccess?: boolean; // Open Access status from OpenAlex
  hasDataCode?: boolean; // Data/code availability detected
  altmetricScore?: number; // Altmetric attention score

  // Phase 10.6 Day 2-3.5: PubMed-specific rich metadata
  meshTerms?: Array<{ descriptor: string; qualifiers: string[] }>; // Medical Subject Headings
  publicationType?: string[]; // Publication type classifications
  authorAffiliations?: Array<{ author: string; affiliation: string }>; // Author institutional affiliations
  grants?: Array<{ grantId: string | null; agency: string | null; country: string | null }>; // Funding information

  // Phase 10.99 Week 2: Performance Optimization - Scoring Properties
  // Added to support in-place mutations during search pipeline
  relevanceScore?: number; // BM25 relevance score (Robertson & Walker, 1994)
  neuralRelevanceScore?: number; // SciBERT neural relevance score (0-1)
  neuralRank?: number; // Neural ranking position (1 = most relevant)
  neuralExplanation?: string; // Explanation of neural score
  domain?: string; // Domain classification (e.g., "Biology", "Medicine")
  domainConfidence?: number; // Domain classification confidence (0-1)
  rejectionReason?: string; // Rejection reason if filtered out

  // Phase 10.107+10.108: Honest Scoring with Metadata Transparency
  // Shows users exactly what data we have and confidence level
  metadataCompleteness?: MetadataCompleteness;

  // Phase 10.113 Week 2: Theme-Fit Relevance Scoring
  // Optimized for Q-methodology thematization potential
  themeFitScore?: {
    /** 0-1: Does abstract contain opposing views? */
    controversyPotential: number;
    /** 0-1: Clear positions that can become statements */
    statementClarity: number;
    /** 0-1: Multiple viewpoints represented */
    perspectiveDiversity: number;
    /** 0-1: Polarized citation patterns */
    citationControversy: number;
    /** Weighted combination of all scores */
    overallThemeFit: number;
    /** Explanation of the score for debugging */
    explanation: string;
  };
  /** Indicates if paper is suitable for thematization (score >= 0.5) */
  isGoodForThematization?: boolean;
}

/**
 * Phase 10.102 Phase 3.1: Search Metadata Interface
 *
 * Replaces Record<string, any> for strict TypeScript compliance.
 * Contains metadata about search execution, allocation strategy, and quality metrics.
 *
 * Note: Uses `unknown` for flexibility to support various metadata types
 * (SourceDiversityReport, complex objects, etc.) while maintaining strict mode compliance.
 */
export interface SearchMetadata {
  // Search pipeline stages
  stage1?: unknown;
  stage2?: unknown;
  searchPhases?: unknown;

  // Allocation and diversity
  allocationStrategy?: unknown;
  diversityMetrics?: unknown;
  qualificationCriteria?: unknown;
  biasMetrics?: unknown;

  // Display and caching
  displayed?: number;
  fromCache?: boolean;

  // Extensibility for future metadata fields
  [key: string]: unknown;
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
    description: 'Research context for theme extraction',
    example: 'climate change mitigation strategies',
  })
  @IsString()
  @IsOptional()
  researchContext?: string;

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

/**
 * Phase 10 Day 5.8 Week 1: Academic-Grade Theme Extraction DTO
 */
export class ExtractThemesAcademicDto {
  @ApiProperty({
    description:
      'Sources to extract themes from (FULL CONTENT - no truncation)',
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
    description: 'Research context for theme extraction',
  })
  @IsString()
  @IsOptional()
  researchContext?: string;

  @ApiPropertyOptional({
    description: 'Academic methodology to use',
    enum: ['reflexive_thematic', 'grounded_theory', 'content_analysis'],
    default: 'reflexive_thematic',
  })
  @IsString()
  @IsOptional()
  methodology?: 'reflexive_thematic' | 'grounded_theory' | 'content_analysis';

  @ApiPropertyOptional({
    description: 'Validation level for theme quality',
    enum: ['standard', 'rigorous', 'publication_ready'],
    default: 'rigorous',
  })
  @IsString()
  @IsOptional()
  validationLevel?: 'standard' | 'rigorous' | 'publication_ready';

  @ApiPropertyOptional({
    description: 'Maximum number of themes to extract',
    minimum: 5,
    maximum: 20,
    default: 15,
  })
  @IsNumber()
  @IsOptional()
  maxThemes?: number;

  @ApiPropertyOptional({
    description: 'Minimum confidence threshold (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.5,
  })
  @IsNumber()
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Study ID to associate themes with',
  })
  @IsString()
  @IsOptional()
  studyId?: string;
}

/**
 * Extract Themes V2 DTO - Purpose-Driven Extraction
 * Phase 10 Day 5.13 - Patent Claim #2: Purpose-Adaptive Algorithms
 */
export class ExtractThemesV2Dto extends ExtractThemesAcademicDto {
  @ApiPropertyOptional({
    description:
      'Research purpose (determines extraction strategy and parameters). Defaults to qualitative_analysis if not specified.',
    enum: [
      'q_methodology',
      'survey_construction',
      'qualitative_analysis',
      'literature_synthesis',
      'hypothesis_generation',
    ],
    example: 'qualitative_analysis',
    default: 'qualitative_analysis',
  })
  @IsOptional() // PHASE 10.99 CRITICAL FIX: Must be FIRST to allow undefined
  @IsString()
  @IsIn([
    'q_methodology',
    'survey_construction',
    'qualitative_analysis',
    'literature_synthesis',
    'hypothesis_generation',
  ])
  purpose?:
    | 'q_methodology'
    | 'survey_construction'
    | 'qualitative_analysis'
    | 'literature_synthesis'
    | 'hypothesis_generation';

  @ApiPropertyOptional({
    description:
      'User expertise level for progressive disclosure (Patent Claim #10)',
    enum: ['novice', 'researcher', 'expert'],
    default: 'researcher',
  })
  @IsString()
  @IsOptional()
  userExpertiseLevel?: 'novice' | 'researcher' | 'expert';

  @ApiPropertyOptional({
    description:
      'Allow iterative refinement (non-linear TA per Braun & Clarke 2019)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowIterativeRefinement?: boolean;

  @ApiPropertyOptional({
    description: 'Request ID for end-to-end tracing and debugging',
  })
  @IsString()
  @IsOptional()
  requestId?: string;
}

/**
 * Theme input for survey item generation
 */
export class ThemeInput {
  @ApiProperty({ description: 'Theme ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Theme name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Theme description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Theme prevalence (0-1)' })
  @IsNumber()
  prevalence!: number;

  @ApiProperty({ description: 'Theme confidence (0-1)' })
  @IsNumber()
  confidence!: number;

  @ApiPropertyOptional({
    description: 'Source papers that contributed to this theme',
    type: [Object],
  })
  @IsArray()
  @IsOptional()
  sources?: Array<{
    id: string;
    title: string;
    type: string;
  }>;

  @ApiPropertyOptional({
    description: 'Key phrases extracted from theme',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  keyPhrases?: string[];
}

/**
 * DTO for generating survey items from themes
 * Phase 10 Day 5.9 - Theme-to-Survey Item Generation Service
 *
 * Purpose: Convert academic themes into traditional survey items
 * Research Foundation: DeVellis (2016) Scale Development
 */
export class GenerateThemeToSurveyItemsDto {
  @ApiProperty({
    description: 'Themes to convert into survey items',
    type: [ThemeInput],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one theme is required' })
  @ValidateNested({ each: true })
  @Type(() => ThemeInput)
  themes!: ThemeInput[];

  @ApiProperty({
    description: 'Type of survey items to generate',
    enum: [
      'likert',
      'multiple_choice',
      'semantic_differential',
      'matrix_grid',
      'rating_scale',
      'mixed',
    ],
    default: 'likert',
  })
  @IsEnum([
    'likert',
    'multiple_choice',
    'semantic_differential',
    'matrix_grid',
    'rating_scale',
    'mixed',
  ])
  itemType!:
    | 'likert'
    | 'multiple_choice'
    | 'semantic_differential'
    | 'matrix_grid'
    | 'rating_scale'
    | 'mixed';

  @ApiPropertyOptional({
    description: 'Scale type for Likert or rating scales',
    enum: ['1-5', '1-7', '1-10', 'agree-disagree', 'frequency', 'satisfaction'],
    default: '1-5',
  })
  @IsString()
  @IsOptional()
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';

  @ApiPropertyOptional({
    description: 'Number of items to generate per theme',
    minimum: 1,
    maximum: 10,
    default: 3,
  })
  @IsNumber()
  @IsOptional()
  itemsPerTheme?: number;

  @ApiPropertyOptional({
    description: 'Include reverse-coded items for reliability checking',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeReverseCoded?: boolean;

  @ApiPropertyOptional({
    description: 'Research context to inform item generation',
  })
  @IsString()
  @IsOptional()
  researchContext?: string;

  @ApiPropertyOptional({
    description: 'Target audience for the survey (affects wording complexity)',
  })
  @IsString()
  @IsOptional()
  targetAudience?: string;
}

// ==================== ENHANCED THEME INTEGRATION DTOs (Phase 10 Day 5.12) ====================

export class ThemeSourceDto {
  @ApiProperty({ description: 'Source ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Source title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Source type' })
  @IsString()
  type!: string;
}

export class SubthemeDto {
  @ApiProperty({ description: 'Subtheme name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Subtheme description' })
  @IsString()
  description!: string;
}

export class ThemeDto {
  @ApiProperty({ description: 'Theme ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Theme name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Theme description' })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Theme prevalence (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  prevalence!: number;

  @ApiProperty({
    description: 'Theme confidence (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  confidence!: number;

  @ApiProperty({ description: 'Source papers', type: [ThemeSourceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThemeSourceDto)
  sources!: ThemeSourceDto[];

  @ApiPropertyOptional({ description: 'Key phrases', type: [String] })
  @IsArray()
  @IsOptional()
  keyPhrases?: string[];

  @ApiPropertyOptional({ description: 'Subthemes', type: [SubthemeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubthemeDto)
  @IsOptional()
  subthemes?: SubthemeDto[];
}

export enum QuestionType {
  EXPLORATORY = 'exploratory',
  EXPLANATORY = 'explanatory',
  EVALUATIVE = 'evaluative',
  DESCRIPTIVE = 'descriptive',
}

export class SuggestQuestionsDto {
  @ApiProperty({
    description: 'Themes to generate questions from',
    type: [ThemeDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one theme is required' })
  @ValidateNested({ each: true })
  @Type(() => ThemeDto)
  themes!: ThemeDto[];

  @ApiPropertyOptional({
    description: 'Types of questions to generate',
    enum: QuestionType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(QuestionType, { each: true })
  @IsOptional()
  questionTypes?: QuestionType[];

  @ApiPropertyOptional({
    description: 'Maximum number of questions to generate',
    default: 15,
  })
  @IsNumber()
  @IsOptional()
  maxQuestions?: number;

  @ApiPropertyOptional({ description: 'Research domain context' })
  @IsString()
  @IsOptional()
  researchDomain?: string;

  @ApiPropertyOptional({ description: 'Research goal description' })
  @IsString()
  @IsOptional()
  researchGoal?: string;
}

export enum HypothesisType {
  CORRELATIONAL = 'correlational',
  CAUSAL = 'causal',
  MEDIATION = 'mediation',
  MODERATION = 'moderation',
  INTERACTION = 'interaction',
}

export class SuggestHypothesesDto {
  @ApiProperty({
    description: 'Themes to generate hypotheses from',
    type: [ThemeDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one theme is required' })
  @ValidateNested({ each: true })
  @Type(() => ThemeDto)
  themes!: ThemeDto[];

  @ApiPropertyOptional({
    description: 'Types of hypotheses to generate',
    enum: HypothesisType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(HypothesisType, { each: true })
  @IsOptional()
  hypothesisTypes?: HypothesisType[];

  @ApiPropertyOptional({
    description: 'Maximum number of hypotheses to generate',
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  maxHypotheses?: number;

  @ApiPropertyOptional({ description: 'Research domain context' })
  @IsString()
  @IsOptional()
  researchDomain?: string;

  @ApiPropertyOptional({ description: 'Research context description' })
  @IsString()
  @IsOptional()
  researchContext?: string;
}

export enum ClusteringAlgorithm {
  SEMANTIC = 'semantic',
  STATISTICAL = 'statistical',
  HYBRID = 'hybrid',
}

export class MapConstructsDto {
  @ApiProperty({ description: 'Themes to map to constructs', type: [ThemeDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one theme is required' })
  @ValidateNested({ each: true })
  @Type(() => ThemeDto)
  themes!: ThemeDto[];

  @ApiPropertyOptional({
    description: 'Include relationship detection between constructs',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeRelationships?: boolean;

  @ApiPropertyOptional({
    description: 'Clustering algorithm to use',
    enum: ClusteringAlgorithm,
    default: ClusteringAlgorithm.SEMANTIC,
  })
  @IsEnum(ClusteringAlgorithm)
  @IsOptional()
  clusteringAlgorithm?: ClusteringAlgorithm;
}

export enum SurveyPurpose {
  EXPLORATORY = 'exploratory',
  CONFIRMATORY = 'confirmatory',
  MIXED = 'mixed',
}

export enum ComplexityLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class GenerateCompleteSurveyDto {
  @ApiProperty({ description: 'Themes to convert to survey', type: [ThemeDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one theme is required' })
  @ValidateNested({ each: true })
  @Type(() => ThemeDto)
  themes!: ThemeDto[];

  @ApiProperty({
    description: 'Purpose of the survey',
    enum: SurveyPurpose,
  })
  @IsEnum(SurveyPurpose)
  surveyPurpose!: SurveyPurpose;

  @ApiPropertyOptional({ description: 'Target number of respondents' })
  @IsNumber()
  @IsOptional()
  targetRespondentCount?: number;

  @ApiPropertyOptional({
    description: 'Complexity level of survey items',
    enum: ComplexityLevel,
    default: ComplexityLevel.INTERMEDIATE,
  })
  @IsEnum(ComplexityLevel)
  @IsOptional()
  complexityLevel?: ComplexityLevel;

  @ApiPropertyOptional({
    description: 'Include demographics section',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeDemographics?: boolean;

  @ApiPropertyOptional({
    description: 'Include attention check items',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeValidityChecks?: boolean;

  @ApiPropertyOptional({
    description: 'Research context to inform survey design',
  })
  @IsString()
  @IsOptional()
  researchContext?: string;
}

/**
 * Phase 10 Day 19.6: Guided Batch Selection DTO
 * Request DTO for scientifically-guided paper batch selection
 */
export class GuidedBatchSelectionDto {
  @ApiProperty({
    description: 'All paper IDs in the research corpus',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allPaperIds!: string[];

  @ApiProperty({
    description: 'Paper IDs already processed in previous iterations',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  processedPaperIds!: string[];

  @ApiProperty({
    description: 'Current themes from previous iterations',
    type: Array,
  })
  @IsArray()
  currentThemes!: any[];

  @ApiProperty({
    description: 'Current iteration number (1-based)',
  })
  @IsNumber()
  iteration!: number;

  @ApiPropertyOptional({
    description: 'Number of papers to select for this batch',
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  batchSize?: number;

  @ApiPropertyOptional({
    description: 'Research context for quality assessment',
  })
  @IsString()
  @IsOptional()
  researchContext?: string;
}

// ============================================================================
// Phase 10.113 Week 3: Hierarchical Theme Extraction DTO
// ============================================================================

/**
 * Paper input for hierarchical theme extraction
 */
export class HierarchicalPaperInputDto {
  @ApiProperty({ description: 'Unique paper ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Paper abstract' })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiPropertyOptional({ description: 'Publication year' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Citation count' })
  @IsNumber()
  @IsOptional()
  citationCount?: number;

  @ApiPropertyOptional({
    description: 'Pre-computed embedding vector (required for clustering)',
    type: [Number],
    example: [0.1, 0.2, 0.3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  embedding?: number[];

  @ApiPropertyOptional({ description: 'Theme-Fit score (0-1)' })
  @IsNumber()
  @IsOptional()
  themeFitScore?: number;

  @ApiPropertyOptional({ description: 'Paper keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

/**
 * Configuration options for hierarchical extraction
 */
export class HierarchicalExtractionConfigDto {
  @ApiPropertyOptional({
    description: 'Minimum number of meta-themes to extract',
    default: 5,
    minimum: 2,
    maximum: 10,
  })
  @IsNumber()
  @IsOptional()
  minMetaThemes?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of meta-themes to extract',
    default: 8,
    minimum: 3,
    maximum: 15,
  })
  @IsNumber()
  @IsOptional()
  maxMetaThemes?: number;

  @ApiPropertyOptional({
    description: 'Minimum sub-themes per meta-theme',
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @IsOptional()
  minSubThemesPerMeta?: number;

  @ApiPropertyOptional({
    description: 'Maximum sub-themes per meta-theme',
    default: 5,
    minimum: 2,
    maximum: 15,
  })
  @IsNumber()
  @IsOptional()
  maxSubThemesPerMeta?: number;

  @ApiPropertyOptional({
    description: 'Minimum papers required per cluster',
    default: 2,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  minPapersPerCluster?: number;

  @ApiPropertyOptional({
    description: 'Coherence threshold for accepting clusters (0-1)',
    default: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  coherenceThreshold?: number;

  @ApiPropertyOptional({
    description: 'Use AI for label generation',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  useAILabeling?: boolean;

  @ApiPropertyOptional({
    description: 'Include controversy detection',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  detectControversies?: boolean;
}

/**
 * Phase 10.113 Week 3: Hierarchical Theme Extraction Request DTO
 * Extracts multi-level themes (meta-themes → sub-themes) from papers
 *
 * NOTE: Paper count limits (10-300) must match HIERARCHICAL_PAPER_LIMITS
 * from hierarchical-theme.types.ts. Decorator values are compile-time constants.
 */
export class ExtractHierarchicalThemesDto {
  @ApiProperty({
    description: 'Papers to analyze for hierarchical theme extraction',
    type: [HierarchicalPaperInputDto],
    minItems: 10,  // Must match HIERARCHICAL_PAPER_LIMITS.MIN_PAPERS
    maxItems: 300, // Must match HIERARCHICAL_PAPER_LIMITS.MAX_PAPERS
  })
  @IsArray()
  @ArrayMinSize(10, { message: 'Minimum 10 papers required for hierarchical extraction' }) // HIERARCHICAL_PAPER_LIMITS.MIN_PAPERS
  @ArrayMaxSize(300, { message: 'Maximum 300 papers allowed' }) // HIERARCHICAL_PAPER_LIMITS.MAX_PAPERS
  @ValidateNested({ each: true })
  @Type(() => HierarchicalPaperInputDto)
  papers!: HierarchicalPaperInputDto[];

  @ApiPropertyOptional({
    description: 'Extraction configuration options',
    type: HierarchicalExtractionConfigDto,
  })
  @ValidateNested()
  @Type(() => HierarchicalExtractionConfigDto)
  @IsOptional()
  config?: HierarchicalExtractionConfigDto;
}

// ============================================================================
// Phase 10.113 Week 4: Citation-Based Controversy Analysis DTOs
// ============================================================================

/**
 * Paper input for citation controversy analysis
 */
export class CitationAnalysisPaperInputDto {
  @ApiProperty({ description: 'Unique paper ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Paper abstract' })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiProperty({ description: 'Publication year' })
  @IsNumber()
  year!: number;

  @ApiProperty({ description: 'Total citation count' })
  @IsNumber()
  citationCount!: number;

  @ApiPropertyOptional({
    description: 'IDs of papers this paper cites',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[];

  @ApiPropertyOptional({
    description: 'IDs of papers that cite this paper',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  citedBy?: string[];

  @ApiPropertyOptional({ description: 'Paper keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Pre-computed embedding vector',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  embedding?: number[];

  @ApiPropertyOptional({ description: 'Theme-Fit score from Week 2' })
  @IsNumber()
  @IsOptional()
  themeFitScore?: number;
}

/**
 * Configuration for citation controversy analysis
 */
export class CitationControversyConfigDto {
  @ApiPropertyOptional({
    description: 'Minimum citations to consider for analysis',
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  minCitationsForAnalysis?: number;

  @ApiPropertyOptional({
    description: 'High velocity threshold (citations per year)',
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  highVelocityThreshold?: number;

  @ApiPropertyOptional({
    description: 'Minimum papers per camp',
    default: 3,
  })
  @IsNumber()
  @IsOptional()
  minPapersPerCamp?: number;

  @ApiPropertyOptional({
    description: 'Controversy threshold (0-1)',
    default: 0.6,
  })
  @IsNumber()
  @IsOptional()
  controversyThreshold?: number;

  @ApiPropertyOptional({
    description: 'Weight for cross-camp citations',
    default: 0.6,
  })
  @IsNumber()
  @IsOptional()
  crossCampWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight for citation velocity',
    default: 0.4,
  })
  @IsNumber()
  @IsOptional()
  velocityWeight?: number;

  @ApiPropertyOptional({
    description: 'Maximum paper age to include (years)',
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  maxPaperAge?: number;
}

/**
 * Phase 10.113 Week 4: Citation Controversy Analysis Request DTO
 *
 * NOTE: Minimum 5 papers required for meaningful analysis.
 */
export class AnalyzeCitationControversyDto {
  @ApiProperty({ description: 'Topic or theme being analyzed' })
  @IsString()
  topic!: string;

  @ApiProperty({
    description: 'Papers to analyze for citation controversy',
    type: [CitationAnalysisPaperInputDto],
    minItems: 5,
  })
  @IsArray()
  @ArrayMinSize(5, { message: 'Minimum 5 papers required for citation controversy analysis' })
  @ValidateNested({ each: true })
  @Type(() => CitationAnalysisPaperInputDto)
  papers!: CitationAnalysisPaperInputDto[];

  @ApiPropertyOptional({
    description: 'Analysis configuration options',
    type: CitationControversyConfigDto,
  })
  @ValidateNested()
  @Type(() => CitationControversyConfigDto)
  @IsOptional()
  config?: CitationControversyConfigDto;
}

// ============================================================================
// Phase 10.113 Week 5: Claim Extraction DTOs
// ============================================================================

/**
 * Sub-theme context for claim extraction
 */
export class ClaimExtractionSubThemeDto {
  @ApiProperty({ description: 'Sub-theme unique identifier' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Sub-theme label/name' })
  @IsString()
  label!: string;

  @ApiPropertyOptional({ description: 'Sub-theme description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Sub-theme keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords!: string[];
}

/**
 * Theme context for claim extraction
 */
export class ClaimExtractionThemeContextDto {
  @ApiProperty({ description: 'Theme unique identifier' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Theme label/name' })
  @IsString()
  label!: string;

  @ApiPropertyOptional({ description: 'Theme description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Theme keywords for relevance scoring', type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords!: string[];

  @ApiPropertyOptional({
    description: 'Sub-themes within this theme',
    type: [ClaimExtractionSubThemeDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClaimExtractionSubThemeDto)
  @IsOptional()
  subThemes?: ClaimExtractionSubThemeDto[];

  @ApiPropertyOptional({ description: 'Whether this theme is controversial' })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({
    description: 'Pre-computed embedding for similarity calculations',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  embedding?: number[];
}

/**
 * Paper input for claim extraction
 */
export class ClaimExtractionPaperInputDto {
  @ApiProperty({ description: 'Unique paper identifier' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Paper title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Paper abstract (primary source for claims)', minLength: 100 })
  @IsString()
  @MinLength(100, { message: 'Abstract must be at least 100 characters for meaningful extraction' })
  abstract!: string;

  @ApiPropertyOptional({ description: 'Full text if available' })
  @IsString()
  @IsOptional()
  fullText?: string;

  @ApiPropertyOptional({ description: 'Publication year' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Author names', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  authors?: string[];

  @ApiPropertyOptional({ description: 'Paper keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Theme ID this paper belongs to' })
  @IsString()
  @IsOptional()
  themeId?: string;

  @ApiPropertyOptional({ description: 'Sub-theme ID this paper belongs to' })
  @IsString()
  @IsOptional()
  subThemeId?: string;

  @ApiPropertyOptional({
    description: 'Pre-computed embedding for similarity calculations',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  embedding?: number[];
}

/**
 * Configuration for claim extraction process
 */
export class ClaimExtractionConfigDto {
  @ApiPropertyOptional({
    description: 'Minimum confidence score to accept a claim (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.5,
  })
  @IsNumber()
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Minimum statement potential to include in output (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.4,
  })
  @IsNumber()
  @IsOptional()
  minStatementPotential?: number;

  @ApiPropertyOptional({
    description: 'Maximum claims to extract per paper',
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  maxClaimsPerPaper?: number;

  @ApiPropertyOptional({
    description: 'Maximum total claims across all papers',
    minimum: 1,
    maximum: 500,
    default: 200,
  })
  @IsNumber()
  @IsOptional()
  maxTotalClaims?: number;

  @ApiPropertyOptional({
    description: 'Minimum word count for a claim to be valid',
    minimum: 1,
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  minClaimWords?: number;

  @ApiPropertyOptional({
    description: 'Maximum word count for a claim (sortability constraint)',
    minimum: 5,
    default: 30,
  })
  @IsNumber()
  @IsOptional()
  maxClaimWords?: number;

  @ApiPropertyOptional({
    description: 'Whether to normalize claims (clean up language)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  normalizeClaimText?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to deduplicate similar claims',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  deduplicateClaims?: boolean;

  @ApiPropertyOptional({
    description: 'Similarity threshold for deduplication (0-1, higher = more strict)',
    minimum: 0,
    maximum: 1,
    default: 0.85,
  })
  @IsNumber()
  @IsOptional()
  deduplicationThreshold?: number;
}

/**
 * Main DTO for claim extraction endpoint
 * Phase 10.113 Week 5: Extract claims from paper abstracts for Q-methodology
 *
 * NOTE: Minimum 1 paper required, abstract must be at least 100 characters.
 */
export class ExtractClaimsDto {
  @ApiProperty({
    description: 'Theme context for claim extraction',
    type: ClaimExtractionThemeContextDto,
  })
  @ValidateNested()
  @Type(() => ClaimExtractionThemeContextDto)
  theme!: ClaimExtractionThemeContextDto;

  @ApiProperty({
    description: 'Papers to extract claims from',
    type: [ClaimExtractionPaperInputDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 paper required for claim extraction' })
  @ValidateNested({ each: true })
  @Type(() => ClaimExtractionPaperInputDto)
  papers!: ClaimExtractionPaperInputDto[];

  @ApiPropertyOptional({
    description: 'Extraction configuration options',
    type: ClaimExtractionConfigDto,
  })
  @ValidateNested()
  @Type(() => ClaimExtractionConfigDto)
  @IsOptional()
  config?: ClaimExtractionConfigDto;
}
