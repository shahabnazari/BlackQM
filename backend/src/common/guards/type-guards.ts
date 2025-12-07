/**
 * PHASE 10.102 PHASE 2: RUNTIME TYPE GUARDS & VALIDATION
 *
 * Enterprise-grade runtime type validation to complement TypeScript compile-time checks.
 * Prevents runtime errors from invalid API inputs, database corruption, or integration issues.
 *
 * Type guards follow the TypeScript type predicate pattern:
 * - function isX(value: unknown): value is X
 * - Returns boolean, but narrows type when true
 * - Used in: API controllers, service layer, database layer
 */

import { LiteratureSource } from '../../modules/literature/dto/literature.dto';

// ============================================================================
// PRIMITIVE TYPE GUARDS
// ============================================================================

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid number (not NaN, not Infinity)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return isValidNumber(value) && value > 0 && Number.isInteger(value);
}

/**
 * Check if value is a non-negative integer (>= 0)
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return isValidNumber(value) && value >= 0 && Number.isInteger(value);
}

/**
 * Check if value is a valid array (not null, is array, not empty)
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is a valid object (not null, not array, is object)
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Check if value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return isValidDate(date);
}

// ============================================================================
// LITERATURE SEARCH TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid literature source
 */
export function isValidLiteratureSource(value: unknown): value is LiteratureSource {
  if (!isNonEmptyString(value)) return false;

  // Get all enum values from LiteratureSource
  const validSources = Object.values(LiteratureSource) as string[];

  return validSources.includes(value.toLowerCase());
}

/**
 * Validate an array of literature sources
 */
export function validateSources(sources: unknown): LiteratureSource[] {
  if (!Array.isArray(sources)) {
    throw new Error('Sources must be an array');
  }

  if (sources.length === 0) {
    throw new Error('Sources array cannot be empty');
  }

  const validatedSources: LiteratureSource[] = [];
  const invalidSources: unknown[] = [];

  for (const source of sources) {
    if (isValidLiteratureSource(source)) {
      validatedSources.push(source);
    } else {
      invalidSources.push(source);
    }
  }

  if (invalidSources.length > 0) {
    const validSourcesList = Object.values(LiteratureSource).join(', ');
    throw new Error(
      `Invalid literature sources: ${JSON.stringify(invalidSources)}. ` +
      `Valid sources: ${validSourcesList}`
    );
  }

  return validatedSources;
}

/**
 * Validate search query string
 */
export function validateQuery(query: unknown): string {
  if (!isNonEmptyString(query)) {
    throw new Error('Query must be a non-empty string');
  }

  if (query.length < 2) {
    throw new Error('Query must be at least 2 characters long');
  }

  if (query.length > 500) {
    throw new Error('Query must be less than 500 characters');
  }

  return query.trim();
}

/**
 * Validate max results parameter
 */
export function validateMaxResults(maxResults: unknown): number {
  if (maxResults === undefined || maxResults === null) {
    return 20; // Default value
  }

  if (!isPositiveInteger(maxResults)) {
    throw new Error('maxResults must be a positive integer');
  }

  if (maxResults > 1000) {
    throw new Error('maxResults cannot exceed 1000');
  }

  return maxResults;
}

/**
 * Validate pagination offset
 */
export function validateOffset(offset: unknown): number {
  if (offset === undefined || offset === null) {
    return 0; // Default value
  }

  if (!isNonNegativeInteger(offset)) {
    throw new Error('Offset must be a non-negative integer');
  }

  if (offset > 10000) {
    throw new Error('Offset cannot exceed 10000');
  }

  return offset;
}

// ============================================================================
// PAPER TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid paper ID
 */
export function isValidPaperId(value: unknown): value is number {
  return isPositiveInteger(value);
}

/**
 * Validate array of paper IDs
 */
export function validatePaperIds(paperIds: unknown): number[] {
  if (!Array.isArray(paperIds)) {
    throw new Error('Paper IDs must be an array');
  }

  if (paperIds.length === 0) {
    throw new Error('Paper IDs array cannot be empty');
  }

  const validatedIds: number[] = [];
  const invalidIds: unknown[] = [];

  for (const id of paperIds) {
    if (isValidPaperId(id)) {
      validatedIds.push(id);
    } else {
      invalidIds.push(id);
    }
  }

  if (invalidIds.length > 0) {
    throw new Error(
      `Invalid paper IDs: ${JSON.stringify(invalidIds)}. ` +
      `Paper IDs must be positive integers.`
    );
  }

  return validatedIds;
}

