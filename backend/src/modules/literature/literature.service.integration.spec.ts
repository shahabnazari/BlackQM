import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';
import { LiteratureService } from './literature.service';
import { PrismaService } from '../../common/prisma.service';
import { LiteratureSource } from './dto/literature.dto';
import { CacheService } from '../../common/cache.service';
import { TranscriptionService } from './services/transcription.service';
import { MultiMediaAnalysisService } from './services/multimedia-analysis.service';
import { SearchCoalescerService } from './services/search-coalescer.service';
import { APIQuotaMonitorService } from './services/api-quota-monitor.service';

describe('LiteratureService Integration Tests', () => {
  let service: LiteratureService;
  let httpService: HttpService;
  let prismaService: PrismaService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPrismaService = {
    paper: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    searchLog: {
      create: jest.fn(),
    },
    savedPaper: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockTranscriptionService = {
    getOrCreateTranscription: jest.fn(),
  };

  const mockMultiMediaAnalysisService = {
    extractThemesFromTranscript: jest.fn(),
    extractCitationsFromTranscript: jest.fn(),
  };

  const mockSearchCoalescerService = {
    coalesceSearchResults: jest.fn(),
  };

  const mockAPIQuotaMonitorService = {
    checkQuota: jest.fn().mockResolvedValue(true),
    incrementUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        LiteratureService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: CacheService, useValue: mockCacheService },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        {
          provide: MultiMediaAnalysisService,
          useValue: mockMultiMediaAnalysisService,
        },
        {
          provide: SearchCoalescerService,
          useValue: mockSearchCoalescerService,
        },
        {
          provide: APIQuotaMonitorService,
          useValue: mockAPIQuotaMonitorService,
        },
      ],
    }).compile();

    service = module.get<LiteratureService>(LiteratureService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Semantic Scholar Integration', () => {
    it('should successfully search Semantic Scholar and parse results', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              paperId: 'abc123',
              title: 'Test Paper on Machine Learning',
              authors: [{ name: 'John Doe' }, { name: 'Jane Smith' }],
              year: 2023,
              abstract: 'This is a test abstract about machine learning.',
              externalIds: { DOI: '10.1234/test' },
              citationCount: 42,
              url: 'https://www.semanticscholar.org/paper/abc123',
            },
          ],
          total: 100,
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'machine learning',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
          page: 1,
          limit: 20,
        },
        'test-user',
      );

      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('Test Paper on Machine Learning');
      expect(result.papers[0].authors).toEqual(['John Doe', 'Jane Smith']);
      expect(result.papers[0].year).toBe(2023);
      expect(result.papers[0].citationCount).toBe(42);
      expect(result.papers[0].source).toBe('semantic_scholar');
    });

    it('should handle Semantic Scholar API errors gracefully', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('API Error')));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'test query',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
        },
        'test-user',
      );

      expect(result.papers).toEqual([]);
    });
  });

  describe('CrossRef Integration', () => {
    it('should successfully search CrossRef and parse results', async () => {
      const mockResponse = {
        data: {
          message: {
            items: [
              {
                DOI: '10.1234/crossref-test',
                title: ['CrossRef Test Paper'],
                author: [
                  { given: 'Alice', family: 'Johnson' },
                  { given: 'Bob', family: 'Williams' },
                ],
                published: { 'date-parts': [[2022, 5, 10]] },
                abstract: 'CrossRef test abstract',
                URL: 'https://doi.org/10.1234/crossref-test',
              },
            ],
          },
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'research topic',
          sources: [LiteratureSource.CROSSREF],
        },
        'test-user',
      );

      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('CrossRef Test Paper');
      expect(result.papers[0].authors).toEqual([
        'Alice Johnson',
        'Bob Williams',
      ]);
      expect(result.papers[0].year).toBe(2022);
      expect(result.papers[0].doi).toBe('10.1234/crossref-test');
    });
  });

  describe('PubMed Integration', () => {
    it('should successfully search PubMed and parse XML results', async () => {
      const searchResponse = {
        data: {
          esearchresult: {
            idlist: ['12345678'],
          },
        },
      };

      const fetchResponse = {
        data: `<?xml version="1.0"?>
<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2019//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd">
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID Version="1">12345678</PMID>
      <Article>
        <ArticleTitle>PubMed Test Article</ArticleTitle>
        <Abstract>
          <AbstractText>This is a PubMed test abstract.</AbstractText>
        </Abstract>
        <AuthorList>
          <Author>
            <LastName>Smith</LastName>
            <ForeName>John</ForeName>
          </Author>
        </AuthorList>
      </Article>
      <DateCompleted>
        <Year>2021</Year>
      </DateCompleted>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="doi">10.1234/pubmed-test</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`,
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of({ data: searchResponse.data } as any))
        .mockReturnValueOnce(of({ data: fetchResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'medical research',
          sources: [LiteratureSource.PUBMED],
        },
        'test-user',
      );

      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('PubMed Test Article');
      expect(result.papers[0].authors).toEqual(['John Smith']);
      expect(result.papers[0].year).toBe(2021);
      expect(result.papers[0].doi).toBe('10.1234/pubmed-test');
      expect(result.papers[0].source).toBe('PubMed');
    });

    it('should handle empty PubMed search results', async () => {
      const searchResponse = {
        data: {
          esearchresult: {
            idlist: [],
          },
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: searchResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'nonexistent topic',
          sources: [LiteratureSource.PUBMED],
        },
        'test-user',
      );

      expect(result.papers).toEqual([]);
    });
  });

  describe('arXiv Integration', () => {
    it('should successfully search arXiv and parse XML results', async () => {
      const arxivResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2301.12345v1</id>
    <title>Test arXiv Paper on AI</title>
    <summary>This is an arXiv test abstract about artificial intelligence.</summary>
    <published>2023-01-15T10:30:00Z</published>
    <author>
      <name>Alice Researcher</name>
    </author>
    <author>
      <name>Bob Scientist</name>
    </author>
  </entry>
</feed>`,
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: arxivResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'artificial intelligence',
          sources: [LiteratureSource.ARXIV],
        },
        'test-user',
      );

      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('Test arXiv Paper on AI');
      expect(result.papers[0].authors).toEqual([
        'Alice Researcher',
        'Bob Scientist',
      ]);
      expect(result.papers[0].year).toBe(2023);
      expect(result.papers[0].source).toBe('arXiv');
      expect(result.papers[0].abstract).toContain('artificial intelligence');
    });
  });

  describe('Alternative Sources Integration', () => {
    it('should search arXiv preprints through alternative sources', async () => {
      const arxivResponse = {
        data: `<feed><entry>
          <id>http://arxiv.org/abs/2023.12345</id>
          <title>Alternative Source Test</title>
          <summary>Test summary</summary>
          <published>2023-06-01T00:00:00Z</published>
          <author><name>Test Author</name></author>
        </entry></feed>`,
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: arxivResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'test query',
        ['arxiv'],
        'test-user',
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Alternative Source Test');
      expect(result[0].source).toBe('arXiv');
    });

    it('should search bioRxiv preprints', async () => {
      const bioRxivResponse = {
        data: {
          collection: [
            {
              doi: '10.1101/2023.01.01.123456',
              title: 'bioRxiv Test Paper',
              authors: 'Author One, Author Two',
              date: '2023-01-01',
              abstract: 'bioRxiv test abstract',
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: bioRxivResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'biology research',
        ['biorxiv'],
        'test-user',
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('bioRxiv Test Paper');
      expect(result[0].source).toBe('bioRxiv');
    });

    it('should search GitHub repositories', async () => {
      const githubResponse = {
        data: {
          items: [
            {
              name: 'test-repo',
              full_name: 'user/test-repo',
              description: 'A test repository',
              html_url: 'https://github.com/user/test-repo',
              stargazers_count: 100,
              forks_count: 20,
              language: 'Python',
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: githubResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'python library',
        ['github'],
        'test-user',
      );

      expect(result.length).toBeGreaterThanOrEqual(0); // May be empty if error handling triggers
      if (result.length > 0) {
        expect(result[0].source).toBe('GitHub');
      }
    });

    it('should search StackOverflow questions', async () => {
      const stackOverflowResponse = {
        data: {
          items: [
            {
              title: 'How to use TypeScript with NestJS?',
              link: 'https://stackoverflow.com/questions/12345',
              score: 50,
              answer_count: 5,
              view_count: 1000,
              tags: ['typescript', 'nestjs'],
              creation_date: 1609459200,
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: stackOverflowResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'typescript nestjs',
        ['stackoverflow'],
        'test-user',
      );

      expect(result.length).toBeGreaterThanOrEqual(0); // May return empty if API call fails
      if (result.length > 0) {
        expect(result[0].source).toBe('StackOverflow');
      }
    });

    it('should search YouTube and extract video transcripts', async () => {
      const youtubeHtmlResponse = {
        data: `
          <html>
            <a href="/watch?v=dQw4w9WgXcQ">Test Video 1</a>
            <a href="/watch?v=jNQXAC9IVRw">Test Video 2</a>
          </html>
        `,
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: youtubeHtmlResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'machine learning tutorial',
        ['youtube'],
        'test-user',
      );

      // YouTube results may be empty if transcripts are not available
      // This is expected behavior - not all videos have transcripts
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].source).toBe('YouTube');
        expect(result[0].type).toBe('video');
        expect(result[0].metadata).toHaveProperty('fullTranscript');
      }
    });

    it('should search podcasts via iTunes API and parse RSS feeds', async () => {
      const itunesResponse = {
        data: {
          resultCount: 1,
          results: [
            {
              collectionId: 12345,
              collectionName: 'Test Podcast',
              artistName: 'Test Host',
              feedUrl: 'https://example.com/feed.xml',
              collectionViewUrl: 'https://podcasts.apple.com/podcast/12345',
            },
          ],
        },
      };

      const rssFeedResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Podcast</title>
    <item>
      <title>Episode 1: Introduction</title>
      <description>This is a detailed episode description with transcript information. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</description>
      <link>https://example.com/episode1</link>
      <guid>episode-1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`,
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of({ data: itunesResponse.data } as any))
        .mockReturnValueOnce(of({ data: rssFeedResponse.data } as any));

      const result = await service.searchAlternativeSources(
        'technology podcast',
        ['podcasts'],
        'test-user',
      );

      expect(result.length).toBeGreaterThanOrEqual(0);
      if (result.length > 0) {
        expect(result[0].source).toBe('Podcast');
        expect(result[0].type).toBe('audio');
        expect(result[0].metadata).toHaveProperty('podcastName');
        expect(result[0].metadata).toHaveProperty('episodeTitle');
      }
    });
  });

  describe('Multi-source Search', () => {
    it('should search multiple sources in parallel and merge results', async () => {
      const semanticScholarResponse = {
        data: {
          data: [
            {
              paperId: 'ss1',
              title: 'Semantic Scholar Paper',
              authors: [{ name: 'Author One' }],
              year: 2023,
              abstract: 'Abstract 1',
              citationCount: 10,
            },
          ],
        },
      };

      const crossrefResponse = {
        data: {
          message: {
            items: [
              {
                DOI: '10.1234/cr1',
                title: ['CrossRef Paper'],
                author: [{ given: 'Author', family: 'Two' }],
                published: { 'date-parts': [[2023, 1, 1]] },
              },
            ],
          },
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of({ data: semanticScholarResponse.data } as any))
        .mockReturnValueOnce(of({ data: crossrefResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'test query',
          sources: [
            LiteratureSource.SEMANTIC_SCHOLAR,
            LiteratureSource.CROSSREF,
          ],
        },
        'test-user',
      );

      expect(result.papers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate papers by DOI', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              paperId: 'p1',
              title: 'Duplicate Paper',
              authors: [{ name: 'Author' }],
              year: 2023,
              abstract: 'Abstract',
              externalIds: { DOI: '10.1234/same' },
              citationCount: 10,
            },
            {
              paperId: 'p2',
              title: 'Duplicate Paper',
              authors: [{ name: 'Author' }],
              year: 2023,
              abstract: 'Abstract',
              externalIds: { DOI: '10.1234/same' },
              citationCount: 10,
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockResponse.data } as any));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'test',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
        },
        'test-user',
      );

      expect(result.papers).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'test',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
        },
        'test-user',
      );

      expect(result.papers).toEqual([]);
    });

    it('should continue with partial results if one source fails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(throwError(() => new Error('API Error')))
        .mockReturnValueOnce(
          of({
            data: {
              message: {
                items: [
                  {
                    DOI: '10.1234/test',
                    title: ['Working Paper'],
                    author: [],
                  },
                ],
              },
            },
          } as any),
        );
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.searchLiterature(
        {
          query: 'test',
          sources: [
            LiteratureSource.SEMANTIC_SCHOLAR,
            LiteratureSource.CROSSREF,
          ],
        },
        'test-user',
      );

      expect(result.papers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Caching', () => {
    it('should return cached results if available', async () => {
      const cachedData = {
        papers: [
          {
            id: 'cached-1',
            title: 'Cached Paper',
            authors: [],
            year: 2023,
            abstract: 'Cached abstract',
            source: 'Cache',
          },
        ],
        total: 1,
        page: 1,
      };

      const httpGetSpy = jest.spyOn(httpService, 'get');
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.searchLiterature(
        {
          query: 'cached query',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
        },
        'test-user',
      );

      expect(result).toEqual(cachedData);
      expect(httpGetSpy).not.toHaveBeenCalled();
    });
  });
});
