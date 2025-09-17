#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting TypeScript Error Fix Process...\n');

// Fix the corrupted QuestionnaireBuilderEnhanced.tsx file
function fixQuestionnaireBuilder() {
  console.log('Fixing QuestionnaireBuilderEnhanced.tsx...');
  
  const filePath = './frontend/components/questionnaire/QuestionnaireBuilderEnhanced.tsx';
  
  // Read the original to check if it's minified
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file is corrupted (all on few lines)
  const lines = content.split('\n');
  if (lines.length < 50 && content.length > 5000) {
    console.log('  File appears to be corrupted/minified. Needs manual fix.');
    // For now, just fix the most obvious syntax errors
    content = content.replace(/}\s*{/g, '}\n{');
    content = content.replace(/;\s*const/g, ';\nconst');
    content = content.replace(/;\s*if/g, ';\nif');
    content = content.replace(/}\s*const/g, '}\nconst');
    fs.writeFileSync(filePath, content);
  }
}

// Fix VisualSkipLogicBuilder.tsx
function fixVisualSkipLogicBuilder() {
  console.log('Fixing VisualSkipLogicBuilder.tsx...');
  
  const filePath = './frontend/components/questionnaire/VisualSkipLogicBuilder.tsx';
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file is corrupted
  const lines = content.split('\n');
  if (lines.length < 50 && content.length > 3000) {
    console.log('  File appears to be corrupted/minified. Needs manual fix.');
    // Basic formatting fixes
    content = content.replace(/}\s*{/g, '}\n{');
    content = content.replace(/;\s*const/g, ';\nconst');
    content = content.replace(/;\s*if/g, ';\nif');
    content = content.replace(/}\s*const/g, '}\nconst');
    fs.writeFileSync(filePath, content);
  }
}

// Fix missing imports
function fixMissingImports() {
  console.log('Fixing missing imports...');
  
  const filesToFix = [
    './frontend/components/questionnaire/QuestionnaireBuilderEnhanced.tsx',
    './frontend/components/questionnaire/VisualSkipLogicBuilder.tsx'
  ];
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add missing import for questionTypesByCategory
      if (content.includes('questionTypesByCategory') && !content.includes("from '@/lib/data/question-types'")) {
        const importLine = "import { questionTypesByCategory } from '@/lib/data/question-types';\n";
        content = content.replace(/^'use client';?\n/, `'use client';\n\n${importLine}`);
      }
      
      // Add missing import for verticalListSortingStrategy
      if (content.includes('verticalListSortingStrategy') && !content.includes('verticalListSortingStrategy')) {
        content = content.replace(
          "import { SortableContext } from '@dnd-kit/sortable';",
          "import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';"
        );
      }
      
      fs.writeFileSync(filePath, content);
    }
  });
}

// Main execution
try {
  fixQuestionnaireBuilder();
  fixVisualSkipLogicBuilder();
  fixMissingImports();
  
  console.log('\n📊 Checking TypeScript errors...\n');
  
  // Run TypeScript check
  try {
    execSync('cd frontend && npm run typecheck', { stdio: 'inherit' });
    console.log('\n✅ All TypeScript errors fixed!');
  } catch (error) {
    console.log('\n⚠️  Some TypeScript errors remain. Manual intervention needed.');
    console.log('The corrupted files need to be properly reformatted.');
  }
} catch (error) {
  console.error('Error during fix process:', error);
}