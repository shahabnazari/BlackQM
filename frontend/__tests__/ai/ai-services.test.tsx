/**
 * Comprehensive Test Suite for AI Services
 * Phase 6.86 - Days 3-5 Enterprise Testing
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { questionnaireGenerator } from '@/lib/ai/questionnaire-generator';
import { statementGenerator } from '@/lib/ai/statement-generator';
import { biasDetector } from '@/lib/ai/bias-detector';
import { aiService, initializeAI } from '@/lib/services/ai.service';

// Mock the OpenAI API
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    id: 'Q1',
                    type: 'text',
                    text: 'What is your name?',
                    required: true,
                    reasoning: 'Basic identification'
                  }
                ],
                statements: [
                  {
                    id: 'S01',
                    text: 'Technology improves our lives',
                    perspective: 'technological',
                    polarity: 'positive',
                    confidence: 0.9
                  }
                ],
                overallScore: 85,
                issues: [],
                recommendations: ['Consider adding more diverse perspectives']
              })
            }
          }],
          usage: {
            total_tokens: 100,
            prompt_tokens: 50,
            completion_tokens: 50
          }
        })
      }
    }
  }))
}));

describe('AI Services Test Suite', () => {
  beforeAll(async () => {
    // Initialize AI service with a test key
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-key';
    await initializeAI('test-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Questionnaire Generator (Day 3)', () => {
    it('should generate questions with proper types', async () => {
      const response = await questionnaireGenerator.generateQuestions({
        topic: 'Climate Change',
        questionCount: 5,
        questionTypes: ['text', 'select', 'scale'],
        targetAudience: 'general public'
      });

      expect(response).toHaveProperty('questions');
      expect(response).toHaveProperty('metadata');
      expect(response.questions).toBeInstanceOf(Array);
      expect(response.questions.length).toBeGreaterThan(0);
      
      // Check question structure
      const question = response.questions[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('text');
      expect(question).toHaveProperty('type');
      expect(question).toHaveProperty('aiGenerated', true);
      expect(question).toHaveProperty('confidence');
    });

    it('should add demographic questions when missing', async () => {
      const response = await questionnaireGenerator.generateQuestions({
        topic: 'Technology Usage',
        questionCount: 3,
        questionTypes: ['text']
      });

      // Check if demographic questions are added
      const hasAge = response.questions.some(q => 
        q.text.toLowerCase().includes('age')
      );
      const hasGender = response.questions.some(q => 
        q.text.toLowerCase().includes('gender')
      );
      const hasEducation = response.questions.some(q => 
        q.text.toLowerCase().includes('education')
      );

      expect(hasAge || hasGender || hasEducation).toBe(true);
    });

    it('should suggest additional questions based on existing ones', async () => {
      const suggestions = await questionnaireGenerator.suggestQuestions(
        'Environmental Policy',
        ['What is your age?', 'Do you support renewable energy?']
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate skip logic for conditional questions', async () => {
      const questions = [
        { id: 'Q1', text: 'Do you drive?', type: 'radio' },
        { id: 'Q2', text: 'What type of car?', type: 'text' }
      ];

      const skipLogic = await questionnaireGenerator.generateSkipLogic(
        questions as any
      );

      expect(skipLogic).toBeInstanceOf(Object);
    });

    it('should calculate confidence scores correctly', async () => {
      const response = await questionnaireGenerator.generateQuestions({
        topic: 'Test Topic',
        questionCount: 1,
        questionTypes: ['text']
      });

      const question = response.questions[0];
      expect(question.confidence).toBeGreaterThanOrEqual(0);
      expect(question.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Statement Generator (Day 4)', () => {
    it('should generate diverse Q-methodology statements', async () => {
      const response = await statementGenerator.generateStatements({
        topic: 'Climate Change',
        count: 30,
        perspectives: ['economic', 'environmental', 'social'],
        avoidBias: true,
        academicLevel: 'intermediate'
      });

      expect(response).toHaveProperty('statements');
      expect(response).toHaveProperty('metadata');
      expect(response.statements).toBeInstanceOf(Array);
      expect(response.statements.length).toBeGreaterThan(0);
      
      // Check statement structure
      const statement = response.statements[0];
      expect(statement).toHaveProperty('id');
      expect(statement).toHaveProperty('text');
      expect(statement).toHaveProperty('perspective');
      expect(statement).toHaveProperty('polarity');
      expect(statement).toHaveProperty('generated', true);
      expect(statement).toHaveProperty('topic');
    });

    it('should ensure statement uniqueness', async () => {
      const response = await statementGenerator.generateStatements({
        topic: 'Technology',
        count: 20
      });

      const texts = response.statements.map(s => s.text.toLowerCase());
      const uniqueTexts = new Set(texts);
      
      expect(uniqueTexts.size).toBe(texts.length);
    });

    it('should validate statement length constraints', async () => {
      const response = await statementGenerator.generateStatements({
        topic: 'Healthcare',
        count: 10
      });

      for (const statement of response.statements) {
        expect(statement.text.length).toBeLessThanOrEqual(150);
        expect(statement.text.length).toBeGreaterThan(0);
      }
    });

    it('should balance statement polarities', async () => {
      const response = await statementGenerator.generateStatements({
        topic: 'Education',
        count: 30
      });

      const polarities = response.statements.reduce((acc, s) => {
        acc[s.polarity] = (acc[s.polarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Check that no polarity dominates too much
      const counts = Object.values(polarities);
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      
      expect(maxCount).toBeLessThanOrEqual(minCount * 3); // Max 3x imbalance
    });

    it('should validate generated statements', async () => {
      const statements = [
        { 
          id: 'S1', 
          text: 'This is a good statement', 
          perspective: 'general',
          polarity: 'positive' as const,
          confidence: 0.9,
          generated: true as const,
          topic: 'Test'
        }
      ];

      const validation = await statementGenerator.validateStatements(statements);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('suggestions');
      expect(validation.issues).toBeInstanceOf(Array);
    });
  });

  describe('Bias Detector (Day 5)', () => {
    it('should detect bias in statements', async () => {
      const biasResult = await biasDetector.detectBias({
        statements: [
          'Everyone knows climate change is real',
          'Technology always improves our lives',
          'Government regulation is necessary'
        ],
        studyTitle: 'Climate Policy Study'
      });

      expect(biasResult).toHaveProperty('overallScore');
      expect(biasResult).toHaveProperty('issues');
      expect(biasResult).toHaveProperty('recommendations');
      expect(biasResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(biasResult.overallScore).toBeLessThanOrEqual(100);
    });

    it('should perform quick bias check without AI', () => {
      const statements = [
        'Obviously this is the right approach',
        'Everyone knows this is wrong',
        'This approach has both benefits and drawbacks'
      ];

      const quickScore = biasDetector.calculateQuickBiasScore(statements);
      
      expect(quickScore).toBeGreaterThanOrEqual(0);
      expect(quickScore).toBeLessThanOrEqual(100);
      expect(quickScore).toBeLessThan(100); // Should detect bias indicators
    });

    it('should check cultural sensitivity', async () => {
      const culturalResult = await biasDetector.checkCulturalSensitivity([
        'Western values are superior',
        'Different cultures have different perspectives',
        'Christmas is the most important holiday'
      ]);

      expect(culturalResult).toHaveProperty('score');
      expect(culturalResult).toHaveProperty('issues');
      expect(culturalResult.issues).toBeInstanceOf(Array);
    });

    it('should assess diversity of perspectives', async () => {
      const diversityResult = await biasDetector.assessDiversity([
        'Economic growth is essential',
        'Environmental protection matters',
        'Social equity is important',
        'Technology drives progress'
      ]);

      expect(diversityResult).toHaveProperty('score');
      expect(diversityResult).toHaveProperty('analysis');
      expect(diversityResult.analysis).toHaveProperty('perspectivesCovered');
      expect(diversityResult.analysis).toHaveProperty('perspectivesMissing');
    });

    it('should identify specific bias types', async () => {
      const biasResult = await biasDetector.detectBias({
        statements: [
          'Young people dont understand hard work',
          'Men are naturally better at math',
          'Poor people are lazy'
        ],
        checkTypes: ['demographic', 'cultural']
      });

      expect(biasResult.issues.length).toBeGreaterThan(0);
      
      const hasdemographicBias = biasResult.issues.some(
        issue => issue.type === 'demographic'
      );
      expect(hasdemographicBias).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit exceeded
      vi.spyOn(aiService, 'generateCompletion').mockRejectedValueOnce({
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retry: true
      });

      await expect(
        questionnaireGenerator.generateQuestions({
          topic: 'Test',
          questionCount: 1
        })
      ).rejects.toMatchObject({
        code: 'RATE_LIMITED'
      });
    });

    it('should handle budget exceeded errors', async () => {
      // Mock budget exceeded
      vi.spyOn(aiService, 'generateCompletion').mockRejectedValueOnce({
        code: 'BUDGET_EXCEEDED',
        message: 'Daily budget exceeded',
        retry: false
      });

      await expect(
        statementGenerator.generateStatements({
          topic: 'Test',
          count: 10
        })
      ).rejects.toMatchObject({
        code: 'BUDGET_EXCEEDED'
      });
    });

    it('should use cache for duplicate requests', async () => {
      const prompt = 'Generate test question';
      
      // First call
      await aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo'
      });

      // Second call (should use cache)
      const cachedResponse = await aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo'
      });

      expect(cachedResponse.cached).toBe(true);
    });

    it('should track AI usage costs', async () => {
      const initialBudget = aiService.getBudget();
      
      await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo'
      });

      const updatedBudget = aiService.getBudget();
      expect(updatedBudget.used).toBeGreaterThan(initialBudget.used);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      vi.spyOn(aiService, 'generateCompletion').mockRejectedValueOnce({
        code: 'invalid_api_key',
        message: 'Invalid API key',
        retry: false
      });

      await expect(
        questionnaireGenerator.generateQuestions({
          topic: 'Test',
          questionCount: 1
        })
      ).rejects.toMatchObject({
        code: 'invalid_api_key'
      });
    });

    it('should retry on temporary failures', async () => {
      let callCount = 0;
      vi.spyOn(aiService, 'generateCompletion').mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return {
          content: '{}',
          tokens: 10,
          cost: 0.01,
          responseTime: 100,
          cached: false
        };
      });

      const response = await aiService.generateCompletion({
        prompt: 'Test',
        model: 'gpt-3.5-turbo'
      });

      expect(response).toBeDefined();
      expect(callCount).toBe(3);
    });
  });
});

// Export test utilities for other test files
export const mockAIResponse = (content: any) => {
  return {
    choices: [{
      message: {
        content: typeof content === 'string' ? content : JSON.stringify(content)
      }
    }],
    usage: {
      total_tokens: 100,
      prompt_tokens: 50,
      completion_tokens: 50
    }
  };
};

export const createMockStatement = (overrides = {}) => ({
  id: 'S01',
  text: 'Test statement',
  perspective: 'general',
  polarity: 'neutral',
  confidence: 0.8,
  generated: true,
  topic: 'Test',
  ...overrides
});

export const createMockQuestion = (overrides = {}) => ({
  id: 'Q1',
  type: 'text',
  text: 'Test question?',
  required: false,
  aiGenerated: true,
  confidence: 0.9,
  reasoning: 'Test reasoning',
  ...overrides
});