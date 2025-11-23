/**
 * Paper Management Hook - Phase 10.91 Day 5 (MIGRATED TO ZUSTAND)
 *
 * **MIGRATION NOTE:** This hook is now a thin wrapper around PaperManagementStore.
 * All state management has been migrated to Zustand for consistency and better performance.
 *
 * Enterprise-grade hook for managing paper selection, saving, and extraction state.
 * Extracted from God Component pattern to improve code organization and reusability.
 *
 * @module usePaperManagement
 * @since Phase 10.1 Day 4
 * @migrated Phase 10.91 Day 5 - Zustand Migration
 * @author VQMethod Team
 *
 * **Features:**
 * - Paper selection state management (via Zustand store)
 * - Saved papers library with localStorage sync
 * - Extraction progress tracking
 * - Automatic backend synchronization
 * - TypeScript strict mode compliance
 * - No useState - all state in Zustand store
 *
 * **Usage:**
 * ```typescript
 * const {
 *   selectedPapers,
 *   savedPapers,
 *   extractingPapers,
 *   extractedPapers,
 *   togglePaperSelection,
 *   handleSavePaper,
 *   handleRemovePaper,
 *   handleTogglePaperSave,
 *   loadUserLibrary,
 *   isSelected,
 *   isSaved,
 *   isExtracting,
 *   isExtracted,
 * } = usePaperManagement();
 * ```
 */

import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import type { Paper } from '@/lib/services/literature-api.service';

/**
 * Paper management state and operations
 */
export interface UsePaperManagementReturn {
  // State
  selectedPapers: Set<string>;
  savedPapers: Paper[];
  extractingPapers: Set<string>;
  extractedPapers: Set<string>;

  // Setters (for integration with existing code)
  setSelectedPapers: (
    papers: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;
  setSavedPapers: (papers: Paper[] | ((prev: Paper[]) => Paper[])) => void;
  setExtractingPapers: (
    papers: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;
  setExtractedPapers: (
    papers: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;

  // Handlers
  togglePaperSelection: (paperId: string) => void;
  handleSavePaper: (paper: Paper) => Promise<void>;
  handleRemovePaper: (paperId: string) => Promise<void>;
  handleTogglePaperSave: (paper: Paper) => Promise<void>;
  loadUserLibrary: () => Promise<void>;

  // Helper utilities
  isSelected: (paperId: string) => boolean;
  isSaved: (paperId: string) => boolean;
  isExtracting: (paperId: string) => boolean;
  isExtracted: (paperId: string) => boolean;
  clearSelection: () => void;
  selectAll: (paperIds: string[]) => void;
}

/**
 * Hook for managing paper selection, saving, and extraction state
 *
 * **Phase 10.91 Day 5 Migration:**
 * - Removed all useState declarations
 * - Removed useCallback wrappers (store actions are stable)
 * - Removed useRef for loading state (now in store)
 * - Hook now directly returns store state and actions
 * - Maintains exact same API for backward compatibility
 *
 * @returns {UsePaperManagementReturn} Paper management state and operations
 */
export function usePaperManagement(): UsePaperManagementReturn {
  // ===========================
  // ZUSTAND STORE INTEGRATION
  // ===========================

  // Get all state and actions from store
  const selectedPapers = usePaperManagementStore(state => state.selectedPapers);
  const savedPapers = usePaperManagementStore(state => state.savedPapers);
  const extractingPapers = usePaperManagementStore(state => state.extractingPapers);
  const extractedPapers = usePaperManagementStore(state => state.extractedPapers);

  const togglePaperSelection = usePaperManagementStore(
    state => state.togglePaperSelection
  );
  const clearSelection = usePaperManagementStore(state => state.clearSelection);
  const selectAll = usePaperManagementStore(state => state.selectAll);
  const setSelectedPapers = usePaperManagementStore(state => state.setSelectedPapers);

  const handleSavePaper = usePaperManagementStore(state => state.handleSavePaper);
  const handleRemovePaper = usePaperManagementStore(state => state.handleRemovePaper);
  const handleTogglePaperSave = usePaperManagementStore(
    state => state.handleTogglePaperSave
  );
  const loadUserLibrary = usePaperManagementStore(state => state.loadUserLibrary);
  const setSavedPapers = usePaperManagementStore(state => state.setSavedPapers);

  const setExtractingPapers = usePaperManagementStore(
    state => state.setExtractingPapers
  );
  const setExtractedPapers = usePaperManagementStore(
    state => state.setExtractedPapers
  );

  const isSelected = usePaperManagementStore(state => state.isSelected);
  const isSaved = usePaperManagementStore(state => state.isSaved);
  const isExtracting = usePaperManagementStore(state => state.isExtracting);
  const isExtracted = usePaperManagementStore(state => state.isExtracted);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // State
    selectedPapers,
    savedPapers,
    extractingPapers,
    extractedPapers,

    // Setters (for backward compatibility)
    setSelectedPapers,
    setSavedPapers,
    setExtractingPapers,
    setExtractedPapers,

    // Handlers
    togglePaperSelection,
    handleSavePaper,
    handleRemovePaper,
    handleTogglePaperSave,
    loadUserLibrary,

    // Utilities
    isSelected,
    isSaved,
    isExtracting,
    isExtracted,
    clearSelection,
    selectAll,
  };
}
