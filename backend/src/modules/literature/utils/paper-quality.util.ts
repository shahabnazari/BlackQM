/**
 * Paper Quality Scoring Utility
 *
 * Phase 10 Day 5.13+ (Extension 2): Enterprise Research-Grade Quality Assessment
 *
 * Purpose: Calculate composite quality scores for academic papers based on multiple factors
 *
 * Quality Dimensions:
 * 1. Citation Impact (30%) - Citations normalized by paper age
 * 2. Journal Prestige (25%) - Impact factor, SJR, quartile ranking
 * 3. Content Depth (15%) - Word count as proxy for comprehensiveness
 * 4. Recency Boost (15%) - Recent papers with potential not yet cited
 * 5. Venue Quality (15%) - Conference vs Journal, peer review standards
 *
 * Academic References:
 * - Hirsch, J. E. (2005). An index to quantify an individual's scientific research output
 * - Garfield, E. (2006). The History and Meaning of the Journal Impact Factor
 * - González-Pereira et al. (2010). A new approach to the metric of journals' scientific prestige: The SJR indicator
 */

export interface JournalMetrics {
  impactFactor?: number;
  sjrScore?: number;
  hIndex?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  citationCount?: number;
}

export interface QualityScoreComponents {
  citationImpact: number; // 0-100
  journalPrestige: number; // 0-100
  contentDepth: number; // 0-100
  recencyBoost: number; // 0-100
  venueQuality: number; // 0-100
  totalScore: number; // Weighted average 0-100
}

/**
 * Calculate citation velocity (citations per year)
 * Normalizes citation count by paper age to compare papers fairly
 *
 * @param citationCount - Total citations
 * @param year - Publication year
 * @returns Citations per year
 */
export function calculateCitationsPerYear(
  citationCount: number | null | undefined,
  year: number | null | undefined,
): number {
  if (!citationCount || !year) return 0;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Papers published this year: avoid division by zero
  if (age <= 0) return citationCount;

  return citationCount / age;
}

/**
 * Calculate citation impact score (0-100)
 *
 * Benchmark:
 * - 50 citations/year = world-class (100 points)
 * - 10 citations/year = excellent (70 points)
 * - 5 citations/year = good (50 points)
 * - 1 citation/year = average (20 points)
 *
 * @param citationsPerYear - Citation velocity
 * @returns Score 0-100
 */
export function calculateCitationImpactScore(citationsPerYear: number): number {
  if (citationsPerYear >= 50) return 100;
  if (citationsPerYear >= 10) return 70 + (citationsPerYear - 10) * 0.75;
  if (citationsPerYear >= 5) return 50 + (citationsPerYear - 5) * 4;
  if (citationsPerYear >= 1) return 20 + (citationsPerYear - 1) * 7.5;
  return citationsPerYear * 20; // 0-1 citations/year = 0-20 points
}

/**
 * Calculate journal prestige score (0-100)
 *
 * Uses multiple indicators for robustness:
 * - Impact Factor (IF): Traditional measure
 * - SJR Score: More balanced, field-normalized
 * - Quartile: Relative position in field
 * - h-index: Journal's citation impact
 *
 * @param metrics - Journal quality metrics
 * @returns Score 0-100
 */
export function calculateJournalPrestigeScore(metrics: JournalMetrics): number {
  let score = 0;
  let componentCount = 0;

  // Impact Factor component (0-40 points)
  if (metrics.impactFactor !== undefined && metrics.impactFactor !== null) {
    // IF > 10 is world-class in most fields
    const ifScore = Math.min((metrics.impactFactor / 10) * 40, 40);
    score += ifScore;
    componentCount++;
  }

  // SJR Score component (0-30 points)
  if (metrics.sjrScore !== undefined && metrics.sjrScore !== null) {
    // SJR > 2.0 is excellent
    const sjrScore = Math.min((metrics.sjrScore / 2.0) * 30, 30);
    score += sjrScore;
    componentCount++;
  }

  // Quartile component (0-25 points)
  if (metrics.quartile) {
    const quartileScores = { Q1: 25, Q2: 18, Q3: 10, Q4: 5 };
    score += quartileScores[metrics.quartile];
    componentCount++;
  }

  // h-index component (0-25 points)
  if (metrics.hIndex !== undefined && metrics.hIndex !== null) {
    // h-index > 100 is world-class journal
    const hIndexScore = Math.min((metrics.hIndex / 100) * 25, 25);
    score += hIndexScore;
    componentCount++;
  }

  // If no metrics available, return baseline score
  if (componentCount === 0) return 30; // Assume average quality

  // Normalize to 0-100 scale
  return (score / componentCount) * (100 / 40); // Adjust for max component score
}

/**
 * Calculate content depth score (0-100)
 *
 * Word count as proxy for paper comprehensiveness:
 * - Short papers (<1000 words): Limited depth
 * - Medium papers (1000-3000): Standard depth
 * - Long papers (3000-8000): Comprehensive
 * - Very long (>8000): Extensive (review, meta-analysis)
 *
 * @param wordCount - Paper word count
 * @returns Score 0-100
 */
export function calculateContentDepthScore(
  wordCount: number | null | undefined,
): number {
  if (!wordCount || wordCount <= 0) return 0;

  if (wordCount >= 8000) return 100; // Extensive
  if (wordCount >= 3000) return 70 + ((wordCount - 3000) / 5000) * 30;
  if (wordCount >= 1000) return 40 + ((wordCount - 1000) / 2000) * 30;
  return (wordCount / 1000) * 40; // 0-1000 words = 0-40 points
}

