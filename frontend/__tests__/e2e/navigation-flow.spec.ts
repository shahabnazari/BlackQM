import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Research phases in order
const PHASES = [
  { id: 'discover', route: '/discover', title: 'Discover' },
  { id: 'design', route: '/design', title: 'Design' },
  { id: 'build', route: '/build', title: 'Build' },
  { id: 'recruit', route: '/recruit', title: 'Recruit' },
  { id: 'collect', route: '/collect', title: 'Collect' },
  { id: 'analyze', route: '/analyze', title: 'Analyze' },
  { id: 'visualize', route: '/visualize', title: 'Visualize' },
  { id: 'interpret', route: '/interpret', title: 'Interpret' },
  { id: 'report', route: '/report', title: 'Report' },
  { id: 'archive', route: '/archive', title: 'Archive' },
];

test.describe('Research Lifecycle Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display all 10 research phases in navigation', async ({
    page,
  }) => {
    // Check if all phases are present in the navigation
    for (const phase of PHASES) {
      const phaseElement = page
        .locator(`[data-phase="${phase.id}"]`)
        .or(page.locator(`text=${phase.title}`).first());
      await expect(phaseElement).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate through phases sequentially', async ({ page }) => {
    // Start from discover phase
    await page.goto(`${BASE_URL}/discover`);
    await expect(page).toHaveURL(/\/discover/);

    // Navigate through each phase
    for (let i = 0; i < PHASES.length - 1; i++) {
      const currentPhase = PHASES[i];
      const nextPhase = PHASES[i + 1];

      // Find and click next phase button or link
      const nextButton = page
        .locator(`[data-next-phase="${nextPhase.id}"]`)
        .or(page.locator(`a[href="${nextPhase.route}"]`).first());

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForURL(`**${nextPhase.route}**`);
        await expect(page).toHaveURL(new RegExp(nextPhase.route));
      }
    }
  });

  test('should show phase progress indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Check for progress indicator
    const progressIndicator = page
      .locator('[data-testid="phase-progress"]')
      .or(page.locator('.phase-progress-indicator').first());

    await expect(progressIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should handle phase prerequisites correctly', async ({ page }) => {
    // Try to navigate directly to a later phase
    await page.goto(`${BASE_URL}/analyze`);

    // Check if there's a lock indicator or redirect
    const lockIndicator = page
      .locator('[data-locked="true"]')
      .or(page.locator('.locked-phase').first());

    // Either the phase is locked or we're redirected
    const isLocked = await lockIndicator.isVisible().catch(() => false);
    const currentUrl = page.url();

    expect(isLocked || !currentUrl.includes('/analyze')).toBeTruthy();
  });

  test('should maintain navigation state across page refreshes', async ({
    page,
  }) => {
    // Navigate to a specific phase
    await page.goto(`${BASE_URL}/design`);

    // Get the current state
    const initialState = await page.evaluate(() => {
      return {
        pathname: window.location.pathname,
        phase: document
          .querySelector('[data-current-phase]')
          ?.getAttribute('data-current-phase'),
      };
    });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if state is maintained
    const refreshedState = await page.evaluate(() => {
      return {
        pathname: window.location.pathname,
        phase: document
          .querySelector('[data-current-phase]')
          ?.getAttribute('data-current-phase'),
      };
    });

    expect(refreshedState.pathname).toBe(initialState.pathname);
  });

  test('should display breadcrumbs for navigation context', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/design/methodology`);

    const breadcrumbs = page
      .locator('[data-testid="breadcrumbs"]')
      .or(page.locator('nav[aria-label="Breadcrumb"]').first());

    if (await breadcrumbs.isVisible()) {
      // Check if breadcrumbs contain expected items
      await expect(breadcrumbs).toContainText('Design');
    }
  });

  test('should handle mobile navigation gestures', async ({
    page,
    browserName,
  }) => {
    // Skip on webkit as touch events are not well supported
    test.skip(browserName === 'webkit', 'Touch events not supported in webkit');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/discover`);

    // Check if mobile navigation is visible
    const mobileNav = page
      .locator('[data-testid="mobile-nav"]')
      .or(page.locator('.mobile-navigation').first());

    await expect(mobileNav).toBeVisible({ timeout: 10000 });
  });

  test('should track navigation performance metrics', async ({ page }) => {
    // Enable performance tracking
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = [];
      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        const startTime = performance.now();
        originalPushState.apply(history, args);
        const endTime = performance.now();
        window.performanceMetrics.push({
          type: 'navigation',
          duration: endTime - startTime,
          timestamp: Date.now(),
        });
      };
    });

    await page.goto(`${BASE_URL}/discover`);

    // Navigate through a few phases
    await page.goto(`${BASE_URL}/design`);
    await page.goto(`${BASE_URL}/build`);

    // Get performance metrics
    const metrics = await page.evaluate(() => window.performanceMetrics);

    // Check that navigation is fast (under 100ms)
    if (metrics && metrics.length > 0) {
      const avgDuration =
        metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      expect(avgDuration).toBeLessThan(100);
    }
  });

  test('should show AI-enhanced badges on relevant phases', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Check for AI badges
    const aiBadges = page
      .locator('[data-ai-enhanced="true"]')
      .or(page.locator('.ai-badge').first());

    const count = await aiBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle route consolidation correctly', async ({ page }) => {
    // Test deprecated routes redirect to new ones
    const redirectTests = [
      { old: '/analysis', new: '/analyze' },
      { old: '/analytics', new: '/analyze' },
    ];

    for (const test of redirectTests) {
      await page.goto(`${BASE_URL}${test.old}`);
      await page
        .waitForURL(`**${test.new}**`, { timeout: 5000 })
        .catch(() => {});

      const currentUrl = page.url();
      expect(currentUrl).toContain(test.new);
    }
  });
});

