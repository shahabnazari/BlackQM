/**
 * Phase 10.170 Week 2: Intelligent Full-Text Discovery Types
 *
 * Enterprise-grade types for multi-source full-text detection with AI verification.
 * Implements 7-tier waterfall detection strategy with confidence scoring.
 *
 * SECURITY COMPLIANCE:
 * - Critical #3: DOI validation patterns
 * - Critical #3: URL validation for SSRF prevention
 * - Critical #4: Content type validation
 * - All types are immutable (readonly) for security
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Open Access movement: Suber (2012)
 * - Green OA repositories: Harnad et al. (2004)
 * - Unpaywall coverage: Piwowar et al. (2018)
 *
 * @module fulltext-detection.types
 * @since Phase 10.170 Week 2
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Full-text source types - where the full-text can be obtained from
 *
 * Ordered by preference for most research purposes:
 * 1. database - Already in our system (instant)
 * 2. pmc - PubMed Central (authoritative, free)
 * 3. unpaywall - OA aggregator (comprehensive)
 * 4. arxiv - Preprint server (fast, free)
 * 5. repository - Institutional repos (green OA)
 * 6. publisher_html - Direct from publisher (authoritative)
 * 7. publisher_pdf - PDF from publisher (may require parsing)
 * 8. secondary_link - Found via page scan (variable quality)
 * 9. manual - User upload (trusted)
 */
export type FullTextSource =
  | 'database'
  | 'pmc'
  | 'unpaywall'
  | 'arxiv'
  | 'biorxiv'
  | 'medrxiv'
  | 'ssrn'
  | 'repository'
  | 'publisher_html'
  | 'publisher_pdf'
  | 'secondary_link'
  | 'manual';

/**
 * Array of all valid full-text sources for runtime validation
 * SECURITY: Used for runtime type checking
 */
export const FULLTEXT_SOURCES: readonly FullTextSource[] = [
  'database',
  'pmc',
  'unpaywall',
  'arxiv',
  'biorxiv',
  'medrxiv',
  'ssrn',
  'repository',
  'publisher_html',
  'publisher_pdf',
  'secondary_link',
  'manual',
] as const;

/**
 * Detection confidence levels
 *
 * - high: Direct confirmation (URL verified, content confirmed)
 * - medium: Indirect confirmation (API response, pattern match)
 * - low: Heuristic match (link text, domain pattern)
 * - ai_verified: AI has verified content is full-text (highest confidence)
 */
export type DetectionConfidence = 'high' | 'medium' | 'low' | 'ai_verified';

/**
 * Array of all valid confidence levels for runtime validation
 */
export const DETECTION_CONFIDENCES: readonly DetectionConfidence[] = [
  'high',
  'medium',
  'low',
  'ai_verified',
] as const;

/**
 * Detection method used to find full-text
 *
 * Each method has different reliability and cost:
 * - direct_url: Most reliable, instant
 * - pmc_pattern: Very reliable for biomedical
 * - unpaywall_api: Reliable, 95%+ accuracy
 * - doi_resolution: Reliable but may lead to paywall
 * - html_scraping: Variable quality, needs sanitization
 * - pdf_link_scan: Lower reliability
 * - ai_analysis: Expensive but accurate for edge cases
 * - cross_reference: Triangulation from multiple sources
 */
export type DetectionMethod =
  | 'direct_url'
  | 'pmc_pattern'
  | 'unpaywall_api'
  | 'core_api'      // Phase 10.195: CORE API (250M+ OA papers)
  | 'doi_resolution'
  | 'html_scraping'
  | 'pdf_link_scan'
  | 'ai_analysis'
  | 'cross_reference';

/**
 * Array of all valid detection methods for runtime validation
 */
export const DETECTION_METHODS: readonly DetectionMethod[] = [
  'direct_url',
  'pmc_pattern',
  'unpaywall_api',
  'core_api',
  'doi_resolution',
  'html_scraping',
  'pdf_link_scan',
  'ai_analysis',
  'cross_reference',
] as const;

/**
 * Content type of the full-text
 */
