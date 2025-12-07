/**
 * Phase 10.93 Day 7 - Feature Flag Configuration
 *
 * Centralized feature flag management for gradual rollout and safe rollback.
 *
 * **Usage:**
 * ```typescript
 * import { featureFlags } from '@/lib/config/feature-flags';
 *
 * if (featureFlags.USE_NEW_THEME_EXTRACTION) {
 *   // Use new service-based implementation
 * } else {
 *   // Use old monolithic implementation
 * }
 * ```
 *
 * **Rollback Procedure:**
 * 1. Set NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false in .env.local
 * 2. Restart Next.js dev/production server
 * 3. Verify old implementation is active
 * 4. Monitor for errors
 *
 * **Feature Flag Sources (Priority Order):**
 * 1. Environment variable (NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION)
 * 2. localStorage override (for testing)
 * 3. Default value (true for gradual rollout)
 *
 * @module feature-flags
 * @since Phase 10.93 Day 7
 * @author VQMethod Team
 * @enterprise-grade Production-ready with rollback support
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Feature flag configuration interface
 * All flags are optional to support partial configuration
 */
export interface FeatureFlagConfig {
  /**
   * Use new service-based theme extraction workflow
   *
   * **Impact:**
   * - When true: Uses ThemeExtractionService, PaperSaveService, FullTextExtractionService
   * - When false: Uses original monolithic useThemeExtractionWorkflow hook
   *
   * **Rollout Plan:**
   * - Phase 1: Internal testing (10% users)
   * - Phase 2: Beta users (50% users)
   * - Phase 3: All users (100%)
   *
   * @default true
   */
  USE_NEW_THEME_EXTRACTION: boolean;

  /**
   * Enable feature flag monitoring dashboard
   * Tracks which implementation is being used and performance metrics
   *
   * @default true in development, false in production
   */
  ENABLE_FEATURE_FLAG_MONITORING: boolean;
}

/**
 * Feature flag metadata for monitoring
 */
export interface FeatureFlagMetadata {
  name: keyof FeatureFlagConfig;
  enabled: boolean;
  source: 'environment' | 'localStorage' | 'default';
  timestamp: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Safely read environment variable with fallback
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Boolean value
 */
function readEnvFlag(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    // Server-side: read from process.env
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  // Client-side: read from window.__ENV__ injected by Next.js
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Read feature flag from localStorage (for testing overrides)
 *
 * @param key - Feature flag name
 * @returns Boolean value or null if not set
 */
function readLocalStorageFlag(key: string): boolean | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = localStorage.getItem(`featureFlag_${key}`);
    if (value === null) return null;
    return value === 'true';
  } catch (error) {
    console.warn(`Failed to read localStorage flag ${key}:`, error);
    return null;
  }
}

/**
 * Get feature flag value with priority: localStorage > env > default
 *
 * @param key - Feature flag name
 * @param defaultValue - Default value
 * @returns Feature flag value and source
 */
function getFeatureFlagValue(
  key: keyof FeatureFlagConfig,
  defaultValue: boolean
): { value: boolean; source: 'environment' | 'localStorage' | 'default' } {
  // Priority 1: localStorage override (for testing)
  const localStorageValue = readLocalStorageFlag(key);
  if (localStorageValue !== null) {
    return { value: localStorageValue, source: 'localStorage' };
  }

  // Priority 2: Environment variable
  const envKey = `NEXT_PUBLIC_${key}`;
  const envValue = readEnvFlag(envKey, defaultValue);
  if (process.env[envKey] !== undefined) {
    return { value: envValue, source: 'environment' };
  }

  // Priority 3: Default value
  return { value: defaultValue, source: 'default' };
}

// ============================================================================
// FEATURE FLAGS CONFIGURATION
// ============================================================================

/**
 * Get current feature flag configuration
 *
 * @returns Feature flag configuration object
 */
