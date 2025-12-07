/**
 * Phase 10.93 Day 6 - E2E Test Utilities
 *
 * Central export for all test utilities
 * Provides clean imports across test files
 *
 * @file frontend/e2e/test-utils/index.ts
 * @enterprise-grade Zero technical debt
 *
 * @example
 * import { navigateToLiteraturePage, TEST_TIMEOUTS, SELECTORS } from './test-utils';
 */

// Type definitions
export type {
  WindowWithMonitoring,
  RenderEvent,
  MemorySnapshot,
  ApiCall,
  PerformanceWithMemory,
  PerformanceMetrics,
  MemoryMetrics,
  TimingMetrics,
  ApiMetrics,
  NetworkRequest,
  TestConfig,
  TestCredentials,
} from './types';

// Configuration constants
export {
  TEST_TIMEOUTS,
  PERFORMANCE_THRESHOLDS,
  ENV_CONFIG,
  TEST_CREDENTIALS,
  TEST_DATA,
  SELECTORS,
  ERROR_MESSAGES,
} from './config';

// Helper functions
export {
  waitForElement,
  loginAsTestUser,
  navigateToLiteraturePage,
  searchPapers,
  selectPapers,
  startThemeExtraction,
  waitForExtractionComplete,
  checkForErrors,
} from './helpers';
