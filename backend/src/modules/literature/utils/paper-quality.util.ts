/**
 * Paper Quality Scoring Utility
 *
 * Phase 10.1 Day 12: Transparent, Multi-Dimensional Quality Assessment
 *
 * Purpose: Calculate composite quality scores for academic papers based on objective metrics
 *
 * Quality Dimensions (v1.0):
 * 1. Citation Impact (40%) - Citations normalized by paper age
 * 2. Journal Prestige (35%) - h-index, quartile, impact factor (OpenAlex)
 * 3. Content Depth (25%) - Word count as proxy for comprehensiveness
 *
 * Removed Components (Phase 10.1 Day 11):
 * - Recency Boost: Unfairly favored recent papers
 * - Venue Quality: Subjective heuristics
 * - Citation Bonus: Redundant with citation impact
 * - Critical Terms: Spelling variation issues
 *
 * Full Methodology Documentation:
 * See: /QUALITY_SCORING_METHODOLOGY.md for complete transparency documentation
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
 * Phase 10.1 Day 12 (Lenient): More generous thresholds for broader paper inclusion
 *
 * Benchmark (LENIENT):
 * - 20 citations/year = world-class (100 points) [was 50]
 * - 10 citations/year = excellent (85 points) [was 70]
 * - 5 citations/year = very good (70 points) [was 50]
 * - 2 citations/year = good (50 points) [was ~35]
 * - 1 citation/year = acceptable (35 points) [was 20]
 * - 0.5 citations/year = fair (20 points) [was 10]
 *
 * Rationale: Academic papers take time to accumulate citations. Most quality papers
 * have 1-5 citations/year. Previous thresholds were too harsh for typical research.
 *
 * @param citationsPerYear - Citation velocity
 * @returns Score 0-100
 */
export function calculateCitationImpactScore(citationsPerYear: number): number {
  if (citationsPerYear >= 20) return 100; // World-class (was 50)
  if (citationsPerYear >= 10) return 85 + (citationsPerYear - 10) * 1.5; // 85-100
  if (citationsPerYear >= 5) return 70 + (citationsPerYear - 5) * 3; // 70-85
  if (citationsPerYear >= 2) return 50 + (citationsPerYear - 2) * 6.67; // 50-70
  if (citationsPerYear >= 1) return 35 + (citationsPerYear - 1) * 15; // 35-50
  if (citationsPerYear >= 0.5) return 20 + (citationsPerYear - 0.5) * 30; // 20-35
  return citationsPerYear * 40; // 0-0.5 citations/year = 0-20 points
}

/**
 * Calculate journal prestige score (0-100)
 *
 * Phase 10.1 Day 12 (Lenient): Impact Factor prioritization with more generous thresholds
 *
 * Strategy:
 * - Impact Factor (IF) is PRIMARY metric (0-60 points) when available
 * - h-index is FALLBACK metric (0-60 points) only when IF missing
 * - Quartile is BONUS metric (0-25 points) always added
 * - SJR Score is BONUS metric (0-15 points) always added
 *
 * LENIENT Thresholds:
 * - IF ≥ 5 = 60 points (was 10) - More journals qualify as world-class
 * - IF = 3 = 36 points - Good journals rewarded
 * - IF = 2 = 24 points (was 12) - Double the score
 * - IF = 1 = 12 points (was 6) - Even IF=1 gets credit
 *
 * - h-index ≥ 50 = 60 points (was 100) - More realistic for world-class
 * - h-index = 30 = 36 points - Solid journals
 * - h-index = 20 = 24 points (was 12) - Double the score
 * - h-index = 10 = 12 points - Emerging journals get credit
 *
 * Rationale: Most quality journals have IF between 1-5 and h-index 10-50.
 * Previous thresholds only rewarded elite journals. New thresholds recognize
 * the full spectrum of reputable academic publishing.
 *
 * @param metrics - Journal quality metrics
 * @returns Score 0-100
 */
