/**
 * Paper Quality Scoring Utility
 *
 * Phase 10.6 Day 14.8: Bias-Resistant Quality Scoring v3.0
 *
 * Purpose: Calculate composite quality scores for academic papers based on objective metrics
 *
 * Quality Dimensions (v3.0 - Bias-Resistant):
 * 
 * CORE SCORING (applies to ALL papers, 0-100):
 * 1. Citation Impact (60%) - Field-weighted citations normalized by paper age
 * 2. Journal Prestige (40%) - h-index, quartile, impact factor (OpenAlex)
 *
 * OPTIONAL BONUSES (when applicable, +0 to +20):
 * 3. Open Access (+10) - Paper is freely available (encourages accessibility)
 * 4. Reproducibility (+5) - Data/code sharing detected (encourages transparency)
 * 5. Altmetric (+5) - High social/policy impact (recognizes real-world influence)
 *
 * Total Score: min(Core Score + Bonuses, 100)
 *
 * Bias Safeguards:
 * - Field-weighted citations: Math papers not disadvantaged vs. Biology
 * - Bonuses are OPTIONAL: Classic papers can still score 100/100 without them
 * - No penalties for missing bonuses: Papers from any era/field score fairly
 * - Transparency: Metadata shows which bonuses were applied and why
 *
 * Removed Components:
 * - Content Depth (Phase 10.6 Day 14.7): Short papers can be more impactful than long ones
 * - Recency Boost (Phase 10.1 Day 11): Unfairly favored recent papers
 * - Venue Quality (Phase 10.1 Day 11): Subjective heuristics
 * - Citation Bonus: Redundant with citation impact
 * - Critical Terms: Spelling variation issues
 *
 * Rationale for Content Depth Removal:
 * - Word count is NOT a reliable indicator of paper quality or insights
 * - Short papers (letters, brief communications) can have major impact
 * - Examples: Watson & Crick's DNA structure (900 words), Shannon's Information Theory
 * - Length bias unfairly penalizes concise, high-impact research
 *
 * Full Methodology Documentation:
 * See: /QUALITY_SCORING_V3_BIAS_ANALYSIS.md for complete bias analysis
 * See: /QUALITY_SCORING_METHODOLOGY.md for complete transparency documentation
 *
 * Academic References:
 * - Hirsch, J. E. (2005). An index to quantify an individual's scientific research output
 * - Garfield, E. (2006). The History and Meaning of the Journal Impact Factor
 * - González-Pereira et al. (2010). A new approach to the metric of journals' scientific prestige: The SJR indicator
 * - Waltman & van Eck (2019). Field normalization of scientometric indicators
 */

export interface JournalMetrics {
  impactFactor?: number;
  sjrScore?: number;
  hIndex?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  citationCount?: number;
}

export interface QualityScoreComponents {
  citationImpact: number; // 0-100 (field-weighted in v3.0)
  journalPrestige: number; // 0-100
  contentDepth: number; // 0-100 (REMOVED in v2.0, kept for compatibility)
  recencyBoost: number; // 0-100 (REMOVED in v1.0, kept for compatibility)
  venueQuality: number; // 0-100 (REMOVED in v1.0, kept for compatibility)
  
  // Phase 10.6 Day 14.8 (v3.0): Optional bonuses
  openAccessBonus?: number; // 0-10
  reproducibilityBonus?: number; // 0-5
  altmetricBonus?: number; // 0-5
  
