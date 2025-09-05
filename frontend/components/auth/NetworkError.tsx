import React from 'react';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  details?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = 'Connection Error',
  details = 'Please check your internet connection and try again.',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AppleCard className="w-full max-w-md p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold mb-2">{message}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {details}
          </p>

          <div className="space-y-3">
            {onRetry && (
              <AppleButton
                variant="primary"
                className="w-full"
                onClick={onRetry}
              >
                Try Again
              </AppleButton>
            )}

            <AppleButton
              variant="secondary"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </AppleButton>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• Check your Wi-Fi or mobile data connection</p>
              <p>• Verify the service isn't blocked by a firewall</p>
              <p>• Try again in a few moments</p>
            </div>
          </div>
        </div>
      </AppleCard>
    </div>
  );
};
