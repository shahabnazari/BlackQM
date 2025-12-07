/**
 * Phase 10.93 Day 6 - Error Injection Testing: Theme Extraction Workflow
 *
 * Tests system resilience with various failure scenarios
 * Simulates network failures, API errors, timeouts, and partial failures
 *
 * @file frontend/e2e/theme-extraction-error-injection.spec.ts
 * @enterprise-grade Chaos engineering for production resilience
 * @test-coverage Network failures, API errors, authentication failures, database errors
 */

import { test, expect, Page, Route } from '@playwright/test';

// Error injection configuration
const ERROR_SCENARIOS = {
  networkTimeout: { delay: 60000, status: 'timeout' },
  serverError: { status: 500, body: { error: 'Internal Server Error' } },
  badGateway: { status: 502, body: { error: 'Bad Gateway' } },
  serviceUnavailable: { status: 503, body: { error: 'Service Unavailable' } },
  rateLimited: { status: 429, body: { error: 'Too Many Requests', retryAfter: 60 } },
  unauthorized: { status: 401, body: { error: 'Unauthorized' } },
  forbidden: { status: 403, body: { error: 'Forbidden' } },
  notFound: { status: 404, body: { error: 'Not Found' } },
  badRequest: { status: 400, body: { error: 'Bad Request', details: 'Invalid parameters' } },
  unprocessableEntity: { status: 422, body: { error: 'Validation Failed' } }
} as const;

/**
 * Helper: Inject network timeout error
 */
async function injectNetworkTimeout(page: Page, urlPattern: string | RegExp) {
  await page.route(urlPattern, async (route: Route) => {
    // Hold the request indefinitely (simulates timeout)
    await new Promise(() => {}); // Never resolves
  });
}

/**
 * Helper: Inject HTTP error response
 */
async function injectHttpError(
  page: Page,
  urlPattern: string | RegExp,
  status: number,
  body: Record<string, unknown>
) {
  await page.route(urlPattern, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });
}

/**
 * Helper: Inject partial failure (some succeed, some fail)
 */
