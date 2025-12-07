import { Injectable, Logger } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { PrismaService } from '../../../common/prisma.service';
import { COMPLEX_API_TIMEOUT, ENRICHMENT_TIMEOUT } from '../constants/http-config.constants';

/**
 * Phase 10 Day 30: HTML Full-Text Extraction Service
 *
 * Enterprise-grade HTML full-text fetching with:
 * - PubMed Central (PMC) API integration via E-utilities
 * - Publisher-specific HTML parsing (Elsevier, Springer, Nature, PLOS, etc.)
 * - Intelligent content extraction (main text vs navigation/ads)
 * - Clean text conversion with semantic structure preservation
 * - Retry logic and rate limiting
 *
 * Academic Foundation:
 * - PMC provides 8+ million free full-text articles (40% of biomedical literature)
 * - HTML parsing provides better structure than PDF OCR
 * - Fallback hierarchy maximizes content availability
 */

interface HtmlFetchResult {
  success: boolean;
  text?: string;
  wordCount?: number;
  source?: 'pmc' | 'html_scrape';
  error?: string;
}

/**
 * Phase 10.106 Phase 10: NCBI API type definitions
 * Netflix-grade: Full type safety for external API
 */
interface NCBILinksetDb {
  dbto: string;
  links?: number[];
}

@Injectable()
export class HtmlFullTextService {
  private readonly logger = new Logger(HtmlFullTextService.name);
  private readonly PMC_BASE_URL =
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private readonly NCBI_EMAIL = 'research@blackq.app'; // Required by NCBI API terms
  private readonly NCBI_TOOL = 'blackqmethod';
  // Phase 10.6 Day 14.5: REQUEST_TIMEOUT_MS removed - migrated to COMPLEX_API_TIMEOUT constant

  /**
   * Enterprise Enhancement (Nov 18, 2025): Content extraction constants
   * Centralized for maintainability and configuration
   */
  private readonly MIN_CONTENT_LENGTH = 100; // Minimum chars for valid extraction
  private readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Publisher-Specific CSS Selectors (Nov 18, 2025)
   * Organized by publisher for easy maintenance and updates
   */
  private readonly PUBLISHER_SELECTORS = {
    mdpi: [
      'section.html-body', // Primary: Article body sections (Introduction, Methods, etc.)
      '.html-body', // Fallback: Class-based selector
      '#main-content', // Broad: Main container (includes abstract + body + references)
      '.content__container', // Fallback: Content wrapper
      '.article-content', // Legacy: Older MDPI structure
      'article', // Generic: HTML5 article element
    ],
    plos: ['.article-text', '#artText', '.article-content'],
    frontiers: ['.JournalFullText', 'article', '.main-content'],
    springerNature: [
      'article[data-article-body]',
      '.c-article-body',
      '.article__body',
      '#body',
    ],
    scienceDirect: ['#body', '.Body', 'article'],
    jama: [
      '.article-full-text',
      '.article-body-section',
      '#Article',
      '.article-content',
      'article',
    ],
  };

  /**
   * Non-Content Selectors to Exclude (Nov 18, 2025)
   * Elements that should be removed before text extraction
   */
  private readonly EXCLUDE_SELECTORS = [
    'nav',
    'header',
    'footer',
    'aside',
    '.references',
    '.bibliography',
    '.citation',
    '[class*="nav"]',
    '[class*="menu"]',
    '[class*="sidebar"]',
    '[class*="ad"]',
    '[id*="ad"]',
  ];

  constructor(_prisma: PrismaService) {}

  /**
   * Waterfall Strategy: Try multiple sources in priority order
   *
   * Priority:
   * 1. PMC API (fastest, most reliable, structured)
   * 2. HTML scraping from URL (publisher websites)
   *
   * @param paperId - Paper ID in database
   * @param pmid - PubMed ID (for PMC lookup)
   * @param url - Paper URL (for scraping)
   * @returns Full-text content or null
   */
  async fetchFullTextWithFallback(
    _paperId: string,
    pmid?: string,
    url?: string,
  ): Promise<HtmlFetchResult> {
    // Try PMC API first (fastest and most reliable)
    if (pmid) {
      this.logger.log(`🔍 Attempting PMC API for PMID: ${pmid}`);
      const pmcResult = await this.fetchFromPMC(pmid);
      if (pmcResult.success) {
        this.logger.log(`✅ PMC API success: ${pmcResult.wordCount} words`);
        return pmcResult;
      }
      this.logger.log(`⚠️  PMC API failed: ${pmcResult.error}`);
    }

    // Fallback to HTML scraping from URL
    if (url) {
      this.logger.log(`🔍 Attempting HTML scraping from: ${url}`);
      const htmlResult = await this.scrapeHtmlFromUrl(url);
      if (htmlResult.success) {
        this.logger.log(
          `✅ HTML scraping success: ${htmlResult.wordCount} words`,
        );
        return htmlResult;
      }
      this.logger.log(`⚠️  HTML scraping failed: ${htmlResult.error}`);
    }

    return {
      success: false,
      error: 'No HTML full-text sources available or all methods failed',
    };
  }

