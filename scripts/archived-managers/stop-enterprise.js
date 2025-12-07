#!/usr/bin/env node

/**
 * ENTERPRISE DEV MANAGER - STOP SCRIPT
 * 
 * Gracefully stops all development processes and cleans up lock files
 * 
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class EnterpriseStopManager {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.lockFile = path.join(this.rootDir, '.dev-enterprise.lock');
    this.pidFile = path.join(this.rootDir, '.dev-enterprise.pid');
    this.stateFile = path.join(this.rootDir, '.dev-enterprise-state.json');
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async stop() {
    this.log('\n🛑 Stopping Enterprise Development Environment...\n');

    // Step 1: Kill manager process if running
    await this.killManagerProcess();

    // Step 2: Kill all development processes
    await this.killAllProcesses();

    // Step 3: Clean lock files
    this.cleanLockFiles();

    // Step 4: Verify cleanup
    await this.verifyCleanup();

    this.log('\n✅ All processes stopped successfully!\n');
  }

  async killManagerProcess() {
    if (!fs.existsSync(this.pidFile)) {
      this.log('   No manager PID file found');
      return;
    }

    try {
      const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
      this.log(`   Killing manager process (PID: ${pid})...`);
      
      try {
        process.kill(parseInt(pid), 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force kill if still running
        try {
          process.kill(parseInt(pid), 'SIGKILL');
        } catch (e) {
          // Process already dead
        }
      } catch (err) {
        this.log('   Manager process already stopped');
      }
    } catch (err) {
      this.log('   Could not read PID file');
    }
  }

  async killAllProcesses() {
    this.log('   Killing all development processes...');

    const commands = [
      'pkill -f "next dev" || true',
      'pkill -f "nest start" || true',
      'pkill -f "dev-enterprise" || true',
      'pkill -f "dev-ultimate" || true',
      'lsof -ti:3000 | xargs kill -9 2>/dev/null || true',
      'lsof -ti:4000 | xargs kill -9 2>/dev/null || true',
    ];

    for (const cmd of commands) {
      try {
        execSync(cmd, { stdio: 'ignore' });
      } catch (e) {
        // Ignore errors
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    this.log('   ✅ All processes killed');
  }

  cleanLockFiles() {
    this.log('   Cleaning lock files...');

    const files = [this.lockFile, this.pidFile, this.stateFile];
    
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          this.log(`   ✅ Removed ${path.basename(file)}`);
        }
      } catch (err) {
        this.log(`   ⚠️  Could not remove ${path.basename(file)}`);
      }
    });
  }

  async verifyCleanup() {
    this.log('\n   Verifying cleanup...');

    // Check for remaining processes
    try {
      const nextProcs = execSync('ps aux | grep "next dev" | grep -v grep | wc -l', { encoding: 'utf8' }).trim();
      const nestProcs = execSync('ps aux | grep "nest start" | grep -v grep | wc -l', { encoding: 'utf8' }).trim();

      if (parseInt(nextProcs) === 0 && parseInt(nestProcs) === 0) {
        this.log('   ✅ No development processes running');
      } else {
        this.log(`   ⚠️  Found ${nextProcs} Next.js and ${nestProcs} NestJS processes still running`);
      }
    } catch (err) {
      // Ignore
    }

    // Check ports
    try {
      const port3000 = execSync('lsof -ti:3000 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
      const port4000 = execSync('lsof -ti:4000 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();

      if (parseInt(port3000) === 0 && parseInt(port4000) === 0) {
        this.log('   ✅ Ports 3000 and 4000 are free');
      } else {
        this.log('   ⚠️  Some ports still in use');
      }
    } catch (err) {
      // Ignore
    }
  }
}

// Execute
const manager = new EnterpriseStopManager();
manager.stop().catch(err => {
  console.error('❌ Error during shutdown:', err.message);
  process.exit(1);
});
