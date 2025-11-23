/**
 * Phase 10.93 Day 7 - Feature-Flagged Theme Extraction Workflow Wrapper (FINAL)
 *
 * This wrapper provides safe rollback capability between old and new implementations.
 * Uses feature flag to determine which implementation to use.
 *
 * **STRICT AUDIT FIXES:**
 * - ✅ BUG-002: Removed @ts-ignore, added proper type imports
 * - ✅ HOOKS-001: Memoized feature flag evaluation (module-level constant)
 * - ✅ TYPE-002: Strong typing for both implementations
 * - ✅ NEW-BUG-001: Moved console.log to module level (no render spam)
 *
 * **Feature Flag:** USE_NEW_THEME_EXTRACTION
 * - true: Use new service-based implementation (Phase 10.93 Days 1-4)
 * - false: Use old monolithic implementation (Phase 10.1 Day 6)
 *
 * **Rollback Procedure:**
 * 1. Set NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false in .env.local
 * 2. Restart server
 * 3. Verify old implementation is active via console logs
 * 4. Monitor for errors
 *
 * @module useThemeExtractionWorkflow.wrapper
 * @since Phase 10.93 Day 7
 * @author VQMethod Team
 * @enterprise-grade Production-ready with safe rollback
 */

import { featureFlags } from '@/lib/config/feature-flags';

// STRICT AUDIT FIX: BUG-002 - Proper type imports instead of @ts-ignore
import type { UseThemeExtractionWorkflowConfig } from './useThemeExtractionWorkflow';

// Import both implementations with proper types
// New implementation (Phase 10.93)
import { useThemeExtractionWorkflow as useNewImplementation } from './useThemeExtractionWorkflow';

// Old implementation (Phase 10.1) - Fallback for rollback
import { useThemeExtractionWorkflow as useOldImplementation } from './useThemeExtractionWorkflow.old';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Feature flag value cached at module load time
 * STRICT AUDIT FIX: HOOKS-001 - Evaluate once at module level instead of every render
 *
 * Note: If you need runtime feature flag changes without server restart,
 * move this inside the hook and use useMemo with empty deps array
 */
const USE_NEW_IMPLEMENTATION = featureFlags.USE_NEW_THEME_EXTRACTION;

/**
 * Log implementation selection once at module load (development only)
 * STRICT AUDIT FIX: NEW-BUG-001 - Module-level logging prevents console spam on every render
 */
if (process.env.NODE_ENV === 'development') {
  console.log(
    `[ThemeExtraction] Initialized with ${USE_NEW_IMPLEMENTATION ? 'NEW' : 'OLD'} implementation`
  );
}

// ============================================================================
// WRAPPER HOOK
// ============================================================================

/**
 * Feature-flagged wrapper for theme extraction workflow
 *
 * Automatically selects between old and new implementations based on feature flag.
 *
 * **Type Safety:** Both implementations must conform to the same interface
 * **Performance:** Feature flag evaluated once at module load time
 * **Logging:** Implementation selection logged once at module load (no render spam)
 *
 * @param config - Hook configuration
 * @returns Theme extraction workflow interface
 */
export function useThemeExtractionWorkflowFeatureFlagged(
  config: UseThemeExtractionWorkflowConfig
) {
  // STRICT AUDIT FIX: HOOKS-001
  // Feature flag is now a module-level constant, not re-evaluated on every render
  // This is safe because Next.js requires server restart for env var changes

  // STRICT AUDIT FIX: NEW-BUG-001
  // Removed console.log from component body to prevent spam on every render
  // Logging now happens once at module load time (line 55-59)

  // Select implementation based on feature flag
  // STRICT AUDIT FIX: BUG-002 - No @ts-ignore, proper type inference
  if (USE_NEW_IMPLEMENTATION) {
    // Use new service-based implementation (Phase 10.93)
    return useNewImplementation(config);
  } else {
    // Use old monolithic implementation (Phase 10.1)
    return useOldImplementation(config);
  }
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

/**
 * Re-export types for convenience
 * Consumers can import types from wrapper instead of direct hook
 */
export type {
  UseThemeExtractionWorkflowConfig,
  ContentAnalysis,
  Paper,
  TranscribedVideo,
} from './useThemeExtractionWorkflow';

/**
 * Re-export wrapper as default for cleaner imports
 */
export default useThemeExtractionWorkflowFeatureFlagged;
