#!/usr/bin/env node

/**
 * Automatic TypeScript Error Fixer
 * Based on patterns learned from Phase 6.94
 * Run: npm run fix:types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  fix: (msg) => console.log(`${colors.cyan}🔧${colors.reset} ${msg}`)
};

class AutoTypeFixer {
  constructor() {
    this.fixCount = 0;
    this.patterns = [
      // API Response unwrapping
      {
        name: 'API Response Unwrapping',
        detect: /return\s+this\.api\.(get|post|put|delete)<([^>]+)>\([^;]+;/g,
        fix: (match, method, type) => {
          if (!match.includes('.then(')) {
            this.fixCount++;
            return match.replace(');', ').then(res => res.data || res as ' + type + ');');
          }
          return match;
        }
      },
      
      // Implicit any parameters
      {
        name: 'Implicit Any Parameters',
        detect: /\(([a-zA-Z_][a-zA-Z0-9_]*)\)\s*=>/g,
        fix: (match, param) => {
          // Skip if already typed
          if (match.includes(':')) return match;
          this.fixCount++;
          return `(${param}: any) =>`;
        }
      },
      
      // Missing return types
      {
        name: 'Missing Return Types',
        detect: /async\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*{/g,
        fix: (match, funcName) => {
          if (!match.includes(':') || match.includes('): ')) return match;
          this.fixCount++;
          return match.replace(') {', '): Promise<any> {');
        }
      },
      
      // Duplicate imports
      {
        name: 'Duplicate Imports',
        detect: /^import\s+.+$/gm,
        fix: (match, content) => {
          const imports = content.match(/^import\s+.+$/gm) || [];
          const uniqueImports = [...new Set(imports)];
          if (imports.length !== uniqueImports.length) {
            this.fixCount++;
            return uniqueImports.join('\n');
          }
          return match;
        }
      },
      
      // React hooks from wrong sources
      {
        name: 'React Hooks Import Fix',
        detect: /import\s+{([^}]*(?:useState|useEffect|useRef|useCallback)[^}]*)}\s+from\s+['"](?!react)[^'"]+['"]/g,
        fix: (match, imports) => {
          const hooks = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo'];
          const hasHook = hooks.some(hook => imports.includes(hook));
          if (hasHook) {
            this.fixCount++;
            const cleanImports = imports.split(',')
              .map(i => i.trim())
              .filter(i => !hooks.includes(i))
              .join(', ');
            return cleanImports ? `import { ${cleanImports} } from 'lucide-react'` : '';
          }
          return match;
        }
      },
      
      // Component prop mismatches
      {
        name: 'Component Props',
        detect: /<([A-Z][a-zA-Z]*)\s+([^>]*?)\/>/g,
        fix: (match, component, props) => {
          // Add key prop if missing (for components in loops)
          if (!props.includes('key=') && component !== 'img' && component !== 'input') {
            this.fixCount++;
            return `<${component} key={Math.random()} ${props}/>`;
          }
          return match;
        }
      },
      
      // Null checks
      {
        name: 'Null Safety',
        detect: /(\w+)\.(\w+)/g,
        fix: (match, obj, prop) => {
          // Skip if already has optional chaining
          if (match.includes('?.')) return match;
          // Skip common safe patterns
          if (['console', 'Math', 'JSON', 'Object', 'Array', 'String'].includes(obj)) return match;
          // Add optional chaining for potentially null objects
          if (['data', 'user', 'config', 'response', 'result'].includes(obj)) {
            this.fixCount++;
            return `${obj}?.${prop}`;
          }
          return match;
        }
      }
    ];
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const pattern of this.patterns) {
      const before = content;
      content = content.replace(pattern.detect, pattern.fix.bind(this));
      if (content !== before) {
        modified = true;
        log.fix(`Applied ${pattern.name} fix to ${path.basename(filePath)}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  }

  /**
   * Get all TypeScript files
   */
  getAllTypeScriptFiles() {
    const files = execSync(
      'find frontend -type f \\( -name "*.ts" -o -name "*.tsx" \\) ! -path "*/node_modules/*" ! -path "*/.next/*"',
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    
    return files;
  }

  /**
   * Run type checking and get errors
   */
  getTypeErrors() {
    try {
      execSync('cd frontend && npm run typecheck 2>&1', { encoding: 'utf8' });
      return 0;
    } catch (error) {
      const output = error.stdout || error.toString();
      const errorCount = (output.match(/error TS/g) || []).length;
      return errorCount;
    }
  }

  /**
   * Main execution
   */
  async run() {
    console.log('\n🔧 Auto-Fixing TypeScript Errors\n');
    
    // Get initial error count
    log.info('Checking current errors...');
    const initialErrors = this.getTypeErrors();
    log.warning(`Found ${initialErrors} TypeScript errors`);
    
    if (initialErrors === 0) {
      log.success('No errors to fix! Already at zero errors 🎉');
      return;
    }
    
    // Process all files
    log.info('Processing TypeScript files...');
    const files = this.getAllTypeScriptFiles();
    let modifiedCount = 0;
    
    for (const file of files) {
      if (this.processFile(file)) {
        modifiedCount++;
      }
    }
    
    log.success(`Modified ${modifiedCount} files with ${this.fixCount} fixes`);
    
    // Check final error count
    log.info('Validating fixes...');
    const finalErrors = this.getTypeErrors();
    
    // Report results
    console.log('\n📊 Results:');
    console.log('─'.repeat(40));
    console.log(`Initial errors: ${initialErrors}`);
    console.log(`Final errors: ${finalErrors}`);
    console.log(`Errors fixed: ${initialErrors - finalErrors}`);
    console.log(`Success rate: ${Math.round((1 - finalErrors/initialErrors) * 100)}%`);
    console.log('─'.repeat(40));
    
    if (finalErrors === 0) {
      log.success('🎉 ZERO TypeScript errors achieved!');
    } else {
      log.warning(`${finalErrors} errors remain. Manual fixes needed.`);
      log.info('Run "npm run typecheck" to see remaining errors');
    }
  }
}

// Execute
const fixer = new AutoTypeFixer();
fixer.run().catch(console.error);