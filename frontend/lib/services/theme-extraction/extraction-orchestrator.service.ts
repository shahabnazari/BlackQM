/**
 * Extraction Orchestrator Service - Phase 10.95
 *
 * Coordinates the 4-stage theme extraction workflow:
 * 1. Save papers to database (PaperSaveService)
 * 2. Fetch full-text content (FullTextExtractionService)
 * 3. Prepare sources for extraction
 * 4. Execute theme extraction via API
 *
 * @module theme-extraction/ExtractionOrchestratorService
 * @since Phase 10.95
 *
 * **Architecture:**
 * - Service < 300 lines (enterprise limit)
 * - Single responsibility: workflow coordination
 * - Uses composition over inheritance
 * - All business logic extracted from component
 *
 * **Enterprise Standards:**
 * - TypeScript strict mode (NO 'any')
 * - Enterprise logging (no console.log)
 * - Defensive programming
 * - Proper error handling
 */

import { logger } from '@/lib/utils/logger';
import { PaperSaveService } from './paper-save.service';
import { FullTextExtractionService } from './fulltext-extraction.service';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// Constants
// ============================================================================

/** Minimum full-text length threshold (150 characters) */
const FULLTEXT_MIN_LENGTH = 150;

/**
 * Source count limits for theme extraction
 *
 * IMPORTANT: These MUST align with backend limits in:
 * backend/src/modules/literature/services/unified-theme-extraction.service.ts
 *
 * Backend constraint: MAX_SOURCES_PER_REQUEST = 500
 */
const SOURCE_COUNT_SOFT_LIMIT = 400;   // 80% of max - show warning
const SOURCE_COUNT_HARD_LIMIT = 500;   // Must match backend MAX_SOURCES_PER_REQUEST

/** Cached regex patterns for progress message parsing (performance optimization) */
const BATCH_PROGRESS_REGEX = /^Batch\s+(\d+)\/(\d+)/i;
const SAVED_PROGRESS_REGEX = /^Saved\s+(\d+)\/(\d+)/i;

/** Stage names mapping (cached at module level for performance) */
const STAGE_NAMES: Readonly<Record<number, string>> = {
  0: 'Preparing Data',
  1: 'Familiarization',
  2: 'Initial Coding',
  3: 'Theme Generation',
  4: 'Theme Review',
  5: 'Theme Definition',
  6: 'Report Production',
} as const;

// ============================================================================
// Types
// ============================================================================

/**
 * Stage of the extraction workflow
 */
export type ExtractionStage = 'idle' | 'saving' | 'fetching' | 'preparing' | 'extracting' | 'complete' | 'error';

/**
 * Progress information for the extraction workflow
 */
export interface WorkflowProgress {
  stage: ExtractionStage;
  stageNumber: number;
  totalStages: number;
  currentItem: number;
  totalItems: number;
  percentage: number;
  message: string;
}

/**
 * Callback for workflow progress updates
 */
export type WorkflowProgressCallback = (progress: WorkflowProgress) => void;

/**
 * Result of the paper preparation stage
 */
export interface PreparedSources {
  sources: SourceContent[];
  fullTextCount: number;
  abstractOnlyCount: number;
  skippedCount: number;
}

/**
 * Options for the extraction workflow
 */
export interface WorkflowOptions {
  onProgress?: WorkflowProgressCallback;
  signal?: AbortSignal;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Extraction Orchestrator Service
 *
 * Coordinates the multi-stage theme extraction workflow.
 * Each stage is delegated to specialized services.
 */
export class ExtractionOrchestratorService {
  private readonly paperSaveService = new PaperSaveService();
  private readonly fullTextService = new FullTextExtractionService();

