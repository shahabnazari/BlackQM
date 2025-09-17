#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  const output = execSync('cd frontend && npx tsc --noEmit 2>&1', { encoding: 'utf8' });
  const errorCount = (output.match(/error TS/g) || []).length;
  console.log(`TypeScript errors found: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('✅ SUCCESS: Zero TypeScript errors achieved!');
  } else {
    console.log('Remaining errors to fix...');
    // Show first 10 errors
    const lines = output.split('\n');
    let shown = 0;
    for (const line of lines) {
      if (line.includes('error TS')) {
        console.log(line);
        shown++;
        if (shown >= 10) break;
      }
    }
  }
} catch (error) {
  const output = error.stdout || error.stderr || '';
  const errorCount = (output.match(/error TS/g) || []).length;
  console.log(`TypeScript errors found: ${errorCount}`);
  
  if (errorCount > 0) {
    // Show first 10 errors
    const lines = output.split('\n');
    let shown = 0;
    console.log('\nFirst 10 errors:');
    for (const line of lines) {
      if (line.includes('error TS')) {
        console.log(line);
        shown++;
        if (shown >= 10) break;
      }
    }
  }
}