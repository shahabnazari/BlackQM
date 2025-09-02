import { test, expect } from '@playwright/test';

test.describe('VQMethod Apple Design System - Smoke Tests', () => {
  test('should load demo page without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Assert no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display main title and description', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Apple Design System')).toBeVisible();
    await expect(page.getByText('A comprehensive implementation of Apple Human Interface Guidelines')).toBeVisible();
  });

  test('should show button components', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Button Components')).toBeVisible();
    await expect(page.getByText('Get Started')).toBeVisible();
    await expect(page.getByText('View Documentation')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle).toBeVisible();
    
    // Check initial state (should be light mode)
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Click theme toggle
    await themeToggle.click();
    
    // Wait for dark mode to be applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Click again to return to light mode
    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is visible on mobile
    await expect(page.getByText('Apple Design System')).toBeVisible();
    
    // Check that theme toggle is accessible
    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading structure
    await expect(page.locator('h1')).toHaveText('Apple Design System');
    
    // Check theme toggle accessibility
    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle).toHaveAttribute('aria-label');
    
    // Check button accessibility
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const ariaLabel = await button.getAttribute('aria-label');
      if (ariaLabel) {
        expect(ariaLabel).toBeTruthy();
      }
    }
  });
});
