/**
 * Phase 10.93 Day 6 - E2E Test Configuration
 *
 * Centralized configuration for E2E tests
 * Eliminates magic numbers and provides clear documentation
 *
 * @file frontend/e2e/test-utils/config.ts
 * @enterprise-grade DRY principle, defensive programming
 */

/**
 * Test timeouts configuration
 * All values based on production performance measurements
 */
export const TEST_TIMEOUTS = {
  /** Default timeout for simple operations (e.g., click, fill) */
  DEFAULT: 30 * 1000, // 30 seconds

  /** Timeout for complex workflows with multiple API calls */
  WORKFLOW: 60 * 1000, // 60 seconds

  /** Timeout for large batch processing (20+ papers) */
  LARGE_BATCH: 90 * 1000, // 90 seconds

  /** Extended timeout for very slow operations */
  EXTENDED: 120 * 1000, // 2 minutes

  /** Small delay between UI interactions (allows React state updates) */
  UI_INTERACTION_DELAY: 200, // 200ms

  /** Timeout for API responses */
  API_RESPONSE: 30 * 1000, // 30 seconds

  /** Timeout for page navigation */
  NAVIGATION: 30 * 1000, // 30 seconds

  /** Timeout for element visibility */
  ELEMENT_VISIBLE: 10 * 1000, // 10 seconds

  /** Short delay for animations to complete */
  ANIMATION_DELAY: 300, // 300ms

  /** Debounce delay for search inputs */
  SEARCH_DEBOUNCE: 500, // 500ms
} as const;

/**
 * Performance test thresholds
 * Based on production performance requirements
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Maximum re-renders during theme extraction workflow */
  MAX_RENDER_COUNT: 10,

  /** Maximum workflow completion time for 10 papers (milliseconds) */
  MAX_WORKFLOW_TIME: 30 * 1000, // 30 seconds

  /** Maximum memory increase allowed (bytes) */
  MAX_MEMORY_INCREASE: 50 * 1024 * 1024, // 50MB

  /** Maximum API calls for 10 papers */
  MAX_API_CALLS: 50,

  /** Maximum total page load time (milliseconds) */
  MAX_TOTAL_LOAD_TIME: 5 * 1000, // 5 seconds

  /** Maximum DOM content loaded time (milliseconds) */
  MAX_DOM_LOAD_TIME: 3 * 1000, // 3 seconds

  /** Maximum render rate (renders per second) */
  MAX_RENDER_RATE: 2, // 2 renders/second

  /** Maximum parallel API requests */
  MAX_PARALLEL_REQUESTS: 10,

  /** Minimum parallel API requests (for batching verification) */
  MIN_PARALLEL_REQUESTS: 2,
} as const;

/**
 * Environment configuration
 */
export const ENV_CONFIG = {
  /** Base URL for application */
  BASE_URL: process.env['BASE_URL'] || 'http://localhost:3000',

  /** Backend API URL */
  API_URL: process.env['API_URL'] || 'http://localhost:4000',

  /** Test environment name */
  ENVIRONMENT: process.env['NODE_ENV'] || 'test',

  /** CI/CD mode flag */
  IS_CI: !!process.env['CI'],
} as const;

/**
 * Test user credentials from environment variables
 * NEVER hardcode credentials in source code
 */
export const TEST_CREDENTIALS = {
  /** Test user email (from environment or safe default) */
  EMAIL: process.env['TEST_USER_EMAIL'] || 'test@example.local',

  /** Test user password (from environment or safe default) */
  PASSWORD: process.env['TEST_USER_PASSWORD'] || 'testpass123',
} as const;

/**
 * Test data configuration
 */
export const TEST_DATA = {
  /** Test search queries */
  QUERIES: {
    MACHINE_LEARNING: 'machine learning',
    DATA_SCIENCE: 'data science',
    NEURAL_NETWORKS: 'neural networks',
    QUANTUM_COMPUTING: 'quantum computing',
    ARTIFICIAL_INTELLIGENCE: 'artificial intelligence',
    SOFTWARE_TESTING: 'software testing',
    CLOUD_COMPUTING: 'cloud computing',
    BLOCKCHAIN: 'blockchain',
    CYBERSECURITY: 'cybersecurity',
    IoT: 'IoT',
  },

  /** Test paper counts */
  PAPER_COUNTS: {
    /** Minimum viable count for theme extraction */
    MINIMUM: 3,

    /** Small batch for quick tests */
    SMALL: 5,

    /** Medium batch for standard tests */
    MEDIUM: 10,

    /** Large batch for performance tests */
    LARGE: 25,

    /** Extra large batch for stress tests */
    EXTRA_LARGE: 50,
  },
} as const;

/**
 * Selector patterns
 * Centralized selectors for maintainability
 */
export const SELECTORS = {
  /** Page elements */
  PAGE: {
    MAIN: 'main',
    ERROR_HEADING: 'h1:has-text("500"), h1:has-text("404")',
  },

  /** Search elements */
  SEARCH: {
    INPUT: 'input[placeholder*="search" i], input[type="search"]',
    BUTTON: 'button:has-text("Search")',
  },

  /** Paper elements */
  PAPER: {
    CARD: '[data-testid="paper-card"], .paper-card, article',
    SELECTION_BUTTON: 'button[aria-label*="Select paper" i], input[type="checkbox"][aria-label*="paper" i]',
  },

  /** Theme extraction elements */
  EXTRACTION: {
    BUTTON: 'button:has-text("Extract Themes"), button:has-text("Start Extraction")',
    MODAL: '[role="dialog"], .modal',
    COMPLETE_MESSAGE: 'text=/Extraction Complete|Theme extraction completed|Success/i',
    ERROR_MESSAGE: '[role="alert"], .error-message, text=/error|failed|something went wrong/i',
    CANCEL_BUTTON: 'button:has-text("Cancel"), button:has-text("Stop")',
  },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NAVIGATION_FAILED: (url: string) => `Failed to navigate to ${url}`,
  SEARCH_FAILED: (query: string) => `Failed to search for papers with query "${query}"`,
  NO_PAPERS_FOUND: 'No papers available to select',
  EXTRACTION_FAILED: 'Theme extraction failed',
  ELEMENT_NOT_FOUND: (selector: string) => `Element not found: ${selector}`,
} as const;
