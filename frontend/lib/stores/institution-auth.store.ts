/**
 * Institution Authentication Zustand Store
 * Phase 10.935 Day 11 - Created for AcademicResourcesPanel refactoring
 *
 * Enterprise-grade centralized state management for institutional authentication.
 * Enables access to premium academic databases through institutional credentials.
 *
 * @module InstitutionAuthStore
 * @since Phase 10.935 Day 11
 * @author VQMethod Team
 *
 * **Purpose:**
 * - Manage institutional authentication state (Shibboleth, OpenAthens, ORCID)
 * - Track accessible premium databases based on institution
 * - Persist auth state across page refreshes
 * - Enable seamless academic database access
 *
 * **Features:**
 * - Multi-method authentication support
 * - Institution-specific database access mapping
 * - localStorage persistence for auth state
 * - TypeScript strict mode compliance
 * - Zustand DevTools integration
 * - Defensive validation on auth object
 *
 * **State Structure:**
 * ```typescript
 * {
 *   auth: {
 *     isAuthenticated: boolean,
 *     institution: Institution | null,
 *     authMethod: 'shibboleth' | 'openathens' | 'orcid' | null,
 *     userName?: string,
 *     freeAccess: boolean,
 *     accessibleDatabases: string[]
 *   }
 * }
 * ```
 *
 * **Usage:**
 * ```typescript
 * import { useInstitutionAuthStore } from '@/lib/stores/institution-auth.store';
 *
 * function MyComponent() {
 *   const auth = useInstitutionAuthStore(state => state.auth);
 *   const setAuth = useInstitutionAuthStore(state => state.setAuth);
 *   const isAuthenticated = useInstitutionAuthStore(state => state.auth.isAuthenticated);
 *
 *   // Login
 *   setAuth({
 *     isAuthenticated: true,
 *     institution: { id: 'stanford', name: 'Stanford University' },
 *     authMethod: 'shibboleth',
 *     freeAccess: true,
 *     accessibleDatabases: ['ieee', 'springer', 'webofscience']
 *   });
 * }
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import type { Institution } from '@/lib/services/institution.service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Authentication method types
 */
export type AuthMethod = 'shibboleth' | 'openathens' | 'orcid' | null;

/**
 * Institution authentication state
 */
export interface InstitutionAuth {
  /** Whether user is currently authenticated with an institution */
  isAuthenticated: boolean;

  /** Institution details (null if not authenticated) */
  institution: Institution | null;

  /** Authentication method used */
  authMethod: AuthMethod;

  /** User's display name (optional, explicitly undefined for exactOptionalPropertyTypes) */
  userName?: string | undefined;

  /** Whether institution provides free access to premium databases */
  freeAccess: boolean;

  /** List of database IDs accessible through this institution */
  accessibleDatabases: string[];
}

/**
 * Institution Auth Store State & Actions
 */
export interface InstitutionAuthState {
  // ===========================
  // STATE
  // ===========================

  /** Current institutional authentication state */
  auth: InstitutionAuth;

  // ===========================
  // ACTIONS
  // ===========================

  /**
   * Set institutional authentication state
   * @param auth - New authentication state
   */
  setAuth: (auth: InstitutionAuth) => void;

  /**
   * Update specific fields in auth state
   * @param updates - Partial auth updates
   */
  updateAuth: (updates: Partial<InstitutionAuth>) => void;

  /**
   * Clear authentication (logout)
   */
  reset: () => void;

  /**
   * Check if specific database is accessible
   * @param databaseId - Database identifier
   * @returns Whether database is accessible
   */
  canAccessDatabase: (databaseId: string) => boolean;

  /**
   * Add database to accessible list
   * @param databaseId - Database identifier
   */
  addAccessibleDatabase: (databaseId: string) => void;

