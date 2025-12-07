/**
 * Phase 10.100 Phase 9: Paper Database Service
 *
 * Enterprise-grade service for paper CRUD operations and database persistence.
 *
 * Features:
 * - Paper creation with duplicate detection
 * - User library retrieval with pagination
 * - Paper deletion with ownership enforcement
 * - Input validation (SEC-1 compliance)
 * - Type-safe database operations
 * - Graceful error handling
 * - NestJS Logger integration (Phase 10.943)
 * - Full-text extraction job queueing
 * - Public-user bypass logic
 *
 * Single Responsibility: Paper database persistence operations ONLY
 *
 * @module LiteratureModule
 * @since Phase 10.100 Phase 9
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { PDFQueueService } from './pdf-queue.service';
import { SavePaperDto } from '../dto/literature.dto';
import {
  type SanitizedPaperInput,
  toJsonStringArray,
  toJsonMeshTerms,
  toJsonAuthorAffiliations,
  toJsonGrants,
} from '../types/paper-save.types';

// ============================================================================
// EXPORTED TYPES (Type Safety)
// ============================================================================

/**
 * Paper save result
 * Returns success status and paper ID
 */
export interface PaperSaveResult {
  success: boolean;
  paperId: string;
}

/**
 * User library result
 * Returns paginated papers and total count
 */
export interface UserLibraryResult {
  papers: any[]; // Prisma paper select result (dynamic fields)
  total: number;
}

/**
 * Paper deletion result
 * Returns success status
 */
export interface PaperDeleteResult {
  success: boolean;
}

// ============================================================================
// CONSTANTS (Enterprise-Grade - No Magic Numbers)
// ============================================================================

/**
 * Special user ID for public/unauthenticated access
 * Operations with this user ID bypass database persistence
 */
const PUBLIC_USER_ID = 'public-user';

/**
 * Minimum pagination page number
 * Pages start at 1 (not 0)
 */
const MIN_PAGE = 1;

/**
 * Maximum items per page
 * Prevents excessive database load
 */
const MAX_LIMIT = 1000;

/**
 * Minimum items per page
 * At least 1 item must be requested
 */