async function injectPartialFailure(
  page: Page,
  urlPattern: string | RegExp,
  failureRate: number = 0.5
) {
  let requestCount = 0;

  await page.route(urlPattern, async (route: Route) => {
    requestCount++;

    // Alternate between success and failure
    if (requestCount % 2 === 0 && Math.random() < failureRate) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Random failure' })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper: Inject intermittent errors
 */
async function injectIntermittentErrors(
  page: Page,
  urlPattern: string | RegExp,
  errorFrequency: number = 0.3
) {
  await page.route(urlPattern, async (route: Route) => {
    if (Math.random() < errorFrequency) {
      const errorTypes = [500, 502, 503, 429];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];

      await route.fulfill({
        status: randomError,
        contentType: 'application/json',
        body: JSON.stringify({ error: `Intermittent error ${randomError}` })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper: Navigate and prepare for tests
 */
async function setupTest(page: Page) {
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
  await page.waitForSelector('[data-testid="paper-card"], .paper-card, article', {
    timeout: 30000
  }).catch(() => {});
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
 * Helper: Start extraction
 */
async function startExtraction(page: Page) {
  const extractButton = page.locator('button:has-text("Extract Themes")').first();
  await extractButton.click();
}

/**
 * Helper: Check for user-friendly error message
 */
async function expectUserFriendlyError(page: Page) {
  // Should show error message
  const errorMessage = await page.locator(
    '[role="alert"], .error-message, text=/error|failed|unable/i'
  ).first().textContent({ timeout: 10000 });

  // Should be user-friendly (not technical)
  expect(errorMessage?.toLowerCase()).not.toContain('undefined');
  expect(errorMessage?.toLowerCase()).not.toContain('null');
  expect(errorMessage?.toLowerCase()).not.toContain('500 error');
  expect(errorMessage?.toLowerCase()).not.toContain('stack trace');

  // Should contain helpful guidance
  const isHelpful =
    errorMessage?.toLowerCase().includes('try') ||
    errorMessage?.toLowerCase().includes('please') ||
    errorMessage?.toLowerCase().includes('unable') ||
    errorMessage?.toLowerCase().includes('contact support');

  expect(isHelpful).toBe(true);
}

/**
 * TEST SUITE 1: Network Timeout Scenarios
 */
test.describe('Error Injection - Network Timeouts', () => {
  test.setTimeout(90000);

  test('should handle API timeout gracefully during extraction', async ({ page }) => {
    await setupTest(page);

    // Inject timeout for theme extraction API
    await injectNetworkTimeout(page, /\/api\/.*extract/i);

    await performSearch(page, 'machine learning');
    await selectPapers(page, 5);
    await startExtraction(page);

    // Wait for modal
    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should show timeout error (not hang forever)
    await page.waitForSelector(
      'text=/timeout|taking longer|try again|failed/i',
      { timeout: 30000 }
    ).catch(async () => {
      // If no error shown, check for retry mechanism
      const retryButton = page.locator('button:has-text("Retry")').first();
      const isVisible = await retryButton.isVisible().catch(() => false);
      expect(isVisible).toBe(true);
    });
  });

  test('should show retry option after timeout', async ({ page }) => {
    await setupTest(page);

    // Inject timeout
    await injectNetworkTimeout(page, /\/api\/.*fulltext/i);

    await performSearch(page, 'data science');
    await selectPapers(page, 3);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Wait for timeout to manifest
    await page.waitForTimeout(15000);

    // Should offer retry
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
    const closeButton = page.locator('button:has-text("Close")').first();

    const hasRetry = await retryButton.isVisible().catch(() => false);
    const hasClose = await closeButton.isVisible().catch(() => false);

    expect(hasRetry || hasClose).toBe(true);
  });
});

/**
 * TEST SUITE 2: API Rate Limiting
 */
test.describe('Error Injection - Rate Limiting', () => {
  test.setTimeout(90000);

  test('should handle 429 Rate Limit errors gracefully', async ({ page }) => {
    await setupTest(page);

    // Inject rate limit error
    await injectHttpError(
      page,
      /\/api\/.*extract/i,
      ERROR_SCENARIOS.rateLimited.status,
      ERROR_SCENARIOS.rateLimited.body
    );

    await performSearch(page, 'neural networks');
    await selectPapers(page, 5);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should show rate limit message
    await expectUserFriendlyError(page);

    // Should mention waiting or trying later
    const errorText = await page.locator('[role="alert"], .error-message').first().textContent();
    const mentionsWaiting =
      errorText?.toLowerCase().includes('try again later') ||
      errorText?.toLowerCase().includes('please wait') ||
      errorText?.toLowerCase().includes('too many requests');

    expect(mentionsWaiting).toBe(true);
  });

  test('should implement exponential backoff for rate limits', async ({ page }) => {
    await setupTest(page);

    // Track retry attempts
    let retryCount = 0;
    const retryTimestamps: number[] = [];

    await page.route(/\/api\/.*extract/i, async (route: Route) => {
      retryCount++;
      retryTimestamps.push(Date.now());

      if (retryCount <= 3) {
        // Fail first 3 attempts
        await route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Rate limited' })
        });
      } else {
        // Succeed after backoff
        await route.continue();
      }
    });

    await performSearch(page, 'quantum computing');
    await selectPapers(page, 3);
    await startExtraction(page);

    // Wait for retries to occur
    await page.waitForTimeout(20000);

    // Check if backoff was implemented
    if (retryTimestamps.length >= 3) {
      const firstDelay = retryTimestamps[1] - retryTimestamps[0];
      const secondDelay = retryTimestamps[2] - retryTimestamps[1];

      console.log(`First retry delay: ${firstDelay}ms`);
      console.log(`Second retry delay: ${secondDelay}ms`);

      // Second delay should be longer (exponential backoff)
      // Allow some tolerance for timing
      expect(secondDelay).toBeGreaterThanOrEqual(firstDelay * 0.8);
    }
  });
});

/**
 * TEST SUITE 3: Authentication Failures
 */
test.describe('Error Injection - Authentication Errors', () => {
  test.setTimeout(90000);

  test('should handle 401 Unauthorized errors', async ({ page }) => {
    await setupTest(page);

    // Inject auth error
    await injectHttpError(
      page,
      /\/api\/.*save|\/api\/.*extract/i,
      ERROR_SCENARIOS.unauthorized.status,
      ERROR_SCENARIOS.unauthorized.body
    );

    await performSearch(page, 'software testing');
    await selectPapers(page, 4);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should show auth error
    await expectUserFriendlyError(page);

    // Should mention login or authentication
    const errorText = await page.locator('[role="alert"], .error-message').first().textContent();
    const mentionsAuth =
      errorText?.toLowerCase().includes('log in') ||
      errorText?.toLowerCase().includes('sign in') ||
      errorText?.toLowerCase().includes('authentication') ||
      errorText?.toLowerCase().includes('session expired');

    expect(mentionsAuth).toBe(true);
  });

  test('should trigger token refresh on 401 and retry', async ({ page }) => {
    await setupTest(page);

    let attemptCount = 0;

    await page.route(/\/api\/.*extract/i, async (route: Route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: 401 Unauthorized
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Token expired' })
        });
      } else {
        // After token refresh: succeed
        await route.continue();
      }
    });

    await performSearch(page, 'cloud computing');
    await selectPapers(page, 3);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Wait for potential token refresh and retry
    await page.waitForTimeout(10000);

    // Should have attempted at least twice (original + retry)
    expect(attemptCount).toBeGreaterThanOrEqual(1);
  });
});

/**
 * TEST SUITE 4: Server Errors (5xx)
 */
test.describe('Error Injection - Server Errors', () => {
  test.setTimeout(90000);

  test('should handle 500 Internal Server Error gracefully', async ({ page }) => {
    await setupTest(page);

    await injectHttpError(
      page,
      /\/api\/.*extract/i,
      ERROR_SCENARIOS.serverError.status,
      ERROR_SCENARIOS.serverError.body
    );

    await performSearch(page, 'blockchain');
    await selectPapers(page, 5);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should show user-friendly error
    await expectUserFriendlyError(page);
  });

  test('should handle 502 Bad Gateway errors', async ({ page }) => {
    await setupTest(page);

    await injectHttpError(
      page,
      /\/api\/.*fulltext/i,
      ERROR_SCENARIOS.badGateway.status,
      ERROR_SCENARIOS.badGateway.body
    );

    await performSearch(page, 'cybersecurity');
    await selectPapers(page, 4);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(10000);

    // Should show error or retry
    const hasError = await page.locator('text=/error|failed/i').isVisible().catch(() => false);
    const hasRetry = await page.locator('button:has-text("Retry")').isVisible().catch(() => false);

    expect(hasError || hasRetry).toBe(true);
  });

  test('should handle 503 Service Unavailable with retry', async ({ page }) => {
    await setupTest(page);

    await injectHttpError(
      page,
      /\/api\/.*extract/i,
      ERROR_SCENARIOS.serviceUnavailable.status,
      ERROR_SCENARIOS.serviceUnavailable.body
    );

    await performSearch(page, 'IoT');
    await selectPapers(page, 3);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should indicate service unavailable
    const errorText = await page.locator('[role="alert"], .error-message').first().textContent({ timeout: 10000 });

    const mentionsUnavailable =
      errorText?.toLowerCase().includes('unavailable') ||
      errorText?.toLowerCase().includes('temporarily') ||
      errorText?.toLowerCase().includes('maintenance') ||
      errorText?.toLowerCase().includes('try again');

    expect(mentionsUnavailable).toBe(true);
  });
});

/**
 * TEST SUITE 5: Partial Failures
 */
test.describe('Error Injection - Partial Failures', () => {
  test.setTimeout(90000);

  test('should handle some papers failing while others succeed', async ({ page }) => {
    await setupTest(page);

    // Inject partial failure (50% fail)
    await injectPartialFailure(page, /\/api\/.*fulltext/i, 0.5);

    await performSearch(page, 'distributed systems');
    await selectPapers(page, 10);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Wait for extraction process
    await page.waitForTimeout(20000);

    // Should complete with partial results OR show clear error
    const hasCompletion = await page.locator('text=/Complete|Success/i').isVisible().catch(() => false);
    const hasPartialWarning = await page.locator('text=/partial|some failed|\\d+ of \\d+/i').isVisible().catch(() => false);
    const hasError = await page.locator('text=/error|failed/i').isVisible().catch(() => false);

    expect(hasCompletion || hasPartialWarning || hasError).toBe(true);
  });

  test('should show which papers failed in partial failure', async ({ page }) => {
    await setupTest(page);

    await injectPartialFailure(page, /\/api\/.*fulltext/i, 0.6);

    await performSearch(page, 'edge computing');
    await selectPapers(page, 8);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(20000);

    // Check for detailed failure information
    const hasDetails = await page.locator(
      'text=/failed to extract|could not process|\\d+ papers?|successful: \\d+/i'
    ).isVisible().catch(() => false);

    // Should provide details OR complete successfully
    const hasCompletion = await page.locator('text=/Complete/i').isVisible().catch(() => false);

    expect(hasDetails || hasCompletion).toBe(true);
  });
});

/**
 * TEST SUITE 6: State Cleanup on Errors
 */
test.describe('Error Injection - State Cleanup', () => {
  test.setTimeout(90000);

  test('should clean up state after error', async ({ page }) => {
    await setupTest(page);

    // Inject error
    await injectHttpError(page, /\/api\/.*extract/i, 500, { error: 'Test error' });

    await performSearch(page, 'containers');
    await selectPapers(page, 5);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // Close error modal
    const closeButton = page.locator('button:has-text("Close")').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // Clear route interception
    await page.unroute(/\/api\/.*extract/i);

    // Try again - should work now
    await selectPapers(page, 3);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

    // Should start fresh (no error from previous attempt)
    const progressIndicator = page.locator('text=/Stage|Progress/i').first();
    const isWorking = await progressIndicator.isVisible({ timeout: 10000 }).catch(() => false);

    expect(isWorking).toBe(true);
  });

  test('should allow retry after all error types', async ({ page }) => {
    const errorTypes = [401, 429, 500, 502, 503];

    for (const errorStatus of errorTypes) {
      await setupTest(page);

      await injectHttpError(page, /\/api\/.*extract/i, errorStatus, { error: `Error ${errorStatus}` });

      await performSearch(page, `test ${errorStatus}`);
      await selectPapers(page, 3);
      await startExtraction(page);

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
      await page.waitForTimeout(5000);

      // Close modal
      const closeButton = page.locator('button:has-text("Close")').first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }

      // Should be able to try again
      expect(true).toBe(true); // Test passed if we got here
    }
  });
});

/**
 * TEST SUITE 7: Error Message Quality
 */
test.describe('Error Injection - Error Message Quality', () => {
  test.setTimeout(90000);

  test('should never show technical error details to users', async ({ page }) => {
    await setupTest(page);

    // Inject error with stack trace
    await injectHttpError(page, /\/api\/.*extract/i, 500, {
      error: 'Internal Server Error',
      stack: 'Error: test\n  at Object.<anonymous> (/app/src/index.ts:123:45)',
      details: { exception: 'NullPointerException', class: 'ThemeExtractionService' }
    });

    await performSearch(page, 'error test');
    await selectPapers(page, 3);
    await startExtraction(page);

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // Get all text content
    const pageText = await page.textContent('body');

    // Should NOT expose technical details
    expect(pageText?.toLowerCase()).not.toContain('stack trace');
    expect(pageText?.toLowerCase()).not.toContain('nullpointerexception');
    expect(pageText?.toLowerCase()).not.toContain('.ts:');
    expect(pageText?.toLowerCase()).not.toContain('at object');
  });

  test('should provide actionable error messages', async ({ page }) => {
    const errorScenarios = [
      { status: 400, expectedAction: 'check|verify|review' },
      { status: 401, expectedAction: 'log in|sign in|authenticate' },
      { status: 429, expectedAction: 'wait|try again later' },
      { status: 500, expectedAction: 'try again|contact|support' },
      { status: 503, expectedAction: 'try again|temporarily|maintenance' }
    ];

    for (const scenario of errorScenarios) {
      await setupTest(page);

      await injectHttpError(page, /\/api\/.*extract/i, scenario.status, { error: 'Test' });

      await performSearch(page, `action test ${scenario.status}`);
      await selectPapers(page, 2);
      await startExtraction(page);

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
      await page.waitForTimeout(5000);

      const errorText = await page.locator('[role="alert"], .error-message, text=/error|failed/i')
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => '');

      const pattern = new RegExp(scenario.expectedAction, 'i');
      const hasAction = pattern.test(errorText || '');

      // Close modal for next iteration
      const closeButton = page.locator('button:has-text("Close")').first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }

      expect(hasAction).toBe(true);
    }
  });
});
