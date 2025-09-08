'use client';

import React from 'react';
import { Button } from '@/components/apple-ui/Button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class StudyCreationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Study creation error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-label">
                Something went wrong
              </h2>
              <p className="text-sm text-secondary-label">
                An error occurred while creating your study. Please try again.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-tertiary-label hover:text-secondary-label">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-quaternary-fill rounded text-xs overflow-x-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                variant="secondary"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}