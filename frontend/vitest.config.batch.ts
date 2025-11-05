import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Batch configuration for CI/CD environments to prevent resource exhaustion
export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
      ],
    },
    // Test batching configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        // Limit concurrent test files to prevent resource exhaustion
        maxThreads: 2,
        minThreads: 1,
        // Single thread per worker for stability
        singleThread: true,
      },
    },
    // Timeout configuration
    testTimeout: 30000, // 30 seconds per test
    hookTimeout: 30000, // 30 seconds for hooks
    // Memory management
    maxConcurrency: 2, // Max concurrent test suites
    // Test isolation
    isolate: true,
    // Retry configuration
    retry: 1, // Retry failed tests once
    // Reporter configuration for CI
    reporters: process.env.CI ? ['verbose', 'junit'] : ['verbose'],
    ...(process.env.CI
      ? {
          outputFile: {
            junit: './test-results/junit.xml',
          },
        }
      : {}),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
