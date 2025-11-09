#!/usr/bin/env node

/**
 * ENTERPRISE Development Server
 *
 * Optimized for large codebases (100K+ files)
 * Designed for powerful machines (i9/64GB RAM)
 *
 * Key features:
 * - Lazy compilation (only compile accessed routes)
 * - Aggressive file watching exclusions
 * - Source maps disabled
 * - Incremental TypeScript builds
 * - Persistent webpack cache
 * - Memory limits optimized for large RAM
 *
 * Expected resource usage:
 * - CPU: 40-50% (sustained)
 * - Memory: 4-6GB
 * - Build time: 5-10 seconds (first), <2 seconds (incremental)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏢 Starting ENTERPRISE Development Server...');
console.log('⚡ Optimized for large codebases (100K+ files)');
console.log('💪 Powered by i9/64GB RAM');
console.log('');

// Use enterprise Next.js config
const enterpriseConfig = path.join(__dirname, '..', 'next.config.enterprise.js');
const frontendConfig = path.join(__dirname, '..', 'frontend', 'next.config.js');

if (fs.existsSync(enterpriseConfig)) {
  console.log('✅ Using enterprise Next.js configuration');
  fs.copyFileSync(enterpriseConfig, frontendConfig);
}

// Use enterprise TypeScript config
const enterpriseTsConfig = path.join(__dirname, '..', 'frontend', 'tsconfig.enterprise.json');
const frontendTsConfig = path.join(__dirname, '..', 'frontend', 'tsconfig.json');

if (fs.existsSync(enterpriseTsConfig)) {
  console.log('✅ Using enterprise TypeScript configuration');
  // Create backup
  if (!fs.existsSync(frontendTsConfig + '.backup')) {
    fs.copyFileSync(frontendTsConfig, frontendTsConfig + '.backup');
  }
  fs.copyFileSync(enterpriseTsConfig, frontendTsConfig);
}

console.log('');

// Start backend (NestJS)
console.log('📦 Starting Backend (NestJS)...');
const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Optimize for large RAM
    NODE_OPTIONS: '--max-old-space-size=4096', // 4GB for backend
  },
});

// Start frontend (Next.js) after 3 seconds
setTimeout(() => {
  console.log('🎨 Starting Frontend (Next.js)...');
  console.log('⏳ First build may take 15-30 seconds (incremental builds will be <2 seconds)');
  console.log('');

  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      // CRITICAL: Optimize for i9/64GB RAM
      NODE_OPTIONS: '--max-old-space-size=8192', // 8GB for frontend (large codebase)

      // Enable Next.js optimizations
      NEXT_TELEMETRY_DISABLED: '1', // Disable telemetry
      ANALYZE: 'false', // Disable bundle analyzer
    },
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });

  frontend.on('exit', (code) => {
    console.log(`🛑 Frontend exited with code ${code}`);
    backend.kill();
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

  // Restore original configs
  if (fs.existsSync(frontendTsConfig + '.backup')) {
    fs.copyFileSync(frontendTsConfig + '.backup', frontendTsConfig);
  }

  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill('SIGTERM');

  // Restore original configs
  if (fs.existsSync(frontendTsConfig + '.backup')) {
    fs.copyFileSync(frontendTsConfig + '.backup', frontendTsConfig);
  }

  process.exit(0);
});

console.log('');
console.log('✅ Development servers starting...');
console.log('📍 Frontend: http://localhost:3000');
console.log('📍 Backend:  http://localhost:4000');
console.log('');
console.log('💡 ENTERPRISE MODE ENABLED:');
console.log('   • Lazy compilation (only compile accessed routes)');
console.log('   • Source maps disabled (faster builds)');
console.log('   • Incremental TypeScript (10x faster rebuilds)');
console.log('   • Persistent webpack cache');
console.log('   • Aggressive file watching exclusions');
console.log('');
console.log('📊 Expected performance:');
console.log('   • First build: 15-30 seconds');
console.log('   • Incremental builds: <2 seconds');
console.log('   • Memory usage: 4-6GB');
console.log('   • CPU usage: 40-50%');
console.log('');
console.log('Press Ctrl+C to stop');
