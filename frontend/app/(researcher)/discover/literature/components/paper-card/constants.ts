/**
 * Shared Constants for PaperCard Components
 * Phase 10.91 Day 10 - Code Quality Fixes
 * Phase 10.145 - Dark mode support for all color functions
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
 *
 * Phase 10.114: Raised caps to allow papers with partial metadata to reach quality thresholds
 * MUST match backend paper-quality.util.ts SCORE_CAPS array
 */
export const SCORE_CAPS_BY_METRICS = {
  0: 30,  // No metrics = max 30
  1: 55,  // 1 metric = max 55
  2: 80,  // 2 metrics = max 80 (can reach quality threshold)
  3: 92,  // 3 metrics = max 92 (comfortable headroom)
  4: 100, // All metrics = max 100
} as const;

// ============================================================================
// Phase 10.122: COMBINED RANKING SCORE Constants (NETFLIX-GRADE)
// ============================================================================
// THIS IS THE SCORE THAT DETERMINES ACTUAL SORT ORDER
// Formula: 15%×BM25 + 55%×Semantic + 30%×ThemeFit = Combined Score (0-100)
// ============================================================================

/** Combined ranking score weights - MUST match backend search-pipeline.service.ts */
export const RANKING_WEIGHTS = {
  BM25: 15,           // 15% - Keyword matching (Robertson & Walker 1994)
  SEMANTIC: 55,       // 55% - Embedding similarity (BGE-small-en-v1.5)
  THEME_FIT: 30,      // 30% - Q-methodology suitability (controversy, clarity)
} as const;

/** Combined ranking score thresholds for tier labels */
export const RANKING_SCORE_THRESHOLDS = {
  EXCELLENT: 80,      // Top-tier relevance
  VERY_GOOD: 65,      // Highly relevant
  GOOD: 50,           // Relevant
  MODERATE: 35,       // Somewhat relevant
  // Below 35 = Low relevance
} as const;

/** Ranking score color thresholds */
export const RANKING_COLOR_THRESHOLDS = {
  PURPLE: 80,   // Excellent - purple gradient
  GREEN: 65,    // Very good
  BLUE: 50,     // Good
  AMBER: 35,    // Moderate
  // Below 35 = gray
} as const;

// ============================================================================
// Phase 10.942: Relevance Tier Constants (BM25 ONLY - LEGACY)
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
 * Phase 10.145: Added dark mode support
 * @param score - Quality score (0-100)
 * @returns Tailwind CSS class string with dark mode
 */
