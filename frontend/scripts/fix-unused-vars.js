#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get TypeScript errors
const errors = execSync('npx tsc --noEmit 2>&1 | grep "TS6133"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Group errors by file
const errorsByFile = {};
errors.forEach(error => {
  const match = error.match(/^(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read/);
  if (match) {
    const [, file, line, column, variable] = match;
    if (!errorsByFile[file]) {
      errorsByFile[file] = [];
    }
    errorsByFile[file].push({ line: parseInt(line), column: parseInt(column), variable });
  }
});

// Fix each file
Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Sort errors by line number in reverse order to avoid offset issues
  fileErrors.sort((a, b) => b.line - a.line);
  
  fileErrors.forEach(({ line, variable }) => {
    const lineIndex = line - 1;
    const currentLine = lines[lineIndex];
    
    if (!currentLine) return;
    
    // Check if it's a function parameter
    if (currentLine.includes(`${variable}:`) || currentLine.includes(`${variable},`) || currentLine.includes(`${variable})`) || currentLine.includes(`${variable} =`)) {
      // If the variable doesn't already have underscore, add it
      if (!variable.startsWith('_')) {
        // Replace the variable name with underscore prefix
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        lines[lineIndex] = currentLine.replace(regex, `_${variable}`);
        console.log(`Fixed ${file}:${line} - prefixed ${variable} with _`);
      }
    }
  });
  
  // Write back the fixed content
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
});

console.log('Fixed unused variable errors');