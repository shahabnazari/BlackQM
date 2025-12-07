#!/usr/bin/env node

/**
 * ULTIMATE Development Manager V5 - Enhanced Process Control
 *
 * Major improvements over V4:
 * - Stronger single-instance enforcement
 * - Process group management to prevent orphans
 * - Better cleanup and signal handling
 * - Prevents processes from being started outside manager
 * - More robust port management
 * - Enhanced logging and debugging
 */

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class UltimateDevManagerV5 {
  constructor() {
    this.lockFile = path.join(__dirname, '..', '.dev-ultimate.lock');
    this.pidFile = path.join(__dirname, '..', '.dev-ultimate.pid');
    this.processListFile = path.join(__dirname, '..', '.dev-processes.json');
    this.logFile = path.join(__dirname, '..', 'logs', 'dev-manager.log');

    this.isShuttingDown = false;
    this.frontendProcess = null;
    this.backendProcess = null;
    this.healthCheckInterval = null;
    this.childProcesses = new Set();

    // Settings
    this.healthCheckFrequency = 30000; // 30 seconds
    this.httpTimeout = 10000;
    this.maxRestartAttempts = 3;
    this.restartCooldown = 5000;

    // Track failures
    this.frontendFailures = 0;
    this.backendFailures = 0;
    this.isRestartingFrontend = false;
    this.isRestartingBackend = false;

    // Setup signal handlers
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.log(`\n📌 Received ${signal}, shutting down...`);
        await this.cleanup();
        process.exit(0);
      });
    });

    process.on('exit', () => {
      this.cleanupSync();
    });

    process.on('uncaughtException', error => {
      this.log('❌ Uncaught Exception:', error.message);
      if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
        return;
      }
      this.cleanupSync();
      process.exit(1);
    });
  }

  log(message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, ...args);

    try {
      if (!fs.existsSync(path.dirname(this.logFile))) {
        fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      }
      fs.appendFileSync(this.logFile, `${logMessage} ${args.join(' ')}\n`);
    } catch (err) {
      // Ignore logging errors
    }
  }

  async start() {
    this.log('\n🚀 Ultimate Dev Manager V5 Starting...\n');

    // Check for existing instance FIRST
    if (await this.checkExistingInstance()) {
      this.log('⚠️  Another instance is already running');
      this.log('   Run "npm run stop" to stop it first\n');
      process.exit(0);
    }

    // Only kill existing processes if no manager is running
    await this.killExistingProcesses();

    // Create lock files
    this.createLockFiles();

    // Clean ports
    await this.cleanPorts();

    // Start services
    await this.startBackend();
    await this.startFrontend();

    // Start monitoring
    setTimeout(() => {
      this.startHealthMonitoring();
    }, 10000);

    this.log('\n✅ All services started successfully!\n');
    this.log('📝 Frontend: http://localhost:3000');
    this.log('📝 Backend: http://localhost:4000');
    this.log('📝 Manager PID:', process.pid);
    this.log('\n📌 Press Ctrl+C to stop all services\n');
  }

  async killExistingProcesses() {
    this.log('🧹 Cleaning up any existing processes...');

    const commands = [
      'pkill -f "next dev" || true',
      'pkill -f "nest start" || true',
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

    // Wait for processes to die
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async checkExistingInstance() {
    if (!fs.existsSync(this.lockFile)) {
      return false;
    }

    const existingPid = fs.readFileSync(this.lockFile, 'utf8').trim();

    try {
      // Check if process is running
      process.kill(parseInt(existingPid), 0);
      return true; // Process exists
    } catch (err) {
      // Process doesn't exist, clean up
      this.log('   Cleaning up stale lock files...');
      this.cleanupLockFiles();
      return false;
    }
  }

  createLockFiles() {
    fs.writeFileSync(this.lockFile, process.pid.toString());
    fs.writeFileSync(this.pidFile, process.pid.toString());
    fs.writeFileSync(
      this.processListFile,
      JSON.stringify(
        {
          manager: process.pid,
          frontend: null,
          backend: null,
          started: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }

  cleanupLockFiles() {
    const files = [this.lockFile, this.pidFile, this.processListFile];
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (err) {
        // Ignore
      }
    });
  }

  async cleanPorts() {
    this.log('⏳ Cleaning ports...');

    const ports = [3000, 4000];
    for (const port of ports) {
      if (await this.isPortInUse(port)) {
        this.log(`   ⚠️  Port ${port} is in use, killing process...`);
        try {
          execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
          await new Promise(resolve => setTimeout(resolve, 1000));
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

      server.once('error', err => {
        server.close();
        resolve(err.code === 'EADDRINUSE');
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }

  async startBackend() {
    this.log('🔧 Starting Backend...');

    const backendPath = path.join(__dirname, '..', 'backend');

    // Use exec instead of spawn for better process management
    this.backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      killSignal: 'SIGTERM',
    });

    this.childProcesses.add(this.backendProcess.pid);
    this.updateProcessList('backend', this.backendProcess.pid);

    this.backendProcess.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('Nest application successfully started')) {
        this.log(
          '   ✅ Backend started successfully (PID:',
          this.backendProcess.pid + ')'
        );
      }
    });

    this.backendProcess.stderr.on('data', data => {
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Debugger')) {
        this.log('   ⚠️  Backend:', error.trim().slice(0, 100));
      }
    });

    this.backendProcess.on('exit', (code, signal) => {
      this.childProcesses.delete(this.backendProcess.pid);
      if (!this.isShuttingDown) {
        this.log(`⚠️  Backend exited (code: ${code}, signal: ${signal})`);
        if (
          !this.isRestartingBackend &&
          this.backendFailures < this.maxRestartAttempts
        ) {
          this.scheduleBackendRestart();
        }
      }
    });

    // Wait for backend to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async startFrontend() {
    this.log('🎨 Starting Frontend...');

    const frontendPath = path.join(__dirname, '..', 'frontend');

    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      killSignal: 'SIGTERM',
    });

    this.childProcesses.add(this.frontendProcess.pid);
    this.updateProcessList('frontend', this.frontendProcess.pid);

    this.frontendProcess.stdout.on('data', data => {
      const output = data.toString();
      if (
        output.includes('Ready in') ||
        output.includes('compiled successfully')
      ) {
        this.log(
          '   ✅ Frontend started successfully (PID:',
          this.frontendProcess.pid + ')'
        );
      }
    });

    this.frontendProcess.stderr.on('data', data => {
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Experimental')) {
        this.log('   ⚠️  Frontend:', error.trim().slice(0, 100));
      }
    });

    this.frontendProcess.on('exit', (code, signal) => {
      this.childProcesses.delete(this.frontendProcess.pid);
      if (!this.isShuttingDown) {
        this.log(`⚠️  Frontend exited (code: ${code}, signal: ${signal})`);
        if (
          !this.isRestartingFrontend &&
          this.frontendFailures < this.maxRestartAttempts
        ) {
          this.scheduleFrontendRestart();
        }
      }
    });

    // Wait for frontend to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  updateProcessList(service, pid) {
    try {
      const data = JSON.parse(fs.readFileSync(this.processListFile, 'utf8'));
      data[service] = pid;
      fs.writeFileSync(this.processListFile, JSON.stringify(data, null, 2));
    } catch (err) {
      // Ignore
    }
  }

  scheduleBackendRestart() {
    this.isRestartingBackend = true;
    this.backendFailures++;

    setTimeout(async () => {
      this.log('🔄 Restarting backend...');
      await this.startBackend();
      this.isRestartingBackend = false;
    }, this.restartCooldown);
  }

  scheduleFrontendRestart() {
    this.isRestartingFrontend = true;
    this.frontendFailures++;

    setTimeout(async () => {
      this.log('🔄 Restarting frontend...');
      await this.startFrontend();
      this.isRestartingFrontend = false;
    }, this.restartCooldown);
  }

  startHealthMonitoring() {
    this.log('💓 Starting health monitoring...\n');

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      const frontendOk = await this.checkHttpHealth(
        'http://localhost:3000',
        'Frontend'
      );
      const backendOk = await this.checkHttpHealth(
        'http://localhost:4000/api',
        'Backend'
      );

      if (!frontendOk && !this.isRestartingFrontend) {
        this.frontendFailures++;
        if (this.frontendFailures > 3) {
          this.log('⚠️  Frontend health check failed');
        }
      } else {
        this.frontendFailures = 0;
      }

      if (!backendOk && !this.isRestartingBackend) {
        this.backendFailures++;
        if (this.backendFailures > 3) {
          this.log('⚠️  Backend health check failed');
        }
      } else {
        this.backendFailures = 0;
      }
    }, this.healthCheckFrequency);
  }

  async checkHttpHealth(url, name) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), this.httpTimeout);

      try {
        const urlObj = new URL(url);
        const req = http.get(
          {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            timeout: this.httpTimeout,
          },
          res => {
            clearTimeout(timeout);
            res.destroy();
            resolve(res.statusCode < 500);
          }
        );

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
      this.healthCheckInterval = null;
    }

    // Kill all child processes
    const killPromises = [];

    if (this.frontendProcess && !this.frontendProcess.killed) {
      this.log('   Stopping Frontend...');
      killPromises.push(this.killProcessTree(this.frontendProcess.pid));
    }

    if (this.backendProcess && !this.backendProcess.killed) {
      this.log('   Stopping Backend...');
      killPromises.push(this.killProcessTree(this.backendProcess.pid));
    }

    // Kill any remaining child processes
    for (const pid of this.childProcesses) {
      killPromises.push(this.killProcessTree(pid));
    }

    await Promise.all(killPromises);

    // Additional cleanup for any missed processes
    await this.killExistingProcesses();

    // Clean up lock files
    this.cleanupLockFiles();

    this.log('   ✅ Cleanup complete\n');
  }

  cleanupSync() {
    if (this.isShuttingDown) return;

    try {
      // Kill processes synchronously
      if (this.frontendProcess && !this.frontendProcess.killed) {
        process.kill(this.frontendProcess.pid, 'SIGKILL');
      }
      if (this.backendProcess && !this.backendProcess.killed) {
        process.kill(this.backendProcess.pid, 'SIGKILL');
      }

      // Clean up lock files
      this.cleanupLockFiles();
    } catch (err) {
      // Ignore
    }
  }

  async killProcessTree(pid) {
    if (!pid) return;

    return new Promise(resolve => {
      try {
        // On macOS/Linux, kill the process group
        if (process.platform !== 'win32') {
          exec(`pkill -P ${pid}`, () => {
            try {
              process.kill(pid, 'SIGTERM');
              setTimeout(() => {
                try {
                  process.kill(pid, 'SIGKILL');
                } catch (e) {}
                resolve();
              }, 2000);
            } catch (e) {
              resolve();
            }
          });
        } else {
          // On Windows
          exec(`taskkill /PID ${pid} /T /F`, () => resolve());
        }
      } catch (err) {
        resolve();
      }
    });
  }
}

// Prevent direct execution of frontend/backend outside manager
if (process.argv.includes('--check-manager')) {
  const lockFile = path.join(__dirname, '..', '.dev-ultimate.lock');
  if (!fs.existsSync(lockFile)) {
    console.error(
      '\n❌ ERROR: Services must be started through the dev manager!'
    );
    console.error('   Please use: npm run dev\n');
    process.exit(1);
  }
}

// Start the manager
const manager = new UltimateDevManagerV5();
manager.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
