/**
 * PaperCardErrorBoundary Component
 * Phase 10.123: Netflix-Grade PaperCard Redesign
 *
 * Error boundary wrapper for PaperCard to prevent cascade failures.
 * If a single PaperCard crashes, only that card shows error state.
 * Other cards continue to render normally.
 *
 * @module PaperCardErrorBoundary
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PaperCardErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Paper ID for error logging */
  paperId?: string | undefined;
  /** Paper title for error display (optional) */
  paperTitle?: string | undefined;
  /** Callback when error occurs */
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
}

interface PaperCardErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | undefined;
  /** Whether retry is in progress */
  isRetrying: boolean;
}

// ============================================================================
// Component
// ============================================================================

export class PaperCardErrorBoundary extends Component<
  PaperCardErrorBoundaryProps,
  PaperCardErrorBoundaryState
> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: PaperCardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PaperCardErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with context
    console.error('[PaperCard Error]', {
      paperId: this.props.paperId,
      paperTitle: this.props.paperTitle,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount(): void {
    // Clean up timeout to prevent memory leaks
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  /**
   * Handle retry attempt
   * Resets error state to re-render children
   */
  handleRetry = (): void => {
    this.setState({ isRetrying: true });

    // Clear any existing timeout
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
    }

    // Small delay to show loading state
    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      this.setState({
        hasError: false,
        error: undefined,
        isRetrying: false,
      });
    }, 300);
  };

  render(): ReactNode {
    const { hasError, error, isRetrying } = this.state;
    const { children, paperId, paperTitle } = this.props;

    if (hasError) {
      return (
        <div
          className="border rounded-lg p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Unable to display paper
              </h3>
              {paperTitle && (
                <p className="text-xs text-red-600 dark:text-red-300 mt-1 truncate">
                  {paperTitle}
                </p>
              )}
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                {error?.message || 'An unexpected error occurred'}
              </p>
              {paperId && (
                <p className="text-[10px] text-red-400 dark:text-red-500 mt-1 font-mono">
                  ID: {paperId}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleRetry}
              disabled={isRetrying}
              className="shrink-0 p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50"
              aria-label="Retry loading paper"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// HOC for functional component wrapping
// ============================================================================

/**
 * Higher-order component to wrap any component with PaperCardErrorBoundary
 */
export function withPaperCardErrorBoundary<P extends { paper?: { id?: string; title?: string } }>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & { onError?: (error: Error, errorInfo: ErrorInfo) => void }> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P & { onError?: (error: Error, errorInfo: ErrorInfo) => void }> = (props) => {
    const paperId = props.paper?.id;
    const paperTitle = props.paper?.title;

    return (
      <PaperCardErrorBoundary
        paperId={paperId}
        paperTitle={paperTitle}
        onError={props.onError}
      >
        <WrappedComponent {...props} />
      </PaperCardErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `withPaperCardErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
