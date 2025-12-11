/**
 * Partial Results Types
 * Phase 10.112 Week 3: Netflix-Grade Error Handling
 *
 * Features:
 * - Wraps search results with metadata about partial failures
 * - Tracks which sources succeeded/failed/were degraded
 * - Provides client-friendly error summaries
 * - Enables graceful degradation in UI
 *
 * Netflix Pattern:
 * - Return best available data even when some sources fail
 * - Client can decide how to handle degraded results
 * - Transparent error reporting without blocking success
 */

/**
 * Status of individual source in search
 */
export type SourceStatus = 'success' | 'partial' | 'failed' | 'skipped' | 'timeout' | 'rate_limited';

/**
 * Individual source result metadata
 */
export interface SourceResultInfo {
  source: string;
  status: SourceStatus;
  paperCount: number;
  latencyMs: number;
  errorMessage?: string;
  errorCode?: string;
  retryAfterMs?: number;
  degradationReason?: string;
}

/**
 * Overall search status
 */
export type SearchStatus = 'complete' | 'partial' | 'degraded' | 'failed';

/**
 * Quality metrics for the search
 */
export interface SearchQualityMetrics {
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  sourcesSkipped: number;
  totalLatencyMs: number;
  slowestSourceMs: number;
  qualityLevel: 'full' | 'standard' | 'reduced' | 'minimal';
  neuralRerankingApplied: boolean;
  embeddingsGenerated: boolean;
  cacheHit: boolean;
}

/**
 * Error summary for client display
 */
export interface ErrorSummary {
  hasErrors: boolean;
  totalErrors: number;
  criticalErrors: number;
  warningErrors: number;
  errorsByType: Record<string, number>;
  userFriendlyMessage: string;
  technicalDetails?: string[];
}

/**
 * Degradation information
 */
export interface DegradationInfo {
  isDegraded: boolean;
  reasons: string[];
  affectedSources: string[];
  recommendedAction?: string;
  estimatedRecoveryMs?: number;
}

/**
 * Partial Results Envelope - wraps search results with metadata
 */
export interface PartialResultsEnvelope<T> {
  // Core data
  data: T;

  // Status information
  status: SearchStatus;
  timestamp: Date;
  requestId: string;

  // Source-level details
  sourceResults: SourceResultInfo[];

  // Quality metrics
  quality: SearchQualityMetrics;

  // Error handling
  errors: ErrorSummary;

  // Degradation info
  degradation: DegradationInfo;

  // Pagination info (if applicable)
  pagination?: {
    offset: number;
    limit: number;
    totalResults: number;
    hasMore: boolean;
    nextCursor?: string;
  };

  // Cache info
  cache?: {
    hit: boolean;
    key?: string;
    age?: number;
    ttl?: number;
  };
}

/**
 * Builder class for creating PartialResultsEnvelope
 */
export class PartialResultsBuilder<T> {
  private envelope: Partial<PartialResultsEnvelope<T>>;

  constructor(requestId: string) {
    this.envelope = {
      status: 'complete',
      timestamp: new Date(),
      requestId,
      sourceResults: [],
      quality: {
        sourcesAttempted: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        sourcesSkipped: 0,
        totalLatencyMs: 0,
        slowestSourceMs: 0,
        qualityLevel: 'full',
        neuralRerankingApplied: false,
        embeddingsGenerated: false,
        cacheHit: false,
      },
      errors: {
        hasErrors: false,
        totalErrors: 0,
        criticalErrors: 0,
        warningErrors: 0,
        errorsByType: {},
        userFriendlyMessage: '',
      },
      degradation: {
        isDegraded: false,
        reasons: [],
        affectedSources: [],
      },
    };
  }

  /**
   * Set the core data
   */
  setData(data: T): this {
    this.envelope.data = data;
    return this;
  }

  /**
   * Add source result information
   */
  addSourceResult(result: SourceResultInfo): this {
    this.envelope.sourceResults!.push(result);

    // Update quality metrics
    const quality = this.envelope.quality!;
    quality.sourcesAttempted++;
    quality.totalLatencyMs += result.latencyMs;

    if (result.latencyMs > quality.slowestSourceMs) {
      quality.slowestSourceMs = result.latencyMs;
    }

    switch (result.status) {
      case 'success':
        quality.sourcesSucceeded++;
        break;
      case 'partial':
        quality.sourcesSucceeded++;
        this.addDegradation(`${result.source}: partial results`, result.source);
        break;
      case 'failed':
      case 'timeout':
        quality.sourcesFailed++;
        this.addError(result.source, result.errorMessage ?? 'Unknown error', result.status === 'timeout');
        break;
      case 'rate_limited':
        quality.sourcesFailed++;
        this.addError(result.source, 'Rate limited', false, result.retryAfterMs);
        break;
      case 'skipped':
        quality.sourcesSkipped++;
        break;
    }

    return this;
  }

  /**
   * Add an error
   */
  addError(
    source: string,
    message: string,
    isCritical: boolean = false,
    retryAfterMs?: number,
  ): this {
    const errors = this.envelope.errors!;
    errors.hasErrors = true;
    errors.totalErrors++;

    if (isCritical) {
      errors.criticalErrors++;
    } else {
      errors.warningErrors++;
    }

    const errorType = isCritical ? 'critical' : 'warning';
    errors.errorsByType[errorType] = (errors.errorsByType[errorType] ?? 0) + 1;

    if (!errors.technicalDetails) {
      errors.technicalDetails = [];
    }
    errors.technicalDetails.push(`${source}: ${message}`);

    return this;
  }

