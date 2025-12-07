#!/usr/bin/env node

/**
 * NETFLIX-GRADE Dev Server Status Checker
 *
 * Provides detailed status of development servers:
 * ✅ Process status (running/stopped)
 * ✅ Port status (open/closed)
 * ✅ Resource usage (CPU/Memory)
 * ✅ Health check status
 * ✅ PID file validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const PID_DIR = path.join(PROJECT_ROOT, '.dev-pids');

const PORTS = {
  backend: 4000,
  frontend: 3000,
};

const HEALTH_URLS = {
  backend: 'http://localhost:4000/api/health',
  frontend: 'http://localhost:3000',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a port is in use
 */
function checkPort(port) {
  try {
    const result = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = result.trim().split('\n').slice(1); // Skip header
    if (lines.length > 0 && lines[0]) {
      const parts = lines[0].split(/\s+/);
      return {
        inUse: true,
        pid: parseInt(parts[1]),
        command: parts[0],
      };
    }
  } catch (error) {
    // Port is free
  }
  return { inUse: false };
}

/**
 * Get process stats
 */
function getProcessStats(pid) {
  try {
    const result = execSync(`ps -p ${pid} -o %cpu,%mem,rss,etime`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = result.trim().split('\n');
    if (lines.length < 2) return null;

    const [cpu, mem, rss, etime] = lines[1].trim().split(/\s+/);
    return {
      cpu: parseFloat(cpu),
      mem: parseFloat(mem),
      memoryMB: Math.round(parseInt(rss) / 1024),
      uptime: etime,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check health endpoint
 */
function checkHealth(url) {
  try {
    execSync(`curl -s -f -m 2 ${url} > /dev/null 2>&1`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Read PID file
 */
function readPidFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pid = parseInt(content.trim());
    return isNaN(pid) ? null : pid;
  } catch (error) {
    return null;
  }
}

/**
 * Check if process is running
 */
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format resource usage with color
 */
function formatResourceUsage(stats) {
  if (!stats) return '❌ Not running';

  const cpuColor = stats.cpu > 50 ? '🔴' : stats.cpu > 20 ? '🟡' : '🟢';
  const memColor =
    stats.memoryMB > 1500 ? '🔴' : stats.memoryMB > 1000 ? '🟡' : '🟢';

  return `${cpuColor} CPU: ${stats.cpu.toFixed(1)}%  ${memColor} MEM: ${stats.memoryMB}MB  ⏱️  ${stats.uptime}`;
}

// ============================================================================
// MAIN STATUS LOGIC
// ============================================================================

function checkStatus() {
  console.log('📊 Netflix-Grade Dev Server Status\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check Backend
  console.log('🔷 BACKEND (NestJS)');
  const backendPort = checkPort(PORTS.backend);
  const backendPidFile = path.join(PID_DIR, 'backend.pid');
  const backendPid = readPidFile(backendPidFile);

  if (backendPort.inUse) {
    console.log(`   Status: ✅ Running (PID: ${backendPort.pid})`);
    const stats = getProcessStats(backendPort.pid);
    console.log(`   Resources: ${formatResourceUsage(stats)}`);
    const healthy = checkHealth(HEALTH_URLS.backend);
    console.log(`   Health: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   URL: ${HEALTH_URLS.backend}`);
  } else {
    console.log('   Status: ❌ Not running');
  }

  if (backendPid && !backendPort.inUse) {
    console.log(`   ⚠️  Stale PID file detected (PID: ${backendPid})`);
  }

  console.log('');

  // Check Frontend
  console.log('🔷 FRONTEND (Next.js)');
  const frontendPort = checkPort(PORTS.frontend);
  const frontendPidFile = path.join(PID_DIR, 'frontend.pid');
  const frontendPid = readPidFile(frontendPidFile);

  if (frontendPort.inUse) {
    console.log(`   Status: ✅ Running (PID: ${frontendPort.pid})`);
    const stats = getProcessStats(frontendPort.pid);
    console.log(`   Resources: ${formatResourceUsage(stats)}`);
    const healthy = checkHealth(HEALTH_URLS.frontend);
    console.log(`   Health: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   URL: ${HEALTH_URLS.frontend}`);
  } else {
    console.log('   Status: ❌ Not running');
  }

  if (frontendPid && !frontendPort.inUse) {
    console.log(`   ⚠️  Stale PID file detected (PID: ${frontendPid})`);
  }

  console.log('');

  // Check dev manager
  console.log('🔷 DEV MANAGER');
  const managerPidFile = path.join(PID_DIR, 'dev-manager.pid');
  const managerPid = readPidFile(managerPidFile);

  if (managerPid && isProcessRunning(managerPid)) {
    console.log(`   Status: ✅ Running (PID: ${managerPid})`);
    const stats = getProcessStats(managerPid);
    console.log(`   Resources: ${formatResourceUsage(stats)}`);
  } else if (managerPid) {
    console.log(`   Status: ⚠️  Stale PID file (PID: ${managerPid})`);
  } else {
    console.log('   Status: ❌ Not running');
  }

  console.log('\n═══════════════════════════════════════════════════════');

  // Summary
  const allHealthy =
    backendPort.inUse &&
    frontendPort.inUse &&
    checkHealth(HEALTH_URLS.backend) &&
    checkHealth(HEALTH_URLS.frontend);

  if (allHealthy) {
    console.log('✅ All services are healthy and running');
  } else if (!backendPort.inUse && !frontendPort.inUse) {
    console.log('ℹ️  No dev servers running');
    console.log('   Start with: npm run dev:netflix');
  } else {
    console.log('⚠️  Some services are not healthy');
    console.log('   Try: npm run dev:stop && npm run dev:netflix');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(allHealthy ? 0 : 1);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

checkStatus();
