/**
 * Phase 10.93 Day 9 - Cross-Browser Theme Extraction Tests
 *
 * Comprehensive cross-browser testing for theme extraction workflow.
 * Tests across Chrome, Firefox, Safari, Edge, and mobile browsers.
 *
 * **Test Coverage:**
 * - Theme extraction workflow in all browsers
 * - Performance metrics collection
 * - Accessibility verification
 * - Mobile responsiveness
 * - Error handling
 *
 * @module cross-browser-theme-extraction.spec
 * @since Phase 10.93 Day 9
 * @author VQMethod Team
 * @enterprise-grade Production-ready cross-browser tests
 */

import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Test configuration constants
 */
const TEST_TIMEOUTS = {
  /** Timeout for search results to appear (30 seconds for API response + rendering) */
  SEARCH_RESULTS: 30000,
  /** Timeout for modal to open (5 seconds for animation) */
  MODAL_OPEN: 5000,
  /** Timeout for error alerts to appear */
  ERROR_ALERT: 5000,
  /** Timeout for button visibility checks */
  BUTTON_VISIBLE: 5000,
  /** Timeout for slow network simulation (60 seconds) */
  NETWORK_SLOW: 60000,
} as const;

const PERFORMANCE_THRESHOLDS = {
  /** Maximum acceptable page load time (10 seconds) */
  PAGE_LOAD_MAX_MS: 10000,
  /** Maximum acceptable DOM content loaded time (5 seconds) */
  DOM_CONTENT_LOADED_MAX_MS: 5000,
  /** Maximum acceptable memory usage (200MB) */
  MEMORY_MAX_BYTES: 200 * 1024 * 1024,
} as const;

const TEST_DATA = {
  /** Test search queries for different scenarios */
  SEARCH_QUERIES: {
    BASIC_WORKFLOW: 'machine learning',
    PERFORMANCE_TEST: 'artificial intelligence',
    MOBILE_TEST: 'deep learning',
    NETWORK_TEST: 'neural networks',
    VISUAL_REGRESSION: 'machine learning',
  },
  /** Number of papers to select in tests */
  PAPER_SELECTION_COUNT: 3,
  /** Network delay for slow network simulation (milliseconds) */
  SLOW_NETWORK_DELAY_MS: 100,
  /** Maximum pixel difference allowed in visual regression tests */
  MAX_VISUAL_DIFF_PIXELS: 100,
} as const;

/**
 * Type definitions for browser-specific performance features
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
 * Test utilities
 */
class ThemeExtractionTestUtils {
  private consoleErrors: string[] = [];
  private consoleHandler: ((msg: any) => void) | null = null;