  coreScore: number; // Core score before bonuses (0-100)
  totalScore: number; // Final score with bonuses (0-100, capped)
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
 * Calculate recency score using exponential decay (0-100)
 *
 * Phase 10.7 Day 20 v4.0: DYNAMIC YEAR-AGNOSTIC FORMULA
 * 
 * **Scientific Foundation**:
 * - Citation Half-Life Theory (Garfield, 1980): Papers lose relevance exponentially over time
 * - Information Decay Models (Egghe & Rousseau, 1990): Exponential decay best fits academic literature
 * - Recency Bias in IR (Manning et al., 2008): Exponential weighting balances old vs new research
 * 
 * **Formula**: score = 100 * e^(-λ * age)
 * 
 * Where:
 * - λ (lambda) = 0.15 (decay constant for academic literature)
 * - age = current_year - publication_year
 * - e = Euler's number (2.71828...)
 * 
 * **Half-Life**: ~4.6 years (ln(2)/λ = 0.693/0.15)
 * - After 4.6 years, score drops to 50% of original
 * - Typical for academic papers across disciplines
 * 
 * **Score Distribution** (DYNAMIC - works for ANY year):
 * - Age 0: 100 points (current year - cutting-edge)
 * - Age 1: 86 points (last year - very recent)
 * - Age 2: 74 points (2 years ago - recent)
 * - Age 3: 64 points (3 years ago - recent)
 * - Age 5: 47 points (5 years ago - established)
 * - Age 10: 22 points (10 years ago - foundational)
 * - Age 20+: 20 points (floor - classic work still valuable)
 * 
 * **Advantages**:
 * - ✅ Works for ANY year (2025, 2030, 2050, 2100...)
 * - ✅ Smooth decay (no arbitrary thresholds)
 * - ✅ Science-backed (citation half-life research)
 * - ✅ Configurable (adjust λ for different fields)
 * - ✅ Fair to all eras (classic papers get floor score)
 * 
 * **Field-Specific Tuning** (future enhancement):
 * - Computer Science: λ = 0.20 (faster decay, 3.5 year half-life)
 * - Medicine: λ = 0.15 (standard, 4.6 year half-life)
 * - Mathematics: λ = 0.10 (slower decay, 6.9 year half-life)
 * - Humanities: λ = 0.08 (slowest decay, 8.7 year half-life)
 * 
 * @param year - Publication year
 * @param lambda - Decay constant (default: 0.15 for general academic literature)
 * @returns Recency score 0-100
 */
export function calculateRecencyBoost(
  year: number | null | undefined,
  lambda: number = 0.15
): number {
  // Unknown year: neutral score (don't penalize missing metadata)
  if (!year) return 50;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Future years (data errors): treat as current year
  if (age < 0) {
    console.warn(`[Recency] Future year detected: ${year} (current: ${currentYear}). Treating as current year.`);
    return 100;
  }

  // Exponential decay formula: score = 100 * e^(-λ * age)
  // λ = 0.15 gives half-life of ~4.6 years (typical for academic papers)
  const score = 100 * Math.exp(-lambda * age);

  // Floor at 20: Classic papers (20+ years old) still valuable for foundational knowledge
  // This prevents over-penalizing seminal works (e.g., Shannon 1948, Watson & Crick 1953)
  const finalScore = Math.max(20, score);

  return Math.round(finalScore);
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
 * Calculate Open Access bonus (0-10)
 * 
 * Phase 10.6 Day 14.8 (v3.0): Optional bonus for freely accessible papers
 * 
 * Rationale:
 * - Rewards papers that are freely available to all researchers
 * - Encourages open science practices
 * - No penalty for paywalled papers (bonus, not requirement)
 * 
 * @param isOpenAccess - Whether paper is openly accessible
 * @returns Bonus score 0-10
 */
export function calculateOpenAccessBonus(isOpenAccess: boolean | null | undefined): number {
  if (isOpenAccess === true) return 10;
  return 0; // No penalty for closed access
}

/**
 * Calculate Reproducibility bonus (0-5)
 * 
 * Phase 10.6 Day 14.8 (v3.0): Optional bonus for data/code sharing
 * 
 * Rationale:
 * - Rewards transparent research with shared data/code
 * - Encourages reproducible science
 * - No penalty for papers without data (bonus, not requirement)
 * - Field-agnostic: theoretical papers naturally get 0 (no penalty)
 * 
 * @param hasDataCode - Whether data/code is available
 * @returns Bonus score 0-5
 */
export function calculateReproducibilityBonus(hasDataCode: boolean | null | undefined): number {
  if (hasDataCode === true) return 5;
  return 0; // No penalty for missing data/code
}

/**
 * Calculate Altmetric bonus (0-5)
 * 
 * Phase 10.6 Day 14.8 (v3.0): Optional bonus for high social/policy impact
 * 
 * Rationale:
 * - Recognizes real-world influence beyond academia
 * - Bonus for papers that inform policy, practice, or public discourse
 * - No penalty for papers without social media attention (bonus, not requirement)
 * - Field-agnostic: fundamental research naturally gets 0 (no penalty)
 * 
 * Altmetric Score Interpretation:
 * - 100+: Top 5% of papers (5 points)
 * - 50+: Top 25% of papers (3 points)
 * - 20+: Above average (2 points)
 * - 10+: Some attention (1 point)
 * - <10: Limited attention (0 points, no penalty)
 * 
 * @param altmetricScore - Altmetric attention score
 * @returns Bonus score 0-5
 */
export function calculateAltmetricBonus(altmetricScore: number | null | undefined): number {
  if (!altmetricScore || altmetricScore <= 0) return 0;
  
  if (altmetricScore >= 100) return 5; // Top 5% - exceptional public/policy impact
  if (altmetricScore >= 50) return 3; // Top 25% - high attention
  if (altmetricScore >= 20) return 2; // Above average
  if (altmetricScore >= 10) return 1; // Some attention
  return 0; // Limited attention - no penalty
}

/**
 * Apply field-weighted normalization to citation impact
 * 
 * Phase 10.6 Day 14.8 (v3.0): Field-Weighted Citation Impact (FWCI)
 * 
 * Rationale:
 * - Different fields have vastly different citation patterns
 * - Biology papers get 5-10x more citations than math papers
 * - FWCI normalizes by comparing to field average
 * - Fair comparison across all disciplines
 * 
 * FWCI Interpretation (from OpenAlex):
 * - FWCI = 1.0: Average for field
 * - FWCI > 1.0: Above field average (multiply raw score)
 * - FWCI < 1.0: Below field average (reduce raw score)
 * 
 * Example:
 * - Math paper: 5 cites/year, FWCI = 2.5 → Equivalent to 12.5 cites/year
 * - Biology paper: 20 cites/year, FWCI = 0.8 → Equivalent to 16 cites/year
 * 
 * @param citationImpact - Raw citation impact score (0-100)
 * @param fwci - Field-Weighted Citation Impact from OpenAlex
 * @returns Field-normalized citation impact score (0-100)
 */
export function applyFieldWeighting(
  citationImpact: number,
  fwci: number | null | undefined,
): number {
  // If no FWCI available, return raw score (no normalization)
  if (!fwci || fwci <= 0) return citationImpact;
  
  // Apply field weighting
  const fieldWeighted = citationImpact * fwci;
  
  // Cap at 100 (can't exceed maximum)
  return Math.min(fieldWeighted, 100);
}

/**
 * Calculate composite quality score (0-100)
 *
 * Phase 10.7 Day 20: Rebalanced Quality Scoring v3.1
 * 
 * CORE SCORING (applies to ALL papers):
 * - Citation Impact: 30% (reduced from 60% to reduce citation bias)
 * - Journal Prestige: 50% (increased from 40% for better quality signal)
 * - Recency Bonus: 20% (RE-ENABLED to favor recent research)
 * 
 * OPTIONAL BONUSES (when applicable):
 * - Open Access: +10 (if freely available)
 * - Reproducibility: +5 (if data/code shared)
 * - Altmetric: +5 (if high social impact)
 * 
 * Total: min(Core Score + Bonuses, 100)
 *
 * Rationale for Rebalancing:
 * - Citation bias reduced: Math/theory papers not disadvantaged
 * - Journal prestige increased: Better proxy for peer review quality
 * - Recency bonus added: Recent papers (2020-2025) get fair consideration
 * - Bonuses unchanged: Still optional rewards, not requirements
 *
 * Bias Safeguards:
 * - ALL papers get a core score (0-100) regardless of field/era/source
 * - Bonuses are REWARDS, not REQUIREMENTS
 * - Classic papers can still score high via journal prestige
 * - Recent papers get modest boost (not overwhelming)
 * - Field-weighted citations prevent biology bias
 *
 * Examples:
 * - Classic biology paper (1998, Nature, paywalled): 
 *   Citations 30% + Journal 50% + Recency 4% = 84/100
 * - Recent math paper (2023, Q1, arXiv): 
 *   Citations 15% + Journal 40% + Recency 16% + OA 10% = 81/100
 * - Applied CS paper (2024, OA, GitHub, tweets): 
 *   Citations 18% + Journal 35% + Recency 20% + Bonuses 20% = 93/100
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
  // Phase 10.6 Day 14.8 (v3.0): New fields
  fwci?: number | null; // Field-Weighted Citation Impact from OpenAlex
  isOpenAccess?: boolean | null; // Open Access status
  hasDataCode?: boolean | null; // Data/code availability
  altmetricScore?: number | null; // Altmetric attention score
}): QualityScoreComponents {
  // ============================================
  // CORE SCORING (applies to ALL papers)
  // ============================================
  
  // Calculate raw citation impact
  const citationsPerYear = calculateCitationsPerYear(
    paper.citationCount,
    paper.year,
  );
  let citationImpact = calculateCitationImpactScore(citationsPerYear);
  
  // Phase 10.6 Day 14.8 (v3.0): Apply field weighting if available
  citationImpact = applyFieldWeighting(citationImpact, paper.fwci);

  const journalPrestige = calculateJournalPrestigeScore({
    impactFactor: paper.impactFactor ?? undefined,
    sjrScore: paper.sjrScore ?? undefined,
    hIndex: paper.hIndexJournal ?? undefined,
    quartile: paper.quartile ?? undefined,
  });

  // Phase 10.7 Day 20: RE-ENABLED recency bonus
  const recencyBoost = calculateRecencyBoost(paper.year);

  // Calculate core score (0-100)
  // Phase 10.7 Day 20: REBALANCED weights
  // Citation Impact: 30% (reduced from 60%)
  // Journal Prestige: 50% (increased from 40%)
  // Recency Bonus: 20% (re-enabled from 0%)
  const coreScore = 
    citationImpact * 0.30 + 
    journalPrestige * 0.50 + 
    recencyBoost * 0.20;
  
  // ============================================
  // OPTIONAL BONUSES (when applicable)
  // ============================================
  
  const openAccessBonus = calculateOpenAccessBonus(paper.isOpenAccess);
  const reproducibilityBonus = calculateReproducibilityBonus(paper.hasDataCode);
  const altmetricBonus = calculateAltmetricBonus(paper.altmetricScore);
  
  // Sum all bonuses (max +20)
  const totalBonus = openAccessBonus + reproducibilityBonus + altmetricBonus;
  
  // Final score: core + bonuses, capped at 100
  const totalScore = Math.min(coreScore + totalBonus, 100);

  // ============================================
  // RETURN COMPONENTS (with backward compatibility)
  // ============================================
  
  // Phase 10.6 Day 14.7: Content Depth removed (length bias eliminated)
  const contentDepth = 0; // Disabled - word count doesn't indicate quality

  // Phase 10.1 Day 11: Removed venue quality
  const venueQuality = 0; // Disabled

  return {
    citationImpact, // Field-weighted if FWCI available
    journalPrestige,
    contentDepth, // Returns 0 for backward compatibility
    recencyBoost, // Phase 10.7 Day 20: RE-ENABLED (was 0)
    venueQuality, // Returns 0 for backward compatibility
    // Phase 10.6 Day 14.8 (v3.0): New fields
    openAccessBonus,
    reproducibilityBonus,
    altmetricBonus,
    coreScore: Math.round(coreScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
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