export type FullTextContentType = 'pdf' | 'html' | 'xml' | 'unknown';

/**
 * Array of all valid content types for runtime validation
 */
export const FULLTEXT_CONTENT_TYPES: readonly FullTextContentType[] = [
  'pdf',
  'html',
  'xml',
  'unknown',
] as const;

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * AI verification result from content analysis
 *
 * Used when automated detection is uncertain and AI verification
 * is needed to confirm content is actually full-text (not just abstract).
 */
export interface AIVerificationResult {
  /** Is content actually full-text (not just abstract)? */
  readonly isFullText: boolean;
  /** Content quality score (0-100) */
  readonly qualityScore: number;
  /** Recommended action based on analysis */
  readonly recommendation: 'accept' | 'retry_html' | 'retry_pdf' | 'reject';
  /** AI reasoning for the decision */
  readonly reasoning: string;
  /** Token cost of this verification */
  readonly tokenCost: number;
  /** Model used for verification */
  readonly model: string;
  /** Timestamp of verification */
  readonly verifiedAt: number;
}

/**
 * Secondary link detection result
 *
 * When scanning a page for additional PDF/repository links,
 * this captures the details of each found link.
 */
export interface SecondaryLinkResult {
  /** URL of secondary link */
  readonly url: string;
  /** Link text/label (for debugging) */
  readonly label: string;
  /** Type of link */
  readonly type: 'pdf' | 'html' | 'repository' | 'preprint' | 'unknown';
  /** Confidence this is full-text (0.0-1.0) */
  readonly confidence: number;
  /** Domain of the link */
  readonly domain: string;
}

/**
 * Full-text detection result - the main output of detection
 *
 * Immutable result object containing all detection information.
 * SECURITY: All fields are readonly to prevent mutation.
 */
export interface FullTextDetectionResult {
  /** Whether full-text is available */
  readonly isAvailable: boolean;
  /** Confidence level of detection */
  readonly confidence: DetectionConfidence;
  /**
   * Numeric confidence score (0-1) for finer-grained decisions
   * Phase 10.195: Added to enable pipeline to accept high-score low-confidence results
   */
  readonly confidenceScore?: number;
  /** Sources where full-text was found (may be multiple) */
  readonly sources: readonly FullTextSource[];
  /** Primary URL for full-text (null if not available) */
  readonly primaryUrl: string | null;
  /** Alternative URLs (mirrors, different formats) */
  readonly alternativeUrls: readonly string[];
  /** Detection method used */
  readonly detectionMethod: DetectionMethod;
  /** Content type detected */
  readonly contentType: FullTextContentType;
  /** Estimated word count (if detectable from metadata) */
  readonly estimatedWordCount: number | null;
  /** AI verification result (if performed) */
  readonly aiVerification?: AIVerificationResult;
  /** Detection timestamp */
  readonly detectedAt: number;
  /** Error message if detection failed */
  readonly error?: string;
  /** Detection duration in milliseconds */
  readonly durationMs: number;
  /** Tiers attempted during detection */
  readonly tiersAttempted: readonly number[];
}

// ============================================================================
// PUBLISHER STRATEGY TYPES
// ============================================================================

/**
 * HTML selector configuration for a publisher
 *
 * CSS selectors for extracting content from publisher pages.
 */
export interface PublisherHtmlSelectors {
  /** CSS selector for main article content */
  readonly content: string;
  /** CSS selector for PDF download link */
  readonly pdfLink: string;
  /** CSS selector for secondary/supplementary links */
  readonly secondaryLinks: string;
  /** CSS selectors for elements to exclude */
  readonly excludeSelectors?: readonly string[];
}

/**
 * Publisher-specific extraction strategy
 *
 * Each major publisher has different HTML structures and
 * URL patterns. This captures the knowledge needed to
 * extract full-text from each publisher.
 */
