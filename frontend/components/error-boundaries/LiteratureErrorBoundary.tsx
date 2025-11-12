/**
 * Literature Error Boundary Component
 * Specialized error boundary for literature search and analysis features
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module LiteratureErrorBoundary
 */

'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary, ErrorBoundaryProps } from './BaseErrorBoundary';
import { ErrorFallbackUI } from './ErrorFallbackUI';

interface LiteratureErrorBoundaryProps
  extends Omit<ErrorBoundaryProps, 'componentName' | 'fallback'> {
  children: ReactNode;
  showContactSupport?: boolean;
}

export function LiteratureErrorBoundary({
  children,
  showContactSupport = true,
  ...props
}: LiteratureErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      {...props}
      componentName="Literature Search"
      fallback={(error, _errorInfo, retry) => (
        <ErrorFallbackUI
          title="Literature Search Error"
          message={error.message}
          suggestion="Try refining your search query or checking your network connection."
          onRetry={retry}
          showContactSupport={showContactSupport}
          icon={
            <svg
              className="h-12 w-12 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          }
        />
      )}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default LiteratureErrorBoundary;
