/**
 * Paper Save Type Definitions
 * Phase 10.943: Enterprise-grade type safety for paper save operations
 *
 * Purpose: Eliminate all `any` types in savePaper method
 * Pattern: Zero `any`, zero `@ts-ignore`, zero unsafe `as` assertions
 *
 * Type Safety Rules (Phase 10.93 Standard):
 * 1. All Prisma JSON fields MUST use InputJsonValue
 * 2. No `as any` type assertions - use proper interfaces
 * 3. Explicit typing for all nested structures
 */

import type { Prisma } from '@prisma/client';

// ============================================================================
// JSON Field Types (For Prisma Json columns)
// ============================================================================

/**
 * Author affiliations from PubMed metadata
 * Used in Paper.authorAffiliations JSON field
 */
export interface AuthorAffiliation {
  author: string;
  affiliation: string;
}

/**
 * Grant information from funding sources
 * Used in Paper.grants JSON field
 */
export interface GrantInfo {
  grantId: string | null;
  agency: string | null;
  country: string | null;
}

/**
 * MeSH (Medical Subject Headings) terms from PubMed
 * Used in Paper.meshTerms JSON field
 */
export interface MeshTerm {
  descriptor: string;
  qualifiers: string[];
}

// ============================================================================
// Prisma Create Input Types (Type-safe paper creation)
// ============================================================================

/**
 * Type-safe paper creation data
 * Ensures all JSON fields are properly typed for Prisma
 */
export interface PaperCreateData {
  title: string;
  authors: Prisma.InputJsonValue;
  year: number;
  abstract?: string;
  doi?: string | null;
  pmid?: string | null;
  url?: string | null;
  venue?: string;
  citationCount?: number;
  userId: string;
  tags?: Prisma.InputJsonValue;
  collectionId?: string;
  source: string;
  keywords?: Prisma.InputJsonValue;
  meshTerms?: Prisma.InputJsonValue;
  publicationType?: Prisma.InputJsonValue;
  authorAffiliations?: Prisma.InputJsonValue;
  grants?: Prisma.InputJsonValue;
}

// ============================================================================
// Type Guards (Runtime validation)
// ============================================================================

/**
 * Type guard for string arrays (authors, keywords, tags, publicationType)
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Type guard for MeshTerm array
 */
export function isMeshTermArray(value: unknown): value is MeshTerm[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.descriptor === 'string' &&
      Array.isArray(item.qualifiers) &&
      item.qualifiers.every((q: unknown) => typeof q === 'string'),
  );
}

/**
 * Type guard for AuthorAffiliation array
 */
export function isAuthorAffiliationArray(value: unknown): value is AuthorAffiliation[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.author === 'string' &&
      typeof item.affiliation === 'string',
  );
}

/**
 * Type guard for GrantInfo array
 */
export function isGrantInfoArray(value: unknown): value is GrantInfo[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      (item.grantId === null || typeof item.grantId === 'string') &&
      (item.agency === null || typeof item.agency === 'string') &&
      (item.country === null || typeof item.country === 'string'),
  );
}

// ============================================================================
// Conversion Utilities (Safe JSON field conversion)
// ============================================================================

/**
 * Safely convert string array to Prisma InputJsonValue
 * Returns undefined if input is undefined/null/empty
 */
export function toJsonStringArray(
  value: string[] | undefined | null,
): Prisma.InputJsonValue | undefined {
  if (!value || value.length === 0) return undefined;
  return value as Prisma.InputJsonValue;
}

/**
 * Safely convert MeshTerm array to Prisma InputJsonValue
 * Uses JSON.parse/stringify for proper type conversion (enterprise-grade)
 */
export function toJsonMeshTerms(
  value: MeshTerm[] | undefined | null,
): Prisma.InputJsonValue | undefined {
  if (!value || value.length === 0) return undefined;
  // Deep clone through JSON to ensure Prisma-compatible plain objects
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely convert AuthorAffiliation array to Prisma InputJsonValue
 * Uses JSON.parse/stringify for proper type conversion (enterprise-grade)
 */
export function toJsonAuthorAffiliations(
  value: AuthorAffiliation[] | undefined | null,
): Prisma.InputJsonValue | undefined {
  if (!value || value.length === 0) return undefined;
  // Deep clone through JSON to ensure Prisma-compatible plain objects
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely convert GrantInfo array to Prisma InputJsonValue
 * Uses JSON.parse/stringify for proper type conversion (enterprise-grade)
 */
export function toJsonGrants(
  value: GrantInfo[] | undefined | null,
): Prisma.InputJsonValue | undefined {
  if (!value || value.length === 0) return undefined;
  // Deep clone through JSON to ensure Prisma-compatible plain objects
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

// ============================================================================
// Sanitized Input Type (Pre-processed save input)
// ============================================================================

/**
 * Sanitized (trimmed) paper input fields
 * Used to avoid redundant string operations
 */
export interface SanitizedPaperInput {
  title: string;
  doi: string | null;
  pmid: string | null;
  url: string | null;
}
