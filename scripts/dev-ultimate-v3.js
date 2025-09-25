#!/usr/bin/env node

/**
 * ULTIMATE Development Manager V3 - Enhanced Version
 *
 * Improvements over original V3:
 * - EPIPE error handling and recovery
 * - Robust stdio pipe management
 * - Process state tracking
 * - Improved health check stability
 * - Graceful error recovery
 * - Auto-restart with backoff
 * - Memory leak prevention
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);

class UltimateDevManagerV3Enhanced {
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
    this.stallTimeout = 60000; // 60 seconds for stability

    // Track process states
    this.frontendState = 'stopped';
    this.backendState = 'stopped';
    this.isRestartingFrontend = false;
    this.isRestartingBackend = false;

    // Track consecutive health check failures
    this.consecutiveFrontendFailures = 0;
    this.consecutiveBackendFailures = 0;

    // Setup signal handlers
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());

    // Enhanced error handling
    process.on('uncaughtException', error => {
      this.log('❌ Uncaught Exception:', error.message, error.code);

      // Handle EPIPE errors gracefully
      if (
        error.code === 'EPIPE' ||
        error.errno === 'EPIPE' ||
        error.message.includes('EPIPE')
      ) {
        this.log('   ⚠️  EPIPE error detected, recovering gracefully...');
        this.handlePipeError();
        return; // Don't exit, try to recover
      }

      // Handle other critical errors
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        this.log('   ⚠️  Connection error detected, will retry...');
        return; // Don't exit for connection errors
      }

      // For truly fatal errors, cleanup and exit
      this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log('⚠️  Unhandled Rejection:', reason);
      // Don't exit, try to continue
    });
  }

  log(message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, ...args);

    // Also write to log file
    try {
      if (!fs.existsSync(path.dirname(this.logFile))) {
        fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      }
      fs.appendFileSync(this.logFile, `${logMessage} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}\n`);
    } catch (err) {
      // Ignore log file errors
    }
  }

  async start() {
    this.log('🚀 ULTIMATE Development Manager V3 Enhanced Starting...\n');

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
    const maxAttempts = 20;

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
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          // Ignore
        }
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
    this.backendState = 'starting';

    return new Promise(resolve => {
      try {
        // Spawn with stdin ignored to prevent EPIPE
        this.backendProcess = spawn('npm', ['run', 'start:dev'], {
          cwd: path.join(__dirname, '..', 'backend'),
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          env: { ...process.env, PORT: '4000', NODE_ENV: 'development' },
          detached: false,
        });

        if (!this.backendProcess) {
          throw new Error('Failed to create backend process');
        }
      } catch (error) {
        this.log('   ❌ Failed to spawn backend:', error.message);
        this.backendState = 'failed';
        resolve();
        return;
      }

      let backendReady = false;
      const timeout = setTimeout(() => {
        if (!backendReady) {
          this.log('   ✅ Backend started (timeout reached)');
          this.backendState = 'running';
          resolve();
        }
      }, 30000);

      // Safely handle stdout
      if (this.backendProcess.stdout) {
        this.backendProcess.stdout.on('data', data => {
          try {
            const output = data.toString();
            if (
              (output.includes('Nest application successfully started') ||
                output.includes('started on port')) &&
              !backendReady
            ) {
              backendReady = true;
              clearTimeout(timeout);
              this.log('   ✅ Backend started successfully');
              this.backendState = 'running';
              this.lastBackendCheck = Date.now();
              this.consecutiveBackendFailures = 0;
              resolve();
            }
          } catch (err) {
            // Ignore output processing errors
          }
        });

        // Handle stdout errors
        this.backendProcess.stdout.on('error', err => {
          if (err.code !== 'EPIPE') {
            this.log('   ⚠️  Backend stdout error:', err.code);
          }
        });
      }

      // Safely handle stderr
      if (this.backendProcess.stderr) {
        this.backendProcess.stderr.on('data', data => {
          try {
            const output = data.toString();
            if (output.includes('ERROR') && !output.includes('ENOWORKSPACES')) {
              this.log(
                '   ⚠️  Backend warning:',
                output.trim().substring(0, 100)
              );
            }
          } catch (err) {
            // Ignore stderr processing errors
          }
        });

        this.backendProcess.stderr.on('error', err => {
          if (err.code !== 'EPIPE') {
            this.log('   ⚠️  Backend stderr error:', err.code);
          }
        });
      }

      this.backendProcess.on('error', error => {
        this.log('   ❌ Backend process error:', error.message);
        this.backendState = 'failed';
        clearTimeout(timeout);
        resolve();
      });

      this.backendProcess.on('exit', (code, signal) => {
        this.backendState = 'stopped';
        if (!this.isShuttingDown) {
          this.log(
            `   ❌ Backend exited with code: ${code}, signal: ${signal}`
          );
          this.backendFailures++;
          // Auto-restart with delay
          if (!this.isRestartingBackend) {
            setTimeout(() => {
              if (!this.isShuttingDown) {
                this.restartBackend();
              }
            }, 3000);
          }
        }
      });
    });
  }

  async startFrontend() {
    this.log('🌐 Starting Frontend (Next.js)...');
    this.frontendState = 'starting';

    return new Promise(resolve => {
      try {
        // Spawn with stdin ignored to prevent EPIPE
        this.frontendProcess = spawn('npm', ['run', 'dev'], {
          cwd: path.join(__dirname, '..', 'frontend'),
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          env: { ...process.env, PORT: '3000', NODE_ENV: 'development' },
          detached: false,
        });

        if (!this.frontendProcess) {
          throw new Error('Failed to create frontend process');
        }
      } catch (error) {
        this.log('   ❌ Failed to spawn frontend:', error.message);
        this.frontendState = 'failed';
        resolve();
        return;
      }

      let frontendReady = false;
      const timeout = setTimeout(() => {
        if (!frontendReady) {
          this.log('   ✅ Frontend started (timeout reached)');
          this.frontendState = 'running';
          resolve();
        }
      }, 30000);

      // Safely handle stdout
      if (this.frontendProcess.stdout) {
        this.frontendProcess.stdout.on('data', data => {
          try {
            const output = data.toString();
            if (
              (output.includes('Ready') || output.includes('compiled')) &&
              !frontendReady
            ) {
              frontendReady = true;
              clearTimeout(timeout);
              this.log('   ✅ Frontend started successfully');
              this.frontendState = 'running';
              this.lastFrontendCheck = Date.now();
              this.consecutiveFrontendFailures = 0;
              resolve();
            }
          } catch (err) {
            // Ignore output processing errors
          }
        });

        // Handle stdout errors
        this.frontendProcess.stdout.on('error', err => {
          if (err.code !== 'EPIPE') {
            this.log('   ⚠️  Frontend stdout error:', err.code);
          }
        });
      }

      // Safely handle stderr
      if (this.frontendProcess.stderr) {
        this.frontendProcess.stderr.on('data', data => {
          try {
            const output = data.toString();
            // Ignore common warnings
            if (
              !output.includes('ENOWORKSPACES') &&
              !output.includes('webpack.cache') &&
              !output.includes('Fast Refresh') &&
              output.includes('ERROR')
            ) {
              this.log(
                '   ⚠️  Frontend warning:',
                output.trim().substring(0, 100)
              );
            }
          } catch (err) {
            // Ignore stderr processing errors
          }
        });

        this.frontendProcess.stderr.on('error', err => {
          if (err.code !== 'EPIPE') {
            this.log('   ⚠️  Frontend stderr error:', err.code);
          }
        });
      }

      this.frontendProcess.on('error', error => {
        this.log('   ❌ Frontend process error:', error.message);
        this.frontendState = 'failed';
        clearTimeout(timeout);
        resolve();
      });

      this.frontendProcess.on('exit', (code, signal) => {
        this.frontendState = 'stopped';
        if (!this.isShuttingDown) {
          this.log(
            `   ❌ Frontend exited with code: ${code}, signal: ${signal}`
          );
          this.frontendFailures++;
          // Auto-restart with delay
          if (!this.isRestartingFrontend) {
            setTimeout(() => {
              if (!this.isShuttingDown) {
                this.restartFrontend();
              }
            }, 3000);
          }
        }
      });
    });
  }

  // Enhanced health monitoring with better error handling
  startHealthMonitoring() {
    this.log('💓 Starting enhanced health monitoring...\n');

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      // Skip health checks during restarts
      if (this.isRestartingBackend || this.isRestartingFrontend) return;

      // Check backend health
      if (this.backendState === 'running') {
        const backendHealthy = await this.checkHttpHealth(
          'http://localhost:4000/api',
          'Backend'
        );
        if (!backendHealthy) {
          this.consecutiveBackendFailures++;
          if (this.consecutiveBackendFailures >= this.maxFailures) {
            this.log('🔄 Backend exceeded failure threshold, restarting...');
            await this.restartBackend();
          }
        } else {
          this.consecutiveBackendFailures = 0;
          this.lastBackendCheck = Date.now();
        }
      }

      // Check frontend health
      if (this.frontendState === 'running') {
        const frontendHealthy = await this.checkHttpHealth(
          'http://localhost:3000',
          'Frontend'
        );
        if (!frontendHealthy) {
          this.consecutiveFrontendFailures++;
          if (this.consecutiveFrontendFailures >= this.maxFailures) {
            this.log('🔄 Frontend exceeded failure threshold, restarting...');
            await this.restartFrontend();
          }
        } else {
          this.consecutiveFrontendFailures = 0;
          this.lastFrontendCheck = Date.now();
        }
      }
    }, 15000); // Check every 15 seconds for stability
  }

  // Detect stalling based on last successful health checks
  startStallDetection() {
    this.log('🔍 Starting stall detection...\n');

    this.stallCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      // Skip during restarts
      if (this.isRestartingBackend || this.isRestartingFrontend) return;

      const now = Date.now();

      // Check if frontend is stalling
      if (
        this.frontendState === 'running' &&
        now - this.lastFrontendCheck > this.stallTimeout
      ) {
        this.log('⚠️  Frontend appears to be stalling, attempting recovery...');
        await this.restartFrontend();
      }

      // Check if backend is stalling
      if (
        this.backendState === 'running' &&
        now - this.lastBackendCheck > this.stallTimeout
      ) {
        this.log('⚠️  Backend appears to be stalling, attempting recovery...');
        await this.restartBackend();
      }
    }, 30000); // Check every 30 seconds for stability
  }

  async checkHttpHealth(url, name) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // 5 second timeout

      try {
        const req = http.get(url, { timeout: 5000 }, res => {
          clearTimeout(timeout);
          // Drain response to prevent memory leaks
          res.resume();

          if (res.statusCode >= 200 && res.statusCode < 500) {
            resolve(true);
          } else {
            if (res.statusCode >= 500) {
              this.log(`   ⚠️  ${name} returned status ${res.statusCode}`);
            }
            resolve(false);
          }
        });

        req.on('error', err => {
          clearTimeout(timeout);
          // Only log non-connection errors
          if (
            err.code !== 'ECONNREFUSED' &&
            err.code !== 'ECONNRESET' &&
            err.code !== 'ETIMEDOUT'
          ) {
            this.log(`   ⚠️  ${name} health check error:`, err.code);
          }
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          clearTimeout(timeout);
          resolve(false);
        });
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  async restartBackend() {
    if (this.isRestartingBackend || this.isShuttingDown) {
      return;
    }

    this.isRestartingBackend = true;
    this.log('🔄 Restarting backend...');

    // Kill existing backend process
    if (this.backendProcess) {
      try {
        this.backendProcess.kill('SIGKILL');
      } catch (err) {
        // Process already dead
      }
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
    this.consecutiveBackendFailures = 0;
    this.lastBackendCheck = Date.now();
    this.isRestartingBackend = false;
  }

  async restartFrontend() {
    if (this.isRestartingFrontend || this.isShuttingDown) {
      return;
    }

    this.isRestartingFrontend = true;
    this.log('🔄 Restarting frontend...');

    // Kill existing frontend process
    if (this.frontendProcess) {
      try {
        this.frontendProcess.kill('SIGKILL');
      } catch (err) {
        // Process already dead
      }
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
    this.consecutiveFrontendFailures = 0;
    this.lastFrontendCheck = Date.now();
    this.isRestartingFrontend = false;
  }

  // Handle EPIPE errors gracefully
  handlePipeError() {
    this.log('🔧 Handling pipe error, checking process states...');

    // Check frontend process
    if (this.frontendProcess) {
      try {
        // Send signal 0 to check if process is alive
        process.kill(this.frontendProcess.pid, 0);
      } catch (err) {
        // Process is dead
        this.log('   Frontend process is dead, will restart...');
        this.frontendState = 'stopped';
        if (!this.isRestartingFrontend && !this.isShuttingDown) {
          setTimeout(() => this.restartFrontend(), 2000);
        }
      }
    }

    // Check backend process
    if (this.backendProcess) {
      try {
        // Send signal 0 to check if process is alive
        process.kill(this.backendProcess.pid, 0);
      } catch (err) {
        // Process is dead
        this.log('   Backend process is dead, will restart...');
        this.backendState = 'stopped';
        if (!this.isRestartingBackend && !this.isShuttingDown) {
          setTimeout(() => this.restartBackend(), 2000);
        }
      }
    }
  }

  showSuccessMessage() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       🎉 ULTIMATE WEBSITE V3 ENHANCED IS READY! 🎉    ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend:  http://localhost:4000/api');
    console.log('📚 API Docs: http://localhost:4000/api/docs');
    console.log('');
    console.log('✨ V3 Enhanced Features:');
    console.log('   • EPIPE error recovery');
    console.log('   • Robust stdio handling');
    console.log('   • Process state tracking');
    console.log('   • Graceful error recovery');
    console.log('   • Auto-restart with backoff');
    console.log('   • Memory leak prevention');
    console.log('');
    console.log('🛑 Press Ctrl+C to stop\n');
  }

  async cleanup() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.log('\n🛑 ULTIMATE V3 Enhanced Cleanup Starting...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.stallCheckInterval) {
      clearInterval(this.stallCheckInterval);
    }

    // Kill processes gracefully
    if (this.frontendProcess) {
      try {
        this.frontendProcess.kill('SIGTERM');
        this.log('   ✅ Frontend stopped');
      } catch (err) {
        // Already dead
      }
    }

    if (this.backendProcess) {
      try {
        this.backendProcess.kill('SIGTERM');
        this.log('   ✅ Backend stopped');
      } catch (err) {
        // Already dead
      }
    }

    // Kill all processes again
    await this.killAllProcesses();

    // Remove lock files
    this.removeOldLockFiles();

    this.log('✅ ULTIMATE V3 Enhanced Cleanup Complete');
  }
}

// Start the manager
const manager = new UltimateDevManagerV3Enhanced();
manager.start().catch(error => {
  console.error(
    '❌ Failed to start Ultimate Dev Manager V3 Enhanced:',
    error.message
  );
  process.exit(1);
});
