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
  fullText?: string;
  hasFullText?: boolean;
  fullTextStatus?: 'not_fetched' | 'fetching' | 'success' | 'failed' | 'available';
  fullTextSource?: 'unpaywall' | 'manual' | 'abstract_overflow' | 'pmc' | 'publisher';
  fullTextWordCount?: number;
}

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'relevance' | 'date' | 'citations';
  publicationType?: 'all' | 'journal' | 'conference' | 'preprint' | 'book' | 'thesis';
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
  type: 'exploration' | 'hypothesis_testing' | 'theory_building' | 'literature_review';
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
