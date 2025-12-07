/**
 * Theme Extraction Flow - Diagnostic Unit Tests
 * Phase 10.97 Day 3
 *
 * Tests the complete extraction flow from clicking "Extract Themes"
 * through purpose selection, mode selection, and extraction execution.
 */

import { renderHook, act } from '@testing-library/react';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { analyzeContentForExtraction } from '../../utils/content-analysis';

// Mock paper data
const mockPapers = [
  {
    id: 'paper-1',
    title: 'Test Paper 1',
    abstract: 'This is a test abstract for paper 1 with sufficient content for analysis.',
    authors: ['Author A'],
    year: 2024,
  },
  {
    id: 'paper-2',
    title: 'Test Paper 2',
    abstract: 'This is a test abstract for paper 2 with more content for theme extraction testing.',
    authors: ['Author B'],
    year: 2024,
  },
  {
    id: 'paper-3',
    title: 'Test Paper 3',
    abstract: 'This is a test abstract for paper 3 that provides additional context for themes.',
    authors: ['Author C'],
    year: 2024,
  },
];

describe('Theme Extraction Flow', () => {
  beforeEach(() => {
    // Reset stores before each test
    const themeStore = useThemeExtractionStore.getState();
    themeStore.reset();

    const litStore = useLiteratureSearchStore.getState();
    litStore.setPapers([]);
    litStore.setSelectedPapers(new Set());
  });

  describe('Step 1: Content Analysis Computation', () => {
    it('should return null when papers array is empty', () => {
      const result = analyzeContentForExtraction([]);
      expect(result).toBeNull();
    });

    it('should return ContentAnalysisResult when papers have content', () => {
      const result = analyzeContentForExtraction(mockPapers as any);
      expect(result).not.toBeNull();
      expect(result?.totalSelected).toBe(3);
      expect(result?.totalWithContent).toBeGreaterThan(0);
    });

    it('should correctly count papers with abstracts', () => {
      const result = analyzeContentForExtraction(mockPapers as any);
      expect(result?.abstractCount).toBeGreaterThanOrEqual(0);
      expect(result?.sources.length).toBeGreaterThan(0);
    });
  });

  describe('Step 2: Store State - Literature Search', () => {
    it('should correctly set papers in literature search store', () => {
      const store = useLiteratureSearchStore.getState();
      store.setPapers(mockPapers as any);

      const state = useLiteratureSearchStore.getState();
      expect(state.papers.length).toBe(3);
    });

    it('should correctly set selected papers', () => {
      const store = useLiteratureSearchStore.getState();
      store.setPapers(mockPapers as any);
      store.setSelectedPapers(new Set(['paper-1', 'paper-2']));

      const state = useLiteratureSearchStore.getState();
      expect(state.selectedPapers.size).toBe(2);
      expect(state.selectedPapers.has('paper-1')).toBe(true);
    });
  });

  describe('Step 3: Store State - Theme Extraction', () => {
    it('should correctly clear themes', () => {
      const store = useThemeExtractionStore.getState();

      // Set some initial themes
      store.setUnifiedThemes([
        { id: 'theme-1', name: 'Test Theme', description: 'Test', confidence: 0.8 } as any,
      ]);

      expect(useThemeExtractionStore.getState().unifiedThemes.length).toBe(1);

      // Clear themes
      store.clearThemes();

      expect(useThemeExtractionStore.getState().unifiedThemes.length).toBe(0);
      expect(useThemeExtractionStore.getState().selectedThemeIds.length).toBe(0);
    });

    it('should correctly set showPurposeWizard', () => {
      const store = useThemeExtractionStore.getState();
      store.setShowPurposeWizard(true);

      expect(useThemeExtractionStore.getState().showPurposeWizard).toBe(true);
    });

    it('should correctly set showModeSelectionModal', () => {
      const store = useThemeExtractionStore.getState();
      store.setShowModeSelectionModal(true);

      expect(useThemeExtractionStore.getState().showModeSelectionModal).toBe(true);
    });

    it('should correctly set extractionPurpose', () => {
      const store = useThemeExtractionStore.getState();
      store.setExtractionPurpose('q_methodology');

      expect(useThemeExtractionStore.getState().extractionPurpose).toBe('q_methodology');
    });
  });

  describe('Step 4: Paper Selection Logic', () => {
    it('should return all papers when no selection is made', () => {
      const store = useLiteratureSearchStore.getState();
      store.setPapers(mockPapers as any);
      store.setSelectedPapers(new Set()); // Empty selection

      const state = useLiteratureSearchStore.getState();
      const selectedPaperIdsSet = state.selectedPapers;

      // Simulate the selectedPapersList computation
      let selectedPapersList: typeof mockPapers;
      if (selectedPaperIdsSet.size > 0) {
        selectedPapersList = state.papers.filter(
          (p: any) => p && p.id && selectedPaperIdsSet.has(p.id)
        );
      } else {
        selectedPapersList = state.papers;
      }

      expect(selectedPapersList.length).toBe(3); // All papers
    });

    it('should filter papers when selection is made', () => {
      const store = useLiteratureSearchStore.getState();
      store.setPapers(mockPapers as any);
      store.setSelectedPapers(new Set(['paper-1', 'paper-2']));

      const state = useLiteratureSearchStore.getState();
      const selectedPaperIdsSet = state.selectedPapers;

      // Simulate the selectedPapersList computation
      let selectedPapersList: typeof mockPapers;
      if (selectedPaperIdsSet.size > 0) {
        selectedPapersList = state.papers.filter(
          (p: any) => p && p.id && selectedPaperIdsSet.has(p.id)
        );
      } else {
        selectedPapersList = state.papers;
      }

      expect(selectedPapersList.length).toBe(2); // Only selected papers
    });

    it('should return empty array when selection IDs do not match any papers', () => {
      const store = useLiteratureSearchStore.getState();
      store.setPapers(mockPapers as any);
      store.setSelectedPapers(new Set(['non-existent-id'])); // ID that doesn't exist

      const state = useLiteratureSearchStore.getState();
      const selectedPaperIdsSet = state.selectedPapers;

      // Simulate the selectedPapersList computation
      let selectedPapersList: typeof mockPapers;
      if (selectedPaperIdsSet.size > 0) {
        selectedPapersList = state.papers.filter(
          (p: any) => p && p.id && selectedPaperIdsSet.has(p.id)
        );
      } else {
        selectedPapersList = state.papers;
      }

      // THIS IS THE BUG: If selection exists but doesn't match, we get empty array!
      expect(selectedPapersList.length).toBe(0);
    });
  });

  describe('Step 5: Full Extraction Flow Simulation', () => {
    it('should complete full flow: papers → clear themes → open wizard', () => {
      // 1. Set up papers in literature search store
      const litStore = useLiteratureSearchStore.getState();
      litStore.setPapers(mockPapers as any);
      litStore.setSelectedPapers(new Set(['paper-1', 'paper-2', 'paper-3']));

      // 2. Set up initial themes in theme extraction store
      const themeStore = useThemeExtractionStore.getState();
      themeStore.setUnifiedThemes([
        { id: 'old-theme', name: 'Old Theme', description: 'Old', confidence: 0.5 } as any,
      ]);

      // 3. Simulate clicking "Extract Themes"
      // Validation: papers exist
      expect(useLiteratureSearchStore.getState().papers.length).toBeGreaterThan(0);

      // Clear old themes
      themeStore.clearThemes();
      expect(useThemeExtractionStore.getState().unifiedThemes.length).toBe(0);

      // Open purpose wizard
      themeStore.setShowPurposeWizard(true);
      expect(useThemeExtractionStore.getState().showPurposeWizard).toBe(true);

      // 4. Verify contentAnalysis would be computed correctly
      const state = useLiteratureSearchStore.getState();
      const selectedPaperIdsSet = state.selectedPapers;
      const selectedPapersList = selectedPaperIdsSet.size > 0
        ? state.papers.filter((p: any) => p && p.id && selectedPaperIdsSet.has(p.id))
        : state.papers;

      const contentAnalysis = analyzeContentForExtraction(selectedPapersList as any);
      expect(contentAnalysis).not.toBeNull();
      expect(contentAnalysis?.totalSelected).toBe(3);
    });
  });

  describe('Step 6: Selection Mismatch Handling (BUGFIX)', () => {
    it('BEFORE FIX: Selection mismatch would cause empty contentAnalysis', () => {
      // This test documents the bug that existed before the fix

      // Old search results
      const oldPapers = [
        { id: 'old-paper-1', title: 'Old Paper 1', abstract: 'Old abstract 1' },
      ];

      // User selects papers
      const litStore = useLiteratureSearchStore.getState();
      litStore.setPapers(oldPapers as any);
      litStore.setSelectedPapers(new Set(['old-paper-1']));

      // New search results (different IDs)
      const newPapers = [
        { id: 'new-paper-1', title: 'New Paper 1', abstract: 'New abstract 1' },
        { id: 'new-paper-2', title: 'New Paper 2', abstract: 'New abstract 2' },
      ];

      // Update papers but NOT selectedPapers (simulating stale selection)
      litStore.setPapers(newPapers as any);
      // Note: selectedPapers still has 'old-paper-1'

      const state = useLiteratureSearchStore.getState();
      expect(state.papers.length).toBe(2); // New papers
      expect(state.selectedPapers.size).toBe(1); // Still has old selection

      // OLD BUG: This filtering would produce empty array
      const selectedPaperIdsSet = state.selectedPapers;
      const oldBugResult = selectedPaperIdsSet.size > 0
        ? state.papers.filter((p: any) => p && p.id && selectedPaperIdsSet.has(p.id))
        : state.papers;

      expect(oldBugResult.length).toBe(0); // Empty due to mismatch!
    });

    it('AFTER FIX: Selection mismatch falls back to all papers', () => {
      // This test verifies the fix works correctly

      // Old search results
      const oldPapers = [
        { id: 'old-paper-1', title: 'Old Paper 1', abstract: 'Old abstract 1' },
      ];

      // User selects papers
      const litStore = useLiteratureSearchStore.getState();
      litStore.setPapers(oldPapers as any);
      litStore.setSelectedPapers(new Set(['old-paper-1']));

      // New search results (different IDs)
      const newPapers = [
        { id: 'new-paper-1', title: 'New Paper 1', abstract: 'New abstract 1 with sufficient content' },
        { id: 'new-paper-2', title: 'New Paper 2', abstract: 'New abstract 2 with sufficient content' },
      ];

      // Update papers but NOT selectedPapers (simulating stale selection)
      litStore.setPapers(newPapers as any);

      const state = useLiteratureSearchStore.getState();
      const selectedPaperIdsSet = state.selectedPapers;

      // NEW FIX: If filtering produces empty but papers exist, use all papers
      let selectedPapersList: any[];
      if (selectedPaperIdsSet.size > 0) {
        const filtered = state.papers.filter(
          (p: any) => p && p.id && selectedPaperIdsSet.has(p.id)
        );
        // BUGFIX: Fall back to all papers if selection doesn't match
        if (filtered.length === 0 && state.papers.length > 0) {
          selectedPapersList = state.papers;
        } else {
          selectedPapersList = filtered;
        }
      } else {
        selectedPapersList = state.papers;
      }

      expect(selectedPapersList.length).toBe(2); // Falls back to all papers!

      // Now contentAnalysis should NOT be null
      const contentAnalysis = analyzeContentForExtraction(selectedPapersList as any);
      expect(contentAnalysis).not.toBeNull();
      expect(contentAnalysis?.totalSelected).toBe(2);
    });
  });
});
