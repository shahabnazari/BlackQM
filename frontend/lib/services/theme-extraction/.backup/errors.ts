/**
 * Custom Error Classes for Theme Extraction Workflow
 *
 * Enterprise-grade error handling with context preservation
 * Phase 10.93 Day 1 - Service Layer Extraction
 *
 * @module theme-extraction/errors
 */

/**
 * Base error class for theme extraction errors
 * Preserves workflow context for better debugging
 */
export class ThemeExtractionError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'ThemeExtractionError';
    Object.setPrototypeOf(this, ThemeExtractionError.prototype);
  }
}

/**
 * Error during paper save operation
 */
export class PaperSaveError extends ThemeExtractionError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, context);
    this.name = 'PaperSaveError';
    Object.setPrototypeOf(this, PaperSaveError.prototype);
  }
}

/**
 * Error during metadata refresh operation
 */
export class MetadataRefreshError extends ThemeExtractionError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, context);
    this.name = 'MetadataRefreshError';
    Object.setPrototypeOf(this, MetadataRefreshError.prototype);
  }
}

/**
 * Error during full-text extraction
 */
export class FullTextExtractionError extends ThemeExtractionError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, context);
    this.name = 'FullTextExtractionError';
    Object.setPrototypeOf(this, FullTextExtractionError.prototype);
  }
}

/**
 * Error during content analysis
 */
export class ContentAnalysisError extends ThemeExtractionError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, context);
    this.name = 'ContentAnalysisError';
    Object.setPrototypeOf(this, ContentAnalysisError.prototype);
  }
}

/**
 * Error during validation
 */
export class ValidationError extends ThemeExtractionError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
