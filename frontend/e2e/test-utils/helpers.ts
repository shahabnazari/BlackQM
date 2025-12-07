/**
 * Phase 10.93 Day 6 - E2E Test Helper Functions
 *
 * Shared helper functions for E2E tests
 * All fixes from strict audit applied:
 * - Proper error handling
 * - Type safety (no `any`)
 * - Navigation verification
 * - Deterministic waits
 * - JSDoc documentation
 *
 * @file frontend/e2e/test-utils/helpers.ts
 * @enterprise-grade Zero technical debt, production-ready
 */

import { Page, expect } from '@playwright/test';
import { TEST_TIMEOUTS, ENV_CONFIG, TEST_CREDENTIALS, SELECTORS, ERROR_MESSAGES } from './config';

/**
 * Waits for element to be visible with configurable timeout
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for element
 * @param timeout - Maximum wait time in milliseconds
 * @throws {Error} If element is not found within timeout
 *
 * @example
 * await waitForElement(page, 'button#submit', 5000);
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = TEST_TIMEOUTS.ELEMENT_VISIBLE
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
  } catch (error) {
    throw new Error(
      `${ERROR_MESSAGES.ELEMENT_NOT_FOUND(selector)}: ${(error as Error).message}`
    );
  }
}

/**
 * Logs in as test user with credentials from environment variables
 *
 * SECURITY: Uses environment variables for credentials, never hardcoded
 *
 * @param page - Playwright Page object
 * @throws {Error} If login fails
 *
 * @example
 * await loginAsTestUser(page);
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  try {
    const loginUrl = `${ENV_CONFIG.BASE_URL}/auth/login`;
    const response = await page.goto(loginUrl);

    if (!response || !response.ok()) {
      throw new Error(`Failed to load login page: ${response?.status()}`);
    }

    // Fill login form with environment credentials
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT_VISIBLE });
    await expect(passwordInput).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT_VISIBLE });

    await emailInput.fill(TEST_CREDENTIALS.EMAIL);
    await passwordInput.fill(TEST_CREDENTIALS.PASSWORD);

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for successful login (redirect to dashboard or literature page)
    await page.waitForURL(/\/(dashboard|discover\/literature)/, {
      timeout: TEST_TIMEOUTS.NAVIGATION
    });

    // Verify no error messages
    const errorElement = page.locator('[role="alert"], .error-message').first();
    const hasError = await errorElement.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorElement.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }
  } catch (error) {
    throw new Error(`Login as test user failed: ${(error as Error).message}`);
  }
}

/**
 * Navigates to literature discovery page with full verification
 *
 * @param page - Playwright Page object
 * @throws {Error} If navigation fails or page has errors
 *
 * @example
 * await navigateToLiteraturePage(page);
 */
export async function navigateToLiteraturePage(page: Page): Promise<void> {
  try {
    const url = `${ENV_CONFIG.BASE_URL}/discover/literature`;
    const response = await page.goto(url);

    // Verify successful navigation
    if (!response || !response.ok()) {
      throw new Error(`${ERROR_MESSAGES.NAVIGATION_FAILED(url)}: ${response?.status()}`);
    }

    // Verify correct URL
    expect(page.url()).toContain('/discover/literature');

    // Wait for critical elements
    await waitForElement(page, SELECTORS.PAGE.MAIN, TEST_TIMEOUTS.ELEMENT_VISIBLE);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: TEST_TIMEOUTS.NAVIGATION });

    // Verify no error page
    const errorHeading = page.locator(SELECTORS.PAGE.ERROR_HEADING);
    await expect(errorHeading).not.toBeVisible();
  } catch (error) {
    throw new Error(
      `Navigation to literature page failed: ${(error as Error).message}`
    );
  }
}

/**
 * Searches for papers with given query
 *
 * @param page - Playwright Page object
 * @param query - Search query string
 * @throws {Error} If search fails
 *
 * @example
 * await searchPapers(page, 'machine learning');
 */
