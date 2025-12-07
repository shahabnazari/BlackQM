/**
 * Phase 10.100 Phase 7: Paper Permissions Service
 *
 * Enterprise-grade service for managing paper ownership verification
 * and full-text status updates.
 *
 * Features:
 * - Ownership verification with user authorization
 * - Full-text status management
 * - Input validation (SEC-1 compliance)
 * - Type-safe interfaces
 * - Graceful error handling
 * - NestJS Logger integration (Phase 10.943)
 *
 * Single Responsibility: Paper access control and status management ONLY
 *
 * @module LiteratureModule
 * @since Phase 10.100 Phase 7
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

// ============================================================================
// EXPORTED TYPES (Type Safety)
// ============================================================================

/**
 * Full-text status enumeration
 * Tracks the lifecycle of full-text extraction
 */
export type FullTextStatus = 'not_fetched' | 'fetching' | 'success' | 'failed';

/**
 * Paper ownership verification result
 * Returns comprehensive paper metadata for authorized access
 */
export interface PaperOwnershipResult {
  id: string;
  title: string;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  fullTextStatus: FullTextStatus | null;
  hasFullText: boolean;
  fullTextWordCount: number | null;
  fullText: string | null;
  abstract: string | null;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PaperPermissionsService {
  private readonly logger = new Logger(PaperPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Verify paper ownership and retrieve metadata
   *
   * Validates that a paper belongs to a specific user and returns
   * comprehensive metadata including full-text content if available.
   * Throws NotFoundException if paper doesn't exist or doesn't belong to user.
   *
   * **Security**: User ownership is enforced at database query level
   * **Performance**: Single SELECT query with explicit field selection
   *
   * BUG FIX (Nov 19, 2025): Added fullText and abstract to returned fields.
   * Previous issue: Frontend showed "full text available" but couldn't extract
   * themes because actual content wasn't returned.
   *
   * @param paperId - Paper ID to verify
   * @param userId - User ID claiming ownership
   * @returns Paper metadata with full-text content if available
   * @throws Error if paperId or userId is empty/invalid (SEC-1)
   * @throws NotFoundException if paper not found or access denied
   *
   * @example
   * const paper = await paperPermissions.verifyPaperOwnership(
   *   'paper123',
   *   'user456'
   * );
   * console.log(paper.hasFullText); // true/false
   */
  async verifyPaperOwnership(
    paperId: string,
    userId: string,
  ): Promise<PaperOwnershipResult> {
    // SEC-1: Input validation
    this.validatePaperOwnershipInput(paperId, userId);

    this.logger.log(
      `🔐 Verifying paper ownership: ${paperId} for user ${userId}`,
    );

    const paper = await this.prisma.paper.findFirst({
      where: {
        id: paperId,
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        doi: true,
        pmid: true,
        url: true,
        fullTextStatus: true,
        hasFullText: true,
        fullTextWordCount: true,
        fullText: true, // BUG FIX (Nov 19, 2025): Include actual content
        abstract: true, // BUG FIX (Nov 19, 2025): Include abstract
      },
    });

    if (!paper) {
      this.logger.error(
        `❌ Paper ${paperId} not found or doesn't belong to user ${userId}`,
      );
      throw new NotFoundException(
        `Paper ${paperId} not found or access denied`,
      );
    }

    this.logger.log(`   ✅ Paper ${paperId} verified for user ${userId}`);

    // Phase 10.100 Strict Audit Fix: Type-safe status conversion with validation
    const VALID_STATUSES: FullTextStatus[] = ['not_fetched', 'fetching', 'success', 'failed'];
    const status: FullTextStatus | null = 
      paper.fullTextStatus && VALID_STATUSES.includes(paper.fullTextStatus as FullTextStatus)
        ? (paper.fullTextStatus as FullTextStatus)
        : null;

    return {
      ...paper,
      fullTextStatus: status,
    };
  }

  /**
   * Update paper full-text status
   *
   * Atomically updates the fullTextStatus field for a paper.
   * Used during full-text extraction workflow to track status transitions:
   * - not_fetched → fetching (extraction started)
   * - fetching → success (extraction completed)
   * - fetching → failed (extraction error)
   *
   * **Enterprise-grade improvements:**
   * - Verifies paper exists before update (clear error messages)
   * - Uses type-safe status values (FullTextStatus enum)
   * - Atomic database operation (no race conditions)
   * - Comprehensive logging with emoji indicators
   *
   * **Performance**: Two queries (SELECT + UPDATE) for better error messages
   * vs. one blind UPDATE with potentially unclear errors
   *
   * @param paperId - Paper ID to update
   * @param status - New status value (type-safe FullTextStatus)
   * @throws Error if paperId is empty/invalid or status is invalid (SEC-1)
   * @throws NotFoundException if paper doesn't exist
   *
   * @example
   * // Start full-text extraction
   * await paperPermissions.updatePaperFullTextStatus(
   *   'paper123',
   *   'fetching'
   * );
   *
   * // Mark extraction complete
   * await paperPermissions.updatePaperFullTextStatus(
   *   'paper123',
   *   'success'
   * );
   */
  async updatePaperFullTextStatus(
    paperId: string,
    status: FullTextStatus,
  ): Promise<void> {
    // SEC-1: Input validation
    this.validateFullTextStatusInput(paperId, status);

    this.logger.log(
      `📝 Updating paper ${paperId} full-text status to: ${status}`,
    );

    try {
      // Verify paper exists first (better error messages)
      const paper = await this.prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true },
      });

      if (!paper) {
        this.logger.error(`❌ Cannot update status: Paper ${paperId} not found`);
        throw new NotFoundException(`Paper ${paperId} not found`);
      }

      // Update status atomically
      await this.prisma.paper.update({
        where: { id: paperId },
        data: { fullTextStatus: status },
      });

      this.logger.log(`   ✅ Paper ${paperId} status updated to: ${status}`);
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and re-throw other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `❌ Failed to update paper ${paperId} status: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // ==========================================================================
  // PRIVATE VALIDATION METHODS (SEC-1 Compliance)
  // ==========================================================================

  /**
   * Validate verifyPaperOwnership input parameters (SEC-1 compliance)
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
  private validatePaperOwnershipInput(
    paperId: string,
    userId: string,
  ): void {
    // Validate paperId
    if (!paperId || typeof paperId !== 'string' || paperId.trim().length === 0) {
      throw new Error('Invalid paperId: must be non-empty string');
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }
  }

  /**
   * Validate updatePaperFullTextStatus input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - paperId must be non-empty string
   * - status must be valid FullTextStatus value
   *
   * @param paperId - Paper ID to validate
   * @param status - Status value to validate
   * @throws Error if validation fails
   *
   * @private
   */
  private validateFullTextStatusInput(
    paperId: string,
    status: FullTextStatus,
  ): void {
    // Validate paperId
    if (!paperId || typeof paperId !== 'string' || paperId.trim().length === 0) {
      throw new Error('Invalid paperId: must be non-empty string');
    }

    // Validate status
    const VALID_STATUSES: FullTextStatus[] = [
      'not_fetched',
      'fetching',
      'success',
      'failed',
    ];

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status: must be one of ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
