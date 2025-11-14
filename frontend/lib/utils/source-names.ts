/**
 * Phase 10.6 Day 14.5: Source Name Mapping Utilities
 * Centralized source name mapping for UI display
 * Single source of truth for consistent naming across the app
 */

/**
 * Map of source IDs to friendly display names
 * Keep in sync with backend LiteratureSource enum
 */
const SOURCE_NAMES: Record<string, string> = {
  // Free academic sources (11 sources - open access only)
  pubmed: 'PubMed',
  pmc: 'PMC',
  arxiv: 'ArXiv',
  semantic_scholar: 'Semantic Scholar',
  ssrn: 'SSRN',
  crossref: 'CrossRef',
  eric: 'ERIC',
  core: 'CORE',
  springer: 'SpringerLink Open Access',

  // Premium sources (requires API keys/institutional access)
  google_scholar: 'Google Scholar',
  web_of_science: 'Web of Science',
  scopus: 'Scopus',
  ieee_xplore: 'IEEE Xplore',
  nature: 'Nature',
  wiley: 'Wiley',
  sage: 'Sage',
  taylor_francis: 'Taylor & Francis',
};

/**
 * Get friendly display name for a source ID
 * @param sourceId - Source identifier (e.g., 'pubmed', 'semantic_scholar')
 * @returns Friendly name (e.g., 'PubMed', 'Semantic Scholar')
 */
export function getSourceFriendlyName(sourceId: string): string {
  return SOURCE_NAMES[sourceId.toLowerCase()] || sourceId;
}

/**
 * Get all source names as a map
 * @returns Record of source ID to friendly name
 */
export function getAllSourceNames(): Record<string, string> {
  return { ...SOURCE_NAMES };
}

/**
 * Check if a source ID is valid
 * @param sourceId - Source identifier to check
 * @returns True if source is recognized
 */
export function isValidSourceId(sourceId: string): boolean {
  return sourceId.toLowerCase() in SOURCE_NAMES;
}
