import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ReportCollaborationService } from './report-collaboration.service';
import { ReportVersionService } from './report-version.service';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Report Approval Service - Phase 10 Day 4
 *
 * Handles approval workflow for collaborative report publishing
 *
 * @features
 * - Submit report for approval
 * - Request approvals from reviewers
 * - Approve/reject reports
 * - Lock reports during approval
 * - Track approval history
 * - Multi-stage approval workflow
 */
@Injectable()
export class ReportApprovalService {
  private readonly logger = new Logger(ReportApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationService: ReportCollaborationService,
    private readonly versionService: ReportVersionService,
  ) {}

  /**
   * Submit report for approval
   */
  async submitForApproval(
    reportId: string,
    userId: string,
    reviewerIds: string[],
    message?: string,
  ) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        collaborators: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === 'in_review' || report.status === 'approved') {
      throw new BadRequestException(`Report is already ${report.status}`);
    }

    if (reviewerIds.length === 0) {
      throw new BadRequestException('At least one reviewer must be specified');
    }

    for (const reviewerId of reviewerIds) {
      const canReview = await this.collaborationService.canApprove(
        reportId,
        reviewerId,
      );

      if (!canReview) {
        const user = await this.prisma.user.findUnique({
          where: { id: reviewerId },
        });
        throw new BadRequestException(
          `User ${user?.email || reviewerId} does not have reviewer permissions`,
        );
      }
    }

    await this.versionService.createVersion(
      reportId,
      userId,
      'Submitted for approval',
    );

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'in_review',
        isLocked: true,
      },
    });

    const approvals = await Promise.all(
      reviewerIds.map((reviewerId) =>
        this.prisma.reportApproval.create({
          data: {
            reportId,
            reviewerId,
            requestedBy: userId,
            comments: message || 'Please review this report',
            status: 'pending',
          },
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      ),
    );

    this.logger.log(
      `📋 [Approval] Report ${reportId} submitted for approval to ${reviewerIds.length} reviewers`,
    );

    return {
      report,
      approvals,
    };
  }

  /**
   * Approve a report
   */
  async approveReport(approvalId: string, userId: string, comments?: string) {
    const approval = await this.prisma.reportApproval.findUnique({
      where: { id: approvalId },
      include: {
        report: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.reviewerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to approve this report',
      );
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `This approval request is already ${approval.status}`,
      );
    }

    const updated = await this.prisma.reportApproval.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        comments,
        reviewedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const allApprovals = await this.prisma.reportApproval.findMany({
      where: { reportId: approval.reportId },
    });

    const allApproved = allApprovals.every((a) => a.status === 'approved');

    if (allApproved) {
      await this.prisma.report.update({
        where: { id: approval.reportId },
        data: {
          status: 'approved',
          isLocked: false,
        },
      });

      this.logger.log(
        `✅ [Approval] Report ${approval.reportId} fully approved and unlocked`,
      );
    } else {
      this.logger.log(
        `✅ [Approval] Approval ${approvalId} approved (${allApprovals.filter((a) => a.status === 'approved').length}/${allApprovals.length})`,
      );
    }

    return {
      approval: updated,
      reportFullyApproved: allApproved,
    };
  }

  /**
   * Reject a report with feedback
   */
  async rejectReport(approvalId: string, userId: string, comments: string) {
    if (!comments || comments.trim().length === 0) {
      throw new BadRequestException(
        'Comments are required when rejecting a report',
      );
    }

    const approval = await this.prisma.reportApproval.findUnique({
      where: { id: approvalId },
      include: {
        report: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.reviewerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to reject this report',
      );
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `This approval request is already ${approval.status}`,
      );
    }

    const updated = await this.prisma.reportApproval.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        comments,
        reviewedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.prisma.report.update({
      where: { id: approval.reportId },
      data: {
        status: 'draft',
        isLocked: false,
      },
    });

    this.logger.log(
      `❌ [Approval] Report ${approval.reportId} rejected - returned to draft status`,
    );

    return updated;
  }

  /**
   * Get approval requests for a report
   */
  async getReportApprovals(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const approvals = await this.prisma.reportApproval.findMany({
      where: { reportId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return approvals;
  }

  /**
   * Get pending approval requests for a user
   */
  async getPendingApprovalsForUser(userId: string) {
    const approvals = await this.prisma.reportApproval.findMany({
      where: {
        reviewerId: userId,
        status: 'pending',
      },
      include: {
        report: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return approvals;
  }

  /**
   * Cancel approval process and return to draft
   */
  async cancelApproval(reportId: string, userId: string) {
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

    if (report.status !== 'in_review') {
      throw new BadRequestException('Only reports in review can be cancelled');
    }

    await this.prisma.reportApproval.updateMany({
      where: {
        reportId,
        status: 'pending',
      },
      data: {
        status: 'rejected',
        comments: 'Approval cancelled by author',
        reviewedAt: new Date(),
      },
    });

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'draft',
        isLocked: false,
      },
    });

    this.logger.log(
      `🚫 [Approval] Approval process cancelled for report ${reportId}`,
    );

    return { success: true };
  }

  /**
   * Publish an approved report
   */
  async publishReport(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
    ]);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'approved') {
      throw new BadRequestException('Only approved reports can be published');
    }

    await this.versionService.createVersion(reportId, userId, 'Published');

    const published = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'published',
        isLocked: true,
      },
    });

    this.logger.log(`🚀 [Approval] Report ${reportId} published`);

    return published;
  }

  /**
   * Unpublish a report
   */
  async unpublishReport(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
    ]);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'published') {
      throw new BadRequestException('Report is not published');
    }

    const unpublished = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'draft',
        isLocked: false,
      },
    });

    this.logger.log(`📥 [Approval] Report ${reportId} unpublished`);

    return unpublished;
  }

  /**
   * Get approval statistics for a report
   */
  async getApprovalStatistics(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.reportApproval.count({
        where: { reportId, status: 'pending' },
      }),
      this.prisma.reportApproval.count({
        where: { reportId, status: 'approved' },
      }),
      this.prisma.reportApproval.count({
        where: { reportId, status: 'rejected' },
      }),
      this.prisma.reportApproval.count({
        where: { reportId },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
      percentApproved: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }
}
