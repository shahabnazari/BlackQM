import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Report Collaboration Service - Phase 10 Day 4
 *
 * Handles co-author management for collaborative report writing
 *
 * @features
 * - Add/remove collaborators
 * - Role-based permissions (owner/editor/reviewer/viewer)
 * - Permission checking
 * - Collaborator invitations
 */
@Injectable()
export class ReportCollaborationService {
  private readonly logger = new Logger(ReportCollaborationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a collaborator to a report
   */
  async addCollaborator(
    reportId: string,
    userId: string,
    collaboratorEmail: string,
    role: 'editor' | 'reviewer' | 'viewer' = 'viewer',
  ) {
    await this.checkPermission(reportId, userId, ['owner']);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const collaborator = await this.prisma.user.findUnique({
      where: { email: collaboratorEmail },
    });

    if (!collaborator) {
      throw new NotFoundException(
        `User with email ${collaboratorEmail} not found`,
      );
    }

    if (collaborator.id === report.userId) {
      throw new BadRequestException('Cannot add report owner as collaborator');
    }

    const existing = await this.prisma.reportCollaborator.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId: collaborator.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a collaborator');
    }

    const permissions = {
      canEdit: role === 'editor',
      canComment: true,
      canApprove: role === 'reviewer',
      canDelete: false,
      canInvite: false,
    };

    const newCollaborator = await this.prisma.reportCollaborator.create({
      data: {
        reportId,
        userId: collaborator.id,
        role,
        permissions: permissions as any,
        invitedBy: userId,
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
      `✅ [Collaboration] Added ${collaborator.email} as ${role} to report ${reportId}`,
    );

    return newCollaborator;
  }

  /**
   * Remove a collaborator from a report
   */
  async removeCollaborator(
    reportId: string,
    userId: string,
    collaboratorId: string,
  ) {
    await this.checkPermission(reportId, userId, ['owner']);

    const collaborator = await this.prisma.reportCollaborator.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId: collaboratorId,
        },
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.reportCollaborator.delete({
      where: {
        reportId_userId: {
          reportId,
          userId: collaboratorId,
        },
      },
    });

    this.logger.log(
      `🗑️ [Collaboration] Removed collaborator ${collaboratorId} from report ${reportId}`,
    );

    return { success: true };
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    reportId: string,
    userId: string,
    collaboratorId: string,
    newRole: 'editor' | 'reviewer' | 'viewer',
  ) {
    await this.checkPermission(reportId, userId, ['owner']);

    const collaborator = await this.prisma.reportCollaborator.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId: collaboratorId,
        },
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    const updated = await this.prisma.reportCollaborator.update({
      where: {
        reportId_userId: {
          reportId,
          userId: collaboratorId,
        },
      },
      data: { role: newRole },
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
      `🔄 [Collaboration] Updated ${collaboratorId} role to ${newRole} in report ${reportId}`,
    );

    return updated;
  }

  /**
   * List all collaborators for a report
   */
  async listCollaborators(reportId: string, userId: string) {
    await this.checkReportAccess(reportId, userId);

    const collaborators = await this.prisma.reportCollaborator.findMany({
      where: { reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { invitedAt: 'asc' },
    });

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
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

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      owner: report.user,
      collaborators,
    };
  }

  /**
   * Get user's role in a report
   */
  async getUserRole(
    reportId: string,
    userId: string,
  ): Promise<'owner' | 'editor' | 'reviewer' | 'viewer' | null> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return null;
    }

    if (report.userId === userId) {
      return 'owner';
    }

    const collaborator = await this.prisma.reportCollaborator.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId,
        },
      },
    });

    return collaborator
      ? (collaborator.role as 'editor' | 'reviewer' | 'viewer')
      : null;
  }

  /**
   * Check if user has permission to perform an action
   */
  async checkPermission(
    reportId: string,
    userId: string,
    allowedRoles: ('owner' | 'editor' | 'reviewer' | 'viewer')[],
  ) {
    const userRole = await this.getUserRole(reportId, userId);

    if (!userRole) {
      throw new ForbiddenException('You do not have access to this report');
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Check if user has any access to a report
   */
  async checkReportAccess(reportId: string, userId: string) {
    const userRole = await this.getUserRole(reportId, userId);

    if (!userRole) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return true;
  }

  /**
   * Check if user can edit a report
   */
  async canEdit(reportId: string, userId: string): Promise<boolean> {
    const userRole = await this.getUserRole(reportId, userId);
    return userRole === 'owner' || userRole === 'editor';
  }

  /**
   * Check if user can approve a report
   */
  async canApprove(reportId: string, userId: string): Promise<boolean> {
    const userRole = await this.getUserRole(reportId, userId);
    return userRole === 'owner' || userRole === 'reviewer';
  }

  /**
   * Get all reports accessible to a user
   */
  async getAccessibleReports(userId: string) {
    const ownedReports = await this.prisma.report.findMany({
      where: { userId },
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

    const collaboratedReports = await this.prisma.reportCollaborator.findMany({
      where: { userId },
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
      },
    });

    return {
      owned: ownedReports,
      collaborated: collaboratedReports.map((c) => ({
        ...c.report,
        yourRole: c.role,
      })),
    };
  }
}
