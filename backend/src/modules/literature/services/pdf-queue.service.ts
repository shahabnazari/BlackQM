import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PDFParsingService } from './pdf-parsing.service';

/**
 * Phase 10 Day 5.15: PDF Processing Queue Service
 *
 * Lightweight background job queue for PDF processing:
 * - Async processing with event emitters
 * - Retry logic (3 attempts with exponential backoff)
 * - Real-time progress events via EventEmitter
 * - Rate limiting (10 PDFs/minute)
 */

interface PDFJob {
  id: string;
  paperId: string;
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class PDFQueueService {
  private readonly logger = new Logger(PDFQueueService.name);
  private readonly jobs = new Map<string, PDFJob>();
  private readonly queue: string[] = []; // Queue of job IDs
  private processing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_PER_MINUTE = 10;
  private readonly requestTimes: number[] = [];

  constructor(
    private pdfParsingService: PDFParsingService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Add a PDF processing job to the queue
   */
  async addJob(paperId: string): Promise<string> {
    const jobId = `pdf-${paperId}-${Date.now()}`;

    const job: PDFJob = {
      id: jobId,
      paperId,
      attempts: 0,
      maxAttempts: this.MAX_RETRIES,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    this.logger.log(`Added PDF job ${jobId} for paper ${paperId} to queue`);

    // Emit queued event
    this.eventEmitter.emit('pdf.job.queued', { jobId, paperId, progress: 0 });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): PDFJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get job by paper ID (latest job)
   */
  getJobByPaperId(paperId: string): PDFJob | undefined {
    const jobs = Array.from(this.jobs.values())
      .filter((job) => job.paperId === paperId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return jobs[0];
  }

  /**
   * Check rate limit (10 PDFs per minute)
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    while (
      this.requestTimes.length > 0 &&
      this.requestTimes[0] < oneMinuteAgo
    ) {
      this.requestTimes.shift();
    }

    // Check if we've hit the limit
    if (this.requestTimes.length >= this.RATE_LIMIT_PER_MINUTE) {
      this.logger.warn('Rate limit reached (10 PDFs/minute)');
      return false;
    }

    return true;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (!jobId) continue;

      const job = this.jobs.get(jobId);
      if (!job) continue;

      // Check rate limit
      if (!this.checkRateLimit()) {
        // Requeue and wait 1 minute
        this.queue.unshift(jobId);
        this.logger.log('Rate limit reached, waiting 60 seconds...');
        await this.sleep(60000);
        continue;
      }

      // Process job
      await this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Process a single job with retry logic
   */
  private async processJob(job: PDFJob): Promise<void> {
    job.attempts++;
    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 10;

    this.logger.log(
      `Processing PDF job ${job.id} for paper ${job.paperId} (attempt ${job.attempts}/${job.maxAttempts})`,
    );

    // Record request time for rate limiting
    this.requestTimes.push(Date.now());

    // Emit processing event
    this.eventEmitter.emit('pdf.job.processing', {
      jobId: job.id,
      paperId: job.paperId,
      progress: 10,
      attempt: job.attempts,
    });

    try {
      // Simulate progress: Downloading (30%)
      job.progress = 30;
      this.eventEmitter.emit('pdf.job.progress', {
        jobId: job.id,
        paperId: job.paperId,
        progress: 30,
        stage: 'downloading',
      });

      // Call PDF parsing service
      const result = await this.pdfParsingService.processFullText(job.paperId);

      if (result.success) {
        // Success!
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date();

        this.logger.log(
          `✅ PDF job ${job.id} completed successfully (${result.wordCount} words)`,
        );

        // Emit success event
        this.eventEmitter.emit('pdf.job.completed', {
          jobId: job.id,
          paperId: job.paperId,
          progress: 100,
          wordCount: result.wordCount,
        });
      } else {
        // Failed
        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          const backoffMs = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s
          this.logger.warn(
            `PDF job ${job.id} failed (attempt ${job.attempts}), retrying in ${backoffMs}ms`,
          );

          job.status = 'queued';
          job.progress = 0;

          // Emit retry event
          this.eventEmitter.emit('pdf.job.retry', {
            jobId: job.id,
            paperId: job.paperId,
            attempt: job.attempts,
            nextAttemptIn: backoffMs,
            error: result.error,
          });

          // Wait and requeue
          await this.sleep(backoffMs);
          this.queue.push(job.id);
        } else {
          // Max retries reached
          job.status = 'failed';
          job.progress = 0;
          job.error = result.error;
          job.completedAt = new Date();

          this.logger.error(
            `❌ PDF job ${job.id} failed after ${job.maxAttempts} attempts: ${result.error}`,
          );

          // Emit failed event
          this.eventEmitter.emit('pdf.job.failed', {
            jobId: job.id,
            paperId: job.paperId,
            error: result.error,
            attempts: job.attempts,
          });
        }
      }
    } catch (error) {
      // Unexpected error
      job.status = 'failed';
      job.progress = 0;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      this.logger.error(`❌ PDF job ${job.id} threw unexpected error:`, error);

      // Emit failed event
      this.eventEmitter.emit('pdf.job.failed', {
        jobId: job.id,
        paperId: job.paperId,
        error: job.error,
        attempts: job.attempts,
      });
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    totalJobs: number;
    processing: number;
    completed: number;
    failed: number;
    queued: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      queueLength: this.queue.length,
      totalJobs: this.jobs.size,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      queued: jobs.filter((j) => j.status === 'queued').length,
    };
  }

  /**
   * Clean up completed/failed jobs older than 7 days
   */
  async cleanup(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < sevenDaysAgo
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old PDF jobs`);
    }
  }
}
