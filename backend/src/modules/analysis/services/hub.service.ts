import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { QAnalysisService } from './q-analysis.service';
import { StatisticsService } from './statistics.service';
import { CacheService } from '../../../common/cache.service';
import { WebSocketService } from '../../../services/websocket.service';
import { StudyService } from '../../study/study.service';
import { ParticipantService } from '../../participant/participant.service';
import { QSortService } from '../../participant/qsort.service';

/**
 * Analysis Hub Service - Phase 7 Day 2 Implementation
 * 
 * World-class unified service for the Analysis Hub, providing:
 * - Centralized data access for all analysis features
 * - Intelligent caching with cache.service.ts
 * - Real-time updates via WebSocket
 * - Aggregated data from multiple services
 * 
 * This service acts as the single source of truth for the Analysis Hub,
 * reducing redundant API calls and ensuring data consistency.
 */
@Injectable()
export class HubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qAnalysis: QAnalysisService,
    private readonly statistics: StatisticsService,
    private readonly cache: CacheService,
    private readonly websocket: WebSocketService,
    private readonly studyService: StudyService,
    private readonly participantService: ParticipantService,
    private readonly qsortService: QSortService,
  ) {}

  /**
   * Get comprehensive hub data for a study
   * Aggregates data from multiple services and caches the result
   */
  async getHubData(studyId: string, userId: string) {
    // Check cache first
    const cacheKey = `hub:${studyId}:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch study data
      const study = await this.studyService.findOne(studyId, userId);
      if (!study) {
        throw new NotFoundException('Study not found');
      }

      // Fetch participants data (responses)
      const participants = await this.prisma.response.findMany({
        where: { surveyId: studyId },
        include: {
          participant: true,
        },
      });
      
      // Fetch Q-sorts data
      const responses = await this.prisma.response.findMany({
        where: { surveyId: studyId },
        include: {
          qSorts: true,
        },
      });
      const qsorts = responses.flatMap(r => r.qSorts);
      
      // Get analysis data if available
      let analysisData = null;
      if (qsorts && qsorts.length > 0) {
        try {
          analysisData = await this.qAnalysis.performAnalysis(studyId);
        } catch (error: any) {
          console.warn('Analysis data not available yet:', error);
        }
      }

      // Get statistical summaries
      const statistics = await this.getStatisticalSummaries(studyId, qsorts);

      // Aggregate all data
      const hubData = {
        study,
        participants: {
          total: participants.length,
          completed: participants.filter((p: any) => p.status === 'completed').length,
          inProgress: participants.filter((p: any) => p.status === 'in_progress').length,
          data: participants,
        },
        qsorts: {
          total: qsorts.length,
          data: qsorts,
        },
        analysis: analysisData,
        statistics,
        metadata: {
          lastUpdated: new Date().toISOString(),
          cacheExpiry: 300, // 5 minutes
        },
      };

      // Cache the result
      await this.cache.set(cacheKey, hubData, 300);

      return hubData;
    } catch (error: any) {
      console.error('Error fetching hub data:', error);
      throw new BadRequestException('Failed to fetch hub data');
    }
  }

  /**
   * Get filtered response data for the data explorer
   */
  async getResponseData(
    studyId: string,
    userId: string,
    filters?: {
      participantId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const cacheKey = `responses:${studyId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Verify access
      await this.studyService.findOne(studyId, userId);

      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      // Build query
      const where: any = { studyId };
      
      if (filters?.participantId) {
        where.participantId = filters.participantId;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      // Fetch responses with pagination
      const [responses, total] = await Promise.all([
        this.prisma.response.findMany({
          where,
          include: {
            participant: true,
            qSorts: true,
            answers: true,
          },
          orderBy: filters?.sortBy 
            ? { [filters.sortBy]: filters.sortOrder || 'desc' }
            : { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.response.count({ where }),
      ]);

      const result = {
        data: responses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache for 60 seconds
      await this.cache.set(cacheKey, result, 60);

      return result;
    } catch (error) {
      console.error('Error fetching response data:', error);
      throw new BadRequestException('Failed to fetch response data');
    }
  }

  /**
   * Export study data in various formats
   */
  async exportData(
    studyId: string,
    userId: string,
    format: 'csv' | 'json' | 'excel' | 'spss',
    options?: {
      includeRawData?: boolean;
      includeAnalysis?: boolean;
      includeStatistics?: boolean;
    }
  ) {
    try {
      // Verify access
      await this.studyService.findOne(studyId, userId);

      // Get all data
      const hubData = await this.getHubData(studyId, userId);

      // Export based on format
      switch (format) {
        case 'csv':
          return this.exportToCSV(hubData, options);
        case 'json':
          return this.exportToJSON(hubData, options);
        case 'excel':
          return this.exportToExcel(hubData, options);
        case 'spss':
          return this.exportToSPSS(hubData, options);
        default:
          throw new BadRequestException(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new BadRequestException('Failed to export data');
    }
  }

  /**
   * Subscribe to real-time updates for a study
   */
  subscribeToUpdates(studyId: string, userId: string, clientId: string) {
    // Join WebSocket room for this study
    this.websocket.joinRoom(clientId, `study:${studyId}`);

    // Send initial data
    this.getHubData(studyId, userId).then(data => {
      this.websocket.sendToClient(clientId, 'hub:initial', data);
    });

    return {
      subscribed: true,
      room: `study:${studyId}`,
    };
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromUpdates(studyId: string, clientId: string) {
    this.websocket.leaveRoom(clientId, `study:${studyId}`);
    return {
      unsubscribed: true,
      room: `study:${studyId}`,
    };
  }

  /**
   * Notify all subscribers of data changes
   */
  async notifyDataChange(studyId: string, changeType: string, data?: any) {
    // Invalidate cache for this study
    const cacheKeys = [
      `hub:${studyId}:*`,
      `responses:${studyId}:*`,
    ];
    
    for (const key of cacheKeys) {
      await this.cache.delete(key);
    }

    // Notify WebSocket subscribers
    this.websocket.sendToRoom(`study:${studyId}`, 'hub:update', {
      type: changeType,
      studyId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get statistical summaries for the hub overview
   */
  private async getStatisticalSummaries(studyId: string, qsorts: any[]) {
    if (!qsorts || qsorts.length === 0) {
      return null;
    }

    try {
      const correlationMatrix = await this.statistics.calculateCorrelationMatrix(
        qsorts.map((q: any) => q.rankings)
      );

      const basicStats = {
        participantCount: qsorts.length,
        averageCompletionTime: this.calculateAverageTime(qsorts),
        responseRate: this.calculateResponseRate(qsorts),
        correlationStrength: this.calculateCorrelationStrength(correlationMatrix),
      };

      return {
        basic: basicStats,
        correlationMatrix,
      };
    } catch (error) {
      console.warn('Could not calculate statistics:', error);
      return null;
    }
  }

  /**
   * Export data to CSV format
   */
  private exportToCSV(data: any, options?: any): string {
    // Implementation for CSV export
    const rows = [];
    
    // Headers
    rows.push(['Study Export - ' + data.study.title]);
    rows.push(['Generated:', new Date().toISOString()]);
    rows.push([]);
    
    // Participant data
    if (options?.includeRawData !== false) {
      rows.push(['Participants']);
      rows.push(['ID', 'Status', 'Completed At']);
      data.participants.data.forEach((p: any) => {
        rows.push([p.id, p.status, p.completedAt || 'N/A']);
      });
      rows.push([]);
    }

    // Convert to CSV string
    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Export data to JSON format
   */
  private exportToJSON(data: any, options?: any): string {
    const exportData: any = {
      study: data.study,
      exportDate: new Date().toISOString(),
    };

    if (options?.includeRawData !== false) {
      exportData.responses = data.qsorts.data;
      exportData.participants = data.participants.data;
    }

    if (options?.includeAnalysis && data.analysis) {
      exportData.analysis = data.analysis;
    }

    if (options?.includeStatistics && data.statistics) {
      exportData.statistics = data.statistics;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export data to Excel format (placeholder)
   */
  private exportToExcel(data: any, options?: any): any {
    // This would use a library like exceljs
    // For now, return a message
    return {
      message: 'Excel export will be implemented with exceljs library',
      data: data.study.title,
    };
  }

  /**
   * Export data to SPSS format (placeholder)
   */
  private exportToSPSS(data: any, options?: any): any {
    // This would generate SPSS syntax
    return {
      message: 'SPSS export will generate syntax file',
      studyId: data.study.id,
    };
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageTime(qsorts: any[]): number {
    const times = qsorts
      .filter(q => q.completionTime)
      .map(q => q.completionTime);
    
    if (times.length === 0) return 0;
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(qsorts: any[]): number {
    const completed = qsorts.filter(q => q.status === 'completed').length;
    return qsorts.length > 0 ? (completed / qsorts.length) * 100 : 0;
  }

  /**
   * Calculate correlation strength
   */
  private calculateCorrelationStrength(matrix: number[][]): string {
    if (!matrix || matrix.length === 0) return 'N/A';
    
    // Calculate average absolute correlation
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        sum += Math.abs(matrix[i][j]);
        count++;
      }
    }
    
    const avg = count > 0 ? sum / count : 0;
    
    if (avg < 0.3) return 'Weak';
    if (avg < 0.6) return 'Moderate';
    return 'Strong';
  }
}