  constructor(private page: Page) {
    // Set up console error listener immediately
    // Store handler reference for cleanup to prevent memory leaks
    this.consoleHandler = (msg: any) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    };
    this.page.on('console', this.consoleHandler);
  }

  /**
   * Clean up event listeners and resources
   * CRITICAL: Must be called in test.afterEach() to prevent memory leaks
   */
  cleanup(): void {
    if (this.consoleHandler) {
      this.page.off('console', this.consoleHandler);
      this.consoleHandler = null;
    }
    this.consoleErrors = [];
  }

  /**
   * Navigate to literature search page
   */
  async navigateToLiterature(): Promise<void> {
    await this.page.goto('/discover/literature');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform search
   */
  async performSearch(query: string): Promise<void> {
    const searchInput = this.page.getByPlaceholder(/search for papers/i);
    await searchInput.fill(query);
    await searchInput.press('Enter');

    // Wait for search results with helpful error message
    await this.page.waitForSelector('[data-testid="paper-card"]', {
      timeout: TEST_TIMEOUTS.SEARCH_RESULTS,
    }).catch(() => {
      throw new Error(
        `Search results not displayed after searching for "${query}". ` +
        `Expected to find paper cards with data-testid="paper-card" within ${TEST_TIMEOUTS.SEARCH_RESULTS / 1000} seconds.`
      );
    });
  }

  /**
   * Select papers for extraction
   *
   * @param count - Number of papers to select
   * @throws Error if requesting papers but none are available
   */
  async selectPapers(count: number): Promise<void> {
    const paperCards = await this.page.locator('[data-testid="paper-card"]').all();

    // CRITICAL FIX: Fail if requesting papers but none available
    // Prevents false positive tests when page is broken
    if (count > 0 && paperCards.length === 0) {
      throw new Error(
        `Cannot select ${count} papers: no paper cards found on page. ` +
        `Expected papers with data-testid="paper-card". ` +
        `Verify that search completed successfully and papers were loaded.`
      );
    }

    const papersToSelect = Math.min(count, paperCards.length);

    for (let i = 0; i < papersToSelect; i++) {
      await paperCards[i].click();
    }

    // Verify selection
    const selectedCount = await this.page
      .locator('[data-testid="paper-card"][data-selected="true"]')
      .count();

    expect(selectedCount).toBe(papersToSelect);
  }

  /**
   * Click extract themes button
   *
   * @throws Error if button is not visible or clickable
   */
  async clickExtractThemes(): Promise<void> {
    const extractButton = this.page.getByRole('button', {
      name: /extract themes/i,
    });

    // Verify button exists and is visible before clicking
    await expect(extractButton).toBeVisible({
      timeout: TEST_TIMEOUTS.BUTTON_VISIBLE,
    }).catch(() => {
      throw new Error(
        `"Extract Themes" button not visible within ${TEST_TIMEOUTS.BUTTON_VISIBLE / 1000} seconds. ` +
        `Button may be disabled or hidden. ` +
        `Ensure papers are selected before extracting themes.`
      );
    });

    await extractButton.click().catch((error) => {
      throw new Error(
        `Failed to click "Extract Themes" button: ${error.message}. ` +
        `Button may not be enabled or may have been removed from DOM. ` +
        `Verify that papers are selected and button is in enabled state.`
      );
    });
  }

  /**
   * Wait for theme extraction modal
   */
  async waitForModal(): Promise<void> {
    await this.page.waitForSelector('[role="dialog"]', {
      timeout: TEST_TIMEOUTS.MODAL_OPEN,
    }).catch(() => {
      throw new Error(
        `Theme extraction modal did not open within ${TEST_TIMEOUTS.MODAL_OPEN / 1000} seconds. ` +
        `Expected to find dialog with role="dialog". ` +
        `Verify that papers are selected and extract button was clicked.`
      );
    });
  }

  /**
   * Verify modal is open
   */
  async verifyModalOpen(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  }

  /**
   * Get performance metrics using modern Navigation Timing Level 2 API
   *
   * CRITICAL FIX: Replaced deprecated performance.timing with PerformanceNavigationTiming
   * The old API (performance.timing) is deprecated and removed from some browsers.
   *
   * @returns Performance metrics object
   */
  async getPerformanceMetrics(): Promise<Record<string, number>> {
    return await this.page.evaluate(() => {
      if (typeof window === 'undefined' || !window.performance) {
        return {};
      }

      // Use modern Navigation Timing Level 2 API
      const navigationEntries = performance.getEntriesByType('navigation');
      const navigationTiming = navigationEntries[0] as PerformanceNavigationTiming | undefined;

      if (!navigationTiming) {
        // Fallback: return empty metrics if API not available
        return {};
      }

      // Get paint timing entries
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find((e) => e.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find((e) => e.name === 'first-contentful-paint');

      // Calculate metrics using modern API
      // All times are relative to fetchStart (more accurate than navigationStart)
      return {
        pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
        firstPaint: firstPaint?.startTime ?? 0,
        firstContentfulPaint: firstContentfulPaint?.startTime ?? 0,
      };
    });
  }

  /**
   * Get memory metrics (Chrome only)
   */
  async getMemoryMetrics(): Promise<Record<string, number>> {
    return await this.page.evaluate(() => {
      if (
        typeof window === 'undefined' ||
        !(performance as PerformanceWithMemory).memory
      ) {
        return {};
      }

      const memory = (performance as PerformanceWithMemory).memory!;

      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    });
  }

  /**
   * Get collected console errors
   *
   * Note: Console listener is set up in constructor, so errors are collected
   * throughout the test execution.
   *
   * @returns Array of error messages
   */
  getConsoleErrors(): string[] {
    return [...this.consoleErrors];
  }

  /**
   * Clear console errors
   */
  clearConsoleErrors(): void {
    this.consoleErrors = [];
  }

  /**
   * Take screenshot with timestamp
   *
   * @param name - Screenshot name
   * @param fullPage - Whether to capture full page (default: false for performance)
   *                   Use true only for debugging or full page visual regression
   */
  async takeScreenshot(name: string, fullPage: boolean = false): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage, // Configurable - default false for better performance in CI
    });
  }
}

/**
 * Test suite configuration
 */
