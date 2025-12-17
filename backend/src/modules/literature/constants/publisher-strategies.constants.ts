/**
 * Phase 10.170 Week 2: Publisher-Specific Extraction Strategies
 *
 * Comprehensive database of 30+ academic publisher extraction patterns.
 * Each strategy contains DOI prefixes, URL patterns, and CSS selectors
 * for reliable full-text extraction.
 *
 * SECURITY COMPLIANCE:
 * - All RegExp patterns are pre-compiled and frozen
 * - No dynamic pattern construction from user input
 * - URL patterns use case-insensitive matching for robustness
 *
 * COVERAGE:
 * - Tier 1: Major Open Access (PLOS, Frontiers, MDPI, BMC)
 * - Tier 2: Major Commercial (Springer, Elsevier, Wiley, T&F, SAGE)
 * - Tier 3: Preprint Servers (arXiv, bioRxiv, medRxiv, SSRN)
 * - Tier 4: Aggregators (PMC, CrossRef)
 * - Tier 5: Specialty Publishers (APA, IEEE, ACM, ACS)
 *
 * @module publisher-strategies.constants
 * @since Phase 10.170 Week 2
 */

import { PublisherStrategy, PublisherHtmlSelectors } from '../types/fulltext-detection.types';

// ============================================================================
// TIER 1: MAJOR OPEN ACCESS PUBLISHERS
// ============================================================================

const PLOS_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'plos',
  publisherNames: ['PLOS', 'Public Library of Science', 'PLoS'],
  doiPrefixes: ['10.1371'],
  urlPatterns: [/journals\.plos\.org/i, /plos\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: 'article.article-content, .article-text, #artText',
    pdfLink: 'a[data-doi][href*=".pdf"], a.download-pdf',
    secondaryLinks: '.supplementary-material a, .supporting-info a',
    excludeSelectors: ['nav', 'header', 'footer', '.references', '.citation-list'],
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 30,
});

const FRONTIERS_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'frontiers',
  publisherNames: ['Frontiers', 'Frontiers Media'],
  doiPrefixes: ['10.3389'],
  urlPatterns: [/frontiersin\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.JournalFullText, .article__body, .AbstractSummary + div',
    pdfLink: '.article-header__button--pdf, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-data a, .DataAvailability a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 30,
});

const MDPI_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'mdpi',
  publisherNames: ['MDPI', 'Multidisciplinary Digital Publishing Institute'],
  doiPrefixes: ['10.3390'],
  urlPatterns: [/mdpi\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: 'section.html-body, .html-body, #main-content, article',
    pdfLink: 'a.button--pdf, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-file a, .data-availability a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 30,
});

const BMC_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'bmc',
  publisherNames: ['BMC', 'BioMed Central', 'Springer BMC'],
  doiPrefixes: ['10.1186'],
  urlPatterns: [/biomedcentral\.com/i, /bmc[a-z]*\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: 'article .c-article-body, .ArticleBody, main article',
    pdfLink: 'a[data-track-action="download pdf"], a.c-pdf-download',
    secondaryLinks: '.c-article-supplementary a, .AdditionalFiles a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 30,
});

const HINDAWI_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'hindawi',
  publisherNames: ['Hindawi', 'Hindawi Publishing'],
  doiPrefixes: ['10.1155'],
  urlPatterns: [/hindawi\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-content, article .xml-content',
    pdfLink: 'a.pdf-download, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 30,
});

// ============================================================================
// TIER 2: MAJOR COMMERCIAL PUBLISHERS (with OA options)
// ============================================================================

