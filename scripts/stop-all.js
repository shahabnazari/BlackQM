#!/usr/bin/env node

/**
 * Stop All Servers Script
 * Cleanly shuts down all development servers
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PID_FILE = path.join(__dirname, '..', '.dev-servers.pid');

async function killPortProcess(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    const pids = stdout.trim().split('\n').filter(Boolean);

    for (const pid of pids) {
      console.log(`  Killing process ${pid} on port ${port}`);
      await execAsync(`kill -9 ${pid}`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🛑 Stopping all development servers...\n');

  // Check for PID file
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      console.log(`  Stopping dev manager (PID: ${pid})...`);
      await execAsync(`kill -SIGTERM ${pid}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Process might already be dead
    }
    fs.unlinkSync(PID_FILE);
  }

  // Kill any processes on standard ports
  console.log('  Cleaning up ports...');
  await killPortProcess(3000);
  await killPortProcess(3001);
  await killPortProcess(3003);
  await killPortProcess(4000);
  await killPortProcess(5000);

  // Kill any Next.js processes
  try {
    await execAsync('pkill -f "next dev"');
    console.log('  Stopped Next.js processes');
  } catch (error) {
    // No processes found
  }

  // Kill any Nest.js processes
  try {
    await execAsync('pkill -f "nest start"');
    console.log('  Stopped Nest.js processes');
  } catch (error) {
    // No processes found
  }

  // Clean up PM2 if running
  try {
    await execAsync('pm2 delete all 2>/dev/null');
    console.log('  Cleaned PM2 processes');
  } catch (error) {
    // PM2 not running or no processes
  }

  console.log('\n✅ All servers stopped successfully!\n');
}

main().catch(error => {
  console.error('Error stopping servers:', error);
  process.exit(1);
});
