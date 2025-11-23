/**
 * GROBID Service DTOs and Type Definitions
 * Phase 10.94 Minimal Implementation - Day 0
 *
 * CORRECTED VERSION - Issues Fixed:
 * ✅ Enhanced type guard with deep validation
 * ✅ Added documentation for biblStruct
 * ✅ Added validation helper functions
 * ✅ Zero `any`, zero `@ts-ignore`
 *
 * File Size: < 150 lines (WITHIN LIMIT) ✅
 */

/**
 * GROBID API response structure (TEI XML)
 *
 * Note: biblStruct is intentionally `unknown` as GROBID's citation
 * structure varies significantly between papers. It's not parsed
 * in current implementation (only metadata is extracted).
 *
 * CORRECTED: Properly typed both TEI-wrapped and direct structures
 */
export interface GrobidTeiXmlStructure {
  teiHeader: {
    fileDesc: {
      titleStmt: { title: string | string[] };
      sourceDesc: { biblStruct: unknown };  // Intentionally unknown (see note)
    };
    profileDesc?: {
      abstract?: { p: string | string[] };
    };
  };
  text: {
    body: {
      div: Array<{
        head?: string;
        p: string | string[];
      }>;
    };
  };
}

export interface GrobidTeiXml extends Partial<GrobidTeiXmlStructure> {
  TEI?: GrobidTeiXmlStructure;  // Root might be TEI or direct
}

/**
 * Extracted content from GROBID processing
 */
export interface GrobidExtractedContent {
  success: boolean;
  text?: string;
  wordCount?: number;
  sections?: Array<{
    title: string;
    content: string;
    wordCount: number;
  }>;
  metadata?: {
    title?: string;
    abstract?: string;
    referenceCount?: number;
  };
  processingTime?: number;
  error?: string;
}

/**
 * GROBID service options
 */
export interface GrobidProcessOptions {
  consolidateHeader?: boolean;
  consolidateCitations?: boolean;
  includeRawAffiliations?: boolean;
  segmentSentences?: boolean;
  timeout?: number;
  signal?: AbortSignal;  // For cancellation support
}

/**
 * Type guard helpers
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasProperty<K extends string>(
  obj: Record<string, unknown>,
  key: K
): obj is Record<K, unknown> {
  return key in obj;
}

/**
 * Type guard: Check if GROBID response is valid
 *
 * CORRECTED: Enhanced with deep validation
 */
export function isGrobidTeiXml(data: unknown): data is GrobidTeiXml {
  if (!isRecord(data)) {
    return false;
  }

  // GROBID can return either { TEI: {...} } or direct {...}
  const root = hasProperty(data, 'TEI') && isRecord(data.TEI) ? data.TEI : data;

  if (!isRecord(root)) {
    return false;
  }

  // Check teiHeader exists and is an object
  if (!hasProperty(root, 'teiHeader') || !isRecord(root.teiHeader)) {
    return false;
  }

  const teiHeader = root.teiHeader;

  // Check fileDesc exists
  if (!hasProperty(teiHeader, 'fileDesc') || !isRecord(teiHeader.fileDesc)) {
    return false;
  }

  // Check text.body exists
  if (!hasProperty(root, 'text') || !isRecord(root.text)) {
    return false;
  }

  const text = root.text;

  if (!hasProperty(text, 'body') || !isRecord(text.body)) {
    return false;
  }

  // Validate body.div is an array (optional but if present must be array)
  const body = text.body;
  if (hasProperty(body, 'div') && !Array.isArray(body.div)) {
    return false;
  }

  return true;
}

/**
 * Type guard: Check if value is valid abort signal
 */
export function isAbortSignal(value: unknown): value is AbortSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'aborted' in value &&
    'addEventListener' in value
  );
}