const MIN_LIMIT = 1;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PaperDatabaseService {
  private readonly logger = new Logger(PaperDatabaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfQueueService: PDFQueueService,
  ) {}

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Save paper to database
   *
   * Saves a paper to the user's library with:
   * - Duplicate detection (DOI or title+year)
   * - Type-safe JSON field conversion
   * - Idempotent operation (returns existing ID if duplicate)
   * - Automatic full-text extraction queueing
   * - Public-user bypass (no database operation)
   *
   * **Duplicate Detection**:
   * - If DOI exists: checks for matching DOI
   * - If title+year exists: checks for matching title+year
   * - Returns existing paper ID if found (idempotent)
   *
   * **Full-Text Queueing**:
   * - Queues extraction if DOI, PMID, or URL present
   * - Fire-and-forget (doesn't block response)
   * - Retries failed extractions
   *
   * **Performance**: Single query for duplicate check (OR condition)
   * vs. 2 sequential queries
   *
   * @param saveDto - Paper data to save
   * @param userId - User ID who owns the paper
   * @returns Paper save result with paper ID
   * @throws BadRequestException if title is missing
   * @throws Error if database operation fails
   *
   * @example
   * const result = await paperDb.savePaper({
   *   title: 'Research Paper',
   *   authors: ['John Doe'],
   *   year: 2025,
   *   doi: '10.1234/example'
   * }, 'user123');
   * console.log(result.paperId); // 'clx...'
   */
  async savePaper(
    saveDto: SavePaperDto,
    userId: string,
  ): Promise<PaperSaveResult> {
    // SEC-1: Input validation
    this.validateSavePaperInput(saveDto, userId);

    try {
      this.logger.log(`Saving paper for user: ${userId}`);
      this.logger.debug('Paper data:', saveDto);

      // Public-user bypass: return mock success without database operation
      if (userId === PUBLIC_USER_ID) {
        this.logger.log('Public user save - returning mock success');
        return {
          success: true,
          paperId: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      // Phase 10.943: Pre-sanitize inputs (trim once, reuse everywhere)
      const sanitized: SanitizedPaperInput = {
        title: saveDto.title?.trim() || '',
        doi: saveDto.doi?.trim() || null,
        pmid: saveDto.pmid?.trim() || null,
        url: saveDto.url?.trim() || null,
      };

      // Combined duplicate check (single query instead of 2 sequential)
      // Uses composite index @@index([userId, title, year]) for performance
      const duplicateConditions: Array<{ doi: string } | { title: string; year: number }> = [];
      if (sanitized.doi) {
        duplicateConditions.push({ doi: sanitized.doi });
      }
      if (sanitized.title && saveDto.year) {
        duplicateConditions.push({ title: sanitized.title, year: saveDto.year });
      }

      let existingPaper = null;
      if (duplicateConditions.length > 0) {
        existingPaper = await this.prisma.paper.findFirst({
          where: {
            userId,
            OR: duplicateConditions,
          },
        });
        if (existingPaper) {
          const matchType = existingPaper.doi === sanitized.doi ? 'DOI' : 'title+year';
          this.logger.log(`Paper already exists (${matchType} match): ${existingPaper.id}`);
        }
      }

      // If paper exists, return existing ID (idempotent operation)
      if (existingPaper) {
        this.logger.log(`Returning existing paper ID: ${existingPaper.id}`);

        // Still queue for full-text if needed (also retry failed papers)
        if (
          (sanitized.doi || sanitized.pmid || sanitized.url) &&
          (existingPaper.fullTextStatus === 'not_fetched' ||
            existingPaper.fullTextStatus === 'failed')
        ) {
          this.logger.log(
            `🔍 Queueing full-text extraction for existing paper (status: ${existingPaper.fullTextStatus})`,
          );
          this.pdfQueueService.addJob(existingPaper.id).catch((err) => {
            this.logger.warn(`Failed to queue: ${err.message}`);
          });
        }

        return { success: true, paperId: existingPaper.id };
      }

      // Validate title presence (after sanitization)
      if (!sanitized.title) {
        this.logger.error('❌ Cannot save paper: title is required', {
          doi: sanitized.doi,
          pmid: sanitized.pmid,
          url: sanitized.url,
          hasTitle: !!saveDto.title,
          titleLength: saveDto.title?.length ?? 0,
        });
        throw new BadRequestException(
          'Cannot save paper: title is required and cannot be empty. ' +
            'Please ensure the paper has a valid title before saving.',
        );
      }

      // Save paper to database
      // Phase 10.943: Type-safe JSON converters (zero `as any`)
      const paper = await this.prisma.paper.create({
        data: {
          title: sanitized.title,
          authors: toJsonStringArray(saveDto.authors) ?? [],
          year: saveDto.year ?? new Date().getFullYear(),
          abstract: saveDto.abstract,
          doi: sanitized.doi,
          pmid: sanitized.pmid,
          url: sanitized.url,
          venue: saveDto.venue,
          citationCount: saveDto.citationCount,
          userId,
          tags: toJsonStringArray(saveDto.tags),
          collectionId: saveDto.collectionId,
          source: saveDto.source ?? 'user_added',
          keywords: toJsonStringArray(saveDto.keywords),
          // Enhanced PubMed metadata (type-safe converters)
          meshTerms: toJsonMeshTerms(saveDto.meshTerms),
          publicationType: toJsonStringArray(saveDto.publicationType),
          authorAffiliations: toJsonAuthorAffiliations(saveDto.authorAffiliations),
          grants: toJsonGrants(saveDto.grants),
        },
      });

      this.logger.log(`Paper saved successfully with ID: ${paper.id}`);

      // Queue background full-text extraction for papers with DOI, PMID, or URL
      const hasValidIdentifiers = Boolean(
        sanitized.doi || sanitized.pmid || sanitized.url,
      );

      if (hasValidIdentifiers) {
        const sources = [
          sanitized.pmid ? `PMID:${sanitized.pmid}` : null,
          sanitized.doi ? `DOI:${sanitized.doi}` : null,
          sanitized.url ? `URL:${sanitized.url.substring(0, 50)}...` : null,
        ]
          .filter(Boolean)
          .join(', ');

        this.logger.log(`🔍 Queueing full-text extraction using: ${sources}`);

        this.logger.debug(`📋 Paper identifiers for ${paper.id}:`, {
          paperId: paper.id,
          title: sanitized.title.substring(0, 60) + '...',
          doi: sanitized.doi || 'NONE',
          pmid: sanitized.pmid || 'NONE',
          url: sanitized.url ? `${sanitized.url.substring(0, 50)}...` : 'NONE',
        });

        // Fire-and-forget queueing (doesn't block response)
        this.pdfQueueService
          .addJob(paper.id)
          .then((jobId) => {
            this.logger.log(`✅ Job ${jobId} queued for paper ${paper.id}`);
          })
          .catch((err: Error) => {
            this.logger.error(
              `❌ Failed to queue full-text job for ${paper.id}: ${err.message}`,
            );
            // Non-critical: paper is still usable with abstract
          });
      } else {
        this.logger.warn(
          `⚠️  Paper ${paper.id} has NO valid identifiers - skipping full-text extraction`,
        );
        this.logger.debug('Missing or empty identifiers:', {
          paperId: paper.id,
          title: sanitized.title.substring(0, 60) + '...',
          doi: sanitized.doi ?? 'undefined',
          pmid: sanitized.pmid ?? 'undefined',
          url: sanitized.url ?? 'undefined',
        });
      }

      return { success: true, paperId: paper.id };
    } catch (error: unknown) {
      // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to save paper: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`Error stack: ${errorStack}`);
      }
      this.logger.error(`User ID: ${userId}`);
      this.logger.error(`SaveDto: ${JSON.stringify(saveDto, null, 2)}`);
      throw error;
    }
  }

  /**
   * Get user's paper library with pagination
   *
   * Retrieves all papers belonging to a user with:
   * - Pagination support (page, limit)
   * - Explicit field selection (performance)
   * - Total count for pagination UI
   * - Ordered by creation date (newest first)
   * - Public-user bypass (returns empty library)
   *
   * **Performance**: Parallel query for papers + count using Promise.all
   *
   * **Excluded Fields**: Relations excluded to avoid circular references
   * (themes, gaps, statementProvenances, collection, user)
   *
   * @param userId - User ID who owns the library
   * @param page - Page number (1-indexed, validated >= 1)
   * @param limit - Items per page (validated 1-1000)
   * @returns User library result with papers and total count
   * @throws Error if database operation fails
   *
   * @example
   * const result = await paperDb.getUserLibrary('user123', 1, 20);
   * console.log(`Page 1: ${result.papers.length} papers of ${result.total} total`);
   */
  async getUserLibrary(
    userId: string,
    page: number,
    limit: number,
  ): Promise<UserLibraryResult> {
    // SEC-1: Input validation
    this.validateGetLibraryInput(userId, page, limit);

    try {
      this.logger.log(
        `Getting library for user: ${userId}, page: ${page}, limit: ${limit}`,
      );

      // Public-user bypass: return empty library
      if (userId === PUBLIC_USER_ID) {
        this.logger.log('Public user library - returning empty');
        return { papers: [], total: 0 };
      }

      const skip = (page - 1) * limit;

      // Parallel query for papers + count (performance optimization)
      const [papers, total] = await Promise.all([
        this.prisma.paper.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            authors: true,
            year: true,
            abstract: true,
            journal: true,
            volume: true,
            issue: true,
            pages: true,
            doi: true,
            pmid: true,
            url: true,
            venue: true,
            citationCount: true,
            keywords: true,
            fieldsOfStudy: true,
            source: true,
            tags: true,
            notes: true,
            collectionId: true,
            pdfPath: true,
            hasFullText: true,
            fullText: true,
            fullTextStatus: true,
            fullTextSource: true,
            fullTextWordCount: true,
            fullTextFetchedAt: true,
            // Enhanced PubMed metadata
            meshTerms: true,
            publicationType: true,
            authorAffiliations: true,
            grants: true,
            createdAt: true,
            updatedAt: true,
            // Exclude relations to avoid circular references
            // themes: false,
            // gaps: false,
            // statementProvenances: false,
            // collection: false,
            // user: false,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.paper.count({ where: { userId } }),
      ]);

      this.logger.log(`Retrieved ${papers.length} papers, total: ${total}`);
      return { papers, total };
    } catch (error: unknown) {
      // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get user library: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`Error stack: ${errorStack}`);
      }
      this.logger.error(`User ID: ${userId}, Page: ${page}, Limit: ${limit}`);

      // Type-safe Prisma error property access
      if (typeof error === 'object' && error !== null) {
        const prismaError = error as { code?: string; meta?: unknown };
        if (prismaError.code) {
          this.logger.error(`Prisma Error Code: ${prismaError.code}`);
        }
        if (prismaError.meta) {
          this.logger.error(`Prisma Meta: ${JSON.stringify(prismaError.meta, null, 2)}`);
        }
      }
      throw error;
    }
  }

  /**
   * Remove paper from database
   *
   * Deletes a paper with:
   * - Ownership enforcement (userId must match)
   * - Safe deletion using deleteMany
   * - Public-user bypass (returns success without operation)
   *
   * **Safety**: Uses deleteMany instead of delete to ensure userId matches.
   * If userId doesn't match, no rows deleted (silent failure is acceptable).
   *
   * @param paperId - Paper ID to delete
   * @param userId - User ID who should own the paper
   * @returns Paper deletion result
   *
   * @example
   * await paperDb.removePaper('paper123', 'user456');
   */
  async removePaper(
    paperId: string,
    userId: string,
  ): Promise<PaperDeleteResult> {
    // SEC-1: Input validation
    this.validateRemovePaperInput(paperId, userId);

    // Public-user bypass: return success without database operation
    if (userId === PUBLIC_USER_ID) {
      return { success: true };
    }

    await this.prisma.paper.deleteMany({
      where: { id: paperId, userId },
    });

    return { success: true };
  }

  // ==========================================================================
  // PRIVATE VALIDATION METHODS (SEC-1 Compliance)
  // ==========================================================================

  /**
   * Validate savePaper input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - saveDto must be non-null object
   * - userId must be non-empty string
   *
   * Note: Title validation happens after sanitization in main method
   *
   * @param saveDto - Paper data to validate
   * @param userId - User ID to validate
   * @throws Error if validation fails
   *
   * @private
   */
  private validateSavePaperInput(saveDto: SavePaperDto, userId: string): void {
    // Validate saveDto is object
    if (!saveDto || typeof saveDto !== 'object') {
      throw new Error('Invalid saveDto: must be non-null object');
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }
  }

  /**
   * Validate getUserLibrary input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - userId must be non-empty string
   * - page must be number >= MIN_PAGE (1)
   * - limit must be number between MIN_LIMIT (1) and MAX_LIMIT (1000)
   *
   * @param userId - User ID to validate
   * @param page - Page number to validate
   * @param limit - Limit to validate
   * @throws Error if validation fails
   *
   * @private
   */
  private validateGetLibraryInput(
    userId: string,
    page: number,
    limit: number,
  ): void {
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }

    // Validate page (including NaN and non-integer checks)
    if (typeof page !== 'number' || !Number.isInteger(page) || page < MIN_PAGE) {
      throw new Error(`Invalid page: must be integer >= ${MIN_PAGE}`);
    }

    // Validate limit (including NaN and non-integer checks)
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new Error(
        `Invalid limit: must be integer between ${MIN_LIMIT} and ${MAX_LIMIT}`,
      );
    }
  }

  /**
   * Validate removePaper input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - paperId must be non-empty string
   * - userId must be non-empty string
   *
   * @param paperId - Paper ID to validate
   * @param userId - User ID to validate
   * @throws Error if validation fails
   *
   * @private
   */
  private validateRemovePaperInput(paperId: string, userId: string): void {
    // Validate paperId
    if (!paperId || typeof paperId !== 'string' || paperId.trim().length === 0) {
      throw new Error('Invalid paperId: must be non-empty string');
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }
  }
}
