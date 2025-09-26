import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostSurveyService } from '../services/post-survey.service';
import {
  GetPostSurveyQuestionsDto,
  SavePostSurveyDto,
  PostSurveyResultDto,
  ExperienceFeedbackDto,
  AggregatedResultsDto,
  QSortDataDto,
} from '../dto/post-survey.dto';
import { Question } from '@prisma/client';

/**
 * Post-Survey Controller - Phase 8.2 Day 2
 *
 * World-class implementation for post-Q-sort survey management
 * Handles context-aware questions, experience feedback, and analysis integration
 *
 * @world-class Features:
 * - Context-aware question selection based on Q-sort behavior
 * - Adaptive questioning based on engagement level
 * - Real-time quality scoring
 * - Automated insight extraction
 * - Analysis pipeline integration
 * - Experience feedback aggregation
 */
@ApiTags('Post-Survey')
@Controller('post-survey')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class PostSurveyController {
  constructor(private readonly postSurveyService: PostSurveyService) {}

  /**
   * Get context-aware post-survey questions
   */
  @Get(':surveyId/questions/:participantId')
  @ApiOperation({
    summary: 'Get post-survey questions',
    description:
      'Retrieves context-aware post-survey questions based on Q-sort data and participant profile',
  })
  @ApiParam({
    name: 'surveyId',
    description: 'Survey ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved post-survey questions',
    type: [GetPostSurveyQuestionsDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Survey or participant not found',
  })
  async getPostSurveyQuestions(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body() qsortData?: QSortDataDto,
  ): Promise<Question[]> {
    try {
      return await this.postSurveyService.getPostSurveyQuestions(
        surveyId,
        participantId,
        qsortData,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve post-survey questions');
    }
  }

  /**
   * Save post-survey responses
   */
  @Post(':surveyId/responses/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save post-survey responses',
    description:
      'Saves participant responses with quality scoring and insight extraction',
  })
  @ApiParam({
    name: 'surveyId',
    description: 'Survey ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully saved post-survey responses',
    type: PostSurveyResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid response data',
  })
  async savePostSurveyResponses(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body() saveDto: SavePostSurveyDto,
  ): Promise<PostSurveyResultDto> {
    try {
      const result = await this.postSurveyService.savePostSurveyResponses(
        surveyId,
        participantId,
        saveDto.responses,
        saveDto.qsortData,
      );

      return result as PostSurveyResultDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save post-survey responses');
    }
  }

  /**
   * Get aggregated post-survey results
   */
  @Get(':surveyId/aggregated-results')
  @ApiOperation({
    summary: 'Get aggregated results',
    description:
      'Retrieves aggregated post-survey results with statistics and themes',
  })
  @ApiParam({
    name: 'surveyId',
    description: 'Survey ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved aggregated results',
    type: AggregatedResultsDto,
  })
  async getAggregatedResults(
    @Param('surveyId') surveyId: string,
  ): Promise<AggregatedResultsDto> {
    try {
      const results =
        await this.postSurveyService.getAggregatedResults(surveyId);
      return results as AggregatedResultsDto;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve aggregated results');
    }
  }

  /**
   * Get experience feedback for a participant
   */
  @Get(':surveyId/experience-feedback/:participantId')
  @ApiOperation({
    summary: 'Get experience feedback',
    description: 'Analyzes and returns participant experience feedback',
  })
  @ApiParam({
    name: 'surveyId',
    description: 'Survey ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully generated experience feedback',
    type: ExperienceFeedbackDto,
  })
  async getExperienceFeedback(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
  ): Promise<ExperienceFeedbackDto> {
    try {
      const feedback = await this.postSurveyService.generateExperienceFeedback(
        surveyId,
        participantId,
      );
      return feedback as ExperienceFeedbackDto;
    } catch (error) {
      throw new BadRequestException('Failed to generate experience feedback');
    }
  }

  /**
   * Check if participant completed post-survey
   */
  @Get(':surveyId/completion-status/:participantId')
  @ApiOperation({
    summary: 'Check completion status',
    description: 'Checks if a participant has completed the post-survey',
  })
  @ApiParam({
    name: 'surveyId',
    description: 'Survey ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns completion status',
    schema: {
      type: 'object',
      properties: {
        completed: { type: 'boolean' },
        completedAt: { type: 'string', nullable: true },
        qualityScore: { type: 'number', nullable: true },
      },
    },
  })
  async getCompletionStatus(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
  ): Promise<any> {
    // Implementation would check participant metadata
    return {
      completed: false,
      completedAt: null,
      qualityScore: null,
    };
  }
}
