/**
 * Phase 10.175: Tier Selection Hook
 *
 * React hook for managing thematization tier selection and pricing state.
 * Provides comprehensive state management for tier, flags, and cost calculation.
 *
 * DESIGN PRINCIPLES:
 * - Single source of truth for tier state
 * - Automatic cost recalculation on state changes
 * - Validation helpers for affordability and availability
 * - Memoized for performance
 *
 * @module useTierSelection
 * @since Phase 10.175
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ThematizationTierCount,
  TIER_VALUES,
  ThematizationPipelineFlags,
  DEFAULT_PIPELINE_FLAGS,
  SubscriptionTier,
  DetailedCostBreakdown,
  calculateDetailedCost,
  getTierConfig,
  isTierAvailable,
  canAffordTier,
  getRecommendedTier,
  validateTier,
  FEATURE_METADATA,
} from '../types/thematization-pricing.types';
import { logger } from '../utils/logger';

// ============================================================================
// HOOK INTERFACES
// ============================================================================

/**
 * Tier selection state
 */
export interface TierSelectionState {
  /** Selected tier (null if none selected) */
  selectedTier: ThematizationTierCount | null;
  /** Pipeline feature flags */
  flags: ThematizationPipelineFlags;
  /** Whether selection is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
}

/**
 * Tier selection actions
 */
export interface TierSelectionActions {
  /** Select a tier */
  selectTier: (tier: ThematizationTierCount | null) => void;
  /** Update pipeline flags */
  setFlags: (flags: ThematizationPipelineFlags) => void;
  /** Toggle a specific flag */
  toggleFlag: (flag: keyof ThematizationPipelineFlags) => void;
  /** Enable all flags */
  enableAllFlags: () => void;
  /** Reset to defaults */
  reset: () => void;
  /** Select recommended tier based on available papers */
  selectRecommended: (availablePapers: number) => void;
}

/**
 * Tier selection computed values
 */
export interface TierSelectionComputed {
  /** Cost breakdown (null if no tier selected) */
  costBreakdown: DetailedCostBreakdown | null;
  /** Selected tier config (null if no tier selected) */
  tierConfig: ReturnType<typeof getTierConfig> | null;
  /** Can user afford selected tier */
  canAfford: boolean;
  /** Is selected tier available (enough papers) */
  isAvailable: boolean;
  /** Total feature cost */
  totalFeatureCost: number;
  /** Number of enabled features */
  enabledFeatureCount: number;
  /** Enabled feature names */
  enabledFeatureNames: string[];
}

/**
 * Hook return type
 */
export interface UseTierSelectionReturn {
  /** Current state */
  state: TierSelectionState;
  /** Actions to modify state */
  actions: TierSelectionActions;
  /** Computed values */
  computed: TierSelectionComputed;
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UseTierSelectionOptions {
  /** Initial tier selection */
  initialTier?: ThematizationTierCount | null;
  /** Initial pipeline flags */
  initialFlags?: Partial<ThematizationPipelineFlags>;
  /** User's subscription tier */
  subscriptionTier?: SubscriptionTier;
  /** User's remaining credits */
  remainingCredits?: number;
  /** Number of available papers */
  availablePapers?: number;
  /** Callback when tier changes */
  onTierChange?: (tier: ThematizationTierCount | null) => void;
  /** Callback when flags change */
  onFlagsChange?: (flags: ThematizationPipelineFlags) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing thematization tier selection
 *
 * @param options Configuration options
 * @returns Tier selection state, actions, and computed values
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   actions,
 *   computed,
 * } = useTierSelection({
 *   subscriptionTier: 'pro',
 *   remainingCredits: 100,
 *   availablePapers: 250,
 * });
 *
 * return (
 *   <div>
 *     <TierSelectionCard
 *       selectedTier={state.selectedTier}
 *       onTierSelect={actions.selectTier}
 *       availablePapers={250}
 *       remainingCredits={100}
 *     />
 *     {computed.costBreakdown && (
 *       <p>Total: {computed.costBreakdown.finalCost} credits</p>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useTierSelection(options: UseTierSelectionOptions = {}): UseTierSelectionReturn {
  const {
    initialTier = null,
    initialFlags = {},
    subscriptionTier = 'free',
    remainingCredits = 0,
    availablePapers = 0,
    onTierChange,
    onFlagsChange,
  } = options;

  // ==========================================================================
  // State
  // ==========================================================================

  const [selectedTier, setSelectedTier] = useState<ThematizationTierCount | null>(initialTier);
  const [flags, setFlagsState] = useState<ThematizationPipelineFlags>({
    ...DEFAULT_PIPELINE_FLAGS,
    ...initialFlags,
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  const validation = useMemo(() => {
    if (selectedTier === null) {
      return { isValid: false, errors: ['No tier selected'] };
    }

    const tierValidation = validateTier(selectedTier, availablePapers, remainingCredits);
    if (!tierValidation.isValid) {
      return tierValidation;
    }

    // Additional validation with flags
    const costBreakdown = calculateDetailedCost(
      selectedTier,
      flags,
      subscriptionTier,
      remainingCredits
    );

    if (remainingCredits < costBreakdown.finalCost) {
      return {
        isValid: false,
        errors: [`Insufficient credits. Need ${costBreakdown.finalCost}, have ${remainingCredits}`],
      };
    }

    return { isValid: true, errors: [] };
  }, [selectedTier, flags, subscriptionTier, remainingCredits, availablePapers]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const costBreakdown = useMemo(() => {
    if (selectedTier === null) return null;
    return calculateDetailedCost(selectedTier, flags, subscriptionTier, remainingCredits);
  }, [selectedTier, flags, subscriptionTier, remainingCredits]);

  const tierConfig = useMemo(() => {
    if (selectedTier === null) return null;
    return getTierConfig(selectedTier);
  }, [selectedTier]);

  const canAfford = useMemo(() => {
    if (selectedTier === null) return false;
    return canAffordTier(selectedTier, flags, subscriptionTier, remainingCredits);
  }, [selectedTier, flags, subscriptionTier, remainingCredits]);

  const isAvailable = useMemo(() => {
    if (selectedTier === null) return false;
    return isTierAvailable(selectedTier, availablePapers);
  }, [selectedTier, availablePapers]);

  const totalFeatureCost = useMemo(() => {
    return FEATURE_METADATA.reduce((sum, feature) => {
      return flags[feature.flag] ? sum + feature.costCredits : sum;
    }, 0);
  }, [flags]);

  const enabledFeatureCount = useMemo(() => {
    return FEATURE_METADATA.filter(f => flags[f.flag]).length;
  }, [flags]);

  const enabledFeatureNames = useMemo(() => {
    return FEATURE_METADATA.filter(f => flags[f.flag]).map(f => f.displayName);
  }, [flags]);

  // ==========================================================================
  // Actions
  // ==========================================================================

  const selectTier = useCallback(
    (tier: ThematizationTierCount | null) => {
      logger.info('Tier selected', 'useTierSelection', { tier });
      setSelectedTier(tier);
      onTierChange?.(tier);
    },
    [onTierChange]
  );

  const setFlags = useCallback(
    (newFlags: ThematizationPipelineFlags) => {
      logger.info('Flags updated', 'useTierSelection', { flags: newFlags });
      setFlagsState(newFlags);
      onFlagsChange?.(newFlags);
    },
    [onFlagsChange]
  );

  const toggleFlag = useCallback(
    (flag: keyof ThematizationPipelineFlags) => {
      setFlagsState(prev => {
        const newFlags = { ...prev, [flag]: !prev[flag] };
        logger.info('Flag toggled', 'useTierSelection', { flag, enabled: newFlags[flag] });
        onFlagsChange?.(newFlags);
        return newFlags;
      });
    },
    [onFlagsChange]
  );

  const enableAllFlags = useCallback(() => {
    const allEnabled: ThematizationPipelineFlags = {
      enableThemeFit: true,
      enableHierarchical: true,
      enableControversy: true,
      enableClaimExtraction: true,
    };
    logger.info('All flags enabled', 'useTierSelection');
    setFlagsState(allEnabled);
    onFlagsChange?.(allEnabled);
  }, [onFlagsChange]);

  const reset = useCallback(() => {
    logger.info('Selection reset', 'useTierSelection');
    setSelectedTier(initialTier);
    const defaultFlags = { ...DEFAULT_PIPELINE_FLAGS, ...initialFlags };
    setFlagsState(defaultFlags);
    onTierChange?.(initialTier);
    onFlagsChange?.(defaultFlags);
  }, [initialTier, initialFlags, onTierChange, onFlagsChange]);

  const selectRecommended = useCallback(
    (papers: number) => {
      const recommended = getRecommendedTier(papers);
      logger.info('Recommended tier selected', 'useTierSelection', { papers, recommended });
      setSelectedTier(recommended);
      onTierChange?.(recommended);
    },
    [onTierChange]
  );

  // ==========================================================================
  // Return Value
  // ==========================================================================

  return {
    state: {
      selectedTier,
      flags,
      isValid: validation.isValid,
      errors: validation.errors,
    },
    actions: {
      selectTier,
      setFlags,
      toggleFlag,
      enableAllFlags,
      reset,
      selectRecommended,
    },
    computed: {
      costBreakdown,
      tierConfig,
      canAfford,
      isAvailable,
      totalFeatureCost,
      enabledFeatureCount,
      enabledFeatureNames,
    },
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for getting all available tiers based on paper count
 *
 * @param availablePapers Number of available papers
 * @returns Array of available tiers
 */
export function useAvailableTiers(availablePapers: number): ThematizationTierCount[] {
  return useMemo(() => {
    return TIER_VALUES.filter((tier: ThematizationTierCount) => isTierAvailable(tier, availablePapers));
  }, [availablePapers]);
}

/**
 * Hook for getting affordable tiers based on credits
 *
 * @param remainingCredits User's remaining credits
 * @param subscriptionTier User's subscription tier
 * @param flags Pipeline flags
 * @returns Array of affordable tiers
 */
export function useAffordableTiers(
  remainingCredits: number,
  subscriptionTier: SubscriptionTier = 'free',
  flags: ThematizationPipelineFlags = DEFAULT_PIPELINE_FLAGS
): ThematizationTierCount[] {
  return useMemo(() => {
    return TIER_VALUES.filter((tier: ThematizationTierCount) =>
      canAffordTier(tier, flags, subscriptionTier, remainingCredits)
    );
  }, [remainingCredits, subscriptionTier, flags]);
}

/**
 * Hook for getting tier pricing info
 *
 * @param tier Selected tier
 * @param flags Pipeline flags
 * @param subscriptionTier User's subscription tier
 * @param remainingCredits User's remaining credits
 * @returns Detailed cost breakdown
 */
export function useTierPricing(
  tier: ThematizationTierCount | null,
  flags: ThematizationPipelineFlags = DEFAULT_PIPELINE_FLAGS,
  subscriptionTier: SubscriptionTier = 'free',
  remainingCredits: number = 0
): DetailedCostBreakdown | null {
  return useMemo(() => {
    if (tier === null) return null;
    return calculateDetailedCost(tier, flags, subscriptionTier, remainingCredits);
  }, [tier, flags, subscriptionTier, remainingCredits]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useTierSelection;
