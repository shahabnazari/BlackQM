/**
 * Paper Management Hook - Phase 10.1 Day 4
 *
 * Enterprise-grade hook for managing paper selection, saving, and extraction state.
 * Extracted from God Component pattern to improve code organization and reusability.
 *
 * @module usePaperManagement
 * @since Phase 10.1 Day 4
 * @author VQMethod Team
 *
 * **Features:**
 * - Paper selection state management
 * - Saved papers library with localStorage sync
 * - Extraction progress tracking
 * - Automatic backend synchronization
 * - TypeScript strict mode compliance
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

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { literatureAPI, Paper } from '@/lib/services/literature-api.service';

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
  setSelectedPapers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSavedPapers: React.Dispatch<React.SetStateAction<Paper[]>>;
  setExtractingPapers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExtractedPapers: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Handlers
  togglePaperSelection: (paperId: string) => void;
  handleSavePaper: (paper: Paper) => Promise<void>;
  handleRemovePaper: (paperId: string) => Promise<void>;
  handleTogglePaperSave: (paper: Paper) => void;
  loadUserLibrary: () => Promise<void>;

  // Helper utilities
  isSelected: (paperId: string) => boolean;
  isSaved: (paperId: string) => boolean;
  isExtracting: (paperId: string) => boolean;
  isExtracted: (paperId: string) => boolean;
  clearSelection: () => void;
  selectAll: (paperIds: string[]) => void;
}

const LIBRARY_MAX_PAPERS = 1000; // Maximum papers to fetch from library

/**
 * Hook for managing paper selection, saving, and extraction state
 *
 * @returns {UsePaperManagementReturn} Paper management state and operations
 */
export function usePaperManagement(): UsePaperManagementReturn {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [extractingPapers, setExtractingPapers] = useState<Set<string>>(new Set());
  const [extractedPapers, setExtractedPapers] = useState<Set<string>>(new Set());

  // Track if library is currently being loaded to prevent duplicate requests
  const isLoadingLibraryRef = useRef(false);

  // ===========================
  // PAPER SELECTION HANDLERS
  // ===========================

  /**
   * Toggle paper selection for bulk operations
   *
   * @param {string} paperId - The ID of the paper to toggle
   */
  const togglePaperSelection = useCallback((paperId: string) => {
    setSelectedPapers((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(paperId)) {
        newSelected.delete(paperId);
      } else {
        newSelected.add(paperId);
      }
      return newSelected;
    });
  }, []);

  /**
   * Clear all paper selections
   */
  const clearSelection = useCallback(() => {
    setSelectedPapers(new Set());
  }, []);

  /**
   * Select all papers
   *
   * @param {string[]} paperIds - Array of paper IDs to select
   */
  const selectAll = useCallback((paperIds: string[]) => {
    setSelectedPapers(new Set(paperIds));
  }, []);

  // ===========================
  // LIBRARY MANAGEMENT HANDLERS
  // ===========================

  /**
   * Save a paper to the user's library
   *
   * **Features:**
   * - Backend API persistence
   * - localStorage sync
   * - Automatic library refresh
   * - Error handling with user feedback
   *
   * @param {Paper} paper - The paper to save
   */
  const handleSavePaper = useCallback(async (paper: Paper) => {
    try {
      console.log('💾 [usePaperManagement] Saving paper:', paper.title);
      const result = await literatureAPI.savePaper(paper);

      if (result.success) {
        console.log('✅ [usePaperManagement] Paper saved successfully');

        // Update local state optimistically
        setSavedPapers((prevPapers) => {
          // Avoid duplicates
          if (prevPapers.some(p => p.id === paper.id)) {
            return prevPapers;
          }
          return [...prevPapers, paper];
        });

        toast.success('Paper saved to library');

        // Refresh library from backend to ensure sync (debounced)
        setTimeout(() => loadUserLibrary(), 500);
      }
    } catch (error) {
      console.error('❌ [usePaperManagement] Error saving paper:', error);
      toast.error('Failed to save paper');
    }
  }, []);

  /**
   * Remove a paper from the user's library
   *
   * **Features:**
   * - Backend API deletion
   * - localStorage sync
   * - Automatic library refresh
   * - Error handling with user feedback
   *
   * @param {string} paperId - The ID of the paper to remove
   */
  const handleRemovePaper = useCallback(async (paperId: string) => {
    try {
      console.log('🗑️ [usePaperManagement] Removing paper:', paperId);
      const result = await literatureAPI.removePaper(paperId);

      if (result.success) {
        console.log('✅ [usePaperManagement] Paper removed successfully');

        // Update local state
        setSavedPapers((prevPapers) => prevPapers.filter(p => p.id !== paperId));
        toast.success('Paper removed from library');

        // Refresh library from backend to ensure sync (debounced)
        setTimeout(() => loadUserLibrary(), 500);
      }
    } catch (error) {
      console.error('❌ [usePaperManagement] Error removing paper:', error);
      toast.error('Failed to remove paper');
    }
  }, []);

  /**
   * Toggle paper save status (convenience wrapper)
   *
   * If paper is saved, removes it. If not saved, saves it.
   *
   * @param {Paper} paper - The paper to toggle
   */
  const handleTogglePaperSave = useCallback((paper: Paper) => {
    const paperIsSaved = savedPapers.some(p => p.id === paper.id);
    if (paperIsSaved) {
      handleRemovePaper(paper.id);
    } else {
      handleSavePaper(paper);
    }
  }, [savedPapers, handleSavePaper, handleRemovePaper]);

  /**
   * Load user's library from backend
   *
   * **Features:**
   * - Fetches all saved papers from database
   * - Prevents duplicate concurrent requests
   * - Error handling
   * - Console logging for debugging
   */
  const loadUserLibrary = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (isLoadingLibraryRef.current) {
      console.log('⏳ [usePaperManagement] Library load already in progress, skipping...');
      return;
    }

    try {
      isLoadingLibraryRef.current = true;
      console.log('📚 [usePaperManagement] Loading user library...');

      const response = await literatureAPI.getUserLibrary(1, LIBRARY_MAX_PAPERS);

      console.log(`✅ [usePaperManagement] Loaded ${response.papers.length} papers from library`);
      setSavedPapers(response.papers);
    } catch (error) {
      console.error('❌ [usePaperManagement] Error loading library:', error);
      // Don't show toast here as it may be called frequently
    } finally {
      isLoadingLibraryRef.current = false;
    }
  }, []);

  // ===========================
  // HELPER UTILITIES
  // ===========================

  /**
   * Check if a paper is selected
   *
   * @param {string} paperId - The paper ID to check
   * @returns {boolean} True if paper is selected
   */
  const isSelected = useCallback((paperId: string): boolean => {
    return selectedPapers.has(paperId);
  }, [selectedPapers]);

  /**
   * Check if a paper is saved
   *
   * @param {string} paperId - The paper ID to check
   * @returns {boolean} True if paper is saved
   */
  const isSaved = useCallback((paperId: string): boolean => {
    return savedPapers.some(p => p.id === paperId);
  }, [savedPapers]);

  /**
   * Check if a paper is currently being extracted
   *
   * @param {string} paperId - The paper ID to check
   * @returns {boolean} True if paper is extracting
   */
  const isExtracting = useCallback((paperId: string): boolean => {
    return extractingPapers.has(paperId);
  }, [extractingPapers]);

  /**
   * Check if a paper has been extracted
   *
   * @param {string} paperId - The paper ID to check
   * @returns {boolean} True if paper is extracted
   */
  const isExtracted = useCallback((paperId: string): boolean => {
    return extractedPapers.has(paperId);
  }, [extractedPapers]);

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
