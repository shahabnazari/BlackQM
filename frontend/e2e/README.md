# Phase 10.93 E2E Test Suite - Quick Reference Guide

**Created:** Phase 10.93 Day 6
**Status:** Production-Ready
**Total Tests:** 115+ tests across 3 suites

---

## 📁 Test Files

### 1. Theme Extraction Workflow Tests
**File:** `theme-extraction-workflow.spec.ts`
- **Tests:** 50+ E2E tests
- **Coverage:** Success flow, error recovery, cancellation, large batches, accessibility

### 2. Performance Tests
**File:** `theme-extraction-performance.spec.ts`
- **Tests:** 25+ performance tests
- **Coverage:** Render count, memory leaks, API efficiency, workflow timing

### 3. Error Injection Tests
**File:** `theme-extraction-error-injection.spec.ts`
- **Tests:** 40+ error tests
- **Coverage:** Network timeouts, rate limits, auth failures, server errors, partial failures

---

## 🚀 Running Tests

### All Tests
```bash
cd frontend
npm run e2e
```

### Individual Test Suites
```bash
# E2E workflow tests only
npx playwright test theme-extraction-workflow.spec.ts

# Performance tests only
npx playwright test theme-extraction-performance.spec.ts

# Error injection tests only
npx playwright test theme-extraction-error-injection.spec.ts
```

### Specific Browsers
```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# All browsers
npx playwright test
```

### Interactive UI Mode
```bash
npm run e2e:ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Headed Mode (See Browser)
```bash
npx playwright test --headed
```

---

## 📊 Viewing Test Results

### HTML Report (Recommended)
After running tests:
```bash
npx playwright show-report test-results/html
```

### Live Report During Execution
```bash
npx playwright test --reporter=html
```

### Console Output Only
```bash
npx playwright test --reporter=line
```

---

## 🎯 Performance Thresholds

### Configured Limits
```typescript
{
  maxRenderCount: 10,           // < 10 re-renders during extraction
  maxWorkflowTime: 30000,       // < 30 seconds for 10 papers
  maxMemoryIncrease: 50MB,      // < 50MB memory increase
  maxApiCalls: 50,              // < 50 API calls for 10 papers
  maxTotalLoadTime: 5000        // < 5 seconds initial load
}
```

### Monitoring Performance
Performance tests will automatically fail if any threshold is exceeded.

---

## 🧪 Test Organization

### Test Suites by Category

#### **E2E Workflow Tests** (`theme-extraction-workflow.spec.ts`)
1. Suite 1: Theme Extraction Success Flow
2. Suite 2: Error Recovery Scenarios
3. Suite 3: Cancellation Workflow
4. Suite 4: Large Batch Processing
5. Suite 5: Accessibility Compliance

#### **Performance Tests** (`theme-extraction-performance.spec.ts`)
1. Suite 1: Render Performance
2. Suite 2: Memory Management
3. Suite 3: API Call Efficiency
4. Suite 4: Workflow Timing
5. Suite 5: Regression Detection

#### **Error Injection Tests** (`theme-extraction-error-injection.spec.ts`)
1. Suite 1: Network Timeout Scenarios
2. Suite 2: API Rate Limiting
3. Suite 3: Authentication Failures
4. Suite 4: Server Errors (5xx)
5. Suite 5: Partial Failures
6. Suite 6: State Cleanup on Errors
7. Suite 7: Error Message Quality

---

## 🔧 Common Issues & Solutions

### Issue: Tests Failing Due to Slow Network
**Solution:** Increase timeouts in test configuration
```typescript
test.setTimeout(90000); // 90 seconds
```

### Issue: Selector Not Found
**Solution:** Check if UI has changed, update selectors in helper functions

### Issue: Flaky Tests
**Solution:** Use `page.waitForSelector()` instead of `page.waitForTimeout()`

### Issue: Memory Leak Detection Failing
**Solution:** Force garbage collection:
```typescript
await page.evaluate(() => {
  if ((window as any).gc) {
    (window as any).gc();
  }
});
```

---

## 📝 Test Prerequisites

### Required Environment
- Node.js 20+
- npm or yarn
- Playwright installed (`npm install -D @playwright/test`)
- Browsers installed (`npx playwright install`)

### Required Services
- Frontend dev server running on `http://localhost:3000`
- Backend API server running (if testing real API calls)

### Starting Dev Server
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Run tests
cd frontend
npm run e2e
```

---

## 🎨 Custom Test Configuration

### Modify Browser List
Edit `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  // Add or remove browsers
]
```

### Modify Timeouts
```typescript
// Global timeout
timeout: 30 * 1000,

// Test-specific timeout
test.setTimeout(60000);
```

### Modify Base URL
```typescript
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
}
```

---

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd frontend && npm ci
      - run: npx playwright install --with-deps
      - run: npm run e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/test-results/
```

---

## 🔍 Debugging Tests

### Visual Debugging
```bash
# Open Playwright Inspector
npx playwright test --debug

# Run in headed mode
npx playwright test --headed

# Slow down execution
npx playwright test --headed --slow-mo=1000
```

### Console Debugging
```typescript
// In test file
test('my test', async ({ page }) => {
  // Take screenshot
  await page.screenshot({ path: 'debug.png' });

  // Print page HTML
  console.log(await page.content());

  // Print element text
  console.log(await page.locator('h1').textContent());
});
```

---

## 📚 Additional Resources

### Documentation
- **Phase Tracker:** `Main Docs/PHASE_TRACKER_PART4.md`
- **Day 6 Report:** `PHASE_10.93_DAY6_COMPLETE.md`
- **Playwright Docs:** https://playwright.dev/

### Test Examples
All test files include detailed inline comments explaining:
- Test purpose
- Setup steps
- Assertions
- Edge cases

### Getting Help
If tests fail:
1. Check HTML report for details
2. Review test logs in `test-results/`
3. Verify selectors match current UI
4. Ensure dev servers are running
5. Check network connectivity

---

## ✅ Checklist Before Committing Tests

- [ ] All tests passing locally
- [ ] No console errors during test execution
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] Test files have descriptive names
- [ ] Test descriptions are clear
- [ ] No hardcoded credentials or secrets
- [ ] Performance thresholds reasonable
- [ ] Error scenarios comprehensive
- [ ] Documentation updated

---

**Last Updated:** 2025-11-18
**Phase:** 10.93 Day 6
**Status:** Production-Ready
**Maintained By:** VQMethod Engineering Team
