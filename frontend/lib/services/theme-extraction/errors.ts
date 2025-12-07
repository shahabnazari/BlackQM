/**
 * Custom Error Classes for Theme Extraction Workflow - STRICT AUDIT CORRECTED
 *
 * Enterprise-grade error handling with context preservation
 * Phase 10.93 Day 1
 *
 * @module theme-extraction/errors
 * @since Phase 10.93
 *
 * **TYPE-001 FIX:** Specific ErrorContext interface instead of Record<string, unknown>
 *
 * **Features:**
 * - Context preservation for debugging
 * - Proper prototype chain for instanceof checks
 * - User-friendly error messages
 * - Type-safe error context
 */

/**
 * Error context for theme extraction errors (TYPE-001 fix)
 *
 * More specific type than Record<string, unknown> for better type safety.
 * Allows common error context properties while remaining extensible.
 *
 * @example
 * ```ts
 * const context: ErrorContext = {
 *   paperId: 'abc123',
 *   paperTitle: 'Research Paper',
 *   attempt: 3,
 *   stage: 'validation',
 * };
 * ```
 */
export interface ErrorContext {
  /** Paper ID (UUID or internal ID) */
  paperId?: string;
  /** Paper title (truncated to 100 chars for safety) */
  paperTitle?: string;
  /** User ID (for auth-related errors) */
  userId?: string;
  /** Retry attempt number (1-indexed) */
  attempt?: number;
  /** Workflow stage where error occurred */
  stage?: string;
  /** Source database/service name */
  source?: string;
  /** Validation field name (for validation errors) */
  validation?: string;
  /** Number of items processed before error */
  processedCount?: number;
  /** Total count for batch operations */
  totalCount?: number;
  /** Saved count for batch operations */
  savedCount?: number;
  /** Failed count for batch operations */
  failedCount?: number;
  /** Original error type name */
  errorType?: string;
  /** Additional properties (extensible) */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Base error class for theme extraction errors
 *
 * Preserves workflow context for better debugging.
 * All theme extraction errors should extend this class.
 *
 * @example
 * ```ts
 * throw new ThemeExtractionError('Operation failed', {
 *   stage: 'metadata_refresh',
 *   paperId: 'abc123'
 * });
 * ```
 */
export class ThemeExtractionError extends Error {
  /**
   * Create a theme extraction error
   *
   * @param message - Error message
   * @param context - Error context with workflow details
   */
  constructor(
    message: string,
    public readonly context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'ThemeExtractionError';
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ThemeExtractionError.prototype);
  }
}

/**
 * Error during paper save operation
 *
 * Thrown when saving a paper to the database fails.
 * Includes paper details and retry attempt information.
 *
 * @example
 * ```ts
 * throw new PaperSaveError('Database timeout', {
 *   paperId: 'abc123',
 *   paperTitle: 'Research Paper',
 *   attempt: 3,
 *   source: 'PubMed'
 * });
 * ```
 */
export class PaperSaveError extends ThemeExtractionError {
  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, context);
    this.name = 'PaperSaveError';
    Object.setPrototypeOf(this, PaperSaveError.prototype);
  }
}

/**
 * Error during metadata refresh operation
 *
 * Thrown when refreshing paper metadata fails.
 * Typically non-critical - workflow can continue with existing metadata.
 *
 * @example
 * ```ts
 * throw new MetadataRefreshError('API timeout', {
 *   processedCount: 5,
 *   totalCount: 10,
 *   source: 'PubMed'
 * });
 * ```
 */
export class MetadataRefreshError extends ThemeExtractionError {
  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, context);
    this.name = 'MetadataRefreshError';
    Object.setPrototypeOf(this, MetadataRefreshError.prototype);
  }
}

/**
 * Error during full-text extraction
 *
 * Thrown when fetching full-text content for a paper fails.
 * May be recoverable - can fall back to abstract-only analysis.
 *
 * @example
 * ```ts
 * throw new FullTextExtractionError('Publisher paywall', {
 *   paperId: 'abc123',
 *   source: 'Nature'
 * });
 * ```
 */
export class FullTextExtractionError extends ThemeExtractionError {
  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, context);
    this.name = 'FullTextExtractionError';
    Object.setPrototypeOf(this, FullTextExtractionError.prototype);
  }
}

/**
 * Error during content analysis
 *
 * Thrown when analyzing or filtering content fails.
 * Usually indicates data quality issues or unexpected formats.
 *
 * @example
 * ```ts
 * throw new ContentAnalysisError('Malformed content', {
 *   paperId: 'abc123',
 *   stage: 'content_filtering'
 * });
 * ```
 */
export class ContentAnalysisError extends ThemeExtractionError {
  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, context);
    this.name = 'ContentAnalysisError';
    Object.setPrototypeOf(this, ContentAnalysisError.prototype);
  }
}

/**
 * Error during validation
 *
 * Thrown when input validation fails.
 * Indicates missing required fields or invalid data.
 *
 * @example
 * ```ts
 * throw new ValidationError('Missing required field: title', {
 *   validation: 'title_required',
 *   paperId: 'abc123'
 * });
 * ```
 */
export class ValidationError extends ThemeExtractionError {
  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
