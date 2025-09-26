import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Additional metrics
  navigationTiming?: {
    domContentLoaded: number;
    loadComplete: number;
    domInteractive: number;
    domComplete: number;
  };

  // Memory usage (if available)
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };

  // Network information
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // Custom metrics
  customMetrics?: Record<string, number>;
}

// Core Web Vitals observer
class WebVitalsObserver {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor(private onUpdate: (metrics: PerformanceMetrics) => void) {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          this.onUpdate(this.metrics);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe FID
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-input') {
              this.metrics.fid = entry.processingStart - entry.startTime;
              this.onUpdate(this.metrics);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Observe CLS
      try {
        let clsValue = 0;
        let clsEntries: any[] = [];

        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsEntries.push(entry);
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.onUpdate(this.metrics);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Observe Paint Timing
      try {
        const paintObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.onUpdate(this.metrics);
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint timing observer not supported');
      }
    }

    // Navigation Timing API
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      this.metrics.ttfb = timing.responseStart - navigationStart;
      this.metrics.navigationTiming = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
        domComplete: timing.domComplete - navigationStart,
      };
    }

    // Memory usage (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  public markCustomMetric(name: string, value: number) {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }
    this.metrics.customMetrics[name] = value;
    this.onUpdate(this.metrics);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [observer, setObserver] = useState<WebVitalsObserver | null>(null);

  // Mark custom performance metric
  const markMetric = useCallback(
    (name: string, value: number) => {
      if (observer) {
        observer.markCustomMetric(name, value);
      }
    },
    [observer]
  );

  // Measure performance of an async operation
  const measureAsync = useCallback(
    async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await operation();
        const duration = performance.now() - startTime;
        markMetric(name, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        markMetric(`${name}_error`, duration);
        throw error;
      }
    },
    [markMetric]
  );

  // Measure performance of a sync operation
  const measureSync = useCallback(
    <T>(name: string, operation: () => T): T => {
      const startTime = performance.now();
      try {
        const result = operation();
        const duration = performance.now() - startTime;
        markMetric(name, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        markMetric(`${name}_error`, duration);
        throw error;
      }
    },
    [markMetric]
  );

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return observer ? observer.getMetrics() : {};
  }, [observer]);

  // Send metrics to analytics service
  const sendMetrics = useCallback(async () => {
    const currentMetrics = getMetrics();

    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to your analytics endpoint
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            metrics: currentMetrics,
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error('Failed to send performance metrics:', error);
      }
    } else {
      console.log('Performance Metrics:', currentMetrics);
    }
  }, [getMetrics]);

  useEffect(() => {
    // Initialize observer
    const webVitalsObserver = new WebVitalsObserver(updatedMetrics => {
      setMetrics(updatedMetrics);
    });
    setObserver(webVitalsObserver);

    // Send metrics periodically (every 30 seconds in production)
    const intervalId = setInterval(
      () => {
        sendMetrics();
      },
      process.env.NODE_ENV === 'production' ? 30000 : 60000
    );

    // Send metrics when page is about to unload
    const handleBeforeUnload = () => {
      sendMetrics();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      webVitalsObserver.cleanup();
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendMetrics]);

  return {
    metrics,
    markMetric,
    measureAsync,
    measureSync,
    getMetrics,
    sendMetrics,
  };
}

// Utility function to format metrics for display
export function formatMetric(
  value: number,
  type: 'time' | 'size' | 'percentage' | 'number' = 'number'
): string {
  switch (type) {
    case 'time':
      if (value < 1000) return `${Math.round(value)}ms`;
      return `${(value / 1000).toFixed(2)}s`;
    case 'size':
      if (value < 1024) return `${value}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)}KB`;
      return `${(value / (1024 * 1024)).toFixed(2)}MB`;
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`;
    default:
      return value.toFixed(2);
  }
}

// Utility to get performance rating based on thresholds
export function getMetricRating(
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}
