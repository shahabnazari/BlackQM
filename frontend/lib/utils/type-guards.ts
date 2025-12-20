// Type Guards for Runtime Type Safety

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function assertDefined<T>(
  value: T | undefined | null,
  message?: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
}

export function assertString(
  value: unknown,
  message?: string
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || 'Value is not a string');
  }
}

// ============================================================================
// Phase 10.197: Full-Text Availability Type Guards
// ============================================================================

/**
 * Paper type for full-text checking (minimal interface)
 */
interface PaperForFullTextCheck {
  hasFullText?: boolean | null;
  fullTextStatus?: string | null;
  pdfUrl?: string | null;
}

/**
 * Type guard to check if a paper has full-text available
 *
 * Uses comprehensive check that covers all possible indicators:
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
 * const fullTextPapers = papers.filter(isPaperWithFullText);
 * ```
 */
export function isPaperWithFullText(paper: PaperForFullTextCheck): boolean {
  return (
    paper.hasFullText === true ||
    paper.fullTextStatus === 'available' ||
    paper.fullTextStatus === 'success' ||
    (paper.pdfUrl !== null && paper.pdfUrl !== undefined && paper.pdfUrl.length > 0)
  );
}

/**
 * Calculate full-text availability statistics for a set of papers
 *
 * @param papers - Array of papers to analyze
 * @returns Statistics object with count, total, percentage, and isLow flag
 */
export function calculateFullTextStats(papers: PaperForFullTextCheck[]): {
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
