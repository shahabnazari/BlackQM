'use client';

/**
 * ErrorBoundary Component
 * Phase 10.91 Day 1 Step 5: Enterprise-grade error handling
 *
 * Features:
 * - Catches React errors in child components
 * - Graceful fallback UI with retry functionality
 * - Error logging integration with enterprise logger
 * - Reset functionality to recover from errors
 * - Development vs. production error displays
 * - Component stack trace in development mode
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to enterprise logger
    logger.fatal(
      `React Error Boundary: ${error.message}`,
      'ErrorBoundary',
      {
        errorName: error.name,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
        stack: error.stack,
      }
    );

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6">
              {process.env.NODE_ENV === 'development'
                ? 'An unexpected error occurred. See details below.'
                : 'An unexpected error occurred. Please try refreshing the page or return to the home page.'}
            </p>

            {/* Development Mode: Show Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-900 mb-2">Error Details:</p>
                <p className="text-sm text-red-800 font-mono mb-4">
                  {this.state.error.toString()}
                </p>

                {this.state.errorInfo && (
                  <>
                    <p className="font-semibold text-red-900 mb-2">Component Stack:</p>
                    <pre className="text-xs text-red-700 bg-red-100 p-3 rounded overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500 text-center mt-8">
              If this problem persists, please contact support or check the console for more details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional hook-based error boundary wrapper
 * For use in Next.js App Router where class components may have issues
 *
 * Usage:
 * ```tsx
 * <ErrorBoundaryWrapper>
 *   <YourComponent />
 * </ErrorBoundaryWrapper>
 * ```
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

/**
 * Lightweight error boundary for smaller sections
 * Shows inline error message instead of full-page fallback
 *
 * Usage:
 * ```tsx
 * <InlineErrorBoundary>
 *   <SmallComponent />
 * </InlineErrorBoundary>
 * ```
 */
export function InlineErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Failed to load this section</span>
          </div>
          <p className="text-sm text-red-600 mt-2">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

