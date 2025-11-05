/**
 * Phase 10 Day 6: Jest Coverage Configuration
 *
 * Defines coverage thresholds and reporting for enterprise testing standards
 * Target: 75% coverage across all modules
 */

module.exports = {
  // Coverage collection settings
  collectCoverage: true,
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'backend/src/**/*.{ts,js}',
    'frontend/**/*.{ts,tsx,js,jsx}',
    // Exclude test files
    '!**/__tests__/**',
    '!**/*.spec.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    // Exclude configuration files
    '!**/*.config.{ts,js}',
    '!**/prisma/**',
    // Exclude type definitions
    '!**/*.d.ts',
  ],

  // Coverage reporters
  coverageReporters: [
    'text', // Console output
    'text-summary', // Summary in console
    'html', // HTML report
    'lcov', // For CI tools like Codecov
    'json', // JSON format
    'json-summary', // Summary JSON
  ],

  // Coverage thresholds (Phase 1 target: 40%, Phase 2: 60%, Phase 3: 75%)
  coverageThresholds: {
    global: {
      statements: 40, // Current: 21%, Target: 75%
      branches: 35, // Current: 14%, Target: 70%
      functions: 40, // Current: 22%, Target: 75%
      lines: 40, // Current: 20%, Target: 75%
    },
    // Module-specific thresholds
    'backend/src/modules/analysis/**/*.ts': {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
    'backend/src/modules/report/**/*.ts': {
      statements: 30, // New module, lower threshold
      branches: 25,
      functions: 30,
      lines: 30,
    },
    'backend/src/modules/literature/**/*.ts': {
      statements: 35,
      branches: 30,
      functions: 35,
      lines: 35,
    },
    'frontend/components/**/*.{ts,tsx}': {
      statements: 60, // UI components should be well-tested
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },

  // Path mapping for module resolution
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.next/',
    '/test/',
    '/__tests__/',
    '/e2e/',
  ],

  // Display settings
  verbose: true,
  coverageReporters: ['text', 'lcov', 'html'],

  // Add badges to README
  coverageBadges: {
    enabled: true,
    outputFile: 'coverage/badges.svg',
  },
};

/**
 * USAGE:
 *
 * # Generate coverage report
 * npm run test:cov
 *
 * # View HTML report
 * open coverage/index.html (macOS)
 * start coverage/index.html (Windows)
 *
 * # CI Integration (GitHub Actions)
 * - uses: codecov/codecov-action@v4
 *   with:
 *     files: ./coverage/lcov.info
 *
 * COVERAGE IMPROVEMENT PLAN:
 *
 * Week 1-2: Fix 191 failing tests → 40% coverage
 * - Priority: Analysis module, Report module
 * - Add missing service unit tests
 * - Fix integration test failures
 *
 * Week 3-4: Add integration tests → 60% coverage
 * - E2E workflow tests
 * - Cross-module integration
 * - Error path coverage
 *
 * Week 5-6: Edge cases & polish → 75% coverage
 * - Edge case scenarios
 * - Performance tests
 * - Accessibility coverage
 */