const SPRINGER_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'springer',
  publisherNames: ['Springer', 'Springer Nature', 'SpringerOpen'],
  doiPrefixes: ['10.1007', '10.1038', '10.1057'],
  urlPatterns: [/link\.springer\.com/i, /nature\.com/i, /springeropen\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: 'article .c-article-body, .article__body, #body, .main-content article',
    pdfLink: 'a[data-track-action="download pdf"], a.c-pdf-download, a[href*="/content/pdf/"]',
    secondaryLinks: '.supplementary-information a, .c-article-supplementary a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const NATURE_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'nature',
  publisherNames: ['Nature', 'Nature Publishing Group', 'NPG'],
  doiPrefixes: ['10.1038'],
  urlPatterns: [/nature\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: 'article .c-article-body, .article__body, .article-item__body',
    pdfLink: 'a[data-track-action="download pdf"], a[href*="/articles/"][href*=".pdf"]',
    secondaryLinks: '.supplementary-information a, .extended-data a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

const ELSEVIER_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'elsevier',
  publisherNames: ['Elsevier', 'ScienceDirect', 'The Lancet', 'Cell Press'],
  doiPrefixes: ['10.1016'],
  urlPatterns: [/sciencedirect\.com/i, /elsevier\.com/i, /thelancet\.com/i, /cell\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '#body, .Body, .article-body, .section-paragraph',
    pdfLink: 'a.pdf-download-btn-link, a[href*="pii"][href*=".pdf"]',
    secondaryLinks: '.supplementary-content a, .mmc a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
  customHeaders: Object.freeze({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }),
});

const WILEY_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'wiley',
  publisherNames: ['Wiley', 'John Wiley & Sons', 'Wiley-Blackwell'],
  doiPrefixes: ['10.1002', '10.1111', '10.1113'],
  urlPatterns: [/onlinelibrary\.wiley\.com/i, /wiley\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-section__content, .article__body, .full-text',
    pdfLink: 'a.pdf-download, a[href*="/pdfdirect/"]',
    secondaryLinks: '.article-section--supporting-information a, .supporting-info a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const TAYLOR_FRANCIS_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'taylor_francis',
  publisherNames: ['Taylor & Francis', 'Routledge', 'T&F', 'Informa'],
  doiPrefixes: ['10.1080', '10.4324', '10.1081'],
  urlPatterns: [/tandfonline\.com/i, /taylorfrancis\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article__body, .hlFld-Fulltext, .NLM_sec_level_1',
    pdfLink: 'a[href*="/pdf/"], a.show-pdf',
    secondaryLinks: '.supplemental-material a, .NLM_supplementary-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const SAGE_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'sage',
  publisherNames: ['SAGE', 'SAGE Publications', 'SAGE Journals'],
  doiPrefixes: ['10.1177', '10.3102'],
  urlPatterns: [/journals\.sagepub\.com/i, /sagepub\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article__body, .hlFld-Fulltext, .bodySection',
    pdfLink: 'a.pdf-download, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const OXFORD_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'oxford',
  publisherNames: ['Oxford University Press', 'OUP', 'Oxford Academic'],
  doiPrefixes: ['10.1093', '10.1162'],
  urlPatterns: [/academic\.oup\.com/i, /oup\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-body, .widget-ArticleFulltext, .sec',
    pdfLink: 'a.article-pdfLink, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-data a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const CAMBRIDGE_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'cambridge',
  publisherNames: ['Cambridge University Press', 'CUP', 'Cambridge Core'],
  doiPrefixes: ['10.1017', '10.1557'],
  urlPatterns: [/cambridge\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-body, .content-box, .abstract + div',
    pdfLink: 'a.pdf-link, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-materials a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

// ============================================================================
// TIER 3: PREPRINT SERVERS
// ============================================================================

const ARXIV_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'arxiv',
  publisherNames: ['arXiv', 'arXiv.org', 'Cornell arXiv'],
  doiPrefixes: ['10.48550'],
  urlPatterns: [/arxiv\.org/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.abstract, .ltx_document',
    pdfLink: 'a[href*="/pdf/"], a.download-pdf',
    secondaryLinks: '.ancillary-links a, .extra-services a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 20,
});

const BIORXIV_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'biorxiv',
  publisherNames: ['bioRxiv', 'bioRxiv.org'],
  doiPrefixes: ['10.1101'],
  urlPatterns: [/biorxiv\.org/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.article__body, .section, .jnl-article-content',
    pdfLink: 'a.article-dl-pdf-link, a[href*=".full.pdf"]',
    secondaryLinks: '.supplementary-data a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 20,
});

const MEDRXIV_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'medrxiv',
  publisherNames: ['medRxiv', 'medRxiv.org'],
  doiPrefixes: ['10.1101'],
  urlPatterns: [/medrxiv\.org/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.article__body, .section, .jnl-article-content',
    pdfLink: 'a.article-dl-pdf-link, a[href*=".full.pdf"]',
    secondaryLinks: '.supplementary-data a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 20,
});

const SSRN_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'ssrn',
  publisherNames: ['SSRN', 'Social Science Research Network'],
  doiPrefixes: ['10.2139'],
  urlPatterns: [/ssrn\.com/i, /papers\.ssrn\.com/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.abstract-text, #abstract',
    pdfLink: 'a.pdf-download, button[data-abstract-id]',
    secondaryLinks: '.reference-link',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 15,
});

const OSFI_PREPRINTS_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'osf_preprints',
  publisherNames: ['OSF Preprints', 'PsyArXiv', 'SocArXiv', 'EarthArXiv'],
  doiPrefixes: ['10.31234', '10.31235', '10.31223'],
  urlPatterns: [/osf\.io/i, /psyarxiv\.com/i, /socarxiv\.org/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.article-body, .preprint-content',
    pdfLink: 'a[href*="/download/"], a.download-link',
    secondaryLinks: '.supplemental-materials a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 20,
});

// ============================================================================
// TIER 4: AGGREGATORS AND DATABASES
// ============================================================================

const PMC_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'pmc',
  publisherNames: ['PubMed Central', 'PMC', 'NCBI PMC', 'NIH PMC'],
  doiPrefixes: [], // PMC uses PMC IDs, not DOI prefixes
  urlPatterns: [/ncbi\.nlm\.nih\.gov\/pmc/i, /europepmc\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.jig-ncbiinpagenav, .article-details, .pmc-wm',
    pdfLink: '.pmc-sidebar__formats a[href*=".pdf"], a.int-view',
    secondaryLinks: '.supplementary-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 10, // NCBI has stricter limits
});

