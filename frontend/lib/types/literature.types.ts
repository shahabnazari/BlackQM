/**
 * Literature Types
 * TypeScript type definitions for literature search and management
 * Phase 10.1 Day 3 - Component Extraction
 */

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
  qualityScoreBreakdown?: {
    citationImpact: number;
    journalPrestige: number;
    contentDepth: number;
  };
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
  metadata?: Record<string, any>;
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
