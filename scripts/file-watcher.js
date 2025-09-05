#!/usr/bin/env node

/**
 * VQMethod File System Watcher
 * Monitors file creation and ensures repository standards
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const FileOrganizer = require('./auto-organize');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// File placement rules (simplified from auto-organize.js)
const PLACEMENT_RULES = {
  // Config files that should trigger warnings
  'tsconfig.json': {
    workspace: 'frontend or backend',
    message: 'TypeScript config should be in workspace directory',
  },
  'tailwind.config.js': {
    workspace: 'frontend',
    message: 'Tailwind config belongs in frontend/',
  },
  'tailwind.config.ts': {
    workspace: 'frontend',
    message: 'Tailwind config belongs in frontend/',
  },
  'next.config.js': {
    workspace: 'frontend',
    message: 'Next.js config belongs in frontend/',
  },
  'next.config.mjs': {
    workspace: 'frontend',
    message: 'Next.js config belongs in frontend/',
  },
  'postcss.config.js': {
    workspace: 'frontend',
    message: 'PostCSS config belongs in frontend/',
  },
  'vitest.config.ts': {
    workspace: 'frontend',
    message: 'Vitest config belongs in frontend/',
  },
  'playwright.config.ts': {
    workspace: 'frontend',
    message: 'Playwright config belongs in frontend/',
  },
  'nest-cli.json': {
    workspace: 'backend',
    message: 'NestJS config belongs in backend/',
  },
  'ormconfig.js': {
    workspace: 'backend',
    message: 'ORM config belongs in backend/',
  },
  'jest.config.js': {
    workspace: 'backend',
    message: 'Jest config belongs in backend/',
  },
};

// Naming convention rules
const NAMING_RULES = {
  // File extensions and their naming conventions
  '.tsx': {
    component: {
      pattern: /^[A-Z]/,
      message: 'React components should use PascalCase',
    },
    page: {
      pattern: /^[a-z]/,
      message: 'Next.js pages should use lowercase',
      path: 'app/',
    },
  },
  '.ts': {
    hook: {
      pattern: /^use[A-Z]/,
      message: 'Hooks should start with "use"',
      path: 'hooks/',
    },
    service: {
      pattern: /\.service\.ts$/,
      message: 'Services should end with .service.ts',
      path: 'backend/',
    },
    controller: {
      pattern: /\.controller\.ts$/,
      message: 'Controllers should end with .controller.ts',
      path: 'backend/',
    },
    module: {
      pattern: /\.module\.ts$/,
      message: 'Modules should end with .module.ts',
      path: 'backend/',
    },
  },
  '.css': {
    style: {
      pattern: /^[a-z-]+\.css$/,
      message: 'CSS files should use kebab-case',
    },
  },
};

class FileWatcher {
  constructor() {
    this.rootPath = process.cwd();
    this.organizer = new FileOrganizer(true); // Dry run mode for suggestions
    this.watcher = null;
    this.recentWarnings = new Set(); // Prevent duplicate warnings
  }

  log(message, type = 'info') {
    const prefix =
      {
        error: `${colors.red}❌`,
        warning: `${colors.yellow}⚠️`,
        success: `${colors.green}✅`,
        info: `${colors.blue}ℹ️`,
        watch: `${colors.cyan}👁️`,
      }[type] || '';

    console.log(`${prefix} ${message}${colors.reset}`);
  }

  checkFileName(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const dir = path.dirname(filePath);

    // Check naming conventions
    if (NAMING_RULES[ext]) {
      for (const [type, rule] of Object.entries(NAMING_RULES[ext])) {
        // Check if file is in relevant path
        if (rule.path && !dir.includes(rule.path)) continue;

        // Check naming pattern
        if (rule.pattern && !rule.pattern.test(fileName)) {
          this.log(`${rule.message}: ${fileName}`, 'warning');
          return false;
        }
      }
    }

    return true;
  }

  checkFilePlacement(filePath) {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(this.rootPath, filePath);
    const isInRoot = !relativePath.includes(path.sep);

    // Check if it's a config file in wrong location
    if (isInRoot && PLACEMENT_RULES[fileName]) {
      const rule = PLACEMENT_RULES[fileName];
      this.log(`${rule.message}: ${fileName}`, 'error');
      this.suggestFix(fileName, rule.workspace);
      return false;
    }

    // Check for common misplacements
    if (isInRoot) {
      const ext = path.extname(fileName);

      // TypeScript/JavaScript files shouldn't be in root
      if (
        ['.ts', '.tsx', '.js', '.jsx'].includes(ext) &&
        !fileName.includes('config') &&
        !fileName.includes('.config.')
      ) {
        this.log(`Source file in root directory: ${fileName}`, 'error');
        this.suggestFix(fileName, 'appropriate workspace');
        return false;
      }

      // Shell scripts should be in scripts/
      if (ext === '.sh') {
        this.log(`Shell script should be in scripts/: ${fileName}`, 'warning');
        this.suggestFix(fileName, 'scripts');
        return false;
      }
    }

    return true;
  }

  suggestFix(fileName, targetLocation) {
    console.log(`${colors.cyan}  💡 Suggested fixes:${colors.reset}`);
    console.log(`     1. Move to ${targetLocation}/`);
    console.log(`     2. Run: npm run organize`);
    console.log(`     3. Use: npm run create:file for guided creation`);
  }

  checkNewFile(filePath) {
    // Skip if already warned recently (within 5 seconds)
    const warningKey = filePath + Date.now();
    if (this.recentWarnings.has(filePath)) return;

    this.recentWarnings.add(filePath);
    setTimeout(() => this.recentWarnings.delete(filePath), 5000);

    const fileName = path.basename(filePath);
    const relativePath = path.relative(this.rootPath, filePath);

    this.log(`New file detected: ${relativePath}`, 'watch');

    // Check file placement
    const placementOk = this.checkFilePlacement(filePath);

    // Check naming convention
    const namingOk = this.checkFileName(filePath);

    if (placementOk && namingOk) {
      this.log(`File follows repository standards ✓`, 'success');
    } else {
      console.log(
        `${colors.yellow}  📚 See FILE_PLACEMENT_RULES.md for guidelines${colors.reset}`
      );

      // Offer to auto-fix
      if (!placementOk) {
        console.log(
          `${colors.cyan}  🔧 Run 'npm run organize' to auto-fix placement${colors.reset}`
        );
      }
    }
  }

  checkModifiedFile(filePath) {
    // For modified files, we only check if they've been moved
    const fileName = path.basename(filePath);
    const relativePath = path.relative(this.rootPath, filePath);

    // Only log for important files
    if (fileName.endsWith('.config.js') || fileName === 'tsconfig.json') {
      this.checkFilePlacement(filePath);
    }
  }

  start() {
    this.log('Starting VQMethod File Watcher...', 'info');

    // Directories to watch
    const watchPaths = [
      this.rootPath,
      path.join(this.rootPath, 'frontend'),
      path.join(this.rootPath, 'backend'),
      path.join(this.rootPath, 'scripts'),
    ];

    // Initialize watcher
    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        /(^|[\/\\])\../, // Ignore dotfiles
        /node_modules/,
        /.next/,
        /dist/,
        /coverage/,
        /\.git/,
        /logs/,
        /\.(log|tmp|bak)$/,
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 3,
    });

    // Watch for new files
    this.watcher.on('add', filePath => {
      this.checkNewFile(filePath);
    });

    // Watch for moved files (unlink + add)
    let recentlyDeleted = new Map();

    this.watcher.on('unlink', filePath => {
      const fileName = path.basename(filePath);
      recentlyDeleted.set(fileName, filePath);

      // Clear after 2 seconds
      setTimeout(() => recentlyDeleted.delete(fileName), 2000);
    });

    this.watcher.on('add', filePath => {
      const fileName = path.basename(filePath);

      // Check if this was recently deleted (moved)
      if (recentlyDeleted.has(fileName)) {
        const oldPath = recentlyDeleted.get(fileName);
        const oldRelative = path.relative(this.rootPath, oldPath);
        const newRelative = path.relative(this.rootPath, filePath);

        if (oldRelative !== newRelative) {
          this.log(`File moved: ${oldRelative} → ${newRelative}`, 'watch');
          this.checkFilePlacement(filePath);
        }

        recentlyDeleted.delete(fileName);
      }
    });

    // Ready event
    this.watcher.on('ready', () => {
      this.log('File watcher ready and monitoring', 'success');
      console.log(
        `${colors.cyan}  Watching: root, frontend/, backend/, scripts/${colors.reset}`
      );
      console.log(`${colors.cyan}  Press Ctrl+C to stop${colors.reset}\n`);
    });

    // Error handling
    this.watcher.on('error', error => {
      this.log(`Watcher error: ${error.message}`, 'error');
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.log('File watcher stopped', 'info');
    }
  }
}

// Check if chokidar is installed
function checkDependencies() {
  try {
    require('chokidar');
    return true;
  } catch (e) {
    console.error(
      `${colors.red}❌ Missing dependency: chokidar${colors.reset}`
    );
    console.log(
      `${colors.yellow}Please run: npm install --save-dev chokidar${colors.reset}`
    );
    return false;
  }
}

// Main execution
if (require.main === module) {
  if (!checkDependencies()) {
    process.exit(1);
  }

  const watcher = new FileWatcher();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n');
    watcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.stop();
    process.exit(0);
  });

  // Start watching
  watcher.start();
}

module.exports = FileWatcher;
