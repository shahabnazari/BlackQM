import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { performance } from 'perf_hooks';
import path from 'path';
import fs from 'fs';

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes per test
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test data paths
const TEST_DATA_DIR = path.join(__dirname, '../fixtures');
const SAMPLE_QSORT_FILE = path.join(TEST_DATA_DIR, 'sample-qsort.csv');
const SAMPLE_DAT_FILE = path.join(TEST_DATA_DIR, 'pqmethod-data.dat');

describe('End-to-End Test Suite', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    // Setup browser context with permissions
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['clipboard-read', 'clipboard-write'],
      recordVideo: {
        dir: './e2e/videos/',
        size: { width: 1920, height: 1080 },
      },
    });
    page = await context.newPage();

    // Set up request interceptors for performance monitoring
    page.on('request', request => {
      console.log(`Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`Error response: ${response.status()} ${response.url()}`);
      }
    });
  });

  afterEach(async () => {
    await page.screenshot({
      path: `./e2e/screenshots/${Date.now()}-final.png`,
      fullPage: true,
    });
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('1. Complete Analysis Workflow (Upload → Analyze → Export)', () => {
    test('should complete full Q-methodology analysis workflow', async () => {
      test.setTimeout(TEST_TIMEOUT);

      // Step 1: Navigate to application
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/Q-Method|VQMethod/i);

      // Step 2: Login/Register
      await page.click('[data-testid="login-button"], text="Login"');
      await page.fill(
        '[data-testid="email-input"], input[type="email"]',
        'test@example.com'
      );
      await page.fill(
        '[data-testid="password-input"], input[type="password"]',
        'Test123!'
      );
      await page.click(
        '[data-testid="submit-login"], button:has-text("Login")'
      );

      // Wait for dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page.locator('text="Dashboard"')).toBeVisible();

      // Step 3: Create new study
      await page.click(
        '[data-testid="new-study-button"], button:has-text("New Study")'
      );
      await page.fill(
        '[data-testid="study-name"], input[placeholder*="study name"]',
        'E2E Test Study'
      );
      await page.fill(
        '[data-testid="study-description"], textarea',
        'Automated E2E test study'
      );
      await page.click(
        '[data-testid="create-study"], button:has-text("Create")'
      );

      // Step 4: Upload Q-sort data
      console.log('Uploading Q-sort data...');
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(SAMPLE_QSORT_FILE);

      // Wait for upload confirmation
      await expect(page.locator('text="Upload successful"')).toBeVisible({
        timeout: 10000,
      });

      // Step 5: Configure analysis parameters
      await page.click('button:has-text("Configure Analysis")');

      // Set extraction method
      await page.selectOption('[data-testid="extraction-method"]', 'PCA');

      // Set number of factors
      await page.fill('[data-testid="num-factors"], input[type="number"]', '3');

      // Set rotation method
      await page.selectOption('[data-testid="rotation-method"]', 'varimax');

      // Step 6: Run analysis
      const startTime = performance.now();
      await page.click(
        '[data-testid="run-analysis"], button:has-text("Run Analysis")'
      );

      // Wait for analysis to complete
      await expect(page.locator('[data-testid="analysis-status"]')).toHaveText(
        'Completed',
        {
          timeout: 60000,
        }
      );

      const analysisTime = performance.now() - startTime;
      console.log(`Analysis completed in ${analysisTime.toFixed(2)}ms`);

      // Step 7: Verify results
      await expect(
        page.locator('[data-testid="factor-loadings"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="scree-plot"]')).toBeVisible();
      await expect(page.locator('[data-testid="factor-scores"]')).toBeVisible();

      // Check for expected number of factors
      const factorCount = await page
        .locator('[data-testid="factor-tab"]')
        .count();
      expect(factorCount).toBe(3);

      // Step 8: Export results
      await page.click('button:has-text("Export Results")');

      // Select export format
      await page.click('[data-testid="export-format-csv"]');

      // Download results
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Download")'),
      ]);

      // Verify download
      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();

      // Save download for verification
      await download.saveAs('./e2e/downloads/analysis-results.csv');

      console.log('✅ Complete analysis workflow test passed');
    });

    test('should handle PQMethod DAT file import', async () => {
      await page.goto(`${BASE_URL}/import`);

      // Upload DAT file
      const fileInput = await page.locator('input[type="file"][accept=".dat"]');
      await fileInput.setInputFiles(SAMPLE_DAT_FILE);

      // Verify import success
      await expect(page.locator('text="Import successful"')).toBeVisible();

      // Check data preview
      await expect(page.locator('[data-testid="data-preview"]')).toBeVisible();
      const previewRows = await page
        .locator('[data-testid="preview-row"]')
        .count();
      expect(previewRows).toBeGreaterThan(0);
    });
  });

  describe('2. Interactive Rotation (Manual factor adjustment)', () => {
    test('should allow interactive factor rotation', async () => {
      // Navigate to analysis results
      await page.goto(`${BASE_URL}/analysis/demo`);

      // Enable interactive mode
      await page.click('[data-testid="interactive-mode-toggle"]');

      // Get initial rotation angle
      const initialAngle = await page.getAttribute(
        '[data-testid="rotation-angle"]',
        'value'
      );

      // Drag rotation handle
      const rotationHandle = await page.locator(
        '[data-testid="rotation-handle"]'
      );
      await rotationHandle.dragTo(
        page.locator('[data-testid="rotation-target"]')
      );

      // Verify rotation changed
      const newAngle = await page.getAttribute(
        '[data-testid="rotation-angle"]',
        'value'
      );
      expect(newAngle).not.toBe(initialAngle);

      // Test manual angle input
      await page.fill('[data-testid="rotation-angle-input"]', '45');
      await page.press('[data-testid="rotation-angle-input"]', 'Enter');

      // Verify loadings updated
      await expect(
        page.locator('[data-testid="loading-update-indicator"]')
      ).toBeVisible();

      // Test rotation presets
      const presets = ['varimax', 'quartimax', 'equamax', 'oblimin', 'promax'];
      for (const preset of presets) {
        await page.click(`[data-testid="rotation-preset-${preset}"]`);
        await page.waitForTimeout(500); // Wait for animation

        // Verify rotation applied
        await expect(
          page.locator('[data-testid="current-rotation"]')
        ).toHaveText(preset);
      }

      console.log('✅ Interactive rotation test passed');
    });

    test('should update visualizations in real-time during rotation', async () => {
      await page.goto(`${BASE_URL}/analysis/demo`);

      // Enable real-time updates
      await page.check('[data-testid="realtime-updates"]');

      // Start rotation animation
      await page.click('[data-testid="animate-rotation"]');

      // Capture screenshots during rotation
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `./e2e/screenshots/rotation-${i}.png`,
          clip: { x: 0, y: 0, width: 800, height: 600 },
        });
      }

      // Stop animation
      await page.click('[data-testid="stop-animation"]');

      // Verify final state
      await expect(
        page.locator('[data-testid="rotation-complete"]')
      ).toBeVisible();
    });
  });

  describe('3. Multi-user Scenarios (Collaborative analysis)', () => {
    test('should support multiple users working on same study', async () => {
      // Create two browser contexts for two users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const user1 = await context1.newPage();
      const user2 = await context2.newPage();

      // User 1: Create study
      await user1.goto(BASE_URL);
      await loginUser(user1, 'user1@example.com', 'password');
      await user1.click('button:has-text("New Study")');
      await user1.fill('input[name="studyName"]', 'Collaborative Study');
      await user1.click('button:has-text("Create")');

      // Get study ID
      const studyUrl = user1.url();
      const studyId = studyUrl.split('/').pop();

      // Share with User 2
      await user1.click('[data-testid="share-study"]');
      await user1.fill('[data-testid="share-email"]', 'user2@example.com');
      await user1.selectOption('[data-testid="share-permission"]', 'edit');
      await user1.click('button:has-text("Send Invitation")');

      // User 2: Access shared study
      await user2.goto(`${BASE_URL}/study/${studyId}`);
      await loginUser(user2, 'user2@example.com', 'password');

      // Verify both users see the study
      await expect(user1.locator('text="Collaborative Study"')).toBeVisible();
      await expect(user2.locator('text="Collaborative Study"')).toBeVisible();

      // User 1: Upload data
      await user1.click('[data-testid="upload-data"]');
      const fileInput1 = await user1.locator('input[type="file"]');
      await fileInput1.setInputFiles(SAMPLE_QSORT_FILE);

      // User 2: Should see data update
      await user2.waitForTimeout(2000); // Wait for real-time sync
      await expect(user2.locator('[data-testid="data-status"]')).toHaveText(
        'Data Available'
      );

      // User 2: Start analysis
      await user2.click('button:has-text("Analyze")');
      await user2.selectOption('[data-testid="extraction-method"]', 'PCA');
      await user2.click('button:has-text("Run")');

      // User 1: Should see analysis progress
      await expect(
        user1.locator('[data-testid="analysis-progress"]')
      ).toBeVisible();

      // Both users should see results
      await expect(
        user1.locator('[data-testid="analysis-complete"]')
      ).toBeVisible({ timeout: 30000 });
      await expect(
        user2.locator('[data-testid="analysis-complete"]')
      ).toBeVisible();

      // Clean up
      await context1.close();
      await context2.close();

      console.log('✅ Multi-user collaboration test passed');
    });

    test('should handle concurrent edits with conflict resolution', async () => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const user1 = await context1.newPage();
      const user2 = await context2.newPage();

      // Both users access same study
      const studyUrl = `${BASE_URL}/study/test-study-123`;
      await user1.goto(studyUrl);
      await user2.goto(studyUrl);

      // Simultaneous edits
      await Promise.all([
        user1.fill('[data-testid="factor-label-1"]', 'Factor A'),
        user2.fill('[data-testid="factor-label-1"]', 'Factor B'),
      ]);

      // Submit changes
      await Promise.all([
        user1.click('button:has-text("Save")'),
        user2.click('button:has-text("Save")'),
      ]);

      // Check for conflict resolution
      const user1Alert = await user1.locator('[data-testid="conflict-alert"]');
      const user2Alert = await user2.locator('[data-testid="conflict-alert"]');

      // At least one user should see conflict
      const hasConflict =
        (await user1Alert.isVisible()) || (await user2Alert.isVisible());
      expect(hasConflict).toBeTruthy();

      await context1.close();
      await context2.close();
    });
  });

  describe('4. Cross-browser Compatibility', () => {
    const browsers = ['chromium', 'firefox', 'webkit']; // webkit = Safari

    for (const browserName of browsers) {
      test(`should work correctly in ${browserName}`, async () => {
        const browser = await playwright[browserName].launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        // Basic functionality test
        await page.goto(BASE_URL);

        // Check page loads
        await expect(page.locator('body')).toBeVisible();

        // Test navigation
        await page.click('a:has-text("Features")');
        await expect(page).toHaveURL(/.*features/);

        // Test form inputs
        await page.goto(`${BASE_URL}/contact`);
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'Cross-browser test');

        // Test JavaScript functionality
        await page.goto(`${BASE_URL}/analysis/demo`);
        await page.click('[data-testid="interactive-chart"]');

        // Verify chart interaction works
        const chartData = await page.evaluate(() => {
          return window.chartInstance?.data?.datasets?.length > 0;
        });
        expect(chartData).toBeTruthy();

        // Test file upload
        const fileInput = await page.locator('input[type="file"]');
        const canUpload = await fileInput.isEnabled();
        expect(canUpload).toBeTruthy();

        // Screenshot for visual comparison
        await page.screenshot({
          path: `./e2e/screenshots/cross-browser-${browserName}.png`,
          fullPage: true,
        });

        await browser.close();

        console.log(`✅ ${browserName} compatibility test passed`);
      });
    }

    test('should handle browser-specific features gracefully', async () => {
      // Test feature detection
      const features = await page.evaluate(() => {
        return {
          webGL: !!document.createElement('canvas').getContext('webgl'),
          localStorage: 'localStorage' in window,
          indexedDB: 'indexedDB' in window,
          webWorkers: 'Worker' in window,
          serviceWorker: 'serviceWorker' in navigator,
          clipboard: 'clipboard' in navigator,
          webRTC: 'RTCPeerConnection' in window,
        };
      });

      console.log('Browser features:', features);

      // Core features should be available
      expect(features.localStorage).toBeTruthy();
      expect(features.indexedDB).toBeTruthy();
    });
  });

  describe('5. Mobile Responsiveness', () => {
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } },
      { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } },
      { name: 'Pixel 5', viewport: { width: 393, height: 851 } },
    ];

    for (const device of devices) {
      test(`should be responsive on ${device.name}`, async () => {
        // Set mobile viewport
        await page.setViewportSize(device.viewport);

        // Navigate to home
        await page.goto(BASE_URL);

        // Check mobile menu
        const mobileMenu = await page.locator(
          '[data-testid="mobile-menu-button"]'
        );
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          await expect(
            page.locator('[data-testid="mobile-menu-content"]')
          ).toBeVisible();
        }

        // Test touch interactions
        await page.goto(`${BASE_URL}/analysis/demo`);

        // Simulate touch on chart
        const chart = await page.locator('[data-testid="interactive-chart"]');
        await chart.tap();

        // Check if tooltip appears
        await expect(
          page.locator('[data-testid="chart-tooltip"]')
        ).toBeVisible();

        // Test swipe gesture for carousel
        const carousel = await page.locator('[data-testid="results-carousel"]');
        if (await carousel.isVisible()) {
          await carousel.swipe({ direction: 'left' });
          await page.waitForTimeout(300); // Wait for animation
        }

        // Test form on mobile
        await page.goto(`${BASE_URL}/upload`);

        // Check if file upload is accessible
        const uploadButton = await page.locator(
          '[data-testid="upload-button"]'
        );
        await expect(uploadButton).toBeVisible();

        // Test scrolling
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
        await page.waitForTimeout(500);

        // Check if footer is visible after scroll
        await expect(page.locator('footer')).toBeVisible();

        // Screenshot for mobile layout
        await page.screenshot({
          path: `./e2e/screenshots/mobile-${device.name.replace(/\s/g, '-')}.png`,
          fullPage: true,
        });

        console.log(`✅ Mobile responsiveness test passed for ${device.name}`);
      });
    }

    test('should handle mobile-specific features', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test touch events
      await page.goto(`${BASE_URL}/analysis/demo`);

      // Pinch to zoom on chart
      const chart = await page.locator('[data-testid="zoomable-chart"]');

      // Simulate pinch gesture
      await page.evaluate(() => {
        const event = new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 1,
              target: document.body,
              clientX: 100,
              clientY: 100,
            }),
            new Touch({
              identifier: 2,
              target: document.body,
              clientX: 200,
              clientY: 200,
            }),
          ],
        });
        document.dispatchEvent(event);
      });

      // Test orientation change
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape
      await page.waitForTimeout(500);

      // Verify layout adjusts
      const isLandscape = await page.evaluate(() => {
        return window.innerWidth > window.innerHeight;
      });
      expect(isLandscape).toBeTruthy();

      // Test offline capability
      await context.setOffline(true);
      await page.reload();

      // Should show offline message
      const offlineMessage = await page.locator(
        '[data-testid="offline-message"]'
      );
      if (await offlineMessage.isVisible()) {
        console.log('Offline mode detected and handled');
      }

      await context.setOffline(false);
    });
  });

  describe('Performance Metrics', () => {
    test('should meet performance benchmarks', async () => {
      // Enable performance monitoring
      const metrics = [];

      page.on('metrics', data => {
        metrics.push(data);
      });

      // Navigate and measure
      const navigationStart = performance.now();
      await page.goto(BASE_URL);
      const navigationEnd = performance.now();

      // Measure page load metrics
      const performanceMetrics = await page.evaluate(() => {
        const perf = window.performance;
        const navigation = perf.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: perf.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint:
            perf.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: 0, // Would need observer for this
        };
      });

      console.log('Performance Metrics:', performanceMetrics);

      // Assert performance thresholds
      expect(navigationEnd - navigationStart).toBeLessThan(3000); // 3s max
      expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // 1.5s max
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1000); // 1s max

      // Test memory usage
      const memoryUsage = await page.evaluate(() => {
        return (performance as any).memory
          ? (performance as any).memory.usedJSHeapSize / 1048576
          : 0;
      });

      console.log(`Memory usage: ${memoryUsage.toFixed(2)} MB`);
      expect(memoryUsage).toBeLessThan(100); // Less than 100MB
    });
  });
});

// Helper functions
async function loginUser(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

async function uploadFile(page: Page, filePath: string) {
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(1000); // Wait for upload
}

async function runAnalysis(page: Page, options = {}) {
  const defaults = {
    method: 'PCA',
    factors: 3,
    rotation: 'varimax',
  };

  const settings = { ...defaults, ...options };

  await page.selectOption('[data-testid="extraction-method"]', settings.method);
  await page.fill('[data-testid="num-factors"]', String(settings.factors));
  await page.selectOption('[data-testid="rotation-method"]', settings.rotation);
  await page.click('button:has-text("Run Analysis")');

  await page.waitForSelector('[data-testid="analysis-complete"]', {
    timeout: 60000,
  });
}

// Export test utilities
export { loginUser, uploadFile, runAnalysis };
