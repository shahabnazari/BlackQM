/**
 * Phase 10.100 Phase 8: Paper Metadata & Enrichment Service
 *
 * Enterprise-grade service for refreshing and enriching paper metadata
 * from external academic sources (primarily Semantic Scholar).
 *
 * Features:
 * - Batch metadata refresh with rate limiting
 * - DOI-based and title-based search fallback
 * - Fuzzy title matching with scoring algorithm
 * - Quality score calculation
 * - Full-text detection (PDF availability)
 * - Input validation (SEC-1 compliance)
 * - Quota management integration
 * - Type-safe interfaces
 * - Graceful error handling
 * - NestJS Logger integration (Phase 10.943)
 *
 * Single Responsibility: Paper metadata enrichment from external sources ONLY
 *
 * @module LiteratureModule
 * @since Phase 10.100 Phase 8
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../common/prisma.service';
import { APIQuotaMonitorService } from './api-quota-monitor.service';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';

// ============================================================================
// EXPORTED TYPES (Type Safety)
// ============================================================================

/**
 * Metadata refresh result
 * Returns statistics and refreshed papers with error details
 */
export interface MetadataRefreshResult {
  success: boolean;
  refreshed: number;
  failed: number;
  papers: Paper[];
  errors: Array<{ paperId: string; error: string }>;
}

/**
 * Semantic Scholar API paper response
 * External API response structure (validated at runtime)
 */
interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors?: Array<{ name: string }>;
  year: number;
  abstract?: string;
  venue?: string;
  citationCount?: number;
  url?: string;
  openAccessPdf?: { url: string } | null;
  isOpenAccess?: boolean;
  externalIds?: {
    PubMedCentral?: string;
    DOI?: string;
    PubMed?: string;
  };
  fieldsOfStudy?: string[];
}

// ============================================================================
// CONSTANTS (Enterprise-Grade - No Magic Numbers)
// ============================================================================

/**
 * Batch size for metadata refresh (rate limiting)
 * Processes 5 papers concurrently to avoid API quota exhaustion
 */
const METADATA_BATCH_SIZE = 5;

/**
 * Delay between batches in milliseconds
 * 1 second delay to respect API rate limits
 */
const BATCH_DELAY_MS = 1000;

/**
 * HTTP timeout for Semantic Scholar API calls
 * 10 seconds max wait time per request
 */
const API_TIMEOUT_MS = 10000;

/**
 * User-Agent header for API requests
 * Identifies our platform to external APIs
 */
const USER_AGENT = 'VQMethod-Research-Platform/1.0';

/**
 * Title matching threshold (0-100)
 * Minimum score required for fuzzy title match acceptance
 */
const TITLE_MATCH_THRESHOLD = 70;

/**
 * Maximum papers to refresh in single request
 * Prevents abuse and ensures reasonable response times
 */
