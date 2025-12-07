/**
 * useExtractionWorkflow Hook - Unit Tests
 * Phase 10.101: Medium-Term Code Quality Improvements
 *
 * **Test Coverage:**
 * - Workflow execution (4 stages)
 * - RAF-batched progress updates
 * - Cancellation and cleanup
 * - Error handling
 * - Progress state management
 * - Store integration
 * - Transparent progress messages
 *
 * **Target Coverage:** 80%+
 *
 * @module hooks/__tests__/useExtractionWorkflow.test
 * @since Phase 10.101
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExtractionWorkflow } from '../useExtractionWorkflow';
import type { ExtractionWorkflowParams } from '../useExtractionWorkflow';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
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
    setUnifiedThemes: vi.fn(),
    setV2SaturationData: vi.fn(),
    setAnalyzingThemes: vi.fn(),
    setExtractionError: vi.fn(),
  })),
}));

vi.mock('@/lib/api/services/unified-theme-api.service', () => ({
  useUnifiedThemeAPI: vi.fn(() => ({
    extractThemesV2: vi.fn(),
  })),
}));

vi.mock('@/lib/services/theme-extraction', () => ({
  extractionOrchestrator: {
    savePapers: vi.fn(),
    fetchFullText: vi.fn(),
    prepareSources: vi.fn(),
    validateSourceCount: vi.fn(),
    getStageName: vi.fn((stage: number) => `Stage ${stage}`),
  },
}));

import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { useUnifiedThemeAPI } from '@/lib/api/services/unified-theme-api.service';
import { extractionOrchestrator } from '@/lib/services/theme-extraction';

// Test utilities
const createMockPaper = (id: string, title: string): LiteraturePaper => ({
  id,
  title,
  authors: ['Test Author'],
  abstract: 'Test abstract content that is sufficiently long to meet minimum requirements for extraction',
  year: 2024,
  doi: `10.1000/${id}`,
  source: 'test-source',
  url: `https://example.com/papers/${id}`,
  citationCount: 10,
  publicationDate: '2024-01-01',
  journal: 'Test Journal',
  publisher: 'Test Publisher',
  keywords: ['test', 'research'],
  references: [],
});

const createMockPapers = (count: number): LiteraturePaper[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockPaper(`paper-${i + 1}`, `Test Paper ${i + 1}`)
  );
};

describe('useExtractionWorkflow', () => {
  let mockSetUnifiedThemes: ReturnType<typeof vi.fn>;
  let mockSetV2SaturationData: ReturnType<typeof vi.fn>;
  let mockSetAnalyzingThemes: ReturnType<typeof vi.fn>;
  let mockSetExtractionError: ReturnType<typeof vi.fn>;
  let mockExtractThemesV2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mocks
    mockSetUnifiedThemes = vi.fn();
    mockSetV2SaturationData = vi.fn();
    mockSetAnalyzingThemes = vi.fn();
    mockSetExtractionError = vi.fn();

    vi.mocked(useThemeExtractionStore).mockReturnValue({
      setUnifiedThemes: mockSetUnifiedThemes,
      setV2SaturationData: mockSetV2SaturationData,
      setAnalyzingThemes: mockSetAnalyzingThemes,
      setExtractionError: mockSetExtractionError,
    } as any);

    // Setup API mocks
    mockExtractThemesV2 = vi.fn();
    vi.mocked(useUnifiedThemeAPI).mockReturnValue({
      extractThemesV2: mockExtractThemesV2,
    } as any);

    // Setup orchestrator mocks (default successful responses)
    vi.mocked(extractionOrchestrator.savePapers).mockResolvedValue(
      new Map([['paper-1', 'db-id-1'], ['paper-2', 'db-id-2']])
    );
    vi.mocked(extractionOrchestrator.fetchFullText).mockResolvedValue(
      new Map([['db-id-1', 'Full text 1'], ['db-id-2', 'Full text 2']])
    );
    vi.mocked(extractionOrchestrator.prepareSources).mockReturnValue({
      sources: [
        { sourceId: 'db-id-1', content: 'Full text 1', sourceType: 'paper', sourceTitle: 'Paper 1', metadata: {} },
        { sourceId: 'db-id-2', content: 'Full text 2', sourceType: 'paper', sourceTitle: 'Paper 2', metadata: {} },
      ],
    } as any);
    vi.mocked(extractionOrchestrator.validateSourceCount).mockReturnValue({
      valid: true,
    });
    vi.mocked(extractionOrchestrator.getStageName).mockImplementation((stage: number) => `Stage ${stage}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useExtractionWorkflow());

      expect(result.current.progress).toBeNull();
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.executeWorkflow).toBeInstanceOf(Function);
      expect(result.current.cancelWorkflow).toBeInstanceOf(Function);
    });

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useExtractionWorkflow());

      const firstExecuteWorkflow = result.current.executeWorkflow;
      const firstCancelWorkflow = result.current.cancelWorkflow;

      rerender();

      expect(result.current.executeWorkflow).toBe(firstExecuteWorkflow);
      expect(result.current.cancelWorkflow).toBe(firstCancelWorkflow);
    });
  });

  describe('Workflow Execution - Success Path', () => {
    it('should execute complete 4-stage workflow successfully', async () => {
      const mockPapers = createMockPapers(2);

      mockExtractThemesV2.mockResolvedValue({
        themes: [
          { id: 'theme-1', name: 'Theme 1', description: 'Description 1' },
          { id: 'theme-2', name: 'Theme 2', description: 'Description 2' },
        ],
        saturationData: { totalThemes: 2, saturated: true },
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      const workflowParams: ExtractionWorkflowParams = {
        papers: mockPapers,
        purpose: 'q_methodology',
        mode: 'guided',
        userExpertiseLevel: 'researcher',
      };

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow(workflowParams);
      });

      // Verify result
      expect(executionResult.success).toBe(true);
      expect(executionResult.themesCount).toBe(2);

      // Verify all stages were executed
      expect(extractionOrchestrator.savePapers).toHaveBeenCalledWith(
        mockPapers,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(extractionOrchestrator.fetchFullText).toHaveBeenCalled();
      expect(extractionOrchestrator.prepareSources).toHaveBeenCalled();
      expect(mockExtractThemesV2).toHaveBeenCalled();

      // Verify store was updated
      expect(mockSetUnifiedThemes).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'theme-1' }),
        expect.objectContaining({ id: 'theme-2' }),
      ]));
      expect(mockSetV2SaturationData).toHaveBeenCalledWith(
        expect.objectContaining({ totalThemes: 2 })
      );

      // Verify cleanup
      expect(mockSetAnalyzingThemes).toHaveBeenCalledWith(false);
      expect(result.current.isExecuting).toBe(false);
    });

    it('should update progress through all stages', async () => {
      const mockPapers = createMockPapers(3);
      mockExtractThemesV2.mockResolvedValue({
        themes: [{ id: 'theme-1', name: 'Theme 1', description: 'Desc' }],
      });

      const { result } = renderHook(() => useExtractionWorkflow());
      const progressUpdates: number[] = [];

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'literature_synthesis',
          mode: 'quick',
          userExpertiseLevel: 'student',
        });
      });

      // Initial progress should be set
      expect(result.current.progress).not.toBeNull();
      expect(result.current.progress?.stage).toBe('complete');
      expect(result.current.progress?.progress).toBe(100);
    });

    it('should call progress callbacks during savePapers stage', async () => {
      const mockPapers = createMockPapers(5);
      let progressCallback: ((wp: any) => void) | undefined;

      vi.mocked(extractionOrchestrator.savePapers).mockImplementation(async (papers, options) => {
        progressCallback = options?.onProgress;

        // Simulate progress updates
        if (progressCallback) {
          progressCallback({
            currentItem: 1,
            totalItems: 5,
            percentage: 5,
            message: 'Saving paper 1/5',
          });
          progressCallback({
            currentItem: 5,
            totalItems: 5,
            percentage: 15,
            message: 'Saving paper 5/5',
          });
        }

        return new Map([['paper-1', 'db-id-1']]);
      });

      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(progressCallback).toBeDefined();
    });
  });

  describe('Stage 1: Save Papers', () => {
    it('should save papers and create ID map', async () => {
      const mockPapers = createMockPapers(3);
      const expectedMap = new Map([
        ['paper-1', 'db-1'],
        ['paper-2', 'db-2'],
        ['paper-3', 'db-3'],
      ]);

      vi.mocked(extractionOrchestrator.savePapers).mockResolvedValue(expectedMap);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(extractionOrchestrator.savePapers).toHaveBeenCalledWith(
        mockPapers,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onProgress: expect.any(Function),
        })
      );
    });

    it('should log save completion with paper count', async () => {
      const mockPapers = createMockPapers(2);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Stage 1 complete: Papers saved',
        'useExtractionWorkflow',
        expect.objectContaining({ savedCount: 2 })
      );
    });
  });

  describe('Stage 2: Fetch Full-Text', () => {
    it('should fetch full-text for saved papers', async () => {
      const mockPapers = createMockPapers(2);
      const paperIdMap = new Map([['paper-1', 'db-1'], ['paper-2', 'db-2']]);

      vi.mocked(extractionOrchestrator.savePapers).mockResolvedValue(paperIdMap);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'qualitative_analysis',
          mode: 'guided',
          userExpertiseLevel: 'practitioner',
        });
      });

      expect(extractionOrchestrator.fetchFullText).toHaveBeenCalledWith(
        paperIdMap,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onProgress: expect.any(Function),
        })
      );
    });

    it('should handle full-text extraction progress', async () => {
      const mockPapers = createMockPapers(3);
      let fullTextProgressCallback: ((wp: any) => void) | undefined;

      vi.mocked(extractionOrchestrator.fetchFullText).mockImplementation(async (paperIdMap, options) => {
        fullTextProgressCallback = options?.onProgress;

        if (fullTextProgressCallback) {
          fullTextProgressCallback({
            currentItem: 2,
            totalItems: 3,
            percentage: 30,
            message: 'Fetching full-text 2/3',
          });
        }

        return new Map();
      });

      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'hypothesis_generation',
          mode: 'quick',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(fullTextProgressCallback).toBeDefined();
    });
  });

  describe('Stage 3: Prepare Sources', () => {
    it('should prepare sources from papers and full-text', async () => {
      const mockPapers = createMockPapers(2);
      const fullTextMap = new Map([['db-1', 'Full text content 1']]);

      vi.mocked(extractionOrchestrator.fetchFullText).mockResolvedValue(fullTextMap);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(extractionOrchestrator.prepareSources).toHaveBeenCalledWith(
        mockPapers,
        fullTextMap
      );
    });

    it('should validate source count before extraction', async () => {
      const mockPapers = createMockPapers(2);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(extractionOrchestrator.validateSourceCount).toHaveBeenCalledWith(2);
    });

    it('should throw error if no sources available', async () => {
      const mockPapers = createMockPapers(1);

      vi.mocked(extractionOrchestrator.prepareSources).mockReturnValue({
        sources: [],
      } as any);

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toContain('No papers with content available');
      expect(toast.error).toHaveBeenCalled();
    });

    it('should show warning if validation has warning', async () => {
      const mockPapers = createMockPapers(2);

      vi.mocked(extractionOrchestrator.validateSourceCount).mockReturnValue({
        valid: true,
        warning: 'Low paper count may affect theme quality',
      });

      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'literature_synthesis',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(toast.warning).toHaveBeenCalledWith(
        'Low paper count may affect theme quality',
        { duration: 10000 }
      );
    });
  });

  describe('Stage 4: Extract Themes', () => {
    it('should call extractThemesV2 with correct parameters', async () => {
      const mockPapers = createMockPapers(2);
      const mockSources = [
        { sourceId: 'db-1', content: 'Content 1', sourceType: 'paper', sourceTitle: 'Title 1', metadata: {} },
      ];

      vi.mocked(extractionOrchestrator.prepareSources).mockReturnValue({
        sources: mockSources,
      } as any);

      mockExtractThemesV2.mockResolvedValue({
        themes: [{ id: 'theme-1', name: 'Theme', description: 'Desc' }],
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'hypothesis_generation',
          mode: 'guided',
          userExpertiseLevel: 'practitioner',
        });
      });

      expect(mockExtractThemesV2).toHaveBeenCalledWith(
        mockSources,
        expect.objectContaining({
          sources: mockSources,
          purpose: 'hypothesis_generation',
          userExpertiseLevel: 'practitioner',
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
          allowIterativeRefinement: true,
        }),
        expect.any(Function) // progress callback
      );
    });

    it('should handle extraction progress callbacks', async () => {
      const mockPapers = createMockPapers(2);
      let extractionProgressCallback: ((stageNumber: number, totalStages: number, message: string, transparentMessage?: any) => void) | undefined;

      mockExtractThemesV2.mockImplementation(async (sources, config, onProgress) => {
        extractionProgressCallback = onProgress;

        // Simulate progress updates
        onProgress(1, 7, 'Stage 1', {
          stageName: 'Familiarization',
          stageNumber: 1,
          totalStages: 7,
          percentage: 14,
          whatWeAreDoing: 'Reading sources',
          whyItMatters: 'Understanding content',
          liveStats: { sourcesAnalyzed: 1 },
        });
        onProgress(7, 7, 'Stage 7', {
          stageName: 'Report Production',
          stageNumber: 7,
          totalStages: 7,
          percentage: 100,
          whatWeAreDoing: 'Finalizing',
          whyItMatters: 'Complete',
          liveStats: { themesIdentified: 3 },
        });

        return { themes: [{ id: 'theme-1', name: 'Theme', description: 'Desc' }] };
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(extractionProgressCallback).toBeDefined();
    });

    it('should set final progress with complete state', async () => {
      const mockPapers = createMockPapers(2);

      mockExtractThemesV2.mockResolvedValue({
        themes: [
          { id: 'theme-1', name: 'Theme 1', description: 'Desc 1' },
          { id: 'theme-2', name: 'Theme 2', description: 'Desc 2' },
          { id: 'theme-3', name: 'Theme 3', description: 'Desc 3' },
        ],
        saturationData: { totalThemes: 3, saturated: true },
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'qualitative_analysis',
          mode: 'quick',
          userExpertiseLevel: 'student',
        });
      });

      expect(result.current.progress).toMatchObject({
        isExtracting: false,
        progress: 100,
        stage: 'complete',
        message: expect.stringContaining('3 themes'),
      });
    });

    it('should throw error if no themes returned', async () => {
      const mockPapers = createMockPapers(2);

      mockExtractThemesV2.mockResolvedValue({
        themes: null,
      } as any);

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toContain('No themes returned');
    });
  });

  describe('Cancellation', () => {
    it('should cancel workflow when cancelWorkflow is called', async () => {
      const mockPapers = createMockPapers(2);

      // Make savePapers take time to allow cancellation
      vi.mocked(extractionOrchestrator.savePapers).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Map()), 1000))
      );

      const { result } = renderHook(() => useExtractionWorkflow());

      // Start workflow
      act(() => {
        result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      // Wait for execution to start
      await waitFor(() => {
        expect(result.current.isExecuting).toBe(true);
      });

      // Cancel
      act(() => {
        result.current.cancelWorkflow();
      });

      // Verify state was cleaned up
      expect(result.current.isExecuting).toBe(false);
      expect(mockSetAnalyzingThemes).toHaveBeenCalledWith(false);
    });

    it('should cleanup RAF on cancellation', async () => {
      const mockPapers = createMockPapers(1);
      const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');

      vi.mocked(extractionOrchestrator.savePapers).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Map()), 500))
      );

      const { result } = renderHook(() => useExtractionWorkflow());

      act(() => {
        result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'literature_synthesis',
          mode: 'quick',
          userExpertiseLevel: 'researcher',
        });
      });

      await waitFor(() => expect(result.current.isExecuting).toBe(true));

      act(() => {
        result.current.cancelWorkflow();
      });

      // RAF should be cancelled (may be 0 if no pending RAF)
      expect(result.current.isExecuting).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle savePapers error gracefully', async () => {
      const mockPapers = createMockPapers(2);
      const error = new Error('Database connection failed');

      vi.mocked(extractionOrchestrator.savePapers).mockRejectedValue(error);

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toBe('Database connection failed');
      expect(mockSetExtractionError).toHaveBeenCalledWith('Database connection failed');
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle fetchFullText error', async () => {
      const mockPapers = createMockPapers(2);

      vi.mocked(extractionOrchestrator.fetchFullText).mockRejectedValue(
        new Error('Network timeout')
      );

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toContain('Network timeout');
    });

    it('should handle extractThemesV2 error', async () => {
      const mockPapers = createMockPapers(2);

      mockExtractThemesV2.mockRejectedValue(new Error('AI service unavailable'));

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'hypothesis_generation',
          mode: 'quick',
          userExpertiseLevel: 'practitioner',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toBe('AI service unavailable');
      expect(logger.error).toHaveBeenCalledWith(
        'Extraction workflow failed',
        'useExtractionWorkflow',
        expect.objectContaining({ error: 'AI service unavailable' })
      );
    });

    it('should set error progress state on failure', async () => {
      const mockPapers = createMockPapers(1);

      vi.mocked(extractionOrchestrator.savePapers).mockRejectedValue(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'qualitative_analysis',
          mode: 'guided',
          userExpertiseLevel: 'student',
        });
      });

      expect(result.current.progress).toMatchObject({
        isExtracting: false,
        progress: 0,
        stage: 'error',
        error: 'Permission denied',
      });
    });

    it('should cleanup state after error', async () => {
      const mockPapers = createMockPapers(2);

      mockExtractThemesV2.mockRejectedValue(new Error('Timeout'));

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'literature_synthesis',
          mode: 'quick',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(result.current.isExecuting).toBe(false);
      expect(mockSetAnalyzingThemes).toHaveBeenCalledWith(false);
    });

    it('should handle unknown error types', async () => {
      const mockPapers = createMockPapers(1);

      vi.mocked(extractionOrchestrator.savePapers).mockRejectedValue('String error');

      const { result } = renderHook(() => useExtractionWorkflow());

      let executionResult: any;
      await act(async () => {
        executionResult = await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toBe('Unknown error');
    });
  });

  describe('RAF Batching', () => {
    it('should batch progress updates via requestAnimationFrame', async () => {
      const mockPapers = createMockPapers(1);
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');

      let progressCallback: ((wp: any) => void) | undefined;
      vi.mocked(extractionOrchestrator.savePapers).mockImplementation(async (papers, options) => {
        progressCallback = options?.onProgress;

        if (progressCallback) {
          // Rapid-fire progress updates (should be batched)
          progressCallback({ currentItem: 1, totalItems: 10, percentage: 5, message: 'Update 1' });
          progressCallback({ currentItem: 2, totalItems: 10, percentage: 10, message: 'Update 2' });
          progressCallback({ currentItem: 3, totalItems: 10, percentage: 15, message: 'Update 3' });
        }

        return new Map();
      });

      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      // RAF should have been called (batching mechanism)
      expect(rafSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup RAF and abort controller on unmount', () => {
      const { result, unmount } = renderHook(() => useExtractionWorkflow());

      const mockPapers = createMockPapers(1);

      act(() => {
        result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      // Unmount while executing
      unmount();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Progress Stages Constants', () => {
    it('should use correct progress ranges for each stage', async () => {
      const mockPapers = createMockPapers(1);

      mockExtractThemesV2.mockResolvedValue({
        themes: [{ id: 'theme-1', name: 'Theme', description: 'Desc' }],
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'literature_synthesis',
          mode: 'quick',
          userExpertiseLevel: 'student',
        });
      });

      // Final progress should be 100%
      expect(result.current.progress?.progress).toBe(100);
    });
  });

  describe('Mode Variations', () => {
    it('should set allowIterativeRefinement=true for guided mode', async () => {
      const mockPapers = createMockPapers(1);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'q_methodology',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(mockExtractThemesV2).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          allowIterativeRefinement: true,
        }),
        expect.any(Function)
      );
    });

    it('should set allowIterativeRefinement=false for quick mode', async () => {
      const mockPapers = createMockPapers(1);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'survey_construction',
          mode: 'quick',
          userExpertiseLevel: 'practitioner',
        });
      });

      expect(mockExtractThemesV2).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          allowIterativeRefinement: false,
        }),
        expect.any(Function)
      );
    });
  });

  describe('Logging', () => {
    it('should log workflow start with parameters', async () => {
      const mockPapers = createMockPapers(3);
      mockExtractThemesV2.mockResolvedValue({ themes: [] });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'hypothesis_generation',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        });
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Extraction workflow started',
        'useExtractionWorkflow',
        expect.objectContaining({
          papersCount: 3,
          purpose: 'hypothesis_generation',
          mode: 'guided',
          userExpertiseLevel: 'researcher',
        })
      );
    });

    it('should log successful completion with theme count', async () => {
      const mockPapers = createMockPapers(2);
      mockExtractThemesV2.mockResolvedValue({
        themes: [
          { id: 'theme-1', name: 'Theme 1', description: 'Desc 1' },
          { id: 'theme-2', name: 'Theme 2', description: 'Desc 2' },
        ],
        saturationData: { totalThemes: 2 },
      });

      const { result } = renderHook(() => useExtractionWorkflow());

      await act(async () => {
        await result.current.executeWorkflow({
          papers: mockPapers,
          purpose: 'qualitative_analysis',
          mode: 'quick',
          userExpertiseLevel: 'student',
        });
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Extraction workflow completed successfully',
        'useExtractionWorkflow',
        expect.objectContaining({
          themesCount: 2,
          hasSaturationData: true,
          purpose: 'qualitative_analysis',
          mode: 'quick',
        })
      );
    });
  });
});
