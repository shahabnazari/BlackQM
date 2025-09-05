'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon } from '@heroicons/react/24/outline';

interface SessionExpiredProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function SessionExpired({ isOpen, onClose }: SessionExpiredProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    router.push('/auth/login');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
            <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Session Expired
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-400">
            Your session has expired for security reasons. Please login again to
            continue.
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={handleLogin}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Login Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
