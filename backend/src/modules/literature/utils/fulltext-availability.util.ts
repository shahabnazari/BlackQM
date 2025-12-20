/**
 * Phase 10.197: Full-Text Availability Utilities
 *
 * Centralized type guards and utility functions for determining
 * full-text availability across the application.
 *
 * ZERO-DEBT: Single source of truth for full-text checks
 * - Prevents logic divergence between frontend and backend
 * - Ensures consistent filtering behavior
 * - Handles all edge cases including undefined status and pdfUrl fallback
 *
 * @module fulltext-availability.util
 * @since Phase 10.197
 */

import type { Paper } from '../dto/literature.dto';

/**
 * Type guard to check if a paper has full-text available
 *
 * Uses a comprehensive check that covers all possible indicators:
 * 1. hasFullText boolean flag (set by detection service)
 * 2. fullTextStatus = 'available' (detected but not yet fetched)
 * 3. fullTextStatus = 'success' (successfully fetched)
 * 4. pdfUrl presence (direct PDF access implies full-text)
 *
 * @param paper - Paper object to check
 * @returns true if full-text is available, false otherwise
 *
 * @example
 * ```typescript
 * const papers = await searchPapers(query);
 * const fullTextPapers = papers.filter(isPaperWithFullText);
 * ```
 */
export function isPaperWithFullText(paper: Paper): boolean {
  return (
    paper.hasFullText === true ||
    paper.fullTextStatus === 'available' ||
    paper.fullTextStatus === 'success' ||
    (paper.pdfUrl !== null && paper.pdfUrl !== undefined && paper.pdfUrl.length > 0)
  );
}

/**
 * Filter papers to only include those with full-text available
 *
 * @param papers - Array of papers to filter
 * @returns Papers with full-text available
 */
export function filterPapersWithFullText<T extends Paper>(papers: T[]): T[] {
  return papers.filter(isPaperWithFullText);
}

/**
 * Calculate full-text availability statistics for a set of papers
 *
 * @param papers - Array of papers to analyze
 * @returns Statistics object with count, total, percentage, and isLow flag
 */
export function calculateFullTextStats(papers: Paper[]): {
  count: number;
  total: number;
  percentage: number;
  isLow: boolean;
} {
  if (papers.length === 0) {
    return { count: 0, total: 0, percentage: 0, isLow: false };
  }

  const fullTextCount = papers.filter(isPaperWithFullText).length;
  const percentage = Math.round((fullTextCount / papers.length) * 100);
  // Consider <40% as "low" - this threshold matters for theme extraction quality
  const isLow = percentage < 40 && papers.length >= 10;

  return {
    count: fullTextCount,
    total: papers.length,
    percentage,
    isLow,
  };
}

/**
 * Ensure paper has a valid fullTextStatus
 *
 * Sets default status if missing, and syncs hasFullText with status
 * for semantic consistency.
 *
 * @param paper - Paper to normalize (mutated in place)
 */
export function normalizeFullTextStatus(paper: Paper): void {
  // Set default status if missing
  if (!paper.fullTextStatus) {
    paper.fullTextStatus = 'not_fetched';
  }

  // Ensure consistency: if status indicates availability, set hasFullText
  if (
    (paper.fullTextStatus === 'available' || paper.fullTextStatus === 'success') &&
    paper.hasFullText !== true
  ) {
    paper.hasFullText = true;
  }

  // If pdfUrl present but no detection ran, mark as available
  if (
    paper.pdfUrl &&
    paper.pdfUrl.length > 0 &&
    paper.fullTextStatus === 'not_fetched' &&
    paper.hasFullText !== true
  ) {
    paper.hasFullText = true;
    paper.fullTextStatus = 'available';
  }
}
