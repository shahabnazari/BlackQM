/**
 * Theme Extraction Type Definitions
 * Phase 10.943: Enterprise-grade type safety for theme extraction
 *
 * Purpose: Eliminate all `any` types in unified-theme-extraction.service.ts
 * Pattern: Zero `any`, zero `@ts-ignore`, zero unsafe `as` assertions
 *
 * Type Safety Rules (Phase 10.93 Standard):
 * 1. All Prisma results MUST have explicit interfaces
 * 2. No `as any` type assertions - use proper interfaces
 * 3. All external data MUST have type guards
 * 4. Cache types explicitly defined
 */

import type { ThemeProvenance, UnifiedTheme, SourceContent } from './unified-theme-extraction.types';
import type { JsonValue } from '@prisma/client/runtime/library';

// ============================================================================
// Source Type Union (Shared across interfaces)
// ============================================================================

/**
 * Valid source types for theme extraction
 */
export type SourceType = 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';

// ============================================================================
// Prisma Result Types (Database entities with relations)
// ============================================================================

/**
 * Theme source relation from Prisma query
 * Maps to ThemeSource table with influence tracking
 * Phase 10.943: Matches actual Prisma schema (no updatedAt on sources)
 */
export interface PrismaThemeSourceRelation {
  id: string;
  sourceType: string; // Prisma returns string, not union type
  sourceId: string;
  sourceUrl: string | null;
  sourceTitle: string;
  sourceAuthor?: string | null;
  influence: number;
  keywordMatches: number;
  excerpts: string[];
  timestamps?: JsonValue | null;
  doi: string | null;
  authors: JsonValue | null;
  year: number | null;
  createdAt: Date;
  themeId: string;
}

/**
 * Theme provenance relation from Prisma query
 * Maps to ThemeProvenance table with source breakdown
 * Phase 10.943: Matches actual Prisma schema
 */
