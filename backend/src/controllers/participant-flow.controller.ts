import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import {
  ParticipantFlowService,
  ParticipantFlowStage,
  FlowState,
  SavePointData,
} from '../services/participant-flow.service';

export class InitializeFlowDto {
  surveyId!: string;
  participantId!: string;
  sessionId!: string;
  metadata?: {
    device?: string;
    browser?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
  };
}

export class TransitionStageDto {
  targetStage!: ParticipantFlowStage;
  stageData?: any;
}

export class SaveProgressDto {
  data: any;
  isPartial?: boolean;
}

export class TrackMetricsDto {
  interactions?: number;
  errors?: number;
  helperUsage?: boolean;
  deviceChanges?: boolean;
}

@ApiTags('Participant Flow')
@Controller('participant-flow')
export class ParticipantFlowController {
  constructor(private readonly flowService: ParticipantFlowService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize participant flow' })
  @ApiResponse({ status: 200, description: 'Flow initialized successfully' })
  async initializeFlow(@Body() dto: InitializeFlowDto): Promise<FlowState> {
    return this.flowService.initializeFlow(
      dto.surveyId,
      dto.participantId,
      dto.sessionId,
      dto.metadata,
    );
  }

  @Get(':surveyId/:participantId/state')
  @ApiOperation({ summary: 'Get current flow state' })
  @ApiResponse({ status: 200, description: 'Current flow state' })
  async getFlowState(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
  ): Promise<FlowState> {
    try {
      const sessionId = `session-${Date.now()}`; // Temporary session for retrieval
      return await this.flowService.initializeFlow(
        surveyId,
        participantId,
        sessionId,
      );
    } catch (error) {
      throw new BadRequestException('Failed to retrieve flow state');
    }
  }

  @Put(':surveyId/:participantId/transition')
  @ApiOperation({ summary: 'Transition to next stage' })
  @ApiResponse({ status: 200, description: 'Transition successful' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async transitionStage(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body() dto: TransitionStageDto,
  ): Promise<FlowState> {
    return this.flowService.transitionToStage(
      surveyId,
      participantId,
      dto.targetStage,
      dto.stageData,
    );
  }

  @Post(':surveyId/:participantId/save')
  @ApiOperation({ summary: 'Save progress at current stage' })
  @ApiResponse({ status: 200, description: 'Progress saved' })
  async saveProgress(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body() dto: SaveProgressDto,
  ): Promise<SavePointData> {
    return this.flowService.saveProgress(
      surveyId,
      participantId,
      dto.data,
      dto.isPartial,
    );
  }

  @Post(':surveyId/:participantId/resume')
  @ApiOperation({ summary: 'Resume from saved progress' })
  @ApiResponse({ status: 200, description: 'Resumed successfully' })
  async resumeFromSavePoint(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body('sessionId') sessionId: string,
  ): Promise<FlowState> {
    return this.flowService.resumeFromSavePoint(
      surveyId,
      participantId,
      sessionId,
    );
  }

  @Get(':surveyId/:participantId/guards')
  @ApiOperation({ summary: 'Get navigation guards for current stage' })
  @ApiResponse({ status: 200, description: 'Navigation guards' })
  async getNavigationGuards(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
  ): Promise<{
    canProceed: boolean;
    canGoBack: boolean;
    canSkip: boolean;
    blockers: string[];
    warnings: string[];
  }> {
    return this.flowService.getNavigationGuards(surveyId, participantId);
  }

  @Post(':surveyId/:participantId/metrics')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track stage metrics' })
  @ApiResponse({ status: 204, description: 'Metrics tracked' })
  async trackMetrics(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body() dto: TrackMetricsDto,
  ): Promise<void> {
    await this.flowService.trackStageMetrics(surveyId, participantId, dto);
  }

  @Post(':surveyId/:participantId/abandon')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark flow as abandoned' })
  @ApiResponse({ status: 204, description: 'Flow marked as abandoned' })
  async abandonFlow(
    @Param('surveyId') surveyId: string,
    @Param('participantId') participantId: string,
    @Body('reason') reason?: string,
  ): Promise<void> {
    await this.flowService.handleAbandonedFlow(surveyId, participantId, reason);
  }

  @Get(':surveyId/analytics')
  @ApiOperation({ summary: 'Get flow analytics for survey' })
  @ApiResponse({ status: 200, description: 'Flow analytics' })
  async getFlowAnalytics(@Param('surveyId') surveyId: string): Promise<{
    completionRate: number;
    averageTimePerStage: Record<string, number>;
    dropoffPoints: Record<string, number>;
    deviceBreakdown: Record<string, number>;
    errorRates: Record<string, number>;
  }> {
    return this.flowService.getFlowAnalytics(surveyId);
  }
}
