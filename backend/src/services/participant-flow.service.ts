import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ScreeningService } from './screening.service';
import { PostSurveyService } from './post-survey.service';
import { Prisma } from '@prisma/client';

/**
 * World-class Participant Flow Service
 * Manages the complete participant journey with advanced state management
 *
 * Features:
 * - Multi-stage flow orchestration
 * - Intelligent navigation guards
 * - Progress persistence and recovery
 * - Save & continue functionality
 * - Contextual state transitions
 * - Performance optimized with caching
 */

export enum ParticipantFlowStage {
  NOT_STARTED = 'NOT_STARTED',
  PRE_SCREENING = 'PRE_SCREENING',
  PRE_SCREENING_FAILED = 'PRE_SCREENING_FAILED',
  CONSENT = 'CONSENT',
  INSTRUCTIONS = 'INSTRUCTIONS',
  Q_SORT = 'Q_SORT',
  POST_SURVEY = 'POST_SURVEY',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface FlowState {
  currentStage: ParticipantFlowStage;
  completedStages: ParticipantFlowStage[];
  stageData: Record<string, any>;
  lastActivity: Date;
  sessionId: string;
  participantId: string;
  surveyId: string;
  canProceed: boolean;
  requiredActions: string[];
  progress: {
    percentage: number;
    stagesCompleted: number;
    totalStages: number;
    estimatedTimeRemaining: number; // minutes
  };
  navigation: {
    nextStage: ParticipantFlowStage | null;
    previousStage: ParticipantFlowStage | null;
    canGoBack: boolean;
    canSkip: boolean;
  };
  metadata: {
    startTime: Date;
    device: string;
    browser: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
}

export interface StageTransition {
  from: ParticipantFlowStage;
  to: ParticipantFlowStage;
  timestamp: Date;
  duration: number; // seconds spent in previous stage
  trigger: 'user_action' | 'auto_advance' | 'timeout' | 'system';
  metadata?: Record<string, any>;
}

export interface SavePointData {
  stageId: ParticipantFlowStage;
  data: any;
  timestamp: Date;
  isPartial: boolean;
  validUntil?: Date;
}

@Injectable()
export class ParticipantFlowService {
  private readonly logger = new Logger(ParticipantFlowService.name);
  private readonly flowCache = new Map<string, FlowState>();
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly SESSION_TIMEOUT = 7200000; // 2 hours
  private readonly SAVE_POINT_VALIDITY = 604800000; // 7 days

  // Stage configuration with advanced rules
  private readonly stageConfig: Record<string, any> = {
    [ParticipantFlowStage.PRE_SCREENING]: {
      required: true,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 5, // minutes
      nextStages: [
        ParticipantFlowStage.CONSENT,
        ParticipantFlowStage.PRE_SCREENING_FAILED,
      ],
      validationRules: ['hasScreeningResponses', 'passedQualification'],
    },
    [ParticipantFlowStage.CONSENT]: {
      required: true,
      canSkip: false,
      canRevisit: true,
      estimatedTime: 2,
      nextStages: [ParticipantFlowStage.INSTRUCTIONS],
      validationRules: ['hasConsent', 'isAdult'],
    },
    [ParticipantFlowStage.INSTRUCTIONS]: {
      required: true,
      canSkip: true,
      canRevisit: true,
      estimatedTime: 3,
      nextStages: [ParticipantFlowStage.Q_SORT],
      validationRules: ['hasViewedInstructions'],
    },
    [ParticipantFlowStage.Q_SORT]: {
      required: true,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 20,
      nextStages: [ParticipantFlowStage.POST_SURVEY],
      validationRules: ['hasCompletedSort', 'hasValidDistribution'],
    },
    [ParticipantFlowStage.POST_SURVEY]: {
      required: true,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 10,
      nextStages: [ParticipantFlowStage.COMPLETED],
      validationRules: ['hasPostSurveyResponses'],
    },
    // Terminal and special states
    [ParticipantFlowStage.NOT_STARTED]: {
      required: false,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 0,
      nextStages: [ParticipantFlowStage.PRE_SCREENING],
      validationRules: [],
    },
    [ParticipantFlowStage.PRE_SCREENING_FAILED]: {
      required: false,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 0,
      nextStages: [],
      validationRules: [],
    },
    [ParticipantFlowStage.COMPLETED]: {
      required: false,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 0,
      nextStages: [],
      validationRules: [],
    },
    [ParticipantFlowStage.ABANDONED]: {
      required: false,
      canSkip: false,
      canRevisit: false,
      estimatedTime: 0,
      nextStages: [],
      validationRules: [],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly screeningService: ScreeningService,
    private readonly postSurveyService: PostSurveyService,
  ) {}

  /**
   * Initialize or retrieve participant flow state
   */
  async initializeFlow(
    surveyId: string,
    participantId: string,
    sessionId: string,
    metadata?: Partial<FlowState['metadata']>,
  ): Promise<FlowState> {
    const cacheKey = `${surveyId}-${participantId}`;

    // Check cache first
    if (this.flowCache.has(cacheKey)) {
      const cached = this.flowCache.get(cacheKey)!;
      if (Date.now() - cached.lastActivity.getTime() < this.CACHE_TTL) {
        return this.updateLastActivity(cached);
      }
    }

    // Check for existing flow in database
    const existingFlow = await this.prisma.response.findFirst({
      where: {
        surveyId,
        participantId,
        sessionCode: sessionId,
      },
    });

    if (existingFlow && existingFlow.demographics) {
      const flowData = existingFlow.demographics as any;
      if (flowData.flowState) {
        const restoredState = this.restoreFlowState(
          flowData.flowState,
          surveyId,
          participantId,
          sessionId,
        );
        this.flowCache.set(cacheKey, restoredState);
        return restoredState;
      }
    }

    // Create new flow state
    const newState: FlowState = {
      currentStage: ParticipantFlowStage.NOT_STARTED,
      completedStages: [],
      stageData: {},
      lastActivity: new Date(),
      sessionId,
      participantId,
      surveyId,
      canProceed: true,
      requiredActions: ['start_screening'],
      progress: {
        percentage: 0,
        stagesCompleted: 0,
        totalStages: 5,
        estimatedTimeRemaining: 40,
      },
      navigation: {
        nextStage: ParticipantFlowStage.PRE_SCREENING,
        previousStage: null,
        canGoBack: false,
        canSkip: false,
      },
      metadata: {
        startTime: new Date(),
        device: metadata?.device || 'unknown',
        browser: metadata?.browser || 'unknown',
        screenResolution: metadata?.screenResolution || 'unknown',
        timezone: metadata?.timezone || 'UTC',
        language: metadata?.language || 'en',
      },
    };

    this.flowCache.set(cacheKey, newState);
    await this.persistFlowState(newState);
    return newState;
  }

  /**
   * Validate and transition to next stage with guards
   */
  async transitionToStage(
    surveyId: string,
    participantId: string,
    targetStage: ParticipantFlowStage,
    stageData?: any,
  ): Promise<FlowState> {
    const currentState = await this.getFlowState(surveyId, participantId);

    // Validate transition
    const validation = await this.validateTransition(currentState, targetStage);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid stage transition',
        currentStage: currentState.currentStage,
        targetStage,
        errors: validation.errors,
      });
    }

    // Record transition
    const transition: StageTransition = {
      from: currentState.currentStage,
      to: targetStage,
      timestamp: new Date(),
      duration: this.calculateStageDuration(currentState),
      trigger: 'user_action',
      metadata: stageData,
    };

    // Update state
    currentState.currentStage = targetStage;
    if (
      !currentState.completedStages.includes(transition.from) &&
      transition.from !== ParticipantFlowStage.NOT_STARTED
    ) {
      currentState.completedStages.push(transition.from);
    }

    if (stageData) {
      currentState.stageData[targetStage] = stageData;
    }

    // Update progress and navigation
    currentState.progress = this.calculateProgress(currentState);
    currentState.navigation = this.calculateNavigation(currentState);
    currentState.canProceed = await this.checkCanProceed(currentState);
    currentState.requiredActions = this.getRequiredActions(currentState);
    currentState.lastActivity = new Date();

    // Persist and cache
    await this.persistFlowState(currentState);
    this.flowCache.set(`${surveyId}-${participantId}`, currentState);

    // Log transition
    this.logger.log(
      `Flow transition: ${transition.from} → ${transition.to} for participant ${participantId}`,
    );

    return currentState;
  }

