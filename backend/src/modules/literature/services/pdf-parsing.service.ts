import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/prisma.service';

// pdf-parse doesn't have TypeScript types, use require
const pdf = require('pdf-parse');

/**
 * Phase 10 Day 5.15: Full-Text PDF Parsing Service
 *
 * Enterprise-grade PDF parsing with:
 * - Unpaywall API integration for open-access PDFs
 * - Text extraction and cleaning
 * - Deduplication via SHA256 hashing
 * - Comprehensive error handling
 *
 * Scientific Foundation: Purposive sampling (Patton 2002) - deep analysis of high-quality papers
 */
@Injectable()
export class PDFParsingService {
  private readonly logger = new Logger(PDFParsingService.name);
  private readonly UNPAYWALL_EMAIL = 'research@blackq.app'; // Required by Unpaywall API
  private readonly MAX_PDF_SIZE_MB = 50;
  private readonly DOWNLOAD_TIMEOUT_MS = 30000; // 30 seconds

  constructor(private prisma: PrismaService) {}

  /**
   * Fetch PDF from Unpaywall API for a given DOI
   * Returns PDF buffer or null if unavailable
   */
  async fetchPDF(doi: string): Promise<Buffer | null> {
    try {
      this.logger.log(`Fetching PDF for DOI: ${doi}`);

      // Step 1: Query Unpaywall API for PDF location
      const unpaywallUrl = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${this.UNPAYWALL_EMAIL}`;

      const unpaywallResponse = await axios.get(unpaywallUrl, {
        timeout: 10000, // 10 second timeout for API call
      });

      const data = unpaywallResponse.data;

      // Check if open access PDF is available
      if (!data.is_oa) {
        this.logger.warn(`PDF not open access for DOI: ${doi}`);
        return null;
      }

      // Get best PDF location (prefer publisher > repository)
      let pdfUrl: string | null = null;

      if (data.best_oa_location?.url_for_pdf) {
        pdfUrl = data.best_oa_location.url_for_pdf;
      } else if (data.oa_locations && data.oa_locations.length > 0) {
        // Find first location with PDF URL
        const pdfLocation = data.oa_locations.find(
          (loc: any) => loc.url_for_pdf,
        );
        if (pdfLocation) {
          pdfUrl = pdfLocation.url_for_pdf;
        }
      }

      // Phase 10 Day 5.17.4+: If no direct PDF URL but has landing page, try publisher-specific patterns
      if (!pdfUrl && data.best_oa_location?.url_for_landing_page) {
        pdfUrl = this.constructPdfUrlFromLandingPage(
          data.best_oa_location.url_for_landing_page,
          data.publisher,
        );
        if (pdfUrl) {
          this.logger.log(`Constructed PDF URL from landing page: ${pdfUrl}`);
        }
      }

      if (!pdfUrl) {
        this.logger.warn(`No PDF URL found for DOI: ${doi}`);
        return null;
      }

      this.logger.log(`Downloading PDF from: ${pdfUrl}`);

      // Step 2: Download PDF with size and timeout limits
      // Phase 10 Day 5.17.4+: Enhanced headers to bypass publisher bot protection
      const landingPage =
        data.best_oa_location?.url_for_landing_page ||
        data.doi_url ||
        `https://doi.org/${doi}`;
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: this.DOWNLOAD_TIMEOUT_MS,
        maxContentLength: this.MAX_PDF_SIZE_MB * 1024 * 1024, // 50MB
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/pdf,application/x-pdf,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: landingPage,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        maxRedirects: 5, // Follow redirects
        validateStatus: (status) => status >= 200 && status < 400, // Accept 3xx redirects
      });

      const buffer = Buffer.from(pdfResponse.data);

      this.logger.log(
        `Successfully downloaded PDF (${(buffer.length / 1024).toFixed(2)} KB)`,
      );

