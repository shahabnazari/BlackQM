#!/usr/bin/env node

/**
 * ULTIMATE Stop Script
 * 
 * This kills ALL processes and ensures clean shutdown
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class UltimateStopManager {
  constructor() {
    this.lockFiles = [
      '.dev-manager.lock',
      '.dev-simple.lock',
      '.dev-ultimate.lock',
      '.dev-ultimate.pid',
      '.dev-processes.json',
      '.dev-manager-v5.lock',
      '.dev-enterprise.lock',
      '.dev-enterprise.pid',
      '.dev-enterprise-state.json'
    ];
    this.processListFile = path.join(__dirname, '..', '.dev-processes.json');
  }

  async stop() {
    console.log('🛑 ULTIMATE STOP - Killing ALL processes...\n');

    // Kill tracked processes first
    await this.killTrackedProcesses();

    // Kill all Node.js processes
    await this.killAllNodeProcesses();

    // Kill all port processes
    await this.killAllPortProcesses();

    // Kill any remaining processes
    await this.killRemainingProcesses();

    // Remove all lock files (do this last)
    this.removeAllLockFiles();

    console.log('✅ ULTIMATE STOP Complete - All processes killed');
  }

  async killTrackedProcesses() {
    if (fs.existsSync(this.processListFile)) {
      try {
        const processList = JSON.parse(fs.readFileSync(this.processListFile, 'utf8'));
        console.log('📋 Killing tracked processes...');
        
        for (const [service, pid] of Object.entries(processList)) {
          if (pid && service !== 'started') {
            try {
              process.kill(parseInt(pid), 'SIGKILL');
              console.log(`   ✅ Killed ${service} (PID: ${pid})`);
            } catch (e) {
              // Process might already be dead
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  removeAllLockFiles() {
    for (const file of this.lockFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✅ Removed ${file}`);
      }
    }
  }

  async killAllNodeProcesses() {
    const killCommands = [
      'pkill -f "next dev" || true',
      'pkill -f "nest start" || true',
      'pkill -f "npm run dev" || true',
      'pkill -f "npm run start:dev" || true',
      'pkill -f "dev-manager" || true',
      'pkill -f "dev-simple" || true',
      'pkill -f "dev-ultimate" || true',
      'pkill -f "dev-enterprise" || true',
      'pkill -f "v5-protected" || true',
      'pkill -f "stop-ultimate" || true'
    ];
    
    for (const cmd of killCommands) {
      try {
        await execAsync(cmd);
        console.log(`   ✅ Executed: ${cmd}`);
      } catch (error) {
        // Continue if no processes found
      }
    }
  }

  async killAllPortProcesses() {
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 4001, 4002, 4003, 4004, 4005, 9090, 9091];
    
    for (const port of ports) {
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          for (const pid of pids) {
            if (pid) {
              try {
                process.kill(parseInt(pid), 'SIGKILL');
                console.log(`   ✅ Killed process ${pid} on port ${port}`);
              } catch (error) {
                // Process already dead
              }
            }
          }
        }
      } catch (error) {
        // Port is free
      }
    }
  }

  async killRemainingProcesses() {
    try {
      // Kill any remaining Node.js processes
      await execAsync('pkill -f "node.*dev" || true');
      await execAsync('pkill -f "node.*start" || true');
      console.log('   ✅ Killed remaining Node.js processes');
    } catch (error) {
      // Continue
    }
  }
}

// Run the ultimate stop manager
const stopManager = new UltimateStopManager();
stopManager.stop().catch(error => {
  console.error('❌ ULTIMATE STOP failed:', error.message);
  process.exit(1);
});
