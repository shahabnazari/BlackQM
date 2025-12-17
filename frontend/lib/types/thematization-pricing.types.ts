/**
 * Phase 10.175: Thematization Pricing Types (Frontend)
 *
 * TypeScript type definitions for thematization tier selection and pricing.
 * Mirrors backend types for type safety across the stack.
 *
 * PRICING MODEL:
 * - Tier 50:  10 credits (Quick Analysis)
 * - Tier 100: 15 credits (Standard Analysis)
 * - Tier 150: 20 credits (Deep Analysis)
 * - Tier 200: 25 credits (Comprehensive Analysis)
 * - Tier 250: 30 credits (Expert Analysis)
 * - Tier 300: 35 credits (Full Research Analysis)
 *
 * @module thematization-pricing.types
 * @since Phase 10.175
 */

// ============================================================================
// TIER TYPES
// ============================================================================

/**
 * Valid paper count tiers for thematization
 */
export type ThematizationTierCount = 50 | 100 | 150 | 200 | 250 | 300;

/**
 * Array of all valid tier counts (for iteration)
 */
export const THEMATIZATION_TIERS: readonly ThematizationTierCount[] = [
  50, 100, 150, 200, 250, 300,
] as const;

/**
 * Type guard for ThematizationTierCount
 */
export function isValidTier(value: unknown): value is ThematizationTierCount {
  return typeof value === 'number' && THEMATIZATION_TIERS.includes(value as ThematizationTierCount);
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

/**
 * Configuration for a single tier
 */
export interface TierConfig {
  /** Paper count for this tier */
  readonly paperCount: ThematizationTierCount;
  /** Display name */
  readonly displayName: string;
  /** Short description */
  readonly description: string;
  /** Base cost in credits */
  readonly baseCostCredits: number;
  /** Estimated processing time in minutes */
  readonly estimatedTimeMinutes: number;
  /** Recommended use cases */
  readonly useCases: readonly string[];
  /** Whether this tier is popular/recommended */
  readonly isRecommended?: boolean;
}

/**
 * All tier configurations
 */
export const TIER_CONFIGS: Readonly<Record<ThematizationTierCount, TierConfig>> = {
  50: {
    paperCount: 50,
    displayName: 'Quick Analysis',
    description: 'Fast thematic analysis for initial exploration',
    baseCostCredits: 10,
    estimatedTimeMinutes: 2,
    useCases: ['Pilot studies', 'Initial exploration', 'Quick insights'],
  },
  100: {
    paperCount: 100,
    displayName: 'Standard Analysis',
    description: 'Balanced depth and breadth for most research needs',
    baseCostCredits: 15,
    estimatedTimeMinutes: 4,
    useCases: ['Course projects', 'Literature reviews', 'Conference papers'],
    isRecommended: true,
  },
  150: {
    paperCount: 150,
    displayName: 'Deep Analysis',
    description: 'Comprehensive coverage with deeper theme exploration',
    baseCostCredits: 20,
    estimatedTimeMinutes: 6,
    useCases: ['Thesis research', 'Journal articles', 'Grant proposals'],
  },
  200: {
    paperCount: 200,
    displayName: 'Comprehensive Analysis',
    description: 'Extensive analysis for thorough research projects',
    baseCostCredits: 25,
    estimatedTimeMinutes: 10,
    useCases: ['PhD dissertations', 'Systematic reviews', 'Meta-analyses'],
  },
  250: {
    paperCount: 250,
    displayName: 'Expert Analysis',
    description: 'Expert-level depth for complex research domains',
    baseCostCredits: 30,
    estimatedTimeMinutes: 15,
    useCases: ['Multi-disciplinary research', 'Policy analysis', 'Expert reports'],
  },
  300: {
    paperCount: 300,
    displayName: 'Full Research Analysis',
    description: 'Maximum coverage for the most demanding research',
    baseCostCredits: 35,
    estimatedTimeMinutes: 20,
    useCases: ['Comprehensive literature mapping', 'Field-wide analysis', 'Book chapters'],
  },
} as const;

/**
 * Get tier configuration by paper count
 */
export function getTierConfig(tier: ThematizationTierCount): TierConfig {
  return TIER_CONFIGS[tier];
}

// ============================================================================
// PIPELINE FLAGS
// ============================================================================

/**
 * Optional pipeline feature flags
 */
export interface ThematizationPipelineFlags {
  /** Enable Theme-Fit scoring (Week 2) */
  readonly enableThemeFit: boolean;
  /** Enable hierarchical extraction (Week 3) */
  readonly enableHierarchical: boolean;
  /** Enable controversy analysis (Week 4) */
  readonly enableControversy: boolean;
  /** Enable claim extraction (Week 5) */
  readonly enableClaimExtraction: boolean;
}

/**
 * Default pipeline flags (all disabled except ThemeFit)
 */
export const DEFAULT_PIPELINE_FLAGS: ThematizationPipelineFlags = {
  enableThemeFit: true,
  enableHierarchical: false,
  enableControversy: false,
  enableClaimExtraction: false,
} as const;

/**
 * Feature cost in credits
 */
export const FEATURE_COST_CREDITS = 5;

/**
 * Feature metadata for UI display
 */
export interface FeatureMetadata {
  readonly flag: keyof ThematizationPipelineFlags;
  readonly displayName: string;
  readonly description: string;
  readonly costCredits: number;
  readonly icon: string;
}

/**
 * All feature metadata
 */
export const FEATURE_METADATA: readonly FeatureMetadata[] = [
  {
    flag: 'enableThemeFit',
    displayName: 'Theme-Fit Scoring',
    description: 'Pre-filter papers by relevance to research context',
    costCredits: 0, // Included by default
    icon: 'target',
  },
  {
    flag: 'enableHierarchical',
    displayName: 'Hierarchical Themes',
    description: 'Extract parent-child theme relationships',
    costCredits: FEATURE_COST_CREDITS,
    icon: 'git-branch',
  },
  {
    flag: 'enableControversy',
    displayName: 'Controversy Analysis',
    description: 'Identify controversial topics and opposing viewpoints',
    costCredits: FEATURE_COST_CREDITS,
    icon: 'alert-triangle',
  },
  {
    flag: 'enableClaimExtraction',
    displayName: 'Claim Extraction',
    description: 'Extract key claims for Q-methodology statements',
    costCredits: FEATURE_COST_CREDITS,
    icon: 'message-square',
  },
] as const;

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  readonly tier: SubscriptionTier;
  readonly displayName: string;
  readonly monthlyCredits: number;
  readonly priceUSD: number;
  readonly features: readonly string[];
  readonly discountPercent: number;
  readonly color: string;
}

