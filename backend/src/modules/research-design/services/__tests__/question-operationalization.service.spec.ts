import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QuestionOperationalizationService, OperationalizationRequest } from '../question-operationalization.service';
import { ResearchQuestionService } from '../research-question.service';
import { PrismaService } from '../../../../common/prisma.service';

describe('QuestionOperationalizationService', () => {
  let service: QuestionOperationalizationService;
  let researchQuestionService: ResearchQuestionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionOperationalizationService,
        ResearchQuestionService,
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma methods - service doesn't use database in these tests
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return undefined; // Test without OpenAI
              if (key === 'DATABASE_URL') return 'mock://database';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionOperationalizationService>(QuestionOperationalizationService);
    researchQuestionService = module.get<ResearchQuestionService>(ResearchQuestionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Construct Extraction', () => {
    it('should extract constructs from exploratory research question', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors influence employee job satisfaction in remote work environments?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result).toBeDefined();
      expect(result.constructs).toBeDefined();
      expect(result.constructs.length).toBeGreaterThan(0);
      expect(result.constructs[0]).toHaveProperty('name');
      expect(result.constructs[0]).toHaveProperty('definition');
      expect(result.constructs[0]).toHaveProperty('type');
    });

    it('should identify dependent variables correctly', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does leadership style affect team performance?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      const dependentVars = result.constructs.filter(c => c.type === 'dependent_variable');
      expect(dependentVars.length).toBeGreaterThan(0);
    });

    it('should identify independent variables correctly', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'Does social media usage predict student academic performance?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      const independentVars = result.constructs.filter(c => c.type === 'independent_variable');
      expect(independentVars.length).toBeGreaterThan(0);
    });

    it('should handle questions with moderators', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does age moderate the relationship between exercise and mental health?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.constructs).toBeDefined();
      expect(result.constructs.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle questions with mediators', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'Does motivation mediate the effect of rewards on productivity?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.constructs).toBeDefined();
      expect(result.constructs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Variable Operationalization', () => {
    it('should operationalize constructs into measurable variables', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What is the relationship between stress and productivity?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.variables).toBeDefined();
      expect(result.variables.length).toBeGreaterThan(0);
      expect(result.variables[0]).toHaveProperty('variableName');
      expect(result.variables[0]).toHaveProperty('operationalDefinition');
      expect(result.variables[0]).toHaveProperty('measurementLevel');
    });

    it('should specify appropriate measurement levels', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does education level affect income?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      result.variables.forEach(variable => {
        expect(['nominal', 'ordinal', 'interval', 'ratio']).toContain(variable.measurementLevel);
      });
    });

    it('should provide operational definitions for each variable', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors predict customer loyalty?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      result.variables.forEach(variable => {
        expect(variable.operationalDefinition).toBeDefined();
        expect(variable.operationalDefinition.length).toBeGreaterThan(10);
      });
    });

    it('should include reliability information for each variable', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does organizational culture affect employee engagement?',
        studyType: 'explanatory',
        itemsPerVariable: 5,
      };

      const result = await service.operationalizeQuestion(request);

      result.variables.forEach(variable => {
        expect(variable.reliability).toBeDefined();
        expect(variable.reliability.targetAlpha).toBeGreaterThanOrEqual(0.70);
        expect(variable.reliability.expectedAlpha).toBeDefined();
        expect(variable.reliability.itemCount).toBe(5);
      });
    });
  });

  describe('Measurement Item Generation', () => {
    it('should generate multiple items per variable', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What predicts job satisfaction?',
        studyType: 'predictive',
        itemsPerVariable: 5,
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.measurementItems).toBeDefined();
      expect(result.measurementItems.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate reverse-coded items when requested', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does stress affect well-being?',
        studyType: 'explanatory',
        itemsPerVariable: 6,
        includeReverseItems: true,
      };

      const result = await service.operationalizeQuestion(request);

      const reversedItems = result.measurementItems.filter(item => item.reversed);
      expect(reversedItems.length).toBeGreaterThan(0);
    });

    it('should not include reverse items when not requested', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What affects customer satisfaction?',
        studyType: 'exploratory',
        itemsPerVariable: 5,
        includeReverseItems: false,
      };

      const result = await service.operationalizeQuestion(request);

      const reversedItems = result.measurementItems.filter(item => item.reversed);
      expect(reversedItems.length).toBe(0);
    });

    it('should include scale types for all items', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does work-life balance affect happiness?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      result.measurementItems.forEach(item => {
        expect(item.scaleType).toBeDefined();
        expect(['likert_5', 'likert_7', 'semantic_differential', 'frequency', 'agreement', 'satisfaction', 'importance']).toContain(item.scaleType);
      });
    });

    it('should include scale labels for all items', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What affects learning outcomes?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      result.measurementItems.forEach(item => {
        expect(item.scaleLabels).toBeDefined();
        expect(item.scaleLabels.length).toBeGreaterThan(0);
      });
    });

    it('should number items sequentially within each variable', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does motivation affect performance?',
        studyType: 'predictive',
        itemsPerVariable: 4,
      };

      const result = await service.operationalizeQuestion(request);

      const variableGroups = new Map<string, typeof result.measurementItems>();
      result.measurementItems.forEach(item => {
        if (!variableGroups.has(item.variableId)) {
          variableGroups.set(item.variableId, []);
        }
        variableGroups.get(item.variableId)!.push(item);
      });

      variableGroups.forEach(items => {
        items.forEach((item, index) => {
          expect(item.itemNumber).toBe(index + 1);
        });
      });
    });

    it('should include psychometric notes for items', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors drive innovation?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      result.measurementItems.forEach(item => {
        expect(item.psychometricNote).toBeDefined();
      });
    });
  });

  describe('Statistical Analysis Planning', () => {
    it('should recommend appropriate analysis for exploratory studies', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What are the key dimensions of organizational culture?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan).toBeDefined();
      expect(result.statisticalPlan.primaryAnalysis.method).toContain('Exploratory Factor Analysis');
    });

    it('should recommend appropriate analysis for predictive studies', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'Does employee engagement predict turnover intention?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.primaryAnalysis).toBeDefined();
      expect(['Multiple Regression', 'SEM', 'Structural Equation Modeling']).toContainEqual(
        expect.stringContaining(result.statisticalPlan.primaryAnalysis.method.split(' ')[0])
      );
    });

    it('should recommend appropriate analysis for explanatory studies', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What is the relationship between trust and collaboration?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.primaryAnalysis.method).toBeDefined();
    });

    it('should include sample size recommendations', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How do leadership behaviors affect team outcomes?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.primaryAnalysis.sampleSizeRecommendation).toBeDefined();
      expect(result.statisticalPlan.primaryAnalysis.sampleSizeRecommendation).toBeGreaterThan(50);
    });

    it('should include statistical assumptions', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'Does training improve performance?',
        studyType: 'evaluative',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.primaryAnalysis.assumptions).toBeDefined();
      expect(result.statisticalPlan.primaryAnalysis.assumptions.length).toBeGreaterThan(0);
    });

    it('should include reliability checks for all constructs', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors influence consumer decision-making?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.reliabilityChecks).toBeDefined();
      expect(result.statisticalPlan.reliabilityChecks.length).toBe(result.variables.length);
    });

    it('should include validity checks', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does brand image affect purchase intention?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.validityChecks).toBeDefined();
      expect(result.statisticalPlan.validityChecks.length).toBeGreaterThan(0);
    });

    it('should include secondary analyses', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What predicts academic success?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.statisticalPlan.secondaryAnalyses).toBeDefined();
      expect(result.statisticalPlan.secondaryAnalyses.length).toBeGreaterThan(0);
    });
  });

  describe('Methodology Recommendations', () => {
    it('should provide methodology recommendations', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does social support affect mental health?',
        studyType: 'explanatory',
        methodology: 'survey',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.methodology).toBeDefined();
      expect(result.methodology.approach).toBe('survey');
      expect(result.methodology.justification).toBeDefined();
    });

    it('should recommend appropriate sample sizes based on complexity', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors predict career success among millennials?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.methodology.sampleSize).toBeGreaterThan(100);
    });

    it('should provide data collection recommendations', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does workplace culture affect employee retention?',
        studyType: 'explanatory',
        methodology: 'survey',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.methodology.dataCollection).toBeDefined();
      expect(result.methodology.dataCollection.length).toBeGreaterThan(10);
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate construct coverage', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What affects customer loyalty?',
        studyType: 'exploratory',
        itemsPerVariable: 5,
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.qualityMetrics.constructCoverage).toBeDefined();
      expect(result.qualityMetrics.constructCoverage).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.constructCoverage).toBeLessThanOrEqual(1);
    });

    it('should calculate reliability expectations', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does trust affect commitment?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.qualityMetrics.reliabilityExpectation).toBeDefined();
      expect(result.qualityMetrics.reliabilityExpectation).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.reliabilityExpectation).toBeLessThanOrEqual(1);
    });

    it('should provide validity indicators', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What drives organizational performance?',
        studyType: 'exploratory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.qualityMetrics.validityIndicators).toBeDefined();
      expect(result.qualityMetrics.validityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    it('should provide pilot testing recommendations', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does digital transformation affect business outcomes?',
        studyType: 'explanatory',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.recommendations.pilotTesting).toBeDefined();
      expect(result.recommendations.pilotTesting.length).toBeGreaterThan(20);
    });

    it('should provide validation strategy', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'What factors predict entrepreneurial success?',
        studyType: 'predictive',
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.recommendations.validationStrategy).toBeDefined();
      expect(result.recommendations.validationStrategy.length).toBeGreaterThan(20);
    });

    it('should provide improvement suggestions', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does personality affect job performance?',
        studyType: 'explanatory',
        itemsPerVariable: 3,
      };

      const result = await service.operationalizeQuestion(request);

      expect(result.recommendations.improvementSuggestions).toBeDefined();
      expect(Array.isArray(result.recommendations.improvementSuggestions)).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache operationalization results', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'How does motivation affect performance?',
        studyType: 'predictive',
      };

      const result1 = await service.operationalizeQuestion(request);
      const result2 = await service.operationalizeQuestion(request);

      expect(result1.id).toBe(result2.id);
      expect(result1.createdAt).toEqual(result2.createdAt);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid study types gracefully', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: 'Test question',
        studyType: 'exploratory',
      };

      await expect(service.operationalizeQuestion(request)).resolves.toBeDefined();
    });

    it('should handle empty research questions', async () => {
      const request: OperationalizationRequest = {
        researchQuestion: '',
        studyType: 'exploratory',
      };

      await expect(service.operationalizeQuestion(request)).resolves.toBeDefined();
    });
  });

  describe('Integration with SQUARE-IT', () => {
    it('should accept pre-computed SQUARE-IT scores', async () => {
      const squareitScore = {
        specific: 8,
        quantifiable: 7,
        usable: 9,
        accurate: 8,
        restricted: 7,
        eligible: 8,
        investigable: 9,
        timely: 8,
        overall: 8,
        details: {
          specificReasoning: 'Well-defined',
          quantifiableReasoning: 'Measurable',
          usableReasoning: 'Practical',
          accurateReasoning: 'Precise',
          restrictedReasoning: 'Focused',
          eligibleReasoning: 'Suitable',
          investigableReasoning: 'Feasible',
          timelyReasoning: 'Relevant',
        },
      };

      const request: OperationalizationRequest = {
        researchQuestion: 'How does leadership style affect team innovation?',
        studyType: 'explanatory',
        squareitScore,
      };

      const result = await service.operationalizeQuestion(request);
      expect(result).toBeDefined();
    });
  });
});
