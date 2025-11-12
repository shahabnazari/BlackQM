/**
 * Error Fallback UI Component
 * Reusable fallback UI for error boundaries
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module ErrorFallbackUI
 */

'use client';

import React, { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ErrorFallbackUIProps {
  title: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showContactSupport?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
}

// ============================================================================
// Error Fallback UI Component
// ============================================================================

export function ErrorFallbackUI({
  title,
  message,
  suggestion,
  onRetry,
  onGoBack,
  showContactSupport = true,
  icon,
  actions,
}: ErrorFallbackUIProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {icon || (
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-4">{message}</p>

        {/* Suggestion */}
        {suggestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <svg
                className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-blue-800">{suggestion}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {actions ? (
            actions
          ) : (
            <>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Go Back
              </button>
            </>
          )}
        </div>

        {/* Contact Support */}
        {showContactSupport && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Need help?{' '}
              <a
                href="/support"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Loading Fallback UI
// ============================================================================

export function LoadingFallbackUI({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Fallback UI
// ============================================================================

export function EmptyStateFallbackUI({
  title = 'No Data',
  message = 'There is no data to display',
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          {icon || (
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ErrorFallbackUI;
