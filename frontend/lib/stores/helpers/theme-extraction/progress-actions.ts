/**
 * Theme Extraction Store - Progress Tracking Actions
 * Phase 10.91 Day 8: Store Architecture Refactoring (Remediated)
 *
 * **Purpose:**
 * Extraction progress and status management
 *
 * **Responsibilities:**
 * - Track extraction progress (WebSocket updates)
 * - Manage extraction state (analyzing, complete, error)
 * - Handle saturation data
 * - Manage paper extraction tracking with bounded Sets
 *
 * **Enterprise Standards:**
 * - ✅ Logging for state transitions
 * - ✅ Defensive null checks and input validation
 * - ✅ Immutable Set operations
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Bounded data structures (MAX_TRACKED_PAPERS)
 *
 * @since Phase 10.91 Day 8
 * @remediated Phase 10.91 Day 8 (Type safety + validation + bounds)
 */

import { logger } from '@/lib/utils/logger';
import type { ExtractionProgress, SaturationData, ContentAnalysis } from './types';

/**
 * Maximum number of papers to track in Sets
 * Prevents unbounded growth and localStorage quota exhaustion
 */
const MAX_TRACKED_PAPERS = 10000;

/**
 * Creates progress tracking actions with type-safe state updates
 * @template T Store state type extending progress properties
 * @param set Zustand setState function
 * @returns Object with progress management functions
 */