export interface PublisherStrategy {
  /** Unique identifier for this publisher */
  readonly publisherId: string;
  /** Publisher display names (for matching) */
  readonly publisherNames: readonly string[];
  /** DOI prefixes this publisher uses (e.g., '10.1371' for PLOS) */
  readonly doiPrefixes: readonly string[];
  /** URL patterns for identifying this publisher */
  readonly urlPatterns: readonly RegExp[];
  /** Preferred extraction method */
  readonly preferredMethod: 'html' | 'pdf' | 'api';
  /** CSS selectors for HTML extraction */
  readonly htmlSelectors?: PublisherHtmlSelectors;
  /** Whether this publisher typically has open access */
  readonly typicallyOpenAccess: boolean;
  /** Rate limit (requests per minute) */
  readonly rateLimit?: number;
  /** Custom headers required */
  readonly customHeaders?: Readonly<Record<string, string>>;
}

// ============================================================================
// DETECTION SERVICE TYPES
// ============================================================================

/**
 * Paper input for detection service
 *
 * Minimal paper information needed for full-text detection.
 */
export interface PaperForDetection {
  /** Paper ID */
  readonly id: string;
  /** DOI (optional but highly useful) */
  readonly doi?: string;
  /** Paper title (for fallback matching) */
  readonly title?: string;
  /** Existing PDF URL (if known) */
  readonly pdfUrl?: string;
  /** Existing full-text content (if already fetched) */
  readonly fullText?: string;
  /** Full-text fetch status */
  readonly fullTextStatus?: 'available' | 'pending' | 'failed' | 'not_found';
  /** OpenAlex open access PDF info */
  readonly openAccessPdf?: {
    readonly url?: string;
    readonly version?: string;
  };
  /** External identifiers */
  readonly externalIds?: {
    readonly PubMedCentral?: string;
    readonly ArXiv?: string;
    readonly PubMed?: string;
    readonly DOI?: string;
  };
  /** Venue/journal name */
  readonly venue?: string;
  /** Publisher name */
  readonly publisher?: string;
}

/**
 * Detection options for customizing detection behavior
 */
export interface DetectionOptions {
  /** Skip database check (for re-detection) */
  readonly skipDatabaseCheck?: boolean;
  /** Skip AI verification (for cost savings) */
  readonly skipAIVerification?: boolean;
  /** Maximum tiers to attempt (1-7) */
  readonly maxTiers?: number;
  /** Timeout per tier in milliseconds */
  readonly tierTimeoutMs?: number;
  /** Enable cross-reference triangulation */
  readonly enableCrossReference?: boolean;
  /** Minimum confidence required to accept */
  readonly minConfidence?: DetectionConfidence;
}

/**
 * Detection progress event for WebSocket streaming
 */