  /**
   * Stage 1: Save papers to database
   *
   * @param papers - Papers to save
   * @param options - Workflow options
   * @returns Map of original paper ID to database paper ID
   */
  public async savePapers(
    papers: LiteraturePaper[],
    options: WorkflowOptions = {}
  ): Promise<Map<string, string>> {
    const { onProgress, signal } = options;

    logger.info('Stage 1: Starting paper save', 'ExtractionOrchestrator', {
      paperCount: papers.length,
    });

    // Filter valid papers
    const validPapers = papers.filter(p =>
      p && p.title && typeof p.title === 'string' && p.title.trim().length > 0
    );

    if (validPapers.length < papers.length) {
      logger.warn(`Skipped ${papers.length - validPapers.length} papers with invalid data`, 'ExtractionOrchestrator');
    }

    const totalPapers = validPapers.length;

    // Use PaperSaveService for batch saving
    // Build options object with only defined properties (exactOptionalPropertyTypes compliance)
    const saveOptions: Parameters<typeof this.paperSaveService.batchSave>[1] = {
      onProgress: (message: string) => {
        // Parse progress from message format: "Batch X/Y: Processing..." or "Saved X/Y papers..."
        // Stage 1 progress spans 0-15%
        let currentItem = 0;
        let percentage = 0;

        // Try to parse "Batch X/Y" format (using cached regex for performance)
        const batchMatch = message.match(BATCH_PROGRESS_REGEX);
        if (batchMatch && batchMatch[1] && batchMatch[2]) {
          const batchNum = parseInt(batchMatch[1], 10);
          const totalBatches = parseInt(batchMatch[2], 10);
          // Each batch = 1 paper (since MAX_CONCURRENT_SAVES = 1)
          currentItem = batchNum;
          // Stage 1 spans 0-15%, scale batch progress within that range
          percentage = totalBatches > 0 ? Math.round((batchNum / totalBatches) * 15) : 0;
        }

        // Try to parse "Saved X/Y papers" format (final message, using cached regex)
        const savedMatch = message.match(SAVED_PROGRESS_REGEX);
        if (savedMatch && savedMatch[1]) {
          currentItem = parseInt(savedMatch[1], 10);
          percentage = 15; // Stage 1 complete
        }

        onProgress?.({
          stage: 'saving',
          stageNumber: 1,
          totalStages: 4,
          currentItem,
          totalItems: totalPapers,
          percentage,
          message,
        });
      },
    };
    if (signal) saveOptions.signal = signal;

    const result = await this.paperSaveService.batchSave(validPapers, saveOptions);

    logger.info('Stage 1: Paper save complete', 'ExtractionOrchestrator', {
      saved: result.savedCount,
      failed: result.failedCount,
    });

    return result.savedPaperIds;
  }

  /**
   * Stage 2: Fetch full-text content
   *
   * @param paperIdMap - Map of original ID to database ID
   * @param options - Workflow options
   * @returns Map of original paper ID to full-text content
   */
  public async fetchFullText(
    paperIdMap: Map<string, string>,
    options: WorkflowOptions = {}
  ): Promise<Map<string, { fullText?: string; wordCount?: number }>> {
    const { onProgress, signal } = options;

    logger.info('Stage 2: Starting full-text fetch', 'ExtractionOrchestrator', {
      paperCount: paperIdMap.size,
    });

    const fullTextMap = new Map<string, { fullText?: string; wordCount?: number }>();

    // Build options object with only defined properties (exactOptionalPropertyTypes compliance)
    const fetchOptions: Parameters<typeof this.fullTextService.extractBatch>[1] = {
      onProgress: (progress) => {
        // Guard against division by zero
        const progressPercent = progress.total > 0
          ? Math.round((progress.completed / progress.total) * 25)
          : 0;

        onProgress?.({
          stage: 'fetching',
          stageNumber: 2,
          totalStages: 4,
          currentItem: progress.completed,
          totalItems: progress.total,
          percentage: 15 + progressPercent,
          message: `Fetching full-text... (${progress.completed}/${progress.total})`,
        });
      },
    };
    if (signal) fetchOptions.signal = signal;

    const result = await this.fullTextService.extractBatch(paperIdMap, fetchOptions);

    // Map results
    for (const paper of result.updatedPapers) {
      if (paper.hasFullText && paper.fullText) {
        fullTextMap.set(paper.id, {
          fullText: paper.fullText,
          wordCount: paper.fullTextWordCount || 0,
        });
      }
    }

    logger.info('Stage 2: Full-text fetch complete', 'ExtractionOrchestrator', {
      successCount: result.successCount,
      failedCount: result.failedCount,
      withFullText: fullTextMap.size,
    });

    return fullTextMap;
  }

