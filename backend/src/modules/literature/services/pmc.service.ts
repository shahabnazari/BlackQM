/**
 * PubMed Central (PMC) Service
 * Phase 10.6 Day 4: New source integration following Day 3.5 refactoring pattern
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING PATTERN (Established Day 3.5):
 * This service follows the clean architecture pattern established during the
 * Day 3.5 refactoring, where we extracted 4 old sources from the God class.
 *
 * PATTERN CONSISTENCY:
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for other features (full-text extraction, citation analysis)
 * - literature.service.ts contains only thin 15-30 line wrapper
 *
 * ⚠️ COMPLEXITY NOTE:
 * PMC is more complex than most sources due to:
 * 1. Full-text XML parsing (not just metadata)
 * 2. Structured section extraction (Abstract, Methods, Results, Discussion)
 * 3. Open Access vs restricted article handling
 * 4. Two-step API workflow (esearch → efetch)
 * 5. Large XML documents (can be 100KB+ for full-text articles)
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY PMC INTEGRATION:
 * ✅ DO: Modify THIS file (pmc.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchPMC() method
 * ❌ DON'T: Inline XML parsing or HTTP calls anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Extract additional sections (Conclusion, References) → Update parsePaper() method
 * - Add full-text word count calculation → Add logic in STEP 8
 * - Change XML parsing strategy → Update parsePaper() method
 * - Add PMC ID validation → Add validation in search() method
 * - Handle restricted articles differently → Update Open Access check logic
 *
 * WRAPPER METHOD (literature.service.ts):
 * Should remain a thin 15-30 line wrapper that only handles orchestration
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles PMC/NCBI E-utilities API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used for full-text extraction, section analysis
 * 8. Maintainability: All PMC logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 11M+ full-text biomedical articles (PMC Open Access subset: 3M+)
 * API: Free, no key required (3 requests/second limit, 10/second with API key)
 * Features:
 * - Full-text article content (not just abstracts)
 * - Structured sections (Abstract, Introduction, Methods, Results, Discussion)
 * - PDF URLs for all Open Access articles
 * - PMC ID, PMID cross-referencing
 * - DOI linking
 * - Author affiliations and funding information
 * - Rich biomedical metadata
 *
 * API Limitations:
 * - Only Open Access articles have full-text
 * - Large XML responses (performance consideration)
 * - Rate limiting (3 req/sec without API key)
 * - No citation counts (use OpenAlex enrichment)
 *
 * @see https://www.ncbi.nlm.nih.gov/pmc/tools/developers/
 * @see https://www.ncbi.nlm.nih.gov/books/NBK25501/ (E-utilities Guide)
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// Phase 10.106 Phase 3: Retry Service Integration - Enterprise-grade resilience
import { RetryService } from '../../../common/services/retry.service';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { COMPLEX_API_TIMEOUT } from '../constants/http-config.constants';

export interface PMCSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  openAccessOnly?: boolean; // Only return Open Access articles
}

/**
 * Phase 10.106 Phase 3: Typed interface for PMC esearch parameters
 * Netflix-grade: No loose `any` types
 */
interface PMCSearchParams {
  db: string;
  term: string;
  retmode: string;
  retmax: number;
  api_key?: string;
}

/**
 * Phase 10.106 Phase 3: Typed interface for PMC efetch parameters
 * Netflix-grade: No loose `any` types
 */
interface PMCFetchParams {
  db: string;
  id: string;
  retmode: string;
  rettype: string;
  api_key?: string;
}

/**
 * Phase 10.106 Phase 3: Typed interface for PMC esearch response
 * Netflix-grade: Full response typing
 */
interface PMCESearchResponse {
  esearchresult?: {
    idlist?: string[];
    count?: string;
  };
}

@Injectable()
export class PMCService {
  private readonly logger = new Logger(PMCService.name);
  private readonly ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  private readonly EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
  private readonly apiKey: string;

