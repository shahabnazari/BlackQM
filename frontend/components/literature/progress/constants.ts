/**
 * Shared Constants for Progress Components
 * Phase 10.91 Day 11 - Component Refactoring
 *
 * Centralized source display names and descriptions used across
 * all literature search progress indicators.
 *
 * @module progress/constants
 * @since Phase 10.91 Day 11
 */

/**
 * Source name mapping for display
 * Maps backend enum values to user-friendly names
 */
export const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  pubmed: 'PubMed',
  pmc: 'PMC (PubMed Central)',
  arxiv: 'ArXiv',
  semantic_scholar: 'Semantic Scholar',
  crossref: 'CrossRef',
  eric: 'ERIC',
  core: 'CORE',
  springer: 'SpringerLink Open Access',
  ssrn: 'SSRN',
  google_scholar: 'Google Scholar',
  web_of_science: 'Web of Science',
  scopus: 'Scopus',
  ieee_xplore: 'IEEE Xplore',
  nature: 'Nature',
  wiley: 'Wiley Online Library',
  sage: 'SAGE Publications',
  taylor_francis: 'Taylor & Francis',
};

/**
 * Source descriptions for tooltips
 * Explains database coverage and why a source might return 0 papers
 */
export const SOURCE_DESCRIPTIONS: Record<string, string> = {
  pubmed: 'Medical/life sciences (36M+ papers)',
  pmc: 'Free full-text biomedical articles (8M+ papers)',
  arxiv: 'Physics/Math/CS preprints (2M+ papers)',
  semantic_scholar: 'AI-powered academic search (200M+ papers)',
  crossref: 'DOI registry across all disciplines (150M+ records)',
  eric: 'Education research database (1.5M+ papers)',
  core: 'Open access aggregator from 10,000+ repositories (250M+ papers)',
  springer: 'Springer Nature open access publications (15M+ papers, Nature journals)',
  ssrn: 'Social science research network (1M+ papers)',
  google_scholar: 'Multi-source aggregator (400M+ papers)',
  web_of_science: 'Multidisciplinary citation database (90M+ records)',
  scopus: 'Abstract and citation database (87M+ records)',
  ieee_xplore: 'IEEE technical literature (5M+ documents)',
  nature: 'Nature Publishing Group journals (premium)',
  wiley: 'Wiley journal articles (18M+ articles)',
  sage: 'SAGE research articles across 1,000+ journals',
  taylor_francis: 'Taylor & Francis academic publications',
};

/**
 * Animation timing constants
 * Controls staggered animation delays for smooth visual effects
 */
export const ANIMATION_DELAYS = {
  /** Base delay before starting animations (in seconds) */
  BASE: 0.4,
  /** Stagger delay between each item (in seconds) */
  STAGGER: 0.05,
  /** Transition delay for component entry */
  COMPONENT_ENTRY: 0.2,
  /** Transition delay for transparency summary */
  TRANSPARENCY_SUMMARY: 0.3,
} as const;

/**
 * Animation durations
 * Standard durations for consistent animation timing
 */
export const ANIMATION_DURATIONS = {
  /** Fast animations (e.g., hover effects) */
  FAST: 0.3,
  /** Standard animations (e.g., component transitions) */
  STANDARD: 0.5,
  /** Slow animations (e.g., progress bar fill) */
  SLOW: 0.8,
} as const;

/**
 * Format large numbers with K/M notation
 * @param count - Number to format
 * @returns Formatted string (e.g., "1.2M", "150K", "999")
 *
 * @example
 * formatCount(1234567) // "1.2M"
 * formatCount(123456)  // "123K"
 * formatCount(12345)   // "12.3K"
 * formatCount(999)     // "999"
 * formatCount(-1234567) // "-1.2M"
 */
export const formatCount = (count: number): string => {
  const isNegative = count < 0;
  const absCount = Math.abs(count);

  let formatted: string;
  if (absCount >= 1000000) {
    formatted = `${(absCount / 1000000).toFixed(1)}M`;
  } else if (absCount >= 100000) {
    formatted = `${Math.round(absCount / 1000)}K`;
  } else if (absCount >= 10000) {
    formatted = `${(absCount / 1000).toFixed(1)}K`;
  } else {
    formatted = absCount.toLocaleString();
  }

  return isNegative ? `-${formatted}` : formatted;
};
