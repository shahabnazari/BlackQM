/**
 * Phase 10.170: Purpose-Aware Config Service Tests
 *
 * Enterprise-grade test suite for PurposeAwareConfigService.
 * Tests configuration retrieval, validation, and security requirements.
 *
 * SECURITY TESTS (from PHASE_10.170_SECURITY_AUDIT_LOOPHOLES.md):
 * - Critical #1: API input validation
 * - Critical #2: No silent defaults (throws on invalid)
 * - Critical #6: Config validation on every access
 * - Critical #7: Paper limits bounds checking
 *
 * @module purpose-aware-config.service.spec
 * @since Phase 10.170
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PurposeAwareConfigService } from '../purpose-aware-config.service';
import {
  ResearchPurpose,
  RESEARCH_PURPOSES,
  validateQualityWeights,
  PAPER_LIMITS_BOUNDS,
} from '../../types/purpose-aware.types';

describe('PurposeAwareConfigService', () => {
  let service: PurposeAwareConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurposeAwareConfigService],
    }).compile();

    service = module.get<PurposeAwareConfigService>(PurposeAwareConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // BASIC FUNCTIONALITY TESTS
  // ==========================================================================

  describe('getConfig', () => {
    it('should return valid configuration for Q-methodology', () => {
      const config = service.getConfig(ResearchPurpose.Q_METHODOLOGY);

      expect(config).toBeDefined();
      expect(config.paperLimits.target).toBe(600);
      expect(config.paperLimits.max).toBe(800);
      expect(config.paperLimits.min).toBe(500);
      expect(config.diversityRequired).toBe(true);
      expect(config.scientificMethod).toContain('Stephenson');
    });

    it('should return valid configuration for Qualitative Analysis', () => {
      const config = service.getConfig(ResearchPurpose.QUALITATIVE_ANALYSIS);

      expect(config).toBeDefined();
      expect(config.paperLimits.target).toBe(100);
      expect(config.paperLimits.max).toBe(200);
      expect(config.contentPriority).toBe('high');
      expect(config.scientificMethod).toContain('Braun & Clarke');
    });

    it('should return valid configuration for Literature Synthesis', () => {
      const config = service.getConfig(ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(config).toBeDefined();
      expect(config.paperLimits.target).toBe(450);
      expect(config.contentPriority).toBe('critical');
      expect(config.fullTextRequirement.strictRequirement).toBe(true);
      expect(config.scientificMethod).toContain('Noblit & Hare');
    });

    it('should return valid configuration for Hypothesis Generation', () => {
      const config = service.getConfig(ResearchPurpose.HYPOTHESIS_GENERATION);

      expect(config).toBeDefined();
      expect(config.paperLimits.target).toBe(150);
      expect(config.fullTextRequirement.strictRequirement).toBe(true);
      expect(config.scientificMethod).toContain('Glaser & Strauss');
    });

    it('should return valid configuration for Survey Construction', () => {
      const config = service.getConfig(ResearchPurpose.SURVEY_CONSTRUCTION);

      expect(config).toBeDefined();
      expect(config.paperLimits.target).toBe(150);
      expect(config.validation.minDistinctiveness).toBe(0.25);
      expect(config.scientificMethod).toContain('Churchill');
    });

    it('should return configs for all research purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const config = service.getConfig(purpose);
        expect(config).toBeDefined();
        expect(config.paperLimits).toBeDefined();
        expect(config.qualityWeights).toBeDefined();
        expect(config.qualityThreshold).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // QUALITY WEIGHTS TESTS
  // ==========================================================================

  describe('getQualityWeights', () => {
    it('should have weights summing to 1.0 for all purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const weights = service.getQualityWeights(purpose);
        expect(validateQualityWeights(weights)).toBe(true);
      }
    });

    it('should have ZERO journal weight for Q-methodology (Einstein Insight)', () => {
      const weights = service.getQualityWeights(ResearchPurpose.Q_METHODOLOGY);
      expect(weights.journal).toBe(0.00);
    });

    it('should have journal weight >= 0.15 for non-Q-methodology purposes', () => {
      const otherPurposes = RESEARCH_PURPOSES.filter(
        p => p !== ResearchPurpose.Q_METHODOLOGY,
      );

      for (const purpose of otherPurposes) {
        const weights = service.getQualityWeights(purpose);
        expect(weights.journal).toBeGreaterThanOrEqual(0.15);
      }
    });

    it('should have diversity weight only for Q-methodology', () => {
      const qWeights = service.getQualityWeights(ResearchPurpose.Q_METHODOLOGY);
      expect(qWeights.diversity).toBeDefined();
      expect(qWeights.diversity).toBe(0.30);

      // Other purposes should not have diversity weight
      const otherPurposes = RESEARCH_PURPOSES.filter(
        p => p !== ResearchPurpose.Q_METHODOLOGY,
      );

      for (const purpose of otherPurposes) {
        const weights = service.getQualityWeights(purpose);
        expect(weights.diversity).toBeUndefined();
      }
    });
  });

  // ==========================================================================
  // PAPER LIMITS TESTS (Critical #7)
  // ==========================================================================

  describe('getPaperLimits', () => {
    it('should validate paper limits bounds for all purposes (Critical #7)', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const limits = service.getPaperLimits(purpose);

        expect(limits.min).toBeGreaterThanOrEqual(PAPER_LIMITS_BOUNDS.ABSOLUTE_MIN);
        expect(limits.target).toBeGreaterThanOrEqual(limits.min);
        expect(limits.max).toBeGreaterThanOrEqual(limits.target);
        expect(limits.max).toBeLessThanOrEqual(PAPER_LIMITS_BOUNDS.ABSOLUTE_MAX);
      }
    });

    it('should have higher paper limits for breadth-focused purposes', () => {
      const qLimits = service.getPaperLimits(ResearchPurpose.Q_METHODOLOGY);
      const synthesisLimits = service.getPaperLimits(ResearchPurpose.LITERATURE_SYNTHESIS);
      const qualLimits = service.getPaperLimits(ResearchPurpose.QUALITATIVE_ANALYSIS);

      // Q-methodology and literature synthesis need more papers
      expect(qLimits.target).toBeGreaterThan(qualLimits.target);
      expect(synthesisLimits.target).toBeGreaterThan(qualLimits.target);
    });
  });

  // ==========================================================================
  // FULL-TEXT REQUIREMENT TESTS
  // ==========================================================================

  describe('Full-text requirements', () => {
    it('should not require full-text for Q-methodology', () => {
      expect(service.isFullTextRequired(ResearchPurpose.Q_METHODOLOGY)).toBe(false);
      expect(service.getMinFullTextRequired(ResearchPurpose.Q_METHODOLOGY)).toBe(0);
    });

    it('should require full-text for Literature Synthesis', () => {
      expect(service.isFullTextRequired(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(true);
      expect(service.getMinFullTextRequired(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(10);
    });

    it('should require full-text for Hypothesis Generation', () => {
      expect(service.isFullTextRequired(ResearchPurpose.HYPOTHESIS_GENERATION)).toBe(true);
      expect(service.getMinFullTextRequired(ResearchPurpose.HYPOTHESIS_GENERATION)).toBe(8);
    });

    it('should have valid full-text boost values', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const boost = service.getFullTextBoost(purpose);
        expect(boost).toBeGreaterThanOrEqual(0);
        expect(boost).toBeLessThanOrEqual(50);
      }
    });
  });

  // ==========================================================================
  // SECURITY TESTS (Critical #1, #2)
  // ==========================================================================

  describe('Security: Invalid input handling (Critical #1, #2)', () => {
    it('should throw BadRequestException for invalid purpose string', () => {
      expect(() => service.getConfig('invalid' as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for SQL injection attempt', () => {
      expect(() =>
        service.getConfig("'; DROP TABLE papers; --" as ResearchPurpose),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty string', () => {
      expect(() => service.getConfig('' as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for null', () => {
      expect(() => service.getConfig(null as unknown as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for undefined', () => {
      expect(() => service.getConfig(undefined as unknown as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for numeric input', () => {
      expect(() => service.getConfig(123 as unknown as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for object input', () => {
      expect(() => service.getConfig({} as unknown as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });

    it('should include valid values in error message', () => {
      try {
        service.getConfig('invalid' as ResearchPurpose);
        fail('Should have thrown');
      } catch (error) {
        expect((error as BadRequestException).message).toContain('q_methodology');
        expect((error as BadRequestException).message).toContain('qualitative_analysis');
      }
    });
  });

  // ==========================================================================
  // CONFIG OVERRIDE TESTS
  // ==========================================================================

  describe('getConfigWithOverrides', () => {
    it('should apply paper limits override', () => {
      const resolved = service.getConfigWithOverrides(
        ResearchPurpose.QUALITATIVE_ANALYSIS,
        { paperLimits: { target: 200 } },
      );

      expect(resolved.paperLimits.target).toBe(200);
      expect(resolved.hasOverrides).toBe(true);
      expect(resolved.appliedOverrides.some(s => s.includes('paperLimits'))).toBe(true);
    });

    it('should apply quality threshold override', () => {
      const resolved = service.getConfigWithOverrides(
        ResearchPurpose.QUALITATIVE_ANALYSIS,
        { qualityThreshold: 50 },
      );

      expect(resolved.qualityThreshold.initial).toBe(50);
      expect(resolved.hasOverrides).toBe(true);
    });

    it('should apply full-text override', () => {
      const resolved = service.getConfigWithOverrides(
        ResearchPurpose.Q_METHODOLOGY,
        { forceFullText: true },
      );

      expect(resolved.fullTextRequirement.strictRequirement).toBe(true);
      expect(resolved.hasOverrides).toBe(true);
    });

    it('should reject invalid paper limits override', () => {
      expect(() =>
        service.getConfigWithOverrides(ResearchPurpose.QUALITATIVE_ANALYSIS, {
          paperLimits: { min: 200, target: 100 }, // min > target - invalid
        }),
      ).toThrow(BadRequestException);
    });

    it('should reject out-of-bounds quality threshold override', () => {
      expect(() =>
        service.getConfigWithOverrides(ResearchPurpose.QUALITATIVE_ANALYSIS, {
          qualityThreshold: 150, // > 100 - invalid
        }),
      ).toThrow(BadRequestException);
    });

    it('should reject out-of-bounds full-text boost override', () => {
      expect(() =>
        service.getConfigWithOverrides(ResearchPurpose.QUALITATIVE_ANALYSIS, {
          fullTextBoost: 100, // > 50 - invalid
        }),
      ).toThrow(BadRequestException);
    });

    it('should return base config when no overrides provided', () => {
      const resolved = service.getConfigWithOverrides(
        ResearchPurpose.QUALITATIVE_ANALYSIS,
      );

      expect(resolved.hasOverrides).toBe(false);
      expect(resolved.appliedOverrides).toHaveLength(0);
    });
  });

  // ==========================================================================
  // METADATA TESTS
  // ==========================================================================

  describe('getMetadata', () => {
    it('should return metadata for all purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const metadata = service.getMetadata(purpose);

        expect(metadata).toBeDefined();
        expect(metadata.purpose).toBe(purpose);
        expect(metadata.displayName).toBeDefined();
        expect(metadata.description).toBeDefined();
        expect(metadata.scientificFoundation).toBeDefined();
        expect(metadata.characteristics).toBeDefined();
        expect(metadata.useCases).toBeDefined();
      }
    });

    it('should throw for invalid purpose', () => {
      expect(() => service.getMetadata('invalid' as ResearchPurpose)).toThrow(
        BadRequestException,
      );
    });
  });

  // ==========================================================================
  // UTILITY TESTS
  // ==========================================================================

  describe('isValidPurpose', () => {
    it('should return true for valid purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        expect(service.isValidPurpose(purpose)).toBe(true);
      }
    });

    it('should return false for invalid values', () => {
      expect(service.isValidPurpose('invalid')).toBe(false);
      expect(service.isValidPurpose('')).toBe(false);
      expect(service.isValidPurpose(null)).toBe(false);
      expect(service.isValidPurpose(undefined)).toBe(false);
      expect(service.isValidPurpose(123)).toBe(false);
    });
  });

  describe('parsePurpose', () => {
    it('should parse valid purpose strings', () => {
      expect(service.parsePurpose('q_methodology')).toBe(ResearchPurpose.Q_METHODOLOGY);
      expect(service.parsePurpose('qualitative_analysis')).toBe(
        ResearchPurpose.QUALITATIVE_ANALYSIS,
      );
    });

    it('should throw for invalid purpose strings', () => {
      expect(() => service.parsePurpose('invalid')).toThrow(BadRequestException);
    });
  });

  describe('getAllPurposes', () => {
    it('should return all 5 purposes', () => {
      const allPurposes = service.getAllPurposes();

      expect(allPurposes).toHaveLength(5);
      expect(allPurposes.map(p => p.purpose)).toEqual(
        expect.arrayContaining([...RESEARCH_PURPOSES]),
      );
    });
  });

  describe('compareConfigs', () => {
    it('should identify differences between Q-methodology and Qualitative Analysis', () => {
      const comparison = service.compareConfigs(
        ResearchPurpose.Q_METHODOLOGY,
        ResearchPurpose.QUALITATIVE_ANALYSIS,
      );

      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.differences.some(s => s.includes('Journal weight'))).toBe(true);
      expect(comparison.differences.some(s => s.includes('Paper target'))).toBe(true);
    });
  });

  // ==========================================================================
  // VALIDATION THRESHOLD TESTS
  // ==========================================================================

  describe('getValidationThresholds', () => {
    it('should have valid thresholds for all purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const thresholds = service.getValidationThresholds(purpose);

        expect(thresholds.minSources).toBeGreaterThanOrEqual(1);
        expect(thresholds.minCoherence).toBeGreaterThanOrEqual(0);
        expect(thresholds.minCoherence).toBeLessThanOrEqual(1);
        expect(thresholds.minDistinctiveness).toBeGreaterThanOrEqual(0);
        expect(thresholds.minDistinctiveness).toBeLessThanOrEqual(1);
      }
    });

    it('should have higher distinctiveness for Survey Construction', () => {
      const surveyThresholds = service.getValidationThresholds(
        ResearchPurpose.SURVEY_CONSTRUCTION,
      );
      const qThresholds = service.getValidationThresholds(
        ResearchPurpose.Q_METHODOLOGY,
      );

      expect(surveyThresholds.minDistinctiveness).toBeGreaterThan(
        qThresholds.minDistinctiveness,
      );
    });
  });

  // ==========================================================================
  // TARGET THEMES TESTS
  // ==========================================================================

  describe('getTargetThemes', () => {
    it('should have more target themes for Q-methodology', () => {
      const qThemes = service.getTargetThemes(ResearchPurpose.Q_METHODOLOGY);
      const qualThemes = service.getTargetThemes(
        ResearchPurpose.QUALITATIVE_ANALYSIS,
      );

      expect(qThemes.max).toBeGreaterThan(qualThemes.max);
    });

    it('should have valid theme ranges for all purposes', () => {
      for (const purpose of RESEARCH_PURPOSES) {
        const themes = service.getTargetThemes(purpose);

        expect(themes.min).toBeGreaterThanOrEqual(1);
        expect(themes.max).toBeGreaterThanOrEqual(themes.min);
        expect(themes.max).toBeLessThanOrEqual(200);
      }
    });
  });

  // ==========================================================================
  // CONTENT PRIORITY TESTS
  // ==========================================================================

  describe('getContentPriority', () => {
    it('should return low priority for Q-methodology', () => {
      expect(service.getContentPriority(ResearchPurpose.Q_METHODOLOGY)).toBe('low');
    });

    it('should return critical priority for Literature Synthesis', () => {
      expect(service.getContentPriority(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(
        'critical',
      );
    });

    it('should return high priority for content-first purposes', () => {
      expect(service.getContentPriority(ResearchPurpose.QUALITATIVE_ANALYSIS)).toBe(
        'high',
      );
      expect(service.getContentPriority(ResearchPurpose.HYPOTHESIS_GENERATION)).toBe(
        'high',
      );
      expect(service.getContentPriority(ResearchPurpose.SURVEY_CONSTRUCTION)).toBe(
        'high',
      );
    });
  });

  // ==========================================================================
  // MIN WORD COUNT TESTS
  // ==========================================================================

  describe('getMinWordCount', () => {
    it('should return 200 for Q-methodology (abstracts sufficient)', () => {
      expect(service.getMinWordCount(ResearchPurpose.Q_METHODOLOGY)).toBe(200);
    });

    it('should return 3000 for Literature Synthesis (full-text required)', () => {
      expect(service.getMinWordCount(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(3000);
    });

    it('should return 1000 for high-priority purposes', () => {
      expect(service.getMinWordCount(ResearchPurpose.QUALITATIVE_ANALYSIS)).toBe(1000);
      expect(service.getMinWordCount(ResearchPurpose.HYPOTHESIS_GENERATION)).toBe(1000);
      expect(service.getMinWordCount(ResearchPurpose.SURVEY_CONSTRUCTION)).toBe(1000);
    });
  });

  // ==========================================================================
  // DIVERSITY TESTS
  // ==========================================================================

  describe('isDiversityRequired', () => {
    it('should require diversity for Q-methodology', () => {
      expect(service.isDiversityRequired(ResearchPurpose.Q_METHODOLOGY)).toBe(true);
    });

    it('should require diversity for Literature Synthesis', () => {
      expect(service.isDiversityRequired(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(
        true,
      );
    });

    it('should not require diversity for other purposes', () => {
      expect(service.isDiversityRequired(ResearchPurpose.QUALITATIVE_ANALYSIS)).toBe(
        false,
      );
      expect(service.isDiversityRequired(ResearchPurpose.HYPOTHESIS_GENERATION)).toBe(
        false,
      );
      expect(service.isDiversityRequired(ResearchPurpose.SURVEY_CONSTRUCTION)).toBe(
        false,
      );
    });
  });

  describe('getDiversityWeight', () => {
    it('should return 0.30 for Q-methodology', () => {
      expect(service.getDiversityWeight(ResearchPurpose.Q_METHODOLOGY)).toBe(0.30);
    });

    it('should return 0 for purposes without diversity weight', () => {
      expect(service.getDiversityWeight(ResearchPurpose.QUALITATIVE_ANALYSIS)).toBe(0);
      expect(service.getDiversityWeight(ResearchPurpose.LITERATURE_SYNTHESIS)).toBe(0);
    });
  });
});
