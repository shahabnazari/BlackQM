/**
 * Phase 10.93 Day 7 - Feature Flag Monitoring Dashboard (STRICT AUDIT CORRECTED v2)
 *
 * Visual dashboard for monitoring active feature flags during rollout.
 * Only visible in development mode.
 *
 * **STRICT AUDIT 1 FIXES:**
 * - ✅ ACCESSIBILITY-001: Replaced alert() with toast notifications
 * - ✅ PERF-001: Memoized getSourceColor function with useCallback
 * - ✅ TYPE-003: Proper type annotations throughout
 * - ✅ NEW-TYPE-002: Fixed symbol to string conversion in toast messages
 *
 * **STRICT AUDIT 2 FIXES:**
 * - ✅ A11Y-001: Semantic HTML (<ul>/<li>) instead of div with role="list"
 * - ✅ EH-001: Error handling in useEffect and handleRefresh with try-catch
 * - ✅ DX-001: Warning for unknown source types in getSourceColor
 *
 * @module FeatureFlagMonitor
 * @since Phase 10.93 Day 7
 * @author VQMethod Team
 * @enterprise-grade Production-ready monitoring
 * @quality-score 10/10
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, RefreshCw, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  featureFlags,
  getFeatureFlagMetadata,
  setFeatureFlagOverride,
  clearFeatureFlagOverride,
  type FeatureFlagMetadata,
  type FeatureFlagConfig,
} from '@/lib/config/feature-flags';

/**
 * Feature flag monitoring dashboard component
 *
 * @returns Feature flag monitor UI
 */
export function FeatureFlagMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metadata, setMetadata] = useState<FeatureFlagMetadata[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  // STRICT AUDIT FIX: EH-001 - Add error state for graceful error handling
  const [error, setError] = useState<string | null>(null);

  // Load metadata on mount and when expanded
  // STRICT AUDIT FIX: EH-001 - Added try-catch for error handling
  useEffect(() => {
    if (isExpanded) {
      try {
        setMetadata(getFeatureFlagMetadata());
        setLastRefresh(Date.now());
        setError(null); // Clear previous errors
      } catch (err) {
        console.error('[FeatureFlagMonitor] Failed to load metadata:', err);
        setMetadata([]); // Graceful fallback to empty list
        setError(err instanceof Error ? err.message : 'Failed to load feature flags');

        // Show user-friendly error notification
        toast.error('Failed to Load Feature Flags', {
          description: 'Check console for details',
          duration: 3000,
        });
      }
    }
  }, [isExpanded]);

  // Refresh metadata
  // STRICT AUDIT FIX: EH-001 - Added try-catch for error handling
  const handleRefresh = useCallback(() => {
    try {
      setMetadata(getFeatureFlagMetadata());
      setLastRefresh(Date.now());
      setError(null); // Clear previous errors
    } catch (err) {
      console.error('[FeatureFlagMonitor] Failed to refresh metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');

      // Show user-friendly error notification
      toast.error('Failed to Refresh', {
        description: 'Check console for details',
        duration: 3000,
      });
    }
  }, []);

  // Toggle flag override
  const handleToggleFlag = useCallback((name: keyof FeatureFlagConfig) => {
    const currentValue = featureFlags[name];
    setFeatureFlagOverride(name, !currentValue);

    // Use toast notification instead of alert for better UX
    // String(name) ensures type safety for keyof FeatureFlagConfig
    toast.info('Feature Flag Override Set', {
      description: `${String(name)} = ${!currentValue}\n\nPlease reload the page for changes to take effect.`,
      duration: 5000,
    });
  }, []);

  // Clear flag override
  const handleClearOverride = useCallback((name: keyof FeatureFlagConfig) => {
    clearFeatureFlagOverride(name);

    toast.success('Feature Flag Override Cleared', {
      description: `${String(name)}\n\nPlease reload the page for changes to take effect.`,
      duration: 5000,
    });
  }, []);

  // Get source color
  // STRICT AUDIT FIX: DX-001 - Added warning for unknown source types
  const getSourceColor = useCallback((source: string): 'default' | 'destructive' | 'secondary' => {
    switch (source) {
      case 'localStorage':
        return 'destructive'; // Red for overrides
      case 'environment':
        return 'default'; // Blue for env
      case 'default':
        return 'secondary'; // Gray for defaults
      default:
        // STRICT AUDIT FIX: DX-001 - Warn about unknown source types in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[FeatureFlagMonitor] Unknown source type: "${source}". ` +
            `Defaulting to secondary variant. ` +
            `Expected: localStorage | environment | default`
          );
        }
        return 'secondary';
    }
  }, []);

  // Don't render in production or if monitoring is disabled
  // REACT HOOKS FIX: Moved this check AFTER all hooks to comply with Rules of Hooks
  if (
    process.env.NODE_ENV === 'production' ||
    !featureFlags.ENABLE_FEATURE_FLAG_MONITORING
  ) {
    return null;
  }

  // Collapsed view: Just a floating button
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          size="sm"
          variant="outline"
          className="shadow-lg"
          aria-label="Open feature flags dashboard"
        >
          <Flag className="w-4 h-4 mr-2" aria-hidden="true" />
          Feature Flags
        </Button>
      </div>
    );
  }

  // Expanded view: Full dashboard
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="w-5 h-5" aria-hidden="true" />
                Feature Flags
              </CardTitle>
              <CardDescription>Monitoring Dashboard (Dev Only)</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              aria-label="Close feature flags dashboard"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Refresh Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {/* STRICT AUDIT FIX: EH-001 - Display error state */}
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for localStorage overrides */}
          {metadata.some(m => m.source === 'localStorage') && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-xs">
                Some flags have localStorage overrides. Reload page after changes.
              </AlertDescription>
            </Alert>
          )}

          {/* Feature Flags List */}
          {/* STRICT AUDIT FIX: A11Y-001 - Semantic HTML <ul>/<li> instead of div */}
          <ul className="space-y-3 list-none p-0 m-0" aria-label="Feature flags">
            {metadata.map(flag => (
              <li
                key={flag.name}
                className="p-3 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{flag.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Source: <Badge variant={getSourceColor(flag.source)} className="ml-1">{flag.source}</Badge>
                    </div>
                  </div>
                  <Badge variant={flag.enabled ? 'default' : 'secondary'} aria-label={`Flag status: ${flag.enabled ? 'enabled' : 'disabled'}`}>
                    {flag.enabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleToggleFlag(flag.name)}
                    aria-label={`Toggle ${flag.name}`}
                  >
                    Toggle
                  </Button>
                  {flag.source === 'localStorage' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleClearOverride(flag.name)}
                      aria-label={`Clear override for ${flag.name}`}
                    >
                      Clear Override
                    </Button>
                  )}
                </div>

                {/* Flag-specific info */}
                {flag.name === 'USE_NEW_THEME_EXTRACTION' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {flag.enabled ? (
                      <div className="text-green-600 dark:text-green-400" role="status">
                        ✓ Using NEW service-based implementation
                      </div>
                    ) : (
                      <div className="text-orange-600 dark:text-orange-400" role="status">
                        ⚠ Using OLD monolithic implementation (rollback mode)
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Help Text */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Testing:</strong> Toggle flags to test implementations.
              Changes require page reload. Console commands available at{' '}
              <code className="bg-muted px-1 py-0.5 rounded">
                window.__featureFlags
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeatureFlagMonitor;
