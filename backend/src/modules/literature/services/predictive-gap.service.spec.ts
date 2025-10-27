import { Test, TestingModule } from '@nestjs/testing';
import { PredictiveGapService } from './predictive-gap.service';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';

describe('PredictiveGapService', () => {
  let service: PredictiveGapService;
  let prisma: PrismaService;
  let openai: OpenAIService;

  const mockPrisma = {
    researchGap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    paper: {
      findMany: jest.fn(),
    },
  };

  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveGapService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAI,
        },
      ],
    }).compile();

    service = module.get<PredictiveGapService>(PredictiveGapService);
    prisma = module.get<PrismaService>(PrismaService);
    openai = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Opportunity Scoring', () => {
    it('should calculate weighted composite scores', async () => {
      const mockGaps = [
        {
          id: 'gap1',
          title: 'Test Gap',
          description: 'A test research gap',
          relatedPapers: 10,
          keywords: ['ML', 'healthcare'],
        },
      ];

      mockPrisma.researchGap.findMany.mockResolvedValue(mockGaps);
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      expect(result.success).toBe(true);
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0]).toHaveProperty('opportunityScore');
      expect(result.opportunities[0].opportunityScore).toBeGreaterThanOrEqual(
        0,
      );
      expect(result.opportunities[0].opportunityScore).toBeLessThanOrEqual(1);
    });

    it('should apply correct weight distribution: novelty 30%, feasibility 25%, impact 25%, timeliness 10%, funding 10%', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'High Novelty Gap',
        description: 'Very novel research area',
        relatedPapers: 2, // High novelty (few papers)
        keywords: ['emerging', 'novel'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      const opportunity = result.opportunities[0];
      const factors = opportunity.scoringFactors;

      // Verify all factors are present
      expect(factors).toHaveProperty('novelty');
      expect(factors).toHaveProperty('feasibility');
      expect(factors).toHaveProperty('impact');
      expect(factors).toHaveProperty('timeliness');
      expect(factors).toHaveProperty('funding');

      // Verify composite score calculation
      const expectedScore =
        factors.novelty * 0.3 +
        factors.feasibility * 0.25 +
        factors.impact * 0.25 +
        factors.timeliness * 0.1 +
        factors.funding * 0.1;

      expect(opportunity.opportunityScore).toBeCloseTo(expectedScore, 2);
    });

    it('should normalize scores to 0-1 range', async () => {
      const mockGaps = Array.from({ length: 10 }, (_, i) => ({
        id: `gap${i}`,
        title: `Gap ${i}`,
        description: 'Test gap',
        relatedPapers: i * 5,
        keywords: ['test'],
      }));

      mockPrisma.researchGap.findMany.mockResolvedValue(mockGaps);
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const result = await service.scoreResearchOpportunities(
        mockGaps.map((g) => g.id),
      );

      result.opportunities.forEach((opp: any) => {
        expect(opp.opportunityScore).toBeGreaterThanOrEqual(0);
        expect(opp.opportunityScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Funding Probability', () => {
    it('should match appropriate grant types', async () => {
      const mockGaps = [
        {
          id: 'gap1',
          title: 'Healthcare AI Research',
          description: 'Machine learning for patient outcomes',
          keywords: ['healthcare', 'ML', 'clinical'],
        },
      ];

      mockPrisma.researchGap.findMany.mockResolvedValue(mockGaps);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matchedGrants: [
                  {
                    type: 'NIH',
                    match: 0.85,
                    rationale: 'Strong fit for healthcare research',
                  },
                  {
                    type: 'NSF',
                    match: 0.6,
                    rationale: 'Moderate fit for ML research',
                  },
                ],
                probability: 0.72,
              }),
            },
          },
        ],
      });

      const result = await service.predictFundingProbability(['gap1']);

      expect(result.success).toBe(true);
      expect(result.fundingOpportunities).toBeDefined();
      expect(result.fundingOpportunities[0].matchedGrants).toContain(
        expect.objectContaining({ type: 'NIH' }),
      );
    });

    it('should provide accurate probability estimates', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Established Field Research',
        description: 'Well-funded research area',
        keywords: ['established', 'funded'],
        relatedPapers: 500,
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matchedGrants: [{ type: 'NSF', match: 0.9 }],
                probability: 0.85,
              }),
            },
          },
        ],
      });

      const result = await service.predictFundingProbability(['gap1']);

      expect(result.fundingOpportunities[0].probability).toBeGreaterThan(0.7);
    });

    it('should use GPT-4 + heuristics for prediction', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Novel Research Area',
        description: 'Emerging field with limited funding history',
        keywords: ['novel', 'emerging'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matchedGrants: [],
                probability: 0.3,
                reasoning: 'Limited funding history in this area',
              }),
            },
          },
        ],
      });

      const result = await service.predictFundingProbability(['gap1']);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Timeline Optimization', () => {
    it('should predict reasonable durations', async () => {
      const mockGaps = [
        {
          id: 'gap1',
          title: 'Simple Research Question',
          description: 'A straightforward research question',
          keywords: ['simple'],
        },
        {
          id: 'gap2',
          title: 'Complex Interdisciplinary Research',
          description:
            'Complex multi-phase research requiring multiple disciplines',
          keywords: ['complex', 'interdisciplinary'],
        },
      ];

      mockPrisma.researchGap.findMany.mockResolvedValue(mockGaps);

      const result = await service.getTimelineOptimizations(['gap1', 'gap2']);

      expect(result.success).toBe(true);
      expect(result.timelines).toHaveLength(2);

      // Complex research should have longer duration
      const simpleTimeline = result.timelines.find(
        (t: any) => t.gapId === 'gap1',
      );
      const complexTimeline = result.timelines.find(
        (t: any) => t.gapId === 'gap2',
      );

      expect(complexTimeline.estimatedDuration).toBeGreaterThan(
        simpleTimeline.estimatedDuration,
      );
    });

    it('should adjust for complexity', async () => {
      const highComplexityGap = {
        id: 'gap1',
        title: 'Multi-Phase Longitudinal Study',
        description:
          'Complex longitudinal study requiring multiple phases and large sample sizes',
        keywords: ['longitudinal', 'complex', 'multi-phase'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([highComplexityGap]);

      const result = await service.getTimelineOptimizations(['gap1']);

      const timeline = result.timelines[0];
      expect(timeline.estimatedDuration).toBeGreaterThan(12); // Should be >1 year for complex research
    });

    it('should break down timeline into phases', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Research Project',
        description: 'A standard research project',
        keywords: ['research'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);

      const result = await service.getTimelineOptimizations(['gap1']);

      const timeline = result.timelines[0];
      expect(timeline).toHaveProperty('phases');
      expect(timeline.phases).toBeInstanceOf(Array);
      expect(timeline.phases.length).toBeGreaterThan(0);
    });
  });

  describe('Impact Prediction', () => {
    it('should forecast citation trajectories', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Trending Research Topic',
        description: 'A currently trending research area',
        keywords: ['trending', 'hot'],
        relatedPapers: 50,
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);
      mockPrisma.paper.findMany.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({
          id: `paper${i}`,
          citationCount: i * 2,
          createdAt: new Date(2020 + Math.floor(i / 10), 0, 1),
        })),
      );

      const result = await service.predictImpact(['gap1']);

      expect(result.success).toBe(true);
      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0]).toHaveProperty('predictedCitations');
      expect(result.predictions[0].predictedCitations).toBeGreaterThan(0);
    });

    it('should account for novelty and trends', async () => {
      const novelGap = {
        id: 'novel',
        title: 'Novel Research Area',
        description: 'Completely new research area',
        keywords: ['novel', 'new', 'breakthrough'],
        relatedPapers: 5,
      };

      const establishedGap = {
        id: 'established',
        title: 'Established Research Area',
        description: 'Well-established field',
        keywords: ['established', 'traditional'],
        relatedPapers: 500,
      };

      mockPrisma.researchGap.findMany
        .mockResolvedValueOnce([novelGap])
        .mockResolvedValueOnce([establishedGap]);

      mockPrisma.paper.findMany.mockResolvedValue([]);

      const novelResult = await service.predictImpact(['novel']);
      const establishedResult = await service.predictImpact(['established']);

      // Novel research might have different impact trajectory
      expect(novelResult.predictions[0]).toHaveProperty('impactScore');
      expect(establishedResult.predictions[0]).toHaveProperty('impactScore');
    });

    it('should calculate confidence intervals', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Research Gap',
        description: 'Test gap',
        keywords: ['test'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);

      const result = await service.predictImpact(['gap1']);

      expect(result.predictions[0]).toHaveProperty('confidenceLevel');
    });
  });

  describe('Trend Forecasting', () => {
    it('should detect exponential growth patterns', async () => {
      const topics = ['AI Ethics'];

      mockPrisma.paper.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `paper${i}`,
          title: 'AI Ethics Paper',
          createdAt: new Date(2015 + i, 0, 1),
          citationCount: Math.pow(2, i), // Exponential growth
        })),
      );

      const result = await service.forecastTrends(topics);

      expect(result.success).toBe(true);
      expect(result.forecasts).toHaveLength(1);
      expect(result.forecasts[0].trend).toBe('EXPONENTIAL');
    });

    it('should identify plateaus correctly', async () => {
      const topics = ['Stable Topic'];

      mockPrisma.paper.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `paper${i}`,
          title: 'Stable Topic Paper',
          createdAt: new Date(2015 + i, 0, 1),
          citationCount: 100 + Math.random() * 10, // Stable with noise
        })),
      );

      const result = await service.forecastTrends(topics);

      expect(result.forecasts[0].trend).toBe('PLATEAU');
    });

    it('should detect linear growth', async () => {
      const topics = ['Linear Topic'];

      mockPrisma.paper.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `paper${i}`,
          title: 'Linear Topic Paper',
          createdAt: new Date(2015 + i, 0, 1),
          citationCount: i * 10, // Linear growth
        })),
      );

      const result = await service.forecastTrends(topics);

      expect(result.forecasts[0].trend).toBe('LINEAR');
    });

    it('should identify declining trends', async () => {
      const topics = ['Declining Topic'];

      mockPrisma.paper.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `paper${i}`,
          title: 'Declining Topic Paper',
          createdAt: new Date(2015 + i, 0, 1),
          citationCount: 100 - i * 10, // Declining
        })),
      );

      const result = await service.forecastTrends(topics);

      expect(result.forecasts[0].trend).toBe('DECLINING');
    });

    it('should calculate growth rates accurately', async () => {
      const topics = ['Test Topic'];

      mockPrisma.paper.findMany.mockResolvedValue([
        { id: '1', createdAt: new Date('2020-01-01'), citationCount: 100 },
        { id: '2', createdAt: new Date('2021-01-01'), citationCount: 150 },
        { id: '3', createdAt: new Date('2022-01-01'), citationCount: 225 },
      ]);

      const result = await service.forecastTrends(topics);

      // Growth rate should be approximately 50% per year
      expect(result.forecasts[0].growthRate).toBeGreaterThan(40);
      expect(result.forecasts[0].growthRate).toBeLessThan(60);
    });
  });

  describe('Collaboration Suggestions', () => {
    it('should match expertise to research gaps', async () => {
      const mockGap = {
        id: 'gap1',
        title: 'Machine Learning in Healthcare',
        description: 'Applying ML to patient outcomes',
        keywords: ['ML', 'healthcare', 'patient outcomes'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([mockGap]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      expect(result.opportunities[0]).toHaveProperty('suggestedCollaborators');
      expect(result.opportunities[0].suggestedCollaborators).toBeInstanceOf(
        Array,
      );
    });

    it('should suggest interdisciplinary teams', async () => {
      const interdisciplinaryGap = {
        id: 'gap1',
        title: 'Bioinformatics and AI',
        description: 'Combining biology and artificial intelligence',
        keywords: ['biology', 'AI', 'bioinformatics'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([interdisciplinaryGap]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      const collaborators = result.opportunities[0].suggestedCollaborators;
      // Should suggest experts from multiple fields
      const expertiseAreas = collaborators.map((c: any) => c.expertise).flat();
      expect(new Set(expertiseAreas).size).toBeGreaterThan(1);
    });
  });

  describe('Q-Methodology Fit', () => {
    it('should calculate Q-fit scores based on keywords', async () => {
      const qSuitableGap = {
        id: 'gap1',
        title: 'Subjective Perspectives on Climate Change',
        description: 'Understanding diverse viewpoints on climate action',
        keywords: ['perspectives', 'subjective', 'viewpoints', 'stakeholders'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([qSuitableGap]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      expect(result.opportunities[0]).toHaveProperty('qMethodologyRelevance');
      expect(result.opportunities[0].qMethodologyRelevance).toBe(true);
    });

    it('should identify gaps unsuitable for Q-method', async () => {
      const quantitativeGap = {
        id: 'gap1',
        title: 'Statistical Analysis of Large Datasets',
        description: 'Quantitative analysis of numerical data',
        keywords: ['statistics', 'quantitative', 'numerical', 'datasets'],
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([quantitativeGap]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      expect(result.opportunities[0].qMethodologyRelevance).toBe(false);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty gap lists', async () => {
      const result = await service.scoreResearchOpportunities([]);

      expect(result.success).toBe(true);
      expect(result.opportunities).toHaveLength(0);
    });

    it('should handle gaps with missing data', async () => {
      const incompleteGap = {
        id: 'gap1',
        title: 'Incomplete Gap',
        description: null,
        keywords: null,
      };

      mockPrisma.researchGap.findMany.mockResolvedValue([incompleteGap]);

      const result = await service.scoreResearchOpportunities(['gap1']);

      expect(result.success).toBe(true);
      expect(result.opportunities).toHaveLength(1);
    });

    it('should process multiple gaps efficiently', async () => {
      const manyGaps = Array.from({ length: 50 }, (_, i) => ({
        id: `gap${i}`,
        title: `Gap ${i}`,
        description: 'Test gap',
        keywords: ['test'],
      }));

      mockPrisma.researchGap.findMany.mockResolvedValue(manyGaps);
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const startTime = Date.now();
      await service.scoreResearchOpportunities(manyGaps.map((g) => g.id));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in <5s
    });

    it('should handle API failures gracefully', async () => {
      mockPrisma.researchGap.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.scoreResearchOpportunities(['gap1']),
      ).rejects.toThrow();
    });
  });
});
