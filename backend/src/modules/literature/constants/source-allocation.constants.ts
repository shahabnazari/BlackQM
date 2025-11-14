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
 * 
 * Phase 10.7 Day 5: Increased allocations to ensure minimum 350 papers
 * Competitive Edge: 2-7x more papers than Elicit (50), Semantic Scholar (100-200)
 */
export const TIER_ALLOCATIONS = {
  [SourceTier.TIER_1_PREMIUM]: parseInt(process.env.PAPERS_PER_SOURCE_TIER1 || '600', 10),    // Increased from 500
  [SourceTier.TIER_2_GOOD]: parseInt(process.env.PAPERS_PER_SOURCE_TIER2 || '450', 10),       // Increased from 300
  [SourceTier.TIER_3_PREPRINT]: parseInt(process.env.PAPERS_PER_SOURCE_TIER3 || '350', 10),   // Increased from 200
  [SourceTier.TIER_4_AGGREGATOR]: parseInt(process.env.PAPERS_PER_SOURCE_TIER4 || '400', 10), // Increased from 250
};

/**
 * Source tier mappings
 * Based on peer review standards, impact factors, and editorial rigor
 */
export const SOURCE_TIER_MAP: Record<LiteratureSource, SourceTier> = {
  // TIER 1: Premium - Peer-reviewed, high-impact, rigorous quality control
  // Phase 10.7 Day 5: Ordered by article count (highest first for efficiency)
  [LiteratureSource.SEMANTIC_SCHOLAR]: SourceTier.TIER_1_PREMIUM, // 220M+ papers, AI-curated, MOVED FROM TIER 2
  [LiteratureSource.WEB_OF_SCIENCE]: SourceTier.TIER_1_PREMIUM,   // 100M+ Clarivate, high-impact journals
  [LiteratureSource.SCOPUS]: SourceTier.TIER_1_PREMIUM,           // 90M+ Elsevier, comprehensive peer-reviewed
  [LiteratureSource.PUBMED]: SourceTier.TIER_1_PREMIUM,           // 36M+ NIH-curated, MeSH-indexed, biomedical gold standard
  [LiteratureSource.PMC]: SourceTier.TIER_1_PREMIUM,              // 10M+ PubMed Central, full-text peer-reviewed
  [LiteratureSource.SPRINGER]: SourceTier.TIER_1_PREMIUM,         // 10M+ SpringerLink, STM peer-reviewed
  [LiteratureSource.NATURE]: SourceTier.TIER_1_PREMIUM,           // 500k+ Nature Publishing, IF 40+, top-tier

  // TIER 2: Good - Established, quality, reputable
  // Phase 10.7 Day 5: Ordered by article count (highest first for efficiency)
  [LiteratureSource.WILEY]: SourceTier.TIER_2_GOOD,               // 6M+ Wiley, multidisciplinary peer-reviewed
  [LiteratureSource.IEEE_XPLORE]: SourceTier.TIER_2_GOOD,         // 5M+ IEEE, engineering/CS peer-reviewed
  [LiteratureSource.TAYLOR_FRANCIS]: SourceTier.TIER_2_GOOD,      // 2.5M+ T&F, humanities peer-reviewed
  [LiteratureSource.SAGE]: SourceTier.TIER_2_GOOD,                // 1.2M+ SAGE, social sciences peer-reviewed

  // TIER 3: Preprint - Emerging, not peer-reviewed, cutting-edge
  // Phase 10.7 Day 5: REMOVED bioRxiv (220k), medRxiv (45k), ChemRxiv (35k) - all <500k papers
  // Phase 10.7 Day 5: Ordered by article count (highest first for efficiency)
  [LiteratureSource.ARXIV]: SourceTier.TIER_3_PREPRINT,           // 2.4M+ Physics/Math/CS preprints
  [LiteratureSource.SSRN]: SourceTier.TIER_3_PREPRINT,            // 1.1M+ Social sciences preprints

  // TIER 4: Aggregator - Multi-source, mixed quality
  // Phase 10.7 Day 5: Ordered by article count (highest first for efficiency)
  [LiteratureSource.GOOGLE_SCHOLAR]: SourceTier.TIER_4_AGGREGATOR, // 400M+ Google aggregator, all sources
  [LiteratureSource.CROSSREF]: SourceTier.TIER_4_AGGREGATOR,      // 145M+ DOI registry, all publishers
  [LiteratureSource.ERIC]: SourceTier.TIER_4_AGGREGATOR,          // 1.7M+ Education research, mixed sources
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
 * 
 * Phase 10.7 Day 5: Updated to realistic, achievable targets
 * Ensures minimum 350 papers for all research purposes:
 * - Gap analysis: 50+ papers minimum
 * - Theme extraction: 100-200 papers (saturation)
 * - Questionnaire building: 200+ papers (comprehensive coverage)
 */
export const COMPLEXITY_TARGETS = {
  [QueryComplexity.BROAD]: {
    minPerSource: 50,
    maxPerSource: 600,      // Increased to match tier allocations
    totalTarget: 500,       // Achievable with increased allocations
    description: 'Broad query - balanced coverage with quality filtering',
  },
  [QueryComplexity.SPECIFIC]: {
    minPerSource: 50,
    maxPerSource: 600,      // Increased to match tier allocations
    totalTarget: 800,       // Decreased from 1000 (more realistic after filtering)
    description: 'Specific query - comprehensive coverage with focused results',
  },
  [QueryComplexity.COMPREHENSIVE]: {
    minPerSource: 100,
    maxPerSource: 600,      // Increased to match tier allocations
    totalTarget: 1200,      // Decreased from 1500 (more realistic after filtering)
    description: 'Comprehensive analysis - maximum coverage with quality assurance',
  },
};

/**
 * Absolute system-wide limits (safety caps)
 * 
 * Phase 10.7 Day 5: Added minimum acceptable papers for researchers
 */
export const ABSOLUTE_LIMITS = {
  MAX_PAPERS_PER_SOURCE: 600,       // Hard cap per source (increased from 500)
  MAX_TOTAL_PAPERS_FETCHED: 6000,   // Hard cap total fetched (increased from 5000)
  MAX_FINAL_PAPERS: 1500,           // Hard cap after all filtering
  MIN_PAPERS_FOR_ANALYSIS: 20,      // Minimum for meaningful analysis
  MIN_ACCEPTABLE_PAPERS: 350,       // Minimum target for research quality (NEW)
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
 * Phase 10.7 Day 5.5: Tiered Source Organization (All sources searched)
 * 
 * Groups sources by quality tier for organized searching:
 * 1. Premium sources first (highest quality, peer-reviewed)
 * 2. Good sources second (established publishers)
 * 3. Preprint sources third (cutting-edge, not yet peer-reviewed)
 * 4. Aggregators fourth (comprehensive coverage, mixed quality)
 * 
 * NOTE: ALL selected sources are searched regardless of results from previous tiers.
 * This ensures comprehensive coverage across all user-selected academic databases.
 * 
 * Competitive Edge: Systematic tier-based organization with full source coverage.
 */
export function groupSourcesByPriority(sources: LiteratureSource[]): {
  tier1Premium: LiteratureSource[];
  tier2Good: LiteratureSource[];
  tier3Preprint: LiteratureSource[];
  tier4Aggregator: LiteratureSource[];
} {
  const tier1Premium: LiteratureSource[] = [];
  const tier2Good: LiteratureSource[] = [];
  const tier3Preprint: LiteratureSource[] = [];
  const tier4Aggregator: LiteratureSource[] = [];

  sources.forEach(source => {
    const tier = SOURCE_TIER_MAP[source];
    switch (tier) {
      case SourceTier.TIER_1_PREMIUM:
        tier1Premium.push(source);
        break;
      case SourceTier.TIER_2_GOOD:
        tier2Good.push(source);
        break;
      case SourceTier.TIER_3_PREPRINT:
        tier3Preprint.push(source);
        break;
      case SourceTier.TIER_4_AGGREGATOR:
        tier4Aggregator.push(source);
        break;
    }
  });

  return {
    tier1Premium,
    tier2Good,
    tier3Preprint,
    tier4Aggregator,
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

