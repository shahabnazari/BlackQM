/**
 * Skeleton Components Export
 * Central export file for all skeleton loading components
 */

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonList,
  SkeletonWidget,
  SkeletonProfile,
} from './SkeletonScreen';

// Re-export with semantic names for specific use cases
export { SkeletonCard as StudyCardSkeleton } from './SkeletonScreen';
export { SkeletonTable as DataTableSkeleton } from './SkeletonScreen';
export { SkeletonChart as VisualizationSkeleton } from './SkeletonScreen';
export { SkeletonWidget as DashboardWidgetSkeleton } from './SkeletonScreen';
export { SkeletonList as ParticipantListSkeleton } from './SkeletonScreen';