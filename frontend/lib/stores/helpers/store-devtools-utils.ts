/**
 * Store DevTools Utilities
 * Phase 10.91 Day 8 Afternoon - Store Architecture Refactoring
 *
 * **Extracted from store-utils.ts for better organization**
 * **Purpose:** DevTools integration, logging, and debugging utilities
 *
 * @module StoreDevToolsUtils
 * @since Phase 10.91 Day 8
 */

import { StateCreator } from 'zustand';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// DevTools Integration
// ============================================================================

/**
 * Enable Redux DevTools for Zustand store
 * Works in both development and production (optional in prod)
 *
 * ⚠️ PERFORMANCE NOTE: Creates Error stack traces on every state change
 * to extract action names. This is acceptable in development but may
 * impact performance for stores with frequent updates (>100/sec).
 *
 * @param storeImpl - Store implementation function
 * @param storeName - Name to display in DevTools
 * @returns Wrapped store with DevTools
 *
 * @example
 * const useStore = create(
 *   createStoreWithDevtools(
 *     (set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }),
 *     'CounterStore'
 *   )
 * );
 */
export function createStoreWithDevtools<T>(
  storeImpl: StateCreator<T, [], []>,
  storeName: string
): StateCreator<T, [], []> {
  // Only enable in development (or if explicitly enabled in production)
  const enableDevTools =
    process.env.NODE_ENV === 'development' ||
    process.env['NEXT_PUBLIC_ENABLE_DEVTOOLS'] === 'true';

  if (!enableDevTools) {
    return storeImpl;
  }

  return (set, get, api) => {
    // Wrap set to send actions to DevTools
    const devtoolsSet: typeof set = (partial, replace) => {
      // Get action name from Error stack (best effort)
      const actionName = new Error().stack?.split('\n')[2]?.trim() || 'setState';

      // Log to DevTools
      if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: storeName });
        const prevState = get();
        // ✅ ACCEPTABLE: as any needed for Zustand's complex overloads
        // When replace=true, partial must be T (full state), not Partial<T>
        // TypeScript can't infer which overload without runtime branching
        set(partial, replace as any);
        const nextState = get();
        devtools.send(actionName, nextState, {}, prevState);
      } else {
        set(partial, replace as any);
      }
    };

    return storeImpl(devtoolsSet, get, api);
  };
}

// ============================================================================
// Store State Snapshot (for debugging)
// ============================================================================

/**
 * Take a snapshot of store state (useful for debugging)
 *
 * @param store - Zustand store
 * @returns JSON string of current state
 *
 * @example
 * console.log('Current state:', takeStoreSnapshot(useThemeStore));
 */
export function takeStoreSnapshot<T>(store: { getState: () => T }): string {
  const state = store.getState();
  return JSON.stringify(state, null, 2);
}

/**
 * Compare two store snapshots
 *
 * ⚠️ PERFORMANCE NOTE: Uses JSON.stringify for deep comparison.
 * O(n) complexity where n is the size of state. Avoid using in
 * production or with very large state objects (>10KB).
 *
 * @param snapshot1 - First snapshot (JSON string)
 * @param snapshot2 - Second snapshot (JSON string)
 * @returns Object showing differences
 *
 * @example
 * const before = takeStoreSnapshot(useThemeStore);
 * // ... perform actions ...
 * const after = takeStoreSnapshot(useThemeStore);
 * console.log('Changes:', compareSnapshots(before, after));
 */
export function compareSnapshots(snapshot1: string, snapshot2: string): Record<string, any> {
  const state1 = JSON.parse(snapshot1);
  const state2 = JSON.parse(snapshot2);
  const diff: Record<string, any> = {};

  // Find changed keys
  for (const key in state2) {
    if (JSON.stringify(state1[key]) !== JSON.stringify(state2[key])) {
      diff[key] = {
        before: state1[key],
        after: state2[key],
      };
    }
  }

  return diff;
}

// ============================================================================
// Logging Helpers (Development Only)
// ============================================================================

/**
 * Log all state changes in development
 *
 * @example
 * const useStore = create(
 *   logStateChanges((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }))
 * );
 */
export function logStateChanges<T>(
  storeImpl: StateCreator<T, [], []>
): StateCreator<T, [], []> {
  if (process.env.NODE_ENV !== 'development') {
    return storeImpl;
  }

  return (set, get, api) => {
    const loggedSet: typeof set = (partial, replace) => {
      const prevState = get();
      // ✅ ACCEPTABLE: as any needed for Zustand's complex overloads
      set(partial, replace as any);
      const nextState = get();

      logger.debug('Store State Change', 'StoreUtils', {
        previous: prevState,
        next: nextState,
        diff: compareSnapshots(
          JSON.stringify(prevState),
          JSON.stringify(nextState)
        ),
      });
    };

    return storeImpl(loggedSet, get, api);
  };
}
