#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const PortManager = require('./port-manager');

async function startServices() {
  console.log('🚀 Starting VQMethod with Port Conflict Prevention\n');
  
  // Step 1: Allocate ports
  const manager = new PortManager();
  const ports = await manager.allocatePorts();
  manager.generateEnvFile(ports);
  
  // Step 2: Load the generated port configuration
  const envPath = path.join(__dirname, '..', '.env.ports');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  console.log('\n🚀 Starting services...\n');
  
  // Step 3: Start Frontend
  const frontendEnv = {
    ...process.env,
    PORT: ports.frontend,
    NEXT_PUBLIC_API_URL: `http://localhost:${ports.backend}/api`,
    ...envVars
  };
  
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'frontend'),
    env: frontendEnv,
    stdio: 'inherit',
    shell: true
  });
  
  // Step 4: Start Backend
  const backendEnv = {
    ...process.env,
    PORT: ports.backend,
    FRONTEND_URL: `http://localhost:${ports.frontend}`,
    ...envVars
  };
  
  const backend = spawn('npm', ['run', 'start:dev'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: backendEnv,
    stdio: 'inherit',
    shell: true
  });
  
  // Step 5: Handle shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down services...');
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    
    // Clean up registry after shutdown
    setTimeout(() => {
      const cleanupManager = new PortManager();
      cleanupManager.cleanRegistry();
      process.exit(0);
    }, 1000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Step 6: Display access URLs
  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ VQMethod is running!\n');
    console.log(`🌐 Frontend: http://localhost:${ports.frontend}`);
    console.log(`🔧 Backend API: http://localhost:${ports.backend}/api`);
    console.log(`📚 API Docs: http://localhost:${ports.backend}/api/docs`);
    console.log('='.repeat(50));
    console.log('\nPress Ctrl+C to stop all services\n');
  }, 3000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

// Start the services
startServices().catch(error => {
  console.error('❌ Failed to start services:', error);
  process.exit(1);
});