/**
 * PaperCard Sub-Components
 * Phase 10.91 Day 10 - Component Refactoring
 * Phase 10.123 - Netflix-Grade PaperCard Redesign
 *
 * Barrel exports for all PaperCard sub-components and shared constants
 *
 * @module paper-card
 */

// Sub-components
export { PaperHeader } from './PaperHeader';
export { PaperMetadata } from './PaperMetadata';
export { PaperAccessBadges } from './PaperAccessBadges';
export { PaperQualityBadges } from './PaperQualityBadges';
export { PaperStatusBadges } from './PaperStatusBadges';
export { PaperActions } from './PaperActions';

// Phase 10.123: Error Boundary
export { PaperCardErrorBoundary, withPaperCardErrorBoundary } from './PaperCardErrorBoundary';

// Phase 10.123 Phase 2: Netflix-Grade Match Score Badge
export { MatchScoreBadge } from './MatchScoreBadge';

// Phase 10.123 Phase 3: Collapsible Extended Metadata
export { CollapsibleMetadata } from './CollapsibleMetadata';

// Shared constants and helper functions
export * from './constants';

// Phase 10.123 Phase 5: Analytics utilities
export * from './analytics';