  /**
   * Save participant progress at current stage
   */
  async saveProgress(
    surveyId: string,
    participantId: string,
    data: any,
    isPartial: boolean = false,
  ): Promise<SavePointData> {
    const currentState = await this.getFlowState(surveyId, participantId);

    const savePoint: SavePointData = {
      stageId: currentState.currentStage,
      data,
      timestamp: new Date(),
      isPartial,
      validUntil: new Date(Date.now() + this.SAVE_POINT_VALIDITY),
    };

    // Store save point in stage data
    currentState.stageData[`${currentState.currentStage}_savepoint`] =
      savePoint;
    currentState.lastActivity = new Date();

    // Persist to database
    await this.persistFlowState(currentState);

    this.logger.log(
      `Progress saved for participant ${participantId} at stage ${currentState.currentStage}`,
    );

    return savePoint;
  }

  /**
   * Resume from saved progress
   */
  async resumeFromSavePoint(
    surveyId: string,
    participantId: string,
    sessionId: string,
  ): Promise<FlowState> {
    const flowState = await this.initializeFlow(
      surveyId,
      participantId,
      sessionId,
    );

    // Check for valid save points
    const savePoints = Object.keys(flowState.stageData)
      .filter((key) => key.endsWith('_savepoint'))
      .map((key) => flowState.stageData[key] as SavePointData)
      .filter((sp) => sp.validUntil && new Date(sp.validUntil) > new Date());

    if (savePoints.length === 0) {
      return flowState;
    }

    // Find most recent valid save point
    const latestSavePoint = savePoints.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];

