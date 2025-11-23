/**
 * Academic Resources Components - Barrel Exports
 * Phase 10.91 Day 12 - Component Extraction
 *
 * Clean imports for academic resources sub-components
 *
 * Usage:
 * ```typescript
 * import {
 *   DatabaseSelector,
 *   ContentDepthAnalysis,
 *   ActionButtonsGroup,
 *   ACADEMIC_DATABASES,
 *   FREE_DATABASES,
 *   PREMIUM_DATABASES
 * } from '@/components/literature/academic-resources';
 * ```
 */

// Components
export { DatabaseSelector } from './DatabaseSelector';
export type { DatabaseSelectorProps } from './DatabaseSelector';

export { ContentDepthAnalysis } from './ContentDepthAnalysis';
export type { ContentDepthAnalysisProps } from './ContentDepthAnalysis';

export { ActionButtonsGroup } from './ActionButtonsGroup';
export type { ActionButtonsGroupProps } from './ActionButtonsGroup';

// Constants
export {
  ACADEMIC_DATABASES,
  FREE_DATABASES,
  PREMIUM_DATABASES,
  getDatabaseById,
  DATABASE_COUNTS,
} from './constants';
export type { AcademicDatabase } from './constants';