export function getQualityColorClasses(score: number): string {
  if (score >= QUALITY_COLOR_THRESHOLDS.GREEN) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (score >= QUALITY_COLOR_THRESHOLDS.PURPLE) {
    return 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700';
  }
  if (score >= QUALITY_COLOR_THRESHOLDS.AMBER) {
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
  }
  return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
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
 * Phase 10.145: Added dark mode support
 * @param score - Relevance score (0-100+)
 * @returns Tailwind CSS class string with dark mode
 */
export function getRelevanceColorClasses(score: number): string {
  if (score >= RELEVANCE_COLOR_THRESHOLDS.EMERALD) {
    return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.GREEN) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.BLUE) {
    return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
  }
  if (score >= RELEVANCE_COLOR_THRESHOLDS.AMBER) {
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
  }
  return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
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
 * Phase 10.145: Added dark mode support
 * @param availableMetrics - Number of metrics available (0-4)
 * @returns Tailwind CSS class string with dark mode
 */
export function getConfidenceColorClasses(availableMetrics: number): string {
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.GOOD) {
    return 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.MODERATE) {
    return 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
  }
  if (availableMetrics >= CONFIDENCE_THRESHOLDS.LOW) {
    return 'text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700';
  }
  return 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
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

// ============================================================================
// Phase 10.122: COMBINED RANKING SCORE Helper Functions (NETFLIX-GRADE)
// ============================================================================

/**
 * Get ranking score label based on combined score
 * @param score - Combined ranking score (0-100)
 * @returns Human-readable ranking label
 */
export function getRankingScoreLabel(score: number): string {
  if (score >= RANKING_SCORE_THRESHOLDS.EXCELLENT) return 'Excellent Match';
  if (score >= RANKING_SCORE_THRESHOLDS.VERY_GOOD) return 'Very Good';
  if (score >= RANKING_SCORE_THRESHOLDS.GOOD) return 'Good Match';
  if (score >= RANKING_SCORE_THRESHOLDS.MODERATE) return 'Moderate';
  return 'Low Match';
}

/**
 * Get Tailwind CSS classes for ranking score badge color
 * Phase 10.145: Added dark mode support
 * @param score - Combined ranking score (0-100)
 * @returns Tailwind CSS class string with dark mode
 */
export function getRankingColorClasses(score: number): string {
  if (score >= RANKING_COLOR_THRESHOLDS.PURPLE) {
    return 'text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-300 dark:border-purple-600';
  }
  if (score >= RANKING_COLOR_THRESHOLDS.GREEN) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (score >= RANKING_COLOR_THRESHOLDS.BLUE) {
    return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
  }
  if (score >= RANKING_COLOR_THRESHOLDS.AMBER) {
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
  }
  return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
}

/**
 * Get explanation of the ranking formula
 * @returns Formula explanation string
 */
export function getRankingFormulaExplanation(): string {
  return `Combined Score = ${RANKING_WEIGHTS.BM25}%×BM25 + ${RANKING_WEIGHTS.SEMANTIC}%×Semantic + ${RANKING_WEIGHTS.THEME_FIT}%×ThemeFit`;
}

/**
 * Parse neural explanation string into component scores
 * @param explanation - Format: "BM25=45, Sem=72, ThemeFit=58"
 * @returns Object with parsed scores or null if unparseable
 */
export function parseNeuralExplanation(explanation: string | undefined): {
  bm25: number;
  semantic: number;
  themeFit: number;
} | null {
  if (!explanation) return null;

  try {
    const bm25Match = explanation.match(/BM25=(\d+)/);
    const semMatch = explanation.match(/Sem=(\d+)/);
    const themeFitMatch = explanation.match(/ThemeFit=(\d+)/);

    // All three matches must exist and have capture groups
    if (bm25Match?.[1] && semMatch?.[1] && themeFitMatch?.[1]) {
      return {
        bm25: parseInt(bm25Match[1], 10),
        semantic: parseInt(semMatch[1], 10),
        themeFit: parseInt(themeFitMatch[1], 10),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Phase 10.123: Quality Tier System (Netflix-Grade)
// ============================================================================
// Simplified quality indicators using Gold/Silver/Bronze tiers
// Replaces complex multi-badge approach with single visual indicator
// ============================================================================

/**
 * Normalize a score value with full validation
 * Shared helper to ensure consistent behavior across all score functions
 * @param score - Score value (0-100) or null/undefined
 * @returns Normalized score clamped to [0, 100] or null if invalid
 * @internal
 */
function normalizeScore(score: number | null | undefined): number | null {
  // Reject null, undefined, NaN
  if (score === null || score === undefined || Number.isNaN(score)) {
    return null;
  }

  // Handle Infinity: treat as max/min
  if (!Number.isFinite(score)) {
    return score > 0 ? 100 : 0;
  }

  // Clamp to valid range [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Quality tier thresholds
 * Gold = High quality (70+), Silver = Good quality (50-69), Bronze = Acceptable (<50)
 */
export const QUALITY_TIERS = {
  GOLD: 70,    // High quality
  SILVER: 50,  // Good quality
  BRONZE: 0,   // Acceptable
} as const;

/** Quality tier type */
export type QualityTierType = 'gold' | 'silver' | 'bronze' | null;

/**
 * Get quality tier from score with full validation
 * Handles null, undefined, NaN, Infinity, and out-of-range values safely
 * @param score - Quality score (0-100) or null/undefined
 * @returns Quality tier type or null if invalid
 * @example
 *   getQualityTier(75)        // 'gold'
 *   getQualityTier(55)        // 'silver'
 *   getQualityTier(30)        // 'bronze'
 *   getQualityTier(null)      // null
 *   getQualityTier(NaN)       // null
 *   getQualityTier(Infinity)  // 'gold' (clamped to 100)
 *   getQualityTier(-Infinity) // 'bronze' (clamped to 0)
 */
export function getQualityTier(score: number | null | undefined): QualityTierType {
  const normalized = normalizeScore(score);
  if (normalized === null) return null;

  if (normalized >= QUALITY_TIERS.GOLD) return 'gold';
  if (normalized >= QUALITY_TIERS.SILVER) return 'silver';
  return 'bronze';
}

/**
 * Get emoji icon for quality tier
 * @param tier - Quality tier type
 * @returns Emoji string for display
 */
export function getQualityTierIcon(tier: QualityTierType): string {
  switch (tier) {
    case 'gold': return '\u2B50'; // Star emoji
    case 'silver': return '\uD83E\uDD48'; // Silver medal
    case 'bronze': return '\uD83E\uDD49'; // Bronze medal
    default: return '';
  }
}

/**
 * Get accessible label for quality tier (for aria-label and tooltips)
 * @param tier - Quality tier type
 * @returns Human-readable label
 */
export function getQualityTierLabel(tier: QualityTierType): string {
  switch (tier) {
    case 'gold': return 'High Quality';
    case 'silver': return 'Good Quality';
    case 'bronze': return 'Acceptable Quality';
    default: return 'Quality Unknown';
  }
}

/**
 * Get Tailwind CSS color classes for quality tier (with dark mode support)
 * @param tier - Quality tier type
 * @returns Tailwind CSS class string
 */
export function getQualityTierColors(tier: QualityTierType): string {
  switch (tier) {
    case 'gold':
      return 'text-amber-600 dark:text-amber-400';
    case 'silver':
      return 'text-gray-500 dark:text-gray-400';
    case 'bronze':
      return 'text-orange-700 dark:text-orange-400';
    default:
      return 'text-gray-400 dark:text-gray-500';
  }
}

// ============================================================================
// Phase 10.123: Match Score Labels (Netflix-Grade)
// ============================================================================
// Simplified match labels for combined ranking score
// ============================================================================

/**
 * Match score thresholds for simplified labels
 */
export const MATCH_SCORE_LABELS = {
  EXCELLENT: { min: 80, label: 'Excellent Match' },
  STRONG: { min: 65, label: 'Strong Match' },
  GOOD: { min: 50, label: 'Good Match' },
  MODERATE: { min: 35, label: 'Moderate Match' },
  LOW: { min: 0, label: 'Low Match' },
} as const;

/**
 * Get match score label with validation
 * Handles null, undefined, NaN, Infinity, and out-of-range values safely
 * @param score - Combined ranking score (0-100) or null/undefined
 * @returns Human-readable match label
 * @example
 *   getMatchScoreLabel(85)        // 'Excellent Match'
 *   getMatchScoreLabel(null)      // 'No Score'
 *   getMatchScoreLabel(Infinity)  // 'Excellent Match' (clamped)
 */
export function getMatchScoreLabel(score: number | null | undefined): string {
  const normalized = normalizeScore(score);
  if (normalized === null) return 'No Score';

  if (normalized >= MATCH_SCORE_LABELS.EXCELLENT.min) return MATCH_SCORE_LABELS.EXCELLENT.label;
  if (normalized >= MATCH_SCORE_LABELS.STRONG.min) return MATCH_SCORE_LABELS.STRONG.label;
  if (normalized >= MATCH_SCORE_LABELS.GOOD.min) return MATCH_SCORE_LABELS.GOOD.label;
  if (normalized >= MATCH_SCORE_LABELS.MODERATE.min) return MATCH_SCORE_LABELS.MODERATE.label;
  return MATCH_SCORE_LABELS.LOW.label;
}

/**
 * Get match score badge color classes based on score
 * Handles null, undefined, NaN, Infinity, and out-of-range values safely
 * @param score - Combined ranking score (0-100) or null/undefined
 * @returns Tailwind CSS class string with dark mode support
 */
export function getMatchScoreColors(score: number | null | undefined): string {
  const normalized = normalizeScore(score);
  if (normalized === null) {
    return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-600';
  }

  if (normalized >= MATCH_SCORE_LABELS.EXCELLENT.min) {
    return 'text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-300 dark:border-purple-600';
  }
  if (normalized >= MATCH_SCORE_LABELS.STRONG.min) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600';
  }
  if (normalized >= MATCH_SCORE_LABELS.GOOD.min) {
    return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600';
  }
  if (normalized >= MATCH_SCORE_LABELS.MODERATE.min) {
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600';
  }
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
}
