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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InterpretationService } from '../services/interpretation.service';
import { ExplainabilityService } from '../services/explainability.service';

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

class ExtractStudyThemesDto {
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
@Controller('interpretation')
@UseGuards(JwtAuthGuard)
export class InterpretationController {
  constructor(
    private readonly interpretationService: InterpretationService,
    private readonly explainabilityService: ExplainabilityService,
  ) {}

  /**
   * Generate AI-powered factor narratives
   */
  @Post(':studyId/narratives')
  @ApiOperation({ summary: 'Generate factor narratives using AI' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Narratives generated successfully',
  })
  async generateNarratives(
    @Param('studyId') studyId: string,
    @Body() options: GenerateNarrativesDto,
  ) {
    return await this.interpretationService.generateFactorNarratives(
      studyId,
      options,
    );
  }

  /**
   * Generate study recommendations
   */
  @Post(':studyId/recommendations')
  @ApiOperation({ summary: 'Generate AI-powered study recommendations' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations generated successfully',
  })
  async generateRecommendations(
    @Param('studyId') studyId: string,
    @Body() options: GenerateRecommendationsDto,
  ) {
    return await this.interpretationService.generateRecommendations(
      studyId,
      options,
    );
  }

  /**
   * Analyze bias in the study
   */
  @Post(':studyId/bias')
  @ApiOperation({ summary: 'Analyze bias dimensions in the study' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bias analysis completed',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Themes extracted successfully',
  })
  async extractThemes(
    @Param('studyId') studyId: string,
    @Body() options: ExtractStudyThemesDto,
  ) {
    return await this.interpretationService.extractThemes(studyId, options);
  }

  /**
   * Get comprehensive insights summary
   */
  @Get(':studyId/summary')
  @ApiOperation({ summary: 'Get comprehensive AI insights summary' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Insights summary retrieved',
  })
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
  @ApiQuery({
    name: 'analysisDepth',
    required: false,
    enum: ['basic', 'standard', 'comprehensive'],
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Narratives retrieved' })
  async getNarratives(
    @Param('studyId') studyId: string,
    @Query('includeDistinguishing') includeDistinguishing?: boolean,
    @Query('includeConsensus') includeConsensus?: boolean,
    @Query('analysisDepth')
    analysisDepth?: 'basic' | 'standard' | 'comprehensive',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bias analysis retrieved',
  })
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
  @ApiQuery({
    name: 'method',
    required: false,
    enum: ['ai-powered', 'statistical'],
  })
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

  // ========================================================================
  // PHASE 10 DAYS 9-10: EXPLAINABILITY & AI GUARDRAILS ENDPOINTS
  // ========================================================================

  /**
   * Day 9: Calculate SHAP-inspired feature importance for factors
   */
  @Get(':studyId/explainability/feature-importance')
  @ApiOperation({ summary: 'Get statement feature importance for all factors (SHAP-inspired)' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature importance calculated successfully',
  })
  async getFeatureImportance(@Param('studyId') studyId: string) {
    return await this.explainabilityService.calculateFeatureImportance(studyId);
  }

  /**
   * Day 9: Generate counterfactual "what-if" scenarios
   */
  @Get(':studyId/explainability/counterfactuals')
  @ApiOperation({ summary: 'Generate what-if scenarios for factor analysis' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'scenarioCount', required: false, type: Number })
  @ApiQuery({ name: 'focusOnDistinguishing', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Counterfactuals generated successfully',
  })
  async getCounterfactuals(
    @Param('studyId') studyId: string,
    @Query('scenarioCount') scenarioCount?: number,
    @Query('focusOnDistinguishing') focusOnDistinguishing?: boolean,
  ) {
    return await this.explainabilityService.generateCounterfactuals(studyId, {
      scenarioCount: scenarioCount ? Number(scenarioCount) : undefined,
      focusOnDistinguishing: focusOnDistinguishing === true,
    });
  }

  /**
   * Day 9: Multi-dimensional bias audit
   */
  @Get(':studyId/explainability/bias-audit')
  @ApiOperation({ summary: 'Perform multi-dimensional bias audit for study quality' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bias audit completed successfully',
  })
  async getBiasAudit(@Param('studyId') studyId: string) {
    return await this.explainabilityService.performBiasAudit(studyId);
  }

  /**
   * Day 10: Calculate certainty score for interpretations
   */
  @Get(':studyId/explainability/certainty-score')
  @ApiOperation({ summary: 'Calculate certainty score for factor interpretations' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiQuery({ name: 'factorNumber', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certainty score calculated successfully',
  })
  async getCertaintyScore(
    @Param('studyId') studyId: string,
    @Query('factorNumber') factorNumber?: number,
  ) {
    return await this.explainabilityService.calculateCertaintyScore(
      studyId,
      factorNumber ? Number(factorNumber) : undefined,
    );
  }

  /**
   * Day 10: Generate alternative explanations for factors
   */
  @Get(':studyId/explainability/alternative-explanations/:factorNumber')
  @ApiOperation({ summary: 'Generate alternative interpretations for a factor' })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiParam({ name: 'factorNumber', description: 'Factor number' })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alternative explanations generated successfully',
  })
  async getAlternativeExplanations(
    @Param('studyId') studyId: string,
    @Param('factorNumber') factorNumber: string,
    @Query('count') count?: number,
  ) {
    return await this.explainabilityService.generateAlternativeExplanations(
      studyId,
      Number(factorNumber),
      count ? Number(count) : undefined,
    );
  }
}