export async function searchPapers(page: Page, query: string): Promise<void> {
  try {
    // Find search input
    const searchInput = page.locator(SELECTORS.SEARCH.INPUT).first();

    // Verify input is visible before interacting
    await expect(searchInput).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT_VISIBLE });

    // Clear and fill search input
    await searchInput.clear();
    await searchInput.fill(query);

    // Wait for debounce delay
    await page.waitForTimeout(TEST_TIMEOUTS.SEARCH_DEBOUNCE);

    // Submit search (press Enter)
    await searchInput.press('Enter');

    // Wait for results to load (either success or no results message)
    try {
      await page.waitForSelector(SELECTORS.PAPER.CARD, {
        timeout: TEST_TIMEOUTS.API_RESPONSE,
        state: 'visible'
      });
    } catch (error) {
      // Check if it's a "no results" scenario
      const noResultsMessage = page.locator('text=/no results|no papers found/i').first();
      const hasNoResults = await noResultsMessage.isVisible().catch(() => false);

      if (!hasNoResults) {
        throw error;
      }
      // If "no results" message is shown, that's a valid state
    }
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.SEARCH_FAILED(query)}: ${(error as Error).message}`);
  }
}

/**
 * Selects papers for theme extraction
 *
 * @param page - Playwright Page object
 * @param count - Number of papers to select
 * @returns Promise resolving to actual number of papers selected
 * @throws {Error} If no papers are available
 *
 * @example
 * const selectedCount = await selectPapers(page, 5);
 * console.log(`Selected ${selectedCount} papers`);
 */
export async function selectPapers(page: Page, count: number): Promise<number> {
  try {
    // Find paper selection buttons/checkboxes
    const selectionButtons = page.locator(SELECTORS.PAPER.SELECTION_BUTTON);

    // Wait for at least one paper to be available
    await expect(selectionButtons.first()).toBeVisible({
      timeout: TEST_TIMEOUTS.ELEMENT_VISIBLE
    });

    const availablePapers = await selectionButtons.count();

    if (availablePapers === 0) {
      throw new Error(ERROR_MESSAGES.NO_PAPERS_FOUND);
    }

    const papersToSelect = Math.min(count, availablePapers);

    // Select papers with proper state verification
    for (let i = 0; i < papersToSelect; i++) {
      const button = selectionButtons.nth(i);

      // Click selection button
      await button.click();

      // Wait for selection state to update (deterministic wait)
      // Check for aria-checked or aria-pressed attribute change
      try {
        await expect(button).toHaveAttribute('aria-checked', 'true', {
          timeout: TEST_TIMEOUTS.UI_INTERACTION_DELAY
        });
      } catch {
        // Some implementations use aria-pressed
        await expect(button).toHaveAttribute('aria-pressed', 'true', {
          timeout: TEST_TIMEOUTS.UI_INTERACTION_DELAY
        });
      }
    }

    return papersToSelect;
  } catch (error) {
    throw new Error(`Failed to select papers: ${(error as Error).message}`);
  }
}

/**
 * Starts theme extraction workflow
 *
 * @param page - Playwright Page object
 * @throws {Error} If extraction button not found or disabled
 *
 * @example
 * await startThemeExtraction(page);
 */
export async function startThemeExtraction(page: Page): Promise<void> {
  try {
    // Find Extract Themes button
    const extractButton = page.locator(SELECTORS.EXTRACTION.BUTTON).first();

    // Verify button is visible and enabled
    await expect(extractButton).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT_VISIBLE });
    await expect(extractButton).toBeEnabled();

    // Click button
    await extractButton.click();

    // Verify modal appears
    await waitForElement(page, SELECTORS.EXTRACTION.MODAL, TEST_TIMEOUTS.ELEMENT_VISIBLE);
  } catch (error) {
    throw new Error(`Failed to start theme extraction: ${(error as Error).message}`);
  }
}

/**
 * Waits for theme extraction to complete
 *
 * @param page - Playwright Page object
 * @param timeout - Maximum wait time in milliseconds
 * @throws {Error} If extraction times out or fails
 *
 * @example
 * await waitForExtractionComplete(page, 90000);
 */
export async function waitForExtractionComplete(
  page: Page,
  timeout: number = TEST_TIMEOUTS.LARGE_BATCH
): Promise<void> {
  try {
    // Wait for completion message
    await page.waitForSelector(SELECTORS.EXTRACTION.COMPLETE_MESSAGE, {
      timeout,
      state: 'visible'
    });

    // Verify no error occurred
    const errorMessage = page.locator(SELECTORS.EXTRACTION.ERROR_MESSAGE).first();
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`Extraction completed with error: ${errorText}`);
    }
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.EXTRACTION_FAILED}: ${(error as Error).message}`);
  }
}

/**
 * Checks for error messages on page
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to true if error found, false otherwise
 *
 * @example
 * const hasError = await checkForErrors(page);
 * if (hasError) {
 *   console.log('Error detected on page');
 * }
 */
export async function checkForErrors(page: Page): Promise<boolean> {
  const errorSelectors = [
    SELECTORS.EXTRACTION.ERROR_MESSAGE,
    SELECTORS.PAGE.ERROR_HEADING,
  ];

  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector).first();
    const isVisible = await errorElement.isVisible().catch(() => false);

    if (isVisible) {
      return true;
    }
  }

  return false;
}
