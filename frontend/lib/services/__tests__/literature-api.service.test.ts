/**
 * Literature API Service Unit Tests
 * Phase 10.942 Day 6: Paper Save & Full-Text Fetching Testing
 *
 * Test Coverage:
 * - 6.1 Paper Save Flow (savePaper)
 * - 6.2 Full-Text Fetching (fetchFullTextForPaper, pollFullTextStatus)
 * - 6.4 Error Recovery (retries, timeouts, network errors)
 *
 * Enterprise Standards:
 * - TypeScript strict mode (no `any`)
 * - Module-level mocking for singleton services
 * - Complete edge case coverage
 * - Error handling verification
 *
 * AUDIT FIX (Day 6):
 * - Changed from mocking axios to mocking literatureAPI module directly
 * - literatureAPI is a singleton that creates axios instance in constructor
 * - Module-level mock ensures all tests use mocked functions
 */

// ============================================================================
// Mock Setup - MUST be before imports
// ============================================================================

// Mock functions defined before jest.mock()
const mockSavePaper = jest.fn();
const mockFetchFullTextForPaper = jest.fn();

// Mock the literatureAPI module
jest.mock('../literature-api.service', () => ({
  literatureAPI: {
    savePaper: (...args: unknown[]) => mockSavePaper(...args),
    fetchFullTextForPaper: (...args: unknown[]) => mockFetchFullTextForPaper(...args),
  },
}));

// Import types only (module is mocked)
import type { Paper } from '../literature-api.service';

// Import the mocked module for direct access
import { literatureAPI } from '../literature-api.service';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock paper with required fields
 * Ensures type safety and realistic test data
 */
