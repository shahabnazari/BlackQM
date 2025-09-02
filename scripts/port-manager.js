#!/usr/bin/env node

const net = require('net');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PortManager {
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

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, '127.0.0.1');
    });
  }

  async findAvailablePort(service) {
    const serviceConfig = this.config.services[service];
    if (!serviceConfig) {
      throw new Error(`Service ${service} not found in config`);
    }

    // Check default port first
    if (await this.isPortAvailable(serviceConfig.defaultPort)) {
      return serviceConfig.defaultPort;
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

  getProcessUsingPort(port) {
    try {
      const result = execSync(`lsof -i :${port} -P | grep LISTEN | head -1`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      if (result) {
        const parts = result.trim().split(/\s+/);
        return {
          command: parts[0],
          pid: parts[1],
          user: parts[2]
        };
      }
    } catch (error) {
      // Port is free or lsof failed
    }
    return null;
  }

  async allocatePorts() {
    const allocatedPorts = {};
    console.log(`\n🔍 Port Allocation for ${this.config.projectName}`);
    console.log('━'.repeat(50));

    for (const [service, config] of Object.entries(this.config.services)) {
      const port = await this.findAvailablePort(service);
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
      const process = this.getProcessUsingPort(config.defaultPort);
      if (process) {
        conflicts.push({
          service,
          port: config.defaultPort,
          process
        });
      }
    }

    if (conflicts.length > 0) {
      console.log('\n⚠️  Port Conflicts Detected:');
      conflicts.forEach(({ service, port, process }) => {
        console.log(`   ${service}: Port ${port} is used by ${process.command} (PID: ${process.pid})`);
      });
      console.log('\n💡 Tip: The port manager will automatically use fallback ports.');
    } else {
      console.log('✅ No conflicts detected - all default ports are available');
    }

    return conflicts;
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
      ''
    ].join('\n');

    fs.writeFileSync(envPath, envContent);
    console.log(`\n📝 Environment file created: ${envPath}`);
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
        const isActive = this.getProcessUsingPort(port);
        const status = isActive ? '🟢' : '⚫';
        console.log(`  ${status} ${service.padEnd(10)}: ${port}`);
      }
      console.log(`  Last updated: ${new Date(info.timestamp).toLocaleString()}`);
    }
  }

  async cleanRegistry() {
    console.log('\n🧹 Cleaning port registry...');
    const activeProjects = {};
    
    for (const [project, info] of Object.entries(this.registry.projects)) {
      let hasActivePorts = false;
      
      for (const port of Object.values(info.ports)) {
        if (this.getProcessUsingPort(port)) {
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
  const manager = new PortManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'allocate':
        const ports = await manager.allocatePorts();
        manager.generateEnvFile(ports);
        console.log('\n✅ Ports allocated successfully!');
        console.log('💡 Start your services with: npm run dev:safe\n');
        break;

      case 'check':
        await manager.checkConflicts();
        break;

      case 'list':
        manager.listActiveProjects();
        break;

      case 'clean':
        await manager.cleanRegistry();
        break;

      case 'env':
        const envPorts = await manager.allocatePorts();
        manager.generateEnvFile(envPorts);
        break;

      default:
        console.log(`
Port Manager - Prevent port conflicts across projects

Usage: node port-manager.js <command>

Commands:
  allocate   - Find and allocate available ports for this project
  check      - Check for port conflicts
  list       - List all registered projects and their ports
  clean      - Clean up inactive projects from registry
  env        - Generate .env.ports file with allocated ports

Examples:
  node scripts/port-manager.js allocate
  node scripts/port-manager.js check
  npm run ports:allocate
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

module.exports = PortManager;