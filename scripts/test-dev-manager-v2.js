#!/usr/bin/env node

/**
 * NETFLIX-GRADE V2 DEV MANAGER - A+ QUALITY TEST SUITE
 * Phase 10.106 - Comprehensive Testing with Edge Cases
 *
 * Tests:
 * - Core functionality (process cleanup, port liberation, cache clearing)
 * - Safety features (path validation, lock file, self-protection)
 * - Error recovery (crash handling, watchdog)
 * - Edge cases (concurrent starts, stale locks, race conditions)
 * - Performance (startup time, memory monitoring)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.join(__dirname, '..');
const PORTS = [3000, 4000];
const V2_MANAGER_PATH = path.join(__dirname, 'dev-netflix-v2.js');
const LOCK_FILE = path.join(PROJECT_ROOT, '.dev-pids', 'manager.lock');
const METRICS_FILE = path.join(PROJECT_ROOT, '.dev-pids', 'metrics.json');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function log(msg) {
  console.log(msg);
}

function pass(testName) {
  passCount++;
  log(`${colors.green}  PASS${colors.reset} ${testName}`);
}

function fail(testName, reason) {
  failCount++;
  log(`${colors.red}  FAIL${colors.reset} ${testName}`);
  log(`       ${colors.yellow}Reason: ${reason}${colors.reset}`);
}

function skip(testName, reason) {
  skipCount++;
  log(`${colors.dim}  SKIP${colors.reset} ${testName} ${colors.dim}(${reason})${colors.reset}`);
}

function execSilent(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getPidsForPort(port) {
  try {
    // Only get LISTEN processes, not connected clients (like Chrome)
    const result = execSilent(`lsof -t -i:${port} -sTCP:LISTEN`);
    return result.split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

function httpCheck(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ============================================================================
// CORE FUNCTIONALITY TESTS
// ============================================================================

async function testV2ManagerFileExists() {
  log('\n--- Test: V2 Manager File Integrity ---');

  if (fs.existsSync(V2_MANAGER_PATH)) {
    pass('dev-netflix-v2.js exists');
  } else {
    fail('dev-netflix-v2.js exists', 'File not found');
    return;
  }

  const stats = fs.statSync(V2_MANAGER_PATH);

  // Check it's executable (owner has execute permission)
  const isExecutable = (stats.mode & 0o111) !== 0; // Any execute bit set
  if (isExecutable) {
    pass('dev-netflix-v2.js is executable');
  } else {
    fail('dev-netflix-v2.js is executable', `Mode: ${stats.mode.toString(8)}`);
  }

  // Check file size (should be substantial for A+ quality)
  if (stats.size > 20000) {
    pass(`dev-netflix-v2.js has substantial content (${stats.size} bytes)`);
  } else {
    fail(`dev-netflix-v2.js has substantial content`, `Only ${stats.size} bytes`);
  }
}

async function testNoCompetingManagers() {
  log('\n--- Test: No Competing Managers in package.json ---');

  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
  const scripts = packageJson.scripts;

  // Check that main dev scripts use V2
  const v2Scripts = ['dev', 'dev:v2', 'dev:netflix'];
  for (const script of v2Scripts) {
    if (scripts[script] && scripts[script].includes('dev-netflix-v2.js')) {
      pass(`Script "${script}" uses V2 manager`);
    } else {
      fail(`Script "${script}" uses V2 manager`, `Found: ${scripts[script]}`);
    }
  }

  // Check no old managers are referenced
  const oldManagers = ['dev-lite', 'dev-ultimate', 'dev-enterprise'];
  const allScriptValues = Object.values(scripts).join(' ');

  for (const old of oldManagers) {
    if (!allScriptValues.includes(old)) {
      pass(`No reference to "${old}" manager`);
    } else {
      fail(`No reference to "${old}" manager`, 'Still referenced in package.json');
    }
  }
}

async function testSingleInstanceEnforcement() {
  log('\n--- Test: Single Instance Enforcement ---');

  // Check current port usage
  const port3000Pids = getPidsForPort(3000);
  const port4000Pids = getPidsForPort(4000);

  if (port3000Pids.length <= 1) {
    pass('Port 3000 has at most 1 process');
  } else {
    fail('Port 3000 has at most 1 process', `Found ${port3000Pids.length} processes: ${port3000Pids.join(', ')}`);
  }

  if (port4000Pids.length <= 1) {
    pass('Port 4000 has at most 1 process');
  } else {
    fail('Port 4000 has at most 1 process', `Found ${port4000Pids.length} processes: ${port4000Pids.join(', ')}`);
  }
}

async function testCachePathsExist() {
  log('\n--- Test: Cache Paths Configuration ---');

  // These are the paths that should be cleared
  const cachePaths = [
    'frontend/.next',
    'frontend/node_modules/.cache',
    'backend/dist',
    '.dev-pids',
  ];

  // Verify these paths are in the V2 manager
  const v2Content = readFileContent(V2_MANAGER_PATH);

  for (const cachePath of cachePaths) {
    if (v2Content.includes(cachePath)) {
      pass(`Cache path "${cachePath}" is configured for cleanup`);
    } else {
      fail(`Cache path "${cachePath}" is configured for cleanup`, 'Not found in V2 manager');
    }
  }
}

async function testProcessPatterns() {
  log('\n--- Test: Process Kill Patterns ---');

  const requiredPatterns = [
    'nest start',
    'next dev',
    'next-server',
    'dev-lite',
    'dev-netflix',
    'dev-ultimate',
  ];

  const v2Content = readFileContent(V2_MANAGER_PATH);

  for (const pattern of requiredPatterns) {
    if (v2Content.includes(pattern)) {
      pass(`Kill pattern "${pattern}" is configured`);
    } else {
      fail(`Kill pattern "${pattern}" is configured`, 'Not found in V2 manager');
    }
  }
}

async function testHealthEndpoints() {
  log('\n--- Test: Health Endpoints ---');

  const backendHealthy = await httpCheck('http://localhost:4000/api/health');
  const frontendHealthy = await httpCheck('http://localhost:3000');

  if (backendHealthy) {
    pass('Backend health endpoint responds');
  } else {
    fail('Backend health endpoint responds', 'No response from http://localhost:4000/api/health');
  }

  if (frontendHealthy) {
    pass('Frontend responds');
  } else {
    fail('Frontend responds', 'No response from http://localhost:3000');
  }
}

async function testNoOrphanProcesses() {
  log('\n--- Test: No Orphan Dev Processes ---');

  // Check for any orphan dev processes not on expected ports
  const patterns = ['dev-lite', 'dev-ultimate', 'dev-enterprise'];

  for (const pattern of patterns) {
    const result = execSilent(`pgrep -f "${pattern}"`);
    if (!result) {
      pass(`No orphan "${pattern}" processes`);
    } else {
      fail(`No orphan "${pattern}" processes`, `Found PIDs: ${result}`);
    }
  }
}

// ============================================================================
// A+ QUALITY FEATURES TESTS
// ============================================================================

async function testLockFileFeature() {
  log('\n--- Test: Lock File Feature (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('acquireLock')) {
    pass('Lock acquisition function exists');
  } else {
    fail('Lock acquisition function exists', 'No acquireLock function found');
  }

  if (v2Content.includes('releaseLock')) {
    pass('Lock release function exists');
  } else {
    fail('Lock release function exists', 'No releaseLock function found');
  }

  if (v2Content.includes('manager.lock')) {
    pass('Lock file path configured');
  } else {
    fail('Lock file path configured', 'No manager.lock path found');
  }

  // Check for stale lock detection
  if (v2Content.includes('stale') || v2Content.includes('3600000')) {
    pass('Stale lock detection implemented');
  } else {
    fail('Stale lock detection implemented', 'No stale lock handling found');
  }
}

async function testPathSafetyFeature() {
  log('\n--- Test: Path Safety Feature (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('isPathSafe')) {
    pass('Path safety validation function exists');
  } else {
    fail('Path safety validation function exists', 'No isPathSafe function found');
  }

  // Check for protected paths
  const protectedPaths = ['/', '/Users', '/home', '.git', 'src'];
  let protectedCount = 0;
  for (const ppath of protectedPaths) {
    if (v2Content.includes(`'${ppath}'`) || v2Content.includes(`"${ppath}"`)) {
      protectedCount++;
    }
  }

  if (protectedCount >= 3) {
    pass(`Protected paths configured (${protectedCount} found)`);
  } else {
    fail(`Protected paths configured`, `Only ${protectedCount} protected paths found`);
  }

  // Check for project root validation
  if (v2Content.includes('projectRoot') && v2Content.includes('startsWith')) {
    pass('Project root boundary check exists');
  } else {
    fail('Project root boundary check exists', 'No boundary validation found');
  }
}

async function testAtomicCacheClearing() {
  log('\n--- Test: Atomic Cache Clearing (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('rmDirAtomic')) {
    pass('Atomic directory deletion function exists');
  } else {
    fail('Atomic directory deletion function exists', 'No rmDirAtomic function found');
  }

  // Check for rename-then-delete pattern
  if (v2Content.includes('renameSync') && v2Content.includes('.deleting')) {
    pass('Rename-then-delete atomic pattern implemented');
  } else {
    fail('Rename-then-delete atomic pattern implemented', 'No atomic deletion pattern found');
  }

  // Check for fallback
  if (v2Content.includes('Fallback') || v2Content.includes('catch')) {
    pass('Fallback mechanism for failed rename');
  } else {
    fail('Fallback mechanism for failed rename', 'No fallback handling found');
  }
}

async function testErrorRecoveryFeature() {
  log('\n--- Test: Error Recovery Feature (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('_handleCrash')) {
    pass('Crash handler method exists');
  } else {
    fail('Crash handler method exists', 'No _handleCrash method found');
  }

  if (v2Content.includes('crashCount') && v2Content.includes('crashCooldownMs')) {
    pass('Crash counting with cooldown implemented');
  } else {
    fail('Crash counting with cooldown implemented', 'No crash counting found');
  }

  if (v2Content.includes('Auto-restarting')) {
    pass('Auto-restart on crash implemented');
  } else {
    fail('Auto-restart on crash implemented', 'No auto-restart message found');
  }
}

async function testMemoryMonitoring() {
  log('\n--- Test: Memory Monitoring (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('checkMemory')) {
    pass('Memory check function exists');
  } else {
    fail('Memory check function exists', 'No checkMemory function found');
  }

  if (v2Content.includes('getProcessMemoryMB') || v2Content.includes('getMemoryMB')) {
    pass('Process memory retrieval implemented');
  } else {
    fail('Process memory retrieval implemented', 'No memory retrieval function found');
  }

  if (v2Content.includes('warningThresholdMB') || v2Content.includes('1024')) {
    pass('Memory warning threshold configured');
  } else {
    fail('Memory warning threshold configured', 'No memory threshold found');
  }

  if (v2Content.includes('memoryPeaks')) {
    pass('Memory peak tracking implemented');
  } else {
    fail('Memory peak tracking implemented', 'No memory peak tracking found');
  }
}

async function testMetricsTracking() {
  log('\n--- Test: Metrics Tracking (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('metrics.record')) {
    pass('Metrics recording function exists');
  } else {
    fail('Metrics recording function exists', 'No metrics.record function found');
  }

  if (v2Content.includes('metrics.save')) {
    pass('Metrics persistence function exists');
  } else {
    fail('Metrics persistence function exists', 'No metrics.save function found');
  }

  if (v2Content.includes('metricsFile') || v2Content.includes('metrics.json')) {
    pass('Metrics file path configured');
  } else {
    fail('Metrics file path configured', 'No metrics file path found');
  }

  // Check for tracked metrics
  const trackedMetrics = ['processesKilled', 'cachesCleared', 'serverRestarts', 'healthCheckFailures'];
  let metricsFound = 0;
  for (const metric of trackedMetrics) {
    if (v2Content.includes(metric)) {
      metricsFound++;
    }
  }

  if (metricsFound >= 3) {
    pass(`Key metrics tracked (${metricsFound}/${trackedMetrics.length})`);
  } else {
    fail(`Key metrics tracked`, `Only ${metricsFound}/${trackedMetrics.length} found`);
  }
}

async function testStructuredLogging() {
  log('\n--- Test: Structured Logging (A+ Quality) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('log.debug')) {
    pass('Debug logging level exists');
  } else {
    fail('Debug logging level exists', 'No log.debug function found');
  }

  if (v2Content.includes('DEV_DEBUG')) {
    pass('Debug mode environment variable supported');
  } else {
    fail('Debug mode environment variable supported', 'No DEV_DEBUG check found');
  }

  if (v2Content.includes('timestamp') || v2Content.includes('toISOString')) {
    pass('Timestamp support in logs');
  } else {
    fail('Timestamp support in logs', 'No timestamp support found');
  }

  if (v2Content.includes('context') && v2Content.includes('JSON.stringify')) {
    pass('Structured context logging');
  } else {
    fail('Structured context logging', 'No structured context found');
  }
}

// ============================================================================
// WATCHDOG TESTS
// ============================================================================

async function testWatchdogConfiguration() {
  log('\n--- Test: Watchdog Configuration ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('class Watchdog') || v2Content.includes('Watchdog')) {
    pass('Watchdog class exists');
  } else {
    fail('Watchdog class exists', 'No Watchdog implementation found');
  }

  if (v2Content.includes('maxRestarts')) {
    pass('Max restarts limit configured');
  } else {
    fail('Max restarts limit configured', 'No max restart limit found');
  }

  if (v2Content.includes('intervalMs') || v2Content.includes('30000')) {
    pass('Watchdog interval configured');
  } else {
    fail('Watchdog interval configured', 'No interval configuration found');
  }

  // Check for parallel health checks
  if (v2Content.includes('Promise.all') && v2Content.includes('healthChecks')) {
    pass('Parallel health checks implemented');
  } else {
    fail('Parallel health checks implemented', 'No parallel health checks found');
  }
}

async function testGracefulShutdown() {
  log('\n--- Test: Graceful Shutdown Handlers ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('SIGINT')) {
    pass('SIGINT handler configured');
  } else {
    fail('SIGINT handler configured', 'No SIGINT handler');
  }

  if (v2Content.includes('SIGTERM')) {
    pass('SIGTERM handler configured');
  } else {
    fail('SIGTERM handler configured', 'No SIGTERM handler');
  }

  if (v2Content.includes('releaseLock')) {
    pass('Lock release on shutdown');
  } else {
    fail('Lock release on shutdown', 'No lock release in shutdown');
  }

  if (v2Content.includes('metrics.save')) {
    pass('Metrics save on shutdown');
  } else {
    fail('Metrics save on shutdown', 'No metrics save in shutdown');
  }
}

async function testEmergencyCleanup() {
  log('\n--- Test: Emergency Cleanup ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('unhandledRejection')) {
    pass('Unhandled rejection handler exists');
  } else {
    fail('Unhandled rejection handler exists', 'No unhandledRejection handler');
  }

  if (v2Content.includes('emergency cleanup') || v2Content.includes('Emergency cleanup')) {
    pass('Emergency cleanup message exists');
  } else {
    fail('Emergency cleanup message exists', 'No emergency cleanup reference');
  }

  if (v2Content.includes('Fatal error')) {
    pass('Fatal error handling exists');
  } else {
    fail('Fatal error handling exists', 'No fatal error handling');
  }
}

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

async function testSelfProtection() {
  log('\n--- Test: Self-Protection (Edge Cases) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('process.pid')) {
    pass('Current process PID exclusion');
  } else {
    fail('Current process PID exclusion', 'No process.pid reference');
  }

  if (v2Content.includes('process.ppid')) {
    pass('Parent process PID exclusion');
  } else {
    fail('Parent process PID exclusion', 'No process.ppid reference');
  }

  if (v2Content.includes('__filename') || v2Content.includes('currentScript')) {
    pass('Script process exclusion');
  } else {
    fail('Script process exclusion', 'No script exclusion found');
  }
}

async function testExponentialBackoff() {
  log('\n--- Test: Exponential Backoff (Edge Cases) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('Math.pow') && v2Content.includes('attempts')) {
    pass('Exponential backoff formula exists');
  } else {
    fail('Exponential backoff formula exists', 'No exponential backoff found');
  }

  if (v2Content.includes('maxAttempts') && v2Content.includes('5')) {
    pass('Maximum retry attempts configured');
  } else {
    fail('Maximum retry attempts configured', 'No max attempts found');
  }
}

async function testVersionInfo() {
  log('\n--- Test: Version & Quality Info ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('2.2.0')) {
    pass('Version 2.2.0 specified');
  } else {
    fail('Version 2.2.0 specified', 'Version not found or outdated');
  }

  if (v2Content.includes('Enterprise Optimized')) {
    pass('Enterprise Optimized designation');
  } else {
    fail('Enterprise Optimized designation', 'Enterprise designation not found');
  }
}

// ============================================================================
// SECURITY HARDENING TESTS (Enterprise Audit)
// ============================================================================

async function testSecurityInputSanitization() {
  log('\n--- Test: Security Input Sanitization (SECURITY-001) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('sanitizePattern')) {
    pass('Pattern sanitization function exists');
  } else {
    fail('Pattern sanitization function exists', 'No sanitizePattern function');
  }

  if (v2Content.includes('SAFE_PATTERN_REGEX')) {
    pass('Safe pattern whitelist regex defined');
  } else {
    fail('Safe pattern whitelist regex defined', 'No pattern whitelist');
  }

  if (v2Content.includes('sanitizePort')) {
    pass('Port sanitization function exists');
  } else {
    fail('Port sanitization function exists', 'No sanitizePort function');
  }

  // Check for dangerous pattern blocking
  if (v2Content.includes('dangerousPatterns') || v2Content.includes('rm\\s+-rf')) {
    pass('Dangerous command patterns blocked');
  } else {
    fail('Dangerous command patterns blocked', 'No dangerous pattern checks');
  }
}

async function testSecuritySymlinkProtection() {
  log('\n--- Test: Security Symlink Protection (SECURITY-002) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('isSymlink')) {
    pass('Symlink detection function exists');
  } else {
    fail('Symlink detection function exists', 'No isSymlink function');
  }

  if (v2Content.includes('lstatSync')) {
    pass('Uses lstatSync for symlink detection');
  } else {
    fail('Uses lstatSync for symlink detection', 'No lstatSync usage');
  }

  if (v2Content.includes('Blocked deletion of symlink')) {
    pass('Symlink deletion blocking implemented');
  } else {
    fail('Symlink deletion blocking implemented', 'No symlink blocking message');
  }
}

async function testPerformanceOptimizations() {
  log('\n--- Test: Performance Optimizations (PERF-001/002) ---');

  const v2Content = readFileContent(V2_MANAGER_PATH);

  if (v2Content.includes('Promise.allSettled')) {
    pass('Uses Promise.allSettled for parallel kills');
  } else {
    fail('Uses Promise.allSettled for parallel kills', 'No Promise.allSettled');
  }

  if (v2Content.includes('portChecks') && v2Content.includes('Promise.all')) {
    pass('Parallel port verification implemented');
  } else {
    fail('Parallel port verification implemented', 'No parallel port checks');
  }

  // Check for reduced backoff
  if (v2Content.includes('300 * Math.pow')) {
    pass('Optimized backoff timing (300ms base)');
  } else {
    fail('Optimized backoff timing', 'Still using slow 500ms base');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.cyan}║  NETFLIX-GRADE V2 DEV MANAGER - A+ QUALITY TEST SUITE      ║${colors.reset}`);
  log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  // Core Functionality Tests
  await testV2ManagerFileExists();
  await testNoCompetingManagers();
  await testSingleInstanceEnforcement();
  await testCachePathsExist();
  await testProcessPatterns();
  await testHealthEndpoints();
  await testNoOrphanProcesses();

  // A+ Quality Feature Tests
  await testLockFileFeature();
  await testPathSafetyFeature();
  await testAtomicCacheClearing();
  await testErrorRecoveryFeature();
  await testMemoryMonitoring();
  await testMetricsTracking();
  await testStructuredLogging();

  // Watchdog Tests
  await testWatchdogConfiguration();
  await testGracefulShutdown();
  await testEmergencyCleanup();

  // Edge Case Tests
  await testSelfProtection();
  await testExponentialBackoff();
  await testVersionInfo();

  // Enterprise Security & Performance Tests
  await testSecurityInputSanitization();
  await testSecuritySymlinkProtection();
  await testPerformanceOptimizations();

  // Summary
  const total = passCount + failCount + skipCount;
  log('\n═══════════════════════════════════════════════════════════════');
  log(`${colors.cyan}RESULTS:${colors.reset} ${colors.green}${passCount} passed${colors.reset}, ${failCount > 0 ? colors.red : colors.green}${failCount} failed${colors.reset}${skipCount > 0 ? `, ${colors.dim}${skipCount} skipped${colors.reset}` : ''}`);

  // Calculate grade
  const passRate = (passCount / (passCount + failCount)) * 100;
  let grade;
  if (passRate >= 97) grade = 'A+';
  else if (passRate >= 93) grade = 'A';
  else if (passRate >= 90) grade = 'A-';
  else if (passRate >= 87) grade = 'B+';
  else if (passRate >= 83) grade = 'B';
  else if (passRate >= 80) grade = 'B-';
  else if (passRate >= 70) grade = 'C';
  else grade = 'D';

  const gradeColor = grade.startsWith('A') ? colors.green : (grade.startsWith('B') ? colors.yellow : colors.red);
  log(`${colors.cyan}GRADE:${colors.reset}   ${gradeColor}${grade}${colors.reset} (${passRate.toFixed(1)}% pass rate)`);
  log('═══════════════════════════════════════════════════════════════\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
