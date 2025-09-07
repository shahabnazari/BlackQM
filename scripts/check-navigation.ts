#!/usr/bin/env node
/**
 * Navigation System Check Script
 * Validates navigation consistency across all pages
 */

import * as fs from 'fs';
import * as path from 'path';

interface NavigationIssue {
  file: string;
  issue: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
}

const issues: NavigationIssue[] = [];

// Patterns to check for
const PATTERNS = {
  doubleHeader: [
    /ResearcherNavigation.*<header/s,
    /<header.*<header/s,
    /className=".*header.*".*className=".*header.*"/s,
  ],
  layoutShift: [
    /return null.*useAuth/s,
    /\{user\s*&&.*avatar/s,
    /\{isLoading\s*&&.*<div/s,
  ],
  missingPlaceholder: [
    /if\s*\(!.*\)\s*{\s*return\s*null/s,
    /\{.*\?\s*<.*:\s*null\}/s,
  ],
};

function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(process.cwd(), filePath);

  // Check for double headers
  PATTERNS.doubleHeader.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push({
        file: fileName,
        issue: 'Potential double header detected',
        severity: 'error',
      });
    }
  });

  // Check for layout shift issues
  PATTERNS.layoutShift.forEach(pattern => {
    if (pattern.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          issues.push({
            file: fileName,
            issue:
              'Potential layout shift: conditional rendering without placeholder',
            line: index + 1,
            severity: 'warning',
          });
        }
      });
    }
  });

  // Check for missing placeholders
  if (filePath.includes('navigation') || filePath.includes('Navigation')) {
    PATTERNS.missingPlaceholder.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push({
          file: fileName,
          issue: 'Missing placeholder for async content',
          severity: 'warning',
        });
      }
    });
  }
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', '.next', 'dist', '.git'].includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))
    ) {
      checkFile(fullPath);
    }
  }
}

// Main execution
console.log('🔍 Checking navigation system consistency...\n');

const frontendPath = path.join(process.cwd(), 'frontend');
if (fs.existsSync(frontendPath)) {
  scanDirectory(frontendPath);
} else {
  console.error('Frontend directory not found!');
  process.exit(1);
}

// Report results
console.log('\n📊 Navigation System Check Results:\n');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('✅ No navigation issues found!');
} else {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  console.log(`Found ${issues.length} issues:`);
  console.log(`  🔴 Errors: ${errors.length}`);
  console.log(`  🟡 Warnings: ${warnings.length}`);
  console.log(`  🔵 Info: ${info.length}\n`);

  // Group by severity
  if (errors.length > 0) {
    console.log('\n🔴 ERRORS:');
    errors.forEach(issue => {
      console.log(`  ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n🟡 WARNINGS:');
    warnings.forEach(issue => {
      console.log(`  ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.issue}`);
    });
  }

  if (info.length > 0) {
    console.log('\n🔵 INFO:');
    info.forEach(issue => {
      console.log(`  ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.issue}`);
    });
  }
}

console.log('\n' + '='.repeat(60));

// Recommendations
console.log('\n💡 Recommendations:\n');
console.log('1. Always use skeleton loaders or placeholders for async content');
console.log('2. Reserve space for dynamic content with min-width/min-height');
console.log(
  '3. Use CSS Grid or Flexbox with fixed dimensions for layout stability'
);
console.log(
  '4. Implement loading states with the same dimensions as loaded content'
);
console.log(
  '5. Test navigation on slow connections to identify layout shifts\n'
);

process.exit(issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
