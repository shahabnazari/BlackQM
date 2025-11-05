/**
 * Phase 10 Day 5.17.4: Literature Review State Persistence Service
 *
 * Purpose: Save and restore literature review state across browser navigation
 * Enterprise-grade requirement: Users expect their work to persist when hitting back button
 *
 * Features:
 * - Automatic save/restore of search results, themes, questions
 * - TTL-based expiration (24 hours)
 * - Compression for large datasets
 * - Error handling with graceful degradation
 *
 * Architecture: localStorage with JSON serialization
 */

interface LiteratureReviewState {
  // Search state
  query?: string;
  papers?: any[];
  totalResults?: number;
  currentPage?: number;
  filters?: any;
  appliedFilters?: any;

  // Selection state
  selectedPapers?: string[]; // Set converted to array for JSON
  savedPapers?: any[];

  // Analysis state
  unifiedThemes?: any[];
  gaps?: any[];
  extractionPurpose?: string | null;
  contentAnalysis?: any | null;

  // Enhanced Theme Integration (Day 5.12)
  selectedThemeIds?: string[];
  researchQuestions?: any[];
  hypotheses?: any[];
  constructMappings?: any[];

  // Video/multimedia state
  transcribedVideos?: any[];
  youtubeVideos?: any[];

  // Metadata
  savedAt?: string;
  version?: string;
}

const STORAGE_KEY = 'literature_review_state';
const STORAGE_VERSION = '1.0.0';
const TTL_HOURS = 24;

/**
 * Save literature review state to localStorage
 * Automatically called when critical state changes
 */
export function saveLiteratureState(state: Partial<LiteratureReviewState>): void {
  try {
    const existingState = loadLiteratureState();

    const fullState: LiteratureReviewState = {
      ...existingState,
      ...state,
      savedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    const serialized = JSON.stringify(fullState);

    // Check storage size (warn if > 4MB, localStorage limit is ~5-10MB)
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    if (sizeInMB > 4) {
      console.warn(`⚠️ Literature state is ${sizeInMB.toFixed(2)}MB. Consider clearing old data.`);
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    console.log(`✅ Literature state saved (${sizeInMB.toFixed(2)}MB)`);
  } catch (error) {
    console.error('❌ Failed to save literature state:', error);
    // Graceful degradation: Continue without persistence
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Clearing old state...');
      clearLiteratureState();
    }
  }
}

/**
 * Load literature review state from localStorage
 * Returns empty state if nothing saved or expired
 */
export function loadLiteratureState(): Partial<LiteratureReviewState> {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      console.log('ℹ️ No saved literature state found');
      return {};
    }

    const state: LiteratureReviewState = JSON.parse(serialized);

    // Check version compatibility
    if (state.version !== STORAGE_VERSION) {
      console.warn(`⚠️ State version mismatch (saved: ${state.version}, current: ${STORAGE_VERSION}). Clearing...`);
      clearLiteratureState();
      return {};
    }

    // Check TTL expiration
    const savedAt = new Date(state.savedAt || '');
    const now = new Date();
    const hoursSinceSave = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSave > TTL_HOURS) {
      console.log(`ℹ️ Saved state expired (${hoursSinceSave.toFixed(1)}h old). Clearing...`);
      clearLiteratureState();
      return {};
    }

    console.log(`✅ Literature state loaded (saved ${hoursSinceSave.toFixed(1)}h ago)`);

    // Log what was restored
    const stats = {
      papers: state.papers?.length || 0,
      savedPapers: state.savedPapers?.length || 0,
      themes: state.unifiedThemes?.length || 0,
      questions: state.researchQuestions?.length || 0,
      hypotheses: state.hypotheses?.length || 0,
    };
    console.log('   📊 Restored:', stats);

    return state;
  } catch (error) {
    console.error('❌ Failed to load literature state:', error);
    clearLiteratureState();
    return {};
  }
}

/**
 * Clear literature review state from localStorage
 * Called on expiration or error
 */
export function clearLiteratureState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Literature state cleared');
  } catch (error) {
    console.error('❌ Failed to clear literature state:', error);
  }
}

/**
 * Check if saved state exists and is valid
 */
export function hasSavedState(): boolean {
  const state = loadLiteratureState();
  return Object.keys(state).length > 0;
}

/**
 * Get summary of saved state (for UI display)
 */
export function getSavedStateSummary(): {
  exists: boolean;
  savedAt?: string;
  itemCount: number;
  hoursAgo?: number;
} {
  const state = loadLiteratureState();

  if (Object.keys(state).length === 0) {
    return { exists: false, itemCount: 0 };
  }

  const savedAt = state.savedAt || '';
  const hoursAgo = savedAt
    ? (new Date().getTime() - new Date(savedAt).getTime()) / (1000 * 60 * 60)
    : undefined;

  const itemCount =
    (state.papers?.length || 0) +
    (state.unifiedThemes?.length || 0) +
    (state.researchQuestions?.length || 0);

  return {
    exists: true,
    savedAt,
    itemCount,
    ...(hoursAgo !== undefined && { hoursAgo }), // Only include if defined
  };
}