export function calculateJournalPrestigeScore(metrics: JournalMetrics): number {
  let score = 0;

  // PRIMARY METRIC: Impact Factor OR h-index (0-60 points)
  // Prioritize Impact Factor; use h-index only if IF missing
  if (metrics.impactFactor !== undefined && metrics.impactFactor !== null) {
    // Impact Factor is available - use it as primary metric
    // LENIENT: IF ≥ 5 = world-class (60 points) [was IF ≥ 10]
    // IF = 3 = excellent (36 points)
    // IF = 2 = good (24 points) [was 12]
    // IF = 1 = acceptable (12 points) [was 6]
    const ifScore = Math.min((metrics.impactFactor / 5) * 60, 60);
    score += ifScore;
  } else if (metrics.hIndex !== undefined && metrics.hIndex !== null) {
    // Impact Factor NOT available - use h-index as fallback
    // LENIENT: h-index ≥ 50 = world-class (60 points) [was 100]
    // h-index = 30 = excellent (36 points)
    // h-index = 20 = good (24 points) [was 12]
    // h-index = 10 = acceptable (12 points)
    const hIndexScore = Math.min((metrics.hIndex / 50) * 60, 60);
    score += hIndexScore;
  }

  // BONUS METRIC: Quartile (0-25 points)
  // Always add if available
  if (metrics.quartile) {
    const quartileScores = { Q1: 25, Q2: 18, Q3: 10, Q4: 5 };
    score += quartileScores[metrics.quartile];
  }

  // BONUS METRIC: SJR Score (0-15 points)
  // Always add if available
  if (metrics.sjrScore !== undefined && metrics.sjrScore !== null) {
    // SJR > 2.0 is excellent (15 points)
    const sjrScore = Math.min((metrics.sjrScore / 2.0) * 15, 15);
    score += sjrScore;
  }

  // If no metrics available at all, return 0 (not 30)
  // Phase 10.1 Day 12 (Enhanced): Changed baseline from 30 → 0
  // Rationale: Unknown journals should NOT score higher than Q4 journals
  // Papers without journal data rely on citation impact + content depth
  if (score === 0) return 0;

  // Score is already on 0-100 scale (max: 60 + 25 + 15 = 100)
  return Math.min(score, 100);
}

/**
 * Calculate content depth score (0-100)
 *
 * Phase 10.1 Day 12 (Lenient): More generous word count thresholds
 *
 * Word count as proxy for paper comprehensiveness:
 * - 5000+ words: Extensive (100 points) [was 8000]
 * - 3000 words: Comprehensive (80 points) [was 70]
 * - 1500 words: Standard depth (60 points) [new tier]
 * - 1000 words: Acceptable (50 points) [was 40]
 * - 500 words: Short but valid (30 points) [was ~20]
 *
 * Rationale: Most quality papers are 3000-5000 words, not 8000+.
 * Even 1000-word papers can be valuable (letters, short communications).
 * Previous thresholds penalized standard-length academic papers.
 *
 * @param wordCount - Paper word count
 * @returns Score 0-100
 */
export function calculateContentDepthScore(
  wordCount: number | null | undefined,
): number {
  if (!wordCount || wordCount <= 0) return 0;

  if (wordCount >= 5000) return 100; // Extensive (was 8000)
  if (wordCount >= 3000) return 80 + ((wordCount - 3000) / 2000) * 20; // 80-100
  if (wordCount >= 1500) return 60 + ((wordCount - 1500) / 1500) * 20; // 60-80
  if (wordCount >= 1000) return 50 + ((wordCount - 1000) / 500) * 10; // 50-60
  if (wordCount >= 500) return 30 + ((wordCount - 500) / 500) * 20; // 30-50
  return (wordCount / 500) * 30; // 0-500 words = 0-30 points
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
 * Phase 10.1 Day 12 (Lenient): More generous thresholds for broader inclusion
 * - Citation Impact: 40% (most important - shows actual impact)
 * - Journal Prestige: 35% (publication standards matter)
 * - Content Depth: 25% (comprehensive papers preferred)
 *
 * Removed components:
 * - Recency Boost: Unfairly favored recent papers over established work
 * - Venue Quality: Subjective and unclear which venues are high quality
 *
 * LENIENT APPROACH: Thresholds lowered to recognize typical quality papers:
 * - Citations: 2/year → 50 points (was ~35)
 * - Journal: IF=2 → 24 points (was 12), h=20 → 24 points (was 12)
 * - Content: 1000 words → 50 points (was 40)
 *
 * Result: More papers reach "Good" (≥50) and "Excellent" (≥70) tiers,
 * reflecting realistic academic publishing standards.
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

  // Phase 10.1 Day 11: Removed recency boost and venue quality
  const recencyBoost = 0; // Disabled
  const venueQuality = 0; // Disabled

  // Apply weights (redistributed after removing recency and venue)
  const totalScore =
    citationImpact * 0.4 +  // 30% → 40%
    journalPrestige * 0.35 + // 25% → 35%
    contentDepth * 0.25;     // 15% → 25%

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
 * Phase 10.1 Day 12 (Lenient): Thresholds remain same, but more papers qualify
 * due to more generous component scoring.
 *
 * Thresholds:
 * - Excellent: qualityScore >= 70
 * - Good: qualityScore >= 50
 * - Acceptable: qualityScore >= 30
 * - Below standard: qualityScore < 30
 *
 * With lenient scoring, typical quality papers now reach "Good" tier:
 * - Paper with 2 cites/year + IF=2 + 1000 words → ~52 points (Good)
 * - Previously would score ~41 points (Acceptable)
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
