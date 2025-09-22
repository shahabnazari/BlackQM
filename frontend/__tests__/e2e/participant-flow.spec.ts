import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * World-class E2E Tests for Participant Flow
 * Comprehensive testing of the complete participant journey
 */

const TEST_SURVEY_ID = 'test-survey-001';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Participant Flow Journey', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: ['notifications'],
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Mock API responses
    await page.route('**/api/participant-flow/initialize', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentStage: 'NOT_STARTED',
          completedStages: [],
          stageData: {},
          lastActivity: new Date(),
          sessionId: 'test-session-001',
          participantId: 'test-participant-001',
          surveyId: TEST_SURVEY_ID,
          canProceed: true,
          requiredActions: ['start_screening'],
          progress: {
            percentage: 0,
            stagesCompleted: 0,
            totalStages: 5,
            estimatedTimeRemaining: 40
          },
          navigation: {
            nextStage: 'PRE_SCREENING',
            previousStage: null,
            canGoBack: false,
            canSkip: false
          },
          metadata: {
            startTime: new Date(),
            device: 'desktop',
            browser: 'Chrome',
            screenResolution: '1280x720',
            timezone: 'UTC',
            language: 'en'
          }
        })
      });
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  /**
   * Test 1: Complete Happy Path
   */
  test('should complete full participant journey successfully', async () => {
    // Start journey
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    await expect(page).toHaveTitle(/Study/);
    
    // Check progress tracker is visible
    await expect(page.locator('[data-testid="progress-tracker"]')).toBeVisible();
    await expect(page.locator('text=0% Complete')).toBeVisible();

    // Stage 1: Pre-screening
    await page.click('text=Begin Study');
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/pre-screening`);
    
    // Complete screening questions
    await page.fill('[data-testid="screening-q1"]', '25');
    await page.click('[data-testid="screening-q2-yes"]');
    await page.fill('[data-testid="screening-q3"]', 'United States');
    await page.click('button:has-text("Submit Screening")');
    
    // Verify qualification passed
    await expect(page.locator('text=You qualify for this study')).toBeVisible();
    await expect(page.locator('text=20% Complete')).toBeVisible();
    
    // Stage 2: Consent
    await page.click('button:has-text("Continue to Consent")');
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/consent`);
    
    // Review and accept consent
    await page.check('[data-testid="consent-checkbox"]');
    await page.fill('[data-testid="consent-signature"]', 'Test Participant');
    await page.click('button:has-text("I Agree")');
    
    await expect(page.locator('text=40% Complete')).toBeVisible();
    
    // Stage 3: Instructions
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/instructions`);
    await page.click('button:has-text("I Understand")');
    
    await expect(page.locator('text=60% Complete')).toBeVisible();
    
    // Stage 4: Q-Sort
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/q-sort`);
    
    // Perform Q-sort (simplified for test)
    await dragAndDropStatements(page);
    await page.click('button:has-text("Submit Q-Sort")');
    
    await expect(page.locator('text=80% Complete')).toBeVisible();
    
    // Stage 5: Post-survey
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/post-survey`);
    
    // Complete post-survey
    await page.fill('[data-testid="demographic-age"]', '25-34');
    await page.fill('[data-testid="demographic-education"]', 'Bachelor\'s');
    await page.fill('[data-testid="experience-feedback"]', 'Great experience!');
    await page.click('button:has-text("Submit Survey")');
    
    // Verify completion
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/thank-you`);
    await expect(page.locator('text=100% Complete')).toBeVisible();
    await expect(page.locator('text=Thank you for participating')).toBeVisible();
  });

  /**
   * Test 2: Pre-screening Failure Path
   */
  test('should handle pre-screening failure correctly', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/pre-screening`);
    
    // Fail screening intentionally
    await page.fill('[data-testid="screening-q1"]', '16'); // Under age
    await page.click('[data-testid="screening-q2-no"]');
    await page.click('button:has-text("Submit Screening")');
    
    // Should redirect to disqualified page
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/disqualified`);
    await expect(page.locator('text=Unfortunately, you don\'t qualify')).toBeVisible();
    await expect(page.locator('text=Alternative studies')).toBeVisible();
  });

  /**
   * Test 3: Save and Resume Functionality
   */
  test('should save and resume progress correctly', async () => {
    // Start study and complete pre-screening
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    await page.click('text=Begin Study');
    
    // Complete pre-screening
    await completePreScreening(page);
    
    // Save progress at consent stage
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/consent`);
    await page.click('button:has-text("Save & Continue Later")');
    
    // Verify save confirmation
    await expect(page.locator('text=Progress saved')).toBeVisible();
    
    // Store session data
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem(`flow_savepoint_${TEST_SURVEY_ID}`);
    });
    expect(sessionData).toBeTruthy();
    
    // Simulate returning later
    await page.reload();
    
    // Check for resume prompt
    await expect(page.locator('text=Continue where you left off?')).toBeVisible();
    await page.click('button:has-text("Resume")');
    
    // Should be back at consent stage
    await expect(page).toHaveURL(`${BASE_URL}/study/${TEST_SURVEY_ID}/consent`);
    await expect(page.locator('text=40% Complete')).toBeVisible();
  });

  /**
   * Test 4: Navigation Guards
   */
  test('should enforce navigation guards and prevent invalid navigation', async () => {
    // Try to access Q-sort directly without completing prerequisites
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/q-sort`);
    
    // Should be redirected to welcome
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/welcome`);
    await expect(page.locator('text=Please complete previous steps first')).toBeVisible();
    
    // Complete pre-screening
    await page.click('text=Begin Study');
    await completePreScreening(page);
    
    // Try to go back to pre-screening (not allowed)
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/consent`);
    await page.goBack();
    
    // Should stay on consent page
    await expect(page).toHaveURL(`${BASE_URL}/study/${TEST_SURVEY_ID}/consent`);
    await expect(page.locator('text=Cannot revisit screening')).toBeVisible();
  });

  /**
   * Test 5: Progress Tracking and Time Estimates
   */
  test('should track progress and show time estimates', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Check initial progress
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('style', /width: 0%/);
    await expect(page.locator('text=~40 min remaining')).toBeVisible();
    
    // Complete pre-screening
    await page.click('text=Begin Study');
    await completePreScreening(page);
    
    // Check updated progress
    await expect(progressBar).toHaveAttribute('style', /width: 20%/);
    await expect(page.locator('text=~35 min remaining')).toBeVisible();
    
    // Complete consent
    await completeConsent(page);
    
    // Check further progress
    await expect(progressBar).toHaveAttribute('style', /width: 40%/);
    await expect(page.locator('text=~33 min remaining')).toBeVisible();
  });

  /**
   * Test 6: Mobile Responsiveness
   */
  test('should work correctly on mobile devices', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Check mobile navigation is visible
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Check minimal progress tracker
    await expect(page.locator('[data-testid="progress-tracker-minimal"]')).toBeVisible();
    
    // Navigate through study on mobile
    await page.click('text=Begin Study');
    await completePreScreening(page);
    
    // Check mobile navigation controls
    const mobileNext = page.locator('[data-testid="mobile-next-button"]');
    const mobileBack = page.locator('[data-testid="mobile-back-button"]');
    
    await expect(mobileNext).toBeVisible();
    await expect(mobileBack).toBeDisabled(); // Can't go back to screening
  });

  /**
   * Test 7: Auto-save Functionality
   */
  test('should auto-save progress periodically', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    await page.click('text=Begin Study');
    await completePreScreening(page);
    
    // Wait for consent page
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/consent`);
    
    // Fill partial consent form
    await page.check('[data-testid="consent-checkbox"]');
    
    // Wait for auto-save (mocked to 5 seconds for testing)
    await page.waitForTimeout(5000);
    
    // Check for auto-save indicator
    await expect(page.locator('text=Saved just now')).toBeVisible();
    
    // Verify data was saved
    const savedData = await page.evaluate(() => {
      return sessionStorage.getItem('auto-save-data');
    });
    expect(savedData).toContain('consent-checkbox');
  });

  /**
   * Test 8: Skip Logic
   */
  test('should handle skip logic correctly', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    await page.click('text=Begin Study');
    await completePreScreening(page);
    await completeConsent(page);
    
    // Instructions page should allow skip
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/instructions`);
    const skipButton = page.locator('button:has-text("Skip")');
    
    await expect(skipButton).toBeVisible();
    await skipButton.click();
    
    // Confirm skip dialog
    await page.click('button:has-text("Yes, Skip")');
    
    // Should proceed to Q-sort
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/q-sort`);
    await expect(page.locator('text=60% Complete')).toBeVisible();
  });

  /**
   * Test 9: Session Timeout Warning
   */
  test('should warn about session timeout', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Mock time passage
    await page.evaluate(() => {
      window.dispatchEvent(new Event('inactive'));
    });
    
    // Wait for warning after 30 minutes of inactivity
    await page.waitForTimeout(1000);
    
    await expect(page.locator('text=Your session will expire soon')).toBeVisible();
    
    // Activity should reset timer
    await page.click('body');
    await expect(page.locator('text=Your session will expire soon')).not.toBeVisible();
  });

  /**
   * Test 10: Abandonment and Recovery
   */
  test('should handle flow abandonment and recovery', async () => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    await page.click('text=Begin Study');
    await completePreScreening(page);
    
    // Attempt to leave
    await page.locator('[data-testid="exit-button"]').click();
    
    // Confirm abandonment
    await expect(page.locator('text=Your progress will be saved')).toBeVisible();
    await page.click('button:has-text("Leave Study")');
    
    // Should redirect to abandoned page
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/abandoned`);
    await expect(page.locator('text=You can resume later')).toBeVisible();
    
    // Check recovery email option
    await page.fill('[data-testid="recovery-email"]', 'test@example.com');
    await page.click('button:has-text("Send Recovery Link")');
    
    await expect(page.locator('text=Recovery link sent')).toBeVisible();
  });
});

