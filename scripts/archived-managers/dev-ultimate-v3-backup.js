#!/usr/bin/env node

/**
 * ULTIMATE Development Manager V3 - Enhanced Version
 *
 * Improvements over V2:
 * - Active HTTP health checks instead of just process checks
 * - Automatic restart on stalling detection
 * - Better error recovery
 * - Memory leak prevention
 * - Connection timeout handling
 * - Detailed logging
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);

class UltimateDevManagerV3 {
  constructor() {
    this.lockFile = path.join(__dirname, '..', '.dev-ultimate.lock');
    this.pidFile = path.join(__dirname, '..', '.dev-ultimate.pid');
    this.logFile = path.join(__dirname, '..', 'logs', 'dev-manager.log');

    this.isShuttingDown = false;
    this.frontendProcess = null;
    this.backendProcess = null;
    this.healthCheckInterval = null;
    this.stallCheckInterval = null;

    // Track failures for automatic recovery
    this.frontendFailures = 0;
    this.backendFailures = 0;
    this.maxFailures = 3;

    // Track last successful health checks
    this.lastFrontendCheck = Date.now();
    this.lastBackendCheck = Date.now();
    this.stallTimeout = 30000; // 30 seconds

    // Setup signal handlers
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());
    process.on('uncaughtException', error => {
      this.log('❌ Uncaught Exception:', error.message);
      this.cleanup();
      process.exit(1);
    });
  }

  log(message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, ...args);

    // Also write to log file
    if (!fs.existsSync(path.dirname(this.logFile))) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    }
    fs.appendFileSync(this.logFile, `${logMessage} ${args.join(' ')}\n`);
  }

  async start() {
    this.log('🚀 ULTIMATE Development Manager V3 Starting...\n');

    // Step 1: Kill ALL existing processes
    await this.killAllProcesses();

    // Step 2: Wait for ports to be free
    await this.waitForPortsToBeFree();

    // Step 3: Create lock files
    this.createLockFiles();

    // Step 4: Start backend
    await this.startBackend();

    // Step 5: Start frontend
    await this.startFrontend();

    // Step 6: Start enhanced health monitoring
    this.startHealthMonitoring();

    // Step 7: Start stall detection
    this.startStallDetection();

    // Show success message
    this.showSuccessMessage();
  }

  async killAllProcesses() {
    this.log('🧹 KILLING ALL EXISTING PROCESSES...');

    const killCommands = [
      'pkill -9 -f "next dev" || true',
      'pkill -9 -f "nest start" || true',
      'pkill -9 -f "npm run dev" || true',
      'pkill -9 -f "npm run start:dev" || true',
      'pkill -9 -f "dev-manager" || true',
      'pkill -9 -f "dev-simple" || true',
      'pkill -9 -f "dev-ultimate" || true',
      'pkill -9 -f "stop-ultimate" || true',
      'pkill -9 -f "node.*blackQmethhod" || true',
    ];

    for (const cmd of killCommands) {
      try {
        await execAsync(cmd);
        this.log(`   ✅ Executed: ${cmd}`);
      } catch (error) {
        // Ignore errors - process might not exist
      }
    }

    // Kill processes on specific ports
    await this.killPortProcesses();

    // Remove old lock files
    this.removeOldLockFiles();

    this.log('   ✅ All processes killed\n');
  }

  async killPortProcesses() {
    const ports = [3000, 3001, 3002, 4000, 4001, 4002, 5000, 5001];

    for (const port of ports) {
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          for (const pid of pids) {
            if (pid) {
              try {
                process.kill(parseInt(pid), 'SIGKILL');
                this.log(`   ✅ Killed process ${pid} on port ${port}`);
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

  async waitForPortsToBeFree() {
    this.log('⏳ Waiting for ports to be free...');

    const ports = [3000, 4000];
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts

    while (attempts < maxAttempts) {
      let allPortsFree = true;

      for (const port of ports) {
        if (await this.isPortInUse(port)) {
          allPortsFree = false;
          // Try to force kill the process
          try {
            await execAsync(`lsof -ti:${port} | xargs kill -9`);
          } catch (e) {
            // Ignore
          }
          break;
        }
      }

      if (allPortsFree) {
        this.log('   ✅ All ports are free\n');
        return;
      }

      attempts++;
      this.log(
        `   ⏳ Attempt ${attempts}/${maxAttempts} - waiting for ports...`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.log('   ⚠️  Some ports may still be in use, continuing...\n');
  }

  async isPortInUse(port) {
    return new Promise(resolve => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(false));
        server.close();
      });
      server.on('error', () => resolve(true));
    });
  }

  removeOldLockFiles() {
    const lockFiles = [
      '.dev-manager.lock',
      '.dev-simple.lock',
      '.dev-ultimate.lock',
      '.dev-ultimate.pid',
    ];

    for (const file of lockFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  createLockFiles() {
    fs.writeFileSync(this.lockFile, process.pid.toString());
    fs.writeFileSync(this.pidFile, process.pid.toString());
    this.log('   ✅ Lock files created\n');
  }

  async startBackend() {
    this.log('🔧 Starting Backend (NestJS)...');

    return new Promise(resolve => {
      this.backendProcess = spawn('npm', ['run', 'start:dev'], {
        cwd: path.join(__dirname, '..', 'backend'),
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, PORT: '4000', NODE_ENV: 'development' },
      });

      let backendReady = false;
      const timeout = setTimeout(() => {
        if (!backendReady) {
          this.log('   ✅ Backend started (timeout reached)');
          resolve();
        }
      }, 30000);

      this.backendProcess.stdout.on('data', data => {
        const output = data.toString();
        if (
          (output.includes('Nest application successfully started') ||
            output.includes('started on port')) &&
          !backendReady
        ) {
          backendReady = true;
          clearTimeout(timeout);
          this.log('   ✅ Backend started successfully');
          this.lastBackendCheck = Date.now();
          resolve();
        }
      });

      this.backendProcess.stderr.on('data', data => {
        const output = data.toString();
        if (output.includes('ERROR') || output.includes('Error')) {
          this.log('   ⚠️  Backend warning:', output.trim().substring(0, 100));
        }
      });

      this.backendProcess.on('error', error => {
        this.log('   ❌ Failed to start backend:', error.message);
        clearTimeout(timeout);
        resolve(); // Continue anyway
      });

      this.backendProcess.on('exit', code => {
        if (code !== 0 && !this.isShuttingDown) {
          this.log('   ❌ Backend exited with code:', code);
          this.backendFailures++;
        }
      });
    });
  }

  async startFrontend() {
    this.log('🌐 Starting Frontend (Next.js)...');

    return new Promise(resolve => {
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..', 'frontend'),
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, PORT: '3000', NODE_ENV: 'development' },
      });

      let frontendReady = false;
      const timeout = setTimeout(() => {
        if (!frontendReady) {
          this.log('   ✅ Frontend started (timeout reached)');
          resolve();
        }
      }, 30000);

      this.frontendProcess.stdout.on('data', data => {
        const output = data.toString();
        if (
          (output.includes('Ready') || output.includes('compiled')) &&
          !frontendReady
        ) {
          frontendReady = true;
          clearTimeout(timeout);
          this.log('   ✅ Frontend started successfully');
          this.lastFrontendCheck = Date.now();
          resolve();
        }
      });

      this.frontendProcess.stderr.on('data', data => {
        const output = data.toString();
        // Ignore npm workspace warnings
        if (
          !output.includes('ENOWORKSPACES') &&
          (output.includes('ERROR') || output.includes('Error'))
        ) {
          this.log('   ⚠️  Frontend warning:', output.trim().substring(0, 100));
        }
      });

      this.frontendProcess.on('error', error => {
        this.log('   ❌ Failed to start frontend:', error.message);
        clearTimeout(timeout);
        resolve(); // Continue anyway
      });

      this.frontendProcess.on('exit', code => {
        if (code !== 0 && !this.isShuttingDown) {
          this.log('   ❌ Frontend exited with code:', code);
          this.frontendFailures++;
        }
      });
    });
  }

  // Enhanced health monitoring with HTTP checks
  startHealthMonitoring() {
    this.log('💓 Starting enhanced health monitoring...\n');

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      // Check backend health via HTTP
      const backendHealthy = await this.checkHttpHealth(
        'http://localhost:4000/api',
        'Backend'
      );
      if (!backendHealthy) {
        this.backendFailures++;
        if (this.backendFailures >= this.maxFailures) {
          this.log('🔄 Backend exceeded failure threshold, restarting...');
          await this.restartBackend();
        }
      } else {
        this.backendFailures = 0;
        this.lastBackendCheck = Date.now();
      }

      // Check frontend health via HTTP
      const frontendHealthy = await this.checkHttpHealth(
        'http://localhost:3000',
        'Frontend'
      );
      if (!frontendHealthy) {
        this.frontendFailures++;
        if (this.frontendFailures >= this.maxFailures) {
          this.log('🔄 Frontend exceeded failure threshold, restarting...');
          await this.restartFrontend();
        }
      } else {
        this.frontendFailures = 0;
        this.lastFrontendCheck = Date.now();
      }
    }, 5000); // Check every 5 seconds
  }

  // Detect stalling based on last successful health checks
  startStallDetection() {
    this.log('🔍 Starting stall detection...\n');

    this.stallCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      const now = Date.now();

      // Check if frontend is stalling
      if (now - this.lastFrontendCheck > this.stallTimeout) {
        this.log('⚠️  Frontend appears to be stalling, attempting recovery...');
        await this.restartFrontend();
      }

      // Check if backend is stalling
      if (now - this.lastBackendCheck > this.stallTimeout) {
        this.log('⚠️  Backend appears to be stalling, attempting recovery...');
        await this.restartBackend();
      }
    }, 10000); // Check every 10 seconds
  }

  async checkHttpHealth(url, name) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        this.log(`   ⚠️  ${name} health check timeout`);
        resolve(false);
      }, 3000); // 3 second timeout

      http
        .get(url, res => {
          clearTimeout(timeout);
          if (res.statusCode >= 200 && res.statusCode < 500) {
            resolve(true);
          } else {
            this.log(`   ⚠️  ${name} returned status ${res.statusCode}`);
            resolve(false);
          }
        })
        .on('error', err => {
          clearTimeout(timeout);
          this.log(`   ⚠️  ${name} health check failed:`, err.message);
          resolve(false);
        });
    });
  }

  async restartBackend() {
    this.log('🔄 Restarting backend...');

    // Kill existing backend process
    if (this.backendProcess) {
      this.backendProcess.kill('SIGKILL');
      this.backendProcess = null;
    }

    // Kill any orphaned backend processes
    try {
      await execAsync('pkill -9 -f "nest start" || true');
      await execAsync('lsof -ti:4000 | xargs kill -9 || true');
    } catch (e) {
      // Ignore
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Restart
    await this.startBackend();
    this.backendFailures = 0;
    this.lastBackendCheck = Date.now();
  }

  async restartFrontend() {
    this.log('🔄 Restarting frontend...');

    // Kill existing frontend process
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGKILL');
      this.frontendProcess = null;
    }

    // Kill any orphaned frontend processes
    try {
      await execAsync('pkill -9 -f "next dev" || true');
      await execAsync('lsof -ti:3000 | xargs kill -9 || true');
    } catch (e) {
      // Ignore
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Restart
    await this.startFrontend();
    this.frontendFailures = 0;
    this.lastFrontendCheck = Date.now();
  }

  showSuccessMessage() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║         🎉 ULTIMATE WEBSITE V3 IS READY! 🎉          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend:  http://localhost:4000/api');
    console.log('📚 API Docs: http://localhost:4000/api/docs');
    console.log('');
    console.log('✨ V3 Features:');
    console.log('   • Active HTTP health monitoring');
    console.log('   • Automatic stall detection & recovery');
    console.log('   • Enhanced error handling');
    console.log('   • Detailed logging to logs/dev-manager.log');
    console.log('');
    console.log('🛑 Press Ctrl+C to stop\n');
  }

  async cleanup() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.log('\n🛑 ULTIMATE V3 Cleanup Starting...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.stallCheckInterval) {
      clearInterval(this.stallCheckInterval);
    }

    // Kill processes
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
      this.log('   ✅ Frontend stopped');
    }

    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      this.log('   ✅ Backend stopped');
    }

    // Kill all processes again
    await this.killAllProcesses();

    // Remove lock files
    this.removeOldLockFiles();

    this.log('✅ ULTIMATE V3 Cleanup Complete');
  }
}

// Start the manager
const manager = new UltimateDevManagerV3();
manager.start().catch(error => {
  console.error('❌ Failed to start Ultimate Dev Manager V3:', error.message);
  process.exit(1);
});
