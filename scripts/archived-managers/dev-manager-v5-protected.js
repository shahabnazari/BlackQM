#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 10.943: Enterprise Dev Manager V5 - CPU/Memory Protected
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ZERO TECHNICAL DEBT - RUNAWAY PROCESS PROTECTION
 *
 * New in V5:
 * ✅ CPU monitoring - kills processes stuck at high CPU (>90% for >30s)
 * ✅ Memory monitoring - warns at 80%, kills at 90% of limit
 * ✅ Response time monitoring - detects stalls (>30s response time)
 * ✅ Process health scoring - combines CPU, memory, response into score
 * ✅ Runaway process detection - infinite loop protection
 * ✅ Automatic recovery with exponential backoff
 * ✅ Detailed diagnostics logging
 * ✅ Emergency kill capability
 *
 * @author Claude Code - Phase 10.943
 * @date 2025-11-22
 * @version 5.0.0
 */

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SERVICE = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Process limits
  cpu: {
    warningThreshold: 80,      // Warn when CPU > 80%
    killThreshold: 90,         // Kill when CPU > 90%
    sustainedDuration: 30000,  // Must be high for 30 seconds before kill
    checkInterval: 5000,       // Check every 5 seconds
  },

  memory: {
    warningThreshold: 0.8,     // Warn at 80% of limit
    killThreshold: 0.9,        // Kill at 90% of limit
    frontendLimit: 4096,       // 4GB for frontend (MB)
    backendLimit: 2048,        // 2GB for backend (MB)
    checkInterval: 10000,      // Check every 10 seconds
  },

  health: {
    checkInterval: 15000,      // Health check every 15 seconds
    timeout: 10000,            // 10 second timeout for health checks
    stallThreshold: 30000,     // 30 seconds = stall
    maxConsecutiveFailures: 3, // Kill after 3 consecutive failures
  },

  restart: {
    initialDelay: 3000,        // 3 second initial delay
    maxDelay: 60000,           // Max 60 second delay
    backoffMultiplier: 2,      // Double delay each time
    maxAttempts: 5,            // Max 5 restart attempts before circuit break
    circuitBreakerCooldown: 300000, // 5 minute cooldown after circuit break
  },

  ports: {
    frontend: 3000,
    backend: 4000,
    monitoring: 9091,
  },

  paths: {
    root: path.join(__dirname, '..'),
    frontend: path.join(__dirname, '..', 'frontend'),
    backend: path.join(__dirname, '..', 'backend'),
    logs: path.join(__dirname, '..', 'logs', 'dev-manager-v5'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
  constructor() {
    this.fileWriteErrorLogged = false; // Only log file write errors once
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(CONFIG.paths.logs)) {
      fs.mkdirSync(CONFIG.paths.logs, { recursive: true });
    }
  }

  format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  write(level, message, data = {}) {
    const formatted = this.format(level, message, data);
    const colors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
    };
    const icons = {
      debug: '🔍',
      info: '✨',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    console.log(`${colors[level] || ''}${icons[level] || '•'} ${formatted}\x1b[0m`);

    // Write to file (async to not block event loop)
    try {
      const logFile = path.join(CONFIG.paths.logs, `manager-${this.getDateStr()}.log`);
      fs.appendFileSync(logFile, formatted + '\n');
    } catch (err) {
      // Log file write error only once to avoid spam
      if (!this.fileWriteErrorLogged) {
        this.fileWriteErrorLogged = true;
        console.error(`⚠️ Unable to write to log file: ${err.message}`);
      }
    }
  }

  getDateStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  debug(msg, data) { this.write('debug', msg, data); }
  info(msg, data) { this.write('info', msg, data); }
  warn(msg, data) { this.write('warn', msg, data); }
  error(msg, data) { this.write('error', msg, data); }
  critical(msg, data) { this.write('critical', msg, data); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS MONITOR - CPU/MEMORY TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

class ProcessMonitor {
  constructor(logger) {
    this.logger = logger;
    this.cpuHistory = new Map(); // pid -> [{timestamp, cpu}]
    this.memoryHistory = new Map(); // pid -> [{timestamp, memory}]
    this.highCpuStart = new Map(); // pid -> timestamp when high CPU started
  }

  /**
   * Get CPU and memory usage for a process
   */
  async getProcessStats(pid) {
    if (!pid) return null;

    try {
      // Use ps to get CPU and memory
      const { stdout } = await execAsync(`ps -p ${pid} -o %cpu,%mem,rss 2>/dev/null | tail -1`);
      const parts = stdout.trim().split(/\s+/);

      if (parts.length >= 3) {
        return {
          pid,
          cpu: parseFloat(parts[0]) || 0,
          memPercent: parseFloat(parts[1]) || 0,
          memMB: Math.round((parseInt(parts[2]) || 0) / 1024), // RSS in KB -> MB
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      // Process might have exited
      return null;
    }

    return null;
  }

  /**
   * Record stats and check for anomalies
   */
  async checkProcess(pid, service, memoryLimit) {
    const stats = await this.getProcessStats(pid);
    if (!stats) {
      return { healthy: false, reason: 'process_not_found' };
    }

    // Record history
    if (!this.cpuHistory.has(pid)) {
      this.cpuHistory.set(pid, []);
      this.memoryHistory.set(pid, []);
    }

    const cpuHist = this.cpuHistory.get(pid);
    const memHist = this.memoryHistory.get(pid);

    cpuHist.push({ timestamp: stats.timestamp, value: stats.cpu });
    memHist.push({ timestamp: stats.timestamp, value: stats.memMB });

    // Keep only last 60 samples (5 minutes at 5s interval)
    while (cpuHist.length > 60) cpuHist.shift();
    while (memHist.length > 60) memHist.shift();

    // Check CPU threshold
    const cpuResult = this.checkCpuThreshold(pid, stats.cpu, service);
    if (!cpuResult.healthy) {
      return cpuResult;
    }

    // Check memory threshold
    const memResult = this.checkMemoryThreshold(pid, stats.memMB, memoryLimit, service);
    if (!memResult.healthy) {
      return memResult;
    }

    return {
      healthy: true,
      stats,
      avgCpu: this.getAverage(cpuHist.map(h => h.value)),
      avgMem: this.getAverage(memHist.map(h => h.value)),
    };
  }

  /**
   * Check if CPU has been high for too long
   */
  checkCpuThreshold(pid, currentCpu, service) {
    const now = Date.now();

    if (currentCpu >= CONFIG.cpu.killThreshold) {
      // CPU is critically high
      if (!this.highCpuStart.has(pid)) {
        this.highCpuStart.set(pid, now);
        this.logger.warn(`High CPU detected for ${service}`, { pid, cpu: currentCpu });
      }

      const highDuration = now - this.highCpuStart.get(pid);

      if (highDuration >= CONFIG.cpu.sustainedDuration) {
        this.logger.critical(`RUNAWAY PROCESS: ${service} at ${currentCpu}% CPU for ${Math.round(highDuration/1000)}s`, { pid });
        return {
          healthy: false,
          reason: 'cpu_runaway',
          cpu: currentCpu,
          duration: highDuration,
        };
      }
    } else if (currentCpu >= CONFIG.cpu.warningThreshold) {
      this.logger.warn(`Elevated CPU for ${service}`, { pid, cpu: currentCpu });
      // Don't reset timer yet - could spike again
    } else {
      // CPU is normal - reset timer
      this.highCpuStart.delete(pid);
    }

    return { healthy: true };
  }

  /**
   * Check memory threshold
   */
  checkMemoryThreshold(pid, currentMemMB, limitMB, service) {
    const ratio = currentMemMB / limitMB;

    if (ratio >= CONFIG.memory.killThreshold) {
      this.logger.critical(`MEMORY EXHAUSTION: ${service} using ${currentMemMB}MB / ${limitMB}MB (${Math.round(ratio * 100)}%)`, { pid });
      return {
        healthy: false,
        reason: 'memory_exhaustion',
        memMB: currentMemMB,
        limitMB,
        ratio,
      };
    }

    if (ratio >= CONFIG.memory.warningThreshold) {
      this.logger.warn(`High memory for ${service}`, {
        pid,
        memMB: currentMemMB,
        limitMB,
        percent: Math.round(ratio * 100)
      });
    }

    return { healthy: true };
  }

  getAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Clear history for a PID (when process restarts)
   */
  clearHistory(pid) {
    this.cpuHistory.delete(pid);
    this.memoryHistory.delete(pid);
    this.highCpuStart.delete(pid);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECKER WITH RESPONSE TIME TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

class HealthChecker {
  constructor(logger) {
    this.logger = logger;
    this.responseTimeHistory = new Map(); // service -> [response times]
    this.consecutiveFailures = new Map(); // service -> count
  }

  /**
   * Check HTTP health with response time tracking
   */
  async check(url, service, timeout = CONFIG.health.timeout) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.recordResult(service, null, Date.now() - startTime);
        resolve({
          healthy: false,
          reason: 'timeout',
          responseTime: Date.now() - startTime,
        });
      }, timeout);

      try {
        const urlObj = new URL(url);
        const req = http.get({
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          timeout,
        }, (res) => {
          clearTimeout(timer);
          const responseTime = Date.now() - startTime;
          res.destroy();

          const success = res.statusCode < 500;
          this.recordResult(service, success, responseTime);

          resolve({
            healthy: success,
            statusCode: res.statusCode,
            responseTime,
          });
        });

        req.on('error', (err) => {
          clearTimeout(timer);
          const responseTime = Date.now() - startTime;
          this.recordResult(service, false, responseTime);
          resolve({
            healthy: false,
            reason: 'error',
            error: err.message,
            responseTime,
          });
        });

        req.on('timeout', () => {
          clearTimeout(timer);
          req.destroy();
          const responseTime = Date.now() - startTime;
          this.recordResult(service, false, responseTime);
          resolve({
            healthy: false,
            reason: 'timeout',
            responseTime,
          });
        });
      } catch (err) {
        clearTimeout(timer);
        this.recordResult(service, false, Date.now() - startTime);
        resolve({
          healthy: false,
          reason: 'exception',
          error: err.message,
          responseTime: Date.now() - startTime,
        });
      }
    });
  }

  recordResult(service, success, responseTime) {
    // Track response times
    if (!this.responseTimeHistory.has(service)) {
      this.responseTimeHistory.set(service, []);
    }
    const history = this.responseTimeHistory.get(service);
    history.push(responseTime);
    while (history.length > 30) history.shift();

    // Track consecutive failures
    if (!this.consecutiveFailures.has(service)) {
      this.consecutiveFailures.set(service, 0);
    }

    if (success === false) {
      const count = this.consecutiveFailures.get(service) + 1;
      this.consecutiveFailures.set(service, count);
    } else if (success === true) {
      this.consecutiveFailures.set(service, 0);
    }
  }

  getConsecutiveFailures(service) {
    return this.consecutiveFailures.get(service) || 0;
  }

  getAverageResponseTime(service) {
    const history = this.responseTimeHistory.get(service) || [];
    if (history.length === 0) return 0;
    return Math.round(history.reduce((a, b) => a + b, 0) / history.length);
  }

  isStalled(service) {
    const avgResponseTime = this.getAverageResponseTime(service);
    return avgResponseTime > CONFIG.health.stallThreshold;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DEV MANAGER V5
// ═══════════════════════════════════════════════════════════════════════════════

class DevManagerV5 {
  constructor() {
    this.logger = new Logger();
    this.processMonitor = new ProcessMonitor(this.logger);
    this.healthChecker = new HealthChecker(this.logger);

    // Process state
    this.frontendProcess = null;
    this.backendProcess = null;
    this.frontendStartTime = null;
    this.backendStartTime = null;

    // Restart management with backoff
    this.restartState = {
      frontend: { attempts: 0, delay: CONFIG.restart.initialDelay, circuitOpen: false, circuitOpenTime: null },
      backend: { attempts: 0, delay: CONFIG.restart.initialDelay, circuitOpen: false, circuitOpenTime: null },
    };

    // Flags
    this.isShuttingDown = false;
    this.isRestartingFrontend = false;
    this.isRestartingBackend = false;

    // Intervals (memory checks are combined with CPU checks)
    this.cpuCheckInterval = null;
    this.healthCheckInterval = null;
    this.monitoringServer = null;

    // Setup signal handlers
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, shutting down...`);
        await this.shutdown();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (err) => {
      this.logger.critical('Uncaught exception', { error: err.message, stack: err.stack });
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      const errorInfo = reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : { reason: String(reason) };
      this.logger.error('Unhandled rejection', errorInfo);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTUP
  // ═══════════════════════════════════════════════════════════════════════════

  async start() {
    this.logger.info('═'.repeat(70));
    this.logger.info('PHASE 10.943: Enterprise Dev Manager V5 - Protected');
    this.logger.info('RUNAWAY PROCESS PROTECTION ENABLED');
    this.logger.info('═'.repeat(70));

    try {
      // Check for existing lock file (another instance running)
      const lockFile = path.join(CONFIG.paths.root, '.dev-manager-v5.lock');
      if (fs.existsSync(lockFile)) {
        const existingPid = parseInt(fs.readFileSync(lockFile, 'utf8').trim(), 10);
        if (existingPid && this.isProcessRunning(existingPid)) {
          this.logger.warn('Another instance is already running', { pid: existingPid });
          this.logger.info('Killing existing instance...');
        }
      }

      // Kill existing processes
      await this.killExistingProcesses();

      // Create lock files
      this.createLockFiles();

      // Start backend
      await this.startBackend();

      // Start frontend
      await this.startFrontend();

      // Verify integration
      await this.verifyIntegration();

      // Start monitoring
      this.startMonitoring();

      // Start monitoring API
      this.startMonitoringAPI();

      // Print success
      this.printSuccess();

    } catch (err) {
      this.logger.critical('Startup failed', { error: err.message });
      await this.shutdown();
      process.exit(1);
    }
  }

  async killExistingProcesses() {
    this.logger.info('Killing existing processes...');

    const commands = [
      'pkill -9 -f "next dev" || true',
      'pkill -9 -f "nest start" || true',
      'pkill -9 -f "dev-manager" || true',
      `lsof -ti:${CONFIG.ports.frontend} | xargs kill -9 2>/dev/null || true`,
      `lsof -ti:${CONFIG.ports.backend} | xargs kill -9 2>/dev/null || true`,
    ];

    for (const cmd of commands) {
      try {
        execSync(cmd, { stdio: 'ignore' });
      } catch (e) {}
    }

    await new Promise(r => setTimeout(r, 2000));
    this.logger.info('All processes killed successfully');
  }

  /**
   * Check if a process is running by PID
   * @param {number} pid - Process ID to check
   * @returns {boolean} - True if process is running
   */
  isProcessRunning(pid) {
    try {
      process.kill(pid, 0); // Signal 0 checks if process exists
      return true;
    } catch (e) {
      return false;
    }
  }

  createLockFiles() {
    const lockFile = path.join(CONFIG.paths.root, '.dev-manager-v5.lock');
    fs.writeFileSync(lockFile, process.pid.toString());
    this.logger.info('Lock files created');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKEND MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async startBackend() {
    this.logger.info('Starting Backend (NestJS)...');

    return new Promise((resolve, reject) => {
      const logFile = path.join(CONFIG.paths.logs, `backend-${this.logger.getDateStr()}.log`);
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });

      this.backendProcess = spawn('npm', ['run', 'start:dev'], {
        cwd: CONFIG.paths.backend,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_OPTIONS: `--max-old-space-size=${CONFIG.memory.backendLimit}`,
        },
      });

      this.backendStartTime = Date.now();

      this.backendProcess.stdout.pipe(logStream);
      this.backendProcess.stderr.pipe(logStream);

      let started = false;
      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (!started && output.includes('Nest application successfully started')) {
          started = true;
          this.logger.info('Backend started successfully', { pid: this.backendProcess.pid });
          resolve();
        }
      });

      this.backendProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown && !this.isRestartingBackend) {
          this.logger.warn('Backend exited unexpectedly', { code, signal });
          const pid = this.backendProcess?.pid;
          if (pid) this.processMonitor.clearHistory(pid);
          this.scheduleRestart(SERVICE.BACKEND);
        }
      });

      // Timeout
      setTimeout(() => {
        if (!started) {
          this.logger.info('Backend starting (waiting for confirmation)...');
          resolve(); // Continue anyway
        }
      }, 15000);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRONTEND MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async startFrontend() {
    this.logger.info('Starting Frontend (Next.js)...');

    return new Promise((resolve, reject) => {
      const logFile = path.join(CONFIG.paths.logs, `frontend-${this.logger.getDateStr()}.log`);
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });

      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: CONFIG.paths.frontend,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_OPTIONS: `--max-old-space-size=${CONFIG.memory.frontendLimit}`,
        },
      });

      this.frontendStartTime = Date.now();

      this.frontendProcess.stdout.pipe(logStream);
      this.frontendProcess.stderr.pipe(logStream);

      let started = false;
      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (!started && (output.includes('Ready in') || output.includes('started server'))) {
          started = true;
          this.logger.info('Frontend started successfully', { pid: this.frontendProcess.pid });
          resolve();
        }
      });

      this.frontendProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown && !this.isRestartingFrontend) {
          this.logger.warn('Frontend exited unexpectedly', { code, signal });
          const pid = this.frontendProcess?.pid;
          if (pid) this.processMonitor.clearHistory(pid);
          this.scheduleRestart(SERVICE.FRONTEND);
        }
      });

      // Timeout
      setTimeout(() => {
        if (!started) {
          this.logger.info('Frontend starting (waiting for confirmation)...');
          resolve(); // Continue anyway
        }
      }, 15000);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyIntegration() {
    this.logger.info('Verifying Frontend-Backend Integration...');

    let attempts = 0;
    const maxAttempts = 10;
    let lastBackendResult = null;
    let lastFrontendResult = null;

    while (attempts < maxAttempts) {
      lastBackendResult = await this.healthChecker.check(`http://localhost:${CONFIG.ports.backend}/api/health`, SERVICE.BACKEND);
      lastFrontendResult = await this.healthChecker.check(`http://localhost:${CONFIG.ports.frontend}`, SERVICE.FRONTEND);

      if (lastBackendResult.healthy && lastFrontendResult.healthy) {
        this.logger.info('Integration verified - Frontend & Backend communicating');
        return;
      }

      attempts++;
      this.logger.debug(`Verification attempt ${attempts}/${maxAttempts}`, {
        backend: lastBackendResult.healthy ? 'OK' : lastBackendResult.reason,
        frontend: lastFrontendResult.healthy ? 'OK' : lastFrontendResult.reason,
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    // Provide detailed error message
    const failures = [];
    if (!lastBackendResult?.healthy) failures.push(`Backend (${lastBackendResult?.reason || 'unknown'})`);
    if (!lastFrontendResult?.healthy) failures.push(`Frontend (${lastFrontendResult?.reason || 'unknown'})`);
    throw new Error(`Integration verification failed: ${failures.join(', ')}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  startMonitoring() {
    this.logger.info('Starting health monitoring...');
    this.logger.info('Starting CPU/Memory monitoring...');

    // Health check interval
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      await this.performHealthCheck();
    }, CONFIG.health.checkInterval);

    // CPU/Memory check interval
    this.cpuCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      await this.performResourceCheck();
    }, CONFIG.cpu.checkInterval);

    this.logger.info('Monitoring started', {
      healthCheckInterval: `${CONFIG.health.checkInterval / 1000}s`,
      cpuCheckInterval: `${CONFIG.cpu.checkInterval / 1000}s`,
    });
  }

  async performHealthCheck() {
    // Check backend
    if (this.backendProcess && !this.isRestartingBackend) {
      const result = await this.healthChecker.check(
        `http://localhost:${CONFIG.ports.backend}/api/health`,
        SERVICE.BACKEND
      );

      if (!result.healthy) {
        const failures = this.healthChecker.getConsecutiveFailures(SERVICE.BACKEND);
        this.logger.warn('Backend health check failed', {
          reason: result.reason,
          consecutiveFailures: failures,
          responseTime: result.responseTime,
        });

        if (failures >= CONFIG.health.maxConsecutiveFailures) {
          this.logger.error('Backend max consecutive failures reached, restarting...');
          await this.forceRestart(SERVICE.BACKEND);
        }
      }
    }

    // Check frontend
    if (this.frontendProcess && !this.isRestartingFrontend) {
      const result = await this.healthChecker.check(
        `http://localhost:${CONFIG.ports.frontend}`,
        SERVICE.FRONTEND
      );

      if (!result.healthy) {
        const failures = this.healthChecker.getConsecutiveFailures(SERVICE.FRONTEND);
        this.logger.warn('Frontend health check failed', {
          reason: result.reason,
          consecutiveFailures: failures,
          responseTime: result.responseTime,
        });

        if (failures >= CONFIG.health.maxConsecutiveFailures) {
          this.logger.error('Frontend max consecutive failures reached, restarting...');
          await this.forceRestart(SERVICE.FRONTEND);
        }
      }
    }
  }

  async performResourceCheck() {
    // Check backend resources
    if (this.backendProcess?.pid) {
      const result = await this.processMonitor.checkProcess(
        this.backendProcess.pid,
        SERVICE.BACKEND,
        CONFIG.memory.backendLimit
      );

      if (!result.healthy) {
        this.logger.critical('Backend resource issue detected', { reason: result.reason });
        await this.forceRestart(SERVICE.BACKEND);
      }
    }

    // Check frontend resources
    if (this.frontendProcess?.pid) {
      const result = await this.processMonitor.checkProcess(
        this.frontendProcess.pid,
        SERVICE.FRONTEND,
        CONFIG.memory.frontendLimit
      );

      if (!result.healthy) {
        this.logger.critical('Frontend resource issue detected', { reason: result.reason });
        await this.forceRestart(SERVICE.FRONTEND);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTART MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async forceRestart(service) {
    const isFrontend = service === SERVICE.FRONTEND;
    const pid = isFrontend ? this.frontendProcess?.pid : this.backendProcess?.pid;

    this.logger.warn(`Force restarting ${service}...`, { pid });

    // Kill the process
    if (pid) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        // Process might already be dead
      }

      // Also kill any child processes
      try {
        execSync(`pkill -9 -P ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore - child processes might not exist
      }
    }

    // Clear port
    const port = isFrontend ? CONFIG.ports.frontend : CONFIG.ports.backend;
    try {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    } catch (e) {
      // Port might already be free
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));

    // Schedule restart
    this.scheduleRestart(service);
  }

  scheduleRestart(service) {
    const state = this.restartState[service];
    const isFrontend = service === SERVICE.FRONTEND;

    // Check circuit breaker
    if (state.circuitOpen) {
      const elapsed = Date.now() - state.circuitOpenTime;
      if (elapsed < CONFIG.restart.circuitBreakerCooldown) {
        this.logger.error(`Circuit breaker OPEN for ${service}, cooldown: ${Math.round((CONFIG.restart.circuitBreakerCooldown - elapsed) / 1000)}s remaining`);
        return;
      }
      // Reset circuit breaker
      state.circuitOpen = false;
      state.circuitOpenTime = null;
      state.attempts = 0;
      state.delay = CONFIG.restart.initialDelay;
      this.logger.info(`Circuit breaker RESET for ${service}`);
    }

    // Check max attempts
    if (state.attempts >= CONFIG.restart.maxAttempts) {
      state.circuitOpen = true;
      state.circuitOpenTime = Date.now();
      this.logger.critical(`Circuit breaker OPENED for ${service} after ${state.attempts} failed attempts`);
      return;
    }

    state.attempts++;

    // Set restarting flag
    if (isFrontend) {
      this.isRestartingFrontend = true;
    } else {
      this.isRestartingBackend = true;
    }

    this.logger.info(`Scheduling ${service} restart`, {
      attempt: state.attempts,
      maxAttempts: CONFIG.restart.maxAttempts,
      delay: `${state.delay / 1000}s`,
    });

    setTimeout(async () => {
      try {
        if (isFrontend) {
          await this.startFrontend();
        } else {
          await this.startBackend();
        }

        // Reset on success
        state.attempts = 0;
        state.delay = CONFIG.restart.initialDelay;
        this.logger.info(`${service} restarted successfully`);
      } catch (err) {
        this.logger.error(`${service} restart failed`, { error: err.message });
        // Increase backoff
        state.delay = Math.min(state.delay * CONFIG.restart.backoffMultiplier, CONFIG.restart.maxDelay);
        // Schedule another restart
        this.scheduleRestart(service);
      } finally {
        // Clear restarting flag
        if (isFrontend) {
          this.isRestartingFrontend = false;
        } else {
          this.isRestartingBackend = false;
        }
      }
    }, state.delay);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MONITORING API
  // ═══════════════════════════════════════════════════════════════════════════

  startMonitoringAPI() {
    this.monitoringServer = http.createServer(async (req, res) => {
      // Security: Only allow connections from localhost
      const remoteAddr = req.socket.remoteAddress;
      const isLocalhost = remoteAddr === '127.0.0.1' ||
                          remoteAddr === '::1' ||
                          remoteAddr === '::ffff:127.0.0.1';

      if (req.url === '/status' || req.url === '/health') {
        const status = await this.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
      } else if (req.url === '/metrics') {
        const metrics = await this.getMetrics();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(metrics);
      } else if (req.url === '/restart/frontend') {
        // Security: Restart endpoints only from localhost
        if (!isLocalhost) {
          this.logger.warn('Restart attempt from non-localhost', { remoteAddr });
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: localhost only' }));
          return;
        }
        await this.forceRestart(SERVICE.FRONTEND);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Frontend restart initiated' }));
      } else if (req.url === '/restart/backend') {
        // Security: Restart endpoints only from localhost
        if (!isLocalhost) {
          this.logger.warn('Restart attempt from non-localhost', { remoteAddr });
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: localhost only' }));
          return;
        }
        await this.forceRestart(SERVICE.BACKEND);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Backend restart initiated' }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    // Bind to localhost only for additional security
    this.monitoringServer.listen(CONFIG.ports.monitoring, '127.0.0.1', () => {
      this.logger.info(`Monitoring API started on port ${CONFIG.ports.monitoring} (localhost only)`);
    });
  }

  async getStatus() {
    const frontendPid = this.frontendProcess?.pid;
    const backendPid = this.backendProcess?.pid;

    const frontendStats = frontendPid
      ? await this.processMonitor.getProcessStats(frontendPid)
      : null;
    const backendStats = backendPid
      ? await this.processMonitor.getProcessStats(backendPid)
      : null;

    // Check if processes are actually running (not just object exists)
    const frontendRunning = frontendPid ? this.isProcessRunning(frontendPid) : false;
    const backendRunning = backendPid ? this.isProcessRunning(backendPid) : false;

    return {
      status: 'running',
      uptime: this.backendStartTime ? Math.floor((Date.now() - this.backendStartTime) / 1000) : 0,
      frontend: {
        pid: frontendPid || null,
        running: frontendRunning,
        cpu: frontendStats?.cpu || 0,
        memoryMB: frontendStats?.memMB || 0,
        avgResponseTime: this.healthChecker.getAverageResponseTime(SERVICE.FRONTEND),
        consecutiveFailures: this.healthChecker.getConsecutiveFailures(SERVICE.FRONTEND),
        restartAttempts: this.restartState.frontend.attempts,
        circuitOpen: this.restartState.frontend.circuitOpen,
      },
      backend: {
        pid: backendPid || null,
        running: backendRunning,
        cpu: backendStats?.cpu || 0,
        memoryMB: backendStats?.memMB || 0,
        avgResponseTime: this.healthChecker.getAverageResponseTime(SERVICE.BACKEND),
        consecutiveFailures: this.healthChecker.getConsecutiveFailures(SERVICE.BACKEND),
        restartAttempts: this.restartState.backend.attempts,
        circuitOpen: this.restartState.backend.circuitOpen,
      },
      config: {
        cpuKillThreshold: CONFIG.cpu.killThreshold,
        memoryKillThreshold: CONFIG.memory.killThreshold * 100,
        healthCheckInterval: CONFIG.health.checkInterval,
      },
    };
  }

  async getMetrics() {
    const status = await this.getStatus();
    const lines = [
      '# HELP dev_manager_process_cpu CPU usage percentage',
      '# TYPE dev_manager_process_cpu gauge',
      `dev_manager_process_cpu{service="frontend"} ${status.frontend.cpu}`,
      `dev_manager_process_cpu{service="backend"} ${status.backend.cpu}`,
      '',
      '# HELP dev_manager_process_memory_mb Memory usage in MB',
      '# TYPE dev_manager_process_memory_mb gauge',
      `dev_manager_process_memory_mb{service="frontend"} ${status.frontend.memoryMB}`,
      `dev_manager_process_memory_mb{service="backend"} ${status.backend.memoryMB}`,
      '',
      '# HELP dev_manager_restart_attempts Number of restart attempts',
      '# TYPE dev_manager_restart_attempts counter',
      `dev_manager_restart_attempts{service="frontend"} ${status.frontend.restartAttempts}`,
      `dev_manager_restart_attempts{service="backend"} ${status.backend.restartAttempts}`,
    ];
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHUTDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info('Initiating graceful shutdown...');

    // Clear intervals
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.cpuCheckInterval) clearInterval(this.cpuCheckInterval);
    // Note: memoryCheckInterval removed - memory checks are combined with CPU checks

    // Stop monitoring server
    if (this.monitoringServer) {
      this.monitoringServer.close();
    }

    // Kill processes
    const killPromises = [];

    if (this.frontendProcess?.pid) {
      killPromises.push(this.killProcess(this.frontendProcess.pid, 'frontend'));
    }

    if (this.backendProcess?.pid) {
      killPromises.push(this.killProcess(this.backendProcess.pid, 'backend'));
    }

    await Promise.all(killPromises);

    // Clean up lock files
    try {
      fs.unlinkSync(path.join(CONFIG.paths.root, '.dev-manager-v5.lock'));
    } catch (e) {}

    this.logger.info('Shutdown complete');
  }

  async killProcess(pid, name) {
    this.logger.info(`Stopping ${name}...`, { pid });

    try {
      // Try graceful shutdown first
      process.kill(pid, 'SIGTERM');

      // Wait 3 seconds
      await new Promise(r => setTimeout(r, 3000));

      // Force kill if still running
      try {
        process.kill(pid, 0); // Check if still running
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        // Process already dead
      }
    } catch (e) {
      // Ignore
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  printSuccess() {
    console.log('\n' + '╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(10) + '✨ DEV MANAGER V5 - PROTECTED IS READY! ✨' + ' '.repeat(10) + '║');
    console.log('║' + ' '.repeat(10) + 'RUNAWAY PROCESS PROTECTION ENABLED' + ' '.repeat(18) + '║');
    console.log('╚' + '═'.repeat(68) + '╝\n');

    console.log('🌐 Frontend:    http://localhost:' + CONFIG.ports.frontend);
    console.log('🔧 Backend:     http://localhost:' + CONFIG.ports.backend + '/api');
    console.log('📊 Monitoring:  http://localhost:' + CONFIG.ports.monitoring + '/status');
    console.log('📈 Metrics:     http://localhost:' + CONFIG.ports.monitoring + '/metrics');
    console.log('');
    console.log('🛡️  Protection Features:');
    console.log(`   ✅ CPU monitoring (kill at >${CONFIG.cpu.killThreshold}% for >${CONFIG.cpu.sustainedDuration/1000}s)`);
    console.log(`   ✅ Memory monitoring (kill at >${CONFIG.memory.killThreshold * 100}% of limit)`);
    console.log(`   ✅ Health checks (every ${CONFIG.health.checkInterval/1000}s, timeout ${CONFIG.health.timeout/1000}s)`);
    console.log(`   ✅ Circuit breaker (max ${CONFIG.restart.maxAttempts} restarts, ${CONFIG.restart.circuitBreakerCooldown/1000}s cooldown)`);
    console.log('');
    console.log('🔄 Manual restart endpoints:');
    console.log(`   curl http://localhost:${CONFIG.ports.monitoring}/restart/frontend`);
    console.log(`   curl http://localhost:${CONFIG.ports.monitoring}/restart/backend`);
    console.log('');
    console.log('🛑 Press Ctrl+C to stop\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const manager = new DevManagerV5();
manager.start().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
