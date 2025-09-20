'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading Skeleton for Analysis Hub
 * Enhanced UI/UX for loading states
 */
export function HubLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
          >
            <Skeleton className="h-4 w-24 mb-3 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-8 w-16 mb-2 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {/* Tab Navigation Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex space-x-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton
                key={i}
                className="h-4 w-20 bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <Skeleton className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>

          {/* Table Skeleton */}
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton
                  key={i}
                  className="h-4 bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>

            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="grid grid-cols-5 gap-4 py-3">
                {[1, 2, 3, 4, 5].map(col => (
                  <Skeleton
                    key={col}
                    className="h-4 bg-gray-200 dark:bg-gray-700"
                    style={{
                      width: col === 1 ? '100%' : `${80 + Math.random() * 20}%`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chart Loading Skeleton
 */
export function ChartLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
        <div className="relative h-64 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
              <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

/**
 * List Loading Skeleton
 */
export function ListLoadingSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }, (_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
        >
          <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