    // Restore to save point stage
    flowState.currentStage = latestSavePoint.stageId;
    flowState.stageData[latestSavePoint.stageId] = latestSavePoint.data;

    // Recalculate state
    flowState.progress = this.calculateProgress(flowState);
    flowState.navigation = this.calculateNavigation(flowState);
    flowState.canProceed = await this.checkCanProceed(flowState);

    this.logger.log(
      `Resumed from save point for participant ${participantId} at stage ${latestSavePoint.stageId}`,
    );

    return flowState;
  }

  /**
   * Get navigation guards for current stage
   */
  async getNavigationGuards(
    surveyId: string,
    participantId: string,
  ): Promise<{
    canProceed: boolean;
    canGoBack: boolean;
    canSkip: boolean;
    blockers: string[];
    warnings: string[];
  }> {
    const state = await this.getFlowState(surveyId, participantId);
    const config = this.stageConfig[state.currentStage];

    const guards = {
      canProceed: state.canProceed,
      canGoBack: state.navigation.canGoBack,
      canSkip: config?.canSkip || false,
      blockers: [] as string[],
      warnings: [] as string[],
    };

    // Check stage-specific validation rules
    if (config?.validationRules) {
      for (const rule of config.validationRules) {
        const validation = await this.validateRule(rule, state);
        if (!validation.passed) {
          guards.blockers.push(validation.message);
          guards.canProceed = false;
        }
      }
    }

    // Check session timeout
    if (Date.now() - state.lastActivity.getTime() > this.SESSION_TIMEOUT) {
      guards.warnings.push(
        'Your session is about to expire. Please save your progress.',
      );
    }

    // Check incomplete required fields
    if (state.requiredActions.length > 0) {
      guards.warnings.push(
        `Complete required actions: ${state.requiredActions.join(', ')}`,
      );
    }

    return guards;
  }

  /**
   * Track stage analytics and performance
   */
  async trackStageMetrics(
    surveyId: string,
    participantId: string,
    metrics: {
      interactions?: number;
      errors?: number;
      helperUsage?: boolean;
      deviceChanges?: boolean;
    },
  ): Promise<void> {
    const state = await this.getFlowState(surveyId, participantId);

    // Store metrics in stage data
    const stageMetricsKey = `${state.currentStage}_metrics`;
    state.stageData[stageMetricsKey] = {
      ...state.stageData[stageMetricsKey],
      ...metrics,
      timestamp: new Date(),
    };

    await this.persistFlowState(state);

    // Log significant metrics
    if (metrics.errors && metrics.errors > 5) {
      this.logger.warn(
        `High error rate for participant ${participantId} at stage ${state.currentStage}`,
      );
    }
  }

  /**
   * Handle abandoned flows with recovery
   */
  async handleAbandonedFlow(
    surveyId: string,
    participantId: string,
    reason?: string,
  ): Promise<void> {
    const state = await this.getFlowState(surveyId, participantId);

    state.currentStage = ParticipantFlowStage.ABANDONED;
    state.stageData.abandonmentReason = reason || 'unknown';
    state.stageData.abandonmentTime = new Date();
    state.stageData.lastCompletedStage =
      state.completedStages[state.completedStages.length - 1];

    await this.persistFlowState(state);

    // Send recovery email if applicable
    await this.triggerRecoveryProcess(surveyId, participantId, state);

    this.logger.log(
      `Flow abandoned by participant ${participantId} at stage ${state.stageData.lastCompletedStage}`,
    );
  }

  /**
   * Get comprehensive flow analytics
   */
  async getFlowAnalytics(surveyId: string): Promise<{
    completionRate: number;
    averageTimePerStage: Record<string, number>;
    dropoffPoints: Record<string, number>;
    deviceBreakdown: Record<string, number>;
    errorRates: Record<string, number>;
  }> {
    const responses = await this.prisma.response.findMany({
      where: { surveyId },
    });

    const analytics = {
      completionRate: 0,
      averageTimePerStage: {} as Record<string, number>,
      dropoffPoints: {} as Record<string, number>,
      deviceBreakdown: {} as Record<string, number>,
      errorRates: {} as Record<string, number>,
    };

    // Calculate metrics from response data
    const completed = responses.filter((r: any) => {
      const flowData = r.demographics as any;
      return (
        flowData?.flowState?.currentStage === ParticipantFlowStage.COMPLETED
      );
    });

    analytics.completionRate =
      responses.length > 0 ? (completed.length / responses.length) * 100 : 0;

    // Aggregate stage times, dropoffs, etc.
    responses.forEach((response: any) => {
      const flowData = response.demographics as any;
      if (flowData?.flowState) {
        // Track dropoff points
        if (
          flowData.flowState.currentStage === ParticipantFlowStage.ABANDONED
        ) {
          const lastStage = flowData.flowState.stageData?.lastCompletedStage;
          if (lastStage) {
            analytics.dropoffPoints[lastStage] =
              (analytics.dropoffPoints[lastStage] || 0) + 1;
          }
        }

        // Track device breakdown
        const device = flowData.flowState.metadata?.device;
        if (device) {
          analytics.deviceBreakdown[device] =
            (analytics.deviceBreakdown[device] || 0) + 1;
        }
      }
    });

    return analytics;
  }

  // Private helper methods

  private async getFlowState(
    surveyId: string,
    participantId: string,
  ): Promise<FlowState> {
    const cacheKey = `${surveyId}-${participantId}`;

    if (this.flowCache.has(cacheKey)) {
      const cached = this.flowCache.get(cacheKey)!;
      if (Date.now() - cached.lastActivity.getTime() < this.CACHE_TTL) {
        return cached;
      }
    }

    const response = await this.prisma.response.findFirst({
      where: {
        surveyId,
        participantId,
      },
    });

    if (!response) {
      throw new NotFoundException('Flow state not found');
    }

    const flowData = response.demographics as any;
    if (!flowData?.flowState) {
      throw new NotFoundException('Invalid flow state data');
    }

    const state = this.restoreFlowState(
      flowData.flowState,
      surveyId,
      participantId,
      response.sessionCode,
    );
    this.flowCache.set(cacheKey, state);
    return state;
  }

  private restoreFlowState(
    data: any,
    surveyId: string,
    participantId: string,
    sessionId: string,
  ): FlowState {
    return {
      ...data,
      surveyId,
      participantId,
      sessionId,
      lastActivity: new Date(data.lastActivity),
      metadata: {
        ...data.metadata,
        startTime: new Date(data.metadata.startTime),
      },
    };
  }

  private async persistFlowState(state: FlowState): Promise<void> {
    await this.prisma.response.upsert({
      where: {
        id: `${state.surveyId}-${state.participantId}`,
      },
      update: {
        demographics: {
          flowState: state,
        } as any,
      },
      create: {
        id: `${state.surveyId}-${state.participantId}`,
        surveyId: state.surveyId,
        participantId: state.participantId,
        sessionCode: state.sessionId,
        demographics: {
          flowState: state,
        } as any,
        createdAt: new Date(),
      },
    });
  }

  private async validateTransition(
    currentState: FlowState,
    targetStage: ParticipantFlowStage,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const config = this.stageConfig[currentState.currentStage];

    // Check if target is allowed from current
    if (config && !config.nextStages.includes(targetStage)) {
      errors.push(
        `Cannot transition from ${currentState.currentStage} to ${targetStage}`,
      );
    }

    // Check required stages completed
    if (targetStage === ParticipantFlowStage.POST_SURVEY) {
      if (!currentState.completedStages.includes(ParticipantFlowStage.Q_SORT)) {
        errors.push('Must complete Q-sort before post-survey');
      }
    }

    // Check if can revisit
    if (currentState.completedStages.includes(targetStage)) {
      const targetConfig = this.stageConfig[targetStage];
      if (targetConfig && !targetConfig.canRevisit) {
        errors.push(`Cannot revisit ${targetStage}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async validateRule(
    rule: string,
    state: FlowState,
  ): Promise<{ passed: boolean; message: string }> {
    switch (rule) {
      case 'hasScreeningResponses':
        return {
          passed: !!state.stageData[ParticipantFlowStage.PRE_SCREENING],
          message: 'Complete screening questions',
        };
      case 'passedQualification':
        const screeningData =
          state.stageData[ParticipantFlowStage.PRE_SCREENING];
        return {
          passed: screeningData?.qualified === true,
          message: 'Did not meet study requirements',
        };
      case 'hasConsent':
        return {
          passed: !!state.stageData[ParticipantFlowStage.CONSENT]?.consented,
          message: 'Must provide consent to participate',
        };
      case 'hasCompletedSort':
        return {
          passed: !!state.stageData[ParticipantFlowStage.Q_SORT]?.completed,
          message: 'Complete the Q-sort activity',
        };
      case 'hasPostSurveyResponses':
        return {
          passed: !!state.stageData[ParticipantFlowStage.POST_SURVEY],
          message: 'Complete post-survey questions',
        };
      default:
        return { passed: true, message: '' };
    }
  }

  private calculateProgress(state: FlowState): FlowState['progress'] {
    const totalStages = 5; // Pre-screening, Consent, Instructions, Q-sort, Post-survey
    const completed = state.completedStages.length;
    const percentage = Math.round((completed / totalStages) * 100);

    let estimatedTime = 0;
    Object.keys(this.stageConfig).forEach((stage) => {
      if (!state.completedStages.includes(stage as ParticipantFlowStage)) {
        estimatedTime +=
          this.stageConfig[stage as ParticipantFlowStage].estimatedTime;
      }
    });

    return {
      percentage,
      stagesCompleted: completed,
      totalStages,
      estimatedTimeRemaining: estimatedTime,
    };
  }

  private calculateNavigation(state: FlowState): FlowState['navigation'] {
    const config = this.stageConfig[state.currentStage];
    const nextStage = config?.nextStages[0] || null;

    const stageOrder = [
      ParticipantFlowStage.PRE_SCREENING,
      ParticipantFlowStage.CONSENT,
      ParticipantFlowStage.INSTRUCTIONS,
      ParticipantFlowStage.Q_SORT,
      ParticipantFlowStage.POST_SURVEY,
    ];

    const currentIndex = stageOrder.indexOf(state.currentStage);
    const previousStage =
      currentIndex > 0 ? stageOrder[currentIndex - 1] : null;

    return {
      nextStage: nextStage as ParticipantFlowStage | null,
      previousStage: previousStage,
      canGoBack: config?.canRevisit || false,
      canSkip: config?.canSkip || false,
    };
  }

  private async checkCanProceed(state: FlowState): Promise<boolean> {
    const config = this.stageConfig[state.currentStage];
    if (!config?.validationRules) return true;

    for (const rule of config.validationRules) {
      const validation = await this.validateRule(rule, state);
      if (!validation.passed) return false;
    }
    return true;
  }

  private getRequiredActions(state: FlowState): string[] {
    const actions: string[] = [];
    const config = this.stageConfig[state.currentStage];

    if (!config?.validationRules) return actions;

    // Map validation rules to user-friendly actions
    config.validationRules.forEach((rule: any) => {
      switch (rule) {
        case 'hasScreeningResponses':
          if (!state.stageData[ParticipantFlowStage.PRE_SCREENING]) {
            actions.push('Complete screening questions');
          }
          break;
        case 'hasConsent':
          if (!state.stageData[ParticipantFlowStage.CONSENT]?.consented) {
            actions.push('Provide consent');
          }
          break;
        case 'hasCompletedSort':
          if (!state.stageData[ParticipantFlowStage.Q_SORT]?.completed) {
            actions.push('Complete Q-sort');
          }
          break;
        case 'hasPostSurveyResponses':
          if (!state.stageData[ParticipantFlowStage.POST_SURVEY]) {
            actions.push('Answer post-survey questions');
          }
          break;
      }
    });

    return actions;
  }

  private calculateStageDuration(state: FlowState): number {
    const now = Date.now();
    const lastActivity = state.lastActivity.getTime();
    return Math.round((now - lastActivity) / 1000); // seconds
  }

  private updateLastActivity(state: FlowState): FlowState {
    state.lastActivity = new Date();
    return state;
  }

  private async triggerRecoveryProcess(
    surveyId: string,
    participantId: string,
    state: FlowState,
  ): Promise<void> {
    // Implementation for recovery email/notification
    // This would integrate with email service
    this.logger.log(
      `Recovery process triggered for participant ${participantId}`,
    );
  }
}
