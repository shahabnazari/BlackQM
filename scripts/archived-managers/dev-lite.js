#!/usr/bin/env node

/**
 * LIGHTWEIGHT Development Server - Phase 10.1 Day 10
 *
 * OPTIMIZED for LOW CPU/MEMORY USAGE
 *
 * Key optimizations:
 * - NO test watchers (vitest/jest)
 * - NO health checks (reduces overhead)
 * - NO auto-restart (manual restart if needed)
 * - Minimal file watching
 * - Uses optimized Next.js config
 *
 * Use this when:
 * - Your laptop is under heavy load
 * - You don't need continuous testing
 * - You want maximum performance
 *
 * For full features, use: npm run dev
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting LIGHTWEIGHT Development Server...');
console.log('⚡ Optimized for LOW CPU/MEMORY usage');
console.log('');

// Check if optimized config exists
const optimizedConfig = path.join(__dirname, '..', 'next.config.optimized.js');
const originalConfig = path.join(__dirname, '..', 'frontend', 'next.config.js');

if (fs.existsSync(optimizedConfig)) {
  console.log('✅ Using optimized Next.js configuration');
  // Copy optimized config to frontend
  fs.copyFileSync(optimizedConfig, originalConfig);
} else {
  console.log('⚠️  Optimized config not found, using standard config');
}

// Start backend (NestJS)
console.log('📦 Starting Backend (NestJS)...');
const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true,
});

// Start frontend (Next.js) after 3 seconds
setTimeout(() => {
  console.log('🎨 Starting Frontend (Next.js)...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      // CRITICAL: Reduce Next.js memory usage
      NODE_OPTIONS: '--max-old-space-size=2048', // Limit to 2GB (down from default 4GB+)
    },
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });

  frontend.on('exit', (code) => {
    console.log(`🛑 Frontend exited with code ${code}`);
    process.exit(code);
  });
}, 3000);

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

backend.on('exit', (code) => {
  console.log(`🛑 Backend exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('');
console.log('✅ Development servers starting...');
console.log('📍 Frontend: http://localhost:3000');
console.log('📍 Backend:  http://localhost:4000');
console.log('');
console.log('💡 TIP: This is a lightweight mode - no test watchers, no health checks');
console.log('💡 For full features, use: npm run dev');
console.log('');
console.log('Press Ctrl+C to stop');
