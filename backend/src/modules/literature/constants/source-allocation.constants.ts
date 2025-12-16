/**
 * Source Allocation Strategy Constants
 *
 * Phase 10.159: Maximum Quality Pool Strategy
 *
 * Purpose: Fetch maximum papers from ALL sources to build largest quality pool
 *
 * Strategy: ALL tiers now fetch 500 papers each for maximum diversity:
 * - Premium sources (peer-reviewed, high impact): 500 papers
 * - Good sources (established, quality): 500 papers
 * - Preprint sources (emerging, unreviewed): 500 papers
 * - Aggregator sources (comprehensive): 500 papers
 *
 * Scientific Rationale:
 * - Larger pool = better chance of finding high-quality papers
 * - 600 papers ranked → 300 selected via harmonic mean (relevance × quality)
 * - Composite quality filter ensures BOTH relevance AND quality are high
 *
 * Pipeline: Sources(~3000-4000) → Dedupe(~1500) → BM25(600) → Semantic(600) → Select(300)
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
 * Phase 10.114: Quality-First Search Strategy
 *
 * STRATEGY: Fetch MORE papers initially to increase chance of finding high-quality papers.
 * After collection, filter to 80%+ quality only, return top 300.
 *
 * For literature review, gap analysis, and Q-method statement generation:
 * - Need diverse, high-quality papers from ALL sources
 * - Better to fetch 500/source and filter to 300 excellent papers
 * - Than fetch 100/source and get 50 mediocre papers
 *
 * RATE LIMIT MITIGATION:
 * - Bottleneck rate limiter: 10 req/sec for OpenAlex
 * - Retry with exponential backoff for transient failures
 * - Circuit breaker auto-disables after 10 failures
 *
 * New target: 500 × 7 (Tier 1) + 400 × 4 (Tier 2) + 300 × 2 (Tier 3) + 300 × 5 (Tier 4)
 *           = 3500 + 1600 + 600 + 1500 = 7200 papers max → filter to 300 at 80%+
 */
