/**
 * Content Analysis Utility - Phase 10.95
 *
 * Extracts content analysis logic from ThemeExtractionContainer
 * for better code organization and component size compliance.
 *
 * @module content-analysis
 * @since Phase 10.95
 */

import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';
import { ContentType, classifyContentType, MIN_ABSTRACT_OVERFLOW_WORDS } from '@/lib/types/content-types';

/** Minimum full-text length threshold (150 characters) */
const FULLTEXT_MIN_LENGTH = 150;

/** Cached regex for word splitting (performance optimization - avoids regex compilation per paper) */
const WORD_SPLIT_REGEX = /\s+/;

/**
 * Content analysis result interface
 */
export interface ContentAnalysisResult {
  fullTextCount: number;
  abstractOverflowCount: number;
  abstractCount: number;
  noContentCount: number;
  avgContentLength: number;
  hasFullTextContent: boolean;
  sources: SourceContent[];
  totalSelected: number;
  totalWithContent: number;
  totalSkipped: number;
  selectedPapersList: Array<{
    id: string;
    title: string;
    hasContent: boolean;
    contentType: ContentType;
    contentLength: number;
    skipReason?: string;
  }>;
}

/**
 * Analyze papers to generate content statistics
 *
 * @param papers - Array of papers to analyze
 * @returns Content analysis result or null if no papers
 */
export function analyzeContentForExtraction(
  papers: LiteraturePaper[]
): ContentAnalysisResult | null {
  if (!papers || papers.length === 0) return null;

  // TRUE single-pass: build all data structures in one iteration
  let fullTextCount = 0;
  let abstractOverflowCount = 0;
  let abstractCount = 0;
  let noContentCount = 0;
  let abstractLengthSum = 0;

  const sources: SourceContent[] = [];
  const selectedPapersList: ContentAnalysisResult['selectedPapersList'] = [];

  for (const p of papers) {
    if (!p) continue;

    const content = p.fullText || p.abstract || '';
    const hasFullText = !!(p.fullText && p.fullText.length > FULLTEXT_MIN_LENGTH);

    // Categorize paper
    if (hasFullText) {
      fullTextCount++;
    } else if (p.abstract) {
      const wordCount = p.abstract.trim().split(WORD_SPLIT_REGEX).length;
      if (wordCount >= MIN_ABSTRACT_OVERFLOW_WORDS) {
        abstractOverflowCount++;
      } else {
        abstractCount++;
      }
      abstractLengthSum += p.abstract.length;
    } else {
      noContentCount++;
    }

    // Build selectedPapersList entry
    if (p.id && p.title) {
      selectedPapersList.push({
        id: p.id,
        title: p.title,
        hasContent: content.length > 0,
        contentType: classifyContentType(content, hasFullText),
        contentLength: content.length,
      });
    }

    // Build source entry (only if has content)
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

  const abstractOnlyCount = abstractOverflowCount + abstractCount;
  const avgLength = abstractOnlyCount > 0 ? abstractLengthSum / abstractOnlyCount : 0;

  return {
    fullTextCount,
    abstractOverflowCount,
    abstractCount,
    noContentCount,
    avgContentLength: Math.round(avgLength),
    hasFullTextContent: fullTextCount > 0,
    sources,
    totalSelected: papers.length,
    totalWithContent: fullTextCount + abstractOnlyCount,
    totalSkipped: noContentCount,
    selectedPapersList,
  };
}
