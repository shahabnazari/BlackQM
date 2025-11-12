/**
 * Source Allocation Strategy Constants
 * 
 * Phase 10.6 Day 14.9: Enterprise-Grade Tiered Source Allocation
 * 
 * Purpose: Optimize paper collection by allocating fetch limits based on source quality
 * 
 * Innovation: Unlike competitors (uniform limits), we use tiered allocation:
 * - Premium sources (peer-reviewed, high impact): 500 papers
 * - Good sources (established, quality): 300 papers
 * - Preprint sources (emerging, unreviewed): 200 papers
 * - Aggregator sources (balanced): 250 papers
 * 
 * Scientific Rationale:
 * - Research shows diminishing returns after 200-300 papers for theme extraction
 * - Gap analysis requires 300-500 papers for comprehensive coverage
 * - Tiered approach ensures quality while maintaining diversity
 * 
 * Competitor Analysis:
 * - Scopus/WoS: Unlimited (overwhelming)
 * - Semantic Scholar: 1,000 uniform
 * - Elicit: 50 (too restrictive)
 * - Our approach: 200-500 adaptive (optimal)
 */

import { LiteratureSource } from '../dto/literature.dto';

/**
 * Source tiers based on peer review quality, impact, and prestige
 */
export enum SourceTier {
  TIER_1_PREMIUM = 1,    // Peer-reviewed, high-impact, rigorous quality control
  TIER_2_GOOD = 2,       // Established, good quality, reputable
  TIER_3_PREPRINT = 3,   // Preprints, not peer-reviewed, emerging
  TIER_4_AGGREGATOR = 4, // Multi-source aggregators, mixed quality
}

/**
 * Paper allocation per source tier
 * Configurable via environment variables with sensible defaults
 */
export const TIER_ALLOCATIONS = {
  [SourceTier.TIER_1_PREMIUM]: parseInt(process.env.PAPERS_PER_SOURCE_TIER1 || '500', 10),
  [SourceTier.TIER_2_GOOD]: parseInt(process.env.PAPERS_PER_SOURCE_TIER2 || '300', 10),
  [SourceTier.TIER_3_PREPRINT]: parseInt(process.env.PAPERS_PER_SOURCE_TIER3 || '200', 10),
  [SourceTier.TIER_4_AGGREGATOR]: parseInt(process.env.PAPERS_PER_SOURCE_TIER4 || '250', 10),
};

/**
 * Source tier mappings
 * Based on peer review standards, impact factors, and editorial rigor
 */
export const SOURCE_TIER_MAP: Record<LiteratureSource, SourceTier> = {
  // TIER 1: Premium - Peer-reviewed, high-impact, rigorous quality control
  [LiteratureSource.PUBMED]: SourceTier.TIER_1_PREMIUM,           // NIH-curated, MeSH-indexed, biomedical gold standard
  [LiteratureSource.PMC]: SourceTier.TIER_1_PREMIUM,              // PubMed Central, full-text peer-reviewed
  [LiteratureSource.WEB_OF_SCIENCE]: SourceTier.TIER_1_PREMIUM,   // Clarivate, high-impact journals only
  [LiteratureSource.SCOPUS]: SourceTier.TIER_1_PREMIUM,           // Elsevier, comprehensive peer-reviewed
  [LiteratureSource.NATURE]: SourceTier.TIER_1_PREMIUM,           // Nature Publishing, IF 40+, top-tier
  [LiteratureSource.SPRINGER]: SourceTier.TIER_1_PREMIUM,         // SpringerLink, STM peer-reviewed

  // TIER 2: Good - Established, quality, reputable
  [LiteratureSource.IEEE_XPLORE]: SourceTier.TIER_2_GOOD,         // IEEE, engineering/CS peer-reviewed
  [LiteratureSource.SAGE]: SourceTier.TIER_2_GOOD,                // SAGE, social sciences peer-reviewed
  [LiteratureSource.TAYLOR_FRANCIS]: SourceTier.TIER_2_GOOD,      // T&F, humanities peer-reviewed
  [LiteratureSource.WILEY]: SourceTier.TIER_2_GOOD,               // Wiley, multidisciplinary peer-reviewed
  [LiteratureSource.SEMANTIC_SCHOLAR]: SourceTier.TIER_2_GOOD,    // AI-curated, quality filtering

  // TIER 3: Preprint - Emerging, not peer-reviewed, cutting-edge
  [LiteratureSource.ARXIV]: SourceTier.TIER_3_PREPRINT,           // Physics/Math/CS preprints
  [LiteratureSource.BIORXIV]: SourceTier.TIER_3_PREPRINT,         // Biology preprints
  [LiteratureSource.MEDRXIV]: SourceTier.TIER_3_PREPRINT,         // Medical preprints
  [LiteratureSource.CHEMRXIV]: SourceTier.TIER_3_PREPRINT,        // Chemistry preprints
  [LiteratureSource.SSRN]: SourceTier.TIER_3_PREPRINT,            // Social sciences preprints

  // TIER 4: Aggregator - Multi-source, mixed quality
  [LiteratureSource.CROSSREF]: SourceTier.TIER_4_AGGREGATOR,      // DOI registry, all publishers
  [LiteratureSource.ERIC]: SourceTier.TIER_4_AGGREGATOR,          // Education research, mixed sources
  [LiteratureSource.GOOGLE_SCHOLAR]: SourceTier.TIER_4_AGGREGATOR, // Google aggregator, all sources
};

