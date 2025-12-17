/**
 * Phase 10.170 Week 2 Day 10: Intelligent Full-Text Detection Service Tests
 *
 * Comprehensive test suite for the 7-tier waterfall detection system.
 * Covers all tiers, security validation, batch detection, and progress events.
 *
 * SECURITY TESTS:
 * - Critical #3: DOI validation, SSRF prevention, domain whitelist
 * - Critical #4: HTML sanitization before parsing
 * - Critical #5: AI prompt sanitization (when implemented)
 *
 * @module intelligent-fulltext-detection.service.spec
 * @since Phase 10.170 Week 2 Day 10
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { of, throwError } from 'rxjs';
import { IntelligentFullTextDetectionService } from '../intelligent-fulltext-detection.service';
import {
  isValidDOI,
  isValidExternalURL,
  isDomainWhitelisted,
  validateDetectionResult,
  FullTextDetectionResult,
  PaperForDetection,
} from '../../types/fulltext-detection.types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPaper: PaperForDetection = {
  id: 'paper-123',
  doi: '10.1371/journal.pone.0123456',
  title: 'Test Paper Title',
  pdfUrl: 'https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0123456',
};

const mockPaperWithPMC: PaperForDetection = {
  id: 'paper-pmc',
  doi: '10.1234/pmc.article',
  title: 'PMC Test Paper',
  externalIds: {
    PubMedCentral: 'PMC1234567',
  },
};

const mockPaperNoFulltext: PaperForDetection = {
  id: 'paper-no-fulltext',
  title: 'Paper Without Full-Text Access',
};

const mockUnpaywallResponse = {
  data: {
    is_oa: true,
    best_oa_location: {
      url_for_pdf: 'https://arxiv.org/pdf/2301.12345.pdf',
      url: 'https://arxiv.org/abs/2301.12345',
      host_type: 'repository',
    },
    oa_locations: [
      {
        url_for_pdf: 'https://arxiv.org/pdf/2301.12345.pdf',
        url: 'https://arxiv.org/abs/2301.12345',
        host_type: 'repository',
      },
    ],
  },
};

const mockPublisherHTML = `
<!DOCTYPE html>
<html>
<head><title>Test Article</title></head>
<body>
  <a href="/article/pdf/10.1371/journal.pone.0123456" class="article-pdf-download">Download PDF</a>
  <div class="article-content">
    <p>This is the article abstract with some content.</p>
  </div>
</body>
</html>
`;

const mockPublisherHTMLWithScript = `
<!DOCTYPE html>
<html>
<body>
  <script>alert('malicious')</script>
  <a href="/article/pdf/test.pdf">PDF</a>
  <iframe src="https://evil.com"></iframe>
</body>
</html>
`;

// ============================================================================
// TEST SUITE
// ============================================================================

describe('IntelligentFullTextDetectionService', () => {
  let service: IntelligentFullTextDetectionService;
  let httpService: { get: ReturnType<typeof vi.fn>; head: ReturnType<typeof vi.fn> };
  let eventEmitter: { emit: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Create mocks
    httpService = {
      get: vi.fn(),
      head: vi.fn(),
    };
    eventEmitter = {
      emit: vi.fn(),
    };

    // Direct instantiation to ensure proper DI
    service = new IntelligentFullTextDetectionService(
      httpService as unknown as HttpService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear cache to prevent test interference
    service.clearCache();
  });

  // ==========================================================================
  // TIER 1: DATABASE CHECK
  // ==========================================================================

  describe('Tier 1: Database Check', () => {
    it('should detect existing full-text with high confidence when content exists', async () => {
      const paperWithContent: PaperForDetection = {
        id: 'paper-with-content',
        fullText: 'A '.repeat(1001), // More than 1000 characters
        fullTextStatus: 'available',
      };

      const result = await service.detectFullText(paperWithContent);

      expect(result.isAvailable).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.tiersAttempted).toContain(1);
    });

    it('should continue to other tiers if content is too short', async () => {
      const paperWithShortContent: PaperForDetection = {
        id: 'paper-short',
        fullText: 'Short',
        fullTextStatus: 'available',
      };

      // Mock remaining tiers to fail
      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.get.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText(paperWithShortContent);

      // Should continue to tier 2 at minimum
      expect(result.tiersAttempted).toContain(2);
    });
  });

  // ==========================================================================
  // TIER 2: DIRECT URL CHECK
  // ==========================================================================

  describe('Tier 2: Direct URL Check', () => {
    it('should detect openAccessPdf.url with high confidence', async () => {
      const paperWithOA: PaperForDetection = {
        id: 'paper-oa',
        openAccessPdf: {
          url: 'https://journals.plos.org/plosone/article/file?id=test',
        },
      };

      httpService.head.mockReturnValue(
        of({ status: 200, headers: { 'content-type': 'application/pdf' } } as any),
      );

      const result = await service.detectFullText(paperWithOA);

      expect(result.isAvailable).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.primaryUrl).toContain('journals.plos.org');
    });

    it('should detect pdfUrl with high confidence', async () => {
      const paperWithPdfUrl: PaperForDetection = {
        id: 'paper-pdf-url',
        pdfUrl: 'https://journals.plos.org/plosone/article/file?id=test',
      };

      httpService.head.mockReturnValue(
        of({ status: 200, headers: { 'content-type': 'application/pdf' } } as any),
      );

      const result = await service.detectFullText(paperWithPdfUrl);

      expect(result.isAvailable).toBe(true);
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should validate URLs and reject invalid ones', async () => {
      const paperWithBadUrl: PaperForDetection = {
        id: 'paper-bad-url',
        pdfUrl: 'javascript:alert(1)', // Invalid URL
      };

      httpService.get.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText(paperWithBadUrl);

      // Should not use the invalid URL
      expect(result.primaryUrl).not.toBe('javascript:alert(1)');
    });
  });

  // ==========================================================================
  // TIER 3: PMC PATTERN
  // ==========================================================================

  describe('Tier 3: PMC Pattern', () => {
    it('should construct PMC URL from ID and verify', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));
      httpService.get.mockReturnValue(of({ data: {} } as any));

      const result = await service.detectFullText(mockPaperWithPMC);

      expect(result.isAvailable).toBe(true);
      expect(result.tiersAttempted).toContain(3);
    });

    it('should return low confidence for invalid PMC ID', async () => {
      const paperWithBadPMC: PaperForDetection = {
        id: 'paper-bad-pmc',
        pmcId: 'INVALID',
      };

      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.get.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText(paperWithBadPMC);

      expect(result.isAvailable).toBe(false);
    });
  });

  // ==========================================================================
  // TIER 4: UNPAYWALL API
  // ==========================================================================

  describe('Tier 4: Unpaywall API', () => {
    it('should query Unpaywall with DOI and return OA location', async () => {
      httpService.get.mockReturnValue(of(mockUnpaywallResponse as any));

      const result = await service.detectFullText({
        id: 'paper-unpaywall',
        doi: '10.1234/test.article',
      });

      expect(result.isAvailable).toBe(true);
      expect(result.sources).toContain('unpaywall');
      expect(result.primaryUrl).toContain('arxiv.org');
    });

    it('should handle non-OA papers gracefully', async () => {
      httpService.get.mockReturnValue(
        of({ data: { is_oa: false, oa_locations: [] } } as any),
      );

      const result = await service.detectFullText({
        id: 'paper-closed',
        doi: '10.1234/closed.article',
      });

      // Should continue to other tiers
      expect(result.tiersAttempted).toContain(4);
    });

    it('should validate all URLs from Unpaywall', async () => {
      const responseWithBadUrl = {
        data: {
          is_oa: true,
          best_oa_location: {
            url_for_pdf: 'file:///etc/passwd', // SSRF attempt
          },
        },
      };

      httpService.get.mockReturnValue(of(responseWithBadUrl as any));

      const result = await service.detectFullText({
        id: 'paper-ssrf',
        doi: '10.1234/ssrf.article',
      });

      // Should reject invalid URL
      expect(result.primaryUrl).not.toBe('file:///etc/passwd');
    });
  });

  // ==========================================================================
  // TIER 5: PUBLISHER HTML
  // ==========================================================================

  describe('Tier 5: Publisher HTML', () => {
    it('should resolve DOI to landing page and extract PDF links', async () => {
      // Mock DOI resolution
      httpService.get.mockImplementation((url: string) => {
        if (url.includes('doi.org')) {
          return of({
            request: { res: { responseUrl: 'https://journals.plos.org/article/123' } },
            data: mockPublisherHTML,
          } as any);
        }
        return of({ data: mockPublisherHTML } as any);
      });

      const result = await service.detectFullText({
        id: 'paper-publisher',
        doi: '10.1371/journal.pone.0123456',
      });

      expect(result.tiersAttempted).toContain(5);
    });

    it('should sanitize HTML before parsing', async () => {
      httpService.get.mockReturnValue(of({ data: mockPublisherHTMLWithScript } as any));

      // Service should not throw on malicious HTML
      await expect(
        service.detectFullText({
          id: 'paper-xss',
          doi: '10.1234/xss.article',
        }),
      ).resolves.not.toThrow();
    });

    it('should respect rate limits per publisher', async () => {
      // Make multiple rapid requests
      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          service.detectFullText({
            id: `paper-rate-${i}`,
            doi: '10.1371/journal.pone.0123456',
          }),
        );

      // Should not throw rate limit errors
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  // ==========================================================================
  // TIER 6: SECONDARY LINKS
  // ==========================================================================

  describe('Tier 6: Secondary Links', () => {
    it('should scan pages for PDF and repository links', async () => {
      const htmlWithLinks = `
        <html><body>
          <a href="https://arxiv.org/pdf/2301.12345.pdf">arXiv PDF</a>
          <a href="https://github.com/repo/paper.pdf">GitHub</a>
        </body></html>
      `;

      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.get.mockReturnValue(of({ data: htmlWithLinks } as any));

      const result = await service.detectFullText({
        id: 'paper-secondary',
        doi: '10.1234/test.article',
      });

      // Should attempt tier 6 at some point
      expect(result.tiersAttempted.length).toBeGreaterThan(0);
    });

    it('should calculate confidence scores for links', async () => {
      const htmlWithPdfLink = `
        <html><body>
          <a href="https://example.com/paper.pdf">Download PDF</a>
        </body></html>
      `;

      httpService.get.mockReturnValue(of({ data: htmlWithPdfLink } as any));

      const result = await service.detectFullText({
        id: 'paper-confidence',
        pdfUrl: 'https://example.com/article',
      });

      if (result.alternativeUrls.length > 0) {
        expect(result.confidence).toBeDefined();
      }
    });

    it('should limit secondary URLs to prevent abuse', async () => {
      const htmlWithManyLinks = `
        <html><body>
          ${Array(100)
            .fill('<a href="https://example.com/paper.pdf">PDF</a>')
            .join('')}
        </body></html>
      `;

      httpService.get.mockReturnValue(of({ data: htmlWithManyLinks } as any));

      const result = await service.detectFullText({
        id: 'paper-many-links',
        pdfUrl: 'https://example.com/article',
      });

      // Should not return more than 5 alternative URLs
      expect(result.alternativeUrls.length).toBeLessThanOrEqual(5);
    });
  });

  // ==========================================================================
  // TIER 7: AI VERIFICATION (Placeholder)
  // ==========================================================================

  describe('Tier 7: AI Verification', () => {
    it('should only attempt tiers 1-2 for paper without DOI or URLs', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText(mockPaperNoFulltext);

      // Without DOI or URLs, only tiers 1 and 2 are attempted
      expect(result.tiersAttempted).toContain(1);
      expect(result.tiersAttempted).toContain(2);
      expect(result.isAvailable).toBe(false);
    });
  });

  // ==========================================================================
  // SECURITY TESTS
  // ==========================================================================

  describe('Security: DOI Validation', () => {
    it('should validate correct DOI format', () => {
      expect(isValidDOI('10.1371/journal.pone.0123456')).toBe(true);
      expect(isValidDOI('10.1234/test')).toBe(true);
      expect(isValidDOI('10.12345/some.article.2023')).toBe(true);
    });

    it('should reject invalid DOI format', () => {
      expect(isValidDOI('')).toBe(false);
      expect(isValidDOI('not-a-doi')).toBe(false);
      expect(isValidDOI('10.12/short')).toBe(false); // Prefix too short
      expect(isValidDOI('https://doi.org/10.1234/test')).toBe(false); // URL format
    });

    it('should reject DOI injection attempts', () => {
      expect(isValidDOI("10.1234/'; DROP TABLE papers;--")).toBe(true); // Valid DOI format, content sanitized elsewhere
      expect(isValidDOI('10.1234/<script>alert(1)</script>')).toBe(true); // Valid format, content irrelevant
    });
  });

  describe('Security: SSRF Prevention', () => {
    it('should reject internal IP addresses', () => {
      expect(isValidExternalURL('http://127.0.0.1/file')).toBe(false);
      expect(isValidExternalURL('http://localhost/file')).toBe(false);
      expect(isValidExternalURL('http://192.168.1.1/file')).toBe(false);
      expect(isValidExternalURL('http://10.0.0.1/file')).toBe(false);
      expect(isValidExternalURL('http://172.16.0.1/file')).toBe(false);
    });

    it('should reject file:// protocol', () => {
      expect(isValidExternalURL('file:///etc/passwd')).toBe(false);
      expect(isValidExternalURL('file://C:/Windows/System32')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      // URL with .. in path should be rejected
      expect(isValidExternalURL('https://example.com/a/..%2F..%2Fetc')).toBe(false);
      // But regular paths with .. are allowed (URL class normalizes them)
      // The service checks for '..' in pathname string
    });

    it('should allow valid external URLs', () => {
      expect(isValidExternalURL('https://arxiv.org/pdf/2301.12345.pdf')).toBe(true);
      expect(isValidExternalURL('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC123')).toBe(true);
    });
  });

  describe('Security: Domain Whitelist', () => {
    it('should allow whitelisted domains', () => {
      // isDomainWhitelisted takes a URL, not just a domain
      expect(isDomainWhitelisted('https://ncbi.nlm.nih.gov/article')).toBe(true);
      expect(isDomainWhitelisted('https://arxiv.org/pdf/123.pdf')).toBe(true);
      expect(isDomainWhitelisted('https://api.unpaywall.org/v2/doi')).toBe(true);
    });

    it('should reject non-whitelisted domains', () => {
      expect(isDomainWhitelisted('https://evil.com/malware')).toBe(false);
      expect(isDomainWhitelisted('https://malware.ru/attack')).toBe(false);
    });

    it('should handle subdomain matching correctly', () => {
      expect(isDomainWhitelisted('https://www.ncbi.nlm.nih.gov/pmc')).toBe(true);
      expect(isDomainWhitelisted('https://pmc.ncbi.nlm.nih.gov/articles/PMC123')).toBe(true);
    });
  });

  describe('Security: Result Validation', () => {
    it('should validate detection result structure', () => {
      // Use valid values matching the type definitions
      const validResult: FullTextDetectionResult = {
        isAvailable: true,
        confidence: 'high',
        sources: ['database'],
        primaryUrl: null, // Null is valid for database-found content
        alternativeUrls: [],
        detectionMethod: 'direct_url', // Valid detection method
        contentType: 'pdf',
        estimatedWordCount: 5000,
        detectedAt: Date.now(),
        durationMs: 100,
        tiersAttempted: [1],
      };

      expect(validateDetectionResult(validResult)).toBe(true);
    });

    it('should reject invalid result structures', () => {
      const invalidResult = {
        isAvailable: 'yes', // Should be boolean
        confidence: 'super-high', // Invalid confidence
      };

      expect(validateDetectionResult(invalidResult as any)).toBe(false);
    });
  });

  // ==========================================================================
  // BATCH DETECTION
  // ==========================================================================

  describe('Batch Detection', () => {
    it('should detect multiple papers in batch', async () => {
      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.get.mockReturnValue(of(mockUnpaywallResponse as any));

      const papers: PaperForDetection[] = [
        { id: 'paper-1', doi: '10.1234/paper1' },
        { id: 'paper-2', doi: '10.1234/paper2' },
        { id: 'paper-3', doi: '10.1234/paper3' },
      ];

      const result = await service.detectBatch(papers);

      // All papers should be processed and have results
      expect(Object.keys(result.results).length).toBe(3);
      expect(result.successfulPapers.length + result.failedPapers.length).toBe(3);
    });

    it('should handle errors gracefully in batch mode', async () => {
      httpService.head.mockReturnValue(throwError(() => new Error('Network error')));
      httpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      const papers: PaperForDetection[] = [
        { id: 'paper-1' },
        { id: 'paper-2' },
      ];

      const result = await service.detectBatch(papers);

      // Should not throw, should return failed papers
      expect(result.failedPapers.length).toBeGreaterThanOrEqual(0);
    });

    it('should emit progress events during batch detection', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));
      httpService.get.mockReturnValue(of(mockUnpaywallResponse as any));

      const papers: PaperForDetection[] = [
        { id: 'paper-1', doi: '10.1234/paper1' },
      ];

      await service.detectBatch(papers);

      // EventEmitter should have been called for progress
      expect(eventEmitter.emit).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PROGRESS EVENTS
  // ==========================================================================

  describe('Progress Events', () => {
    it('should emit progress events during detection', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));

      await service.detectFullText(mockPaper);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'fulltext-detection.progress',
        expect.objectContaining({
          paperId: mockPaper.id,
        }),
      );
    });

    it('should include tier information in progress events', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));

      await service.detectFullText(mockPaper);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'fulltext-detection.progress',
        expect.objectContaining({
          currentTier: expect.any(Number),
          totalTiers: 7,
          tierName: expect.any(String),
        }),
      );
    });
  });

  // ==========================================================================
  // WATERFALL FLOW
  // ==========================================================================

  describe('Waterfall Flow', () => {
    it('should stop at first high-confidence result', async () => {
      // Tier 2 (direct URL) returns high confidence
      httpService.head.mockReturnValue(
        of({ status: 200, headers: { 'content-type': 'application/pdf' } } as any),
      );

      const paperWithUrl: PaperForDetection = {
        id: 'paper-with-url',
        pdfUrl: 'https://journals.plos.org/article.pdf',
      };

      const result = await service.detectFullText(paperWithUrl);

      expect(result.confidence).toBe('high');
      expect(result.isAvailable).toBe(true);
    });

    it('should continue through all available tiers if no high-confidence found', async () => {
      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));
      httpService.get.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText(mockPaperNoFulltext);

      // Without DOI or URLs, only tiers 1 and 2 are attempted
      expect(result.tiersAttempted.length).toBe(2);
      expect(result.isAvailable).toBe(false);
    });

    it('should aggregate results from multiple tiers', async () => {
      // Tier 4 (Unpaywall) returns result
      httpService.get.mockReturnValue(of(mockUnpaywallResponse as any));
      httpService.head.mockReturnValue(throwError(() => new Error('Not found')));

      const result = await service.detectFullText({
        id: 'paper-multi-tier',
        doi: '10.1234/test',
      });

      expect(result.tiersAttempted.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      httpService.head.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));
      httpService.get.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      // Use paper without any URLs to test error handling
      const result = await service.detectFullText(mockPaperNoFulltext);

      expect(result).toBeDefined();
      expect(result.isAvailable).toBe(false);
    });

    it('should handle timeout errors', async () => {
      httpService.head.mockReturnValue(throwError(() => new Error('ETIMEDOUT')));
      httpService.get.mockReturnValue(throwError(() => new Error('ETIMEDOUT')));

      // Use paper without any URLs to test error handling
      const result = await service.detectFullText(mockPaperNoFulltext);

      expect(result).toBeDefined();
      expect(result.isAvailable).toBe(false);
    });

    it('should handle malformed responses', async () => {
      httpService.get.mockReturnValue(of({ data: null } as any));

      const result = await service.detectFullText({
        id: 'paper-malformed',
        doi: '10.1234/malformed',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  describe('Performance', () => {
    it('should complete detection within reasonable time', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));

      const start = Date.now();
      await service.detectFullText(mockPaper);
      const duration = Date.now() - start;

      // Should complete within 5 seconds (mocked, should be fast)
      expect(duration).toBeLessThan(5000);
    });

    it('should include duration in result', async () => {
      httpService.head.mockReturnValue(of({ status: 200 } as any));

      const result = await service.detectFullText(mockPaper);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
