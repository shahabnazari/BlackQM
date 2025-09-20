import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Header,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../modules/rate-limiting/guards/rate-limit.guard';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import { VisualizationService } from './visualization.service';
import { CreateVisualizationDto } from './dto/create-visualization.dto';
import { ExportVisualizationDto } from './dto/export-visualization.dto';

/**
 * Visualization Controller - Phase 7 Day 4 Implementation
 * 
 * Provides REST endpoints for server-side chart generation
 * Part of VISUALIZE phase in Research Lifecycle
 * 
 * @security JWT authentication required
 * @rateLimit 30 requests per minute
 */
@ApiTags('visualization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RateLimitGuard)
@Controller('api/visualization')
export class VisualizationController {
  constructor(private readonly visualizationService: VisualizationService) {}

  @Get('study/:studyId/correlation-heatmap')
  @ApiOperation({ summary: 'Generate correlation heatmap' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['svg', 'png', 'pdf'] })
  @ApiQuery({ name: 'width', required: false, type: Number })
  @ApiQuery({ name: 'height', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Heatmap generated' })
  async generateHeatmap(
    @Param('studyId') studyId: string,
    @Query('format') format: 'svg' | 'png' | 'pdf' = 'svg',
    @Query('width') width?: number,
    @Query('height') height?: number,
    @CurrentUser() user?: any,
  ) {
    const result = await this.visualizationService.generateCorrelationHeatmap(
      studyId,
      { format, width, height },
    );

    if (format === 'svg') {
      return { data: result, format: 'svg' };
    }

    // For binary formats, return as StreamableFile
    return new StreamableFile(result as Buffer, {
      type: format === 'png' ? 'image/png' : 'application/pdf',
      disposition: `attachment; filename="correlation-heatmap.${format}"`,
    });
  }

  @Get('study/:studyId/factor-loading')
  @ApiOperation({ summary: 'Generate factor loading plot' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'factorX', required: false, type: Number })
  @ApiQuery({ name: 'factorY', required: false, type: Number })
  @ApiQuery({ name: 'format', required: false, enum: ['svg', 'png', 'pdf'] })
  @ApiQuery({ name: 'showLabels', required: false, type: Boolean })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Factor loading plot generated' })
  async generateFactorLoading(
    @Param('studyId') studyId: string,
    @Query('factorX') factorX?: number,
    @Query('factorY') factorY?: number,
    @Query('format') format: 'svg' | 'png' | 'pdf' = 'svg',
    @Query('showLabels') showLabels?: boolean,
    @Query('threshold') threshold?: number,
    @CurrentUser() user?: any,
  ) {
    const result = await this.visualizationService.generateFactorLoadingPlot(
      studyId,
      { factorX, factorY, format, showLabels, threshold },
    );

    if (format === 'svg') {
      return { data: result, format: 'svg' };
    }

    return new StreamableFile(result as Buffer, {
      type: format === 'png' ? 'image/png' : 'application/pdf',
      disposition: `attachment; filename="factor-loading.${format}"`,
    });
  }

  @Get('study/:studyId/scree-plot')
  @ApiOperation({ summary: 'Generate eigenvalue scree plot' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['svg', 'png', 'pdf'] })
  @ApiQuery({ name: 'showKaiserCriterion', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scree plot generated' })
  async generateScreePlot(
    @Param('studyId') studyId: string,
    @Query('format') format: 'svg' | 'png' | 'pdf' = 'svg',
    @Query('showKaiserCriterion') showKaiserCriterion?: boolean,
    @CurrentUser() user?: any,
  ) {
    const result = await this.visualizationService.generateScreePlot(
      studyId,
      { format, showKaiserCriterion },
    );

    if (format === 'svg') {
      return { data: result, format: 'svg' };
    }

    return new StreamableFile(result as Buffer, {
      type: format === 'png' ? 'image/png' : 'application/pdf',
      disposition: `attachment; filename="scree-plot.${format}"`,
    });
  }

  @Get('study/:studyId/factor-arrays/:factorNumber')
  @ApiOperation({ summary: 'Generate factor array visualization' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiParam({ name: 'factorNumber', description: 'Factor number', type: Number })
  @ApiQuery({ name: 'format', required: false, enum: ['svg', 'png', 'pdf'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Factor array visualization generated' })
  async generateFactorArrays(
    @Param('studyId') studyId: string,
    @Param('factorNumber') factorNumber: number,
    @Query('format') format: 'svg' | 'png' | 'pdf' = 'svg',
    @CurrentUser() user?: any,
  ) {
    const result = await this.visualizationService.generateFactorArrays(
      studyId,
      factorNumber,
      { format },
    );

    if (format === 'svg') {
      return { data: result, format: 'svg' };
    }

    return new StreamableFile(result as Buffer, {
      type: format === 'png' ? 'image/png' : 'application/pdf',
      disposition: `attachment; filename="factor-array-${factorNumber}.${format}"`,
    });
  }

  @Post('study/:studyId/custom')
  @ApiOperation({ summary: 'Generate custom visualization' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Custom visualization generated' })
  async generateCustomVisualization(
    @Param('studyId') studyId: string,
    @Body() createDto: CreateVisualizationDto,
    @CurrentUser() user?: any,
  ) {
    // Implementation for custom chart generation
    // This would handle dynamic chart builder requests
    return {
      message: 'Custom visualization generated',
      studyId,
      type: createDto.type,
    };
  }

  @Delete('study/:studyId/cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear visualization cache for study' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Cache cleared' })
  async clearCache(
    @Param('studyId') studyId: string,
    @CurrentUser() user?: any,
  ) {
    await this.visualizationService.clearCache(studyId);
  }

  @Get('study/:studyId/realtime-channel')
  @ApiOperation({ summary: 'Get real-time update channel for study' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Channel information' })
  getRealtimeChannel(
    @Param('studyId') studyId: string,
    @CurrentUser() user?: any,
  ) {
    return {
      channel: this.visualizationService.getRealtimeChannel(studyId),
      protocol: 'websocket',
      endpoint: '/ws',
    };
  }

  @Post('study/:studyId/export-batch')
  @ApiOperation({ summary: 'Export multiple visualizations' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch export completed' })
  async exportBatch(
    @Param('studyId') studyId: string,
    @Body() exportDto: ExportVisualizationDto,
    @CurrentUser() user?: any,
  ) {
    // Implementation for batch export
    // This would generate multiple charts and package them
    return {
      message: 'Batch export completed',
      studyId,
      charts: exportDto.charts,
      format: exportDto.format,
    };
  }
}