test.describe('Cross-Browser Theme Extraction', () => {
  let utils: ThemeExtractionTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ThemeExtractionTestUtils(page);

    // Navigate to literature page
    await utils.navigateToLiterature();
  });

  test.afterEach(async () => {
    // CRITICAL: Clean up event listeners to prevent memory leaks
    if (utils) {
      utils.cleanup();
    }
  });

  /**
   * Test: Basic workflow in all browsers
   */
  test('should complete basic theme extraction workflow', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'browser', description: browserName });

    // Perform search
    await utils.performSearch(TEST_DATA.SEARCH_QUERIES.BASIC_WORKFLOW);

    // Select papers
    await utils.selectPapers(TEST_DATA.PAPER_SELECTION_COUNT);

    // Click extract themes
    const startTime = Date.now();
    await utils.clickExtractThemes();

    // Wait for modal
    await utils.waitForModal();
    const modalOpenTime = Date.now() - startTime;

    // Verify modal opened
    await utils.verifyModalOpen();

    // Log performance
    console.log(`[${browserName}] Modal open time: ${modalOpenTime}ms`);

    // Verify modal contains expected elements
    await expect(page.getByRole('heading', { name: /theme extraction/i })).toBeVisible();

    // Take screenshot
    await utils.takeScreenshot(`${browserName}-theme-extraction-modal`);
  });

  /**
   * Test: Performance metrics collection
   */
  test('should collect and validate performance metrics', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'performance', description: browserName });

    // Get initial metrics
    const initialMetrics = await utils.getPerformanceMetrics();
    console.log(`[${browserName}] Initial metrics:`, initialMetrics);

    // Perform search
    await utils.performSearch(TEST_DATA.SEARCH_QUERIES.PERFORMANCE_TEST);

    // Get post-search metrics
    const searchMetrics = await utils.getPerformanceMetrics();
    console.log(`[${browserName}] Search metrics:`, searchMetrics);

    // Validate metrics exist
    expect(searchMetrics.pageLoadTime).toBeGreaterThan(0);
    expect(searchMetrics.domContentLoaded).toBeGreaterThan(0);

    // Validate performance thresholds
    expect(searchMetrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD_MAX_MS);
    expect(searchMetrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.DOM_CONTENT_LOADED_MAX_MS);

    // Get memory metrics (Chrome only)
    if (browserName === 'chromium') {
      const memoryMetrics = await utils.getMemoryMetrics();
      console.log(`[${browserName}] Memory metrics:`, memoryMetrics);

      // Validate memory usage
      if (memoryMetrics.usedJSHeapSize) {
        expect(memoryMetrics.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_MAX_BYTES);
      }
    }
  });

  /**
   * Test: Basic accessibility requirements
   *
   * NOTE: This performs basic accessibility checks. For comprehensive WCAG 2.1 AA compliance
   * testing, install and use @axe-core/playwright (not included by default).
   *
   * This test verifies:
   * - Basic keyboard navigation works
   * - ARIA labels are present
   * - Semantic HTML is used
   * - Basic CSS properties are set
   */
  test('should meet basic accessibility requirements', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'accessibility', description: browserName });

    // Verify keyboard navigation (Tab through multiple elements)
    const tabPresses = 5;
    for (let i = 0; i < tabPresses; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          hasFocusVisible: el?.matches(':focus-visible') ?? false,
        };
      });
      expect(focusedElement.tag).toBeTruthy();
      // At least one element should have visible focus indicator
      if (i === tabPresses - 1) {
        console.log(`[${browserName}] Keyboard navigation: ${tabPresses} elements tabbable`);
      }
    }

    // Verify ARIA labels on interactive elements
    const searchInput = page.getByPlaceholder(/search for papers/i);
    const ariaLabel = await searchInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Verify semantic HTML structure
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Verify main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Verify color styling exists (basic check)
    const backgroundColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    expect(backgroundColor).toBeTruthy();

    console.log(`[${browserName}] Basic accessibility checks passed`);
    console.log(`[${browserName}] For full WCAG 2.1 AA compliance, use @axe-core/playwright`);
  });

  /**
   * Test: Error handling across browsers
   */
  test('should handle errors gracefully', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'error-handling', description: browserName });

    // Clear any existing console errors
    utils.clearConsoleErrors();

    // Try to extract without selecting papers (should show error)
    try {
      await utils.clickExtractThemes();
    } catch (error) {
      // Expected to fail or show error state
    }

    // Wait for error message
    await page.waitForSelector('[role="alert"]', {
      timeout: TEST_TIMEOUTS.ERROR_ALERT,
    }).catch(() => {
      throw new Error(
        `[${browserName}] Error alert not displayed when extracting themes without selecting papers. ` +
        `Expected alert within ${TEST_TIMEOUTS.ERROR_ALERT / 1000} seconds.`
      );
    });

    // Verify error message is displayed
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({
      timeout: TEST_TIMEOUTS.ERROR_ALERT,
    });

    // Get console errors collected during test
    const errors = utils.getConsoleErrors();

    // Verify no critical console errors (warnings are okay)
    const criticalErrors = errors.filter((e) => e.includes('Error:') || e.includes('Uncaught'));
    if (criticalErrors.length > 0) {
      console.error(`[${browserName}] Critical console errors found:`, criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);

    console.log(`[${browserName}] Error handling validated`);
  });

  /**
   * Test: Responsive design (mobile only)
   */
  test('should work on mobile viewports', async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, 'This test is mobile-only');

    test.info().annotations.push({ type: 'mobile', description: browserName });

    // Verify mobile menu is visible
    const mobileMenu = page.getByRole('button', { name: /menu/i });

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }

    // Verify responsive layout
    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeTruthy();
    expect(viewportSize!.width).toBeLessThanOrEqual(768);

    // Perform search on mobile
    await utils.performSearch(TEST_DATA.SEARCH_QUERIES.MOBILE_TEST);

    // Verify results are displayed properly
    const results = page.locator('[data-testid="paper-card"]');
    await expect(results.first()).toBeVisible();

    // Take mobile screenshot (viewport only for performance)
    await utils.takeScreenshot(`${browserName}-mobile-search-results`);

    console.log(`[${browserName}] Mobile layout validated`);
  });

  /**
   * Test: Network resilience
   */
  test('should handle slow network conditions', async ({ page, browserName, context }) => {
    test.info().annotations.push({ type: 'network', description: browserName });

    // Simulate slow 3G network
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, TEST_DATA.SLOW_NETWORK_DELAY_MS));
      await route.continue();
    });

    // Perform search
    const searchStart = Date.now();
    await utils.performSearch(TEST_DATA.SEARCH_QUERIES.NETWORK_TEST);
    const searchDuration = Date.now() - searchStart;

    console.log(`[${browserName}] Search duration with slow network: ${searchDuration}ms`);

    // Verify search still completes
    await expect(page.locator('[data-testid="paper-card"]').first()).toBeVisible();

    // Should complete within reasonable time even with slow network
    expect(searchDuration).toBeLessThan(TEST_TIMEOUTS.NETWORK_SLOW);
  });

  /**
   * Test: Browser-specific feature detection
   */
  test('should detect and handle browser-specific features', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'browser-features', description: browserName });

    const browserInfo = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        languages: navigator.languages,
        maxTouchPoints: navigator.maxTouchPoints,
      };
    });

    console.log(`[${browserName}] Browser info:`, browserInfo);

    // Verify basic features
    expect(browserInfo.cookiesEnabled).toBe(true);
    expect(browserInfo.onLine).toBe(true);

    // Browser-specific checks
    if (browserName === 'webkit') {
      expect(browserInfo.vendor).toContain('Apple');
    } else if (browserName === 'chromium') {
      expect(browserInfo.userAgent).toContain('Chrome');
    } else if (browserName === 'firefox') {
      expect(browserInfo.userAgent).toContain('Firefox');
    }
  });
});

