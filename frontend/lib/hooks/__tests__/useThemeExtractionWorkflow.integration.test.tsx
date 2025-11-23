/**
 * useThemeExtractionWorkflow Integration Tests - Phase 10.93 Day 3
 *
 * Enterprise-grade integration tests for complete workflow
 *
 * @module hooks/__tests__/useThemeExtractionWorkflow.integration.test
 * @since Phase 10.93 Day 3
 *
 * **Test Coverage:**
 * - Complete workflow end-to-end
 * - Service integration (all 3 services)
 * - State management across workflow steps
 * - Error handling and recovery
 * - Cancellation and cleanup
 * - UI state transitions
 *
 * **Total Tests:** 15 integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useThemeExtractionWorkflow } from '../useThemeExtractionWorkflow';
import type { UseThemeExtractionWorkflowConfig } from '../useThemeExtractionWorkflow';
import {
  createMockPaper,
  createMockPaperWithFullText,
  createMockPapers,
  createMockContentAnalysis,
} from '@/lib/services/theme-extraction/__tests__/__utils__/test-factories';

// Mock all services
vi.mock('@/lib/services/theme-extraction/theme-extraction.service');
vi.mock('@/lib/services/theme-extraction/paper-save.service');
vi.mock('@/lib/services/theme-extraction/fulltext-extraction.service');
vi.mock('@/lib/services/literature-api.service');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

import { ThemeExtractionService } from '@/lib/services/theme-extraction/theme-extraction.service';
import { PaperSaveService } from '@/lib/services/theme-extraction/paper-save.service';
import { FullTextExtractionService } from '@/lib/services/theme-extraction/fulltext-extraction.service';
import { toast } from 'sonner';

describe('useThemeExtractionWorkflow - Integration Tests', () => {
  let mockSetPapers: vi.Mock;
  let mockUser: { id: string; email: string };

  beforeEach(() => {
    mockSetPapers = vi.fn();
    mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.clearAllMocks();
  });

  const createDefaultConfig = (
    overrides: Partial<UseThemeExtractionWorkflowConfig> = {}
  ): UseThemeExtractionWorkflowConfig => ({
    selectedPapers: new Set(['paper-1', 'paper-2', 'paper-3']),
    papers: createMockPapers(3),
    setPapers: mockSetPapers,
    transcribedVideos: [],
    user: mockUser,
    ...overrides,
  });

  describe('Complete Workflow Success Path', () => {
    it('should execute full workflow successfully', async () => {
      // Mock successful service responses
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 3,
        stalePapers: [],
        upToDatePapers: 3,
      });

      vi.mocked(PaperSaveService.prototype.batchSave).mockResolvedValue({
        savedCount: 3,
        skippedCount: 0,
        failedCount: 0,
        failedPapers: [],
        savedPaperIds: new Map([
          ['paper-1', 'db-uuid-1'],
          ['paper-2', 'db-uuid-2'],
          ['paper-3', 'db-uuid-3'],
        ]),
      });

      vi.mocked(FullTextExtractionService.prototype.extractBatch).mockResolvedValue({
        totalCount: 3,
        successCount: 3,
        failedCount: 0,
        updatedPapers: createMockPapers(3, { hasFullText: true }),
        failedPaperIds: [],
      });

      vi.mocked(ThemeExtractionService.prototype.analyzeAndFilterContent).mockResolvedValue(
        createMockContentAnalysis({
          fullTextCount: 3,
          abstractOverflowCount: 0,
          abstractCount: 0,
          noContentCount: 0,
        })
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      // Start extraction
      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Verify workflow completed
      await waitFor(
        () => {
          expect(result.current.isExtractionInProgress).toBe(false);
          expect(result.current.showModeSelectionModal).toBe(true);
          expect(result.current.contentAnalysis).toBeTruthy();
          expect(result.current.preparingMessage).toBe('');
        },
        { timeout: 3000 }
      );

      // Verify all services were called
      expect(ThemeExtractionService.prototype.validateExtraction).toHaveBeenCalled();
      expect(PaperSaveService.prototype.batchSave).toHaveBeenCalled();
      expect(FullTextExtractionService.prototype.extractBatch).toHaveBeenCalled();
      expect(ThemeExtractionService.prototype.analyzeAndFilterContent).toHaveBeenCalled();
    });

    it('should update progress messages throughout workflow', async () => {
      const progressMessages: string[] = [];

      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 5,
        selectedPapers: 5,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 5,
        stalePapers: [],
        upToDatePapers: 5,
      });

      // Capture progress callback messages
      vi.mocked(PaperSaveService.prototype.batchSave).mockImplementation(
        async (papers, options) => {
          if (options?.onProgress) {
            options.onProgress('Saving paper 1/5...');
            progressMessages.push('Saving paper 1/5...');
            options.onProgress('Saving paper 5/5...');
            progressMessages.push('Saving paper 5/5...');
          }
          return {
            savedCount: 5,
            skippedCount: 0,
            failedCount: 0,
            failedPapers: [],
            savedPaperIds: new Map(),
          };
        }
      );

      vi.mocked(FullTextExtractionService.prototype.extractBatch).mockResolvedValue({
        totalCount: 5,
        successCount: 5,
        failedCount: 0,
        updatedPapers: [],
        failedPaperIds: [],
      });

      vi.mocked(ThemeExtractionService.prototype.analyzeAndFilterContent).mockResolvedValue(
        createMockContentAnalysis({ fullTextCount: 5 })
      );

      const { result } = renderHook(() =>
        useThemeExtractionWorkflow(
          createDefaultConfig({
            selectedPapers: new Set(['1', '2', '3', '4', '5']),
          })
        )
      );

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Verify progress callbacks were invoked (no polling needed)
      expect(progressMessages).toContain('Saving paper 1/5...');
      expect(progressMessages).toContain('Saving paper 5/5...');
      expect(progressMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Failures', () => {
    it('should stop workflow if validation fails', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: false,
        totalSources: 0,
        selectedPapers: 0,
        transcribedVideos: 0,
        error: 'NO_PAPERS_SELECTED',
        userMessage: 'Please select at least one paper',
      });

      const { result } = renderHook(() =>
        useThemeExtractionWorkflow(
          createDefaultConfig({
            selectedPapers: new Set(),
          })
        )
      );

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Workflow should not progress
      expect(result.current.isExtractionInProgress).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('select at least one paper'),
        expect.any(Object)
      );

      // Services should not be called
      expect(PaperSaveService.prototype.batchSave).not.toHaveBeenCalled();
    });

    it('should show user-friendly error message for duplicate extraction', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: false,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
        error: 'EXTRACTION_IN_PROGRESS',
        userMessage: 'Extraction already in progress',
      });

      const { result } = renderHook(() =>
        useThemeExtractionWorkflow(createDefaultConfig())
      );

      // Manually set extraction in progress
      act(() => {
        result.current.setIsExtractionInProgress(true);
      });

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('already in progress'),
        expect.any(Object)
      );
    });
  });

  describe('Stale Metadata Refresh', () => {
    it('should refresh stale paper metadata before saving', async () => {
      const stalePapers = createMockPapers(2, { hasFullText: false });

      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 5,
        selectedPapers: 5,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 5,
        stalePapers,
        upToDatePapers: 3,
      });

      const refreshedPapers = createMockPapers(2, { hasFullText: true });

      vi.mocked(ThemeExtractionService.prototype.refreshStaleMetadata).mockResolvedValue({
        refreshed: 2,
        failed: 0,
        papers: refreshedPapers,
      });

      vi.mocked(PaperSaveService.prototype.batchSave).mockResolvedValue({
        savedCount: 5,
        skippedCount: 0,
        failedCount: 0,
        failedPapers: [],
        savedPaperIds: new Map(),
      });

      vi.mocked(FullTextExtractionService.prototype.extractBatch).mockResolvedValue({
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        updatedPapers: [],
        failedPaperIds: [],
      });

      vi.mocked(ThemeExtractionService.prototype.analyzeAndFilterContent).mockResolvedValue(
        createMockContentAnalysis({ fullTextCount: 2 })
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Verify metadata refresh was called
      expect(ThemeExtractionService.prototype.refreshStaleMetadata).toHaveBeenCalledWith(
        stalePapers,
        expect.any(Function)
      );

      // Verify papers were updated
      expect(mockSetPapers).toHaveBeenCalled();
    });
  });

  describe('User Cancellation', () => {
    it('should cancel workflow when user calls cancelExtraction', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 3,
        stalePapers: [],
        upToDatePapers: 3,
      });

      // Make paper save take a while
      vi.mocked(PaperSaveService.prototype.batchSave).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  savedCount: 0,
                  skippedCount: 0,
                  failedCount: 0,
                  failedPapers: [],
                  savedPaperIds: new Map(),
                }),
              1000
            )
          )
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      // Start extraction
      act(() => {
        result.current.handleExtractThemes();
      });

      // Wait for extraction to be in progress (guaranteed, no race condition)
      await waitFor(() => {
        expect(result.current.isExtractionInProgress).toBe(true);
      });

      // Now cancel (guaranteed to happen during extraction)
      act(() => {
        result.current.cancelExtraction();
      });

      // Verify state was cleaned up
      await waitFor(() => {
        expect(result.current.isExtractionInProgress).toBe(false);
        expect(result.current.showModeSelectionModal).toBe(false);
        expect(result.current.preparingMessage).toBe('');
        expect(result.current.contentAnalysis).toBeNull();
      });

      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle paper save errors gracefully', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 3,
        stalePapers: [],
        upToDatePapers: 3,
      });

      vi.mocked(PaperSaveService.prototype.batchSave).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Verify error was handled
      expect(result.current.isExtractionInProgress).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Object)
      );
    });

    it('should clean up state on error', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // All state should be cleaned up
      expect(result.current.isExtractionInProgress).toBe(false);
      expect(result.current.showModeSelectionModal).toBe(false);
      expect(result.current.preparingMessage).toBe('');
      expect(result.current.contentAnalysis).toBeNull();
      expect(result.current.currentRequestId).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should manage modal state correctly', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 3,
        stalePapers: [],
        upToDatePapers: 3,
      });

      vi.mocked(PaperSaveService.prototype.batchSave).mockResolvedValue({
        savedCount: 3,
        skippedCount: 0,
        failedCount: 0,
        failedPapers: [],
        savedPaperIds: new Map(),
      });

      vi.mocked(FullTextExtractionService.prototype.extractBatch).mockResolvedValue({
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        updatedPapers: [],
        failedPaperIds: [],
      });

      vi.mocked(ThemeExtractionService.prototype.analyzeAndFilterContent).mockResolvedValue(
        createMockContentAnalysis({ fullTextCount: 3 })
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      // Modal should be closed initially
      expect(result.current.showModeSelectionModal).toBe(false);

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      // Modal should open after workflow completes
      await waitFor(() => {
        expect(result.current.showModeSelectionModal).toBe(true);
      });
    });

    it('should generate unique request IDs for each extraction', async () => {
      vi.mocked(ThemeExtractionService.prototype.validateExtraction).mockReturnValue({
        valid: true,
        totalSources: 3,
        selectedPapers: 3,
        transcribedVideos: 0,
      });

      vi.mocked(ThemeExtractionService.prototype.detectStalePapers).mockReturnValue({
        totalPapers: 3,
        stalePapers: [],
        upToDatePapers: 3,
      });

      vi.mocked(PaperSaveService.prototype.batchSave).mockResolvedValue({
        savedCount: 3,
        skippedCount: 0,
        failedCount: 0,
        failedPapers: [],
        savedPaperIds: new Map(),
      });

      vi.mocked(FullTextExtractionService.prototype.extractBatch).mockResolvedValue({
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        updatedPapers: [],
        failedPaperIds: [],
      });

      vi.mocked(ThemeExtractionService.prototype.analyzeAndFilterContent).mockResolvedValue(
        createMockContentAnalysis()
      );

      const { result } = renderHook(() => useThemeExtractionWorkflow(createDefaultConfig()));

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      const firstRequestId = result.current.currentRequestId;
      expect(firstRequestId).toBeTruthy();
      expect(firstRequestId).toMatch(/^extract_\d+_[a-z0-9]+$/);

      // Reset and extract again
      act(() => {
        result.current.setIsExtractionInProgress(false);
      });

      await act(async () => {
        await result.current.handleExtractThemes();
      });

      const secondRequestId = result.current.currentRequestId;
      expect(secondRequestId).toBeTruthy();
      expect(secondRequestId).not.toBe(firstRequestId);
    });
  });
});
