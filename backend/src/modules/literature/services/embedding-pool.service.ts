/**
 * Phase 10.113 Week 11: Worker Thread Embedding Pool Service
 *
 * Manages a pool of worker threads for parallel CPU-bound embedding generation.
 *
 * Why Workers?
 * - Embedding is CPU-bound (tensor math)
 * - Node.js main thread blocked during inference
 * - Workers enable true parallelism on multi-core CPUs
 *
 * Architecture:
 * - Pool of 4 workers (matches typical CPU cores)
 * - Each worker loads model independently (~50MB each)
 * - Round-robin load balancing (Issue 11 FIX)
 * - Dynamic batch sizing based on memory (Issue 14 FIX)
 *
 * FIXES FROM ULTRA-THINK REVIEW:
 * - Bug 3: Cleanup handlers + memory monitoring
 * - Bug 4: try-catch, timeout, retry for worker operations
 * - Issue 11: Round-robin load balancing
 * - Issue 14: Dynamic batch sizing based on memory
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 11
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { AbortError } from './progressive-semantic.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Worker status tracking
 */
interface WorkerStatus {
  status: 'initializing' | 'ready' | 'idle' | 'busy' | 'error' | 'exited';
  tasksCompleted: number;
  lastError?: string;
}

/**
 * Pending task resolver
 */
interface TaskResolver {
  resolve: (embeddings: number[][]) => void;
  reject: (error: Error) => void;
  batchId: string;
  timestamp: number;
}

/**
 * Worker message types
 */
interface WorkerReadyMessage {
  type: 'ready';
  loadTimeMs: number;
}

interface WorkerResultMessage {
  type: 'result';
  batchId: string;
  embeddings?: number[];
  error?: string;
  success: boolean;
}

interface WorkerMemoryWarningMessage {
  type: 'memory-warning';
  usage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

interface WorkerHealthMessage {
  type: 'health-response';
  status: 'healthy' | 'unhealthy';
  uptime: number;
  memory: NodeJS.MemoryUsage;
}

interface WorkerShutdownMessage {
  type: 'shutdown-ack';
}

interface WorkerErrorMessage {
  type: 'error';
  error: string;
}

type WorkerMessage =
  | WorkerReadyMessage
  | WorkerResultMessage
  | WorkerMemoryWarningMessage
  | WorkerHealthMessage
  | WorkerShutdownMessage
  | WorkerErrorMessage;

/**
 * Pool health report
 */
export interface PoolHealth {
  totalWorkers: number;
  readyWorkers: number;
  busyWorkers: number;
  errorWorkers: number;
  totalTasksCompleted: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Number of worker threads to spawn
 */
const POOL_SIZE = 4;

/**
 * Default timeout for embedding operations (30s)
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Maximum retry attempts for failed batches
 */
const MAX_RETRIES = 2;

/**
 * Embedding dimensions (BGE-small-en-v1.5)
 */
const EMBEDDING_DIMENSIONS = 384;

/**
 * Worker initialization timeout (60s for model download)
 */
const INIT_TIMEOUT_MS = 60000;

/**
 * Graceful shutdown timeout (5s)
 */
const SHUTDOWN_TIMEOUT_MS = 5000;

/**
 * Pool Issue 2 FIX: Health check interval (30s)
 */
const HEALTH_CHECK_INTERVAL_MS = 30000;

/**
 * Pool Issue 1 FIX: Maximum respawn attempts per worker
 */
const MAX_RESPAWN_ATTEMPTS = 3;

/**
 * Pool Issue 1 FIX: Respawn cooldown period (5s)
 */
const RESPAWN_COOLDOWN_MS = 5000;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class EmbeddingPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingPoolService.name);

  private workers: Worker[] = [];
  private workerStatus = new Map<number, WorkerStatus>();
  private pendingTasks = new Map<string, TaskResolver>();
  private nextWorkerIndex = 0;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Pool Issue 1 FIX: Track respawn attempts
  private respawnAttempts = new Map<number, { count: number; lastAttempt: number }>();

