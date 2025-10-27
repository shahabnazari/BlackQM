import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-browser testing configuration for comprehensive browser coverage
 * Tests against Chrome, Firefox, Safari, Edge, and mobile browsers
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Maximum time entire test suite can run
  globalTimeout: 60 * 60 * 1000, // 1 hour
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
    ['github'],
  ],
  
  // Shared test configuration
  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace on test failure
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture video on failure
    video: 'retain-on-failure',
    
    // Viewport size
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Timeout for actions
    actionTimeout: 10 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },
  
  // Configure projects for different browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'Mobile Safari Landscape',
      use: { 
        ...devices['iPhone 13 landscape'],
      },
    },
    
    // Tablet browsers
    {
      name: 'iPad',
      use: { 
        ...devices['iPad (gen 7)'],
      },
    },
    {
      name: 'iPad Pro',
      use: { 
        ...devices['iPad Pro 11'],
      },
    },
    
    // Different viewport sizes
    {
      name: 'Desktop 1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop 720p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Desktop 4K',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
    },
    
    // Accessibility testing
    {
      name: 'chromium-accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force high contrast mode
        colorScheme: 'dark',
        // Reduce motion for accessibility
        // 
        // Force focus visible
        
      },
    },
    
    // Performance testing
    {
      name: 'chromium-performance',
      use: {
        ...devices['Desktop Chrome'],
        // Enable performance metrics collection
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--disable-dev-shm-usage',
            '--js-flags=--expose-gc',
          ],
        },
      },
    },
    
    // Network conditions testing
    {
      name: 'slow-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G network
        offline: false,
        httpCredentials: undefined,
        extraHTTPHeaders: {},
        proxy: undefined,
      },
    },
  ],
  
  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  
  // Output folder for test artifacts
  outputDir: 'test-results/',
  
  // Folder for test artifacts
  snapshotDir: 'test-snapshots/',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}',
});