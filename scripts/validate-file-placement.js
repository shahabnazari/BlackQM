#!/usr/bin/env node

/**
 * File Placement Validation Script
 * Prevents common Next.js file placement mistakes
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Validation results
const errors = [];
const warnings = [];
const successes = [];

/**
 * Check if a forbidden directory exists in root
 */
function checkForbiddenRootDirectories() {
  const forbidden = [
    'app', // Should be in frontend/
    'components', // Should be in frontend/
    'pages', // Should be in frontend/
    'styles', // Should be in frontend/
    'public', // Should be in frontend/
    'src', // Should be in frontend/ or backend/
  ];

  console.log('\n📁 Checking for misplaced directories in root...');

  forbidden.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      // Special case: app directory might be accidental
      if (dir === 'app') {
        const files = fs.readdirSync(fullPath);
        if (files.length > 0 && files[0] !== '.gitkeep') {
          errors.push(
            `❌ Found /${dir}/ in root! This should be in /frontend/${dir}/`
          );
          errors.push(`   Run: mv ${dir} frontend/`);
        } else {
          warnings.push(
            `⚠️  Empty /${dir}/ directory in root (can be removed)`
          );
        }
      } else {
        errors.push(
          `❌ Found /${dir}/ in root! This should be in /frontend/${dir}/`
        );
        errors.push(`   Run: mv ${dir} frontend/`);
      }
    }
  });
}

/**
 * Check if frontend has proper structure
 */
function checkFrontendStructure() {
  console.log('\n🎯 Checking frontend structure...');

  const frontendPath = path.join(process.cwd(), 'frontend');

  if (!fs.existsSync(frontendPath)) {
    errors.push('❌ Missing /frontend directory!');
    return;
  }

  // Required directories in frontend
  const required = ['app', 'components', 'styles'];
  required.forEach(dir => {
    const dirPath = path.join(frontendPath, dir);
    if (!fs.existsSync(dirPath)) {
      errors.push(`❌ Missing /frontend/${dir}/`);
    } else {
      successes.push(`✅ Found /frontend/${dir}/`);
    }
  });

  // Check for route groups
  const appPath = path.join(frontendPath, 'app');
  if (fs.existsSync(appPath)) {
    const routeGroups = ['(researcher)', '(participant)'];
    routeGroups.forEach(group => {
      const groupPath = path.join(appPath, group);
      if (!fs.existsSync(groupPath)) {
        warnings.push(`⚠️  Missing route group /frontend/app/${group}/`);
      } else {
        successes.push(`✅ Found route group /frontend/app/${group}/`);
      }
    });
  }

  // Check for required config files
  const requiredConfigs = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.js',
  ];

  requiredConfigs.forEach(config => {
    const configPath = path.join(frontendPath, config);
    if (!fs.existsSync(configPath)) {
      errors.push(`❌ Missing /frontend/${config}`);
    }
  });
}

/**
 * Check for files that shouldn't be in root
 */
function checkMisplacedFiles() {
  console.log('\n📄 Checking for misplaced files...');

  const shouldNotBeInRoot = [
    'tsconfig.json',
    'tailwind.config.js',
    'tailwind.config.ts',
    'next.config.js',
    'next.config.mjs',
    'postcss.config.js',
    'vitest.config.ts',
    'playwright.config.ts',
    'nest-cli.json',
    'jest.config.js',
  ];

  shouldNotBeInRoot.forEach(file => {
    const rootPath = path.join(process.cwd(), file);
    if (fs.existsSync(rootPath)) {
      if (
        file.includes('next') ||
        file.includes('tailwind') ||
        file.includes('postcss')
      ) {
        errors.push(`❌ Found ${file} in root! Should be in /frontend/`);
        errors.push(`   Run: mv ${file} frontend/`);
      } else if (file.includes('nest') || file.includes('jest')) {
        errors.push(`❌ Found ${file} in root! Should be in /backend/`);
        errors.push(`   Run: mv ${file} backend/`);
      }
    }
  });
}

