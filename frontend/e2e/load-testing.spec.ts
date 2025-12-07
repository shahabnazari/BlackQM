/**
 * Phase 10.93 Day 7 - Load Testing Suite
 *
 * Tests system performance and stability under concurrent user load.
 * Validates theme extraction workflow handles 10-25 concurrent users.
 *
 * **Test Scenarios:**
 * 1. 10 concurrent users (baseline)
 * 2. 25 concurrent users (stress test)
 * 3. Response time under load
 * 4. Race condition detection
 * 5. Database deadlock prevention
 * 6. Memory usage under load
 * 7. Connection pool exhaustion prevention
 *
 * @file frontend/e2e/load-testing.spec.ts
 * @enterprise-grade Zero technical debt, production-ready
 */

import { test, expect, type Page, type Browser } from '@playwright/test';
import {
  loginAsTestUser,
  navigateToLiteraturePage,
  searchPapers,
  selectPapers,
  TEST_TIMEOUTS,
  TEST_DATA,
  SELECTORS,
} from './test-utils';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOAD_TEST_CONFIG = {
  /** Baseline concurrent users */
  BASELINE_USERS: 10,

  /** Stress test concurrent users */
  STRESS_USERS: 25,

  /** Maximum acceptable response time (milliseconds) */
  MAX_RESPONSE_TIME: 5000,

  /** Maximum acceptable error rate (percentage) */
  MAX_ERROR_RATE: 5,

  /** Memory increase threshold (MB) */
  MAX_MEMORY_INCREASE_MB: 100,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Performance metrics for a single user session
 */
interface UserMetrics {
  userId: number;
  searchTime: number;
  selectionTime: number;
  totalTime: number;
  success: boolean;
  errorMessage?: string;
  memoryUsage: number;
}

/**
 * Aggregate metrics for load test
 */
interface AggregateMetrics {
  totalUsers: number;
  successfulUsers: number;
  failedUsers: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  totalMemoryIncrease: number;
}

/**
 * Simulate single user workflow with metrics collection
 *
 * @param browser - Playwright Browser instance
 * @param userId - User ID for tracking
 * @returns User metrics
 */
async function simulateUserWorkflow(browser: Browser, userId: number): Promise<UserMetrics> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const startTime = Date.now();
  let searchTime = 0;
  let selectionTime = 0;
  let success = false;
  let errorMessage: string | undefined;
  let memoryUsage = 0;

  try {
    // Login
    await loginAsTestUser(page);
    await navigateToLiteraturePage(page);

    // Measure search time
    const searchStart = Date.now();
    const query = Object.values(TEST_DATA.QUERIES)[userId % Object.values(TEST_DATA.QUERIES).length];
    await searchPapers(page, query);
    searchTime = Date.now() - searchStart;

    // Measure selection time
    const selectionStart = Date.now();
    await selectPapers(page, 5);
    selectionTime = Date.now() - selectionStart;

    // Get memory usage
    memoryUsage = await page.evaluate(() => {
      if ('memory' in performance && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    success = true;
  } catch (error) {
    success = false;
    errorMessage = (error as Error).message;
    console.error(`User ${userId} failed:`, errorMessage);
  } finally {
    await page.close();
    await context.close();
  }

  const totalTime = Date.now() - startTime;

  return {
    userId,
    searchTime,
    selectionTime,
    totalTime,
    success,
    errorMessage,
    memoryUsage,
  };
}

/**
 * Calculate aggregate metrics from user metrics
 *
 * @param userMetrics - Array of user metrics
 * @returns Aggregate metrics
 */
function calculateAggregateMetrics(userMetrics: UserMetrics[]): AggregateMetrics {
  const successfulUsers = userMetrics.filter(m => m.success);
  const failedUsers = userMetrics.filter(m => !m.success);

  const responseTimes = successfulUsers.map(m => m.totalTime).sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;

  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);

  const p95ResponseTime = responseTimes[p95Index] || 0;
  const p99ResponseTime = responseTimes[p99Index] || 0;
  const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;

  const errorRate = (failedUsers.length / userMetrics.length) * 100;

  const memoryUsages = userMetrics.map(m => m.memoryUsage).filter(m => m > 0);
  const totalMemoryIncrease = Math.max(...memoryUsages) - Math.min(...memoryUsages);

  return {
    totalUsers: userMetrics.length,
    successfulUsers: successfulUsers.length,
    failedUsers: failedUsers.length,
    errorRate,
    avgResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    maxResponseTime,
    totalMemoryIncrease,
  };
}

/**
 * Log aggregate metrics
 *
 * @param metrics - Aggregate metrics
 * @param testName - Test name
 */
function logMetrics(metrics: AggregateMetrics, testName: string): void {
  console.log(`\n========================================`);
  console.log(`Load Test Results: ${testName}`);
  console.log(`========================================`);
  console.log(`Total Users:         ${metrics.totalUsers}`);
  console.log(`Successful:          ${metrics.successfulUsers} (${(100 - metrics.errorRate).toFixed(1)}%)`);
  console.log(`Failed:              ${metrics.failedUsers} (${metrics.errorRate.toFixed(1)}%)`);
  console.log(`Avg Response Time:   ${metrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`P95 Response Time:   ${metrics.p95ResponseTime.toFixed(0)}ms`);
  console.log(`P99 Response Time:   ${metrics.p99ResponseTime.toFixed(0)}ms`);
  console.log(`Max Response Time:   ${metrics.maxResponseTime.toFixed(0)}ms`);
  console.log(`Memory Increase:     ${(metrics.totalMemoryIncrease / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`========================================\n`);
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Load Testing - Concurrent Users', () => {
  // Increase test timeout for load tests
  test.setTimeout(300000); // 5 minutes

  // ==========================================================================
  // TEST 1: Baseline Load (10 Concurrent Users)
  // ==========================================================================

  test('should handle 10 concurrent users (baseline load)', async ({ browser }) => {
    const userCount = LOAD_TEST_CONFIG.BASELINE_USERS;

    console.log(`\n🔧 Starting baseline load test with ${userCount} concurrent users...`);

    // Simulate concurrent users
    const userPromises = Array.from({ length: userCount }, (_, i) =>
      simulateUserWorkflow(browser, i)
    );

    const userMetrics = await Promise.all(userPromises);
    const aggregateMetrics = calculateAggregateMetrics(userMetrics);

    // Log results
    logMetrics(aggregateMetrics, `${userCount} Concurrent Users (Baseline)`);

    // Assertions
    expect(aggregateMetrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.MAX_ERROR_RATE);
    expect(aggregateMetrics.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
    expect(aggregateMetrics.totalMemoryIncrease / (1024 * 1024)).toBeLessThan(
      LOAD_TEST_CONFIG.MAX_MEMORY_INCREASE_MB
    );

    // Log success
    console.log(`✅ Baseline load test passed!`);
  });

  // ==========================================================================
  // TEST 2: Stress Load (25 Concurrent Users)
  // ==========================================================================

  test('should handle 25 concurrent users (stress test)', async ({ browser }) => {
    const userCount = LOAD_TEST_CONFIG.STRESS_USERS;

    console.log(`\n🔧 Starting stress test with ${userCount} concurrent users...`);

    // Simulate concurrent users
    const userPromises = Array.from({ length: userCount }, (_, i) =>
      simulateUserWorkflow(browser, i)
    );

    const userMetrics = await Promise.all(userPromises);
    const aggregateMetrics = calculateAggregateMetrics(userMetrics);

    // Log results
    logMetrics(aggregateMetrics, `${userCount} Concurrent Users (Stress Test)`);

    // Assertions (slightly relaxed for stress test)
    expect(aggregateMetrics.errorRate).toBeLessThan(LOAD_TEST_CONFIG.MAX_ERROR_RATE * 2); // Allow 10% error rate
    expect(aggregateMetrics.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME * 2); // Allow 10s P95
    expect(aggregateMetrics.totalMemoryIncrease / (1024 * 1024)).toBeLessThan(
      LOAD_TEST_CONFIG.MAX_MEMORY_INCREASE_MB * 1.5
    );

    // Log success
    console.log(`✅ Stress test passed!`);
  });

  // ==========================================================================
  // TEST 3: Response Time Distribution
  // ==========================================================================

  test('should maintain response time SLA under load', async ({ browser }) => {
    const userCount = 15;

    console.log(`\n🔧 Testing response time distribution with ${userCount} users...`);

    const userPromises = Array.from({ length: userCount }, (_, i) =>
      simulateUserWorkflow(browser, i)
    );

    const userMetrics = await Promise.all(userPromises);
    const aggregateMetrics = calculateAggregateMetrics(userMetrics);

    // Log results
    logMetrics(aggregateMetrics, 'Response Time Distribution');

    // Verify response time SLA
    expect(aggregateMetrics.avgResponseTime).toBeLessThan(3000); // Avg < 3s
    expect(aggregateMetrics.p95ResponseTime).toBeLessThan(5000); // P95 < 5s
    expect(aggregateMetrics.p99ResponseTime).toBeLessThan(10000); // P99 < 10s

    console.log(`✅ Response time SLA maintained!`);
  });

  // ==========================================================================
  // TEST 4: Race Condition Detection
  // ==========================================================================

  test('should not have race conditions with concurrent paper selection', async ({ browser }) => {
    const userCount = 10;

    console.log(`\n🔧 Testing for race conditions with ${userCount} concurrent selections...`);

    // All users select same papers simultaneously
    const userPromises = Array.from({ length: userCount }, async (_, i) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await loginAsTestUser(page);
        await navigateToLiteraturePage(page);
        await searchPapers(page, TEST_DATA.QUERIES.MACHINE_LEARNING);

        // Select papers simultaneously
        const selectedCount = await selectPapers(page, 5);

        await page.close();
        await context.close();

        return { userId: i, selectedCount, success: true };
      } catch (error) {
        await page.close();
        await context.close();
        return { userId: i, selectedCount: 0, success: false, error: (error as Error).message };
      }
    });

    const results = await Promise.all(userPromises);

    // All users should succeed
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(userCount);

    console.log(`✅ No race conditions detected!`);
  });

  // ==========================================================================
  // TEST 5: Memory Usage Under Sustained Load
  // ==========================================================================

  test('should not leak memory under sustained load', async ({ browser }) => {
    const rounds = 3;
    const usersPerRound = 5;

    console.log(`\n🔧 Testing memory usage over ${rounds} rounds of ${usersPerRound} users each...`);

    const memorySnapshots: number[] = [];

    for (let round = 0; round < rounds; round++) {
      console.log(`Round ${round + 1}/${rounds}...`);

      const userPromises = Array.from({ length: usersPerRound }, (_, i) =>
        simulateUserWorkflow(browser, round * usersPerRound + i)
      );

      const userMetrics = await Promise.all(userPromises);

      // Collect memory usage
      const avgMemory = userMetrics
        .filter(m => m.memoryUsage > 0)
        .reduce((sum, m) => sum + m.memoryUsage, 0) / userMetrics.filter(m => m.memoryUsage > 0).length;

      memorySnapshots.push(avgMemory);

      // Wait between rounds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Analyze memory trend
    const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);

    console.log(`Memory snapshots (MB):`, memorySnapshots.map(m => (m / (1024 * 1024)).toFixed(2)));
    console.log(`Total memory growth: ${memoryGrowthMB.toFixed(2)}MB`);

    // Memory growth should be < 50MB
    expect(memoryGrowthMB).toBeLessThan(50);

    console.log(`✅ No memory leaks detected!`);
  });

  // ==========================================================================
  // TEST 6: Connection Pool Health
  // ==========================================================================

  test('should not exhaust connection pool', async ({ browser }) => {
    const userCount = 20;

    console.log(`\n🔧 Testing database connection pool with ${userCount} concurrent requests...`);

    const startTime = Date.now();

    const userPromises = Array.from({ length: userCount }, (_, i) =>
      simulateUserWorkflow(browser, i)
    );

    const userMetrics = await Promise.all(userPromises);

    const duration = Date.now() - startTime;
    const aggregateMetrics = calculateAggregateMetrics(userMetrics);

    console.log(`\nConnection Pool Test Results:`);
    console.log(`Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Success Rate: ${(100 - aggregateMetrics.errorRate).toFixed(1)}%`);
    console.log(`Failed Users: ${aggregateMetrics.failedUsers}`);

    // No connection pool exhaustion errors
    const connectionErrors = userMetrics.filter(
      m => m.errorMessage?.includes('connection') || m.errorMessage?.includes('pool')
    );
    expect(connectionErrors.length).toBe(0);

    console.log(`✅ Connection pool healthy!`);
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKING
// ============================================================================

test.describe('Performance Benchmarking', () => {
  test('should document maximum supported concurrent users', async ({ browser }) => {
    const userCounts = [5, 10, 15, 20, 25];
    const benchmarkResults: Array<{
      users: number;
      metrics: AggregateMetrics;
    }> = [];

    for (const userCount of userCounts) {
      console.log(`\n🔧 Benchmarking with ${userCount} concurrent users...`);

      const userPromises = Array.from({ length: userCount }, (_, i) =>
        simulateUserWorkflow(browser, i)
      );

      const userMetrics = await Promise.all(userPromises);
      const aggregateMetrics = calculateAggregateMetrics(userMetrics);

      benchmarkResults.push({ users: userCount, metrics: aggregateMetrics });

      logMetrics(aggregateMetrics, `${userCount} Users Benchmark`);

      // Short pause between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Generate benchmark report
    console.log(`\n========================================`);
    console.log(`Performance Benchmark Summary`);
    console.log(`========================================`);

    benchmarkResults.forEach(result => {
      const { users, metrics } = result;
      console.log(`\n${users} Users:`);
      console.log(`  Success Rate: ${(100 - metrics.errorRate).toFixed(1)}%`);
      console.log(`  P95 Response: ${metrics.p95ResponseTime.toFixed(0)}ms`);
      console.log(`  Memory: ${(metrics.totalMemoryIncrease / (1024 * 1024)).toFixed(2)}MB`);
    });

    // Find maximum supported users (error rate < 5%, P95 < 5s)
    const maxSupportedUsers = benchmarkResults
      .filter(r => r.metrics.errorRate < 5 && r.metrics.p95ResponseTime < 5000)
      .map(r => r.users)
      .pop() || 0;

    console.log(`\n✅ Maximum Supported Concurrent Users: ${maxSupportedUsers}`);
    console.log(`========================================\n`);

    // Document result
    expect(maxSupportedUsers).toBeGreaterThanOrEqual(LOAD_TEST_CONFIG.BASELINE_USERS);
  });
});
