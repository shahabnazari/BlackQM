/**
 * Phase 10.93 Day 6 - Smoke Test for Literature Discovery Page
 *
 * Quick validation test to verify page loads and identify correct selectors
 * This test helps us understand the actual UI structure before running full E2E tests
 *
 * @file frontend/e2e/literature-page-smoke.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Literature Page Smoke Test', () => {
  test('should load literature page and identify UI elements', async ({ page }) => {
    // Navigate to literature page
    await page.goto('http://localhost:3000/discover/literature');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page loaded successfully (not 500 error)
    const errorHeading = page.locator('h1:has-text("500")');
    await expect(errorHeading).not.toBeVisible();

    // Verify main heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    console.log('Main heading:', await mainHeading.textContent());

    // Check for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    const hasSearchInput = await searchInput.isVisible().catch(() => false);
    console.log('Has search input:', hasSearchInput);

    if (hasSearchInput) {
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log('Search input placeholder:', placeholder);
    }

    // Check for search button
    const searchButtons = page.locator('button:has-text("Search")');
    const searchButtonCount = await searchButtons.count();
    console.log('Search buttons found:', searchButtonCount);

    // Check for Extract Themes button (might not be visible without papers)
    const extractButton = page.locator('button:has-text("Extract Themes"), button:has-text("Extract themes")').first();
    const hasExtractButton = await extractButton.isVisible().catch(() => false);
    console.log('Has Extract Themes button:', hasExtractButton);

    // Log all buttons on page
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Total buttons on page: ${buttonCount}`);

    // Check page structure
    const pageSnapshot = await page.content();
    console.log('Page contains "Literature Discovery":', pageSnapshot.includes('Literature Discovery'));
    console.log('Page contains "papers":', pageSnapshot.includes('papers'));
    console.log('Page contains "selected":', pageSnapshot.includes('selected'));

    // Take screenshot for manual review
    await page.screenshot({ path: 'test-results/literature-page-smoke.png', fullPage: true });

    console.log('✅ Smoke test complete - check test-results/literature-page-smoke.png for visual inspection');
  });
});