/**
 * Check package.json for correct setup
 */
function checkPackageJson() {
  console.log('\n📦 Checking package.json configuration...');

  // Check root package.json
  const rootPackage = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(rootPackage)) {
    const pkg = JSON.parse(fs.readFileSync(rootPackage, 'utf8'));

    // Check if workspaces are configured
    if (!pkg.workspaces) {
      errors.push('❌ Root package.json missing workspaces configuration');
    } else if (
      !pkg.workspaces.includes('frontend') ||
      !pkg.workspaces.includes('backend')
    ) {
      errors.push('❌ Workspaces should include both "frontend" and "backend"');
    }

    // Warn if there are app dependencies in root
    if (
      pkg.dependencies &&
      Object.keys(pkg.dependencies).some(
        dep =>
          dep.includes('react') || dep.includes('next') || dep.includes('nest')
      )
    ) {
      warnings.push(
        '⚠️  Root package.json contains app dependencies (should be in workspaces)'
      );
    }
  }

  // Check frontend package.json
  const frontendPackage = path.join(process.cwd(), 'frontend', 'package.json');
  if (fs.existsSync(frontendPackage)) {
    const pkg = JSON.parse(fs.readFileSync(frontendPackage, 'utf8'));
    if (pkg.name !== '@vqmethod/frontend') {
      warnings.push(
        '⚠️  Frontend package.json should have name: "@vqmethod/frontend"'
      );
    }
  }
}

/**
 * Provide routing clarification
 */
function explainRouting() {
  console.log('\n🔗 Next.js Routing Reminder:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log("Route groups (parentheses) DON'T appear in URLs!");
  console.log('');
  console.log('File Path                                    → URL');
  console.log('─────────────────────────────────────────────────');
  console.log('frontend/app/(researcher)/dashboard/page.tsx → /dashboard');
  console.log('frontend/app/(researcher)/studies/page.tsx   → /studies');
  console.log('frontend/app/(participant)/join/page.tsx     → /join');
  console.log('frontend/app/auth/login/page.tsx            → /auth/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Run all validations
 */
function validate() {
  console.log(
    `${colors.blue}🔍 VQMethod File Placement Validator${colors.reset}`
  );
  console.log('=====================================');

  checkForbiddenRootDirectories();
  checkFrontendStructure();
  checkMisplacedFiles();
  checkPackageJson();

  console.log('\n📊 Validation Summary:');
  console.log('─────────────────────');

  if (errors.length > 0) {
    console.log(`\n${colors.red}Errors (${errors.length}):${colors.reset}`);
    errors.forEach(error => console.log(error));
  }

  if (warnings.length > 0) {
    console.log(
      `\n${colors.yellow}Warnings (${warnings.length}):${colors.reset}`
    );
    warnings.forEach(warning => console.log(warning));
  }

  if (successes.length > 0) {
    console.log(
      `\n${colors.green}Successes (${successes.length}):${colors.reset}`
    );
    successes.forEach(success => console.log(success));
  }

  explainRouting();

  // Exit code
  if (errors.length > 0) {
    console.log(
      `\n${colors.red}❌ Validation FAILED with ${errors.length} error(s)${colors.reset}`
    );
    console.log('Fix the errors above and run validation again.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(
      `\n${colors.yellow}⚠️  Validation passed with ${warnings.length} warning(s)${colors.reset}`
    );
    console.log('Consider fixing the warnings above.');
    process.exit(0);
  } else {
    console.log(
      `\n${colors.green}✅ Validation PASSED! File structure is correct.${colors.reset}`
    );
    process.exit(0);
  }
}

// Auto-fix option
if (process.argv.includes('--fix')) {
  console.log('🔧 Auto-fix mode enabled...');
  // Add auto-fix logic here
  console.log(
    'Auto-fix not yet implemented. Please fix manually using the commands shown above.'
  );
} else {
  validate();
}
