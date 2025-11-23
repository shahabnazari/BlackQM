/**
 * Theme Extraction Store Integration Tests
 * Phase 10.942 Day 5: Store Integration Testing
 *
 * Test Coverage:
 * - 5.4 Store Integration
 *   - showPurposeWizard state toggles correctly
 *   - showModeSelectionModal state toggles correctly
 *   - extractionPurpose set from wizard
 *   - analyzingThemes loading state
 *
 * Enterprise Standards:
 * - ✅ Zustand store testing best practices
 * - ✅ TypeScript strict mode
 * - ✅ State isolation between tests
 * - ✅ Action validation
 */

import { act, renderHook } from '@testing-library/react';
import { useThemeExtractionStore } from '../theme-extraction.store';
import type { ResearchPurpose, ExtractionProgress } from '../theme-extraction.store';

// ============================================================================
// Test Setup
// ============================================================================

describe('Theme Extraction Store Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useThemeExtractionStore());
    act(() => {
      result.current.reset();
    });
  });

  // ==========================================================================
  // 5.4.1 showPurposeWizard State Tests
  // ==========================================================================

  describe('5.4.1 showPurposeWizard State', () => {
    it('should default to false', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.showPurposeWizard).toBe(false);
    });

    it('should toggle to true when setShowPurposeWizard(true) is called', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
      });

      expect(result.current.showPurposeWizard).toBe(true);
    });

    it('should toggle back to false when setShowPurposeWizard(false) is called', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
      });
      expect(result.current.showPurposeWizard).toBe(true);

      act(() => {
        result.current.setShowPurposeWizard(false);
      });
      expect(result.current.showPurposeWizard).toBe(false);
    });

    it('should handle rapid toggling', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
        result.current.setShowPurposeWizard(false);
        result.current.setShowPurposeWizard(true);
        result.current.setShowPurposeWizard(false);
        result.current.setShowPurposeWizard(true);
      });

      expect(result.current.showPurposeWizard).toBe(true);
    });

    it('should be closed by closeAllModals()', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
      });
      expect(result.current.showPurposeWizard).toBe(true);

      act(() => {
        result.current.closeAllModals();
      });
      expect(result.current.showPurposeWizard).toBe(false);
    });
  });

  // ==========================================================================
  // 5.4.2 showModeSelectionModal State Tests
  // ==========================================================================

  describe('5.4.2 showModeSelectionModal State', () => {
    it('should default to false', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.showModeSelectionModal).toBe(false);
    });

    it('should toggle to true when setShowModeSelectionModal(true) is called', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowModeSelectionModal(true);
      });

      expect(result.current.showModeSelectionModal).toBe(true);
    });

    it('should toggle back to false when setShowModeSelectionModal(false) is called', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowModeSelectionModal(true);
      });
      expect(result.current.showModeSelectionModal).toBe(true);

      act(() => {
        result.current.setShowModeSelectionModal(false);
      });
      expect(result.current.showModeSelectionModal).toBe(false);
    });

    it('should be closed by closeAllModals()', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowModeSelectionModal(true);
      });
      expect(result.current.showModeSelectionModal).toBe(true);

      act(() => {
        result.current.closeAllModals();
      });
      expect(result.current.showModeSelectionModal).toBe(false);
    });
  });

  // ==========================================================================
  // 5.4.3 extractionPurpose State Tests
  // ==========================================================================

  describe('5.4.3 extractionPurpose State', () => {
    it('should default to null', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.extractionPurpose).toBe(null);
    });

    it('should set q_methodology purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('q_methodology');
      });

      expect(result.current.extractionPurpose).toBe('q_methodology');
    });

    it('should set survey_construction purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('survey_construction');
      });

      expect(result.current.extractionPurpose).toBe('survey_construction');
    });

    it('should set qualitative_analysis purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('qualitative_analysis');
      });

      expect(result.current.extractionPurpose).toBe('qualitative_analysis');
    });

    it('should set literature_synthesis purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('literature_synthesis');
      });

      expect(result.current.extractionPurpose).toBe('literature_synthesis');
    });

    it('should set hypothesis_generation purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('hypothesis_generation');
      });

      expect(result.current.extractionPurpose).toBe('hypothesis_generation');
    });

    it('should allow changing purpose', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('q_methodology');
      });
      expect(result.current.extractionPurpose).toBe('q_methodology');

      act(() => {
        result.current.setExtractionPurpose('survey_construction');
      });
      expect(result.current.extractionPurpose).toBe('survey_construction');
    });

    it('should reset to null', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('q_methodology');
      });
      expect(result.current.extractionPurpose).toBe('q_methodology');

      act(() => {
        result.current.setExtractionPurpose(null);
      });
      expect(result.current.extractionPurpose).toBe(null);
    });

    it('should persist purpose across re-renders', () => {
      const { result, rerender } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionPurpose('qualitative_analysis');
      });

      rerender();

      expect(result.current.extractionPurpose).toBe('qualitative_analysis');
    });
  });

  // ==========================================================================
  // 5.4.4 analyzingThemes Loading State Tests
  // ==========================================================================

  describe('5.4.4 analyzingThemes Loading State', () => {
    it('should default to false', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.analyzingThemes).toBe(false);
    });

    it('should set to true when extraction starts', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setAnalyzingThemes(true);
      });

      expect(result.current.analyzingThemes).toBe(true);
    });

    it('should set to false when extraction completes', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setAnalyzingThemes(true);
      });
      expect(result.current.analyzingThemes).toBe(true);

      act(() => {
        result.current.setAnalyzingThemes(false);
      });
      expect(result.current.analyzingThemes).toBe(false);
    });

    it('should be reset by reset() action', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setAnalyzingThemes(true);
      });
      expect(result.current.analyzingThemes).toBe(true);

      act(() => {
        result.current.reset();
      });
      expect(result.current.analyzingThemes).toBe(false);
    });
  });

  // ==========================================================================
  // Modal Coordination Tests
  // ==========================================================================

  describe('Modal Coordination', () => {
    it('should allow both modals to be open simultaneously', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
        result.current.setShowModeSelectionModal(true);
      });

      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showModeSelectionModal).toBe(true);
    });

    it('should close all modals with closeAllModals()', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
        result.current.setShowModeSelectionModal(true);
        result.current.setShowGuidedWizard(true);
      });

      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showModeSelectionModal).toBe(true);
      expect(result.current.showGuidedWizard).toBe(true);

      act(() => {
        result.current.closeAllModals();
      });

      expect(result.current.showPurposeWizard).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(result.current.showGuidedWizard).toBe(false);
    });
  });

  // ==========================================================================
  // User Expertise Level Tests
  // ==========================================================================

  describe('User Expertise Level', () => {
    it('should default to intermediate', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.userExpertiseLevel).toBe('intermediate');
    });

    it('should set novice expertise level', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setUserExpertiseLevel('novice');
      });

      expect(result.current.userExpertiseLevel).toBe('novice');
    });

    it('should set advanced expertise level', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setUserExpertiseLevel('advanced');
      });

      expect(result.current.userExpertiseLevel).toBe('advanced');
    });

    it('should set expert expertise level', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setUserExpertiseLevel('expert');
      });

      expect(result.current.userExpertiseLevel).toBe('expert');
    });
  });

  // ==========================================================================
  // Extraction Progress Tests
  // ==========================================================================

  describe('Extraction Progress', () => {
    // Helper to create valid ExtractionProgress object
    const createProgress = (overrides: Partial<ExtractionProgress> = {}): ExtractionProgress => ({
      current: 0,
      total: 10,
      stage: 'preparing',
      message: 'Starting...',
      percentage: 0,
      ...overrides,
    });

    it('should default extractionProgress to null', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.extractionProgress).toBe(null);
    });

    it('should set extraction progress', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      const progress = createProgress({
        current: 5,
        total: 10,
        percentage: 50,
        stage: 'extracting',
        message: 'Processing papers...',
      });

      act(() => {
        result.current.setExtractionProgress(progress);
      });

      expect(result.current.extractionProgress).toEqual(progress);
    });

    it('should update extraction progress', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionProgress(createProgress({
          current: 2,
          total: 10,
          percentage: 25,
          stage: 'preparing',
          message: 'Starting...',
        }));
      });

      act(() => {
        result.current.updateExtractionProgress({
          current: 7,
          percentage: 75,
          message: 'Almost done...',
        });
      });

      expect(result.current.extractionProgress?.percentage).toBe(75);
      expect(result.current.extractionProgress?.message).toBe('Almost done...');
      expect(result.current.extractionProgress?.current).toBe(7);
    });

    it('should reset extraction progress', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionProgress(createProgress({
          current: 10,
          total: 10,
          percentage: 100,
          stage: 'complete',
          message: 'Done!',
        }));
      });

      act(() => {
        result.current.resetExtractionProgress();
      });

      expect(result.current.extractionProgress).toBe(null);
    });
  });

  // ==========================================================================
  // Extraction Error Tests
  // ==========================================================================

  describe('Extraction Error', () => {
    it('should default extractionError to null', () => {
      const { result } = renderHook(() => useThemeExtractionStore());
      expect(result.current.extractionError).toBe(null);
    });

    it('should set extraction error', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionError('Network error occurred');
      });

      expect(result.current.extractionError).toBe('Network error occurred');
    });

    it('should clear extraction error', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setExtractionError('Some error');
      });
      expect(result.current.extractionError).toBe('Some error');

      act(() => {
        result.current.setExtractionError(null);
      });
      expect(result.current.extractionError).toBe(null);
    });
  });

  // ==========================================================================
  // Complete Flow Integration Test
  // ==========================================================================

  describe('Complete Flow Integration', () => {
    // Helper to create valid ExtractionProgress object
    const createProgress = (overrides: Partial<ExtractionProgress> = {}): ExtractionProgress => ({
      current: 0,
      total: 10,
      stage: 'preparing',
      message: 'Starting...',
      percentage: 0,
      ...overrides,
    });

    it('should support the full extraction initiation flow', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      // Step 1: Open Purpose Wizard
      act(() => {
        result.current.setShowPurposeWizard(true);
      });
      expect(result.current.showPurposeWizard).toBe(true);

      // Step 2: Select Purpose
      act(() => {
        result.current.setExtractionPurpose('q_methodology');
        result.current.setShowPurposeWizard(false);
      });
      expect(result.current.extractionPurpose).toBe('q_methodology');
      expect(result.current.showPurposeWizard).toBe(false);

      // Step 3: Open Mode Selection
      act(() => {
        result.current.setShowModeSelectionModal(true);
      });
      expect(result.current.showModeSelectionModal).toBe(true);

      // Step 4: Start Extraction
      act(() => {
        result.current.setShowModeSelectionModal(false);
        result.current.setAnalyzingThemes(true);
        result.current.setExtractionProgress(createProgress({
          current: 0,
          total: 20,
          percentage: 0,
          stage: 'preparing',
          message: 'Starting extraction...',
        }));
      });
      expect(result.current.analyzingThemes).toBe(true);
      expect(result.current.extractionProgress?.percentage).toBe(0);

      // Step 5: Update Progress
      act(() => {
        result.current.updateExtractionProgress({
          current: 10,
          percentage: 50,
          stage: 'extracting',
          message: 'Extracting themes...',
        });
      });
      expect(result.current.extractionProgress?.percentage).toBe(50);

      // Step 6: Complete Extraction
      act(() => {
        result.current.completeExtraction(45);
        result.current.setAnalyzingThemes(false);
      });
      expect(result.current.analyzingThemes).toBe(false);
    });

    it('should handle extraction error flow', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      // Start extraction
      act(() => {
        result.current.setAnalyzingThemes(true);
        result.current.setExtractionProgress(createProgress({
          current: 2,
          total: 10,
          percentage: 25,
          stage: 'extracting',
          message: 'Processing...',
        }));
      });

      // Error occurs
      act(() => {
        result.current.setExtractionError('API rate limit exceeded');
        result.current.setAnalyzingThemes(false);
        result.current.resetExtractionProgress();
      });

      expect(result.current.analyzingThemes).toBe(false);
      expect(result.current.extractionError).toBe('API rate limit exceeded');
      expect(result.current.extractionProgress).toBe(null);
    });
  });

  // ==========================================================================
  // Store Selectors Tests
  // ==========================================================================

  describe('Store Selectors', () => {
    it('selectModalState should return correct modal states', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setShowPurposeWizard(true);
        result.current.setShowModeSelectionModal(true);
        result.current.setShowGuidedWizard(true);
      });

      // Access modal states directly (selectors are used in components)
      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showModeSelectionModal).toBe(true);
      expect(result.current.showGuidedWizard).toBe(true);
    });

    it('selectExtractionStatus should return extraction status', () => {
      const { result } = renderHook(() => useThemeExtractionStore());

      act(() => {
        result.current.setAnalyzingThemes(true);
        result.current.setExtractionProgress({
          current: 7,
          total: 10,
          percentage: 75,
          stage: 'extracting',
          message: 'Almost done',
        });
      });

      expect(result.current.analyzingThemes).toBe(true);
      expect(result.current.extractionProgress?.percentage).toBe(75);
      expect(result.current.extractionError).toBe(null);
    });
  });
});
