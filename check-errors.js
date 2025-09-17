#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Checking TypeScript errors...\n');

try {
  execSync('cd frontend && npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n✅ NO TypeScript errors found!');
  process.exit(0);
} catch (error) {
  // TypeScript check failed, count errors
  try {
    const output = execSync('cd frontend && npx tsc --noEmit 2>&1', { encoding: 'utf8' });
    const errorCount = (output.match(/error TS/g) || []).length;
    console.log(`\n⚠️  Found ${errorCount} TypeScript errors`);
    
    // Get error breakdown
    const errorTypes = {};
    const matches = output.matchAll(/error (TS\d+):/g);
    for (const match of matches) {
      errorTypes[match[1]] = (errorTypes[match[1]] || 0) + 1;
    }
    
    if (Object.keys(errorTypes).length > 0) {
      console.log('\nError breakdown:');
      for (const [type, count] of Object.entries(errorTypes).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count} errors`);
      }
    }
    
    // Show first 10 errors
    console.log('\nFirst 10 errors:');
    const lines = output.split('\n');
    let errorCount2 = 0;
    for (const line of lines) {
      if (line.includes('error TS')) {
        console.log(line);
        errorCount2++;
        if (errorCount2 >= 10) break;
      }
    }
    
  } catch (err) {
    console.error('Error running TypeScript check:', err.message);
  }
}