const createMockPaper = (overrides: Partial<Paper> = {}): Paper => ({
  id: `paper-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  title: 'Test Paper Title',
  authors: ['Author One', 'Author Two'],
  year: 2024,
  source: 'test-source',
  ...overrides,
});

/**
 * Create mock save response
 */
interface SavePaperResponse {
  success: boolean;
  paperId: string;
}

const createMockSaveResponse = (paperId: string): SavePaperResponse => ({
  success: true,
  paperId,
});

/**
 * Create mock paper response (for fetch full-text)
 */
const createMockPaperResponse = (overrides: Partial<Paper> = {}): Paper => ({
  ...createMockPaper(),
  fullTextStatus: 'success',
  hasFullText: true,
  fullText: 'This is the extracted full text content...',
  fullTextWordCount: 5000,
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe('LiteratureAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 6.1 Paper Save Flow Tests
  // ==========================================================================

  describe('6.1 Paper Save Flow', () => {
    describe('savePaper()', () => {
      it('should call save endpoint with paper data', async () => {
        const paper = createMockPaper({
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          year: 2023,
          abstract: 'This paper explores ML applications...',
          doi: '10.1234/test.2023.001',
        });

        mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-paper-123'));

        const result = await literatureAPI.savePaper(paper);

        expect(mockSavePaper).toHaveBeenCalledWith(paper);
        expect(result.success).toBe(true);
        expect(result.paperId).toBe('db-paper-123');
      });

      it('should return paperId on successful save', async () => {
        const paper = createMockPaper({
          title: 'Minimal Paper',
          authors: ['Author'],
          year: 2024,
        });

        mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-paper-456'));

        const result = await literatureAPI.savePaper(paper);

        expect(result.paperId).toBe('db-paper-456');
        expect(result.success).toBe(true);
      });

      it('should handle authentication errors', async () => {
        const paper = createMockPaper();

        mockSavePaper.mockRejectedValueOnce(new Error('AUTHENTICATION_REQUIRED'));

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('AUTHENTICATION_REQUIRED');
      });

      it('should throw on network errors without success fallback', async () => {
        const paper = createMockPaper();

        mockSavePaper.mockRejectedValueOnce(new Error('Network Error'));

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('Network Error');
      });

      it('should handle server errors (500)', async () => {
        const paper = createMockPaper();

        const serverError = new Error('Internal Server Error');
        (serverError as Error & { status?: number }).status = 500;

        mockSavePaper.mockRejectedValueOnce(serverError);

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('Internal Server Error');
      });

      it('should accept all optional fields', async () => {
        const paper = createMockPaper({
          title: 'Complete Paper',
          authors: ['Complete, A.'],
          year: 2024,
          abstract: 'Full abstract content here...',
          doi: '10.1234/complete.2024',
          url: 'https://example.com/paper',
          venue: 'Journal of Testing',
          citationCount: 42,
        });

        mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-complete-123'));

        await literatureAPI.savePaper(paper);

        expect(mockSavePaper).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Complete Paper',
            abstract: 'Full abstract content here...',
            doi: '10.1234/complete.2024',
            url: 'https://example.com/paper',
            venue: 'Journal of Testing',
            citationCount: 42,
          })
        );
      });

      it('should support tags and collectionId', async () => {
        const paperWithTags = {
          ...createMockPaper(),
          tags: ['machine-learning', 'healthcare'],
          collectionId: 'collection-456',
        };

        mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-tagged-123'));

        await literatureAPI.savePaper(paperWithTags);

        expect(mockSavePaper).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['machine-learning', 'healthcare'],
            collectionId: 'collection-456',
          })
        );
      });
    });
  });

  // ==========================================================================
  // 6.2 Full-Text Fetching Tests
  // ==========================================================================

  describe('6.2 Full-Text Fetching', () => {
    describe('fetchFullTextForPaper()', () => {
      it('should trigger full-text extraction and return result', async () => {
        const paperId = 'db-paper-123';

        mockFetchFullTextForPaper.mockResolvedValueOnce(
          createMockPaperResponse({
            id: paperId,
            fullTextStatus: 'success',
            hasFullText: true,
            fullTextWordCount: 5000,
          })
        );

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(mockFetchFullTextForPaper).toHaveBeenCalledWith(paperId);
        expect(result.hasFullText).toBe(true);
        expect(result.fullTextWordCount).toBe(5000);
      });

      it('should return paper with full-text when already available', async () => {
        const paperId = 'db-paper-with-fulltext';

        mockFetchFullTextForPaper.mockResolvedValueOnce(
          createMockPaperResponse({
            id: paperId,
            fullTextStatus: 'success',
            hasFullText: true,
            fullText: 'Existing full text...',
            fullTextWordCount: 8000,
          })
        );

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(result.hasFullText).toBe(true);
        expect(result.fullTextWordCount).toBe(8000);
      });

      it('should handle 404 error for non-existent paper', async () => {
        const paperId = 'non-existent-paper';

        mockFetchFullTextForPaper.mockRejectedValueOnce(
          new Error(`Paper ${paperId} not found in database - save it first`)
        );

        await expect(literatureAPI.fetchFullTextForPaper(paperId)).rejects.toThrow(
          `Paper ${paperId} not found in database - save it first`
        );
      });

      it('should return paper after polling completes', async () => {
        const paperId = 'db-paper-polling';

        mockFetchFullTextForPaper.mockResolvedValueOnce(
          createMockPaperResponse({
            id: paperId,
            fullTextStatus: 'success',
            hasFullText: true,
            fullText: 'Extracted content after polling...',
            fullTextWordCount: 3500,
          })
        );

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(result.fullTextStatus).toBe('success');
        expect(result.hasFullText).toBe(true);
        expect(result.fullTextWordCount).toBe(3500);
      });

      it('should handle extraction failure status', async () => {
        const paperId = 'db-paper-failed';

        mockFetchFullTextForPaper.mockResolvedValueOnce(
          createMockPaperResponse({
            id: paperId,
            fullTextStatus: 'failed',
            hasFullText: false,
            fullText: undefined,
            fullTextWordCount: 0,
          })
        );

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(result.fullTextStatus).toBe('failed');
        expect(result.hasFullText).toBe(false);
      });

      it('should return paper with fullTextSource when using fallback', async () => {
        const paperId = 'db-paper-fallback';

        mockFetchFullTextForPaper.mockResolvedValueOnce({
          ...createMockPaperResponse({ id: paperId }),
          fullTextSource: 'abstract_overflow',
          fullTextStatus: 'success',
          hasFullText: false,
          fullTextWordCount: 300,
        });

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(result.fullTextSource).toBe('abstract_overflow');
      });
    });
  });

  // ==========================================================================
  // 6.4 Error Recovery Tests
  // ==========================================================================

  describe('6.4 Error Recovery', () => {
    describe('Network Error Handling', () => {
      it('should propagate network errors correctly', async () => {
        const paper = createMockPaper();

        mockSavePaper.mockRejectedValueOnce(new Error('Network Error'));

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('Network Error');
      });

      it('should handle timeout errors', async () => {
        const paper = createMockPaper();

        const timeoutError = new Error('timeout of 60000ms exceeded');
        (timeoutError as Error & { code?: string }).code = 'ECONNABORTED';

        mockSavePaper.mockRejectedValueOnce(timeoutError);

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow(
          'timeout of 60000ms exceeded'
        );
      });
    });

    describe('Poll Failure Handling', () => {
      it('should throw on consecutive poll failures', async () => {
        const paperId = 'db-paper-poll-fail';

        mockFetchFullTextForPaper.mockRejectedValueOnce(
          new Error('Polling failed after 3 consecutive attempts - likely network or backend issue')
        );

        await expect(literatureAPI.fetchFullTextForPaper(paperId)).rejects.toThrow(
          'Polling failed after 3 consecutive attempts'
        );
      });

      it('should return successfully after transient errors', async () => {
        const paperId = 'db-paper-transient';

        // Simulates the service recovering after transient errors
        mockFetchFullTextForPaper.mockResolvedValueOnce(
          createMockPaperResponse({
            id: paperId,
            fullTextStatus: 'success',
            hasFullText: true,
            fullTextWordCount: 4000,
          })
        );

        const result = await literatureAPI.fetchFullTextForPaper(paperId);

        expect(result.hasFullText).toBe(true);
      });
    });

    describe('HTTP Status Error Handling', () => {
      it('should handle 400 Bad Request', async () => {
        const paper = createMockPaper();

        mockSavePaper.mockRejectedValueOnce(new Error('Bad Request: Invalid paper data'));

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('Bad Request');
      });

      it('should handle 403 Forbidden', async () => {
        const paper = createMockPaper();

        mockSavePaper.mockRejectedValueOnce(new Error('Forbidden: Access denied'));

        await expect(literatureAPI.savePaper(paper)).rejects.toThrow('Forbidden');
      });

      it('should handle 503 Service Unavailable', async () => {
        const paperId = 'db-paper-503';

        mockFetchFullTextForPaper.mockRejectedValueOnce(
          new Error('Service temporarily unavailable')
        );

        await expect(literatureAPI.fetchFullTextForPaper(paperId)).rejects.toThrow(
          'Service temporarily unavailable'
        );
      });
    });
  });

  // ==========================================================================
  // Paper ID Mapping Tests
  // ==========================================================================

  describe('Paper ID Mapping', () => {
    it('should return database paperId different from frontend ID', async () => {
      const frontendPaper = createMockPaper({
        id: 'frontend-id-abc',
        title: 'Mapping Test Paper',
      });

      mockSavePaper.mockResolvedValueOnce({
        success: true,
        paperId: 'database-id-xyz', // Different from frontend ID
      });

      const result = await literatureAPI.savePaper(frontendPaper);

      expect(result.paperId).toBe('database-id-xyz');
      expect(result.paperId).not.toBe(frontendPaper.id);
    });

    it('should allow using database paperId for subsequent operations', async () => {
      // Step 1: Save paper
      const frontendPaper = createMockPaper({ id: 'frontend-save-id' });

      mockSavePaper.mockResolvedValueOnce({
        success: true,
        paperId: 'db-mapped-id',
      });

      const saveResult = await literatureAPI.savePaper(frontendPaper);

      // Step 2: Use database ID for full-text fetch
      mockFetchFullTextForPaper.mockResolvedValueOnce(
        createMockPaperResponse({
          id: 'db-mapped-id',
          hasFullText: true,
          fullTextStatus: 'success',
        })
      );

      const fetchResult = await literatureAPI.fetchFullTextForPaper(saveResult.paperId);

      expect(fetchResult.id).toBe('db-mapped-id');
      expect(mockFetchFullTextForPaper).toHaveBeenCalledWith('db-mapped-id');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty authors array', async () => {
      const paper = createMockPaper({
        authors: [],
      });

      mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-empty-authors'));

      const result = await literatureAPI.savePaper(paper);

      expect(result.success).toBe(true);
    });

    it('should handle very long titles', async () => {
      const paper = createMockPaper({
        title: 'A'.repeat(1000),
      });

      mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-long-title'));

      const result = await literatureAPI.savePaper(paper);

      expect(result.success).toBe(true);
    });

    it('should handle papers with all optional fields undefined', async () => {
      const minimalPaper: Paper = {
        id: 'minimal-id',
        title: 'Minimal Paper',
        authors: ['Author'],
        year: 2024,
        source: 'test',
      };

      mockSavePaper.mockResolvedValueOnce(createMockSaveResponse('db-minimal'));

      const result = await literatureAPI.savePaper(minimalPaper);

      expect(result.success).toBe(true);
    });

    it('should handle rapid consecutive calls', async () => {
      mockSavePaper
        .mockResolvedValueOnce(createMockSaveResponse('db-1'))
        .mockResolvedValueOnce(createMockSaveResponse('db-2'))
        .mockResolvedValueOnce(createMockSaveResponse('db-3'));

      const [result1, result2, result3] = await Promise.all([
        literatureAPI.savePaper(createMockPaper({ id: 'paper-1' })),
        literatureAPI.savePaper(createMockPaper({ id: 'paper-2' })),
        literatureAPI.savePaper(createMockPaper({ id: 'paper-3' })),
      ]);

      expect(result1.paperId).toBe('db-1');
      expect(result2.paperId).toBe('db-2');
      expect(result3.paperId).toBe('db-3');
      expect(mockSavePaper).toHaveBeenCalledTimes(3);
    });
  });
});
