/**
 * Theme Extraction Store - Selection Actions
 * Phase 10.91 Day 8: Store Architecture Refactoring (Remediated)
 *
 * **Purpose:**
 * Theme selection state management
 *
 * **Responsibilities:**
 * - Toggle individual theme selection
 * - Select/deselect all themes
 * - Manage selection array
 *
 * **Enterprise Standards:**
 * - ✅ Immutable array operations
 * - ✅ Functions < 20 lines each
 * - ✅ Defensive programming (input validation)
 * - ✅ TypeScript strict mode (NO 'any')
 *
 * @since Phase 10.91 Day 8
 * @remediated Phase 10.91 Day 8 (Type safety + validation)
 */

import { logger } from '@/lib/utils/logger';
import type { UnifiedTheme } from './types';

/**
 * Creates selection management actions with type-safe state updates
 * @template T Store state type extending theme selection properties
 * @param set Zustand setState function
 * @returns Object with selection functions
 */
export function createSelectionActions<T extends { unifiedThemes: UnifiedTheme[]; selectedThemeIds: string[] }>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
) {
  return {
    /**
     * Replace selected theme IDs (bulk operation)
     * @param ids Array of theme IDs to select
     */
    setSelectedThemeIds: (ids: string[]): void => {
      // Input validation
      if (!Array.isArray(ids)) {
        logger.warn('setSelectedThemeIds: Invalid IDs array', 'ThemeStore', { ids });
        return;
      }

      // Defensive: Filter out invalid IDs
      const validIds = ids.filter((id) => id && typeof id === 'string');
      if (validIds.length !== ids.length) {
        logger.debug('setSelectedThemeIds: Filtered out invalid IDs', 'ThemeStore', {
          provided: ids.length,
          valid: validIds.length,
        });
      }

      set({ selectedThemeIds: validIds } as Partial<T>);
    },

    /**
     * Toggle selection of a single theme
     * @param themeId ID of theme to toggle
     */
    toggleThemeSelection: (themeId: string): void => {
      // Input validation
      if (!themeId || typeof themeId !== 'string') {
        logger.warn('toggleThemeSelection: Invalid themeId', 'ThemeStore', { themeId });
        return;
      }

      set((state) => {
        // Defensive: Verify theme exists
        const themeExists = state.unifiedThemes.some((t) => t.id === themeId);
        if (!themeExists) {
          logger.debug('toggleThemeSelection: Theme not found', 'ThemeStore', { themeId });
          return state as Partial<T>;
        }

        const isSelected = state.selectedThemeIds.includes(themeId);
        return {
          selectedThemeIds: isSelected
            ? state.selectedThemeIds.filter((id) => id !== themeId)
            : [...state.selectedThemeIds, themeId],
        } as Partial<T>;
      });
    },

    /**
     * Select all themes
     */
    selectAllThemes: (): void => {
      set((state) => {
        const allIds = state.unifiedThemes.map((t) => t.id);
        logger.debug('Selecting all themes', 'ThemeStore', { count: allIds.length });
        return {
          selectedThemeIds: allIds,
        } as Partial<T>;
      });
    },

    /**
     * Clear all selections
     */
    clearThemeSelection: (): void => {
      logger.debug('Clearing theme selection', 'ThemeStore');
      set({ selectedThemeIds: [] as string[] } as Partial<T>);
    },
  };
}
