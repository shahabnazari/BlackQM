/**
 * Content Type Definitions - Single Source of Truth
 *
 * Purpose: Shared type definitions for content classification (papers & videos)
 * Used by: Theme extraction workflow, content validation, handlers
 *
 * DEFINITIONS:
 * - FULL_TEXT: Complete article text (3000-15000 words) from full PDF/HTML extraction
 * - ABSTRACT_OVERFLOW: Long abstract (250-500 words) - better than normal abstract but NOT full-text
 * - ABSTRACT: Normal abstract (<250 words)
 * - VIDEO_TRANSCRIPT: Video transcript content (YouTube, TikTok, Instagram)
 * - NONE: No content available
 */

/**
 * Content Type Enum
 *
 * Use this enum instead of string literals throughout the codebase
 */
export enum ContentType {
  FULL_TEXT = 'full_text',
  ABSTRACT_OVERFLOW = 'abstract_overflow',
  ABSTRACT = 'abstract',
  VIDEO_TRANSCRIPT = 'video_transcript',
  NONE = 'none',
}

/**
 * Content Type Constants
 *
 * These thresholds determine content classification
 */
export const MIN_FULL_TEXT_WORDS = 3000;
export const MIN_ABSTRACT_OVERFLOW_WORDS = 250;
export const MIN_ABSTRACT_WORDS = 50;

/**
 * Type Guards
 *
 * Use these to check content types safely
 */
export function isFullText(contentType: ContentType): boolean {
  return contentType === ContentType.FULL_TEXT;
}

export function isAbstractOverflow(contentType: ContentType): boolean {
  return contentType === ContentType.ABSTRACT_OVERFLOW;
}

export function isAbstract(contentType: ContentType): boolean {
  return contentType === ContentType.ABSTRACT;
}

export function hasContent(contentType: ContentType): boolean {
  return contentType !== ContentType.NONE;
}

export function isVideoTranscript(contentType: ContentType): boolean {
  return contentType === ContentType.VIDEO_TRANSCRIPT;
}

/**
 * Content Type Classifier
 *
 * Determines content type based on text and metadata
 *
 * @param text - The content text (abstract or full-text)
 * @param hasFullText - Flag indicating if full-text was successfully extracted
 * @returns ContentType classification
 *
 * @example
 * ```typescript
 * // Full-text paper
 * classifyContentType(paper.fullText, true) // Returns ContentType.FULL_TEXT
 *
 * // Long abstract (300 words)
 * classifyContentType(paper.abstract, false) // Returns ContentType.ABSTRACT_OVERFLOW
 *
 * // Short abstract (150 words)
 * classifyContentType(paper.abstract, false) // Returns ContentType.ABSTRACT
 *
 * // No content
 * classifyContentType(undefined, false) // Returns ContentType.NONE
 * ```
 */
export function classifyContentType(
  text: string | undefined,
  hasFullText: boolean
): ContentType {
  // Handle missing or empty text
  if (!text || text.trim().length === 0) {
    return ContentType.NONE;
  }

  // If full-text extraction succeeded, it's definitely full-text
  if (hasFullText) {
    return ContentType.FULL_TEXT;
  }

  // ✅ FIXED (Audit): Trim whitespace before counting words to avoid inflated counts
  // Otherwise, classify based on word count
  const trimmedText = text.trim();
  const wordCount = trimmedText.split(/\s+/).length;

  if (wordCount >= MIN_ABSTRACT_OVERFLOW_WORDS) {
    return ContentType.ABSTRACT_OVERFLOW;
  }

  if (wordCount >= MIN_ABSTRACT_WORDS) {
    return ContentType.ABSTRACT;
  }

  return ContentType.NONE;
}

/**
 * Content Statistics Interface
 *
 * Used for aggregating content type counts
 */
export interface ContentStats {
  fullTextCount: number;
  abstractOverflowCount: number;
  abstractCount: number;
  noContentCount: number;
  totalCount: number;
}

