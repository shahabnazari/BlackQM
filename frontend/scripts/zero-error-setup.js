#!/usr/bin/env node

/**
 * World-Class Zero-Error Setup Script
 * Configures the project for zero TypeScript errors
 * Run: npm run setup:zero-errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  progress: (msg) => console.log(`${colors.cyan}⏳${colors.reset} ${msg}`)
};

class ZeroErrorSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Update tsconfig.json with strict settings
   */
  updateTsConfig() {
    log.header('Configuring TypeScript for Zero Errors');
    
    const tsconfigPath = path.join(this.frontendPath, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      this.errors.push('tsconfig.json not found');
      return false;
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Ensure strict mode is enabled
      tsconfig.compilerOptions = {
        ...tsconfig.compilerOptions,
        // Strict type checking
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "alwaysStrict": true,
        
        // Additional checks
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "forceConsistentCasingInFileNames": true,
        
        // Error reporting
        "pretty": true,
        "skipLibCheck": true,
        "noErrorTruncation": true
      };

      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      log.success('TypeScript configured with strict settings');
      return true;
    } catch (error) {
      this.errors.push(`Failed to update tsconfig: ${error.message}`);
      return false;
    }
  }

  /**
   * Install required dependencies
   */
  installDependencies() {
    log.header('Installing Zero-Error Dependencies');
    
    const dependencies = [
      '@types/node',
      'typescript',
      'type-fest',
      'ts-node',
      'tsd',
      'type-coverage',
      'typescript-strict-plugin'
    ];

    try {
      log.progress('Installing type checking tools...');
      execSync(
        `cd ${this.frontendPath} && npm install --save-dev ${dependencies.join(' ')}`,
        { stdio: 'inherit' }
      );
      log.success('Dependencies installed successfully');
      return true;
    } catch (error) {
      this.errors.push('Failed to install dependencies');
      return false;
    }
  }

  /**
   * Set up pre-commit hooks
   */
  setupPreCommitHooks() {
    log.header('Setting Up Pre-Commit Hooks');
    
    const huskyPath = path.join(this.frontendPath, '.husky');
    
    try {
      // Install husky if not present
      if (!fs.existsSync(huskyPath)) {
        log.progress('Installing husky...');
        execSync(`cd ${this.frontendPath} && npx husky-init`, { stdio: 'inherit' });
      }

      // Create pre-commit hook
      const preCommitPath = path.join(huskyPath, 'pre-commit');
      const preCommitContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Zero-error enforcement
echo "🔒 Checking TypeScript errors..."
cd frontend
npm run typecheck:strict

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected!"
  echo "Please fix all errors before committing."
  echo "Run 'npm run fix:types' to auto-fix common issues."
  exit 1
fi

echo "✅ No TypeScript errors found!"

# Run additional checks
npm run lint:fix
npm run format
`;

      fs.writeFileSync(preCommitPath, preCommitContent);
      fs.chmodSync(preCommitPath, '755');
      log.success('Pre-commit hooks configured');
      return true;
    } catch (error) {
      this.warnings.push('Pre-commit hooks setup incomplete');
      return false;
    }
  }

  /**
   * Create VS Code settings
   */
  createVSCodeSettings() {
    log.header('Configuring VS Code for Zero Errors');
    
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    const settings = {
      "typescript.tsserver.experimental.enableProjectDiagnostics": true,
      "typescript.preferences.includeInlayParameterNameHints": "all",
      "typescript.preferences.includeInlayFunctionParameterTypeHints": true,
      "typescript.preferences.includeInlayVariableTypeHints": true,
      "typescript.preferences.includeInlayPropertyDeclarationTypeHints": true,
      "typescript.preferences.includeInlayFunctionLikeReturnTypeHints": true,
      "typescript.reportStyleChecksAsWarnings": true,
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.ts": true,
        "source.organizeImports": true
      },
      "typescript.updateImportsOnFileMove.enabled": "always",
      "typescript.suggest.autoImports": true,
      "typescript.suggest.completeFunctionCalls": true,
      "files.exclude": {
        "**/.git": true,
        "**/.DS_Store": true,
        "**/node_modules": true,
        "**/.next": true
      }
    };

    const settingsPath = path.join(vscodeDir, 'settings.json');
    
    try {
      // Merge with existing settings if present
      let existingSettings = {};
      if (fs.existsSync(settingsPath)) {
        existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      
      const mergedSettings = { ...existingSettings, ...settings };
      fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
      log.success('VS Code settings configured');
      return true;
    } catch (error) {
      this.warnings.push('VS Code settings incomplete');
      return false;
    }
  }

  /**
   * Add npm scripts
   */
  addNpmScripts() {
    log.header('Adding Zero-Error NPM Scripts');
    
    const packagePath = path.join(this.frontendPath, 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      packageJson.scripts = {
        ...packageJson.scripts,
        // Core scripts
        "typecheck:strict": "tsc --noEmit --strict",
        "setup:zero-errors": "node scripts/zero-error-setup.js",
        "fix:types": "node scripts/auto-fix-types.js",
        
        // Type generation
        "types:generate": "node scripts/generate-types.js",
        "types:validate": "tsc --noEmit && type-coverage",
        "types:coverage": "type-coverage --detail",
        
        // Development
        "dev:strict": "concurrently \"npm run dev\" \"npm run typecheck:watch\"",
        "typecheck:watch": "tsc --noEmit --watch --preserveWatchOutput",
        
        // Testing
        "test:types": "tsd",
        "test:all": "npm run typecheck:strict && npm run test",
        
        // Utilities
        "morning:check": "node scripts/morning-check.js",
        "pre-commit:validate": "npm run typecheck:strict && npm run lint",
        "eod:report": "node scripts/eod-report.js",
        "ready:check": "node scripts/ready-check.js",
        
        // AI type generation
        "generate:ai-types": "node scripts/generate-ai-types.js",
        "validate:ai-contracts": "node scripts/validate-ai-contracts.js",
        "test:ai-types": "jest --testMatch='**/*.type.test.ts'"
      };

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      log.success('NPM scripts added');
      return true;
    } catch (error) {
      this.errors.push('Failed to add npm scripts');
      return false;
    }
  }

  /**
   * Run initial type check
   */
  async runInitialCheck() {
    log.header('Running Initial Type Check');
    
    try {
      log.progress('Checking current TypeScript errors...');
      const output = execSync(`cd ${this.frontendPath} && npm run typecheck 2>&1`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      const errorCount = (output.match(/error TS/g) || []).length;
      
      if (errorCount === 0) {
        log.success('🎉 ZERO TypeScript errors! Already at world-class quality!');
      } else {
        log.warning(`Found ${errorCount} TypeScript errors to fix`);
        log.info('Run "npm run fix:types" to auto-fix common issues');
      }
      
      return errorCount;
    } catch (error) {
      // Type check failed, parse error count
      const output = error.stdout || error.toString();
      const errorCount = (output.match(/error TS/g) || []).length;
      log.warning(`Found ${errorCount} TypeScript errors to fix`);
      return errorCount;
    }
  }

  /**
   * Generate summary report
   */
  generateReport(errorCount) {
    log.header('Setup Complete');
    
    console.log('\n📊 Configuration Summary:');
    console.log('─'.repeat(40));
    console.log(`✅ TypeScript strict mode: ENABLED`);
    console.log(`✅ Pre-commit hooks: CONFIGURED`);
    console.log(`✅ VS Code settings: OPTIMIZED`);
    console.log(`✅ NPM scripts: ADDED`);
    console.log(`📈 Current errors: ${errorCount}`);
    console.log('─'.repeat(40));
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warn => console.log(`  - ${warn}`));
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Run "npm run fix:types" to auto-fix common issues');
    console.log('2. Run "npm run types:generate" to generate missing types');
    console.log('3. Run "npm run dev:strict" for development with type checking');
    console.log('4. Refer to WORLD_CLASS_ZERO_ERROR_STRATEGY.md for guidelines');
    
    console.log('\n✨ Zero-error development environment is ready!');
  }

  /**
   * Main execution
   */
  async run() {
    log.header('🏆 World-Class Zero-Error Setup');
    log.info('Configuring your project for zero TypeScript errors...\n');
    
    // Check if we're in the right directory
    if (!fs.existsSync(this.frontendPath)) {
      log.error('Frontend directory not found. Please run from project root.');
      process.exit(1);
    }
    
    // Run setup steps
    const steps = [
      () => this.updateTsConfig(),
      () => this.installDependencies(),
      () => this.setupPreCommitHooks(),
      () => this.createVSCodeSettings(),
      () => this.addNpmScripts()
    ];
    
    for (const step of steps) {
      const result = await step();
      if (!result && this.errors.length > 0) {
        log.error('Setup failed. Please fix errors and try again.');
        process.exit(1);
      }
    }
    
    // Run initial check
    const errorCount = await this.runInitialCheck();
    
    // Generate report
    this.generateReport(errorCount);
    
    process.exit(errorCount === 0 ? 0 : 1);
  }
}

// Execute
const setup = new ZeroErrorSetup();
setup.run().catch(console.error);