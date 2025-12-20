import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { UnifiedAIService } from '../services/unified-ai.service';
import { AICostService } from '../services/ai-cost.service';

// ============================================================================
// Phase 10.185 Week 3: System Prompts for AI Controller
// ============================================================================

const TEXT_ANALYSIS_SYSTEM_PROMPT = `You are an expert text analyst specializing in research content analysis.

Your role is to:
1. Analyze sentiment, themes, and potential biases in text
2. Identify key patterns and linguistic features
3. Provide actionable insights for researchers

Output format depends on the analysis type requested.`;

const PARTICIPANT_ASSISTANCE_SYSTEM_PROMPT = `You are a friendly and helpful research study assistant.

Your role is to:
1. Guide participants through Q-methodology studies
2. Provide clear, encouraging instructions
3. Answer questions about study procedures
4. Help participants feel comfortable and informed

Keep responses concise (2-3 sentences) and supportive.`;

const RESPONSE_ANALYSIS_SYSTEM_PROMPT = `You are an expert Q-methodology data analyst.

Your role is to:
1. Identify patterns in Q-sort responses
2. Detect anomalies and quality issues
3. Extract meaningful insights
4. Flag suspicious response patterns

Output must be valid JSON as specified in the prompt.`;

const BIAS_DETECTION_SYSTEM_PROMPT = `You are an expert in detecting bias in research statements.

Your role is to:
1. Identify political, cultural, gender, age, and socioeconomic biases
2. Detect leading language and loaded terms
3. Provide specific recommendations for neutralization
4. Rate bias severity on a 0-1 scale

Output must be valid JSON as specified in the prompt.`;
import { StatementGeneratorService } from '../services/statement-generator.service';
import { GridRecommendationService } from '../services/grid-recommendation.service';
import { QuestionnaireGeneratorService } from '../services/questionnaire-generator.service';
import { QueryExpansionService } from '../services/query-expansion.service';
import {
  GridRecommendationDto,
  GenerateQuestionnaireDto,
  ParticipantAssistanceDto,
  AnalyzeResponsesDto,
  BiasDetectionDto,
  StatementVariationsDto,
  UpdateBudgetDto,
} from '../dtos/ai-request.dto';

// DTOs
class GenerateStatementsDto {
  topic!: string;
  count?: number;
  perspectives?: string[];
  avoidBias?: boolean;
  academicLevel?: 'basic' | 'intermediate' | 'advanced';
  maxLength?: number;
}

class ValidateStatementsDto {
  statements!: Array<{
    id: string;
    text: string;
    perspective?: string;
    polarity?: 'positive' | 'negative' | 'neutral';
  }>;
  topic!: string;
}

class AnalyzeTextDto {
  text!: string;
  analysisType!: 'sentiment' | 'themes' | 'bias';
}

class NeutralizeStatementDto {
  statement!: string;
}

class CulturalSensitivityDto {
  statements!: string[];
  targetRegions?: string[];
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly unifiedAIService: UnifiedAIService,
    private readonly costService: AICostService,
    private readonly statementGenerator: StatementGeneratorService,
    private readonly gridRecommendation: GridRecommendationService,
    private readonly questionnaireGenerator: QuestionnaireGeneratorService,
    private readonly queryExpansion: QueryExpansionService,
  ) {}

  @Post('generate-statements')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async generateStatements(
    @Body() dto: GenerateStatementsDto,
    @Req() req: any,
  ) {
    try {
      this.logger.log(`Generating statements for topic: ${dto.topic}`);

      // Validate input
      if (!dto.topic || dto.topic.trim().length < 3) {
        throw new HttpException(
          'Invalid topic provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (dto.count && (dto.count < 10 || dto.count > 100)) {
        throw new HttpException(
          'Statement count must be between 10 and 100',
          HttpStatus.BAD_REQUEST,
        );
      }

      const statements = await this.statementGenerator.generateStatements(
        dto.topic,
        {
          count: dto.count,
          perspectives: dto.perspectives,
          avoidBias: dto.avoidBias,
          academicLevel: dto.academicLevel,
          maxLength: dto.maxLength,
        },
        req.user.id,
      );

      return {
        success: true,
        statements,
        count: statements.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate statements:', error);

      if (error.message?.includes('budget limit exceeded')) {
        throw new HttpException(
          'AI budget limit exceeded. Please contact support.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (error.message?.includes('Rate limit exceeded')) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Failed to generate statements. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate-statements')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async validateStatements(
    @Body() dto: ValidateStatementsDto,
    @Req() req: any,
  ) {
    try {
      const validation = await this.statementGenerator.validateStatements(
        dto.statements,
        dto.topic,
        req.user.id,
      );

      return {
        success: true,
        validation,
      };
    } catch (error) {
      this.logger.error('Failed to validate statements:', error);
      throw new HttpException(
        'Failed to validate statements',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-text')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async analyzeText(@Body() dto: AnalyzeTextDto, @Req() req: any) {
    try {
      const prompt = `Analyze the following text for ${dto.analysisType}:\n\n${dto.text}`;
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        cache: true,
        systemPrompt: TEXT_ANALYSIS_SYSTEM_PROMPT,
      });
      const analysis = response.content;

      return {
        success: true,
        analysis,
        analysisType: dto.analysisType,
      };
    } catch (error) {
      this.logger.error('Failed to analyze text:', error);
      throw new HttpException(
        'Failed to analyze text',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('neutralize-statement')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Higher limit for quick operations
  async neutralizeStatement(
    @Body() dto: NeutralizeStatementDto,
    @Req() req: any,
  ) {
    try {
      const neutralized =
        await this.statementGenerator.suggestNeutralAlternative(
          dto.statement,
          req.user.id,
        );

      return {
        success: true,
        original: dto.statement,
        neutralized,
      };
    } catch (error) {
      this.logger.error('Failed to neutralize statement:', error);
      throw new HttpException(
        'Failed to neutralize statement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cultural-sensitivity')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async checkCulturalSensitivity(
    @Body() dto: CulturalSensitivityDto,
    @Req() req: any,
  ) {
    try {
      const sensitivity =
        await this.statementGenerator.checkCulturalSensitivity(
          dto.statements,
          dto.targetRegions,
          req.user.id,
        );

      return {
        success: true,
        sensitivity,
      };
    } catch (error) {
      this.logger.error('Failed to check cultural sensitivity:', error);
      throw new HttpException(
        'Failed to check cultural sensitivity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage/summary')
  async getUsageSummary(@Req() req: any) {
    try {
      const summary = await this.costService.getCostSummary(req.user.id);
      const details = await this.costService.getUsageDetails(req.user.id, 30);

      return {
        success: true,
        costSummary: summary,
        usageDetails: details,
      };
    } catch (error) {
      this.logger.error('Failed to get usage summary:', error);
      throw new HttpException(
        'Failed to retrieve usage summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage/report')
  async getUsageReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    try {
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const report = await this.costService.generateUsageReport(
        req.user.id,
        start,
        end,
      );

      return {
        success: true,
        report,
      };
    } catch (error) {
      this.logger.error('Failed to generate usage report:', error);
      throw new HttpException(
        'Failed to generate usage report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Grid Recommendation Endpoint
  @Post('grid/recommend')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  async getGridRecommendations(
    @Body() dto: GridRecommendationDto,
    @Req() req: any,
  ) {
    try {
      this.logger.log(
        `Generating grid recommendations for topic: ${dto.studyTopic}`,
      );

      const recommendations = await this.gridRecommendation.getRecommendations(
        dto.studyTopic,
        dto.expectedStatements,
        dto.participantExperience,
        dto.researchType,
        req.user.id,
      );

      return {
        success: true,
        recommendations,
        count: recommendations.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate grid recommendations:', error);
      throw new HttpException(
        error.message || 'Failed to generate grid recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Questionnaire Generation Endpoint
  @Post('questionnaire/generate')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async generateQuestionnaire(
    @Body() dto: GenerateQuestionnaireDto,
    @Req() req: any,
  ) {
    try {
      this.logger.log(`Generating questionnaire for topic: ${dto.studyTopic}`);

      const questions = await this.questionnaireGenerator.generateQuestionnaire(
        dto.studyTopic,
        dto.questionCount,
        dto.questionTypes,
        dto.targetAudience,
        dto.includeSkipLogic || false,
        req.user.id,
      );

      return {
        success: true,
        questions,
        count: questions.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate questionnaire:', error);
      throw new HttpException(
        error.message || 'Failed to generate questionnaire',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Participant Assistance Endpoint
  @Post('participant/assist')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Higher limit for real-time assistance
  async assistParticipant(
    @Body() dto: ParticipantAssistanceDto,
    @Req() req: any,
  ) {
    try {
      this.logger.log(
        `Assisting participant ${dto.participantId} at stage: ${dto.stage}`,
      );

      const prompt = this.buildParticipantAssistancePrompt(dto);
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.7,
        maxTokens: 500,
        cache: true,
        systemPrompt: PARTICIPANT_ASSISTANCE_SYSTEM_PROMPT,
      });

      return {
        success: true,
        assistance: {
          message: response.content,
          stage: dto.stage,
          participantId: dto.participantId,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to assist participant:', error);
      throw new HttpException(
        'Failed to provide participant assistance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Response Analysis Endpoint
  @Post('responses/analyze')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async analyzeResponses(@Body() dto: AnalyzeResponsesDto, @Req() req: any) {
    try {
      this.logger.log(`Analyzing ${dto.responses.length} responses`);

      const analysisTypes = dto.analysisTypes || [
        'patterns',
        'quality',
        'insights',
      ];
      const analysis: any = {};

      for (const type of analysisTypes) {
        const prompt = this.buildAnalysisPrompt(type, dto.responses);
        const result = await this.unifiedAIService.generateCompletion(prompt, {
          model: 'smart',
          temperature: 0.5,
          maxTokens: 1000,
          cache: true,
          systemPrompt: RESPONSE_ANALYSIS_SYSTEM_PROMPT,
        });

        analysis[type] = this.parseAnalysisResult(result.content);
      }

      return {
        success: true,
        analysis,
        participantCount: dto.responses.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to analyze responses:', error);
      throw new HttpException(
        'Failed to analyze responses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bias Detection Endpoint
  @Post('bias/detect')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async detectBias(@Body() dto: BiasDetectionDto, @Req() req: any) {
    try {
      this.logger.log(`Detecting bias in ${dto.statements.length} statements`);

      const depth = dto.analysisDepth || 'quick';
      const prompt = this.buildBiasDetectionPrompt(dto.statements, depth);

      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: depth === 'comprehensive' ? 'smart' : 'fast',
        temperature: 0.3,
        maxTokens: depth === 'comprehensive' ? 2000 : 1000,
        cache: true,
        systemPrompt: BIAS_DETECTION_SYSTEM_PROMPT,
      });

      const biasAnalysis = this.parseBiasAnalysis(response.content);

      if (dto.suggestAlternatives) {
        biasAnalysis.alternatives = await this.generateAlternatives(
          dto.statements.filter((s) =>
            biasAnalysis.biasedStatements?.includes(s),
          ),
          req.user.id,
        );
      }

      return {
        success: true,
        analysis: biasAnalysis,
        depth,
      };
    } catch (error: any) {
      this.logger.error('Failed to detect bias:', error);
      throw new HttpException(
        'Failed to detect bias',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('budget/update')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Strict rate limit for budget updates
  async updateBudget(@Body() dto: UpdateBudgetDto, @Req() req: any) {
    try {
      // Only allow admins or the user themselves to update budget
      await this.costService.updateBudgetLimit(
        req.user.id,
        dto.dailyLimit,
        dto.monthlyLimit,
      );

      const summary = await this.costService.getCostSummary(req.user.id);

      return {
        success: true,
        message: 'Budget limits updated successfully',
        currentLimits: {
          daily: summary.dailyLimit,
          monthly: summary.monthlyLimit,
        },
      };
    } catch (error) {
      this.logger.error('Failed to update budget:', error);
      throw new HttpException(
        'Failed to update budget limits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('perspective-guidelines')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generatePerspectiveGuidelines(
    @Body() dto: { topic: string },
    @Req() req: any,
  ) {
    try {
      const guidelines =
        await this.statementGenerator.generatePerspectiveGuidelines(
          dto.topic,
          req.user.id,
        );

      return {
        success: true,
        perspectives: guidelines,
      };
    } catch (error) {
      this.logger.error('Failed to generate perspective guidelines:', error);
      throw new HttpException(
        'Failed to generate perspective guidelines',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('statement-variations')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async generateStatementVariations(
    @Body() dto: { statement: string; count?: number },
    @Req() req: any,
  ) {
    try {
      const variations =
        await this.statementGenerator.generateStatementVariations(
          dto.statement,
          dto.count || 3,
          req.user.id,
        );

      return {
        success: true,
        original: dto.statement,
        variations,
      };
    } catch (error) {
      this.logger.error('Failed to generate statement variations:', error);
      throw new HttpException(
        'Failed to generate statement variations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Query Expansion Endpoints (Day 26)
  @Post('query/expand')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async expandQuery(
    @Body()
    dto: {
      query: string;
      domain?: 'climate' | 'health' | 'education' | 'general';
    },
    @Req() req: any,
  ) {
    try {
      this.logger.log(`Expanding query: ${dto.query}`);

      if (!dto.query || dto.query.trim().length < 2) {
        throw new HttpException(
          'Query must be at least 2 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.queryExpansion.expandQuery(
        dto.query,
        dto.domain || 'general',
      );

      return {
        success: true,
        expanded: result,
      };
    } catch (error: any) {
      this.logger.error('Failed to expand query:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to expand query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Public Query Expansion (for development/testing)
  @Public()
  @Post('query/expand/public')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async expandQueryPublic(
    @Body()
    dto: {
      query: string;
      domain?: 'climate' | 'health' | 'education' | 'general';
    },
  ) {
    try {
      this.logger.log(`[PUBLIC] Expanding query: ${dto.query}`);

      if (!dto.query || dto.query.trim().length < 2) {
        throw new HttpException(
          'Query must be at least 2 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.queryExpansion.expandQuery(
        dto.query,
        dto.domain || 'general',
      );

      return {
        success: true,
        expanded: result,
      };
    } catch (error: any) {
      this.logger.error('[PUBLIC] Failed to expand query:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to expand query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('query/suggest-terms')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async suggestTerms(
    @Body() dto: { query: string; field?: string },
    @Req() req: any,
  ) {
    try {
      this.logger.log(`Suggesting terms for: ${dto.query}`);

      if (!dto.query || dto.query.trim().length < 2) {
        throw new HttpException(
          'Query must be at least 2 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.queryExpansion.suggestTerms(
        dto.query,
        dto.field,
      );

      return {
        success: true,
        terms: result.terms,
        confidence: result.confidence,
      };
    } catch (error: any) {
      this.logger.error('Failed to suggest terms:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to suggest terms',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('query/narrow')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async narrowQuery(@Body() dto: { query: string }, @Req() req: any) {
    try {
      this.logger.log(`Narrowing query: ${dto.query}`);

      if (!dto.query || dto.query.trim().length < 2) {
        throw new HttpException(
          'Query must be at least 2 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.queryExpansion.narrowQuery(dto.query);

      return {
        success: true,
        narrowed: result.narrowed,
        reasoning: result.reasoning,
      };
    } catch (error: any) {
      this.logger.error('Failed to narrow query:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to narrow query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper methods for prompts and parsing
  private buildParticipantAssistancePrompt(
    dto: ParticipantAssistanceDto,
  ): string {
    const stagePrompts = {
      consent:
        'Provide clear, friendly guidance about the study consent process.',
      prescreening:
        'Help the participant understand the pre-screening questions.',
      presorting:
        'Explain the Q-sort process and provide tips for getting started.',
      qsort:
        'Offer encouragement and tips for completing the Q-sort effectively.',
      postsurvey: 'Guide the participant through the final survey questions.',
    };

    return `${stagePrompts[dto.stage as keyof typeof stagePrompts]}

Context: ${JSON.stringify(dto.context || {})}
Question: ${dto.question || 'General assistance needed'}

Provide helpful, encouraging guidance in 2-3 sentences.`;
  }

  private buildAnalysisPrompt(type: string, responses: any[]): string {
    const prompts = {
      patterns: `Identify patterns in these Q-sort responses: ${JSON.stringify(responses)}
Return JSON with: commonPatterns, clusters, outliers`,
      quality: `Assess the quality of these responses: ${JSON.stringify(responses)}
Return JSON with: overallQuality, flaggedResponses, completionRate`,
      anomalies: `Detect anomalies in these responses: ${JSON.stringify(responses)}
Return JSON with: anomalies, suspiciousPatterns, recommendations`,
      insights: `Extract insights from these responses: ${JSON.stringify(responses)}
Return JSON with: keyInsights, trends, recommendations`,
    };

    return prompts[type as keyof typeof prompts] || prompts.patterns;
  }

  private buildBiasDetectionPrompt(
    statements: string[],
    depth: string,
  ): string {
    return `Analyze these statements for bias (${depth} analysis):

${statements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Check for:
- Political bias
- Cultural bias
- Gender bias
- Age bias
- Socioeconomic bias
- Leading language

Return JSON with:
{
  "overallBiasScore": 0.0-1.0,
  "biasedStatements": ["statement1", "statement2"],
  "biasTypes": {
    "political": 0.0-1.0,
    "cultural": 0.0-1.0,
    "gender": 0.0-1.0,
    "age": 0.0-1.0,
    "socioeconomic": 0.0-1.0,
    "leading": 0.0-1.0
  },
  "recommendations": ["suggestion1", "suggestion2"]
}`;
  }

  private parseAnalysisResult(result: string): any {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: result };
    } catch {
      return { raw: result };
    }
  }

  private parseBiasAnalysis(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        overallBiasScore: 0.5,
        biasedStatements: [],
        biasTypes: {},
        recommendations: [],
      };
    } catch {
      return {
        overallBiasScore: 0.5,
        biasedStatements: [],
        biasTypes: {},
        recommendations: [],
      };
    }
  }

  private async generateAlternatives(
    biasedStatements: string[],
    userId: string,
  ): Promise<Record<string, string>> {
    const alternatives: Record<string, string> = {};

    for (const statement of biasedStatements) {
      const prompt = `Rewrite this statement to be more neutral and unbiased: "${statement}"
Return only the improved statement.`;

      const alternative = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.7,
        maxTokens: 100,
        cache: true,
        systemPrompt: BIAS_DETECTION_SYSTEM_PROMPT,
      });

      alternatives[statement] = alternative.content.trim();
    }

    return alternatives;
  }
}
