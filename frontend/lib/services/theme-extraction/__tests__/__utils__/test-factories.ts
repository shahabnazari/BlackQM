/**
 * Test Data Factories - Phase 10.93 Day 3
 *
 * Enterprise-grade test utilities for generating mock data
 *
 * @module theme-extraction/__tests__/__utils__/test-factories
 * @since Phase 10.93 Day 3
 *
 * **Factories:**
 * - Paper factory (full-text, abstract-only, minimal)
 * - Map factory (paper ID mappings)
 * - Validation result factory
 * - Error factory
 *
 * **Usage:**
 * ```ts
 * import { createMockPaper, createMockPaperIdMap } from './__utils__/test-factories';
 *
 * const paper = createMockPaper({ hasFullText: true });
 * const idMap = createMockPaperIdMap(10);
 * ```
 */

import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type {
  ValidationResult,
  FullTextExtractionResult,
  BatchSaveResult,
  MetadataRefreshResult,
} from '../../types';

/**
 * Create a mock paper with optional overrides
 *
 * @param overrides - Partial paper object to override defaults
 * @returns Complete mock paper object
 */
export function createMockPaper(
  overrides: Partial<LiteraturePaper> = {}
): LiteraturePaper {
  const id = overrides.id || `paper-${Math.random().toString(36).slice(2, 11)}`;

  const base: LiteraturePaper = {
    id,
    title: overrides.title || `Test Paper ${id}`,
    authors: overrides.authors || ['Author One', 'Author Two'],
    abstract: overrides.abstract || 'This is a test abstract with sufficient length for validation purposes.',
    year: overrides.year || 2024,
    source: overrides.source || 'PubMed',
    doi: overrides.doi || `10.1000/test.${id}`,
    url: overrides.url || `https://example.com/paper/${id}`,
    venue: overrides.venue || 'Test Journal',
    citationCount: overrides.citationCount || 10,
    keywords: overrides.keywords || ['test', 'mock', 'paper'],
    hasFullText: overrides.hasFullText ?? false,
    fullTextStatus: overrides.fullTextStatus || 'not_fetched',
    ...overrides,
  };

  // Conditionally add optional properties only if defined in overrides
  if (overrides.fullTextWordCount !== undefined) {
    base.fullTextWordCount = overrides.fullTextWordCount;
  }
  if (overrides.pdfUrl !== undefined) {
    base.pdfUrl = overrides.pdfUrl;
  }

  return base;
}

/**
 * Create a paper with full-text content
 */
export function createMockPaperWithFullText(
  overrides: Partial<LiteraturePaper> = {}
): LiteraturePaper {
  return createMockPaper({
    hasFullText: true,
    fullTextStatus: 'success',
    fullTextWordCount: 5000,
    pdfUrl: 'https://example.com/fulltext.pdf',
    ...overrides,
  });
}

/**
 * Create a paper with abstract only (no full-text)
 * Abstract will have >250 words (9 words × 30 = 270 words)
 */
export function createMockPaperWithAbstractOnly(
  overrides: Partial<LiteraturePaper> = {}
): LiteraturePaper {
  return createMockPaper({
    hasFullText: false,
    fullTextStatus: 'failed',
    abstract: 'This is an abstract with more than 250 words. '.repeat(30),
    ...overrides,
  });
}

/**
 * Create a minimal paper (no abstract, no full-text)
 */
export function createMockMinimalPaper(
  overrides: Partial<LiteraturePaper> = {}
): LiteraturePaper {
  return createMockPaper({
    abstract: '',
    hasFullText: false,
    fullTextStatus: 'not_fetched',
    ...overrides,
  });
}

/**
 * Create multiple mock papers
 *
 * @param count - Number of papers to create
 * @param overrides - Shared overrides for all papers
 * @returns Array of mock papers
 */
export function createMockPapers(
  count: number,
  overrides: Partial<LiteraturePaper> = {}
): LiteraturePaper[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPaper({
      id: `paper-${i + 1}`,
      title: `Test Paper ${i + 1}`,
      ...overrides,
    })
  );
}

/**
 * Create a Map of paper IDs (original → database)
 *
 * @param count - Number of ID pairs to create
 * @returns Map of original IDs to database IDs
 */
export function createMockPaperIdMap(count: number): Map<string, string> {
  const map = new Map<string, string>();

  for (let i = 1; i <= count; i++) {
    const originalId = `original-${i}`;
    const dbId = `db-uuid-${i}-${Math.random().toString(36).slice(2, 11)}`;
    map.set(originalId, dbId);
  }

  return map;
}

/**
 * Create a mock validation result
 *
 * @param overrides - Partial validation result to override defaults
 * @returns Complete validation result
 */
export function createMockValidationResult(
  overrides: Partial<ValidationResult> = {}
): ValidationResult {
  const base: ValidationResult = {
    valid: overrides.valid ?? true,
    totalSources: overrides.totalSources ?? 10,
    selectedPapers: overrides.selectedPapers ?? 8,
    transcribedVideos: overrides.transcribedVideos ?? 2,
  };

  if (overrides.error !== undefined) {
    base.error = overrides.error;
  }

  return base;
}

/**
 * Create a mock full-text extraction result
 *
 * @param overrides - Partial extraction result to override defaults
 * @returns Complete extraction result
 */