/**
 * Calculate recency boost score (0-100)
 *
 * Recent papers may not have accumulated citations yet but still be high quality.
 * Apply boost for papers published in last 3 years.
 *
 * Rationale: Important recent work needs time to accumulate citations
 *
 * @param year - Publication year
 * @returns Boost score 0-100
 */
export function calculateRecencyBoost(year: number | null | undefined): number {
  if (!year) return 0;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 0) return 100; // Current year - maximum boost
  if (age === 1) return 80; // Last year
  if (age === 2) return 60; // 2 years ago
  if (age === 3) return 40; // 3 years ago
  if (age <= 5) return 20; // 4-5 years ago
  return 0; // Older papers - no recency boost
}

/**
 * Calculate venue quality score (0-100)
 *
 * Different venue types have different quality standards:
 * - Top-tier journals (Nature, Science, Cell): 100
 * - Peer-reviewed journals: 70-90
 * - Conference proceedings: 50-70
 * - Preprints (arXiv): 30-50 (not peer-reviewed)
 * - Unknown venues: 40 (baseline)
 *
 * @param venue - Venue/journal name
 * @param source - Data source (helps identify venue type)
 * @returns Score 0-100
 */
export function calculateVenueQualityScore(
  venue: string | null | undefined,
  source: string,
): number {
  if (!venue) return 40; // Unknown venue baseline

  const venueLower = venue.toLowerCase();

  // Top-tier journals (Nature Publishing Group, Science, Cell Press)
  const topTier = [
    'nature',
    'science',
    'cell',
    'lancet',
    'nejm',
    'jama',
    'pnas',
  ];
  if (topTier.some((t) => venueLower.includes(t))) return 100;

  // High-quality established journals
  const highQuality = [
    'journal',
    'proceedings',
    'transactions',
    'quarterly',
    'review',
  ];
  if (highQuality.some((t) => venueLower.includes(t))) {
    // Check if it's a conference proceedings (lower score)
    if (venueLower.includes('conference') || venueLower.includes('workshop')) {
      return 65; // Conference proceedings
    }
    return 80; // Peer-reviewed journal
  }

  // Preprints (not peer-reviewed)
  if (
    source.toLowerCase().includes('arxiv') ||
    venueLower.includes('preprint')
  ) {
    return 40; // Preprint - no peer review yet
  }

  // Default for unknown venues
  return 50;
}

/**
 * Calculate composite quality score (0-100)
 *
 * Enterprise-grade quality assessment combining multiple dimensions:
 *
 * Weights:
 * - Citation Impact: 30% (most important - shows actual impact)
 * - Journal Prestige: 25% (venue quality matters)
 * - Content Depth: 15% (comprehensive papers preferred)
 * - Recency Boost: 15% (don't penalize recent papers)
 * - Venue Quality: 15% (peer review standards)
 *
 * @param paper - Paper object with all metrics
 * @returns Quality score components and total score
 */
export function calculateQualityScore(paper: {
  citationCount?: number | null;
  year?: number | null;
  wordCount?: number | null;
  venue?: string | null;
  source: string;
  impactFactor?: number | null;
  sjrScore?: number | null;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  hIndexJournal?: number | null;
}): QualityScoreComponents {
  // Calculate each component
  const citationsPerYear = calculateCitationsPerYear(
    paper.citationCount,
    paper.year,
  );
  const citationImpact = calculateCitationImpactScore(citationsPerYear);

  const journalPrestige = calculateJournalPrestigeScore({
    impactFactor: paper.impactFactor ?? undefined,
    sjrScore: paper.sjrScore ?? undefined,
    hIndex: paper.hIndexJournal ?? undefined,
    quartile: paper.quartile ?? undefined,
  });

  const contentDepth = calculateContentDepthScore(paper.wordCount);
  const recencyBoost = calculateRecencyBoost(paper.year);
  const venueQuality = calculateVenueQualityScore(paper.venue, paper.source);

  // Apply weights
  const totalScore =
    citationImpact * 0.3 +
    journalPrestige * 0.25 +
    contentDepth * 0.15 +
    recencyBoost * 0.15 +
    venueQuality * 0.15;

  return {
    citationImpact,
    journalPrestige,
    contentDepth,
    recencyBoost,
    venueQuality,
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal place
  };
}

/**
 * Determine if paper meets enterprise quality standards
 *
 * Thresholds:
 * - Excellent: qualityScore >= 70
 * - Good: qualityScore >= 50
 * - Acceptable: qualityScore >= 30
 * - Below standard: qualityScore < 30
 *
 * @param qualityScore - Composite quality score
 * @returns Boolean indicating high quality
 */
export function isHighQualityPaper(qualityScore: number): boolean {
  return qualityScore >= 50; // Good or better
}

/**
 * Get quality tier label for display
 *
 * @param qualityScore - Composite quality score
 * @returns Quality tier label
 */
export function getQualityTier(qualityScore: number): string {
  if (qualityScore >= 80) return 'Exceptional';
  if (qualityScore >= 70) return 'Excellent';
  if (qualityScore >= 60) return 'Very Good';
  if (qualityScore >= 50) return 'Good';
  if (qualityScore >= 40) return 'Acceptable';
  if (qualityScore >= 30) return 'Fair';
  return 'Limited';
}

/**
 * Get quality tier color for UI
 *
 * @param qualityScore - Composite quality score
 * @returns Tailwind color class
 */
export function getQualityTierColor(qualityScore: number): string {
  if (qualityScore >= 70) return 'green';
  if (qualityScore >= 50) return 'blue';
  if (qualityScore >= 30) return 'amber';
  return 'gray';
}
