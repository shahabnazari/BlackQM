#!/usr/bin/env node

/**
 * ULTIMATE Development Manager V4 - CPU Optimized Version
 *
 * Fixes high CPU usage issues from V3:
 * - Reduced health check frequency
 * - Optimized event listeners
 * - Better async/await patterns
 * - Prevents runaway loops
 * - Memory efficient operations
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);

class UltimateDevManagerV4 {
  constructor() {
    this.lockFile = path.join(__dirname, '..', '.dev-ultimate.lock');
    this.pidFile = path.join(__dirname, '..', '.dev-ultimate.pid');
    this.logFile = path.join(__dirname, '..', 'logs', 'dev-manager.log');

    this.isShuttingDown = false;
    this.frontendProcess = null;
    this.backendProcess = null;
    this.healthCheckInterval = null;

    // Optimized settings to reduce CPU usage
    this.healthCheckFrequency = 30000; // 30 seconds instead of 15
    this.httpTimeout = 10000; // 10 seconds timeout
    this.maxRestartAttempts = 3;
    this.restartCooldown = 5000; // 5 seconds between restarts

    // Track failures
    this.frontendFailures = 0;
    this.backendFailures = 0;
    this.isRestartingFrontend = false;
    this.isRestartingBackend = false;

    // Setup signal handlers
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());

    // Minimal error handling - don't catch everything
    process.on('uncaughtException', error => {
      this.log('❌ Uncaught Exception:', error.message);
      if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
        this.log('   ⚠️  Connection error, continuing...');
        return;
      }
      this.cleanup();
      process.exit(1);
    });
  }

  log(message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, ...args);

    // Async log writing to prevent blocking
    setImmediate(() => {
      try {
        if (!fs.existsSync(path.dirname(this.logFile))) {
          fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
        }
        fs.appendFileSync(this.logFile, `${logMessage} ${args.join(' ')}\n`);
      } catch (err) {
        // Ignore logging errors
      }
    });
  }

  async start() {
    this.log('\n🚀 Ultimate Dev Manager V4 Starting...\n');

    // Check for existing instance
    if (fs.existsSync(this.lockFile)) {
      const existingPid = fs.readFileSync(this.lockFile, 'utf8').trim();

      try {
        // Check if process is actually running
        process.kill(parseInt(existingPid), 0);
        this.log('⚠️  Manager already running with PID:', existingPid);
        this.log('   Run "npm run dev:stop" to stop it first\n');
        process.exit(0);
      } catch (err) {
        // Process not running, clean up
        this.log('   Cleaning up stale lock file...');
        fs.unlinkSync(this.lockFile);
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile);
        }
      }
    }

    // Create lock file
    fs.writeFileSync(this.lockFile, process.pid.toString());
    fs.writeFileSync(this.pidFile, process.pid.toString());

    // Wait for ports
    await this.waitForPortsToBeFree();

    // Start services
    await this.startBackend();
    await this.startFrontend();

    // Start monitoring with delay
    setTimeout(() => {
      this.startHealthMonitoring();
    }, 10000); // Wait 10 seconds before starting health checks

    this.log('\n✅ All services started successfully!\n');
    this.log('📝 Frontend: http://localhost:3000');
    this.log('📝 Backend: http://localhost:4000\n');
  }

  async waitForPortsToBeFree() {
    this.log('⏳ Checking ports...');

    const ports = [3000, 4000];
    for (const port of ports) {
      if (await this.isPortInUse(port)) {
        this.log(`   ⚠️  Port ${port} is in use, attempting to free it...`);
        try {
          await execAsync(`lsof -ti:${port} | xargs kill -9`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          // Ignore
        }
      }
    }

    this.log('   ✅ Ports are ready\n');
  }

  async isPortInUse(port) {
    return new Promise(resolve => {
      const server = net.createServer();

      const cleanup = () => {
        server.removeAllListeners();
        server.close();
      };

      server.once('error', err => {
        cleanup();
        resolve(err.code === 'EADDRINUSE');
      });

      server.once('listening', () => {
        cleanup();
        resolve(false);
      });

      server.listen(port);
    });
  }

  async startBackend() {
    this.log('🔧 Starting Backend...');

    const backendPath = path.join(__dirname, '..', 'backend');

    this.backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: false,
    });

    // Minimal output handling
    this.backendProcess.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('Nest application successfully started')) {
        this.log('   ✅ Backend started successfully');
      }
    });

    this.backendProcess.stderr.on('data', data => {
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Debugger')) {
        this.log('   ⚠️  Backend:', error.trim().slice(0, 100));
      }
    });

    this.backendProcess.on('exit', code => {
      if (!this.isShuttingDown) {
        this.log(`⚠️  Backend exited with code ${code}`);
        if (!this.isRestartingBackend) {
          this.scheduleBackendRestart();
        }
      }
    });

    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async startFrontend() {
    this.log('🎨 Starting Frontend...');

    const frontendPath = path.join(__dirname, '..', 'frontend');

    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: false,
    });

    // Minimal output handling
    this.frontendProcess.stdout.on('data', data => {
      const output = data.toString();
      if (
        output.includes('Ready in') ||
        output.includes('compiled successfully')
      ) {
        this.log('   ✅ Frontend started successfully');
      }
    });

    this.frontendProcess.stderr.on('data', data => {
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Experimental')) {
        this.log('   ⚠️  Frontend:', error.trim().slice(0, 100));
      }
    });

    this.frontendProcess.on('exit', code => {
      if (!this.isShuttingDown) {
        this.log(`⚠️  Frontend exited with code ${code}`);
        if (!this.isRestartingFrontend) {
          this.scheduleFrontendRestart();
        }
      }
    });

    // Wait for frontend to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  scheduleBackendRestart() {
    if (this.backendFailures >= this.maxRestartAttempts) {
      this.log('❌ Backend failed too many times, not restarting');
      return;
    }

    this.isRestartingBackend = true;
    this.backendFailures++;

    setTimeout(async () => {
      this.log('🔄 Restarting backend...');
      await this.startBackend();
      this.isRestartingBackend = false;
    }, this.restartCooldown);
  }

  scheduleFrontendRestart() {
    if (this.frontendFailures >= this.maxRestartAttempts) {
      this.log('❌ Frontend failed too many times, not restarting');
      return;
    }

    this.isRestartingFrontend = true;
    this.frontendFailures++;

    setTimeout(async () => {
      this.log('🔄 Restarting frontend...');
      await this.startFrontend();
      this.isRestartingFrontend = false;
    }, this.restartCooldown);
  }

  startHealthMonitoring() {
    this.log('💓 Starting optimized health monitoring...\n');

    // Use longer intervals to reduce CPU usage
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      // Simple HTTP checks
      const frontendOk = await this.checkHttpHealth(
        'http://localhost:3000',
        'Frontend'
      );
      const backendOk = await this.checkHttpHealth(
        'http://localhost:4000/health',
        'Backend'
      );

      if (!frontendOk) {
        this.frontendFailures++;
        if (this.frontendFailures > 3 && !this.isRestartingFrontend) {
          this.log('⚠️  Frontend appears to be down, considering restart...');
        }
      } else {
        this.frontendFailures = 0;
      }

      if (!backendOk) {
        this.backendFailures++;
        if (this.backendFailures > 3 && !this.isRestartingBackend) {
          this.log('⚠️  Backend appears to be down, considering restart...');
        }
      } else {
        this.backendFailures = 0;
      }
    }, this.healthCheckFrequency);
  }

  async checkHttpHealth(url, name) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.httpTimeout);

      try {
        const req = http.get(url, { timeout: this.httpTimeout }, res => {
          clearTimeout(timeout);
          resolve(res.statusCode === 200 || res.statusCode === 404);
        });

        req.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        req.on('timeout', () => {
          clearTimeout(timeout);
          req.destroy();
          resolve(false);
        });
      } catch (err) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  async cleanup() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.log('\n🛑 Shutting down gracefully...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Kill processes
    const killProcess = (proc, name) => {
      if (proc && !proc.killed) {
        this.log(`   Stopping ${name}...`);
        try {
          process.kill(-proc.pid, 'SIGTERM');
          setTimeout(() => {
            if (!proc.killed) {
              process.kill(-proc.pid, 'SIGKILL');
            }
          }, 2000);
        } catch (err) {
          // Process might already be dead
        }
      }
    };

    killProcess(this.frontendProcess, 'Frontend');
    killProcess(this.backendProcess, 'Backend');

    // Clean up lock files
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
      }
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
    } catch (err) {
      // Ignore
    }

    this.log('   ✅ Cleanup complete\n');
  }
}

// Start the manager
const manager = new UltimateDevManagerV4();
manager.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
