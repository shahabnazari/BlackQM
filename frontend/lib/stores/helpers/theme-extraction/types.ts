/**
 * Theme Extraction Store - Shared Types
 * Phase 10.91 Day 8: Store Architecture Refactoring
 *
 * **Purpose:**
 * Centralized type definitions for theme extraction helpers
 * Extracted from theme-extraction.store.ts to improve modularity
 *
 * **Enterprise Standards:**
 * - ✅ Single source of truth for types
 * - ✅ No circular dependencies
 * - ✅ Export-only (no implementation)
 *
 * @since Phase 10.91 Day 8
 */

import type {
  UnifiedTheme,
  ResearchPurpose,
  SaturationData,
} from '@/lib/api/services/unified-theme-api.service';
import type {
  ResearchQuestionSuggestion,
  HypothesisSuggestion,
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import type {
  GeneratedSurvey,
  ConstructMapping,
} from '@/components/literature';
import type { ResearchGap } from '@/lib/services/literature-api.service';

// Re-export for convenience
export type { UnifiedTheme, ResearchPurpose, SaturationData };
export type { ResearchQuestionSuggestion, HypothesisSuggestion };
export type { GeneratedSurvey, ConstructMapping };
export type { ResearchGap };

/**
 * Extraction progress state
 */
export interface ExtractionProgress {
  current: number;
  total: number;
  stage: string;
  message: string;
  percentage: number;
  liveStats?: {
    papersProcessed: number;
    themesFound: number;
    estimatedTimeRemaining: number;
  };
}

/**
 * Content analysis metadata
 */
export interface ContentAnalysis {
  totalPapers: number;
  avgAbstractLength: number;
  fullTextAvailable: number;
  estimatedExtractionTime: number;
}

/**
 * User expertise level for guided extraction
 */
export type UserExpertiseLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';

/**
 * Zustand set function type for type safety
 */
export type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