export function createProgressActions<T extends {
  analyzingThemes: boolean;
  extractionProgress: ExtractionProgress | null;
  extractionError: string | null;
  v2SaturationData: SaturationData | null;
  preparingMessage: string | null;
  contentAnalysis: ContentAnalysis | null;
  extractingPapers: Set<string>;
  extractedPapers: Set<string>;
  currentRequestId: string | null;
}>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
) {
  return {
    // ===========================
    // Extraction State
    // ===========================

    setAnalyzingThemes: (analyzing: boolean): void => {
      // Input validation
      if (typeof analyzing !== 'boolean') {
        logger.warn('setAnalyzingThemes: Invalid boolean', 'ThemeStore', { analyzing });
        return;
      }
      set({ analyzingThemes: analyzing } as Partial<T>);
    },

    setExtractionProgress: (progress: ExtractionProgress | null): void => {
      // Input validation
      if (progress !== null && typeof progress !== 'object') {
        logger.warn('setExtractionProgress: Invalid progress object', 'ThemeStore', { progress });
        return;
      }
      set({ extractionProgress: progress } as Partial<T>);
    },

    setExtractionError: (error: string | null): void => {
      // Input validation
      if (error !== null && typeof error !== 'string') {
        logger.warn('setExtractionError: Invalid error type', 'ThemeStore', { error });
        return;
      }

      if (error) {
        logger.error('Theme extraction error', 'ThemeStore', { error });
      }
      set({ extractionError: error } as Partial<T>);
    },

    setV2SaturationData: (data: SaturationData | null): void => {
      // Input validation
      if (data !== null && typeof data !== 'object') {
        logger.warn('setV2SaturationData: Invalid data object', 'ThemeStore', { data });
        return;
      }
      set({ v2SaturationData: data } as Partial<T>);
    },

    setPreparingMessage: (message: string | null): void => {
      // Input validation
      if (message !== null && typeof message !== 'string') {
        logger.warn('setPreparingMessage: Invalid message type', 'ThemeStore', { message });
        return;
      }
      set({ preparingMessage: message } as Partial<T>);
    },

    setContentAnalysis: (analysis: ContentAnalysis | null): void => {
      // Input validation
      if (analysis !== null && typeof analysis !== 'object') {
        logger.warn('setContentAnalysis: Invalid analysis object', 'ThemeStore', { analysis });
        return;
      }
      set({ contentAnalysis: analysis } as Partial<T>);
    },

    setCurrentRequestId: (id: string | null): void => {
      // Input validation
      if (id !== null && typeof id !== 'string') {
        logger.warn('setCurrentRequestId: Invalid ID type', 'ThemeStore', { id });
        return;
      }
      set({ currentRequestId: id } as Partial<T>);
    },

    // ===========================
    // Progress Updates
    // ===========================

    updateExtractionProgress: (updates: Partial<ExtractionProgress>): void => {
      // Input validation
      if (!updates || typeof updates !== 'object') {
        logger.warn('updateExtractionProgress: Invalid updates object', 'ThemeStore', { updates });
        return;
      }

      set((state) => {
        if (!state.extractionProgress) {
          logger.debug('updateExtractionProgress: No existing progress to update', 'ThemeStore');
          return state as Partial<T>;
        }

        return {
          extractionProgress: { ...state.extractionProgress, ...updates },
        } as Partial<T>;
      });
    },

    completeExtraction: (themesCount: number): void => {
      // Input validation
      if (typeof themesCount !== 'number' || themesCount < 0) {
        logger.warn('completeExtraction: Invalid themesCount', 'ThemeStore', { themesCount });
        return;
      }

      logger.info('Theme extraction complete', 'ThemeStore', { themesCount });
      set({
        analyzingThemes: false,
        extractionProgress: null,
        extractionError: null,
      } as Partial<T>);
    },

    resetExtractionProgress: (): void => {
      logger.debug('Resetting extraction progress', 'ThemeStore');
      set({
        analyzingThemes: false,
        extractionProgress: null,
        extractionError: null,
        preparingMessage: null,
      } as Partial<T>);
    },

    // ===========================
    // Paper Tracking (Bounded Sets)
    // ===========================

    setExtractingPapers: (paperIds: Set<string>): void => {
      // Input validation
      if (!(paperIds instanceof Set)) {
        logger.warn('setExtractingPapers: Invalid Set', 'ThemeStore', { paperIds });
        return;
      }

      // Enforce size limit
      const boundedSet = new Set(paperIds);
      if (boundedSet.size > MAX_TRACKED_PAPERS) {
        logger.warn('setExtractingPapers: Set exceeds MAX_TRACKED_PAPERS, truncating', 'ThemeStore', {
          size: boundedSet.size,
          limit: MAX_TRACKED_PAPERS,
        });
        // Keep most recent entries (convert to array, slice, convert back)
        const recentIds = Array.from(boundedSet).slice(-MAX_TRACKED_PAPERS);
        set({ extractingPapers: new Set(recentIds) } as Partial<T>);
        return;
      }

      set({ extractingPapers: boundedSet } as Partial<T>);
    },

    addExtractingPaper: (paperId: string): void => {
      // Input validation
      if (!paperId || typeof paperId !== 'string') {
        logger.warn('addExtractingPaper: Invalid paperId', 'ThemeStore', { paperId });
        return;
      }

      set((state) => {
        const newSet = new Set(state.extractingPapers);
        newSet.add(paperId);

        // Enforce size limit with FIFO eviction
        if (newSet.size > MAX_TRACKED_PAPERS) {
          const oldest = Array.from(newSet)[0];
          if (oldest) {
            newSet.delete(oldest);
            logger.debug('addExtractingPaper: Evicted oldest paper (FIFO)', 'ThemeStore', {
              evicted: oldest,
              currentSize: newSet.size,
            });
          }
        }

        return { extractingPapers: newSet } as Partial<T>;
      });
    },

    removeExtractingPaper: (paperId: string): void => {
      // Input validation
      if (!paperId || typeof paperId !== 'string') {
        logger.warn('removeExtractingPaper: Invalid paperId', 'ThemeStore', { paperId });
        return;
      }

      set((state) => {
        const newSet = new Set(state.extractingPapers);
        newSet.delete(paperId);
        return { extractingPapers: newSet } as Partial<T>;
      });
    },

    setExtractedPapers: (paperIds: Set<string>): void => {
      // Input validation
      if (!(paperIds instanceof Set)) {
        logger.warn('setExtractedPapers: Invalid Set', 'ThemeStore', { paperIds });
        return;
      }

      // Enforce size limit
      const boundedSet = new Set(paperIds);
      if (boundedSet.size > MAX_TRACKED_PAPERS) {
        logger.warn('setExtractedPapers: Set exceeds MAX_TRACKED_PAPERS, truncating', 'ThemeStore', {
          size: boundedSet.size,
          limit: MAX_TRACKED_PAPERS,
        });
        const recentIds = Array.from(boundedSet).slice(-MAX_TRACKED_PAPERS);
        set({ extractedPapers: new Set(recentIds) } as Partial<T>);
        return;
      }

      set({ extractedPapers: boundedSet } as Partial<T>);
    },

    addExtractedPaper: (paperId: string): void => {
      // Input validation
      if (!paperId || typeof paperId !== 'string') {
        logger.warn('addExtractedPaper: Invalid paperId', 'ThemeStore', { paperId });
        return;
      }

      set((state) => {
        const newSet = new Set(state.extractedPapers);
        newSet.add(paperId);

        // Enforce size limit with FIFO eviction
        if (newSet.size > MAX_TRACKED_PAPERS) {
          const oldest = Array.from(newSet)[0];
          if (oldest) {
            newSet.delete(oldest);
            logger.debug('addExtractedPaper: Evicted oldest paper (FIFO)', 'ThemeStore', {
              evicted: oldest,
              currentSize: newSet.size,
            });
          }
        }

        return { extractedPapers: newSet } as Partial<T>;
      });
    },

    markPapersAsExtracted: (paperIds: string[]): void => {
      // Input validation
      if (!Array.isArray(paperIds)) {
        logger.warn('markPapersAsExtracted: Invalid paperIds array', 'ThemeStore', { paperIds });
        return;
      }

      if (paperIds.length === 0) {
        logger.debug('markPapersAsExtracted: Empty array, nothing to mark', 'ThemeStore');
        return;
      }

      // Defensive: Filter out invalid IDs
      const validIds = paperIds.filter((id) => id && typeof id === 'string');
      if (validIds.length === 0) {
        logger.warn('markPapersAsExtracted: All paper IDs invalid', 'ThemeStore', { paperIds });
        return;
      }

      if (validIds.length !== paperIds.length) {
        logger.debug('markPapersAsExtracted: Filtered out invalid IDs', 'ThemeStore', {
          provided: paperIds.length,
          valid: validIds.length,
        });
      }

      set((state) => {
        const newExtracted = new Set(state.extractedPapers);
        validIds.forEach((id) => newExtracted.add(id));

        // Enforce size limit
        if (newExtracted.size > MAX_TRACKED_PAPERS) {
          logger.warn('markPapersAsExtracted: Set exceeds limit, truncating', 'ThemeStore', {
            size: newExtracted.size,
            limit: MAX_TRACKED_PAPERS,
          });
          // Keep most recent entries
          const recentIds = Array.from(newExtracted).slice(-MAX_TRACKED_PAPERS);
          logger.info(
            `Marked ${validIds.length} papers as extracted`,
            'ThemeStore',
            { total: recentIds.length }
          );
          return { extractedPapers: new Set(recentIds) } as Partial<T>;
        }

        logger.info(
          `Marked ${validIds.length} papers as extracted`,
          'ThemeStore',
          { total: newExtracted.size }
        );
        return { extractedPapers: newExtracted } as Partial<T>;
      });
    },
  };
}
