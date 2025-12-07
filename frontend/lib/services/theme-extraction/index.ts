/**
 * Theme Extraction Service Layer - Phase 10.93 Day 1
 *
 * Centralized export for all theme extraction services
 *
 * @module theme-extraction
 * @since Phase 10.93
 *
 * **Architecture:**
 * - Service Layer Pattern (business logic extracted from hooks)
 * - Single Responsibility Principle (each service has one job)
 * - Dependency Injection Ready (services accept dependencies)
 * - Full TypeScript Strict Mode (no 'any' types)
 * - Comprehensive Error Handling (custom error classes)
 *
 * **Usage:**
 * ```ts
 * import {
 *   ThemeExtractionService,
 *   PaperSaveService
 * } from '@/lib/services/theme-extraction';
 *
 * const themeService = new ThemeExtractionService();
 * const paperService = new PaperSaveService();
 *
 * // Validate extraction prerequisites
 * const validation = themeService.validateExtraction(user, selectedPapers, videos, false);
 *
 * // Save papers with retry logic
 * const result = await paperService.batchSave(papers, { signal });
 * ```
 */

// Services
export { ThemeExtractionService } from './theme-extraction.service';
export { PaperSaveService } from './paper-save.service';
export { FullTextExtractionService } from './fulltext-extraction.service';
export { ExtractionOrchestratorService, extractionOrchestrator } from './extraction-orchestrator.service';

// Types
export type {
  PaperSavePayload,
  PaperSaveResult,
  BatchSaveResult,
  MetadataRefreshResult,
  ValidationResult,
  StalePaperDetectionResult,
  RetryOptions,
  ProgressCallback,
  CancellationSignal,
  ContentAnalysis,
  FullTextExtractionResult,
  FullTextProgressCallback,
} from './types';

export type {
  ExtractionStage,
  WorkflowProgress,
  WorkflowProgressCallback,
  PreparedSources,
  WorkflowOptions,
} from './extraction-orchestrator.service';

// Errors
export {
  ThemeExtractionError,
  PaperSaveError,
  MetadataRefreshError,
  FullTextExtractionError,
  ContentAnalysisError,
  ValidationError,
} from './errors';
