#!/usr/bin/env node

/**
 * VQMethod Repository Structure Validator
 * Enforces strict file organization standards
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Define validation rules
const RULES = {
  // Files that must NOT exist in root
  rootForbidden: [
    'tsconfig.json',
    'tailwind.config.js',
    'next.config.js',
    'vitest.config.ts',
    'playwright.config.ts',
    'nest-cli.json',
    'ormconfig.js',
    'webpack.config.js'
  ],
  
  // Directories that must NOT exist in root
  rootForbiddenDirs: [
    '.next',
    'dist',
    'prisma',
    'src',
    'app',
    'components',
    'pages',
    'api'
  ],
  
  // Files that MUST exist in frontend
  frontendRequired: [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.js',
    'postcss.config.js'
  ],
  
  // Files that MUST exist in backend
  backendRequired: [
    'package.json',
    'nest-cli.json',
    'tsconfig.json',
    'tsconfig.build.json'
  ],
  
  // Allowed files in root (everything else is forbidden)
  rootAllowed: [
    'package.json',
    'package-lock.json',
    '.gitignore',
    '.nvmrc',
    '.prettierrc',
    '.eslintrc.json',
    'README.md',
    'LICENSE',
    'CONTRIBUTING.md',
    'docker-compose.yml',
    'docker-compose.dev.yml',
    'port-config.json',
    '.env.ports',
    '.env.example'
  ],
  
  // Allowed directories in root
  rootAllowedDirs: [
    '.git',
    '.github',
    '.husky',
    '.vscode',
    'node_modules',
    'frontend',
    'backend',
    'scripts',
    'infrastructure',
    'Lead'
  ]
};

class RepositoryValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.rootPath = process.cwd();
  }

  log(message, type = 'info') {
    const prefix = {
      error: `${colors.red}❌`,
      warning: `${colors.yellow}⚠️`,
      success: `${colors.green}✅`,
      info: `${colors.blue}ℹ️`
    }[type] || '';
    
    console.log(`${prefix} ${message}${colors.reset}`);
  }

  checkFileExists(filePath) {
    return fs.existsSync(path.join(this.rootPath, filePath));
  }

  checkDirExists(dirPath) {
    try {
      const stats = fs.statSync(path.join(this.rootPath, dirPath));
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  validateRootDirectory() {
    this.log('Checking root directory for forbidden files...', 'info');
    
    // Check for forbidden files
    RULES.rootForbidden.forEach(file => {
      if (this.checkFileExists(file)) {
        this.violations.push(`File '${file}' found in root (should be in workspace directory)`);
        this.log(`Forbidden file in root: ${file}`, 'error');
      }
    });
    
    // Check for forbidden directories
    RULES.rootForbiddenDirs.forEach(dir => {
      if (this.checkDirExists(dir)) {
        this.violations.push(`Directory '${dir}' found in root (should be in workspace directory)`);
        this.log(`Forbidden directory in root: ${dir}`, 'error');
      }
    });
    
    // Check for unexpected files in root
    const rootFiles = fs.readdirSync(this.rootPath);
    rootFiles.forEach(file => {
      const filePath = path.join(this.rootPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        // Skip dot files and markdown files (except those in allowed list)
        if (file.startsWith('.') && file !== '.gitignore' && file !== '.nvmrc' && 
            file !== '.prettierrc' && file !== '.eslintrc.json' && file !== '.env.ports') {
          return;
        }
        
        if (file.endsWith('.md') && file !== 'README.md' && file !== 'CONTRIBUTING.md') {
          // Other markdown files are allowed in root
          return;
        }
        
        if (!RULES.rootAllowed.includes(file) && !file.endsWith('.md')) {
          this.warnings.push(`Unexpected file in root: ${file}`);
          this.log(`Unexpected file in root: ${file}`, 'warning');
        }
      } else if (stats.isDirectory()) {
        if (!RULES.rootAllowedDirs.includes(file)) {
          this.warnings.push(`Unexpected directory in root: ${file}`);
          this.log(`Unexpected directory in root: ${file}`, 'warning');
        }
      }
    });
  }

  validateFrontendStructure() {
    this.log('Checking frontend workspace structure...', 'info');
    
    if (!this.checkDirExists('frontend')) {
      this.violations.push('Frontend directory missing');
      this.log('Frontend directory missing', 'error');
      return;
    }
    
    // Check required files
    RULES.frontendRequired.forEach(file => {
      const filePath = `frontend/${file}`;
      if (!this.checkFileExists(filePath)) {
        this.violations.push(`Required file missing: ${filePath}`);
        this.log(`Required file missing: ${filePath}`, 'error');
      }
    });
    
    // Check package.json namespace
    const packageJsonPath = path.join(this.rootPath, 'frontend', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name !== '@vqmethod/frontend') {
        this.warnings.push('Frontend package.json should have name: @vqmethod/frontend');
        this.log('Frontend package.json should have name: @vqmethod/frontend', 'warning');
      }
    }
    
    // Check for route groups with parentheses
    const appPath = path.join(this.rootPath, 'frontend', 'app');
    if (fs.existsSync(appPath)) {
      // Check for incorrect route group naming
      if (this.checkDirExists('frontend/app/researcher')) {
        this.violations.push('Route group "researcher" MUST be named "(researcher)" with parentheses');
        this.log('Route group "researcher" missing parentheses - should be "(researcher)"', 'error');
      }
      if (this.checkDirExists('frontend/app/participant')) {
        this.violations.push('Route group "participant" MUST be named "(participant)" with parentheses');
        this.log('Route group "participant" missing parentheses - should be "(participant)"', 'error');
      }
      
      // Check that correct route groups exist
      if (!this.checkDirExists('frontend/app/(researcher)')) {
        this.violations.push('Required route group "(researcher)" is missing in frontend/app/');
        this.log('Required route group "(researcher)" not found', 'error');
      }
      if (!this.checkDirExists('frontend/app/(participant)')) {
        this.violations.push('Required route group "(participant)" is missing in frontend/app/');
        this.log('Required route group "(participant)" not found', 'error');
      }
    }
    
    // Check for public directory
    if (!this.checkDirExists('frontend/public')) {
      this.violations.push('Required directory "frontend/public" is missing');
      this.log('Public directory missing - required for static assets', 'error');
    } else {
      // Check for subdirectories
      if (!this.checkDirExists('frontend/public/images')) {
        this.warnings.push('Recommended directory "frontend/public/images" is missing');
        this.log('Public images directory missing', 'warning');
      }
      if (!this.checkDirExists('frontend/public/fonts')) {
        this.warnings.push('Recommended directory "frontend/public/fonts" is missing');
        this.log('Public fonts directory missing', 'warning');
      }
    }
  }

  validateBackendStructure() {
    this.log('Checking backend workspace structure...', 'info');
    
    if (!this.checkDirExists('backend')) {
      this.violations.push('Backend directory missing');
      this.log('Backend directory missing', 'error');
      return;
    }
    
    // Check required files
    RULES.backendRequired.forEach(file => {
      const filePath = `backend/${file}`;
      if (!this.checkFileExists(filePath)) {
        this.violations.push(`Required file missing: ${filePath}`);
        this.log(`Required file missing: ${filePath}`, 'error');
      }
    });
    
    // Check package.json namespace
    const packageJsonPath = path.join(this.rootPath, 'backend', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name !== '@vqmethod/backend') {
        this.warnings.push('Backend package.json should have name: @vqmethod/backend');
        this.log('Backend package.json should have name: @vqmethod/backend', 'warning');
      }
    }
  }

  validateWorkspaceConfig() {
    this.log('Checking workspace configuration...', 'info');
    
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.violations.push('Root package.json missing');
      this.log('Root package.json missing', 'error');
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check workspaces configuration
    if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
      this.warnings.push('Root package.json should define workspaces array');
      this.log('Root package.json should define workspaces array', 'warning');
    } else {
      if (!packageJson.workspaces.includes('frontend')) {
        this.warnings.push('Frontend not included in workspaces');
        this.log('Frontend not included in workspaces', 'warning');
      }
      if (!packageJson.workspaces.includes('backend')) {
        this.warnings.push('Backend not included in workspaces');
        this.log('Backend not included in workspaces', 'warning');
      }
    }
  }

  run() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 VQMethod Repository Structure Validator');
    console.log('='.repeat(60) + '\n');
    
    this.validateRootDirectory();
    this.validateFrontendStructure();
    this.validateBackendStructure();
    this.validateWorkspaceConfig();
    
    console.log('\n' + '='.repeat(60));
    
    if (this.violations.length === 0 && this.warnings.length === 0) {
      this.log('All repository structure checks passed!', 'success');
      console.log('='.repeat(60) + '\n');
      process.exit(0);
    }
    
    if (this.violations.length > 0) {
      console.log(`\n${colors.red}VIOLATIONS FOUND (${this.violations.length}):${colors.reset}`);
      this.violations.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}WARNINGS (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }
    
    if (this.violations.length > 0) {
      console.log(`\n${colors.red}❌ Validation FAILED with ${this.violations.length} violations${colors.reset}`);
      console.log('\n📚 Please read: Lead/REPOSITORY_STANDARDS.md');
      console.log('='.repeat(60) + '\n');
      process.exit(1);
    } else {
      console.log(`\n${colors.yellow}⚠️  Validation passed with ${this.warnings.length} warnings${colors.reset}`);
      console.log('='.repeat(60) + '\n');
      process.exit(0);
    }
  }
}

// Run validator
const validator = new RepositoryValidator();
validator.run();