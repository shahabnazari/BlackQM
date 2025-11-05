import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ReportCollaborationService } from './report-collaboration.service';
import { randomBytes } from 'crypto';

export type ShareAccessLevel = 'view' | 'comment' | 'edit';

/**
 * Report Sharing Service - Phase 10 Day 4
 *
 * Handles secure link sharing with granular permissions
 *
 * @features
 * - Generate shareable links with expiration
 * - Public/private report sharing
 * - Password-protected links
 * - Access level control (view/comment/edit)
 * - Link analytics (view count, last accessed)
 * - Revoke/disable shared links
 * - Domain whitelisting for enterprise
 */
@Injectable()
export class ReportSharingService {
  private readonly logger = new Logger(ReportSharingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationService: ReportCollaborationService,
  ) {}

  /**
   * Generate a shareable link for a report
   */
  async generateShareLink(
    reportId: string,
    userId: string,
    options: {
      accessLevel: ShareAccessLevel;
      expiresIn?: number; // days
      password?: string;
      allowedDomains?: string[];
      maxAccess?: number; // max access count
    },
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

    const token = this.generateSecureToken();

    let expiresAt: Date | null = null;
    if (options.expiresIn && options.expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + options.expiresIn);
    }

    const shareLink = await this.prisma.reportShareLink.create({
      data: {
        reportId,
        token,
        createdBy: userId,
        accessLevel: options.accessLevel,
        expiresAt,
        password: options.password ? await this.hashPassword(options.password) : null,
        allowedDomains: options.allowedDomains as any,
        maxAccess: options.maxAccess,
        accessCount: 0,
      },
    });

    this.logger.log(
      `🔗 [Sharing] Generated share link for report ${reportId} with ${options.accessLevel} access`,
    );

    return {
      ...shareLink,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/reports/${token}`,
    };
  }

  /**
   * Access a report via share link
   */
  async accessViaShareLink(
    token: string,
    userEmail?: string,
    password?: string,
  ) {
    const shareLink = await this.prisma.reportShareLink.findUnique({
      where: { token },
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new ForbiddenException('This share link has been disabled');
    }

    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new ForbiddenException('This share link has expired');
    }

    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
      throw new ForbiddenException(
        'This share link has reached its maximum access limit',
      );
    }

    if (shareLink.password) {
      if (!password) {
        return {
          requiresPassword: true,
          shareLink: {
            id: shareLink.id,
            accessLevel: shareLink.accessLevel,
            expiresAt: shareLink.expiresAt,
          },
        };
      }

      const isValid = await this.verifyPassword(password, shareLink.password);
      if (!isValid) {
        throw new ForbiddenException('Invalid password');
      }
    }

    const allowedDomains = shareLink.allowedDomains as string[] | null;
    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      if (!userEmail) {
        throw new ForbiddenException(
          'Email verification required for domain-restricted links',
        );
      }

      const domain = userEmail.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        throw new ForbiddenException(
          `Access restricted to users from: ${allowedDomains.join(', ')}`,
        );
      }
    }

    await this.prisma.reportShareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    this.logger.log(
      `👀 [Sharing] Report ${shareLink.reportId} accessed via share link (count: ${shareLink.accessCount + 1})`,
    );

    return {
      requiresPassword: false,
      report: shareLink.report,
      accessLevel: shareLink.accessLevel,
      shareLink: {
        id: shareLink.id,
        expiresAt: shareLink.expiresAt,
        creator: shareLink.creator,
      },
    };
  }

  /**
   * Get all share links for a report
   */
  async getShareLinks(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const shareLinks = await this.prisma.reportShareLink.findMany({
      where: { reportId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shareLinks.map((link) => ({
      ...link,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/reports/${link.token}`,
    }));
  }

  /**
   * Revoke/disable a share link
   */
  async revokeShareLink(linkId: string, userId: string) {
    const shareLink = await this.prisma.reportShareLink.findUnique({
      where: { id: linkId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    await this.collaborationService.checkPermission(shareLink.reportId, userId, [
      'owner',
      'editor',
    ]);

    await this.prisma.reportShareLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    this.logger.log(
      `🚫 [Sharing] Share link ${linkId} revoked for report ${shareLink.reportId}`,
    );

    return { success: true };
  }

  /**
   * Delete a share link permanently
   */
  async deleteShareLink(linkId: string, userId: string) {
    const shareLink = await this.prisma.reportShareLink.findUnique({
      where: { id: linkId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    await this.collaborationService.checkPermission(shareLink.reportId, userId, [
      'owner',
    ]);

    await this.prisma.reportShareLink.delete({
      where: { id: linkId },
    });

    this.logger.log(
      `🗑️ [Sharing] Share link ${linkId} deleted for report ${shareLink.reportId}`,
    );

    return { success: true };
  }

  /**
   * Update share link settings
   */
  async updateShareLink(
    linkId: string,
    userId: string,
    updates: {
      accessLevel?: ShareAccessLevel;
      expiresAt?: Date | null;
      maxAccess?: number | null;
      allowedDomains?: string[] | null;
      isActive?: boolean;
    },
  ) {
    const shareLink = await this.prisma.reportShareLink.findUnique({
      where: { id: linkId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    await this.collaborationService.checkPermission(shareLink.reportId, userId, [
      'owner',
      'editor',
    ]);

    const updated = await this.prisma.reportShareLink.update({
      where: { id: linkId },
      data: {
        ...updates,
        allowedDomains: updates.allowedDomains as any,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `🔄 [Sharing] Share link ${linkId} updated for report ${shareLink.reportId}`,
    );

    return {
      ...updated,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/reports/${updated.token}`,
    };
  }

  /**
   * Make report publicly accessible
   */
  async makeReportPublic(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, ['owner']);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { isPublic: true },
    });

    this.logger.log(`🌍 [Sharing] Report ${reportId} made public`);

    return updated;
  }

  /**
   * Make report private
   */
  async makeReportPrivate(reportId: string, userId: string) {
    await this.collaborationService.checkPermission(reportId, userId, ['owner']);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { isPublic: false },
    });

    this.logger.log(`🔒 [Sharing] Report ${reportId} made private`);

    return updated;
  }

  /**
   * Get sharing statistics for a report
   */
  async getSharingStatistics(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const [activeLinks, totalAccess, mostAccessedLink] = await Promise.all([
      this.prisma.reportShareLink.count({
        where: { reportId, isActive: true },
      }),
      this.prisma.reportShareLink.aggregate({
        where: { reportId },
        _sum: { accessCount: true },
      }),
      this.prisma.reportShareLink.findFirst({
        where: { reportId },
        orderBy: { accessCount: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    return {
      isPublic: report?.isPublic || false,
      activeLinks,
      totalAccess: totalAccess._sum.accessCount || 0,
      mostAccessedLink: mostAccessedLink
        ? {
            ...mostAccessedLink,
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/reports/${mostAccessedLink.token}`,
          }
        : null,
    };
  }

  /**
   * Generate a secure random token for share links
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Hash a password for share link protection
   */
  private async hashPassword(password: string): Promise<string> {
    // @ts-expect-error - bcrypt types not available, using any
    const bcrypt = await import('bcrypt').then(m => m.default || m) as any;
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify share link password
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    // @ts-expect-error - bcrypt types not available, using any
    const bcrypt = await import('bcrypt').then(m => m.default || m) as any;
    return bcrypt.compare(password, hashedPassword);
  }
}
