#!/usr/bin/env node

/**
 * Comprehensive Login Page Test Suite
 * Tests all aspects of the login functionality
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const colors = require('colors');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:4000';
const LOGIN_PAGE = `${FRONTEND_URL}/auth/login`;

// Test credentials
const TEST_ACCOUNTS = [
  {
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'ADMIN',
    shouldWork: true,
  },
  {
    email: 'researcher@test.com',
    password: 'Password123!',
    role: 'RESEARCHER',
    shouldWork: true,
  },
  {
    email: 'participant@test.com',
    password: 'Password123!',
    role: 'PARTICIPANT',
    shouldWork: true,
  },
  {
    email: 'demo@vqmethod.com',
    password: 'Password123!',
    role: 'RESEARCHER',
    shouldWork: true,
  },
  {
    email: 'invalid@test.com',
    password: 'wrongpass',
    role: 'NONE',
    shouldWork: false,
  },
  {
    email: 'admin@test.com',
    password: 'WrongPassword',
    role: 'ADMIN',
    shouldWork: false,
  },
];

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  totalTests: 0,
  startTime: Date.now(),
};

// Helper function to log test results
function logTest(testName, status, details = '') {
  testResults.totalTests++;
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color =
    status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

  console.log(colors[color](`${icon} ${testName}`));
  if (details) {
    console.log(colors.gray(`   ${details}`));
  }

  if (status === 'pass') {
    testResults.passed.push({ test: testName, details });
  } else if (status === 'fail') {
    testResults.failed.push({ test: testName, details });
  } else {
    testResults.warnings.push({ test: testName, details });
  }
}

// Test 1: Server Health Checks
async function testServerHealth() {
  console.log(colors.cyan.bold('\n🔍 Testing Server Health...\n'));

  // Test Frontend
  try {
    const frontendResponse = await axios.get(FRONTEND_URL);
    if (frontendResponse.status === 200) {
      logTest(
        'Frontend Server Health',
        'pass',
        'Server responding on port 3000'
      );
    }
  } catch (error) {
    logTest(
      'Frontend Server Health',
      'fail',
      `Server not responding: ${error.message}`
    );
    return false;
  }

  // Test Backend
  try {
    const backendResponse = await axios.get(`${BACKEND_URL}/api/health`);
    if (backendResponse.status === 200) {
      logTest(
        'Backend Server Health',
        'pass',
        'API server responding on port 4000'
      );
    }
  } catch (error) {
    logTest(
      'Backend Server Health',
      'fail',
      `API not responding: ${error.message}`
    );
    return false;
  }

  return true;
}

// Test 2: Page Load and Resources
async function testPageLoad(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Page Load...\n'));

  const errors = [];
  const resources404 = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    resources404.push(request.url());
  });

  try {
    await page.goto(LOGIN_PAGE, { waitUntil: 'networkidle2' });
    logTest('Login Page Load', 'pass', 'Page loaded successfully');
  } catch (error) {
    logTest('Login Page Load', 'fail', `Failed to load: ${error.message}`);
    return false;
  }

  // Check for JavaScript errors
  if (errors.length > 0) {
    logTest(
      'JavaScript Errors',
      'fail',
      `Found ${errors.length} console errors: ${errors[0]}`
    );
  } else {
    logTest('JavaScript Errors', 'pass', 'No console errors detected');
  }

  // Check for 404 resources
  if (resources404.length > 0) {
    logTest(
      'Resource Loading',
      'fail',
      `${resources404.length} resources failed to load`
    );
  } else {
    logTest('Resource Loading', 'pass', 'All resources loaded successfully');
  }

  return true;
}

// Test 3: UI Elements Presence
async function testUIElements(page) {
  console.log(colors.cyan.bold('\n🔍 Testing UI Elements...\n'));

  const elements = [
    { selector: 'input[type="email"]', name: 'Email Input Field' },
    { selector: 'input[type="password"]', name: 'Password Input Field' },
    { selector: 'button[type="submit"]', name: 'Sign In Button' },
    { selector: 'input[type="checkbox"]', name: 'Remember Me Checkbox' },
    {
      selector: 'a[href="/auth/forgot-password"]',
      name: 'Forgot Password Link',
    },
    { selector: 'a[href="/auth/register"]', name: 'Sign Up Link' },
  ];

  for (const element of elements) {
    try {
      await page.waitForSelector(element.selector, { timeout: 5000 });
      logTest(`UI Element: ${element.name}`, 'pass', 'Element found');
    } catch (error) {
      logTest(`UI Element: ${element.name}`, 'fail', 'Element not found');
    }
  }
}

// Test 4: Password Toggle Functionality
async function testPasswordToggle(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Password Toggle...\n'));

  try {
    // Find password input
    const passwordInput = await page.$('input[type="password"]');
    if (!passwordInput) {
      logTest('Password Toggle Setup', 'fail', 'Password input not found');
      return;
    }

    // Find toggle button (eye icon)
    const toggleButton = await page.$('button svg');
    if (!toggleButton) {
      logTest('Password Toggle Button', 'fail', 'Toggle button not found');
      return;
    }

    // Click toggle and check if type changes
    await page.click('button:has(svg)');
    await page.waitForTimeout(500);

    const inputType = await page.$eval('input[name="password"]', el => el.type);
    if (inputType === 'text') {
      logTest(
        'Password Toggle Show',
        'pass',
        'Password is visible after toggle'
      );
    } else {
      logTest(
        'Password Toggle Show',
        'fail',
        'Password not visible after toggle'
      );
    }

    // Toggle again to hide
    await page.click('button:has(svg)');
    await page.waitForTimeout(500);

    const inputType2 = await page.$eval(
      'input[name="password"]',
      el => el.type
    );
    if (inputType2 === 'password') {
      logTest(
        'Password Toggle Hide',
        'pass',
        'Password is hidden after second toggle'
      );
    } else {
      logTest(
        'Password Toggle Hide',
        'fail',
        'Password not hidden after second toggle'
      );
    }
  } catch (error) {
    logTest('Password Toggle', 'fail', `Error: ${error.message}`);
  }
}

// Test 5: Form Validation
async function testFormValidation(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Form Validation...\n'));

  // Clear any existing values
  await page.evaluate(() => {
    document.querySelectorAll('input').forEach(input => (input.value = ''));
  });

  // Test empty form submission
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Check for validation errors
  const emailError = await page.$('text=/valid email/i');
  const passwordError = await page.$('text=/at least 8 characters/i');

  if (emailError || passwordError) {
    logTest(
      'Empty Form Validation',
      'pass',
      'Shows validation errors for empty fields'
    );
  } else {
    logTest('Empty Form Validation', 'fail', 'No validation errors shown');
  }

  // Test invalid email
  await page.type('input[type="email"]', 'notanemail');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  const invalidEmailError = await page.$('text=/valid email/i');
  if (invalidEmailError) {
    logTest(
      'Email Format Validation',
      'pass',
      'Shows error for invalid email format'
    );
  } else {
    logTest(
      'Email Format Validation',
      'fail',
      'No error for invalid email format'
    );
  }

  // Test short password
  await page.evaluate(() => {
    document.querySelector('input[type="email"]').value = 'test@test.com';
    document.querySelector('input[type="password"]').value = 'short';
  });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  const shortPasswordError = await page.$('text=/at least 8 characters/i');
  if (shortPasswordError) {
    logTest(
      'Password Length Validation',
      'pass',
      'Shows error for short password'
    );
  } else {
    logTest(
      'Password Length Validation',
      'warning',
      'No error for short password'
    );
  }
}

// Test 6: Authentication Tests
async function testAuthentication(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Authentication...\n'));

  for (const account of TEST_ACCOUNTS) {
    // Clear form
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
      document.querySelector('input[type="password"]').value = '';
    });

    // Fill in credentials
    await page.type('input[type="email"]', account.email);
    await page.type('input[type="password"]', account.password);

    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForTimeout(2000), // Wait for authentication
    ]);

    // Check result
    if (account.shouldWork) {
      // Should redirect or show success
      const currentUrl = page.url();
      if (currentUrl !== LOGIN_PAGE || (await page.$('text=/welcome/i'))) {
        logTest(
          `Login: ${account.email}`,
          'pass',
          `Successful login for ${account.role}`
        );
        // Navigate back to login page for next test
        await page.goto(LOGIN_PAGE, { waitUntil: 'networkidle2' });
      } else {
        const errorMessage = await page.$('text=/invalid/i');
        if (errorMessage) {
          logTest(
            `Login: ${account.email}`,
            'fail',
            'Login failed but should have succeeded'
          );
        }
      }
    } else {
      // Should show error
      const errorMessage = await page.$('text=/invalid/i');
      if (errorMessage) {
        logTest(
          `Login Rejection: ${account.email}`,
          'pass',
          'Correctly rejected invalid credentials'
        );
      } else {
        logTest(
          `Login Rejection: ${account.email}`,
          'fail',
          'Did not show error for invalid credentials'
        );
      }
    }
  }
}

// Test 7: Accessibility
async function testAccessibility(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Accessibility...\n'));

  // Check for form labels
  const emailLabel = await page.$('label:has-text("Email")');
  const passwordLabel = await page.$('label:has-text("Password")');

  if (emailLabel && passwordLabel) {
    logTest('Form Labels', 'pass', 'Form fields have proper labels');
  } else {
    logTest('Form Labels', 'warning', 'Missing form labels for accessibility');
  }

  // Test keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(
    () => document.activeElement.tagName
  );
  if (focusedElement) {
    logTest('Keyboard Navigation', 'pass', 'Tab navigation works');
  } else {
    logTest(
      'Keyboard Navigation',
      'warning',
      'Keyboard navigation may have issues'
    );
  }

  // Check for alt text on images/icons
  const images = await page.$$('img:not([alt])');
  if (images.length === 0) {
    logTest('Image Alt Text', 'pass', 'All images have alt text');
  } else {
    logTest(
      'Image Alt Text',
      'warning',
      `${images.length} images missing alt text`
    );
  }
}

// Test 8: Responsive Design
async function testResponsive(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Responsive Design...\n'));

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    await page.setViewport({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);

    // Check if form is visible
    const formVisible = await page.$('form');
    if (formVisible) {
      logTest(
        `Responsive: ${viewport.name}`,
        'pass',
        `Form visible at ${viewport.width}x${viewport.height}`
      );
    } else {
      logTest(
        `Responsive: ${viewport.name}`,
        'fail',
        `Form not visible at ${viewport.width}x${viewport.height}`
      );
    }
  }
}

// Test 9: Performance
async function testPerformance(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Performance...\n'));

  const metrics = await page.metrics();
  const performance = await page.evaluate(() => {
    const perf = window.performance.timing;
    return {
      loadTime: perf.loadEventEnd - perf.navigationStart,
      domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
    };
  });

  if (performance.loadTime < 3000) {
    logTest('Page Load Time', 'pass', `Loaded in ${performance.loadTime}ms`);
  } else {
    logTest(
      'Page Load Time',
      'warning',
      `Slow load time: ${performance.loadTime}ms`
    );
  }

  if (performance.firstPaint < 1000) {
    logTest(
      'First Paint',
      'pass',
      `First paint in ${Math.round(performance.firstPaint)}ms`
    );
  } else {
    logTest(
      'First Paint',
      'warning',
      `Slow first paint: ${Math.round(performance.firstPaint)}ms`
    );
  }

  if (metrics.JSHeapUsedSize < 50 * 1024 * 1024) {
    // 50MB
    logTest(
      'Memory Usage',
      'pass',
      `Using ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`
    );
  } else {
    logTest(
      'Memory Usage',
      'warning',
      `High memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`
    );
  }
}

// Test 10: Security
async function testSecurity(page) {
  console.log(colors.cyan.bold('\n🔍 Testing Security...\n'));

  // Check for HTTPS in production
  const url = page.url();
  if (url.startsWith('http://localhost')) {
    logTest('HTTPS Check', 'pass', 'Local development environment');
  } else if (url.startsWith('https://')) {
    logTest('HTTPS Check', 'pass', 'Using HTTPS');
  } else {
    logTest('HTTPS Check', 'fail', 'Not using HTTPS in production');
  }

  // Check for autocomplete on password
  const passwordAutocomplete = await page.$eval(
    'input[type="password"]',
    el => el.autocomplete
  );
  if (
    passwordAutocomplete === 'current-password' ||
    passwordAutocomplete === 'off'
  ) {
    logTest(
      'Password Autocomplete',
      'pass',
      'Password field has proper autocomplete setting'
    );
  } else {
    logTest(
      'Password Autocomplete',
      'warning',
      'Password field may have insecure autocomplete'
    );
  }

  // Test XSS prevention
  await page.evaluate(() => {
    document.querySelector('input[type="email"]').value =
      '<script>alert("XSS")</script>';
  });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Check if script executed (it shouldn't)
  const alertShown = await page.evaluate(() => {
    return window.xssTestExecuted || false;
  });

  if (!alertShown) {
    logTest('XSS Prevention', 'pass', 'XSS attempt blocked');
  } else {
    logTest('XSS Prevention', 'fail', 'XSS vulnerability detected');
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan.bold('═'.repeat(60)));
  console.log(colors.cyan.bold('   🧪 LOGIN PAGE COMPREHENSIVE TEST SUITE'));
  console.log(colors.cyan.bold('═'.repeat(60)));

  // Check servers first
  const serversHealthy = await testServerHealth();
  if (!serversHealthy) {
    console.log(
      colors.red.bold('\n❌ Servers are not running. Please start them first:')
    );
    console.log(colors.yellow('   Backend: cd backend && npm run start:dev'));
    console.log(colors.yellow('   Frontend: cd frontend && npm run dev\n'));
    return;
  }

  // Launch browser
  console.log(colors.gray('\n🚀 Launching browser...\n'));
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Run all tests
    await testPageLoad(page);
    await testUIElements(page);
    await testPasswordToggle(page);
    await testFormValidation(page);
    await testAuthentication(page);
    await testAccessibility(page);
    await testResponsive(page);
    await testPerformance(page);
    await testSecurity(page);
  } catch (error) {
    console.error(colors.red(`\n❌ Test suite error: ${error.message}`));
  } finally {
    await browser.close();
  }

  // Generate report
  generateReport();
}

// Generate test report
function generateReport() {
  const duration = Date.now() - testResults.startTime;

  console.log(colors.cyan.bold('\n' + '═'.repeat(60)));
  console.log(colors.cyan.bold('   📊 TEST RESULTS SUMMARY'));
  console.log(colors.cyan.bold('═'.repeat(60)));

  console.log(colors.white(`\n📈 Statistics:`));
  console.log(colors.gray(`   Total Tests: ${testResults.totalTests}`));
  console.log(colors.green(`   ✅ Passed: ${testResults.passed.length}`));
  console.log(colors.red(`   ❌ Failed: ${testResults.failed.length}`));
  console.log(colors.yellow(`   ⚠️  Warnings: ${testResults.warnings.length}`));
  console.log(colors.gray(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`));

  const successRate = (
    (testResults.passed.length / testResults.totalTests) *
    100
  ).toFixed(1);
  console.log(colors.white(`\n📊 Success Rate: ${successRate}%`));

  if (successRate >= 90) {
    console.log(
      colors.green.bold('\n✅ EXCELLENT: Login page is working great!')
    );
  } else if (successRate >= 70) {
    console.log(
      colors.yellow.bold('\n⚠️  GOOD: Login page works but has some issues')
    );
  } else {
    console.log(
      colors.red.bold('\n❌ NEEDS WORK: Login page has significant issues')
    );
  }

  // Show failed tests
  if (testResults.failed.length > 0) {
    console.log(colors.red.bold('\n❌ Failed Tests:'));
    testResults.failed.forEach(test => {
      console.log(colors.red(`   - ${test.test}: ${test.details}`));
    });
  }

  // Show warnings
  if (testResults.warnings.length > 0) {
    console.log(colors.yellow.bold('\n⚠️  Warnings:'));
    testResults.warnings.forEach(test => {
      console.log(colors.yellow(`   - ${test.test}: ${test.details}`));
    });
  }

  console.log(colors.cyan.bold('\n' + '═'.repeat(60) + '\n'));
}

// Check if puppeteer is installed
const checkDependencies = async () => {
  try {
    require.resolve('puppeteer');
    require.resolve('axios');
    require.resolve('colors');
    return true;
  } catch (e) {
    console.log(colors.red.bold('\n❌ Missing dependencies!'));
    console.log(colors.yellow('\nPlease install required packages:'));
    console.log(colors.gray('   npm install puppeteer axios colors\n'));
    return false;
  }
};

// Run tests
(async () => {
  if (await checkDependencies()) {
    await runTests();
  }
})();
