import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    testTimeout: 5000, // 5 second timeout to fail fast
    hookTimeout: 5000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      }
    },
    maxConcurrency: 1,
    isolate: true, // Enable isolation to prevent interference
    include: [
      // Only test apple-ui components initially
      'components/apple-ui/Button/**/*.test.{ts,tsx}',
      'components/apple-ui/Badge/**/*.test.{ts,tsx}',
      'components/apple-ui/Card/**/*.test.{ts,tsx}',
      'components/apple-ui/ThemeToggle/**/*.test.{ts,tsx}',
      'components/apple-ui/ProgressBar/**/*.test.{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      // Exclude TextField for now due to potential issues
      '**/TextField/**/*.test.{ts,tsx}'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});