      return buffer;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          this.logger.error(`PDF download timeout for DOI: ${doi}`);
        } else if (error.response?.status === 404) {
          this.logger.warn(`PDF not found (404) for DOI: ${doi}`);
        } else if (error.response?.status === 403) {
          this.logger.warn(`PDF access forbidden (403) for DOI: ${doi}`);
        } else {
          this.logger.error(
            `Axios error fetching PDF for DOI ${doi}: ${error.message}`,
          );
        }
      } else {
        this.logger.error(`Error fetching PDF for DOI ${doi}:`, error);
      }
      return null;
    }
  }

  /**
   * Construct PDF URL from landing page using publisher-specific patterns
   * Phase 10 Day 5.17.4+: Handle cases where Unpaywall doesn't have direct PDF URLs
   */
  private constructPdfUrlFromLandingPage(
    landingPageUrl: string,
    publisher?: string,
  ): string | null {
    try {
      const url = new URL(landingPageUrl);
      const hostname = url.hostname.toLowerCase();

      // Sage Publications (journals.sagepub.com)
      if (hostname.includes('sagepub.com')) {
        // Pattern: https://journals.sagepub.com/doi/10.1177/XXX → https://journals.sagepub.com/doi/pdf/10.1177/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl.replace('/doi/', '/doi/pdf/');
        }
      }

      // Wiley (onlinelibrary.wiley.com)
      if (hostname.includes('wiley.com')) {
        // Pattern: https://onlinelibrary.wiley.com/doi/10.1111/XXX → https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl.replace('/doi/', '/doi/pdfdirect/');
        }
      }

      // Springer (link.springer.com)
      if (hostname.includes('springer.com')) {
        // Pattern: https://link.springer.com/article/10.1007/XXX → https://link.springer.com/content/pdf/10.1007/XXX.pdf
        if (url.pathname.includes('/article/')) {
          const doi = url.pathname.split('/article/')[1];
          return `https://link.springer.com/content/pdf/${doi}.pdf`;
        }
      }

      // Taylor & Francis (tandfonline.com)
      if (hostname.includes('tandfonline.com')) {
        // Pattern: https://www.tandfonline.com/doi/full/10.1080/XXX → https://www.tandfonline.com/doi/pdf/10.1080/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl
            .replace('/doi/full/', '/doi/pdf/')
            .replace('/doi/abs/', '/doi/pdf/');
        }
      }

      // MDPI (mdpi.com)
      if (hostname.includes('mdpi.com')) {
        // Pattern: https://www.mdpi.com/1234-5678/1/2/34 → https://www.mdpi.com/1234-5678/1/2/34/pdf
        if (!landingPageUrl.endsWith('/pdf')) {
          return `${landingPageUrl}/pdf`;
        }
      }

      // Frontiers (frontiersin.org)
      if (hostname.includes('frontiersin.org')) {
        // Pattern: https://www.frontiersin.org/articles/10.3389/XXX → https://www.frontiersin.org/articles/10.3389/XXX/pdf
        if (
          url.pathname.includes('/articles/') &&
          !url.pathname.endsWith('/pdf')
        ) {
          return `${landingPageUrl}/pdf`;
        }
      }

      // PLOS (journals.plos.org)
      if (hostname.includes('plos.org')) {
        // Pattern: https://journals.plos.org/plosone/article?id=10.1371/XXX → https://journals.plos.org/plosone/article/file?id=10.1371/XXX&type=printable
        if (url.pathname.includes('/article')) {
          const match = landingPageUrl.match(/id=(10\.\d+\/[^\&]+)/);
          if (match) {
            const baseUrl = landingPageUrl.split('/article')[0];
            return `${baseUrl}/article/file?id=${match[1]}&type=printable`;
          }
        }
      }

      // Handle doi.org URLs by detecting publisher from DOI pattern
      if (hostname === 'doi.org' && url.pathname.startsWith('/10.')) {
        const doi = url.pathname.substring(1); // Remove leading /

        // Sage: 10.1177/... → journals.sagepub.com
        if (doi.startsWith('10.1177/')) {
          return `https://journals.sagepub.com/doi/pdf/${doi}`;
        }

        // Wiley: 10.1111/... → onlinelibrary.wiley.com
        if (doi.startsWith('10.1111/') || doi.startsWith('10.1002/')) {
          return `https://onlinelibrary.wiley.com/doi/pdfdirect/${doi}`;
        }

        // Springer: 10.1007/... → link.springer.com
        if (doi.startsWith('10.1007/')) {
          return `https://link.springer.com/content/pdf/${doi}.pdf`;
        }

        // Taylor & Francis: 10.1080/... → tandfonline.com
        if (doi.startsWith('10.1080/')) {
          return `https://www.tandfonline.com/doi/pdf/${doi}`;
        }

        // MDPI: 10.3390/... → mdpi.com (need to resolve full path)
        // For MDPI, the DOI alone isn't enough, skip for now

        // Frontiers: 10.3389/... → frontiersin.org
        if (doi.startsWith('10.3389/')) {
          return `https://www.frontiersin.org/articles/${doi}/pdf`;
        }

        // PLOS: 10.1371/... → journals.plos.org
        if (doi.startsWith('10.1371/')) {
          // PLOS journal detection from DOI is complex, use generic pattern
          return `https://journals.plos.org/plosone/article/file?id=${doi}&type=printable`;
        }

        // Generic fallback: try adding .pdf
        return `${landingPageUrl}.pdf`;
      }

      this.logger.log(
        `No PDF URL pattern available for publisher: ${publisher || hostname}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error constructing PDF URL from landing page: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Extract text from PDF buffer using pdf-parse
   * Returns plain text or null on error
   */
  async extractText(pdfBuffer: Buffer): Promise<string | null> {
    try {
      this.logger.log(
        `Extracting text from PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB)`,
      );

      const data = await pdf(pdfBuffer);

      if (!data.text || data.text.trim().length === 0) {
        this.logger.warn('PDF extraction returned empty text');
        return null;
      }

      this.logger.log(`Extracted ${data.text.length} characters from PDF`);

      return data.text;
    } catch (error) {
      this.logger.error('Error extracting text from PDF:', error);
      return null;
    }
  }

  /**
   * Clean extracted PDF text
   * - Fix encoding issues
   * - Remove headers/footers
   * - Fix hyphenation
   * - Remove non-content sections (references, indexes, etc.)
   */
  cleanText(rawText: string): string {
    let cleaned = rawText;

    // Step 1: Fix common encoding issues
    cleaned = cleaned
      .replace(/\uFFFD/g, '') // Replace replacement character
      .replace(/[^\x00-\x7F]/g, (char) => {
        // Preserve common special chars, replace others
        const commonChars = 'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ';
        return commonChars.includes(char) ? char : '';
      });

    // Step 2: Fix line breaks and hyphenation
    cleaned = cleaned
      .replace(/(\w)-\s*\n\s*(\w)/g, '$1$2') // Fix hyphenated words across lines
      .replace(/\n{3,}/g, '\n\n') // Normalize excessive line breaks
      .replace(/[ \t]+/g, ' '); // Normalize whitespace

    // Step 3: Remove common headers/footers patterns
    const headerFooterPatterns = [
      /^\d+\s*$/gm, // Standalone page numbers
      /^Page \d+ of \d+$/gim,
      /^\d+\s+[A-Z][a-z]+ et al\.$/gim, // Author names in header
      /^[A-Z][a-z]+ \d{4}$/gim, // Journal name + year
    ];

    headerFooterPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Step 4: Remove non-content sections using 50+ exclusion markers
    // (Same markers as comprehensive word count utility)
    const exclusionMarkers = [
      // English
      'references',
      'bibliography',
      'works cited',
      'cited references',
      'literature cited',
      'index',
      'subject index',
      'author index',
      'keyword index',
      'glossary',
      'terminology',
      'appendix',
      'appendices',
      'supplementary material',
      'supplemental material',
      'supporting information',
      'acknowledgments',
      'acknowledgements',
      'author contributions',
      'funding',
      'funding sources',
      'financial disclosure',
      'conflict of interest',
      'conflicts of interest',
      'competing interests',
      'about the author',
      'about the authors',
      'biographical note',

      // Portuguese
      'referências',
      'bibliografia',
      'índice',
      'glossário',
      'apêndice',
      'material suplementar',
      'agradecimentos',
      'financiamento',

      // French
      'références',
      'bibliographie',
      'index',
      'glossaire',
      'annexe',
      'matériel supplémentaire',
      'remerciements',
      'financement',

      // German
      'literaturverzeichnis',
      'bibliographie',
      'index',
      'glossar',
      'anhang',
      'ergänzungsmaterial',
      'danksagung',
      'finanzierung',

      // Italian
      'bibliografia',
      'riferimenti',
      'indice',
      'glossario',
      'appendice',
      'materiale supplementare',
      'ringraziamenti',
      'finanziamento',

      // Spanish
      'referencias',
      'bibliografía',
      'índice',
      'glosario',
      'apéndice',
      'material suplementario',
      'agradecimientos',
      'financiación',
    ];

    // Find first occurrence of any exclusion marker (case-insensitive)
    let cutoffIndex = -1;
    const lowerText = cleaned.toLowerCase();

    for (const marker of exclusionMarkers) {
      const pattern = new RegExp(`\\b${marker}\\b`, 'i');
      const match = lowerText.match(pattern);
      if (match && match.index !== undefined) {
        if (cutoffIndex === -1 || match.index < cutoffIndex) {
          cutoffIndex = match.index;
        }
      }
    }

    // Cut off everything from first exclusion marker onward
    if (cutoffIndex !== -1) {
      cleaned = cleaned.substring(0, cutoffIndex);
      this.logger.log(
        `Removed non-content sections (cut at character ${cutoffIndex})`,
      );
    }

    // Step 5: Final cleanup
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Calculate SHA256 hash for deduplication
   */
  calculateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Calculate word count (simple whitespace-based)
   */
  calculateWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Main method: Fetch, extract, clean, and store full-text for a paper
   * Returns updated paper with full-text status
   */
  async processFullText(paperId: string): Promise<{
    success: boolean;
    status: 'success' | 'failed' | 'not_found';
    wordCount?: number;
    error?: string;
  }> {
    try {
      // Get paper from database
      const paper = await this.prisma.paper.findUnique({
        where: { id: paperId },
      });

      if (!paper) {
        return {
          success: false,
          status: 'not_found',
          error: 'Paper not found',
        };
      }

      if (!paper.doi) {
        this.logger.warn(`Paper ${paperId} has no DOI, cannot fetch full-text`);
        await this.prisma.paper.update({
          where: { id: paperId },
          data: { fullTextStatus: 'failed' },
        });
        return { success: false, status: 'failed', error: 'No DOI available' };
      }

      // Update status to fetching
      await this.prisma.paper.update({
        where: { id: paperId },
        data: { fullTextStatus: 'fetching' },
      });

      // Step 1: Fetch PDF
      const pdfBuffer = await this.fetchPDF(paper.doi);
      if (!pdfBuffer) {
        await this.prisma.paper.update({
          where: { id: paperId },
          data: { fullTextStatus: 'failed' },
        });
        return {
          success: false,
          status: 'failed',
          error: 'PDF not available or behind paywall',
        };
      }

      // Step 2: Extract text
      const rawText = await this.extractText(pdfBuffer);
      if (!rawText) {
        await this.prisma.paper.update({
          where: { id: paperId },
          data: { fullTextStatus: 'failed' },
        });
        return {
          success: false,
          status: 'failed',
          error: 'Failed to extract text from PDF',
        };
      }

      // Step 3: Clean text
      const cleanedText = this.cleanText(rawText);

      // Step 4: Calculate metrics
      const fullTextWordCount = this.calculateWordCount(cleanedText);
      const fullTextHash = this.calculateHash(cleanedText);

      // Step 5: Check for duplicates
      const duplicate = await this.prisma.paper.findFirst({
        where: {
          fullTextHash,
          id: { not: paperId },
        },
      });

      if (duplicate) {
        this.logger.warn(
          `Duplicate full-text detected for paper ${paperId} (matches ${duplicate.id})`,
        );
      }

      // Step 6: Recalculate comprehensive word count (title + abstract + fullText)
      const titleWords = this.calculateWordCount(paper.title || '');
      const abstractWords =
        paper.abstractWordCount ||
        this.calculateWordCount(paper.abstract || '');
      const totalWordCount = titleWords + abstractWords + fullTextWordCount;

      // Step 7: Store in database
      await this.prisma.paper.update({
        where: { id: paperId },
        data: {
          fullText: cleanedText,
          fullTextStatus: 'success',
          fullTextSource: 'unpaywall',
          fullTextFetchedAt: new Date(),
          fullTextWordCount,
          fullTextHash,
          wordCount: totalWordCount,
          wordCountExcludingRefs: totalWordCount, // Already excluded in cleanText
          hasFullText: true,
        },
      });

      this.logger.log(
        `✅ Successfully processed full-text for paper ${paperId}: ${fullTextWordCount} words (total: ${totalWordCount})`,
      );

      return {
        success: true,
        status: 'success',
        wordCount: fullTextWordCount,
      };
    } catch (error) {
      this.logger.error(
        `Error processing full-text for paper ${paperId}:`,
        error,
      );

      // Update status to failed
      await this.prisma.paper
        .update({
          where: { id: paperId },
          data: { fullTextStatus: 'failed' },
        })
        .catch(() => {}); // Ignore error if paper doesn't exist

      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get full-text fetch status for a paper
   */
  async getStatus(paperId: string): Promise<{
    status: string;
    wordCount?: number;
    fetchedAt?: Date;
    error?: string;
  } | null> {
    const paper = await this.prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        fullTextStatus: true,
        fullTextWordCount: true,
        fullTextFetchedAt: true,
      },
    });

    if (!paper) {
      return null;
    }

    return {
      status: paper.fullTextStatus || 'not_fetched',
      wordCount: paper.fullTextWordCount || undefined,
      fetchedAt: paper.fullTextFetchedAt || undefined,
    };
  }

  /**
   * Get full-text content for a paper
   */
  async getFullText(paperId: string): Promise<string | null> {
    const paper = await this.prisma.paper.findUnique({
      where: { id: paperId },
      select: { fullText: true },
    });

    return paper?.fullText || null;
  }

  /**
   * Bulk status check for multiple papers
   * Returns grouped by status
   */
  async getBulkStatus(paperIds: string[]): Promise<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  }> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
      select: { id: true, fullTextStatus: true },
    });

    const grouped = {
      ready: [] as string[],
      fetching: [] as string[],
      failed: [] as string[],
      not_fetched: [] as string[],
    };

    papers.forEach((paper) => {
      const status = paper.fullTextStatus || 'not_fetched';
      if (status === 'success') {
        grouped.ready.push(paper.id);
      } else if (status === 'fetching') {
        grouped.fetching.push(paper.id);
      } else if (status === 'failed') {
        grouped.failed.push(paper.id);
      } else {
        grouped.not_fetched.push(paper.id);
      }
    });

    return grouped;
  }
}
