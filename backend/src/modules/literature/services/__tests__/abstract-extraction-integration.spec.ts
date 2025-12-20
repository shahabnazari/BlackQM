/**
 * Abstract Extraction Integration Tests
 * Phase 10.183: End-to-End Tests for Full-Text Fetch with Abstract Extraction
 *
 * These tests verify the complete abstract extraction flow across all tiers.
 * Uses lightweight mocking without NestJS TestingModule for faster execution.
 *
 * Netflix-Grade Testing:
 * - Full E2E flow verification
 * - Mock external dependencies
 * - Database state verification
 * - Error handling and fallback scenarios
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PDFParsingService } from '../pdf-parsing.service';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn((error) => error.isAxiosError === true),
  },
}));

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({
    text: 'Mock PDF content for testing purposes.',
    numpages: 5,
  }),
}));

describe('Abstract Extraction Integration Tests', () => {
  let service: PDFParsingService;
  let mockPrisma: any;
  let mockHtmlService: any;
  let mockGrobidService: any;
  let mockUniversalEnrichment: any;

  // Test paper with no abstract - needs enrichment
  const paperWithoutAbstract = {
    id: 'paper-no-abstract',
    title: 'Research on Climate Change Effects',
    doi: '10.1234/climate.2024',
    abstract: null,
    abstractWordCount: 0,
    fullText: null,
    fullTextStatus: null,
    fullTextWordCount: null,
    fullTextHash: null,
    wordCount: 10,
    wordCountExcludingRefs: 10,
    hasFullText: false,
    url: 'https://example.com/paper',
    pdfUrl: null,
  };

  // Test paper with good abstract - no enrichment needed
  const paperWithGoodAbstract = {
    ...paperWithoutAbstract,
    id: 'paper-good-abstract',
    abstract: 'A'.repeat(250), // 250 chars > 100 minimum
    abstractWordCount: 40,
  };

  // Sample abstracts for testing
  const samplePMCAbstract = `
    This comprehensive study examines the effects of climate change on coastal ecosystems.
    Using a 10-year longitudinal dataset from 50 monitoring stations, we analyzed temperature
    trends, species migration patterns, and biodiversity indices. Results indicate significant
    correlation between temperature increases and ecosystem disruption (p < 0.001).
  `.trim();

  const sampleGrobidAbstract = `
    BACKGROUND: Machine learning approaches have revolutionized genomic analysis.
    METHODS: We developed a novel deep learning pipeline for variant calling.
    RESULTS: Our model achieved 99.2% accuracy on benchmark datasets.
    CONCLUSIONS: These findings suggest AI-driven genomics offers significant advantages.
  `.trim();

  const sampleOpenAlexAbstract = `
    This meta-analysis synthesizes findings from 150 studies on mindfulness interventions
    for anxiety disorders. Using random-effects models, we found moderate to large effect
    sizes (d = 0.72, 95% CI [0.58, 0.86]) across all intervention types. Subgroup analyses
    revealed that duration and facilitator training significantly moderated outcomes.
  `.trim();

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock services
    mockPrisma = {
      paper: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    mockHtmlService = {
      fetchFullTextWithFallback: vi.fn(),
    };

    mockGrobidService = {
      isGrobidAvailable: vi.fn(),
      extractFromBuffer: vi.fn(),
    };

    mockUniversalEnrichment = {
      enrichAbstract: vi.fn(),
    };

    // Create service with mocked dependencies
    service = new PDFParsingService(
      mockPrisma as any,
      mockHtmlService as any,
      mockGrobidService as any,
      mockUniversalEnrichment as any,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Test Suite 1: PMC Abstract Extraction (Tier 2 - Loophole #2 Fix)
  // ============================================================================
  describe('PMC Abstract Extraction Flow', () => {
    it('should extract and save abstract from PMC API response', async () => {
      // Setup: Paper without abstract, PMC succeeds with abstract
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        pmid: '38123456',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null); // No duplicate

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text from PMC...',
        wordCount: 5000,
        source: 'pmc',
        abstract: samplePMCAbstract,
        abstractWordCount: 70,
      });

      // Execute
      const result = await service.processFullText('paper-no-abstract');

      // Verify
      expect(result.success).toBe(true);
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullTextStatus: 'success',
            fullTextSource: 'pmc',
            abstract: samplePMCAbstract,
            abstractWordCount: expect.any(Number),
          }),
        }),
      );
    });

    it('should handle PMC response without abstract gracefully', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        pmid: '38123456',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text from PMC...',
        wordCount: 5000,
        source: 'pmc',
        abstract: undefined, // No abstract in PMC response
        abstractWordCount: undefined,
      });

      // Should trigger UniversalAbstractEnrichment fallback
      mockUniversalEnrichment.enrichAbstract.mockResolvedValueOnce({
        abstract: sampleOpenAlexAbstract,
        wordCount: 60,
        source: 'openalex',
      });

      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      expect(mockUniversalEnrichment.enrichAbstract).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test Suite 2: HTML Scraping Abstract Extraction (Tier 2 - Loophole #1 Fix)
  // ============================================================================
  describe('HTML Scraping Abstract Extraction Flow', () => {
    it('should extract and save abstract from publisher HTML page', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        url: 'https://www.mdpi.com/2227-9040/12/1/34',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text from HTML scraping...',
        wordCount: 4000,
        source: 'html_scrape',
        abstract: samplePMCAbstract,
        abstractWordCount: 70,
      });

      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullTextSource: 'html_scrape',
            abstract: samplePMCAbstract,
          }),
        }),
      );
    });
  });

  // ============================================================================
  // Test Suite 3: GROBID Abstract Extraction (Tier 2.5 - Loophole #3 Fix)
  // ============================================================================
  describe('GROBID Abstract Extraction Flow', () => {
    it('should extract and save abstract from GROBID PDF extraction', async () => {
      const axios = await import('axios');

      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        pdfUrl: 'https://example.com/paper.pdf',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      // HTML fails
      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: false,
        error: 'No PMID available',
      });

      // GROBID succeeds with abstract
      mockGrobidService.isGrobidAvailable.mockResolvedValueOnce(true);
      (axios.default.get as any).mockResolvedValueOnce({
        data: Buffer.from('Mock PDF content'),
      });
      mockGrobidService.extractFromBuffer.mockResolvedValueOnce({
        success: true,
        text: 'Full text from GROBID...',
        wordCount: 6000,
        processingTime: 1500,
        metadata: {
          title: 'Test Paper',
          abstract: sampleGrobidAbstract,
        },
      });

      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullTextSource: 'grobid',
            abstract: sampleGrobidAbstract,
          }),
        }),
      );
    });
  });

  // ============================================================================
  // Test Suite 4: Universal Abstract Enrichment Fallback (Loophole #4 Fix)
  // ============================================================================
  describe('Universal Abstract Enrichment Fallback', () => {
    it('should use UniversalAbstractEnrichment when all extraction methods have no abstract', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        doi: '10.1234/test',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      // HTML succeeds but no abstract
      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text without abstract...',
        wordCount: 4000,
        source: 'html_scrape',
        abstract: undefined, // No abstract
      });

      // Universal enrichment provides abstract
      mockUniversalEnrichment.enrichAbstract.mockResolvedValueOnce({
        abstract: sampleOpenAlexAbstract,
        wordCount: 60,
        source: 'openalex',
      });

      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      expect(mockUniversalEnrichment.enrichAbstract).toHaveBeenCalledWith(
        '10.1234/test', // DOI
        'https://example.com/paper', // URL
        undefined, // PMID
      );
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            abstract: sampleOpenAlexAbstract,
          }),
        }),
      );
    });

    it('should try enrichment even when full-text fetch fails', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        doi: '10.1234/test',
      });

      // All full-text methods fail
      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: false,
        error: 'Not available',
      });
      mockGrobidService.isGrobidAvailable.mockResolvedValueOnce(false);

      // Universal enrichment provides abstract
      mockUniversalEnrichment.enrichAbstract.mockResolvedValueOnce({
        abstract: sampleOpenAlexAbstract,
        wordCount: 60,
        source: 'semantic_scholar',
      });

      await service.processFullText('paper-no-abstract');

      expect(mockUniversalEnrichment.enrichAbstract).toHaveBeenCalled();
      // Should save abstract even though full-text failed
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullTextStatus: 'failed',
            abstract: sampleOpenAlexAbstract,
          }),
        }),
      );
    });
  });

  // ============================================================================
  // Test Suite 5: Quality Comparison (Loophole #5 Fix)
  // ============================================================================
  describe('Abstract Quality Comparison', () => {
    it('should NOT overwrite existing good abstract with shorter one', async () => {
      const existingAbstract = 'B'.repeat(300); // 300 chars
      const newShorterAbstract = 'A'.repeat(150); // 150 chars - shorter

      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        abstract: existingAbstract,
        abstractWordCount: 50,
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text...',
        wordCount: 4000,
        source: 'pmc',
        abstract: newShorterAbstract,
        abstractWordCount: 25,
      });

      await service.processFullText('paper-no-abstract');

      // Verify abstract was NOT updated
      const finalUpdate = mockPrisma.paper.update.mock.calls.find(
        (call: any) => call[0].data.fullTextStatus === 'success',
      );
      expect(finalUpdate[0].data.abstract).toBeUndefined();
    });

    it('should update abstract when new one is 20%+ longer', async () => {
      const existingAbstract = 'B'.repeat(200); // 200 chars
      const newLongerAbstract = 'A'.repeat(250); // 250 chars - 25% longer

      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        abstract: existingAbstract,
        abstractWordCount: 35,
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text...',
        wordCount: 4000,
        source: 'pmc',
        abstract: newLongerAbstract,
        abstractWordCount: 40,
      });

      await service.processFullText('paper-no-abstract');

      // Verify abstract WAS updated
      expect(mockPrisma.paper.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            abstract: newLongerAbstract,
          }),
        }),
      );
    });

    it('should skip enrichment for papers with sufficient abstracts', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithGoodAbstract,
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text...',
        wordCount: 4000,
        source: 'html_scrape',
        abstract: undefined, // No new abstract from HTML
      });

      await service.processFullText('paper-good-abstract');

      // Universal enrichment should NOT be called since existing abstract is good
      expect(mockUniversalEnrichment.enrichAbstract).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test Suite 6: Error Handling
  // ============================================================================
  describe('Error Handling', () => {
    it('should handle UniversalAbstractEnrichment errors gracefully', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        doi: '10.1234/test',
      });

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text...',
        wordCount: 4000,
        source: 'html_scrape',
        abstract: undefined,
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      // Universal enrichment throws error
      mockUniversalEnrichment.enrichAbstract.mockRejectedValueOnce(
        new Error('OpenAlex API rate limit exceeded'),
      );

      // Should not throw, should continue gracefully
      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      // Full-text was saved, even though abstract enrichment failed
      expect(mockPrisma.paper.update).toHaveBeenCalled();
    });

    it('should handle empty abstract from extraction', async () => {
      mockPrisma.paper.findUnique.mockResolvedValueOnce({
        ...paperWithoutAbstract,
        pmid: '12345',
      });
      mockPrisma.paper.findFirst.mockResolvedValueOnce(null);

      mockHtmlService.fetchFullTextWithFallback.mockResolvedValueOnce({
        success: true,
        text: 'Full text...',
        wordCount: 4000,
        source: 'pmc',
        abstract: '', // Empty abstract
        abstractWordCount: 0,
      });

      mockUniversalEnrichment.enrichAbstract.mockResolvedValueOnce({
        abstract: null, // Also fails
      });

      const result = await service.processFullText('paper-no-abstract');

      expect(result.success).toBe(true);
      // Should not save empty abstract
      const finalUpdate = mockPrisma.paper.update.mock.calls.find(
        (call: any) => call[0].data.fullTextStatus === 'success',
      );
      expect(finalUpdate[0].data.abstract).toBeUndefined();
    });
  });
});
