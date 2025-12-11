/**
 * Phase 10.113 Week 11: Embedding Worker Thread
 *
 * CPU-bound embedding generation in worker thread for parallel processing.
 * Each worker loads the model independently and processes batches.
 *
 * Model: Xenova/bge-small-en-v1.5 (384 dims, quantized ~50MB)
 *
 * FIXES FROM ULTRA-THINK REVIEW:
 * - Bug 3: Cleanup handlers + memory monitoring
 * - Bug 4: Error handling for worker operations
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 11
 */

import { parentPort, workerData } from 'worker_threads';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Transformer.js tensor output
 */
interface TransformersTensor {
  data: Float32Array | number[];
  dims: number[];
}

/**
 * Feature extraction pipeline type
 */
type FeatureExtractionPipeline = (
  text: string | string[],
  options?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean }
) => Promise<TransformersTensor>;

/**
 * Message types from parent
 */
interface EmbedMessage {
  type: 'embed';
  texts: string[];
  batchId: string;
}

interface HealthMessage {
  type: 'health';
}

interface ShutdownMessage {
  type: 'shutdown';
}

type ParentMessage = EmbedMessage | HealthMessage | ShutdownMessage;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Memory warning threshold (600MB)
 */
const MEMORY_WARNING_THRESHOLD = 600 * 1024 * 1024;

/**
 * Memory check interval (30s)
 */
const MEMORY_CHECK_INTERVAL = 30000;

// ============================================================================
// WORKER STATE
// ============================================================================

let embeddingPipeline: FeatureExtractionPipeline | null = null;
let modelLoadedAt: number = 0;
let memoryMonitorInterval: NodeJS.Timeout | null = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the embedding model
 */
async function initWorker(): Promise<void> {
  try {
    console.log('[EmbeddingWorker] Loading model...');

    // Dynamic import for ESM module
    const { pipeline, env } = await import('@xenova/transformers');

    // Configure environment for Node.js
    env.allowLocalModels = true;
    env.useBrowserCache = false;

    // Load the feature-extraction pipeline
    embeddingPipeline = (await pipeline(
      'feature-extraction',
      'Xenova/bge-small-en-v1.5',
      { quantized: true },
    )) as unknown as FeatureExtractionPipeline;

    modelLoadedAt = Date.now();

    parentPort?.postMessage({
      type: 'ready',
      loadTimeMs: modelLoadedAt - (workerData?.startTime ?? modelLoadedAt),
    });

    console.log('[EmbeddingWorker] Model loaded successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[EmbeddingWorker] Failed to load model: ${errorMessage}`);

    parentPort?.postMessage({
      type: 'error',
      error: errorMessage,
    });

    process.exit(1);
  }
}

// ============================================================================
// BUG 3 FIX: MEMORY MONITORING
// ============================================================================

/**
 * Start memory monitoring
 */
function startMemoryMonitor(): void {
  memoryMonitorInterval = setInterval(() => {
    const memUsage = process.memoryUsage();

    if (memUsage.heapUsed > MEMORY_WARNING_THRESHOLD) {
      parentPort?.postMessage({
        type: 'memory-warning',
        usage: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
      });
    }
  }, MEMORY_CHECK_INTERVAL);
}

// ============================================================================
// BUG 3 FIX: CLEANUP HANDLERS
// ============================================================================

/**
 * Cleanup resources on exit
 */
function cleanup(): void {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
  }

  // Help GC
  embeddingPipeline = null;
}

process.on('exit', cleanup);

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[EmbeddingWorker] Uncaught exception:', error.message);
  parentPort?.postMessage({
    type: 'error',
    error: error.message,
  });
});

process.on('unhandledRejection', (reason) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  console.error('[EmbeddingWorker] Unhandled rejection:', errorMessage);
  parentPort?.postMessage({
    type: 'error',
    error: errorMessage,
  });
});

// ============================================================================
// BUG 4 FIX: MESSAGE HANDLING WITH ERROR HANDLING
// ============================================================================

/**
 * Handle embed request
 */
async function handleEmbed(msg: EmbedMessage): Promise<void> {
  const { texts, batchId } = msg;

  try {
    if (!embeddingPipeline) {
      throw new Error('Model not loaded');
    }

    // Generate embeddings
    const output = await embeddingPipeline(texts, {
      pooling: 'mean',
      normalize: true,
    });

    // Extract data as flat array
    const embeddings = output.data instanceof Float32Array
      ? Array.from(output.data)
      : output.data;

    parentPort?.postMessage({
      type: 'result',
      batchId,
      embeddings,
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[EmbeddingWorker] Embedding failed for batch ${batchId}: ${errorMessage}`);

    parentPort?.postMessage({
      type: 'result',
      batchId,
      error: errorMessage,
      success: false,
    });
  }
}

/**
 * Handle health check request
 */
function handleHealth(): void {
  parentPort?.postMessage({
    type: 'health-response',
    status: embeddingPipeline ? 'healthy' : 'unhealthy',
    uptime: Date.now() - modelLoadedAt,
    memory: process.memoryUsage(),
  });
}

/**
 * Handle shutdown request
 */
function handleShutdown(): void {
  cleanup();
  parentPort?.postMessage({ type: 'shutdown-ack' });
  process.exit(0);
}

/**
 * Main message handler
 */
parentPort?.on('message', async (msg: ParentMessage) => {
  switch (msg.type) {
    case 'embed':
      await handleEmbed(msg);
      break;
    case 'health':
      handleHealth();
      break;
    case 'shutdown':
      handleShutdown();
      break;
    default:
      console.warn(`[EmbeddingWorker] Unknown message type: ${(msg as { type: string }).type}`);
  }
});

// ============================================================================
// START WORKER
// ============================================================================

// Start memory monitoring
startMemoryMonitor();

// Initialize model
initWorker().catch(error => {
  console.error('[EmbeddingWorker] Initialization failed:', error);
  process.exit(1);
});
