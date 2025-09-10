import { test, expect } from '@playwright/test';

test.describe('End-to-End Study Creation Test', () => {
  const testData = {
    title: `Test Study ${Date.now()}`,
    description: 'This is a comprehensive test study to verify the entire creation workflow',
    instructions: 'Please sort the following items according to your preference',
    stimuliText: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
    gridColumns: 5,
    gridRows: 3,
    columnLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    participantLimit: 50
  };

  test('Complete study creation workflow with data persistence', async ({ page }) => {
    console.log('Starting E2E Study Creation Test...');
    
    // Step 1: Navigate to study creation page
    await page.goto('http://localhost:3001/studies/create');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded correctly
    await expect(page.locator('h1')).toContainText('Create New Study');
    console.log('✓ Study creation page loaded successfully');

    // Step 2: Fill Basic Information
    console.log('Filling Basic Information...');
    await page.fill('input[name="title"]', testData.title);
    await page.fill('textarea[name="description"]', testData.description);
    await page.fill('textarea[name="instructions"]', testData.instructions);
    
    // Save Basic Information
    await page.click('button:has-text("Save Basic Information")');
    await page.waitForTimeout(1000);
    console.log('✓ Basic Information filled and saved');

    // Step 3: Add Study Stimuli
    console.log('Adding Study Stimuli...');
    const stimuliSection = page.locator('[data-section="stimuli"]');
    
    for (const stimulus of testData.stimuliText) {
      await page.click('button:has-text("Add Text Stimulus")');
      const lastInput = page.locator('input[placeholder="Enter stimulus text"]').last();
      await lastInput.fill(stimulus);
      await page.waitForTimeout(500);
    }
    
    // Save Stimuli
    await page.click('button:has-text("Save Stimuli")');
    await page.waitForTimeout(1000);
    console.log(`✓ Added ${testData.stimuliText.length} stimuli`);

    // Step 4: Configure Grid Settings
    console.log('Configuring Grid Settings...');
    await page.fill('input[name="gridColumns"]', testData.gridColumns.toString());
    await page.fill('input[name="gridRows"]', testData.gridRows.toString());
    
    // Add column labels
    for (let i = 0; i < testData.columnLabels.length; i++) {
      const labelInput = page.locator(`input[name="columnLabel${i}"]`);
      await labelInput.fill(testData.columnLabels[i]);
    }
    
    // Save Grid Settings
    await page.click('button:has-text("Save Grid Settings")');
    await page.waitForTimeout(1000);
    console.log('✓ Grid settings configured');

    // Step 5: Configure Advanced Settings
    console.log('Configuring Advanced Settings...');
    await page.fill('input[name="participantLimit"]', testData.participantLimit.toString());
    await page.check('input[name="allowAnonymous"]');
    await page.check('input[name="randomizeStimuli"]');
    
    // Save Advanced Settings
    await page.click('button:has-text("Save Advanced Settings")');
    await page.waitForTimeout(1000);
    console.log('✓ Advanced settings configured');

    // Step 6: Test Data Persistence - Refresh Page
    console.log('Testing data persistence after page refresh...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify Basic Information persisted
    await expect(page.locator('input[name="title"]')).toHaveValue(testData.title);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(testData.description);
    await expect(page.locator('textarea[name="instructions"]')).toHaveValue(testData.instructions);
    console.log('✓ Basic Information persisted after refresh');
    
    // Verify Stimuli persisted
    const stimuliInputs = await page.locator('input[placeholder="Enter stimulus text"]').all();
    expect(stimuliInputs.length).toBe(testData.stimuliText.length);
    for (let i = 0; i < testData.stimuliText.length; i++) {
      await expect(stimuliInputs[i]).toHaveValue(testData.stimuliText[i]);
    }
    console.log('✓ Stimuli persisted after refresh');
    
    // Verify Grid Settings persisted
    await expect(page.locator('input[name="gridColumns"]')).toHaveValue(testData.gridColumns.toString());
    await expect(page.locator('input[name="gridRows"]')).toHaveValue(testData.gridRows.toString());
    console.log('✓ Grid settings persisted after refresh');
    
    // Verify Advanced Settings persisted
    await expect(page.locator('input[name="participantLimit"]')).toHaveValue(testData.participantLimit.toString());
    await expect(page.locator('input[name="allowAnonymous"]')).toBeChecked();
    await expect(page.locator('input[name="randomizeStimuli"]')).toBeChecked();
    console.log('✓ Advanced settings persisted after refresh');

    // Step 7: Preview Study
    console.log('Testing study preview...');
    await page.click('button:has-text("Preview Study")');
    await page.waitForTimeout(2000);
    
    // Check preview modal opened
    const previewModal = page.locator('[role="dialog"]');
    await expect(previewModal).toBeVisible();
    await expect(previewModal).toContainText(testData.title);
    await expect(previewModal).toContainText(testData.description);
    
    // Close preview
    await page.click('button:has-text("Close Preview")');
    await page.waitForTimeout(500);
    console.log('✓ Study preview working correctly');

    // Step 8: Submit Study
    console.log('Submitting study...');
    await page.click('button:has-text("Create Study")');
    
    // Wait for validation and submission
    await page.waitForTimeout(2000);
    
    // Check for success message or redirect
    const successMessage = page.locator('.success-message, .toast-success');
    const dashboardUrl = page.url();
    
    if (await successMessage.isVisible()) {
      console.log('✓ Study created successfully - success message displayed');
    } else if (dashboardUrl.includes('/dashboard') || dashboardUrl.includes('/studies')) {
      console.log('✓ Study created successfully - redirected to dashboard');
    }

    // Step 9: Verify Study in Dashboard
    console.log('Verifying study appears in dashboard...');
    if (!dashboardUrl.includes('/dashboard') && !dashboardUrl.includes('/studies')) {
      await page.goto('http://localhost:3001/dashboard');
    }
    
    await page.waitForLoadState('networkidle');
    
    // Look for the created study
    const studyCard = page.locator(`text="${testData.title}"`);
    await expect(studyCard).toBeVisible({ timeout: 10000 });
    console.log('✓ Study appears in dashboard');

    // Step 10: Verify Study Details
    console.log('Verifying study details...');
    await studyCard.click();
    await page.waitForLoadState('networkidle');
    
    // Verify study details page
    await expect(page.locator('h1')).toContainText(testData.title);
    await expect(page.locator('text=' + testData.description)).toBeVisible();
    await expect(page.locator(`text=Participant Limit: ${testData.participantLimit}`)).toBeVisible();
    console.log('✓ Study details verified');

    console.log('\n========================================');
    console.log('END-TO-END STUDY CREATION TEST COMPLETE');
    console.log('========================================');
    console.log('All tests passed successfully!');
    console.log(`Study "${testData.title}" created and verified`);
  });

  test('Validation and error handling', async ({ page }) => {
    console.log('Testing validation and error handling...');
    
    await page.goto('http://localhost:3001/studies/create');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without required fields
    await page.click('button:has-text("Create Study")');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = page.locator('.error-message, .field-error, [role="alert"]');
    await expect(validationErrors.first()).toBeVisible();
    console.log('✓ Validation errors displayed for empty fields');
    
    // Test invalid grid dimensions
    await page.fill('input[name="title"]', 'Validation Test Study');
    await page.fill('input[name="gridColumns"]', '0');
    await page.fill('input[name="gridRows"]', '-1');
    
    await page.click('button:has-text("Save Grid Settings")');
    await page.waitForTimeout(1000);
    
    // Check for grid validation errors
    const gridErrors = page.locator('text=/invalid|must be|greater than/i');
    await expect(gridErrors.first()).toBeVisible();
    console.log('✓ Grid dimension validation working');
    
    // Test participant limit validation
    await page.fill('input[name="participantLimit"]', '0');
    await page.click('button:has-text("Save Advanced Settings")');
    await page.waitForTimeout(1000);
    
    const limitError = page.locator('text=/participant.*must be/i');
    await expect(limitError.first()).toBeVisible();
    console.log('✓ Participant limit validation working');
    
    console.log('✓ All validation tests passed');
  });
});