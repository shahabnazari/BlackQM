#!/usr/bin/env node

/**
 * Apple Design System Validation Script
 * Validates components against Apple HIG requirements
 */

const fs = require('fs');
const path = require('path');

const PASS_THRESHOLD = 0.95; // 95% compliance required

const validationRules = {
  typography: {
    weight: 1,
    check: (content) => {
      // Check for font classes or direct font references
      const hasAppleFont = content.includes('font-') || 
                           content.includes('text-') ||
                           content.includes('-apple-system') || 
                           content.includes('BlinkMacSystemFont');
      return hasAppleFont ? 1 : 0;
    },
    message: 'Uses typography system'
  },
  
  spacing: {
    weight: 1,
    check: (content) => {
      // Check for spacing classes or tokens
      const hasSpacingTokens = content.includes('p-') || 
                               content.includes('m-') ||
                               content.includes('px-') ||
                               content.includes('py-') ||
                               content.includes('mx-') ||
                               content.includes('my-') ||
                               content.includes('gap-') ||
                               content.includes('space-') || 
                               content.includes('--space-');
      return hasSpacingTokens ? 1 : 0;
    },
    message: 'Uses spacing system'
  },
  
  colors: {
    weight: 1,
    check: (content) => {
      // Check for semantic color usage
      const hasSemanticColors = !content.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/);
      const usesTokens = content.includes('--color-') || 
                        content.includes('text-') || 
                        content.includes('bg-');
      return (hasSemanticColors && usesTokens) ? 1 : 0;
    },
    message: 'Uses semantic color tokens (no hardcoded colors)'
  },
  
  darkMode: {
    weight: 1,
    check: (content) => {
      const supportsDark = content.includes('dark:') || 
                          content.includes('.dark');
      return supportsDark ? 1 : 0.5; // Partial credit if not all components support
    },
    message: 'Supports dark mode'
  },
  
  accessibility: {
    weight: 1,
    check: (content) => {
      const hasAria = content.includes('aria-') || 
                     content.includes('role=');
      const hasFocusStyles = content.includes('focus:') || 
                             content.includes('focus-visible');
      return (hasAria && hasFocusStyles) ? 1 : hasAria ? 0.5 : 0;
    },
    message: 'Has accessibility attributes and focus styles'
  },
  
  animation: {
    weight: 0.5,
    check: (content) => {
      const hasTransition = content.includes('transition') || 
                           content.includes('duration-');
      const respectsMotion = content.includes('motion-reduce') || 
                             content.includes('prefers-reduced-motion');
      return respectsMotion ? 1 : hasTransition ? 0.5 : 0;
    },
    message: 'Respects motion preferences'
  },
  
  responsive: {
    weight: 1,
    check: (content) => {
      const hasResponsive = content.includes('sm:') || 
                           content.includes('md:') || 
                           content.includes('lg:');
      return hasResponsive ? 1 : 0;
    },
    message: 'Has responsive design'
  }
};

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = {};
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [rule, config] of Object.entries(validationRules)) {
    const score = config.check(content);
    results[rule] = {
      score,
      weight: config.weight,
      passed: score >= 0.5,
      message: config.message
    };
    totalScore += score * config.weight;
    totalWeight += config.weight;
  }
  
  return {
    file: path.basename(filePath),
    compliance: totalScore / totalWeight,
    results
  };
}

function validateComponents() {
  const componentsDir = path.join(__dirname, '..', 'components', 'apple-ui');
  const components = [];
  
  // Find all component files
  function findComponents(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findComponents(fullPath);
      } else if (file.endsWith('.tsx') && !file.includes('.test.')) {
        components.push(fullPath);
      }
    }
  }
  
  findComponents(componentsDir);
  
  console.log('🍎 Apple Design System Validation\n');
  console.log('=' .repeat(50));
  
  let totalCompliance = 0;
  const results = [];
  
  for (const component of components) {
    const result = validateFile(component);
    results.push(result);
    totalCompliance += result.compliance;
    
    const icon = result.compliance >= PASS_THRESHOLD ? '✅' : '❌';
    console.log(`\n${icon} ${result.file}: ${(result.compliance * 100).toFixed(1)}% compliant`);
    
    for (const [rule, data] of Object.entries(result.results)) {
      const ruleIcon = data.passed ? '✓' : '✗';
      console.log(`  ${ruleIcon} ${data.message}`);
    }
  }
  
  const averageCompliance = totalCompliance / components.length;
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\n📊 Overall Compliance: ${(averageCompliance * 100).toFixed(1)}%`);
  console.log(`   Required: ${(PASS_THRESHOLD * 100).toFixed(0)}%`);
  
  if (averageCompliance >= PASS_THRESHOLD) {
    console.log('\n✅ Apple HIG validation PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Apple HIG validation FAILED!');
    console.log('   Please review and fix the issues above.');
    process.exit(1);
  }
}

// Run validation
validateComponents();