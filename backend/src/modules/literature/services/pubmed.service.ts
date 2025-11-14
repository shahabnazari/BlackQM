/**
 * PubMed Service
 * Phase 10.6 Day 3.5: Extracted from literature.service.ts (lines 699-905)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service was extracted from a 4,046-line God class (literature.service.ts)
 * following the same clean pattern as semantic-scholar.service.ts and crossref.service.ts.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - 208 lines of inline implementation in literature.service.ts
 * - Complex XML parsing, MeSH terms, OpenAlex enrichment all embedded
 * - Impossible to unit test in isolation
 * - PubMed-specific logic scattered across orchestration layer
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for other features (citation enrichment, MeSH analysis)
 * - literature.service.ts only contains thin 15-line wrapper
 *
 * ⚠️ COMPLEXITY NOTE:
 * PubMed is the most complex source integration due to:
 * 1. Two-step API workflow (esearch → efetch)
 * 2. XML response parsing (200+ lines of regex parsing)
 * 3. Rich metadata extraction (MeSH terms, affiliations, grants)
 * 4. OpenAlex citation enrichment integration
 * 5. PMC (PubMed Central) full-text linking
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY PUBMED INTEGRATION:
 * ✅ DO: Modify THIS file (pubmed.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchPubMed() method
 * ❌ DON'T: Inline XML parsing or HTTP calls anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Extract additional XML fields → Update parsePaper() method
 * - Add PMC full-text linking → Add logic in PDF detection step
 * - Change OpenAlex enrichment → Update enrichCitationsFromOpenAlex() method
 * - Add custom search filters → Modify searchParams object in search() method
 * - Add MeSH term validation → Add validation in MeSH extraction step
 *
 * WRAPPER METHOD (literature.service.ts):
 * Should remain a thin 15-line wrapper that only handles orchestration
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles PubMed/NCBI E-utilities API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used for citation analysis, MeSH research
 * 8. Maintainability: All PubMed logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 36M+ biomedical citations (MEDLINE, life sciences, PubMed Central)
 * API: Free, no key required (3 requests/second limit, 10/second with API key)
 * Features:
 * - Rich biomedical metadata (MeSH terms, publication types)
 * - Author affiliations and institutional data
 * - Grant information (NIH, other funding agencies)
 * - OpenAlex citation enrichment (automatic)
 * - PMC full-text linking (when available)
 * - DOI, PMID, PMC ID cross-referencing
 *
 * @see https://www.ncbi.nlm.nih.gov/books/NBK25501/ (E-utilities Guide)
 * @see https://api.openalex.org/ (Citation enrichment)
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { COMPLEX_API_TIMEOUT, ENRICHMENT_TIMEOUT } from '../constants/http-config.constants';

export interface PubMedSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

/**
 * MeSH (Medical Subject Headings) term structure
 * Used for precise biomedical concept tagging
 */
interface MeshTerm {
  descriptor: string;
  qualifiers: string[];
}

/**
 * Author affiliation data
 */
interface AuthorAffiliation {
  author: string;
  affiliation: string;
}

/**
 * Grant/funding information
 */
interface Grant {
  grantId: string | null;
  agency: string | null;
  country: string | null;
}

