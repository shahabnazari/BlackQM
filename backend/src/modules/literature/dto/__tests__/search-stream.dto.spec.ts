/**
 * Search Stream DTO Tests
 * Phase 10.115/10.116: Netflix-Grade Timeout Configuration Tests
 *
 * Tests focus on:
 * - Timeout configuration consistency
 * - PMC tier configuration
 * - Timeout alignment with AdaptiveTimeoutService
 */

import {
  DEFAULT_STREAM_CONFIG,
  SOURCE_TIER_CONFIG,
  SourceTier,
} from '../search-stream.dto';
import { LiteratureSource } from '../literature.dto';

describe('SearchStreamDTO', () => {
  describe('DEFAULT_STREAM_CONFIG', () => {
    it('should have valid timeout configurations', () => {
      expect(DEFAULT_STREAM_CONFIG.fastSourceTimeoutMs).toBeDefined();
      expect(DEFAULT_STREAM_CONFIG.mediumSourceTimeoutMs).toBeDefined();
      expect(DEFAULT_STREAM_CONFIG.slowSourceTimeoutMs).toBeDefined();
    });

    it('should have timeouts in ascending order (fast < medium < slow)', () => {
      const { fastSourceTimeoutMs, mediumSourceTimeoutMs, slowSourceTimeoutMs } = DEFAULT_STREAM_CONFIG;

      expect(fastSourceTimeoutMs).toBeLessThan(mediumSourceTimeoutMs);
      expect(mediumSourceTimeoutMs).toBeLessThan(slowSourceTimeoutMs);
    });

    /**
     * Phase 10.116: slowSourceTimeoutMs must be >= 65s for PMC
     * PMC needs 65s for full-text XML fetching (esearch + 2 batches of efetch)
     */
    it('should have slowSourceTimeoutMs >= 65s for PMC compatibility', () => {
      const PMC_TIMEOUT_MS = 65000; // From AdaptiveTimeoutService.DEFAULT_TIMEOUTS['search:pmc']

      expect(DEFAULT_STREAM_CONFIG.slowSourceTimeoutMs).toBeGreaterThanOrEqual(PMC_TIMEOUT_MS);
    });

    it('should have reasonable batch configuration', () => {
      expect(DEFAULT_STREAM_CONFIG.minBatchSize).toBeGreaterThan(0);
      expect(DEFAULT_STREAM_CONFIG.maxBatchWaitMs).toBeGreaterThan(0);
    });

    it('should have valid enrichment configuration', () => {
      expect(DEFAULT_STREAM_CONFIG.enrichBatchSize).toBeGreaterThan(0);
      expect(typeof DEFAULT_STREAM_CONFIG.enrichOnView).toBe('boolean');
    });

    it('should have minimum papers threshold for ranking', () => {
      expect(DEFAULT_STREAM_CONFIG.minPapersBeforeRanking).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SOURCE_TIER_CONFIG', () => {
    /**
     * Phase 10.115: PMC should be in SLOW tier
     * PMC is inherently slow due to batched XML parsing
     */
    it('should have PMC in SLOW tier', () => {
      expect(SOURCE_TIER_CONFIG[LiteratureSource.PMC]).toBeDefined();
      expect(SOURCE_TIER_CONFIG[LiteratureSource.PMC].tier).toBe(SourceTier.SLOW);
    });

    /**
     * Phase 10.116: PMC expected time should be realistic (~35s)
     * With parallel batch processing: 25-40s for 300+ papers
     */
    it('should have realistic PMC expected time', () => {
      const pmcConfig = SOURCE_TIER_CONFIG[LiteratureSource.PMC];

      // PMC expected time should be between 25-45s
      expect(pmcConfig.expectedMs).toBeGreaterThanOrEqual(25000);
      expect(pmcConfig.expectedMs).toBeLessThanOrEqual(45000);
    });

    it('should have all major sources configured', () => {
      const expectedSources = [
        LiteratureSource.PUBMED,
        LiteratureSource.PMC,
        LiteratureSource.SEMANTIC_SCHOLAR,
        LiteratureSource.CROSSREF,
        LiteratureSource.OPENALEX,
        LiteratureSource.ARXIV,
      ];

      for (const source of expectedSources) {
        expect(SOURCE_TIER_CONFIG[source]).toBeDefined();
        expect(SOURCE_TIER_CONFIG[source].tier).toBeDefined();
        expect(SOURCE_TIER_CONFIG[source].expectedMs).toBeDefined();
      }
    });

    it('should have PubMed in SLOW tier (NCBI E-utilities)', () => {
      expect(SOURCE_TIER_CONFIG[LiteratureSource.PUBMED].tier).toBe(SourceTier.SLOW);
    });

    it('should have Semantic Scholar in MEDIUM tier', () => {
      expect(SOURCE_TIER_CONFIG[LiteratureSource.SEMANTIC_SCHOLAR].tier).toBe(SourceTier.MEDIUM);
    });

    it('should have CrossRef in FAST tier', () => {
      expect(SOURCE_TIER_CONFIG[LiteratureSource.CROSSREF].tier).toBe(SourceTier.FAST);
    });

    it('should have OpenAlex in FAST tier', () => {
      expect(SOURCE_TIER_CONFIG[LiteratureSource.OPENALEX].tier).toBe(SourceTier.FAST);
    });

    it('should have expected times within reasonable bounds', () => {
      for (const [source, config] of Object.entries(SOURCE_TIER_CONFIG)) {
        expect(config.expectedMs).toBeGreaterThan(0);
        expect(config.expectedMs).toBeLessThanOrEqual(60000); // Max 60s expected time
      }
    });
  });

  describe('SourceTier enum', () => {
    it('should have all tier levels defined', () => {
      expect(SourceTier.FAST).toBeDefined();
      expect(SourceTier.MEDIUM).toBeDefined();
      expect(SourceTier.SLOW).toBeDefined();
    });
  });

  describe('timeout consistency', () => {
    /**
     * Phase 10.116: Ensure timeout configuration is consistent
     * slowSourceTimeoutMs should accommodate the longest expected source + buffer
     */
    it('should have slowSourceTimeoutMs > longest expected time + buffer', () => {
      // Find the maximum expected time across all sources
      let maxExpectedMs = 0;
      for (const config of Object.values(SOURCE_TIER_CONFIG)) {
        maxExpectedMs = Math.max(maxExpectedMs, config.expectedMs);
      }

      // Slow timeout should be at least expectedMs + 20s buffer
      const minimumSlowTimeout = maxExpectedMs + 20000;
      expect(DEFAULT_STREAM_CONFIG.slowSourceTimeoutMs).toBeGreaterThanOrEqual(minimumSlowTimeout);
    });

    it('should have tier timeouts match tier expected times', () => {
      // FAST tier sources should complete within fastSourceTimeoutMs
      for (const [source, config] of Object.entries(SOURCE_TIER_CONFIG)) {
        if (config.tier === SourceTier.FAST) {
          expect(config.expectedMs).toBeLessThan(DEFAULT_STREAM_CONFIG.fastSourceTimeoutMs);
        }
        if (config.tier === SourceTier.MEDIUM) {
          expect(config.expectedMs).toBeLessThan(DEFAULT_STREAM_CONFIG.mediumSourceTimeoutMs);
        }
        if (config.tier === SourceTier.SLOW) {
          expect(config.expectedMs).toBeLessThan(DEFAULT_STREAM_CONFIG.slowSourceTimeoutMs);
        }
      }
    });
  });
});