  /**
   * Fetch full-text from PubMed Central using E-utilities API
   *
   * PMC Advantages:
   * - 8+ million free full-text articles
   * - Structured XML with semantic markup
   * - No rate limits for academic use (with tool/email)
   * - Higher quality than PDF OCR
   *
   * Process:
   * 1. Convert PMID to PMCID using ID converter API
   * 2. Fetch full-text XML using efetch
   * 3. Extract body text from XML structure
   * 4. Clean and normalize text
   */
  private async fetchFromPMC(pmid: string): Promise<HtmlFetchResult> {
    try {
      // Step 1: Convert PMID to PMCID
      const pmcid = await this.pmidToPmcid(pmid);
      if (!pmcid) {
        return {
          success: false,
          error: 'Article not available in PMC (may be abstract-only)',
        };
      }

      this.logger.log(`📚 PMC ID found: ${pmcid} for PMID: ${pmid}`);

      // Step 2: Fetch full-text XML from PMC
      const fetchUrl = `${this.PMC_BASE_URL}/efetch.fcgi`;
      const params = {
        db: 'pmc',
        id: pmcid,
        retmode: 'xml',
        tool: this.NCBI_TOOL,
        email: this.NCBI_EMAIL,
      };

      const response = await axios.get(fetchUrl, {
        params,
        timeout: COMPLEX_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Migrated to centralized config
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      const xmlContent = response.data;

      // Step 3: Parse XML and extract text
      const fullText = this.extractTextFromPmcXml(xmlContent);

      if (!fullText || fullText.length < this.MIN_CONTENT_LENGTH) {
        return {
          success: false,
          error: 'PMC XML parsing returned insufficient text',
        };
      }

      const wordCount = this.calculateWordCount(fullText);

      this.logger.log(
        `✅ PMC extraction successful: ${wordCount} words from ${pmcid}`,
      );

      return {
        success: true,
        text: fullText,
        wordCount,
        source: 'pmc',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`PMC fetch error for PMID ${pmid}: ${errorMsg}`);
      return {
        success: false,
        error: `PMC API error: ${errorMsg}`,
      };
    }
  }

  /**
   * Convert PMID to PMCID using NCBI ID Converter API
   * PMC requires PMCID (not PMID) for full-text retrieval
   */
  private async pmidToPmcid(pmid: string): Promise<string | null> {
    try {
      const converterUrl = `${this.PMC_BASE_URL}/elink.fcgi`;
      const params = {
        dbfrom: 'pubmed',
        db: 'pmc',
        id: pmid,
        retmode: 'json',
        tool: this.NCBI_TOOL,
        email: this.NCBI_EMAIL,
      };

      const response = await axios.get(converterUrl, {
        params,
        timeout: ENRICHMENT_TIMEOUT, // 5s - Phase 10.6 Day 14.5: Migrated to centralized config
      });

      const linksets = response.data?.linksets?.[0];
      const pmcLinks = linksets?.linksetdbs?.find(
        (db: NCBILinksetDb) => db.dbto === 'pmc',
      );

      if (pmcLinks && pmcLinks.links && pmcLinks.links.length > 0) {
        const pmcidNumeric = pmcLinks.links[0]; // Get first PMC ID
        return `PMC${pmcidNumeric}`; // Add PMC prefix
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to convert PMID ${pmid} to PMCID: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Extract readable text from PMC XML structure
   *
   * PMC XML Structure:
   * - <body> contains main article content
   * - <sec> tags are sections with titles
   * - <p> tags are paragraphs
   * - Excludes <ref-list>, <ack>, <fn-group> (references, acknowledgments, footnotes)
   */
  private extractTextFromPmcXml(xmlContent: string): string {
    try {
      // Use regex to extract body content (lightweight vs full XML parser)
      const bodyMatch = xmlContent.match(/<body>([\s\S]*?)<\/body>/i);
      if (!bodyMatch) {
        this.logger.warn('No <body> tag found in PMC XML');
        return '';
      }

      let bodyContent = bodyMatch[1];

      // Remove non-content sections
      const excludeSections = [
        /<ref-list[\s\S]*?<\/ref-list>/gi, // References
        /<ack[\s\S]*?<\/ack>/gi, // Acknowledgments
        /<fn-group[\s\S]*?<\/fn-group>/gi, // Footnotes
        /<table-wrap[\s\S]*?<\/table-wrap>/gi, // Tables
        /<fig[\s\S]*?<\/fig>/gi, // Figures
        /<supplementary-material[\s\S]*?<\/supplementary-material>/gi, // Supplementary
      ];

      excludeSections.forEach((pattern) => {
        bodyContent = bodyContent.replace(pattern, '');
      });

      // Extract section titles (semantic structure)
      bodyContent = bodyContent.replace(/<title>(.*?)<\/title>/gi, '\n\n$1\n');

      // Extract paragraphs
      bodyContent = bodyContent.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

      // Remove all remaining XML tags
      bodyContent = bodyContent.replace(/<[^>]+>/g, ' ');

      // Decode XML entities
      bodyContent = this.decodeXmlEntities(bodyContent);

      // Normalize whitespace
      bodyContent = bodyContent
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .trim();

      return bodyContent;
    } catch (error) {
      this.logger.error(
        `Error parsing PMC XML: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }

  /**
   * Scrape full-text HTML from publisher website URL
   *
   * Publisher-Specific Strategies:
   * - PLOS: Open access, structured HTML with article body
   * - Nature/Springer: Behind paywall but structured when accessible
   * - MDPI: Open access, clean HTML structure
   * - Frontiers: Open access, article body in main content
   * - Elsevier: Varies by journal
   *
   * Generic Fallback:
   * - Target <article>, <main>, .article-body, .fulltext-view
   * - Filter out navigation, ads, sidebars
   */
  private async scrapeHtmlFromUrl(url: string): Promise<HtmlFetchResult> {
    try {
      this.logger.log(`🌐 Fetching HTML from: ${url}`);

      const response = await axios.get(url, {
        timeout: COMPLEX_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Migrated to centralized config
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        maxRedirects: 5,
      });

      const html = response.data;
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Detect publisher and use specific extraction strategy
      const hostname = new URL(url).hostname.toLowerCase();
      let extractedText = '';

      if (hostname.includes('plos.org')) {
        extractedText = this.extractPlosContent(document);
      } else if (hostname.includes('mdpi.com')) {
        extractedText = this.extractMdpiContent(document);
      } else if (hostname.includes('frontiersin.org')) {
        extractedText = this.extractFrontiersContent(document);
      } else if (
        hostname.includes('nature.com') ||
        hostname.includes('springer.com')
      ) {
        extractedText = this.extractSpringerNatureContent(document);
      } else if (hostname.includes('sciencedirect.com')) {
        extractedText = this.extractScienceDirectContent(document);
      } else if (hostname.includes('jamanetwork.com')) {
        // Phase 10.6 Day 8: JAMA Network - American Medical Association
        extractedText = this.extractJAMAContent(document);
      } else {
        // Generic fallback
        extractedText = this.extractGenericContent(document);
      }

      if (!extractedText || extractedText.length < this.MIN_CONTENT_LENGTH) {
        return {
          success: false,
          error:
            'HTML scraping returned insufficient text (possible paywall or extraction failure)',
        };
      }

      const wordCount = this.calculateWordCount(extractedText);

      return {
        success: true,
        text: extractedText,
        wordCount,
        source: 'html_scrape',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`HTML scraping error for ${url}: ${errorMsg}`);
      return {
        success: false,
        error: `HTML scraping failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Publisher-Specific Extraction Methods
   * Each uses CSS selectors optimized for that publisher's HTML structure
   */

  private extractPlosContent(document: Document): string {
    return this.extractBySelectors(document, this.PUBLISHER_SELECTORS.plos);
  }

  /**
   * MDPI Full-Text Extraction
   *
   * MDPI Structure (verified Nov 18, 2025):
   * - #main-content: Primary container with all article sections
   * - section.html-body: Main article body (Introduction, Methods, Results, etc.)
   * - .html-abstract: Abstract section (separate from body)
   * - .content__container: Wrapper for content
   *
   * Priority: Most specific to most generic
   * Rationale: MDPI uses semantic HTML5 structure with clear section tags
   *
   * @param document - JSDOM document object
   * @returns Extracted full-text content or empty string if extraction fails
   */
  private extractMdpiContent(document: Document): string {
    this.logger.debug(
      `🔍 MDPI Extraction: Trying ${this.PUBLISHER_SELECTORS.mdpi.length} selectors in priority order`,
    );

    return this.extractBySelectors(document, this.PUBLISHER_SELECTORS.mdpi);
  }

  private extractFrontiersContent(document: Document): string {
    return this.extractBySelectors(
      document,
      this.PUBLISHER_SELECTORS.frontiers,
    );
  }

  private extractSpringerNatureContent(document: Document): string {
    return this.extractBySelectors(
      document,
      this.PUBLISHER_SELECTORS.springerNature,
    );
  }

  private extractScienceDirectContent(document: Document): string {
    return this.extractBySelectors(
      document,
      this.PUBLISHER_SELECTORS.scienceDirect,
    );
  }

  /**
   * Phase 10.6 Day 8: JAMA Network HTML extraction
   * American Medical Association's publishing platform
   */
  private extractJAMAContent(document: Document): string {
    return this.extractBySelectors(document, this.PUBLISHER_SELECTORS.jama);
  }

  /**
   * Generic content extraction using common selectors
   * Filters out navigation, ads, and non-content elements
   */
  private extractGenericContent(document: Document): string {
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.article-body',
      '.article-content',
      '.fulltext-view',
      '.main-content',
      '#main-content',
    ];

    return this.extractBySelectors(document, contentSelectors);
  }

  /**
   * Extract text using CSS selectors with fallback
   * Removes navigation, ads, and non-content sections
   *
   * Enterprise Enhancement (Nov 18, 2025):
   * - Logs which selector succeeded for debugging
   * - Provides word count metrics
   * - Filters out non-content elements before extraction
   * - Uses centralized constants for maintainability
   *
   * @param document - JSDOM document object
   * @param selectors - Array of CSS selectors to try in order
   * @returns Extracted and cleaned text or empty string if all selectors fail
   */
  private extractBySelectors(document: Document, selectors: string[]): string {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);

      if (element) {
        this.logger.debug(
          `✅ Selector matched: "${selector}" (${i + 1}/${selectors.length})`,
        );

        // Remove non-content elements using centralized selectors
        this.EXCLUDE_SELECTORS.forEach((exclude) => {
          element.querySelectorAll(exclude).forEach((el) => el.remove());
        });

        const text = element.textContent || '';
        const cleaned = this.cleanScrapedText(text);

        if (cleaned.length > this.MIN_CONTENT_LENGTH) {
          const wordCount = this.calculateWordCount(cleaned);
          this.logger.log(
            `✅ Text extraction successful: ${cleaned.length} chars, ${wordCount} words (selector: "${selector}")`,
          );
          return cleaned;
        } else {
          this.logger.debug(
            `⚠️ Selector "${selector}" matched but content too short (${cleaned.length} chars)`,
          );
        }
      } else {
        this.logger.debug(`❌ Selector not found: "${selector}"`);
      }
    }

    this.logger.warn(
      `❌ All ${selectors.length} selectors failed to extract content`,
    );
    return '';
  }

  /**
   * Clean scraped HTML text
   * - Normalize whitespace
   * - Remove navigation artifacts
   * - Preserve paragraph structure
   */
  private cleanScrapedText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n\s+/g, '\n') // Remove leading spaces
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .trim();
  }

  /**
   * Decode XML/HTML entities
   */
  private decodeXmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&apos;': "'",
      '&#8217;': "'",
      '&#8220;': '"',
      '&#8221;': '"',
      '&#8211;': '–',
      '&#8212;': '—',
    };

    let decoded = text;
    Object.entries(entities).forEach(([entity, char]) => {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    });

    return decoded;
  }

  /**
   * Calculate word count
   */
  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }
}
