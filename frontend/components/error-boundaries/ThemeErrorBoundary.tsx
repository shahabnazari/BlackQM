/**
 * Theme Error Boundary Component
 * Specialized error boundary for theme extraction features
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module ThemeErrorBoundary
 */

'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary, ErrorBoundaryProps } from './BaseErrorBoundary';
import { ErrorFallbackUI } from './ErrorFallbackUI';

interface ThemeErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'componentName' | 'fallback'> {
  children: ReactNode;
  showContactSupport?: boolean;
}

export function ThemeErrorBoundary({
  children,
  showContactSupport = true,
  ...props
}: ThemeErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      {...props}
      componentName="Theme Extraction"
      fallback={(error, _errorInfo, retry) => (
        <ErrorFallbackUI
          title="Theme Extraction Error"
          message={error.message}
          suggestion="This might be a temporary issue. Try again with a different set of papers or contact support if the problem persists."
          onRetry={retry}
          showContactSupport={showContactSupport}
          icon={
            <svg
              className="h-12 w-12 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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

export default ThemeErrorBoundary;
