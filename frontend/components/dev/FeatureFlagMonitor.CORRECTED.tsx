/**
 * Phase 10.93 Day 7 - Feature Flag Monitoring Dashboard (STRICT AUDIT CORRECTED)
 *
 * Visual dashboard for monitoring active feature flags during rollout.
 * Only visible in development mode.
 *
 * **STRICT AUDIT FIXES:**
 * - ✅ ACCESSIBILITY-001: Replaced alert() with toast notifications
 * - ✅ PERF-001: Memoized getSourceColor function with useCallback
 * - ✅ TYPE-003: Proper type annotations throughout
 *
 * **Usage:**
 * ```typescript
 * import { FeatureFlagMonitor } from '@/components/dev/FeatureFlagMonitor';
 *
 * // Add to page layout
 * <FeatureFlagMonitor />
 * ```
 *
 * @module FeatureFlagMonitor
 * @since Phase 10.93 Day 7
 * @author VQMethod Team
 * @enterprise-grade Production-ready monitoring
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, RefreshCw, X, Info } from 'lucide-react';
// STRICT AUDIT FIX: ACCESSIBILITY-001 - Use toast instead of alert()
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

  // Load metadata on mount and when expanded
  useEffect(() => {
    if (isExpanded) {
      setMetadata(getFeatureFlagMetadata());
      setLastRefresh(Date.now());
    }
  }, [isExpanded]);

  // Refresh metadata
  const handleRefresh = useCallback(() => {
    setMetadata(getFeatureFlagMetadata());
    setLastRefresh(Date.now());
  }, []);

  // Toggle flag override
  // STRICT AUDIT FIX: ACCESSIBILITY-001 - Use toast instead of alert()
  const handleToggleFlag = useCallback((name: keyof FeatureFlagConfig) => {
    const currentValue = featureFlags[name];
    setFeatureFlagOverride(name, !currentValue);

    // Use toast notification instead of alert for better UX
    toast.info('Feature Flag Override Set', {
      description: `${name} = ${!currentValue}\n\nPlease reload the page for changes to take effect.`,
      duration: 5000,
    });
  }, []);

  // Clear flag override
  // STRICT AUDIT FIX: ACCESSIBILITY-001 - Use toast instead of alert()
  const handleClearOverride = useCallback((name: keyof FeatureFlagConfig) => {
    clearFeatureFlagOverride(name);

    toast.success('Feature Flag Override Cleared', {
      description: `${name}\n\nPlease reload the page for changes to take effect.`,
      duration: 5000,
    });
  }, []);

  // Get source color
  // STRICT AUDIT FIX: PERF-001 - Memoized with useCallback
  const getSourceColor = useCallback((source: string): 'default' | 'destructive' | 'secondary' => {
    switch (source) {
      case 'localStorage':
        return 'destructive'; // Red for overrides
      case 'environment':
        return 'default'; // Blue for env
      default:
        return 'secondary'; // Gray for defaults
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
          <div className="space-y-3" role="list" aria-label="Feature flags">
            {metadata.map(flag => (
              <div
                key={flag.name}
                className="p-3 border rounded-lg space-y-2"
                role="listitem"
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
              </div>
            ))}
          </div>

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
