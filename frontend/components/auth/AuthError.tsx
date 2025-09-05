'use client';

import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface AuthErrorProps {
  message: string;
  onClose?: () => void;
}

export function AuthError({ message, onClose }: AuthErrorProps) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 inline-flex flex-shrink-0 rounded-md text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
