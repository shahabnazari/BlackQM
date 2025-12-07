/**
 * Theme Mapping Utilities
 * Utility functions for converting between theme formats
 *
 * **Purpose:**
 * Provides type-safe conversion functions for mapping between
 * UnifiedTheme (store format) and Theme (API format)
 *
 * **Enterprise Standards:**
 * - ✅ Input validation with defensive programming
 * - ✅ Named constants instead of magic numbers
 * - ✅ Comprehensive JSDoc documentation
 * - ✅ Type-safe with explicit return types
 *
 * @module ThemeMappingUtils
 */

import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';
import type { Theme } from '@/lib/api/services/enhanced-theme-integration-api.service';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of sources to include in API request for efficiency
 * Limits payload size while preserving representative sample
 */
const MAX_SOURCES_FOR_API = 3;

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert UnifiedTheme to Theme format for API
 *
 * Maps the store's UnifiedTheme format to the API's Theme format.
 * Simplifies sources to top N for API efficiency.
 *
 * **Conversion Mapping:**
 * - `label` → `name`
 * - `description` → `description` (unchanged)
 * - `weight` → `prevalence`
 * - `confidence` → `confidence` (unchanged)
 * - `sources` → simplified sources array (top N)
 *
 * **Input Validation:**
 * - Assumes non-null unifiedTheme (caller responsible for null checks)
 * - Handles missing optional fields with safe defaults
 * - Validates sources array existence before mapping
 *
 * @param {UnifiedTheme} unifiedTheme - Theme in store format (must be non-null)
 * @returns {Theme} Theme in API format
 * @throws {TypeError} If unifiedTheme is null or undefined (fail-fast)
 *
 * @example
 * ```typescript
 * const unifiedTheme: UnifiedTheme = {
 *   id: '123',
 *   label: 'Climate Change',
 *   description: 'Global warming effects',
 *   weight: 0.85,
 *   confidence: 0.92,
 *   sources: [...]
 * };
 *
 * const apiTheme = mapUnifiedThemeToTheme(unifiedTheme);
 * // Result: { id: '123', name: 'Climate Change', prevalence: 0.85, ... }
 * ```
 */
export function mapUnifiedThemeToTheme(unifiedTheme: UnifiedTheme): Theme {
  // Input validation - fail fast if null/undefined
  if (!unifiedTheme) {
    throw new TypeError(
      'mapUnifiedThemeToTheme: unifiedTheme parameter must be non-null and non-undefined'
    );
  }

  // Convert sources to simplified format expected by API
  // Take top N sources for efficiency while preserving representativeness
  const sources =
    unifiedTheme.sources
      ?.slice(0, MAX_SOURCES_FOR_API)
      .map(source => ({
        id: source.sourceId,
        title: source.sourceTitle,
        type: source.sourceType,
      })) || [];

  return {
    id: unifiedTheme.id,
    name: unifiedTheme.label,
    description: unifiedTheme.description || '',
    prevalence: unifiedTheme.weight || 0,
    confidence: unifiedTheme.confidence || 0,
    sources,
  };
}
