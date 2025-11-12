/**
 * Video Error Boundary Component
 * Specialized error boundary for video search and transcription features
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module VideoErrorBoundary
 */

'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary, ErrorBoundaryProps } from './BaseErrorBoundary';
import { ErrorFallbackUI } from './ErrorFallbackUI';

interface VideoErrorBoundaryProps
  extends Omit<ErrorBoundaryProps, 'componentName' | 'fallback'> {
  children: ReactNode;
  showContactSupport?: boolean;
}

export function VideoErrorBoundary({
  children,
  showContactSupport = true,
  ...props
}: VideoErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      {...props}
      componentName="Video Management"
      fallback={(error, _errorInfo, retry) => (
        <ErrorFallbackUI
          title="Video Service Error"
          message={error.message}
          suggestion="Check your internet connection or try searching for different videos."
          onRetry={retry}
          showContactSupport={showContactSupport}
          icon={
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
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

export default VideoErrorBoundary;
