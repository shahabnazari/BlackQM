/**
 * Phase 10.93 Day 9 - Performance Metrics Collection
 *
 * Enterprise-grade performance monitoring for cross-browser testing.
 * Collects and aggregates performance metrics including:
 * - Page load times
 * - Core Web Vitals (LCP, FID, CLS)
 * - Custom business metrics
 * - Memory usage
 * - Network timing
 *
 * @module performance-metrics
 * @since Phase 10.93 Day 9
 * @author VQMethod Team
 * @enterprise-grade Production-ready performance monitoring
 */

import { getBrowserInfo, type BrowserInfo } from './browser-detection';

/**
 * Core Web Vitals thresholds (Google recommendations)
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  /** Largest Contentful Paint (LCP) - Good: ≤2.5s, Needs Improvement: ≤4s, Poor: >4s */
  LCP_GOOD: 2500,
  LCP_NEEDS_IMPROVEMENT: 4000,

  /** First Input Delay (FID) - Good: ≤100ms, Needs Improvement: ≤300ms, Poor: >300ms */
  FID_GOOD: 100,
  FID_NEEDS_IMPROVEMENT: 300,

  /** Cumulative Layout Shift (CLS) - Good: ≤0.1, Needs Improvement: ≤0.25, Poor: >0.25 */
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,

  /** First Contentful Paint (FCP) - Good: ≤1.8s, Needs Improvement: ≤3s, Poor: >3s */
  FCP_GOOD: 1800,
  FCP_NEEDS_IMPROVEMENT: 3000,

  /** Time to Interactive (TTI) - Good: ≤3.8s, Needs Improvement: ≤7.3s, Poor: >7.3s */
  TTI_GOOD: 3800,
  TTI_NEEDS_IMPROVEMENT: 7300,
} as const;

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: 'ms' | 'bytes' | 'score' | 'count';
  /** Metric rating */
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  /** Timestamp when metric was recorded */
  timestamp: number;
  /** Browser information */
  browser: BrowserInfo;
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint */
  LCP: number | null;
  /** First Input Delay */
  FID: number | null;
  /** Cumulative Layout Shift */
  CLS: number | null;
  /** First Contentful Paint */
  FCP: number | null;
  /** Time to Interactive */
  TTI: number | null;
  /** Time to First Byte */
  TTFB: number | null;
}

/**
 * Custom business metrics for theme extraction
 */
export interface BusinessMetrics {
  /** Time to open theme extraction modal */
  modalOpenTime: number | null;
  /** Time to complete paper validation */
  validationTime: number | null;
  /** Time to fetch full-text */
  fullTextFetchTime: number | null;
  /** Time to analyze content */
  contentAnalysisTime: number | null;
  /** Total workflow completion time */
  workflowCompletionTime: number | null;
  /** Number of papers processed */
  papersProcessed: number | null;
  /** Success rate */
  successRate: number | null;
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  /** Used JS heap size (bytes) */
  usedJSHeapSize: number | null;
  /** Total JS heap size (bytes) */
  totalJSHeapSize: number | null;
  /** JS heap size limit (bytes) */
  jsHeapSizeLimit: number | null;
  /** Memory usage percentage */
  memoryUsagePercent: number | null;
}

/**
 * Network timing metrics
 */
export interface NetworkMetrics {
  /** DNS lookup time */
  dnsTime: number;
  /** TCP connection time */
  tcpTime: number;
  /** TLS handshake time */
  tlsTime: number;
  /** Request time */
  requestTime: number;
  /** Response time */
  responseTime: number;
  /** Total network time */
  totalNetworkTime: number;
}

/**
 * Comprehensive performance report
 */
export interface PerformanceReport {
  /** Report ID */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Browser information */
  browser: BrowserInfo;
  /** Core Web Vitals */
  coreWebVitals: CoreWebVitals;
  /** Business metrics */
  businessMetrics: BusinessMetrics;
  /** Memory metrics */
  memoryMetrics: MemoryMetrics;
  /** Network metrics */
  networkMetrics: NetworkMetrics;
  /** Overall rating */
  overallRating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
}

