import { Injectable, Logger } from '@nestjs/common';
import { AnalysisOptions, QAnalysisResult } from '../types';

/**
 * Enterprise-Grade Logging Service for Q-Analytics
 * Provides comprehensive logging for analysis operations
 * Implements structured logging with performance metrics
 */
@Injectable()
export class AnalysisLoggerService {
  private readonly logger = new Logger('QAnalytics');
  private performanceMetrics: Map<string, number> = new Map();

  /**
   * Log analysis start
   */
  logAnalysisStart(
    analysisId: string,
    surveyId: string,
    options: AnalysisOptions,
  ): void {
    this.performanceMetrics.set(analysisId, Date.now());

    this.logger.log({
      event: 'ANALYSIS_STARTED',
      analysisId,
      surveyId,
      options: {
        extractionMethod: options.extractionMethod,
        rotationMethod: options.rotationMethod,
        numberOfFactors: options.numberOfFactors,
        performBootstrap: options.performBootstrap,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log analysis completion
   */
  logAnalysisComplete(
    analysisId: string,
    result: Partial<QAnalysisResult>,
  ): void {
    const startTime = this.performanceMetrics.get(analysisId);
    const duration = startTime ? Date.now() - startTime : 0;

    this.logger.log({
      event: 'ANALYSIS_COMPLETED',
      analysisId,
      duration: `${duration}ms`,
      performance: {
        participantCount: result.performance?.participantCount,
        statementCount: result.performance?.statementCount,
        factorCount: result.performance?.factorCount,
        analysisTime: duration,
      },
      timestamp: new Date().toISOString(),
    });

    this.performanceMetrics.delete(analysisId);
  }

  /**
   * Log analysis error
   */
  logAnalysisError(analysisId: string, error: Error, context?: any): void {
    const startTime = this.performanceMetrics.get(analysisId);
    const duration = startTime ? Date.now() - startTime : 0;

    this.logger.error({
      event: 'ANALYSIS_ERROR',
      analysisId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    this.performanceMetrics.delete(analysisId);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    const performanceLevel =
      duration < 100
        ? 'EXCELLENT'
        : duration < 500
          ? 'GOOD'
          : duration < 2000
            ? 'ACCEPTABLE'
            : 'SLOW';

    this.logger.debug({
      event: 'PERFORMANCE_METRIC',
      operation,
      duration: `${duration}ms`,
      performanceLevel,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log cache hit/miss
   */
  logCacheActivity(
    key: string,
    hit: boolean,
    operation: 'GET' | 'SET' | 'DELETE',
  ): void {
    this.logger.debug({
      event: 'CACHE_ACTIVITY',
      key,
      operation,
      result: hit ? 'HIT' : 'MISS',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log rotation activity
   */
  logRotation(
    analysisId: string,
    rotationType: string,
    details: {
      factor1?: number;
      factor2?: number;
      angle?: number;
      iterations?: number;
      converged?: boolean;
    },
  ): void {
    this.logger.debug({
      event: 'ROTATION_ACTIVITY',
      analysisId,
      rotationType,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log statistical validation
   */
  logValidation(
    analysisId: string,
    validationType: string,
    result: boolean,
    details?: any,
  ): void {
    this.logger.debug({
      event: 'VALIDATION',
      analysisId,
      validationType,
      result: result ? 'PASSED' : 'FAILED',
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log bootstrap progress
   */
  logBootstrap(
    analysisId: string,
    progress: number,
    totalIterations: number,
  ): void {
    if (progress % 100 === 0 || progress === totalIterations) {
      this.logger.debug({
        event: 'BOOTSTRAP_PROGRESS',
        analysisId,
        progress,
        totalIterations,
        percentage: `${Math.round((progress / totalIterations) * 100)}%`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log PQMethod import/export
   */
  logPQMethodOperation(
    operation: 'IMPORT' | 'EXPORT',
    fileName: string,
    success: boolean,
    metadata?: any,
  ): void {
    this.logger.log({
      event: `PQMETHOD_${operation}`,
      fileName,
      success,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(event: string, clientId: string, data?: any): void {
    this.logger.debug({
      event: 'WEBSOCKET_EVENT',
      socketEvent: event,
      clientId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    activeAnalyses: number;
    averageTime?: number;
  } {
    const activeAnalyses = this.performanceMetrics.size;

    if (activeAnalyses === 0) {
      return { activeAnalyses: 0 };
    }

    const now = Date.now();
    const durations = Array.from(this.performanceMetrics.values()).map(
      (startTime) => now - startTime,
    );

    const averageTime =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;

    return {
      activeAnalyses,
      averageTime,
    };
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR',
    event: string,
    data: any,
  ): string {
    return JSON.stringify({
      level,
      event,
      ...data,
      timestamp: new Date().toISOString(),
      service: 'q-analytics',
      environment: process.env.NODE_ENV,
    });
  }
}