const EUROPE_PMC_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'europe_pmc',
  publisherNames: ['Europe PMC', 'EuropePMC'],
  doiPrefixes: [],
  urlPatterns: [/europepmc\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-body, .full-text-article',
    pdfLink: 'a[href*="/pdf/"], .article-actions a[href*=".pdf"]',
    secondaryLinks: '.supplementary-files a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: true,
  rateLimit: 20,
});

// ============================================================================
// TIER 5: SPECIALTY PUBLISHERS
// ============================================================================

const APA_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'apa',
  publisherNames: ['APA', 'American Psychological Association', 'APA PsycNet'],
  doiPrefixes: ['10.1037', '10.1027'],
  urlPatterns: [/psycnet\.apa\.org/i, /apa\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-content, .fulltext-view',
    pdfLink: 'a.pdf-link, a[href*="/pdf/"]',
    secondaryLinks: '.supplemental-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

const IEEE_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'ieee',
  publisherNames: ['IEEE', 'Institute of Electrical and Electronics Engineers', 'IEEE Xplore'],
  doiPrefixes: ['10.1109'],
  urlPatterns: [/ieeexplore\.ieee\.org/i, /ieee\.org/i],
  preferredMethod: 'pdf',
  htmlSelectors: Object.freeze({
    content: '.document-main-content, .article-text',
    pdfLink: 'a.pdf-btn, a[href*="/stamp/stamp.jsp"]',
    secondaryLinks: '.supplemental-info a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

const ACM_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'acm',
  publisherNames: ['ACM', 'Association for Computing Machinery', 'ACM Digital Library'],
  doiPrefixes: ['10.1145'],
  urlPatterns: [/dl\.acm\.org/i, /acm\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article__body, .article__section',
    pdfLink: 'a.pdf-file, a[href*="/pdf/"]',
    secondaryLinks: '.supplementary-material a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const ACS_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'acs',
  publisherNames: ['ACS', 'American Chemical Society', 'ACS Publications'],
  doiPrefixes: ['10.1021'],
  urlPatterns: [/pubs\.acs\.org/i, /acs\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article_content, .NLM_p',
    pdfLink: 'a.article_pdf_link, a[href*="/pdf/"]',
    secondaryLinks: '.article_supporting-info a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

const RSC_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'rsc',
  publisherNames: ['RSC', 'Royal Society of Chemistry'],
  doiPrefixes: ['10.1039'],
  urlPatterns: [/pubs\.rsc\.org/i, /rsc\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article__body, #pnlArticleContent',
    pdfLink: 'a.btn--download, a[href*="/pdf"]',
    secondaryLinks: '.article__supp-info a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

// ============================================================================
// TIER 6: MEDICAL PUBLISHERS
// ============================================================================

const JAMA_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'jama',
  publisherNames: ['JAMA', 'JAMA Network', 'American Medical Association'],
  doiPrefixes: ['10.1001'],
  urlPatterns: [/jamanetwork\.com/i, /jamanetwork\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-full-text, .article-body-section, #Article',
    pdfLink: 'a.al-link[href*=".pdf"], a.download-pdf',
    secondaryLinks: '.article-supplements a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

const NEJM_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'nejm',
  publisherNames: ['NEJM', 'New England Journal of Medicine'],
  doiPrefixes: ['10.1056'],
  urlPatterns: [/nejm\.org/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.o-article-body, .article-body',
    pdfLink: 'a.pdf-link, a[href*="/pdf/"]',
    secondaryLinks: '.article-supplementary a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 10,
});

const BMJ_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'bmj',
  publisherNames: ['BMJ', 'British Medical Journal', 'BMJ Publishing'],
  doiPrefixes: ['10.1136'],
  urlPatterns: [/bmj\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-body, .article-fulltext',
    pdfLink: 'a.article-pdf-download, a[href*="/content/"][href*=".pdf"]',
    secondaryLinks: '.supplementary-data a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 20,
});

const LANCET_STRATEGY: PublisherStrategy = Object.freeze({
  publisherId: 'lancet',
  publisherNames: ['The Lancet', 'Lancet'],
  doiPrefixes: ['10.1016'], // Shares with Elsevier
  urlPatterns: [/thelancet\.com/i],
  preferredMethod: 'html',
  htmlSelectors: Object.freeze({
    content: '.article-body, .section-paragraph',
    pdfLink: 'a.article-tools__pdf, a[href*="/pii/"][href*=".pdf"]',
    secondaryLinks: '.article-supplementary a',
  }) as PublisherHtmlSelectors,
  typicallyOpenAccess: false,
  rateLimit: 15,
});

// ============================================================================
// CONSOLIDATED EXPORT
// ============================================================================

/**
 * All publisher strategies in priority order
 *
 * Order matters for DOI prefix matching when multiple publishers
 * share the same prefix (e.g., 10.1101 for bioRxiv and medRxiv).
 */
export const PUBLISHER_STRATEGIES: readonly PublisherStrategy[] = Object.freeze([
  // Tier 1: Open Access (highest priority for OA papers)
  PLOS_STRATEGY,
  FRONTIERS_STRATEGY,
  MDPI_STRATEGY,
  BMC_STRATEGY,
  HINDAWI_STRATEGY,
  // Tier 2: Major Commercial
  SPRINGER_STRATEGY,
  NATURE_STRATEGY,
  ELSEVIER_STRATEGY,
  WILEY_STRATEGY,
  TAYLOR_FRANCIS_STRATEGY,
  SAGE_STRATEGY,
  OXFORD_STRATEGY,
  CAMBRIDGE_STRATEGY,
  // Tier 3: Preprint Servers
  ARXIV_STRATEGY,
  BIORXIV_STRATEGY,
  MEDRXIV_STRATEGY,
  SSRN_STRATEGY,
  OSFI_PREPRINTS_STRATEGY,
  // Tier 4: Aggregators
  PMC_STRATEGY,
  EUROPE_PMC_STRATEGY,
  // Tier 5: Specialty
  APA_STRATEGY,
  IEEE_STRATEGY,
  ACM_STRATEGY,
  ACS_STRATEGY,
  RSC_STRATEGY,
  // Tier 6: Medical
  JAMA_STRATEGY,
  NEJM_STRATEGY,
  BMJ_STRATEGY,
  LANCET_STRATEGY,
]);

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get publisher strategy by DOI prefix
 *
 * @param doi Full DOI string (e.g., "10.1371/journal.pone.0123456")
 * @returns Publisher strategy or null if not found
 */
export function getPublisherStrategyByDOI(doi: string): PublisherStrategy | null {
  if (!doi || typeof doi !== 'string') {
    return null;
  }

  // Extract prefix (e.g., "10.1371" from "10.1371/journal.pone.0123456")
  const prefixMatch = doi.match(/^(10\.\d{4,})/);
  if (!prefixMatch) {
    return null;
  }

  const prefix = prefixMatch[1];

  return (
    PUBLISHER_STRATEGIES.find((strategy) =>
      strategy.doiPrefixes.some((p) => prefix.startsWith(p)),
    ) ?? null
  );
}

/**
 * Get publisher strategy by URL
 *
 * @param url URL string to match
 * @returns Publisher strategy or null if not found
 */
export function getPublisherStrategyByURL(url: string): PublisherStrategy | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  return (
    PUBLISHER_STRATEGIES.find((strategy) =>
      strategy.urlPatterns.some((pattern) => pattern.test(url)),
    ) ?? null
  );
}

/**
 * Get publisher strategy by name
 *
 * @param name Publisher name to match (case-insensitive)
 * @returns Publisher strategy or null if not found
 */
export function getPublisherStrategyByName(name: string): PublisherStrategy | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  const normalizedName = name.toLowerCase().trim();

  return (
    PUBLISHER_STRATEGIES.find((strategy) =>
      strategy.publisherNames.some((n) => n.toLowerCase().includes(normalizedName)),
    ) ?? null
  );
}

/**
 * Get publisher strategy by ID
 *
 * @param publisherId Publisher ID
 * @returns Publisher strategy or null if not found
 */
export function getPublisherStrategyById(publisherId: string): PublisherStrategy | null {
  if (!publisherId || typeof publisherId !== 'string') {
    return null;
  }

  return PUBLISHER_STRATEGIES.find((strategy) => strategy.publisherId === publisherId) ?? null;
}

/**
 * Get all open access publisher strategies
 *
 * @returns Array of strategies for typically OA publishers
 */
export function getOpenAccessStrategies(): readonly PublisherStrategy[] {
  return PUBLISHER_STRATEGIES.filter((strategy) => strategy.typicallyOpenAccess);
}

/**
 * Get all publisher IDs
 *
 * @returns Array of all publisher IDs
 */
export function getAllPublisherIds(): readonly string[] {
  return PUBLISHER_STRATEGIES.map((strategy) => strategy.publisherId);
}

/**
 * Get rate limit for a publisher
 *
 * @param publisherId Publisher ID
 * @returns Rate limit (requests per minute) or default (20)
 */
export function getPublisherRateLimit(publisherId: string): number {
  const strategy = getPublisherStrategyById(publisherId);
  return strategy?.rateLimit ?? 20;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all strategies have required fields
 * Run at startup to catch configuration errors
 */
(function validateStrategiesAtStartup(): void {
  for (const strategy of PUBLISHER_STRATEGIES) {
    if (!strategy.publisherId) {
      throw new Error('Publisher strategy missing publisherId');
    }
    if (!strategy.publisherNames || strategy.publisherNames.length === 0) {
      throw new Error(`Publisher ${strategy.publisherId} missing publisherNames`);
    }
    if (!strategy.urlPatterns || strategy.urlPatterns.length === 0) {
      throw new Error(`Publisher ${strategy.publisherId} missing urlPatterns`);
    }
    if (!strategy.preferredMethod) {
      throw new Error(`Publisher ${strategy.publisherId} missing preferredMethod`);
    }
    if (typeof strategy.typicallyOpenAccess !== 'boolean') {
      throw new Error(`Publisher ${strategy.publisherId} missing typicallyOpenAccess`);
    }
  }
})();