/**
 * Helper Functions
 */

async function completePreScreening(page: Page) {
  await page.fill('[data-testid="screening-q1"]', '25');
  await page.click('[data-testid="screening-q2-yes"]');
  await page.fill('[data-testid="screening-q3"]', 'United States');
  await page.click('button:has-text("Submit Screening")');
  await page.waitForTimeout(500); // Wait for transition
}

async function completeConsent(page: Page) {
  await page.check('[data-testid="consent-checkbox"]');
  await page.fill('[data-testid="consent-signature"]', 'Test Participant');
  await page.click('button:has-text("I Agree")');
  await page.waitForTimeout(500); // Wait for transition
}

async function dragAndDropStatements(page: Page) {
  // Simplified Q-sort interaction for testing
  const statements = await page.locator('[data-testid^="statement-"]').all();
  const gridCells = await page.locator('[data-testid^="grid-cell-"]').all();
  
  // Drag first few statements to grid
  for (let i = 0; i < Math.min(5, statements.length); i++) {
    await statements[i].dragTo(gridCells[i]);
  }
}

/**
 * Performance Tests
 */
test.describe('Performance', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });

  test('should handle concurrent saves without data loss', async ({ page }) => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Trigger multiple save operations
    const savePromises = [];
    for (let i = 0; i < 5; i++) {
      savePromises.push(
        page.evaluate(() => {
          return fetch('/api/participant-flow/save', {
            method: 'POST',
            body: JSON.stringify({ data: { test: Math.random() } })
          });
        })
      );
    }
    
    const results = await Promise.all(savePromises);
    expect(results.every(r => r.ok)).toBe(true);
  });
});

/**
 * Accessibility Tests
 */
test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Begin Study")')).toBeFocused();
    
    // Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForURL(`**/study/${TEST_SURVEY_ID}/pre-screening`);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/study/${TEST_SURVEY_ID}/welcome`);
    
    // Check progress tracker
    const progressTracker = page.locator('[role="progressbar"]');
    await expect(progressTracker).toHaveAttribute('aria-label', /Progress/);
    await expect(progressTracker).toHaveAttribute('aria-valuenow', '0');
    await expect(progressTracker).toHaveAttribute('aria-valuemax', '100');
    
    // Check navigation buttons
    const nextButton = page.locator('button:has-text("Begin Study")');
    await expect(nextButton).toHaveAttribute('aria-label', /Begin study/);
  });
});