/**
 * Literature API Service Enhanced Unit Tests
 * Edge cases and user journey testing
 * Phase 10.1 Day 2 - Testing & Quality
 *
 * @module literature-api-enhanced.service.test
 */

import { LiteratureApiEnhancedService } from '../literature-api-enhanced.service';
import { apiClient } from '../../client';

// Mock apiClient
jest.mock('../../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('LiteratureApiEnhancedService', () => {
  let service: LiteratureApiEnhancedService;

  beforeEach(() => {
    service = LiteratureApiEnhancedService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LiteratureApiEnhancedService.getInstance();
      const instance2 = LiteratureApiEnhancedService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Search Literature', () => {
    it('should search literature and return cancellable request', async () => {
      const mockResponse = {
        data: {
          papers: [
            {
              id: '1',
              title: 'Test Paper',
              authors: ['Author 1'],
              year: 2024,
              source: 'pubmed',
            },
          ],
          total: 1,
          page: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { query: 'machine learning', sources: ['pubmed'], limit: 10 };
      const { promise, cancel } = service.searchLiterature(params);

      const result = await promise;

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/literature/search/public',
        params,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(cancel).toBeDefined();
    });

    it('should handle search cancellation', async () => {
      const mockAbortError = new Error('Request cancelled');
      (mockAbortError as any).code = 'ERR_CANCELED';

      (apiClient.post as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(mockAbortError), 100);
        });
      });

      const params = { query: 'test', limit: 10 };
      const { promise, cancel } = service.searchLiterature(params);

      cancel();

      await expect(promise).rejects.toThrow();
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          papers: [],
          total: 0,
          page: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { query: 'nonexistent query', limit: 10 };
      const { promise } = service.searchLiterature(params);

      const result = await promise;

      expect(result.papers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Get Paper By ID', () => {
    it('should get paper by ID', async () => {
      const mockPaper = {
        data: {
          id: '123',
          title: 'Test Paper',
          authors: ['Author 1'],
          year: 2024,
          source: 'pubmed',
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockPaper);

      const result = await service.getPaperById('123');

      expect(result).toEqual(mockPaper.data);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/literature/papers/123',
        undefined
      );
    });

    it('should handle paper not found', async () => {
      const mockError = {
        response: { status: 404, data: { message: 'Paper not found' } },
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(service.getPaperById('nonexistent')).rejects.toMatchObject(
        mockError
      );
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple papers by IDs', async () => {
      const mockPapers = [
        { id: '1', title: 'Paper 1', authors: [], year: 2024, source: 'pubmed' },
        { id: '2', title: 'Paper 2', authors: [], year: 2024, source: 'pubmed' },
        { id: '3', title: 'Paper 3', authors: [], year: 2024, source: 'pubmed' },
      ];

      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockPapers[0] })
        .mockResolvedValueOnce({ data: mockPapers[1] })
        .mockResolvedValueOnce({ data: mockPapers[2] });

      const result = await service.getPapersByIds(['1', '2', '3']);

      expect(result).toEqual(mockPapers);
      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should handle partial batch failure', async () => {
      const mockError = {
        response: { status: 404, data: { message: 'Not found' } },
      };

      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { id: '1', title: 'Paper 1' } })
        .mockRejectedValueOnce(mockError);

      await expect(service.getPapersByIds(['1', '2'])).rejects.toMatchObject(
        mockError
      );
    });
  });

  describe('Full-Text Operations', () => {
    it('should fetch full-text with timeout', async () => {
      const mockResponse = {
        data: {
          paperId: '123',
          fullText: 'Full text content...',
          wordCount: 5000,
          source: 'unpaywall',
          success: true,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { paperId: '123', doi: '10.1234/test' };
      const { promise } = service.fetchFullText(params);

      const result = await promise;

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/literature/fulltext/fetch',
        params,
        expect.objectContaining({ timeout: 60000 })
      );
    });

    it('should cancel full-text fetch', () => {
      const mockResponse = {
        data: {
          paperId: '123',
          fullText: 'Text',
          wordCount: 100,
          source: 'unpaywall',
          success: true,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { paperId: '123' };
      const { cancel } = service.fetchFullText(params);

      expect(() => cancel()).not.toThrow();
    });

    it('should check full-text availability', async () => {
      const mockResponse = {
        data: {
          '123': true,
          '456': false,
          '789': true,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.checkFullTextAvailability(['123', '456', '789']);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Export Operations', () => {
    it('should export papers in CSV format', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockBlob });

      const result = await service.exportPapers(
        { paperIds: ['1', '2'], format: 'csv' }
      );

      expect(result).toBe(mockBlob);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/literature/export',
        { paperIds: ['1', '2'], format: 'csv' },
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should export papers in BibTeX format', async () => {
      const mockBlob = new Blob(['bibtex content'], { type: 'text/plain' });
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockBlob });

      const result = await service.exportPapers(
        { paperIds: ['1'], format: 'bibtex' }
      );

      expect(result).toBe(mockBlob);
    });
  });

  describe('Citations and References', () => {
    it('should get citations for a paper', async () => {
      const mockCitations = {
        data: [
          { id: '1', title: 'Citing Paper 1', authors: [], year: 2024, source: 'pubmed' },
          { id: '2', title: 'Citing Paper 2', authors: [], year: 2024, source: 'pubmed' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockCitations);

      const result = await service.getCitations('123');

      expect(result).toEqual(mockCitations.data);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/literature/papers/123/citations',
        undefined
      );
    });

    it('should get references for a paper', async () => {
      const mockReferences = {
        data: [
          { id: '3', title: 'Reference 1', authors: [], year: 2023, source: 'pubmed' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockReferences);

      const result = await service.getReferences('123');

      expect(result).toEqual(mockReferences.data);
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate quality scores', async () => {
      const mockScores = {
        data: {
          '123': 85,
          '456': 72,
          '789': 91,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockScores);

      const result = await service.calculateQualityScores(['123', '456', '789']);

      expect(result).toEqual(mockScores.data);
    });

    it('should get journal metrics', async () => {
      const mockMetrics = {
        data: {
          impactFactor: 5.2,
          sjrScore: 3.8,
          quartile: 'Q1',
          hIndex: 120,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getJournalMetrics('Nature');

      expect(result).toEqual(mockMetrics.data);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/literature/journals/metrics?name=Nature',
        undefined
      );
    });
  });

  describe('Saved Searches', () => {
    it('should save a search query', async () => {
      const mockResponse = { data: { id: 'search-123' } };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { query: 'machine learning', limit: 10 };
      const result = await service.saveSearch('ML Research', params);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/literature/searches/save',
        { name: 'ML Research', params },
        undefined
      );
    });

    it('should get saved searches', async () => {
      const mockSearches = {
        data: [
          { id: '1', name: 'Search 1', params: { query: 'test' }, createdAt: '2024-01-01' },
          { id: '2', name: 'Search 2', params: { query: 'test2' }, createdAt: '2024-01-02' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockSearches);

      const result = await service.getSavedSearches();

      expect(result).toEqual(mockSearches.data);
    });

    it('should delete saved search', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: null });

      await service.deleteSavedSearch('search-123');

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/literature/searches/search-123',
        undefined
      );
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel all searches', () => {
      expect(() => service.cancelAllSearches()).not.toThrow();
    });

    it('should cancel specific full-text fetch', () => {
      expect(() => service.cancelFullTextFetch('123')).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      const mockError = { code: 'ETIMEDOUT', message: 'Request timeout' };
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const params = { query: 'test', limit: 10 };
      const { promise } = service.searchLiterature(params);

      await expect(promise).rejects.toMatchObject(mockError);
    });

    it('should handle server error (500)', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Internal server error' } },
      };
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const params = { query: 'test', limit: 10 };
      const { promise } = service.searchLiterature(params);

      await expect(promise).rejects.toMatchObject(mockError);
    });

    it('should handle empty paper IDs array', async () => {
      const result = await service.getPapersByIds([]);

      expect(result).toEqual([]);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle special characters in journal name', async () => {
      const mockMetrics = { data: { impactFactor: 3.5 } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockMetrics);

      await service.getJournalMetrics('Journal & Review');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/literature/journals/metrics?name=Journal%20%26%20Review',
        undefined
      );
    });
  });

  describe('User Journey: Literature Search Workflow', () => {
    it('should complete full literature search workflow', async () => {
      // Step 1: Search for papers
      const mockSearchResponse = {
        data: {
          papers: [
            { id: '1', title: 'Paper 1', authors: [], year: 2024, source: 'pubmed', hasPdf: true },
            { id: '2', title: 'Paper 2', authors: [], year: 2024, source: 'pubmed', hasPdf: true },
          ],
          total: 2,
          page: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockSearchResponse);

      const { promise: searchPromise } = service.searchLiterature({
        query: 'machine learning',
        limit: 10,
      });

      const searchResult = await searchPromise;
      expect(searchResult.papers).toHaveLength(2);

      // Step 2: Check full-text availability
      const mockAvailability = { data: { '1': true, '2': true } };
      (apiClient.post as jest.Mock).mockResolvedValue(mockAvailability);

      const availability = await service.checkFullTextAvailability(['1', '2']);
      expect(availability['1']).toBe(true);

      // Step 3: Fetch full-text for selected papers
      const mockFullText = {
        data: {
          paperId: '1',
          fullText: 'Full text...',
          wordCount: 5000,
          source: 'unpaywall',
          success: true,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockFullText);

      const { promise: fullTextPromise } = service.fetchFullText({
        paperId: '1',
        doi: '10.1234/test',
      });

      const fullTextResult = await fullTextPromise;
      expect(fullTextResult.success).toBe(true);
      expect(fullTextResult.wordCount).toBe(5000);

      // Step 4: Export selected papers
      const mockBlob = new Blob(['export content']);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockBlob });

      const exportResult = await service.exportPapers({
        paperIds: ['1', '2'],
        format: 'bibtex',
      });

      expect(exportResult).toBe(mockBlob);
    });
  });
});
