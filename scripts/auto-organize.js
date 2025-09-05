#!/usr/bin/env node

/**
 * VQMethod Auto-Organization Script
 * Automatically moves misplaced files to their correct locations
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// File placement rules
const FILE_RULES = {
  // Frontend-specific files
  'next.config.js': 'frontend/',
  'next.config.mjs': 'frontend/',
  'tailwind.config.js': 'frontend/',
  'tailwind.config.ts': 'frontend/',
  'postcss.config.js': 'frontend/',
  'postcss.config.mjs': 'frontend/',
  '.env.local': 'frontend/',
  'vitest.config.ts': 'frontend/',
  'vitest.config.js': 'frontend/',
  'playwright.config.ts': 'frontend/',
  'playwright.config.js': 'frontend/',

  // Backend-specific files
  'nest-cli.json': 'backend/',
  'ormconfig.js': 'backend/',
  'ormconfig.json': 'backend/',
  '.env.backend': 'backend/',
  'jest.config.js': 'backend/',
  'jest.config.ts': 'backend/',

  // Scripts
  '*.sh': 'scripts/',

  // Test files
  '*.test.sh': 'scripts/',
  '*.spec.ts': (file, rootPath) => {
    // Determine if frontend or backend based on imports
    const content = fs.readFileSync(path.join(rootPath, file), 'utf-8');
    if (content.includes('@nestjs') || content.includes('supertest')) {
      return 'backend/src/';
    }
    return 'frontend/';
  },

  // Documentation that should be in Lead
  'PHASE_*.md': 'Lead/',
  'CRITICAL_*.md': 'Lead/',
  'IMPLEMENTATION_*.md': 'Lead/',
  'DIRECTORY_STRUCTURE.md': 'Lead/',
  'DOCUMENTATION_*.md': 'Lead/',
  'ROUTING_*.md': 'Lead/',
  'PORT_*.md': 'Lead/',
  'PM2_*.md': 'Lead/',
  'GIT_*.md': 'Lead/',
  'GITHUB_*.md': 'Lead/',
  'TEST_*.md': 'Lead/',
  'USER_JOURNEY_*.md': 'Lead/',
  'NAVIGATION_*.md': 'Lead/',
  'QUICK_START.md': 'Lead/',
};

// Directory placement rules
const DIR_RULES = {
  '.next': 'frontend/',
  dist: 'backend/',
  prisma: 'backend/',
  src: (dir, rootPath) => {
    // Check if it's frontend or backend src
    const indexPath = path.join(rootPath, dir, 'index.ts');
    const appPath = path.join(rootPath, dir, 'app.module.ts');
    const mainPath = path.join(rootPath, dir, 'main.ts');

    if (fs.existsSync(appPath) || fs.existsSync(mainPath)) {
      return 'backend/';
    }
    return 'frontend/';
  },
  components: 'frontend/',
  pages: 'frontend/',
  app: 'frontend/',
  public: 'frontend/',
  styles: 'frontend/',
  modules: 'backend/src/',
  entities: 'backend/src/',
  migrations: 'backend/',
};

// Files that should remain in root
const ROOT_ALLOWED = [
  'package.json',
  'package-lock.json',
  '.gitignore',
  '.nvmrc',
  '.prettierrc',
  '.eslintrc.json',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'FILE_PLACEMENT_RULES.md',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'docker-compose.prod.yml',
  'port-config.json',
  '.env.ports',
  '.env.example',
  'ecosystem.config.js',
  'CLAUDE.md',
];

// Directories that should remain in root
const ROOT_ALLOWED_DIRS = [
  '.git',
  '.github',
  '.husky',
  '.vscode',
  'node_modules',
  'frontend',
  'backend',
  'scripts',
  'infrastructure',
  'Lead',
  'logs',
];

class FileOrganizer {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.rootPath = process.cwd();
    this.movedFiles = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix =
      {
        error: `${colors.red}❌`,
        warning: `${colors.yellow}⚠️`,
        success: `${colors.green}✅`,
        info: `${colors.blue}ℹ️`,
        move: `${colors.green}➜`,
      }[type] || '';

    console.log(`${prefix} ${message}${colors.reset}`);
  }

  shouldIgnore(item) {
    // Ignore hidden files (except specific ones)
    if (
      item.startsWith('.') &&
      !ROOT_ALLOWED.includes(item) &&
      !ROOT_ALLOWED_DIRS.includes(item)
    ) {
      return true;
    }

    // Ignore temporary files
    if (
      item.endsWith('.tmp') ||
      item.endsWith('.bak') ||
      item === 'thumbs.db'
    ) {
      return true;
    }

    return false;
  }

  getTargetLocation(item, isDirectory = false) {
    const rules = isDirectory ? DIR_RULES : FILE_RULES;

    // Check exact match
    if (rules[item]) {
      const target =
        typeof rules[item] === 'function'
          ? rules[item](item, this.rootPath)
          : rules[item];
      return target;
    }

    // Check pattern match for files
    if (!isDirectory) {
      for (const [pattern, target] of Object.entries(rules)) {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          if (regex.test(item)) {
            return typeof target === 'function'
              ? target(item, this.rootPath)
              : target;
          }
        }
      }
    }

    return null;
  }

  moveItem(item, targetDir) {
    const sourcePath = path.join(this.rootPath, item);
    const targetDirPath = path.join(this.rootPath, targetDir);
    const targetPath = path.join(targetDirPath, item);

    if (this.dryRun) {
      this.log(`Would move: ${item} → ${targetDir}${item}`, 'move');
      this.movedFiles.push({ from: item, to: `${targetDir}${item}` });
      return true;
    }

    try {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }

      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        this.log(`Target already exists: ${targetDir}${item}`, 'warning');
        return false;
      }

      // Move the file/directory
      fs.renameSync(sourcePath, targetPath);
      this.log(`Moved: ${item} → ${targetDir}${item}`, 'move');
      this.movedFiles.push({ from: item, to: `${targetDir}${item}` });
      return true;
    } catch (error) {
      this.log(`Failed to move ${item}: ${error.message}`, 'error');
      this.errors.push({ item, error: error.message });
      return false;
    }
  }

  organize() {
    this.log('Starting auto-organization...', 'info');

    const items = fs.readdirSync(this.rootPath);

    for (const item of items) {
      // Skip if should be ignored
      if (this.shouldIgnore(item)) {
        continue;
      }

      const itemPath = path.join(this.rootPath, item);
      const stats = fs.statSync(itemPath);
      const isDirectory = stats.isDirectory();

      // Skip allowed root items
      if (isDirectory && ROOT_ALLOWED_DIRS.includes(item)) {
        continue;
      }
      if (!isDirectory && ROOT_ALLOWED.includes(item)) {
        continue;
      }

      // Get target location
      const targetLocation = this.getTargetLocation(item, isDirectory);

      if (targetLocation) {
        this.moveItem(item, targetLocation);
      } else if (!isDirectory) {
        // Unknown file in root - flag it
        this.log(`Unknown file in root: ${item}`, 'warning');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    if (this.movedFiles.length > 0) {
      this.log(
        `${this.movedFiles.length} items ${this.dryRun ? 'would be' : 'were'} moved`,
        'success'
      );
      this.movedFiles.forEach(move => {
        console.log(`  ${move.from} → ${move.to}`);
      });
    } else {
      this.log('No items needed to be moved', 'success');
    }

    if (this.errors.length > 0) {
      this.log(`${this.errors.length} errors occurred`, 'error');
      this.errors.forEach(err => {
        console.log(`  ${err.item}: ${err.error}`);
      });
    }
  }

  checkSpecialCases() {
    // Check for common misplacements
    const specialChecks = [
      {
        check: () => fs.existsSync(path.join(this.rootPath, 'tsconfig.json')),
        message:
          'Root tsconfig.json detected - should be in workspace directories',
      },
      {
        check: () =>
          fs.existsSync(path.join(this.rootPath, 'frontend', 'node_modules')),
        message: 'Separate node_modules in frontend - consider using workspace',
      },
      {
        check: () =>
          fs.existsSync(path.join(this.rootPath, 'backend', 'node_modules')),
        message: 'Separate node_modules in backend - consider using workspace',
      },
    ];

    console.log('\n' + '='.repeat(60));
    this.log('Special cases check:', 'info');

    let issues = 0;
    specialChecks.forEach(({ check, message }) => {
      if (check()) {
        this.log(message, 'warning');
        issues++;
      }
    });

    if (issues === 0) {
      this.log('No special issues found', 'success');
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
VQMethod Auto-Organization Script

Usage: node scripts/auto-organize.js [options]

Options:
  --dry-run, -d    Show what would be moved without actually moving
  --help, -h       Show this help message

This script automatically moves misplaced files to their correct locations
according to VQMethod repository standards.
    `);
    process.exit(0);
  }

  const organizer = new FileOrganizer(dryRun);

  if (dryRun) {
    console.log(
      colors.yellow + '🔍 DRY RUN MODE - No files will be moved' + colors.reset
    );
    console.log('');
  }

  organizer.organize();
  organizer.checkSpecialCases();

  if (dryRun && organizer.movedFiles.length > 0) {
    console.log(
      '\n' +
        colors.yellow +
        'Run without --dry-run to actually move files' +
        colors.reset
    );
  }
}

module.exports = FileOrganizer;