  // Phase 10.106 Phase 3: Inject RetryService for enterprise-grade resilience
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly retry: RetryService,
  ) {
    // Phase 10.7.10: NCBI API key from environment (increases rate limit from 3/sec to 10/sec)
    this.apiKey = this.configService.get<string>('NCBI_API_KEY') || '';
    if (this.apiKey) {
      this.logger.log('[PMC] NCBI API key configured - using enhanced rate limits (10 req/sec)');
    } else {
      this.logger.warn('[PMC] No NCBI API key - using default rate limits (3 req/sec)');
    }
  }

  /**
   * Search PubMed Central database using NCBI E-utilities
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add search filters: Update searchParams object (line 143)
   * - To change result limit: Modify retmax parameter
   * - To add date filters: Add mindate/maxdate params
   * - To optimize full-text parsing: Modify parsePaper() (line 221+)
   *
   * 🔄 TWO-STEP API WORKFLOW (same as PubMed):
   * Step 1: esearch - Get list of PMC IDs matching query
   * Step 2: efetch - Fetch full XML for those IDs
   *
   * @param query Search query string (supports PubMed query syntax)
   * @param options Search filters (year range, limit, Open Access filter)
   * @returns Array of Paper objects with full-text content
   */
  async search(
    query: string,
    options?: PMCSearchOptions,
  ): Promise<Paper[]> {
    try {
      this.logger.log(`[PMC] Searching: "${query}"`);

      // ========================================================================
      // STEP 1: Search for PMC IDs using esearch
      // ========================================================================
      // Phase 10.106 Phase 3: Use typed interface for search params
      let searchTerm = query;

      // Filter to Open Access articles only (recommended for full-text access)
      if (options?.openAccessOnly !== false) {
        searchTerm += ' AND open access[filter]';
      }

      const searchParams: PMCSearchParams = {
        db: 'pmc', // PMC database (not pubmed)
        term: searchTerm,
        retmode: 'json',
        retmax: options?.limit || 20,
      };

      // Phase 10.7.10: Add API key if configured (increases rate limit 3→10 req/sec)
      if (this.apiKey) {
        searchParams.api_key = this.apiKey;
      }

      // Phase 10.106 Phase 3: Execute with RetryService
      const searchResult = await this.retry.executeWithRetry(
        async () => firstValueFrom(
          this.httpService.get(this.ESEARCH_URL, {
            params: searchParams,
            timeout: COMPLEX_API_TIMEOUT, // 15s
          }),
        ),
        'PMC.esearch',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          backoffMultiplier: 2,
          jitterMs: 500,
        },
      );

      // Phase 10.106 Phase 3: Handle both direct data and wrapped AxiosResponse cases
      // Same fix pattern as ERIC service - unwrap if needed
      const rawData = searchResult.data;
      const searchData: PMCESearchResponse = (rawData as any)?.data ?? rawData;
      const ids = searchData?.esearchresult?.idlist;
      if (!ids || ids.length === 0) {
        this.logger.log(`[PMC] No results found`);
        return [];
      }

      this.logger.log(`[PMC] Found ${ids.length} article IDs, fetching full-text...`);

      // ========================================================================
      // STEP 2: Fetch full XML using efetch (WITH PARALLEL BATCHING)
      // ========================================================================
      // Phase 10.7 Day 5: FIX HTTP 414 - Batch IDs to avoid URL length limit
      // NCBI eUtils has ~2000 character URL limit. With 600 IDs, URL becomes too long.
      // Solution: Batch IDs in chunks of 200 per request (enterprise-grade pattern)
      //
      // Phase 10.115: PARALLEL BATCH PROCESSING
      // - Sequential processing: 40-50s for 300 papers (2 batches × 25s each)
      // - Parallel processing: 20-25s for 300 papers (both batches simultaneously)
      // - NCBI rate limit: 3 req/sec without API key, 10 req/sec with API key
      // - We limit to 3 concurrent batches to respect rate limits

      const BATCH_SIZE = 200; // Optimal: balances request count vs URL length
      const MAX_CONCURRENT_BATCHES = 3; // NCBI rate limit safety
      const batches: string[][] = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        batches.push(ids.slice(i, i + BATCH_SIZE));
      }

      this.logger.log(
        `[PMC] Batching ${ids.length} IDs into ${batches.length} requests (${BATCH_SIZE} IDs per batch, max ${MAX_CONCURRENT_BATCHES} concurrent)`
      );

      // Phase 10.115: Parallel batch fetching with concurrency limit
      const fetchBatch = async (batch: string[], batchIndex: number): Promise<Paper[]> => {
        this.logger.log(
          `[PMC] Fetching batch ${batchIndex + 1}/${batches.length} (${batch.length} IDs)...`
        );

        try {
          // Phase 10.106 Phase 3: Use typed interface for fetch params
          const fetchParams: PMCFetchParams = {
            db: 'pmc',
            id: batch.join(','),
            retmode: 'xml',
            rettype: 'full',
          };

          // Phase 10.7.10: Add API key if configured
          if (this.apiKey) {
            fetchParams.api_key = this.apiKey;
          }

          // Phase 10.106 Phase 3: Execute with RetryService
          const fetchResult = await this.retry.executeWithRetry(
            async () => firstValueFrom(
              this.httpService.get(this.EFETCH_URL, {
                params: fetchParams,
                timeout: COMPLEX_API_TIMEOUT, // 15s
              }),
            ),
            'PMC.efetch',
            {
              maxAttempts: 3,
              initialDelayMs: 1000,
              maxDelayMs: 16000,
              backoffMultiplier: 2,
              jitterMs: 500,
            },
          );

          // Phase 10.106 Phase 3: Handle both direct data and wrapped AxiosResponse cases
          const rawXml = fetchResult.data;
          const xmlData = String((rawXml as any)?.data ?? rawXml);
          const articles = xmlData.match(/<article[\s\S]*?<\/article>/g) || [];

          const batchPapers = articles.map((article: string) => this.parsePaper(article));

          this.logger.log(
            `[PMC] Batch ${batchIndex + 1}/${batches.length} complete: ${batchPapers.length} papers parsed`
          );
          return batchPapers;
        } catch (batchError: unknown) {
          const err = batchError as { message?: string };
          this.logger.warn(
            `[PMC] ⚠️  Batch ${batchIndex + 1}/${batches.length} failed: ${err.message || 'Unknown error'}`
          );
          return []; // Return empty array for failed batch, don't block others
        }
      };

      // Phase 10.115: Execute batches in parallel with concurrency control
      const allPapers: Paper[] = [];

      // Process in chunks of MAX_CONCURRENT_BATCHES to respect rate limits
      for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
        const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
        const batchPromises = concurrentBatches.map((batch, idx) =>
          fetchBatch(batch, i + idx)
        );

        const results = await Promise.allSettled(batchPromises);

        for (const result of results) {
          if (result.status === 'fulfilled') {
            allPapers.push(...result.value);
          }
        }
      }

      this.logger.log(`[PMC] All batches complete: ${allPapers.length} total papers with full-text`);

      // ========================================================================
      // STEP 3: Parse XML response (COMPLETED IN BATCHES ABOVE)
      // ========================================================================
      const papers = allPapers;

      this.logger.log(`[PMC] Returned ${papers.length} papers with full-text`);
      return papers;
    } catch (error: unknown) {
      // Phase 10.106 Strict Mode: Use unknown with type narrowing
      const err = error as { response?: { status?: number }; message?: string };
      // Enterprise-grade error handling: Log but don't throw (graceful degradation)
      if (err.response?.status === 429) {
        this.logger.error(`[PMC] ⚠️  RATE LIMITED (429) - Too many requests`);
      } else {
        this.logger.error(
          `[PMC] Search failed: ${err.message || 'Unknown error'} (Status: ${err.response?.status || 'N/A'})`,
        );
      }
      return [];
    }
  }

  /**
   * Parse PMC XML article into Paper object with full-text content
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To extract new sections: Add regex patterns in STEP 5 (line 264)
   * - To change full-text structure: Modify section concatenation logic
   * - To add metadata fields: Add regex patterns in STEP 1-3
   * - To calculate full-text word count: Add logic in STEP 8 (line 310)
   *
   * 📊 PARSING STEPS:
   * 1. Core metadata (PMC ID, PMID, title, journal)
   * 2. Authors and affiliations
   * 3. DOI extraction
   * 4. Abstract extraction
   * 5. Full-text section extraction (Methods, Results, Discussion)
   * 6. PDF URL construction
   * 7. Open Access status detection
   * 8. Word counts and quality scoring
   *
   * 🔍 XML PARSING STRATEGY:
   * Using regex for lightweight parsing (alternative to full XML parser)
   * Trade-off: Fast and simple, but may miss edge cases in malformed XML
   * 📝 TO USE FULL XML PARSER: Replace regex with 'fast-xml-parser' library
   *
   * @param article Raw XML string for single PMC article
   * @returns Normalized Paper object with full-text content
   */
  private parsePaper(article: string): Paper {
    // ==========================================================================
    // STEP 1: Extract core metadata
    // ==========================================================================
    // 📝 TO EXTRACT MORE FIELDS: Add regex patterns here
    const pmcId =
      article.match(/<article-id pub-id-type="pmc">(.*?)<\/article-id>/)?.[1] || '';
    const pmid =
      article.match(/<article-id pub-id-type="pmid">(.*?)<\/article-id>/)?.[1] || '';
    const doi =
      article.match(/<article-id pub-id-type="doi">(.*?)<\/article-id>/)?.[1] || '';

    // Extract title (may be in article-title or title-group)
    const title =
      article.match(/<article-title>(.*?)<\/article-title>/)?.[1] ||
      article.match(/<title>(.*?)<\/title>/)?.[1] ||
      '';

    // Extract journal name
    const venue =
      article.match(/<journal-title>(.*?)<\/journal-title>/)?.[1] ||
      article.match(/<journal-id[^>]*>(.*?)<\/journal-id>/)?.[1] ||
      '';

    // Extract publication year
    const yearMatch = article.match(/<pub-date[^>]*>[\s\S]*?<year>(.*?)<\/year>/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    // ==========================================================================
    // STEP 2: Extract authors
    // ==========================================================================
    // 📝 TO HANDLE COLLECTIVE AUTHORS: Add <collab> parsing
    const contributorMatches =
      article.match(/<contrib[^>]*contrib-type="author"[^>]*>[\s\S]*?<\/contrib>/g) || [];
    const authors = contributorMatches.map((contrib: string) => {
      const givenName = contrib.match(/<given-names>(.*?)<\/given-names>/)?.[1] || '';
      const surname = contrib.match(/<surname>(.*?)<\/surname>/)?.[1] || '';
      return `${givenName} ${surname}`.trim();
    });

    // ==========================================================================
    // STEP 3: Extract DOI (if not found in article-id)
    // ==========================================================================
    if (!doi) {
      // Already extracted above
    }

    // ==========================================================================
    // STEP 4: Extract abstract
    // ==========================================================================
    // 📝 TO HANDLE STRUCTURED ABSTRACTS: Parse <sec> tags within <abstract>
    const abstractMatch = article.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/);
    let abstract = '';
    if (abstractMatch) {
      // Remove XML tags from abstract
      abstract = abstractMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // ==========================================================================
    // STEP 5: Extract full-text sections (Methods, Results, Discussion)
    // ==========================================================================
    // 📝 TO ADD MORE SECTIONS: Add additional regex patterns here
    // 📝 TO CHANGE SECTION DETECTION: Modify section title regex patterns

    const bodyMatch = article.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    let fullTextContent = '';

    if (bodyMatch) {
      const body = bodyMatch[1];

      // Extract sections by common headings
      const sections = [
        { name: 'Introduction', regex: /<sec[^>]*>[\s\S]*?<title>Introduction<\/title>[\s\S]*?<\/sec>/ },
        { name: 'Methods', regex: /<sec[^>]*>[\s\S]*?<title>(Methods|Materials and Methods|Methodology)<\/title>[\s\S]*?<\/sec>/i },
        { name: 'Results', regex: /<sec[^>]*>[\s\S]*?<title>Results<\/title>[\s\S]*?<\/sec>/i },
        { name: 'Discussion', regex: /<sec[^>]*>[\s\S]*?<title>Discussion<\/title>[\s\S]*?<\/sec>/i },
      ];

      const extractedSections: string[] = [];

      sections.forEach(section => {
        const match = body.match(section.regex);
        if (match) {
          // Remove XML tags and clean text
          const sectionText = match[0]
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          extractedSections.push(`${section.name}: ${sectionText}`);
        }
      });

      // If no structured sections found, extract entire body
      if (extractedSections.length === 0) {
        fullTextContent = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        fullTextContent = extractedSections.join('\n\n');
      }
    }

    // ==========================================================================
    // STEP 6: Construct PDF URL
    // ==========================================================================
    // PMC Open Access articles have predictable PDF URLs
    const pdfUrl = pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/` : undefined;

    // ==========================================================================
    // STEP 7: Detect Open Access status
    // ==========================================================================
    // If we have full-text content, it's Open Access
    const hasFullText = !!fullTextContent && fullTextContent.length > 100;
    const openAccessStatus = hasFullText ? 'OPEN_ACCESS' : undefined;

    // ==========================================================================
    // STEP 8: Calculate word counts for content depth analysis
    // ==========================================================================
    // 📝 TO CHANGE WORD COUNTING: Modify word-count.util.ts functions
    const abstractWordCount = calculateAbstractWordCount(abstract);

    // For PMC, we have BOTH abstract and full-text
    // Comprehensive word count = title + abstract + full-text
    const titleAndAbstractWordCount = calculateComprehensiveWordCount(
      title.trim(),
      abstract.trim(),
    );
    const fullTextWordCount = fullTextContent
      ? fullTextContent.split(/\s+/).filter(w => w.length > 0).length
      : 0;
    const wordCount = titleAndAbstractWordCount + fullTextWordCount;
    const wordCountExcludingRefs = wordCount; // Already excludes references in section extraction

    // ==========================================================================
    // STEP 9: Calculate quality score (0-100 scale)
    // ==========================================================================
    // 📝 TO CHANGE QUALITY ALGORITHM: Modify paper-quality.util.ts
    // Note: citationCount is undefined (PMC doesn't provide), but high word count boosts quality
    const qualityComponents = calculateQualityScore({
      citationCount: undefined, // PMC doesn't provide citation counts
      year,
      wordCount, // High word count (full-text) significantly boosts quality score
      venue,
      source: LiteratureSource.PMC,
      impactFactor: undefined,
      sjrScore: undefined,
      quartile: undefined,
      hIndexJournal: undefined,
    });

    // ==========================================================================
    // STEP 10: Construct normalized Paper object
    // ==========================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    return {
      // Core identification
      id: pmcId || pmid || doi || `pmc-${Date.now()}`,
      title: title.trim(),
      authors,
      year,
      abstract: abstract.trim(),

      // External identifiers
      doi: doi || undefined,
      pmid: pmid || undefined,
      url: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/` : undefined,

      // Publication metadata
      venue,
      // citationCount: undefined (PMC doesn't provide)
      source: LiteratureSource.PMC,

      // Content metrics
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount, 150),
      abstractWordCount,

      // Full-text content (PMC's unique value)
      fullText: fullTextContent || undefined,
      fullTextWordCount: fullTextWordCount > 0 ? fullTextWordCount : undefined,
      hasFullText,
      fullTextStatus: hasFullText ? 'available' : 'not_fetched',
      fullTextSource: hasFullText ? 'pmc' : undefined,

      // PDF availability
      pdfUrl,
      hasPdf: !!pdfUrl,
      openAccessStatus,

      // Quality metrics
      citationsPerYear: 0, // No citation data from PMC
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
    };
  }

  /**
   * Check if PMC service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
