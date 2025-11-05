# VQMethod Testing Guide - Phase 10 Day 6

**Last Updated:** January 2025
**Status:** Enterprise Testing Infrastructure
**Current Coverage:** 21% (Target: 75%)

## Overview

VQMethod has comprehensive testing infrastructure across backend and frontend:

- **Backend:** Jest with 850 tests (659 passing, 191 to fix)
- **Frontend:** Vitest + React Testing Library + Playwright
- **Accessibility:** axe-core + WCAG 2.1 AA compliance
- **E2E:** Playwright with 12 browser/device configurations

---

## Quick Start

### Backend Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode (development)
npm run test:watch

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Integration tests
npm run test:integration

# Smoke tests
npm run test:smoke
```

### Frontend Testing

```bash
# Unit tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run e2e

# E2E with UI
npm run e2e:ui

# Type checking
npm run typecheck
```

### Accessibility Testing

```bash
# Frontend accessibility check
npm run a11y:check

# Watch for changes
npm run a11y:watch

# Run accessibility test suite
npm run a11y:test

# Lighthouse performance + a11y
npm run lighthouse
```

---

## Test Organization

### Backend Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── analysis/
│   │   │   ├── __tests__/
│   │   │   │   ├── *.integration.spec.ts  # Integration tests
│   │   │   │   ├── *.spec.ts              # Unit tests
│   │   │   │   ├── smoke/                 # Smoke tests
│   │   │   │   └── performance/           # Performance tests
│   │   │   ├── services/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── *.spec.ts          # Service unit tests
│   │   │   └── controllers/
│   │   │       └── *.spec.ts              # Controller tests
│   │   └── [other modules]...
│   └── app.controller.spec.ts
└── test/
    ├── e2e/                                # E2E tests
    │   ├── collaboration.e2e-spec.ts
    │   ├── literature-comprehensive.e2e-spec.ts
    │   └── literature-critical-path.e2e-spec.ts
    ├── integration/                        # Cross-module integration
    ├── manual/                             # Manual test scenarios
    ├── performance/                        # Load testing
    └── edge-cases/                         # Edge case validation
```

### Frontend Structure

```
frontend/
├── components/
│   ├── apple-ui/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── __tests__/
│   │   │       └── Button.test.tsx        # Component tests
│   │   └── [other components]...
│   └── [feature components]/
│       └── __tests__/
│           └── *.test.tsx                 # Feature component tests
├── e2e/
│   └── *.spec.ts                          # Playwright E2E tests
├── test/
│   ├── auth/
│   │   └── auth.test.tsx                  # Feature tests
│   └── phase5-comprehensive.test.tsx      # Integration tests
└── __tests__/                             # Global tests
```

---

## Writing Tests

### Backend Unit Test Example

```typescript
// backend/src/modules/analysis/services/__tests__/example.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from '../example.service';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExampleService],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should return expected result', async () => {
      const result = await service.methodName();
      expect(result).toEqual(expectedValue);
    });

    it('should handle errors gracefully', async () => {
      await expect(service.methodName()).rejects.toThrow();
    });
  });
});
```

### Frontend Component Test Example

```typescript
// frontend/components/example/__tests__/Example.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Example } from '../Example';

describe('Example Component', () => {
  it('renders correctly', () => {
    render(<Example />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<Example />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });

  it('meets accessibility requirements', () => {
    const { container } = render(<Example />);
    // Add jest-axe accessibility test
    // await expect(container).toHaveNoViolations();
  });
});
```

### E2E Test Example

```typescript
// frontend/e2e/example-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Example User Flow', () => {
  test('completes end-to-end workflow', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Wait for page to load
    await page.waitForSelector('[data-testid="main-content"]');

    // Interact with UI
    await page.click('[data-testid="start-button"]');

    // Assert expected outcome
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="error-trigger"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
```

### Accessibility Test Example

```typescript
// frontend/components/example/__tests__/Example.a11y.test.tsx

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Example } from '../Example';

expect.extend(toHaveNoViolations);

describe('Example Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(<Example />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    const { getByRole } = render(<Example />);
    const button = getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('has proper ARIA labels', () => {
    const { getByLabelText } = render(<Example />);
    expect(getByLabelText('Descriptive Label')).toBeInTheDocument();
  });
});
```

---

## Accessibility Testing (WCAG 2.1 AA)

### Required Standards

#### 1. **Keyboard Navigation**

- All interactive elements accessible via Tab/Shift+Tab
- Enter/Space to activate buttons/links
- Arrow keys for dropdown menus and sliders
- Escape to close modals/menus

**Test:**

```typescript
it('supports keyboard navigation', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  button.focus();
  expect(button).toHaveFocus();
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(onClickHandler).toHaveBeenCalled();
});
```

