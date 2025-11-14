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
const STORAGE_VERSION = '1.0.1'; // Phase 10.7.10: Bumped for lightweight storage
const TTL_HOURS = 24;
const MAX_STORAGE_MB = 2; // Phase 10.7.10: Target max 2MB (well under 5MB limit)

/**
 * Phase 10.7.10: Check if localStorage is getting full
 * Clears old state if over 80% capacity
 */
function checkLocalStorageCapacity(): void {
  try {
    // Estimate localStorage usage (rough approximation)
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    const sizeInMB = totalSize / (1024 * 1024);
    const estimatedCapacity = 5; // Most browsers: 5-10MB
    const usagePercent = (sizeInMB / estimatedCapacity) * 100;
    
    if (usagePercent > 80) {
      console.warn(`⚠️ localStorage is ${usagePercent.toFixed(1)}% full (${sizeInMB.toFixed(2)}MB). Clearing literature state...`);
      clearLiteratureState();
    }
  } catch (e) {
    // Ignore errors in capacity check
  }
}

/**
 * Phase 10.7.10: Strip paper data to only essential fields for storage
 * Reduces 500 papers from ~10MB to ~500KB by removing large fields
 */
function stripPaperForStorage(paper: any): any {
  if (!paper) return paper;
  
  return {
    // Essential identification
    id: paper.id,
    doi: paper.doi,
    
    // Display data only
    title: paper.title,
    authors: paper.authors?.slice(0, 3), // Only first 3 authors
    year: paper.year,
    source: paper.source,
    
    // Minimal metadata
    citationCount: paper.citationCount,
    qualityScore: paper.qualityScore,
    relevanceScore: paper.relevanceScore,
    
    // REMOVED: abstract, fullText, abstractText, content, references, etc.
    // These large fields are not needed for persistence - can be fetched on demand
  };
}

/**
 * Phase 10.7.10: Compress state by removing large data fields
 */
function compressStateForStorage(state: Partial<LiteratureReviewState>): Partial<LiteratureReviewState> {
  const compressed = { ...state };
  
  // Strip papers to minimal data
  if (compressed.papers && Array.isArray(compressed.papers)) {
    console.log(`📦 Compressing ${compressed.papers.length} papers for storage...`);
    compressed.papers = compressed.papers.map(stripPaperForStorage);
  }
  
  // Strip saved papers
  if (compressed.savedPapers && Array.isArray(compressed.savedPapers)) {
    compressed.savedPapers = compressed.savedPapers.map(stripPaperForStorage);
  }
  
  // Remove video data (can be large with transcripts)
  delete compressed.transcribedVideos;
  delete compressed.youtubeVideos;
  
  // Keep only IDs for selection (not full objects)
  // selectedPapers is already just IDs, so that's fine
  
  return compressed;
}

/**
 * Save literature review state to localStorage
 * Automatically called when critical state changes
 * Phase 10.7.10: Now with intelligent compression to prevent quota errors
 */
export function saveLiteratureState(
  state: Partial<LiteratureReviewState>
): void {
  try {
    // Phase 10.7.10: Check capacity first, clear if needed
    checkLocalStorageCapacity();
    
    const existingState = loadLiteratureState();

    const fullState: LiteratureReviewState = {
      ...existingState,
      ...state,
      savedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    // Phase 10.7.10: Compress before serialization
    const compressedState = compressStateForStorage(fullState);
    const serialized = JSON.stringify(compressedState);

    // Check storage size
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    
    if (sizeInMB > MAX_STORAGE_MB) {
      console.warn(
        `⚠️ Literature state is ${sizeInMB.toFixed(2)}MB (target: ${MAX_STORAGE_MB}MB). Saving minimal data only.`
      );
      
      // If still too large, save only critical data
      const minimalState = {
        query: compressedState.query,
        totalResults: compressedState.totalResults,
        currentPage: compressedState.currentPage,
        selectedPapers: compressedState.selectedPapers,
        selectedThemeIds: compressedState.selectedThemeIds,
        savedAt: compressedState.savedAt,
        version: compressedState.version,
      };
      
      const minimalSerialized = JSON.stringify(minimalState);
      const minimalSize = new Blob([minimalSerialized]).size / (1024 * 1024);
      
      localStorage.setItem(STORAGE_KEY, minimalSerialized);
      console.log(`✅ Literature state saved (minimal: ${minimalSize.toFixed(2)}MB)`);
      return;
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    console.log(`✅ Literature state saved (${sizeInMB.toFixed(2)}MB, ${compressedState.papers?.length || 0} papers)`);
  } catch (error) {
    console.error('❌ Failed to save literature state:', error);
    
    // Phase 10.7.10: Enhanced error handling
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('❌ localStorage quota exceeded even after compression.');
      console.log('🔄 Clearing old state and saving query only...');
      
      clearLiteratureState();
      
      // Save absolute minimum: just the query
      try {
        const minimalState = {
          query: state.query,
          savedAt: new Date().toISOString(),
          version: STORAGE_VERSION,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
        console.log('✅ Saved query only (minimal persistence)');
      } catch (e) {
        console.error('❌ Cannot save even minimal state. localStorage may be disabled.');
      }
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

    // Phase 10.7.10: Version migration instead of clearing
    if (state.version !== STORAGE_VERSION) {
      console.warn(
        `⚠️ State version mismatch (saved: ${state.version}, current: ${STORAGE_VERSION}).`
      );
      
      // If old version (1.0.0), it has bloated data - clear it
      if (state.version === '1.0.0') {
        console.log('🔄 Clearing old bloated state (v1.0.0 → v1.0.1)...');
        clearLiteratureState();
        return {};
      }
      
      // For future versions, could implement migration logic here
      console.log('🔄 Clearing incompatible state version...');
      clearLiteratureState();
      return {};
    }

    // Check TTL expiration
    const savedAt = new Date(state.savedAt || '');
    const now = new Date();
    const hoursSinceSave =
      (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSave > TTL_HOURS) {
      console.log(
        `ℹ️ Saved state expired (${hoursSinceSave.toFixed(1)}h old). Clearing...`
      );
      clearLiteratureState();
      return {};
    }

    console.log(
      `✅ Literature state loaded (saved ${hoursSinceSave.toFixed(1)}h ago)`
    );

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
