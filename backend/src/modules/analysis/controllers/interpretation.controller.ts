import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InterpretationService } from '../services/interpretation.service';

class GenerateNarrativesDto {
  includeDistinguishing?: boolean;
  includeConsensus?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
}

class GenerateRecommendationsDto {
  includeActionItems?: boolean;
  prioritize?: boolean;
}

class AnalyzeBiasDto {
  dimensions?: string[];
  includeRecommendations?: boolean;
}

class ExtractThemesDto {
  method?: 'ai-powered' | 'statistical';
  minOccurrence?: number;
  includeQuotes?: boolean;
}

/**
 * Interpretation Controller - Phase 7 Day 5
 * 
 * Exposes AI-powered interpretation endpoints for the Analysis Hub
 */
@ApiTags('interpretation')
@Controller('api/interpretation')
@UseGuards(AuthGuard('jwt'))
export class InterpretationController {
  constructor(private readonly interpretationService: InterpretationService) {}

  /**
   * Generate AI-powered factor narratives
   */
  @Post(':studyId/narratives')
  @ApiOperation({ summary: 'Generate factor narratives using AI' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Narratives generated successfully' })
  async generateNarratives(
    @Param('studyId') studyId: string,
    @Body() options: GenerateNarrativesDto,
  ) {
    return await this.interpretationService.generateFactorNarratives(studyId, options);
  }

  /**
   * Generate study recommendations
   */
  @Post(':studyId/recommendations')
  @ApiOperation({ summary: 'Generate AI-powered study recommendations' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recommendations generated successfully' })
  async generateRecommendations(
    @Param('studyId') studyId: string,
    @Body() options: GenerateRecommendationsDto,
  ) {
    return await this.interpretationService.generateRecommendations(studyId, options);
  }

  /**
   * Analyze bias in the study
   */
  @Post(':studyId/bias')
  @ApiOperation({ summary: 'Analyze bias dimensions in the study' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bias analysis completed' })
  async analyzeBias(
    @Param('studyId') studyId: string,
    @Body() options: AnalyzeBiasDto,
  ) {
    return await this.interpretationService.analyzeBias(studyId, options);
  }

  /**
   * Extract themes from study data
   */
  @Post(':studyId/themes')
  @ApiOperation({ summary: 'Extract themes from study responses' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Themes extracted successfully' })
  async extractThemes(
    @Param('studyId') studyId: string,
    @Body() options: ExtractThemesDto,
  ) {
    return await this.interpretationService.extractThemes(studyId, options);
  }

  /**
   * Get comprehensive insights summary
   */
  @Get(':studyId/summary')
  @ApiOperation({ summary: 'Get comprehensive AI insights summary' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Insights summary retrieved' })
  async getInsightsSummary(@Param('studyId') studyId: string) {
    return await this.interpretationService.generateInsightsSummary(studyId);
  }

  /**
   * Get cached narratives if available
   */
  @Get(':studyId/narratives')
  @ApiOperation({ summary: 'Get cached factor narratives' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'includeDistinguishing', required: false, type: Boolean })
  @ApiQuery({ name: 'includeConsensus', required: false, type: Boolean })
  @ApiQuery({ name: 'analysisDepth', required: false, enum: ['basic', 'standard', 'comprehensive'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Narratives retrieved' })
  async getNarratives(
    @Param('studyId') studyId: string,
    @Query('includeDistinguishing') includeDistinguishing?: boolean,
    @Query('includeConsensus') includeConsensus?: boolean,
    @Query('analysisDepth') analysisDepth?: 'basic' | 'standard' | 'comprehensive',
  ) {
    return await this.interpretationService.generateFactorNarratives(studyId, {
      includeDistinguishing,
      includeConsensus,
      analysisDepth,
    });
  }

  /**
   * Get cached recommendations if available
   */
  @Get(':studyId/recommendations')
  @ApiOperation({ summary: 'Get cached study recommendations' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'includeActionItems', required: false, type: Boolean })
  @ApiQuery({ name: 'prioritize', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recommendations retrieved' })
  async getRecommendations(
    @Param('studyId') studyId: string,
    @Query('includeActionItems') includeActionItems?: boolean,
    @Query('prioritize') prioritize?: boolean,
  ) {
    return await this.interpretationService.generateRecommendations(studyId, {
      includeActionItems,
      prioritize,
    });
  }

  /**
   * Get cached bias analysis if available
   */
  @Get(':studyId/bias')
  @ApiOperation({ summary: 'Get cached bias analysis' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'dimensions', required: false, type: [String] })
  @ApiQuery({ name: 'includeRecommendations', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bias analysis retrieved' })
  async getBiasAnalysis(
    @Param('studyId') studyId: string,
    @Query('dimensions') dimensions?: string[],
    @Query('includeRecommendations') includeRecommendations?: boolean,
  ) {
    return await this.interpretationService.analyzeBias(studyId, {
      dimensions,
      includeRecommendations,
    });
  }

  /**
   * Get cached themes if available
   */
  @Get(':studyId/themes')
  @ApiOperation({ summary: 'Get cached extracted themes' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'method', required: false, enum: ['ai-powered', 'statistical'] })
  @ApiQuery({ name: 'minOccurrence', required: false, type: Number })
  @ApiQuery({ name: 'includeQuotes', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Themes retrieved' })
  async getThemes(
    @Param('studyId') studyId: string,
    @Query('method') method?: 'ai-powered' | 'statistical',
    @Query('minOccurrence') minOccurrence?: number,
    @Query('includeQuotes') includeQuotes?: boolean,
  ) {
    return await this.interpretationService.extractThemes(studyId, {
      method,
      minOccurrence,
      includeQuotes,
    });
  }
}