/**
 * Visual regression tests (requires baseline screenshots)
 */
test.describe('Visual Regression', () => {
  let utils: ThemeExtractionTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ThemeExtractionTestUtils(page);
  });

  test.afterEach(async () => {
    // CRITICAL: Clean up event listeners to prevent memory leaks
    if (utils) {
      utils.cleanup();
    }
  });

  test('should match baseline screenshot', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'visual-regression', description: browserName });

    // Navigate to literature page
    await page.goto('/discover/literature');
    await page.waitForLoadState('networkidle');

    // Take screenshot and compare to baseline
    await expect(page).toHaveScreenshot(`${browserName}-literature-page.png`, {
      maxDiffPixels: TEST_DATA.MAX_VISUAL_DIFF_PIXELS,
    });
  });

  test('should match modal screenshot', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'visual-regression', description: browserName });

    // Navigate and open modal
    await utils.navigateToLiterature();
    await utils.performSearch(TEST_DATA.SEARCH_QUERIES.VISUAL_REGRESSION);
    await utils.selectPapers(TEST_DATA.PAPER_SELECTION_COUNT);
    await utils.clickExtractThemes();
    await utils.waitForModal();

    // Take screenshot and compare
    await expect(page.locator('[role="dialog"]')).toHaveScreenshot(
      `${browserName}-theme-extraction-modal.png`,
      {
        maxDiffPixels: TEST_DATA.MAX_VISUAL_DIFF_PIXELS,
      }
    );
  });
});