export interface DetectionProgressEvent {
  /** Paper ID being processed */
  readonly paperId: string;
  /** Current tier being attempted (1-7) */
  readonly currentTier: number;
  /** Total tiers to attempt */
  readonly totalTiers: number;
  /** Current tier name */
  readonly tierName: string;
  /** Progress message */
  readonly message: string;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Batch detection result
 */
export interface BatchDetectionResult {
  /** Results by paper ID */
  readonly results: Readonly<Record<string, FullTextDetectionResult>>;
  /** Papers that succeeded */
  readonly successfulPapers: readonly string[];
  /** Papers that failed */
  readonly failedPapers: readonly string[];
  /** Total duration in milliseconds */
  readonly totalDurationMs: number;
  /** Average duration per paper */
  readonly avgDurationMs: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Type guard for FullTextSource
 * SECURITY (Critical #2): Runtime validation
 */
export function isValidFullTextSource(value: unknown): value is FullTextSource {
  return typeof value === 'string' && FULLTEXT_SOURCES.includes(value as FullTextSource);
}

/**
 * Type guard for DetectionConfidence
 * SECURITY (Critical #2): Runtime validation
 */
export function isValidDetectionConfidence(value: unknown): value is DetectionConfidence {
  return typeof value === 'string' && DETECTION_CONFIDENCES.includes(value as DetectionConfidence);
}

/**
 * Type guard for DetectionMethod
 * SECURITY (Critical #2): Runtime validation
 */
export function isValidDetectionMethod(value: unknown): value is DetectionMethod {
  return typeof value === 'string' && DETECTION_METHODS.includes(value as DetectionMethod);
}

/**
 * Type guard for FullTextContentType
 * SECURITY (Critical #2): Runtime validation
 */
export function isValidFullTextContentType(value: unknown): value is FullTextContentType {
  return typeof value === 'string' && FULLTEXT_CONTENT_TYPES.includes(value as FullTextContentType);
}

/**
 * Validate DOI format
 * SECURITY (Critical #3): DOI validation with regex
 *
 * Valid DOI format: 10.{registrant}/{suffix}
 * - Registrant: 4+ digits
 * - Suffix: any characters except whitespace
 *
 * @param doi DOI string to validate
 * @returns true if valid DOI format
 */
export function isValidDOI(doi: string): boolean {
  if (typeof doi !== 'string' || doi.length === 0) {
    return false;
  }
  // DOI pattern: 10.{4+ digits}/{suffix}
  const DOI_PATTERN = /^10\.\d{4,}\/.+$/;
  return DOI_PATTERN.test(doi);
}

/**
 * Validate URL for external requests
 * SECURITY (Critical #3): SSRF prevention
 *
 * Blocks:
 * - localhost/127.0.0.1
 * - Internal IP ranges (10.x, 172.16-31.x, 192.168.x)
 * - file:// protocol
 * - Path traversal attempts
 *
 * @param url URL string to validate
 * @returns true if URL is safe for external requests
 */
export function isValidExternalURL(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and internal IPs
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    // Block internal IP ranges
    // 10.x.x.x
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }
    // 172.16-31.x.x
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }
    // 192.168.x.x
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }
    // 169.254.x.x (link-local)
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }

    // Block path traversal
    if (parsed.pathname.includes('..') || parsed.pathname.includes('//')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate detection result structure
 * SECURITY: Ensure result hasn't been tampered with
 */
export function validateDetectionResult(result: unknown): result is FullTextDetectionResult {
  if (!result || typeof result !== 'object') {
    return false;
  }

  const r = result as Record<string, unknown>;

  // Required fields
  if (typeof r.isAvailable !== 'boolean') return false;
  if (!isValidDetectionConfidence(r.confidence)) return false;
  if (!Array.isArray(r.sources)) return false;
  if (r.primaryUrl !== null && typeof r.primaryUrl !== 'string') return false;
  if (!Array.isArray(r.alternativeUrls)) return false;
  if (!isValidDetectionMethod(r.detectionMethod)) return false;
  if (!isValidFullTextContentType(r.contentType)) return false;
  if (typeof r.detectedAt !== 'number') return false;
  if (typeof r.durationMs !== 'number') return false;
  if (!Array.isArray(r.tiersAttempted)) return false;

  // Validate all sources
  for (const source of r.sources as unknown[]) {
    if (!isValidFullTextSource(source)) return false;
  }

  // Validate URLs
  if (r.primaryUrl !== null && !isValidExternalURL(r.primaryUrl as string)) {
    return false;
  }
  for (const url of r.alternativeUrls as string[]) {
    if (!isValidExternalURL(url)) return false;
  }

  return true;
}

// ============================================================================
// DOMAIN WHITELIST
// ============================================================================

/**
 * Whitelisted domains for external full-text requests
 * SECURITY (Critical #3): Domain whitelist for external requests
 *
 * Only these domains are allowed for full-text fetching.
 */
export const FULLTEXT_DOMAIN_WHITELIST: readonly string[] = [
  // PubMed Central
  'ncbi.nlm.nih.gov',
  'pmc.ncbi.nlm.nih.gov',
  'europepmc.org', // Phase 10.170 Week 2 Audit: Added Europe PMC
  // Unpaywall API
  'api.unpaywall.org',
  // Preprint servers
  'arxiv.org',
  'biorxiv.org',
  'medrxiv.org',
  'ssrn.com',
  // Major publishers (Open Access)
  'journals.plos.org',
  'frontiersin.org',
  'mdpi.com',
  'biomedcentral.com',
  'springeropen.com',
  'elifesciences.org', // Phase 10.170 Week 2 Audit: Added eLife (fully OA)
  'hindawi.com', // Phase 10.170 Week 2 Audit: Added Hindawi (fully OA)
  'peerj.com', // Phase 10.170 Week 2 Audit: Added PeerJ (fully OA)
  // Major publishers (may have OA content)
  'link.springer.com',
  'nature.com',
  'sciencedirect.com',
  'onlinelibrary.wiley.com',
  'tandfonline.com',
  'journals.sagepub.com',
  'academic.oup.com',
  'jamanetwork.com',
  'nejm.org',
  'bmj.com',
  'thelancet.com',
  // DOI resolver
  'doi.org',
  // Institutional repositories (common patterns)
  'researchgate.net',
  'academia.edu',
  'zenodo.org', // Phase 10.170 Week 2 Audit: Added Zenodo (research data/code)
  // CrossRef
  'api.crossref.org',
] as const;

/**
 * Check if domain is whitelisted
 * SECURITY (Critical #3): Domain whitelist check
 */
export function isDomainWhitelisted(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return FULLTEXT_DOMAIN_WHITELIST.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

/**
 * Detection tier configuration
 *
 * 7-tier waterfall detection strategy:
 * - Tier 1: Database (instant)
 * - Tier 2: Direct URL (fast)
 * - Tier 3: PMC Pattern (fast)
 * - Tier 4: Unpaywall API (medium)
 * - Tier 5: Publisher HTML (medium)
 * - Tier 6: Secondary Links (slow)
 * - Tier 7: AI Verification (expensive)
 */
export interface DetectionTierConfig {
  readonly tier: number;
  readonly name: string;
  readonly description: string;
  readonly timeoutMs: number;
  readonly costFactor: number; // 0-1, higher = more expensive
  readonly reliabilityFactor: number; // 0-1, higher = more reliable
}

/**
 * Default tier configurations
 */
export const DETECTION_TIERS: readonly DetectionTierConfig[] = [
  {
    tier: 1,
    name: 'Database',
    description: 'Check if full-text already in database',
    timeoutMs: 100,
    costFactor: 0.0,
    reliabilityFactor: 1.0,
  },
  {
    tier: 2,
    name: 'Direct URL',
    description: 'Check openAccessPdf.url and pdfUrl fields',
    timeoutMs: 500,
    costFactor: 0.0,
    reliabilityFactor: 0.95,
  },
  {
    tier: 3,
    name: 'PMC Pattern',
    description: 'Construct URL from PMC ID',
    timeoutMs: 1000,
    costFactor: 0.1,
    reliabilityFactor: 0.98,
  },
  {
    tier: 3.5,
    name: 'CORE API',
    description: 'Query CORE API (250M+ open access papers)',
    timeoutMs: 3000,
    costFactor: 0.15,
    reliabilityFactor: 0.85,
  },
  {
    tier: 4,
    name: 'Unpaywall API',
    description: 'Query Unpaywall API with DOI',
    timeoutMs: 3000,
    costFactor: 0.2,
    reliabilityFactor: 0.90,
  },
  {
    tier: 5,
    name: 'Publisher HTML',
    description: 'Extract from publisher landing page',
    timeoutMs: 5000,
    costFactor: 0.3,
    reliabilityFactor: 0.75,
  },
  {
    tier: 6,
    name: 'Secondary Links',
    description: 'Scan page for PDF/repository links',
    timeoutMs: 8000,
    costFactor: 0.4,
    reliabilityFactor: 0.60,
  },
  {
    tier: 7,
    name: 'AI Verification',
    description: 'AI-powered content verification',
    timeoutMs: 15000,
    costFactor: 1.0,
    reliabilityFactor: 0.95,
  },
] as const;

/**
 * Get tier configuration by tier number
 */
export function getTierConfig(tier: number): DetectionTierConfig | undefined {
  return DETECTION_TIERS.find((t) => t.tier === tier);
}

/**
 * Get total timeout for all tiers
 */
export function getTotalDetectionTimeout(): number {
  return DETECTION_TIERS.reduce((total, tier) => total + tier.timeoutMs, 0);
}