  /**
   * Add degradation reason
   */
  addDegradation(reason: string, affectedSource?: string): this {
    const degradation = this.envelope.degradation!;
    degradation.isDegraded = true;
    degradation.reasons.push(reason);

    if (affectedSource && !degradation.affectedSources.includes(affectedSource)) {
      degradation.affectedSources.push(affectedSource);
    }

    return this;
  }

  /**
   * Set quality level
   */
  setQualityLevel(level: 'full' | 'standard' | 'reduced' | 'minimal'): this {
    this.envelope.quality!.qualityLevel = level;

    if (level !== 'full') {
      this.addDegradation(`Operating at ${level} quality level`);
    }

    return this;
  }

  /**
   * Set neural reranking status
   */
  setNeuralReranking(applied: boolean): this {
    this.envelope.quality!.neuralRerankingApplied = applied;
    return this;
  }

  /**
   * Set embeddings generation status
   */
  setEmbeddings(generated: boolean): this {
    this.envelope.quality!.embeddingsGenerated = generated;
    return this;
  }

  /**
   * Set cache information
   */
  setCache(hit: boolean, key?: string, age?: number, ttl?: number): this {
    this.envelope.cache = { hit, key, age, ttl };
    this.envelope.quality!.cacheHit = hit;
    return this;
  }

  /**
   * Set pagination information
   */
  setPagination(
    offset: number,
    limit: number,
    totalResults: number,
    nextCursor?: string,
  ): this {
    this.envelope.pagination = {
      offset,
      limit,
      totalResults,
      hasMore: offset + limit < totalResults,
      nextCursor,
    };
    return this;
  }

  /**
   * Build the final envelope
   */
  build(): PartialResultsEnvelope<T> {
    // Determine overall status
    const quality = this.envelope.quality!;
    const errors = this.envelope.errors!;
    const degradation = this.envelope.degradation!;

    if (quality.sourcesFailed === quality.sourcesAttempted && quality.sourcesAttempted > 0) {
      this.envelope.status = 'failed';
    } else if (quality.sourcesFailed > 0 || degradation.isDegraded) {
      this.envelope.status = errors.criticalErrors > 0 ? 'degraded' : 'partial';
    } else {
      this.envelope.status = 'complete';
    }

    // Generate user-friendly message
    errors.userFriendlyMessage = this.generateUserMessage();

    // Set recommended action for degradation
    if (degradation.isDegraded) {
      degradation.recommendedAction = this.generateRecommendedAction();
    }

    return this.envelope as PartialResultsEnvelope<T>;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(): string {
    const errors = this.envelope.errors!;
    const quality = this.envelope.quality!;

    if (!errors.hasErrors) {
      return 'Search completed successfully';
    }

    if (quality.sourcesSucceeded === 0) {
      return 'Search failed. Please try again later.';
    }

    const failedCount = quality.sourcesFailed;
    const totalCount = quality.sourcesAttempted;

    if (failedCount === 1) {
      return 'Search completed with one source unavailable. Results may be incomplete.';
    }

    return `Search completed with ${failedCount} of ${totalCount} sources unavailable. Results may be incomplete.`;
  }

  /**
   * Generate recommended action for degraded state
   */
  private generateRecommendedAction(): string {
    const errors = this.envelope.errors!;
    const degradation = this.envelope.degradation!;

    if (errors.criticalErrors > 0) {
      return 'Some critical sources failed. Consider retrying your search.';
    }

    if (degradation.affectedSources.length > 0) {
      return `Try searching with different sources, or wait and retry.`;
    }

    return 'Results are currently limited. Full results will be available shortly.';
  }
}

/**
 * Factory functions for common envelope patterns
 */
export const PartialResults = {
  /**
   * Create a successful result envelope
   */
  success<T>(data: T, requestId: string): PartialResultsEnvelope<T> {
    return new PartialResultsBuilder<T>(requestId)
      .setData(data)
      .build();
  },

  /**
   * Create a partial result envelope
   */
  partial<T>(
    data: T,
    requestId: string,
    failedSources: string[],
  ): PartialResultsEnvelope<T> {
    const builder = new PartialResultsBuilder<T>(requestId).setData(data);

    for (const source of failedSources) {
      builder.addSourceResult({
        source,
        status: 'failed',
        paperCount: 0,
        latencyMs: 0,
        errorMessage: 'Source unavailable',
      });
    }

    return builder.build();
  },

  /**
   * Create a cache hit envelope
   */
  fromCache<T>(
    data: T,
    requestId: string,
    cacheKey: string,
    age: number,
  ): PartialResultsEnvelope<T> {
    return new PartialResultsBuilder<T>(requestId)
      .setData(data)
      .setCache(true, cacheKey, age)
      .build();
  },

  /**
   * Create a failed result envelope
   */
  failed<T>(
    requestId: string,
    error: string,
    fallbackData?: T,
  ): PartialResultsEnvelope<T> {
    const builder = new PartialResultsBuilder<T>(requestId);

    if (fallbackData !== undefined) {
      builder.setData(fallbackData);
    }

    builder.addError('system', error, true);

    return builder.build();
  },
};