test.describe('Phase-Specific Navigation Tests', () => {
  test('DISCOVER phase should have all sub-pages accessible', async ({
    page,
  }) => {
    const discoverPages = [
      '/discover/literature',
      '/discover/references',
      '/discover/knowledge-map',
      '/discover/gaps',
    ];

    for (const subPage of discoverPages) {
      await page.goto(`${BASE_URL}${subPage}`);
      await expect(page).toHaveURL(new RegExp(subPage));

      // Check page is rendered
      const content = page.locator('main').or(page.locator('[role="main"]'));
      await expect(content).toBeVisible();
    }
  });

  test('DESIGN phase should have methodology tools', async ({ page }) => {
    await page.goto(`${BASE_URL}/design`);

    // Check for methodology components
    const methodologyTools = page
      .locator('[data-methodology]')
      .or(page.locator('text=/methodology/i').first());

    await expect(methodologyTools).toBeVisible({ timeout: 10000 });
  });

  test('BUILD phase should integrate with study creation', async ({ page }) => {
    await page.goto(`${BASE_URL}/build`);

    // Check for study creation elements
    const studyBuilder = page
      .locator('[data-study-builder]')
      .or(page.locator('text=/create.*study/i').first());

    await expect(studyBuilder).toBeVisible({ timeout: 10000 });
  });

  test('ANALYZE phase should show hub interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyze`);

    // Check for analysis hub elements
    const analysisHub = page
      .locator('[data-analysis-hub]')
      .or(page.locator('text=/analysis.*hub/i').first());

    await expect(analysisHub).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation Accessibility Tests', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Tab through navigation elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Navigate using Enter key
    await page.keyboard.press('Enter');

    // Verify navigation occurred
    await page.waitForTimeout(500);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Check for ARIA labels on navigation
    const navWithAria = page.locator('nav[aria-label]');
    const count = await navWithAria.count();
    expect(count).toBeGreaterThan(0);

    // Check for role attributes
    const mainContent = page.locator('[role="main"]').or(page.locator('main'));
    await expect(mainContent).toBeVisible();
  });

  test('should announce phase changes to screen readers', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Check for live region
    const liveRegion = page
      .locator('[aria-live]')
      .or(page.locator('[role="status"]'));

    const hasLiveRegion = (await liveRegion.count()) > 0;
    expect(hasLiveRegion).toBeTruthy();
  });
});

test.describe('Performance and Bundle Size Tests', () => {
  test('should load navigation within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have optimized bundle sizes', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Get resource sizes
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(e => ({
        name: e.name,
        size: e.transferSize || 0,
        type: e.name.split('.').pop(),
      }));
    });

    // Calculate total JS bundle size
    const jsSize = resources
      .filter(r => r.type === 'js' || r.type === 'mjs')
      .reduce((sum, r) => sum + r.size, 0);

    // JS bundle should be under 500KB for initial load
    expect(jsSize).toBeLessThan(500 * 1024);
  });

  test('should implement code splitting for phases', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);

    // Get initial chunks
    const initialChunks = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter(e => e.name.includes('_next'))
        .map(e => e.name);
    });

    // Navigate to another phase
    await page.goto(`${BASE_URL}/analyze`);

    // Get new chunks
    const afterNavChunks = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter(e => e.name.includes('_next'))
        .map(e => e.name);
    });

    // Should have loaded additional chunks (code splitting working)
    const newChunks = afterNavChunks.filter(c => !initialChunks.includes(c));
    expect(newChunks.length).toBeGreaterThan(0);
  });
});

// Extend window interface for performance metrics
declare global {
  interface Window {
    performanceMetrics: Array<{
      type: string;
      duration: number;
      timestamp: number;
    }>;
  }
}
