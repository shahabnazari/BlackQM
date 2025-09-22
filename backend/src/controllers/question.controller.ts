import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseInterceptors
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../guards/jwt-auth.guard'; // TODO: Implement auth guard
import { QuestionService } from '../services/question.service';
import { ScreeningService } from '../services/screening.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionDto,
  ImportQuestionsDto,
  UpdateQuestionOrderDto,
  SubmitAnswerDto,
  ExportQuestionsDto
} from '../dto/question.dto';
import { Question } from '@prisma/client';

/**
 * Phase 8.2 Day 1: World-Class Question Controller
 * 
 * Comprehensive API for question management:
 * - CRUD operations with validation
 * - Bulk operations
 * - Import/Export functionality
 * - Skip logic management
 * - Template library
 * - AI suggestions
 * - Screening evaluation
 */
@ApiTags('questions')
@Controller('api/questions')
// @UseGuards(JwtAuthGuard) // TODO: Enable auth when guard is implemented
@ApiBearerAuth()
// @UseInterceptors(CacheInterceptor) // TODO: Add caching when available
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly screeningService: ScreeningService
  ) {}

  /**
   * Create a new question
   */
  @Post()
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Question created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid question data' 
  })
  async create(@Body() createQuestionDto: CreateQuestionDto): Promise<Question> {
    return this.questionService.create(createQuestionDto);
  }

  /**
   * Get all questions for a survey
   */
  @Get('survey/:surveyId')
  @ApiOperation({ summary: 'Get all questions for a survey' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by question type' })
  @ApiQuery({ name: 'required', required: false, description: 'Filter by required status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (0-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findBySurvey(
    @Param('surveyId') surveyId: string,
    @Query() query: QueryQuestionDto
  ): Promise<Question[]> {
    return this.questionService.findBySurvey(surveyId, query);
  }

  /**
   * Get screening questions for a survey
   */
  @Get('survey/:surveyId/screening')
  @ApiOperation({ summary: 'Get screening questions for a survey' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async getScreeningQuestions(
    @Param('surveyId') surveyId: string
  ): Promise<Question[]> {
    return this.screeningService.getScreeningQuestions(surveyId);
  }

  /**
   * Get a single question
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async findOne(@Param('id') id: string): Promise<Question> {
    return this.questionService.findOne(id);
  }

  /**
   * Update a question
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto
  ): Promise<Question> {
    return this.questionService.update(id, updateQuestionDto);
  }

  /**
   * Delete a question
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.questionService.remove(id);
  }

  /**
   * Update question order
   */
  @Put('survey/:surveyId/order')
  @ApiOperation({ summary: 'Update question order for a survey' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async updateOrder(
    @Param('surveyId') surveyId: string,
    @Body() updateOrderDto: UpdateQuestionOrderDto
  ): Promise<void> {
    return this.questionService.updateOrder(updateOrderDto);
  }

  /**
   * Import questions
   */
  @Post('import')
  @ApiOperation({ summary: 'Import multiple questions' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Questions imported successfully' 
  })
  async importQuestions(
    @Body() importDto: ImportQuestionsDto
  ): Promise<Question[]> {
    return this.questionService.importQuestions(importDto);
  }

  /**
   * Export questions
   */
  @Post('export')
  @ApiOperation({ summary: 'Export questions in various formats' })
  async exportQuestions(
    @Body() exportDto: ExportQuestionsDto
  ): Promise<any> {
    // This would typically return a file download
    // For now, return the questions in requested format
    const questions = await this.questionService.findBySurvey(exportDto.surveyId);
    
    switch (exportDto.format) {
      case 'json':
        return questions;
      case 'csv':
        // Convert to CSV format
        return this.convertToCSV(questions);
      case 'xlsx':
        // Would use a library like exceljs
        return { message: 'Excel export not yet implemented' };
      case 'qsf':
        // Qualtrics Survey Format
        return this.convertToQSF(questions);
      default:
        throw new BadRequestException('Invalid export format');
    }
  }

  /**
   * Duplicate questions from one survey to another
   */
  @Post('duplicate')
  @ApiOperation({ summary: 'Duplicate questions between surveys' })
  async duplicateQuestions(
    @Body() body: { fromSurveyId: string; toSurveyId: string }
  ): Promise<Question[]> {
    return this.questionService.duplicateQuestions(
      body.fromSurveyId, 
      body.toSurveyId
    );
  }

  /**
   * Get question templates
   */
  @Get('templates')
  @ApiOperation({ summary: 'Get question templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Template category' })
  async getTemplates(
    @Query('category') category?: string
  ): Promise<any[]> {
    return this.questionService.getTemplates(category);
  }

  /**
   * Get AI-generated question suggestions
   */
  @Post('ai/suggestions')
  @ApiOperation({ summary: 'Get AI-generated question suggestions' })
  async getAISuggestions(
    @Body() context: {
      surveyTitle: string;
      existingQuestions: string[];
      targetAudience?: string;
    }
  ): Promise<CreateQuestionDto[]> {
    return this.questionService.getAISuggestions(context);
  }

  /**
   * Validate an answer
   */
  @Post('validate')
  @ApiOperation({ summary: 'Validate an answer against question rules' })
  async validateAnswer(
    @Body() body: { questionId: string; value: any }
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const valid = await this.questionService.validateAnswer(
      body.questionId,
      body.value
    );
    
    return {
      valid,
      errors: valid ? undefined : ['Value does not meet validation requirements']
    };
  }

  /**
   * Get visible questions based on skip logic
   */
  @Post('survey/:surveyId/visible')
  @ApiOperation({ summary: 'Get visible questions based on previous answers' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async getVisibleQuestions(
    @Param('surveyId') surveyId: string,
    @Body() body: { previousAnswers: Record<string, any> }
  ): Promise<Question[]> {
    return this.questionService.getVisibleQuestions(
      surveyId,
      body.previousAnswers
    );
  }

  /**
   * Evaluate screening responses
   */
  @Post('survey/:surveyId/screening/evaluate')
  @ApiOperation({ summary: 'Evaluate screening responses' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async evaluateScreening(
    @Param('surveyId') surveyId: string,
    @Body() body: { 
      participantId: string; 
      responses: Record<string, any> 
    },
    @Request() req: any
  ): Promise<any> {
    const result = await this.screeningService.evaluateScreening(
      surveyId,
      body.participantId || req.user.id,
      body.responses
    );

    // Update quotas if qualified
    if (result.qualified) {
      await this.screeningService.updateQuotaCounts(surveyId, body.responses);
    }

    return result;
  }

  /**
   * Get screening configuration
   */
  @Get('survey/:surveyId/screening/config')
  @ApiOperation({ summary: 'Get screening configuration for a survey' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async getScreeningConfig(
    @Param('surveyId') surveyId: string
  ): Promise<any> {
    return this.screeningService.getScreeningConfiguration(surveyId);
  }

  /**
   * Update screening configuration
   */
  @Put('survey/:surveyId/screening/config')
  @ApiOperation({ summary: 'Update screening configuration' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async updateScreeningConfig(
    @Param('surveyId') surveyId: string,
    @Body() config: any
  ): Promise<void> {
    config.surveyId = surveyId;
    return this.screeningService.saveScreeningConfiguration(config);
  }

  /**
   * Get screening statistics
   */
  @Get('survey/:surveyId/screening/statistics')
  @ApiOperation({ summary: 'Get screening statistics' })
  @ApiParam({ name: 'surveyId', description: 'Survey ID' })
  async getScreeningStatistics(
    @Param('surveyId') surveyId: string
  ): Promise<any> {
    return this.screeningService.getScreeningStatistics(surveyId);
  }

  // ============= Helper Methods =============

  /**
   * Convert questions to CSV format
   */
  private convertToCSV(questions: Question[]): string {
    const headers = ['ID', 'Type', 'Text', 'Description', 'Required', 'Order'];
    const rows = questions.map(q => [
      q.id,
      q.type,
      `"${q.text.replace(/"/g, '""')}"`,
      `"${(q.description || '').replace(/"/g, '""')}"`,
      q.required,
      q.order
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert questions to Qualtrics Survey Format (QSF)
   */
  private convertToQSF(questions: Question[]): any {
    // Simplified QSF format
    return {
      SurveyEntry: {
        SurveyID: 'SV_' + Date.now(),
        SurveyName: 'Exported Survey',
        SurveyElements: questions.map((q, index) => ({
          SurveyID: 'SV_' + Date.now(),
          Element: 'SQ',
          PrimaryAttribute: `QID${index + 1}`,
          SecondaryAttribute: q.text,
          Payload: {
            QuestionText: q.text,
            QuestionType: this.mapToQualtricsType(q.type),
            Selector: this.getQualtricsSelector(q.type),
            Validation: q.validation ? JSON.parse(q.validation as string) : {},
            Choices: q.options ? JSON.parse(q.options as string) : {}
          }
        }))
      }
    };
  }

  /**
   * Map our question types to Qualtrics types
   */
  private mapToQualtricsType(type: string): string {
    const mapping: Record<string, string> = {
      'MULTIPLE_CHOICE_SINGLE': 'MC',
      'MULTIPLE_CHOICE_MULTI': 'MC',
      'TEXT_ENTRY': 'TE',
      'MATRIX_GRID': 'Matrix',
      'SLIDER': 'Slider',
      'RANK_ORDER': 'RO'
    };
    return mapping[type] || 'MC';
  }

  /**
   * Get Qualtrics selector for question type
   */
  private getQualtricsSelector(type: string): string {
    const mapping: Record<string, string> = {
      'MULTIPLE_CHOICE_SINGLE': 'SAVR',
      'MULTIPLE_CHOICE_MULTI': 'MAVR',
      'TEXT_ENTRY': 'SL',
      'MATRIX_GRID': 'Likert',
      'SLIDER': 'HSLIDER',
      'RANK_ORDER': 'DND'
    };
    return mapping[type] || 'SAVR';
  }
}