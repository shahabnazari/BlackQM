/**
 * Base Error Boundary Component
 * Enterprise-grade error boundary with recovery strategies
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * Features:
 * - Error catching and logging
 * - Recovery strategies (retry, reset, fallback)
 * - Error reporting integration
 * - Context preservation for debugging
 *
 * @module BaseErrorBoundary
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

// ============================================================================
// Base Error Boundary Class
// ============================================================================

export class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, componentName } = this.props;

    // Log error with context
    this.logError(error, errorInfo, componentName);

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo, componentName);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Auto-reset if resetKeys change
    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      !this.areResetKeysEqual(prevProps.resetKeys, resetKeys)
    ) {
      this.reset();
    }
  }

  private areResetKeysEqual(
    prevKeys: Array<string | number>,
    nextKeys: Array<string | number>
  ): boolean {
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    return prevKeys.every((key, index) => key === nextKeys[index]);
  }

  private logError(error: Error, errorInfo: ErrorInfo, componentName?: string): void {
    console.group(`🔴 Error Boundary: ${componentName || 'Unknown Component'}`);
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
  }

  private reportError(error: Error, errorInfo: ErrorInfo, componentName?: string): void {
    // Integration point for error reporting service (Sentry, Rollbar, etc.)
    if (typeof window !== 'undefined' && (window as any).errorReporter) {
      (window as any).errorReporter.report({
        error,
        errorInfo,
        componentName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }

  private reset = (): void => {
    const { onReset } = this.props;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (onReset) {
      onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo, this.reset);
        }
        return fallback;
      }

      // Default fallback UI
      return this.renderDefaultFallback(error, errorInfo);
    }

    // Isolate errors to this boundary if specified
    if (isolate) {
      return <div className="error-boundary-isolation">{children}</div>;
    }

    return children;
  }

  private renderDefaultFallback(error: Error, errorInfo: ErrorInfo): ReactNode {
    const { componentName } = this.props;
    const { errorCount } = this.state;

    return (
      <div className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">
              {componentName ? `Error in ${componentName}` : 'Something went wrong'}
            </h3>
            <p className="mt-2 text-sm text-red-700">{error.message}</p>
            {errorCount > 1 && (
              <p className="mt-1 text-sm text-red-600">
                This error has occurred {errorCount} times
              </p>
            )}
            <div className="mt-4 flex space-x-3">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-800 font-medium">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64">
                  {error.stack}
                </pre>
                <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// Export
// ============================================================================

export default BaseErrorBoundary;
