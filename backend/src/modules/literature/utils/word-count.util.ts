/**
 * Word Count Utility for Academic Papers
 *
 * Phase 10 Day 5.13+ Enhancement:
 * Calculates word count excluding references section based on academic standards.
 *
 * Academic Standard Research Findings:
 * - Typical research article: 3,000-5,000 words (excluding references)
 * - Minimum acceptable: 1,000 words for substantive content
 * - Word count excludes: abstract, references, title page, bibliography
 *
 * References:
 * - SAGE JPX Guidelines: 3,000 words excluding abstract and references
 * - PMC Author Instructions: Similar exclusion standards
 * - Academia Stack Exchange: Consensus on reference exclusion
 */

/**
 * Common section markers to exclude from word count
 * Supports multiple languages and citation formats
 *
 * Phase 10 Day 5.13+ Extension: Expanded to include all non-content sections
 * Excludes: references, bibliography, indexes, glossaries, appendices, acknowledgments
 */
const EXCLUDED_SECTION_MARKERS = [
  // References & Bibliography (English)
  'references',
  'bibliography',
  'works cited',
  'literature cited',
  'cited literature',
  'works consulted',
  'further reading',
  'reference list',
  'bibliographic references',
  'list of references',

  // Indexes
  'index',
  'subject index',
  'author index',
  'keyword index',

  // Glossaries
  'glossary',
  'glossary of terms',
  'terminology',

  // Appendices
  'appendix',
  'appendices',
  'supplementary material',
  'supplementary materials',
  'supporting information',

  // Acknowledgments
  'acknowledgments',
  'acknowledgements',
  'acknowledgment',
  'acknowledgement',

  // Other non-content sections
  'about the author',
  'about the authors',
  'author contributions',
  'conflict of interest',
  'conflicts of interest',
  'funding',
  'funding statement',

  // Other languages - References
  'referências', // Portuguese
  'références', // French
  'literatur', // German
  'riferimenti', // Italian
  'referencias', // Spanish

  // Other languages - Appendices
  'apêndice', // Portuguese
  'apéndice', // Spanish
  'annexe', // French
  'anhang', // German
  'appendice', // Italian

  // Other languages - Glossary
  'glossário', // Portuguese
  'glosario', // Spanish
  'glossaire', // French
  'glossar', // German
];

/**
 * Calculate word count from text, excluding non-content sections
 *
 * Phase 10 Day 5.13+ Enhancement:
 * Excludes references, indexes, glossaries, appendices, acknowledgments, etc.
 *
 * @param text - Full text content (can be abstract, full paper, or combined content)
 * @param excludeNonContentSections - If true, exclude refs/indexes/glossaries (default: true)
 * @returns Word count excluding non-content sections
 */
export function calculateWordCount(
  text: string | undefined | null,
  excludeNonContentSections: boolean = true,
): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let contentToCount = text;

  if (excludeNonContentSections) {
    // Find the earliest excluded section (case-insensitive)
    const lowerText = text.toLowerCase();
    let earliestExcludedIndex = text.length;

    for (const marker of EXCLUDED_SECTION_MARKERS) {
      // Look for marker at start of line (with optional whitespace)
      const regex = new RegExp(`\\n\\s*${marker}\\s*\\n`, 'i');
      const match = lowerText.match(regex);

      if (
        match &&
        match.index !== undefined &&
        match.index < earliestExcludedIndex
      ) {
        earliestExcludedIndex = match.index;
      }

      // Also check for marker at very start of text
      if (lowerText.startsWith(marker)) {
        earliestExcludedIndex = 0;
      }
    }

    // Truncate text before excluded sections
    if (earliestExcludedIndex < text.length) {
      contentToCount = text.substring(0, earliestExcludedIndex);
    }
  }

  // Count words: split by whitespace and filter empty strings
  const words = contentToCount
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
}

/**
 * Calculate word count from abstract specifically
 * Abstracts typically don't have references, but we apply same logic for consistency
 *
 * @param abstract - Paper abstract text
 * @returns Word count
 */
export function calculateAbstractWordCount(
  abstract: string | undefined | null,
): number {
  return calculateWordCount(abstract, false);
}

/**
 * Calculate comprehensive word count for entire paper
 *
 * Phase 10 Day 5.13+ Enhancement:
 * Counts ALL content: title + abstract + full-text (when available)
 * Excludes: references, indexes, glossaries, appendices, acknowledgments
 *
 * @param title - Paper title
 * @param abstract - Paper abstract
 * @param fullText - Full-text content (optional, from PDF parsing)
 * @returns Total word count excluding non-content sections
 */
export function calculateComprehensiveWordCount(
  title: string | undefined | null,
  abstract: string | undefined | null,
  fullText?: string | undefined | null,
): number {
  // Combine all available content with space separators
  const combinedContent = [title || '', abstract || '', fullText || '']
    .filter((text) => text.length > 0)
    .join(' ');

  // Calculate word count excluding references, indexes, glossaries, appendices, etc.
  // Default behavior excludes non-content sections
  return calculateWordCount(combinedContent);
}

/**
 * Determine if a paper meets minimum eligibility threshold
 *
 * Academic Rationale:
 * - Papers < 1,000 words typically lack sufficient depth for theme extraction
 * - Short communications, letters, and editorials often excluded from reviews
 * - 1,000 words provides reasonable balance between inclusivity and quality
 *
 * @param wordCount - Word count of paper (excluding references)
 * @param minimumThreshold - Minimum words required (default: 1000)
 * @returns True if paper meets threshold
 */
export function isPaperEligible(
  wordCount: number,
  minimumThreshold: number = 1000,
): boolean {
  return wordCount >= minimumThreshold;
}

/**
 * Get word count category label for display
 *
 * @param wordCount - Word count
 * @returns Human-readable category label
 */
export function getWordCountCategory(wordCount: number): string {
  if (wordCount < 500) return 'Very Short';
  if (wordCount < 1000) return 'Short';
  if (wordCount < 3000) return 'Medium';
  if (wordCount < 5000) return 'Standard';
  if (wordCount < 8000) return 'Long';
  return 'Very Long';
}

/**
 * Format word count for display with label
 *
 * @param wordCount - Word count
 * @param showCategory - Include category label (default: false)
 * @returns Formatted string (e.g., "3,245 words" or "3,245 words (Standard)")
 */
export function formatWordCount(
  wordCount: number,
  showCategory: boolean = false,
): string {
  const formatted = wordCount.toLocaleString();
  const label = wordCount === 1 ? 'word' : 'words';

  if (showCategory) {
    const category = getWordCountCategory(wordCount);
    return `${formatted} ${label} (${category})`;
  }

  return `${formatted} ${label}`;
}

/**
 * Calculate estimated reading time in minutes
 * Average reading speed: 200-250 words per minute (academic papers)
 *
 * @param wordCount - Word count
 * @param wordsPerMinute - Reading speed (default: 225)
 * @returns Estimated minutes to read
 */
export function calculateReadingTime(
  wordCount: number,
  wordsPerMinute: number = 225,
): number {
  if (wordCount === 0) return 0;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format reading time for display
 *
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read" or "1.5 hrs read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min read';
  if (minutes < 60) return `${minutes} min read`;

  const hours = (minutes / 60).toFixed(1);
  return `${hours} hrs read`;
}
