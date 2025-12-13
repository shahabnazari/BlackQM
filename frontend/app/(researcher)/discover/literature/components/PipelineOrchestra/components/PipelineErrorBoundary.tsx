/**
 * Phase 10.127: Pipeline Error Boundary
 *
 * Catches rendering errors in PipelineOrchestra child components
 * and displays a graceful fallback UI instead of crashing.
 *
 * @module PipelineOrchestra
 * @since Phase 10.127
 */

'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PipelineErrorBoundaryProps {
  children: ReactNode;
  fallbackClassName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface PipelineErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error boundary for PipelineOrchestra components
 *
 * Catches errors in:
 * - OrbitalSourceConstellation (SVG rendering)
 * - ParticleFlowSystem (Canvas rendering)
 * - SemanticBrainVisualizer (Animation state)
 * - StageOrb (Progress calculations)
 *
 * @example
 * ```tsx
 * <PipelineErrorBoundary onError={logToSentry}>
 *   <OrbitalSourceConstellation {...props} />
 * </PipelineErrorBoundary>
 * ```
 */
export class PipelineErrorBoundary extends Component<
  PipelineErrorBoundaryProps,
  PipelineErrorBoundaryState
> {
  constructor(props: PipelineErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PipelineErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error('[PipelineOrchestra] Component Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center p-6',
            'rounded-xl bg-gray-900/50 border border-white/10',
            'text-center min-h-[200px]',
            this.props.fallbackClassName
          )}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">
            Visualization Error
          </h3>
          <p className="text-xs text-white/60 mb-4 max-w-[200px]">
            Something went wrong rendering this component.
          </p>
          <button
            onClick={this.handleRetry}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5',
              'rounded-lg text-xs font-medium',
              'bg-white/10 hover:bg-white/20',
              'text-white/80 hover:text-white',
              'transition-colors'
            )}
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-2 rounded bg-red-950/50 text-red-300 text-xs max-w-full overflow-auto"> {/* Phase 10.135: Increased from 10px to 12px */}
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default PipelineErrorBoundary;
