import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ReportCollaborationService } from './report-collaboration.service';

export type ChangeType = 'insert' | 'delete' | 'modify' | 'format';

export interface ChangePosition {
  start?: number;
  end?: number;
  line?: number;
  column?: number;
}

/**
 * Report Change Service - Phase 10 Day 4
 *
 * Handles track changes functionality (Google Docs style)
 *
 * @features
 * - Track insertions, deletions, replacements
 * - Accept/reject changes individually
 * - Accept/reject all changes
 * - Filter changes by author
 * - Change review workflow
 */
@Injectable()
export class ReportChangeService {
  private readonly logger = new Logger(ReportChangeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationService: ReportCollaborationService,
  ) {}

  /**
   * Track a change made to the report
   */
  async trackChange(
    reportId: string,
    userId: string,
    sectionId: string,
    changeType: ChangeType,
    before: string | null,
    after: string | null,
    position?: ChangePosition,
  ) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const change = await this.prisma.reportChange.create({
      data: {
        reportId,
        userId,
        sectionId,
        changeType,
        before,
        after,
        position: position as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `📝 [Change] Tracked ${changeType} change in report ${reportId} section ${sectionId}`,
    );

    return change;
  }

  /**
   * Get all pending changes for a report
   */
  async getPendingChanges(
    reportId: string,
    userId: string,
    filters?: {
      sectionId?: string;
      changeType?: ChangeType;
      authorId?: string;
    },
  ) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const where: any = {
      reportId,
      accepted: false,
      rejected: false,
    };

    if (filters?.sectionId) {
      where.sectionId = filters.sectionId;
    }

    if (filters?.changeType) {
      where.changeType = filters.changeType;
    }

    if (filters?.authorId) {
      where.userId = filters.authorId;
    }

    const changes = await this.prisma.reportChange.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return changes;
  }

  /**
   * Get a specific change
   */
  async getChange(changeId: string, userId: string) {
    const change = await this.prisma.reportChange.findUnique({
      where: { id: changeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!change) {
      throw new NotFoundException('Change not found');
    }

    await this.collaborationService.checkReportAccess(change.reportId, userId);

    return change;
  }

  /**
   * Accept a change
   */
  async acceptChange(changeId: string, userId: string) {
    const change = await this.prisma.reportChange.findUnique({
      where: { id: changeId },
    });

    if (!change) {
      throw new NotFoundException('Change not found');
    }

    await this.collaborationService.checkPermission(change.reportId, userId, [
      'owner',
      'editor',
      'reviewer',
    ]);

    if (change.accepted || change.rejected) {
      throw new ForbiddenException(
        `Change has already been ${change.accepted ? 'accepted' : 'rejected'}`,
      );
    }

    const updated = await this.prisma.reportChange.update({
      where: { id: changeId },
      data: {
        accepted: true,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ [Change] Accepted change ${changeId}`);

    return updated;
  }

  /**
   * Reject a change
   */
  async rejectChange(changeId: string, userId: string, reason?: string) {
    const change = await this.prisma.reportChange.findUnique({
      where: { id: changeId },
    });

    if (!change) {
      throw new NotFoundException('Change not found');
    }

    await this.collaborationService.checkPermission(change.reportId, userId, [
      'owner',
      'editor',
      'reviewer',
    ]);

    if (change.accepted || change.rejected) {
      throw new ForbiddenException(
        `Change has already been ${change.accepted ? 'accepted' : 'rejected'}`,
      );
    }

    const updated = await this.prisma.reportChange.update({
      where: { id: changeId },
      data: {
        rejected: true,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (reason) {
      this.logger.log(
        `❌ [Change] Rejected change ${changeId} - Reason: ${reason}`,
      );
    } else {
      this.logger.log(`❌ [Change] Rejected change ${changeId}`);
    }

    return updated;
  }

  /**
   * Accept all pending changes in a report
   */
  async acceptAllChanges(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const pendingChanges = await this.prisma.reportChange.findMany({
      where: {
        reportId,
        accepted: false,
        rejected: false,
      },
    });

    const updated = await this.prisma.reportChange.updateMany({
      where: {
        reportId,
        accepted: false,
        rejected: false,
      },
      data: {
        accepted: true,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    this.logger.log(
      `✅ [Change] Accepted all ${updated.count} pending changes in report ${reportId}`,
    );

    return {
      acceptedCount: updated.count,
      changes: pendingChanges,
    };
  }

  /**
   * Reject all pending changes in a report
   */
  async rejectAllChanges(reportId: string, userId: string, reason?: string) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const pendingChanges = await this.prisma.reportChange.findMany({
      where: {
        reportId,
        accepted: false,
        rejected: false,
      },
    });

    await this.prisma.reportChange.updateMany({
      where: {
        reportId,
        accepted: false,
        rejected: false,
      },
      data: {
        rejected: true,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    if (reason) {
      this.logger.log(
        `❌ [Change] Rejected all ${pendingChanges.length} pending changes in report ${reportId} - Reason: ${reason}`,
      );
    } else {
      this.logger.log(
        `❌ [Change] Rejected all ${pendingChanges.length} pending changes in report ${reportId}`,
      );
    }

    return {
      rejectedCount: pendingChanges.length,
      changes: pendingChanges,
    };
  }

  /**
   * Accept all changes by a specific author
   */
  async acceptChangesByAuthor(
    reportId: string,
    authorId: string,
    userId: string,
  ) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const updated = await this.prisma.reportChange.updateMany({
      where: {
        reportId,
        userId: authorId,
        accepted: false,
        rejected: false,
      },
      data: {
        accepted: true,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    this.logger.log(
      `✅ [Change] Accepted ${updated.count} changes by author ${authorId} in report ${reportId}`,
    );

    return { acceptedCount: updated.count };
  }

  /**
   * Get change statistics for a report
   */
  async getChangeStatistics(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const [pending, accepted, rejected, byAuthor] = await Promise.all([
      this.prisma.reportChange.count({
        where: { reportId, accepted: false, rejected: false },
      }),
      this.prisma.reportChange.count({
        where: { reportId, accepted: true },
      }),
      this.prisma.reportChange.count({
        where: { reportId, rejected: true },
      }),
      this.prisma.reportChange.groupBy({
        by: ['userId'],
        where: { reportId },
        _count: true,
      }),
    ]);

    const byType = await this.prisma.reportChange.groupBy({
      by: ['changeType'],
      where: { reportId, accepted: false, rejected: false },
      _count: true,
    });

    return {
      pending,
      accepted,
      rejected,
      total: pending + accepted + rejected,
      byAuthor: byAuthor.map((item) => ({
        authorId: item.userId,
        count: item._count,
      })),
      byType: byType.map((item) => ({
        type: item.changeType,
        count: item._count,
      })),
    };
  }

  /**
   * Delete all accepted/rejected changes (cleanup)
   */
  async cleanupReviewedChanges(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
    ]);

    const deleted = await this.prisma.reportChange.deleteMany({
      where: {
        reportId,
        OR: [{ accepted: true }, { rejected: true }],
      },
    });

    this.logger.log(
      `🧹 [Change] Cleaned up ${deleted.count} reviewed changes in report ${reportId}`,
    );

    return { deletedCount: deleted.count };
  }
}
