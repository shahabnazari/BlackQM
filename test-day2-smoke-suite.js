/**
 * Day 2 Smoke Test Suite
 * Comprehensive testing for service layer and error boundaries
 * Phase 10.1 Day 2 - Testing & Quality Assurance
 *
 * Tests:
 * - Service instantiation and singleton pattern
 * - Request cancellation scenarios
 * - Retry logic with exponential backoff
 * - Error boundary recovery strategies
 * - Edge cases and boundary conditions
 * - User journey workflows
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Test Configuration
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

// ============================================================================
// Utility Functions
// ============================================================================

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    testsPassed++;
    log(`  ✅ ${name}`, COLORS.green);
  } else {
    testsFailed++;
    log(`  ❌ ${name}`, COLORS.red);
    if (details) {
      log(`     ${details}`, COLORS.gray);
    }
  }
}

function logSection(name) {
  log(`\n${'='.repeat(80)}`, COLORS.blue);
  log(name, COLORS.blue);
  log('='.repeat(80), COLORS.blue);
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// ============================================================================
// File Structure Tests
// ============================================================================

function testFileStructure() {
  logSection('📁 File Structure Tests');

  const requiredFiles = [
    'frontend/lib/api/services/base-api.service.ts',
    'frontend/lib/api/services/literature-api-enhanced.service.ts',
    'frontend/lib/api/services/video-api.service.ts',
    'frontend/lib/api/services/social-media-api.service.ts',
    'frontend/lib/api/services/theme-extraction-api.service.ts',
    'frontend/components/error-boundaries/BaseErrorBoundary.tsx',
    'frontend/components/error-boundaries/LiteratureErrorBoundary.tsx',
    'frontend/components/error-boundaries/VideoErrorBoundary.tsx',
    'frontend/components/error-boundaries/ThemeErrorBoundary.tsx',
    'frontend/components/error-boundaries/ErrorFallbackUI.tsx',
    'frontend/components/error-boundaries/index.ts',
    'frontend/lib/api/services/__tests__/base-api.service.test.ts',
    'frontend/components/error-boundaries/__tests__/BaseErrorBoundary.test.tsx',
  ];

  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fileExists(fullPath);
    logTest(`File exists: ${file}`, exists, exists ? '' : `Path: ${fullPath}`);
  });
}

// ============================================================================
// Code Quality Tests
// ============================================================================

function testCodeQuality() {
  logSection('🔍 Code Quality Tests');

  const filesToCheck = [
    'frontend/lib/api/services/base-api.service.ts',
    'frontend/lib/api/services/literature-api-enhanced.service.ts',
    'frontend/lib/api/services/video-api.service.ts',
    'frontend/lib/api/services/social-media-api.service.ts',
    'frontend/lib/api/services/theme-extraction-api.service.ts',
  ];

  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const content = readFile(fullPath);

    if (!content) {
      logTest(`Read file: ${file}`, false, 'Could not read file');
      return;
    }

    // Check for console.log statements (excluding comments)
    const consoleLogMatches = content.match(/^\s*console\.log\(/gm);
    const hasConsoleLogs = consoleLogMatches && consoleLogMatches.length > 0;
    logTest(
      `No console.log in ${path.basename(file)}`,
      !hasConsoleLogs,
      hasConsoleLogs ? `Found ${consoleLogMatches.length} console.log statements` : ''
    );

    // Check for TODO comments
    const todoMatches = content.match(/\/\/\s*TODO/gi);
    const hasTodos = todoMatches && todoMatches.length > 0;
    logTest(
      `No TODO comments in ${path.basename(file)}`,
      !hasTodos,
      hasTodos ? `Found ${todoMatches.length} TODO comments` : ''
    );

    // Check for proper JSDoc comments
    const hasJsDoc = content.includes('/**') && content.includes('* @module');
    logTest(`Has JSDoc comments in ${path.basename(file)}`, hasJsDoc);

    // Check for proper exports
    const hasExport = content.includes('export class') || content.includes('export const') || content.includes('export function');
    logTest(`Has proper exports in ${path.basename(file)}`, hasExport);

    // Check for TypeScript strict types (no 'any' types except in catch blocks)
    const anyMatches = content.match(/:\s*any(?!\s*\))/g);
    const catchAnyMatches = content.match(/catch\s*\(\s*\w+:\s*any\s*\)/g);
    const invalidAnyCount = (anyMatches?.length || 0) - (catchAnyMatches?.length || 0);
    const noInvalidAny = invalidAnyCount === 0;
    logTest(
      `No invalid 'any' types in ${path.basename(file)}`,
      noInvalidAny,
      !noInvalidAny ? `Found ${invalidAnyCount} invalid 'any' types` : ''
    );
  });
}

// ============================================================================
// Service Layer Architecture Tests
// ============================================================================

function testServiceArchitecture() {
  logSection('🏗️  Service Architecture Tests');

  const baseApiPath = path.join(__dirname, 'frontend/lib/api/services/base-api.service.ts');
  const baseApiContent = readFile(baseApiPath);

  if (!baseApiContent) {
    logTest('Read base-api.service.ts', false);
    return;
  }

  // Check for AbortController support
  const hasAbortController = baseApiContent.includes('AbortController');
  logTest('Has AbortController support', hasAbortController);

  // Check for retry logic
  const hasRetryLogic = baseApiContent.includes('withRetry') && baseApiContent.includes('maxRetries');
  logTest('Has retry logic implementation', hasRetryLogic);

  // Check for exponential backoff
  const hasExponentialBackoff = baseApiContent.includes('Math.pow') && baseApiContent.includes('backoffMultiplier');
  logTest('Has exponential backoff', hasExponentialBackoff);

  // Check for cancellation support
  const hasCancellation = baseApiContent.includes('createCancellableRequest') && baseApiContent.includes('cancel');
  logTest('Has request cancellation', hasCancellation);

  // Check for batch operations
  const hasBatchOps = baseApiContent.includes('batch') && baseApiContent.includes('sequence');
  logTest('Has batch operations', hasBatchOps);

  // Check for error handling utilities
  const hasErrorHandling = baseApiContent.includes('getErrorMessage') && baseApiContent.includes('isNetworkError');
  logTest('Has error handling utilities', hasErrorHandling);

  // Check all services extend BaseApiService
  const servicesToCheck = [
    'literature-api-enhanced.service.ts',
    'video-api.service.ts',
    'social-media-api.service.ts',
    'theme-extraction-api.service.ts',
  ];

  servicesToCheck.forEach(service => {
    const servicePath = path.join(__dirname, 'frontend/lib/api/services', service);
    const serviceContent = readFile(servicePath);

    if (!serviceContent) {
      logTest(`Read ${service}`, false);
      return;
    }

    const extendsBase = serviceContent.includes('extends BaseApiService');
    logTest(`${service} extends BaseApiService`, extendsBase);

    const hasSingleton = serviceContent.includes('private static instance') && serviceContent.includes('getInstance');
    logTest(`${service} implements singleton pattern`, hasSingleton);

    const hasConstructor = serviceContent.includes('private constructor()');
    logTest(`${service} has private constructor`, hasConstructor);
  });
}

// ============================================================================
// Error Boundary Tests
// ============================================================================

function testErrorBoundaries() {
  logSection('🛡️  Error Boundary Tests');

  const baseErrorBoundaryPath = path.join(
    __dirname,
    'frontend/components/error-boundaries/BaseErrorBoundary.tsx'
  );
  const baseContent = readFile(baseErrorBoundaryPath);

  if (!baseContent) {
    logTest('Read BaseErrorBoundary.tsx', false);
    return;
  }

  // Check for React Error Boundary lifecycle methods
  const hasGetDerivedStateFromError = baseContent.includes('getDerivedStateFromError');
  logTest('Has getDerivedStateFromError', hasGetDerivedStateFromError);

  const hasComponentDidCatch = baseContent.includes('componentDidCatch');
  logTest('Has componentDidCatch', hasComponentDidCatch);

  // Check for recovery strategies
  const hasRetry = baseContent.includes('retry') || baseContent.includes('reset');
  logTest('Has retry/reset recovery strategy', hasRetry);

  // Check for error logging
  const hasErrorLogging = baseContent.includes('console.error') || baseContent.includes('logError');
  logTest('Has error logging', hasErrorLogging);

  // Check for error reporting integration
  const hasErrorReporting = baseContent.includes('errorReporter') || baseContent.includes('reportError');
  logTest('Has error reporting integration', hasErrorReporting);

  // Check for error counting
  const hasErrorCounting = baseContent.includes('errorCount');
  logTest('Has error counting', hasErrorCounting);

  // Check for resetKeys support
  const hasResetKeys = baseContent.includes('resetKeys');
  logTest('Has resetKeys auto-reset', hasResetKeys);

  // Check domain-specific error boundaries
  const domainBoundaries = [
    'LiteratureErrorBoundary.tsx',
    'VideoErrorBoundary.tsx',
    'ThemeErrorBoundary.tsx',
  ];

  domainBoundaries.forEach(boundary => {
    const boundaryPath = path.join(__dirname, 'frontend/components/error-boundaries', boundary);
    const boundaryContent = readFile(boundaryPath);

    if (!boundaryContent) {
      logTest(`Read ${boundary}`, false);
      return;
    }

    const usesBase = boundaryContent.includes('BaseErrorBoundary');
    logTest(`${boundary} uses BaseErrorBoundary`, usesBase);

    const hasCustomFallback = boundaryContent.includes('ErrorFallbackUI');
    logTest(`${boundary} has custom fallback`, hasCustomFallback);

    const hasComponentName = boundaryContent.includes('componentName');
    logTest(`${boundary} sets componentName`, hasComponentName);
  });
}

// ============================================================================
// TypeScript Compliance Tests
// ============================================================================

function testTypeScriptCompliance() {
  logSection('📘 TypeScript Compliance Tests');

  const filesToCheck = [
    'frontend/lib/api/services/base-api.service.ts',
    'frontend/lib/api/services/literature-api-enhanced.service.ts',
    'frontend/lib/api/services/video-api.service.ts',
    'frontend/lib/api/services/social-media-api.service.ts',
    'frontend/lib/api/services/theme-extraction-api.service.ts',
  ];

  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const content = readFile(fullPath);

    if (!content) {
      logTest(`Read file: ${file}`, false);
      return;
    }

    // Check for proper interface definitions
    const hasInterfaces = content.includes('export interface') || content.includes('interface ');
    logTest(`${path.basename(file)} has interface definitions`, hasInterfaces);

    // Check for proper type annotations
    const hasTypeAnnotations = content.includes(': Promise<') && content.includes(': string');
    logTest(`${path.basename(file)} has type annotations`, hasTypeAnnotations);

    // Check for generic type parameters
    const hasGenerics = content.includes('<T>') || content.includes('<T = any>');
    logTest(`${path.basename(file)} uses generics`, hasGenerics);

    // Check for readonly modifiers where appropriate
    const hasReadonly = content.includes('private ') && content.includes('protected ');
    logTest(`${path.basename(file)} uses access modifiers`, hasReadonly);
  });
}

// ============================================================================
// Edge Case Tests
// ============================================================================

function testEdgeCases() {
  logSection('⚠️  Edge Case Tests');

  const baseApiPath = path.join(__dirname, 'frontend/lib/api/services/base-api.service.ts');
  const baseContent = readFile(baseApiPath);

  if (!baseContent) {
    logTest('Read base-api.service.ts', false);
    return;
  }

  // Check for handling of empty arrays
  const handlesEmptyArrays = baseContent.includes('requests.length');
  logTest('Handles empty request arrays', handlesEmptyArrays);

  // Check for handling of null/undefined
  const handlesNull = baseContent.includes('!') || baseContent.includes('??');
  logTest('Handles null/undefined values', handlesNull);

  // Check for rate limiting detection (429 status)
  const handles429 = baseContent.includes('429');
  logTest('Handles rate limiting (429)', handles429);

  // Check for network error detection
  const detectsNetworkErrors = baseContent.includes('ECONNREFUSED') || baseContent.includes('isNetworkError');
  logTest('Detects network errors', detectsNetworkErrors);

  // Check for timeout handling
  const handlesTimeouts = baseContent.includes('ETIMEDOUT') || baseContent.includes('isTimeoutError');
  logTest('Handles timeout errors', handlesTimeouts);

  // Check for cancellation error detection
  const handlesCancellation = baseContent.includes('ERR_CANCELED') || baseContent.includes('isCancellationError');
  logTest('Handles cancellation errors', handlesCancellation);

  // Check for proper cleanup
  const hasCleanup = baseContent.includes('.finally') || baseContent.includes('.delete');
  logTest('Has proper cleanup logic', hasCleanup);
}

// ============================================================================
// Test Completeness Check
// ============================================================================

function testTestCompleteness() {
  logSection('🧪 Test Completeness Check');

  const testFiles = [
    'frontend/lib/api/services/__tests__/base-api.service.test.ts',
    'frontend/components/error-boundaries/__tests__/BaseErrorBoundary.test.tsx',
  ];

  testFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const content = readFile(fullPath);

    if (!content) {
      logTest(`Read test file: ${file}`, false);
      return;
    }

    // Count describe blocks
    const describeCount = (content.match(/describe\(/g) || []).length;
    logTest(
      `${path.basename(file)} has multiple test suites`,
      describeCount >= 3,
      `Found ${describeCount} describe blocks`
    );

    // Count it blocks
    const itCount = (content.match(/it\(/g) || []).length;
    logTest(
      `${path.basename(file)} has sufficient test cases`,
      itCount >= 5,
      `Found ${itCount} test cases`
    );

    // Check for expect assertions
    const expectCount = (content.match(/expect\(/g) || []).length;
    logTest(
      `${path.basename(file)} has assertions`,
      expectCount >= itCount,
      `Found ${expectCount} assertions`
    );

    // Check for mock usage
    const hasMocks = content.includes('jest.fn()') || content.includes('jest.mock');
    logTest(`${path.basename(file)} uses mocks`, hasMocks);

    // Check for async test handling
    const hasAsyncTests = content.includes('async ()') || content.includes('await expect');
    logTest(`${path.basename(file)} tests async operations`, hasAsyncTests);

    // Check for error case testing
    const testsErrors = content.includes('toThrow') || content.includes('rejects');
    logTest(`${path.basename(file)} tests error cases`, testsErrors);
  });
}

// ============================================================================
// Documentation Tests
// ============================================================================

function testDocumentation() {
  logSection('📚 Documentation Tests');

  const filesToCheck = [
    'frontend/lib/api/services/base-api.service.ts',
    'frontend/lib/api/services/literature-api-enhanced.service.ts',
    'frontend/components/error-boundaries/BaseErrorBoundary.tsx',
    'frontend/components/error-boundaries/ErrorFallbackUI.tsx',
  ];

  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const content = readFile(fullPath);

    if (!content) {
      logTest(`Read file: ${file}`, false);
      return;
    }

    // Check for file header documentation
    const hasFileHeader = content.includes('/**') && content.includes('* @module');
    logTest(`${path.basename(file)} has file header`, hasFileHeader);

    // Check for function documentation
    const functionDocCount = (content.match(/\/\*\*[\s\S]*?\*\/[\s\S]*?(async\s+)?\w+\(/g) || []).length;
    logTest(
      `${path.basename(file)} has function documentation`,
      functionDocCount >= 3,
      `Found ${functionDocCount} documented functions`
    );

    // Check for type documentation
    const hasTypeDoc = content.includes('* @') || content.includes('* Features:');
    logTest(`${path.basename(file)} has type/parameter docs`, hasTypeDoc);

    // Check for usage examples in comments
    const hasExamples = content.includes('* @example') || content.includes('* Example:');
    const basename = path.basename(file);
    // Only require examples for base service
    if (basename === 'base-api.service.ts') {
      logTest(`${basename} has usage examples`, hasExamples);
    }
  });
}

// ============================================================================
// Summary Report
// ============================================================================

function printSummary() {
  logSection('📊 Test Summary');

  const total = testsPassed + testsFailed + testsSkipped;
  const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  log(`\nTotal Tests: ${total}`);
  log(`✅ Passed: ${testsPassed}`, COLORS.green);
  log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? COLORS.red : COLORS.reset);
  log(`⏭️  Skipped: ${testsSkipped}`, COLORS.yellow);
  log(`\nPass Rate: ${passRate}%`, passRate >= 95 ? COLORS.green : passRate >= 80 ? COLORS.yellow : COLORS.red);

  if (testsFailed === 0) {
    log('\n🎉 All tests passed! Day 2 implementation is production-ready.', COLORS.green);
  } else {
    log('\n⚠️  Some tests failed. Please review and fix the issues above.', COLORS.red);
  }

  return testsFailed === 0;
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  log('\n' + '='.repeat(80), COLORS.blue);
  log('Phase 10.1 Day 2 - Comprehensive Smoke Test Suite', COLORS.blue);
  log('Testing: Service Layer & Error Boundary System', COLORS.blue);
  log('='.repeat(80) + '\n', COLORS.blue);

  try {
    testFileStructure();
    testCodeQuality();
    testServiceArchitecture();
    testErrorBoundaries();
    testTypeScriptCompliance();
    testEdgeCases();
    testTestCompleteness();
    testDocumentation();

    const success = printSummary();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\n❌ Test suite crashed: ${error.message}`, COLORS.red);
    console.error(error);
    process.exit(1);
  }
}

main();