  // Pool Issue 2 FIX: Health check interval
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async onModuleInit(): Promise<void> {
    this.logger.log('✅ [Phase 10.113 Week 11] EmbeddingPoolService initializing...');
    this.logger.log(`   Pool size: ${POOL_SIZE} workers`);

    // Start initialization (non-blocking)
    this.initializationPromise = this.initializePool();

    // Don't await - let app start while workers load
    this.initializationPromise
      .then(() => {
        this.isInitialized = true;
        this.logger.log(`✅ [EmbeddingPool] All workers ready`);

        // Pool Issue 2 FIX: Start health check interval
        this.startHealthChecks();
      })
      .catch(error => {
        this.logger.warn(`⚠️ [EmbeddingPool] Worker pool initialization failed: ${error.message}`);
        this.logger.warn(`   Embeddings will use synchronous fallback (LocalEmbeddingService)`);
      });
  }

  /**
   * Bug 3 FIX: Proper cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('[EmbeddingPool] Shutting down worker pool...');

    // Pool Issue 2 FIX: Stop health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    const shutdownPromises = this.workers.map((worker, i) => {
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.warn(`[EmbeddingPool] Worker ${i} shutdown timeout, terminating`);
          worker.terminate();
          resolve();
        }, SHUTDOWN_TIMEOUT_MS);

        const handler = (msg: WorkerMessage) => {
          if (msg.type === 'shutdown-ack') {
            clearTimeout(timeout);
            worker.off('message', handler);
            resolve();
          }
        };

        worker.on('message', handler);
        worker.postMessage({ type: 'shutdown' });
      });
    });

    await Promise.all(shutdownPromises);

    this.workers = [];
    this.workerStatus.clear();
    this.pendingTasks.clear();
    this.isInitialized = false;

    this.logger.log('[EmbeddingPool] Worker pool shut down');
  }

  /**
   * Check if worker pool is ready
   *
   * @returns True if at least one worker is ready
   */
  isPoolReady(): boolean {
    if (!this.isInitialized) return false;

    for (const status of this.workerStatus.values()) {
      if (status.status === 'ready' || status.status === 'idle') {
        return true;
      }
    }
    return false;
  }

  /**
   * Get pool health status
   *
   * @returns Pool health metrics
   */
  getPoolHealth(): PoolHealth {
    let readyWorkers = 0;
    let busyWorkers = 0;
    let errorWorkers = 0;
    let totalTasks = 0;

    for (const status of this.workerStatus.values()) {
      if (status.status === 'ready' || status.status === 'idle') readyWorkers++;
      else if (status.status === 'busy') busyWorkers++;
      else if (status.status === 'error' || status.status === 'exited') errorWorkers++;

      totalTasks += status.tasksCompleted;
    }

    return {
      totalWorkers: this.workers.length,
      readyWorkers,
      busyWorkers,
      errorWorkers,
      totalTasksCompleted: totalTasks,
    };
  }

  /**
   * Bug 4 FIX: Generate embeddings with timeout, retry, and abort support
   *
   * @param texts - Texts to embed
   * @param timeoutMs - Timeout in milliseconds
   * @param signal - AbortSignal for cancellation
   * @returns Array of embedding vectors
   */
  async embedWithTimeout(
    texts: string[],
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    signal?: AbortSignal,
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    // Wait for pool initialization if needed
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.isPoolReady()) {
      throw new Error('Worker pool not ready');
    }

    // Issue 14 FIX: Dynamic batch sizing
    const batchSize = this.calculateOptimalBatchSize();
    const batches = this.chunkArray(texts, batchSize);
    const results: (number[][] | null)[] = new Array(batches.length);

    this.logger.debug(`[EmbeddingPool] Processing ${texts.length} texts in ${batches.length} batches (size: ${batchSize})`);

    await Promise.allSettled(
      batches.map(async (batch, batchIndex) => {
        // Check abort before starting
        if (signal?.aborted) {
          throw new AbortError('Request cancelled');
        }

        let lastError: Error | null = null;

        // Bug 4 FIX: Retry logic
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            results[batchIndex] = await this.submitBatchWithTimeout(
              batch,
              `batch-${batchIndex}-${Date.now()}`,
              timeoutMs,
            );
            return; // Success
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < MAX_RETRIES) {
              this.logger.warn(`[EmbeddingPool] Batch ${batchIndex} attempt ${attempt + 1} failed, retrying...`);
              await this.delay(100 * (attempt + 1)); // Exponential backoff
            }
          }
        }

