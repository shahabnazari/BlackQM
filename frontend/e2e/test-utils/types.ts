/**
 * Phase 10.93 Day 6 - E2E Test Type Definitions
 *
 * Shared TypeScript interfaces and types for E2E tests
 * Eliminates use of `any` type throughout test suite
 *
 * @file frontend/e2e/test-utils/types.ts
 * @enterprise-grade Zero technical debt, full type safety
 */

/**
 * Extended Window interface with performance monitoring properties
 */
export interface WindowWithMonitoring extends Window {
  __renderCount?: number;
  __renders?: RenderEvent[];
  __memorySnapshots?: MemorySnapshot[];
  __apiCalls?: ApiCall[];
  __eventListenerCount?: number;
  gc?: () => void;
}

/**
 * Render event tracking
 */
export interface RenderEvent {
  timestamp: number;
  message: string;
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * API call tracking
 */
export interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
}

/**
 * Performance interface with memory extension
 */
export interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Performance metrics collection
 */
export interface PerformanceMetrics {
  renderCount: number;
  memoryUsage: MemoryMetrics;
  timing: TimingMetrics;
  apiCalls: ApiMetrics;
  networkRequests: NetworkRequest[];
}

/**
 * Memory usage metrics
 */
export interface MemoryMetrics {
  initial: number;
  peak: number;
  final: number;
  leaked: number;
}

/**
 * Timing metrics
 */
export interface TimingMetrics {
  start: number;
  end: number;
  duration: number;
}

/**
 * API call metrics
 */
export interface ApiMetrics {
  total: number;
  duplicates: number;
  byEndpoint: Record<string, number>;
}

/**
 * Network request tracking
 */
export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
}

/**
 * Test configuration
 */
export interface TestConfig {
  baseUrl: string;
  testTimeout: number;
  apiTimeout: number;
  navigationTimeout: number;
}

/**
 * Test user credentials
 */
export interface TestCredentials {
  email: string;
  password: string;
}
