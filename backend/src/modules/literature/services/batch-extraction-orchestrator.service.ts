import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';

/**
 * Batch Extraction Orchestrator Service
 * Phase 10.101 Task 3 - Phase 6: Extracted from UnifiedThemeExtractionService
 *
 * @module BatchExtractionOrchestratorService
 * @since Phase 10.101
 *
 * ## Responsibilities
 *
 * This service handles batch processing orchestration for theme extraction:
 *
 * 1. **Parallel Processing**: Coordinate concurrent processing using p-limit
 * 2. **Error Handling**: Graceful error handling with Promise.allSettled
 * 3. **Progress Tracking**: Emit progress updates for batch operations
 * 4. **Statistics Collection**: Track success rates, processing times, error details
 * 5. **Concurrency Control**: Respect API rate limits with configurable concurrency
 * 6. **Batch Optimization**: Calculate optimal batch sizes based on constraints
 *
 * ## Enterprise Features
 *
 * - ✅ **Zero loose typing**: Strict TypeScript with no `any` types
 * - ✅ **Parallel processing**: p-limit library for battle-tested concurrency control
 * - ✅ **Graceful degradation**: Promise.allSettled for partial failure handling
 * - ✅ **Defensive validation**: Input validation, edge case handling
 * - ✅ **Comprehensive logging**: Detailed logging for debugging and monitoring
 * - ✅ **Separation of concerns**: Pure orchestration, delegates actual extraction
 *
 * ## Design Pattern
 *
 * **Strategy Pattern**: Accepts extraction function as parameter, allowing different
 * extraction strategies (AI-based, rule-based, hybrid) without changing orchestration logic.
 *
 * **Benefits**:
 * - Testability: Can inject mock extraction functions
 * - Flexibility: Same orchestration for different extraction methods
 * - Reusability: Generic batch processing for any async operation
 *
 * @see {@link https://github.com/sindresorhus/p-limit p-limit library}
 */

// Phase 10.101: Import type definitions from extracted types file
import type {
  DeduplicatableTheme,
  SourceContent,
} from '../types/unified-theme-extraction.types';
import type { BatchExtractionStats } from '../types/theme-extraction.types';

/**
 * Configuration for batch extraction
 * Phase 10.101: Enterprise-grade constants
 */
const BATCH_CONFIG = {
  /**
   * Maximum concurrent API calls to prevent rate limiting
   * Conservative default: 2 concurrent GPT-4 calls
   */
  DEFAULT_MAX_CONCURRENT: 2,

  /**
   * Maximum sources per batch request
   * Based on GPT-4 context window and processing time constraints
   */
  MAX_SOURCES_PER_BATCH: 500,

  /**
   * Minimum sources required for batch processing
   * Single sources should use direct extraction
   */
  MIN_SOURCES_FOR_BATCH: 1,
} as const;

/**
 * Result of processing a single source in a batch
 * Phase 10.101: Strict typing to replace `any`
 */
interface SingleSourceResult {
  /**
   * Whether the source was processed successfully
   */
  success: boolean;

  /**
   * Themes extracted from this source (empty if failed)
   */
  themes: DeduplicatableTheme[];

  /**
   * Source metadata
   */
  source: SourceContent;

  /**
   * Error message if processing failed
   */
  error?: string;
}

/**
 * Type-safe extraction function signature
 * Accepts a source and returns themes
 */
export type SingleSourceExtractor = (
  source: SourceContent,
  researchContext?: string,
  userId?: string,
) => Promise<DeduplicatableTheme[]>;

/**
 * Progress callback function signature
 */
export type BatchProgressCallback = (
  userId: string,
  stage: string,
  progress: number,
  message: string,
  details?: Record<string, unknown>,
) => void;

/**
 * Batch extraction result
 * Phase 10.101: Comprehensive result type with stats
 */
export interface BatchExtractionResult {
  /**
   * All themes extracted from successful sources (not deduplicated)
   */
  themes: DeduplicatableTheme[];

  /**
   * Sources that were successfully processed
   */
  successfulSources: SourceContent[];

  /**
   * Detailed statistics about the batch processing
   */
  stats: BatchExtractionStats & {
    /** Total processing time in milliseconds */
    totalDuration: number;
    /** Average processing time per source in milliseconds */
    avgSourceTime: number;
    /** Total number of themes extracted (before deduplication) */
    themesExtracted: number;
    /** Success rate as percentage (0-100) */
    successRate: number;
  };
}

@Injectable()
export class BatchExtractionOrchestratorService {
  private readonly logger = new Logger(BatchExtractionOrchestratorService.name);

  constructor() {
    this.logger.log('✅ BatchExtractionOrchestratorService initialized');
  }

