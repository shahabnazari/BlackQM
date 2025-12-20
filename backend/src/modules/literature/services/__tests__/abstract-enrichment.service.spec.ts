/**
 * Abstract Enrichment Service Tests
 * Phase 10.181: Tests for PubMed abstract enrichment
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractEnrichmentService } from '../abstract-enrichment.service';
import { Paper, LiteratureSource } from '../../dto/literature.dto';

// Mock dependencies
const mockHttpService = {
  get: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    if (key === 'NCBI_API_KEY') return 'test-api-key';
    if (key === 'NCBI_EMAIL') return 'test@example.com';
    return null;
  }),
};

// Mock rxjs firstValueFrom
vi.mock('rxjs', async () => {
  const actual = await vi.importActual('rxjs');
  return {
    ...(actual as object),
    firstValueFrom: vi.fn((observable) => observable),
  };
});

describe('AbstractEnrichmentService', () => {
  let service: AbstractEnrichmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AbstractEnrichmentService(
      mockHttpService as any,
      mockConfigService as any,
    );
  });

  describe('needsAbstractEnrichment', () => {
    it('returns false when paper has sufficient abstract word count', () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        abstract: 'A long abstract with more than fifty words. '.repeat(5),
        abstractWordCount: 100,
        wordCount: 120,
        source: LiteratureSource.CROSSREF,
      };
      expect(service.needsAbstractEnrichment(paper)).toBe(false);
    });

    it('returns false when paper has sufficient total word count', () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        abstract: 'Short abstract',
        wordCount: 150,
        source: LiteratureSource.CROSSREF,
      };
      expect(service.needsAbstractEnrichment(paper)).toBe(false);
    });

    it('returns true when paper has no abstract', () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        wordCount: 10,
        source: LiteratureSource.CROSSREF,
      };
      expect(service.needsAbstractEnrichment(paper)).toBe(true);
    });

    it('returns true when abstract is too short', () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        abstract: 'Very short abstract',
        wordCount: 15,
        source: LiteratureSource.CROSSREF,
      };
      expect(service.needsAbstractEnrichment(paper)).toBe(true);
    });

    it('returns true when abstract length is under 200 characters', () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        abstract: 'This is a short abstract that is under 200 characters.',
        wordCount: 20,
        source: LiteratureSource.CROSSREF,
      };
      expect(service.needsAbstractEnrichment(paper)).toBe(true);
    });
  });

  describe('fetchAbstractByDOI', () => {
    it('returns null when DOI is empty', async () => {
      const result = await service.fetchAbstractByDOI('');
      expect(result).toBeNull();
    });

    it('returns null when PMID lookup fails', async () => {
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: [] } },
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBeNull();
    });

    it('returns abstract when PubMed has the paper', async () => {
      // Mock esearch response (DOI → PMID)
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      // Mock efetch response (PMID → Abstract XML)
      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText>This is the abstract text from PubMed.</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBe('This is the abstract text from PubMed.');
    });

    it('handles structured abstracts with multiple sections', async () => {
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText Label="BACKGROUND">Background info.</AbstractText>
          <AbstractText Label="METHODS">Methods used.</AbstractText>
          <AbstractText Label="RESULTS">Key findings.</AbstractText>
          <AbstractText Label="CONCLUSIONS">Final thoughts.</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toContain('BACKGROUND:');
      expect(result).toContain('Background info.');
      expect(result).toContain('METHODS:');
      expect(result).toContain('Methods used.');
      expect(result).toContain('RESULTS:');
      expect(result).toContain('Key findings.');
      expect(result).toContain('CONCLUSIONS:');
      expect(result).toContain('Final thoughts.');
    });

    it('returns null on network error', async () => {
      mockHttpService.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBeNull();
    });
  });

  describe('enrichPaperAbstract', () => {
    it('returns paper unchanged when enrichment not needed', async () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        abstract: 'A sufficient abstract with enough words to pass the threshold. '.repeat(5),
        abstractWordCount: 100,
        wordCount: 120,
        source: LiteratureSource.CROSSREF,
      };

      const result = await service.enrichPaperAbstract(paper);
      expect(result).toBe(paper);
    });

    it('returns paper unchanged when no DOI', async () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        wordCount: 10,
        source: LiteratureSource.CROSSREF,
      };

      const result = await service.enrichPaperAbstract(paper);
      expect(result).toBe(paper);
    });

    it('enriches paper with abstract from PubMed', async () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper About Climate Change',
        doi: '10.1016/j.cub.2019.08.042',
        wordCount: 10,
        source: LiteratureSource.CROSSREF,
      };

      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      const abstractText = 'This is a comprehensive abstract about climate change research that provides significant detail about methodology, findings, and implications for future studies. The research examines multiple aspects of environmental impact.';
      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText>${abstractText}</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.enrichPaperAbstract(paper);

      expect(result.abstract).toBe(abstractText);
      expect(result.abstractWordCount).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(paper.wordCount!);
    });

    it('returns original paper when PubMed has no abstract', async () => {
      const paper: Paper = {
        id: '1',
        title: 'Test Paper',
        doi: '10.1016/test',
        wordCount: 10,
        source: LiteratureSource.CROSSREF,
      };

      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: [] } },
      });

      const result = await service.enrichPaperAbstract(paper);
      expect(result).toBe(paper);
    });
  });

  describe('enrichPapersAbstracts', () => {
    it('returns papers unchanged when none need enrichment', async () => {
      const papers: Paper[] = [
        {
          id: '1',
          title: 'Paper 1',
          abstract: 'Sufficient abstract. '.repeat(20),
          abstractWordCount: 100,
          wordCount: 120,
          source: LiteratureSource.CROSSREF,
        },
        {
          id: '2',
          title: 'Paper 2',
          abstract: 'Another sufficient abstract. '.repeat(20),
          abstractWordCount: 100,
          wordCount: 120,
          source: LiteratureSource.CROSSREF,
        },
      ];

      const result = await service.enrichPapersAbstracts(papers);
      expect(result).toEqual(papers);
    });

    it('enriches only papers that need it', async () => {
      const papers: Paper[] = [
        {
          id: '1',
          title: 'Paper 1 With Abstract',
          abstract: 'Sufficient abstract content that meets the minimum requirements. '.repeat(5),
          abstractWordCount: 100,
          wordCount: 120,
          doi: '10.1016/good',
          source: LiteratureSource.CROSSREF,
        },
        {
          id: '2',
          title: 'Paper 2 Without Abstract',
          doi: '10.1016/missing',
          wordCount: 10,
          source: LiteratureSource.CROSSREF,
        },
      ];

      // Only the second paper should trigger PubMed lookup
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      const newAbstract = 'This is the enriched abstract from PubMed with sufficient detail for research purposes.';
      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle><AbstractText>${newAbstract}</AbstractText></PubmedArticle>`,
      });

      const result = await service.enrichPapersAbstracts(papers);

      expect(result.length).toBe(2);
      expect(result[0].abstract).toContain('Sufficient abstract');
      expect(result[1].abstract).toBe(newAbstract);
    });

    it('handles batch processing with concurrent limit', async () => {
      const papers: Paper[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Paper ${i}`,
        doi: `10.1016/paper${i}`,
        wordCount: 10,
        source: LiteratureSource.CROSSREF,
      }));

      // Mock all requests to fail (simulate no PubMed entries)
      mockHttpService.get.mockResolvedValue({
        data: { esearchresult: { idlist: [] } },
      });

      const result = await service.enrichPapersAbstracts(papers, 3);
      expect(result.length).toBe(10);
    });
  });

  describe('XML parsing', () => {
    it('handles HTML entities in abstract', async () => {
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText>Test with &lt;special&gt; &amp; "quoted" text.</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBe('Test with <special> & "quoted" text.');
    });

    it('handles nested XML tags within abstract', async () => {
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText>Text with <i>italic</i> and <b>bold</b> formatting.</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBe('Text with italic and bold formatting.');
    });

    it('normalizes whitespace in abstract', async () => {
      mockHttpService.get.mockResolvedValueOnce({
        data: { esearchresult: { idlist: ['12345678'] } },
      });

      mockHttpService.get.mockResolvedValueOnce({
        data: `<PubmedArticle>
          <AbstractText>Text   with    excessive

          whitespace.</AbstractText>
        </PubmedArticle>`,
      });

      const result = await service.fetchAbstractByDOI('10.1016/test');
      expect(result).toBe('Text with excessive whitespace.');
    });
  });
});
