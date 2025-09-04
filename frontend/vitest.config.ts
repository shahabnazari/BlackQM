/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    testTimeout: 10000,  // Reduced from 30000 to fail faster
    hookTimeout: 10000,  // Reduced from 30000 to fail faster
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      }
    },
    maxConcurrency: 1,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/e2e/**',
      '**/*.spec.ts',
      '**/backend/**',
      '**/.next/**',
    ],
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'components/apple-ui/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.next/**',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './components/apple-ui/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
