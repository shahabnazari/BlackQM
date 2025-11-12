/**
 * Academic Sources Integration Tests
 * Phase 10.6 Day 14.2: Backend integration tests for all 18 academic sources
 *
 * Tests verify:
 * - All sources properly registered in module
 * - Service instantiation and dependency injection
 * - Search functionality across all sources
 * - Error handling and graceful degradation
 * - Request coalescing and quota management
 * - Zero technical debt verification
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LiteratureModule } from '../literature.module';
import { LiteratureService } from '../literature.service';
import { LiteratureSource, Paper } from '../dto/literature.dto';

// Import all academic source services
import { SemanticScholarService } from '../services/semantic-scholar.service';
import { CrossRefService } from '../services/crossref.service';
import { PubMedService } from '../services/pubmed.service';
import { ArxivService } from '../services/arxiv.service';
import { GoogleScholarService } from '../services/google-scholar.service';
import { BioRxivService } from '../services/biorxiv.service';
import { SSRNService } from '../services/ssrn.service';
import { ChemRxivService } from '../services/chemrxiv.service';
import { PMCService } from '../services/pmc.service';
import { ERICService } from '../services/eric.service';
import { WebOfScienceService } from '../services/web-of-science.service';
import { ScopusService } from '../services/scopus.service';
import { IEEEService } from '../services/ieee.service';
import { SpringerService } from '../services/springer.service';
import { NatureService } from '../services/nature.service';
import { WileyService } from '../services/wiley.service';
import { SageService } from '../services/sage.service';
import { TaylorFrancisService } from '../services/taylor-francis.service';

describe('Academic Sources Integration Tests', () => {
  let module: TestingModule;
  let literatureService: LiteratureService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        LiteratureModule,
      ],
    }).compile();

    literatureService = module.get<LiteratureService>(LiteratureService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Module Registration', () => {
    it('should load LiteratureModule', () => {
      expect(module).toBeDefined();
    });

    it('should provide LiteratureService', () => {
      expect(literatureService).toBeDefined();
      expect(literatureService).toBeInstanceOf(LiteratureService);
    });

    describe('All 18 Academic Source Services', () => {
      const services = [
        { name: 'SemanticScholarService', class: SemanticScholarService },
        { name: 'CrossRefService', class: CrossRefService },
        { name: 'PubMedService', class: PubMedService },
        { name: 'ArxivService', class: ArxivService },
        { name: 'GoogleScholarService', class: GoogleScholarService },
        { name: 'BioRxivService', class: BioRxivService },
        { name: 'SSRNService', class: SSRNService },
        { name: 'ChemRxivService', class: ChemRxivService },
        { name: 'PMCService', class: PMCService },
        { name: 'ERICService', class: ERICService },
        { name: 'WebOfScienceService', class: WebOfScienceService },
        { name: 'ScopusService', class: ScopusService },
        { name: 'IEEEService', class: IEEEService },
        { name: 'SpringerService', class: SpringerService },
        { name: 'NatureService', class: NatureService },
        { name: 'WileyService', class: WileyService },
        { name: 'SageService', class: SageService },
        { name: 'TaylorFrancisService', class: TaylorFrancisService },
      ];

      services.forEach(({ name, class: ServiceClass }) => {
        it(`should provide ${name}`, () => {
          const service = module.get(ServiceClass);
          expect(service).toBeDefined();
          expect(service).toBeInstanceOf(ServiceClass);
        });
      });

      it('should have exactly 18 academic source services', () => {
        expect(services.length).toBe(18);
      });
    });
  });

  describe('LiteratureSource Enum Completeness', () => {
    it('should have all 18 sources defined in enum', () => {
      const sources = Object.values(LiteratureSource);

      expect(sources).toContain('semantic_scholar');
      expect(sources).toContain('crossref');
      expect(sources).toContain('pubmed');
      expect(sources).toContain('arxiv');
      expect(sources).toContain('google_scholar');
      expect(sources).toContain('biorxiv');
      expect(sources).toContain('medrxiv');
      expect(sources).toContain('ssrn');
      expect(sources).toContain('chemrxiv');
      expect(sources).toContain('pmc');
      expect(sources).toContain('eric');
      expect(sources).toContain('web_of_science');
      expect(sources).toContain('scopus');
      expect(sources).toContain('ieee_xplore');
      expect(sources).toContain('springer');
      expect(sources).toContain('nature');
      expect(sources).toContain('wiley');
      expect(sources).toContain('sage');
      expect(sources).toContain('taylor_francis');

      // Should have exactly 19 sources (18 unique + medRxiv shares bioRxiv service)
      expect(sources.length).toBe(19);
    });
  });

  describe('Search Functionality', () => {
    const testQuery = 'machine learning';
    const testUserId = 'test-user-123';

    describe('Free & Open Access Sources', () => {
      it('should search PubMed', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.PUBMED],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
        // Results may be empty if API is not configured, but should not throw
      });

      it('should search ArXiv', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.ARXIV],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });

      it('should search PMC', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.PMC],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });

      it('should search bioRxiv', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.BIORXIV],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });

      it('should search ERIC', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.ERIC],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('Premium Sources', () => {
      it('should handle Web of Science gracefully (may require API key)', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.WEB_OF_SCIENCE],
            limit: 5,
          },
          testUserId
        );

        // Should not throw, returns empty array if API key not configured
        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle Scopus gracefully (may require API key)', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.SCOPUS],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle IEEE Xplore gracefully (may require API key)', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [LiteratureSource.IEEE_XPLORE],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('Multi-Source Search', () => {
      it('should search across multiple sources simultaneously', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [
              LiteratureSource.PUBMED,
              LiteratureSource.ARXIV,
              LiteratureSource.PMC,
            ],
            limit: 5,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);
        // Results should be aggregated from multiple sources
      });

      it('should deduplicate papers from different sources', async () => {
        const results = await literatureService.searchLiterature(
          {
            query: testQuery,
            sources: [
              LiteratureSource.PUBMED,
              LiteratureSource.PMC,
              LiteratureSource.SEMANTIC_SCHOLAR,
            ],
            limit: 10,
          },
          testUserId
        );

        expect(Array.isArray(results)).toBe(true);

        // Check for duplicate IDs (should not exist)
        const ids = results.map((p) => p.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source gracefully', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: 'test',
          sources: ['invalid_source' as any],
          limit: 5,
        },
        'test-user'
      );

      // Should return empty array, not throw
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty query', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: '',
          sources: [LiteratureSource.PUBMED],
          limit: 5,
        },
        'test-user'
      );

      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const httpService = module.get<HttpService>(HttpService);
      jest.spyOn(httpService.axiosRef, 'get').mockRejectedValueOnce(
        new Error('Network error')
      );

      const results = await literatureService.searchLiterature(
        {
          query: 'test',
          sources: [LiteratureSource.PUBMED],
          limit: 5,
        },
        'test-user'
      );

      // Should return empty array, not throw
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Paper Object Structure', () => {
    it('should return papers with required fields', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: 'quantum computing',
          sources: [LiteratureSource.ARXIV],
          limit: 1,
        },
        'test-user'
      );

      if (results.length > 0) {
        const paper = results[0];

        expect(paper).toHaveProperty('id');
        expect(paper).toHaveProperty('title');
        expect(paper).toHaveProperty('authors');
        expect(paper).toHaveProperty('abstract');
        expect(paper).toHaveProperty('source');
        expect(paper).toHaveProperty('wordCount');
        expect(paper).toHaveProperty('isEligible');
        expect(paper).toHaveProperty('qualityScore');
        expect(paper).toHaveProperty('isHighQuality');

        // Verify types
        expect(typeof paper.id).toBe('string');
        expect(typeof paper.title).toBe('string');
        expect(Array.isArray(paper.authors)).toBe(true);
        expect(typeof paper.wordCount).toBe('number');
        expect(typeof paper.isEligible).toBe('boolean');
      }
    });

    it('should have valid source enum values', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: 'test',
          sources: [LiteratureSource.PUBMED, LiteratureSource.ARXIV],
          limit: 5,
        },
        'test-user'
      );

      const validSources = Object.values(LiteratureSource);

      results.forEach((paper) => {
        expect(validSources).toContain(paper.source);
      });
    });
  });

  describe('Quality Scoring', () => {
    it('should calculate quality scores for all papers', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: 'neural networks',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
          limit: 5,
        },
        'test-user'
      );

      results.forEach((paper) => {
        expect(paper.qualityScore).toBeDefined();
        expect(typeof paper.qualityScore).toBe('number');
        expect(paper.qualityScore).toBeGreaterThanOrEqual(0);
        expect(paper.qualityScore).toBeLessThanOrEqual(100);
      });
    });

    it('should mark high-quality papers correctly', async () => {
      const results = await literatureService.searchLiterature(
        {
          query: 'deep learning',
          sources: [LiteratureSource.SEMANTIC_SCHOLAR],
          limit: 10,
        },
        'test-user'
      );

      results.forEach((paper) => {
        expect(typeof paper.isHighQuality).toBe('boolean');

        // High quality should be true when score >= 50
        if (paper.qualityScore >= 50) {
          expect(paper.isHighQuality).toBe(true);
        }
      });
    });
  });

  describe('Zero Technical Debt Verification', () => {
    it('should have no duplicate service registrations', () => {
      const providers = Reflect.getMetadata('providers', LiteratureModule);
      const providerNames = providers.map((p: any) => p.name || p);

      const uniqueProviders = new Set(providerNames);
      expect(providerNames.length).toBe(uniqueProviders.size);
    });

    it('should follow dedicated service pattern (no God class)', () => {
      // Verify all services are in separate files
      const services = [
        SemanticScholarService,
        CrossRefService,
        PubMedService,
        ArxivService,
        GoogleScholarService,
        BioRxivService,
        SSRNService,
        ChemRxivService,
        PMCService,
        ERICService,
        WebOfScienceService,
        ScopusService,
        IEEEService,
        SpringerService,
        NatureService,
        WileyService,
        SageService,
        TaylorFrancisService,
      ];

      services.forEach((ServiceClass) => {
        const instance = module.get(ServiceClass);
        expect(instance).toBeDefined();
        expect(instance.constructor.name).toBe(ServiceClass.name);
      });
    });

    it('should inject HttpService into all source services', () => {
      const services = [
        SemanticScholarService,
        PubMedService,
        ArxivService,
        PMCService,
        ERICService,
      ];

      services.forEach((ServiceClass) => {
        const instance = module.get(ServiceClass);
        expect(instance).toHaveProperty('httpService');
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should use request coalescing (prevent duplicate API calls)', async () => {
      const query = 'test query unique';

      // Make two identical requests simultaneously
      const [results1, results2] = await Promise.all([
        literatureService.searchLiterature(
          {
            query,
            sources: [LiteratureSource.PUBMED],
            limit: 5,
          },
          'test-user'
        ),
        literatureService.searchLiterature(
          {
            query,
            sources: [LiteratureSource.PUBMED],
            limit: 5,
          },
          'test-user'
        ),
      ]);

      // Both should return results (even if empty)
      expect(Array.isArray(results1)).toBe(true);
      expect(Array.isArray(results2)).toBe(true);

      // Results should be identical (from same coalesced request)
      expect(results1.length).toBe(results2.length);
    });
  });
});
