/**
 * Phase 10.170: Purpose-Aware Configuration Hook
 *
 * React hook for managing purpose-aware search configuration.
 * Provides state management and helper functions for purpose selection.
 *
 * @module usePurposeAwareConfig
 * @since Phase 10.170
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ResearchPurpose,
  PurposeMetadata,
  PaperLimits,
  PURPOSE_METADATA,
  RESEARCH_PURPOSES,
  DEFAULT_PURPOSE,
  getPurposeDisplayName,
  getPurposeDescription,
  getPurposeCharacteristics,
  getPurposeUseCases,
  getPurposeScientificFoundation,
} from '../types/purpose-aware.types';

// ============================================================================
// HOOK INTERFACES
// ============================================================================

/**
 * Configuration override state
 */
export interface ConfigOverrideState {
  paperLimits?: Partial<PaperLimits>;
  qualityThreshold?: number;
  forceFullText?: boolean;
  fullTextBoost?: number;
}

/**
 * Hook return type
 */
export interface UsePurposeAwareConfigReturn {
  // Current state
  purpose: ResearchPurpose;
  metadata: PurposeMetadata;
  overrides: ConfigOverrideState;
  hasOverrides: boolean;

  // Setters
  setPurpose: (purpose: ResearchPurpose) => void;
  setOverrides: (overrides: ConfigOverrideState) => void;
  clearOverrides: () => void;

  // Override helpers
  setPaperLimitsOverride: (limits: Partial<PaperLimits>) => void;
  setQualityThresholdOverride: (threshold: number | undefined) => void;
  setForceFullTextOverride: (force: boolean | undefined) => void;
  setFullTextBoostOverride: (boost: number | undefined) => void;

  // UI helpers
  displayName: string;
  description: string;
  characteristics: readonly string[];
  useCases: readonly string[];
  scientificFoundation: string;

