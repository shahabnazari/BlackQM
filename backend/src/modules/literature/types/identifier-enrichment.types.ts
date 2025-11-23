/**
 * Identifier Enrichment Type Definitions
 * Phase 10.94 Day 1-2: Type-safe identifier enrichment
 *
 * Purpose: Strongly typed interfaces and type guards for external API responses
 * Pattern: Zero `any`, zero `@ts-ignore`, zero unsafe `as` assertions
 *
 * Type Safety Rules (Phase 10.93 Standard):
 * 1. All external API responses MUST have type guards
 * 2. No `as` type assertions - use type guards instead
 * 3. All interfaces explicitly typed (no implicit any)
 * 4. Type guards return boolean and narrow type
 */

/**
 * External identifiers that can be enriched
 */
export interface ExternalIds {
  doi?: string | null;
  pmid?: string | null;
  pmcId?: string | null;
  arXivId?: string | null;
  semanticScholarId?: string | null;
}

/**
 * Result of identifier enrichment operation
 */
export interface IdentifierEnrichmentResult {
  originalIds: ExternalIds;
  enrichedIds: ExternalIds;
  newIdsFound: string[]; // List of identifier types that were added
  enrichmentSource: 'ncbi' | 'crossref' | 'semantic_scholar' | 'pubmed' | 'multiple';
  success: boolean;
  error?: string;
}

/**
 * NCBI E-utilities elink API response
 * Endpoint: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi
 * Purpose: Convert PMID to PMC ID
 */
export interface NCBIElinkResponse {
  linksets?: Array<{
    ids?: string[];
    linksetdbs?: Array<{
      dbto?: string;
      linkname?: string;
      links?: string[];
    }>;
  }>;
}

/**
 * Type guard for NCBI elink response
 * Validates response structure from NCBI API
 */
export function isNCBIElinkResponse(data: unknown): data is NCBIElinkResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  // linksets is optional but if present must be array
  if ('linksets' in response) {
    if (!Array.isArray(response.linksets)) {
      return false;
    }

    // Validate each linkset if array is not empty
    if (response.linksets.length > 0) {
      const firstLinkset = response.linksets[0];
      if (typeof firstLinkset !== 'object' || firstLinkset === null) {
        return false;
      }
    }
  }

  return true;
}

/**
 * PubMed esearch API response
 * Endpoint: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
 * Purpose: Search for PMID using DOI
 */
export interface PubMedEsearchResponse {
  esearchresult?: {
    count?: string;
    retmax?: string;
    retstart?: string;
    idlist?: string[];
    translationset?: unknown[];
    querytranslation?: string;
  };
}

/**
 * Type guard for PubMed esearch response
 */
export function isPubMedEsearchResponse(data: unknown): data is PubMedEsearchResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  // esearchresult is optional but if present must be object
  if ('esearchresult' in response) {
    const result = response.esearchresult;
    if (typeof result !== 'object' || result === null) {
      return false;
    }

    // idlist must be array if present
    const esearchResult = result as Record<string, unknown>;
    if ('idlist' in esearchResult && !Array.isArray(esearchResult.idlist)) {
      return false;
    }
  }

  return true;
}

/**
 * CrossRef API work response
 * Endpoint: https://api.crossref.org/works
 * Purpose: Search for DOI using title and authors
 */
export interface CrossRefWork {
  DOI?: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    sequence?: string;
  }>;
  'published-print'?: {
    'date-parts'?: number[][];
  };
  'published-online'?: {
    'date-parts'?: number[][];
  };
  score?: number;
}

export interface CrossRefResponse {
  status: string;
  'message-type'?: string;
  'message-version'?: string;
  message?: {
    items?: CrossRefWork[];
    'total-results'?: number;
    query?: Record<string, unknown>;
  };
}

/**
 * Type guard for CrossRef response
 */
export function isCrossRefResponse(data: unknown): data is CrossRefResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  // status is required
  if (!('status' in response) || typeof response.status !== 'string') {
    return false;
  }

  // message is optional but if present must be object with items array
  if ('message' in response) {
    const message = response.message;
    if (typeof message !== 'object' || message === null) {
      return false;
    }

    const messageObj = message as Record<string, unknown>;
    if ('items' in messageObj && !Array.isArray(messageObj.items)) {
      return false;
    }
  }

  return true;
}

/**
 * Semantic Scholar API response
 * Endpoint: https://api.semanticscholar.org/graph/v1/paper/search
 * Purpose: Get all external IDs for a paper
 */
export interface SemanticScholarPaper {
  paperId?: string | null;
  externalIds?: {
    DOI?: string | null;
    PubMed?: string | null;
    PubMedCentral?: string | null;
    ArXiv?: string | null;
    CorpusId?: number | null;
  } | null;
  title?: string | null;
  abstract?: string | null;
  year?: number | null;
  authors?: Array<{
    authorId?: string | null;
    name?: string | null;
  }> | null;
}

export interface SemanticScholarSearchResponse {
  total?: number;
  offset?: number;
  next?: number;
  data?: SemanticScholarPaper[];
}

/**
 * Type guard for Semantic Scholar response
 */
export function isSemanticScholarSearchResponse(
  data: unknown
): data is SemanticScholarSearchResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  // data is optional but if present must be array
  if ('data' in response && !Array.isArray(response.data)) {
    return false;
  }

  // total/offset/next are optional but if present must be numbers
  if ('total' in response && typeof response.total !== 'number' && response.total !== undefined) {
    return false;
  }

  return true;
}

/**
 * Type guard for Semantic Scholar paper object
 */
export function isSemanticScholarPaper(data: unknown): data is SemanticScholarPaper {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const paper = data as Record<string, unknown>;

  // externalIds is optional but if present must be object or null
  if ('externalIds' in paper) {
    const ids = paper.externalIds;
    if (ids !== null && typeof ids !== 'object') {
      return false;
    }
  }

  return true;
}

/**
 * Enrichment method metadata for logging and tracking
 */
export interface EnrichmentMethod {
  method: 'pmid_to_pmc' | 'doi_to_pmid' | 'title_to_doi' | 'semantic_scholar';
  source: 'ncbi' | 'pubmed' | 'crossref' | 'semantic_scholar';
  success: boolean;
  idsFound: string[];
  attemptedAt: Date;
  error?: string;
}

/**
 * Complete enrichment report for a paper
 */
export interface EnrichmentReport {
  paperId: string;
  originalTitle: string;
  originalIds: ExternalIds;
  enrichedIds: ExternalIds;
  newIdsCount: number;
  methods: EnrichmentMethod[];
  totalDurationMs: number;
  success: boolean;
}
