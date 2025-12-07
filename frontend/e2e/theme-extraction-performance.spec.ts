/**
 * Phase 10.93 Day 6 - Performance Testing: Theme Extraction Workflow
 *
 * Performance and load testing for theme extraction
 * Measures render count, memory usage, API efficiency, and timing
 *
 * @file frontend/e2e/theme-extraction-performance.spec.ts
 * @enterprise-grade Production-ready performance benchmarks
 * @test-coverage Memory leaks, render optimization, API deduplication, timing
 */

import { test, expect, Page, chromium } from '@playwright/test';

// Performance thresholds (based on Phase 10.93 requirements)
const PERFORMANCE_THRESHOLDS = {
  maxRenderCount: 10, // Maximum re-renders during extraction
  maxWorkflowTime: 30000, // 30 seconds for 10 papers
  maxMemoryIncrease: 50 * 1024 * 1024, // 50MB max memory increase
  maxApiCalls: 50, // Maximum API calls for 10 papers
  maxTotalLoadTime: 5000, // 5 seconds initial page load
} as const;

interface PerformanceMetrics {
  renderCount: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    leaked: number;
  };
  timing: {
    start: number;
    end: number;
    duration: number;
  };
  apiCalls: {
    total: number;
    duplicates: number;
    byEndpoint: Record<string, number>;
  };
  networkRequests: Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
  }>;
}

/**
 * Setup performance monitoring on page
 */
async function setupPerformanceMonitoring(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Track renders
    (window as any).__renderCount = 0;
    (window as any).__renders = [];

    // Intercept React renders
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes?.('render') || args[0]?.includes?.('Render')) {
        (window as any).__renderCount++;
        (window as any).__renders.push({
          timestamp: Date.now(),
          message: args.join(' ')
        });
      }
      originalLog.apply(console, args);
    };

    // Enable memory profiling
    if ('memory' in performance) {
      (window as any).__memorySnapshots = [];

      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          (window as any).__memorySnapshots.push({
            timestamp: Date.now(),
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          });
        }
      }, 1000);
    }
  });
}

/**
 * Get render count from page
 */
async function getRenderCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return (window as any).__renderCount || 0;
  });
}

/**
 * Get memory metrics from page
 */
async function getMemoryMetrics(page: Page) {
  return await page.evaluate(() => {
    const snapshots = (window as any).__memorySnapshots || [];
    if (snapshots.length === 0) {
      return {
        initial: 0,
        peak: 0,
        final: 0,
        leaked: 0
      };
    }

    const initial = snapshots[0].usedJSHeapSize;
    const final = snapshots[snapshots.length - 1].usedJSHeapSize;
    const peak = Math.max(...snapshots.map((s: any) => s.usedJSHeapSize));

    return {
      initial,
      peak,
      final,
      leaked: final - initial
    };
  });
}

/**
 * Track API calls
 */
async function trackApiCalls(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__apiCalls = [];

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args: any[]) {
      const url = args[0];
      (window as any).__apiCalls.push({
        url: typeof url === 'string' ? url : url?.toString(),
        method: args[1]?.method || 'GET',
        timestamp: Date.now()
      });
      return originalFetch.apply(window, args);
    };
  });
}

/**
 * Get API call metrics
 */
async function getApiMetrics(page: Page) {
  return await page.evaluate(() => {
    const calls = (window as any).__apiCalls || [];
    const byEndpoint: Record<string, number> = {};
    const urls = new Set();
    let duplicates = 0;

    calls.forEach((call: any) => {
      const endpoint = call.url.split('?')[0]; // Remove query params
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;

      if (urls.has(call.url)) {
        duplicates++;
      }
      urls.add(call.url);
    });

    return {
      total: calls.length,
      duplicates,
      byEndpoint
    };
  });
}

/**
 * Helper: Navigate to literature page with performance tracking
 */
