#!/usr/bin/env node

/**
 * Process Monitor - Real-time monitoring dashboard
 * Shows health, performance, and status of all development servers
 */

const { exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Monitor {
  constructor() {
    this.services = [
      {
        name: 'Frontend',
        port: 3000,
        healthUrl: 'http://localhost:3000',
        pidFile: null,
      },
      {
        name: 'Backend',
        port: 4000,
        healthUrl: 'http://localhost:4000/api/health',
        pidFile: null,
      },
    ];

    this.lockFile = path.join(__dirname, '..', '.dev-servers.lock');
    this.logDir = path.join(__dirname, '..', 'logs');
  }

  async checkService(service) {
    const status = {
      name: service.name,
      port: service.port,
      pid: null,
      status: 'offline',
      health: 'unknown',
      memory: 0,
      cpu: 0,
      uptime: 0,
      errors: 0,
    };

    // Check if port is in use
    try {
      const { stdout } = await execAsync(`lsof -ti :${service.port}`);
      const pids = stdout.trim().split('\n').filter(Boolean);

      if (pids.length > 0) {
        status.pid = pids[0];
        status.status = 'running';

        // Get process info
        const psInfo = await this.getProcessInfo(status.pid);
        status.memory = psInfo.memory;
        status.cpu = psInfo.cpu;
        status.uptime = psInfo.uptime;

        // Check health endpoint
        status.health = await this.checkHealth(service.healthUrl);

        // Count recent errors
        status.errors = await this.countRecentErrors(
          service.name.toLowerCase()
        );
      }
    } catch (error) {
      // Port not in use
    }

    return status;
  }

  async getProcessInfo(pid) {
    try {
      const { stdout } = await execAsync(`ps -o pid,etime,rss,pcpu -p ${pid}`);
      const lines = stdout.trim().split('\n');

      if (lines.length > 1) {
        const [, etime, rss, cpu] = lines[1].trim().split(/\s+/);

        return {
          uptime: this.parseElapsedTime(etime),
          memory: (parseInt(rss) / 1024).toFixed(1), // Convert to MB
          cpu: parseFloat(cpu).toFixed(1),
        };
      }
    } catch (error) {
      // Process might have died
    }

    return { uptime: 0, memory: 0, cpu: 0 };
  }

  parseElapsedTime(etime) {
    // Format can be: SS, MM:SS, HH:MM:SS, or DD-HH:MM:SS
    const parts = etime.split('-');
    let days = 0;
    let timePart = etime;

    if (parts.length === 2) {
      days = parseInt(parts[0]);
      timePart = parts[1];
    }

    const timeParts = timePart.split(':').reverse();
    const seconds = parseInt(timeParts[0] || 0);
    const minutes = parseInt(timeParts[1] || 0);
    const hours = parseInt(timeParts[2] || 0);

    return days * 86400 + hours * 3600 + minutes * 60 + seconds;
  }

  async checkHealth(url) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve('timeout'), 2000);

      http
        .get(url, res => {
          clearTimeout(timeout);
          resolve(res.statusCode === 200 ? 'healthy' : 'unhealthy');
        })
        .on('error', () => {
          clearTimeout(timeout);
          resolve('error');
        });
    });
  }

  async countRecentErrors(serviceName) {
    const errorFile = path.join(this.logDir, `${serviceName}.error.log`);

    if (!fs.existsSync(errorFile)) {
      return 0;
    }

    try {
      const { stdout } = await execAsync(
        `tail -1000 "${errorFile}" | grep -c ERROR || true`
      );
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  async checkDuplicates() {
    const duplicates = [];

    for (const service of this.services) {
      try {
        const { stdout } = await execAsync(`lsof -ti :${service.port}`);
        const pids = stdout.trim().split('\n').filter(Boolean);

        if (pids.length > 1) {
          duplicates.push({
            service: service.name,
            port: service.port,
            pids: pids,
          });
        }
      } catch (error) {
        // No processes on port
      }
    }

    return duplicates;
  }

  async getOverallStatus() {
    const statuses = await Promise.all(
      this.services.map(service => this.checkService(service))
    );

    const duplicates = await this.checkDuplicates();

    const managerRunning = fs.existsSync(this.lockFile);

    return {
      services: statuses,
      duplicates,
      managerRunning,
      timestamp: new Date().toISOString(),
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  getStatusColor(status) {
    switch (status) {
      case 'running':
        return colors.green;
      case 'offline':
        return colors.red;
      default:
        return colors.yellow;
    }
  }

  getHealthColor(health) {
    switch (health) {
      case 'healthy':
        return colors.green;
      case 'unhealthy':
        return colors.red;
      case 'timeout':
        return colors.yellow;
      default:
        return colors.yellow;
    }
  }

  printStatus(status) {
    console.clear();
    console.log(
      `${colors.bright}╔════════════════════════════════════════════════════════════╗${colors.reset}`
    );
    console.log(
      `${colors.bright}║           VQMethod Development Server Monitor              ║${colors.reset}`
    );
    console.log(
      `${colors.bright}╚════════════════════════════════════════════════════════════╝${colors.reset}`
    );
    console.log(
      `\n${colors.cyan}Last updated: ${new Date().toLocaleTimeString()}${colors.reset}`
    );

    // Manager status
    console.log(`\n${colors.bright}Manager Status:${colors.reset}`);
    if (status.managerRunning) {
      console.log(`  ${colors.green}● Running${colors.reset}`);
    } else {
      console.log(
        `  ${colors.red}● Not Running${colors.reset} (run 'npm run dev' to start)`
      );
    }

    // Services table
    console.log(`\n${colors.bright}Services:${colors.reset}`);
    console.log(
      '┌─────────────┬────────┬─────────┬──────────┬────────┬────────┬──────────┬────────┐'
    );
    console.log(
      '│ Service     │ Port   │ Status  │ Health   │ PID    │ Memory │ CPU      │ Uptime │'
    );
    console.log(
      '├─────────────┼────────┼─────────┼──────────┼────────┼────────┼──────────┼────────┤'
    );

    for (const service of status.services) {
      const statusColor = this.getStatusColor(service.status);
      const healthColor = this.getHealthColor(service.health);

      console.log(
        `│ ${service.name.padEnd(11)} │` +
          ` ${service.port.toString().padEnd(6)} │` +
          ` ${statusColor}${service.status.padEnd(7)}${colors.reset} │` +
          ` ${healthColor}${service.health.padEnd(8)}${colors.reset} │` +
          ` ${(service.pid || '-').toString().padEnd(6)} │` +
          ` ${service.memory.toString().padEnd(4)}MB │` +
          ` ${service.cpu.toString().padEnd(6)}% │` +
          ` ${this.formatUptime(service.uptime).padEnd(6)} │`
      );
    }

    console.log(
      '└─────────────┴────────┴─────────┴──────────┴────────┴────────┴──────────┴────────┘'
    );

    // Duplicates warning
    if (status.duplicates.length > 0) {
      console.log(
        `\n${colors.red}${colors.bright}⚠️  WARNING: Duplicate processes detected!${colors.reset}`
      );
      for (const dup of status.duplicates) {
        console.log(
          `  ${dup.service} on port ${dup.port}: PIDs ${dup.pids.join(', ')}`
        );
      }
      console.log(`  Run 'npm run stop' and then 'npm run dev' to fix`);
    } else {
      console.log(
        `\n${colors.green}✓ No duplicate processes detected${colors.reset}`
      );
    }

    // Help text
    console.log('\n' + colors.cyan);
    console.log('Commands:');
    console.log('  npm run dev      - Start all servers');
    console.log('  npm run stop     - Stop all servers');
    console.log('  npm run restart  - Restart all servers');
    console.log('  npm run monitor  - This monitoring view');
    console.log('  Press Ctrl+C to exit monitor');
    console.log(colors.reset);
  }

  async runContinuous() {
    // Initial check
    const status = await this.getOverallStatus();
    this.printStatus(status);

    // Update every 2 seconds
    const interval = setInterval(async () => {
      const status = await this.getOverallStatus();
      this.printStatus(status);
    }, 2000);

    // Handle exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n\n👋 Monitor stopped\n');
      process.exit(0);
    });
  }

  async runOnce() {
    const status = await this.getOverallStatus();

    // Simple output for scripts
    console.log('STATUS REPORT');
    console.log('=============');

    for (const service of status.services) {
      console.log(`${service.name}: ${service.status} (${service.health})`);
    }

    if (status.duplicates.length > 0) {
      console.log('\nWARNING: Duplicate processes detected!');
      process.exit(1);
    } else {
      console.log('\nNo duplicates detected');
      process.exit(0);
    }
  }
}

// Main execution
async function main() {
  const monitor = new Monitor();

  // Check for --once flag
  if (process.argv.includes('--once')) {
    await monitor.runOnce();
  } else {
    await monitor.runContinuous();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Monitor error:', error);
    process.exit(1);
  });
}

module.exports = Monitor;
