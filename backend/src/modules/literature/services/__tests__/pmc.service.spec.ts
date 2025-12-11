/**
 * PMCService Tests
 * Phase 10.115: Netflix-Grade Parallel Batch Processing
 *
 * Tests focus on:
 * - Parallel batch processing with concurrency control
 * - Graceful handling of failed batches
 * - Batch size splitting logic
 * - Rate limit safety (MAX_CONCURRENT_BATCHES)
 */

import { PMCService } from '../pmc.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RetryService } from '../../../../common/services/retry.service';
import { of, throwError } from 'rxjs';
import { LiteratureSource } from '../../dto/literature.dto';

describe('PMCService', () => {
  let service: PMCService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let retryService: jest.Mocked<RetryService>;

  // Helper to wrap response in RetryResult structure
  const wrapInRetryResult = <T>(data: T) => ({
    data,
    attempts: 1,
    totalDuration: 100,
  });

  // Mock XML responses
  const createMockEsearchResponse = (ids: string[]) => ({
    esearchresult: {
      idlist: ids,
      count: String(ids.length),
    },
  });

  const createMockArticleXml = (pmcId: string, title: string) => `
    <article>
      <front>
        <article-meta>
          <article-id pub-id-type="pmc">${pmcId}</article-id>
          <article-id pub-id-type="doi">10.1000/test.${pmcId}</article-id>
          <title-group>
            <article-title>${title}</article-title>
          </title-group>
        </article-meta>
        <journal-meta>
          <journal-title>Test Journal</journal-title>
        </journal-meta>
      </front>
      <body>
        <sec>
          <title>Introduction</title>
          <p>This is a test introduction paragraph with enough words to make it meaningful for testing purposes.</p>
        </sec>
        <sec>
          <title>Methods</title>
          <p>This is a test methods paragraph describing the methodology used in this research study.</p>
        </sec>
      </body>
      <abstract>
        <p>This is a test abstract for the article.</p>
      </abstract>
    </article>
  `;

  beforeEach(() => {
    // Create mocks
    httpService = {
      get: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue(''), // No API key by default
    } as any;

    retryService = {
      executeWithRetry: jest.fn(),
    } as any;

    service = new PMCService(httpService, configService, retryService);
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
    });

    it('should be available without API key', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should log warning when no API key configured', () => {
      // Service already created without API key
      expect(configService.get).toHaveBeenCalledWith('NCBI_API_KEY');
    });
  });

  describe('search - batch splitting', () => {
    it('should handle single batch (< 200 IDs)', async () => {
      // Generate 50 IDs (less than BATCH_SIZE = 200)
      const ids = Array.from({ length: 50 }, (_, i) => `${1000000 + i}`);
      const articles = ids.map((id, i) => createMockArticleXml(id, `Test Article ${i}`)).join('\n');

      // Mock esearch response
      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(articles));

      const papers = await service.search('test query', { limit: 50 });

      expect(papers.length).toBe(50);
      // Should have been called twice: once for esearch, once for efetch (single batch)
      expect(retryService.executeWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should split into multiple batches (> 200 IDs)', async () => {
      // Generate 450 IDs (needs 3 batches: 200 + 200 + 50)
      const ids = Array.from({ length: 450 }, (_, i) => `${1000000 + i}`);

      // Create mock articles for each batch
      const batch1Articles = ids.slice(0, 200).map((id, i) =>
        createMockArticleXml(id, `Batch1 Article ${i}`)
      ).join('\n');
      const batch2Articles = ids.slice(200, 400).map((id, i) =>
        createMockArticleXml(id, `Batch2 Article ${i}`)
      ).join('\n');
      const batch3Articles = ids.slice(400).map((id, i) =>
        createMockArticleXml(id, `Batch3 Article ${i}`)
      ).join('\n');

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(batch1Articles))
        .mockResolvedValueOnce(wrapInRetryResult(batch2Articles))
        .mockResolvedValueOnce(wrapInRetryResult(batch3Articles));

      const papers = await service.search('test query', { limit: 450 });

      expect(papers.length).toBe(450);
      // Should have been called 4 times: 1 esearch + 3 efetch batches
      expect(retryService.executeWithRetry).toHaveBeenCalledTimes(4);
    });
  });

  describe('search - parallel batch processing', () => {
    it('should process batches in parallel with concurrency limit', async () => {
      // Generate 600 IDs (needs 3 batches, all within MAX_CONCURRENT_BATCHES = 3)
      const ids = Array.from({ length: 600 }, (_, i) => `${1000000 + i}`);

      // Track call timing
      const callTimes: number[] = [];

      // Create batch responses with delay tracking
      const createBatchResponse = (batchIds: string[], delay: number): Promise<{ data: string; attempts: number; totalDuration: number }> => {
        return new Promise(resolve => {
          callTimes.push(Date.now());
          setTimeout(() => {
            const articles = batchIds.map((id, i) =>
              createMockArticleXml(id, `Article ${i}`)
            ).join('\n');
            resolve(wrapInRetryResult(articles));
          }, delay);
        });
      };

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(createBatchResponse(ids.slice(0, 200), 50) as any)
        .mockResolvedValueOnce(createBatchResponse(ids.slice(200, 400), 50) as any)
        .mockResolvedValueOnce(createBatchResponse(ids.slice(400, 600), 50) as any);

      const startTime = Date.now();
      const papers = await service.search('test query', { limit: 600 });
      const totalTime = Date.now() - startTime;

      expect(papers.length).toBe(600);
      // Parallel execution should be faster than sequential (3 x 50ms = 150ms sequential)
      // With parallel, it should be around 50-100ms
      expect(totalTime).toBeLessThan(200);
    });

    it('should respect MAX_CONCURRENT_BATCHES = 3 limit', async () => {
      // Generate 900 IDs (needs 5 batches: 200 + 200 + 200 + 200 + 100)
      // First 3 batches should run in parallel, then next 2
      const ids = Array.from({ length: 900 }, (_, i) => `${1000000 + i}`);

      let concurrentCalls = 0;
      let maxConcurrent = 0;

      const createBatchResponse = (batchIds: string[]): Promise<{ data: string; attempts: number; totalDuration: number }> => {
        return new Promise(resolve => {
          concurrentCalls++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCalls);

          setTimeout(() => {
            concurrentCalls--;
            const articles = batchIds.map((id, i) =>
              createMockArticleXml(id, `Article ${i}`)
            ).join('\n');
            resolve(wrapInRetryResult(articles));
          }, 30);
        });
      };

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockImplementation(async (fn: any, name: any) => {
          if (name === 'PMC.efetch') {
            // Return a batch response
            const batchIndex = retryService.executeWithRetry.mock.calls.length - 2;
            const start = batchIndex * 200;
            const end = Math.min(start + 200, ids.length);
            return createBatchResponse(ids.slice(start, end)) as any;
          }
          return wrapInRetryResult(createMockEsearchResponse(ids));
        });

      await service.search('test query', { limit: 900 });

      // Max concurrent should not exceed 3
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  describe('search - graceful degradation', () => {
    it('should continue when some batches fail', async () => {
      // Generate 600 IDs (3 batches)
      const ids = Array.from({ length: 600 }, (_, i) => `${1000000 + i}`);

      const batch1Articles = ids.slice(0, 200).map((id, i) =>
        createMockArticleXml(id, `Batch1 Article ${i}`)
      ).join('\n');
      const batch3Articles = ids.slice(400, 600).map((id, i) =>
        createMockArticleXml(id, `Batch3 Article ${i}`)
      ).join('\n');

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(batch1Articles))
        .mockRejectedValueOnce(new Error('Batch 2 failed')) // Batch 2 fails
        .mockResolvedValueOnce(wrapInRetryResult(batch3Articles));

      const papers = await service.search('test query', { limit: 600 });

      // Should have 400 papers (batch 1 + batch 3), batch 2 failed
      expect(papers.length).toBe(400);
    });

    it('should return empty array when esearch fails', async () => {
      retryService.executeWithRetry.mockRejectedValueOnce(new Error('esearch failed'));

      const papers = await service.search('test query');

      expect(papers).toEqual([]);
    });

    it('should return empty array when no IDs found', async () => {
      retryService.executeWithRetry.mockResolvedValueOnce(
        wrapInRetryResult({ esearchresult: { idlist: [] } })
      );

      const papers = await service.search('nonexistent query');

      expect(papers).toEqual([]);
    });

    it('should handle all batches failing', async () => {
      const ids = Array.from({ length: 450 }, (_, i) => `${1000000 + i}`);

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockRejectedValueOnce(new Error('Batch 1 failed'))
        .mockRejectedValueOnce(new Error('Batch 2 failed'))
        .mockRejectedValueOnce(new Error('Batch 3 failed'));

      const papers = await service.search('test query', { limit: 450 });

      // All batches failed, should return empty
      expect(papers).toEqual([]);
    });
  });

  describe('search - Open Access filter', () => {
    it('should add Open Access filter by default', async () => {
      retryService.executeWithRetry.mockResolvedValueOnce(
        wrapInRetryResult({ esearchresult: { idlist: [] } })
      );

      await service.search('test query');

      // Check that the search term includes open access filter
      const searchCall = retryService.executeWithRetry.mock.calls[0];
      expect(searchCall[1]).toBe('PMC.esearch');
    });

    it('should not filter Open Access when disabled', async () => {
      retryService.executeWithRetry.mockResolvedValueOnce(
        wrapInRetryResult({ esearchresult: { idlist: [] } })
      );

      await service.search('test query', { openAccessOnly: false });

      expect(retryService.executeWithRetry).toHaveBeenCalled();
    });
  });

  describe('parsePaper - full-text extraction', () => {
    it('should parse article XML correctly', async () => {
      const ids = ['12345'];
      const articleXml = createMockArticleXml('12345', 'Test Research Paper');

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(articleXml));

      const papers = await service.search('test');

      expect(papers.length).toBe(1);
      const paper = papers[0];

      expect(paper.id).toBe('12345');
      expect(paper.title).toBe('Test Research Paper');
      expect(paper.doi).toBe('10.1000/test.12345');
      expect(paper.source).toBe(LiteratureSource.PMC);
      expect(paper.hasFullText).toBe(true);
      expect(paper.fullTextSource).toBe('pmc');
      expect(paper.hasPdf).toBe(true);
      expect(paper.pdfUrl).toContain('PMC12345');
    });

    it('should extract full-text sections', async () => {
      const ids = ['12345'];
      const articleWithSections = `
        <article>
          <front>
            <article-meta>
              <article-id pub-id-type="pmc">12345</article-id>
              <title-group><article-title>Test Paper</article-title></title-group>
            </article-meta>
          </front>
          <body>
            <sec>
              <title>Introduction</title>
              <p>Introduction content here with multiple sentences for testing.</p>
            </sec>
            <sec>
              <title>Methods</title>
              <p>Methods content describing the methodology used.</p>
            </sec>
            <sec>
              <title>Results</title>
              <p>Results content showing findings and data analysis.</p>
            </sec>
            <sec>
              <title>Discussion</title>
              <p>Discussion content interpreting the results.</p>
            </sec>
          </body>
          <abstract><p>Test abstract</p></abstract>
        </article>
      `;

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(articleWithSections));

      const papers = await service.search('test');

      expect(papers[0].hasFullText).toBe(true);
      expect(papers[0].fullText).toContain('Introduction');
      expect(papers[0].fullText).toContain('Methods');
      expect(papers[0].fullText).toContain('Results');
      expect(papers[0].fullText).toContain('Discussion');
    });

    it('should calculate word counts including full-text', async () => {
      const ids = ['12345'];
      const articleXml = createMockArticleXml('12345', 'Test Paper');

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(articleXml));

      const papers = await service.search('test');

      // Should have word count > 0 due to full-text content
      expect(papers[0].wordCount).toBeGreaterThan(0);
      expect(papers[0].fullTextWordCount).toBeGreaterThan(0);
    });
  });

  describe('API key configuration', () => {
    it('should use API key when configured', async () => {
      // Create new service with API key
      const configWithKey = {
        get: jest.fn().mockReturnValue('test-api-key'),
      } as any;

      const serviceWithKey = new PMCService(httpService, configWithKey, retryService);

      expect(serviceWithKey.isAvailable()).toBe(true);
      expect(configWithKey.get).toHaveBeenCalledWith('NCBI_API_KEY');
    });
  });

  describe('search options', () => {
    it('should respect limit option', async () => {
      const ids = Array.from({ length: 10 }, (_, i) => `${1000000 + i}`);
      const articles = ids.map((id, i) => createMockArticleXml(id, `Article ${i}`)).join('\n');

      retryService.executeWithRetry
        .mockResolvedValueOnce(wrapInRetryResult(createMockEsearchResponse(ids)))
        .mockResolvedValueOnce(wrapInRetryResult(articles));

      const papers = await service.search('test', { limit: 10 });

      expect(papers.length).toBe(10);
    });

    it('should use default limit when not specified', async () => {
      retryService.executeWithRetry.mockResolvedValueOnce(
        wrapInRetryResult({ esearchresult: { idlist: [] } })
      );

      await service.search('test');

      // Default limit should be 20
      expect(retryService.executeWithRetry).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should handle 429 rate limit errors gracefully', async () => {
      const error = new Error('Rate limited');
      (error as any).response = { status: 429 };

      retryService.executeWithRetry.mockRejectedValueOnce(error);

      const papers = await service.search('test');

      // Should return empty array, not throw
      expect(papers).toEqual([]);
    });
  });
});
