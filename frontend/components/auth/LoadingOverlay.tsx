'use client';

import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({
  message = 'Loading...',
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="rounded-2xl bg-white/90 dark:bg-black/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
