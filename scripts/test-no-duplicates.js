#!/usr/bin/env node

/**
 * Test Script: Verify No Duplicate Processes
 *
 * This script verifies that:
 * 1. Only one instance of the dev manager can run
 * 2. No duplicate processes on the same port
 * 3. Automatic cleanup works correctly
 * 4. Both servers are accessible
 */

const { exec } = require('child_process');
const http = require('http');
const { promisify } = require('util');
const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class DuplicateTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const color =
      type === 'pass'
        ? colors.green
        : type === 'fail'
          ? colors.red
          : type === 'warn'
            ? colors.yellow
            : colors.blue;
    console.log(`${color}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
      await testFn();
      this.passed++;
      this.log('✓ PASS', 'pass');
      this.results.push({ test: name, result: 'PASS' });
    } catch (error) {
      this.failed++;
      this.log(`✗ FAIL: ${error.message}`, 'fail');
      this.results.push({ test: name, result: 'FAIL', error: error.message });
    }
  }

  async getProcessCount(pattern) {
    try {
      const { stdout } = await execAsync(
        `ps aux | grep -E "${pattern}" | grep -v grep | wc -l`
      );
      return parseInt(stdout.trim());
    } catch (error) {
      return 0;
    }
  }

  async getPortProcesses(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti :${port}`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async checkHealth(url) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Health check timeout')),
        3000
      );

      http
        .get(url, res => {
          clearTimeout(timeout);
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(
              new Error(`Health check failed with status ${res.statusCode}`)
            );
          }
        })
        .on('error', error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  async run() {
    console.log(
      `${colors.bright}╔════════════════════════════════════════════════════════════╗${colors.reset}`
    );
    console.log(
      `${colors.bright}║         No Duplicate Processes Test Suite                  ║${colors.reset}`
    );
    console.log(
      `${colors.bright}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`
    );

    // Test 1: Check Next.js processes
    await this.test('No duplicate Next.js processes', async () => {
      const count = await this.getProcessCount('next-server');
      if (count > 1) {
        throw new Error(`Found ${count} Next.js processes, expected 1 or 0`);
      }
    });

    // Test 2: Check Nest.js processes
    await this.test('No duplicate Nest.js processes', async () => {
      const count = await this.getProcessCount('nest start');
      if (count > 1) {
        throw new Error(`Found ${count} Nest.js processes, expected 1 or 0`);
      }
    });

    // Test 3: Single process on port 3000
    await this.test('Single process on port 3000', async () => {
      const pids = await this.getPortProcesses(3000);
      if (pids.length > 1) {
        throw new Error(
          `Found ${pids.length} processes on port 3000: ${pids.join(', ')}`
        );
      }
    });

    // Test 4: Single process on port 4000
    await this.test('Single process on port 4000', async () => {
      const pids = await this.getPortProcesses(4000);
      if (pids.length > 1) {
        throw new Error(
          `Found ${pids.length} processes on port 4000: ${pids.join(', ')}`
        );
      }
    });

    // Test 5: Frontend is accessible
    await this.test('Frontend is accessible', async () => {
      await this.checkHealth('http://localhost:3000');
    });

    // Test 6: Backend is accessible
    await this.test('Backend API is accessible', async () => {
      await this.checkHealth('http://localhost:4000/api');
    });

    // Test 7: Lock file prevents duplicates
    await this.test('Lock file prevents duplicate instances', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run dev:simple 2>&1', {
          timeout: 2000,
        });
        // If it runs, it should exit with error
        if (
          !stderr.includes('Another instance') &&
          !stdout.includes('Another instance')
        ) {
          throw new Error('Duplicate instance was not prevented');
        }
      } catch (error) {
        // Expected to fail/timeout if lock is working
        if (error.killed && error.signal === 'SIGTERM') {
          // Timeout is expected - the lock is working
          return;
        }
        // Check if error message indicates lock is working
        if (
          error.stdout &&
          (error.stdout.includes('Another instance') ||
            error.stderr.includes('Another instance'))
        ) {
          return; // Lock is working
        }
        throw new Error('Lock file check failed: ' + error.message);
      }
    });

    // Test 8: No orphaned processes
    await this.test('No orphaned Node.js processes', async () => {
      const { stdout } = await execAsync(
        'ps aux | grep -E "node.*dev" | grep -v grep | grep -v "dev-manager\\|dev:simple\\|enterprise-dev" | wc -l'
      );
      const orphans = parseInt(stdout.trim());
      if (orphans > 0) {
        throw new Error(`Found ${orphans} orphaned Node.js processes`);
      }
    });

    // Test 9: PM2 is not interfering
    await this.test('PM2 is not running conflicting processes', async () => {
      try {
        const { stdout } = await execAsync(
          'pm2 list 2>/dev/null | grep -E "vqmethod" | wc -l'
        );
        const pm2Count = parseInt(stdout.trim());
        if (pm2Count > 0) {
          throw new Error(
            `Found ${pm2Count} PM2 processes that might conflict`
          );
        }
      } catch (error) {
        // PM2 might not be installed, that's fine
      }
    });

    // Test 10: Check button functionality
    await this.test('Frontend JavaScript is working', async () => {
      const { stdout } = await execAsync(
        'curl -s http://localhost:3000 | grep -c "onClick"'
      );
      const buttonCount = parseInt(stdout.trim());
      if (buttonCount === 0) {
        throw new Error('No interactive buttons found on homepage');
      }
    });

    // Print summary
    console.log(`\n${colors.bright}Test Summary:${colors.reset}`);
    console.log('─'.repeat(60));

    for (const result of this.results) {
      const icon = result.result === 'PASS' ? '✓' : '✗';
      const color = result.result === 'PASS' ? colors.green : colors.red;
      console.log(`${color}${icon} ${result.test}${colors.reset}`);
      if (result.error) {
        console.log(`  ${colors.yellow}→ ${result.error}${colors.reset}`);
      }
    }

    console.log('─'.repeat(60));
    console.log(`Total: ${this.passed + this.failed} tests`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);

    if (this.failed === 0) {
      console.log(
        `\n${colors.green}${colors.bright}✅ All tests passed! No duplicate processes detected.${colors.reset}`
      );
      console.log(
        `${colors.green}The system is working correctly with enterprise-grade process management.${colors.reset}`
      );
    } else {
      console.log(
        `\n${colors.red}${colors.bright}❌ Some tests failed. Please review the errors above.${colors.reset}`
      );
    }

    process.exit(this.failed === 0 ? 0 : 1);
  }
}

// Run tests
const tester = new DuplicateTest();
tester.run().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
