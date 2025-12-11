/**
 * Neural Budget Service
 * Phase 10.112 Week 3: Netflix-Grade Dynamic Resource Management
 *
 * Features:
 * - Dynamic limits based on current CPU/memory load
 * - Adaptive batch sizes for neural processing
 * - Queue depth monitoring with backpressure
 * - Load shedding during high utilization
 * - Graceful degradation strategies
 *
 * Netflix Pattern:
 * - Concurrency limits adjust in real-time based on system load
 * - Requests are throttled before failures occur
 * - Quality degrades gracefully under load
 */

import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

/**
 * System load metrics
 */
export interface SystemLoadMetrics {
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  heapUsed: number; // MB
  heapTotal: number; // MB
  activeRequests: number;
  queueDepth: number;
  loadAverage: number; // 1-minute load average
}

/**
 * Budget allocation result
 */
export interface BudgetAllocation {
  maxConcurrentRequests: number;
  batchSize: number;
  timeoutMs: number;
  qualityLevel: QualityLevel;
  skipNeuralReranking: boolean;
  skipEmbeddings: boolean;
  reason: string;
}

/**
 * Quality levels for graceful degradation
 */
export type QualityLevel = 'full' | 'standard' | 'reduced' | 'minimal';

/**
 * Request priority for budget allocation
 */
export type RequestPriority = 'high' | 'normal' | 'low' | 'background';

/**
 * Budget request parameters
 */
export interface BudgetRequest {
  priority: RequestPriority;
  estimatedPapers: number;
  requiresNeuralReranking: boolean;
  requiresEmbeddings: boolean;
  userId?: string;
}

/**
 * Budget metrics for monitoring
 */
export interface BudgetMetrics {
  totalRequests: number;
  grantedRequests: number;
  throttledRequests: number;
  shedRequests: number;
  averageBatchSize: number;
  averageQualityLevel: number;
  currentLoad: SystemLoadMetrics;
}

@Injectable()
export class NeuralBudgetService {
  private readonly logger = new Logger(NeuralBudgetService.name);

  // Active request tracking
  private activeRequests = 0;
  private queueDepth = 0;

  // Load thresholds
  private static readonly CPU_THRESHOLD_HIGH = 80;
  private static readonly CPU_THRESHOLD_CRITICAL = 95;
  private static readonly MEMORY_THRESHOLD_HIGH = 85;
  private static readonly MEMORY_THRESHOLD_CRITICAL = 95;
  private static readonly QUEUE_DEPTH_HIGH = 50;
  private static readonly QUEUE_DEPTH_CRITICAL = 100;

  // Base limits
  private static readonly BASE_CONCURRENT_REQUESTS = 20;
  private static readonly BASE_BATCH_SIZE = 50;
  private static readonly BASE_TIMEOUT_MS = 30000;

  // Batch size limits by quality level
  private static readonly BATCH_SIZES: Record<QualityLevel, number> = {
    full: 100,
    standard: 50,
    reduced: 25,
    minimal: 10,
  };

  // Timeout multipliers by quality level
  private static readonly TIMEOUT_MULTIPLIERS: Record<QualityLevel, number> = {
    full: 1.5,
    standard: 1.0,
    reduced: 0.75,
    minimal: 0.5,
  };

  // Statistics
  private totalRequests = 0;
  private grantedRequests = 0;
  private throttledRequests = 0;
  private shedRequests = 0;
  private totalBatchSize = 0;
  private qualityLevelSum = 0;

  constructor() {
    this.logger.log('[NeuralBudget] Initialized with adaptive limits');
  }

  /**
   * Get current system load metrics
   */
  getSystemLoad(): SystemLoadMetrics {
    const cpus = os.cpus();
    const totalCpu = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0);
    const cpuUsage = Math.round(totalCpu / cpus.length);

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

    const heapStats = process.memoryUsage();
    const heapUsed = Math.round(heapStats.heapUsed / (1024 * 1024));
    const heapTotal = Math.round(heapStats.heapTotal / (1024 * 1024));

    const loadAvg = os.loadavg()[0]; // 1-minute average

