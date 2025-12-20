import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma.service';
import { PDFParsingService } from './pdf-parsing.service';

/**
 * Phase 10 Day 5.15: PDF Processing Queue Service
 * Phase 10.185: Netflix-Grade Smart Retry Logic
 *
 * Lightweight background job queue for PDF processing:
 * - Async processing with event emitters
 * - Smart retry logic (skip non-retryable errors)
 * - Publisher-specific retry strategies
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
  errorCategory?: string; // Phase 10.185: Error categorization
  retryable?: boolean; // Phase 10.185: Smart retry flag
  publisher?: string; // Phase 10.185: Publisher detection
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
    private prisma: PrismaService, // Phase 10 Day 32: Inject Prisma to update status immediately
  ) {}

  /**
   * Add a PDF processing job to the queue
   * Phase 10 Day 33: Enhanced with database validation and diagnostic logging
   */
  async addJob(paperId: string): Promise<string> {
    // Phase 10 Day 33: DIAGNOSTIC - Verify paper exists and has valid identifiers
    try {
      const paper = await this.prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true, doi: true, pmid: true, url: true, title: true },
      });

      if (!paper) {
        const errorMsg = `Paper ${paperId} not found in database`;
        this.logger.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Check if paper has at least one valid identifier (non-empty after trim)
      const hasValidDoi = paper.doi && paper.doi.trim().length > 0;
      const hasValidPmid = paper.pmid && paper.pmid.trim().length > 0;
      const hasValidUrl = paper.url && paper.url.trim().length > 0;

      if (!hasValidDoi && !hasValidPmid && !hasValidUrl) {
        const errorMsg = `Paper ${paperId} has no valid identifiers for full-text extraction`;
        this.logger.error(`❌ ${errorMsg}`);
        this.logger.debug(`Empty or missing identifiers:`, {
          paperId: paper.id,
          title: paper.title?.substring(0, 60) + '...',
          doi: `"${paper.doi}"`,
          pmid: `"${paper.pmid}"`,
          url: `"${paper.url}"`,
        });
        throw new Error(errorMsg);
      }

      // Log which identifiers are available
      const availableIdentifiers = [
        hasValidDoi ? `DOI:${paper.doi}` : null,
        hasValidPmid ? `PMID:${paper.pmid}` : null,
        hasValidUrl ? `URL:${paper.url?.substring(0, 40)}...` : null,
      ]
        .filter(Boolean)
        .join(', ');

      this.logger.log(
        `Adding job for paper "${paper.title?.substring(0, 50)}..." using: ${availableIdentifiers}`,
      );
    } catch (error: unknown) {
      // Phase 10.106 Phase 5: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string };
      this.logger.error(
        `❌ Failed to validate paper ${paperId}: ${err.message || 'Unknown error'}`,
      );
      throw error; // Re-throw to prevent queuing invalid jobs
    }

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

    this.logger.log(`✅ Added PDF job ${jobId} for paper ${paperId} to queue`);

    // Phase 10 Day 32: CRITICAL FIX - Update status to 'fetching' IMMEDIATELY
    // Frontend waits 2 seconds and checks status - jobs must be marked as fetching right away
    // Otherwise getBulkStatus returns 0 fetching → frontend skips wait → extraction has 0 full-text
    try {
      await this.prisma.paper.update({
        where: { id: paperId },
        data: { fullTextStatus: 'fetching' },
      });
      this.logger.log(`✅ Updated paper ${paperId} status to 'fetching'`);
    } catch (error: unknown) {
      // Phase 10.106 Phase 5: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string };
      this.logger.warn(
        `Failed to update paper ${paperId} status: ${err.message || 'Unknown error'}`,
      );
      // Non-critical: job will still process
    }

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
   * Phase 10.185: Detect publisher from paper identifiers
   * Mirrors pdf-parsing.service.ts detectPublisher() for consistency
   */
  private async detectPublisherFromPaper(paperId: string): Promise<string> {
    try {
      const paper = await this.prisma.paper.findUnique({
        where: { id: paperId },
        select: { url: true, doi: true },
      });

      if (!paper) return 'unknown';

      const urlOrDoi = paper.url || paper.doi || '';
      const lower = urlOrDoi.toLowerCase();

      // URL-based detection
      if (lower.includes('springer') || lower.includes('link.springer')) return 'springer';
      if (lower.includes('nature') || lower.includes('nature.com')) return 'nature';
      if (lower.includes('wiley') || lower.includes('onlinelibrary.wiley')) return 'wiley';
      if (lower.includes('mdpi') || lower.includes('mdpi.com')) return 'mdpi';
      if (lower.includes('frontiers') || lower.includes('frontiersin.org')) return 'frontiers';
      if (lower.includes('plos') || lower.includes('plos.org')) return 'plos';
      if (lower.includes('elsevier') || lower.includes('sciencedirect')) return 'elsevier';
      if (lower.includes('ieee') || lower.includes('ieee.org')) return 'ieee';
      if (lower.includes('arxiv') || lower.includes('arxiv.org')) return 'arxiv';
      if (lower.includes('pubmed') || lower.includes('ncbi.nlm.nih.gov') || lower.includes('pmc')) return 'pmc';
      if (lower.includes('sage') || lower.includes('sagepub.com')) return 'sage';
      if (lower.includes('taylor') || lower.includes('tandfonline')) return 'taylorfrancis';
      if (lower.includes('jama') || lower.includes('jamanetwork')) return 'jama';

      // DOI prefix detection
      if (lower.startsWith('10.1007/')) return 'springer';
      if (lower.startsWith('10.1038/')) return 'nature';
      if (lower.startsWith('10.1111/') || lower.startsWith('10.1002/')) return 'wiley';
      if (lower.startsWith('10.3390/')) return 'mdpi';
      if (lower.startsWith('10.3389/')) return 'frontiers';
      if (lower.startsWith('10.1371/')) return 'plos';
      if (lower.startsWith('10.1016/')) return 'elsevier';
      if (lower.startsWith('10.1109/')) return 'ieee';
      if (lower.startsWith('10.1177/')) return 'sage';
      if (lower.startsWith('10.1080/')) return 'taylorfrancis';
      if (lower.startsWith('10.1001/')) return 'jama';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Phase 10.185: Calculate backoff with jitter for publisher
   */
  private calculateBackoffMs(attempts: number, publisher: string): number {
    const retryConfig = this.pdfParsingService.getRetryConfig(publisher);
    const baseDelay = retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempts - 1);
    const delay = Math.min(baseDelay, retryConfig.maxDelayMs);
    const jitter = Math.random() * retryConfig.jitterMs;
    return delay + jitter;
  }

  /**
   * Process a single job with smart retry logic
   * Phase 10.185: Netflix-Grade enhancements:
   * - Smart retry (skip non-retryable errors like paywall, 404)
   * - Publisher-specific retry strategies
   * - Enhanced error tracking
   */
  private async processJob(job: PDFJob): Promise<void> {
    job.attempts++;
    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 10;

    // Phase 10.185: Detect publisher for smart retry
    if (!job.publisher) {
      job.publisher = await this.detectPublisherFromPaper(job.paperId);
    }

    // Phase 10.185: Get publisher-specific max attempts
    const retryConfig = this.pdfParsingService.getRetryConfig(job.publisher);
    const effectiveMaxAttempts = Math.min(job.maxAttempts, retryConfig.maxAttempts);

    this.logger.log(
      `Processing PDF job ${job.id} for paper ${job.paperId} [${job.publisher}] (attempt ${job.attempts}/${effectiveMaxAttempts})`,
    );

    // Record request time for rate limiting
    this.requestTimes.push(Date.now());

    // Emit processing event
    this.eventEmitter.emit('pdf.job.processing', {
      jobId: job.id,
      paperId: job.paperId,
      progress: 10,
      attempt: job.attempts,
      publisher: job.publisher,
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
          `✅ PDF job ${job.id} completed successfully (${result.wordCount} words) [${job.publisher}]`,
        );

        // Emit success event
        this.eventEmitter.emit('pdf.job.completed', {
          jobId: job.id,
          paperId: job.paperId,
          progress: 100,
          wordCount: result.wordCount,
          publisher: job.publisher,
        });
      } else {
        // Failed - Phase 10.185: Smart retry logic
        job.errorCategory = result.category;
        job.retryable = result.retryable;

        // Phase 10.185: Skip retry for non-retryable errors (paywall, 404, parsing)
        const shouldRetry = result.retryable !== false && job.attempts < effectiveMaxAttempts;

        if (shouldRetry) {
          // Publisher-specific backoff with jitter
          const backoffMs = this.calculateBackoffMs(job.attempts, job.publisher);

          this.logger.warn(
            `PDF job ${job.id} failed [${result.category || 'unknown'}] (attempt ${job.attempts}/${effectiveMaxAttempts}), retrying in ${Math.round(backoffMs)}ms`,
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
            category: result.category,
            publisher: job.publisher,
          });

          // Wait and requeue
          await this.sleep(backoffMs);
          this.queue.push(job.id);
        } else {
          // Max retries reached OR non-retryable error
          job.status = 'failed';
          job.progress = 0;
          job.error = result.error;
          job.completedAt = new Date();

          const reason = result.retryable === false
            ? `non-retryable error [${result.category}]`
            : `max attempts (${effectiveMaxAttempts})`;

          this.logger.error(
            `❌ PDF job ${job.id} failed due to ${reason}: ${result.error} [${job.publisher}]`,
          );

          // Emit failed event with enhanced info
          this.eventEmitter.emit('pdf.job.failed', {
            jobId: job.id,
            paperId: job.paperId,
            error: result.error,
            attempts: job.attempts,
            category: result.category,
            retryable: result.retryable,
            publisher: job.publisher,
          });
        }
      }
    } catch (error) {
      // Unexpected error
      job.status = 'failed';
      job.progress = 0;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      this.logger.error(`❌ PDF job ${job.id} threw unexpected error [${job.publisher}]:`, error);

      // Emit failed event
      this.eventEmitter.emit('pdf.job.failed', {
        jobId: job.id,
        paperId: job.paperId,
        error: job.error,
        attempts: job.attempts,
        category: 'unexpected',
        publisher: job.publisher,
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
