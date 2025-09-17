#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing remaining TypeScript errors...\n');

// Fix implicit any types in AI components
function fixAIComponents() {
  console.log('Fixing AI component event handlers...');
  
  const files = [
    './frontend/components/ai/BiasDetector.tsx',
    './frontend/components/ai/GridDesignAssistant.tsx',
    './frontend/components/ai/StatementGenerator.tsx'
  ];
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix event handler types
      content = content.replace(/onChange=\{(\(e\))/g, 'onChange={($1: React.ChangeEvent<HTMLTextAreaElement>)');
      content = content.replace(/onChange=\{(\(e\))/g, 'onChange={($1: React.ChangeEvent<HTMLInputElement>)');
      
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed ${path.basename(filePath)}`);
    }
  });
}

// Fix question type components
function fixQuestionTypeComponents() {
  console.log('Fixing question type components...');
  
  const filePath = './frontend/components/questionnaire/question-types/index.tsx';
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix onChange handlers
    content = content.replace(/onChange=\{\(e\) =>/g, 'onChange={(e: React.ChangeEvent<HTMLInputElement>) =>');
    content = content.replace(/onChange=\{\(e\) =>/g, 'onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>');
    content = content.replace(/onValueChange=\{\(v\) =>/g, 'onValueChange={(v: string) =>');
    content = content.replace(/onValueChange=\{\(\[v\]\) =>/g, 'onValueChange={([v]: number[]) =>');
    content = content.replace(/onCheckedChange=\{\(checked\) =>/g, 'onCheckedChange={(checked: boolean | "indeterminate") =>');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Fixed question type components');
  }
}

// Create missing type files
function createMissingTypes() {
  console.log('Creating missing type files...');
  
  // Create participant types
  const participantTypes = `export interface Participant {
  id: string;
  studyId: string;
  email?: string;
  name?: string;
  status: 'invited' | 'active' | 'completed' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ParticipantInvitation {
  id: string;
  participantId: string;
  email: string;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
  sentAt?: Date;
  acceptedAt?: Date;
  expiresAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}`;
  
  fs.writeFileSync('./frontend/lib/types/participant.types.ts', participantTypes);
  console.log('  ✅ Created participant.types.ts');
  
  // Create errors file
  const errorsFile = `export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}`;
  
  fs.writeFileSync('./frontend/lib/errors.ts', errorsFile);
  console.log('  ✅ Created errors.ts');
}

// Fix API response types
function fixAPIResponseTypes() {
  console.log('Fixing API response types...');
  
  const files = [
    './frontend/lib/api/services/ai.service.ts',
    './frontend/lib/services/participant.service.ts',
    './frontend/lib/api/services/questionnaire.service.ts'
  ];
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Fix API response unwrapping
      if (filePath.includes('ai.service')) {
        // Return data directly instead of wrapped response
        content = content.replace(/return this\.request<(.+?)>\(/g, 'return this.request<$1>(');
        content = content.replace(/return response;/g, 'return response.data || response;');
        modified = true;
      }
      
      if (filePath.includes('participant.service')) {
        // Fix array returns
        content = content.replace(/ApiResponse<(.+?)\[\]>/g, '$1[]');
        // Fix object returns  
        content = content.replace(/ApiResponse<\{(.+?)\}>/g, '{$1}');
        modified = true;
      }
      
      if (filePath.includes('questionnaire.service')) {
        // Fix questions access
        content = content.replace(/response\.questions/g, 'response.data?.questions || response.questions');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Fixed ${path.basename(filePath)}`);
      }
    }
  });
}

// Main execution
console.log('Starting fixes...\n');

createMissingTypes();
fixAIComponents();
fixQuestionTypeComponents();
fixAPIResponseTypes();

console.log('\n✨ Fixes applied! Checking remaining errors...\n');

// Check results
try {
  execSync('cd frontend && npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n🎉 NO TypeScript errors found!');
} catch (error) {
  console.log('\nSome errors may remain. Run npm run typecheck to see details.');
}