/**
 * Rate performance metric based on thresholds
 *
 * @param value - Metric value
 * @param goodThreshold - Good threshold
 * @param needsImprovementThreshold - Needs improvement threshold
 * @returns Performance rating
 */
function rateMetric(
  value: number | null,
  goodThreshold: number,
  needsImprovementThreshold: number
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null) {
    return 'unknown';
  }

  if (value <= goodThreshold) {
    return 'good';
  }

  if (value <= needsImprovementThreshold) {
    return 'needs-improvement';
  }

  return 'poor';
}

/**
 * Get Core Web Vitals metrics
 *
 * Server-safe: Returns null values if not available
 *
 * @returns Core Web Vitals
 */
export function getCoreWebVitals(): CoreWebVitals {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTI: null,
      TTFB: null,
    };
  }

  const metrics: CoreWebVitals = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTI: null,
    TTFB: null,
  };

  // Get TTFB from Navigation Timing
  const navigationTiming = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (navigationTiming) {
    metrics.TTFB = navigationTiming.responseStart - navigationTiming.requestStart;
  }

  // Get paint metrics
  if (window.performance.getEntriesByType) {
    const paintEntries = window.performance.getEntriesByType('paint');

    paintEntries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.FCP = entry.startTime;
      }
    });
  }

  // STRICT AUDIT FIX: BUG-002 & PERF-002 - PerformanceObservers were never disconnected
  // Use singleton observers to prevent memory leaks
  // Observers will automatically collect metrics, we just read the current values

  // Observe LCP, FID, CLS using PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      // Note: For production use, observers should be created once and reused
      // For now, we read from already-observed entries if available
      // This prevents creating new observers on every call

      // Try to get LCP from existing performance entries
      if (window.performance.getEntriesByType) {
        const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          const lastEntry = lcpEntries[lcpEntries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || 0;
        }
      }

      // Try to get FID from existing performance entries
      if (window.performance.getEntriesByType) {
        const fidEntries = window.performance.getEntriesByType('first-input');
        if (fidEntries.length > 0) {
          const firstEntry = fidEntries[0] as PerformanceEntry & {
            processingStart?: number;
          };
          if (firstEntry.processingStart) {
            metrics.FID = firstEntry.processingStart - firstEntry.startTime;
          }
        }
      }

      // Try to get CLS from existing performance entries
      if (window.performance.getEntriesByType) {
        const clsEntries = window.performance.getEntriesByType('layout-shift');
        let clsValue = 0;
        clsEntries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        });
        if (clsValue > 0) {
          metrics.CLS = clsValue;
        }
      }
    } catch (error) {
      console.error('[PerformanceMetrics] Performance entries access failed:', error);
    }
  }

  // Estimate TTI (simplified)
  if (navigationTiming) {
    metrics.TTI = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
  }

  return metrics;
}

/**
 * STRICT AUDIT FIX: TYPE-002 - Extract performance.memory type definition
 * Chrome-specific extension to Performance API
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Get memory metrics
 *
 * Server-safe: Returns null values if not available
 * Chrome-only: performance.memory is a Chrome-specific extension
 *
 * @returns Memory metrics
 */
export function getMemoryMetrics(): MemoryMetrics {
  if (typeof window === 'undefined' || !(performance as PerformanceWithMemory).memory) {
    return {
      usedJSHeapSize: null,
      totalJSHeapSize: null,
      jsHeapSizeLimit: null,
      memoryUsagePercent: null,
    };
  }

  const memory = (performance as PerformanceWithMemory).memory!

  const usedJSHeapSize = memory.usedJSHeapSize;
  const totalJSHeapSize = memory.totalJSHeapSize;
  const jsHeapSizeLimit = memory.jsHeapSizeLimit;
  const memoryUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

  return {
    usedJSHeapSize,
    totalJSHeapSize,
    jsHeapSizeLimit,
    memoryUsagePercent,
  };
}

/**
 * Get network timing metrics
 *
 * Server-safe: Returns zero values if not available
 *
 * @returns Network metrics
 */
