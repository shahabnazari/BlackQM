/**
 * Paper Quality Scoring Utility
 *
 * Phase 10.111: Optimized & Cleaned - December 2025
 *
 * Purpose: Calculate composite quality scores for academic papers based on objective metrics
 *
 * CORE SCORING (applies to ALL papers, 0-100):
 * - Citation Impact (35%): Field-weighted citations normalized by paper age
 * - Journal Prestige (45%): h-index, quartile, impact factor
 * - Recency (20%): Exponential decay with 4.6-year half-life
 *
 * OPTIONAL BONUSES (when applicable, +0 to +20):
 * - Open Access (+10): Paper is freely available
 * - Reproducibility (+5): Data/code sharing detected
 * - Altmetric (+5): High social/policy impact
 *
 * SCORE CAP BY DATA COMPLETENESS:
 * - 4/4 metrics → max 100 (High confidence)
 * - 3/4 metrics → max 85 (Good confidence)
 * - 2/4 metrics → max 65 (Moderate confidence)
 * - 1/4 metrics → max 45 (Low confidence)
 * - 0/4 metrics → max 25 (Very Low confidence)
 *
 * Bias Safeguards:
 * - Field-weighted citations: Math papers not disadvantaged vs. Biology
 * - Dynamic weighting: Only available metrics are scored
 * - Transparency: Metadata completeness shown alongside score
 */

export interface JournalMetrics {
  impactFactor?: number;
  sjrScore?: number;
  hIndex?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  citationCount?: number;
}

export interface QualityScoreComponents {
  citationImpact: number;       // 0-100 (field-weighted)
  journalPrestige: number;      // 0-100
  recencyBoost: number;         // 0-100 (exponential decay)

  // Optional bonuses
  openAccessBonus?: number;     // 0-10
  reproducibilityBonus?: number; // 0-5
  altmetricBonus?: number;      // 0-5

  coreScore: number;            // Core score before bonuses (0-100)
  totalScore: number;           // Final score with bonuses (capped by metadata completeness)

  // Transparency: How much data we have for this paper
  metadataCompleteness?: MetadataCompleteness;
}

/**
 * Metadata Availability - tracks what data we actually have for a paper
 * Shows users exactly how much data we have for each paper.
 */
export interface MetadataCompleteness {
  hasCitations: boolean;        // Do we have citation count data?
  hasJournalMetrics: boolean;   // Do we have IF/SJR/h-index?
  hasYear: boolean;             // Do we have publication year?
  hasAbstract: boolean;         // Do we have abstract for semantic analysis?
  completenessScore: number;    // 0-100: how complete is the metadata?
  availableMetrics: number;     // Count of available metrics (0-4)
  totalMetrics: number;         // Total possible metrics (4)
}

/**
 * Calculate metadata completeness for a paper
 * This is TRANSPARENT - we show users exactly what data we have
 */
