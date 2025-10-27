/**
 * Cached Results Banner - Phase 10 Day 3 Task 5
 *
 * Graceful Degradation UI for rate-limited API responses
 * Shows when serving stale/archive cached results
 *
 * @features
 * - "Cached results" badge with age indicator
 * - "Retry now" button for fresh fetch
 * - Suggested alternative queries
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface CachedResultsBannerProps {
  isStale?: boolean;
  isArchive?: boolean;
  cacheAge?: number; // in seconds
  onRetry?: () => void;
  suggestedQueries?: string[];
  onSuggestedQueryClick?: (query: string) => void;
  className?: string;
}

export function CachedResultsBanner({
  isStale = false,
  isArchive = false,
  cacheAge = 0,
  onRetry,
  suggestedQueries = [],
  onSuggestedQueryClick,
  className,
}: CachedResultsBannerProps) {
  const [retrying, setRetrying] = useState(false);

  if (!isStale && !isArchive) {
    return null;
  }

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const formatCacheAge = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  const cacheTypeColor = isArchive ? 'text-orange-600' : 'text-amber-600';
  const borderColor = isArchive ? 'border-orange-200' : 'border-amber-200';
  const bgColor = isArchive ? 'bg-orange-50' : 'bg-amber-50';

  return (
    <Alert
      className={cn(
        'mb-6 border-2',
        borderColor,
        bgColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Database className={cn('h-5 w-5 mt-0.5', cacheTypeColor)} />

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertDescription className="text-sm font-medium text-gray-900">
                Showing cached results
              </AlertDescription>

              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-normal',
                  isArchive ? 'border-orange-300 bg-orange-100 text-orange-700' : 'border-amber-300 bg-amber-100 text-amber-700'
                )}
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatCacheAge(cacheAge)}
              </Badge>
            </div>

            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={retrying}
                className="shrink-0"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry now
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Explanation */}
          <AlertDescription className="text-xs text-gray-600">
            {isArchive ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                These results are from our archive cache. API rate limits detected.
                Results may not include the latest papers.
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                API rate limits detected. Showing cached results from {formatCacheAge(cacheAge)}.
                Click "Retry now" to fetch fresh results.
              </>
            )}
          </AlertDescription>

          {/* Suggested Queries */}
          {suggestedQueries.length > 0 && onSuggestedQueryClick && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <Sparkles className="h-3.5 w-3.5" />
                Try these related queries:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => onSuggestedQueryClick(query)}
                    className="text-xs h-7 px-3"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Hook to extract cache metadata from API response
 */
export function useCacheMetadata(response: any) {
  if (!response) {
    return {
      isStale: false,
      isArchive: false,
      cacheAge: 0,
    };
  }

  return {
    isStale: response.cacheMetadata?.isStale || false,
    isArchive: response.cacheMetadata?.isArchive || false,
    cacheAge: response.cacheMetadata?.age || 0,
  };
}
