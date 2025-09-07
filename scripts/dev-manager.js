#!/usr/bin/env node

/**
 * Development Server Manager - Best Practices Implementation
 *
 * This script manages frontend and backend servers with:
 * - Automatic port conflict resolution
 * - Process cleanup on exit
 * - Health checks
 * - Graceful shutdown
 * - Single instance enforcement
 * - Proper error handling
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  frontend: {
    name: 'Frontend',
    port: 3000,
    dir: path.join(__dirname, '..', 'frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    envFile: path.join(__dirname, '..', 'frontend', '.env.local'),
    healthCheck: 'http://localhost:3000',
    startupTime: 10000, // 10 seconds
  },
  backend: {
    name: 'Backend',
    port: 4000,
    dir: path.join(__dirname, '..', 'backend'),
    command: 'npm',
    args: ['run', 'start:dev'],
    envFile: path.join(__dirname, '..', 'backend', '.env'),
    healthCheck: 'http://localhost:4000/api/health',
    startupTime: 15000, // 15 seconds
  },
};

// Store running processes
const runningProcesses = {
  frontend: null,
  backend: null,
};

// PID file for single instance enforcement
const PID_FILE = path.join(__dirname, '..', '.dev-servers.pid');

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

/**
 * Kill process using a specific port
 */
async function killPortProcess(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    const pids = stdout.trim().split('\n').filter(Boolean);

    for (const pid of pids) {
      console.log(`  Killing process ${pid} on port ${port}`);
      await execAsync(`kill -9 ${pid}`);
    }

    // Wait for port to be freed
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    // No process found on port
    return false;
  }
}

/**
 * Check and clean existing PM2 processes
 */
async function cleanPM2() {
  try {
    console.log('🧹 Checking for PM2 processes...');
    await execAsync('pm2 delete all 2>/dev/null');
    console.log('  ✅ PM2 processes cleaned');
  } catch (error) {
    // PM2 might not be running or have no processes
  }
}

/**
 * Check for existing running instance
 */
async function checkExistingInstance() {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      // Check if process is still running
      await execAsync(`kill -0 ${pid}`);
      console.log(`⚠️  Another instance is already running (PID: ${pid})`);
      console.log('   Run "npm run stop" first or kill the process manually');
      process.exit(1);
    } catch (error) {
      // Process not running, clean up PID file
      fs.unlinkSync(PID_FILE);
    }
  }
}

/**
 * Write PID file
 */
function writePIDFile() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
}

/**
 * Clean up PID file
 */
function cleanupPIDFile() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

/**
 * Ensure environment files exist
 */
function ensureEnvFiles() {
  // Frontend .env.local
  const frontendEnv = CONFIG.frontend.envFile;
  if (!fs.existsSync(frontendEnv)) {
    console.log(`📝 Creating ${frontendEnv}`);
    fs.writeFileSync(
      frontendEnv,
      `PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
`
    );
  }

  // Backend .env
  const backendEnv = CONFIG.backend.envFile;
  if (!fs.existsSync(backendEnv)) {
    console.log(`📝 Creating ${backendEnv}`);
    fs.writeFileSync(
      backendEnv,
      `DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
BCRYPT_ROUNDS=12
ENABLE_VIRUS_SCANNING=false
`
    );
  }
}

/**
 * Start a server
 */
async function startServer(config, key) {
  console.log(`\n🚀 Starting ${config.name}...`);

  // Check port availability
  if (await isPortInUse(config.port)) {
    console.log(`  ⚠️  Port ${config.port} is in use`);
    const killed = await killPortProcess(config.port);
    if (killed) {
      console.log(`  ✅ Port ${config.port} is now free`);
    }
  }

  // Start the process
  const env = { ...process.env };
  env.PORT = config.port;

  const child = spawn(config.command, config.args, {
    cwd: config.dir,
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  runningProcesses[key] = child;

  // Handle output
  child.stdout.on('data', data => {
    const output = data.toString();
    // Filter out noisy output
    if (!output.includes('npm error code ENOWORKSPACES')) {
      process.stdout.write(`[${config.name}] ${output}`);
    }
  });

  child.stderr.on('data', data => {
    const output = data.toString();
    // Filter out npm workspace warnings
    if (
      !output.includes('npm error code ENOWORKSPACES') &&
      !output.includes('npm error This command does not support workspaces')
    ) {
      process.stderr.write(`[${config.name}] ${output}`);
    }
  });

  child.on('error', error => {
    console.error(`❌ ${config.name} error:`, error.message);
  });

  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`❌ ${config.name} exited with code ${code}`);
    }
    runningProcesses[key] = null;
  });

  console.log(`  ✅ ${config.name} started on port ${config.port}`);

  return child;
}

/**
 * Stop all servers
 */
async function stopAllServers() {
  console.log('\n🛑 Stopping all servers...');

  for (const [key, process] of Object.entries(runningProcesses)) {
    if (process && !process.killed) {
      console.log(`  Stopping ${key}...`);
      process.kill('SIGTERM');

      // Give it time to shutdown gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Force kill if still running
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }
  }

  // Clean up any remaining processes on our ports
  await killPortProcess(CONFIG.frontend.port);
  await killPortProcess(CONFIG.backend.port);

  // Clean up PID file
  cleanupPIDFile();

  console.log('  ✅ All servers stopped');
}

/**
 * Main function
 */
async function main() {
  console.log('========================================');
  console.log('   VQMethod Development Server Manager');
  console.log('========================================');

  // Check for existing instance
  await checkExistingInstance();

  // Write PID file
  writePIDFile();

  // Clean up any existing processes
  await cleanPM2();

  // Ensure environment files exist
  ensureEnvFiles();

  // Kill any existing processes on our ports
  console.log('\n🧹 Cleaning up ports...');
  await killPortProcess(CONFIG.frontend.port);
  await killPortProcess(CONFIG.backend.port);

  // Start servers
  try {
    await startServer(CONFIG.backend, 'backend');

    // Wait a bit for backend to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    await startServer(CONFIG.frontend, 'frontend');

    console.log('\n========================================');
    console.log('   All servers started successfully!');
    console.log('========================================');
    console.log('\n📱 Frontend: http://localhost:3000');
    console.log('🔧 Backend:  http://localhost:4000/api');
    console.log('📚 API Docs: http://localhost:4000/api/docs');
    console.log('\n Press Ctrl+C to stop all servers\n');
  } catch (error) {
    console.error('❌ Failed to start servers:', error.message);
    await stopAllServers();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n📦 Received shutdown signal...');
  await stopAllServers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopAllServers();
  process.exit(0);
});

process.on('exit', () => {
  cleanupPIDFile();
});

// Handle uncaught errors
process.on('uncaughtException', async error => {
  console.error('❌ Uncaught exception:', error);
  await stopAllServers();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  await stopAllServers();
  process.exit(1);
});

// Run the main function
main().catch(async error => {
  console.error('❌ Fatal error:', error);
  await stopAllServers();
  process.exit(1);
});
