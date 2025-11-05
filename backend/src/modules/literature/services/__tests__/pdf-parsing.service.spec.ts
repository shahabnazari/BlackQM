import { Test, TestingModule } from '@nestjs/testing';
import { PDFParsingService } from '../pdf-parsing.service';
import { PrismaService } from '../../../../common/prisma.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Sample PDF text content for testing. This is a mock PDF extraction.',
    numpages: 10,
    info: { Title: 'Test PDF' },
  });
});

describe('PDFParsingService', () => {
  let service: PDFParsingService;
  let prismaService: PrismaService;

  const mockPaper = {
    id: 'test-paper-1',
    title: 'Test Paper',
    doi: '10.1234/test.123',
    abstract: 'Test abstract',
    fullText: null,
    fullTextStatus: null,
    fullTextWordCount: null,
    fullTextHash: null,
    abstractWordCount: 50,
    wordCount: 50,
    wordCountExcludingRefs: 50,
    hasFullText: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFParsingService,
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

    service = module.get<PDFParsingService>(PDFParsingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPDF', () => {
    it('should fetch PDF successfully from Unpaywall', async () => {
      const doi = '10.1234/test.123';
      const mockPdfBuffer = Buffer.from('PDF content');

      // Mock Unpaywall API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          is_oa: true,
          best_oa_location: {
            url_for_pdf: 'https://example.com/paper.pdf',
          },
        },
      });

      // Mock PDF download
      mockedAxios.get.mockResolvedValueOnce({
        data: mockPdfBuffer,
      });

      const result = await service.fetchPDF(doi);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('unpaywall.org'),
        expect.any(Object),
      );
    });

    it('should return null if paper is not open access', async () => {
      const doi = '10.1234/paywall.123';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          is_oa: false,
        },
      });

      const result = await service.fetchPDF(doi);

      expect(result).toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return null if no PDF URL is available', async () => {
      const doi = '10.1234/nopdf.123';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          is_oa: true,
          best_oa_location: null,
          oa_locations: [],
        },
      });

      const result = await service.fetchPDF(doi);

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const doi = '10.1234/error.123';

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.fetchPDF(doi);

      expect(result).toBeNull();
    });

    it('should handle 404 errors', async () => {
      const doi = '10.1234/notfound.123';

      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      });

      const result = await service.fetchPDF(doi);

      expect(result).toBeNull();
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF buffer', async () => {
      const pdfBuffer = Buffer.from('PDF content');

      const result = await service.extractText(pdfBuffer);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('Sample PDF text');
    });

    it('should return null if extraction fails', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('Extraction error'));

      const pdfBuffer = Buffer.from('Invalid PDF');

      const result = await service.extractText(pdfBuffer);

      expect(result).toBeNull();
    });
  });

  describe('cleanText', () => {
    it('should remove references section', () => {
      const rawText = `
        Main content here
        More content
        References
        [1] Citation 1
        [2] Citation 2
      `;

      const cleaned = service.cleanText(rawText);

      // Check that content before "References" is kept
      expect(cleaned).toContain('Main content');
      expect(cleaned).toContain('More content');
      // Check that references section is cut off
      const lowerCleaned = cleaned.toLowerCase();
      const hasReferences = lowerCleaned.includes('references');
      if (hasReferences) {
        // If "references" keyword exists, it should be at the very end (cutoff point)
        const refIndex = lowerCleaned.indexOf('references');
        const afterRef = cleaned.substring(refIndex);
        expect(afterRef.length).toBeLessThan(15); // Just the word "references" or very little after
      }
    });

    it('should fix hyphenation across lines', () => {
      const rawText = 'This is a hyphen-\nated word';

      const cleaned = service.cleanText(rawText);

      expect(cleaned).toContain('hyphenated');
      expect(cleaned).not.toContain('hyphen-\n');
    });

    it('should remove non-content sections in multiple languages', () => {
      const testCases = [
        { text: 'Content\nReferences\n[1] Citation', expected: 'Content' },
        { text: 'Content\nBibliography\n[1] Citation', expected: 'Content' },
        { text: 'Content\nReferências\n[1] Citação', expected: 'Content' },
        { text: 'Content\nRéférences\n[1] Citation', expected: 'Content' },
        {
          text: 'Content\nLiteraturverzeichnis\n[1] Zitat',
          expected: 'Content',
        },
      ];

      testCases.forEach(({ text, expected }) => {
        const cleaned = service.cleanText(text);
        expect(cleaned.trim()).toContain(expected);
        expect(cleaned.length).toBeLessThan(text.length);
      });
    });
  });

  describe('calculateHash', () => {
    it('should generate consistent SHA256 hash', () => {
      const text = 'Test content';

      const hash1 = service.calculateHash(text);
      const hash2 = service.calculateHash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 = 64 hex chars
    });

    it('should generate different hashes for different content', () => {
      const hash1 = service.calculateHash('Content A');
      const hash2 = service.calculateHash('Content B');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateWordCount', () => {
    it('should count words correctly', () => {
      expect(service.calculateWordCount('Hello world')).toBe(2);
      expect(service.calculateWordCount('One two three four five')).toBe(5);
      expect(service.calculateWordCount('  Trimmed   spaces  ')).toBe(2);
    });

    it('should handle empty strings', () => {
      expect(service.calculateWordCount('')).toBe(0);
      expect(service.calculateWordCount('   ')).toBe(0);
    });
  });

  describe('processFullText', () => {
    it('should successfully process full-text for a paper', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      const mockCleanedText = 'Sample cleaned text for testing purposes.';

      // Mock database calls
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce(
        mockPaper,
      );
      (prismaService.paper.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockPaper, fullTextStatus: 'fetching' })
        .mockResolvedValueOnce({
          ...mockPaper,
          fullTextStatus: 'success',
          fullText: mockCleanedText,
        });
      (prismaService.paper.findFirst as jest.Mock).mockResolvedValueOnce(null); // No duplicates

      // Mock PDF fetching
      jest.spyOn(service, 'fetchPDF').mockResolvedValueOnce(mockPdfBuffer);
      jest
        .spyOn(service, 'extractText')
        .mockResolvedValueOnce(
          'Sample PDF text with references section\nReferences\n[1] Citation',
        );
      jest.spyOn(service, 'cleanText').mockReturnValueOnce(mockCleanedText);

      const result = await service.processFullText('test-paper-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(prismaService.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-paper-1' },
          data: expect.objectContaining({
            fullTextStatus: 'success',
            hasFullText: true,
          }),
        }),
      );
    });

    it('should fail if paper has no DOI', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockPaper,
        doi: null,
      });

      const result = await service.processFullText('test-paper-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('No DOI');
    });

    it('should fail if paper is not found', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.processFullText('nonexistent-paper');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
    });

    it('should fail if PDF fetch returns null', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce(
        mockPaper,
      );
      (prismaService.paper.update as jest.Mock).mockResolvedValue(mockPaper);

      jest.spyOn(service, 'fetchPDF').mockResolvedValueOnce(null);

      const result = await service.processFullText('test-paper-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('PDF not available');
    });

    it('should fail if text extraction returns null', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');

      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce(
        mockPaper,
      );
      (prismaService.paper.update as jest.Mock).mockResolvedValue(mockPaper);

      jest.spyOn(service, 'fetchPDF').mockResolvedValueOnce(mockPdfBuffer);
      jest.spyOn(service, 'extractText').mockResolvedValueOnce(null);

      const result = await service.processFullText('test-paper-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Failed to extract text');
    });
  });

  describe('getStatus', () => {
    it('should return status for a paper', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce({
        fullTextStatus: 'success',
        fullTextWordCount: 5000,
        fullTextFetchedAt: new Date('2025-01-01'),
      });

      const result = await service.getStatus('test-paper-1');

      expect(result).toEqual({
        status: 'success',
        wordCount: 5000,
        fetchedAt: expect.any(Date),
      });
    });

    it('should return null if paper not found', async () => {
      (prismaService.paper.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getStatus('nonexistent-paper');

      expect(result).toBeNull();
    });
  });

  describe('getBulkStatus', () => {
    it('should group papers by status', async () => {
      const papers = [
        { id: 'paper-1', fullTextStatus: 'success' },
        { id: 'paper-2', fullTextStatus: 'fetching' },
        { id: 'paper-3', fullTextStatus: 'failed' },
        { id: 'paper-4', fullTextStatus: null },
      ];

      (prismaService.paper.findMany as jest.Mock).mockResolvedValueOnce(papers);

      const result = await service.getBulkStatus([
        'paper-1',
        'paper-2',
        'paper-3',
        'paper-4',
      ]);

      expect(result).toEqual({
        ready: ['paper-1'],
        fetching: ['paper-2'],
        failed: ['paper-3'],
        not_fetched: ['paper-4'],
      });
    });
  });
});