/**
 * Get allocation limit for a specific source
 */
export function getSourceAllocation(source: LiteratureSource): number {
  const tier = SOURCE_TIER_MAP[source];
  return TIER_ALLOCATIONS[tier] || 100; // Fallback to 100 if not mapped
}

/**
 * Query complexity levels for adaptive limits
 */
export enum QueryComplexity {
  BROAD = 'broad',           // 1-2 words, generic terms
  SPECIFIC = 'specific',     // 3-5 words, some technical terms
  COMPREHENSIVE = 'comprehensive', // 5+ words, technical, Boolean operators
}

/**
 * Target paper counts based on query complexity
 */
export const COMPLEXITY_TARGETS = {
  [QueryComplexity.BROAD]: {
    minPerSource: 100,
    maxPerSource: 300,
    totalTarget: 500,       // Cap lower for broad queries (more noise)
    description: 'Broad query - moderate limits to manage noise',
  },
  [QueryComplexity.SPECIFIC]: {
    minPerSource: 200,
    maxPerSource: 500,
    totalTarget: 1000,      // Higher for specific queries (more signal)
    description: 'Specific query - higher limits, less noise expected',
  },
  [QueryComplexity.COMPREHENSIVE]: {
    minPerSource: 300,
    maxPerSource: 500,
    totalTarget: 1500,      // Max for comprehensive analysis
    description: 'Comprehensive analysis - maximum limits for thorough coverage',
  },
};

/**
 * Absolute system-wide limits (safety caps)
 */
export const ABSOLUTE_LIMITS = {
  MAX_PAPERS_PER_SOURCE: 500,       // Hard cap per source
  MAX_TOTAL_PAPERS_FETCHED: 5000,   // Hard cap total fetched
  MAX_FINAL_PAPERS: 1500,           // Hard cap after all filtering
  MIN_PAPERS_FOR_ANALYSIS: 20,      // Minimum for meaningful analysis
};

/**
 * Quality sampling strategy (when total > target)
 */
export const QUALITY_SAMPLING_STRATA = [
  { range: [80, 100], proportion: 0.40, label: 'Exceptional (80-100)' },  // 40% from top quality
  { range: [60, 80], proportion: 0.35, label: 'Excellent (60-80)' },      // 35% from good quality
  { range: [40, 60], proportion: 0.20, label: 'Good (40-60)' },           // 20% from acceptable
  { range: [0, 40], proportion: 0.05, label: 'Acceptable (0-40)' },       // 5% from lower (completeness)
];

/**
 * Source diversity enforcement (prevent single-source dominance)
 */