export interface PrismaThemeProvenanceRelation {
  id: string;
  themeId: string;
  paperInfluence: number;
  videoInfluence: number;
  podcastInfluence: number;
  socialInfluence: number;
  paperCount: number;
  videoCount: number;
  podcastCount: number;
  socialCount: number;
  averageConfidence: number;
  citationChain: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full theme from Prisma with relations included
 * Result of: prisma.unifiedTheme.findMany({ include: { sources: true, provenance: true } })
 * Phase 10.943: Matches actual Prisma schema
 */
export interface PrismaUnifiedThemeWithRelations {
  id: string;
  label: string;
  description: string | null;
  keywords: JsonValue; // Prisma returns JsonValue for array fields
  weight: number;
  controversial: boolean;
  confidence: number;
  extractedAt: Date;
  extractionModel: string;
  studyId: string | null;
  collectionId: string | null;
  sources: PrismaThemeSourceRelation[];
  provenance: PrismaThemeProvenanceRelation | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Database Source Types (for full-text checking)
// ============================================================================

/**
 * Paper entity from database with optional full-text
 * Used when checking if database has full-text version
 */
export interface DBPaperWithFullText extends SourceContent {
  fullText?: string | null;
}

/**
 * Type guard for DBPaperWithFullText
 * Phase 10.943 AUDIT FIX: Enhanced validation to check for content and fullText
 */
export function isDBPaperWithFullText(source: unknown): source is DBPaperWithFullText {
  if (typeof source !== 'object' || source === null) {
    return false;
  }
  const obj = source as Record<string, unknown>;
  // Verify required SourceContent properties plus optional fullText
  return (
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string'
  );
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cached theme extraction result
 * Stores themes with timestamp for TTL checking
 */
export interface CachedThemeData {
  data: UnifiedTheme[];
  timestamp: number;
}

// ============================================================================
// Progress Message Types
// ============================================================================
// NOTE: TransparentProgressMessage is defined in unified-theme-extraction.service.ts
// to avoid circular dependencies. Do not duplicate here.

// ============================================================================
// Extraction Result Types
// ============================================================================

/**
 * Theme merge source group
 * Used in mergeThemesFromSources for grouping themes by source type
 */
export interface ThemeMergeSourceGroup {
  type: SourceType;
  themes: DeduplicatableTheme[];
  sourceIds: string[];
}

/**
 * Minimal theme interface for deduplication
 * Used for themes from heterogeneous sources before full unification
 */
export interface DeduplicatableTheme {
  label: string;
  keywords: string[];
  weight: number;
  sourceIndices?: number[];
}

/**
 * Theme with sources tracking for merge operation
 */
export interface ThemeWithSources extends DeduplicatableTheme {
  sources?: Array<{ type: string; ids: string[] }>;
}

// ============================================================================
// Influential Source Report Types
// ============================================================================

/**
 * Influential source summary for provenance reports
 * Phase 10.943: type is string to match Prisma schema
 */
export interface InfluentialSourceSummary {
  source: string;
  type: string; // Prisma returns string, not SourceType union
  influence: number;
  url: string | null; // Allow null to match Prisma
}

/**
 * Theme provenance report structure
 */
export interface ThemeProvenanceReport {
  theme: {
    id: string;
    label: string;
    description?: string | null;
    keywords: string[];
    confidence: number;
  };
  sources: PrismaThemeSourceRelation[];
  statistics: {
    sourceBreakdown: {
      paper: number;
      youtube: number;
      podcast: number;
      social: number;
    };
    sourceCounts: {
      papers: number;
      videos: number;
      podcasts: number;
      social: number;
    };
    influentialSources: InfluentialSourceSummary[];
    citationChain: string[];
    extractionMethod: string;
    confidence: number;
  };
}

// ============================================================================
// Study Comparison Types
// ============================================================================

/**
 * Common theme across studies
 */
export interface CommonTheme {
  label: string;
  occurrences: number;
  studies: string[];
}

/**
 * Unique theme with study attribution
 */
export interface UniqueThemeWithStudy extends UnifiedTheme {
  studyId: string;
}

/**
 * Study themes comparison result
 */
export interface StudyThemesComparison {
  commonThemes: CommonTheme[];
  uniqueThemes: UniqueThemeWithStudy[];
  themesByStudy: Record<string, UnifiedTheme[]>;
}

// ============================================================================
// Transcript Types
// ============================================================================

/**
 * Timestamped text segment from video/podcast transcript
 */
export interface TimestampedTextSegment {
  timestamp: number;
  text: string;
}

/**
 * Video transcript with timestamped segments
 */
export interface VideoTranscript {
  id: string;
  title: string;
  transcript: string;
  timestampedText?: TimestampedTextSegment[];
  url?: string;
  sourceId?: string;
  channel?: string;
  duration?: number;
}

// ============================================================================
// Gateway Interface (for type-safe injection)
// ============================================================================

/**
 * Theme extraction gateway interface
 * Used for type-safe gateway injection without circular imports
 * Phase 10.943: details uses Record<string, unknown> since TransparentProgressMessage
 * is defined in the service to avoid circular dependencies
 */
export interface IThemeExtractionGateway {
  emitProgress(progress: {
    userId: string;
    stage: string;
    percentage: number;
    message: string;
    details?: Record<string, unknown>;
  }): void;
  emitError(userId: string, error: string): void;
  emitComplete(userId: string, themesCount: number): void;
}

// ============================================================================
// Batch Processing Types
// ============================================================================

/**
 * Batch save result for paper processing
 */
export interface BatchSaveResult {
  success: boolean;
  paperId?: string;
  error?: string;
}

/**
 * Type guard for successful batch result
 * Phase 10.943 AUDIT FIX: Returns proper type guard for type narrowing
 */
export function isBatchSaveSuccess(
  result: PromiseSettledResult<BatchSaveResult>
): result is PromiseFulfilledResult<BatchSaveResult & { success: true }> {
  return result.status === 'fulfilled' && result.value.success === true;
}

// ============================================================================
// Extraction Result Types
// ============================================================================

/**
 * Result of single source extraction
 * Used in batch extraction to track success/failure
 */
export interface SingleSourceExtractionResult {
  success: boolean;
  themes: DeduplicatableTheme[];
  source: SourceContent;
  error?: string;
}

/**
 * Type guard for successful extraction result
 */
export function isSuccessfulExtraction(
  result: PromiseSettledResult<SingleSourceExtractionResult>
): result is PromiseFulfilledResult<SingleSourceExtractionResult & { success: true }> {
  return result.status === 'fulfilled' && result.value.success === true;
}

// ============================================================================
// Extraction Provenance Map
// ============================================================================

/**
 * Provenance map for extraction results
 */
export type ProvenanceMap = Record<string, ThemeProvenance>;

// ============================================================================
// Batch Extraction Statistics
// ============================================================================

/**
 * Statistics for batch theme extraction operations
 * Used by BatchExtractionOrchestratorService and UnifiedThemeExtractionService
 */
export interface BatchExtractionStats {
  /** Total number of sources to process */
  totalSources: number;
  /** Number of sources successfully processed */
  successfulSources: number;
  /** Number of sources that failed processing */
  failedSources: number;
  /** Number of cache hits during processing */
  cacheHits: number;
  /** Number of cache misses during processing */
  cacheMisses: number;
  /** Array of processing times for each source in milliseconds */
  processingTimes: number[];
  /** Array of errors encountered during processing */
  errors: Array<{ sourceTitle: string; error: string }>;
}