  /**
   * Stage 3: Prepare sources for extraction
   *
   * Converts papers to SourceContent format, using full-text when available.
   *
   * @param papers - Original papers
   * @param fullTextMap - Map of paper ID to full-text content
   * @param options - Workflow options
   * @returns Prepared sources ready for extraction
   */
  public prepareSources(
    papers: LiteraturePaper[],
    fullTextMap: Map<string, { fullText?: string; wordCount?: number }>,
    options: WorkflowOptions = {}
  ): PreparedSources {
    const { onProgress } = options;

    logger.info('Stage 3: Preparing sources', 'ExtractionOrchestrator', {
      paperCount: papers.length,
      withFullText: fullTextMap.size,
    });

    onProgress?.({
      stage: 'preparing',
      stageNumber: 3,
      totalStages: 4,
      currentItem: 0,
      totalItems: papers.length,
      percentage: 40,
      message: 'Preparing sources for extraction...',
    });

    let fullTextCount = 0;
    let abstractOnlyCount = 0;
    let skippedCount = 0;

    const sources: SourceContent[] = [];

    for (const paper of papers) {
      if (!paper) {
        skippedCount++;
        continue;
      }

      // Get full-text if available
      const fetchedContent = fullTextMap.get(paper.id);
      const content = fetchedContent?.fullText || paper.fullText || paper.abstract || '';

      // Skip papers without content
      if (!content || content.length < FULLTEXT_MIN_LENGTH) {
        if (!paper.abstract) {
          skippedCount++;
          continue;
        }
      }

      // Classify content type
      const hasFullText = (fetchedContent?.fullText || paper.fullText || '').length > FULLTEXT_MIN_LENGTH;
      if (hasFullText) {
        fullTextCount++;
      } else {
        abstractOnlyCount++;
      }

      // Build source (type is inferred from SourceContent interface)
      const source: SourceContent = {
        id: paper.id,
        title: paper.title || 'Untitled',
        content,
        type: 'paper',
        authors: paper.authors || [],
        year: paper.year,
        keywords: paper.keywords || [],
      };

      if (paper.doi) source.doi = paper.doi;

      sources.push(source);
    }

    logger.info('Stage 3: Sources prepared', 'ExtractionOrchestrator', {
      total: sources.length,
      fullTextCount,
      abstractOnlyCount,
      skippedCount,
    });

    return {
      sources,
      fullTextCount,
      abstractOnlyCount,
      skippedCount,
    };
  }

  /**
   * Validate source count against limits
   *
   * @param sourceCount - Number of sources
   * @returns Validation result with warning/error messages
   */
  public validateSourceCount(sourceCount: number): {
    valid: boolean;
    warning?: string;
    error?: string;
  } {
    if (sourceCount > SOURCE_COUNT_HARD_LIMIT) {
      return {
        valid: false,
        error: `Too many sources (${sourceCount}). Maximum allowed is ${SOURCE_COUNT_HARD_LIMIT} papers.`,
      };
    }

    if (sourceCount > SOURCE_COUNT_SOFT_LIMIT) {
      // With MAX_SOURCES_PER_BATCH = 5, estimate ~30-60 seconds per batch
      // Plus overhead for each stage (familiarization, coding, etc.)
      const batchCount = Math.ceil(sourceCount / 5);
      const estimatedMinutes = Math.ceil(batchCount * 0.75); // ~45 sec per batch average
      const estimatedMaxMinutes = estimatedMinutes + Math.ceil(estimatedMinutes * 0.2); // +20% buffer
      return {
        valid: true,
        warning: `Processing ${sourceCount} papers (${batchCount} batches) will take approximately ${estimatedMinutes}-${estimatedMaxMinutes} minutes. Consider reducing paper count for faster results.`,
      };
    }

    return { valid: true };
  }

  /**
   * Get human-readable stage name
   *
   * @param stageNumber - Stage number (0-6)
   * @returns Human-readable stage name
   */
  public getStageName(stageNumber: number): string {
    return STAGE_NAMES[stageNumber] ?? `Stage ${stageNumber}`;
  }
}

// Export singleton instance for convenience
export const extractionOrchestrator = new ExtractionOrchestratorService();
