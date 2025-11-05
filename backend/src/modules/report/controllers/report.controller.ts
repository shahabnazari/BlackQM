/**
 * Report Controller
 * Phase 10 Day 1 Step 5: Backend Report Module
 *
 * RESTful API endpoints for comprehensive report generation
 * Features:
 * - JWT authentication on all endpoints
 * - Comprehensive Swagger/OpenAPI documentation
 * - Input validation with DTOs
 * - Enterprise-grade error handling
 * - Rate limiting ready
 */

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BulkReportResponseDto,
  DeleteReportResponseDto,
  GenerateBulkReportsDto,
  GenerateReportDto,
  ReportListResponseDto,
  ReportResponseDto,
  UpdateReportMetadataDto,
} from '../dto';
import * as CollaborationDto from '../dto/collaboration.dto';
import { ReportApprovalService } from '../services/report-approval.service';
import { ReportChangeService } from '../services/report-change.service';
import { ReportCollaborationService } from '../services/report-collaboration.service';
import { ReportCommentService } from '../services/report-comment.service';
import { ReportGeneratorService } from '../services/report-generator.service';
import { ReportVersionService } from '../services/report-version.service';
import { ReportSharingService } from '../services/report-sharing.service';

/**
 * Report Controller
 * Handles all report generation and management endpoints
 */