  // All purposes for selection
  allPurposes: readonly PurposeMetadata[];
  selectOptions: Array<{ value: ResearchPurpose; label: string; description: string }>;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const EMPTY_OVERRIDES: ConfigOverrideState = {};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing purpose-aware search configuration
 *
 * @param initialPurpose Initial research purpose (default: QUALITATIVE_ANALYSIS)
 * @returns Purpose configuration state and helpers
 *
 * @example
 * ```tsx
 * const {
 *   purpose,
 *   setPurpose,
 *   displayName,
 *   characteristics,
 *   selectOptions,
 * } = usePurposeAwareConfig();
 *
 * return (
 *   <Select
 *     value={purpose}
 *     onChange={setPurpose}
 *     options={selectOptions}
 *   />
 * );
 * ```
 */
export function usePurposeAwareConfig(
  initialPurpose: ResearchPurpose = DEFAULT_PURPOSE,
): UsePurposeAwareConfigReturn {
  // State
  const [purpose, setPurposeState] = useState<ResearchPurpose>(initialPurpose);
  const [overrides, setOverridesState] = useState<ConfigOverrideState>(EMPTY_OVERRIDES);

  // Derived state
  const metadata = useMemo(() => PURPOSE_METADATA[purpose], [purpose]);
  const hasOverrides = useMemo(() => {
    return (
      overrides.paperLimits !== undefined ||
      overrides.qualityThreshold !== undefined ||
      overrides.forceFullText !== undefined ||
      overrides.fullTextBoost !== undefined
    );
  }, [overrides]);

  // UI helpers
  const displayName = useMemo(() => getPurposeDisplayName(purpose), [purpose]);
  const description = useMemo(() => getPurposeDescription(purpose), [purpose]);
  const characteristics = useMemo(() => getPurposeCharacteristics(purpose), [purpose]);
  const useCases = useMemo(() => getPurposeUseCases(purpose), [purpose]);
  const scientificFoundation = useMemo(
    () => getPurposeScientificFoundation(purpose),
    [purpose],
  );

  // All purposes for selection
  const allPurposes = useMemo(
    () => RESEARCH_PURPOSES.map(p => PURPOSE_METADATA[p]),
    [],
  );

  const selectOptions = useMemo(
    () =>
      RESEARCH_PURPOSES.map(p => ({
        value: p,
        label: PURPOSE_METADATA[p].displayName,
        description: PURPOSE_METADATA[p].description,
      })),
    [],
  );

  // Setters
  const setPurpose = useCallback((newPurpose: ResearchPurpose) => {
    setPurposeState(newPurpose);
    // Clear overrides when purpose changes
    setOverridesState(EMPTY_OVERRIDES);
  }, []);

  const setOverrides = useCallback((newOverrides: ConfigOverrideState) => {
    setOverridesState(newOverrides);
  }, []);

  const clearOverrides = useCallback(() => {
    setOverridesState(EMPTY_OVERRIDES);
  }, []);

  // Override helpers
  const setPaperLimitsOverride = useCallback((limits: Partial<PaperLimits>) => {
    setOverridesState(prev => ({
      ...prev,
      paperLimits: limits,
    }));
  }, []);

  const setQualityThresholdOverride = useCallback((threshold: number | undefined) => {
    setOverridesState(prev => {
      const newState: ConfigOverrideState = { ...prev };
      if (threshold !== undefined) {
        newState.qualityThreshold = threshold;
      } else {
        delete newState.qualityThreshold;
      }
      return newState;
    });
  }, []);

  const setForceFullTextOverride = useCallback((force: boolean | undefined) => {
    setOverridesState(prev => {
      const newState: ConfigOverrideState = { ...prev };
      if (force !== undefined) {
        newState.forceFullText = force;
      } else {
        delete newState.forceFullText;
      }
      return newState;
    });
  }, []);

  const setFullTextBoostOverride = useCallback((boost: number | undefined) => {
    setOverridesState(prev => {
      const newState: ConfigOverrideState = { ...prev };
      if (boost !== undefined) {
        newState.fullTextBoost = boost;
      } else {
        delete newState.fullTextBoost;
      }
      return newState;
    });
  }, []);

  return {
    // Current state
    purpose,
    metadata,
    overrides,
    hasOverrides,

    // Setters
    setPurpose,
    setOverrides,
    clearOverrides,

    // Override helpers
    setPaperLimitsOverride,
    setQualityThresholdOverride,
    setForceFullTextOverride,
    setFullTextBoostOverride,

    // UI helpers
    displayName,
    description,
    characteristics,
    useCases,
    scientificFoundation,

    // All purposes for selection
    allPurposes,
    selectOptions,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for getting purpose metadata only (no state management)
 *
 * @param purpose Research purpose
 * @returns Purpose metadata and UI helpers
 */
export function usePurposeMetadata(purpose: ResearchPurpose) {
  const metadata = useMemo(() => PURPOSE_METADATA[purpose], [purpose]);
  const displayName = useMemo(() => getPurposeDisplayName(purpose), [purpose]);
  const description = useMemo(() => getPurposeDescription(purpose), [purpose]);
  const characteristics = useMemo(() => getPurposeCharacteristics(purpose), [purpose]);
  const useCases = useMemo(() => getPurposeUseCases(purpose), [purpose]);
  const scientificFoundation = useMemo(
    () => getPurposeScientificFoundation(purpose),
    [purpose],
  );

  return {
    metadata,
    displayName,
    description,
    characteristics,
    useCases,
    scientificFoundation,
  };
}

/**
 * Hook for getting all purpose options (for select components)
 *
 * @returns Array of purpose options
 */
export function usePurposeOptions() {
  return useMemo(
    () =>
      RESEARCH_PURPOSES.map(p => ({
        value: p,
        label: PURPOSE_METADATA[p].displayName,
        description: PURPOSE_METADATA[p].description,
        characteristics: PURPOSE_METADATA[p].characteristics,
        scientificFoundation: PURPOSE_METADATA[p].scientificFoundation,
      })),
    [],
  );
}

export default usePurposeAwareConfig;