/**
 * Content Analysis Helper
 *
 * Analyzes an array of items with content types and returns statistics
 *
 * @param contents - Array of objects with contentType property
 * @returns ContentStats object with counts
 *
 * @example
 * ```typescript
 * const sources = [
 *   { contentType: ContentType.FULL_TEXT },
 *   { contentType: ContentType.ABSTRACT_OVERFLOW },
 *   { contentType: ContentType.ABSTRACT },
 * ];
 *
 * const stats = analyzeContentTypes(sources);
 * // Returns: { fullTextCount: 1, abstractOverflowCount: 1, abstractCount: 1, noContentCount: 0, totalCount: 3 }
 * ```
 */
export function analyzeContentTypes(
  contents: Array<{ contentType: ContentType }>
): ContentStats {
  return contents.reduce(
    (stats, item) => {
      switch (item.contentType) {
        case ContentType.FULL_TEXT:
          stats.fullTextCount++;
          break;
        case ContentType.ABSTRACT_OVERFLOW:
          stats.abstractOverflowCount++;
          break;
        case ContentType.ABSTRACT:
          stats.abstractCount++;
          break;
        case ContentType.NONE:
          stats.noContentCount++;
          break;
      }
      stats.totalCount++;
      return stats;
    },
    {
      fullTextCount: 0,
      abstractOverflowCount: 0,
      abstractCount: 0,
      noContentCount: 0,
      totalCount: 0,
    }
  );
}

/**
 * Content Quality Score
 *
 * Returns a quality score (0-100) based on content type
 * Used for prioritizing papers in theme extraction
 *
 * @param contentType - The content type to score
 * @returns Quality score (0-100)
 *
 * @example
 * ```typescript
 * getContentQualityScore(ContentType.FULL_TEXT) // Returns 100
 * getContentQualityScore(ContentType.ABSTRACT_OVERFLOW) // Returns 60
 * getContentQualityScore(ContentType.ABSTRACT) // Returns 30
 * getContentQualityScore(ContentType.NONE) // Returns 0
 * ```
 */
export function getContentQualityScore(contentType: ContentType): number {
  switch (contentType) {
    case ContentType.FULL_TEXT:
      return 100;
    case ContentType.VIDEO_TRANSCRIPT:
      return 80; // High quality - full spoken content
    case ContentType.ABSTRACT_OVERFLOW:
      return 60;
    case ContentType.ABSTRACT:
      return 30;
    case ContentType.NONE:
      return 0;
    default:
      return 0;
  }
}

/**
 * Content Type Display Name
 *
 * Returns human-readable name for content type
 *
 * @param contentType - The content type
 * @returns Display name
 */
export function getContentTypeDisplayName(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.FULL_TEXT:
      return 'Full Text';
    case ContentType.VIDEO_TRANSCRIPT:
      return 'Video Transcript';
    case ContentType.ABSTRACT_OVERFLOW:
      return 'Extended Abstract';
    case ContentType.ABSTRACT:
      return 'Abstract Only';
    case ContentType.NONE:
      return 'No Content';
    default:
      return 'Unknown';
  }
}

/**
 * Content Type Description
 *
 * Returns detailed description for content type
 *
 * @param contentType - The content type
 * @returns Description
 */
export function getContentTypeDescription(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.FULL_TEXT:
      return 'Complete article text (3000+ words) - highest quality for theme extraction';
    case ContentType.VIDEO_TRANSCRIPT:
      return 'Full video transcript - high quality spoken content for theme extraction';
    case ContentType.ABSTRACT_OVERFLOW:
      return 'Extended abstract (250-500 words) - better than standard abstract but not full article';
    case ContentType.ABSTRACT:
      return 'Standard abstract (<250 words) - limited content for theme extraction';
    case ContentType.NONE:
      return 'No content available - cannot be used for theme extraction';
    default:
      return 'Unknown content type';
  }
}