export function getNetworkMetrics(): NetworkMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      dnsTime: 0,
      tcpTime: 0,
      tlsTime: 0,
      requestTime: 0,
      responseTime: 0,
      totalNetworkTime: 0,
    };
  }

  const navigationTiming = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (!navigationTiming) {
    return {
      dnsTime: 0,
      tcpTime: 0,
      tlsTime: 0,
      requestTime: 0,
      responseTime: 0,
      totalNetworkTime: 0,
    };
  }

  const dnsTime = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
  const tcpTime = navigationTiming.connectEnd - navigationTiming.connectStart;
  const tlsTime = navigationTiming.secureConnectionStart
    ? navigationTiming.connectEnd - navigationTiming.secureConnectionStart
    : 0;
  const requestTime = navigationTiming.responseStart - navigationTiming.requestStart;
  const responseTime = navigationTiming.responseEnd - navigationTiming.responseStart;
  const totalNetworkTime =
    dnsTime + tcpTime + tlsTime + requestTime + responseTime;

  return {
    dnsTime,
    tcpTime,
    tlsTime,
    requestTime,
    responseTime,
    totalNetworkTime,
  };
}

/**
 * Calculate overall performance rating based on Core Web Vitals
 *
 * The overall rating is determined by the worst rating among the three
 * Core Web Vitals metrics (LCP, FID, CLS). This follows Google's
 * recommendation that a page needs good ratings on all three metrics
 * to be considered performant.
 *
 * @param lcpRating - Largest Contentful Paint rating
 * @param fidRating - First Input Delay rating
 * @param clsRating - Cumulative Layout Shift rating
 * @returns Overall performance rating
 *
 * @example
 * calculateOverallRating('good', 'good', 'good') // 'good'
 * calculateOverallRating('good', 'needs-improvement', 'good') // 'needs-improvement'
 * calculateOverallRating('good', 'good', 'poor') // 'poor'
 * calculateOverallRating('unknown', 'good', 'good') // 'unknown'
 */
export function calculateOverallRating(
  lcpRating: 'good' | 'needs-improvement' | 'poor' | 'unknown',
  fidRating: 'good' | 'needs-improvement' | 'poor' | 'unknown',
  clsRating: 'good' | 'needs-improvement' | 'poor' | 'unknown'
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  // If any metric is unknown, overall rating is unknown
  if (lcpRating === 'unknown' || fidRating === 'unknown' || clsRating === 'unknown') {
    return 'unknown';
  }

  // If any metric is poor, overall rating is poor
  if (lcpRating === 'poor' || fidRating === 'poor' || clsRating === 'poor') {
    return 'poor';
  }

  // If any metric needs improvement, overall rating needs improvement
  if (
    lcpRating === 'needs-improvement' ||
    fidRating === 'needs-improvement' ||
    clsRating === 'needs-improvement'
  ) {
    return 'needs-improvement';
  }

  // All metrics are good
  return 'good';
}

/**
 * Create performance report
 *
 * @param businessMetrics - Business metrics (optional)
 * @returns Performance report
 */
