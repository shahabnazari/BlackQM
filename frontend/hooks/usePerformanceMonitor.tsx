'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetrics {
  navigationTime: number;
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
  bundleSize?: number;
}

interface NavigationMetrics {
  from: string;
  to: string;
  duration: number;
  timestamp: number;
}

interface PerformanceThresholds {
  navigationTime: number; // ms
  pageLoadTime: number; // ms
  lcp: number; // ms
  fcp: number; // ms
  cls: number; // score
  fid: number; // ms
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  navigationTime: 100, // Target: <100ms for navigation
  pageLoadTime: 3000, // Target: <3s for page load
  lcp: 2500, // Target: <2.5s for LCP
  fcp: 1800, // Target: <1.8s for FCP
  cls: 0.1, // Target: <0.1 for CLS
  fid: 100, // Target: <100ms for FID
};

/**
 * Hook for monitoring performance metrics
 */
export function usePerformanceMonitor(
  thresholds: Partial<PerformanceThresholds> = {}
) {
  const pathname = usePathname();
  const navigationStartTime = useRef<number>(0);
  const observer = useRef<PerformanceObserver | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<
    NavigationMetrics[]
  >([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Track navigation start
  useEffect(() => {
    navigationStartTime.current = performance.now();
  }, [pathname]);

  // Measure Core Web Vitals
  const measureWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    const metrics: Partial<PerformanceMetrics> = {};

    // Navigation Timing API
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.pageLoadTime =
        navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      metrics.timeToInteractive =
        navigationEntry.domInteractive - navigationEntry.fetchStart;
    }

    // Paint Timing API
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Largest Contentful Paint
    if (observer.current) {
      observer.current.disconnect();
    }

    try {
      observer.current = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          metrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      observer.current.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver(list => {
        let clsScore = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        metrics.cumulativeLayoutShift = clsScore;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.firstInputDelay =
            (entries[0] as any).processingStart - entries[0].startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Memory usage (if available)
    if ('memory' in performance && (performance as any).memory) {
      metrics.memoryUsage =
        (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    // Navigation time
    const navTime = performance.now() - navigationStartTime.current;
    metrics.navigationTime = navTime;

    // Track navigation in history
    setNavigationHistory(prev => {
      const newEntry: NavigationMetrics = {
        from: prev[prev.length - 1]?.to || '/',
        to: pathname,
        duration: navTime,
        timestamp: Date.now(),
      };

      // Keep only last 20 navigations
      const updated = [...prev, newEntry].slice(-20);
      return updated;
    });

    // Check thresholds and generate warnings
    const newWarnings: string[] = [];

    if (
      metrics.navigationTime &&
      metrics.navigationTime > mergedThresholds.navigationTime
    ) {
      newWarnings.push(
        `Navigation time (${Math.round(metrics.navigationTime)}ms) exceeds threshold (${mergedThresholds.navigationTime}ms)`
      );
    }

    if (
      metrics.largestContentfulPaint &&
      metrics.largestContentfulPaint > mergedThresholds.lcp
    ) {
      newWarnings.push(
        `LCP (${Math.round(metrics.largestContentfulPaint)}ms) exceeds threshold (${mergedThresholds.lcp}ms)`
      );
    }

    if (
      metrics.firstContentfulPaint &&
      metrics.firstContentfulPaint > mergedThresholds.fcp
    ) {
      newWarnings.push(
        `FCP (${Math.round(metrics.firstContentfulPaint)}ms) exceeds threshold (${mergedThresholds.fcp}ms)`
      );
    }

    if (
      metrics.cumulativeLayoutShift &&
      metrics.cumulativeLayoutShift > mergedThresholds.cls
    ) {
      newWarnings.push(
        `CLS (${metrics.cumulativeLayoutShift.toFixed(3)}) exceeds threshold (${mergedThresholds.cls})`
      );
    }

    if (
      metrics.firstInputDelay &&
      metrics.firstInputDelay > mergedThresholds.fid
    ) {
      newWarnings.push(
        `FID (${Math.round(metrics.firstInputDelay)}ms) exceeds threshold (${mergedThresholds.fid}ms)`
      );
    }

    setWarnings(newWarnings);
    setMetrics(metrics as PerformanceMetrics);

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 Performance Metrics - ${pathname}`);
      console.table(metrics);
      if (newWarnings.length > 0) {
        console.warn('⚠️ Performance Warnings:', newWarnings);
      }
      console.groupEnd();
    }

    return metrics as PerformanceMetrics;
  }, [pathname, mergedThresholds]);

  // Measure on mount and route change
  useEffect(() => {
    const timer = setTimeout(() => {
      measureWebVitals();
    }, 100); // Small delay to ensure paint metrics are available

    return () => {
      clearTimeout(timer);
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [pathname, measureWebVitals]);

  // Get average metrics
  const getAverageMetrics = useCallback(() => {
    if (navigationHistory.length === 0) return null;

    const sum = navigationHistory.reduce(
      (acc, curr) => ({
        duration: acc.duration + curr.duration,
        count: (acc.count || 0) + 1,
      }),
      { duration: 0, count: 0 }
    );

    return {
      averageNavigationTime: sum.duration / sum.count,
      totalNavigations: sum.count,
    };
  }, [navigationHistory]);

  // Export metrics for reporting
  const exportMetrics = useCallback(() => {
    const data = {
      currentMetrics: metrics,
      navigationHistory,
      averages: getAverageMetrics(),
      warnings,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, navigationHistory, getAverageMetrics, warnings]);

  // Mark for specific events
  const mark = useCallback((name: string) => {
    performance.mark(name);
  }, []);

  // Measure between marks
  const measure = useCallback(
    (name: string, startMark: string, endMark?: string) => {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        const measures = performance.getEntriesByName(name, 'measure');
        return measures[measures.length - 1]?.duration || 0;
      } catch (e) {
        console.error('Performance measure failed:', e);
        return 0;
      }
    },
    []
  );

  return {
    metrics,
    navigationHistory,
    warnings,
    getAverageMetrics,
    exportMetrics,
    mark,
    measure,
    hasPerformanceIssues: warnings.length > 0,
  };
}

/**
 * Hook for tracking component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const renderTime = performance.now() - startTime;
      renderTimes.current.push(renderTime);
      lastRenderTime.current = renderTime;

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16.67) {
        // 60fps threshold
        console.warn(
          `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });

  const getStats = useCallback(() => {
    const times = renderTimes.current;
    if (times.length === 0) return null;

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      averageRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
    };
  }, []);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    getStats,
  };
}

/**
 * Hook for monitoring bundle size impact
 */
export function useBundleSizeMonitor() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get resource timing data
    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];

    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    resources.forEach(resource => {
      const size = resource.transferSize || 0;

      if (resource.name.includes('.js') || resource.name.includes('.mjs')) {
        jsSize += size;
      } else if (resource.name.includes('.css')) {
        cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)/i)) {
        imageSize += size;
      }
    });

    const totalSize = jsSize + cssSize + imageSize;

    setBundleInfo({
      totalSize: totalSize / 1024, // Convert to KB
      jsSize: jsSize / 1024,
      cssSize: cssSize / 1024,
      imageSize: imageSize / 1024,
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.group('📦 Bundle Size Info');
      console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`JS: ${(jsSize / 1024).toFixed(2)} KB`);
      console.log(`CSS: ${(cssSize / 1024).toFixed(2)} KB`);
      console.log(`Images: ${(imageSize / 1024).toFixed(2)} KB`);
      console.groupEnd();
    }
  }, []);

  return bundleInfo;
}
