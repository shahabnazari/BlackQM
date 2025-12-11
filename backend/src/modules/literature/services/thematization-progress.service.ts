/**
 * Phase 10.113 Week 7: Thematization Progress Service
 *
 * Netflix-grade progress tracking service for the unified thematization pipeline.
 * Integrates with ThematizationGateway for real-time WebSocket updates.
 *
 * ============================================================================
 * RESPONSIBILITIES
 * ============================================================================
 *
 * 1. WebSocket gateway management (null-safe injection)
 * 2. Progress calculation (overall and per-stage)
 * 3. Live statistics aggregation
 * 4. Progress message construction
 * 5. Error emission with standardized codes
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 *
 * UnifiedThematizationService
 *         ↓ calls
 * ThematizationProgressService
 *         ↓ emits via
 * ThematizationGateway → WebSocket → Frontend
 *
 * @module ThematizationProgressService
 * @since Phase 10.113 Week 7
 */

import { Injectable, Logger } from '@nestjs/common';

import {
  ThematizationGateway,
  IThematizationProgressEmitter,
  ThematizationProgressLiveStats,
  createProgressMessage,
} from '../gateways/thematization.gateway';

import {
  ThematizationPipelineStage,
  PIPELINE_STAGE_INFO,
} from '../types/unified-thematization.types';

import { ErrorCode } from '../../../common/constants/error-codes';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Progress context for tracking pipeline execution
 */
export interface ThematizationProgressContext {
  readonly userId: string;
  readonly requestId: string;
  readonly tier: number;
  readonly totalPapers: number;
  readonly startTimeMs: number;
}

/**
 * Stage progress data for tracking
 */
