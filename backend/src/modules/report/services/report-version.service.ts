import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ReportCollaborationService } from './report-collaboration.service';
import { diffChars, diffWords, diffLines } from 'diff';

/**
 * Report Version Service - Phase 10 Day 4
 *
 * Handles version control for collaborative report writing
 *
 * @features
 * - Create snapshots of reports
 * - Restore previous versions
 * - Compare versions (diff)
 * - Version history tracking
 * - Auto-versioning on major changes
 */
@Injectable()
export class ReportVersionService {
  private readonly logger = new Logger(ReportVersionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationService: ReportCollaborationService,
  ) {}

  /**
   * Create a new version snapshot
   */
  async createVersion(
    reportId: string,
    userId: string,
    changeMessage?: string,
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

    const previousVersions = await this.prisma.reportVersion.count({
      where: { reportId },
    });

    const versionNumber = previousVersions + 1;

    const reportSnapshot = {
      content: report.content,
      format: report.format,
      metadata: report.metadata,
      status: report.status,
      sections: report.sections,
    };

    let diff = null;
    if (previousVersions > 0) {
      const previousVersion = await this.prisma.reportVersion.findFirst({
        where: { reportId },
        orderBy: { versionNumber: 'desc' },
      });

      if (previousVersion) {
        diff = this.generateDiff(
          previousVersion.snapshot as any,
          reportSnapshot,
        );
      }
    }

    const version = await this.prisma.reportVersion.create({
      data: {
        reportId,
        versionNumber,
        snapshot: reportSnapshot as any,
        diff: diff as any,
        changeMessage: changeMessage || `Version ${versionNumber}`,
        createdBy: userId,
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

    await this.prisma.report.update({
      where: { id: reportId },
      data: { currentVersion: versionNumber },
    });

    this.logger.log(
      `📸 [Version] Created version ${versionNumber} for report ${reportId}`,
    );

    return version;
  }

  /**
   * Get version history for a report
   */
  async getVersionHistory(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const versions = await this.prisma.reportVersion.findMany({
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
      orderBy: { versionNumber: 'desc' },
    });

    return versions;
  }

  /**
   * Get a specific version
   */
  async getVersion(reportId: string, versionNumber: number, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const version = await this.prisma.reportVersion.findUnique({
      where: {
        reportId_versionNumber: {
          reportId,
          versionNumber,
        },
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

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  /**
   * Restore a previous version
   */
  async restoreVersion(
    reportId: string,
    versionNumber: number,
    userId: string,
  ) {
    await this.collaborationService.checkPermission(reportId, userId, [
      'owner',
      'editor',
    ]);

    const version = await this.getVersion(reportId, versionNumber, userId);

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const snapshot = version.snapshot as any;

    await this.createVersion(
      reportId,
      userId,
      `Restored from version ${versionNumber}`,
    );

    const restoredReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        content: snapshot.content,
        format: snapshot.format,
        metadata: snapshot.metadata,
        status: snapshot.status,
        sections: snapshot.sections,
      },
    });

    this.logger.log(
      `♻️ [Version] Restored report ${reportId} to version ${versionNumber}`,
    );

    return restoredReport;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    reportId: string,
    version1: number,
    version2: number,
    userId: string,
  ) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const [v1, v2] = await Promise.all([
      this.getVersion(reportId, version1, userId),
      this.getVersion(reportId, version2, userId),
    ]);

    const snapshot1 = v1.snapshot as any;
    const snapshot2 = v2.snapshot as any;

    const diff = this.generateDiff(snapshot1, snapshot2);

    return {
      version1: v1,
      version2: v2,
      diff,
    };
  }

  /**
   * Generate diff between two snapshots
   */
  private generateDiff(oldSnapshot: any, newSnapshot: any) {
    const titleDiff =
      oldSnapshot.title !== newSnapshot.title
        ? diffWords(oldSnapshot.title || '', newSnapshot.title || '')
        : null;

    const contentDiff =
      oldSnapshot.content !== newSnapshot.content
        ? diffLines(oldSnapshot.content || '', newSnapshot.content || '')
        : null;

    const formatChanged = oldSnapshot.format !== newSnapshot.format;
    const statusChanged = oldSnapshot.status !== newSnapshot.status;

    return {
      title: titleDiff,
      content: contentDiff,
      format: formatChanged
        ? { old: oldSnapshot.format, new: newSnapshot.format }
        : null,
      status: statusChanged
        ? { old: oldSnapshot.status, new: newSnapshot.status }
        : null,
      metadata: this.compareMetadata(
        oldSnapshot.metadata,
        newSnapshot.metadata,
      ),
    };
  }

  /**
   * Compare metadata objects
   */
  private compareMetadata(oldMetadata: any, newMetadata: any) {
    if (!oldMetadata && !newMetadata) return null;
    if (!oldMetadata) return { added: newMetadata };
    if (!newMetadata) return { removed: oldMetadata };

    const changes: any = {
      added: {},
      removed: {},
      modified: {},
    };

    const allKeys = new Set([
      ...Object.keys(oldMetadata),
      ...Object.keys(newMetadata),
    ]);

    for (const key of allKeys) {
      if (!(key in oldMetadata)) {
        changes.added[key] = newMetadata[key];
      } else if (!(key in newMetadata)) {
        changes.removed[key] = oldMetadata[key];
      } else if (
        JSON.stringify(oldMetadata[key]) !== JSON.stringify(newMetadata[key])
      ) {
        changes.modified[key] = {
          old: oldMetadata[key],
          new: newMetadata[key],
        };
      }
    }

    if (
      Object.keys(changes.added).length === 0 &&
      Object.keys(changes.removed).length === 0 &&
      Object.keys(changes.modified).length === 0
    ) {
      return null;
    }

    return changes;
  }
}
