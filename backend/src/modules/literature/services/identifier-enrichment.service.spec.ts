/**
 * Identifier Enrichment Service Tests
 * Phase 10.94 Day 1-2: TDD approach - write tests FIRST
 *
 * Test Coverage Target: 85%+
 * Pattern: Phase 10.93 testing standards
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { IdentifierEnrichmentService } from './identifier-enrichment.service';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import {
  ExternalIds,
  NCBIElinkResponse,
  PubMedEsearchResponse,
  CrossRefResponse,
  SemanticScholarSearchResponse,
} from '../types/identifier-enrichment.types';

describe('IdentifierEnrichmentService', () => {
  let service: IdentifierEnrichmentService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        NCBI_API_KEY: 'test-ncbi-key',
        NCBI_EMAIL: 'test@example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentifierEnrichmentService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IdentifierEnrichmentService>(IdentifierEnrichmentService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.enrichWithPMCId).toBeDefined();
      expect(service.enrichWithPMID).toBeDefined();
      expect(service.enrichWithDOI).toBeDefined();
      expect(service.enrichFromSemanticScholar).toBeDefined();
      expect(service.enrichPaper).toBeDefined();
    });
  });

  describe('enrichWithPMCId - PMID to PMC ID conversion', () => {
    const testPMID = '12345678';
    const testPMCId = 'PMC9876543';

    it('should successfully convert PMID to PMC ID', async () => {
      // Mock NCBI elink API response
      const mockResponse: NCBIElinkResponse = {
        linksets: [
          {
            ids: [testPMID],
            linksetdbs: [
              {
                dbto: 'pmc',
                linkname: 'pubmed_pmc',
                links: [testPMCId.replace('PMC', '')], // NCBI returns without PMC prefix
              },
            ],
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMCId(testPMID, abortController.signal);

      expect(result).toBe(testPMCId);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('eutils.ncbi.nlm.nih.gov'),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should return null when PMID has no PMC ID', async () => {
      const mockResponse: NCBIElinkResponse = {
        linksets: [
          {
            ids: [testPMID],
            linksetdbs: [], // No PMC link
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMCId(testPMID, abortController.signal);

      expect(result).toBeNull();
    });

    it('should handle NCBI API errors gracefully', async () => {
      const axiosError = new Error('Rate limit exceeded');
      (axiosError as AxiosError).response = {
        status: 429,
        data: { error: 'Rate limit exceeded' },
      } as any;
      (axiosError as AxiosError).isAxiosError = true;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      const abortController = new AbortController();
      const result = await service.enrichWithPMCId(testPMID, abortController.signal);

      expect(result).toBeNull();
    });

    it('should respect AbortSignal cancellation', async () => {
      const abortController = new AbortController();
      abortController.abort(); // Abort before call

      const result = await service.enrichWithPMCId(testPMID, abortController.signal);

      expect(result).toBeNull();
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should add PMC prefix if missing from NCBI response', async () => {
      const mockResponse: NCBIElinkResponse = {
        linksets: [
          {
            linksetdbs: [
              {
                dbto: 'pmc',
                links: ['9876543'], // No PMC prefix
              },
            ],
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMCId(testPMID, abortController.signal);

      expect(result).toBe('PMC9876543');
    });
  });

  describe('enrichWithPMID - DOI to PMID conversion', () => {
    const testDOI = '10.1234/example';
    const testPMID = '12345678';

    it('should successfully convert DOI to PMID', async () => {
      const mockResponse: PubMedEsearchResponse = {
        esearchresult: {
          count: '1',
          retmax: '1',
          retstart: '0',
          idlist: [testPMID],
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMID(testDOI, abortController.signal);

      expect(result).toBe(testPMID);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('esearch.fcgi'),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should return null when DOI not found in PubMed', async () => {
      const mockResponse: PubMedEsearchResponse = {
        esearchresult: {
          count: '0',
          idlist: [],
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMID(testDOI, abortController.signal);

      expect(result).toBeNull();
    });

    it('should handle malformed DOI gracefully', async () => {
      const invalidDOI = 'not-a-doi';

      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Invalid DOI format'))
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMID(invalidDOI, abortController.signal);

      expect(result).toBeNull();
    });

    it('should respect AbortSignal during API call', async () => {
      const abortController = new AbortController();

      // Simulate API call that gets aborted mid-request
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          name: 'AbortError',
          message: 'Request aborted',
        }))
      );

      abortController.abort();
      const result = await service.enrichWithPMID(testDOI, abortController.signal);

      expect(result).toBeNull();
    });
  });

  describe('enrichWithDOI - Title to DOI conversion', () => {
    const testTitle = 'Machine Learning in Healthcare: A Systematic Review';
    const testAuthors = ['Smith, John', 'Doe, Jane'];
    const testDOI = '10.1234/example';

    it('should successfully find DOI using title and authors', async () => {
      const mockResponse: CrossRefResponse = {
        status: 'ok',
        'message-type': 'work-list',
        message: {
          items: [
            {
              DOI: testDOI,
              title: [testTitle],
              author: [
                { given: 'John', family: 'Smith' },
                { given: 'Jane', family: 'Doe' },
              ],
              score: 95.5,
            },
          ],
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithDOI(
        testTitle,
        testAuthors,
        abortController.signal
      );

      expect(result).toBe(testDOI);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('api.crossref.org'),
        expect.any(Object)
      );
    });

    it('should work with title only (no authors)', async () => {
      const mockResponse: CrossRefResponse = {
        status: 'ok',
        message: {
          items: [
            {
              DOI: testDOI,
              title: [testTitle],
              score: 90.0,
            },
          ],
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithDOI(
        testTitle,
        undefined,
        abortController.signal
      );

      expect(result).toBe(testDOI);
    });

    it('should return null when no matches found', async () => {
      const mockResponse: CrossRefResponse = {
        status: 'ok',
        message: {
          items: [],
          'total-results': 0,
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithDOI(
        testTitle,
        testAuthors,
        abortController.signal
      );

      expect(result).toBeNull();
    });

    it('should filter out low-confidence matches (score < 80)', async () => {
      const mockResponse: CrossRefResponse = {
        status: 'ok',
        message: {
          items: [
            {
              DOI: '10.1111/wrong',
              title: ['Different Paper'],
              score: 45.0, // Low score
            },
          ],
        },
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithDOI(
        testTitle,
        testAuthors,
        abortController.signal
      );

      expect(result).toBeNull();
    });

    it('should handle CrossRef rate limiting', async () => {
      const axiosError = new Error('Rate limit exceeded');
      (axiosError as AxiosError).response = {
        status: 429,
        headers: {
          'retry-after': '60',
        },
      } as any;
      (axiosError as AxiosError).isAxiosError = true;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      const abortController = new AbortController();
      const result = await service.enrichWithDOI(
        testTitle,
        testAuthors,
        abortController.signal
      );

      expect(result).toBeNull();
    });
  });

  describe('enrichFromSemanticScholar - Comprehensive ID enrichment', () => {
    const testTitle = 'Deep Learning for Medical Image Analysis';

    it('should extract all external IDs from Semantic Scholar', async () => {
      const mockResponse: SemanticScholarSearchResponse = {
        total: 1,
        offset: 0,
        data: [
          {
            paperId: 'abc123',
            title: testTitle,
            externalIds: {
              DOI: '10.1234/example',
              PubMed: '12345678',
              PubMedCentral: '9876543',
              ArXiv: '2301.12345',
            },
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichFromSemanticScholar(
        testTitle,
        abortController.signal
      );

      expect(result.doi).toBe('10.1234/example');
      expect(result.pmid).toBe('12345678');
      expect(result.pmcId).toBe('PMC9876543'); // Should add PMC prefix
      expect(result.arXivId).toBe('2301.12345');
    });

    it('should handle partial external IDs', async () => {
      const mockResponse: SemanticScholarSearchResponse = {
        total: 1,
        data: [
          {
            paperId: 'abc123',
            externalIds: {
              DOI: '10.1234/example',
              // Only DOI available, others null
              PubMed: null,
              PubMedCentral: null,
              ArXiv: null,
            },
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichFromSemanticScholar(
        testTitle,
        abortController.signal
      );

      expect(result.doi).toBe('10.1234/example');
      expect(result.pmid).toBeNull();
      expect(result.pmcId).toBeNull();
      expect(result.arXivId).toBeNull();
    });

    it('should return empty IDs when paper not found', async () => {
      const mockResponse: SemanticScholarSearchResponse = {
        total: 0,
        data: [],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichFromSemanticScholar(
        testTitle,
        abortController.signal
      );

      expect(result.doi).toBeNull();
      expect(result.pmid).toBeNull();
      expect(result.pmcId).toBeNull();
      expect(result.arXivId).toBeNull();
    });

    it('should handle Semantic Scholar API errors', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API unavailable'))
      );

      const abortController = new AbortController();
      const result = await service.enrichFromSemanticScholar(
        testTitle,
        abortController.signal
      );

      expect(result).toEqual({
        doi: null,
        pmid: null,
        pmcId: null,
        arXivId: null,
        semanticScholarId: null,
      });
    });
  });

  describe('enrichPaper - Main orchestrator method', () => {
    const createTestPaper = (overrides?: Partial<Paper>): Paper => ({
      id: 'test-paper-1',
      title: 'Test Paper Title',
      authors: ['John Smith', 'Jane Doe'],
      year: 2023,
      abstract: 'This is a test abstract',
      source: LiteratureSource.PUBMED,
      doi: '10.1234/example',
      pmid: '12345678',
      ...overrides,
    });

    it('should enrich paper with PMID by finding PMC ID', async () => {
      const paper = createTestPaper({
        pmid: '12345678',
        pmcId: undefined, // Missing PMC ID
      });

      // Mock PMID → PMC ID lookup
      const mockNcbiResponse: NCBIElinkResponse = {
        linksets: [
          {
            linksetdbs: [
              {
                dbto: 'pmc',
                links: ['9876543'],
              },
            ],
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockNcbiResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      expect(result.enrichedIds.pmcId).toBe('PMC9876543');
      expect(result.newIdsFound).toContain('pmcId');
      expect(result.success).toBe(true);
    });

    it('should enrich paper with only DOI by finding PMID and PMC', async () => {
      const paper = createTestPaper({
        doi: '10.1234/example',
        pmid: undefined,
        pmcId: undefined,
      });

      // Mock DOI → PMID lookup
      const mockPubMedResponse: PubMedEsearchResponse = {
        esearchresult: {
          idlist: ['12345678'],
        },
      };

      // Mock PMID → PMC lookup
      const mockNcbiResponse: NCBIElinkResponse = {
        linksets: [
          {
            linksetdbs: [
              {
                dbto: 'pmc',
                links: ['9876543'],
              },
            ],
          },
        ],
      };

      mockHttpService.get
        .mockReturnValueOnce(
          of({
            data: mockPubMedResponse,
            status: 200,
          } as AxiosResponse)
        )
        .mockReturnValueOnce(
          of({
            data: mockNcbiResponse,
            status: 200,
          } as AxiosResponse)
        );

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      expect(result.enrichedIds.pmid).toBe('12345678');
      expect(result.enrichedIds.pmcId).toBe('PMC9876543');
      expect(result.newIdsFound).toContain('pmid');
      expect(result.newIdsFound).toContain('pmcId');
      expect(result.success).toBe(true);
    });

    it('should use Semantic Scholar as fallback when other methods fail', async () => {
      const paper = createTestPaper({
        doi: undefined,
        pmid: undefined,
        pmcId: undefined,
      });

      // Mock failed CrossRef lookup
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: { status: 'ok', message: { items: [] } },
          status: 200,
        } as AxiosResponse)
      );

      // Mock successful Semantic Scholar lookup
      const mockS2Response: SemanticScholarSearchResponse = {
        total: 1,
        data: [
          {
            paperId: 'abc123',
            externalIds: {
              DOI: '10.1234/found',
              PubMed: '87654321',
            },
          },
        ],
      };

      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockS2Response,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      expect(result.enrichedIds.doi).toBe('10.1234/found');
      expect(result.enrichedIds.pmid).toBe('87654321');
      expect(result.enrichmentSource).toContain('semantic_scholar');
    });

    it('should not re-fetch identifiers that already exist', async () => {
      const paper = createTestPaper({
        doi: '10.1234/example',
        pmid: '12345678',
        pmcId: 'PMC9876543',
      });

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      // Should not make any API calls since all IDs exist
      expect(mockHttpService.get).not.toHaveBeenCalled();
      expect(result.newIdsFound).toHaveLength(0);
      expect(result.success).toBe(true);
    });

    it('should handle AbortSignal and cancel all pending requests', async () => {
      const paper = createTestPaper({
        pmid: '12345678',
      });

      const abortController = new AbortController();
      abortController.abort(); // Abort immediately

      const result = await service.enrichPaper(paper, abortController.signal);

      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should track enrichment methods and sources', async () => {
      const paper = createTestPaper({
        pmid: '12345678',
      });

      const mockResponse: NCBIElinkResponse = {
        linksets: [
          {
            linksetdbs: [{ dbto: 'pmc', links: ['9876543'] }],
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      expect(result.enrichmentSource).toBe('ncbi');
      expect(result.newIdsFound).toContain('pmcId');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeout gracefully', async () => {
      const paper: Paper = {
        id: 'test',
        title: 'Test',
        authors: [],
        source: LiteratureSource.PUBMED,
        pmid: '12345678',
      };

      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          code: 'ECONNABORTED',
          message: 'timeout of 10000ms exceeded',
        }))
      );

      const abortController = new AbortController();
      const result = await service.enrichPaper(paper, abortController.signal);

      // Service handles errors gracefully and returns partial results
      // success is still true because the enrichPaper method didn't throw
      expect(result.success).toBe(true);
      expect(result.newIdsFound).toHaveLength(0); // No new IDs found due to timeout
    });

    it('should handle malformed API responses', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: 'not json',
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const result = await service.enrichWithPMCId('12345678', abortController.signal);

      expect(result).toBeNull();
    });

    it('should handle empty/whitespace identifiers', async () => {
      const abortController = new AbortController();

      const result1 = await service.enrichWithPMCId('', abortController.signal);
      const result2 = await service.enrichWithPMID('  ', abortController.signal);
      const result3 = await service.enrichWithDOI('', undefined, abortController.signal);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should complete enrichment within reasonable time (<5s for single paper)', async () => {
      const paper: Paper = {
        id: 'test',
        title: 'Test Paper',
        authors: ['Test Author'],
        source: LiteratureSource.PUBMED,
        pmid: '12345678',
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: {
            linksets: [
              {
                linksetdbs: [{ dbto: 'pmc', links: ['9876543'] }],
              },
            ],
          },
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const startTime = Date.now();

      await service.enrichPaper(paper, abortController.signal);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should complete batch enrichment efficiently', async () => {
      const papers: Paper[] = Array.from({ length: 10 }, (_, i) => ({
        id: `paper-${i}`,
        title: `Test Paper ${i}`,
        authors: ['Author'],
        source: LiteratureSource.PUBMED,
        pmid: `${12345678 + i}`,
      }));

      mockHttpService.get.mockReturnValue(
        of({
          data: { linksets: [] },
          status: 200,
        } as AxiosResponse)
      );

      const abortController = new AbortController();
      const startTime = Date.now();

      await Promise.all(
        papers.map((paper) => service.enrichPaper(paper, abortController.signal))
      );

      const duration = Date.now() - startTime;

      // Batch of 10 papers should complete in reasonable time (<2s with mocks)
      expect(duration).toBeLessThan(2000);
    });
  });
});