        // All retries failed
        this.logger.error(`[EmbeddingPool] Batch ${batchIndex} failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
        results[batchIndex] = null;
      })
    );

    // Filter out failed batches and flatten
    const successful = results.filter((r): r is number[][] => r !== null);

    if (successful.length === 0) {
      throw new Error('All embedding batches failed');
    }

    if (successful.length < results.length) {
      this.logger.warn(`[EmbeddingPool] ${results.length - successful.length}/${results.length} batches failed`);
    }

    return successful.flat();
  }

  /**
   * Initialize worker pool
   */
  private async initializePool(): Promise<void> {
    const workerPath = join(__dirname, '../workers/embedding.worker.js');

    for (let i = 0; i < POOL_SIZE; i++) {
      try {
        const worker = new Worker(workerPath);
        this.workers.push(worker);
        this.workerStatus.set(i, { status: 'initializing', tasksCompleted: 0 });

        // Set up message handlers
        worker.on('message', (msg: WorkerMessage) => this.handleWorkerMessage(i, msg));
        worker.on('error', (err: Error) => this.handleWorkerError(i, err));
        worker.on('exit', (code: number) => this.handleWorkerExit(i, code));

        this.logger.debug(`[EmbeddingPool] Worker ${i} spawned`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`[EmbeddingPool] Failed to spawn worker ${i}: ${errorMsg}`);
      }
    }

    // Wait for all workers to initialize (with timeout)
    await this.waitForWorkersReady(INIT_TIMEOUT_MS);
  }

  /**
   * Wait for workers to become ready
   *
   * @param timeoutMs - Maximum wait time
   */
  private async waitForWorkersReady(timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const readyCount = Array.from(this.workerStatus.values())
        .filter(s => s.status === 'ready' || s.status === 'idle')
        .length;

      if (readyCount >= this.workers.length) {
        return;
      }

      await this.delay(100);
    }

    const readyCount = Array.from(this.workerStatus.values())
      .filter(s => s.status === 'ready' || s.status === 'idle')
      .length;

    if (readyCount === 0) {
      throw new Error('No workers ready after timeout');
    }

    this.logger.warn(`[EmbeddingPool] Only ${readyCount}/${this.workers.length} workers ready`);
  }

  /**
   * Issue 11 FIX: Round-robin load balancing
   *
   * @returns Index of next available worker
   */
  private getNextAvailableWorker(): number {
    const startIndex = this.nextWorkerIndex;

    do {
      const workerIdx = this.nextWorkerIndex;
      this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;

      const status = this.workerStatus.get(workerIdx);
      if (status?.status === 'ready' || status?.status === 'idle') {
        return workerIdx;
      }
    } while (this.nextWorkerIndex !== startIndex);

    // All workers busy - return next in round-robin anyway
    return this.nextWorkerIndex;
  }

  /**
   * Issue 14 FIX: Dynamic batch sizing based on memory
   *
   * @returns Optimal batch size
   */
  private calculateOptimalBatchSize(): number {
    const memUsage = process.memoryUsage();
    const availableHeap = memUsage.heapTotal - memUsage.heapUsed;

    // Each embedding ~2KB, estimate batch memory usage
    if (availableHeap > 500 * 1024 * 1024) return 32; // >500MB free
    if (availableHeap > 200 * 1024 * 1024) return 16; // >200MB free
    return 8; // Low memory
  }

  /**
   * Submit batch to worker with timeout
   *
   * @param texts - Texts to embed
   * @param batchId - Unique batch identifier
   * @param timeoutMs - Timeout in milliseconds
   * @returns Embedding vectors
   */
  private async submitBatchWithTimeout(
    texts: string[],
    batchId: string,
    timeoutMs: number,
  ): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const workerIndex = this.getNextAvailableWorker();
      const worker = this.workers[workerIndex];

      if (!worker) {
        reject(new Error('No workers available'));
        return;
      }

      const timeout = setTimeout(() => {
        this.pendingTasks.delete(batchId);
        reject(new Error(`Worker timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingTasks.set(batchId, {
        resolve: (embeddings: number[][]) => {
          clearTimeout(timeout);
          this.pendingTasks.delete(batchId);
          resolve(embeddings);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          this.pendingTasks.delete(batchId);
          reject(error);
        },
        batchId,
        timestamp: Date.now(),
      });

      // Update worker status
      const status = this.workerStatus.get(workerIndex);
      if (status) {
        this.workerStatus.set(workerIndex, { ...status, status: 'busy' });
      }

      // Send task to worker
      worker.postMessage({ type: 'embed', texts, batchId });
    });
  }

  /**
   * Handle messages from worker
   *
   * @param workerIndex - Worker index
   * @param msg - Worker message
   */
  private handleWorkerMessage(workerIndex: number, msg: WorkerMessage): void {
    if (msg.type === 'ready') {
      const readyMsg = msg as WorkerReadyMessage;
      this.workerStatus.set(workerIndex, { status: 'ready', tasksCompleted: 0 });
      this.logger.debug(`[EmbeddingPool] Worker ${workerIndex} ready (loaded in ${readyMsg.loadTimeMs}ms)`);

    } else if (msg.type === 'result') {
      const resultMsg = msg as WorkerResultMessage;
      const task = this.pendingTasks.get(resultMsg.batchId);

      if (task) {
        if (resultMsg.success && resultMsg.embeddings) {
          // Reshape flat array to 2D
          const embeddings = this.reshapeEmbeddings(resultMsg.embeddings);
          task.resolve(embeddings);
        } else {
          task.reject(new Error(resultMsg.error ?? 'Unknown worker error'));
        }
      }

      // Update worker status
      const status = this.workerStatus.get(workerIndex);
      if (status) {
        this.workerStatus.set(workerIndex, {
          status: 'idle',
          tasksCompleted: status.tasksCompleted + 1,
        });
      }

    } else if (msg.type === 'memory-warning') {
      const memMsg = msg as WorkerMemoryWarningMessage;
      this.logger.warn(`[EmbeddingPool] Worker ${workerIndex} memory warning: ${JSON.stringify(memMsg.usage)}`);

    } else if (msg.type === 'error') {
      const errorMsg = msg as WorkerErrorMessage;
      this.logger.error(`[EmbeddingPool] Worker ${workerIndex} error: ${errorMsg.error}`);
      this.workerStatus.set(workerIndex, { status: 'error', tasksCompleted: 0, lastError: errorMsg.error });
    }
  }

  /**
   * Handle worker errors
   *
   * @param workerIndex - Worker index
   * @param error - Error object
   */
  private handleWorkerError(workerIndex: number, error: Error): void {
    this.logger.error(`[EmbeddingPool] Worker ${workerIndex} error: ${error.message}`);
    this.workerStatus.set(workerIndex, { status: 'error', tasksCompleted: 0, lastError: error.message });
  }

  /**
   * Pool Issue 1 FIX: Handle worker exit with automatic respawn
   *
   * @param workerIndex - Worker index
   * @param code - Exit code
   */
  private handleWorkerExit(workerIndex: number, code: number): void {
    this.logger.warn(`[EmbeddingPool] Worker ${workerIndex} exited with code ${code}`);
    this.workerStatus.set(workerIndex, { status: 'exited', tasksCompleted: 0 });

    // Pool Issue 1 FIX: Automatic worker respawn with rate limiting
    const attempts = this.respawnAttempts.get(workerIndex) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    // Check cooldown
    if (now - attempts.lastAttempt < RESPAWN_COOLDOWN_MS) {
      this.logger.debug(`[EmbeddingPool] Worker ${workerIndex} respawn in cooldown`);
      return;
    }

    // Check max attempts
    if (attempts.count >= MAX_RESPAWN_ATTEMPTS) {
      this.logger.error(`[EmbeddingPool] Worker ${workerIndex} exceeded max respawn attempts (${MAX_RESPAWN_ATTEMPTS})`);
      return;
    }

    // Attempt respawn
    this.respawnAttempts.set(workerIndex, { count: attempts.count + 1, lastAttempt: now });
    this.logger.log(`[EmbeddingPool] Respawning worker ${workerIndex} (attempt ${attempts.count + 1}/${MAX_RESPAWN_ATTEMPTS})`);

    this.respawnWorker(workerIndex).catch(err => {
      this.logger.error(`[EmbeddingPool] Failed to respawn worker ${workerIndex}: ${err.message}`);
    });
  }

  /**
   * Pool Issue 1 FIX: Respawn a single worker
   *
   * @param workerIndex - Worker index to respawn
   */
  private async respawnWorker(workerIndex: number): Promise<void> {
    const workerPath = join(__dirname, '../workers/embedding.worker.js');

    try {
      const worker = new Worker(workerPath);
      this.workers[workerIndex] = worker;
      this.workerStatus.set(workerIndex, { status: 'initializing', tasksCompleted: 0 });

      // Set up message handlers
      worker.on('message', (msg: WorkerMessage) => this.handleWorkerMessage(workerIndex, msg));
      worker.on('error', (err: Error) => this.handleWorkerError(workerIndex, err));
      worker.on('exit', (code: number) => this.handleWorkerExit(workerIndex, code));

      this.logger.log(`[EmbeddingPool] Worker ${workerIndex} respawned successfully`);

      // Wait for it to become ready (with timeout)
      await this.waitForSingleWorkerReady(workerIndex, INIT_TIMEOUT_MS);

      // Reset respawn attempts on successful restart
      this.respawnAttempts.set(workerIndex, { count: 0, lastAttempt: 0 });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[EmbeddingPool] Failed to respawn worker ${workerIndex}: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Pool Issue 1 FIX: Wait for a single worker to become ready
   *
   * @param workerIndex - Worker index
   * @param timeoutMs - Maximum wait time
   */
  private async waitForSingleWorkerReady(workerIndex: number, timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = this.workerStatus.get(workerIndex);
      if (status?.status === 'ready' || status?.status === 'idle') {
        return;
      }
      await this.delay(100);
    }

    throw new Error(`Worker ${workerIndex} did not become ready within ${timeoutMs}ms`);
  }

  /**
   * Reshape flat embedding array to 2D
   *
   * @param flat - Flat array of embedding values
   * @returns 2D array of embeddings
   */
  private reshapeEmbeddings(flat: number[]): number[][] {
    const embeddings: number[][] = [];
    for (let i = 0; i < flat.length; i += EMBEDDING_DIMENSIONS) {
      embeddings.push(flat.slice(i, i + EMBEDDING_DIMENSIONS));
    }
    return embeddings;
  }

  /**
   * Split array into chunks
   *
   * @param arr - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // POOL ISSUE 2 FIX: HEALTH CHECKS
  // ==========================================================================

  /**
   * Pool Issue 2 FIX: Start periodic health checks
   *
   * Pings workers every 30s to detect stuck/unresponsive workers.
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL_MS);

    this.logger.log(`[EmbeddingPool] Health checks started (interval: ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`);
  }

  /**
   * Pool Issue 2 FIX: Perform health check on all workers
   *
   * Sends health-check ping to each worker and checks for response.
   */
  private async performHealthCheck(): Promise<void> {
    const healthPromises = this.workers.map((worker, i) => {
      return this.checkWorkerHealth(worker, i);
    });

    const results = await Promise.all(healthPromises);

    const healthy = results.filter(r => r).length;
    const unhealthy = results.filter(r => !r).length;

    if (unhealthy > 0) {
      this.logger.warn(`[EmbeddingPool] Health check: ${healthy}/${this.workers.length} workers healthy`);
    } else {
      this.logger.debug(`[EmbeddingPool] Health check: all ${healthy} workers healthy`);
    }
  }

  /**
   * Pool Issue 2 FIX: Check health of a single worker
   *
   * @param worker - Worker to check
   * @param workerIndex - Worker index
   * @returns True if worker is healthy
   */
  private async checkWorkerHealth(worker: Worker, workerIndex: number): Promise<boolean> {
    const status = this.workerStatus.get(workerIndex);

    // Skip workers that are already known to be down
    if (status?.status === 'exited' || status?.status === 'error') {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.logger.warn(`[EmbeddingPool] Worker ${workerIndex} health check timeout`);
        this.workerStatus.set(workerIndex, {
          status: 'error',
          tasksCompleted: status?.tasksCompleted || 0,
          lastError: 'Health check timeout',
        });
        resolve(false);
      }, 5000); // 5s health check timeout

      const handler = (msg: WorkerMessage) => {
        if (msg.type === 'health-response') {
          clearTimeout(timeout);
          worker.off('message', handler);

          const healthMsg = msg as WorkerHealthMessage;
          if (healthMsg.status === 'healthy') {
            this.logger.debug(`[EmbeddingPool] Worker ${workerIndex} healthy (uptime: ${healthMsg.uptime}ms)`);
            resolve(true);
          } else {
            this.logger.warn(`[EmbeddingPool] Worker ${workerIndex} unhealthy`);
            resolve(false);
          }
        }
      };

      worker.on('message', handler);
      worker.postMessage({ type: 'health-check' });
    });
  }

}