  /**
   * Extract themes from multiple sources in parallel batches
   *
   * **Algorithm**:
   * 1. Validate input sources and configuration
   * 2. Create concurrency limiter with p-limit
   * 3. Process sources in parallel with Promise.allSettled
   * 4. Track progress and statistics
   * 5. Handle errors gracefully (partial failures allowed)
   * 6. Aggregate results and return with comprehensive stats
   *
   * **Concurrency Control**:
   * - Uses p-limit library for battle-tested concurrency control
   * - Configurable max concurrent operations (default: 2 for GPT-4)
   * - Prevents rate limit errors while maximizing throughput
   *
   * **Error Handling**:
   * - Promise.allSettled ensures all sources are attempted
   * - Partial failures don't stop the entire batch
   * - Detailed error messages tracked in stats
   * - Failed sources excluded from results
   *
   * **Progress Tracking**:
   * - Emits progress after each source completes
   * - Includes completed/total/failed counts
   * - Real-time feedback for long-running operations
   *
   * @param sources - Array of sources to process
   * @param extractorFn - Function to extract themes from single source
   * @param options - Extraction options
   * @returns Batch extraction result with themes and stats
   *
   * @example
   * const result = await batchService.extractInBatches(
   *   sources,
   *   (source) => extractThemesFromSingleSource(source),
   *   {
   *     maxConcurrent: 3,
   *     researchContext: 'Climate change research',
   *     userId: 'user123',
   *   }
   * );
   *
   * console.log(`Extracted ${result.themes.length} themes`);
   * console.log(`Success rate: ${result.stats.successRate}%`);
   */
  async extractInBatches(
    sources: SourceContent[],
    extractorFn: SingleSourceExtractor,
    options: {
      maxConcurrent?: number;
      researchContext?: string;
      userId?: string;
      progressCallback?: BatchProgressCallback;
    } = {},
  ): Promise<BatchExtractionResult> {
    const startTime = Date.now();

    // Phase 10.101 STRICT MODE: Input validation
    if (!Array.isArray(sources)) {
      const errorMsg = 'Sources must be an array';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (sources.length === 0) {
      const errorMsg = 'No sources provided for theme extraction';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (sources.length > BATCH_CONFIG.MAX_SOURCES_PER_BATCH) {
      const errorMsg = `Too many sources: ${sources.length} (max ${BATCH_CONFIG.MAX_SOURCES_PER_BATCH})`;
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (typeof extractorFn !== 'function') {
      const errorMsg = 'Extractor function must be a function';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const maxConcurrent =
      options.maxConcurrent || BATCH_CONFIG.DEFAULT_MAX_CONCURRENT;

    this.logger.log(
      `🚀 Starting batch extraction for ${sources.length} sources`,
    );
    this.logger.log(`   Max concurrent operations: ${maxConcurrent}`);
    if (options.researchContext) {
      this.logger.log(`   Research context: ${options.researchContext}`);
    }

    // Initialize statistics tracker
    const stats = this.createStatsTracker(sources.length);

    // Phase 10.101: Use p-limit library for concurrency control
    const limit = pLimit(maxConcurrent);

    // Phase 10.101: Process sources with Promise.allSettled for graceful error handling
    const results = await Promise.allSettled(
      sources.map((source, index) =>
        limit(async () => {
          return await this.processSingleSource(
            source,
            index,
            sources.length,
            extractorFn,
            options,
            stats,
          );
        }),
      ),
    );

    // Phase 10.101: Collect themes from successful results
    const allThemes = this.collectThemes(results);
    const successfulSources = this.collectSuccessfulSources(results);

    // Calculate final statistics
    const totalDuration = Date.now() - startTime;
    const finalStats = this.calculateFinalStats(
      stats,
      allThemes.length,
      totalDuration,
      sources.length,
    );

    this.logFinalSummary(finalStats, allThemes.length);

    return {
      themes: allThemes,
      successfulSources,
      stats: finalStats,
    };
  }

  /**
   * Calculate optimal batch size based on constraints
   *
   * **Algorithm**:
   * - Considers API rate limits
   * - Considers context window size
   * - Considers processing time constraints
   * - Returns recommended batch size
   *
   * **Future Enhancement**: Dynamic batch sizing based on runtime performance
   *
   * @param totalSources - Total number of sources to process
   * @param options - Batch size constraints
   * @returns Optimal batch size
   */
  calculateOptimalBatchSize(
    totalSources: number,
    options: {
      maxConcurrent?: number;
      maxContextTokens?: number;
      maxProcessingTimeMinutes?: number;
    } = {},
  ): number {
    // Phase 10.101 STRICT MODE: Input validation
    if (typeof totalSources !== 'number' || totalSources < 0) {
      const errorMsg = 'Total sources must be a non-negative number';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const maxConcurrent =
      options.maxConcurrent || BATCH_CONFIG.DEFAULT_MAX_CONCURRENT;
    const maxBatchSize = BATCH_CONFIG.MAX_SOURCES_PER_BATCH;

    // Phase 10.101: Simple heuristic - can be enhanced with ML-based optimization
    // For now, use max batch size up to the limit
    const optimalSize = Math.min(totalSources, maxBatchSize);

    this.logger.log(
      `📊 Calculated optimal batch size: ${optimalSize} (total: ${totalSources}, max concurrent: ${maxConcurrent})`,
    );

    return optimalSize;
  }

  /**
   * Process a single source within the batch
   *
   * **Responsibilities**:
   * - Call extraction function
   * - Measure processing time
   * - Handle errors gracefully
   * - Update statistics
   * - Emit progress updates
   *
   * @private
   */
  private async processSingleSource(
    source: SourceContent,
    index: number,
    totalSources: number,
    extractorFn: SingleSourceExtractor,
    options: {
      researchContext?: string;
      userId?: string;
      progressCallback?: BatchProgressCallback;
    },
    stats: ReturnType<typeof this.createStatsTracker>,
  ): Promise<SingleSourceResult> {
    const sourceStart = Date.now();

    try {
      this.logger.log(
        `📄 Processing source ${index + 1}/${totalSources}: ${source.title.substring(0, 50)}...`,
      );

      const themes = await extractorFn(
        source,
        options.researchContext,
        options.userId,
      );

      const sourceTime = Date.now() - sourceStart;
      stats.processingTimes.push(sourceTime);
      stats.successfulSources++;

      // Emit progress after source completes
      if (options.progressCallback && options.userId) {
        const progress = Math.round(
          (stats.successfulSources / totalSources) * 100,
        );
        options.progressCallback(
          options.userId,
          'batch_extraction',
          progress,
          `Completed ${stats.successfulSources} of ${totalSources} sources`,
          {
            completed: stats.successfulSources,
            total: totalSources,
            failed: stats.failedSources,
          },
        );
      }

      this.logger.log(
        `   ✅ Source ${index + 1} complete in ${sourceTime}ms (${themes.length} themes)`,
      );

      return { success: true, themes, source };
    } catch (error: unknown) {
      const sourceTime = Date.now() - sourceStart;
      stats.processingTimes.push(sourceTime);
      stats.failedSources++;

      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push({
        sourceTitle: source.title,
        error: errorMsg,
      });

      this.logger.warn(
        `   ⚠️ Source ${index + 1} failed after ${sourceTime}ms: ${errorMsg}`,
      );

      return { success: false, themes: [], source, error: errorMsg };
    }
  }

  /**
   * Create statistics tracker for batch processing
   *
   * @private
   */
  private createStatsTracker(totalSources: number) {
    return {
      totalSources,
      successfulSources: 0,
      failedSources: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingTimes: [] as number[],
      errors: [] as Array<{ sourceTitle: string; error: string }>,
    };
  }

  /**
   * Collect themes from Promise.allSettled results
   *
   * **Performance Optimization**: Uses individual push instead of spread
   * to avoid O(n²) re-allocations with large theme arrays
   *
   * @private
   */
  private collectThemes(
    results: PromiseSettledResult<SingleSourceResult>[],
  ): DeduplicatableTheme[] {
    // Phase 10.101 PERF-OPT: Use individual push instead of spread
    // With 500 papers × ~15 themes = 7,500 items, spread causes significant overhead
    const allThemes: DeduplicatableTheme[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        const themes = result.value.themes;
        for (const theme of themes) {
          allThemes.push(theme);
        }
      }
    }

    return allThemes;
  }

  /**
   * Collect successful sources from Promise.allSettled results
   *
   * @private
   */
  private collectSuccessfulSources(
    results: PromiseSettledResult<SingleSourceResult>[],
  ): SourceContent[] {
    const successfulSources: SourceContent[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        successfulSources.push(result.value.source);
      }
    }

    return successfulSources;
  }

  /**
   * Calculate final statistics
   *
   * @private
   */
  private calculateFinalStats(
    stats: ReturnType<typeof this.createStatsTracker>,
    themesExtracted: number,
    totalDuration: number,
    totalSources: number,
  ) {
    // Division-by-zero protection
    const avgSourceTime =
      stats.processingTimes.length > 0
        ? stats.processingTimes.reduce((a, b) => a + b, 0) /
          stats.processingTimes.length
        : 0;

    const successRate =
      totalSources > 0 ? (stats.successfulSources / totalSources) * 100 : 0;

    return {
      ...stats,
      totalDuration,
      avgSourceTime,
      themesExtracted,
      successRate,
    };
  }

  /**
   * Log final summary of batch processing
   *
   * @private
   */
  private logFinalSummary(
    stats: ReturnType<typeof this.calculateFinalStats>,
    themesCount: number,
  ): void {
    this.logger.log(`🎉 Batch extraction complete!`);
    this.logger.log(
      `   Total time: ${stats.totalDuration}ms (${(stats.totalDuration / 1000 / 60).toFixed(1)} minutes)`,
    );
    this.logger.log(`   Avg source time: ${stats.avgSourceTime.toFixed(0)}ms`);
    this.logger.log(`   Themes extracted: ${themesCount}`);
    this.logger.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);

    this.logger.log(
      `📊 Extraction results: ${stats.successfulSources} success, ${stats.failedSources} failed`,
    );

    if (stats.failedSources > 0) {
      this.logger.warn(
        `   Failed sources: ${stats.errors.map((e) => e.sourceTitle).join(', ')}`,
      );
    }
  }
}
