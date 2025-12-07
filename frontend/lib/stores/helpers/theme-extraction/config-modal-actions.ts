/**
 * Theme Extraction Store - Configuration & Modal Actions
 * Phase 10.91 Day 8: Store Architecture Refactoring (Remediated)
 *
 * **Purpose:**
 * Manage extraction configuration and modal states
 *
 * **Responsibilities:**
 * - Extraction purpose configuration
 * - User expertise level
 * - Modal visibility (purpose wizard, guided wizard, mode selection)
 *
 * **Enterprise Standards:**
 * - ✅ Simple setters (5-10 lines each)
 * - ✅ Logging for configuration changes
 * - ✅ Defensive programming (input validation)
 * - ✅ TypeScript strict mode (NO 'any')
 *
 * @since Phase 10.91 Day 8
 * @remediated Phase 10.91 Day 8 (Type safety + validation)
 */

import { logger } from '@/lib/utils/logger';
import type { ResearchPurpose, UserExpertiseLevel } from './types';

/**
 * Valid user expertise levels
 */
const VALID_EXPERTISE_LEVELS: UserExpertiseLevel[] = ['novice', 'intermediate', 'advanced', 'expert'];

/**
 * Creates configuration and modal actions with type-safe state updates
 * @template T Store state type extending config/modal properties
 * @param set Zustand setState function
 * @returns Object with config/modal functions
 */
export function createConfigModalActions<T extends {
  extractionPurpose: ResearchPurpose | null;
  userExpertiseLevel: UserExpertiseLevel;
  showModeSelectionModal: boolean;
  showPurposeWizard: boolean;
  showGuidedWizard: boolean;
  isNavigatingToThemes: boolean; // Phase 10.106
}>(
  set: (partial: Partial<T>) => void
) {
  return {
    // ===========================
    // Configuration
    // ===========================

    /**
     * Set the research purpose for theme extraction
     * @param purpose Research purpose or null to clear
     */
    setExtractionPurpose: (purpose: ResearchPurpose | null): void => {
      // ✅ FIXED: ResearchPurpose is a string literal union, NOT an object
      // Input validation - check if purpose is a valid string
      if (purpose !== null && typeof purpose !== 'string') {
        logger.warn('setExtractionPurpose: Invalid purpose (expected string)', 'ThemeStore', {
          purpose,
          type: typeof purpose
        });
        return;
      }

      // ✅ FIXED: Log the string value directly, not trying to access .id
      logger.info('Setting extraction purpose', 'ThemeStore', {
        purpose: purpose || null
      });
      set({ extractionPurpose: purpose } as Partial<T>);
    },

    /**
     * Set the user's expertise level
     * @param level User expertise level
     */
    setUserExpertiseLevel: (level: UserExpertiseLevel): void => {
      // Input validation
      if (!level || !VALID_EXPERTISE_LEVELS.includes(level)) {
        logger.warn('setUserExpertiseLevel: Invalid expertise level', 'ThemeStore', {
          level,
          valid: VALID_EXPERTISE_LEVELS,
        });
        return;
      }

      logger.debug('Setting user expertise level', 'ThemeStore', { level });
      set({ userExpertiseLevel: level } as Partial<T>);
    },

    // ===========================
    // Modal Management
    // ===========================

    /**
     * Show/hide mode selection modal
     * @param show Boolean to show/hide modal
     */
    setShowModeSelectionModal: (show: boolean): void => {
      // Input validation
      if (typeof show !== 'boolean') {
        logger.warn('setShowModeSelectionModal: Invalid boolean', 'ThemeStore', { show });
        return;
      }

      set({ showModeSelectionModal: show } as Partial<T>);
    },

    /**
     * Show/hide purpose wizard modal
     * @param show Boolean to show/hide modal
     */
    setShowPurposeWizard: (show: boolean): void => {
      // Input validation
      if (typeof show !== 'boolean') {
        logger.warn('setShowPurposeWizard: Invalid boolean', 'ThemeStore', { show });
        return;
      }

      set({ showPurposeWizard: show } as Partial<T>);
    },

    /**
     * Show/hide guided wizard modal
     * @param show Boolean to show/hide modal
     */
    setShowGuidedWizard: (show: boolean): void => {
      // Input validation
      if (typeof show !== 'boolean') {
        logger.warn('setShowGuidedWizard: Invalid boolean', 'ThemeStore', { show });
        return;
      }

      set({ showGuidedWizard: show } as Partial<T>);
    },

    /**
     * Phase 10.106: Show/hide navigating to themes modal
     * @param navigating Boolean to show/hide modal
     */
    setIsNavigatingToThemes: (navigating: boolean): void => {
      // Input validation
      if (typeof navigating !== 'boolean') {
        logger.warn('setIsNavigatingToThemes: Invalid boolean', 'ThemeStore', { navigating });
        return;
      }

      set({ isNavigatingToThemes: navigating } as Partial<T>);
    },

    /**
     * Close all modals at once
     */
    closeAllModals: (): void => {
      logger.debug('Closing all modals', 'ThemeStore');
      set({
        showModeSelectionModal: false,
        showPurposeWizard: false,
        showGuidedWizard: false,
        isNavigatingToThemes: false, // Phase 10.106
      } as Partial<T>);
    },
  };
}