  /**
   * Remove database from accessible list
   * @param databaseId - Database identifier
   */
  removeAccessibleDatabase: (databaseId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default unauthenticated state
 */
const DEFAULT_AUTH: InstitutionAuth = {
  isAuthenticated: false,
  institution: null,
  authMethod: null,
  freeAccess: false,
  accessibleDatabases: [],
};

/**
 * Maximum accessible databases (defensive bound)
 */
const MAX_ACCESSIBLE_DATABASES = 50;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate institution auth object structure
 * @param auth - Auth object to validate
 * @returns Whether auth object is valid
 */
function isValidInstitutionAuth(auth: any): auth is InstitutionAuth {
  if (!auth || typeof auth !== 'object') {
    return false;
  }

  // Required fields
  if (typeof auth.isAuthenticated !== 'boolean') {
    return false;
  }

  if (typeof auth.freeAccess !== 'boolean') {
    return false;
  }

  if (!Array.isArray(auth.accessibleDatabases)) {
    return false;
  }

  // Validate authMethod (nullable enum)
  if (
    auth.authMethod !== null &&
    !['shibboleth', 'openathens', 'orcid'].includes(auth.authMethod)
  ) {
    return false;
  }

  // Validate institution (nullable object or specific structure)
  if (auth.institution !== null && typeof auth.institution !== 'object') {
    return false;
  }

  return true;
}

/**
 * Sanitize institution auth object
 * @param auth - Auth object to sanitize
 * @returns Sanitized auth object
 */
function sanitizeInstitutionAuth(auth: Partial<InstitutionAuth>): InstitutionAuth {
  // Defensive bounds on accessibleDatabases
  const accessibleDatabases = Array.isArray(auth.accessibleDatabases)
    ? auth.accessibleDatabases
        .filter((db): db is string => typeof db === 'string')
        .slice(0, MAX_ACCESSIBLE_DATABASES)
    : [];

  return {
    isAuthenticated: Boolean(auth.isAuthenticated),
    institution: auth.institution ?? null,
    authMethod: auth.authMethod ?? null,
    userName: auth.userName,
    freeAccess: Boolean(auth.freeAccess),
    accessibleDatabases,
  };
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

/**
 * Institution Authentication Store
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (no unchecked `any`)
 * - ✅ Defensive validation on all inputs
 * - ✅ Bounded data structures (MAX_ACCESSIBLE_DATABASES = 50)
 * - ✅ localStorage persistence for auth state
 * - ✅ DevTools integration for debugging
 * - ✅ Enterprise logging for security events
 */
export const useInstitutionAuthStore = create<InstitutionAuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ===========================
        // STATE
        // ===========================

        auth: DEFAULT_AUTH,

        // ===========================
        // ACTIONS
        // ===========================

        setAuth: (auth: InstitutionAuth) => {
          // Validate input
          if (!isValidInstitutionAuth(auth)) {
            logger.error(
              'Invalid institution auth object, rejecting update',
              'InstitutionAuthStore',
              { receivedAuth: auth }
            );
            return;
          }

          // Sanitize and set
          const sanitizedAuth = sanitizeInstitutionAuth(auth);

          set({ auth: sanitizedAuth }, false, 'setAuth');

          logger.info(
            auth.isAuthenticated ? 'Institution authenticated' : 'Institution logged out',
            'InstitutionAuthStore',
            {
              institution: sanitizedAuth.institution?.name,
              authMethod: sanitizedAuth.authMethod,
              accessibleDatabasesCount: sanitizedAuth.accessibleDatabases.length,
            }
          );
        },

        updateAuth: (updates: Partial<InstitutionAuth>) => {
          const currentAuth = get().auth;
          const updatedAuth = { ...currentAuth, ...updates };

          // Validate combined state
          if (!isValidInstitutionAuth(updatedAuth)) {
            logger.error(
              'Invalid institution auth update, rejecting',
              'InstitutionAuthStore',
              { updates }
            );
            return;
          }

          // Sanitize and set
          const sanitizedAuth = sanitizeInstitutionAuth(updatedAuth);

          set({ auth: sanitizedAuth }, false, 'updateAuth');

          logger.info('Institution auth updated', 'InstitutionAuthStore', {
            updatedFields: Object.keys(updates),
          });
        },

        reset: () => {
          set({ auth: DEFAULT_AUTH }, false, 'reset');

          logger.info('Institution auth reset (logged out)', 'InstitutionAuthStore');
        },

        canAccessDatabase: (databaseId: string): boolean => {
          const { auth } = get();

          if (!auth.isAuthenticated || !auth.freeAccess) {
            return false;
          }

          return auth.accessibleDatabases.includes(databaseId);
        },

        addAccessibleDatabase: (databaseId: string) => {
          const { auth } = get();

          // Validate database ID
          if (typeof databaseId !== 'string' || databaseId.trim() === '') {
            logger.warn(
              'Invalid database ID, cannot add to accessible list',
              'InstitutionAuthStore',
              { databaseId }
            );
            return;
          }

          // Check if already accessible
          if (auth.accessibleDatabases.includes(databaseId)) {
            return;
          }

          // Check bounds
          if (auth.accessibleDatabases.length >= MAX_ACCESSIBLE_DATABASES) {
            logger.warn(
              'Maximum accessible databases reached, cannot add more',
              'InstitutionAuthStore',
              { max: MAX_ACCESSIBLE_DATABASES }
            );
            return;
          }

          // Add database
          const newAccessibleDatabases = [...auth.accessibleDatabases, databaseId];

          set(
            {
              auth: {
                ...auth,
                accessibleDatabases: newAccessibleDatabases,
              },
            },
            false,
            'addAccessibleDatabase'
          );

          logger.info('Database added to accessible list', 'InstitutionAuthStore', {
            databaseId,
            totalAccessible: newAccessibleDatabases.length,
          });
        },

        removeAccessibleDatabase: (databaseId: string) => {
          const { auth } = get();

          // Remove database
          const newAccessibleDatabases = auth.accessibleDatabases.filter(
            (id) => id !== databaseId
          );

          // Only update if list changed
          if (newAccessibleDatabases.length === auth.accessibleDatabases.length) {
            return;
          }

          set(
            {
              auth: {
                ...auth,
                accessibleDatabases: newAccessibleDatabases,
              },
            },
            false,
            'removeAccessibleDatabase'
          );

          logger.info('Database removed from accessible list', 'InstitutionAuthStore', {
            databaseId,
            totalAccessible: newAccessibleDatabases.length,
          });
        },
      }),
      {
        name: 'institution-auth-store',
        version: 1,
        partialize: (state) => ({
          auth: state.auth,
        }),
        migrate: (persistedState: any, version: number) => {
          // ✅ SECURITY FIX: Validate persisted state structure
          if (!persistedState || typeof persistedState !== 'object') {
            logger.warn(
              'Invalid persisted institution auth state, resetting to defaults',
              'InstitutionAuthStore'
            );
            return {
              auth: DEFAULT_AUTH,
            };
          }

          // Validate auth object
          if (!isValidInstitutionAuth(persistedState.auth)) {
            logger.warn(
              'Invalid persisted auth object, resetting to defaults',
              'InstitutionAuthStore',
              { received: persistedState.auth }
            );
            return {
              auth: DEFAULT_AUTH,
            };
          }

          // Sanitize auth object (defensive bounds)
          const sanitizedAuth = sanitizeInstitutionAuth(persistedState.auth);

          logger.info(
            'Institution auth store migration complete',
            'InstitutionAuthStore',
            {
              fromVersion: version,
              toVersion: 1,
              isAuthenticated: sanitizedAuth.isAuthenticated,
            }
          );

          return {
            auth: sanitizedAuth,
          };
        },
      }
    ),
    {
      name: 'InstitutionAuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// SELECTORS (Optimized for performance)
// ============================================================================

/**
 * Select authentication status
 * @returns Whether user is authenticated
 */
export const selectIsAuthenticated = (state: InstitutionAuthState): boolean =>
  state.auth.isAuthenticated;

/**
 * Select institution name
 * @returns Institution name or null
 */
export const selectInstitutionName = (state: InstitutionAuthState): string | null =>
  state.auth.institution?.name ?? null;

/**
 * Select free access status
 * @returns Whether user has free access to premium databases
 */
export const selectHasFreeAccess = (state: InstitutionAuthState): boolean =>
  state.auth.isAuthenticated && state.auth.freeAccess;

/**
 * Select accessible database count
 * @returns Number of accessible databases
 */
export const selectAccessibleDatabaseCount = (state: InstitutionAuthState): number =>
  state.auth.accessibleDatabases.length;