export function calculateMetadataCompleteness(paper: {
  citationCount?: number | null;
  year?: number | null;
  abstract?: string | null;
  impactFactor?: number | null;
  sjrScore?: number | null;
  hIndexJournal?: number | null;
  quartile?: string | null;
}): MetadataCompleteness {
  const hasCitations = paper.citationCount !== null &&
                       paper.citationCount !== undefined &&
                       paper.citationCount >= 0;

  const hasJournalMetrics = !!(paper.impactFactor || paper.sjrScore ||
                               paper.hIndexJournal || paper.quartile);

  const hasYear = paper.year !== null && paper.year !== undefined && paper.year > 1900;

  const hasAbstract = !!(paper.abstract && paper.abstract.length > 50);

  // Count available metrics
  const metrics = [hasCitations, hasJournalMetrics, hasYear, hasAbstract];
  const availableMetrics = metrics.filter(Boolean).length;
  const totalMetrics = metrics.length;

  return {
    hasCitations,
    hasJournalMetrics,
    hasYear,
    hasAbstract,
    completenessScore: Math.round((availableMetrics / totalMetrics) * 100),
    availableMetrics,
    totalMetrics,
  };
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
  // Papers without journal data rely on citation impact
  if (score === 0) return 0;

  // Score is already on 0-100 scale (max: 60 + 25 + 15 = 100)
  return Math.min(score, 100);
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
  abstract?: string | null;
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
  // Phase 10.107: HONEST QUALITY SCORING
  // ============================================
  //
  // PRINCIPLES:
  // 1. Score ONLY what we actually know - no fake/neutral scores
  // 2. Dynamically weight based on available data
  // 3. Papers with less data get scored on fewer dimensions
  // 4. NO artificial boosting OR penalizing for missing data
  //
  // WHAT THE SCORE MEANS:
  // "How impactful is this paper based on the metrics we have?"
  // - A score of 70 with 4/4 metrics = high confidence, strong paper
  // - A score of 70 with 1/4 metrics = low confidence, mostly recency
  // ============================================

  // Calculate what data we actually have
  const metadata = calculateMetadataCompleteness(paper);

  // ============================================
  // COMPONENT SCORES (only for available data)
  // ============================================

  // Citation Impact (only if we have citation data)
  let citationImpact = 0;
  if (metadata.hasCitations) {
    const citationsPerYear = calculateCitationsPerYear(
      paper.citationCount,
      paper.year,
    );
    citationImpact = calculateCitationImpactScore(citationsPerYear);
    citationImpact = applyFieldWeighting(citationImpact, paper.fwci);
  }

  // Journal Prestige (only if we have journal data)
  const journalPrestige = calculateJournalPrestigeScore({
    impactFactor: paper.impactFactor ?? undefined,
    sjrScore: paper.sjrScore ?? undefined,
    hIndex: paper.hIndexJournal ?? undefined,
    quartile: paper.quartile ?? undefined,
  });

  // Recency (always available if year exists)
  const recencyBoost = calculateRecencyBoost(paper.year);

  // ============================================
  // DYNAMIC WEIGHTING BASED ON AVAILABLE DATA
  // ============================================
  //
  // Instead of inventing neutral scores, we REDISTRIBUTE weights
  // to only include components we actually have data for.
  //
  // Example: If we have NO citations but HAVE journal metrics:
  // - Old way: citations = 40 (fake neutral), journal = real
  // - New way: citations excluded, journal weight increased
  //
  // This is HONEST: score reflects only real data
  // ============================================

  // Define base weights (when all data available)
  const CITATION_BASE = 35;   // 35% when available
  const JOURNAL_BASE = 45;    // 45% when available
  const RECENCY_BASE = 20;    // 20% always (year usually available)

  // Calculate actual weights based on available data
  let citationWeight = 0;
  let journalWeight = 0;
  let recencyWeight = 0;

  // Determine which components are available
  const hasCitationScore = metadata.hasCitations && citationImpact >= 0;
  const hasJournalScore = metadata.hasJournalMetrics && journalPrestige > 0;
  const hasRecencyScore = metadata.hasYear;

  // Calculate total available weight
  let totalAvailableWeight = 0;
  if (hasCitationScore) totalAvailableWeight += CITATION_BASE;
  if (hasJournalScore) totalAvailableWeight += JOURNAL_BASE;
  if (hasRecencyScore) totalAvailableWeight += RECENCY_BASE;

  // If no quality data at all, give minimum score based on recency only
  if (totalAvailableWeight === 0) {
    // No quality metrics available - score is just recency (50 = neutral)
    const coreScore = hasRecencyScore ? recencyBoost * 0.5 : 25; // 25 = unknown
    return {
      citationImpact: 0,
      journalPrestige: 0,
      recencyBoost,
      openAccessBonus: calculateOpenAccessBonus(paper.isOpenAccess),
      reproducibilityBonus: calculateReproducibilityBonus(paper.hasDataCode),
      altmetricBonus: calculateAltmetricBonus(paper.altmetricScore),
      coreScore: Math.round(coreScore * 10) / 10,
      totalScore: Math.round(Math.min(coreScore + calculateOpenAccessBonus(paper.isOpenAccess), 100) * 10) / 10,
    };
  }

  // Redistribute weights proportionally among available components
  if (hasCitationScore) {
    citationWeight = CITATION_BASE / totalAvailableWeight;
  }
  if (hasJournalScore) {
    journalWeight = JOURNAL_BASE / totalAvailableWeight;
  }
  if (hasRecencyScore) {
    recencyWeight = RECENCY_BASE / totalAvailableWeight;
  }

  // Calculate weighted core score (0-100)
  let coreScore =
    (hasCitationScore ? citationImpact * citationWeight : 0) +
    (hasJournalScore ? journalPrestige * journalWeight : 0) +
    (hasRecencyScore ? recencyBoost * recencyWeight : 0);

  // ============================================
  // SCORE CAP BASED ON DATA COMPLETENESS
  // ============================================
  //
  // PROBLEM: With dynamic weighting, papers with only recency data
  // could score 86+ (just because they're recent). This is unfair
  // because we don't actually know their quality.
  //
  // SOLUTION: Cap maximum score based on data completeness.
  // Less data = less confidence = lower maximum possible score.
  //
  // This ensures:
  // - Papers with full data CAN reach 100
  // - Papers with partial data are capped at a reasonable level
  // - Papers with minimal data get modest "unknown" scores
  //
  // Score Caps:
  // - 4/4 metrics: max 100 (full confidence)
  // - 3/4 metrics: max 85 (high confidence)
  // - 2/4 metrics: max 65 (moderate confidence)
  // - 1/4 metrics: max 45 (low confidence - mostly unknown)
  // - 0/4 metrics: max 25 (no data - truly unknown)
  // ============================================

  // Phase 10.114: Raised score caps to allow papers with partial metadata to reach 80%+
  // Previous caps were too restrictive:
  // - 2/4 metrics → max 65 (impossible to reach 80% threshold)
  // - 3/4 metrics → max 85 (barely reaches 80%)
  // New caps enable quality-first search strategy:
  // - 2/4 metrics → max 80 (can now reach quality threshold)
  // - 3/4 metrics → max 92 (comfortable headroom for excellent papers)
  const SCORE_CAPS = [30, 55, 80, 92, 100]; // 0, 1, 2, 3, 4 metrics
  const maxScore = SCORE_CAPS[metadata.availableMetrics] ?? 100;

  // Apply cap: paper's score cannot exceed its data completeness allows
  coreScore = Math.min(coreScore, maxScore);

  // ============================================
  // OPTIONAL BONUSES (when applicable)
  // ============================================

  const openAccessBonus = calculateOpenAccessBonus(paper.isOpenAccess);
  const reproducibilityBonus = calculateReproducibilityBonus(paper.hasDataCode);
  const altmetricBonus = calculateAltmetricBonus(paper.altmetricScore);

  // Sum all bonuses (max +20)
  const totalBonus = openAccessBonus + reproducibilityBonus + altmetricBonus;

  // Final score: core + bonuses, hard cap at 100
  // Phase 10.115: Fixed bug where scores could exceed 100
  const totalScore = Math.min(coreScore + totalBonus, 100);

  // ============================================
  // RETURN COMPONENTS
  // ============================================

  return {
    citationImpact: hasCitationScore ? citationImpact : 0,
    journalPrestige: hasJournalScore ? journalPrestige : 0,
    recencyBoost,
    openAccessBonus,
    reproducibilityBonus,
    altmetricBonus,
    coreScore: Math.round(coreScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
    metadataCompleteness: metadata,
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
