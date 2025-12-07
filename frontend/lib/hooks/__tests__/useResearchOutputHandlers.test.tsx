/**
 * useResearchOutputHandlers Hook - Unit Tests
 * Phase 10.101: Medium-Term Code Quality Improvements
 *
 * **Test Coverage:**
 * - Research question handlers (select, operationalize)
 * - Hypothesis handlers (select, test)
 * - Construct interaction handlers (click, relationship click)
 * - Survey handlers (edit, export)
 * - Navigation integration
 * - Storage persistence
 * - Export formats (JSON, CSV)
 * - Error handling
 *
 * **Target Coverage:** 80%+
 *
 * @module hooks/__tests__/useResearchOutputHandlers.test
 * @since Phase 10.101
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResearchOutputHandlers } from '../useResearchOutputHandlers';
import type { UseResearchOutputHandlersParams } from '../useResearchOutputHandlers';
import type {
  ResearchQuestionSuggestion as ResearchQuestion,
  Theme,
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import type { HypothesisSuggestion as HypothesisSuggestionType } from '@/components/literature';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/lib/api/services/enhanced-theme-integration-api.service', () => ({
  saveResearchQuestions: vi.fn(),
  saveHypotheses: vi.fn(),
}));

import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import {
  saveResearchQuestions,
  saveHypotheses,
} from '@/lib/api/services/enhanced-theme-integration-api.service';

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

const createMockQuestion = (id: string): ResearchQuestion => ({
  id,
  question: `Research question ${id}`,
  rationale: `Rationale for ${id}`,
  relatedThemes: ['theme-1', 'theme-2'],
  methodology: 'quantitative',
  feasibility: 'high',
});

const createMockHypothesis = (id: string): HypothesisSuggestionType => ({
  id,
  statement: `Hypothesis ${id}`,
  type: 'correlational',
  variables: ['var1', 'var2'],
  rationale: `Rationale for ${id}`,
  testability: 'high',
  relatedThemes: ['theme-1'],
});

const createMockSurvey = () => ({
  sections: [
    {
      title: 'Section 1',
      items: [
        {
          id: 'item-1',
          text: 'Question 1',
          type: 'likert',
          themeProvenance: ['theme-1', 'theme-2'],
          scaleType: '5-point',
          options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        },
        {
          id: 'item-2',
          text: 'Question 2',
          type: 'multiple',
          themeProvenance: ['theme-1'],
          options: ['Option A', 'Option B', 'Option C'],
        },
      ],
    },
  ],
  metadata: {
    totalItems: 2,
    estimatedCompletionTime: 5,
    themeCoverage: [
      { themeId: 'theme-1', themeName: 'Theme 1', itemCount: 2 },
      { themeId: 'theme-2', themeName: 'Theme 2', itemCount: 1 },
    ],
    generatedAt: '2024-01-01T00:00:00Z',
    purpose: 'exploratory',
  },
});

describe('useResearchOutputHandlers', () => {
  let mockRouterPush: ReturnType<typeof vi.fn>;
  let mockLocalStorage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    mockRouterPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
    } as any);

    // Setup localStorage mock (already mocked in setup.ts, just clear calls)
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock URL and Blob for export tests
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDefaultParams = (
    overrides: Partial<UseResearchOutputHandlersParams> = {}
  ): UseResearchOutputHandlersParams => ({
    mappedSelectedThemes: [
      createMockTheme('theme-1', 'Theme 1'),
      createMockTheme('theme-2', 'Theme 2'),
    ],
    constructMappings: [
      {
        construct: { id: 'c1', name: 'Construct 1', themes: ['theme-1'] },
        relatedConstructs: [
          { constructId: 'c2', relationshipType: 'correlation', confidence: 0.8 },
        ],
      },
      {
        construct: { id: 'c2', name: 'Construct 2', themes: ['theme-2'] },
        relatedConstructs: [],
      },
    ],
    generatedSurvey: createMockSurvey(),
    extractionPurpose: 'q_methodology',
    ...overrides,
  });

  describe('Hook Initialization', () => {
    it('should return all handler functions', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      expect(result.current.handleSelectQuestion).toBeInstanceOf(Function);
      expect(result.current.handleOperationalizeQuestion).toBeInstanceOf(Function);
      expect(result.current.handleSelectHypothesis).toBeInstanceOf(Function);
      expect(result.current.handleTestHypothesis).toBeInstanceOf(Function);
      expect(result.current.handleConstructClick).toBeInstanceOf(Function);
      expect(result.current.handleRelationshipClick).toBeInstanceOf(Function);
      expect(result.current.handleEditSurvey).toBeInstanceOf(Function);
      expect(result.current.handleExportSurvey).toBeInstanceOf(Function);
    });

    it('should have stable function references with same dependencies', () => {
      const params = createDefaultParams();
      const { result, rerender } = renderHook(
        ({ hookParams }) => useResearchOutputHandlers(hookParams),
        { initialProps: { hookParams: params } }
      );

      const firstHandleSelectQuestion = result.current.handleSelectQuestion;
      const firstHandleEditSurvey = result.current.handleEditSurvey;

      // Rerender with same params (dependencies unchanged)
      rerender({ hookParams: params });

      expect(result.current.handleSelectQuestion).toBe(firstHandleSelectQuestion);
      expect(result.current.handleEditSurvey).toBe(firstHandleEditSurvey);
    });
  });

  describe('handleSelectQuestion', () => {
    it('should save question and navigate to design page', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));
      const mockQuestion = createMockQuestion('q1');

      act(() => {
        result.current.handleSelectQuestion(mockQuestion);
      });

      expect(saveResearchQuestions).toHaveBeenCalledWith(
        [mockQuestion],
        expect.arrayContaining([
          expect.objectContaining({ id: 'theme-1' }),
          expect.objectContaining({ id: 'theme-2' }),
        ])
      );
      expect(toast.success).toHaveBeenCalledWith('Research question saved. Opening design page...');
      expect(mockRouterPush).toHaveBeenCalledWith('/design?source=themes&step=question');
    });

    it('should handle multiple questions', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));
      const mockQuestion1 = createMockQuestion('q1');
      const mockQuestion2 = createMockQuestion('q2');

      act(() => {
        result.current.handleSelectQuestion(mockQuestion1);
      });

      act(() => {
        result.current.handleSelectQuestion(mockQuestion2);
      });

      expect(saveResearchQuestions).toHaveBeenCalledTimes(2);
      expect(mockRouterPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleOperationalizeQuestion', () => {
    it('should save question and navigate to operationalization panel', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));
      const mockQuestion = createMockQuestion('q1');

      act(() => {
        result.current.handleOperationalizeQuestion(mockQuestion);
      });

      expect(saveResearchQuestions).toHaveBeenCalledWith([mockQuestion], expect.any(Array));
      expect(toast.success).toHaveBeenCalledWith('Opening operationalization panel...');
      expect(mockRouterPush).toHaveBeenCalledWith('/design?source=themes&step=question');
    });
  });

  describe('handleSelectHypothesis', () => {
    it('should save hypothesis and navigate to design page', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));
      const mockHypothesis = createMockHypothesis('h1');

      act(() => {
        result.current.handleSelectHypothesis(mockHypothesis);
      });

      expect(saveHypotheses).toHaveBeenCalledWith(
        [mockHypothesis],
        expect.arrayContaining([
          expect.objectContaining({ id: 'theme-1' }),
          expect.objectContaining({ id: 'theme-2' }),
        ])
      );
      expect(toast.success).toHaveBeenCalledWith('Hypothesis saved. Opening design page...');
      expect(mockRouterPush).toHaveBeenCalledWith('/design?source=themes&step=hypotheses');
    });
  });

  describe('handleTestHypothesis', () => {
    it('should save hypothesis and navigate to testing panel', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));
      const mockHypothesis = createMockHypothesis('h1');

      act(() => {
        result.current.handleTestHypothesis(mockHypothesis);
      });

      expect(saveHypotheses).toHaveBeenCalledWith([mockHypothesis], expect.any(Array));
      expect(toast.success).toHaveBeenCalledWith('Opening hypothesis testing panel...');
      expect(mockRouterPush).toHaveBeenCalledWith('/design?source=themes&step=hypotheses');
    });
  });

  describe('handleConstructClick', () => {
    it('should show construct details in toast', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleConstructClick('c1');
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Construct 1: 1 themes, 1 relationships',
        { duration: 4000 }
      );
    });

    it('should handle construct with no relationships', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleConstructClick('c2');
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Construct 2: 1 themes, 0 relationships',
        { duration: 4000 }
      );
    });

    it('should handle non-existent construct ID gracefully', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleConstructClick('non-existent');
      });

      // Should not crash, just not show toast
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  describe('handleRelationshipClick', () => {
    it('should show relationship details in toast', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleRelationshipClick('c1', 'c2');
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Relationship: Construct 1 → Construct 2',
        { duration: 3000 }
      );
    });

    it('should handle reverse relationship direction', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleRelationshipClick('c2', 'c1');
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Relationship: Construct 2 → Construct 1',
        { duration: 3000 }
      );
    });

    it('should handle non-existent relationship gracefully', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleRelationshipClick('c1', 'non-existent');
      });

      // Should not crash
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  describe('handleEditSurvey', () => {
    it('should save survey to localStorage and navigate to builder', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleEditSurvey();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'theme_generated_survey',
        expect.stringContaining('"survey"')
      );

      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      expect(savedData).toMatchObject({
        survey: expect.objectContaining({
          sections: expect.any(Array),
          metadata: expect.any(Object),
        }),
        themes: expect.arrayContaining([
          expect.objectContaining({ id: 'theme-1' }),
          expect.objectContaining({ id: 'theme-2' }),
        ]),
        purpose: 'q_methodology',
        generatedAt: expect.any(String),
      });

      expect(toast.success).toHaveBeenCalledWith('Survey saved. Opening Questionnaire Builder...');
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/questionnaire/builder-pro?import=survey&source=themes'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Survey saved for editing',
        'useResearchOutputHandlers'
      );
    });

    it('should handle localStorage error gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleEditSurvey();
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to save survey',
        'useResearchOutputHandlers',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to save survey. Please try again.');
    });

    it('should use qualitative_analysis as default purpose', () => {
      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            extractionPurpose: null,
          })
        )
      );

      act(() => {
        result.current.handleEditSurvey();
      });

      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      expect(savedData.purpose).toBe('qualitative_analysis');
    });
  });

  describe('handleExportSurvey - JSON Format', () => {
    it('should export survey as JSON', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      act(() => {
        result.current.handleExportSurvey('json');
      });

      // Verify Blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Verify download link was created and clicked
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');

      expect(toast.success).toHaveBeenCalledWith('Survey exported as JSON');
      expect(logger.info).toHaveBeenCalledWith(
        'Survey exported',
        'useResearchOutputHandlers',
        { format: 'JSON' }
      );

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should include metadata in JSON export', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      let exportedBlob: Blob | null = null;
      vi.spyOn(global, 'Blob').mockImplementation((content: any, options: any) => {
        exportedBlob = { content, options } as any;
        return exportedBlob as Blob;
      });

      act(() => {
        result.current.handleExportSurvey('json');
      });

      expect(exportedBlob).not.toBeNull();
      const jsonContent = (exportedBlob as any).content[0];
      const parsedData = JSON.parse(jsonContent);

      expect(parsedData).toMatchObject({
        survey: expect.any(Object),
        themes: expect.any(Array),
        metadata: expect.objectContaining({
          platform: 'VQMethod',
          purpose: 'q_methodology',
        }),
      });
    });
  });

  describe('handleExportSurvey - CSV Format', () => {
    it('should export survey as CSV', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      expect(toast.success).toHaveBeenCalledWith('Survey exported as CSV');
      expect(logger.info).toHaveBeenCalledWith(
        'Survey exported',
        'useResearchOutputHandlers',
        { format: 'CSV' }
      );

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should properly format CSV with headers', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      let exportedBlob: Blob | null = null;
      vi.spyOn(global, 'Blob').mockImplementation((content: any, options: any) => {
        exportedBlob = { content, options } as any;
        return exportedBlob as Blob;
      });

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      expect(exportedBlob).not.toBeNull();
      const csvContent = (exportedBlob as any).content[0];
      const rows = csvContent.split('\n');

      // Check header
      expect(rows[0]).toBe('Section,Item ID,Text,Type,Scale');

      // Check data rows
      expect(rows[1]).toContain('"Section 1"');
      expect(rows[1]).toContain('"item-1"');
      expect(rows[1]).toContain('"Question 1"');
      expect(rows[1]).toContain('"likert"');
      // CSV uses options array when available, so it should contain the pipe-separated options
      expect(rows[1]).toContain('Strongly Disagree | Disagree | Neutral | Agree | Strongly Agree');
    });

    it('should escape quotes in CSV properly', () => {
      const surveyWithQuotes = createMockSurvey();
      surveyWithQuotes.sections[0].items[0].text = 'Question with "quotes" inside';

      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            generatedSurvey: surveyWithQuotes,
          })
        )
      );

      let exportedBlob: Blob | null = null;
      vi.spyOn(global, 'Blob').mockImplementation((content: any, options: any) => {
        exportedBlob = { content, options } as any;
        return exportedBlob as Blob;
      });

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      const csvContent = (exportedBlob as any).content[0];
      // CSV should escape quotes by doubling them
      expect(csvContent).toContain('Question with ""quotes"" inside');
    });

    it('should handle items with options array', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      let exportedBlob: Blob | null = null;
      vi.spyOn(global, 'Blob').mockImplementation((content: any, options: any) => {
        exportedBlob = { content, options } as any;
        return exportedBlob as Blob;
      });

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      const csvContent = (exportedBlob as any).content[0];
      const rows = csvContent.split('\n');

      // Second item has options array
      expect(rows[2]).toContain('Option A | Option B | Option C');
    });

    it('should handle null survey gracefully', () => {
      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            generatedSurvey: null,
          })
        )
      );

      // Should not crash
      act(() => {
        result.current.handleExportSurvey('csv');
      });

      // No export should happen
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('handleExportSurvey - Other Formats', () => {
    it('should show "coming soon" message for PDF export', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleExportSurvey('pdf');
      });

      expect(toast.info).toHaveBeenCalledWith('PDF export coming soon! Use JSON/CSV for now.');
    });

    it('should show "coming soon" message for Word export', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleExportSurvey('word');
      });

      expect(toast.info).toHaveBeenCalledWith('WORD export coming soon! Use JSON/CSV for now.');
    });

    it('should show error for unsupported format', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleExportSurvey('invalid-format');
      });

      expect(toast.error).toHaveBeenCalledWith('Unsupported export format');
      expect(logger.warn).toHaveBeenCalledWith(
        'Unsupported export format requested',
        'useResearchOutputHandlers',
        { format: 'invalid-format' }
      );
    });
  });

  describe('Export Error Handling', () => {
    it('should handle export errors gracefully', () => {
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob creation failed');
      });

      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      act(() => {
        result.current.handleExportSurvey('json');
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Export failed',
        'useResearchOutputHandlers',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to export survey. Please try again.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty themes array', () => {
      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            mappedSelectedThemes: [],
          })
        )
      );

      const mockQuestion = createMockQuestion('q1');

      act(() => {
        result.current.handleSelectQuestion(mockQuestion);
      });

      expect(saveResearchQuestions).toHaveBeenCalledWith([mockQuestion], []);
    });

    it('should handle empty construct mappings', () => {
      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            constructMappings: [],
          })
        )
      );

      act(() => {
        result.current.handleConstructClick('c1');
      });

      // Should not crash
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('should handle survey with no items', () => {
      const emptySurvey = {
        sections: [{ title: 'Empty Section', items: [] }],
        metadata: {
          totalItems: 0,
          estimatedCompletionTime: 0,
          themeCoverage: [],
          generatedAt: '2024-01-01T00:00:00Z',
          purpose: 'exploratory',
        },
      };

      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            generatedSurvey: emptySurvey,
          })
        )
      );

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      // Should still export header
      expect(toast.success).toHaveBeenCalledWith('Survey exported as CSV');
    });

    it('should handle items without scale type or options', () => {
      const surveyWithMinimalItem = {
        sections: [
          {
            title: 'Section',
            items: [
              {
                id: 'item-1',
                text: 'Minimal item',
                type: 'text',
                themeProvenance: ['theme-1'],
                // No scaleType or options
              },
            ],
          },
        ],
        metadata: {
          totalItems: 1,
          estimatedCompletionTime: 1,
          themeCoverage: [],
          generatedAt: '2024-01-01T00:00:00Z',
          purpose: 'mixed',
        },
      };

      const { result } = renderHook(() =>
        useResearchOutputHandlers(
          createDefaultParams({
            generatedSurvey: surveyWithMinimalItem,
          })
        )
      );

      let exportedBlob: Blob | null = null;
      vi.spyOn(global, 'Blob').mockImplementation((content: any, options: any) => {
        exportedBlob = { content, options } as any;
        return exportedBlob as Blob;
      });

      act(() => {
        result.current.handleExportSurvey('csv');
      });

      expect(exportedBlob).not.toBeNull();
      const csvContent = (exportedBlob as any).content[0];
      // Should have empty scale column
      expect(csvContent).toContain(',"text",""');
    });
  });

  describe('Memory Management', () => {
    it('should revoke blob URLs after export', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      act(() => {
        result.current.handleExportSurvey('json');
      });

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should cleanup DOM elements after export', () => {
      const { result } = renderHook(() => useResearchOutputHandlers(createDefaultParams()));

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      act(() => {
        result.current.handleExportSurvey('json');
      });

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledTimes(removeChildSpy.mock.calls.length);

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