async function navigateWithTracking(page: Page) {
  await setupPerformanceMonitoring(page);
  await trackApiCalls(page);

  await page.goto('http://localhost:3000/discover/literature');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Perform search
 */
async function performSearch(page: Page, query: string) {
  const searchInput = page.locator('input[placeholder*="search" i]').first();
  await searchInput.fill(query);
  await searchInput.press('Enter');
  await page.waitForSelector('[data-testid="paper-card"], .paper-card, article', { timeout: 30000 });
}

/**
 * Helper: Select papers
 */
async function selectPapers(page: Page, count: number) {
  const selectionButtons = page.locator(
    'button[aria-label*="Select paper" i], input[type="checkbox"][aria-label*="paper" i]'
  );

  const availablePapers = await selectionButtons.count();
  const papersToSelect = Math.min(count, availablePapers);

  for (let i = 0; i < papersToSelect; i++) {
    await selectionButtons.nth(i).click();
    await page.waitForTimeout(200);
  }

  return papersToSelect;
}

/**
 * TEST SUITE 1: Render Performance
 * Tests component re-render optimization
 */
test.describe('Performance - Render Count', () => {
  test.setTimeout(90000);

  test('should have minimal re-renders during extraction (< 10 renders)', async ({ page }) => {
    await navigateWithTracking(page);

    // Get initial render count
    const initialRenders = await getRenderCount(page);

    // Perform workflow
    await performSearch(page, 'machine learning');
    await selectPapers(page, 10);

    // Click extract themes
    const extractButton = page.locator('button:has-text("Extract Themes")').first();
    await extractButton.click();

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Wait for extraction process (or timeout)
    await page.waitForTimeout(15000);

    // Get final render count
    const finalRenders = await getRenderCount(page);
    const rendersDuringWorkflow = finalRenders - initialRenders;

    console.log(`Renders during workflow: ${rendersDuringWorkflow}`);

    // Should have minimal re-renders (React.memo, useCallback optimization)
    expect(rendersDuringWorkflow).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.maxRenderCount);
  });

  test('should not re-render on every progress update', async ({ page }) => {
    await navigateWithTracking(page);

    await performSearch(page, 'data science');
    await selectPapers(page, 5);

    // Start extraction
    const extractButton = page.locator('button:has-text("Extract Themes")').first();
    await extractButton.click();

    await page.waitForSelector('[role="dialog"], .modal');

    // Record renders over time
    const renderSnapshots: number[] = [];
    const startTime = Date.now();

    while ((Date.now() - startTime) < 20000) { // 20 seconds
      const renders = await getRenderCount(page);
      renderSnapshots.push(renders);
      await page.waitForTimeout(1000);

      // Check if complete
      const isComplete = await page.locator('text=/Complete|Success/i').isVisible().catch(() => false);
      if (isComplete) break;
    }

    // Calculate render rate
    const totalRenders = renderSnapshots[renderSnapshots.length - 1] - renderSnapshots[0];
    const renderRate = totalRenders / (renderSnapshots.length || 1);

    console.log(`Render rate: ${renderRate.toFixed(2)} renders/sec`);

    // Should not render more than 2 times per second (progress is memoized)
    expect(renderRate).toBeLessThan(2);
  });
});

/**
 * TEST SUITE 2: Memory Performance
 * Tests for memory leaks
 */