@Injectable()
export class PubMedService {
  private readonly logger = new Logger(PubMedService.name);
  private readonly ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  private readonly EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
  private readonly OPENALEX_BASE_URL = 'https://api.openalex.org/works';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search PubMed database using NCBI E-utilities
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add search filters: Update searchParams object (line 161)
   * - To change result limit: Modify retmax parameter (line 165)
   * - To add date filters: Add mindate/maxdate params
   * - To optimize enrichment: Modify enrichCitationsFromOpenAlex() (line 310+)
   *
   * 🔄 TWO-STEP API WORKFLOW:
   * Step 1: esearch - Get list of PubMed IDs matching query
   * Step 2: efetch - Fetch full metadata for those IDs as XML
   *
   * @param query Search query string (supports PubMed query syntax)
   * @param options Search filters (year range, limit)
   * @returns Array of Paper objects enriched with OpenAlex citations
   */
  async search(
    query: string,
    options?: PubMedSearchOptions,
  ): Promise<Paper[]> {
    try {
      this.logger.log(`[PubMed] Searching: "${query}"`);

      // ========================================================================
      // STEP 1: Search for PubMed IDs using esearch
      // ========================================================================
      // 📝 TO ADD FILTERS: Update searchParams object below
      const searchParams = {
        db: 'pubmed',
        term: query,
        retmode: 'json',
        retmax: options?.limit || 20,
        // 📝 TO ADD DATE FILTER: Add mindate/maxdate parameters
        // Example: mindate: '2020/01/01', maxdate: '2023/12/31'
      };

      const searchResponse = await firstValueFrom(
        this.httpService.get(this.ESEARCH_URL, {
          params: searchParams,
          timeout: COMPLEX_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Increased from no timeout
        }),
      );

      const ids = searchResponse.data.esearchresult.idlist;
      if (!ids || ids.length === 0) {
        this.logger.log(`[PubMed] No results found`);
        return [];
      }

      this.logger.log(`[PubMed] Found ${ids.length} paper IDs, fetching metadata...`);

      // ========================================================================
      // STEP 2: Fetch full metadata using efetch (WITH BATCHING)
      // ========================================================================
      // Phase 10.7 Day 5: FIX HTTP 414 - Batch IDs to avoid URL length limit
      // NCBI eUtils has ~2000 character URL limit. With 600 IDs, URL becomes too long.
      // Solution: Batch IDs in chunks of 200 per request (enterprise-grade pattern)

      const BATCH_SIZE = 200; // Optimal: balances request count vs URL length
      const batches: string[][] = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        batches.push(ids.slice(i, i + BATCH_SIZE));
      }

      this.logger.log(
        `[PubMed] Batching ${ids.length} IDs into ${batches.length} requests (${BATCH_SIZE} IDs per batch)`
      );

      const allPapers: any[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.logger.log(
          `[PubMed] Fetching batch ${batchIndex + 1}/${batches.length} (${batch.length} IDs)...`
        );

        const fetchParams = {
          db: 'pubmed',
          id: batch.join(','),
          retmode: 'xml',
          rettype: 'abstract',
        };

        const fetchResponse = await firstValueFrom(
          this.httpService.get(this.EFETCH_URL, {
            params: fetchParams,
            timeout: COMPLEX_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Increased from no timeout
          }),
        );

        // Phase 10.7 Day 5: Parse XML response for this batch
        const xmlData = fetchResponse.data;
        const articles = xmlData.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

        const batchPapers = articles.map((article: string) => this.parsePaper(article));
        allPapers.push(...batchPapers);

        this.logger.log(
          `[PubMed] Batch ${batchIndex + 1}/${batches.length} complete: ${batchPapers.length} papers parsed`
        );
      }

      this.logger.log(`[PubMed] All batches complete: ${allPapers.length} total papers parsed`);

      // ========================================================================
      // STEP 3: Parse XML response (COMPLETED IN BATCHES ABOVE)
      // ========================================================================
      const papers = allPapers;

      // ========================================================================
      // STEP 4: Enrich with OpenAlex citations
      // ========================================================================
      // 📝 TO DISABLE ENRICHMENT: Comment out lines 208-215
      // 📝 TO CHANGE ENRICHMENT: Modify enrichCitationsFromOpenAlex() method
      this.logger.log(
        `[PubMed] Enriching ${papers.length} papers with citation data from OpenAlex...`,
      );
      const enrichedPapers = await this.enrichCitationsFromOpenAlex(papers);
      const enrichedCount = enrichedPapers.filter((p) => p.citationCount !== null).length;
      this.logger.log(
        `[PubMed] Successfully enriched ${enrichedCount}/${papers.length} papers with citation counts`,
      );
      this.logger.log(`[PubMed] Returned ${enrichedPapers.length} papers`);

      return enrichedPapers;
    } catch (error: any) {
      // Enterprise-grade error handling: Log but don't throw (graceful degradation)
      if (error.response?.status === 429) {
        this.logger.error(`[PubMed] ⚠️  RATE LIMITED (429) - Too many requests`);
      } else {
        this.logger.error(
          `[PubMed] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
        );
      }
      return [];
    }
  }

  /**
   * Parse PubMed XML article into Paper object
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To extract new XML tags: Add regex patterns in relevant sections below
   * - To change MeSH parsing: Modify STEP 6 (line 262)
   * - To add PMC linking: Modify STEP 3 (line 252) to extract PMC ID
   * - To change quality algorithm: Modify STEP 8 (line 295)
   *
   * 📊 PARSING STEPS:
   * 1. Core metadata (PMID, title, abstract, year)
   * 2. Authors
   * 3. DOI extraction
   * 4. MeSH terms (biomedical concepts)
   * 5. Publication types
   * 6. Author affiliations
   * 7. Grant information
   * 8. Word counts and quality scoring
   *
   * 🔍 XML PARSING STRATEGY:
   * Using regex for lightweight parsing (alternative to full XML parser)
   * Trade-off: Fast and simple, but may miss edge cases in malformed XML
   * 📝 TO USE FULL XML PARSER: Replace regex with 'fast-xml-parser' library
   *
   * @param article Raw XML string for single PubmedArticle
   * @returns Normalized Paper object following application schema
   */
  private parsePaper(article: string): Paper {
    // ==========================================================================
    // STEP 1: Extract core metadata
    // ==========================================================================
    // 📝 TO EXTRACT MORE FIELDS: Add regex patterns here
    const pmid = article.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || '';
    const title = article.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || '';
    const abstractText =
      article.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/)?.[1] || '';
    const year =
      article.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1] ||
      article.match(/<DateCompleted>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1] ||
      null;

    // ==========================================================================
    // STEP 2: Extract authors
    // ==========================================================================
    // 📝 TO HANDLE COLLECTIVE AUTHORS: Add <CollectiveName> parsing
    const authorMatches = article.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
    const authors = authorMatches.map((author: string) => {
      const lastName = author.match(/<LastName>(.*?)<\/LastName>/)?.[1] || '';
      const foreName = author.match(/<ForeName>(.*?)<\/ForeName>/)?.[1] || '';
      return `${foreName} ${lastName}`.trim();
    });

    // ==========================================================================
    // STEP 3: Extract DOI (Digital Object Identifier)
    // ==========================================================================
    // 📝 TO ADD PMC ID EXTRACTION: Add pattern for ArticleId IdType="pmc"
    const doi = article.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/)?.[1] || null;

    // ==========================================================================
    // STEP 4: Extract MeSH (Medical Subject Headings) terms
    // ==========================================================================
    // 📝 TO ADD MESH FILTERING: Add logic to filter by major topics only
    // Example: Check for MajorTopicYN="Y" attribute
    const meshHeadings = article.match(/<MeshHeading>[\s\S]*?<\/MeshHeading>/g) || [];
    const meshTerms: MeshTerm[] = meshHeadings
      .map((heading: string) => {
        const descriptor =
          heading.match(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/)?.[1] || '';
        const qualifiers =
          heading
            .match(/<QualifierName[^>]*>(.*?)<\/QualifierName>/g)
            ?.map(
              (q: string) =>
                q.match(/<QualifierName[^>]*>(.*?)<\/QualifierName>/)?.[1] || '',
            ) || [];
        return {
          descriptor: descriptor.trim(),
          qualifiers,
        };
      })
      .filter((term) => term.descriptor);

    // ==========================================================================
    // STEP 5: Extract publication types
    // ==========================================================================
    // 📝 TO FILTER PUBLICATION TYPES: Add logic to exclude certain types
    // Common types: Journal Article, Review, Clinical Trial, Meta-Analysis
    const pubTypeMatches =
      article.match(/<PublicationType[^>]*>(.*?)<\/PublicationType>/g) || [];
    const publicationType = pubTypeMatches
      .map(
        (type: string) =>
          type.match(/<PublicationType[^>]*>(.*?)<\/PublicationType>/)?.[1]?.trim() || '',
      )
      .filter(Boolean);

    // ==========================================================================
    // STEP 6: Extract author affiliations
    // ==========================================================================
    // 📝 TO PARSE INSTITUTIONAL HIERARCHY: Add logic to split affiliation string
    const affiliationMatches = authorMatches
      .map((author: string) => {
        const lastName = author.match(/<LastName>(.*?)<\/LastName>/)?.[1] || '';
        const foreName = author.match(/<ForeName>(.*?)<\/ForeName>/)?.[1] || '';
        const authorName = `${foreName} ${lastName}`.trim();
        const affiliation =
          author.match(/<Affiliation>(.*?)<\/Affiliation>/)?.[1]?.trim() || null;
        return affiliation ? { author: authorName, affiliation } : null;
      })
      .filter(Boolean) as AuthorAffiliation[];

    // ==========================================================================
    // STEP 7: Extract grant information
    // ==========================================================================
    // 📝 TO ADD GRANT VALIDATION: Add logic to verify grant IDs against databases
    const grantMatches = article.match(/<Grant>[\s\S]*?<\/Grant>/g) || [];
    const grants: Grant[] = grantMatches
      .map((grant: string) => {
        const grantId = grant.match(/<GrantID>(.*?)<\/GrantID>/)?.[1]?.trim() || null;
        const agency = grant.match(/<Agency>(.*?)<\/Agency>/)?.[1]?.trim() || null;
        const country = grant.match(/<Country>(.*?)<\/Country>/)?.[1]?.trim() || null;
        return { grantId, agency, country };
      })
      .filter((g) => g.grantId || g.agency);

    // ==========================================================================
    // STEP 8: Calculate word counts for content depth analysis
    // ==========================================================================
    // 📝 TO CHANGE WORD COUNTING: Modify word-count.util.ts functions
    const abstractWordCount = calculateAbstractWordCount(abstractText);
    const wordCount = calculateComprehensiveWordCount(title.trim(), abstractText.trim());
    const wordCountExcludingRefs = wordCount;
    const parsedYear = year ? parseInt(year) : null;

    // ==========================================================================
    // STEP 9: Calculate quality score (0-100 scale)
    // ==========================================================================
    // 📝 TO CHANGE QUALITY ALGORITHM: Modify paper-quality.util.ts
    // Note: citationCount is null here, will be enriched from OpenAlex later
    const qualityComponents = calculateQualityScore({
      citationCount: null, // Will be enriched from OpenAlex
      year: parsedYear,
      wordCount,
      venue: null, // PubMed doesn't provide journal name in basic search
      source: LiteratureSource.PUBMED,
      impactFactor: null,
      sjrScore: null,
      quartile: null,
      hIndexJournal: null,
    });

    // ==========================================================================
    // STEP 10: Construct normalized Paper object
    // ==========================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    return {
      // Core identification
      id: pmid,
      title: title.trim(),
      authors,
      year: parsedYear || undefined, // Convert null to undefined for optional fields
      abstract: abstractText.trim(),

      // External identifiers
      doi: doi || undefined, // Convert null to undefined
      pmid, // Critical for PMC full-text lookup
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,

      // Publication metadata
      // venue: undefined (not provided in basic PubMed response)
      // citationCount: undefined initially, will be enriched from OpenAlex
      source: LiteratureSource.PUBMED,

      // Content metrics
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount),
      abstractWordCount,

      // Quality metrics
      citationsPerYear: 0, // Will be recalculated after OpenAlex enrichment
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,

      // PubMed-specific rich metadata
      meshTerms: meshTerms.length > 0 ? meshTerms : undefined,
      publicationType: publicationType.length > 0 ? publicationType : undefined,
      authorAffiliations: affiliationMatches.length > 0 ? affiliationMatches : undefined,
      grants: grants.length > 0 ? grants : undefined,
    };
  }

  /**
   * Enrich papers with citation counts from OpenAlex API
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To change timeout: Modify timeout value (line 430)
   * - To add more OpenAlex fields: Parse additional fields from response
   * - To add fallback enrichment: Add try-catch for alternative APIs
   * - To batch requests: Group papers and use OpenAlex batch endpoint
   *
   * 🔄 ENRICHMENT STRATEGY:
   * 1. Only enrich papers with DOI but no citation count
   * 2. Query OpenAlex by DOI (format: https://doi.org/{doi})
   * 3. Extract cited_by_count from response
   * 4. Recalculate quality score with enriched data
   *
   * 📊 WHY OPENALEX:
   * - Free, open API (no key required)
   * - 250M+ works, comprehensive citation coverage
   * - More up-to-date than PubMed citation counts
   * - Provides additional metrics (h-index, impact factor)
   *
   * @param papers Array of papers to enrich
   * @returns Array of papers with enriched citation counts
   */
  private async enrichCitationsFromOpenAlex(papers: Paper[]): Promise<Paper[]> {
    const enrichedPapers = await Promise.all(
      papers.map(async (paper) => {
        // Only enrich if paper has DOI but no citation count
        if (!paper.doi || paper.citationCount !== null) {
          return paper;
        }

        try {
          // Query OpenAlex by DOI
          // 📝 TO ADD BATCH PROCESSING: Group papers and use POST /works endpoint
          const url = `${this.OPENALEX_BASE_URL}/https://doi.org/${paper.doi}`;
          const response = await firstValueFrom(
            this.httpService.get(url, {
              headers: {
                'User-Agent': 'BlackQMethod-Research-Platform',
              },
              timeout: ENRICHMENT_TIMEOUT, // 5s - Phase 10.6 Day 14.5: Increased from 3s for reliability
            }),
          );

          const citedByCount = response.data?.cited_by_count;
          if (typeof citedByCount === 'number') {
            this.logger.log(
              `[OpenAlex] Enriched "${paper.title.substring(0, 50)}...": ${citedByCount} citations`,
            );

            // Recalculate quality score with enriched citation data
            const citationsPerYear = paper.year
              ? citedByCount / Math.max(1, new Date().getFullYear() - paper.year)
              : 0;

            const qualityComponents = calculateQualityScore({
              citationCount: citedByCount,
              year: paper.year,
              wordCount: paper.wordCount,
              venue: paper.venue,
              source: paper.source,
              impactFactor: null,
              sjrScore: null,
              quartile: null,
              hIndexJournal: null,
            });

            return {
              ...paper,
              citationCount: citedByCount,
              citationsPerYear,
              qualityScore: qualityComponents.totalScore,
              isHighQuality: qualityComponents.totalScore >= 50,
            };
          }
        } catch (error: any) {
          // Silent failure for enrichment (don't block paper if enrichment fails)
          // 📝 TO LOG ENRICHMENT FAILURES: Change to this.logger.warn()
          this.logger.debug(
            `[OpenAlex] Failed to enrich "${paper.title.substring(0, 30)}...": ${error.message}`,
          );
        }

        return paper;
      }),
    );

    return enrichedPapers;
  }

  /**
   * Check if PubMed service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
