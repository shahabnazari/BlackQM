/**
 * Progress Components Barrel File
 * Phase 10.91 Day 11 - Component Refactoring
 *
 * Exports modular progress indicator sub-components and shared utilities.
 * Enables clean imports: import { ProgressBar, SourceBreakdown } from '@/components/literature/progress'
 */

export { ProgressBar } from './ProgressBar';
export { SourceBreakdown } from './SourceBreakdown';
export { SearchTransparencySummary } from './SearchTransparencySummary';
export {
  SOURCE_DISPLAY_NAMES,
  SOURCE_DESCRIPTIONS,
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  formatCount
} from './constants';
