/**
 * Literature Types
 * TypeScript type definitions for literature search and management
 * Phase 10.1 Day 3 - Component Extraction
 * Phase 10.107: Added MetadataCompleteness for transparent quality scoring
 */

/**
 * Phase 10.107: Metadata Completeness
 * Tracks what data we actually have for a paper to provide transparent quality scoring
 */
export interface MetadataCompleteness {
  /** Do we have citation count data? */
  hasCitations: boolean;
  /** Do we have journal metrics (IF/SJR/h-index)? */
  hasJournalMetrics: boolean;
  /** Do we have publication year? */
  hasYear: boolean;
  /** Do we have abstract for semantic analysis? */
  hasAbstract: boolean;
  /** 0-100: how complete is the metadata? */
  completenessScore: number;
  /** Count of available metrics (0-4) */
  availableMetrics: number;
  /** Total possible metrics (4) */
  totalMetrics: number;
}

/**
 * Paper Metadata
 * Phase 10.101: Replace Record<string, any> with proper typed interface
 *
 * @see {Paper.metadata}
 */
export interface PaperMetadata {
  /** Content type classification for theme extraction */
  contentType?: 'full_text' | 'abstract' | 'abstract_overflow' | 'video_transcript' | 'podcast_transcript' | 'social_media' | 'none';
  /** Source of the content (e.g., 'unpaywall', 'pmc', 'manual') */
  contentSource?: string;
  /** Content length in characters */
  contentLength?: number;
  /** Whether full-text is available */
  hasFullText?: boolean;
  /** Full-text fetching status */
  fullTextStatus?: 'not_fetched' | 'fetching' | 'success' | 'failed';
  /** Video-specific: YouTube video ID */
  videoId?: string;
  /** Video-specific: Video duration in seconds */
  duration?: number;
  /** Social media-specific: Platform name */
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'reddit';
  /** Social media-specific: Post ID */
  postId?: string;
  /** Quality assessment metadata */
  qualityAssessment?: {
    /** Peer review status */
    peerReviewed?: boolean;
    /** Retraction status */
    retracted?: boolean;
    /** Data availability statement present */
    hasDataAvailability?: boolean;
    /** Reproducibility score (0-1) */
    reproducibilityScore?: number;
  };
  /** Altmetric data */
  altmetrics?: {
    /** Altmetric attention score */
    score?: number;
    /** Number of mentions across all platforms */
    mentions?: number;
    /** Number of tweets */
    tweets?: number;
    /** Number of news mentions */
    news?: number;
  };
  /** Additional custom metadata fields */
  [key: string]: unknown;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  keywords?: string[];
  fieldsOfStudy?: string[];
  source: string;
  wordCount?: number;
  wordCountExcludingRefs?: number;
  isEligible?: boolean;
  pdfUrl?: string | null;
  openAccessStatus?: string | null;
  hasPdf?: boolean;
  abstractWordCount?: number;
  citationsPerYear?: number;
  impactFactor?: number;
  sjrScore?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  hIndexJournal?: number;
  qualityScore?: number;
  isHighQuality?: boolean;
  /** Phase 10.107: Metadata Completeness - tracks what data we have */
  metadataCompleteness?: MetadataCompleteness;

  /** Phase 10.942: v4.0 Quality Score Breakdown */
  qualityScoreBreakdown?: {
    /** Citation impact score (0-100), 30% weight */
    citationImpact?: number;
    /** Journal prestige score (0-100), 50% weight */
    journalPrestige?: number;
    /** Recency boost score (0-100), 20% weight - Phase 10.942 */
    recencyBoost?: number;
    /** Open access bonus (+10) - Phase 10.942 */
    openAccessBonus?: number;
    /** Reproducibility bonus (+5) - Phase 10.942 */
    reproducibilityBonus?: number;
    /** Altmetric bonus (+5) - Phase 10.942 */
    altmetricBonus?: number;
    /** Core score before bonuses */
    coreScore?: number;
    /** Phase 10.107: Metadata completeness for transparency */
    metadataCompleteness?: MetadataCompleteness;
    /** @deprecated Use recencyBoost instead */
    contentDepth?: number;
  };
  /** Phase 10.942: BM25 relevance score (0-200+) */
  relevanceScore?: number;
  fullText?: string;
  hasFullText?: boolean;
  fullTextStatus?:
    | 'not_fetched'
    | 'fetching'
    | 'success'
    | 'failed'
    | 'available';
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
    | 'publisher';
  fullTextWordCount?: number;
  // Phase 10.6 Day 2: Enhanced PubMed Metadata
  meshTerms?: Array<{ descriptor: string; qualifiers: string[] }>;
  publicationType?: string[];
  authorAffiliations?: Array<{ author: string; affiliation: string }>;
  grants?: Array<{ grantId: string | null; agency: string | null; country: string | null }>;
  // Phase 10.8 Day 9: AI Smart Curation
  qualityTier?: 'gold' | 'silver' | 'bronze' | null;
  // Phase 10.101: Proper type safety for metadata
  metadata?: PaperMetadata;
}

/**
 * Social Media Result Type
 * Phase 10.8 Day 9: Supports Instagram, TikTok, YouTube, and other platforms
 * Used for AI quality scoring and citation generation
 */
export type SocialMediaResult = Paper;

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'relevance' | 'date' | 'citations';
  publicationType?:
    | 'all'
    | 'journal'
    | 'conference'
    | 'preprint'
    | 'book'
    | 'thesis';
  author?: string;
  authorSearchMode?: 'contains' | 'exact';
  includeAIMode?: boolean;
  minCitations?: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface QueryCorrection {
  original: string;
  corrected: string;
}

export interface ResearchPurpose {
  type:
    | 'exploration'
    | 'hypothesis_testing'
    | 'theory_building'
    | 'literature_review';
  description: string;
  researchQuestions?: string[];
  targetAudience?: string;
}

export interface ThemeSource {
  id?: string;
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  sourceId: string;
  sourceUrl?: string;
  sourceTitle: string;
  sourceAuthor?: string;
}

export interface ThemeProvenance {
  model: string;
  version: string;
  timestamp: Date;
  confidence: number;
}

export interface UnifiedTheme {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  weight: number;
  controversial: boolean;
  confidence: number;
  sources: ThemeSource[];
  provenance: ThemeProvenance;
  extractedAt: Date;
  extractionModel: string;
}

export interface SaturationDataPoint {
  sourceNumber: number;
  newThemesDiscovered: number;
  cumulativeThemes: number;
}

export interface SaturationData {
  sourceProgression: SaturationDataPoint[];
  saturationReached: boolean;
  saturationPoint?: number;
  recommendation: string;
}
