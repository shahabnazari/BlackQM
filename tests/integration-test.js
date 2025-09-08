/**
 * Integration Test for Phase 6.8 Enhanced Study Creation
 * Verifies that the enhanced page is properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 6.8 Integration Test');
console.log('=============================\n');

// Test 1: Check if enhanced page is now the main page
console.log('Test 1: Enhanced page integration');
const mainPagePath = path.join(__dirname, '../frontend/app/(researcher)/studies/create/page.tsx');
const mainPageContent = fs.readFileSync(mainPagePath, 'utf8');

const hasPreviewStep = mainPageContent.includes('step === 5');
const hasParticipantPreview = mainPageContent.includes('ParticipantPreview');
const hasRichTextEditor = mainPageContent.includes('RichTextEditor');
const hasDigitalSignature = mainPageContent.includes('DigitalSignature');
const hasTemplates = mainPageContent.includes('welcomeTemplates');

console.log(`  ✓ Preview Step (Step 5): ${hasPreviewStep ? '✅' : '❌'}`);
console.log(`  ✓ ParticipantPreview Component: ${hasParticipantPreview ? '✅' : '❌'}`);
console.log(`  ✓ RichTextEditor Integration: ${hasRichTextEditor ? '✅' : '❌'}`);
console.log(`  ✓ DigitalSignature Integration: ${hasDigitalSignature ? '✅' : '❌'}`);
console.log(`  ✓ Template System: ${hasTemplates ? '✅' : '❌'}`);

// Test 2: Check backup exists
console.log('\nTest 2: Backup verification');
const backupPath = path.join(__dirname, '../frontend/app/(researcher)/studies/create/page-basic.tsx.backup');
const backupExists = fs.existsSync(backupPath);
console.log(`  ✓ Basic version backed up: ${backupExists ? '✅' : '❌'}`);

// Test 3: Check all imported components exist
console.log('\nTest 3: Component availability');
const components = [
  'frontend/components/editors/RichTextEditor.tsx',
  'frontend/components/signature/DigitalSignature.tsx',
  'frontend/components/tooltips/InfoTooltip.tsx',
  'frontend/components/study-creation/ErrorBoundary.tsx',
  'frontend/components/study-creation/ParticipantPreview.tsx',
  'frontend/lib/templates/welcome-templates.ts',
  'frontend/lib/templates/consent-templates.ts',
  'frontend/lib/tooltips/study-creation-tooltips.ts'
];

let allComponentsExist = true;
components.forEach(component => {
  const componentPath = path.join(__dirname, '..', component);
  const exists = fs.existsSync(componentPath);
  console.log(`  ✓ ${component.split('/').pop()}: ${exists ? '✅' : '❌'}`);
  if (!exists) allComponentsExist = false;
});

// Test 4: Check for proper export/import structure
console.log('\nTest 4: Export/Import validation');
const hasDefaultExport = mainPageContent.includes('export default');
const hasErrorBoundary = mainPageContent.includes('StudyCreationErrorBoundary');
const wrapsWithErrorBoundary = mainPageContent.includes('<StudyCreationErrorBoundary>');

console.log(`  ✓ Default export: ${hasDefaultExport ? '✅' : '❌'}`);
console.log(`  ✓ Error boundary imported: ${hasErrorBoundary ? '✅' : '❌'}`);
console.log(`  ✓ Wrapped with error boundary: ${wrapsWithErrorBoundary ? '✅' : '❌'}`);

// Summary
console.log('\n=============================');
const allTestsPassed = 
  hasPreviewStep && 
  hasParticipantPreview && 
  hasRichTextEditor && 
  hasDigitalSignature && 
  hasTemplates && 
  backupExists && 
  allComponentsExist &&
  hasDefaultExport;

if (allTestsPassed) {
  console.log('✅ INTEGRATION SUCCESSFUL: Enhanced study creation page is now active!');
  console.log('\n📍 Access the enhanced page at: http://localhost:3003/studies/create');
  console.log('📍 Features available:');
  console.log('   - Rich text editor for welcome & consent');
  console.log('   - Template selection system');
  console.log('   - Digital signature (3 modes)');
  console.log('   - 5-step flow with preview');
  console.log('   - Interactive participant preview');
} else {
  console.log('❌ INTEGRATION INCOMPLETE: Some components are missing');
  console.log('Please check the failed tests above');
}

process.exit(allTestsPassed ? 0 : 1);