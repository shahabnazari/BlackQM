/**
 * Content Analysis Utility - Phase 10.180
 *
 * Netflix-grade content analysis that distinguishes between:
 * - READY: Content already fetched (fullText or abstract present)
 * - AVAILABLE: Content can be fetched (hasFullText=true, not yet fetched)
 * - UNAVAILABLE: No content source identified
 *
 * Phase 10.180 CRITICAL FIX: Now considers hasFullText detection flag,
 * not just fetched content. This allows theme extraction to show
 * accurate stats before fetching content.
 *
 * @module content-analysis
 * @since Phase 10.95
 * @updated Phase 10.180 - Netflix-grade availability tracking
 */

import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';
import { ContentType, classifyContentType, MIN_ABSTRACT_OVERFLOW_WORDS } from '@/lib/types/content-types';

/** Minimum full-text length threshold (150 characters) */
const FULLTEXT_MIN_LENGTH = 150;

/** Cached regex for word splitting (performance optimization - avoids regex compilation per paper) */
const WORD_SPLIT_REGEX = /\s+/;

/**
 * Content availability status for a paper
 * Phase 10.180: Netflix-grade status tracking
 */
export type ContentAvailabilityStatus =
  | 'ready'        // Content already fetched (fullText or abstract present)
  | 'available'    // Full-text detected but not yet fetched
  | 'unavailable'; // No content source identified

/**
 * Content analysis result interface
 * Phase 10.180: Extended with availability tracking
 */
export interface ContentAnalysisResult {
  // === READY CONTENT (already fetched) ===
  fullTextCount: number;           // Papers with fullText content present
  abstractOverflowCount: number;   // Papers with long abstracts (250+ words)
  abstractCount: number;           // Papers with standard abstracts

  // === AVAILABLE CONTENT (can be fetched) ===
  /** Phase 10.180: Papers with hasFullText=true but content not yet fetched */
  fullTextAvailableCount: number;

  // === UNAVAILABLE ===
  noContentCount: number;          // No content and no availability detected

  // === SUMMARY STATS ===
  avgContentLength: number;
  hasFullTextContent: boolean;
  sources: SourceContent[];
  totalSelected: number;
  /** Total with content READY (already fetched) */
  totalWithContent: number;
  /** Phase 10.180: Total that CAN have content (ready + available) */
  totalWithContentAvailable: number;
  totalSkipped: number;
  /** Phase 10.180: Papers pending full-text fetch */
  totalPendingFetch: number;

  selectedPapersList: Array<{
    id: string;
    title: string;
    hasContent: boolean;
    contentType: ContentType;
    contentLength: number;
    /** Phase 10.180: Availability status for UI display */
    availabilityStatus: ContentAvailabilityStatus;
    skipReason?: string;
  }>;
}

/**
 * Analyze papers to generate content statistics
 *
 * Phase 10.180: Netflix-grade analysis that tracks AVAILABILITY, not just fetched content.
 * This allows the UI to show accurate stats: "X papers ready, Y papers can be fetched"
 *
 * @param papers - Array of papers to analyze
 * @returns Content analysis result or null if no papers
 */
export function analyzeContentForExtraction(
  papers: LiteraturePaper[]
): ContentAnalysisResult | null {
  if (!papers || papers.length === 0) return null;

  // === COUNTERS (single-pass) ===
  let fullTextCount = 0;           // Content already fetched (fullText field populated)
  let abstractOverflowCount = 0;   // Long abstracts (250+ words)
  let abstractCount = 0;           // Standard abstracts
  let fullTextAvailableCount = 0;  // Phase 10.180: hasFullText=true but not fetched
  let noContentCount = 0;          // No content and no availability
  let abstractLengthSum = 0;

  const sources: SourceContent[] = [];
  const selectedPapersList: ContentAnalysisResult['selectedPapersList'] = [];

  for (const p of papers) {
    if (!p) continue;

    // Check what content is READY (already fetched)
    const content = p.fullText || p.abstract || '';
    const hasFullTextFetched = !!(p.fullText && p.fullText.length > FULLTEXT_MIN_LENGTH);

    // Phase 10.180: Check what content is AVAILABLE (can be fetched)
    // hasFullText flag is set by IntelligentFullTextDetectionService
    const hasFullTextAvailable = !!(p.hasFullText && !hasFullTextFetched);

    // Determine availability status
    let availabilityStatus: ContentAvailabilityStatus;

    // Categorize paper with Netflix-grade precision
    if (hasFullTextFetched) {
      // READY: Full-text already downloaded
      fullTextCount++;
      availabilityStatus = 'ready';
    } else if (p.abstract) {
      // READY: Abstract available from API
      const wordCount = p.abstract.trim().split(WORD_SPLIT_REGEX).length;
      if (wordCount >= MIN_ABSTRACT_OVERFLOW_WORDS) {
        abstractOverflowCount++;
      } else {
        abstractCount++;
      }
      abstractLengthSum += p.abstract.length;
      availabilityStatus = 'ready';
    } else if (hasFullTextAvailable) {
      // AVAILABLE: Full-text detected but not yet fetched
      // Phase 10.180: This is the critical fix - these papers CAN have content
      fullTextAvailableCount++;
      availabilityStatus = 'available';
    } else {
      // UNAVAILABLE: No content source identified
      noContentCount++;
      availabilityStatus = 'unavailable';
    }

    // Build selectedPapersList entry with availability status
    // Phase 10.180: exactOptionalPropertyTypes compliance - conditionally add skipReason
    if (p.id && p.title) {
      const paperEntry: ContentAnalysisResult['selectedPapersList'][number] = {
        id: p.id,
        title: p.title,
        hasContent: content.length > 0,
        contentType: classifyContentType(content, hasFullTextFetched),
        contentLength: content.length,
        availabilityStatus,
      };
      // Only add skipReason for unavailable papers (exactOptionalPropertyTypes compliance)
      if (availabilityStatus === 'unavailable') {
        paperEntry.skipReason = 'No abstract from API and no full-text source detected';
      }
      selectedPapersList.push(paperEntry);
    }

    // Build source entry for papers with READY content
    // Phase 10.180: Papers with 'available' status will be fetched before extraction
    if (p.abstract || p.fullText) {
      const source: SourceContent = {
        id: p.id,
        title: p.title || 'Untitled',
        content,
        type: 'paper',
        authors: p.authors || [],
        year: p.year,
        keywords: p.keywords || [],
      };
      if (p.doi) source.doi = p.doi;
      sources.push(source);
    }
  }

  // Calculate summary stats
  const abstractOnlyCount = abstractOverflowCount + abstractCount;
  const avgLength = abstractOnlyCount > 0 ? abstractLengthSum / abstractOnlyCount : 0;
  const totalReady = fullTextCount + abstractOnlyCount;

  return {
    // Ready content
    fullTextCount,
    abstractOverflowCount,
    abstractCount,

    // Available content (Phase 10.180)
    fullTextAvailableCount,

    // Unavailable
    noContentCount,

    // Summary stats
    avgContentLength: Math.round(avgLength),
    hasFullTextContent: fullTextCount > 0,
    sources,
    totalSelected: papers.length,
    totalWithContent: totalReady,
    // Phase 10.180: Total that CAN have content (ready + available to fetch)
    totalWithContentAvailable: totalReady + fullTextAvailableCount,
    totalSkipped: noContentCount,
    // Phase 10.180: Papers that need full-text fetch before extraction
    totalPendingFetch: fullTextAvailableCount,
    selectedPapersList,
  };
}
