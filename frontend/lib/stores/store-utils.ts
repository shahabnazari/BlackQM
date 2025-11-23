/**
 * Zustand Store Utilities
 * Phase 10.91 Day 8 - Store Architecture Refactoring
 *
 * **Refactoring:** Reduced from 503 → <250 lines by extracting helpers
 * **Pattern:** Re-export from helper modules + keep common patterns
 *
 * Purpose:
 * - Common store patterns and utilities
 * - Re-exports from helper modules
 * - Async action helpers
 * - Store composition utilities
 *
 * Usage:
 * ```typescript
 * import { createStoreWithDevtools, createPersistConfig } from '@/lib/stores/store-utils';
 *
 * export const useMyStore = create<MyState>()(
 *   createStoreWithDevtools(
 *     persist(
 *       (set, get) => ({ ...implementation }),
 *       createPersistConfig('my-store', ['field1', 'field2'])
 *     ),
 *     'MyStore'
 *   )
 * );
 * ```
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Re-exports from Helper Modules
// ============================================================================

// DevTools utilities
export {
  createStoreWithDevtools,
  takeStoreSnapshot,
  compareSnapshots,
  logStateChanges,
} from './helpers/store-devtools-utils';

// Persistence utilities
export {
  createPersistConfig,
  createMockStore,
  resetAllStores,
  createShallowSelector,
  type StoreState,
  type StoreActions,
  type StoreData,
} from './helpers/store-persist-utils';


// ============================================================================
// Common Store Patterns
// ============================================================================

/**
 * Create a toggle action for boolean state
 *
 * ⚠️ WARNING: This function assumes the key points to a boolean value.
 * Using it with non-boolean values will cause unexpected behavior.
 *
 * @example
 * const useStore = create<{ show: boolean; toggle: () => void }>((set) => ({
 *   show: false,
 *   toggle: createToggleAction(set, 'show'),
 * }));
 */
export function createToggleAction<T>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  key: keyof T
): () => void {
  return () =>
    set((state: T) => {
      // ✅ FIXED: Defensive type check for boolean values
      const currentValue = state[key];
      if (typeof currentValue !== 'boolean') {
        logger.warn(
          'createToggleAction: Attempting to toggle non-boolean value',
          'StoreUtils',
          {
            key: String(key),
            currentValue,
            type: typeof currentValue,
          }
        );
        return {} as Partial<T>; // Return empty update to avoid corruption
      }

      return { [key]: !currentValue } as Partial<T>;
    });
}

/**
 * Create a reset action that resets state to initial values
 *
 * @example
 * const initialState = { count: 0, name: '' };
 * const useStore = create<typeof initialState & { reset: () => void }>((set) => ({
 *   ...initialState,
 *   reset: createResetAction(set, initialState),
 * }));
 */
export function createResetAction<T>(
  set: (state: T) => void,
  initialState: T
): () => void {
  return () => set(initialState);
}

/**
 * Create a Set state helper (for selectedIds patterns)
 *
 * ⚠️ WARNING: This function assumes the key points to a Set<string> value.
 * Using it with non-Set values will cause runtime errors.
 *
 * @example
 * const useStore = create<{
 *   selectedIds: Set<string>;
 *   toggleSelection: (id: string) => void;
 * }>((set) => ({
 *   selectedIds: new Set(),
 *   toggleSelection: createSetToggle(set, 'selectedIds'),
 * }));
 */
export function createSetToggle<T>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  key: keyof T
): (id: string) => void {
  return (id: string) =>
    set((state: T) => {
      const currentValue = state[key];

      // ✅ FIXED: Defensive type check for Set values
      if (!(currentValue instanceof Set)) {
        logger.error(
          'createSetToggle: Expected Set but got different type',
          'StoreUtils',
          {
            key: String(key),
            actualType: currentValue?.constructor?.name || typeof currentValue,
          }
        );
        return {} as Partial<T>; // Return empty update to avoid crash
      }

      const currentSet = currentValue as Set<string>;
      const newSet = new Set(currentSet);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { [key]: newSet } as Partial<T>;
    });
}

// ============================================================================
// Async Action Helpers
// ============================================================================

/**
 * Wrap async action with loading state management
 *
 * @param asyncFn - Async function to execute
 * @param setLoading - Function to set loading state
 * @param setError - Function to set error state
 * @returns Wrapped async function
 *
 * @example
 * const fetchData = wrapAsyncAction(
 *   async () => await api.getData(),
 *   (loading) => set({ loading }),
 *   (error) => set({ error: error?.message })
 * );
 */
export function wrapAsyncAction<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): (...args: Args) => Promise<T | undefined> {
  return async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Async action failed', 'StoreUtils', { errorMessage, error });
      return undefined;
    }
  };
}

/**
 * Create a debounced action (useful for auto-save, search)
 *
 * ⚠️ NOTE: Returns cleanup function to cancel pending debounce.
 * Always call cleanup when component unmounts to prevent memory leaks.
 *
 * @param action - Action to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Object with debounced function and cleanup
 *
 * @example
 * const { debouncedFn, cleanup } = createDebouncedAction(
 *   (data) => saveToBackend(data),
 *   2000
 * );
 *
 * // In React component:
 * useEffect(() => {
 *   return cleanup; // Cleanup on unmount
 * }, []);
 */
export function createDebouncedAction<Args extends unknown[]>(
  action: (...args: Args) => void,
  delayMs: number
): {
  debouncedFn: (...args: Args) => void;
  cleanup: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      action(...args);
      timeoutId = null;
    }, delayMs);
  };

  // ✅ FIXED: Return cleanup function to prevent memory leaks
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debouncedFn, cleanup };
}

// ============================================================================
// Store Composition Helpers
// ============================================================================

/**
 * Combine multiple stores into a single hook
 * (Use sparingly - prefer individual selectors)
 *
 * @example
 * const useCombinedState = combineStores({
 *   themes: useThemeStore,
 *   search: useSearchStore,
 * });
 *
 * const { themes, search } = useCombinedState();
 */
export function combineStores<T extends Record<string, () => any>>(
  stores: T
): () => { [K in keyof T]: ReturnType<T[K]> } {
  return () => {
    // ✅ Type-safe object construction with proper annotation
    const combined: { [K in keyof T]: ReturnType<T[K]> } = {} as {
      [K in keyof T]: ReturnType<T[K]>;
    };
    for (const key in stores) {
      const store = stores[key];
      if (store && typeof store === 'function') {
        combined[key] = store();
      }
    }
    return combined;
  };
}
