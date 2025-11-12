/**
 * UI Preferences Zustand Store
 * Centralized state management for UI state and user preferences
 * Phase 10.1 Day 1 - Enterprise-Grade Refactoring
 *
 * @module ui-preferences.store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'list' | 'grid';
export type ActiveTab = 'results' | 'analysis' | 'transcriptions';
export type ResultsSubTab = 'papers' | 'videos' | 'library';
export type AnalysisSubTab = 'themes' | 'gaps' | 'synthesis';

export interface RestoreSummary {
  papers: number;
  themes: number;
  videos: number;
  lastSaved: string;
}

// ============================================================================
// Store Interface
// ============================================================================

interface UIPreferencesState {
  // View preferences
  viewMode: ViewMode;
  showDatabaseInfo: boolean;
  showCostCalculator: boolean;

  // Tab state
  activeTab: ActiveTab;
  activeResultsSubTab: ResultsSubTab;
  activeAnalysisSubTab: AnalysisSubTab;

  // Panel state
  expandedPanels: Set<string>;

  // Modal state
  showPurposeWizard: boolean;
  showModeSelectionModal: boolean;
  showGuidedWizard: boolean;
  showSurveyModal: boolean;

  // Restore state
  showRestoreBanner: boolean;
  restoreSummary: RestoreSummary | null;

  // Institution auth modal
  showInstitutionAuthModal: boolean;

  // Actions - View preferences
  setViewMode: (mode: ViewMode) => void;
  toggleDatabaseInfo: () => void;
  toggleCostCalculator: () => void;

  // Actions - Tabs
  setActiveTab: (tab: ActiveTab) => void;
  setActiveResultsSubTab: (tab: ResultsSubTab) => void;
  setActiveAnalysisSubTab: (tab: AnalysisSubTab) => void;

  // Actions - Panels
  togglePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;
  collapsePanel: (panelId: string) => void;
  collapseAllPanels: () => void;
  isPanelExpanded: (panelId: string) => boolean;

  // Actions - Modals
  openPurposeWizard: () => void;
  closePurposeWizard: () => void;
  openModeSelectionModal: () => void;
  closeModeSelectionModal: () => void;
  openGuidedWizard: () => void;
  closeGuidedWizard: () => void;
  openSurveyModal: () => void;
  closeSurveyModal: () => void;
  openInstitutionAuthModal: () => void;
  closeInstitutionAuthModal: () => void;

  // Actions - Restore banner
  showRestore: (summary: RestoreSummary) => void;
  hideRestoreBanner: () => void;

  // Actions - Reset
  reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useUIPreferencesStore = create<UIPreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        viewMode: 'list',
        showDatabaseInfo: false,
        showCostCalculator: false,
        activeTab: 'results',
        activeResultsSubTab: 'papers',
        activeAnalysisSubTab: 'themes',
        expandedPanels: new Set(),
        showPurposeWizard: false,
        showModeSelectionModal: false,
        showGuidedWizard: false,
        showSurveyModal: false,
        showRestoreBanner: false,
        restoreSummary: null,
        showInstitutionAuthModal: false,

        // View preference actions
        setViewMode: viewMode => set({ viewMode }),

        toggleDatabaseInfo: () =>
          set(state => ({
            showDatabaseInfo: !state.showDatabaseInfo,
          })),

        toggleCostCalculator: () =>
          set(state => ({
            showCostCalculator: !state.showCostCalculator,
          })),

        // Tab actions
        setActiveTab: activeTab => set({ activeTab }),

        setActiveResultsSubTab: activeResultsSubTab =>
          set({ activeResultsSubTab }),

        setActiveAnalysisSubTab: activeAnalysisSubTab =>
          set({ activeAnalysisSubTab }),

        // Panel actions
        togglePanel: panelId =>
          set(state => {
            const newSet = new Set(state.expandedPanels);
            if (newSet.has(panelId)) {
              newSet.delete(panelId);
            } else {
              newSet.add(panelId);
            }
            return { expandedPanels: newSet };
          }),

        expandPanel: panelId =>
          set(state => {
            const newSet = new Set(state.expandedPanels);
            newSet.add(panelId);
            return { expandedPanels: newSet };
          }),

        collapsePanel: panelId =>
          set(state => {
            const newSet = new Set(state.expandedPanels);
            newSet.delete(panelId);
            return { expandedPanels: newSet };
          }),

        collapseAllPanels: () => set({ expandedPanels: new Set() }),

        isPanelExpanded: panelId => get().expandedPanels.has(panelId),

        // Modal actions
        openPurposeWizard: () => set({ showPurposeWizard: true }),
        closePurposeWizard: () => set({ showPurposeWizard: false }),

        openModeSelectionModal: () => set({ showModeSelectionModal: true }),
        closeModeSelectionModal: () => set({ showModeSelectionModal: false }),

        openGuidedWizard: () => set({ showGuidedWizard: true }),
        closeGuidedWizard: () => set({ showGuidedWizard: false }),

        openSurveyModal: () => set({ showSurveyModal: true }),
        closeSurveyModal: () => set({ showSurveyModal: false }),

        openInstitutionAuthModal: () => set({ showInstitutionAuthModal: true }),
        closeInstitutionAuthModal: () =>
          set({ showInstitutionAuthModal: false }),

        // Restore banner actions
        showRestore: restoreSummary =>
          set({ showRestoreBanner: true, restoreSummary }),

        hideRestoreBanner: () =>
          set({ showRestoreBanner: false, restoreSummary: null }),

        // Reset action
        reset: () =>
          set({
            expandedPanels: new Set(),
            showPurposeWizard: false,
            showModeSelectionModal: false,
            showGuidedWizard: false,
            showSurveyModal: false,
            showRestoreBanner: false,
            restoreSummary: null,
            showInstitutionAuthModal: false,
          }),
      }),
      {
        name: 'ui-preferences-store',
        // Persist view preferences and tab state
        partialize: state => ({
          viewMode: state.viewMode,
          showDatabaseInfo: state.showDatabaseInfo,
          showCostCalculator: state.showCostCalculator,
          activeTab: state.activeTab,
          activeResultsSubTab: state.activeResultsSubTab,
          activeAnalysisSubTab: state.activeAnalysisSubTab,
          expandedPanels: Array.from(state.expandedPanels),
        }),
        // Convert Set back from array on rehydration
        onRehydrateStorage: () => state => {
          if (state) {
            state.expandedPanels = new Set(
              state.expandedPanels as unknown as string[]
            );
          }
        },
      }
    ),
    { name: 'UIPreferences' }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectViewPreferences = (state: UIPreferencesState) => ({
  viewMode: state.viewMode,
  showDatabaseInfo: state.showDatabaseInfo,
  showCostCalculator: state.showCostCalculator,
});

export const selectTabState = (state: UIPreferencesState) => ({
  activeTab: state.activeTab,
  activeResultsSubTab: state.activeResultsSubTab,
  activeAnalysisSubTab: state.activeAnalysisSubTab,
});

export const selectPanelState = (state: UIPreferencesState) => ({
  expandedPanels: state.expandedPanels,
  expandedCount: state.expandedPanels.size,
  isPanelExpanded: state.isPanelExpanded,
});

export const selectModalState = (state: UIPreferencesState) => ({
  showPurposeWizard: state.showPurposeWizard,
  showModeSelectionModal: state.showModeSelectionModal,
  showGuidedWizard: state.showGuidedWizard,
  showSurveyModal: state.showSurveyModal,
  showInstitutionAuthModal: state.showInstitutionAuthModal,
});

export const selectRestoreState = (state: UIPreferencesState) => ({
  showRestoreBanner: state.showRestoreBanner,
  restoreSummary: state.restoreSummary,
});
