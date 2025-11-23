/**
 * Shared Constants for PaperCard Components
 * Phase 10.91 Day 10 - Code Quality Fixes
 *
 * Centralized constants to maintain DRY principle and enterprise-grade maintainability
 *
 * @module paper-card/constants
 */

// ============================================================================
// Display Constants
// ============================================================================

/** Maximum number of authors to display before showing "+N more" */
export const MAX_DISPLAYED_AUTHORS = 3;

/** Maximum number of publication types to display */
export const MAX_DISPLAYED_PUBLICATION_TYPES = 3;

/** Maximum number of MeSH terms to display */
export const MAX_DISPLAYED_MESH_TERMS = 4;

/** Maximum number of grants to display */
export const MAX_DISPLAYED_GRANTS = 2;

/** Maximum length for affiliation text before truncation */
export const MAX_AFFILIATION_LENGTH = 60;

/** Maximum length for grant agency name before truncation */
export const MAX_GRANT_AGENCY_LENGTH = 30;

// ============================================================================
// Quality Score Constants
// ============================================================================

/** Minimum word count threshold for paper eligibility (set by backend services) */
export const MIN_WORD_COUNT_THRESHOLD = 150;

/** Minimum word count for full theme extraction (requires full-text content) */
export const MIN_THEME_EXTRACTION_WORDS = 1000;

/** Quality score thresholds for labels */
export const QUALITY_SCORE_THRESHOLDS = {
  EXCEPTIONAL: 80,
  EXCELLENT: 70,
  VERY_GOOD: 60,
  GOOD: 50,
  ACCEPTABLE: 40,
  FAIR: 30,
} as const;

/** Quality score color thresholds */
export const QUALITY_COLOR_THRESHOLDS = {
  GREEN: 70,  // High quality
  PURPLE: 50, // Medium quality
  AMBER: 30,  // Low quality
  // Below 30 = gray (limited quality)
} as const;

// ============================================================================
// Phase 10.942: Quality Scoring Weights (v4.0)
// ============================================================================

/** Quality scoring weights - MUST match backend paper-quality.util.ts */
export const QUALITY_WEIGHTS = {
  CITATION_IMPACT: 30,   // 30% - Field-Weighted Citation Impact (FWCI)
  JOURNAL_PRESTIGE: 50,  // 50% - h-index, quartile, impact factor
  RECENCY_BOOST: 20,     // 20% - Exponential decay (λ=0.15, half-life 4.6 years)
} as const;

/** Optional bonus scores */
export const OPTIONAL_BONUSES = {
  OPEN_ACCESS: 10,       // +10 if freely available
  REPRODUCIBILITY: 5,    // +5 if data/code shared
  ALTMETRIC: 5,          // +5 if high social/policy impact
} as const;

// ============================================================================
// Phase 10.942: Relevance Tier Constants
// ============================================================================

/** Relevance score thresholds for tier labels */
export const RELEVANCE_SCORE_THRESHOLDS = {
  HIGHLY_RELEVANT: 90,
  VERY_RELEVANT: 70,
  RELEVANT: 50,
  SOMEWHAT_RELEVANT: 30,
  // Below 30 = Low Relevance
} as const;

/** Relevance tier color thresholds */
export const RELEVANCE_COLOR_THRESHOLDS = {
  EMERALD: 90,  // Highly relevant
  GREEN: 70,    // Very relevant
  BLUE: 50,     // Relevant
  AMBER: 30,    // Somewhat relevant
  // Below 30 = gray (low relevance)
} as const;

// ============================================================================
// Publisher Access Constants
// ============================================================================

/**
 * Major paywalled publishers requiring subscription or institutional access
 * Used for smart paywall detection and access status badges
 */
export const PAYWALLED_PUBLISHERS = [
  'ieeexplore.ieee.org',
  'sciencedirect.com',
  'springer.com',
  'springerlink.com',
  'wiley.com',
  'onlinelibrary.wiley.com',
  'nature.com',
  'science.org',
  'acs.org',
  'tandfonline.com',
  'sagepub.com',
  'journals.lww.com',
  'webofknowledge.com',
  'webofscience.com',
  'scopus.com',
  'oxfordjournals.org',
  'academic.oup.com',
  'cambridge.org',
  'bmj.com',
  'jamanetwork.com',
  'nejm.org',
  'thelancet.com',
] as const;

/**
 * Verified open access sources that provide free, unrestricted access
 * Used to display "Open Access" badges with confidence
 */
export const OPEN_ACCESS_SOURCES = [
  'arxiv.org',
  'eric.ed.gov',
  'europepmc.org',
  'plos.org',
  'frontiersin.org',
  'mdpi.com',
  'biomedcentral.com',
] as const;

// ============================================================================
// API Constants
// ============================================================================

/**
 * Email for Unpaywall API polite pool access
 * Required by Unpaywall's polite policy for rate limit exemption
 */
export const UNPAYWALL_POLITE_POOL_EMAIL = 'research@blackqmethod.com';

/**
 * Default API URL for local development
 * Should ONLY be used as last resort fallback
 */
export const DEFAULT_LOCAL_API_URL = 'http://localhost:4000/api';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a URL belongs to a paywalled publisher
 * @param url - Paper URL to check
 * @returns true if URL is from a known paywalled publisher
 */
export function isPaywalledPublisher(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // Validate URL format
  try {
    const urlLower = url.toLowerCase();
    return PAYWALLED_PUBLISHERS.some((publisher) => urlLower.includes(publisher));
  } catch {
    return false;
  }
}

/**
 * Check if a URL is from a verified open access source
 * @param url - Paper URL to check
 * @returns true if URL is from a known open access source
 */
export function isKnownOpenSource(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // Validate URL format
  try {
    const urlLower = url.toLowerCase();
    return OPEN_ACCESS_SOURCES.some((source) => urlLower.includes(source));
  } catch {
    return false;
  }
}

/**
 * Sanitize DOI for safe use in API calls and URLs
 * @param doi - DOI string to sanitize
 * @returns sanitized DOI or null if invalid
 */
export function sanitizeDOI(doi: string | null | undefined): string | null {
  if (!doi || typeof doi !== 'string') return null;

  // Remove common DOI prefixes and whitespace
  const cleaned = doi.trim().replace(/^(doi:|DOI:)\s*/i, '');

  // Basic validation: DOI should start with "10." and contain a "/"
  if (!/^10\.\d{4,}\/\S+/.test(cleaned)) return null;

  return cleaned;
}

/**
 * Get quality score label based on score value
 * @param score - Quality score (0-100)
 * @returns Human-readable quality label
 */
export function getQualityLabel(score: number): string {
  if (score >= QUALITY_SCORE_THRESHOLDS.EXCEPTIONAL) return 'Exceptional';
  if (score >= QUALITY_SCORE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (score >= QUALITY_SCORE_THRESHOLDS.VERY_GOOD) return 'V.Good';
  if (score >= QUALITY_SCORE_THRESHOLDS.GOOD) return 'Good';
  if (score >= QUALITY_SCORE_THRESHOLDS.ACCEPTABLE) return 'Acceptable';
  if (score >= QUALITY_SCORE_THRESHOLDS.FAIR) return 'Fair';
  return 'Limited';
}

/**
 * Get Tailwind CSS classes for quality score badge color
 * @param score - Quality score (0-100)
 * @returns Tailwind CSS class string
 */
export function getQualityColorClasses(score: number): string {
  if (score >= QUALITY_COLOR_THRESHOLDS.GREEN) {
    return 'text-green-700 bg-green-50 border-green-200';
  }
  if (score >= QUALITY_COLOR_THRESHOLDS.PURPLE) {
    return 'text-purple-700 bg-purple-50 border-purple-200';
  }
  if (score >= QUALITY_COLOR_THRESHOLDS.AMBER) {
    return 'text-amber-700 bg-amber-50 border-amber-200';
  }
  return 'text-gray-700 bg-gray-50 border-gray-200';
}

// ============================================================================
// Phase 10.942: Relevance Tier Helper Functions
// ============================================================================

/**
 * Get relevance tier label based on score value
 * @param score - Relevance score (0-100+)
 * @returns Human-readable relevance label
 */
export function getRelevanceTierLabel(score: number): string {
  if (score >= RELEVANCE_SCORE_THRESHOLDS.HIGHLY_RELEVANT) return 'Highly Relevant';
  if (score >= RELEVANCE_SCORE_THRESHOLDS.VERY_RELEVANT) return 'Very Relevant';
  if (score >= RELEVANCE_SCORE_THRESHOLDS.RELEVANT) return 'Relevant';
  if (score >= RELEVANCE_SCORE_THRESHOLDS.SOMEWHAT_RELEVANT) return 'Somewhat Relevant';
  return 'Low Relevance';
}

/**
 * Get Tailwind CSS classes for relevance tier badge color
 * @param score - Relevance score (0-100+)
 * @returns Tailwind CSS class string
 */
export function getRelevanceColorClasses(score: number): string {
  if (score >= RELEVANCE_COLOR_THRESHOLDS.EMERALD) {
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.GREEN) {
    return 'text-green-700 bg-green-50 border-green-200';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.BLUE) {
    return 'text-blue-700 bg-blue-50 border-blue-200';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.AMBER) {
    return 'text-amber-700 bg-amber-50 border-amber-200';
  }
  return 'text-gray-700 bg-gray-50 border-gray-200';
}