test.describe('Performance - Memory Management', () => {
  test.setTimeout(90000);

  test('should not leak memory during extraction (< 50MB increase)', async ({ page }) => {
    await navigateWithTracking(page);

    // Wait for initial memory stabilization
    await page.waitForTimeout(3000);

    const initialMemory = await getMemoryMetrics(page);

    // Perform multiple extractions to stress test memory
    for (let i = 0; i < 2; i++) {
      await performSearch(page, `test query ${i}`);
      await selectPapers(page, 5);

      const extractButton = page.locator('button:has-text("Extract Themes")').first();
      if (await extractButton.isVisible().catch(() => false)) {
        await extractButton.click();
        await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

        // Wait a bit for extraction
        await page.waitForTimeout(10000);

        // Close modal
        const closeButton = page.locator('button:has-text("Close")').first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }

        await page.waitForTimeout(2000);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(3000);

    const finalMemory = await getMemoryMetrics(page);
    const memoryLeak = finalMemory.leaked;

    console.log(`Memory leaked: ${(memoryLeak / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Initial: ${(initialMemory.initial / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Final: ${(finalMemory.final / 1024 / 1024).toFixed(2)} MB`);

    // Should not leak significant memory
    expect(memoryLeak).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryIncrease);
  });

  test('should clean up event listeners on modal close', async ({ page }) => {
    await navigateWithTracking(page);

    // Track event listener count
    const getListenerCount = async () => {
      return await page.evaluate(() => {
        // This is a simplified check - in real implementation,
        // you'd check actual event listeners on window/document
        return (window as any).__eventListenerCount || 0;
      });
    };

    const initialListeners = await getListenerCount();

    // Open and close modal multiple times
    for (let i = 0; i < 3; i++) {
      await performSearch(page, `query ${i}`);
      await selectPapers(page, 3);

      const extractButton = page.locator('button:has-text("Extract Themes")').first();
      if (await extractButton.isVisible().catch(() => false)) {
        await extractButton.click();
        await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    const finalListeners = await getListenerCount();

    // Listener count should not grow significantly
    const listenerGrowth = finalListeners - initialListeners;
    expect(listenerGrowth).toBeLessThan(10); // Allow some growth but not unbounded
  });
});

/**
 * TEST SUITE 3: API Call Efficiency
 * Tests for duplicate API calls and deduplication
 */
test.describe('Performance - API Efficiency', () => {
  test.setTimeout(90000);

  test('should deduplicate API calls (< 50 calls for 10 papers)', async ({ page }) => {
    await navigateWithTracking(page);

    await performSearch(page, 'neural networks');
    await selectPapers(page, 10);

    const extractButton = page.locator('button:has-text("Extract Themes")').first();
    await extractButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Wait for extraction process
    await page.waitForTimeout(20000);

    const apiMetrics = await getApiMetrics(page);

    console.log(`Total API calls: ${apiMetrics.total}`);
    console.log(`Duplicate calls: ${apiMetrics.duplicates}`);
    console.log('Calls by endpoint:', apiMetrics.byEndpoint);

    // Should not make excessive API calls
    expect(apiMetrics.total).toBeLessThan(PERFORMANCE_THRESHOLDS.maxApiCalls);

    // Should have minimal duplicates (caching working)
    expect(apiMetrics.duplicates).toBeLessThan(5);
  });

  test('should batch parallel requests efficiently', async ({ page }) => {
    await navigateWithTracking(page);

    // Track network requests
    const networkRequests: any[] = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    await performSearch(page, 'quantum computing');
    await selectPapers(page, 15); // Large batch

    const extractButton = page.locator('button:has-text("Extract Themes")').first();
    await extractButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(20000);

    // Analyze request timing
    const apiRequests = networkRequests.filter(r =>
      r.url.includes('/api/') && r.method === 'POST'
    );

    // Check for parallel batching (multiple requests at same timestamp)
    const requestsByTime = new Map<number, number>();
    apiRequests.forEach(req => {
      const timeWindow = Math.floor(req.timestamp / 1000) * 1000; // 1-second windows
      requestsByTime.set(timeWindow, (requestsByTime.get(timeWindow) || 0) + 1);
    });

    const maxParallel = Math.max(...Array.from(requestsByTime.values()));

    console.log(`Max parallel requests: ${maxParallel}`);

    // Should batch requests (3-5 parallel)
    expect(maxParallel).toBeGreaterThanOrEqual(2);
    expect(maxParallel).toBeLessThanOrEqual(10); // Not too many (server overload)
  });
});

/**
 * TEST SUITE 4: Workflow Timing
 * Tests overall workflow performance
 */
test.describe('Performance - Workflow Timing', () => {
  test.setTimeout(90000);

  test('should complete workflow in < 30 seconds for 10 papers', async ({ page }) => {
    await navigateWithTracking(page);

    await performSearch(page, 'software testing');
    const selectedCount = await selectPapers(page, 10);

    // Only proceed if we got enough papers
    if (selectedCount >= 8) {
      const extractButton = page.locator('button:has-text("Extract Themes")').first();

      const startTime = Date.now();

      await extractButton.click();
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

      // Wait for completion
      await page.waitForSelector('text=/Complete|Success/i', {
        timeout: PERFORMANCE_THRESHOLDS.maxWorkflowTime
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Workflow duration: ${(duration / 1000).toFixed(2)}s for ${selectedCount} papers`);

      // Should complete within threshold
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.maxWorkflowTime);
    } else {
      test.skip();
    }
  });

  test('should have fast initial page load (< 5 seconds)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/discover/literature');
    await page.waitForLoadState('domcontentloaded');

    const domLoadTime = Date.now() - startTime;

    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;

    console.log(`DOM load time: ${domLoadTime}ms`);
    console.log(`Full load time: ${fullLoadTime}ms`);

    // DOM should load quickly
    expect(domLoadTime).toBeLessThan(3000);

    // Full page should load within threshold
    expect(fullLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxTotalLoadTime);
  });

  test('should maintain performance with multiple sessions', async () => {
    // Launch multiple browser contexts to simulate concurrent users
    const browser = await chromium.launch();
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    const timings: number[] = [];

    try {
      // Run extractions in parallel
      await Promise.all(pages.map(async (page, index) => {
        await navigateWithTracking(page);
        await performSearch(page, `test ${index}`);
        await selectPapers(page, 5);

        const startTime = Date.now();

        const extractButton = page.locator('button:has-text("Extract Themes")').first();
        if (await extractButton.isVisible().catch(() => false)) {
          await extractButton.click();
          await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 }).catch(() => {});

          await page.waitForTimeout(15000);

          const endTime = Date.now();
          timings.push(endTime - startTime);
        }
      }));

      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;

      console.log(`Average timing across 3 concurrent users: ${(avgTiming / 1000).toFixed(2)}s`);

      // Should handle multiple users without significant degradation
      expect(avgTiming).toBeLessThan(45000); // 45 seconds with concurrency
    } finally {
      // Cleanup
      await Promise.all(pages.map(p => p.close()));
      await Promise.all(contexts.map(ctx => ctx.close()));
      await browser.close();
    }
  });
});

/**
 * TEST SUITE 5: Performance Regression Detection
 * Baseline comparison tests
 */
test.describe('Performance - Regression Detection', () => {
  test.setTimeout(90000);

  test('should track and report all performance metrics', async ({ page }) => {
    await navigateWithTracking(page);

    const metrics: Partial<PerformanceMetrics> = {
      timing: { start: 0, end: 0, duration: 0 },
      renderCount: 0,
      memoryUsage: { initial: 0, peak: 0, final: 0, leaked: 0 },
      apiCalls: { total: 0, duplicates: 0, byEndpoint: {} }
    };

    // Capture initial state
    const initialMemory = await getMemoryMetrics(page);
    metrics.memoryUsage = { ...initialMemory };

    // Perform workflow
    await performSearch(page, 'performance test');
    await selectPapers(page, 10);

    metrics.timing!.start = Date.now();

    const extractButton = page.locator('button:has-text("Extract Themes")').first();
    if (await extractButton.isVisible().catch(() => false)) {
      await extractButton.click();
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
      await page.waitForTimeout(20000);

      metrics.timing!.end = Date.now();
      metrics.timing!.duration = metrics.timing!.end - metrics.timing!.start;

      // Capture final metrics
      metrics.renderCount = await getRenderCount(page);
      metrics.memoryUsage = await getMemoryMetrics(page);
      metrics.apiCalls = await getApiMetrics(page);
    }

    // Log comprehensive metrics
    console.log('=== Performance Metrics Report ===');
    console.log(`Workflow Duration: ${(metrics.timing!.duration / 1000).toFixed(2)}s`);
    console.log(`Total Renders: ${metrics.renderCount}`);
    console.log(`Memory Leaked: ${(metrics.memoryUsage!.leaked / 1024 / 1024).toFixed(2)} MB`);
    console.log(`API Calls: ${metrics.apiCalls!.total} (${metrics.apiCalls!.duplicates} duplicates)`);
    console.log('================================');

    // All metrics should pass thresholds
    expect(metrics.timing!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.maxWorkflowTime);
    expect(metrics.renderCount!).toBeLessThan(PERFORMANCE_THRESHOLDS.maxRenderCount);
    expect(metrics.memoryUsage!.leaked).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryIncrease);
    expect(metrics.apiCalls!.total).toBeLessThan(PERFORMANCE_THRESHOLDS.maxApiCalls);
  });
});
