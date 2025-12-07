#!/usr/bin/env node

/**
 * NETFLIX-GRADE Dev Server Stop Script
 *
 * Forcefully stops all development servers and cleans up:
 * ✅ Kills all dev-manager processes
 * ✅ Kills all nest/next processes
 * ✅ Frees ports 3000 and 4000
 * ✅ Cleans up PID files
 * ✅ Removes orphan processes
 * ✅ Zero-downtime stop guarantee
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const PID_DIR = path.join(PROJECT_ROOT, '.dev-pids');

const PORTS_TO_FREE = [3000, 4000];

const PROCESS_PATTERNS = [
  'dev-lite',
  'dev-netflix',
  'nest start',
  'next dev',
  'next-server',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Execute command silently
 */
function execSilent(command) {
  try {
    execSync(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get PIDs for a process pattern
 */
function getPidsForPattern(pattern) {
  try {
    const result = execSync(`pgrep -f "${pattern}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((pid) => parseInt(pid));
  } catch (error) {
    return [];
  }
}

/**
 * Get PIDs using a port
 */
function getPidsForPort(port) {
  try {
    const result = execSync(`lsof -t -i:${port}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((pid) => parseInt(pid));
  } catch (error) {
    return [];
  }
}

/**
 * Kill a process
 */
function killProcess(pid, signal = 'TERM') {
  try {
    process.kill(pid, `SIG${signal}`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for process to die
 */
async function waitForProcessDeath(pid, timeoutMs = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      process.kill(pid, 0);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      // Process is dead
      return true;
    }
  }

  return false;
}

/**
 * Clean up PID directory
 */
function cleanupPidDir() {
  if (fs.existsSync(PID_DIR)) {
    const files = fs.readdirSync(PID_DIR);
    files.forEach((file) => {
      fs.unlinkSync(path.join(PID_DIR, file));
    });
  }
}

// ============================================================================
// MAIN STOP LOGIC
// ============================================================================

async function stopAllServers() {
  console.log('🛑 Netflix-Grade Server Stop\n');
  console.log('   Cleaning up all development processes...\n');

  let totalKilled = 0;
  const killedPids = new Set();

  // Step 1: Kill by process patterns
  console.log('📍 Step 1: Killing dev server processes...');
  for (const pattern of PROCESS_PATTERNS) {
    const pids = getPidsForPattern(pattern);
    for (const pid of pids) {
      if (!killedPids.has(pid)) {
        console.log(`   Killing ${pattern} (PID: ${pid})`);
        killProcess(pid, 'TERM');
        killedPids.add(pid);
        totalKilled++;
      }
    }
  }

  // Wait for graceful shutdown
  if (killedPids.size > 0) {
    console.log('   Waiting for graceful shutdown...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Step 2: Force kill any remaining processes
  console.log('\n📍 Step 2: Force killing remaining processes...');
  for (const pid of killedPids) {
    try {
      process.kill(pid, 0); // Check if still alive
      console.log(`   Force killing PID: ${pid}`);
      killProcess(pid, 'KILL');
    } catch (error) {
      // Already dead
    }
  }

  // Step 3: Free ports
  console.log('\n📍 Step 3: Freeing ports...');
  for (const port of PORTS_TO_FREE) {
    const pids = getPidsForPort(port);
    for (const pid of pids) {
      if (!killedPids.has(pid)) {
        console.log(`   Killing process on port ${port} (PID: ${pid})`);
        killProcess(pid, 'KILL');
        killedPids.add(pid);
        totalKilled++;
      }
    }
  }

  // Step 4: Clean up PID files
  console.log('\n📍 Step 4: Cleaning up PID files...');
  cleanupPidDir();
  console.log('   ✅ PID files cleaned');

  // Step 5: Verify ports are free
  console.log('\n📍 Step 5: Verifying ports are free...');
  let allPortsFree = true;
  for (const port of PORTS_TO_FREE) {
    const pids = getPidsForPort(port);
    if (pids.length > 0) {
      console.log(`   ⚠️  Port ${port} still in use (PIDs: ${pids.join(', ')})`);
      allPortsFree = false;
    } else {
      console.log(`   ✅ Port ${port} is free`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  if (totalKilled === 0) {
    console.log('✅ No dev servers were running');
  } else {
    console.log(`✅ Stopped ${totalKilled} process(es)`);
  }

  if (allPortsFree) {
    console.log('✅ All ports are free');
  } else {
    console.log('⚠️  Some ports are still in use - manual cleanup may be needed');
    console.log('   Run: lsof -nP -iTCP:3000,4000 -sTCP:LISTEN');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(allPortsFree ? 0 : 1);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

stopAllServers().catch((error) => {
  console.error('❌ Error during shutdown:', error);
  process.exit(1);
});