export interface StageProgressData {
  readonly papersProcessed?: number;
  readonly themesFound?: number;
  readonly claimsExtracted?: number;
  readonly currentOperation?: string;
  readonly substageProgress?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Total progress weight from all stages */
const TOTAL_PROGRESS_WEIGHT = Object.values(PIPELINE_STAGE_INFO).reduce(
  (sum, info) => sum + info.progressWeight,
  0,
);

/** Maximum active contexts to prevent memory leaks (LRU-style cleanup) */
const MAX_ACTIVE_CONTEXTS = 100;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationProgressService {
  private readonly logger = new Logger(ThematizationProgressService.name);

  /**
   * Gateway reference (null-safe: set via setGateway())
   */
  private gateway: IThematizationProgressEmitter | null = null;

  /**
   * Active progress contexts by requestId
   * Limited to MAX_ACTIVE_CONTEXTS to prevent memory leaks
   */
  private readonly contexts = new Map<string, ThematizationProgressContext>();

  constructor() {
    this.logger.log('✅ [ThematizationProgressService] Initialized');
  }

  // ==========================================================================
  // GATEWAY MANAGEMENT
  // ==========================================================================

  /**
   * Set the WebSocket gateway for progress emission
   * Called by LiteratureModule during initialization
   *
   * @param gateway - ThematizationGateway instance
   * @throws Error if gateway is null or doesn't implement required interface
   */
  setGateway(gateway: ThematizationGateway): void {
    if (!gateway) {
      const errorMsg = 'Gateway cannot be null or undefined';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (typeof gateway.emitProgress !== 'function') {
      const errorMsg = 'Gateway does not implement IThematizationProgressEmitter';
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    this.gateway = gateway;
    this.logger.log('✅ [ThematizationProgressService] Gateway connected');
  }

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  /**
   * Initialize progress tracking for a new pipeline execution
   *
   * @param context - Progress context with user/request info
   */
  initializeProgress(context: ThematizationProgressContext): void {
    const { requestId } = context;

    // Enforce memory limit (LRU-style: remove oldest entries)
    if (this.contexts.size >= MAX_ACTIVE_CONTEXTS) {
      const oldestKey = this.contexts.keys().next().value;
      if (oldestKey) {
        this.contexts.delete(oldestKey);
        this.logger.warn(`⚠️ [Progress] Evicted oldest context ${oldestKey} (limit: ${MAX_ACTIVE_CONTEXTS})`);
      }
    }

    this.contexts.set(requestId, context);

    this.logger.log(
      `📊 [Progress] Initialized for request ${requestId}, ` +
      `user ${context.userId}, ${context.totalPapers} papers`,
    );
  }

  /**
   * Clean up progress tracking after pipeline completion
   *
   * @param requestId - Request ID to clean up
   */
  cleanupProgress(requestId: string): void {
    this.contexts.delete(requestId);
    this.logger.debug(`🧹 [Progress] Cleaned up request ${requestId}`);
  }

  // ==========================================================================
  // PROGRESS EMISSION
  // ==========================================================================

  /**
   * Emit progress update for a pipeline stage
   *
   * @param requestId - Request ID
   * @param stage - Current pipeline stage
   * @param stageProgress - Progress within stage (0-100)
   * @param message - Human-readable progress message
   * @param data - Optional live statistics
   */
  emitStageProgress(
    requestId: string,
    stage: ThematizationPipelineStage,
    stageProgressPercent: number,
    message: string,
    data?: StageProgressData,
  ): void {
    const context = this.contexts.get(requestId);
    if (!context) {
      this.logger.warn(`⚠️ [Progress] No context for request ${requestId}`);
      return;
    }

    // Clamp stage progress to 0-100
    const clampedStageProgress = Math.max(0, Math.min(100, stageProgressPercent));

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(requestId, stage, clampedStageProgress);

    // Build live stats
    const liveStats: ThematizationProgressLiveStats | undefined = data
      ? {
          papersProcessed: data.papersProcessed ?? 0,
          totalPapers: context.totalPapers,
          themesFound: data.themesFound,
          claimsExtracted: data.claimsExtracted,
          currentOperation: data.currentOperation ?? message,
          substageProgress: data.substageProgress,
          elapsedTimeMs: Date.now() - context.startTimeMs,
        }
      : undefined;

    // Emit via gateway
    if (this.gateway) {
      const progressMessage = createProgressMessage(
        context.userId,
        requestId,
        stage,
        overallProgress,
        clampedStageProgress,
        message,
        liveStats,
      );

      this.gateway.emitProgress(progressMessage);
    } else {
      // Log warning only once per request
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('⚠️ [Progress] Gateway not connected, skipping WebSocket emission');
      }
    }
  }

  /**
   * Emit completion notification
   *
   * @param requestId - Request ID
   * @param themesCount - Number of themes extracted
   * @param claimsCount - Number of claims extracted (optional)
   */
  emitComplete(
    requestId: string,
    themesCount: number,
    claimsCount?: number,
  ): void {
    const context = this.contexts.get(requestId);
    if (!context) {
      this.logger.warn(`⚠️ [Progress] No context for request ${requestId}`);
      return;
    }

    const processingTimeMs = Date.now() - context.startTimeMs;

    if (this.gateway) {
      this.gateway.emitComplete({
        userId: context.userId,
        requestId,
        themesCount,
        claimsCount,
        processingTimeMs,
        tier: context.tier,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `✅ [Progress] Complete for ${requestId}: ` +
      `${themesCount} themes, ${claimsCount ?? 0} claims in ${processingTimeMs}ms`,
    );

    // Clean up after completion
    this.cleanupProgress(requestId);
  }

  /**
   * Emit error notification
   *
   * @param requestId - Request ID (optional)
   * @param userId - User ID
   * @param errorCode - Standardized error code
   * @param message - Error message
   */
  emitError(
    requestId: string | undefined,
    userId: string,
    errorCode: ErrorCode,
    message?: string,
  ): void {
    if (this.gateway) {
      this.gateway.emitError(userId, errorCode, message, requestId);
    }

    this.logger.error(`❌ [Progress] Error for ${requestId ?? 'unknown'}: ${errorCode}`);

    // Clean up after error
    if (requestId) {
      this.cleanupProgress(requestId);
    }
  }

  // ==========================================================================
  // PROGRESS CALCULATION
  // ==========================================================================

  /**
   * Calculate overall progress based on completed stages and current stage progress
   *
   * Uses stage weights from PIPELINE_STAGE_INFO to accurately represent
   * the relative effort of each pipeline stage.
   *
   * @param requestId - Request ID
   * @param currentStage - Current stage
   * @param currentStageProgress - Progress within current stage (0-100)
   * @returns Overall progress (0-100)
   */
  private calculateOverallProgress(
    requestId: string,
    currentStage: ThematizationPipelineStage,
    currentStageProgress: number,
  ): number {
    const stages = Object.values(ThematizationPipelineStage);
    const currentStageIndex = stages.indexOf(currentStage);

    let completedWeight = 0;

    // Sum weights of completed stages
    for (let i = 0; i < currentStageIndex; i++) {
      const stage = stages[i] as ThematizationPipelineStage;
      const stageInfo = PIPELINE_STAGE_INFO[stage];
      if (stageInfo) {
        completedWeight += stageInfo.progressWeight;
      }
    }

    // Add proportional weight of current stage
    const currentStageInfo = PIPELINE_STAGE_INFO[currentStage];
    if (currentStageInfo) {
      const currentStageWeight = currentStageInfo.progressWeight;
      completedWeight += (currentStageProgress / 100) * currentStageWeight;
    }

    // Calculate percentage
    const overallProgress = Math.round((completedWeight / TOTAL_PROGRESS_WEIGHT) * 100);

    return Math.max(0, Math.min(100, overallProgress));
  }
}