export const TIER_ALLOCATIONS = {
  // Phase 10.158: Increased all tiers to fetch more papers for better ranking quality
  [SourceTier.TIER_1_PREMIUM]: parseInt(process.env.PAPERS_PER_SOURCE_TIER1 || '500', 10),     // Premium: peer-reviewed, high-impact
  [SourceTier.TIER_2_GOOD]: parseInt(process.env.PAPERS_PER_SOURCE_TIER2 || '500', 10),        // Good: established, reputable (increased from 400)
  [SourceTier.TIER_3_PREPRINT]: parseInt(process.env.PAPERS_PER_SOURCE_TIER3 || '500', 10),    // Preprint: cutting-edge research (increased from 300)
  [SourceTier.TIER_4_AGGREGATOR]: parseInt(process.env.PAPERS_PER_SOURCE_TIER4 || '500', 10),  // Aggregator: diverse coverage (increased from 300)
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
  [LiteratureSource.CORE]: SourceTier.TIER_4_AGGREGATOR,          // 250M+ CORE open access aggregator, 10k+ repositories
  [LiteratureSource.OPENALEX]: SourceTier.TIER_4_AGGREGATOR,      // 250M+ OpenAlex comprehensive database, 100% free
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
 * Phase 10.114: Quality-First Search Strategy
 *
 * STRATEGY: Fetch many, filter to excellent
 * - Fetch up to 8000 papers from all sources
 * - Enrich all with citations/journal metrics
 * - Filter to 80%+ quality score
 * - Return top 300 highest quality papers
 *
 * For literature review, gap analysis, Q-method:
 * - 300 excellent papers > 500 mediocre papers
 * - Comprehensive coverage from all sources
 * - Willing to wait 30-45s for quality results
 */
export const ABSOLUTE_LIMITS = {
  MAX_PAPERS_PER_SOURCE: 500,       // Increased: more papers = better chance of finding gems
  MAX_TOTAL_PAPERS_FETCHED: 8000,   // Increased: 500 × ~16 sources max
  MAX_FINAL_PAPERS: 300,            // Quality over quantity: top 300 at 80%+
  PRE_QUALITY_FILTER_PAPERS: 1000,  // Phase 10.123: NETFLIX-GRADE - Increased from 500 to 1000
                                    // Ensures 300+ papers even with strict 80% quality filter
                                    // Formula: 1000 × 43% (80% threshold pass rate) ≈ 430 papers → take top 300
                                    // Previous: 500 × 43% ≈ 215 papers (insufficient)
  MIN_PAPERS_FOR_ANALYSIS: 20,      // Minimum for meaningful analysis
  MIN_ACCEPTABLE_PAPERS: 50,        // Lower threshold: quality filter handles rest
  QUALITY_THRESHOLD: 80,            // Phase 10.114: Minimum quality score for final results (adaptive relaxation)
};

/**
 * Phase 10.123: Quality Filter Constants (Optimized)
 *
 * Netflix-grade constants for adaptive quality filtering with progressive relaxation.
 * All magic numbers eliminated for maintainability and scalability.
 */
export const QUALITY_FILTER_CONSTANTS = {
  /**
   * Initial quality threshold (80%)
   * Starting point for quality filtering
   */
  INITIAL_THRESHOLD: 80,

  /**
   * Progressive relaxation thresholds
   * System tries these in order until target paper count is achieved
   */
  RELAXATION_THRESHOLDS: [80, 70, 60, 50, 40] as const,

  /**
   * Minimum acceptable quality threshold (40%)
   * Never goes below this to maintain research-grade quality
   */
  MIN_ACCEPTABLE_THRESHOLD: 40,

  /**
   * Quality tier boundaries for distribution analysis
   */
  QUALITY_TIERS: {
    EXCEPTIONAL_MIN: 80,  // 80-100
    EXCELLENT_MIN: 60,    // 60-80
    GOOD_MIN: 40,         // 40-60
    ACCEPTABLE_MIN: 20,   // 20-40
    POOR_MAX: 20,         // 0-20
  },
} as const;

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
  // Phase 10.112 Week 4 FIX: Lowered threshold from 5 to 4 words for COMPREHENSIVE
  // Q-methodology research queries are typically 4-5 words and need all sources queried.
  // Example: "indigenous knowledge in forest management" = 4 words after stop-word removal
  if (wordCount >= 4 || hasBooleanOperators || hasQuotedPhrases || technicalTermCount >= 2) {
    return QueryComplexity.COMPREHENSIVE;
  } else if (wordCount >= 2 || technicalTermCount >= 1) {
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
 * Safe JSON stringification helper (prevents DoS attacks)
 * Truncates large objects to prevent memory exhaustion and event loop blocking
 */
function safeStringify(value: any, maxLength = 200): string {
  try {
    const str = JSON.stringify(value);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '... (truncated)';
    }
    return str;
  } catch (error) {
    return '[unserializable]';
  }
}

/**
 * Phase 10.102 Day 1 - Phase 1.3: Enterprise-Grade Source Tier Allocation
 *
 * @deprecated Phase 10.102 Day 2 - Phase 2: Use SourceAllocationService instead
 * This function is kept for backward compatibility only. New code should inject
 * and use SourceAllocationService which provides:
 * - NestJS dependency injection
 * - Proper Logger integration (no console.*)
 * - Runtime type guards
 * - Better type safety (unknown instead of any)
 *
 * Groups sources by quality tier with Netflix-level defensive programming:
 * 1. Premium sources first (highest quality, peer-reviewed)
 * 2. Good sources second (established publishers)
 * 3. Preprint sources third (cutting-edge, not yet peer-reviewed)
 * 4. Aggregators fourth (comprehensive coverage, mixed quality)
 *
 * ENTERPRISE IMPROVEMENTS (Phase 10.102):
 * ✅ Input validation (null checks, type checks, array validation)
 * ✅ Runtime type normalization (lowercase conversion for case-insensitive matching)
 * ✅ Default case in switch statement (prevents silent failures)
 * ✅ Unmapped source tracking (visibility into allocation failures)
 * ✅ Comprehensive logging (input, allocation, summary, error diagnostics)
 * ✅ Defensive fallback (unmapped sources default to Tier 1)
 * ✅ Allocation verification (alerts if sources are lost)
 * ✅ Safe JSON serialization (prevents DoS via large objects)
 *
 * Bug Fix: Previous version had no default case in switch statement, causing
 * undefined tiers to be silently dropped (0 sources allocated → 0 papers returned).
 *
 * NOTE: ALL selected sources are searched regardless of results from previous tiers.
 * This ensures comprehensive coverage across all user-selected academic databases.
 */
export function groupSourcesByPriority(sources: LiteratureSource[]): {
  tier1Premium: LiteratureSource[];
  tier2Good: LiteratureSource[];
  tier3Preprint: LiteratureSource[];
  tier4Aggregator: LiteratureSource[];
  unmappedSources: LiteratureSource[]; // NEW: Track unmapped sources for debugging
} {
  // ENTERPRISE-GRADE VALIDATION: Input validation
  if (!sources || !Array.isArray(sources)) {
    console.error(
      `[CRITICAL][groupSourcesByPriority] Invalid sources input: expected array, got ${typeof sources}. ` +
      `Value: ${safeStringify(sources, 200)}. Returning empty tier arrays.`
    );
    return {
      tier1Premium: [],
      tier2Good: [],
      tier3Preprint: [],
      tier4Aggregator: [],
      unmappedSources: [],
    };
  }

  if (sources.length === 0) {
    console.warn('[groupSourcesByPriority] Empty sources array provided. No sources to allocate.');
    return {
      tier1Premium: [],
      tier2Good: [],
      tier3Preprint: [],
      tier4Aggregator: [],
      unmappedSources: [],
    };
  }

  // Log input for debugging
  console.log(
    `[groupSourcesByPriority] Processing ${sources.length} sources: ${sources.join(', ')}`
  );

  // Initialize tier arrays
  const tier1Premium: LiteratureSource[] = [];
  const tier2Good: LiteratureSource[] = [];
  const tier3Preprint: LiteratureSource[] = [];
  const tier4Aggregator: LiteratureSource[] = [];
  const unmappedSources: LiteratureSource[] = [];

  sources.forEach((source, index) => {
    // VALIDATION: Check source is not null/undefined/empty
    if (!source || (typeof source === 'string' && source.trim().length === 0)) {
      console.warn(
        `[groupSourcesByPriority] Skipping invalid source at index ${index}: ${JSON.stringify(source)}`
      );
      return;
    }

    // NORMALIZE: Convert to lowercase (handles frontend sending uppercase or mixed case)
    // This makes the mapping case-insensitive for better robustness
    const normalizedSource = (typeof source === 'string'
      ? source.toLowerCase().trim()
      : source) as LiteratureSource;

    // Lookup tier mapping with normalized source
    const tier = SOURCE_TIER_MAP[normalizedSource];

    // DEFENSIVE CHECK: If tier is undefined, log detailed error and fallback
    if (tier === undefined) {
      console.error(
        `[CRITICAL][groupSourcesByPriority] Source not found in SOURCE_TIER_MAP!` +
        `\n  Original source: "${source}"` +
        `\n  Normalized source: "${normalizedSource}"` +
        `\n  Type: ${typeof source}` +
        `\n  Value (JSON): ${safeStringify(source, 100)}` +
        `\n  Index: ${index}` +
        `\n  Available map keys (sample): ${Object.keys(SOURCE_TIER_MAP).slice(0, 5).join(', ')}...` +
        `\n  ⚠️  ACTION: Adding to unmappedSources and defaulting to Tier 1 (Premium) for safety`
      );

      // Track unmapped source for debugging
      unmappedSources.push(normalizedSource);

      // DEFAULT TO TIER 1 (Premium) for safety - ensures source is still searched
      // This prevents silent data loss while logging the issue for investigation
      tier1Premium.push(normalizedSource);
      return;
    }

    // Assign to appropriate tier
    switch (tier) {
      case SourceTier.TIER_1_PREMIUM:
        tier1Premium.push(normalizedSource);
        break;
      case SourceTier.TIER_2_GOOD:
        tier2Good.push(normalizedSource);
        break;
      case SourceTier.TIER_3_PREPRINT:
        tier3Preprint.push(normalizedSource);
        break;
      case SourceTier.TIER_4_AGGREGATOR:
        tier4Aggregator.push(normalizedSource);
        break;
      default:
        // ENTERPRISE DEFENSIVE: This should never happen, but handle it defensively
        console.error(
          `[CRITICAL][groupSourcesByPriority] Unknown tier value: ${tier} for source: "${normalizedSource}". ` +
          `Expected tier values: ${Object.values(SourceTier).join(', ')}. ` +
          `Defaulting to Tier 1 (Premium) for safety.`
        );
        tier1Premium.push(normalizedSource);
    }
  });

  // Log allocation results
  const totalAllocated = tier1Premium.length + tier2Good.length +
                         tier3Preprint.length + tier4Aggregator.length;

  console.log(
    `[groupSourcesByPriority] Allocation complete:` +
    `\n  ✅ Tier 1 (Premium): ${tier1Premium.length} sources${tier1Premium.length > 0 ? ` - ${tier1Premium.join(', ')}` : ''}` +
    `\n  ✅ Tier 2 (Good): ${tier2Good.length} sources${tier2Good.length > 0 ? ` - ${tier2Good.join(', ')}` : ''}` +
    `\n  ✅ Tier 3 (Preprint): ${tier3Preprint.length} sources${tier3Preprint.length > 0 ? ` - ${tier3Preprint.join(', ')}` : ''}` +
    `\n  ✅ Tier 4 (Aggregator): ${tier4Aggregator.length} sources${tier4Aggregator.length > 0 ? ` - ${tier4Aggregator.join(', ')}` : ''}` +
    (unmappedSources.length > 0
      ? `\n  ⚠️  Unmapped: ${unmappedSources.length} sources - ${unmappedSources.join(', ')}`
      : '') +
    `\n  📊 Total allocated: ${totalAllocated}/${sources.length} (${((totalAllocated/sources.length)*100).toFixed(1)}%)`
  );

  // ALERT if sources were lost (should not happen with defensive fallback, but check anyway)
  if (totalAllocated < sources.length) {
    console.error(
      `[CRITICAL][groupSourcesByPriority] Source allocation mismatch! ` +
      `Input: ${sources.length}, Allocated: ${totalAllocated}, Lost: ${sources.length - totalAllocated}. ` +
      `This indicates a critical bug in the allocation logic.`
    );
  }

  return {
    tier1Premium,
    tier2Good,
    tier3Preprint,
    tier4Aggregator,
    unmappedSources,
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