    return {
      cpuUsage,
      memoryUsage,
      heapUsed,
      heapTotal,
      activeRequests: this.activeRequests,
      queueDepth: this.queueDepth,
      loadAverage: Math.round(loadAvg * 100) / 100,
    };
  }

  /**
   * Determine quality level based on system load
   */
  private determineQualityLevel(load: SystemLoadMetrics, priority: RequestPriority): QualityLevel {
    // Critical load - minimal quality for all
    if (
      load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_CRITICAL ||
      load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_CRITICAL ||
      load.queueDepth >= NeuralBudgetService.QUEUE_DEPTH_CRITICAL
    ) {
      return 'minimal';
    }

    // High load - reduce quality based on priority
    if (
      load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_HIGH ||
      load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_HIGH ||
      load.queueDepth >= NeuralBudgetService.QUEUE_DEPTH_HIGH
    ) {
      switch (priority) {
        case 'high':
          return 'standard';
        case 'normal':
          return 'reduced';
        case 'low':
        case 'background':
          return 'minimal';
      }
    }

    // Normal load - full quality for high/normal priority
    switch (priority) {
      case 'high':
      case 'normal':
        return 'full';
      case 'low':
        return 'standard';
      case 'background':
        return 'reduced';
    }
  }

  /**
   * Calculate concurrent request limit based on load
   */
  private calculateConcurrentLimit(load: SystemLoadMetrics): number {
    const baseLimit = NeuralBudgetService.BASE_CONCURRENT_REQUESTS;

    // Reduce limit based on CPU usage
    const cpuFactor = Math.max(0.2, 1 - load.cpuUsage / 100);

    // Reduce limit based on memory usage
    const memoryFactor = Math.max(0.2, 1 - load.memoryUsage / 100);

    // Reduce limit based on queue depth
    const queueFactor = Math.max(0.3, 1 - load.queueDepth / NeuralBudgetService.QUEUE_DEPTH_CRITICAL);

    // Take minimum of all factors
    const combinedFactor = Math.min(cpuFactor, memoryFactor, queueFactor);

    return Math.max(1, Math.floor(baseLimit * combinedFactor));
  }

  /**
   * Request budget allocation for a neural operation
   */
  requestBudget(request: BudgetRequest): BudgetAllocation {
    this.totalRequests++;
    const load = this.getSystemLoad();

    // Check for load shedding (reject low-priority requests under critical load)
    if (this.shouldShedLoad(load, request.priority)) {
      this.shedRequests++;
      return {
        maxConcurrentRequests: 0,
        batchSize: 0,
        timeoutMs: 0,
        qualityLevel: 'minimal',
        skipNeuralReranking: true,
        skipEmbeddings: true,
        reason: `Load shedding: CPU ${load.cpuUsage}%, Memory ${load.memoryUsage}%, Queue ${load.queueDepth}`,
      };
    }

    // Calculate quality level
    const qualityLevel = this.determineQualityLevel(load, request.priority);

    // Calculate concurrent limit
    const maxConcurrent = this.calculateConcurrentLimit(load);

    // Check if should throttle (queue at capacity)
    if (this.activeRequests >= maxConcurrent) {
      this.throttledRequests++;
      this.queueDepth++;
      // Still grant budget but with reduced quality
      const reducedQuality = this.reduceQuality(qualityLevel);
      return this.buildAllocation(reducedQuality, load, request, 'Throttled: at capacity');
    }

    this.grantedRequests++;
    return this.buildAllocation(qualityLevel, load, request, 'Granted');
  }

  /**
   * Build budget allocation response
   */
  private buildAllocation(
    qualityLevel: QualityLevel,
    load: SystemLoadMetrics,
    request: BudgetRequest,
    reason: string,
  ): BudgetAllocation {
    const batchSize = this.calculateBatchSize(qualityLevel, request.estimatedPapers);
    const timeoutMs = Math.round(
      NeuralBudgetService.BASE_TIMEOUT_MS * NeuralBudgetService.TIMEOUT_MULTIPLIERS[qualityLevel]
    );

    // Track statistics
    this.totalBatchSize += batchSize;
    this.qualityLevelSum += this.qualityLevelToNumber(qualityLevel);

    // Determine what to skip based on quality level
    const skipNeuralReranking = qualityLevel === 'minimal' || !request.requiresNeuralReranking;
    const skipEmbeddings = qualityLevel === 'minimal' || !request.requiresEmbeddings;

    return {
      maxConcurrentRequests: this.calculateConcurrentLimit(load),
      batchSize,
      timeoutMs,
      qualityLevel,
      skipNeuralReranking,
      skipEmbeddings,
      reason: `${reason} (Quality: ${qualityLevel}, CPU: ${load.cpuUsage}%, Mem: ${load.memoryUsage}%)`,
    };
  }

  /**
   * Calculate batch size based on quality level and estimated papers
   */
  private calculateBatchSize(qualityLevel: QualityLevel, estimatedPapers: number): number {
    const baseBatch = NeuralBudgetService.BATCH_SIZES[qualityLevel];
    // Don't exceed estimated papers
    return Math.min(baseBatch, estimatedPapers);
  }

  /**
   * Reduce quality level by one step
   */
  private reduceQuality(level: QualityLevel): QualityLevel {
    const levels: QualityLevel[] = ['full', 'standard', 'reduced', 'minimal'];
    const currentIndex = levels.indexOf(level);
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    return levels[nextIndex];
  }

  /**
   * Convert quality level to numeric value for averaging
   */
  private qualityLevelToNumber(level: QualityLevel): number {
    switch (level) {
      case 'full':
        return 4;
      case 'standard':
        return 3;
      case 'reduced':
        return 2;
      case 'minimal':
        return 1;
    }
  }

  /**
   * Check if load shedding should occur
   */
  private shouldShedLoad(load: SystemLoadMetrics, priority: RequestPriority): boolean {
    // Never shed high priority requests
    if (priority === 'high') {
      return false;
    }

    // Shed background requests under high load
    if (priority === 'background') {
      return (
        load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_HIGH ||
        load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_HIGH
      );
    }

    // Shed low priority requests under critical load
    if (priority === 'low') {
      return (
        load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_CRITICAL ||
        load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_CRITICAL
      );
    }

    // Only shed normal priority under extreme conditions
    return (
      load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_CRITICAL &&
      load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_CRITICAL &&
      load.queueDepth >= NeuralBudgetService.QUEUE_DEPTH_CRITICAL
    );
  }

  /**
   * Register request start (increment active count)
   */
  startRequest(): void {
    this.activeRequests++;
    if (this.queueDepth > 0) {
      this.queueDepth--;
    }
  }

  /**
   * Register request completion (decrement active count)
   */
  endRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  /**
   * Get budget metrics for monitoring
   */
  getMetrics(): BudgetMetrics {
    const load = this.getSystemLoad();

    return {
      totalRequests: this.totalRequests,
      grantedRequests: this.grantedRequests,
      throttledRequests: this.throttledRequests,
      shedRequests: this.shedRequests,
      averageBatchSize: this.grantedRequests > 0
        ? Math.round(this.totalBatchSize / this.grantedRequests)
        : 0,
      averageQualityLevel: this.grantedRequests > 0
        ? Math.round((this.qualityLevelSum / this.grantedRequests) * 10) / 10
        : 0,
      currentLoad: load,
    };
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.totalRequests = 0;
    this.grantedRequests = 0;
    this.throttledRequests = 0;
    this.shedRequests = 0;
    this.totalBatchSize = 0;
    this.qualityLevelSum = 0;
    this.activeRequests = 0;
    this.queueDepth = 0;
  }

  /**
   * Log current metrics
   */
  logMetrics(): void {
    const metrics = this.getMetrics();
    const load = metrics.currentLoad;

    this.logger.log(
      `[NeuralBudget] Requests: ${metrics.grantedRequests}/${metrics.totalRequests} granted, ` +
      `${metrics.throttledRequests} throttled, ${metrics.shedRequests} shed | ` +
      `Avg batch: ${metrics.averageBatchSize}, Quality: ${metrics.averageQualityLevel}/4 | ` +
      `Load: CPU ${load.cpuUsage}%, Mem ${load.memoryUsage}%, Active ${load.activeRequests}, Queue ${load.queueDepth}`
    );
  }

  /**
   * Check system health status
   */
  getHealthStatus(): { healthy: boolean; status: string; load: SystemLoadMetrics } {
    const load = this.getSystemLoad();

    if (
      load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_CRITICAL ||
      load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_CRITICAL
    ) {
      return {
        healthy: false,
        status: 'CRITICAL: System overloaded',
        load,
      };
    }

    if (
      load.cpuUsage >= NeuralBudgetService.CPU_THRESHOLD_HIGH ||
      load.memoryUsage >= NeuralBudgetService.MEMORY_THRESHOLD_HIGH
    ) {
      return {
        healthy: true,
        status: 'WARNING: High load, throttling enabled',
        load,
      };
    }

    return {
      healthy: true,
      status: 'OK: Normal operation',
      load,
    };
  }
}
