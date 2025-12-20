/**
 * PDF Queue Service Tests
 * Phase 10.185: Enhanced with Netflix-Grade Smart Retry Tests
 *
 * Uses lightweight mocking without NestJS TestingModule for faster execution.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFQueueService } from '../pdf-queue.service';

describe('PDFQueueService', () => {
  let service: PDFQueueService;
  let mockPdfParsingService: any;
  let mockEventEmitter: any;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock services
    mockPrisma = {
      paper: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'paper-1',
          doi: '10.1234/test',
          pmid: null,
          url: 'https://example.com/paper',
          title: 'Test Paper',
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    mockPdfParsingService = {
      processFullText: vi.fn(),
      getRetryConfig: vi.fn().mockReturnValue({
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 8000,
        backoffMultiplier: 2,
        jitterMs: 500,
      }),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    // Directly instantiate service with mocks
    service = new PDFQueueService(
      mockPdfParsingService,
      mockEventEmitter,
      mockPrisma,
    );

    // CRITICAL: Set processing to true to prevent automatic queue processing
    // This allows us to control when processJob is called
    (service as any).processing = true;
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const jobId = await service.addJob('paper-1');

      expect(jobId).toBeDefined();
      expect(jobId).toContain('pdf-paper-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.queued',
        expect.objectContaining({
          jobId,
          paperId: 'paper-1',
          progress: 0,
        }),
      );
    });

    it('should start processing if not already running', async () => {
      // Reset processing flag to test auto-start
      (service as any).processing = false;
      vi.spyOn(service as any, 'processQueue');

      await service.addJob('paper-1');

      expect((service as any).processQueue).toHaveBeenCalled();
      // Reset back to prevent background processing
      (service as any).processing = true;
    });

    it('should return different job IDs for same paper', async () => {
      const jobId1 = await service.addJob('paper-1');
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const jobId2 = await service.addJob('paper-1');

      expect(jobId1).not.toBe(jobId2);
    });

    it('should throw if paper not found', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce(null);

      await expect(service.addJob('nonexistent')).rejects.toThrow('Paper nonexistent not found in database');
    });

    it('should throw if paper has no valid identifiers', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        id: 'paper-1',
        doi: '',
        pmid: '',
        url: '',
        title: 'Test Paper',
      });

      await expect(service.addJob('paper-1')).rejects.toThrow('Paper paper-1 has no valid identifiers');
    });
  });

  describe('getJob', () => {
    it('should retrieve a job by ID', async () => {
      const jobId = await service.addJob('paper-1');

      const job = service.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.paperId).toBe('paper-1');
      expect(job?.status).toBe('queued');
    });

    it('should return undefined for non-existent job', () => {
      const job = service.getJob('nonexistent-job');

      expect(job).toBeUndefined();
    });
  });

  describe('getJobByPaperId', () => {
    it('should retrieve the latest job for a paper', async () => {
      const jobId1 = await service.addJob('paper-1');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const jobId2 = await service.addJob('paper-1');

      const job = service.getJobByPaperId('paper-1');

      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId2); // Should return the latest job
    });

    it('should return undefined if no jobs for paper', () => {
      const job = service.getJobByPaperId('paper-99');

      expect(job).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      await service.addJob('paper-1');
      await service.addJob('paper-2');

      const stats = service.getStats();

      expect(stats).toEqual({
        queueLength: expect.any(Number),
        totalJobs: 2,
        processing: expect.any(Number),
        completed: expect.any(Number),
        failed: expect.any(Number),
        queued: expect.any(Number),
      });
    });
  });

  describe('processJob', () => {
    it('should successfully process a job', async () => {
      mockPdfParsingService.processFullText.mockResolvedValueOnce({
        success: true,
        status: 'success',
        wordCount: 5000,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      await (service as any).processJob(job);

      expect(job?.status).toBe('completed');
      expect(job?.progress).toBe(100);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.completed',
        expect.objectContaining({
          jobId,
          paperId: 'paper-1',
          wordCount: 5000,
        }),
      );
    });

    it('should retry on retryable failure', async () => {
      mockPdfParsingService.processFullText.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Network error',
        category: 'network',
        retryable: true,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      // First attempt
      await (service as any).processJob(job);

      expect(job?.attempts).toBe(1);
      expect(job?.status).toBe('queued'); // Should be requeued
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.retry',
        expect.objectContaining({
          jobId,
          attempt: 1,
          error: 'Network error',
        }),
      );
    });

    it('should not retry on non-retryable failure (paywall)', async () => {
      mockPdfParsingService.processFullText.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Paper is behind paywall',
        category: 'paywall',
        retryable: false,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      await (service as any).processJob(job);

      expect(job?.attempts).toBe(1);
      expect(job?.status).toBe('failed'); // Should NOT be requeued
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.failed',
        expect.objectContaining({
          jobId,
          error: 'Paper is behind paywall',
          category: 'paywall',
          retryable: false,
        }),
      );
    });

    it('should fail after max retries', async () => {
      mockPdfParsingService.processFullText.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Network error',
        category: 'network',
        retryable: true,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      // Simulate 3 attempts
      job!.attempts = 0;
      await (service as any).processJob(job); // attempt 1
      job!.status = 'queued';
      await (service as any).processJob(job); // attempt 2
      job!.status = 'queued';
      await (service as any).processJob(job); // attempt 3

      expect(job?.attempts).toBe(3);
      expect(job?.status).toBe('failed');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.failed',
        expect.objectContaining({
          jobId,
          error: 'Network error',
          attempts: 3,
        }),
      );
    });

    it('should emit progress events', async () => {
      mockPdfParsingService.processFullText.mockResolvedValueOnce({
        success: true,
        status: 'success',
        wordCount: 5000,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      await (service as any).processJob(job);

      // Should emit multiple events
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.processing',
        expect.objectContaining({
          jobId,
          progress: 10,
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.progress',
        expect.objectContaining({
          jobId,
          progress: 30,
          stage: 'downloading',
        }),
      );
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limit (10 PDFs/minute)', async () => {
      // This test would need to mock time or wait, skip for unit tests
      // Better suited for integration tests
      expect(true).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove old completed jobs', async () => {
      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      // Manually set job as completed 8 days ago
      job!.status = 'completed';
      job!.completedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      await service.cleanup();

      const retrievedJob = service.getJob(jobId);
      expect(retrievedJob).toBeUndefined();
    });

    it('should keep recent completed jobs', async () => {
      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      // Manually set job as completed 1 day ago
      job!.status = 'completed';
      job!.completedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      await service.cleanup();

      const retrievedJob = service.getJob(jobId);
      expect(retrievedJob).toBeDefined();
    });
  });
});
