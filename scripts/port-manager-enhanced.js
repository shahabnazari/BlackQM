#!/usr/bin/env node

const net = require('net');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const readline = require('readline');

class EnhancedPortManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'port-config.json');
    this.registryPath = path.join(process.env.HOME, '.port-registry.json');
    this.config = this.loadConfig();
    this.registry = this.loadRegistry();
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('Error loading port config:', error.message);
      process.exit(1);
    }
  }

  loadRegistry() {
    try {
      if (fs.existsSync(this.registryPath)) {
        return JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Creating new port registry');
    }
    return { projects: {}, ports: {} };
  }

  saveRegistry() {
    fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
  }

  // Enhanced port checking - tests all interfaces
  async isPortAvailable(port) {
    const checkInterface = (port, host) => {
      return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
          resolve(false);
        });
        
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        
        server.listen(port, host);
      });
    };

    // Check multiple interfaces
    const interfaces = [
      '127.0.0.1',  // localhost IPv4
      '0.0.0.0',    // all IPv4
      '::1',        // localhost IPv6
      '::'          // all IPv6
    ];

    for (const iface of interfaces) {
      try {
        const available = await checkInterface(port, iface);
        if (!available) {
          return false;
        }
      } catch (e) {
        // Interface might not be available (e.g., IPv6 disabled)
        continue;
      }
    }

    // Also check with lsof for any process using the port
    const process = this.getProcessUsingPort(port);
    return !process;
  }

  getProcessUsingPort(port) {
    try {
      // More comprehensive lsof check
      const result = execSync(`lsof -i :${port} -P 2>/dev/null | grep LISTEN | head -1`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      if (result) {
        const parts = result.trim().split(/\s+/);
        return {
          command: parts[0],
          pid: parts[1],
          user: parts[2],
          port: port
        };
      }
    } catch (error) {
      // Port is free or lsof failed
    }
    
    // Also check netstat as fallback
    try {
      const netstatResult = execSync(`netstat -vanp tcp 2>/dev/null | grep ":${port} "`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      if (netstatResult && netstatResult.includes('LISTEN')) {
        return {
          command: 'unknown',
          pid: 'unknown',
          user: 'unknown',
          port: port
        };
      }
    } catch (error) {
      // Port is free
    }
    
    return null;
  }

  async killProcess(pid, signal = 'SIGTERM') {
    try {
      execSync(`kill -${signal} ${pid}`, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async promptUser(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });
  }

  async findAvailablePort(service, autoKill = false) {
    const serviceConfig = this.config.services[service];
    if (!serviceConfig) {
      throw new Error(`Service ${service} not found in config`);
    }

    // Check default port first
    if (await this.isPortAvailable(serviceConfig.defaultPort)) {
      return serviceConfig.defaultPort;
    }

    // Port is occupied, check what's using it
    const process = this.getProcessUsingPort(serviceConfig.defaultPort);
    if (process && autoKill) {
      console.log(`\n⚠️  Port ${serviceConfig.defaultPort} is occupied by ${process.command} (PID: ${process.pid})`);
      const answer = await this.promptUser(`Kill this process? (y/n): `);
      
      if (answer === 'y' || answer === 'yes') {
        const killed = await this.killProcess(process.pid);
        if (killed) {
          console.log(`✅ Process killed successfully`);
          // Wait a moment for port to be released
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again
          if (await this.isPortAvailable(serviceConfig.defaultPort)) {
            return serviceConfig.defaultPort;
          }
        } else {
          console.log(`❌ Failed to kill process`);
        }
      }
    }

    // Check fallback ports
    for (const port of serviceConfig.fallbackPorts) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    // Find any available port in the development range
    const [minPort, maxPort] = this.config.portRanges.development;
    for (let port = minPort; port <= maxPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error(`No available ports found for ${service}`);
  }

  async allocatePorts(autoKill = false) {
    const allocatedPorts = {};
    console.log(`\n🔍 Port Allocation for ${this.config.projectName}`);
    console.log('━'.repeat(50));

    for (const [service, config] of Object.entries(this.config.services)) {
      const port = await this.findAvailablePort(service, autoKill);
      allocatedPorts[service] = port;
      
      const status = port === config.defaultPort ? '✅' : '⚠️';
      const statusText = port === config.defaultPort ? 'default' : 'fallback';
      
      console.log(`${status} ${service.padEnd(10)} : ${port} (${statusText}) - ${config.description}`);
      
      if (port !== config.defaultPort) {
        const process = this.getProcessUsingPort(config.defaultPort);
        if (process) {
          console.log(`   └─ Port ${config.defaultPort} used by: ${process.command} (PID: ${process.pid})`);
        }
      }
    }

    // Update registry
    this.registry.projects[this.config.projectName] = {
      ports: allocatedPorts,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };

    // Update port-to-project mapping
    for (const [service, port] of Object.entries(allocatedPorts)) {
      this.registry.ports[port] = {
        project: this.config.projectName,
        service: service,
        timestamp: new Date().toISOString()
      };
    }

    this.saveRegistry();
    console.log('━'.repeat(50));
    
    return allocatedPorts;
  }

  async checkConflicts() {
    console.log('\n🔍 Checking for Port Conflicts...');
    const conflicts = [];

    for (const [service, config] of Object.entries(this.config.services)) {
      const available = await this.isPortAvailable(config.defaultPort);
      if (!available) {
        const process = this.getProcessUsingPort(config.defaultPort);
        conflicts.push({
          service,
          port: config.defaultPort,
          process: process || { command: 'unknown', pid: 'unknown' }
        });
      }
    }

    if (conflicts.length > 0) {
      console.log('\n⚠️  Port Conflicts Detected:');
      conflicts.forEach(({ service, port, process }) => {
        console.log(`   ${service}: Port ${port} is used by ${process.command} (PID: ${process.pid})`);
      });
      
      console.log('\n💡 Solutions:');
      console.log('   1. Run "npm run ports:allocate --kill" to automatically handle conflicts');
      console.log('   2. The port manager will use fallback ports automatically');
      console.log('   3. Manually kill the conflicting processes');
      
      return conflicts;
    } else {
      console.log('✅ No conflicts detected - all default ports are available');
      return [];
    }
  }

  generateEnvFile(ports) {
    const envPath = path.join(__dirname, '..', '.env.ports');
    const envContent = [
      '# Auto-generated port configuration',
      `# Generated at: ${new Date().toISOString()}`,
      `# Project: ${this.config.projectName}`,
      '',
      ...Object.entries(ports).map(([service, port]) => 
        `${service.toUpperCase()}_PORT=${port}`
      ),
      '',
      '# Frontend URL for CORS',
      `FRONTEND_URL=http://localhost:${ports.frontend || 3000}`,
      '',
      '# Backend URL for API calls',
      `NEXT_PUBLIC_API_URL=http://localhost:${ports.backend || 4000}/api`,
      '',
      '# Next.js specific port configuration',
      `PORT=${ports.frontend || 3000}`,
      ''
    ].join('\n');

    fs.writeFileSync(envPath, envContent);
    console.log(`\n📝 Environment file created: ${envPath}`);
  }

  // Generate Next.js specific configuration
  generateNextConfig(port) {
    const nextConfigPath = path.join(__dirname, '..', 'frontend', '.env.local');
    const content = `# Auto-generated Next.js port configuration
PORT=${port}
NEXT_PUBLIC_API_URL=http://localhost:${this.registry.projects[this.config.projectName]?.ports?.backend || 4000}/api
`;
    
    fs.writeFileSync(nextConfigPath, content);
    console.log(`📝 Next.js config created: ${nextConfigPath}`);
  }

  listActiveProjects() {
    console.log('\n📊 Active Projects Registry:');
    console.log('━'.repeat(50));
    
    if (Object.keys(this.registry.projects).length === 0) {
      console.log('No active projects registered');
      return;
    }

    for (const [project, info] of Object.entries(this.registry.projects)) {
      console.log(`\n${project}:`);
      for (const [service, port] of Object.entries(info.ports)) {
        const process = this.getProcessUsingPort(port);
        const status = process ? '🟢' : '⚫';
        console.log(`  ${status} ${service.padEnd(10)}: ${port}${process ? ` (${process.command})` : ' (not running)'}`);
      }
      console.log(`  Last updated: ${new Date(info.timestamp).toLocaleString()}`);
    }
    
    // Show other projects that might conflict
    console.log('\n🔍 Checking for conflicts with other projects:');
    const currentProjectPorts = this.registry.projects[this.config.projectName]?.ports || {};
    let hasConflicts = false;
    
    for (const [project, info] of Object.entries(this.registry.projects)) {
      if (project !== this.config.projectName) {
        for (const [service, port] of Object.entries(info.ports)) {
          if (Object.values(currentProjectPorts).includes(port)) {
            console.log(`   ⚠️  ${project} is using port ${port}`);
            hasConflicts = true;
          }
        }
      }
    }
    
    if (!hasConflicts) {
      console.log('   ✅ No conflicts with other registered projects');
    }
  }

  async cleanRegistry() {
    console.log('\n🧹 Cleaning port registry...');
    const activeProjects = {};
    
    for (const [project, info] of Object.entries(this.registry.projects)) {
      let hasActivePorts = false;
      
      for (const port of Object.values(info.ports)) {
        const process = this.getProcessUsingPort(port);
        if (process) {
          hasActivePorts = true;
          break;
        }
      }
      
      if (hasActivePorts) {
        activeProjects[project] = info;
      } else {
        console.log(`  Removed inactive project: ${project}`);
      }
    }
    
    this.registry.projects = activeProjects;
    
    // Clean port mappings
    const activePorts = {};
    for (const [port, info] of Object.entries(this.registry.ports)) {
      if (this.registry.projects[info.project]) {
        activePorts[port] = info;
      }
    }
    this.registry.ports = activePorts;
    
    this.saveRegistry();
    console.log('✅ Registry cleaned');
  }
}

// CLI Interface
async function main() {
  const manager = new EnhancedPortManager();
  const command = process.argv[2];
  const autoKill = process.argv.includes('--kill') || process.argv.includes('-k');

  try {
    switch (command) {
      case 'allocate':
        const ports = await manager.allocatePorts(autoKill);
        manager.generateEnvFile(ports);
        manager.generateNextConfig(ports.frontend);
        console.log('\n✅ Ports allocated successfully!');
        console.log('💡 Start your services with: npm run dev:safe\n');
        break;

      case 'check':
        const conflicts = await manager.checkConflicts();
        if (conflicts.length > 0 && autoKill) {
          console.log('\n🔧 Auto-kill mode enabled');
          const allocatedPorts = await manager.allocatePorts(true);
          manager.generateEnvFile(allocatedPorts);
          manager.generateNextConfig(allocatedPorts.frontend);
        }
        break;

      case 'list':
        manager.listActiveProjects();
        break;

      case 'clean':
        await manager.cleanRegistry();
        break;

      case 'env':
        const envPorts = await manager.allocatePorts(autoKill);
        manager.generateEnvFile(envPorts);
        manager.generateNextConfig(envPorts.frontend);
        break;

      default:
        console.log(`
Enhanced Port Manager - Prevent port conflicts across all projects

Usage: node port-manager-enhanced.js <command> [options]

Commands:
  allocate   - Find and allocate available ports for this project
  check      - Check for port conflicts
  list       - List all registered projects and their ports
  clean      - Clean up inactive projects from registry
  env        - Generate .env.ports file with allocated ports

Options:
  --kill, -k - Automatically prompt to kill conflicting processes

Examples:
  node scripts/port-manager-enhanced.js allocate --kill
  node scripts/port-manager-enhanced.js check
  npm run ports:allocate -- --kill

Features:
  ✅ Checks all network interfaces (IPv4 and IPv6)
  ✅ Detects conflicts with other projects
  ✅ Can kill conflicting processes with confirmation
  ✅ Generates Next.js specific configuration
  ✅ Tracks all your projects in a global registry
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnhancedPortManager;