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
// Phase 10.107: Metadata Completeness / Confidence Level Constants
// ============================================================================

/**
 * Confidence level thresholds based on metadata availability
 * Shows users how much data backs the quality score
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 4,      // 4/4 metrics = High confidence
  GOOD: 3,      // 3/4 metrics = Good confidence
  MODERATE: 2,  // 2/4 metrics = Moderate confidence
  LOW: 1,       // 1/4 metrics = Low confidence
  // 0/4 = Very Low (no meaningful data)
} as const;

/**
 * Score caps based on data completeness
 * Less data = lower maximum possible score (prevents artificial boosting)
 */
export const SCORE_CAPS_BY_METRICS = {
  0: 25,  // No metrics = max 25
  1: 45,  // 1 metric = max 45
  2: 65,  // 2 metrics = max 65
  3: 85,  // 3 metrics = max 85
  4: 100, // All metrics = max 100
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

// ============================================================================
// Phase 10.107: Confidence Level Helper Functions
// ============================================================================

/**
 * Get confidence level label based on available metrics
 * @param availableMetrics - Number of metrics available (0-4)
 * @returns Human-readable confidence label
 */
export function getConfidenceLabel(availableMetrics: number): string {
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.HIGH) return 'High';
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.GOOD) return 'Good';
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.MODERATE) return 'Moderate';
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.LOW) return 'Low';
  return 'Very Low';
}

/**
 * Get Tailwind CSS classes for confidence badge color
 * @param availableMetrics - Number of metrics available (0-4)
 * @returns Tailwind CSS class string
 */
export function getConfidenceColorClasses(availableMetrics: number): string {
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.GOOD) {
    return 'text-green-600 bg-green-50 border-green-200';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.MODERATE) {
    return 'text-amber-600 bg-amber-50 border-amber-200';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.LOW) {
    return 'text-orange-600 bg-orange-50 border-orange-200';
  }
  return 'text-gray-500 bg-gray-50 border-gray-200';
}

/**
 * Get a short description of what the confidence level means
 * @param availableMetrics - Number of metrics available (0-4)
 * @returns Explanation string
 */
export function getConfidenceExplanation(availableMetrics: number): string {
  if (availableMetrics >= 4) {
    return 'Full data available: citations, journal metrics, year, abstract';
  }
  if (availableMetrics >= 3) {
    return 'Most data available - reliable quality estimate';
  }
  if (availableMetrics >= 2) {
    return 'Partial data - quality score has moderate confidence';
  }
  if (availableMetrics >= 1) {
    return 'Limited data - quality score based on minimal metrics';
  }
  return 'No quality metrics available from this source';
}

/**
 * Get the score cap for a given number of available metrics
 * @param availableMetrics - Number of metrics available (0-4)
 * @returns Maximum possible score
 */
export function getScoreCap(availableMetrics: number): number {
  const caps = SCORE_CAPS_BY_METRICS as Record<number, number>;
  return caps[availableMetrics] ?? 100;
}