function getFeatureFlags(): FeatureFlagConfig {
  const useNewThemeExtraction = getFeatureFlagValue('USE_NEW_THEME_EXTRACTION', true);
  const enableMonitoring = getFeatureFlagValue(
    'ENABLE_FEATURE_FLAG_MONITORING',
    process.env.NODE_ENV === 'development'
  );

  return {
    USE_NEW_THEME_EXTRACTION: useNewThemeExtraction.value,
    ENABLE_FEATURE_FLAG_MONITORING: enableMonitoring.value,
  };
}

/**
 * Get feature flag metadata for monitoring
 *
 * @returns Array of feature flag metadata
 */
export function getFeatureFlagMetadata(): FeatureFlagMetadata[] {
  const useNewThemeExtraction = getFeatureFlagValue('USE_NEW_THEME_EXTRACTION', true);
  const enableMonitoring = getFeatureFlagValue(
    'ENABLE_FEATURE_FLAG_MONITORING',
    process.env.NODE_ENV === 'development'
  );

  return [
    {
      name: 'USE_NEW_THEME_EXTRACTION',
      enabled: useNewThemeExtraction.value,
      source: useNewThemeExtraction.source,
      timestamp: Date.now(),
    },
    {
      name: 'ENABLE_FEATURE_FLAG_MONITORING',
      enabled: enableMonitoring.value,
      source: enableMonitoring.source,
      timestamp: Date.now(),
    },
  ];
}

/**
 * Set feature flag override in localStorage (for testing)
 *
 * @param key - Feature flag name
 * @param value - Boolean value
 */
export function setFeatureFlagOverride(key: keyof FeatureFlagConfig, value: boolean): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot set feature flag override on server-side');
    return;
  }

  try {
    localStorage.setItem(`featureFlag_${key}`, String(value));
    console.log(`[FeatureFlags] Override set: ${key} = ${value}`);
    console.log('[FeatureFlags] Reload page for changes to take effect');
  } catch (error) {
    console.error(`Failed to set feature flag override ${key}:`, error);
  }
}

/**
 * Clear feature flag override from localStorage
 *
 * @param key - Feature flag name
 */
export function clearFeatureFlagOverride(key: keyof FeatureFlagConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`featureFlag_${key}`);
    console.log(`[FeatureFlags] Override cleared: ${key}`);
    console.log('[FeatureFlags] Reload page for changes to take effect');
  } catch (error) {
    console.error(`Failed to clear feature flag override ${key}:`, error);
  }
}

/**
 * Clear all feature flag overrides
 */
export function clearAllFeatureFlagOverrides(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('featureFlag_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[FeatureFlags] All overrides cleared');
    console.log('[FeatureFlags] Reload page for changes to take effect');
  } catch (error) {
    console.error('Failed to clear feature flag overrides:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Current feature flag configuration
 * Evaluated once at module load time
 */
export const featureFlags: FeatureFlagConfig = getFeatureFlags();

/**
 * Log feature flags on startup (development only)
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('[FeatureFlags] Current configuration:', featureFlags);
  console.log('[FeatureFlags] Metadata:', getFeatureFlagMetadata());
}

// ============================================================================
// BROWSER CONSOLE HELPERS
// ============================================================================

/**
 * Expose feature flag utilities to browser console (development only)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__featureFlags = {
    get: () => featureFlags,
    getMetadata: getFeatureFlagMetadata,
    set: setFeatureFlagOverride,
    clear: clearFeatureFlagOverride,
    clearAll: clearAllFeatureFlagOverrides,
    help: () => {
      console.log(`
Feature Flag Console Commands:
==============================

View current flags:
  __featureFlags.get()

View flag metadata (source, timestamp):
  __featureFlags.getMetadata()

Override a flag (testing only):
  __featureFlags.set('USE_NEW_THEME_EXTRACTION', false)

Clear override:
  __featureFlags.clear('USE_NEW_THEME_EXTRACTION')

Clear all overrides:
  __featureFlags.clearAll()

Note: Reload page after changing flags
      `);
    },
  };

  console.log('[FeatureFlags] Console helpers available at window.__featureFlags');
  console.log('[FeatureFlags] Run __featureFlags.help() for commands');
}

export default featureFlags;
