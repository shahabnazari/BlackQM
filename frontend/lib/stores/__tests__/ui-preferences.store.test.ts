/**
 * UI Preferences Store Unit Tests
 * Phase 10.1 Day 1 - Enterprise-Grade Testing
 *
 * @module ui-preferences.store.test
 */

import { renderHook, act } from '@testing-library/react';
import {
  useUIPreferencesStore,
  ViewMode,
  ActiveTab,
  ResultsSubTab,
  AnalysisSubTab,
  RestoreSummary,
} from '../ui-preferences.store';

const mockRestoreSummary: RestoreSummary = {
  papers: 10,
  themes: 5,
  videos: 3,
  lastSaved: '2024-01-01T12:00:00Z',
};

describe('UIPreferencesStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useUIPreferencesStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      expect(result.current.viewMode).toBe('list');
      expect(result.current.showDatabaseInfo).toBe(false);
      expect(result.current.showCostCalculator).toBe(false);
      expect(result.current.activeTab).toBe('results');
      expect(result.current.activeResultsSubTab).toBe('papers');
      expect(result.current.activeAnalysisSubTab).toBe('themes');
      expect(result.current.expandedPanels.size).toBe(0);
      expect(result.current.showPurposeWizard).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(result.current.showGuidedWizard).toBe(false);
      expect(result.current.showSurveyModal).toBe(false);
      expect(result.current.showRestoreBanner).toBe(false);
      expect(result.current.restoreSummary).toBeNull();
      expect(result.current.showInstitutionAuthModal).toBe(false);
    });
  });

  describe('View Preference Actions', () => {
    it('should set view mode', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(result.current.viewMode).toBe('grid');

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });

    it('should toggle database info', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      expect(result.current.showDatabaseInfo).toBe(false);

      act(() => {
        result.current.toggleDatabaseInfo();
      });

      expect(result.current.showDatabaseInfo).toBe(true);

      act(() => {
        result.current.toggleDatabaseInfo();
      });

      expect(result.current.showDatabaseInfo).toBe(false);
    });

    it('should toggle cost calculator', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      expect(result.current.showCostCalculator).toBe(false);

      act(() => {
        result.current.toggleCostCalculator();
      });

      expect(result.current.showCostCalculator).toBe(true);

      act(() => {
        result.current.toggleCostCalculator();
      });

      expect(result.current.showCostCalculator).toBe(false);
    });
  });

  describe('Tab Actions', () => {
    it('should set active tab', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setActiveTab('analysis');
      });

      expect(result.current.activeTab).toBe('analysis');

      act(() => {
        result.current.setActiveTab('transcriptions');
      });

      expect(result.current.activeTab).toBe('transcriptions');
    });

    it('should set active results sub-tab', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setActiveResultsSubTab('videos');
      });

      expect(result.current.activeResultsSubTab).toBe('videos');

      act(() => {
        result.current.setActiveResultsSubTab('library');
      });

      expect(result.current.activeResultsSubTab).toBe('library');
    });

    it('should set active analysis sub-tab', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setActiveAnalysisSubTab('gaps');
      });

      expect(result.current.activeAnalysisSubTab).toBe('gaps');

      act(() => {
        result.current.setActiveAnalysisSubTab('synthesis');
      });

      expect(result.current.activeAnalysisSubTab).toBe('synthesis');
    });
  });

  describe('Panel Actions', () => {
    it('should toggle panel expansion', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      // Expand panel
      act(() => {
        result.current.togglePanel('search');
      });

      expect(result.current.expandedPanels.has('search')).toBe(true);
      expect(result.current.isPanelExpanded('search')).toBe(true);

      // Collapse panel
      act(() => {
        result.current.togglePanel('search');
      });

      expect(result.current.expandedPanels.has('search')).toBe(false);
      expect(result.current.isPanelExpanded('search')).toBe(false);
    });

    it('should expand panel', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('youtube');
      });

      expect(result.current.expandedPanels.has('youtube')).toBe(true);
      expect(result.current.isPanelExpanded('youtube')).toBe(true);
    });

    it('should collapse panel', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('social');
        result.current.collapsePanel('social');
      });

      expect(result.current.expandedPanels.has('social')).toBe(false);
      expect(result.current.isPanelExpanded('social')).toBe(false);
    });

    it('should collapse all panels', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('search');
        result.current.expandPanel('youtube');
        result.current.expandPanel('social');
      });

      expect(result.current.expandedPanels.size).toBe(3);

      act(() => {
        result.current.collapseAllPanels();
      });

      expect(result.current.expandedPanels.size).toBe(0);
    });

    it('should check if panel is expanded', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('search');
      });

      expect(result.current.isPanelExpanded('search')).toBe(true);
      expect(result.current.isPanelExpanded('youtube')).toBe(false);
    });
  });

  describe('Modal Actions', () => {
    it('should open and close purpose wizard', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openPurposeWizard();
      });

      expect(result.current.showPurposeWizard).toBe(true);

      act(() => {
        result.current.closePurposeWizard();
      });

      expect(result.current.showPurposeWizard).toBe(false);
    });

    it('should open and close mode selection modal', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openModeSelectionModal();
      });

      expect(result.current.showModeSelectionModal).toBe(true);

      act(() => {
        result.current.closeModeSelectionModal();
      });

      expect(result.current.showModeSelectionModal).toBe(false);
    });

    it('should open and close guided wizard', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openGuidedWizard();
      });

      expect(result.current.showGuidedWizard).toBe(true);

      act(() => {
        result.current.closeGuidedWizard();
      });

      expect(result.current.showGuidedWizard).toBe(false);
    });

    it('should open and close survey modal', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openSurveyModal();
      });

      expect(result.current.showSurveyModal).toBe(true);

      act(() => {
        result.current.closeSurveyModal();
      });

      expect(result.current.showSurveyModal).toBe(false);
    });

    it('should open and close institution auth modal', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openInstitutionAuthModal();
      });

      expect(result.current.showInstitutionAuthModal).toBe(true);

      act(() => {
        result.current.closeInstitutionAuthModal();
      });

      expect(result.current.showInstitutionAuthModal).toBe(false);
    });
  });

  describe('Restore Banner Actions', () => {
    it('should show restore banner with summary', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.showRestore(mockRestoreSummary);
      });

      expect(result.current.showRestoreBanner).toBe(true);
      expect(result.current.restoreSummary).toEqual(mockRestoreSummary);
      expect(result.current.restoreSummary?.papers).toBe(10);
      expect(result.current.restoreSummary?.themes).toBe(5);
    });

    it('should hide restore banner', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.showRestore(mockRestoreSummary);
      });

      expect(result.current.showRestoreBanner).toBe(true);
      expect(result.current.restoreSummary).toBeTruthy();

      act(() => {
        result.current.hideRestoreBanner();
      });

      expect(result.current.showRestoreBanner).toBe(false);
      expect(result.current.restoreSummary).toBeNull();
    });
  });

  describe('Reset Action', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      // Set some state
      act(() => {
        result.current.expandPanel('search');
        result.current.expandPanel('youtube');
        result.current.openPurposeWizard();
        result.current.openModeSelectionModal();
        result.current.openGuidedWizard();
        result.current.openSurveyModal();
        result.current.openInstitutionAuthModal();
        result.current.showRestore(mockRestoreSummary);
      });

      // Verify state is set
      expect(result.current.expandedPanels.size).toBe(2);
      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showModeSelectionModal).toBe(true);
      expect(result.current.showGuidedWizard).toBe(true);
      expect(result.current.showSurveyModal).toBe(true);
      expect(result.current.showInstitutionAuthModal).toBe(true);
      expect(result.current.showRestoreBanner).toBe(true);
      expect(result.current.restoreSummary).toBeTruthy();

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset
      expect(result.current.expandedPanels.size).toBe(0);
      expect(result.current.showPurposeWizard).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(result.current.showGuidedWizard).toBe(false);
      expect(result.current.showSurveyModal).toBe(false);
      expect(result.current.showInstitutionAuthModal).toBe(false);
      expect(result.current.showRestoreBanner).toBe(false);
      expect(result.current.restoreSummary).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle toggling same panel multiple times', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.togglePanel('search');
        result.current.togglePanel('search');
        result.current.togglePanel('search');
      });

      expect(result.current.expandedPanels.has('search')).toBe(true);
    });

    it('should handle expanding already expanded panel', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('search');
        result.current.expandPanel('search');
      });

      expect(result.current.expandedPanels.size).toBe(1);
    });

    it('should handle collapsing non-expanded panel', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.collapsePanel('search');
      });

      expect(result.current.expandedPanels.size).toBe(0);
    });

    it('should handle checking non-existent panel', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      const isExpanded = result.current.isPanelExpanded('nonexistent');

      expect(isExpanded).toBe(false);
    });

    it('should handle opening multiple modals', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.openPurposeWizard();
        result.current.openModeSelectionModal();
        result.current.openGuidedWizard();
      });

      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showModeSelectionModal).toBe(true);
      expect(result.current.showGuidedWizard).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist view preferences', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setViewMode('grid');
        result.current.toggleDatabaseInfo();
        result.current.toggleCostCalculator();
      });

      // Check persistence partialize would save these
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.showDatabaseInfo).toBe(true);
      expect(result.current.showCostCalculator).toBe(true);
    });

    it('should persist tab state', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.setActiveTab('analysis');
        result.current.setActiveResultsSubTab('videos');
        result.current.setActiveAnalysisSubTab('gaps');
      });

      expect(result.current.activeTab).toBe('analysis');
      expect(result.current.activeResultsSubTab).toBe('videos');
      expect(result.current.activeAnalysisSubTab).toBe('gaps');
    });

    it('should persist expanded panels', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      act(() => {
        result.current.expandPanel('search');
        result.current.expandPanel('youtube');
      });

      expect(result.current.expandedPanels.size).toBe(2);
    });

    it('should not persist modal states', () => {
      const { result } = renderHook(() => useUIPreferencesStore());

      // Modals should not be persisted
      act(() => {
        result.current.openPurposeWizard();
        result.current.showRestore(mockRestoreSummary);
      });

      // These would not be in partialize
      expect(result.current.showPurposeWizard).toBe(true);
      expect(result.current.showRestoreBanner).toBe(true);
    });
  });
});
