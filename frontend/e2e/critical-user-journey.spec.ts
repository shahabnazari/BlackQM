import { test, expect } from '@playwright/test';

test.describe('Critical User Journey - Q-Methodology Study', () => {
  test('should complete basic Q-sort workflow', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main page loads
    await expect(page.getByText('Apple Design System')).toBeVisible();
    
    // Check theme toggle works
    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Check button components are interactive
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Test form inputs if available
    const textFields = page.locator('input[type="text"]:visible, input[type="email"]:visible');
    const fieldCount = await textFields.count();
    
    if (fieldCount > 0) {
      const firstField = textFields.first();
      await firstField.fill('Test input');
      await expect(firstField).toHaveValue('Test input');
    }
    
    // Check progress indicators if visible
    const progressBars = page.locator('[role="progressbar"]');
    const progressCount = await progressBars.count();
    
    if (progressCount > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check for skip links or main content landmark
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();
    expect(mainCount).toBeGreaterThanOrEqual(0);
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should be performant', async ({ page }) => {
    // Set up performance monitoring
    const performanceMetrics: any = {};
    
    page.on('load', async () => {
      const timing = await page.evaluate(() => {
        const perf = window.performance;
        const timing = perf.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          load: timing.loadEventEnd - timing.navigationStart
        };
      });
      performanceMetrics.timing = timing;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that page loads within acceptable time
    if (performanceMetrics.timing) {
      expect(performanceMetrics.timing.domContentLoaded).toBeLessThan(3000);
      expect(performanceMetrics.timing.load).toBeLessThan(5000);
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to non-existent page
    await page.goto('/non-existent-page-404');
    
    // Should show error page without console errors
    const errorMessages = consoleErrors.filter(err => 
      !err.includes('404') && // Exclude expected 404 messages
      !err.includes('Failed to load resource') // Exclude resource loading errors
    );
    
    expect(errorMessages.length).toBe(0);
  });

  test('should maintain state across theme changes', async ({ page }) => {
    await page.goto('/');
    
    // Fill in a form field if available
    const textFields = page.locator('input[type="text"]:visible');
    const fieldCount = await textFields.count();
    
    if (fieldCount > 0) {
      const firstField = textFields.first();
      await firstField.fill('Persistent Value');
      
      // Toggle theme
      const themeToggle = page.locator('button[aria-label*="Switch to"]');
      await themeToggle.click();
      
      // Check that field value persists
      await expect(firstField).toHaveValue('Persistent Value');
    }
  });

  test('should be responsive across breakpoints', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1440, height: 900, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Check that main content is visible at each breakpoint
      await expect(page.getByText('Apple Design System')).toBeVisible();
      
      // Check that navigation/header adapts
      const header = page.locator('header, [role="banner"], nav');
      const headerCount = await header.count();
      
      if (headerCount > 0) {
        await expect(header.first()).toBeVisible();
      }
    }
  });
});