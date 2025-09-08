#!/usr/bin/env node

/**
 * Test Script: Duplicate Process Prevention
 * 
 * This script tests that the improved dev-manager-unified.js successfully
 * prevents duplicate processes and handles race conditions.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const execAsync = promisify(exec);

const TESTS_PASSED = [];
const TESTS_FAILED = [];

async function log(message, type = 'info') {
  const prefix = {
    'info': 'ℹ️ ',
    'success': '✅',
    'error': '❌',
    'test': '🧪',
  }[type] || '';
  
  console.log(`${prefix} ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    return stdout.trim().split('\n').filter(Boolean).length > 0;
  } catch (error) {
    return false;
  }
}

async function countProcesses(pattern) {
  try {
    const { stdout } = await execAsync(`pgrep -f "${pattern}" | wc -l`);
    return parseInt(stdout.trim());
  } catch (error) {
    return 0;
  }
}

async function cleanup() {
  await log('Cleaning up before tests...', 'info');
  try {
    await execAsync('npm run stop');
    await sleep(2000);
  } catch (error) {
    // Ignore errors during cleanup
  }
}

// Test 1: Lock file prevents second instance
async function testLockFilePrevention() {
  await log('Test 1: Lock file prevents second instance', 'test');
  
  try {
    // Start first instance
    const proc1 = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: true,
      stdio: 'ignore'
    });
    
    await sleep(3000); // Wait for first instance to start
    
    // Try to start second instance
    const proc2 = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: false,
      stdio: 'pipe'
    });
    
    let output = '';
    proc2.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for second instance to exit
    await new Promise((resolve) => {
      proc2.on('exit', (code) => {
        if (code === 1 && output.includes('Another instance is already running')) {
          TESTS_PASSED.push('Lock file prevention');
          log('Lock file successfully prevented second instance', 'success');
        } else {
          TESTS_FAILED.push('Lock file prevention');
          log('Lock file failed to prevent second instance', 'error');
        }
        resolve();
      });
    });
    
    // Kill first instance
    try {
      process.kill(-proc1.pid);
    } catch (e) {
      // Ignore
    }
    
  } catch (error) {
    TESTS_FAILED.push('Lock file prevention');
    log(`Test failed: ${error.message}`, 'error');
  }
  
  await cleanup();
}

// Test 2: Port fallback prevention
async function testPortFallbackPrevention() {
  await log('Test 2: Next.js port fallback prevention', 'test');
  
  try {
    // Manually occupy port 3000
    const { stdout } = await execAsync('python3 -m http.server 3000 2>/dev/null & echo $!');
    const pythonPid = stdout.trim();
    
    await sleep(1000);
    
    // Start dev manager
    const proc = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: true,
      stdio: 'ignore'
    });
    
    await sleep(5000); // Wait for servers to start
    
    // Check if any fallback ports are used
    let fallbackUsed = false;
    for (let port = 3001; port <= 3003; port++) {
      if (await checkPort(port)) {
        fallbackUsed = true;
        log(`Fallback port ${port} is in use!`, 'error');
      }
    }
    
    if (!fallbackUsed) {
      TESTS_PASSED.push('Port fallback prevention');
      log('Successfully prevented Next.js port fallback', 'success');
    } else {
      TESTS_FAILED.push('Port fallback prevention');
      log('Failed to prevent Next.js port fallback', 'error');
    }
    
    // Cleanup
    try {
      await execAsync(`kill ${pythonPid}`);
      process.kill(-proc.pid);
    } catch (e) {
      // Ignore
    }
    
  } catch (error) {
    TESTS_FAILED.push('Port fallback prevention');
    log(`Test failed: ${error.message}`, 'error');
  }
  
  await cleanup();
}

// Test 3: Multiple Next.js process prevention
async function testMultipleProcessPrevention() {
  await log('Test 3: Multiple Next.js process prevention', 'test');
  
  try {
    // Start dev manager
    const proc = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: true,
      stdio: 'ignore'
    });
    
    await sleep(5000); // Wait for servers to start
    
    // Count Next.js processes
    const nextCount = await countProcesses('next-server');
    
    if (nextCount <= 1) {
      TESTS_PASSED.push('Multiple process prevention');
      log(`Only ${nextCount} Next.js process running`, 'success');
    } else {
      TESTS_FAILED.push('Multiple process prevention');
      log(`Found ${nextCount} Next.js processes (should be 1)`, 'error');
    }
    
    // Cleanup
    try {
      process.kill(-proc.pid);
    } catch (e) {
      // Ignore
    }
    
  } catch (error) {
    TESTS_FAILED.push('Multiple process prevention');
    log(`Test failed: ${error.message}`, 'error');
  }
  
  await cleanup();
}

// Test 4: Race condition handling
async function testRaceCondition() {
  await log('Test 4: Race condition handling', 'test');
  
  try {
    // Try to start two instances simultaneously
    const proc1 = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: true,
      stdio: 'pipe'
    });
    
    const proc2 = spawn('node', ['scripts/dev-manager-unified.js', '--mode=simple'], {
      detached: true,
      stdio: 'pipe'
    });
    
    await sleep(5000);
    
    // Count running dev manager processes
    const managerCount = await countProcesses('dev-manager-unified');
    
    if (managerCount === 1) {
      TESTS_PASSED.push('Race condition handling');
      log('Successfully handled race condition - only 1 manager running', 'success');
    } else {
      TESTS_FAILED.push('Race condition handling');
      log(`Found ${managerCount} managers (should be 1)`, 'error');
    }
    
    // Cleanup
    try {
      process.kill(-proc1.pid);
      process.kill(-proc2.pid);
    } catch (e) {
      // Ignore
    }
    
  } catch (error) {
    TESTS_FAILED.push('Race condition handling');
    log(`Test failed: ${error.message}`, 'error');
  }
  
  await cleanup();
}

// Main test runner
async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 Testing Duplicate Process Prevention');
  console.log('═'.repeat(60));
  
  await cleanup();
  
  // Run tests sequentially
  await testLockFilePrevention();
  await testPortFallbackPrevention();
  await testMultipleProcessPrevention();
  await testRaceCondition();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Summary');
  console.log('═'.repeat(60));
  
  if (TESTS_PASSED.length > 0) {
    console.log('\n✅ Passed Tests:');
    TESTS_PASSED.forEach(test => console.log(`   - ${test}`));
  }
  
  if (TESTS_FAILED.length > 0) {
    console.log('\n❌ Failed Tests:');
    TESTS_FAILED.forEach(test => console.log(`   - ${test}`));
  }
  
  const totalTests = TESTS_PASSED.length + TESTS_FAILED.length;
  const passRate = totalTests > 0 ? (TESTS_PASSED.length / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}% (${TESTS_PASSED.length}/${totalTests})`);
  
  if (TESTS_FAILED.length === 0) {
    console.log('\n🎉 All tests passed! The improved manager prevents duplicates.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the implementation.');
  }
  
  process.exit(TESTS_FAILED.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});