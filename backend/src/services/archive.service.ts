import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

interface StudyVersion {
  id: string;
  studyId: string;
  version: string;
  snapshot: any;
  changes: string;
  author: string;
  createdAt: Date;
  message?: string;
}

interface ArchivePackage {
  study: any; // Study from Prisma
  versions: StudyVersion[];
  data: {
    participants: any[];
    responses: any[];
    analysis: any[];
    visualizations: any[];
    reports: any[];
  };
  metadata: {
    packageVersion: string;
    createdAt: Date;
    checksum: string;
    doi?: string;
  };
}

interface ArchiveOptions {
  includeData: boolean;
  includeAnalysis: boolean;
  includeReports: boolean;
  compress: boolean;
}

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);
  private versions: Map<string, StudyVersion[]> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new version of a study
   */
  async createVersion(
    studyId: string,
    userId: string,
    message?: string
  ): Promise<StudyVersion> {
    try {
      const study = await (this.prisma as any).study.findUnique({
        where: { id: studyId },
        include: {
          statements: true,
          participants: true,
          questionnaires: true,
        },
      });

      if (!study) {
        throw new NotFoundException(`Study with ID ${studyId} not found`);
      }

      // Get existing versions
      const existingVersions = this.versions.get(studyId) || [];
      const versionNumber = existingVersions.length + 1;
      const versionTag = `v${versionNumber}.0`;

      // Create snapshot of current state
      const snapshot = {
        study,
        timestamp: new Date(),
        checksum: this.generateChecksum(study),
      };

      // Detect changes from previous version
      const changes = this.detectChanges(
        existingVersions[existingVersions.length - 1]?.snapshot,
        snapshot
      );

      const version: StudyVersion = {
        id: crypto.randomUUID(),
        studyId,
        version: versionTag,
        snapshot,
        changes,
        author: userId,
        createdAt: new Date(),
        message: message || `Version ${versionTag} created`,
      };

      // Store version
      existingVersions.push(version);
      this.versions.set(studyId, existingVersions);

      this.logger.log(`Created version ${versionTag} for study ${studyId}`);
      return version;
    } catch (error: any) {
      this.logger.error(`Failed to create version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get version history for a study
   */
  async getVersionHistory(studyId: string): Promise<StudyVersion[]> {
    const versions = this.versions.get(studyId) || [];
    return versions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Restore a study to a specific version
   */
  async restoreVersion(
    studyId: string,
    versionId: string,
    userId: string
  ): Promise<any> {
    try {
      const versions = this.versions.get(studyId) || [];
      const targetVersion = versions.find((v) => v.id === versionId);

      if (!targetVersion) {
        throw new NotFoundException(
          `Version ${versionId} not found for study ${studyId}`
        );
      }

      // Create backup of current state before restoring
      await this.createVersion(
        studyId,
        userId,
        `Backup before restoring to ${targetVersion.version}`
      );

      // Restore study state from snapshot
      const restoredStudy = targetVersion.snapshot.study;

      // Update database with restored state
      const updated = await (this.prisma as any).study.update({
        where: { id: studyId },
        data: {
          title: restoredStudy.title,
          description: restoredStudy.description,
          config: restoredStudy.config,
          status: restoredStudy.status,
        },
      });

      this.logger.log(
        `Restored study ${studyId} to version ${targetVersion.version}`
      );
      return updated;
    } catch (error: any) {
      this.logger.error(`Failed to restore version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a complete archive package for a study
   */
  async createArchivePackage(
    studyId: string,
    options: ArchiveOptions = {
      includeData: true,
      includeAnalysis: true,
      includeReports: true,
      compress: false,
    }
  ): Promise<ArchivePackage> {
    try {
      // Fetch complete study data
      const study = await (this.prisma as any).study.findUnique({
        where: { id: studyId },
        include: {
          statements: true,
          participants: {
            include: {
              participantResponses: true,
            },
          },
          questionnaires: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!study) {
        throw new NotFoundException(`Study with ID ${studyId} not found`);
      }

      // Collect all related data
      const data = {
        participants: options.includeData ? study.participants : [],
        responses: options.includeData
          ? study.participants.flatMap((p: any) => p.participantResponses)
          : [],
        analysis: options.includeAnalysis
          ? await this.getAnalysisData(studyId)
          : [],
        visualizations: options.includeAnalysis
          ? await this.getVisualizationData(studyId)
          : [],
        reports: options.includeReports
          ? await this.getReportData(studyId)
          : [],
      };

      // Get version history
      const versions = await this.getVersionHistory(studyId);

      // Create package
      const archivePackage: ArchivePackage = {
        study,
        versions,
        data,
        metadata: {
          packageVersion: '1.0.0',
          createdAt: new Date(),
          checksum: this.generateChecksum({ study, data }),
          doi: await this.generateDOI(studyId),
        },
      };

      this.logger.log(`Created archive package for study ${studyId}`);
      return archivePackage;
    } catch (error: any) {
      this.logger.error(`Failed to create archive package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export archive package to various formats
   */
  async exportArchive(
    studyId: string,
    format: 'json' | 'zip' | 'tar'
  ): Promise<Buffer> {
    try {
      const archivePackage = await this.createArchivePackage(studyId);

      switch (format) {
        case 'json':
          return Buffer.from(JSON.stringify(archivePackage, null, 2));
        case 'zip':
          // TODO: Implement ZIP compression
          return this.createZipArchive(archivePackage);
        case 'tar':
          // TODO: Implement TAR compression
          return this.createTarArchive(archivePackage);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to export archive: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a DOI (Digital Object Identifier) for the study
   */
  async generateDOI(studyId: string): Promise<string> {
    // This would integrate with a DOI registration service
    // For now, return a mock DOI
    const timestamp = Date.now();
    return `10.12345/vqmethod.${studyId}.${timestamp}`;
  }

  /**
   * Verify archive integrity
   */
  async verifyIntegrity(archivePackage: ArchivePackage): Promise<boolean> {
    try {
      const calculatedChecksum = this.generateChecksum({
        study: archivePackage.study,
        data: archivePackage.data,
      });
      
      return calculatedChecksum === archivePackage.metadata.checksum;
    } catch (error: any) {
      this.logger.error(`Failed to verify integrity: ${error.message}`);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private generateChecksum(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  private detectChanges(previous: any, current: any): string {
    if (!previous) {
      return 'Initial version';
    }

    const changes = [];
    
    // Simple change detection - in production, use a proper diff library
    if (previous.study?.title !== current.study?.title) {
      changes.push('Title updated');
    }
    if (previous.study?.description !== current.study?.description) {
      changes.push('Description updated');
    }
    if (previous.study?.statements?.length !== current.study?.statements?.length) {
      changes.push('Statements modified');
    }

    return changes.length > 0 ? changes.join(', ') : 'No changes detected';
  }

  private async getAnalysisData(studyId: string): Promise<any[]> {
    // Fetch analysis data from analysis service/module
    // This is a placeholder - integrate with actual analysis module
    return [];
  }

  private async getVisualizationData(studyId: string): Promise<any[]> {
    // Fetch visualization data from visualization service
    // This is a placeholder - integrate with actual visualization module
    return [];
  }

  private async getReportData(studyId: string): Promise<any[]> {
    // Fetch report data from report service
    // This is a placeholder - integrate with actual report module
    return [];
  }

  private createZipArchive(archivePackage: ArchivePackage): Buffer {
    // TODO: Implement ZIP compression using a library like 'archiver'
    // For now, return JSON as buffer
    return Buffer.from(JSON.stringify(archivePackage));
  }

  private createTarArchive(archivePackage: ArchivePackage): Buffer {
    // TODO: Implement TAR compression using a library like 'tar'
    // For now, return JSON as buffer
    return Buffer.from(JSON.stringify(archivePackage));
  }

  /**
   * Get storage statistics for a study
   */
  async getStorageStats(studyId: string): Promise<{
    totalSize: number;
    itemCount: number;
    versions: number;
    lastModified: Date;
  }> {
    const archivePackage = await this.createArchivePackage(studyId);
    const dataString = JSON.stringify(archivePackage);
    const sizeInBytes = Buffer.from(dataString).length;

    return {
      totalSize: sizeInBytes,
      itemCount: Object.keys(archivePackage.data).reduce(
        (sum, key) => sum + (archivePackage.data as any)[key].length,
        0
      ),
      versions: archivePackage.versions.length,
      lastModified: archivePackage.study.updatedAt || new Date(),
    };
  }
}