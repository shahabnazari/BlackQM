/**
 * Type Definitions for Theme Extraction Services
 *
 * Enterprise-grade type safety for service layer
 * Phase 10.93 Day 1 - Service Layer Extraction
 *
 * @module theme-extraction/types
 */

import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';

/**
 * Paper save payload (subset of Paper type with required fields only)
 */
export interface PaperSavePayload {
  title: string;
  authors: string[];
  source: string;
  year?: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  keywords?: string[];
}

/**
 * Result of saving a single paper
 */
export interface PaperSaveResult {
  success: boolean;
  paperId: string;
  error?: string;
}

/**
 * Result of batch save operation
 */
export interface BatchSaveResult {
  savedCount: number;
  skippedCount: number;
  failedCount: number;
  failedPapers: Array<{ title: string; error: string }>;
  savedPaperIds: Map<string, string>; // originalId -> dbPaperId
}

/**
 * Result of metadata refresh operation
 */
export interface MetadataRefreshResult {
  refreshed: number;
  failed: number;
  papers: LiteraturePaper[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  totalSources: number;
  selectedPapers: number;
  transcribedVideos: number;
  error?: string;
}

/**
 * Stale paper detection result
 */
export interface StalePaperDetectionResult {
  totalPapers: number;
  stalePapers: LiteraturePaper[];
  upToDatePapers: number;
}

/**
 * Retry options for API calls
 */
export interface RetryOptions {
  maxRetries?: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (message: string) => void;

/**
 * Abort signal for cancellation support
 */
export type CancellationSignal = AbortSignal;
