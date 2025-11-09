/**
 * Error Boundaries Index
 * Export all error boundary components
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module error-boundaries
 */

export { BaseErrorBoundary } from './BaseErrorBoundary';
export type { ErrorBoundaryProps } from './BaseErrorBoundary';

export { LiteratureErrorBoundary } from './LiteratureErrorBoundary';
export { VideoErrorBoundary } from './VideoErrorBoundary';
export { ThemeErrorBoundary } from './ThemeErrorBoundary';

export {
  ErrorFallbackUI,
  LoadingFallbackUI,
  EmptyStateFallbackUI,
} from './ErrorFallbackUI';
export type { ErrorFallbackUIProps } from './ErrorFallbackUI';