/**
 * Check if value has required paper fields
 */
export interface PaperLike {
  title: string;
  authors?: string[];
  abstract?: string;
  year?: number;
  source?: string;
}

export function isPaperLike(value: unknown): value is PaperLike {
  if (!isValidObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // Title is required
  if (!isNonEmptyString(obj.title)) return false;

  // Authors is optional but must be array if present
  if (obj.authors !== undefined && !Array.isArray(obj.authors)) return false;

  // Abstract is optional but must be string if present
  if (obj.abstract !== undefined && typeof obj.abstract !== 'string') return false;

  // Year is optional but must be number if present
  if (obj.year !== undefined && !isValidNumber(obj.year)) return false;

  // Source is optional but must be string if present
  if (obj.source !== undefined && typeof obj.source !== 'string') return false;

  return true;
}

// ============================================================================
// THEME EXTRACTION TYPE GUARDS
// ============================================================================

/**
 * Valid research purposes
 */
export type ResearchPurpose =
  | 'q_methodology'
  | 'survey_construction'
  | 'qualitative_analysis'
  | 'literature_synthesis'
  | 'hypothesis_generation';

/**
 * Check if value is a valid research purpose
 */
export function isValidResearchPurpose(value: unknown): value is ResearchPurpose {
  if (!isNonEmptyString(value)) return false;

  const validPurposes: ResearchPurpose[] = [
    'q_methodology',
    'survey_construction',
    'qualitative_analysis',
    'literature_synthesis',
    'hypothesis_generation',
  ];

  return validPurposes.includes(value as ResearchPurpose);
}

/**
 * Validate research purpose
 */
export function validateResearchPurpose(purpose: unknown): ResearchPurpose {
  if (!isValidResearchPurpose(purpose)) {
    throw new Error(
      `Invalid research purpose: "${purpose}". ` +
      `Valid purposes: q_methodology, survey_construction, qualitative_analysis, literature_synthesis, hypothesis_generation.`
    );
  }

  return purpose;
}

/**
 * Validate theme count
 */
export function validateThemeCount(count: unknown): number {
  if (count === undefined || count === null) {
    return 10; // Default value
  }

  if (!isPositiveInteger(count)) {
    throw new Error('Theme count must be a positive integer');
  }

  if (count < 5) {
    throw new Error('Theme count must be at least 5');
  }

  if (count > 100) {
    throw new Error('Theme count cannot exceed 100');
  }

  return count;
}

// ============================================================================
// USER INPUT VALIDATION
// ============================================================================

/**
 * Validate user ID
 */
export function validateUserId(userId: unknown): string {
  if (!isNonEmptyString(userId)) {
    throw new Error('User ID must be a non-empty string');
  }

  // Optional: Add additional validation (e.g., UUID format, length limits)
  if (userId.length > 100) {
    throw new Error('User ID cannot exceed 100 characters');
  }

  return userId.trim();
}

/**
 * Validate email address (basic validation)
 */
export function validateEmail(email: unknown): string {
  if (!isNonEmptyString(email)) {
    throw new Error('Email must be a non-empty string');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address format');
  }

  if (email.length > 255) {
    throw new Error('Email cannot exceed 255 characters');
  }

  return email.trim().toLowerCase();
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(size: unknown, maxSizeMB: number = 10): number {
  if (!isValidNumber(size)) {
    throw new Error('File size must be a valid number');
  }

  if (size < 0) {
    throw new Error('File size cannot be negative');
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (size > maxSizeBytes) {
    throw new Error(`File size cannot exceed ${maxSizeMB}MB`);
  }

  return size;
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: unknown,
  allowedTypes: string[]
): string {
  if (!isNonEmptyString(mimeType)) {
    throw new Error('File type must be a non-empty string');
  }

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(
      `Invalid file type: "${mimeType}". Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  return mimeType;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

/**
 * Assert that a condition is true, throw error otherwise
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Check if value is defined (not null, not undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Sanitize string to prevent XSS attacks
 */
export function sanitizeString(value: unknown): string {
  if (!isNonEmptyString(value)) {
    return '';
  }

  // Basic XSS prevention: remove < and > characters
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitizeInput(
  value: unknown,
  fieldName: string = 'Input'
): string {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  const sanitized = sanitizeString(value);

  if (sanitized.length === 0) {
    throw new Error(`${fieldName} cannot be empty after sanitization`);
  }

  return sanitized;
}
