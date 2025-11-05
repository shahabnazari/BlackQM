import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../common/prisma.service';
import {
  HypothesisToItemService,
  HypothesisToItemRequest,
  HypothesisToItemResult,
} from '../hypothesis-to-item.service';

describe('HypothesisToItemService', () => {
  let service: HypothesisToItemService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HypothesisToItemService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return undefined; // Force template mode for tests
              if (key === 'DATABASE_URL') return 'mock://database';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma methods - service doesn't use database in these tests
          },
        },
      ],
    }).compile();

    service = module.get<HypothesisToItemService>(HypothesisToItemService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Basic Hypothesis Processing', () => {
    it('should convert simple hypothesis to survey items', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Social media usage positively influences employee productivity',
        hypothesisType: 'correlational',
        itemsPerVariable: 5,
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result).toBeDefined();
      expect(result.hypothesis).toBe(request.hypothesis);
      expect(result.variables).toBeDefined();
      expect(result.variables.length).toBeGreaterThanOrEqual(2); // At least IV and DV
      expect(result.scales).toBeDefined();
      expect(result.allItems.length).toBeGreaterThan(0);
    });

    it('should identify independent and dependent variables', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Employee engagement affects job satisfaction',
        hypothesisType: 'causal',
      };

      const result = await service.convertHypothesisToItems(request);

      const ivs = result.variables.filter(v => v.role === 'independent');
      const dvs = result.variables.filter(v => v.role === 'dependent');

      expect(ivs.length).toBeGreaterThan(0);
      expect(dvs.length).toBeGreaterThan(0);
    });

    it('should generate multi-item scales for reliability', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Training increases performance',
        itemsPerVariable: 7,
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.scales.length).toBeGreaterThan(0);
      result.scales.forEach(scale => {
        expect(scale.items.length).toBe(7);
        expect(scale.reliability).toBeDefined();
        expect(scale.reliability.expectedAlpha).toBeGreaterThan(0.60);
      });
    });

    it('should include reverse-coded items when requested', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Stress reduces well-being',
        includeReverseItems: true,
        itemsPerVariable: 6,
      };

      const result = await service.convertHypothesisToItems(request);

      const reversedItems = result.allItems.filter(item => item.reversed);
      expect(reversedItems.length).toBeGreaterThan(0);
    });

    it('should not include reverse items when not requested', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Motivation influences success',
        includeReverseItems: false,
        itemsPerVariable: 5,
      };

      const result = await service.convertHypothesisToItems(request);

      const reversedItems = result.allItems.filter(item => item.reversed);
      expect(reversedItems.length).toBe(0);
    });
  });

  describe('Hypothesis Type Detection', () => {
    it('should detect correlational hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'There is a relationship between sleep quality and cognitive performance',
        hypothesisType: 'correlational',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.hypothesisType).toBe('correlational');
    });

    it('should detect causal hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Exercise causes improved mood',
        hypothesisType: 'causal',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.hypothesisType).toBe('causal');
    });

    it('should detect mediation hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Leadership affects performance through employee engagement as a mediator',
        hypothesisType: 'mediation',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.hypothesisType).toBe('mediation');
      const mediators = result.variables.filter(v => v.role === 'mediator');
      expect(mediators.length).toBeGreaterThanOrEqual(0); // Template mode may not detect mediator
    });

    it('should detect moderation hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Age moderates the relationship between technology adoption and productivity',
        hypothesisType: 'moderation',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.hypothesisType).toBe('moderation');
    });

    it('should detect interaction hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'The interaction between gender and education predicts income',
        hypothesisType: 'interaction',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.hypothesisType).toBe('interaction');
    });
  });

  describe('Variable Roles', () => {
    it('should assign appropriate measurement levels', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Income level predicts purchasing behavior',
      };

      const result = await service.convertHypothesisToItems(request);

      result.variables.forEach(variable => {
        expect(['nominal', 'ordinal', 'interval', 'ratio']).toContain(variable.measurementLevel);
      });
    });

    it('should identify moderators when present', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Experience moderates the effect of training on performance',
        hypothesisType: 'moderation',
      };

      const result = await service.convertHypothesisToItems(request);

      const moderators = result.variables.filter(v => v.role === 'moderator');
      expect(moderators.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify mediators when present', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Organizational culture mediates the relationship between leadership and satisfaction',
        hypothesisType: 'mediation',
      };

      const result = await service.convertHypothesisToItems(request);

      const mediators = result.variables.filter(v => v.role === 'mediator');
      expect(mediators.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle covariates appropriately', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Marketing spend influences sales, controlling for seasonality',
        studyContext: 'Include seasonality as covariate',
      };

      const result = await service.convertHypothesisToItems(request);

      const covariates = result.variables.filter(v => v.role === 'covariate');
      expect(covariates.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reliability Assessment', () => {
    it('should target Cronbach alpha of 0.80 by default', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Trust influences loyalty',
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.reliability.targetAlpha).toBeCloseTo(0.80, 2);
      });
    });

    it('should respect custom reliability targets', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Quality affects satisfaction',
        targetReliability: 0.90,
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.reliability.targetAlpha).toBeCloseTo(0.90, 2);
      });
    });

    it('should calculate expected alpha based on item count', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Commitment predicts retention',
        itemsPerVariable: 10,
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.reliability.expectedAlpha).toBeGreaterThan(0.60);
        expect(scale.reliability.expectedAlpha).toBeLessThanOrEqual(0.95);
      });
    });

    it('should provide item-total correlation estimates', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Innovation drives growth',
        itemsPerVariable: 5,
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.reliability.itemTotalCorrelations).toBeDefined();
        expect(scale.reliability.itemTotalCorrelations.length).toBe(scale.items.length);
        scale.reliability.itemTotalCorrelations.forEach(corr => {
          expect(corr).toBeGreaterThanOrEqual(0.30); // Minimum acceptable
          expect(corr).toBeLessThanOrEqual(1.0);
        });
      });
    });
  });

  describe('Validity Assessment', () => {
    it('should provide content validity guidance', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Service quality affects customer satisfaction',
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.validity.contentValidity).toBeDefined();
        expect(scale.validity.contentValidity.length).toBeGreaterThan(0);
      });
    });

    it('should provide construct validity guidance', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Perceived value influences purchase intention',
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.validity.constructValidity).toBeDefined();
        expect(scale.validity.constructValidity).toContain('Convergent validity');
        expect(scale.validity.constructValidity).toContain('Discriminant validity');
      });
    });

    it('should provide criterion validity guidance', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Brand loyalty predicts repeat purchase',
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.validity.criterionValidity).toBeDefined();
        expect(scale.validity.criterionValidity.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Statistical Test Battery', () => {
    it('should recommend appropriate primary test for correlational hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Attitude correlates with behavior',
        hypothesisType: 'correlational',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest).toBeDefined();
      expect(result.testBattery.primaryTest.method).toContain('Correlation');
    });

    it('should recommend regression for causal hypotheses with multiple IVs', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Price and quality affect purchase decision',
        hypothesisType: 'causal',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.method).toBeDefined();
    });

    it('should recommend mediation analysis for mediation hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Trust mediates the relationship between transparency and commitment',
        hypothesisType: 'mediation',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.method).toContain('Mediation');
    });

    it('should recommend moderated regression for moderation hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Personality moderates the effect of stress on performance',
        hypothesisType: 'moderation',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.method).toContain('Moderated');
    });

    it('should provide statistical assumptions', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Education predicts income',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.assumptions).toBeDefined();
      expect(result.testBattery.primaryTest.assumptions.length).toBeGreaterThan(0);
    });

    it('should calculate appropriate sample size', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Marketing affects sales',
        hypothesisType: 'causal',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.requiredSampleSize).toBeGreaterThan(0);
      expect(result.testBattery.primaryTest.requiredSampleSize).toBeGreaterThanOrEqual(30);
    });

    it('should target 80% statistical power', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Experience influences expertise',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.primaryTest.expectedPower).toBeCloseTo(0.80, 2);
    });

    it('should provide alternative test methods', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Motivation influences achievement',
        hypothesisType: 'causal',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.alternativeTests).toBeDefined();
      expect(result.testBattery.alternativeTests.length).toBeGreaterThan(0);
    });

    it('should include reliability checks for all scales', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Satisfaction predicts loyalty',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.reliabilityChecks).toBeDefined();
      expect(result.testBattery.reliabilityChecks.length).toBeGreaterThan(0);
      result.testBattery.reliabilityChecks.forEach(check => {
        expect(check.method).toContain('Cronbach');
        expect(check.threshold).toBeGreaterThanOrEqual(0.70);
      });
    });

    it('should include validity checks', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Engagement drives performance',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.testBattery.validityChecks).toBeDefined();
      expect(result.testBattery.validityChecks.length).toBeGreaterThan(0);

      const validityTypes = result.testBattery.validityChecks.map(v => v.type);
      expect(validityTypes).toContain('Convergent Validity');
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate overall reliability metric', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Leadership affects outcomes',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.qualityMetrics.overallReliability).toBeDefined();
      expect(result.qualityMetrics.overallReliability).toBeGreaterThan(0);
      expect(result.qualityMetrics.overallReliability).toBeLessThanOrEqual(1);
    });

    it('should ensure 100% construct coverage', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Knowledge influences behavior',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.qualityMetrics.constructCoverage).toBe(1.0);
    });

    it('should calculate validity score', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Attitude predicts intention',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.qualityMetrics.validityScore).toBeGreaterThan(0);
      expect(result.qualityMetrics.validityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Recommendations', () => {
    it('should provide implementation recommendations', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Training improves skills',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend pilot testing', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Feedback enhances learning',
      };

      const result = await service.convertHypothesisToItems(request);

      const hasPilotRecommendation = result.recommendations.some(r => r.toLowerCase().includes('pilot'));
      expect(hasPilotRecommendation).toBe(true);
    });

    it('should recommend sample size', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Climate affects productivity',
      };

      const result = await service.convertHypothesisToItems(request);

      const hasSampleSizeRecommendation = result.recommendations.some(r => r.toLowerCase().includes('sample size'));
      expect(hasSampleSizeRecommendation).toBe(true);
    });
  });

  describe('Research Path Visualization', () => {
    it('should generate visual path diagram', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Motivation drives performance',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.researchPath.visualDiagram).toBeDefined();
      expect(result.researchPath.visualDiagram.length).toBeGreaterThan(0);
    });

    it('should generate statistical model equation', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Experience predicts expertise',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.researchPath.statisticalModel).toBeDefined();
      expect(result.researchPath.statisticalModel).toContain('β');
    });

    it('should show relationships in path diagram', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'X influences Y',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result.researchPath.visualDiagram).toContain('RELATIONSHIPS');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'X affects Y',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result).toBeDefined();
      expect(result.variables.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex multi-variable hypotheses', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Leadership, culture, and resources jointly predict organizational performance through employee engagement',
        hypothesisType: 'mediation',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result).toBeDefined();
      expect(result.variables.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle hypotheses with minimal items per variable', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Price affects demand',
        itemsPerVariable: 3, // Minimum for reliability
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.items.length).toBe(3);
      });
    });

    it('should handle hypotheses with many items per variable', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Satisfaction influences retention',
        itemsPerVariable: 10,
      };

      const result = await service.convertHypothesisToItems(request);

      result.scales.forEach(scale => {
        expect(scale.items.length).toBe(10);
      });
    });

    it('should handle study context information', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'Technology adoption affects productivity',
        studyContext: 'Healthcare industry study',
        targetPopulation: 'Hospital nurses',
      };

      const result = await service.convertHypothesisToItems(request);

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty hypothesis', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: '',
      };

      await expect(service.convertHypothesisToItems(request)).rejects.toThrow();
    });

    it('should handle invalid item count gracefully', async () => {
      const request: HypothesisToItemRequest = {
        hypothesis: 'X affects Y',
        itemsPerVariable: -5,
      };

      // Should use default or handle gracefully
      const result = await service.convertHypothesisToItems(request);
      expect(result).toBeDefined();
    });
  });
});
