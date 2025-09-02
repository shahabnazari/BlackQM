#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const EnhancedPortManager = require('./port-manager-enhanced');

async function startServices() {
  console.log('🚀 Starting VQMethod with Enhanced Port Conflict Prevention\n');
  
  // Step 1: Check for conflicts and allocate ports
  const manager = new EnhancedPortManager();
  
  // First check for conflicts
  const conflicts = await manager.checkConflicts();
  if (conflicts.length > 0) {
    console.log('\n⚠️  Detected port conflicts. Attempting to resolve...\n');
  }
  
  // Allocate ports (with auto-kill if needed)
  const ports = await manager.allocatePorts(true);
  manager.generateEnvFile(ports);
  manager.generateNextConfig(ports.frontend);
  
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
  
  // Step 3: Kill any existing Next.js dev servers on the target port
  try {
    const existingProcess = manager.getProcessUsingPort(ports.frontend);
    if (existingProcess && existingProcess.command === 'node') {
      console.log(`🔧 Stopping existing Next.js server on port ${ports.frontend}...`);
      execSync(`kill -9 ${existingProcess.pid}`, { stdio: 'ignore' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Step 4: Start Frontend with proper Next.js port configuration
  // For Next.js, we need to pass the port as a command argument, not just env variable
  const frontendEnv = {
    ...process.env,
    PORT: ports.frontend.toString(),
    NEXT_PUBLIC_API_URL: `http://localhost:${ports.backend}/api`,
    ...envVars
  };
  
  // Create .env.local for Next.js
  const nextEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
  const nextEnvContent = `PORT=${ports.frontend}
NEXT_PUBLIC_API_URL=http://localhost:${ports.backend}/api
`;
  fs.writeFileSync(nextEnvPath, nextEnvContent);
  
  // Use the correct Next.js command with port argument
  const frontendArgs = ['run', 'dev', '--', '-p', ports.frontend.toString()];
  
  const frontend = spawn('npm', frontendArgs, {
    cwd: path.join(__dirname, '..', 'frontend'),
    env: frontendEnv,
    stdio: 'inherit',
    shell: true
  });
  
  // Step 5: Start Backend
  const backendEnv = {
    ...process.env,
    PORT: ports.backend.toString(),
    FRONTEND_URL: `http://localhost:${ports.frontend}`,
    ...envVars
  };
  
  // Check if backend directory exists
  const backendPath = path.join(__dirname, '..', 'backend');
  let backend = null;
  
  if (fs.existsSync(backendPath) && fs.existsSync(path.join(backendPath, 'package.json'))) {
    backend = spawn('npm', ['run', 'start:dev'], {
      cwd: backendPath,
      env: backendEnv,
      stdio: 'inherit',
      shell: true
    });
  } else {
    console.log('⚠️  Backend directory not found or not initialized. Skipping backend start.');
  }
  
  // Step 6: Handle shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down services...');
    
    if (frontend && !frontend.killed) {
      frontend.kill('SIGTERM');
    }
    
    if (backend && !backend.killed) {
      backend.kill('SIGTERM');
    }
    
    // Clean up registry after shutdown
    setTimeout(() => {
      const cleanupManager = new EnhancedPortManager();
      cleanupManager.cleanRegistry();
      process.exit(0);
    }, 1000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
  
  // Handle child process errors
  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });
  
  if (backend) {
    backend.on('error', (err) => {
      console.error('❌ Backend error:', err);
    });
  }
  
  // Step 7: Display access URLs
  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ VQMethod is running!\n');
    console.log(`🌐 Frontend: http://localhost:${ports.frontend}`);
    if (backend) {
      console.log(`🔧 Backend API: http://localhost:${ports.backend}/api`);
      console.log(`📚 API Docs: http://localhost:${ports.backend}/api/docs`);
    }
    console.log('='.repeat(50));
    console.log('\nPress Ctrl+C to stop all services\n');
    
    // Additional help
    console.log('💡 Troubleshooting:');
    console.log(`   - If frontend doesn't start, check: http://localhost:${ports.frontend}`);
    console.log(`   - Run "npm run ports:list" to see all active projects`);
    console.log(`   - Run "npm run ports:check" to diagnose conflicts\n`);
  }, 5000);
  
  // Step 8: Periodic health check
  setInterval(async () => {
    const frontendRunning = manager.getProcessUsingPort(ports.frontend);
    if (!frontendRunning) {
      console.log('⚠️  Frontend appears to have stopped. You may need to restart.');
    }
  }, 30000); // Check every 30 seconds
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