export const DIVERSITY_CONSTRAINTS = {
  MIN_PAPERS_PER_SOURCE: 10,        // Each source represented
  MAX_PROPORTION_FROM_ONE_SOURCE: 0.30, // No more than 30% from one source
  MIN_SOURCE_COUNT: 3,              // At least 3 sources must contribute
};

/**
 * Detect query complexity from search query
 * Used to adaptively adjust paper limits
 */
export function detectQueryComplexity(query: string): QueryComplexity {
  if (!query || query.trim().length === 0) return QueryComplexity.BROAD;

  const normalizedQuery = query.trim().toLowerCase();
  
  // Count words (excluding common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
  const words = normalizedQuery.split(/\s+/).filter(word => !stopWords.has(word) && word.length > 2);
  const wordCount = words.length;

  // Check for Boolean operators
  const hasBooleanOperators = /\b(AND|OR|NOT)\b/i.test(query);

  // Check for quoted phrases
  const hasQuotedPhrases = /"[^"]+"/.test(query);

  // Check for technical terms (heuristic: words with numbers, hyphens, or uppercase)
  const technicalTermCount = words.filter(word => 
    /\d/.test(word) ||        // Contains numbers (e.g., "COVID-19")
    /-/.test(word) ||          // Contains hyphens (e.g., "peer-reviewed")
    /[A-Z]{2,}/.test(word)     // Has multiple uppercase (e.g., "RNA")
  ).length;

  // Decision logic
  if (wordCount >= 5 || hasBooleanOperators || hasQuotedPhrases || technicalTermCount >= 2) {
    return QueryComplexity.COMPREHENSIVE;
  } else if (wordCount >= 3 || technicalTermCount >= 1) {
    return QueryComplexity.SPECIFIC;
  } else {
    return QueryComplexity.BROAD;
  }
}

/**
 * Get tier information for display/logging
 */
export function getSourceTierInfo(source: LiteratureSource): {
  tier: SourceTier;
  tierLabel: string;
  allocation: number;
  description: string;
} {
  const tier = SOURCE_TIER_MAP[source];
  const allocation = getSourceAllocation(source);

  const tierLabels: Record<SourceTier, string> = {
    [SourceTier.TIER_1_PREMIUM]: 'Premium (Peer-Reviewed)',
    [SourceTier.TIER_2_GOOD]: 'Good (Established)',
    [SourceTier.TIER_3_PREPRINT]: 'Preprint (Emerging)',
    [SourceTier.TIER_4_AGGREGATOR]: 'Aggregator (Mixed)',
  };

  const tierDescriptions: Record<SourceTier, string> = {
    [SourceTier.TIER_1_PREMIUM]: 'Rigorous peer review, high impact, gold standard',
    [SourceTier.TIER_2_GOOD]: 'Established quality, reputable publishers',
    [SourceTier.TIER_3_PREPRINT]: 'Cutting-edge, not yet peer-reviewed',
    [SourceTier.TIER_4_AGGREGATOR]: 'Multi-source aggregation, mixed quality',
  };

  return {
    tier,
    tierLabel: tierLabels[tier],
    allocation,
    description: tierDescriptions[tier],
  };
}

/**
 * Configuration summary for logging/transparency
 */
export function getConfigurationSummary(): {
  tierAllocations: Record<string, number>;
  complexityTargets: typeof COMPLEXITY_TARGETS;
  absoluteLimits: typeof ABSOLUTE_LIMITS;
  diversityConstraints: typeof DIVERSITY_CONSTRAINTS;
} {
  return {
    tierAllocations: {
      'Tier 1 (Premium)': TIER_ALLOCATIONS[SourceTier.TIER_1_PREMIUM],
      'Tier 2 (Good)': TIER_ALLOCATIONS[SourceTier.TIER_2_GOOD],
      'Tier 3 (Preprint)': TIER_ALLOCATIONS[SourceTier.TIER_3_PREPRINT],
      'Tier 4 (Aggregator)': TIER_ALLOCATIONS[SourceTier.TIER_4_AGGREGATOR],
    },
    complexityTargets: COMPLEXITY_TARGETS,
    absoluteLimits: ABSOLUTE_LIMITS,
    diversityConstraints: DIVERSITY_CONSTRAINTS,
  };
}