export function createMockFullTextExtractionResult(
  overrides: Partial<FullTextExtractionResult> = {}
): FullTextExtractionResult {
  const totalCount = overrides.totalCount || 10;
  const successCount = overrides.successCount ?? totalCount;
  const failedCount = overrides.failedCount ?? 0;

  return {
    totalCount,
    successCount,
    failedCount,
    updatedPapers: overrides.updatedPapers || createMockPapers(successCount, { hasFullText: true }),
    failedPaperIds: overrides.failedPaperIds || [],
    ...overrides,
  };
}

/**
 * Create a mock batch save result
 *
 * @param overrides - Partial save result to override defaults
 * @returns Complete batch save result
 */
export function createMockBatchSaveResult(
  overrides: Partial<BatchSaveResult> = {}
): BatchSaveResult {
  const savedCount = overrides.savedCount || 10;
  const idMap = overrides.savedPaperIds || createMockPaperIdMap(savedCount);

  return {
    savedCount,
    skippedCount: overrides.skippedCount || 0,
    failedCount: overrides.failedCount || 0,
    failedPapers: overrides.failedPapers || [],
    savedPaperIds: idMap,
    ...overrides,
  };
}

/**
 * Create a mock metadata refresh result
 *
 * @param overrides - Partial refresh result to override defaults
 * @returns Complete metadata refresh result
 */
export function createMockMetadataRefreshResult(
  overrides: Partial<MetadataRefreshResult> = {}
): MetadataRefreshResult {
  const refreshed = overrides.refreshed || 5;

  return {
    refreshed,
    failed: overrides.failed || 0,
    papers: overrides.papers || createMockPapers(refreshed),
    ...overrides,
  };
}

/**
 * Create an AbortController for testing cancellation
 *
 * @returns AbortController instance
 */
export function createMockAbortController(): AbortController {
  return new AbortController();
}

/**
 * Create a mock progress callback that tracks calls
 *
 * DAY 4 UPDATE: Updated to use new FullTextProgressInfo signature
 *
 * @returns Object with callback function and call history
 */
export function createMockProgressCallback() {
  const calls: Array<{
    completed: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining?: string;
    averageTimePerPaper?: number;
  }> = [];

  const callback = (progress: {
    completed: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining?: string;
    averageTimePerPaper?: number;
  }): void => {
    calls.push(progress);
  };

  return {
    callback,
    calls,
    getLastCall: () => calls[calls.length - 1],
    getCallCount: () => calls.length,
    reset: () => calls.splice(0, calls.length),
  };
}

/**
 * Wait for a specific amount of time (for async testing)
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock error with specific properties
 *
 * @param message - Error message
 * @param context - Additional error context (type-safe)
 * @returns Error instance with additional properties
 */
export function createMockError<T extends Record<string, unknown>>(
  message: string,
  context?: T
): Error & T {
  const error = new Error(message) as Error & T;
  if (context) {
    Object.assign(error, context);
  }
  return error;
}

/**
 * Create a mock content analysis result
 *
 * Creates realistic defaults including mock sources to prevent "no content" workflow errors.
 *
 * @param overrides - Partial content analysis to override defaults
 * @returns Complete content analysis result
 */
export function createMockContentAnalysis(
  overrides: Partial<import('../../types').ContentAnalysis> = {}
): import('../../types').ContentAnalysis {
  const fullTextCount = overrides.fullTextCount ?? 5;
  const abstractOverflowCount = overrides.abstractOverflowCount ?? 2;
  const abstractCount = overrides.abstractCount ?? 1;
  const noContentCount = overrides.noContentCount ?? 0;
  const totalSelected = fullTextCount + abstractOverflowCount + abstractCount + noContentCount;

  // Create default mock sources to prevent "no sources" errors in workflows
  // Each source represents a paper with content
  const defaultSources = Array.from({ length: totalSelected - noContentCount }, (_, i) => ({
    type: 'paper' as const,
    id: `mock-paper-${i + 1}`,
    title: `Mock Paper ${i + 1}`,
    content: `Mock content for paper ${i + 1}. `.repeat(50), // ~250 words
  }));

  const defaultSelectedPapersList = Array.from({ length: totalSelected }, (_, i) => {
    const hasContent = i < totalSelected - noContentCount;
    const paper: any = {
      id: `mock-paper-${i + 1}`,
      title: `Mock Paper ${i + 1}`,
      hasContent,
      contentType: hasContent ? ('full_text' as any) : ('none' as any),
      contentLength: hasContent ? 1000 : 0,
    };

    // Only add skipReason if there's no content (exactOptionalPropertyTypes compliance)
    if (!hasContent) {
      paper.skipReason = 'No content available';
    }

    return paper;
  });

  return {
    fullTextCount,
    abstractOverflowCount,
    abstractCount,
    noContentCount,
    avgContentLength: overrides.avgContentLength ?? 5000,
    hasFullTextContent: overrides.hasFullTextContent ?? fullTextCount > 0,
    sources: overrides.sources ?? (defaultSources as any),
    totalSelected: overrides.totalSelected ?? totalSelected,
    totalWithContent: overrides.totalWithContent ?? (fullTextCount + abstractOverflowCount + abstractCount),
    totalSkipped: overrides.totalSkipped ?? noContentCount,
    selectedPapersList: overrides.selectedPapersList ?? defaultSelectedPapersList,
    ...overrides,
  };
}
