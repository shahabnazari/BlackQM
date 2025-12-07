/**
 * useThemeApiHandlers Hook - Unit Tests
 * Phase 10.101: Medium-Term Code Quality Improvements
 *
 * **Test Coverage:**
 * - Research questions generation
 * - Hypotheses generation
 * - Construct mapping
 * - Survey generation
 * - Q-statements generation
 * - Input validation
 * - Error handling
 * - Loading states
 * - Store integration
 *
 * **Target Coverage:** 80%+
 *
 * @module hooks/__tests__/useThemeApiHandlers.test
 * @since Phase 10.101
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useThemeApiHandlers } from '../useThemeApiHandlers';
import type { UseThemeApiHandlersParams } from '../useThemeApiHandlers';
import type { Theme } from '@/lib/api/services/enhanced-theme-integration-api.service';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/stores/theme-extraction.store', () => ({
  useThemeExtractionStore: vi.fn(() => ({
    setResearchQuestions: vi.fn(),
    setHypotheses: vi.fn(),
    setConstructMappings: vi.fn(),
    setGeneratedSurvey: vi.fn(),
    setQStatements: vi.fn(),
  })),
}));

vi.mock('@/lib/api/services/enhanced-theme-integration-api.service', () => ({
  enhancedThemeIntegrationService: {
    suggestQuestions: vi.fn(),
    suggestHypotheses: vi.fn(),
    mapConstructs: vi.fn(),
    generateCompleteSurvey: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { enhancedThemeIntegrationService } from '@/lib/api/services/enhanced-theme-integration-api.service';

// Test utilities
const createMockTheme = (id: string, name: string): Theme => ({
  id,
  name,
  description: `Description for ${name}`,
  keywords: ['keyword1', 'keyword2'],
  sources: [{ paperId: 'paper-1', excerpts: ['excerpt 1'] }],
  confidence: 0.85,
  prevalence: 0.6,
  provenance: {
    extractedAt: '2024-01-01T00:00:00Z',
    model: 'gpt-4',
    version: '1.0',
  },
});

const createMockThemes = (count: number): Theme[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTheme(`theme-${i + 1}`, `Theme ${i + 1}`)
  );
};

describe('useThemeApiHandlers', () => {
  let mockSetLoadingQuestions: ReturnType<typeof vi.fn>;
  let mockSetLoadingHypotheses: ReturnType<typeof vi.fn>;
  let mockSetLoadingConstructs: ReturnType<typeof vi.fn>;
  let mockSetLoadingSurvey: ReturnType<typeof vi.fn>;
  let mockSetResearchQuestions: ReturnType<typeof vi.fn>;
  let mockSetHypotheses: ReturnType<typeof vi.fn>;
  let mockSetConstructMappings: ReturnType<typeof vi.fn>;
  let mockSetGeneratedSurvey: ReturnType<typeof vi.fn>;
  let mockSetQStatements: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup loading state setters
    mockSetLoadingQuestions = vi.fn();
    mockSetLoadingHypotheses = vi.fn();
    mockSetLoadingConstructs = vi.fn();
    mockSetLoadingSurvey = vi.fn();

    // Setup store mocks
    mockSetResearchQuestions = vi.fn();
    mockSetHypotheses = vi.fn();
    mockSetConstructMappings = vi.fn();
    mockSetGeneratedSurvey = vi.fn();
    mockSetQStatements = vi.fn();

    vi.mocked(useThemeExtractionStore).mockReturnValue({
      setResearchQuestions: mockSetResearchQuestions,
      setHypotheses: mockSetHypotheses,
      setConstructMappings: mockSetConstructMappings,
      setGeneratedSurvey: mockSetGeneratedSurvey,
      setQStatements: mockSetQStatements,
    } as any);
  });

  const createDefaultParams = (
    overrides: Partial<UseThemeApiHandlersParams> = {}
  ): UseThemeApiHandlersParams => ({
    selectedThemeIds: ['theme-1', 'theme-2', 'theme-3'],
    mappedSelectedThemes: createMockThemes(3),
    extractionPurpose: 'q_methodology',
    setLoadingQuestions: mockSetLoadingQuestions,
    setLoadingHypotheses: mockSetLoadingHypotheses,
    setLoadingConstructs: mockSetLoadingConstructs,
    setLoadingSurvey: mockSetLoadingSurvey,
    loadingQuestions: false,
    loadingHypotheses: false,
    loadingConstructs: false,
    loadingSurvey: false,
    ...overrides,
  });

  describe('Hook Initialization', () => {
    it('should return all handler functions and loading states', () => {
      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      expect(result.current.handleGenerateQuestions).toBeInstanceOf(Function);
      expect(result.current.handleGenerateHypotheses).toBeInstanceOf(Function);
      expect(result.current.handleMapConstructs).toBeInstanceOf(Function);
      expect(result.current.handleGenerateSurvey).toBeInstanceOf(Function);
      expect(result.current.handleGenerateStatements).toBeInstanceOf(Function);
      expect(result.current.handleShowSurveyModal).toBeInstanceOf(Function);
      expect(result.current.loadingQuestions).toBe(false);
      expect(result.current.loadingHypotheses).toBe(false);
      expect(result.current.loadingConstructs).toBe(false);
      expect(result.current.loadingSurvey).toBe(false);
    });

    it('should have stable function references with same dependencies', () => {
      const params = createDefaultParams();
      const { result, rerender } = renderHook(
        ({ hookParams }) => useThemeApiHandlers(hookParams),
        { initialProps: { hookParams: params } }
      );

      const firstHandleGenerateQuestions = result.current.handleGenerateQuestions;
      const firstHandleGenerateHypotheses = result.current.handleGenerateHypotheses;

      // Rerender with same params (dependencies unchanged)
      rerender({ hookParams: params });

      expect(result.current.handleGenerateQuestions).toBe(firstHandleGenerateQuestions);
      expect(result.current.handleGenerateHypotheses).toBe(firstHandleGenerateHypotheses);
    });
  });

  describe('handleGenerateQuestions', () => {
    it('should generate research questions successfully', async () => {
      const mockQuestions = [
        { id: 'q1', question: 'Question 1', rationale: 'Rationale 1', relatedThemes: ['theme-1'] },
        { id: 'q2', question: 'Question 2', rationale: 'Rationale 2', relatedThemes: ['theme-2'] },
      ];

      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockResolvedValue(mockQuestions);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(mockSetLoadingQuestions).toHaveBeenCalledWith(true);
      expect(enhancedThemeIntegrationService.suggestQuestions).toHaveBeenCalledWith({
        themes: expect.arrayContaining([
          expect.objectContaining({ id: 'theme-1' }),
          expect.objectContaining({ id: 'theme-2' }),
          expect.objectContaining({ id: 'theme-3' }),
        ]),
        maxQuestions: 5,
        researchGoal: 'q_methodology',
      });
      expect(mockSetResearchQuestions).toHaveBeenCalledWith(mockQuestions);
      expect(toast.success).toHaveBeenCalledWith('Generated 2 research questions');
      expect(mockSetLoadingQuestions).toHaveBeenCalledWith(false);
    });

    it('should validate theme selection before generating', async () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: [],
            mappedSelectedThemes: [],
          })
        )
      );

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(toast.error).toHaveBeenCalledWith('Please select themes first');
      expect(logger.warn).toHaveBeenCalledWith(
        'Generate questions called with no themes selected',
        'useThemeApiHandlers'
      );
      expect(enhancedThemeIntegrationService.suggestQuestions).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API request failed');
      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockRejectedValue(error);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to generate questions',
        'useThemeApiHandlers',
        error
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to generate questions: API request failed');
      expect(mockSetLoadingQuestions).toHaveBeenCalledWith(false);
    });

    it('should use qualitative_analysis as default research goal', async () => {
      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            extractionPurpose: null,
          })
        )
      );

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(enhancedThemeIntegrationService.suggestQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          researchGoal: 'qualitative_analysis',
        })
      );
    });

    it('should log generation with metadata', async () => {
      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockResolvedValue([
        { id: 'q1', question: 'Q1', rationale: 'R1', relatedThemes: [] },
      ]);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Generating research questions',
        'useThemeApiHandlers',
        expect.objectContaining({
          selectedCount: 3,
          purpose: 'q_methodology',
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Research questions generated successfully',
        'useThemeApiHandlers',
        expect.objectContaining({
          count: 1,
        })
      );
    });
  });

  describe('handleGenerateHypotheses', () => {
    it('should generate hypotheses successfully', async () => {
      const mockHypotheses = [
        {
          id: 'h1',
          statement: 'Hypothesis 1',
          type: 'correlational',
          variables: ['var1', 'var2'],
          rationale: 'Rationale 1',
        },
        {
          id: 'h2',
          statement: 'Hypothesis 2',
          type: 'causal',
          variables: ['var3', 'var4'],
          rationale: 'Rationale 2',
        },
      ];

      vi.mocked(enhancedThemeIntegrationService.suggestHypotheses).mockResolvedValue(
        mockHypotheses
      );

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateHypotheses();
      });

      expect(mockSetLoadingHypotheses).toHaveBeenCalledWith(true);
      expect(enhancedThemeIntegrationService.suggestHypotheses).toHaveBeenCalledWith({
        themes: expect.any(Array),
        maxHypotheses: 5,
        hypothesisTypes: ['correlational', 'causal', 'mediation'],
      });
      expect(mockSetHypotheses).toHaveBeenCalledWith(mockHypotheses);
      expect(toast.success).toHaveBeenCalledWith('Generated 2 hypotheses');
      expect(mockSetLoadingHypotheses).toHaveBeenCalledWith(false);
    });

    it('should validate theme selection', async () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: [],
            mappedSelectedThemes: [],
          })
        )
      );

      await act(async () => {
        await result.current.handleGenerateHypotheses();
      });

      expect(toast.error).toHaveBeenCalledWith('Please select themes first');
      expect(enhancedThemeIntegrationService.suggestHypotheses).not.toHaveBeenCalled();
    });

    it('should handle hypothesis generation errors', async () => {
      const error = new Error('Service unavailable');
      vi.mocked(enhancedThemeIntegrationService.suggestHypotheses).mockRejectedValue(error);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateHypotheses();
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to generate hypotheses: Service unavailable'
      );
      expect(mockSetLoadingHypotheses).toHaveBeenCalledWith(false);
    });

    it('should log hypothesis generation', async () => {
      vi.mocked(enhancedThemeIntegrationService.suggestHypotheses).mockResolvedValue([
        { id: 'h1', statement: 'H1', type: 'correlational', variables: [], rationale: 'R1' },
      ]);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateHypotheses();
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Generating hypotheses',
        'useThemeApiHandlers',
        expect.objectContaining({ selectedCount: 3 })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Hypotheses generated successfully',
        'useThemeApiHandlers',
        expect.objectContaining({ count: 1 })
      );
    });
  });

  describe('handleMapConstructs', () => {
    it('should map constructs successfully', async () => {
      const mockConstructs = [
        {
          construct: { id: 'c1', name: 'Construct 1', themes: ['theme-1'] },
          relatedConstructs: [
            { constructId: 'c2', relationshipType: 'correlation', confidence: 0.8 },
          ],
        },
      ];

      vi.mocked(enhancedThemeIntegrationService.mapConstructs).mockResolvedValue(mockConstructs);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleMapConstructs();
      });

      expect(mockSetLoadingConstructs).toHaveBeenCalledWith(true);
      expect(enhancedThemeIntegrationService.mapConstructs).toHaveBeenCalledWith({
        themes: expect.any(Array),
        includeRelationships: true,
      });
      expect(mockSetConstructMappings).toHaveBeenCalledWith(mockConstructs);
      expect(toast.success).toHaveBeenCalledWith('Mapped 1 constructs');
      expect(mockSetLoadingConstructs).toHaveBeenCalledWith(false);
    });

    it('should validate theme selection', async () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: [],
            mappedSelectedThemes: [],
          })
        )
      );

      await act(async () => {
        await result.current.handleMapConstructs();
      });

      expect(toast.error).toHaveBeenCalledWith('Please select themes first');
      expect(enhancedThemeIntegrationService.mapConstructs).not.toHaveBeenCalled();
    });

    it('should handle construct mapping errors', async () => {
      const error = new Error('Mapping failed');
      vi.mocked(enhancedThemeIntegrationService.mapConstructs).mockRejectedValue(error);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleMapConstructs();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to map constructs: Mapping failed');
      expect(mockSetLoadingConstructs).toHaveBeenCalledWith(false);
    });
  });

  describe('handleGenerateSurvey', () => {
    it('should generate survey successfully', async () => {
      const mockSurvey = {
        sections: [
          {
            title: 'Section 1',
            items: [
              {
                id: 'item-1',
                text: 'Question 1',
                type: 'likert',
                themeProvenance: ['theme-1'],
                scaleType: '5-point',
              },
            ],
          },
        ],
        metadata: {
          totalItems: 1,
          estimatedCompletionTime: 5,
        },
      };

      vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockResolvedValue(
        mockSurvey
      );

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      const config = {
        purpose: 'exploratory' as const,
        targetRespondents: 100,
        complexityLevel: 'intermediate' as const,
        includeDemographics: true,
        includeValidityChecks: true,
        includeOpenEnded: false,
      };

      await act(async () => {
        await result.current.handleGenerateSurvey(config);
      });

      expect(mockSetLoadingSurvey).toHaveBeenCalledWith(true);
      expect(enhancedThemeIntegrationService.generateCompleteSurvey).toHaveBeenCalledWith({
        themes: expect.any(Array),
        surveyPurpose: 'exploratory',
        targetRespondentCount: 100,
        complexityLevel: 'intermediate',
        includeDemographics: true,
        includeValidityChecks: true,
      });
      expect(mockSetGeneratedSurvey).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.any(Array),
          metadata: expect.objectContaining({
            totalItems: 1,
            purpose: 'exploratory',
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Survey generated successfully!');
      expect(mockSetLoadingSurvey).toHaveBeenCalledWith(false);
    });

    it('should validate theme selection', async () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: [],
            mappedSelectedThemes: [],
          })
        )
      );

      const config = {
        purpose: 'exploratory' as const,
        targetRespondents: 100,
        complexityLevel: 'intermediate' as const,
        includeDemographics: true,
        includeValidityChecks: true,
        includeOpenEnded: false,
      };

      await act(async () => {
        await result.current.handleGenerateSurvey(config);
      });

      expect(toast.error).toHaveBeenCalledWith('Please select themes first');
      expect(enhancedThemeIntegrationService.generateCompleteSurvey).not.toHaveBeenCalled();
    });

    it('should handle survey generation errors', async () => {
      const error = new Error('Generation timeout');
      vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockRejectedValue(error);

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      const config = {
        purpose: 'confirmatory' as const,
        targetRespondents: 200,
        complexityLevel: 'advanced' as const,
        includeDemographics: false,
        includeValidityChecks: true,
        includeOpenEnded: true,
      };

      await act(async () => {
        await result.current.handleGenerateSurvey(config);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to generate survey: Generation timeout');
      expect(mockSetLoadingSurvey).toHaveBeenCalledWith(false);
    });

    it('should calculate theme coverage in metadata', async () => {
      const mockSurvey = {
        sections: [
          {
            title: 'Section 1',
            items: [
              { id: 'i1', text: 'Q1', type: 'likert', themeProvenance: ['theme-1', 'theme-2'] },
              { id: 'i2', text: 'Q2', type: 'multiple', themeProvenance: ['theme-1'] },
            ],
          },
        ],
        metadata: { totalItems: 2, estimatedCompletionTime: 10 },
      };

      vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockResolvedValue(
        mockSurvey
      );

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      const config = {
        purpose: 'mixed' as const,
        targetRespondents: 50,
        complexityLevel: 'basic' as const,
        includeDemographics: true,
        includeValidityChecks: false,
        includeOpenEnded: true,
      };

      await act(async () => {
        await result.current.handleGenerateSurvey(config);
      });

      expect(mockSetGeneratedSurvey).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            themeCoverage: expect.arrayContaining([
              expect.objectContaining({
                themeId: 'theme-1',
                itemCount: 2,
              }),
              expect.objectContaining({
                themeId: 'theme-2',
                itemCount: 1,
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('handleGenerateStatements', () => {
    it('should generate Q-statements from themes', () => {
      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      act(() => {
        result.current.handleGenerateStatements();
      });

      expect(mockSetQStatements).toHaveBeenCalledWith([
        'Theme 1: Description for Theme 1',
        'Theme 2: Description for Theme 2',
        'Theme 3: Description for Theme 3',
      ]);
      expect(toast.success).toHaveBeenCalledWith('Generated 3 Q-statements from themes');
    });

    it('should validate theme selection', () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: [],
            mappedSelectedThemes: [],
          })
        )
      );

      act(() => {
        result.current.handleGenerateStatements();
      });

      expect(toast.error).toHaveBeenCalledWith('Please select themes first');
      expect(mockSetQStatements).not.toHaveBeenCalled();
    });

    it('should log statement generation', () => {
      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      act(() => {
        result.current.handleGenerateStatements();
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Generating Q-statements',
        'useThemeApiHandlers',
        expect.objectContaining({ selectedCount: 3 })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Q-statements generated',
        'useThemeApiHandlers',
        expect.objectContaining({ count: 3 })
      );
    });
  });

  describe('handleShowSurveyModal', () => {
    it('should trigger survey generation with default config', async () => {
      vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockResolvedValue({
        sections: [],
        metadata: { totalItems: 0, estimatedCompletionTime: 0 },
      });

      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            extractionPurpose: 'survey_construction',
          })
        )
      );

      await act(async () => {
        result.current.handleShowSurveyModal();
      });

      await waitFor(() => {
        expect(enhancedThemeIntegrationService.generateCompleteSurvey).toHaveBeenCalledWith(
          expect.objectContaining({
            surveyPurpose: 'exploratory',
            targetRespondentCount: 100,
            complexityLevel: 'intermediate',
            includeDemographics: true,
            includeValidityChecks: true,
          })
        );
      });
    });

    it('should map research purpose to survey purpose', async () => {
      const purposeMappings = [
        { extractionPurpose: 'literature_synthesis', expectedSurveyPurpose: 'exploratory' },
        { extractionPurpose: 'hypothesis_generation', expectedSurveyPurpose: 'confirmatory' },
        { extractionPurpose: 'q_methodology', expectedSurveyPurpose: 'exploratory' },
        { extractionPurpose: 'qualitative_analysis', expectedSurveyPurpose: 'mixed' },
      ];

      for (const { extractionPurpose, expectedSurveyPurpose } of purposeMappings) {
        vi.clearAllMocks();
        vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockResolvedValue({
          sections: [],
          metadata: { totalItems: 0, estimatedCompletionTime: 0 },
        });

        const { result } = renderHook(() =>
          useThemeApiHandlers(
            createDefaultParams({
              extractionPurpose: extractionPurpose as any,
            })
          )
        );

        await act(async () => {
          result.current.handleShowSurveyModal();
        });

        await waitFor(() => {
          expect(enhancedThemeIntegrationService.generateCompleteSurvey).toHaveBeenCalledWith(
            expect.objectContaining({
              surveyPurpose: expectedSurveyPurpose,
            })
          );
        });
      }
    });

    it('should use mixed purpose when extractionPurpose is null', async () => {
      vi.mocked(enhancedThemeIntegrationService.generateCompleteSurvey).mockResolvedValue({
        sections: [],
        metadata: { totalItems: 0, estimatedCompletionTime: 0 },
      });

      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            extractionPurpose: null,
          })
        )
      );

      await act(async () => {
        result.current.handleShowSurveyModal();
      });

      await waitFor(() => {
        expect(enhancedThemeIntegrationService.generateCompleteSurvey).toHaveBeenCalledWith(
          expect.objectContaining({
            surveyPurpose: 'mixed',
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should reflect loading states from params', () => {
      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            loadingQuestions: true,
            loadingHypotheses: true,
            loadingConstructs: false,
            loadingSurvey: false,
          })
        )
      );

      expect(result.current.loadingQuestions).toBe(true);
      expect(result.current.loadingHypotheses).toBe(true);
      expect(result.current.loadingConstructs).toBe(false);
      expect(result.current.loadingSurvey).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown error types', async () => {
      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockRejectedValue(
        'String error'
      );

      const { result } = renderHook(() => useThemeApiHandlers(createDefaultParams()));

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to generate questions: Unknown error');
    });

    it('should handle single theme selection', async () => {
      vi.mocked(enhancedThemeIntegrationService.suggestQuestions).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: ['theme-1'],
            mappedSelectedThemes: [createMockTheme('theme-1', 'Theme 1')],
          })
        )
      );

      await act(async () => {
        await result.current.handleGenerateQuestions();
      });

      expect(enhancedThemeIntegrationService.suggestQuestions).toHaveBeenCalled();
    });

    it('should handle large number of themes', async () => {
      const largeThemeSet = createMockThemes(50);
      vi.mocked(enhancedThemeIntegrationService.mapConstructs).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useThemeApiHandlers(
          createDefaultParams({
            selectedThemeIds: largeThemeSet.map((t) => t.id),
            mappedSelectedThemes: largeThemeSet,
          })
        )
      );

      await act(async () => {
        await result.current.handleMapConstructs();
      });

      expect(enhancedThemeIntegrationService.mapConstructs).toHaveBeenCalledWith(
        expect.objectContaining({
          themes: expect.arrayContaining(largeThemeSet),
        })
      );
    });
  });
});
