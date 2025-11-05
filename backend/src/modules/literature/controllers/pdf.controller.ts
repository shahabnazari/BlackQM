import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Sse,
  MessageEvent,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PDFParsingService } from '../services/pdf-parsing.service';
import { PDFQueueService } from '../services/pdf-queue.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * Phase 10 Day 5.15: PDF Full-Text Controller
 *
 * Endpoints:
 * - POST /pdf/fetch/:paperId - Trigger full-text fetch
 * - GET /pdf/status/:paperId - Get fetch status
 * - POST /pdf/bulk-status - Get status for multiple papers
 * - GET /pdf/full-text/:paperId - Get full-text content
 * - GET /pdf/events/:paperId (SSE) - Real-time progress updates
 */
@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PDFController {
  private readonly logger = new Logger(PDFController.name);
  private readonly eventSubject = new Subject<{
    paperId: string;
    event: any;
  }>();

  constructor(
    private pdfParsingService: PDFParsingService,
    private pdfQueueService: PDFQueueService,
  ) {
    // Set up event listeners for SSE
    this.setupEventListeners();
  }

  /**
   * Set up event listeners to forward queue events to SSE clients
   */
  private setupEventListeners(): void {
    // These will be handled by @OnEvent decorators below
  }

  /**
   * POST /pdf/fetch/:paperId
   * Trigger full-text fetch for a paper
   */
  @Post('fetch/:paperId')
  async fetchFullText(@Param('paperId') paperId: string): Promise<{
    success: boolean;
    jobId: string;
    message: string;
  }> {
    try {
      const jobId = await this.pdfQueueService.addJob(paperId);

      return {
        success: true,
        jobId,
        message: 'Full-text fetch job queued successfully',
      };
    } catch (error) {
      this.logger.error(`Error queuing PDF fetch for paper ${paperId}:`, error);
      throw new HttpException(
        'Failed to queue full-text fetch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /pdf/status/:paperId
   * Get full-text fetch status for a paper
   */
  @Get('status/:paperId')
  async getStatus(@Param('paperId') paperId: string): Promise<{
    status: string;
    wordCount?: number;
    fetchedAt?: Date;
    jobStatus?: string;
    jobProgress?: number;
  }> {
    // Get database status
    const dbStatus = await this.pdfParsingService.getStatus(paperId);

    // Get queue job status
    const job = this.pdfQueueService.getJobByPaperId(paperId);

    return {
      status: dbStatus?.status || 'not_fetched',
      wordCount: dbStatus?.wordCount,
      fetchedAt: dbStatus?.fetchedAt,
      jobStatus: job?.status,
      jobProgress: job?.progress,
    };
  }

  /**
   * POST /pdf/bulk-status
   * Get fetch status for multiple papers
   */
  @Post('bulk-status')
  async getBulkStatus(@Body() body: { paperIds: string[] }): Promise<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  }> {
    if (!body.paperIds || !Array.isArray(body.paperIds)) {
      throw new HttpException(
        'Invalid request: paperIds array required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.pdfParsingService.getBulkStatus(body.paperIds);
  }

  /**
   * GET /pdf/full-text/:paperId
   * Get full-text content for a paper (authenticated)
   */
  @Get('full-text/:paperId')
  async getFullText(@Param('paperId') paperId: string): Promise<{
    fullText: string | null;
    wordCount: number | null;
  }> {
    const fullText = await this.pdfParsingService.getFullText(paperId);
    const wordCount = fullText
      ? this.pdfParsingService.calculateWordCount(fullText)
      : null;

    return {
      fullText,
      wordCount,
    };
  }

  /**
   * GET /pdf/events/:paperId (SSE)
   * Real-time progress updates via Server-Sent Events
   */
  @Sse('events/:paperId')
  streamProgress(@Param('paperId') paperId: string): Observable<MessageEvent> {
    this.logger.log(`SSE client connected for paper ${paperId}`);

    return this.eventSubject.pipe(
      filter((event) => event.paperId === paperId),
      map((event) => ({
        data: event.event,
      })),
    );
  }

  /**
   * GET /pdf/stats
   * Get queue statistics (admin/debug)
   */
  @Get('stats')
  getStats(): any {
    return this.pdfQueueService.getStats();
  }

  // ============================================
  // Event Handlers (forward to SSE clients)
  // ============================================

  @OnEvent('pdf.job.queued')
  handleQueued(payload: {
    jobId: string;
    paperId: string;
    progress: number;
  }): void {
    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'queued',
        progress: payload.progress,
        message: 'Full-text fetch queued',
      },
    });
  }

  @OnEvent('pdf.job.processing')
  handleProcessing(payload: {
    jobId: string;
    paperId: string;
    progress: number;
  }): void {
    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'processing',
        progress: payload.progress,
        message: 'Downloading PDF...',
      },
    });
  }

  @OnEvent('pdf.job.progress')
  handleProgress(payload: {
    jobId: string;
    paperId: string;
    progress: number;
    stage: string;
  }): void {
    const messages: Record<string, string> = {
      downloading: 'Downloading PDF...',
      extracting: 'Extracting text...',
      cleaning: 'Cleaning text...',
    };

    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'progress',
        progress: payload.progress,
        stage: payload.stage,
        message: messages[payload.stage] || 'Processing...',
      },
    });
  }

  @OnEvent('pdf.job.completed')
  handleCompleted(payload: {
    jobId: string;
    paperId: string;
    progress: number;
    wordCount?: number;
  }): void {
    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'completed',
        progress: 100,
        wordCount: payload.wordCount,
        message: `Full-text ready (${payload.wordCount?.toLocaleString()} words)`,
      },
    });
  }

  @OnEvent('pdf.job.failed')
  handleFailed(payload: {
    jobId: string;
    paperId: string;
    error: string;
    attempts: number;
  }): void {
    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'failed',
        progress: 0,
        error: payload.error,
        message: 'Full-text unavailable',
      },
    });
  }

  @OnEvent('pdf.job.retry')
  handleRetry(payload: {
    jobId: string;
    paperId: string;
    attempt: number;
    nextAttemptIn: number;
  }): void {
    this.eventSubject.next({
      paperId: payload.paperId,
      event: {
        type: 'retry',
        progress: 0,
        attempt: payload.attempt,
        message: `Retrying in ${Math.round(payload.nextAttemptIn / 1000)}s...`,
      },
    });
  }
}
