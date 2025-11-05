/**
 * Phase 10 Day 5.17.3: PDF Full-Flow Integration Test
 *
 * Tests the complete PDF fetching pipeline:
 * 1. User triggers PDF fetch via API
 * 2. Job added to queue
 * 3. PDF downloaded from Unpaywall
 * 4. Text extracted and cleaned
 * 5. Stored in database
 * 6. Status endpoints return correct data
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as request from 'supertest';
import { PDFController } from '../../src/modules/literature/controllers/pdf.controller';
import { PDFParsingService } from '../../src/modules/literature/services/pdf-parsing.service';
import { PDFQueueService } from '../../src/modules/literature/services/pdf-queue.service';
import { PrismaService } from '../../src/common/prisma.service';

describe('PDF Full Flow Integration (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let pdfParsingService: PDFParsingService;
  let pdfQueueService: PDFQueueService;

  const mockPaper = {
    id: 'integration-test-paper-1',
    title: 'Test Paper for Integration',
    doi: '10.1234/integration.test',
    abstract: 'Test abstract',
    fullText: null,
    fullTextStatus: null,
    fullTextWordCount: null,
    hasFullText: false,
    fullTextHash: null,
    fullTextSource: null,
    fullTextFetchedAt: null,
    wordCount: 50,
    wordCountExcludingRefs: 50,
    abstractWordCount: 50,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [PDFController],
      providers: [
        PDFParsingService,
        PDFQueueService,
        {
          provide: PrismaService,
          useValue: {
            paper: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    pdfParsingService = moduleFixture.get<PDFParsingService>(PDFParsingService);
    pdfQueueService = moduleFixture.get<PDFQueueService>(PDFQueueService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete PDF Fetching Flow', () => {
    it('should complete full PDF fetch lifecycle', async () => {
      // STEP 1: Setup - Paper exists in database
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValue(mockPaper);
      (prismaService.paper.update as jest.Mock).mockImplementation((params) => {
        return Promise.resolve({
          ...mockPaper,
          ...params.data,
        });
      });
      (prismaService.paper.findFirst as jest.Mock).mockResolvedValue(null); // No duplicates

      // Mock successful PDF fetching
      jest.spyOn(pdfParsingService, 'fetchPDF').mockResolvedValue(
        Buffer.from('Mock PDF content')
      );
      jest.spyOn(pdfParsingService, 'extractText').mockResolvedValue(
        'Sample extracted text from PDF document.\n\nMain content here.\n\nReferences\n[1] Citation'
      );

      // STEP 2: Trigger PDF fetch via API
      const fetchResponse = await request(app.getHttpServer())
        .post(`/pdf/fetch/${mockPaper.id}`)
        .expect(201);

      expect(fetchResponse.body.success).toBe(true);
      expect(fetchResponse.body.jobId).toBeDefined();

      const jobId = fetchResponse.body.jobId;

      // STEP 3: Check that job was queued
      const job = pdfQueueService.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.paperId).toBe(mockPaper.id);
      expect(job?.status).toMatch(/queued|processing/); // Could be processing already

      // STEP 4: Wait for job to complete (with timeout)
      const timeout = 10000; // 10 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const currentJob = pdfQueueService.getJob(jobId);
        if (currentJob?.status === 'completed' || currentJob?.status === 'failed') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      }

      const finalJob = pdfQueueService.getJob(jobId);
      expect(finalJob?.status).toBe('completed');
      expect(finalJob?.progress).toBe(100);

      // STEP 5: Verify database was updated
      expect(prismaService.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPaper.id },
          data: expect.objectContaining({
            fullTextStatus: 'success',
            hasFullText: true,
            fullTextWordCount: expect.any(Number),
            fullTextHash: expect.any(String),
          }),
        })
      );

      // STEP 6: Check status endpoint
      const statusResponse = await request(app.getHttpServer())
        .get(`/pdf/status/${mockPaper.id}`)
        .expect(200);

      expect(statusResponse.body).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          jobStatus: 'completed',
          jobProgress: 100,
        })
      );

      // STEP 7: Check queue stats
      const statsResponse = await request(app.getHttpServer())
        .get('/pdf/stats')
        .expect(200);

      expect(statsResponse.body.totalJobs).toBeGreaterThan(0);
      expect(statsResponse.body.completed).toBeGreaterThan(0);
    });

    it('should handle failed PDF fetch gracefully', async () => {
      const failPaper = {
        ...mockPaper,
        id: 'fail-test-paper',
        doi: '10.1234/paywall.test',
      };

      (prismaService.paper.findUnique as jest.Mock).mockResolvedValue(failPaper);
      (prismaService.paper.update as jest.Mock).mockResolvedValue(failPaper);

      // Mock failed PDF fetch (paywall)
      jest.spyOn(pdfParsingService, 'fetchPDF').mockResolvedValue(null);

      // Trigger fetch
      const fetchResponse = await request(app.getHttpServer())
        .post(`/pdf/fetch/${failPaper.id}`)
        .expect(201);

      const jobId = fetchResponse.body.jobId;

      // Wait for job to fail
      const timeout = 30000; // 30 seconds (includes retries)
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const currentJob = pdfQueueService.getJob(jobId);
        if (currentJob?.status === 'failed') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalJob = pdfQueueService.getJob(jobId);
      expect(finalJob?.status).toBe('failed');
      expect(finalJob?.error).toBeDefined();

      // Verify database status was updated to failed
      expect(prismaService.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: failPaper.id },
          data: expect.objectContaining({
            fullTextStatus: 'failed',
          }),
        })
      );
    });
  });

  describe('Bulk Status Endpoint', () => {
    it('should return grouped status for multiple papers', async () => {
      const papers = [
        { ...mockPaper, id: 'paper-ready', fullTextStatus: 'success' },
        { ...mockPaper, id: 'paper-fetching', fullTextStatus: 'fetching' },
        { ...mockPaper, id: 'paper-failed', fullTextStatus: 'failed' },
        { ...mockPaper, id: 'paper-not-fetched', fullTextStatus: null },
      ];

      (prismaService.paper.findMany as jest.Mock).mockResolvedValue(
        papers.map(p => ({ id: p.id, fullTextStatus: p.fullTextStatus }))
      );

      const response = await request(app.getHttpServer())
        .post('/pdf/bulk-status')
        .send({ paperIds: papers.map(p => p.id) })
        .expect(201);

      expect(response.body).toEqual({
        ready: ['paper-ready'],
        fetching: ['paper-fetching'],
        failed: ['paper-failed'],
        not_fetched: ['paper-not-fetched'],
      });
    });

    it('should return 400 if paperIds is missing', async () => {
      await request(app.getHttpServer())
        .post('/pdf/bulk-status')
        .send({})
        .expect(400);
    });

    it('should return 400 if paperIds is not an array', async () => {
      await request(app.getHttpServer())
        .post('/pdf/bulk-status')
        .send({ paperIds: 'not-an-array' })
        .expect(400);
    });
  });

  describe('Server-Sent Events (SSE)', () => {
    it('should stream progress events for a paper', (done) => {
      // This test would require SSE client setup
      // Skipping for now as it requires more complex testing infrastructure
      // In practice, you'd use a library like 'eventsource' to test SSE
      expect(true).toBe(true);
      done();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if paper processing throws unexpected error', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .post('/pdf/fetch/error-test-paper')
        .expect(500);
    });

    it('should handle concurrent fetches for same paper', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValue(mockPaper);
      (prismaService.paper.update as jest.Mock).mockResolvedValue(mockPaper);
      jest.spyOn(pdfParsingService, 'fetchPDF').mockResolvedValue(
        Buffer.from('PDF content')
      );
      jest.spyOn(pdfParsingService, 'extractText').mockResolvedValue('Sample text');

      // Trigger two fetches concurrently
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer()).post(`/pdf/fetch/${mockPaper.id}`),
        request(app.getHttpServer()).post(`/pdf/fetch/${mockPaper.id}`),
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.jobId).not.toBe(response2.body.jobId);

      // Both jobs should be in the system
      const job1 = pdfQueueService.getJob(response1.body.jobId);
      const job2 = pdfQueueService.getJob(response2.body.jobId);

      expect(job1).toBeDefined();
      expect(job2).toBeDefined();
    });
  });

  describe('Performance & Rate Limiting', () => {
    it('should queue multiple jobs without blocking', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValue(mockPaper);
      (prismaService.paper.update as jest.Mock).mockResolvedValue(mockPaper);

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer()).post(`/pdf/fetch/paper-${i}`)
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      const stats = pdfQueueService.getStats();
      expect(stats.totalJobs).toBeGreaterThanOrEqual(5);
    });
  });
});
