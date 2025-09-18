/**
 * React Query configuration for enterprise-grade server state management
 * Implements caching, optimistic updates, and error recovery
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ErrorHandler, isRetryableError } from '@/lib/errors';
/**
 * Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: how long to keep unused data in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount: any, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)'
        if (error instanceof Error && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
        }

        // Retry up to 3 times for retryable errors
        if (isRetryableError(error)) {
          return failureCount < 3;
        }

        return false;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex: any) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,

      // Network mode
      networkMode: 'online'
    },

    mutations: {
      // Retry configuration for mutations
      retry: 1,
      retryDelay: 1000,

      // Network mode
      networkMode: 'online'
    }
  },

  // Query cache configuration
  queryCache: new QueryCache({
    onError: (error: any, query: any) => {
      // Handle query errors globally
      ErrorHandler.handle(error)

      // Log query errors in development
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Query error:', {
          queryKey: query.queryKey,
          error
        })
      }
    },

    onSuccess: (query: any) => {
      // Track successful queries
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'query_success', {
          query_key: JSON.stringify(query.queryKey)
        })
      }
    }
  }),

  // Mutation cache configuration
  mutationCache: new MutationCache({
    onError: (error: any, mutation: any) => {
      // Handle mutation errors globally
      ErrorHandler.handle(error)

      // Log mutation errors in development
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Mutation error:', {
          mutationKey: mutation.options.mutationKey,

          error
        })
      }
    },

    onSuccess: (mutation: any) => {
      // Track successful mutations
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'mutation_success', {
          mutation_key: JSON.stringify(mutation.options.mutationKey)
        })
      }
    }
  })
})
/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Auth queries
  auth: {
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
    permissions: (userId: string) => ['auth', 'permissions', userId] as const
  },

  // Study queries
  studies: {
    all: () => ['studies'] as const,
    lists: () => [...queryKeys.studies.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.studies.lists(), filters] as const,
    details: () => [...queryKeys.studies.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.studies.details(), id] as const,
    participants: (studyId: string) =>
      [...queryKeys.studies.detail(studyId), 'participants'] as const,
    results: (studyId: string) => [...queryKeys.studies.detail(studyId), 'results'] as const
  },

  // Participant queries
  participants: {
    all: () => ['participants'] as const,
    list: (studyId: string, filters?: Record<string, any>) =>
      ['participants', studyId, filters] as const,
    detail: (id: string) => ['participants', 'detail', id] as const,
    metrics: (studyId: string) => ['participants', 'metrics', studyId] as const
  },

  // Questionnaire queries
  questionnaires: {
    all: () => ['questionnaires'] as const,
    templates: () => ['questionnaires', 'templates'] as const,
    detail: (id: string) => ['questionnaires', 'detail', id] as const,
    responses: (questionnaireId: string) =>
      ['questionnaires', 'responses', questionnaireId] as const
  },

  // Analysis queries
  analysis: {
    results: (studyId: string) => ['analysis', 'results', studyId] as const,
    insights: (studyId: string) => ['analysis', 'insights', studyId] as const,
    export: (studyId: string, format: string) => ['analysis', 'export', studyId, format] as const
  },

  // AI queries
  ai: {
    suggestions: (_context: string) => ['ai', 'suggestions'] as const,
    analysis: (_data: any) => ['ai', 'analysis'] as const,
    generation: (prompt: string) => ['ai', 'generation', prompt] as const
  }
} as const;
/**
 * Optimistic update helpers
 */
export const optimisticUpdates = {
  /**
   * Add item to list optimistically
   */
  addToList: <T extends { id: string }>(queryKey: readonly unknown[], newItem: T) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      return old ? [...(old as any), newItem] : [newItem];
    })
  },

  /**
   * Update item in list optimistically
   */
  updateInList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    id: string,
    updates: Partial<T>
  ) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      return old?.map((item: any) => (item.id === id ? { ...(item as any), ...updates } : item));
    })
  },

  /**
   * Remove item from list optimistically
   */
  removeFromList: <T extends { id: string }>(queryKey: readonly unknown[], id: string) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      return old?.filter((item: any) => item.id !== id);
    })
  },

  /**
   * Update single item optimistically
   */
  updateItem: <T>(queryKey: readonly unknown[], updates: Partial<T>) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      return old ? { ...(old as any), ...updates } : old;
    })
  }
}
/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all queries for a resource
   */
  invalidateResource: (resource: keyof typeof queryKeys) => {
    const resourceKey = queryKeys[resource];
    if ('all' in resourceKey && typeof resourceKey.all === 'function') {
      queryClient.invalidateQueries({
        queryKey: resourceKey.all()
      })
    } else {
      // For resources without 'all' method, invalidate the entire resource
      queryClient.invalidateQueries({
        queryKey: [resource]
      })
    }
  },

  /**
   * Invalidate specific query
   */
  invalidateQuery: (queryKey: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey })
  },

  /**
   * Reset all queries
   */
  resetAll: () => {
    queryClient.clear()
  },

  /**
   * Prefetch query
   */
  prefetch: async (
    queryKey: readonly unknown[],
    queryFn: () => Promise<any>,
    staleTime?: number
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: staleTime || 5 * 60 * 1000, // 5 minutes default;
    })
  }
}
/**
 * Performance monitoring for React Query
 */
export class QueryPerformanceMonitor {
  private static queryTimes = new Map<string, number>()

  /**
   * Track query execution time
   */
  static trackQueryTime(queryKey: readonly unknown[], time: number): void {
    const key = JSON.stringify(queryKey);
    const times: number[] = this.queryTimes.get(key) || [];
    (Array.isArray(times) ? times : []).push(time);

    // Keep only last 100 measurements
    if ((Array.isArray(times) ? times.length : 0) > 100) {
      (times as number[]).shift()
    }

    this.queryTimes.set(key, times);

    // Log slow queries
    if (time > 2000) {
      console.warn(`Slow query detected: ${key} took ${time.toFixed(2)}ms`);
    }
  }

  /**
   * Get average query time
   */
  static getAverageTime(queryKey: readonly unknown[]): number | null {
    const key = JSON.stringify(queryKey);
    const times = this.queryTimes.get(key);

    if (!times || (Array.isArray(times) ? times.length : 0) === 0) {
      return null;
    }

    const sum = (times as number[]).reduce((acc: any, time: any) => acc + time, 0);
    return sum / (Array.isArray(times) ? times.length : 0);
  }

  /**
   * Get query performance metrics
   */
  static getMetrics(): Record<string, { average: number; count: number }> {
    const metrics: Record<string, { average: number; count: number }> = {}
    this.queryTimes.forEach((times: any, key: any) => {
      const sum = (times as number[]).reduce((acc: any, time: any) => acc + time, 0);
      metrics[key] = {
        average: sum / (Array.isArray(times) ? times.length : 0),
        count: (Array.isArray(times) ? times.length : 0)
      }
    })

    return metrics;
  }

  /**
   * Clear metrics
   */
  static clear(): void {
    this.queryTimes.clear()
  }
}
/**
 * Offline support configuration
 */
export const offlineConfig = {
  /**
   * Queries that should work offline
   */
  offlineQueries: [queryKeys.auth.user(), queryKeys.studies.lists()],

  /**
   * Enable offline persistence
   */
  enablePersistence: () => {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      // Implement persistence plugin
      // This would integrate with a persistence library
    }
  }
}
/**
 * Export configured providers
 */
export { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// export { ReactQueryDevtools } from '@tanstack/react-query-devtools';  // TODO: Install devtools package