#### 2. **ARIA Labels**

- All dynamic content has aria-live regions
- Form inputs have aria-label or aria-labelledby
- Buttons have aria-label when text unclear
- aria-hidden for decorative elements

**Test:**

```typescript
it('has proper ARIA labels', () => {
  const { getByLabelText } = render(<Form />);
  expect(getByLabelText('Email Address')).toBeInTheDocument();
  expect(getByRole('button', { name: 'Submit Form' })).toBeInTheDocument();
});
```

#### 3. **Color Contrast**

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text (18pt+)
- Minimum 3:1 for UI components

**Test:**

```bash
# Automated check via axe-core
npm run a11y:check
```

#### 4. **Focus Indicators**

- Visible focus outline (at least 2px)
- High contrast focus indicator
- Not removed via CSS

**Test:**

```typescript
it('shows focus indicator', () => {
  const { getByRole } = render(<Button />);
  const button = getByRole('button');
  button.focus();
  expect(button).toHaveStyle('outline: 2px solid');
});
```

#### 5. **Screen Reader Support**

- Semantic HTML elements
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images
- aria-describedby for complex widgets

**Test:**

```bash
# Manual test with screen reader
# macOS: VoiceOver (Cmd+F5)
# Windows: NVDA or JAWS
```

---

## Coverage Targets

### Current Status (January 2025)

| Module            | Coverage | Target | Status |
| ----------------- | -------- | ------ | ------ |
| Overall           | 21%      | 75%    | 🔴     |
| app.controller    | 86%      | 80%    | ✅     |
| Analysis Module   | 35%      | 75%    | 🔴     |
| Literature Module | 15%      | 75%    | 🔴     |
| Report Module     | 5%       | 75%    | 🔴     |
| Auth Module       | 45%      | 80%    | 🔴     |

### Improvement Plan

**Phase 1: Critical Path (Weeks 1-2)** - Target 40%

- Fix 191 failing tests
- Add missing unit tests for new services (Days 5.8-5.17)
- Cover report generation critical path

**Phase 2: Integration (Weeks 3-4)** - Target 60%

- Add E2E tests for complete workflows
- Add integration tests for Phase 9 → Phase 10 pipeline
- Cover error handling paths

**Phase 3: Edge Cases (Weeks 5-6)** - Target 75%

- Add edge case tests
- Add performance regression tests
- Add accessibility test coverage

---

## Test Naming Conventions

### Backend (Jest)

```
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {});
    it('should throw error when [invalid condition]', () => {});
    it('should return [value] for [input]', () => {});
  });
});
```

### Frontend (Vitest)

```
describe('ComponentName', () => {
  it('renders correctly', () => {});
  it('handles [interaction]', () => {});
  it('displays error when [condition]', () => {});
  it('meets accessibility requirements', () => {});
});
```

### E2E (Playwright)

```
test.describe('Feature Name', () => {
  test('completes [workflow] successfully', async ({ page }) => {});
  test('handles [error case] gracefully', async ({ page }) => {});
});
```

---

## Continuous Integration

### Pre-commit Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests (fast)
npm run test
```

### CI Pipeline (GitHub Actions)

```yaml
# Example CI workflow
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:cov
      - run: npm run e2e
      - uses: codecov/codecov-action@v4
```

---

## Known Issues & Fix Plan

### Failing Tests (191 total)

**Priority 1: Service Tests (85 failures)**

- PDF queue service retry logic (3 tests)
- Theme extraction service timeouts (12 tests)
- OpenAI service rate limiting (8 tests)

**Priority 2: Integration Tests (56 failures)**

- Database connection issues in CI
- Missing test fixtures
- Async timing issues

**Priority 3: E2E Tests (50 failures)**

- Flaky tests due to network conditions
- Authentication state issues
- Browser-specific rendering differences

---

## Best Practices

### ✅ DO

- Write tests before fixing bugs (TDD)
- Mock external dependencies (APIs, databases)
- Use data-testid for E2E selectors
- Test user behavior, not implementation
- Run tests before committing
- Keep tests fast (<5s per suite)
- Test error paths, not just happy path

### ❌ DON'T

- Test implementation details
- Use CSS selectors in E2E tests (brittle)
- Skip accessibility tests
- Leave failing tests uncommitted
- Mock too much (test integration)
- Ignore flaky tests
- Test third-party libraries

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

---

## Support

**Questions?** Check the test files for examples:

- Backend: `backend/src/modules/*/tests/*.spec.ts`
- Frontend: `frontend/components/*/__tests__/*.test.tsx`
- E2E: `frontend/e2e/*.spec.ts`

**Need Help?** Review existing tests in the codebase - they contain extensive examples and patterns.
