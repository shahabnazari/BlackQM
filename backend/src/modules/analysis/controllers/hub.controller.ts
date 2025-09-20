import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HubService } from '../services/hub.service';

/**
 * Hub Controller - Phase 7 Day 2 Implementation
 * 
 * Enterprise-grade API endpoints for the Analysis Hub
 * Provides unified access to all analysis data and features
 */
@Controller('api/analysis/hub')
@UseGuards(JwtAuthGuard)
export class HubController {
  constructor(private readonly hubService: HubService) {}

  /**
   * Get comprehensive hub data for a study
   */
  @Get(':studyId')
  async getHubData(@Param('studyId') studyId: string, @Req() req: any) {
    return this.hubService.getHubData(studyId, req.user.id);
  }

  /**
   * Get filtered response data for data explorer
   */
  @Get(':studyId/responses')
  async getResponseData(
    @Param('studyId') studyId: string,
    @Req() req: any,
    @Query('participantId') participantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      participantId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      status,
      sortBy,
      sortOrder,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.hubService.getResponseData(studyId, req.user.id, filters);
  }

  /**
   * Export study data
   */
  @Post(':studyId/export')
  async exportData(
    @Param('studyId') studyId: string,
    @Body() body: {
      format: 'csv' | 'json' | 'excel' | 'spss';
      options?: {
        includeRawData?: boolean;
        includeAnalysis?: boolean;
        includeStatistics?: boolean;
      };
    },
    @Req() req: any,
    @Res() res: Response
  ) {
    const data = await this.hubService.exportData(
      studyId,
      req.user.id,
      body.format,
      body.options
    );

    // Set appropriate headers based on format
    let contentType = 'application/octet-stream';
    let filename = `study-${studyId}`;

    switch (body.format) {
      case 'csv':
        contentType = 'text/csv';
        filename += '.csv';
        break;
      case 'json':
        contentType = 'application/json';
        filename += '.json';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;
      case 'spss':
        contentType = 'text/plain';
        filename += '.sps';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(data);
  }

  /**
   * Subscribe to real-time updates for a study
   */
  @Post(':studyId/subscribe')
  async subscribe(
    @Param('studyId') studyId: string,
    @Body('clientId') clientId: string,
    @Req() req: any
  ) {
    return this.hubService.subscribeToUpdates(studyId, req.user.id, clientId);
  }

  /**
   * Unsubscribe from real-time updates
   */
  @Post(':studyId/unsubscribe')
  async unsubscribe(
    @Param('studyId') studyId: string,
    @Body('clientId') clientId: string
  ) {
    return this.hubService.unsubscribeFromUpdates(studyId, clientId);
  }
}