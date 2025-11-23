/**
 * Store Persistence Utilities
 * Phase 10.91 Day 8 Afternoon - Store Architecture Refactoring
 *
 * **Extracted from store-utils.ts for better organization**
 * **Purpose:** Persistence, testing, type helpers, and performance utilities
 *
 * @module StorePersistUtils
 * @since Phase 10.91 Day 8
 */

import type { PersistOptions } from 'zustand/middleware';

// ============================================================================
// Persistence Configuration
// ============================================================================

/**
 * Create type-safe persistence configuration
 *
 * @param storeName - Unique name for localStorage key
 * @param fieldsToPersist - Array of state keys to persist
 * @param version - Schema version (for migrations)
 * @returns Persistence configuration object
 *
 * @example
 * createPersistConfig('theme-store', ['themes', 'selectedIds'], 1)
 */
export function createPersistConfig<T extends Record<string, any>>(
  storeName: string,
  fieldsToPersist: (keyof T)[],
  version = 1
): Pick<PersistOptions<T, Partial<T>>, 'name' | 'version' | 'partialize'> {
  return {
    name: storeName,
    version,
    partialize: (state) => {
      const persistedState: Partial<T> = {};
      for (const field of fieldsToPersist) {
        // ✅ No type assertion needed - generic constraint allows safe indexing
        if (field in state) {
          persistedState[field] = state[field];
        }
      }
      return persistedState;
    },
  };
}

// ============================================================================
// Store Testing Utilities
// ============================================================================

/**
 * Create a mock store for testing
 * Allows you to override specific state/actions for tests
 *
 * @param baseStore - The actual store hook
 * @param overrides - State/action overrides for testing
 * @returns Mock store hook
 *
 * @example
 * const mockUseThemeStore = createMockStore(useThemeStore, {
 *   themes: [{ id: '1', label: 'Test Theme' }],
 *   loading: false,
 * });
 *
 * // In test:
 * jest.mock('@/lib/stores/theme-store', () => ({
 *   useThemeStore: mockUseThemeStore,
 * }));
 */
export function createMockStore<T>(
  baseStore: () => T,
  overrides: Partial<T>
): () => T {
  return () => ({
    ...baseStore(),
    ...overrides,
  });
}

/**
 * Reset all stores to initial state (useful between tests)
 *
 * @example
 * afterEach(() => {
 *   resetAllStores([useThemeStore, useSearchStore]);
 * });
 */
export function resetAllStores(stores: Array<{ getState: () => { reset?: () => void } }>) {
  stores.forEach((store) => {
    const state = store.getState();
    if (state.reset) {
      state.reset();
    }
  });
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Extract state type from store hook
 *
 * @example
 * type ThemeState = StoreState<typeof useThemeStore>;
 */
export type StoreState<T> = T extends { getState: () => infer S } ? S : never;

/**
 * Extract actions from store state
 * (Utility type to separate actions from data)
 *
 * @example
 * type ThemeActions = StoreActions<ThemeState>;
 */
export type StoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Extract data from store state
 * (Utility type to separate data from actions)
 *
 * @example
 * type ThemeData = StoreData<ThemeState>;
 */
export type StoreData<T> = Omit<T, StoreActions<T>>;

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Create a selector that only triggers re-render if result changes
 * (shallow equality check)
 *
 * @example
 * const selectedThemes = useThemeStore(
 *   createShallowSelector((state) => state.themes.filter(t => t.selected))
 * );
 */
export function createShallowSelector<T, R>(
  selector: (state: T) => R
): (state: T) => R {
  let prev: R | undefined;
  return (state: T) => {
    const next = selector(state);
    if (shallowEqual(prev, next)) {
      return prev as R;
    }
    prev = next;
    return next;
  };
}

/**
 * Shallow equality check (for objects and arrays)
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false;
  }

  return true;
}
