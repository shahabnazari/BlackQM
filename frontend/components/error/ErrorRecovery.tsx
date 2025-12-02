'use client';

import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import {
    ArrowPathIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    QuestionMarkCircleIcon,
    ServerIcon,
    ShieldExclamationIcon,
    WifiIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

interface ErrorRecoveryProps {
  error: Error | null;
  reset?: () => void;
  errorCode?: string;
  customMessage?: string;
}

interface ErrorType {
  code: string;
  title: string;
  description: string;
  icon: any; // SVG icon components have complex types
  actions: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  }[];
}

/**
 * Error Recovery Component
 * Phase 6.6: Clear error messages and recovery paths
 *
 * Features:
 * - Contextual error messages
 * - Multiple recovery options
 * - Auto-retry functionality
 * - Help integration
 * - Session recovery
 */
export function ErrorRecovery({
  error,
  reset,
  errorCode = 'UNKNOWN',
  customMessage,
}: ErrorRecoveryProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // REACT HOOKS FIX: Define handleRetry before it's referenced in errorTypes config
  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    setTimeout(() => {
      if (reset) {
        reset();
      } else {
        window.location.reload();
      }
      setIsRetrying(false);
    }, 1000);
  }, [reset]);

  // REACT HOOKS FIX: Move useEffect hooks before any early returns
  // Auto-retry for network errors
  useEffect(() => {
    if (errorCode === 'NETWORK_ERROR' && retryCount < 3) {
      const timer = setTimeout(
        () => {
          handleRetry();
        },
        5000 * (retryCount + 1)
      ); // Exponential backoff

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [errorCode, retryCount, handleRetry]);

  // Log error for monitoring
  useEffect(() => {
    if (error) {
      console.error('Error Recovery:', {
        code: errorCode,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Send to error tracking service (e.g., Sentry)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error);
      }
    }
  }, [error, errorCode]);

  // Error type configurations
  const errorTypes: Record<string, ErrorType> = {
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      title: 'Connection Problem',
      description:
        'Unable to connect to our servers. Please check your internet connection.',
      icon: WifiIcon,
      actions: [
        {
          label: 'Retry Connection',
          action: handleRetry,
          variant: 'primary',
        },
        {
          label: 'Go Offline',
          action: () => router.push('/offline'),
          variant: 'secondary',
        },
      ],
    },
    SERVER_ERROR: {
      code: 'SERVER_ERROR',
      title: 'Server Error',
      description:
        "Our servers encountered an unexpected error. We've been notified and are working on it.",
      icon: ServerIcon,
      actions: [
        {
          label: 'Try Again',
          action: handleRetry,
          variant: 'primary',
        },
        {
          label: 'Return Home',
          action: () => router.push('/'),
          variant: 'secondary',
        },
      ],
    },
    SESSION_EXPIRED: {
      code: 'SESSION_EXPIRED',
      title: 'Session Expired',
      description:
        'Your session has expired for security reasons. Please sign in again.',
      icon: ClockIcon,
      actions: [
        {
          label: 'Sign In',
          action: () => router.push('/auth/login'),
          variant: 'primary',
        },
        {
          label: 'Go Home',
          action: () => router.push('/'),
          variant: 'secondary',
        },
      ],
    },
    PERMISSION_DENIED: {
      code: 'PERMISSION_DENIED',
      title: 'Access Denied',
      description: "You don't have permission to access this resource.",
      icon: ShieldExclamationIcon,
      actions: [
        {
          label: 'Request Access',
          action: () => router.push('/contact?type=access'),
          variant: 'primary',
        },
        {
          label: 'Go Back',
          action: () => window.history.back(),
          variant: 'secondary',
        },
      ],
    },
    NOT_FOUND: {
      code: 'NOT_FOUND',
      title: 'Page Not Found',
      description:
        "The page you're looking for doesn't exist or has been moved.",
      icon: ExclamationTriangleIcon,
      actions: [
        {
          label: 'Go Home',
          action: () => router.push('/'),
          variant: 'primary',
        },
        {
          label: 'Search',
          action: () =>
            (document.querySelector('[data-search]') as HTMLElement)?.focus(),
          variant: 'secondary',
        },
      ],
    },
    VALIDATION_ERROR: {
      code: 'VALIDATION_ERROR',
      title: 'Invalid Data',
      description:
        "The information provided doesn't meet our requirements. Please check and try again.",
      icon: ExclamationTriangleIcon,
      actions: [
        {
          label: 'Go Back',
          action: () => window.history.back(),
          variant: 'primary',
        },
        {
          label: 'Get Help',
          action: () => router.push('/help'),
          variant: 'secondary',
        },
      ],
    },
    UNKNOWN: {
      code: 'UNKNOWN',
      title: 'Something Went Wrong',
      description:
        customMessage || 'An unexpected error occurred. Please try again.',
      icon: ExclamationTriangleIcon,
      actions: [
        {
          label: 'Try Again',
          action: handleRetry,
          variant: 'primary',
        },
        {
          label: 'Go Home',
          action: () => router.push('/'),
          variant: 'secondary',
        },
      ],
    },
  };

  const currentError = errorTypes[errorCode] || errorTypes['UNKNOWN'];
  if (!currentError) return null; // This should never happen, but satisfies TypeScript
  const ErrorIcon = currentError.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 text-center">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              delay: 0.1,
            }}
            className="mx-auto w-16 h-16 mb-4 rounded-full bg-system-red/10 flex items-center justify-center"
          >
            <ErrorIcon className="w-8 h-8 text-system-red" />
          </motion.div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold mb-2">{currentError.title}</h2>

          {/* Error Description */}
          <p className="text-text-secondary mb-6">{currentError.description}</p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-text-tertiary hover:text-text-secondary">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-surface-secondary rounded text-xs overflow-auto">
                {error.stack || error.message}
              </pre>
            </details>
          )}

          {/* Retry Status */}
          {isRetrying && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-text-secondary">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Retrying...</span>
            </div>
          )}

          {/* Auto-retry notification */}
          {errorCode === 'NETWORK_ERROR' && retryCount < 3 && !isRetrying && (
            <div className="mb-4 text-sm text-text-secondary">
              Auto-retry in {5 * (retryCount + 1)} seconds...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {currentError.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.action}
                disabled={isRetrying}
                className="w-full sm:w-auto"
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Help Link */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => router.push('/help')}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              <span>Need help? Visit our Help Center</span>
            </button>
          </div>

          {/* Error Code */}
          <div className="mt-4 text-xs text-text-tertiary">
            Error Code: {errorCode}
            {retryCount > 0 && ` • Retry ${retryCount}/3`}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Error Boundary Wrapper
 * Catches errors at component level
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || ErrorRecovery;
      return (
        <Fallback
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