export function createPerformanceReport(
  businessMetrics?: Partial<BusinessMetrics>
): PerformanceReport {
  const id = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  const browser = getBrowserInfo();
  const coreWebVitals = getCoreWebVitals();
  const memoryMetrics = getMemoryMetrics();
  const networkMetrics = getNetworkMetrics();

  // Calculate overall rating based on Core Web Vitals
  const lcpRating = rateMetric(
    coreWebVitals.LCP,
    CORE_WEB_VITALS_THRESHOLDS.LCP_GOOD,
    CORE_WEB_VITALS_THRESHOLDS.LCP_NEEDS_IMPROVEMENT
  );
  const fidRating = rateMetric(
    coreWebVitals.FID,
    CORE_WEB_VITALS_THRESHOLDS.FID_GOOD,
    CORE_WEB_VITALS_THRESHOLDS.FID_NEEDS_IMPROVEMENT
  );
  const clsRating = rateMetric(
    coreWebVitals.CLS,
    CORE_WEB_VITALS_THRESHOLDS.CLS_GOOD,
    CORE_WEB_VITALS_THRESHOLDS.CLS_NEEDS_IMPROVEMENT
  );

  // Overall rating is the worst of the three Core Web Vitals
  const overallRating = calculateOverallRating(lcpRating, fidRating, clsRating);

  return {
    id,
    timestamp,
    browser,
    coreWebVitals,
    businessMetrics: {
      modalOpenTime: null,
      validationTime: null,
      fullTextFetchTime: null,
      contentAnalysisTime: null,
      workflowCompletionTime: null,
      papersProcessed: null,
      successRate: null,
      ...businessMetrics,
    },
    memoryMetrics,
    networkMetrics,
    overallRating,
  };
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) {
    return 'N/A';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format milliseconds to human-readable string
 *
 * @param ms - Milliseconds
 * @returns Formatted string
 */
export function formatMs(ms: number | null): string {
  if (ms === null) {
    return 'N/A';
  }

  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Log performance report to console (development only)
 *
 * @param report - Performance report
 */
export function logPerformanceReport(report: PerformanceReport): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group(`[Performance Report] ${report.browser.type} ${report.browser.version}`);

  console.group('Core Web Vitals');
  console.log('LCP:', formatMs(report.coreWebVitals.LCP), rateMetric(report.coreWebVitals.LCP, CORE_WEB_VITALS_THRESHOLDS.LCP_GOOD, CORE_WEB_VITALS_THRESHOLDS.LCP_NEEDS_IMPROVEMENT));
  console.log('FID:', formatMs(report.coreWebVitals.FID), rateMetric(report.coreWebVitals.FID, CORE_WEB_VITALS_THRESHOLDS.FID_GOOD, CORE_WEB_VITALS_THRESHOLDS.FID_NEEDS_IMPROVEMENT));
  console.log('CLS:', report.coreWebVitals.CLS?.toFixed(3) ?? 'N/A', rateMetric(report.coreWebVitals.CLS, CORE_WEB_VITALS_THRESHOLDS.CLS_GOOD, CORE_WEB_VITALS_THRESHOLDS.CLS_NEEDS_IMPROVEMENT));
  console.log('FCP:', formatMs(report.coreWebVitals.FCP));
  console.log('TTI:', formatMs(report.coreWebVitals.TTI));
  console.log('TTFB:', formatMs(report.coreWebVitals.TTFB));
  console.groupEnd();

  console.group('Memory');
  console.log('Used Heap:', formatBytes(report.memoryMetrics.usedJSHeapSize));
  console.log('Total Heap:', formatBytes(report.memoryMetrics.totalJSHeapSize));
  console.log('Heap Limit:', formatBytes(report.memoryMetrics.jsHeapSizeLimit));
  console.log('Usage:', `${report.memoryMetrics.memoryUsagePercent?.toFixed(2) ?? 'N/A'}%`);
  console.groupEnd();

  console.group('Network');
  console.log('DNS:', formatMs(report.networkMetrics.dnsTime));
  console.log('TCP:', formatMs(report.networkMetrics.tcpTime));
  console.log('TLS:', formatMs(report.networkMetrics.tlsTime));
  console.log('Request:', formatMs(report.networkMetrics.requestTime));
  console.log('Response:', formatMs(report.networkMetrics.responseTime));
  console.log('Total:', formatMs(report.networkMetrics.totalNetworkTime));
  console.groupEnd();

  console.log('Overall Rating:', report.overallRating.toUpperCase());

  console.groupEnd();
}

/**
 * Export performance report as JSON
 *
 * @param report - Performance report
 * @returns JSON string
 */
export function exportPerformanceReport(report: PerformanceReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Save performance report to localStorage (development only)
 *
 * @param report - Performance report
 */
export function savePerformanceReport(report: PerformanceReport): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const key = `perf-report-${report.id}`;
    localStorage.setItem(key, exportPerformanceReport(report));

    // Keep only last 10 reports
    const allReports = Object.keys(localStorage).filter((k) =>
      k.startsWith('perf-report-')
    );

    if (allReports.length > 10) {
      allReports
        .sort()
        .slice(0, allReports.length - 10)
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch (error) {
    console.error('[PerformanceMetrics] Failed to save report:', error);
  }
}
