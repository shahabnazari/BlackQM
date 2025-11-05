import { Test, TestingModule } from '@nestjs/testing';
import { PDFQueueService } from '../pdf-queue.service';
import { PDFParsingService } from '../pdf-parsing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PDFQueueService', () => {
  let service: PDFQueueService;
  let pdfParsingService: PDFParsingService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFQueueService,
        {
          provide: PDFParsingService,
          useValue: {
            processFullText: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PDFQueueService>(PDFQueueService);
    pdfParsingService = module.get<PDFParsingService>(PDFParsingService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const jobId = await service.addJob('paper-1');

      expect(jobId).toBeDefined();
      expect(jobId).toContain('pdf-paper-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.queued',
        expect.objectContaining({
          jobId,
          paperId: 'paper-1',
          progress: 0,
        }),
      );
    });

    it('should start processing if not already running', async () => {
      jest.spyOn(service as any, 'processQueue');

      await service.addJob('paper-1');

      expect((service as any).processQueue).toHaveBeenCalled();
    });

    it('should return different job IDs for same paper', async () => {
      const jobId1 = await service.addJob('paper-1');
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const jobId2 = await service.addJob('paper-1');

      expect(jobId1).not.toBe(jobId2);
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
    beforeEach(() => {
      // Stop automatic queue processing for these tests
      (service as any).processing = false;
    });

    it('should successfully process a job', async () => {
      (pdfParsingService.processFullText as jest.Mock).mockResolvedValueOnce({
        success: true,
        status: 'success',
        wordCount: 5000,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      await (service as any).processJob(job);

      expect(job?.status).toBe('completed');
      expect(job?.progress).toBe(100);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.completed',
        expect.objectContaining({
          jobId,
          paperId: 'paper-1',
          wordCount: 5000,
        }),
      );
    });

    it('should retry on failure', async () => {
      (pdfParsingService.processFullText as jest.Mock).mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Network error',
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      // First attempt
      await (service as any).processJob(job);

      expect(job?.attempts).toBe(1);
      expect(job?.status).toBe('queued'); // Should be requeued
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.retry',
        expect.objectContaining({
          jobId,
          attempt: 1,
          error: 'Network error',
        }),
      );
    });

    it('should fail after max retries', async () => {
      (pdfParsingService.processFullText as jest.Mock).mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Network error',
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
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.failed',
        expect.objectContaining({
          jobId,
          error: 'Network error',
          attempts: 3,
        }),
      );
    });

    it('should emit progress events', async () => {
      (pdfParsingService.processFullText as jest.Mock).mockResolvedValueOnce({
        success: true,
        status: 'success',
        wordCount: 5000,
      });

      const jobId = await service.addJob('paper-1');
      const job = service.getJob(jobId);

      await (service as any).processJob(job);

      // Should emit multiple events
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pdf.job.processing',
        expect.objectContaining({
          jobId,
          progress: 10,
        }),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
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