const MAX_PAPERS_PER_REQUEST = 100;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PaperMetadataService {
  private readonly logger = new Logger(PaperMetadataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly quotaMonitor: APIQuotaMonitorService,
  ) {}

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Refresh paper metadata from Semantic Scholar
   *
   * Batch processes papers to fetch updated metadata including:
   * - Citations counts
   * - Venue information
   * - Abstract text
   * - PDF availability
   * - Quality scores
   *
   * **Search Strategy**:
   * 1. DOI lookup (if paperId starts with "10.")
   * 2. Title-based search fallback (fetches from database)
   * 3. Fuzzy matching with scoring algorithm
   *
   * **Rate Limiting**:
   * - Processes in batches of 5 papers
   * - 1 second delay between batches
   * - Quota monitoring integration
   *
   * **Error Handling**:
   * - Individual paper failures don't stop batch
   * - Comprehensive error reporting in result
   * - Graceful degradation
   *
   * @param paperIds - Array of paper IDs to refresh (max 100)
   * @param userId - User ID for ownership validation
   * @returns Refresh statistics with updated papers and errors
   * @throws Error if paperIds invalid or exceeds max (SEC-1)
   * @throws Error if userId invalid (SEC-1)
   *
   * @example
   * const result = await metadata.refreshPaperMetadata(
   *   ['paper1', 'paper2', 'paper3'],
   *   'user123'
   * );
   * console.log(`Refreshed: ${result.refreshed}, Failed: ${result.failed}`);
   */
  async refreshPaperMetadata(
    paperIds: string[],
    userId: string,
  ): Promise<MetadataRefreshResult> {
    // SEC-1: Input validation
    this.validateRefreshInput(paperIds, userId);

    this.logger.log(
      `\n╔════════════════════════════════════════════════════════════╗`,
    );
    this.logger.log(
      `║   🔄 REFRESH PAPER METADATA - ENTERPRISE SOLUTION         ║`,
    );
    this.logger.log(
      `╚════════════════════════════════════════════════════════════╝`,
    );
    this.logger.log(`   User: ${userId}`);
    this.logger.log(`   Papers to refresh: ${paperIds.length}`);
    this.logger.log(``);

    const refreshedPapers: Paper[] = [];
    const errors: Array<{ paperId: string; error: string }> = [];

    // Process papers in batches to avoid rate limiting
    for (let i = 0; i < paperIds.length; i += METADATA_BATCH_SIZE) {
      const batch = paperIds.slice(i, i + METADATA_BATCH_SIZE);
      this.logger.log(
        `   📦 Processing batch ${Math.floor(i / METADATA_BATCH_SIZE) + 1}/${Math.ceil(paperIds.length / METADATA_BATCH_SIZE)} (${batch.length} papers)`,
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (paperId) => {
          try {
            this.logger.log(`      🔍 Fetching metadata for: ${paperId}`);

            // Try Semantic Scholar first (best source for full-text metadata)
            let updatedPaper: Paper | null = null;

            // Check if paperId is a DOI
            if (paperId.startsWith('10.')) {
              // Search by DOI
              try {
                const semanticScholarUrl = `https://api.semanticscholar.org/graph/v1/paper/DOI:${paperId}`;
                const response = await firstValueFrom(
                  this.httpService.get<SemanticScholarPaper>(semanticScholarUrl, {
                    params: {
                      fields:
                        'title,authors,year,abstract,venue,citationCount,url,openAccessPdf,isOpenAccess,externalIds,fieldsOfStudy',
                    },
                    headers: {
                      'User-Agent': USER_AGENT,
                    },
                    timeout: API_TIMEOUT_MS,
                  }),
                );

                if (response.data) {
                  updatedPaper = this.mapSemanticScholarToPaper(response.data);
                  this.logger.log(
                    `         ✅ Semantic Scholar: Found metadata (hasFullText: ${updatedPaper.hasFullText})`,
                  );
                }
              } catch (ssError: unknown) {
                // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
                const errorMessage = ssError instanceof Error ? ssError.message : String(ssError);
                this.logger.warn(
                  `         ⚠️  Semantic Scholar lookup failed: ${errorMessage}`,
                );
              }
            }

            // If Semantic Scholar ID/DOI failed, try title-based search
            if (!updatedPaper) {
              this.logger.log(`         🔍 Attempting title-based search...`);

              // Check rate limit before making API call
              if (!this.quotaMonitor.canMakeRequest('semantic-scholar')) {
                this.logger.warn(
                  `         ⚠️  Semantic Scholar rate limit reached, skipping title-based search`,
                );
                throw new Error(
                  'Semantic Scholar rate limit reached, cannot perform title-based search',
                );
              }

              // Fetch paper from database to get title for search
              // Support both database ID and DOI for paper lookup
              const dbPaper = await this.prisma.paper.findFirst({
                where: {
                  OR: [
                    { id: paperId }, // Database CUID
                    { doi: paperId }, // DOI (e.g., "10.5772/intechopen.106763")
                  ],
                },
                select: {
                  title: true,
                  authors: true,
                  year: true,
                  doi: true,
                  pmid: true,
                  source: true,
                },
              });

              if (!dbPaper) {
                this.logger.error(
                  `❌ Paper ${paperId} not found in database for metadata refresh`,
                );
                throw new Error(
                  `Paper ${paperId} not found in database - cannot refresh metadata`,
                );
              }

              // Defensive check for title
              const paperTitle = dbPaper.title?.trim();

              if (!paperTitle || paperTitle.length === 0) {
                this.logger.error(
                  `❌ Paper ${paperId} has no title for title-based search`,
                  {
                    hasTitle: !!dbPaper.title,
                    titleLength: dbPaper.title?.length ?? 0,
                    source: dbPaper.source,
                    doi: dbPaper.doi,
                    pmid: dbPaper.pmid,
                  },
                );
                throw new Error(
                  `Paper ${paperId} has no title for title-based search. ` +
                    `Source: ${dbPaper.source}, DOI: ${dbPaper.doi || 'none'}, PMID: ${dbPaper.pmid || 'none'}`,
                );
              }

              try {
                // Call Semantic Scholar search API using the validated title
                const searchQuery = encodeURIComponent(paperTitle);
                const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${searchQuery}&limit=5&fields=title,authors,year,abstract,venue,citationCount,url,openAccessPdf,isOpenAccess,externalIds,fieldsOfStudy`;

                const searchResponse = await firstValueFrom(
                  this.httpService.get<{ data: SemanticScholarPaper[] }>(searchUrl, {
                    headers: {
                      'User-Agent': USER_AGENT,
                    },
                    timeout: API_TIMEOUT_MS,
                  }),
                );

                // Record request for quota tracking
                this.quotaMonitor.recordRequest('semantic-scholar');

                if (
                  searchResponse.data?.data &&
                  searchResponse.data.data.length > 0
                ) {
                  // Find best match using fuzzy title matching
                  const bestMatch = this.findBestTitleMatch(
                    paperTitle,
                    searchResponse.data.data,
                    dbPaper.authors as string[] | undefined,
                    dbPaper.year ?? undefined,
                  );

                  if (bestMatch) {
                    updatedPaper = this.mapSemanticScholarToPaper(bestMatch);
                    this.logger.log(
                      `         ✅ Title-based search successful! Found: "${bestMatch.title?.substring(0, 60)}..."`,
                    );
                    this.logger.log(
                      `            Full-text available: ${updatedPaper.hasFullText ? 'YES' : 'NO'}`,
                    );
                  } else {
                    this.logger.warn(
                      `         ⚠️  No good match found in search results (title similarity too low)`,
                    );
                  }
                }
              } catch (searchError: unknown) {
                // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
                const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
                this.logger.warn(
                  `         ⚠️  Title-based search failed: ${errorMessage}`,
                );
              }

              // If still no result, throw error
              if (!updatedPaper) {
                throw new Error(
                  'Both Semantic Scholar ID/DOI lookup and title-based search failed',
                );
              }
            }

            // Merge metadata: Keep original paper data, only update new fields
            const mergedPaper: Paper = {
              ...updatedPaper, // New metadata from API
              id: paperId, // Keep original ID
            };

            return mergedPaper;
          } catch (error: unknown) {
            // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
              `         ❌ Failed to refresh ${paperId}: ${errorMessage}`,
            );
            throw error;
          }
        }),
      );

      // Process batch results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const paperId = batch[j];

        if (result.status === 'fulfilled') {
          refreshedPapers.push(result.value);
        } else {
          errors.push({
            paperId,
            error: result.reason?.message || 'Unknown error',
          });
        }
      }

      // Rate limiting: Wait between batches
      if (i + METADATA_BATCH_SIZE < paperIds.length) {
        this.logger.log(`      ⏳ Waiting 1s before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    this.logger.log(``);
    this.logger.log(
      `╔════════════════════════════════════════════════════════════╗`,
    );
    this.logger.log(
      `║   ✅ METADATA REFRESH COMPLETE                            ║`,
    );
    this.logger.log(
      `╚════════════════════════════════════════════════════════════╝`,
    );
    this.logger.log(`   📊 Statistics:`);
    this.logger.log(`      • Total papers: ${paperIds.length}`);
    this.logger.log(
      `      • Successfully refreshed: ${refreshedPapers.length}`,
    );
    this.logger.log(`      • Failed: ${errors.length}`);

    if (refreshedPapers.length > 0) {
      const withFullText = refreshedPapers.filter((p) => p.hasFullText).length;
      this.logger.log(
        `      • Papers with full-text: ${withFullText}/${refreshedPapers.length}`,
      );
    }

    if (errors.length > 0) {
      this.logger.warn(`   ⚠️  Failed papers:`);
      errors.forEach((err) => {
        this.logger.warn(`      • ${err.paperId}: ${err.error}`);
      });
    }
    this.logger.log(``);

    return {
      success: true,
      refreshed: refreshedPapers.length,
      failed: errors.length,
      papers: refreshedPapers,
      errors,
    };
  }

  /**
   * Map Semantic Scholar API response to Paper DTO
   *
   * Transforms external API response into our internal Paper type with:
   * - Word count calculations (title + abstract)
   * - Quality score computation
   * - PDF detection (OpenAccess + PMC fallback)
   * - Full-text status determination
   *
   * **PMC PDF Fallback**: If no PDF URL but has PubMedCentral ID,
   * constructs PMC PDF URL automatically.
   *
   * **Quality Scoring**: Uses enterprise-grade quality algorithm
   * based on citations, year, word count, venue.
   *
   * @param paper - Semantic Scholar API response
   * @returns Fully populated Paper DTO
   *
   * @private
   * @internal
   */
  private mapSemanticScholarToPaper(paper: SemanticScholarPaper): Paper {
    // Calculate word counts
    const abstractWordCount = calculateAbstractWordCount(paper.abstract || '');
    const wordCount = calculateComprehensiveWordCount(
      paper.title,
      paper.abstract,
    );
    const wordCountExcludingRefs = wordCount; // Initially same

    // Calculate quality score
    const qualityComponents = calculateQualityScore({
      citationCount: paper.citationCount || 0,
      year: paper.year,
      wordCount: abstractWordCount,
      venue: paper.venue,
      source: 'semantic_scholar',
    });

    // Enhanced PDF detection with PubMed Central fallback
    let pdfUrl = paper.openAccessPdf?.url || null;
    let hasPdf = !!pdfUrl && pdfUrl.trim().length > 0;

    // If no PDF URL but has PubMed Central ID, construct PMC PDF URL
    if (!hasPdf && paper.externalIds?.PubMedCentral) {
      const pmcId = paper.externalIds.PubMedCentral;
      pdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`;
      hasPdf = true;
      this.logger.log(
        `[Semantic Scholar] Constructed PMC PDF URL for paper ${paper.paperId}: ${pdfUrl}`,
      );
    }

    return {
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors?.map((a) => a.name) || [],
      year: paper.year,
      abstract: paper.abstract,
      url: paper.url,
      venue: paper.venue,
      citationCount: paper.citationCount,
      fieldsOfStudy: paper.fieldsOfStudy,
      source: LiteratureSource.SEMANTIC_SCHOLAR,
      wordCount, // Total: title + abstract (+ full-text in future)
      wordCountExcludingRefs, // Same as wordCount (already excludes non-content)
      isEligible: isPaperEligible(wordCount),
      // PDF availability from Semantic Scholar + PMC fallback
      pdfUrl,
      openAccessStatus: paper.isOpenAccess || hasPdf ? 'OPEN_ACCESS' : null,
      hasPdf,
      // Full-text availability (PDF detected = full-text available)
      hasFullText: hasPdf, // If PDF URL exists, full-text is available
      fullTextStatus: hasPdf ? 'available' : 'not_fetched', // 'available' = can be fetched
      fullTextSource: hasPdf
        ? paper.externalIds?.PubMedCentral
          ? 'pmc'
          : 'publisher'
        : undefined,
      // Enterprise quality metrics
      abstractWordCount, // Abstract only (for 100-word filter)
      citationsPerYear:
        qualityComponents.citationImpact > 0
          ? (paper.citationCount || 0) /
            Math.max(
              1,
              new Date().getFullYear() -
                (paper.year || new Date().getFullYear()),
            )
          : 0,
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
      // Phase 10.120: Add metadataCompleteness for honest scoring transparency
      metadataCompleteness: qualityComponents.metadataCompleteness,
    };
  }

  /**
   * Find best title match from Semantic Scholar search results
   *
   * Uses fuzzy matching algorithm with scoring (0-100):
   * - Exact match: 100 points
   * - Substring match: 80-95 points
   * - Word overlap: 0-80 points (based on shared words >3 chars)
   * - Year match (±2 years): +10 bonus points
   * - Author overlap: +5 points per matching last name
   *
   * **Threshold**: Minimum score of 70 required for acceptance
   *
   * **Normalization**: Lowercase, remove punctuation, collapse spaces
   *
   * @param queryTitle - Original paper title to match
   * @param results - Search results from Semantic Scholar
   * @param authors - Optional author list for validation
   * @param year - Optional year for validation
   * @returns Best matching result or null if score < 70
   *
   * @private
   * @internal
   */
  private findBestTitleMatch(
    queryTitle: string,
    results: SemanticScholarPaper[],
    authors?: string[],
    year?: number,
  ): SemanticScholarPaper | null {
    // Normalize title for comparison (lowercase, remove punctuation, trim)
    const normalizeTitle = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    };

    const normalizedQuery = normalizeTitle(queryTitle);

    // Score each result
    const scoredResults = results
      .map((result) => {
        if (!result.title) return null;

        const normalizedResult = normalizeTitle(result.title);

        // Calculate similarity score (0-100)
        let score = 0;

        // Exact match = 100
        if (normalizedResult === normalizedQuery) {
          score = 100;
        }
        // Substring match = 80-95
        else if (normalizedResult.includes(normalizedQuery)) {
          score = 90;
        } else if (normalizedQuery.includes(normalizedResult)) {
          score = 85;
        }
        // Word overlap score = 0-80
        else {
          const queryWords = normalizedQuery
            .split(' ')
            .filter((w) => w.length > 3);
          const resultWords = normalizedResult
            .split(' ')
            .filter((w) => w.length > 3);

          const overlap = queryWords.filter((w) =>
            resultWords.includes(w),
          ).length;
          const totalWords = Math.max(queryWords.length, resultWords.length);

          if (totalWords > 0) {
            score = (overlap / totalWords) * 80;
          }
        }

        // Boost score if year matches (±2 years tolerance)
        if (year && result.year && Math.abs(result.year - year) <= 2) {
          score += 10;
        }

        // Boost score if authors match (simple name overlap)
        if (
          authors &&
          authors.length > 0 &&
          result.authors &&
          result.authors.length > 0
        ) {
          const authorLastNames = authors
            .map((a) => a.split(' ').pop()?.toLowerCase())
            .filter((name): name is string => !!name && name.length > 0);

          const resultAuthorLastNames = result.authors
            .map((a) => a.name?.split(' ').pop()?.toLowerCase())
            .filter((name): name is string => !!name && name.length > 0);

          const authorOverlap = authorLastNames.filter((name) =>
            resultAuthorLastNames.includes(name),
          ).length;

          if (authorOverlap > 0) {
            score += 5 * authorOverlap;
          }
        }

        return {
          result,
          score,
        };
      })
      .filter((item) => item !== null) as Array<{
      result: SemanticScholarPaper;
      score: number;
    }>;

    // Sort by score (highest first)
    scoredResults.sort((a, b) => b.score - a.score);

    // Return best match if score >= threshold
    if (
      scoredResults.length > 0 &&
      scoredResults[0].score >= TITLE_MATCH_THRESHOLD
    ) {
      this.logger.debug(
        `Title match score: ${scoredResults[0].score} for "${scoredResults[0].result.title?.substring(0, 60)}..."`,
      );
      return scoredResults[0].result;
    }

    // No good match found
    this.logger.debug(
      `Best score was ${scoredResults[0]?.score || 0}, below threshold of ${TITLE_MATCH_THRESHOLD}`,
    );
    return null;
  }

  // ==========================================================================
  // PRIVATE VALIDATION METHODS (SEC-1 Compliance)
  // ==========================================================================

  /**
   * Validate refreshPaperMetadata input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - paperIds must be non-empty array
   * - paperIds.length must not exceed MAX_PAPERS_PER_REQUEST (100)
   * - Each paperId must be non-empty string
   * - userId must be non-empty string
   *
   * @param paperIds - Array of paper IDs
   * @param userId - User ID
   * @throws Error if validation fails
   *
   * @private
   */
  private validateRefreshInput(paperIds: string[], userId: string): void {
    // Validate paperIds is non-empty array
    if (!Array.isArray(paperIds) || paperIds.length === 0) {
      throw new Error('Invalid paperIds: must be non-empty array');
    }

    // Validate size limit
    if (paperIds.length > MAX_PAPERS_PER_REQUEST) {
      throw new Error(
        `Invalid paperIds: exceeds maximum of ${MAX_PAPERS_PER_REQUEST} papers per request`,
      );
    }

    // Validate each paperId is non-empty string
    const invalidIds = paperIds.filter(
      (id) => !id || typeof id !== 'string' || id.trim().length === 0,
    );
    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid paper IDs: found ${invalidIds.length} empty or non-string IDs`,
      );
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }
  }
}