@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly reportService: ReportGeneratorService,
    private readonly collaborationService: ReportCollaborationService,
    private readonly versionService: ReportVersionService,
    private readonly commentService: ReportCommentService,
    private readonly changeService: ReportChangeService,
    private readonly approvalService: ReportApprovalService,
    private readonly sharingService: ReportSharingService,
  ) {}

  /**
   * Generate comprehensive report for a study
   * Integrates Phase 9 literature, Phase 9.5 research design, and current study data
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate comprehensive report for a study',
    description: `
      Generates a comprehensive academic report integrating:
      - Phase 9: Literature review, papers, themes, gaps, contradictions
      - Phase 9.5: Research questions (SQUARE-IT scored), hypotheses, theory diagrams
      - Phase 10: Q-methodology results, factor analysis, statement provenance

      Supports multiple academic formats (APA, MLA, Chicago, Thesis) and output formats (HTML, PDF, Word, LaTeX, Markdown).

      Full provenance chain traces each statement back to source literature.
    `,
  })
  @ApiBody({ type: GenerateReportDto })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Study not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during report generation',
  })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ): Promise<ReportResponseDto> {
    this.logger.log(
      `Generating report for study ${dto.studyId} by user ${req.user.userId}`,
    );

    try {
      const report = await this.reportService.generateReport({
        studyId: dto.studyId,
        userId: req.user.userId,
        templateType: dto.templateType,
        includeSections: dto.includeSections,
        includeProvenance: dto.includeProvenance ?? true,
        format: dto.format,
      });

      this.logger.log(`Report ${report.id} generated successfully`);
      return report as ReportResponseDto;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Report generation failed for study ${dto.studyId}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Preview report without saving (Day 5)
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview report without saving to database',
    description: `
      Generates report preview with metadata and section summaries without persisting to database.
      Useful for reviewing report structure before final generation.
      Returns estimated word count, section list, and provenance summary.
    `,
  })
  @ApiBody({ type: GenerateReportDto })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  async previewReport(@Body() dto: GenerateReportDto, @Request() req: any) {
    try {
      // Fetch study data for preview
      const study = await this.reportService['fetchStudyData'](dto.studyId);
      if (!study) {
        throw new NotFoundException(`Study ${dto.studyId} not found`);
      }

      const literatureData = await this.reportService['fetchPhase9Data'](
        dto.studyId,
      );
      const researchDesignData = await this.reportService['fetchPhase95Data'](
        dto.studyId,
      );
      const provenance = await this.reportService['buildProvenanceChain'](
        dto.studyId,
      );

      // Generate sections for preview
      const sections = await this.reportService['generateSections']({
        study,
        literatureData,
        researchDesignData,
        provenance,
        includeSections: dto.includeSections || [
          'abstract',
          'introduction',
          'literature_review',
          'methods',
          'results',
          'discussion',
          'references',
          'appendix_provenance',
        ],
      });

      // Calculate preview metrics
      const totalWords = sections.reduce((sum: number, section: any) => {
        const wordCount = section.content.split(/\s+/).length;
        return sum + wordCount;
      }, 0);

      return {
        preview: true,
        studyId: dto.studyId,
        studyTitle: study.title,
        estimatedWords: totalWords,
        estimatedPages: Math.ceil(totalWords / 250), // ~250 words per page
        sectionCount: sections.length,
        sections: sections.map((s: any) => ({
          id: s.id,
          title: s.title,
          wordCount: s.content.split(/\s+/).length,
          order: s.order,
        })),
        provenanceChainCount: provenance.length,
        literatureCount: literatureData?.papers?.length || 0,
        researchQuestionsCount: researchDesignData?.refinedQuestion ? 1 : 0,
        hypothesesCount: Array.isArray(researchDesignData?.hypotheses)
          ? researchDesignData.hypotheses.length
          : 0,
        format: dto.format || 'html',
        templateType: dto.templateType || 'apa',
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Report preview failed for study ${dto.studyId}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Generate reports for multiple studies in bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate reports for multiple studies (bulk operation)',
    description: `
      Generates reports for multiple studies in a single request.
      Returns success/failure count and detailed error information.
      Useful for batch processing or exporting multiple studies.
    `,
  })
  @ApiBody({ type: GenerateBulkReportsDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk report generation completed',
    type: BulkReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  async generateBulkReports(
    @Body() dto: GenerateBulkReportsDto,
    @Request() req: any,
  ): Promise<BulkReportResponseDto> {
    this.logger.log(
      `Bulk report generation for ${dto.studyIds.length} studies by user ${req.user.userId}`,
    );

    const reports: ReportResponseDto[] = [];
    const errors: Array<{ studyId: string; error: string }> = [];

    for (const studyId of dto.studyIds) {
      try {
        const report = await this.reportService.generateReport({
          studyId,
          userId: req.user.userId,
          templateType: dto.templateType,
          format: dto.format,
          includeProvenance: true,
        });
        reports.push(report as ReportResponseDto);
      } catch (error) {
        const err = error as Error;
        this.logger.warn(
          `Bulk generation failed for study ${studyId}: ${err.message}`,
        );
        errors.push({ studyId, error: err.message });
      }
    }

    this.logger.log(
      `Bulk generation complete: ${reports.length} success, ${errors.length} failures`,
    );

    return {
      reports,
      successCount: reports.length,
      failureCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get report by ID
   */
  @Get(':reportId')
  @ApiOperation({
    summary: 'Retrieve a generated report by ID',
    description:
      'Returns complete report data including metadata, sections, and provenance.',
  })
  @ApiParam({
    name: 'reportId',
    description: 'UUID of the report',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async getReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ): Promise<ReportResponseDto> {
    this.logger.log(
      `Retrieving report ${reportId} for user ${req.user.userId}`,
    );

    const report = await this.reportService.getReportById(
      reportId,
      req.user.userId,
    );

    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    return report as ReportResponseDto;
  }

  /**
   * List all reports for a study
   */
  @Get('study/:studyId')
  @ApiOperation({
    summary: 'List all reports for a specific study',
    description: 'Returns paginated list of all reports generated for a study.',
  })
  @ApiParam({
    name: 'studyId',
    description: 'UUID of the study',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: ReportListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  async getReportsByStudy(
    @Param('studyId', ParseUUIDPipe) studyId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Request() req: any,
  ): Promise<ReportListResponseDto> {
    this.logger.log(
      `Listing reports for study ${studyId}, page ${page}, user ${req.user.userId}`,
    );

    if (page < 1) {
      throw new BadRequestException('Page number must be >= 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('Page size must be between 1 and 100');
    }

    const { reports, total } = await this.reportService.getReportsByStudy(
      studyId,
      req.user.userId,
      page,
      pageSize,
    );

    return {
      reports: reports as ReportResponseDto[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * Delete a report
   */
  @Delete(':reportId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a generated report',
    description: 'Permanently deletes a report. This action cannot be undone.',
  })
  @ApiParam({
    name: 'reportId',
    description: 'UUID of the report to delete',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
    type: DeleteReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async deleteReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ): Promise<DeleteReportResponseDto> {
    this.logger.log(`Deleting report ${reportId} for user ${req.user.userId}`);

    const deleted = await this.reportService.deleteReport(
      reportId,
      req.user.userId,
    );

    if (!deleted) {
      throw new NotFoundException(
        `Report ${reportId} not found or not authorized`,
      );
    }

    this.logger.log(`Report ${reportId} deleted successfully`);

    return {
      message: 'Report deleted successfully',
      reportId,
    };
  }

  /**
   * Update report metadata (title, authors, institution)
   */
  @Post(':reportId/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update report metadata',
    description:
      'Updates report title, authors, or institution without regenerating content.',
  })
  @ApiParam({
    name: 'reportId',
    description: 'UUID of the report',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateReportMetadataDto })
  @ApiResponse({
    status: 200,
    description: 'Metadata updated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async updateMetadata(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: UpdateReportMetadataDto,
    @Request() req: any,
  ): Promise<ReportResponseDto> {
    this.logger.log(
      `Updating metadata for report ${reportId} by user ${req.user.userId}`,
    );

    const report = await this.reportService.updateReportMetadata(
      reportId,
      req.user.userId,
      dto,
    );

    if (!report) {
      throw new NotFoundException(
        `Report ${reportId} not found or not authorized`,
      );
    }

    this.logger.log(`Metadata updated for report ${reportId}`);
    return report as ReportResponseDto;
  }

  /**
   * Re-render report with different format
   */
  @Post(':reportId/render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-render report in different format',
    description:
      'Converts existing report to different output format (HTML, PDF, Word, etc.)',
  })
  @ApiParam({
    name: 'reportId',
    description: 'UUID of the report',
    example: '650e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['html', 'pdf', 'word', 'latex', 'markdown'],
    description: 'Output format',
    example: 'pdf',
  })
  @ApiQuery({
    name: 'templateType',
    required: false,
    enum: ['apa', 'mla', 'chicago', 'thesis', 'custom'],
    description: 'Academic format template',
    example: 'apa',
  })
  @ApiResponse({
    status: 200,
    description: 'Report re-rendered successfully',
    schema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'string',
          example: '650e8400-e29b-41d4-a716-446655440000',
        },
        format: { type: 'string', example: 'pdf' },
        content: { type: 'string', example: '<html>...</html>' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async renderReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Query('format') format: 'html' | 'pdf' | 'word' | 'latex' | 'markdown',
    @Query('templateType')
    templateType?: 'apa' | 'mla' | 'chicago' | 'thesis' | 'custom',
    @Request() req?: any,
  ) {
    this.logger.log(
      `Re-rendering report ${reportId} in format ${format} for user ${req.user.userId}`,
    );

    const content = await this.reportService.renderReportById(
      reportId,
      req.user.userId,
      format,
      templateType,
    );

    if (!content) {
      throw new NotFoundException(
        `Report ${reportId} not found or not authorized`,
      );
    }

    return {
      reportId,
      format,
      content,
    };
  }

  /**
   * Export report with advanced formatting (Phase 10 Day 2)
   * Supports Word, LaTeX, enhanced PDF with journal-specific templates
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export report with advanced formatting (Phase 10 Day 2)',
    description: `
      Export report using enterprise-grade export services:
      - Word (.docx) with APA/MLA/Chicago formatting
      - LaTeX with journal-specific templates (Springer, Elsevier, IEEE, PLOS, Nature)
      - Enhanced PDF with table of contents and provenance appendix
      - HTML with responsive styling
      - Markdown for GitHub/documentation
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studyId: {
          type: 'string',
          example: '650e8400-e29b-41d4-a716-446655440000',
        },
        format: {
          type: 'string',
          enum: ['pdf', 'word', 'latex', 'html', 'markdown'],
          example: 'word',
        },
        citationStyle: {
          type: 'string',
          enum: ['apa', 'mla', 'chicago', 'ieee', 'harvard'],
          example: 'apa',
        },
        includeTableOfContents: { type: 'boolean', example: true },
        includePageNumbers: { type: 'boolean', example: true },
        includeProvenance: { type: 'boolean', example: true },
        journalTemplate: {
          type: 'string',
          enum: ['springer', 'elsevier', 'ieee', 'plos', 'nature', 'apa'],
          example: 'springer',
        },
      },
      required: ['studyId', 'format'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Export successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        filename: {
          type: 'string',
          example: 'Q-Methodology-Study-Report.docx',
        },
        mimeType: {
          type: 'string',
          example:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        size: { type: 'number', example: 45678 },
        format: { type: 'string', example: 'word' },
      },
    },
  })
  async exportReport(@Body() exportDto: any, @Request() req: any) {
    this.logger.log(
      `Exporting report for study ${exportDto.studyId} in ${exportDto.format} format`,
    );

    // This endpoint would integrate with the new export services
    // Implementation details depend on how the services are used
    throw new BadRequestException(
      'Advanced export functionality coming soon - use /render endpoint for now',
    );
  }

  /**
   * Generate AI manuscript (Phase 10 Day 2 - Patent #8)
   * Revolutionary AI-powered manuscript generation with full pipeline integration
   */
  @Post('generate-manuscript')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate AI-powered manuscript (Phase 10 Day 2 - Patent #8)',
    description: `
      REVOLUTIONARY FEATURE: AI-powered full manuscript generation

      Automatically generates complete research manuscript sections using GPT-4:
      - Introduction with research questions (SQUARE-IT methodology)
      - Literature Review synthesizing Phase 9 papers and themes
      - Methods section with COMPLETE PROVENANCE (Paper → Gap → Question → Hypothesis → Theme → Statement)
      - Results section with Q-methodology findings
      - Discussion comparing results to literature
      - Conclusion with implications

      Patent-worthy innovation: First platform to auto-generate academic manuscripts
      with full provenance tracking from literature to final statements.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studyId: {
          type: 'string',
          example: '650e8400-e29b-41d4-a716-446655440000',
        },
        journalStyle: {
          type: 'string',
          enum: ['apa', 'mla', 'chicago'],
          example: 'apa',
        },
        targetJournal: {
          type: 'string',
          example:
            'Operant Subjectivity: The International Journal of Q Methodology',
        },
        wordLimit: { type: 'number', example: 8000 },
        sections: {
          type: 'object',
          properties: {
            introduction: { type: 'boolean', example: true },
            literatureReview: { type: 'boolean', example: true },
            methods: { type: 'boolean', example: true },
            results: { type: 'boolean', example: true },
            discussion: { type: 'boolean', example: true },
            conclusion: { type: 'boolean', example: true },
          },
        },
      },
      required: ['studyId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'AI manuscript generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sectionsGenerated: { type: 'number', example: 6 },
        totalWordCount: { type: 'number', example: 7543 },
        citationCount: { type: 'number', example: 42 },
        manuscriptId: {
          type: 'string',
          example: '750e8400-e29b-41d4-a716-446655440000',
        },
        metadata: {
          type: 'object',
          properties: {
            model: { type: 'string', example: 'gpt-4' },
            generatedAt: { type: 'string', example: '2025-10-21T09:00:00Z' },
            journalStyle: { type: 'string', example: 'apa' },
            sections: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'introduction',
                'literatureReview',
                'methods',
                'results',
                'discussion',
                'conclusion',
              ],
            },
          },
        },
      },
    },
  })
  async generateManuscript(@Body() manuscriptDto: any, @Request() req: any) {
    this.logger.log(
      `Generating AI manuscript for study ${manuscriptDto.studyId}`,
    );

    // This endpoint would integrate with AIManuscriptGeneratorService
    // Implementation details depend on how the service is used
    throw new BadRequestException('AI manuscript generation coming soon');
  }

  /**
   * Format citations in specified style (Phase 10 Day 2)
   */
  @Post('format-citations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Format citations in specified academic style',
    description:
      'Generate formatted citations (in-text and full bibliography) using Citation Manager Service',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paperIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['paper-id-1', 'paper-id-2'],
        },
        style: {
          type: 'string',
          enum: ['apa', 'mla', 'chicago', 'ieee', 'harvard'],
          example: 'apa',
        },
      },
      required: ['paperIds', 'style'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Citations formatted successfully',
  })
  async formatCitations(@Body() citationDto: any, @Request() req: any) {
    this.logger.log(
      `Formatting ${citationDto.paperIds.length} citations in ${citationDto.style} style`,
    );

    // This endpoint would integrate with CitationManagerService
    throw new BadRequestException('Citation formatting coming soon');
  }

  // ===================================================================
  // COLLABORATION ENDPOINTS - Phase 10 Day 4
  // ===================================================================

  /**
   * Add collaborator to report
   */
  @Post(':reportId/collaborators')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add collaborator to report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.AddReportCollaboratorDto })
  @ApiResponse({ status: 201, description: 'Collaborator added successfully' })
  async addCollaborator(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.AddReportCollaboratorDto,
    @Request() req: any,
  ) {
    return await this.collaborationService.addCollaborator(
      reportId,
      req.user.userId,
      dto.collaboratorEmail,
      dto.role,
    );
  }

  /**
   * Remove collaborator from report
   */
  @Delete(':reportId/collaborators/:collaboratorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove collaborator from report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'collaboratorId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Collaborator removed' })
  async removeCollaborator(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('collaboratorId', ParseUUIDPipe) collaboratorId: string,
    @Request() req: any,
  ) {
    return await this.collaborationService.removeCollaborator(
      reportId,
      req.user.userId,
      collaboratorId,
    );
  }

  /**
   * Update collaborator role
   */
  @Post(':reportId/collaborators/:collaboratorId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update collaborator role' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'collaboratorId', type: 'string' })
  @ApiBody({ type: CollaborationDto.UpdateReportCollaboratorRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateCollaboratorRole(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('collaboratorId', ParseUUIDPipe) collaboratorId: string,
    @Body() dto: CollaborationDto.UpdateReportCollaboratorRoleDto,
    @Request() req: any,
  ) {
    return await this.collaborationService.updateCollaboratorRole(
      reportId,
      req.user.userId,
      collaboratorId,
      dto.newRole,
    );
  }

  /**
   * List all collaborators
   */
  @Get(':reportId/collaborators')
  @ApiOperation({ summary: 'List all collaborators for a report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Collaborators list' })
  async listCollaborators(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.collaborationService.listCollaborators(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Create version snapshot
   */
  @Post(':reportId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create version snapshot' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.CreateVersionDto })
  @ApiResponse({ status: 201, description: 'Version created' })
  async createVersion(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.CreateVersionDto,
    @Request() req: any,
  ) {
    return await this.versionService.createVersion(
      reportId,
      req.user.userId,
      dto.changeMessage,
    );
  }

  /**
   * Get version history
   */
  @Get(':reportId/versions')
  @ApiOperation({ summary: 'Get version history' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Version history' })
  async getVersionHistory(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.versionService.getVersionHistory(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Get specific version
   */
  @Get(':reportId/versions/:versionNumber')
  @ApiOperation({ summary: 'Get specific version' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'versionNumber', type: 'number' })
  @ApiResponse({ status: 200, description: 'Version details' })
  async getVersion(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Request() req: any,
  ) {
    return await this.versionService.getVersion(
      reportId,
      versionNumber,
      req.user.userId,
    );
  }

  /**
   * Restore version
   */
  @Post(':reportId/versions/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore previous version' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.RestoreVersionDto })
  @ApiResponse({ status: 200, description: 'Version restored' })
  async restoreVersion(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.RestoreVersionDto,
    @Request() req: any,
  ) {
    return await this.versionService.restoreVersion(
      reportId,
      dto.versionNumber,
      req.user.userId,
    );
  }

  /**
   * Compare versions
   */
  @Post(':reportId/versions/compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.CompareVersionsDto })
  @ApiResponse({ status: 200, description: 'Version comparison' })
  async compareVersions(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.CompareVersionsDto,
    @Request() req: any,
  ) {
    return await this.versionService.compareVersions(
      reportId,
      dto.version1,
      dto.version2,
      req.user.userId,
    );
  }

  /**
   * Create comment
   */
  @Post(':reportId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create comment on report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async createComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.CreateCommentDto,
    @Request() req: any,
  ) {
    return await this.commentService.createComment(
      reportId,
      req.user.userId,
      dto.content,
      dto.sectionId,
      dto.parentId,
    );
  }

  /**
   * Get comments
   */
  @Get(':reportId/comments')
  @ApiOperation({ summary: 'Get all comments for report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiResponse({ status: 200, description: 'Comments list' })
  async getComments(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Query('sectionId') sectionId: string | undefined,
    @Request() req: any,
  ) {
    return await this.commentService.getComments(
      reportId,
      req.user.userId,
      sectionId,
    );
  }

  /**
   * Update comment
   */
  @Post(':reportId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update comment' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiBody({ type: CollaborationDto.UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  async updateComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CollaborationDto.UpdateCommentDto,
    @Request() req: any,
  ) {
    return await this.commentService.updateComment(
      commentId,
      req.user.userId,
      dto.content,
    );
  }

  /**
   * Delete comment
   */
  @Delete(':reportId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: any,
  ) {
    return await this.commentService.deleteComment(commentId, req.user.userId);
  }

  /**
   * Resolve comment
   */
  @Post(':reportId/comments/:commentId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve comment thread' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Comment resolved' })
  async resolveComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: any,
  ) {
    return await this.commentService.resolveComment(commentId, req.user.userId);
  }

  /**
   * Unresolve comment
   */
  @Post(':reportId/comments/:commentId/unresolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unresolve comment thread' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Comment unresolved' })
  async unresolveComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: any,
  ) {
    return await this.commentService.unresolveComment(
      commentId,
      req.user.userId,
    );
  }

  /**
   * Reply to comment
   */
  @Post(':reportId/comments/:commentId/replies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reply to a comment' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiBody({ type: CollaborationDto.ReplyToCommentDto })
  @ApiResponse({ status: 201, description: 'Reply created' })
  async replyToComment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CollaborationDto.ReplyToCommentDto,
    @Request() req: any,
  ) {
    return await this.commentService.replyToComment(
      commentId,
      req.user.userId,
      dto.content,
    );
  }

  /**
   * Track change
   */
  @Post(':reportId/changes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track change in report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.TrackChangeDto })
  @ApiResponse({ status: 201, description: 'Change tracked' })
  async trackChange(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.TrackChangeDto,
    @Request() req: any,
  ) {
    return await this.changeService.trackChange(
      reportId,
      req.user.userId,
      dto.sectionId,
      dto.changeType,
      dto.before || null,
      dto.after || null,
      dto.position,
    );
  }

  /**
   * Get pending changes
   */
  @Get(':reportId/changes')
  @ApiOperation({ summary: 'Get pending changes' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'changeType', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiResponse({ status: 200, description: 'Changes list' })
  async getPendingChanges(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Query('sectionId') sectionId: string | undefined,
    @Query('changeType') changeType: string | undefined,
    @Query('authorId') authorId: string | undefined,
    @Request() req: any,
  ) {
    return await this.changeService.getPendingChanges(
      reportId,
      req.user.userId,
      {
        sectionId,
        changeType: changeType as any,
        authorId,
      },
    );
  }

  /**
   * Accept change
   */
  @Post(':reportId/changes/:changeId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept change' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'changeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Change accepted' })
  async acceptChange(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('changeId', ParseUUIDPipe) changeId: string,
    @Request() req: any,
  ) {
    return await this.changeService.acceptChange(changeId, req.user.userId);
  }

  /**
   * Reject change
   */
  @Post(':reportId/changes/:changeId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject change' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'changeId', type: 'string' })
  @ApiBody({ type: CollaborationDto.RejectChangeDto })
  @ApiResponse({ status: 200, description: 'Change rejected' })
  async rejectChange(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('changeId', ParseUUIDPipe) changeId: string,
    @Body() dto: CollaborationDto.RejectChangeDto,
    @Request() req: any,
  ) {
    return await this.changeService.rejectChange(
      changeId,
      req.user.userId,
      dto.reason,
    );
  }

  /**
   * Accept all changes
   */
  @Post(':reportId/changes/accept-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept all pending changes' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'All changes accepted' })
  async acceptAllChanges(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.changeService.acceptAllChanges(reportId, req.user.userId);
  }

  /**
   * Reject all changes
   */
  @Post(':reportId/changes/reject-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject all pending changes' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.RejectAllChangesDto })
  @ApiResponse({ status: 200, description: 'All changes rejected' })
  async rejectAllChanges(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.RejectAllChangesDto,
    @Request() req: any,
  ) {
    return await this.changeService.rejectAllChanges(
      reportId,
      req.user.userId,
      dto.reason,
    );
  }

  /**
   * Get change statistics
   */
  @Get(':reportId/changes/stats')
  @ApiOperation({ summary: 'Get change statistics' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Change statistics' })
  async getChangeStatistics(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.changeService.getChangeStatistics(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Submit for approval
   */
  @Post(':reportId/approval/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit report for approval' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({ type: CollaborationDto.SubmitForApprovalDto })
  @ApiResponse({ status: 200, description: 'Submitted for approval' })
  async submitForApproval(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CollaborationDto.SubmitForApprovalDto,
    @Request() req: any,
  ) {
    return await this.approvalService.submitForApproval(
      reportId,
      req.user.userId,
      dto.reviewerIds,
      dto.message,
    );
  }

  /**
   * Approve report
   */
  @Post(':reportId/approval/:approvalId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'approvalId', type: 'string' })
  @ApiBody({ type: CollaborationDto.ApproveReportDto })
  @ApiResponse({ status: 200, description: 'Report approved' })
  async approveReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: CollaborationDto.ApproveReportDto,
    @Request() req: any,
  ) {
    return await this.approvalService.approveReport(
      approvalId,
      req.user.userId,
      dto.comments,
    );
  }

  /**
   * Reject report
   */
  @Post(':reportId/approval/:approvalId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'approvalId', type: 'string' })
  @ApiBody({ type: CollaborationDto.RejectReportDto })
  @ApiResponse({ status: 200, description: 'Report rejected' })
  async rejectReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: CollaborationDto.RejectReportDto,
    @Request() req: any,
  ) {
    return await this.approvalService.rejectReport(
      approvalId,
      req.user.userId,
      dto.comments,
    );
  }

  /**
   * Get approval requests
   */
  @Get(':reportId/approval')
  @ApiOperation({ summary: 'Get approval requests for report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Approval requests' })
  async getReportApprovals(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.approvalService.getReportApprovals(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Get user's pending approvals
   */
  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get pending approval requests for user' })
  @ApiResponse({ status: 200, description: 'Pending approvals' })
  async getPendingApprovalsForUser(@Request() req: any) {
    return await this.approvalService.getPendingApprovalsForUser(
      req.user.userId,
    );
  }

  /**
   * Cancel approval
   */
  @Post(':reportId/approval/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel approval process' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Approval cancelled' })
  async cancelApproval(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.approvalService.cancelApproval(reportId, req.user.userId);
  }

  /**
   * Publish report
   */
  @Post(':reportId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish approved report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Report published' })
  async publishReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.approvalService.publishReport(reportId, req.user.userId);
  }

  /**
   * Unpublish report
   */
  @Post(':reportId/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Report unpublished' })
  async unpublishReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.approvalService.unpublishReport(
      reportId,
      req.user.userId,
    );
  }

  // ============================================================================
  // SHARING ENDPOINTS - Phase 10 Day 4
  // ============================================================================

  /**
   * Generate shareable link
   */
  @Post(':reportId/share/link')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate shareable link for report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessLevel: {
          type: 'string',
          enum: ['view', 'comment', 'edit'],
          description: 'Access level for the link',
        },
        expiresIn: {
          type: 'number',
          description: 'Link expiration in days (optional)',
        },
        password: {
          type: 'string',
          description: 'Password protection (optional)',
        },
        allowedDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed email domains (optional)',
        },
        maxAccess: {
          type: 'number',
          description: 'Maximum access count (optional)',
        },
      },
      required: ['accessLevel'],
    },
  })
  @ApiResponse({ status: 201, description: 'Share link generated' })
  async generateShareLink(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() body: CollaborationDto.GenerateShareLinkDto,
    @Request() req: any,
  ) {
    return await this.sharingService.generateShareLink(
      reportId,
      req.user.userId,
      body,
    );
  }

  /**
   * Get all share links for a report
   */
  @Get(':reportId/share/links')
  @ApiOperation({ summary: 'Get all share links for report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Share links retrieved' })
  async getShareLinks(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.getShareLinks(reportId, req.user.userId);
  }

  /**
   * Revoke share link
   */
  @Post(':reportId/share/links/:linkId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke/disable share link' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'linkId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Share link revoked' })
  async revokeShareLink(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.revokeShareLink(linkId, req.user.userId);
  }

  /**
   * Delete share link
   */
  @Delete(':reportId/share/links/:linkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete share link permanently' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'linkId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Share link deleted' })
  async deleteShareLink(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.deleteShareLink(linkId, req.user.userId);
  }

  /**
   * Update share link
   */
  @Post(':reportId/share/links/:linkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update share link settings' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiParam({ name: 'linkId', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessLevel: { type: 'string', enum: ['view', 'comment', 'edit'] },
        expiresAt: { type: 'string', format: 'date-time' },
        maxAccess: { type: 'number' },
        allowedDomains: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Share link updated' })
  async updateShareLink(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() body: CollaborationDto.UpdateShareLinkDto,
    @Request() req: any,
  ) {
    return await this.sharingService.updateShareLink(
      linkId,
      req.user.userId,
      body,
    );
  }

  /**
   * Make report public
   */
  @Post(':reportId/share/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make report publicly accessible' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Report made public' })
  async makeReportPublic(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.makeReportPublic(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Make report private
   */
  @Post(':reportId/share/private')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make report private' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Report made private' })
  async makeReportPrivate(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.makeReportPrivate(
      reportId,
      req.user.userId,
    );
  }

  /**
   * Get sharing statistics
   */
  @Get(':reportId/share/stats')
  @ApiOperation({ summary: 'Get sharing statistics for report' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getSharingStatistics(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Request() req: any,
  ) {
    return await this.sharingService.getSharingStatistics(
      reportId,
      req.user.userId,
    );
  }
}