/**
 * All subscription configurations
 */
export const SUBSCRIPTION_CONFIGS: Readonly<Record<SubscriptionTier, SubscriptionConfig>> = {
  free: {
    tier: 'free',
    displayName: 'Free',
    monthlyCredits: 30,
    priceUSD: 0,
    features: ['Up to 3 jobs/month', 'Tier 50 only', 'Basic support'],
    discountPercent: 0,
    color: 'gray',
  },
  basic: {
    tier: 'basic',
    displayName: 'Basic',
    monthlyCredits: 100,
    priceUSD: 9.99,
    features: ['Up to 10 jobs/month', 'All tiers', 'Email support', 'Theme-Fit scoring'],
    discountPercent: 0,
    color: 'blue',
  },
  pro: {
    tier: 'pro',
    displayName: 'Pro',
    monthlyCredits: 300,
    priceUSD: 29.99,
    features: [
      'Unlimited jobs',
      'All tiers',
      'Priority support',
      'All features included',
      'API access',
    ],
    discountPercent: 10,
    color: 'purple',
  },
  enterprise: {
    tier: 'enterprise',
    displayName: 'Enterprise',
    monthlyCredits: 1000,
    priceUSD: 99.99,
    features: [
      'Unlimited jobs',
      'All tiers',
      'Dedicated support',
      'All features included',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    discountPercent: 20,
    color: 'amber',
  },
} as const;

// ============================================================================
// COST ESTIMATION
// ============================================================================

/**
 * Breakdown by feature (mutable for construction)
 */
interface CostBreakdown {
  tier: number;
  hierarchical?: number;
  controversy?: number;
  claimExtraction?: number;
}

/**
 * Discounts breakdown (mutable for construction)
 */
interface DiscountsBreakdown {
  subscriptionDiscount?: number;
  bulkDiscount?: number;
  promoDiscount?: number;
}

/**
 * Cost estimate result
 */
export interface CostEstimate {
  /** Base cost in credits */
  baseCost: number;
  /** Feature costs in credits */
  featureCosts: number;
  /** Total cost before discounts */
  totalCost: number;
  /** Breakdown by feature */
  breakdown: CostBreakdown;
}

/**
 * Detailed cost breakdown with discounts
 */
export interface DetailedCostBreakdown extends CostEstimate {
  /** Cost in USD */
  costUSD: number;
  /** Applied discounts */
  discounts: DiscountsBreakdown;
  /** Final cost after discounts */
  finalCost: number;
  /** Remaining credits after job (undefined if not provided) */
  remainingCredits: number | undefined;
}

/**
 * Credit to USD conversion rate
 */
export const CREDITS_TO_USD = 0.10;

/**
 * Calculate cost estimate for a tier and flags
 */
export function calculateCostEstimate(
  tier: ThematizationTierCount,
  flags: ThematizationPipelineFlags = DEFAULT_PIPELINE_FLAGS,
): CostEstimate {
  const tierConfig = getTierConfig(tier);
  const baseCost = tierConfig.baseCostCredits;

  const breakdown: CostBreakdown = {
    tier: baseCost,
  };

  let featureCosts = 0;

  if (flags.enableHierarchical) {
    breakdown.hierarchical = FEATURE_COST_CREDITS;
    featureCosts += FEATURE_COST_CREDITS;
  }

  if (flags.enableControversy) {
    breakdown.controversy = FEATURE_COST_CREDITS;
    featureCosts += FEATURE_COST_CREDITS;
  }

  if (flags.enableClaimExtraction) {
    breakdown.claimExtraction = FEATURE_COST_CREDITS;
    featureCosts += FEATURE_COST_CREDITS;
  }

  return {
    baseCost,
    featureCosts,
    totalCost: baseCost + featureCosts,
    breakdown,
  };
}

/**
 * Calculate detailed cost with discounts
 */
export function calculateDetailedCost(
  tier: ThematizationTierCount,
  flags: ThematizationPipelineFlags,
  subscription: SubscriptionTier,
  remainingCredits?: number,
): DetailedCostBreakdown {
  const estimate = calculateCostEstimate(tier, flags);
  const subscriptionConfig = SUBSCRIPTION_CONFIGS[subscription];

  const discounts: DiscountsBreakdown = {};
  let finalCost = estimate.totalCost;

  // Apply subscription discount
  if (subscriptionConfig.discountPercent > 0) {
    discounts.subscriptionDiscount = Math.floor(
      (estimate.totalCost * subscriptionConfig.discountPercent) / 100
    );
    finalCost -= discounts.subscriptionDiscount;
  }

  return {
    ...estimate,
    costUSD: finalCost * CREDITS_TO_USD,
    discounts,
    finalCost,
    remainingCredits: remainingCredits !== undefined
      ? remainingCredits - finalCost
      : undefined,
  };
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`;
}

/**
 * Format USD for display
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format time estimate for display
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 minute';
  }
  if (minutes === 1) {
    return '~1 minute';
  }
  if (minutes < 60) {
    return `~${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `~${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `~${hours}h ${remainingMinutes}m`;
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: ThematizationTierCount): string {
  switch (tier) {
    case 50:
      return 'bg-gray-100 text-gray-700';
    case 100:
      return 'bg-blue-100 text-blue-700';
    case 150:
      return 'bg-green-100 text-green-700';
    case 200:
      return 'bg-purple-100 text-purple-700';
    case 250:
      return 'bg-amber-100 text-amber-700';
    case 300:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Alias for THEMATIZATION_TIERS for hook compatibility
 */
export const TIER_VALUES = THEMATIZATION_TIERS;

/**
 * Check if a tier is available based on paper count
 */
export function isTierAvailable(tier: ThematizationTierCount, availablePapers: number): boolean {
  return availablePapers >= tier;
}

/**
 * Check if user can afford a tier with given flags
 */
export function canAffordTier(
  tier: ThematizationTierCount,
  flags: ThematizationPipelineFlags,
  subscription: SubscriptionTier,
  remainingCredits: number
): boolean {
  const cost = calculateDetailedCost(tier, flags, subscription, remainingCredits);
  return remainingCredits >= cost.finalCost;
}

/**
 * Get recommended tier based on available papers
 */
export function getRecommendedTier(availablePapers: number): ThematizationTierCount {
  // Find the largest tier that fits within available papers
  const availableTiers = THEMATIZATION_TIERS.filter(t => t <= availablePapers);
  if (availableTiers.length === 0) {
    return 50; // Minimum tier
  }
  // Return the recommended tier (100) if available, otherwise largest available
  if (availableTiers.includes(100)) {
    return 100;
  }
  // Safe access since we know length > 0 from check above
  const lastTier = availableTiers[availableTiers.length - 1];
  return lastTier !== undefined ? lastTier : 50;
}

/**
 * Validation result type
 */
export interface TierValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a tier selection
 */
export function validateTier(
  tier: ThematizationTierCount,
  availablePapers: number,
  remainingCredits: number
): TierValidationResult {
  const errors: string[] = [];

  if (!isTierAvailable(tier, availablePapers)) {
    errors.push(`Need at least ${tier} papers (have ${availablePapers})`);
  }

  const tierConfig = getTierConfig(tier);
  if (remainingCredits < tierConfig.baseCostCredits) {
    errors.push(`Insufficient credits (need ${tierConfig.baseCostCredits}, have ${remainingCredits})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
