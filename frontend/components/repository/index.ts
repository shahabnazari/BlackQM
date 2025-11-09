/**
 * Phase 10 Days 26-29: Research Repository Components
 *
 * Unified exports for repository UI components
 */

export { InsightCard } from './InsightCard';
export { CitationLineage } from './CitationLineage';
export { AnnotationPanel } from './AnnotationPanel';
export { ResearchCorpusPanel } from './ResearchCorpusPanel';
export { ShareDialog } from './ShareDialog';

// Re-export types from API service
export type {
  ResearchInsight,
  CitationNode,
  Annotation,
  SearchFilters,
  SearchResult,
  SearchResponse,
  AccessRole,
  InsightAccess,
  AccessCheckResult,
} from '@/lib/api/services/repository-api.service';
