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
  BadRequestException,
} from '@nestjs/common';
import { ReportService, ExportOptions } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

/**
 * Report Controller - Phase 7 Day 6
 * 
 * RESTful endpoints for report generation and export
 * Foundation for Phase 10 complete implementation
 */
@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Get available export formats
   */
  @Get('formats')
  async getFormats() {
    const formats = await this.reportService.getExportFormats();
    return {
      success: true,
      formats,
      message: 'Additional formats (docx, latex) coming in Phase 10',
    };
  }

  /**
   * Get report templates
   */
  @Get('templates')
  async getTemplates() {
    const templates = await this.reportService.getTemplates();
    return {
      success: true,
      templates,
    };
  }

  /**
   * Generate and download report
   */
  @Post(':studyId/generate')
  async generateReport(
    @Param('studyId') studyId: string,
    @Body() options: ExportOptions,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.sub;
      
      if (!options.format) {
        throw new BadRequestException('Export format is required');
      }

      const report = await this.reportService.generateReport(
        studyId,
        userId,
        options,
      );

      // Set appropriate headers
      res.set({
        'Content-Type': report.mimeType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
        'Content-Length': report.buffer.length.toString(),
        'Cache-Control': 'no-cache',
      });

      // Send the file
      res.status(HttpStatus.OK).send(report.buffer);
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Report generation failed',
      });
    }
  }

  /**
   * Export study data in various formats
   */
  @Get(':studyId/export')
  async exportData(
    @Param('studyId') studyId: string,
    @Query('format') format: string,
    @Query('includeAnalysis') includeAnalysis: boolean,
    @Query('includeRawData') includeRawData: boolean,
    @Query('includeVisualizations') includeVisualizations: boolean,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.sub;
      
      const options: ExportOptions = {
        format: format as any || 'pdf',
        includeAnalysis,
        includeRawData,
        includeVisualizations,
      };

      const report = await this.reportService.generateReport(
        studyId,
        userId,
        options,
      );

      res.set({
        'Content-Type': report.mimeType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
        'Content-Length': report.buffer.length.toString(),
      });

      res.status(HttpStatus.OK).send(report.buffer);
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Export failed',
      });
    }
  }
}